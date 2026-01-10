import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Card } from '../../../components';
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
    const { logout: authLogout, isAdmin } = useAuth();

    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTestCase, setActiveTestCase] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadSubscriptionStatus();
            loadCurrentUser();
            loadTestStatus();
        }, [])
    );

    const loadSubscriptionStatus = async () => {
        const status = await getSubscriptionStatus();
        setSubscriptionState(status);
    };

    const loadCurrentUser = async () => {
        const user = await getCurrentUser();
        setCurrentUser(user);
    };

    const loadTestStatus = async () => {
        try {
            const TestUserManager = (await import('../../../services/testUserManager')).default;
            const testManager = TestUserManager.getInstance();
            const status = await testManager.getTestStatus();
            setActiveTestCase(status.testCaseId);
        } catch (e) {
            setActiveTestCase(null);
        }
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
        } else if (subscriptionState.status === 'subscribed') {
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
                    <Pressable
                        style={styles.petIndicator}
                        onPress={() => router.push('/(tabs)/settings/pets')}
                    >
                        <Text style={styles.petName} numberOfLines={1} pointerEvents="none">{selectedPet?.name || ''}</Text>
                    </Pressable>
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
                        description="댓글, 미활동 알림 관리"
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

                {/* 운영자 전용 섹션 */}
                {isAdmin && (
                    <Card style={styles.card}>
                        <SettingItem
                            emoji="📊"
                            title="운영자 대시보드"
                            description="서비스 현황 확인"
                            onPress={() => handleNavigate('/admin/dashboard')}
                        />
                    </Card>
                )}


                {__DEV__ && (
                    <Card style={styles.card}>
                        {/* 테스트 상태 표시 */}
                        {activeTestCase && (
                            <View style={styles.testStatusBanner}>
                                <Text style={styles.testStatusText}>
                                    🧪 테스트 모드: {activeTestCase}
                                </Text>
                            </View>
                        )}
                        <SettingItem
                            emoji="✅"
                            title="테스트 모드 해제"
                            description={activeTestCase ? `현재: ${activeTestCase} → 원래 계정 복귀` : '활성 테스트 없음'}
                            onPress={async () => {
                                if (!activeTestCase) {
                                    Alert.alert('알림', '현재 활성화된 테스트가 없습니다.');
                                    return;
                                }
                                try {
                                    const { endTestMode } = await import('../../../services/subscription');
                                    await endTestMode();
                                    await loadTestStatus();
                                    Alert.alert('완료', '테스트 모드가 해제되었습니다.\n원래 계정으로 복귀했습니다.\n\n앱을 재시작(r)해주세요.');
                                } catch (error) {
                                    console.error('[Settings] End test mode failed:', error);
                                    Alert.alert('오류', '테스트 모드 해제 실패');
                                }
                            }}
                        />
                        <SettingItem
                            emoji="⏰"
                            title="무료체험 종료 (서버)"
                            description="현재 유저의 체험 기간을 서버에서 만료시킴"
                            onPress={async () => {
                                Alert.alert(
                                    '체험 만료',
                                    '현재 유저의 무료체험을 즉시 만료시킵니다.\n(서버 상태 변경)\n\n기대 결과: 앱 재시작 후 차단 화면',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '만료 실행',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const { expireTrial } = await import('../../../services/subscription');
                                                    await expireTrial();
                                                    Alert.alert('완료', '체험이 만료되었습니다.\n\n앱을 재시작(r)해주세요.');
                                                } catch (e) {
                                                    console.error(e);
                                                    Alert.alert('오류', '체험 만료 실패');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        />
                        {/* B 시리즈 */}
                        <SettingItem
                            emoji="🚫"
                            title="Test Case B-1 (구독 만료)"
                            description={`강제 만료 처리 | 현재: ${subscriptionState?.status || '로딩 중'}`}
                            onPress={async () => {
                                try {
                                    const SubscriptionManager = (await import('../../../services/SubscriptionManager')).default;
                                    const manager = SubscriptionManager.getInstance();
                                    await manager.setTestMode(true);

                                    const { deactivateSubscription } = await import('../../../services');
                                    await deactivateSubscription();
                                    await loadSubscriptionStatus();
                                    Alert.alert('완료', '구독이 만료 상태로 변경되었습니다.\n\n⚠️ Google Play 복원이 비활성화됩니다.');
                                } catch (error) {
                                    console.error('[Settings] Deactivate subscription failed:', error);
                                }
                            }}
                        />
                        {/* C 시리즈 */}
                        <SettingItem
                            emoji="📜"
                            title="Test Case C-1 (결제이력O+만료)"
                            description={activeTestCase === 'C-1' ? '✓ 현재 실행 중' : '독립 테스트 userId 사용'}
                            onPress={() => {
                                Alert.alert(
                                    'Test Case C-1',
                                    '독립된 테스트 계정으로 결제 이력은 있지만 만료된 상태를 시뮬레이션합니다.\n\n✓ 원래 계정 데이터 보존\n✓ 다른 테스트와 격리됨\n\n기대 결과: 구독 복원 화면',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '실행',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const { setupTestCase_C1 } = await import('../../../services/subscription');
                                                    await setupTestCase_C1();
                                                    await loadTestStatus();
                                                    Alert.alert('완료', 'C-1 테스트 설정 완료.\n\n앱을 재시작(r)해주세요.\n\n기대 결과: 구독 복원 화면');
                                                } catch (e) {
                                                    console.error(e);
                                                    Alert.alert('오류', '설정 실패');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        />
                        <SettingItem
                            emoji="🔄"
                            title="Test Case C-2 (Restore 실패)"
                            description={activeTestCase === 'C-2' ? '✓ 현재 실행 중' : '독립 테스트 userId 사용'}
                            onPress={() => {
                                Alert.alert(
                                    'Test Case C-2',
                                    '독립된 테스트 계정으로 복원 실패 상태를 시뮬레이션합니다.\n\n✓ 원래 계정 데이터 보존\n✓ 다른 테스트와 격리됨\n\n기대 결과: 복원 재시도 화면',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '실행',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const { setupTestCase_C2 } = await import('../../../services/subscription');
                                                    await setupTestCase_C2();
                                                    await loadTestStatus();
                                                    Alert.alert('완료', 'C-2 테스트 설정 완료.\n\n앱을 재시작(r)해주세요.\n\n기대 결과: 복원 재시도 화면');
                                                } catch (e) {
                                                    console.error(e);
                                                    Alert.alert('오류', '설정 실패');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        />
                        {/* D 시리즈 */}
                        <SettingItem
                            emoji="📡"
                            title="Test Case D-1 (신규+네트워크없음)"
                            description="Google Play 복원 건너뛰기 + 로컬 초기화"
                            onPress={async () => {
                                Alert.alert(
                                    'Case D-1 설정',
                                    '구독 없는 신규 유저가 네트워크 없이 앱을 실행하는 상황을 시뮬레이션합니다.\n\n1. Google Play 복원 비활성화\n2. 로컬 구독 데이터 초기화\n3. 비행기 모드 ON\n4. 앱 재시작\n\n기대 결과: loading 상태 유지',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '실행',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const SubscriptionManager = (await import('../../../services/SubscriptionManager')).default;
                                                    const manager = SubscriptionManager.getInstance();
                                                    await manager.setTestMode(true, false);

                                                    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                                                    await AsyncStorage.removeItem('subscription_status');
                                                    await AsyncStorage.removeItem('subscription_expiry_date');
                                                    await AsyncStorage.removeItem('subscription_start_date');
                                                    await AsyncStorage.removeItem('trial_start_date');
                                                    await AsyncStorage.removeItem('has_purchase_history');
                                                    await AsyncStorage.removeItem('entitlement_active');
                                                    await AsyncStorage.removeItem('restore_attempted');
                                                    await AsyncStorage.removeItem('restore_succeeded');

                                                    Alert.alert(
                                                        '설정 완료',
                                                        'D-1 테스트 준비 완료!\n\n다음 단계:\n1. 비행기 모드 ON\n2. 앱 재시작 (r)\n\n기대 결과: loading 화면 유지\n(trial/active로 진입하면 실패)'
                                                    );
                                                } catch (e) {
                                                    console.error(e);
                                                    Alert.alert('오류', '설정 실패');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        />
                        <SettingItem
                            emoji="🔥"
                            title="Test Case D-2 (서버 500 에러)"
                            description="SSOT 검증 시 강제 에러 발생"
                            onPress={async () => {
                                Alert.alert(
                                    'Case D-2 설정',
                                    '서버 API 실패(500/타임아웃)를 시뮬레이션합니다.\n\n1. 강제 서버 에러 플래그 설정\n2. 로컬 구독 데이터 초기화\n3. 앱 재시작\n\n기대 결과: loading 상태 + 재시도 가능',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '실행',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

                                                    const SubscriptionManager = (await import('../../../services/SubscriptionManager')).default;
                                                    const manager = SubscriptionManager.getInstance();
                                                    await manager.setTestMode(true, false);

                                                    await AsyncStorage.setItem('dev_force_server_error', 'true');
                                                    await AsyncStorage.removeItem('subscription_status');
                                                    await AsyncStorage.removeItem('subscription_expiry_date');
                                                    await AsyncStorage.removeItem('subscription_start_date');
                                                    await AsyncStorage.removeItem('trial_start_date');
                                                    await AsyncStorage.removeItem('has_purchase_history');
                                                    await AsyncStorage.removeItem('entitlement_active');
                                                    await AsyncStorage.removeItem('restore_attempted');
                                                    await AsyncStorage.removeItem('restore_succeeded');

                                                    Alert.alert(
                                                        '설정 완료',
                                                        'D-2 테스트 준비 완료!\n\n앱을 재시작 (r)하세요.\n\n기대 결과: loading 화면 유지\n(재시도 버튼 표시)'
                                                    );
                                                } catch (e) {
                                                    console.error(e);
                                                    Alert.alert('오류', '설정 실패');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        />
                        {/* 유틸리티 */}
                        <SettingItem
                            emoji="⏰"
                            title="무료 체험 24시간 남음 (Dev)"
                            description="체험 상태를 24시간 전으로 설정"
                            onPress={async () => {
                                try {
                                    const { setTrialExpiringTestMode } = await import('../../../services');
                                    await setTrialExpiringTestMode();
                                    await loadSubscriptionStatus();
                                    Alert.alert(
                                        '테스트 모드 설정 완료',
                                        '무료 체험이 24시간 남은 상태로 설정되었습니다.\n\n10초 후 체험 종료 알림이 자동으로 스케줄링됩니다.',
                                        [{ text: '확인' }]
                                    );
                                } catch (error) {
                                    console.error('[Settings] Set trial expiring test mode failed:', error);
                                    Alert.alert('오류', '테스트 모드 설정에 실패했습니다.');
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
                                Alert.alert('완료', '구독 상태가 리셋되었습니다. 앱을 수동으로 재실행(r)해주세요.');
                            }}
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
    testStatusBanner: {
        backgroundColor: '#FFF3CD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    testStatusText: {
        color: '#856404',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
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
