import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Kakao OAuth configuration
export const KAKAO_CLIENT_ID = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;
const KAKAO_REST_API_KEY = KAKAO_CLIENT_ID;

// Server-based redirect URI
export const KAKAO_REDIRECT_URI = 'https://myorok.haroo.site/auth/kakao';

export const KAKAO_DISCOVERY = {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'kakao_access_token',
    REFRESH_TOKEN: 'kakao_refresh_token',
    USER_INFO: 'kakao_user_info',
    JWT_TOKEN: 'jwt_token',
};

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'https://myorok.haroo.site';

export interface KakaoUser {
    id: string;
    nickname: string;
    profileImage?: string;
}

interface KakaoTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    refresh_token_expires_in: number;
}

interface KakaoUserResponse {
    id: number;
    kakao_account?: {
        profile?: {
            nickname?: string;
            profile_image_url?: string;
        };
    };
}

export interface ServerAuthResponse {
    success: boolean;
    user: KakaoUser;
    token: string;
}

/**
 * Exchange authorization code for tokens and get user info (Server-based)
 */
export async function exchangeCodeForToken(code: string): Promise<KakaoUser> {
    try {
        console.log('[KakaoAuth] Starting server-based authentication...');
        console.log('[KakaoAuth] Server URL:', SERVER_URL);
        console.log('[KakaoAuth] Code prefix:', code.slice(0, 10) + '...');

        // Call server to exchange code for user info and JWT token
        const response = await fetch(`${SERVER_URL}/auth/kakao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        console.log('[KakaoAuth] Server Response Status:', response.status, response.ok ? 'OK' : 'FAILED');

        if (!response.ok) {
            const error = await response.text();
            console.error('[KakaoAuth] Server error response:', error);
            throw new Error('서버 인증에 실패했습니다.');
        }

        const authResponse: ServerAuthResponse = await response.json();

        if (!authResponse.success) {
            throw new Error('서버 인증에 실패했습니다.');
        }

        // Store JWT token
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, authResponse.token);

        // Store user info
        await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(authResponse.user));

        console.log('[KakaoAuth] Login successful:', authResponse.user.id);
        return authResponse.user;
    } catch (error) {
        console.error('[KakaoAuth] Authentication failed:', error);
        throw error;
    }
}

/**
 * Login with Kakao using server-based authentication
 */
export async function loginWithKakaoServer(code: string): Promise<{ user: KakaoUser; token: string }> {
    try {
        console.log('[KakaoAuth] Starting server-based login...');

        // Send code to server
        const response = await fetch(`${SERVER_URL}/auth/kakao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[KakaoAuth] Server login error:', error);
            throw new Error('서버 로그인에 실패했습니다.');
        }

        const authResponse: ServerAuthResponse = await response.json();

        if (!authResponse.success) {
            throw new Error('서버 로그인에 실패했습니다.');
        }

        // Store JWT token
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, authResponse.token);

        // Store user info
        await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(authResponse.user));

        console.log('[KakaoAuth] Server login successful:', authResponse.user.id);

        return {
            user: authResponse.user,
            token: authResponse.token,
        };
    } catch (error) {
        console.error('[KakaoAuth] Server login failed:', error);
        throw error;
    }
}

/**
 * Logout from Kakao (Server-based)
 */
export async function logoutFromKakao(): Promise<void> {
    try {
        const jwtToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

        if (jwtToken) {
            // Call server logout API
            await fetch(`${SERVER_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
            });
        }

        // Clear stored JWT token and user info
        await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
        // Keep legacy keys for backward compatibility cleanup
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

        console.log('[KakaoAuth] Logout successful');
    } catch (error) {
        console.error('[KakaoAuth] Logout error:', error);
        // Still clear local storage even if API call fails
        await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
}

/**
 * Check current authentication session (JWT-based)
 * @returns User info if logged in, null otherwise
 */
export async function getAuthSession(): Promise<KakaoUser | null> {
    try {
        const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
        const jwtToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

        if (!userInfoStr || !jwtToken) {
            return null;
        }

        // Verify JWT token is still valid by checking expiration
        // JWT format: header.payload.signature
        try {
            const payload = jwtToken.split('.')[1];
            // Use Buffer for base64 decoding in React Native
            const decodedPayload = JSON.parse(
                Buffer.from(payload, 'base64').toString('utf-8')
            );
            const currentTime = Math.floor(Date.now() / 1000);

            if (decodedPayload.exp && decodedPayload.exp < currentTime) {
                // Token expired
                console.log('[KakaoAuth] JWT token expired');
                await logoutFromKakao();
                return null;
            }
        } catch (decodeError) {
            console.error('[KakaoAuth] JWT decode error:', decodeError);
            await logoutFromKakao();
            return null;
        }

        return JSON.parse(userInfoStr) as KakaoUser;
    } catch (error) {
        console.error('[KakaoAuth] Session check failed:', error);
        return null;
    }
}

/**
 * Get JWT token from storage
 */
export async function getJwtToken(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    } catch (error) {
        console.error('[KakaoAuth] Get JWT token failed:', error);
        return null;
    }
}

// ============================================================
// MOCK MODE for development without Kakao console setup
// ============================================================

// const MOCK_MODE = __DEV__; // Enable mock mode in development
const MOCK_MODE = false; // Force real auth for testing

/**
 * Mock authentication for development
 */
export async function authenticateWithKakaoMock(): Promise<KakaoUser> {
    console.log('[KakaoAuth] Using mock authentication');

    const mockUser: KakaoUser = {
        id: 'mock_user_' + Date.now(),
        nickname: '테스트 사용자',
        profileImage: undefined,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(mockUser));
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'mock_token');

    return mockUser;
}

/**
 * Smart authenticate - uses mock in dev, real in production
 */
// authenticate function removed as it is replaced by hook-based flow
