import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS, PIN_MESSAGES } from '../constants';
import { usePinLock } from '../hooks/use-pin-lock';

const { width } = Dimensions.get('window');

export default function AppLockScreen() {
    const { isLocked, unlock } = usePinLock();
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false); // 추후 생체인증 지원 시 사용

    // 잠금 상태가 아니면 렌더링하지 않음
    if (!isLocked) {
        return null;
    }

    const handleNumberPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError(null);

            if (newPin.length === 4) {
                handleUnlock(newPin);
            }
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            setPin(prev => prev.slice(0, -1));
            setError(null);
        }
    };

    const handleUnlock = async (inputPin: string) => {
        const result = await unlock(inputPin);
        if (result.success) {
            setPin('');
            setError(null);
        } else {
            setError(result.error || PIN_MESSAGES.PIN_MISMATCH);
            setPin('');
            // Shake animation or vibration could be added here
        }
    };

    return (
        <View style={styles.absoluteContainer}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Feather name="lock" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>{PIN_MESSAGES.PIN_VERIFY_TITLE}</Text>
                    <Text style={styles.description}>
                        {error || PIN_MESSAGES.PIN_VERIFY_DESCRIPTION}
                    </Text>

                    {/* PIN Indicator */}
                    <View style={styles.indicatorContainer}>
                        {[0, 1, 2, 3].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.indicator,
                                    pin.length > i && styles.indicatorActive,
                                    error ? styles.indicatorError : null,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Keypad */}
                    <View style={styles.keypad}>
                        {[
                            ['1', '2', '3'],
                            ['4', '5', '6'],
                            ['7', '8', '9'],
                            ['fingereprint', '0', 'delete'],
                        ].map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.row}>
                                {row.map((item) => {
                                    if (item === 'delete') {
                                        return (
                                            <Pressable
                                                key={item}
                                                style={styles.keyButton}
                                                onPress={handleDelete}
                                            >
                                                <Feather name="delete" size={24} color={COLORS.textPrimary} />
                                            </Pressable>
                                        );
                                    }
                                    if (item === 'fingereprint') {
                                        return (
                                            <View key={item} style={styles.keyButton}>
                                                {/* 생체인증 버튼 자리 (추후 구현) */}
                                            </View>
                                        );
                                    }
                                    return (
                                        <Pressable
                                            key={item}
                                            style={styles.keyButton}
                                            onPress={() => handleNumberPress(item)}
                                        >
                                            <Text style={styles.keyText}>{item}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    absoluteContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, // 최상위 레이어
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 32,
    },
    indicatorContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 48,
    },
    indicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    indicatorActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    indicatorError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.error,
    },
    keypad: {
        width: '100%',
        maxWidth: 320,
        gap: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    keyButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
});
