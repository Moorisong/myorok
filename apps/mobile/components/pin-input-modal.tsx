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

    // PIN 초기화 (모달 열림 또는 단계 변경 시)
    useEffect(() => {
        if (visible) {
            setPin('');
            setError(null);
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
                                            pressed && styles.keyPressed,
                                        ]}
                                        onPress={handleDelete}
                                        disabled={isSubmitting}
                                    >
                                        <Feather name="delete" size={24} color={COLORS.textPrimary} />
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
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    {renderDots()}

                    {error && (
                        <View style={styles.errorContainer}>
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
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 24,
        width: '85%',
        maxWidth: 320,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dotError: {
        borderColor: COLORS.error,
        backgroundColor: 'transparent',
    },
    errorContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    errorText: {
        fontSize: 13,
        color: COLORS.error,
        textAlign: 'center',
    },
    keypad: {
        gap: 12,
    },
    keypadRow: {
        flexDirection: 'row',
        gap: 20,
    },
    key: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyPressed: {
        backgroundColor: COLORS.border,
    },
    keyEmpty: {
        width: 64,
        height: 64,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    cancelButton: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    cancelButtonPressed: {
        opacity: 0.7,
    },
    cancelText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
});
