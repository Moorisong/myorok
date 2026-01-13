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
            // DEV Code removed: Auto-login with EXPO_PUBLIC_DEV_ADMIN_ID is no longer supported

            const currentUserId = await getCurrentUserId();
            setUserId(currentUserId);
            setIsLoggedIn(!!currentUserId);

            if (currentUserId) {
                console.log('[AuthContext] User logged in:', currentUserId);
                // SubscriptionManager를 통해 구독 상태 결정 (중앙 집중식)
                // - 중복 호출 방지
                // - 복원 성공 시 SSOT 건너뜀
                // - 모든 상태 변경을 한 곳에서 처리
                const { initializeSubscription } = await import('../services/subscription');
                await initializeSubscription();

                const SubscriptionManager = (await import('../services/SubscriptionManager')).default;
                const manager = SubscriptionManager.getInstance();
                const uiStatus = await manager.resolveSubscriptionStatus();

                setSubscriptionStatus(uiStatus);
                console.log(`[AuthContext] Subscription resolved for ${currentUserId}: ${uiStatus}`);

                // 운영자 권한 조회
                const adminStatus = await getIsAdmin();
                console.log('[AuthContext] isAdmin status:', adminStatus);
                setIsAdmin(adminStatus);
            } else {
                console.log('[AuthContext] No user logged in');
                setSubscriptionStatus('loading');
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
