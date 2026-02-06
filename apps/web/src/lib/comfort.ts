import mongoose from 'mongoose';
import dbConnect from './mongodb';

export { dbConnect };

// --- Interfaces (Keep existing for type compatibility where possible) ---

export interface Comment {
    id: string;
    deviceId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    reportCount: number;
    reportedBy: string[];
    hidden: boolean;
}

export interface Post {
    id: string;
    deviceId: string;
    content: string;
    emoji: string;
    createdAt: string;
    updatedAt: string;
    likes: string[];
    comments: Comment[];
    reportCount: number;
    reportedBy: string[];
    hidden: boolean;
    cheerCount: number;
}

// 프로필 이모지 리스트 (10개)
export const PROFILE_EMOJIS = [
    '🐱', '🐾', '🌸', '✨', '💫', '🌙', '🍀', '🦋', '🌈', '❤️'
];

export interface BlockedDevice {
    deviceId: string;
    blockedDeviceId: string;
    createdAt: string;
}

export interface Subscription {
    deviceId: string;
    status: 'free' | 'premium';
    startedAt: Date;
    expiredAt: Date | null;
}

// --- Mongoose Schemas & Models ---

const CommentSchema = new mongoose.Schema({
    id: { type: String, required: true },
    deviceId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true }, // Keeping as String to match ISO format usage
    updatedAt: { type: String, required: true },
    reportCount: { type: Number, default: 0 },
    reportedBy: { type: [String], default: [] },
    hidden: { type: Boolean, default: false },
});

const PostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    deviceId: { type: String, required: true },
    content: { type: String, required: true },
    emoji: { type: String, default: '🐱' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    likes: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] },
    reportCount: { type: Number, default: 0 },
    reportedBy: { type: [String], default: [] },
    hidden: { type: Boolean, default: false },
    cheerCount: { type: Number, default: 0 },
});

PostSchema.index({ 'comments.deviceId': 1, 'comments.createdAt': -1 });

const BlockedDeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    blockedDeviceId: { type: String, required: true },
    createdAt: { type: String, required: true },
});

const SubscriptionSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    status: { type: String, required: true, enum: ['free', 'premium'], default: 'free' },
    startedAt: { type: Date, required: true, default: Date.now },
    expiredAt: { type: Date, default: null },
});

// Helper to get models (prevents OverwriteModelError in dev)
export const getModels = () => {
    const PostModel = mongoose.models.Post || mongoose.model('Post', PostSchema);
    const BlockedDeviceModel = mongoose.models.BlockedDevice || mongoose.model('BlockedDevice', BlockedDeviceSchema);
    const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
    return { PostModel, BlockedDeviceModel, SubscriptionModel };
};

// --- Helper Functions ---

export async function cleanupOldPosts(): Promise<void> {
    await dbConnect();
    const { PostModel } = getModels();

    // 한국 시간(UTC+9) 기준 오늘 자정을 UTC로 계산
    const now = new Date();
    const koreaOffset = 9 * 60 * 60 * 1000; // 9시간 (밀리초)

    // 현재 시간을 한국 시간으로 변환
    const koreaTime = new Date(now.getTime() + koreaOffset);

    // 한국 시간 기준 오늘 자정 (UTC 기준으로 설정)
    koreaTime.setUTCHours(0, 0, 0, 0);

    // 다시 UTC로 변환 (한국 자정 = UTC 전날 15:00)
    const koreaMidnightUtc = new Date(koreaTime.getTime() - koreaOffset);

    const koreaMidnightIso = koreaMidnightUtc.toISOString();

    // Delete posts created before today's midnight (Korea time)
    await PostModel.deleteMany({ createdAt: { $lt: koreaMidnightIso } });
}

export async function canPost(deviceId: string): Promise<{ canPost: boolean; waitMinutes?: number }> {
    await dbConnect();
    const { PostModel } = getModels();

    // Find the latest post by this device
    const lastPost = await PostModel.findOne({ deviceId }).sort({ createdAt: -1 }).lean();

    if (!lastPost) {
        return { canPost: true };
    }

    const lastPostDate = new Date(lastPost.createdAt as string);
    const now = new Date();
    const diffMs = now.getTime() - lastPostDate.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (diffMs >= oneHourMs) {
        return { canPost: true };
    }

    const waitMinutes = Math.ceil((oneHourMs - diffMs) / 60000);
    return { canPost: false, waitMinutes };
}

// Fetch posts tailored for a specific user (filtering blocks, hidden, etc)
export async function getFilteredPosts(deviceId: string, sort: 'latest' | 'cheer' | 'comment' = 'latest'): Promise<Post[]> {
    await dbConnect();
    const { PostModel, BlockedDeviceModel } = getModels();

    // 1. Get list of users blocked by this device
    const blockedEntries = await BlockedDeviceModel.find({ deviceId }).lean();
    const blockedIds = blockedEntries.map((b: any) => b.blockedDeviceId);

    // 2. Fetch posts using Aggregate to handle dynamic cheerCount/commentCount
    const pipeline: any[] = [
        { $match: { hidden: false, deviceId: { $nin: blockedIds } } },
        {
            $addFields: {
                computedCheerCount: { $size: { $ifNull: ["$likes", []] } },
                computedCommentCount: { $size: { $ifNull: ["$comments", []] } }
            }
        }
    ];

    if (sort === 'cheer') {
        pipeline.push({ $sort: { computedCheerCount: -1, createdAt: -1 } });
    } else if (sort === 'comment') {
        pipeline.push({ $sort: { computedCommentCount: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    const posts = await PostModel.aggregate(pipeline);

    // 3. Transform and filter comments specifically
    // The generic lean() returns _id, we need to ensure it matches Post interface if acceptable.
    // We modify comments in memory to filter out blocked users there too.

    return posts.map((p: any) => ({
        ...p,
        _id: undefined, // remove mongoose id if not needed, or keep it
        comments: (p.comments || []).filter((c: any) => !blockedIds.includes(c.deviceId) && !c.hidden)
    })) as Post[];
}

export async function createPost(postData: Post): Promise<void> {
    await dbConnect();
    const { PostModel } = getModels();
    await PostModel.create(postData);
}

// Additional helpers for other routes
export async function getPostById(id: string) {
    await dbConnect();
    const { PostModel } = getModels();
    return await PostModel.findOne({ id });
}

export async function savePost(post: any) {
    if (post.save) {
        await post.save();
    } else {
        // if plain object passed back (from lean), updating might require explicit update command
        // For simplicity in this migration, we assume usage of Mongoose Documents when needing .save()
        // OR we use updateOne
        const { PostModel } = getModels();
        await PostModel.findOneAndUpdate({ id: post.id }, post, { upsert: true });
    }
}

// Utility
export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// 닉네임 더미 리스트 (50개)
const NICKNAME_WORDS = [
    '미르', '노을', '달토리', '소나기', '햇살비', '구름결', '별무리', '바람꽃', '조약돌', '물빛',
    '솜사탕', '풀내음', '새벽별', '해님', '달그림자', '별하늘', '꽃샘', '바다빛', '달맞이', '노루발',
    '햇살꽃잎', '봄바람결', '눈꽃송이', '달빛잔향', '포근함', '솜구름', '봄향기', '물안개꽃', '달빛노래', '푸른숲',
    '노을빛', '달빛숲', '별빛샘', '햇살나래', '달빛송이', '푸른별', '봄눈', '별빛잔향', '햇살바람', '포근달빛',
    '달빛바다', '별빛숲', '햇살빛나래', '눈빛', '바람결', '해무리', '달빛꽃', '솔향기', '별빛노래', '바람결빛',
];

// 닉네임 생성 (deviceId 기반 고정)
export function generateNickname(deviceId: string): string {
    // deviceId를 숫자로 해싱하여 일관된 닉네임 생성
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
        const char = deviceId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    const wordIndex = Math.abs(hash) % NICKNAME_WORDS.length;
    const number = 1000 + (Math.abs(hash) % 9000);

    return `${NICKNAME_WORDS[wordIndex]}${number}`;
}

export function filterBadWords(text: string): string {
    const BAD_WORDS = [
        '시발', '씨발', '시bal', 'ㅅㅂ', 'ㅆㅂ', 'ㅅㅃ', 'ㅆㅃ',
        '병신', 'ㅂㅅ', 'ㅂㅆ',
        '지랄', 'ㅈㄹ',
        '개새끼', '개새기', 'ㄱㅅㄲ',
        '좆', 'ㅈㄱ',
        '닥쳐', '꺼져',
        'fuck', 'shit', 'damn',
    ];
    let filtered = text;
    for (const word of BAD_WORDS) {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '***');
    }
    return filtered;
}

// For compatibility with block/report routes where we might need models directly
export async function getModelsAsync() {
    await dbConnect();
    return getModels();
}

// 댓글 도배 방지 체크 (1분 10개, 5분 50개)
// 최적화: O(N) 전체 스캔 → O(log N + K) aggregate + index 활용
export async function canComment(deviceId: string): Promise<{ canComment: boolean; waitSeconds?: number; reason?: string }> {
    await dbConnect();
    const { PostModel } = getModels();

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const [result] = await PostModel.aggregate([
        { $unwind: { path: '$comments', preserveNullAndEmptyArrays: false } },
        {
            $match: {
                'comments.deviceId': deviceId,
                'comments.createdAt': { $gte: fiveMinutesAgo },
            },
        },
        {
            $group: {
                _id: null,
                lastMinute: {
                    $sum: { $cond: [{ $gte: ['$comments.createdAt', oneMinuteAgo] }, 1, 0] },
                },
                lastFiveMinutes: { $sum: 1 },
            },
        },
    ]);

    const commentsInLastMinute = result?.lastMinute ?? 0;
    const commentsInLastFiveMinutes = result?.lastFiveMinutes ?? 0;

    // 1분에 10개 이상 → 10분 대기
    if (commentsInLastMinute >= 10) {
        return {
            canComment: false,
            waitSeconds: 600,
            reason: '댓글을 너무 빠르게 작성하고 있습니다. 10분 후에 다시 시도해주세요.',
        };
    }

    // 5분에 50개 이상 → 30분 대기
    if (commentsInLastFiveMinutes >= 50) {
        return {
            canComment: false,
            waitSeconds: 1800,
            reason: '댓글을 너무 많이 작성했습니다. 30분 후에 다시 시도해주세요.',
        };
    }

    return { canComment: true };
}
