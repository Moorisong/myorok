import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const COMFORT_FILE = path.join(DATA_DIR, 'comfort.json');

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
    likes: string[]; // deviceIds that liked
    comments: Comment[];
    reportCount: number;
    reportedBy: string[]; // deviceIds that reported
    hidden: boolean;
}

export interface BlockedDevice {
    deviceId: string;
    blockedDeviceId: string;
    createdAt: string;
}

export interface ComfortData {
    posts: Post[];
    blockedDevices: BlockedDevice[];
    lastPostTime: { [deviceId: string]: string }; // 1시간 제한용
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getComfortData(): ComfortData {
    ensureDataDir();
    if (!fs.existsSync(COMFORT_FILE)) {
        return { posts: [], blockedDevices: [], lastPostTime: {} };
    }
    try {
        const data = fs.readFileSync(COMFORT_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { posts: [], blockedDevices: [], lastPostTime: {} };
    }
}

export function saveComfortData(data: ComfortData): void {
    ensureDataDir();
    fs.writeFileSync(COMFORT_FILE, JSON.stringify(data, null, 2));
}

// 자정 이후 글 삭제 (오늘 자정 기준)
export function cleanupOldPosts(): void {
    const data = getComfortData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    data.posts = data.posts.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= today;
    });

    saveComfortData(data);
}

// 글 작성 가능 여부 체크 (1시간 제한)
export function canPost(deviceId: string): { canPost: boolean; waitMinutes?: number } {
    const data = getComfortData();
    const lastPostTime = data.lastPostTime[deviceId];

    if (!lastPostTime) {
        return { canPost: true };
    }

    const lastPost = new Date(lastPostTime);
    const now = new Date();
    const diffMs = now.getTime() - lastPost.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (diffMs >= oneHourMs) {
        return { canPost: true };
    }

    const waitMinutes = Math.ceil((oneHourMs - diffMs) / 60000);
    return { canPost: false, waitMinutes };
}

// UUID 생성
export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// 간단한 욕설 필터 (한국어)
const BAD_WORDS = [
    '시발', '씨발', '시bal', 'ㅅㅂ', 'ㅆㅂ', 'ㅅㅃ', 'ㅆㅃ',
    '병신', 'ㅂㅅ', 'ㅂㅆ',
    '지랄', 'ㅈㄹ',
    '개새끼', '개새기', 'ㄱㅅㄲ',
    '좆', 'ㅈㄱ',
    '닥쳐', '꺼져',
    'fuck', 'shit', 'damn',
];

export function filterBadWords(text: string): string {
    let filtered = text;
    for (const word of BAD_WORDS) {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '***');
    }
    return filtered;
}
