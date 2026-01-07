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
            const currentUserId = await getCurrentUserId();
            setUserId(currentUserId);
            setIsLoggedIn(!!currentUserId);

            if (currentUserId) {
                // 구독 상태 조회 (레거시 호환 함수 사용)
                const { getSubscriptionState, getSubscriptionStatus } = await import('../services/subscription');
                const status = await getSubscriptionState();
                // getSubscriptionState()는 'trial' | 'active' | 'expired' 반환
                setSubscriptionStatus(status as SubscriptionStatus);

                // 운영자 권한 조회
                const adminStatus = await getIsAdmin();
                console.log('[AuthContext] isAdmin status:', adminStatus);
                setIsAdmin(adminStatus);

                // 서버에 구독 상태 동기화 (초기 동기화)
                try {
                    const subscriptionState = await getSubscriptionStatus();
                    const API_URL = (await import('../constants/config')).CONFIG.API_BASE_URL;
                    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('jwt_token'));
                    const { getDeviceId } = await import('../services/device');

                    if (token) {
                        const deviceId = await getDeviceId();
                        await fetch(`${API_URL}/api/subscription/sync`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                deviceId,
                                status: subscriptionState.status,
                                trialStartDate: subscriptionState.trialStartDate,
                                subscriptionStartDate: subscriptionState.subscriptionStartDate,
                                subscriptionExpiryDate: subscriptionState.subscriptionExpiryDate,
                            }),
                        });
                    }
                } catch (syncError) {
                    console.log('[AuthContext] Subscription sync skipped:', syncError);
                }
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
