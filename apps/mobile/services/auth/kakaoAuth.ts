import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Kakao OAuth configuration
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY || '';
const KAKAO_REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: 'myorok',
    path: 'auth/kakao',
});

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'kakao_access_token',
    REFRESH_TOKEN: 'kakao_refresh_token',
    USER_INFO: 'kakao_user_info',
};

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

/**
 * Kakao OAuth2 authentication
 * @returns Authenticated user information
 */
export async function authenticateWithKakao(): Promise<KakaoUser> {
    try {
        // Build authorization URL
        const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;

        console.log('[KakaoAuth] Starting authentication...');
        console.log('[KakaoAuth] Redirect URI:', KAKAO_REDIRECT_URI);

        // Open browser for authentication
        const result = await WebBrowser.openAuthSessionAsync(authUrl, KAKAO_REDIRECT_URI);

        if (result.type !== 'success') {
            throw new Error('카카오 로그인이 취소되었습니다.');
        }

        // Extract authorization code from URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (!code) {
            throw new Error('인증 코드를 받지 못했습니다.');
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: KAKAO_REST_API_KEY,
                redirect_uri: KAKAO_REDIRECT_URI,
                code,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('[KakaoAuth] Token error:', error);
            throw new Error('토큰 발급에 실패했습니다.');
        }

        const tokens: KakaoTokenResponse = await tokenResponse.json();

        // Store tokens
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);

        // Get user info
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error('사용자 정보를 가져오는데 실패했습니다.');
        }

        const userData: KakaoUserResponse = await userResponse.json();

        const user: KakaoUser = {
            id: String(userData.id),
            nickname: userData.kakao_account?.profile?.nickname || '사용자',
            profileImage: userData.kakao_account?.profile?.profile_image_url,
        };

        // Store user info
        await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));

        console.log('[KakaoAuth] Login successful:', user.id);
        return user;
    } catch (error) {
        console.error('[KakaoAuth] Authentication failed:', error);
        throw error;
    }
}

/**
 * Logout from Kakao
 */
export async function logoutFromKakao(): Promise<void> {
    try {
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (accessToken) {
            // Call Kakao logout API
            await fetch('https://kapi.kakao.com/v1/user/logout', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        }

        // Clear stored tokens and user info
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);

        console.log('[KakaoAuth] Logout successful');
    } catch (error) {
        console.error('[KakaoAuth] Logout error:', error);
        // Still clear local storage even if API call fails
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
    }
}

/**
 * Check current authentication session
 * @returns User info if logged in, null otherwise
 */
export async function getAuthSession(): Promise<KakaoUser | null> {
    try {
        const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (!userInfoStr || !accessToken) {
            return null;
        }

        // Verify token is still valid
        const response = await fetch('https://kapi.kakao.com/v1/user/access_token_info', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            // Token expired, try to refresh
            const refreshed = await refreshToken();
            if (!refreshed) {
                await logoutFromKakao();
                return null;
            }
        }

        return JSON.parse(userInfoStr) as KakaoUser;
    } catch (error) {
        console.error('[KakaoAuth] Session check failed:', error);
        return null;
    }
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(): Promise<boolean> {
    try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
            return false;
        }

        const response = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: KAKAO_REST_API_KEY,
                refresh_token: refreshToken,
            }).toString(),
        });

        if (!response.ok) {
            return false;
        }

        const tokens: KakaoTokenResponse = await response.json();

        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
        if (tokens.refresh_token) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
        }

        console.log('[KakaoAuth] Token refreshed');
        return true;
    } catch (error) {
        console.error('[KakaoAuth] Token refresh failed:', error);
        return false;
    }
}

// ============================================================
// MOCK MODE for development without Kakao console setup
// ============================================================

const MOCK_MODE = __DEV__; // Enable mock mode in development

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
export async function authenticate(): Promise<KakaoUser> {
    if (MOCK_MODE) {
        return authenticateWithKakaoMock();
    }
    return authenticateWithKakao();
}
