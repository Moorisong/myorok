import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getCurrentUserId, logout as logoutService } from '../services/auth';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | null;

interface AuthContextType {
    isLoggedIn: boolean | null;
    isLoggingIn: boolean;
    userId: string | null;
    subscriptionStatus: SubscriptionStatus;
    setIsLoggedIn: (value: boolean) => void;
    setIsLoggingIn: (value: boolean) => void;
    setUserId: (value: string | null) => void;
    setSubscriptionStatus: (value: SubscriptionStatus) => void;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(null);

    const checkAuthStatus = useCallback(async () => {
        try {
            const currentUserId = await getCurrentUserId();
            setUserId(currentUserId);
            setIsLoggedIn(!!currentUserId);

            if (currentUserId) {
                // 실제 구독 상태 조회
                const { getSubscriptionState } = await import('../services/subscription');
                const status = await getSubscriptionState();
                setSubscriptionStatus(status as SubscriptionStatus);
            } else {
                setSubscriptionStatus(null);
            }
        } catch (error) {
            console.error('[AuthContext] Check auth status failed:', error);
            setIsLoggedIn(false);
            setSubscriptionStatus(null);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutService();
            setUserId(null);
            setIsLoggedIn(false);
            setSubscriptionStatus(null);
        } catch (error) {
            console.error('[AuthContext] Logout failed:', error);
            // Still update state even on error
            setUserId(null);
            setIsLoggedIn(false);
            setSubscriptionStatus(null);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                isLoggingIn,
                userId,
                subscriptionStatus,
                setIsLoggedIn,
                setIsLoggingIn,
                setUserId,
                setSubscriptionStatus,
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
