import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getCurrentUserId, logout as logoutService, getIsAdmin } from '../services/auth';

/**
 * UI 레이어 구독 상태 (SSOT와 호환)
 * - loading: 검증 중 (스피너 표시)
 * - active: 유효한 구독 (= SSOT의 'subscribed')
 * - trial: 무료체험 중
 * - expired: 차단 상태 (= SSOT의 'blocked')
 */
export type SubscriptionStatus = 'loading' | 'active' | 'trial' | 'expired' | null;

interface AuthContextType {
    isLoggedIn: boolean | null;
    isLoggingIn: boolean;
    userId: string | null;
    subscriptionStatus: SubscriptionStatus;
    isAdmin: boolean;
    setIsLoggedIn: (value: boolean) => void;
    setIsLoggingIn: (value: boolean) => void;
    setUserId: (value: string | null) => void;
    setSubscriptionStatus: (value: SubscriptionStatus) => void;
    setIsAdmin: (value: boolean) => void;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const checkAuthStatus = useCallback(async () => {
        try {
            // DEV 모드: admin 계정 자동 로그인 (테스트용)
            if (__DEV__ && process.env.EXPO_PUBLIC_DEV_ADMIN_ID) {
                const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
                const existingUserId = await AsyncStorage.getItem('current_user_id');

                if (!existingUserId) {
                    console.log('[AuthContext] DEV mode: Auto-login with admin account');
                    const adminId = process.env.EXPO_PUBLIC_DEV_ADMIN_ID;
                    await AsyncStorage.setItem('current_user_id', adminId);
                    await AsyncStorage.setItem('is_admin', 'true');
                    await AsyncStorage.setItem('dev_auto_login', 'true'); // Deep link handler에서 trial 시작 건너뛰기
                    await AsyncStorage.setItem('kakao_user_info', JSON.stringify({
                        id: adminId,
                        nickname: 'Dev Admin',
                        isAdmin: true,
                    }));
                }
            }

            const currentUserId = await getCurrentUserId();
            setUserId(currentUserId);
            setIsLoggedIn(!!currentUserId);

            if (currentUserId) {
                // SSOT: 서버 검증 기반 구독 상태 판별
                const { verifySubscriptionWithServer } = await import('../services/subscription');
                const { status } = await verifySubscriptionWithServer();

                // SSOT 상태를 UI 상태로 변환
                // subscribed -> active, blocked -> expired
                let uiStatus: SubscriptionStatus;
                if (status === 'subscribed') {
                    uiStatus = 'active';
                } else if (status === 'blocked') {
                    uiStatus = 'expired';
                } else {
                    uiStatus = status; // 'loading', 'trial'
                }

                setSubscriptionStatus(uiStatus);
                console.log('[AuthContext] SSOT subscription status:', status, '-> UI:', uiStatus);

                // 운영자 권한 조회
                const adminStatus = await getIsAdmin();
                console.log('[AuthContext] isAdmin status:', adminStatus);
                setIsAdmin(adminStatus);
            } else {
                setSubscriptionStatus(null);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('[AuthContext] Check auth status failed:', error);
            setIsLoggedIn(false);
            setSubscriptionStatus(null);
            setIsAdmin(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutService();
            setUserId(null);
            setIsLoggedIn(false);
            setSubscriptionStatus(null);
            setIsAdmin(false);
        } catch (error) {
            console.error('[AuthContext] Logout failed:', error);
            // Still update state even on error
            setUserId(null);
            setIsLoggedIn(false);
            setSubscriptionStatus(null);
            setIsAdmin(false);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                isLoggingIn,
                userId,
                subscriptionStatus,
                isAdmin,
                setIsLoggedIn,
                setIsLoggingIn,
                setUserId,
                setSubscriptionStatus,
                setIsAdmin,
                logout,
                checkAuthStatus,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
