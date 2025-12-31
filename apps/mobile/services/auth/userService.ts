import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database';
import { authenticate, logoutFromKakao, getAuthSession, KakaoUser } from './kakaoAuth';
import { startTrialForUser } from '../subscription';

const STORAGE_KEYS = {
    CURRENT_USER_ID: 'current_user_id',
};

export interface User {
    id: string;
    nickname: string;
    profileImage?: string;
    createdAt: string;
    lastLogin: string;
}

/**
 * 카카오 로그인 수행 및 사용자 DB 저장
 * - 신규 유저: INSERT + startTrial()
 * - 기존 유저: updateLastLogin()
 * @returns userId
 */
export async function loginWithKakao(): Promise<string> {
    try {
        // Authenticate with Kakao
        const kakaoUser = await authenticate();

        // Check if user exists in DB
        const existingUser = await getUser(kakaoUser.id);

        if (existingUser) {
            // Existing user - update last login
            await updateLastLogin(kakaoUser.id);
            console.log('[UserService] Existing user logged in:', kakaoUser.id);
        } else {
            // New user - create and start trial
            await createUser(kakaoUser);
            await startTrialForUser(kakaoUser.id);
            console.log('[UserService] New user created:', kakaoUser.id);
        }

        // Store current user ID
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, kakaoUser.id);

        return kakaoUser.id;
    } catch (error) {
        console.error('[UserService] Login failed:', error);
        throw error;
    }
}

/**
 * 로그아웃
 * - userId 제거 (로컬 세션)
 * - 로컬 pet 데이터 유지 (삭제하지 않음)
 */
export async function logout(): Promise<void> {
    try {
        await logoutFromKakao();
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        console.log('[UserService] User logged out');
    } catch (error) {
        console.error('[UserService] Logout failed:', error);
        throw error;
    }
}

/**
 * 사용자 정보 조회
 */
export async function getUser(userId: string): Promise<User | null> {
    try {
        const db = await getDatabase();
        const user = await db.getFirstAsync<User>(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        return user || null;
    } catch (error) {
        console.error('[UserService] Get user failed:', error);
        return null;
    }
}

/**
 * 마지막 로그인 시각 갱신
 */
export async function updateLastLogin(userId: string): Promise<void> {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            'UPDATE users SET lastLogin = ? WHERE id = ?',
            [now, userId]
        );
    } catch (error) {
        console.error('[UserService] Update last login failed:', error);
        throw error;
    }
}

/**
 * 현재 로그인된 사용자 ID 조회
 */
export async function getCurrentUserId(): Promise<string | null> {
    try {
        const userId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);

        if (!userId) {
            return null;
        }

        // Verify session is still valid
        const session = await getAuthSession();
        if (!session) {
            // Session expired, clear stored user ID
            await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
            return null;
        }

        return userId;
    } catch (error) {
        console.error('[UserService] Get current user ID failed:', error);
        return null;
    }
}

/**
 * 현재 로그인된 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<User | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return null;
    }
    return getUser(userId);
}

/**
 * 사용자 생성 (내부 함수)
 */
async function createUser(kakaoUser: KakaoUser): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO users (id, nickname, profileImage, createdAt, lastLogin)
     VALUES (?, ?, ?, ?, ?)`,
        [kakaoUser.id, kakaoUser.nickname, kakaoUser.profileImage || null, now, now]
    );
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
    userId: string,
    updates: { nickname?: string; profileImage?: string }
): Promise<void> {
    try {
        const db = await getDatabase();
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.nickname !== undefined) {
            fields.push('nickname = ?');
            values.push(updates.nickname);
        }

        if (updates.profileImage !== undefined) {
            fields.push('profileImage = ?');
            values.push(updates.profileImage);
        }

        if (fields.length === 0) {
            return;
        }

        values.push(userId);
        await db.runAsync(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    } catch (error) {
        console.error('[UserService] Update profile failed:', error);
        throw error;
    }
}
