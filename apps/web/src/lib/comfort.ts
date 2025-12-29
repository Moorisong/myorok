import mongoose from 'mongoose';
import dbConnect from './mongodb';

// --- Interfaces (Keep existing for type compatibility where possible) ---

export interface Comment {
    id: string;
    deviceId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface Post {
    id: string;
    deviceId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    likes: string[];
    comments: Comment[];
    reportCount: number;
    reportedBy: string[];
    hidden: boolean;
}

export interface BlockedDevice {
    deviceId: string;
    blockedDeviceId: string;
    createdAt: string;
}

// --- Mongoose Schemas & Models ---

const CommentSchema = new mongoose.Schema({
    id: { type: String, required: true },
    deviceId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true }, // Keeping as String to match ISO format usage
    updatedAt: { type: String, required: true },
});

const PostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    deviceId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    likes: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] },
    reportCount: { type: Number, default: 0 },
    reportedBy: { type: [String], default: [] },
    hidden: { type: Boolean, default: false },
});

const BlockedDeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    blockedDeviceId: { type: String, required: true },
    createdAt: { type: String, required: true },
});

// Helper to get models (prevents OverwriteModelError in dev)
const getModels = () => {
    const PostModel = mongoose.models.Post || mongoose.model('Post', PostSchema);
    const BlockedDeviceModel = mongoose.models.BlockedDevice || mongoose.model('BlockedDevice', BlockedDeviceSchema);
    return { PostModel, BlockedDeviceModel };
};

// --- Helper Functions ---

export async function cleanupOldPosts(): Promise<void> {
    await dbConnect();
    const { PostModel } = getModels();

    // Create Date set to midnight in local time (or server time)
    // The original logic was: today 00:00:00.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    // String comparison works for ISO dates: delete if createdAt < todayIso
    await PostModel.deleteMany({ createdAt: { $lt: todayIso } });
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
export async function getFilteredPosts(deviceId: string): Promise<Post[]> {
    await dbConnect();
    const { PostModel, BlockedDeviceModel } = getModels();

    // 1. Get list of users blocked by this device
    const blockedEntries = await BlockedDeviceModel.find({ deviceId }).lean();
    const blockedIds = blockedEntries.map((b: any) => b.blockedDeviceId);

    // 2. Fetch posts
    // conditions: hidden = false, deviceId NOT in blockedIds
    const posts = await PostModel.find({
        hidden: false,
        deviceId: { $nin: blockedIds }
    }).sort({ createdAt: -1 }).lean();

    // 3. Transform and filter comments specifically
    // The generic lean() returns _id, we need to ensure it matches Post interface if acceptable.
    // We modify comments in memory to filter out blocked users there too.

    return posts.map((p: any) => ({
        ...p,
        _id: undefined, // remove mongoose id if not needed, or keep it
        comments: p.comments.filter((c: any) => !blockedIds.includes(c.deviceId))
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
export async function canComment(deviceId: string): Promise<{ canComment: boolean; waitSeconds?: number; reason?: string }> {
    await dbConnect();
    const { PostModel } = getModels();

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    // 모든 게시글에서 해당 사용자의 댓글 수 카운트
    const posts = await PostModel.find({}).lean();

    let commentsInLastMinute = 0;
    let commentsInLastFiveMinutes = 0;

    for (const post of posts) {
        for (const comment of (post as any).comments || []) {
            if (comment.deviceId !== deviceId) continue;

            const commentTime = comment.createdAt;
            if (commentTime >= oneMinuteAgo) {
                commentsInLastMinute++;
            }
            if (commentTime >= fiveMinutesAgo) {
                commentsInLastFiveMinutes++;
            }
        }
    }

    // 1분에 10개 이상
    if (commentsInLastMinute >= 10) {
        return {
            canComment: false,
            waitSeconds: 60,
            reason: '댓글을 너무 빠르게 작성하고 있습니다. 1분 후에 다시 시도해주세요.',
        };
    }

    // 5분에 50개 이상
    if (commentsInLastFiveMinutes >= 50) {
        return {
            canComment: false,
            waitSeconds: 300,
            reason: '댓글을 너무 많이 작성했습니다. 5분 후에 다시 시도해주세요.',
        };
    }

    return { canComment: true };
}
