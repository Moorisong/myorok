import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS, PIN_MESSAGES, CONFIG } from '../../../constants';
import { Card, PinInputModal } from '../../../components';
import { usePinLock } from '../../../hooks/use-pin-lock';
import { setPin as setPinApi, removePin as removePinApi, verifyPin } from '../../../services/pin';

type PinStep = 'idle' | 'enter' | 'confirm' | 'verify' | 'remove';

export default function PinSettingsScreen() {
    const router = useRouter();
    const { isPinSet, isLocked, refreshPinStatus, serverAvailable } = usePinLock();

    const [step, setStep] = useState<PinStep>('idle');
    const [newPin, setNewPin] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refreshPinStatus();
        }, [refreshPinStatus])
    );

    // PIN 설정 시작
    const handleSetPin = () => {
        if (!serverAvailable) {
            Alert.alert('연결 오류', PIN_MESSAGES.SERVER_UNAVAILABLE);
            return;
        }
        setNewPin('');
        setStep('enter');
    };

    // PIN 변경 시작 (기존 PIN 확인 → 새 PIN 입력)
    const handleChangePin = () => {
        if (!serverAvailable) {
            Alert.alert('연결 오류', PIN_MESSAGES.SERVER_UNAVAILABLE);
            return;
        }
        setStep('verify');
    };

    // PIN 해제
    const handleRemovePin = () => {
        if (!serverAvailable) {
            Alert.alert('연결 오류', PIN_MESSAGES.SERVER_UNAVAILABLE);
            return;
        }

        Alert.alert(
            PIN_MESSAGES.PIN_REMOVE,
            PIN_MESSAGES.PIN_REMOVE_CONFIRM,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '해제',
                    style: 'destructive',
                    onPress: () => setStep('remove'),
                },
            ]
        );
    };

    // PIN 입력 처리 (새 PIN 입력)
    const handleEnterPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
        if (!/^\d{4}$/.test(pin)) {
            return { success: false, error: PIN_MESSAGES.INVALID_PIN_FORMAT };
        }

        setNewPin(pin);
        setStep('confirm');
        return { success: true };
    };

    // PIN 확인 처리 (새 PIN 재입력)
    const handleConfirmPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
        if (pin !== newPin) {
            return { success: false, error: PIN_MESSAGES.PIN_MISMATCH };
        }

        setIsProcessing(true);

        try {
            const response = await setPinApi(pin);

            if (response.success) {
                setStep('idle');
                setNewPin('');
                await refreshPinStatus({ forceUnlock: true });
                Alert.alert('완료', PIN_MESSAGES.PIN_SET_SUCCESS);
                return { success: true };
            } else {
                return {
                    success: false,
                    error: response.error?.message || '설정에 실패했습니다.'
                };
            }
        } catch {
            return { success: false, error: '오류가 발생했습니다.' };
        } finally {
            setIsProcessing(false);
        }
    };

    // 기존 PIN 확인 (변경/해제 시)
    const handleVerifyPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
        setIsProcessing(true);

        try {
            const response = await verifyPin(pin);

            if (response.success) {
                // 변경인 경우 새 PIN 입력으로
                if (step === 'verify') {
                    setNewPin('');
                    setStep('enter');
                }
                return { success: true };
            } else {
                return {
                    success: false,
                    error: response.error?.message || '인증에 실패했습니다.'
                };
            }
        } catch {
            return { success: false, error: '오류가 발생했습니다.' };
        } finally {
            setIsProcessing(false);
        }
    };

    // PIN 해제 확인
    const handleRemoveVerify = async (pin: string): Promise<{ success: boolean; error?: string }> => {
        setIsProcessing(true);

        try {
            // 먼저 PIN 검증
            const verifyResponse = await verifyPin(pin);

            if (!verifyResponse.success) {
                return {
                    success: false,
                    error: verifyResponse.error?.message || '인증에 실패했습니다.'
                };
            }

            // PIN 삭제
            const removeResponse = await removePinApi();

            if (removeResponse.success) {
                setStep('idle');
                await refreshPinStatus();
                Alert.alert('완료', PIN_MESSAGES.PIN_REMOVE_SUCCESS);
                return { success: true };
            } else {
                return {
                    success: false,
                    error: removeResponse.error?.message || '해제에 실패했습니다.'
                };
            }
        } catch {
            return { success: false, error: '오류가 발생했습니다.' };
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setStep('idle');
        setNewPin('');
    };

    const getModalProps = () => {
        switch (step) {
            case 'enter':
                return {
                    title: PIN_MESSAGES.PIN_SET_TITLE,
                    description: PIN_MESSAGES.PIN_SET_DESCRIPTION,
                    onSubmit: handleEnterPin,
                };
            case 'confirm':
                return {
                    title: PIN_MESSAGES.PIN_SET_TITLE,
                    description: PIN_MESSAGES.PIN_CONFIRM_DESCRIPTION,
                    onSubmit: handleConfirmPin,
                };
            case 'verify':
                return {
                    title: PIN_MESSAGES.PIN_VERIFY_TITLE,
                    description: '현재 PIN을 입력하세요',
                    onSubmit: handleVerifyPin,
                };
            case 'remove':
                return {
                    title: PIN_MESSAGES.PIN_REMOVE,
                    description: 'PIN을 입력하여 해제를 확인하세요',
                    onSubmit: handleRemoveVerify,
                };
            default:
                return null;
        }
    };

    const modalProps = getModalProps();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>잠금(PIN) 설정</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView}>
                {!serverAvailable && (
                    <View style={styles.warningBanner}>
                        <Feather name="wifi-off" size={16} color={COLORS.warning} />
                        <Text style={styles.warningText}>서버에 연결할 수 없습니다</Text>
                    </View>
                )}

                <Card style={styles.card}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusLabel}>PIN 잠금</Text>
                            <Text style={styles.statusValue}>
                                {isPinSet ? '설정됨' : '설정 안 됨'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, isPinSet && styles.statusBadgeActive]}>
                            <Feather
                                name={isPinSet ? 'lock' : 'unlock'}
                                size={16}
                                color={isPinSet ? COLORS.primary : COLORS.textSecondary}
                            />
                        </View>
                    </View>
                </Card>

                {isPinSet ? (
                    <>
                        <Card style={styles.card}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    pressed && styles.menuItemPressed,
                                ]}
                                onPress={handleChangePin}
                            >
                                <Feather name="edit-2" size={20} color={COLORS.textPrimary} />
                                <Text style={styles.menuText}>{PIN_MESSAGES.PIN_CHANGE}</Text>
                                <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                            </Pressable>
                        </Card>

                        <Card style={styles.card}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    pressed && styles.menuItemPressed,
                                ]}
                                onPress={handleRemovePin}
                            >
                                <Feather name="unlock" size={20} color={COLORS.error} />
                                <Text style={[styles.menuText, styles.dangerText]}>
                                    {PIN_MESSAGES.PIN_REMOVE}
                                </Text>
                                <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                            </Pressable>
                        </Card>
                    </>
                ) : (
                    <Card style={styles.card}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem,
                                pressed && styles.menuItemPressed,
                            ]}
                            onPress={handleSetPin}
                        >
                            <Feather name="lock" size={20} color={COLORS.primary} />
                            <Text style={styles.menuText}>PIN 설정하기</Text>
                            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                        </Pressable>
                    </Card>
                )}

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>📌 안내</Text>
                    <Text style={styles.infoText}>
                        • PIN은 4자리 숫자입니다{'\n'}
                        • PIN을 설정하면 앱 실행 시 입력이 필요합니다{'\n'}
                        • 5회 연속 실패 시 5분간 잠깁니다
                    </Text>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {modalProps && (
                <PinInputModal
                    visible={step !== 'idle'}
                    title={modalProps.title}
                    description={modalProps.description}
                    onSubmit={modalProps.onSubmit}
                    onCancel={handleCancel}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFF3CD',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#856404',
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 4,
    },
    statusBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadgeActive: {
        backgroundColor: '#E8F5E9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    menuItemPressed: {
        opacity: 0.7,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    dangerText: {
        color: COLORS.error,
    },
    infoSection: {
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    bottomPadding: {
        height: 32,
    },
});
