import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { COLORS } from '../constants';

type ToastVariant = 'default' | 'error';

interface ToastContextValue {
    showToast: (message: string, options?: { duration?: number; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

interface ToastProviderProps {
    children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [message, setMessage] = useState('');
    const [variant, setVariant] = useState<ToastVariant>('default');
    const [visible, setVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(10)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string, options?: { duration?: number; variant?: ToastVariant }) => {
        const duration = options?.duration ?? 2000;
        const toastVariant = options?.variant ?? 'default';

        // 이전 타이머 취소
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setMessage(msg);
        setVariant(toastVariant);
        setVisible(true);

        // 애니메이션 시작
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 20,
            }),
        ]).start();

        // 일정 시간 후 숨기기
        timeoutRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 10,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    setVisible(false);
                }
            });
        }, duration);
    }, [fadeAnim, slideAnim]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.container,
                        variant === 'error' && styles.containerError,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                    pointerEvents="none"
                >
                    <Text style={styles.message}>{message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '45%',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(46, 46, 46, 0.95)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 9999,
        alignItems: 'center',
    },
    containerError: {
        backgroundColor: COLORS.error,
    },
    message: {
        color: COLORS.surface,
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
    },
});
