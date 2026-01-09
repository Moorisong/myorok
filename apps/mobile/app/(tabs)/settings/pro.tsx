import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card, Button } from '../../../components';
import {
    getSubscriptionStatus,
    getTrialCountdownText,
    getSubscriptionState,
    startTrialSubscription,
    handlePurchaseSuccess,
    checkAndRestoreSubscription
} from '../../../services';
import type { SubscriptionState } from '../../../services';
import { purchaseSubscription, getSubscriptionDetails } from '../../../services/paymentService';
import type { SubscriptionDetails } from '../../../services/paymentService';
import { showToast } from '../../../utils/toast';
import { useAuth } from '../../../hooks/useAuth';

const FEATURES = [
    { emoji: '📝', title: '모든 기록 기능', description: '배변/구토/사료/약/병원 기록' },
    { emoji: '📊', title: '전체 기간 차트', description: '과거부터 현재까지 모든 데이터' },
    { emoji: '🏥', title: '병원용 차트', description: '진료 시 보여줄 수 있는 전문 차트' },
    { emoji: '📈', title: '무제한 커스텀 수치', description: '혈액검사 수치를 무제한으로 추적' },
];

export default function ProScreen() {
    const router = useRouter();
    const { checkAuthStatus } = useAuth();
    const appState = useRef(AppState.currentState);
    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);
    const [simpleState, setSimpleState] = useState<'free' | 'trial' | 'active' | 'expired'>('free');
    const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);

    // Focus 시 데이터 로드
    useFocusEffect(
        useCallback(() => {
            loadSubscriptionStatus();
        }, [])
    );

    // 앱이 foreground로 돌아올 때 구독 상태 새로고침
    // (결제 완료 후 또는 Google Play에서 해지하고 돌아왔을 때)
    // NOTE: _layout.tsx의 전역 AppState 리스너가 먼저 동작하므로,
    // 여기서는 단순히 로컬 상태만 업데이트
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('[ProScreen] App returned to foreground, reloading subscription status');
                // 로컬 상태만 새로고침 (_layout.tsx가 이미 SSOT 검증을 수행함)
                await loadSubscriptionStatus();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    const loadSubscriptionStatus = async () => {
        const status = await getSubscriptionStatus();
        setSubscriptionState(status);

        const state = await getSubscriptionState();
        setSimpleState(state);

        // 구독 상세 정보 조회 (해지 예정 여부 포함)
        if (state === 'active') {
            const details = await getSubscriptionDetails();
            setSubscriptionDetails(details);
        }
    };

    const formatDate = (isoDate: string | undefined, fallback: string = '곧') => {
        if (!isoDate) return fallback;
        const date = new Date(isoDate);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const handleSubscribe = async () => {
        try {
            // 결제 요청 시작 (결제창만 띄움)
            // 실제 결제 완료/에러는 _layout.tsx의 listener에서 처리됨
            await purchaseSubscription();
        } catch (error: any) {
            console.error('Subscription error:', error);

            // 이미 구독 중인 경우 Google Play에서 에러 발생
            // Google Play 구독 상태를 확인하고 동기화
            try {
                showToast('구독 상태 확인 중...', 'info');
                await checkAndRestoreSubscription();
                await loadSubscriptionStatus();

                // 동기화 후 구독 상태 확인
                const state = await getSubscriptionState();
                if (state === 'active') {
                    setSimpleState('active');
                    showToast('이미 구독 중입니다', 'success');
                } else {
                    showToast('결제 요청 실패', 'error');
                }
            } catch (restoreError) {
                console.error('Restore check error:', restoreError);
                showToast('결제 요청 실패', 'error');
            }
        }
    };

    const handleStartTrial = async () => {
        try {
            await startTrialSubscription();
            await loadSubscriptionStatus();
            setSimpleState('trial');
            showToast('무료 체험이 시작되었습니다', 'success');
        } catch (error) {
            console.error('Trial start error:', error);
            showToast('오류가 발생했습니다', 'error');
        }
    };

    const handleCancelSubscription = () => {
        Linking.openURL('https://play.google.com/store/account/subscriptions');
    };

    const getStatusMessage = () => {
        if (!subscriptionState) return '';

        if (subscriptionState.status === 'trial') {
            return `${getTrialCountdownText(subscriptionState.daysRemaining || 0)}`;
        } else if (subscriptionState.status === 'subscribed') {
            return '구독 중';
        } else {
            return '무료 체험 종료';
        }
    };

    const isSubscribed = subscriptionState?.status === 'subscribed';

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
                <Text style={styles.headerTitle}>구독 관리</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                {/* 상태별 UI 분기 */}
                {simpleState === 'active' && (
                    <View style={[
                        styles.activeSubscription,
                        subscriptionDetails?.autoRenewing === false && styles.cancelledSubscription
                    ]}>
                        {subscriptionDetails?.autoRenewing === false ? (
                            <>
                                <Text style={styles.cancelledText}>⚠️ 해지 예정</Text>
                                <Text style={styles.cancelledSubtext}>
                                    {subscriptionDetails?.expiryDate
                                        ? `${formatDate(subscriptionDetails.expiryDate)}에 해지됩니다`
                                        : '곧 해지됩니다'}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.activeText}>✓ 구독 중</Text>
                                <Text style={styles.activeSubtext}>
                                    다음 결제일: {formatDate(subscriptionDetails?.expiryDate)}
                                </Text>
                            </>
                        )}
                    </View>
                )}

                {simpleState === 'trial' && (
                    <View style={styles.trialSubscription}>
                        <Text style={styles.trialText}>무료 체험 중</Text>
                        <Text style={styles.trialSubtext}>무료 체험 기간: 최대 7일</Text>
                    </View>
                )}

                {(simpleState === 'free' || simpleState === 'expired') && (
                    <View style={styles.freeSubscription}>
                        <Text style={styles.freeText}>무료 사용자</Text>
                    </View>
                )}

                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>⭐</Text>
                    <Text style={styles.heroTitle}>묘록 구독</Text>
                    <Text style={styles.heroSubtitle}>
                        반려묘의 소중한 기록을{'\n'}완벽하게 관리하세요
                    </Text>
                </View>

                {!isSubscribed && (
                    <Card style={styles.card}>
                        <Text style={styles.infoTitle}>📦 데이터는 안전하게 보관됩니다</Text>
                        <Text style={styles.infoText}>
                            무료 체험 중 기록한 모든 데이터는 삭제되지 않습니다.
                            구독하시면 언제든지 다시 확인하실 수 있습니다.
                        </Text>
                    </Card>
                )}

                <Card style={styles.card}>
                    <Text style={styles.featuresTitle}>이용 가능한 모든 기능</Text>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </Card>

                {!isSubscribed && (
                    <>
                        <View style={styles.priceBox}>
                            <Text style={styles.priceLabel}>월 구독료</Text>
                            <Text style={styles.price}>₩3,500</Text>
                            <Text style={styles.priceNote}>하루 110원으로 우리 고양이 기록 습관 만들기</Text>
                        </View>

                        {/* 구독 시작 / 결제하기 버튼 */}
                        {simpleState !== 'active' && (
                            <TouchableOpacity
                                style={styles.subscribeButton}
                                onPress={handleSubscribe}
                            >
                                <Text style={styles.subscribeButtonText}>구독 시작 / 결제하기</Text>
                            </TouchableOpacity>
                        )}

                        {/* 무료 체험 시작 버튼 */}
                        {simpleState === 'free' && (
                            <TouchableOpacity
                                style={styles.trialButton}
                                onPress={handleStartTrial}
                            >
                                <Text style={styles.trialButtonText}>무료 체험 시작</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.disclaimer}>
                            구매 시 Google Play 계정으로 결제됩니다.{'\n'}
                            언제든지 해지 가능합니다.
                        </Text>
                    </>
                )}

                {isSubscribed && (
                    <>
                        {subscriptionDetails?.autoRenewing === false ? (
                            /* 해지 예정 상태 */
                            <>
                                <Card style={styles.card}>
                                    <Text style={styles.cancelledInfoTitle}>📅 해지 예정</Text>
                                    <Text style={styles.cancelledInfoText}>
                                        {subscriptionDetails?.expiryDate
                                            ? `${formatDate(subscriptionDetails.expiryDate)}까지 모든 기능을 사용하실 수 있습니다.`
                                            : '만료일까지 모든 기능을 사용하실 수 있습니다.'}{"\n"}
                                        이후 구독이 자동으로 해지됩니다.
                                    </Text>
                                </Card>

                                <View style={styles.resubscribeSection}>
                                    <Text style={styles.resubscribeInfo}>
                                        💡 구독을 계속하시려면 다시 구독해 주세요
                                    </Text>
                                    <Pressable
                                        onPress={handleSubscribe}
                                        style={styles.resubscribeButton}
                                    >
                                        <Text style={styles.resubscribeButtonText}>다시 구독하기</Text>
                                    </Pressable>
                                </View>
                            </>
                        ) : (
                            /* 정상 구독 상태 */
                            <>
                                <Card style={styles.card}>
                                    <Text style={styles.subscribedTitle}>✅ 구독 활성화</Text>
                                    <Text style={styles.subscribedText}>
                                        현재 모든 기능을 무제한으로 사용하실 수 있습니다.
                                    </Text>
                                </Card>

                                <View style={styles.cancelSection}>
                                    <Text style={styles.cancelInfo}>
                                        ℹ️ 구독은 언제든지 취소할 수 있습니다.
                                    </Text>
                                    <Pressable
                                        onPress={handleCancelSubscription}
                                        style={styles.cancelLink}
                                    >
                                        <Text style={styles.cancelLinkText}>구독 해지하기 →</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </>
                )}

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
    content: {
        flex: 1,
    },
    statusBadge: {
        alignSelf: 'center',
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    heroEmoji: {
        fontSize: 60,
        marginBottom: 12,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    featureEmoji: {
        fontSize: 24,
        marginRight: 14,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    featureDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    priceBox: {
        alignItems: 'center',
        marginTop: 32,
        paddingVertical: 24,
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    price: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    priceNote: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    purchaseButton: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    disclaimer: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 18,
    },
    subscribedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 8,
    },
    subscribedText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    cancelSection: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    cancelInfo: {
        fontSize: 13,
        color: '#888',
        marginBottom: 8,
        textAlign: 'center',
    },
    cancelLink: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 44,
    },
    cancelLinkText: {
        fontSize: 14,
        color: '#888',
        textDecorationLine: 'none',
    },
    bottomPadding: {
        height: 16,
    },
    subscribeButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 8,
        marginHorizontal: 16,
    },
    subscribeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    trialButton: {
        backgroundColor: '#34C759',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 8,
        marginHorizontal: 16,
    },
    trialButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    activeSubscription: {
        padding: 16,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
    },
    activeText: {
        color: '#2E7D32',
        fontSize: 18,
        fontWeight: '700',
    },
    activeSubtext: {
        color: '#4CAF50',
        fontSize: 14,
        marginTop: 4,
    },
    trialSubscription: {
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
    },
    trialText: {
        color: '#1976D2',
        fontSize: 18,
        fontWeight: '700',
    },
    trialSubtext: {
        color: '#42A5F5',
        fontSize: 14,
        marginTop: 4,
    },
    freeSubscription: {
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
    },
    freeText: {
        color: '#757575',
        fontSize: 18,
        fontWeight: '700',
    },
    cancelledSubscription: {
        backgroundColor: '#FFF3E0',
    },
    cancelledText: {
        color: '#E65100',
        fontSize: 18,
        fontWeight: '700',
    },
    cancelledSubtext: {
        color: '#FB8C00',
        fontSize: 14,
        marginTop: 4,
    },
    cancelledInfoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E65100',
        marginBottom: 8,
    },
    cancelledInfoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    resubscribeSection: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    resubscribeInfo: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
        textAlign: 'center',
    },
    resubscribeButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resubscribeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

