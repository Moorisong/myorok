import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { purchaseSubscription, restorePurchases } from '../../services/paymentService';
import { getSubscriptionStatus } from '../../services/subscription';
import { useToast } from '../ToastContext';

/**
 * 차단 사유 타입
 * - expired: 일반 만료 (체험 종료, 구독 만료)
 * - purchase_without_entitlement: CASE J (결제 이력 O, 권한 X)
 */
type BlockReason = 'expired' | 'purchase_without_entitlement';

export function SubscriptionBlockScreen() {
    const { logout, checkAuthStatus } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [blockReason, setBlockReason] = useState<BlockReason>('expired');

    // 차단 사유 확인
    useEffect(() => {
        const checkBlockReason = async () => {
            try {
                const status = await getSubscriptionStatus();
                // CASE J: 결제 이력이 있는데 권한이 없음
                if (status.hasPurchaseHistory && status.status === 'blocked') {
                    setBlockReason('purchase_without_entitlement');
                } else {
                    setBlockReason('expired');
                }
            } catch (error) {
                console.error('[BlockScreen] Failed to check block reason:', error);
            }
        };
        checkBlockReason();
    }, []);

    const handleSubscribe = async () => {
        if (isLoading || isRestoring) return;

        try {
            setIsLoading(true);
            await purchaseSubscription();
            // Purchase success is handled by the global purchase listener in _layout.tsx
        } catch (error: any) {
            console.error('Purchase failed:', error);
            if (error.code !== 'E_USER_CANCELLED') {
                showToast(error.message || '결제 요청에 실패했습니다', { variant: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        if (isLoading || isRestoring) return;

        try {
            setIsRestoring(true);
            showToast('구매 내역을 복원하고 있습니다...');

            const restored = await restorePurchases();

            if (restored) {
                showToast('구독이 복원되었습니다!');

                // SSOT: 복원 성공 시 서버 동기화를 위해 handlePurchaseSuccess 호출
                const { handlePurchaseSuccess } = await import('../../services/subscription');
                await handlePurchaseSuccess();

                // Auth 상태 다시 확인하여 화면 전환
                await checkAuthStatus();
            } else {
                showToast('복원할 구독이 없습니다');
            }
        } catch (error: any) {
            console.error('Restore failed:', error);
            showToast('구매 복원에 실패했습니다. 다시 시도해주세요.', { variant: 'error' });
        } finally {
            setIsRestoring(false);
        }
    };

    // CASE J: 결제 이력이 있는데 권한이 없는 경우 특별 메시지
    const isCaseJ = blockReason === 'purchase_without_entitlement';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.centerSection}>
                    <Text style={styles.icon}>{isCaseJ ? '⚠️' : '🔒'}</Text>
                    <Text style={styles.title}>
                        {isCaseJ ? '구독 복원이 필요합니다' : '구독이 만료되었습니다'}
                    </Text>
                    <Text style={styles.description}>
                        {isCaseJ ? (
                            '이전에 구독하신 내역이 있습니다.\n아래 버튼을 눌러 구독을 복원해주세요.'
                        ) : (
                            '더 이상 기록을 작성하거나 조회할 수 없습니다.\n계속 이용하려면 구독을 갱신해주세요.'
                        )}
                    </Text>
                </View>

                <View style={styles.footer}>
                    {/* CASE J: 구매 복원 버튼을 먼저 표시 */}
                    {isCaseJ && (
                        <TouchableOpacity
                            style={[styles.restoreButton, isRestoring && styles.buttonDisabled]}
                            onPress={handleRestore}
                            activeOpacity={0.8}
                            disabled={isLoading || isRestoring}
                        >
                            {isRestoring ? (
                                <ActivityIndicator color={COLORS.primary} />
                            ) : (
                                <Text style={styles.restoreButtonText}>구매 복원하기</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.subscribeButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSubscribe}
                        activeOpacity={0.8}
                        disabled={isLoading || isRestoring}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>
                                {isCaseJ ? '새로 구독하기' : '구독 갱신하기'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* 일반 만료 시에도 복원 버튼 제공 (작게) */}
                    {!isCaseJ && (
                        <TouchableOpacity
                            style={styles.smallRestoreButton}
                            onPress={handleRestore}
                            disabled={isLoading || isRestoring}
                        >
                            <Text style={styles.smallRestoreButtonText}>
                                {isRestoring ? '복원 중...' : '이전 구독 복원하기'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={logout}
                        disabled={isLoading || isRestoring}
                    >
                        <Text style={styles.logoutButtonText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        zIndex: 9999,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 60,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    subscribeButton: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    subscribeButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    restoreButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    restoreButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
    },
    smallRestoreButton: {
        padding: 12,
    },
    smallRestoreButtonText: {
        fontSize: 14,
        color: COLORS.primary,
    },
    logoutButton: {
        padding: 12,
    },
    logoutButtonText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textDecorationLine: 'underline',
    },
});

