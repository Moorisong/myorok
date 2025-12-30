import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    StyleSheet,
    Animated,
    Vibration,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, CONFIG, PIN_MESSAGES } from '../constants';

interface PinInputModalProps {
    visible: boolean;
    title: string;
    description: string;
    onSubmit: (pin: string) => Promise<{ success: boolean; error?: string }>;
    onCancel?: () => void;
    showCancel?: boolean;
}

export function PinInputModal({
    visible,
    title,
    description,
    onSubmit,
    onCancel,
    showCancel = true,
}: PinInputModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // PIN 초기화 (모달이 보이거나 description이 바뀔 때 = 단계가 바뀔 때)
    useEffect(() => {
        if (visible) {
            setPin('');
            setError(null);
            // 모달 열릴 때 스케일 애니메이션
            scaleAnim.setValue(0.9);
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, description]);

    // PIN 완성 시 자동 제출
    useEffect(() => {
        if (pin.length === CONFIG.PIN_LENGTH && !isSubmitting) {
            handleSubmit();
        }
    }, [pin]);

    const handleSubmit = async () => {
        if (pin.length !== CONFIG.PIN_LENGTH) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await onSubmit(pin);

            if (!result.success) {
                setError(result.error || '인증에 실패했습니다.');
                setPin('');
                shake();
                Vibration.vibrate(100);
            }
        } catch {
            setError('오류가 발생했습니다.');
            setPin('');
            shake();
        } finally {
            setIsSubmitting(false);
        }
    };

    const shake = useCallback(() => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    }, [shakeAnim]);

    const handlePress = (digit: string) => {
        if (pin.length < CONFIG.PIN_LENGTH && !isSubmitting) {
            setPin(prev => prev + digit);
            setError(null);
        }
    };

    const handleDelete = () => {
        if (!isSubmitting) {
            setPin(prev => prev.slice(0, -1));
            setError(null);
        }
    };

    const renderDots = () => {
        return (
            <Animated.View
                style={[
                    styles.dotsContainer,
                    { transform: [{ translateX: shakeAnim }] }
                ]}
            >
                {Array.from({ length: CONFIG.PIN_LENGTH }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            pin.length > index && styles.dotFilled,
                            error && styles.dotError,
                        ]}
                    />
                ))}
            </Animated.View>
        );
    };

    const renderKeypad = () => {
        const keys = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
        ];

        return (
            <View style={styles.keypad}>
                {keys.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keypadRow}>
                        {row.map((key, keyIndex) => {
                            if (key === '') {
                                return <View key={keyIndex} style={styles.keyEmpty} />;
                            }

                            if (key === 'delete') {
                                return (
                                    <Pressable
                                        key={keyIndex}
                                        style={({ pressed }) => [
                                            styles.key,
                                            styles.keyDelete,
                                            pressed && styles.keyPressed,
                                        ]}
                                        onPress={handleDelete}
                                        disabled={isSubmitting}
                                    >
                                        <Feather name="delete" size={24} color={COLORS.textSecondary} />
                                    </Pressable>
                                );
                            }

                            return (
                                <Pressable
                                    key={keyIndex}
                                    style={({ pressed }) => [
                                        styles.key,
                                        pressed && styles.keyPressed,
                                    ]}
                                    onPress={() => handlePress(key)}
                                    disabled={isSubmitting}
                                >
                                    <Text style={styles.keyText}>{key}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Lock Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Feather name="lock" size={28} color={COLORS.primary} />
                        </View>
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    {renderDots()}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Feather name="alert-circle" size={14} color={COLORS.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {renderKeypad()}

                    {showCancel && onCancel && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelButton,
                                pressed && styles.cancelButtonPressed,
                            ]}
                            onPress={onCancel}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.cancelText}>취소</Text>
                        </Pressable>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 28,
        width: '88%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 18,
    },
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2.5,
        borderColor: COLORS.border,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        transform: [{ scale: 1.1 }],
    },
    dotError: {
        borderColor: COLORS.error,
        backgroundColor: 'transparent',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.error + '10',
        borderRadius: 8,
    },
    errorText: {
        fontSize: 13,
        color: COLORS.error,
        fontWeight: '500',
    },
    keypad: {
        gap: 14,
    },
    keypadRow: {
        flexDirection: 'row',
        gap: 22,
    },
    key: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border + '50',
    },
    keyDelete: {
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    keyPressed: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary + '40',
        transform: [{ scale: 0.95 }],
    },
    keyEmpty: {
        width: 68,
        height: 68,
    },
    keyText: {
        fontSize: 30,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    cancelButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
    },
    cancelButtonPressed: {
        backgroundColor: COLORS.background,
    },
    cancelText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});

