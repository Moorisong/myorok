import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getPinStatus, verifyPin as verifyPinApi } from '../services/pin';
import { CONFIG } from '../constants';

interface PinLockContextValue {
    // 상태
    isPinSet: boolean;
    isLocked: boolean;
    isLoading: boolean;
    serverAvailable: boolean;

    // 액션
    unlock: (pin: string) => Promise<{ success: boolean; error?: string }>;
    lock: () => void;
    refreshPinStatus: () => Promise<void>;
    resetInactivityTimer: () => void;
}

const PinLockContext = createContext<PinLockContextValue | undefined>(undefined);

interface PinLockProviderProps {
    children: ReactNode;
}

export function PinLockProvider({ children }: PinLockProviderProps) {
    const [isPinSet, setIsPinSet] = useState(false);
    const [isLocked, setIsLocked] = useState(true); // PIN이 설정되어 있으면 기본적으로 잠김
    const [isLoading, setIsLoading] = useState(true);
    const [serverAvailable, setServerAvailable] = useState(true);

    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const appStateRef = useRef(AppState.currentState);

    // PIN 상태 조회
    const refreshPinStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getPinStatus();

            if (response.success && response.data) {
                setIsPinSet(response.data.isPinSet);
                setServerAvailable(true);

                // PIN이 설정되어 있으면 잠금 상태 유지
                if (response.data.isPinSet) {
                    setIsLocked(true);
                } else {
                    setIsLocked(false);
                }
            } else if (response.error?.code === 'NETWORK_ERROR') {
                // 서버 없음 - 개발 중에는 정상 상황
                setServerAvailable(false);
                setIsPinSet(false);
                setIsLocked(false); // 서버 없으면 잠금 기능 비활성화
            }
        } catch {
            // 서버 연결 실패 - 개발 중에는 정상 상황이므로 조용히 처리
            setServerAvailable(false);
            setIsPinSet(false);
            setIsLocked(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // PIN 검증 및 잠금 해제
    const unlock = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await verifyPinApi(pin);

            if (response.success) {
                setIsLocked(false);
                resetInactivityTimer();
                return { success: true };
            } else {
                return {
                    success: false,
                    error: response.error?.message || '인증에 실패했습니다.'
                };
            }
        } catch (error) {
            console.error('PIN 검증 오류:', error);
            return { success: false, error: '서버 오류가 발생했습니다.' };
        }
    }, []);

    // 잠금
    const lock = useCallback(() => {
        if (isPinSet) {
            setIsLocked(true);
            clearInactivityTimer();
        }
    }, [isPinSet]);

    // 무활동 타이머 초기화
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        if (isPinSet && !isLocked) {
            inactivityTimerRef.current = setTimeout(() => {
                setIsLocked(true);
            }, CONFIG.PIN_AUTO_LOCK_TIMEOUT);
        }
    }, [isPinSet, isLocked]);

    // 타이머 정리
    const clearInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    // 앱 상태 변화 감지 (백그라운드로 가면 잠금)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appStateRef.current.match(/active/) &&
                nextAppState.match(/inactive|background/)
            ) {
                // 앱이 백그라운드로 갈 때 잠금
                if (isPinSet) {
                    setIsLocked(true);
                    clearInactivityTimer();
                }
            }
            appStateRef.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isPinSet, clearInactivityTimer]);

    // 초기 로드
    useEffect(() => {
        refreshPinStatus();
    }, [refreshPinStatus]);

    // 정리
    useEffect(() => {
        return () => {
            clearInactivityTimer();
        };
    }, [clearInactivityTimer]);

    const value: PinLockContextValue = {
        isPinSet,
        isLocked: isPinSet && isLocked,
        isLoading,
        serverAvailable,
        unlock,
        lock,
        refreshPinStatus,
        resetInactivityTimer,
    };

    return <PinLockContext.Provider value={value}>{children}</PinLockContext.Provider>;
}

export function usePinLock() {
    const context = useContext(PinLockContext);
    if (context === undefined) {
        throw new Error('usePinLock must be used within a PinLockProvider');
    }
    return context;
}
