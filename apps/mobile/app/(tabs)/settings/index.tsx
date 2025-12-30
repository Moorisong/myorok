import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS, PIN_MESSAGES } from '../../../constants';
import { Card, PinInputModal } from '../../../components';
import { useSelectedPet } from '../../../hooks/use-selected-pet';
import { usePinLock } from '../../../hooks/use-pin-lock';
import { getSubscriptionStatus, getTrialCountdownText } from '../../../services';
import type { SubscriptionState } from '../../../services';

interface SettingItemProps {
    emoji: string;
    title: string;
    description?: string;
    onPress: () => void;
    danger?: boolean;
    disabled?: boolean;
}

function SettingItem({ emoji, title, description, onPress, danger, disabled }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.settingItem,
                pressed && !disabled && styles.settingItemPressed,
                disabled && styles.settingItemDisabled,
            ]}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
        >
            <Text style={styles.settingEmoji}>{emoji}</Text>
            <View style={styles.settingContent}>
                <Text style={[
                    styles.settingTitle,
                    danger && styles.dangerText,
                    disabled && styles.disabledText,
                ]}>
                    {title}
                </Text>
                {description && (
                    <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
                        {description}
                    </Text>
                )}
            </View>
            <Text style={styles.arrow}>›</Text>
        </Pressable>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const { selectedPet } = useSelectedPet();
    const { isPinSet, isLocked, unlock, refreshPinStatus, resetInactivityTimer } = usePinLock();

    const [showPinModal, setShowPinModal] = useState(false);
    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);

    useFocusEffect(
        useCallback(() => {
            refreshPinStatus();
            loadSubscriptionStatus();
        }, [refreshPinStatus])
    );

    const loadSubscriptionStatus = async () => {
        const status = await getSubscriptionStatus();
        setSubscriptionState(status);
    };

    // 사용자 활동 시 무활동 타이머 리셋
    const handleUserActivity = useCallback(() => {
        if (!isLocked) {
            resetInactivityTimer();
        }
    }, [isLocked, resetInactivityTimer]);

    const handleUnlock = () => {
        setShowPinModal(true);
    };

    const handlePinSubmit = async (pin: string): Promise<{ success: boolean; error?: string }> => {
        const result = await unlock(pin);
        if (result.success) {
            setShowPinModal(false);
        }
        return result;
    };

    const handleReset = () => {
        handleUserActivity();

        if (isLocked) {
            handleUnlock();
            return;
        }

        Alert.alert(
            '데이터 초기화',
            '모든 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                { text: '초기화', style: 'destructive', onPress: () => { } },
            ]
        );
    };

    const handleNavigate = (path: string) => {
        handleUserActivity();
        router.navigate(path as any);
    };

    const getPinDescription = () => {
        if (isPinSet) {
            return isLocked ? '잠김' : '설정됨';
        }
        return '앱 접근 보호';
    };

    const getSubscriptionDescription = () => {
        if (!subscriptionState) return '로딩 중...';

        if (subscriptionState.status === 'trial') {
            return `${getTrialCountdownText(subscriptionState.daysRemaining || 0)}`;
        } else if (subscriptionState.status === 'active') {
            return '구독 중';
        } else {
            return '무료 체험 종료';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                {/* Lock Banner */}
                {isLocked && (
                    <Pressable style={styles.lockBanner} onPress={handleUnlock}>
                        <View style={styles.lockBannerContent}>
                            <Text style={styles.lockBannerText}>{PIN_MESSAGES.LOCKED_BANNER}</Text>
                            <View style={styles.unlockButton}>
                                <Text style={styles.unlockButtonText}>{PIN_MESSAGES.UNLOCK_BUTTON}</Text>
                                <Feather name="unlock" size={14} color={COLORS.primary} />
                            </View>
                        </View>
                    </Pressable>
                )}

                {/* Pet Indicator */}
                <View style={styles.petIndicatorRow}>
                    <View style={styles.petIndicator}>
                        <Text style={styles.petName} numberOfLines={1}>{selectedPet?.name || ''}</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>설정</Text>
                </View>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🐱"
                        title="고양이 관리"
                        description="고양이 추가/편집/삭제"
                        onPress={() => handleNavigate('/settings/pets')}
                        disabled={isLocked}
                    />
                    <SettingItem
                        emoji="🚫"
                        title="차단 목록 관리"
                        description="쉼터 차단 사용자 관리"
                        onPress={() => handleNavigate('/settings/block-list')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🔒"
                        title="잠금(PIN) 설정"
                        description={getPinDescription()}
                        onPress={() => handleNavigate('/settings/pin')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="⭐"
                        title="구독 관리"
                        description={getSubscriptionDescription()}
                        onPress={() => handleNavigate('/settings/pro')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🧪"
                        title="참고용 메모 보관함 (베타)"
                        description="사료 기호성 / 약물 메모를 간단히 저장해둘 수 있어요"
                        onPress={() => handleNavigate('/settings/reference-memos')}
                    />
                </Card>

                {__DEV__ && (
                    <Card style={styles.card}>
                        <SettingItem
                            emoji="🧪"
                            title="알림 테스트 (Dev)"
                            description="푸시 알림 로직 검증"
                            onPress={() => handleNavigate('/settings/notification-test')}
                        />
                        <SettingItem
                            emoji="🔄"
                            title="구독 상태 리셋 (Dev)"
                            description={`현재: ${subscriptionState?.status || '로딩 중'}`}
                            onPress={async () => {
                                const { resetSubscription } = await import('../../../services');
                                await resetSubscription();
                                Alert.alert('완료', '구독 상태가 리셋되었습니다. 앱을 다시 시작하세요.');
                            }}
                        />
                        <SettingItem
                            emoji="👁️"
                            title="차단 화면 미리보기 (Dev)"
                            description="체험 만료 시 보이는 화면"
                            onPress={() => {
                                // Navigate to a preview route or use router.push with modal
                                router.push('/settings/subscription-preview' as any);
                            }}
                        />
                    </Card>
                )}

                <Card style={styles.card}>
                    <SettingItem
                        emoji="ℹ️"
                        title="앱 정보"
                        description="묘록 v1.0.0"
                        onPress={() => handleNavigate('/settings/about')}
                    />
                    <SettingItem
                        emoji="📄"
                        title="개인정보 처리방침"
                        onPress={() => { }}
                    />
                    <SettingItem
                        emoji="📋"
                        title="이용약관"
                        onPress={() => { }}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🗑️"
                        title="데이터 초기화"
                        description="모든 기록을 삭제합니다"
                        onPress={handleReset}
                        danger
                        disabled={isLocked}
                    />
                </Card>

                <View style={styles.bottomPadding} />
            </ScrollView>

            <PinInputModal
                visible={showPinModal}
                title={PIN_MESSAGES.PIN_VERIFY_TITLE}
                description={PIN_MESSAGES.PIN_VERIFY_DESCRIPTION}
                onSubmit={handlePinSubmit}
                onCancel={() => setShowPinModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    lockBanner: {
        backgroundColor: '#FFF8E1',
        borderBottomWidth: 1,
        borderBottomColor: '#FFE082',
    },
    lockBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    lockBannerText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F57C00',
    },
    unlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    unlockButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.primary,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingItemPressed: {
        opacity: 0.7,
    },
    settingItemDisabled: {
        opacity: 0.5,
    },
    settingEmoji: {
        fontSize: 22,
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    settingDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    arrow: {
        fontSize: 20,
        color: COLORS.textSecondary,
    },
    dangerText: {
        color: COLORS.error,
    },
    disabledText: {
        color: COLORS.textSecondary,
    },
    bottomPadding: {
        height: 32,
    },
    petIndicatorRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    petIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        maxWidth: 100,
    },
    petEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
});
