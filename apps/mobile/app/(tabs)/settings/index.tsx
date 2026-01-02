import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Card, SubscriptionBlockScreen } from '../../../components';
import { useSelectedPet } from '../../../hooks/use-selected-pet';
import { useAuth } from '../../../hooks/useAuth';
import { getSubscriptionStatus, getTrialCountdownText } from '../../../services';
import { getCurrentUser } from '../../../services/auth';
import type { SubscriptionState } from '../../../services';
import type { User } from '../../../services/auth';

interface SettingItemProps {
    emoji: string;
    title: string;
    description?: string;
    onPress: () => void;
    danger?: boolean;
}

function SettingItem({ emoji, title, description, onPress, danger }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.settingItemPressed,
            ]}
            onPress={onPress}
        >
            <Text style={styles.settingEmoji}>{emoji}</Text>
            <View style={styles.settingContent}>
                <Text style={[
                    styles.settingTitle,
                    danger && styles.dangerText,
                ]}>
                    {title}
                </Text>
                {description && (
                    <Text style={styles.settingDescription}>
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
    const { logout: authLogout } = useAuth();

    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);
    const [showBlockPreview, setShowBlockPreview] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadSubscriptionStatus();
            loadCurrentUser();
        }, [])
    );

    const loadSubscriptionStatus = async () => {
        const status = await getSubscriptionStatus();
        setSubscriptionState(status);
    };

    const loadCurrentUser = async () => {
        const user = await getCurrentUser();
        console.log('[Settings] Current user:', user);
        setCurrentUser(user);
    };

    const handleLogout = async () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authLogout();
                            console.log('[Settings] Logout successful, returning to login screen');
                            // Auth context will update isLoggedIn, triggering login screen
                        } catch (error) {
                            console.error('[Settings] Logout error:', error);
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleReset = () => {
        const petName = selectedPet?.name || '현재 고양이';
        Alert.alert(
            '⚠️ 데이터 초기화',
            `"${petName}"의 모든 기록이 삭제됩니다.\n\n다른 고양이의 기록은 영향을 받지 않으며, 구독 상태도 유지됩니다.\n\n삭제된 데이터는 복구할 수 없습니다.\n\n정말 초기화하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { resetAllData } = await import('../../../services/database');
                            await resetAllData();
                            Alert.alert('완료', `"${petName}"의 모든 기록이 초기화되었습니다.`);
                        } catch (error) {
                            console.error('[Settings] Reset failed:', error);
                            Alert.alert('오류', '초기화에 실패했습니다. 다시 시도해 주세요.');
                        }
                    },
                },
            ]
        );
    };

    const handleNavigate = (path: string) => {
        router.navigate(path as any);
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
                {/* Pet Indicator */}
                <View style={styles.petIndicatorRow}>
                    <View style={styles.petIndicator}>
                        <Text style={styles.petName} numberOfLines={1}>{selectedPet?.name || ''}</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>설정</Text>
                </View>

                {/* 계정 섹션 */}
                {currentUser && (
                    <Card style={styles.card}>
                        <View style={styles.accountSection}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountLabel}>로그인 계정</Text>
                                <Text style={styles.accountNickname}>{currentUser.nickname}</Text>
                            </View>
                        </View>
                    </Card>
                )}

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🐱"
                        title="고양이 관리"
                        description="고양이 추가/편집/삭제"
                        onPress={() => handleNavigate('/settings/pets')}
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
                        emoji="⭐"
                        title="구독 관리"
                        description={getSubscriptionDescription()}
                        onPress={() => handleNavigate('/settings/pro')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🔔"
                        title="알림 설정"
                        description="댓글, 미활동, 마케팅 알림 관리"
                        onPress={() => handleNavigate('/settings/notifications')}
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

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🧪"
                        title="알림 테스트 (Dev)"
                        description="푸시 알림 로직 검증"
                        onPress={() => handleNavigate('/settings/notification-test')}
                    />
                    <SettingItem
                        emoji="⏰"
                        title="체험 종료 알림 테스트 (Dev)"
                        description="10초 뒤 체험 종료 알림 발송"
                        onPress={async () => {
                            try {
                                const Constants = await import('expo-constants');

                                // Check for Expo Go
                                if (Constants.default.executionEnvironment === 'storeClient') {
                                    Alert.alert('알림', 'Expo Go에서는 로컬 알림이 지원되지 않습니다.');
                                    return;
                                }

                                const Notifications = require('expo-notifications');

                                // Cancel existing trial end notifications
                                const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
                                for (const notification of scheduledNotifications) {
                                    if (notification.content?.data?.type === 'TRIAL_END') {
                                        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                                    }
                                }

                                // Schedule test notification in 10 seconds
                                await Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: '무료 체험이 곧 종료됩니다!',
                                        body: '무료 체험 기간 동안 기록을 즐겨보셨나요? 체험이 내일 종료됩니다. 계속 사용하려면 구독이 필요합니다.',
                                        sound: 'default',
                                        data: {
                                            type: 'TRIAL_END',
                                            action: 'GO_TO_SUBSCRIBE',
                                        },
                                    },
                                    trigger: {
                                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                                        seconds: 10,
                                    },
                                });

                                Alert.alert(
                                    '테스트 알림 예약 완료',
                                    '10초 뒤 체험 종료 알림이 발송됩니다.\n\n알림을 탭하면 구독 화면으로 이동하고,\nlastTrialPushAt이 DB에 기록됩니다.',
                                    [{ text: '확인' }]
                                );
                            } catch (error) {
                                console.error('[Settings] Trial notification test failed:', error);
                                Alert.alert('오류', '알림 예약에 실패했습니다.');
                            }
                        }}
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
                        onPress={() => setShowBlockPreview(true)}
                    />
                    <SettingItem
                        emoji="📊"
                        title="1년 테스트 데이터 생성 (Dev)"
                        description="365일치 무작위 기록 생성"
                        onPress={async () => {
                            Alert.alert(
                                '테스트 데이터 생성',
                                '1년(365일)치 무작위 데이터를 생성합니다. 기존 데이터가 없는 날짜에만 추가됩니다.',
                                [
                                    { text: '취소', style: 'cancel' },
                                    {
                                        text: '생성',
                                        onPress: async () => {
                                            try {
                                                const { generateTestData } = await import('../../../services/testDataGenerator');
                                                const result = await generateTestData();
                                                Alert.alert('완료', `${result.recordsCreated}개의 기록이 생성되었습니다.`);
                                            } catch (error) {
                                                console.error('Test data generation failed:', error);
                                                Alert.alert('오류', '데이터 생성에 실패했습니다.');
                                            }
                                        },
                                    },
                                ]
                            );
                        }}
                    />
                </Card>

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
                        onPress={() => Linking.openURL('https://myorok.vercel.app/privacy')}
                    />
                    <SettingItem
                        emoji="📋"
                        title="이용약관"
                        onPress={() => Linking.openURL('https://myorok.vercel.app/terms')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🗑️"
                        title="데이터 초기화"
                        description={`${selectedPet?.name || '현재 고양이'}의 모든 기록 삭제`}
                        onPress={handleReset}
                        danger
                    />
                </Card>

                {/* 로그아웃 버튼 */}
                {currentUser ? (
                    <View style={styles.logoutContainer}>
                        <Pressable
                            style={styles.smallLogoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.smallLogoutText}>로그아웃</Text>
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Subscription Block Screen Preview */}
            <SubscriptionBlockScreen
                visible={showBlockPreview}
                onDismiss={() => setShowBlockPreview(false)}
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
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    accountSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    accountInfo: {
        flex: 1,
    },
    accountLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    accountNickname: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.error,
    },
    logoutContainer: {
        alignItems: 'center',
        paddingTop: 25,
    },
    smallLogoutButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    smallLogoutText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        opacity: 0.5,
    },
});
