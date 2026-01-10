import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { purchaseSubscription, restorePurchases } from '../../services/paymentService';
import { useToast } from '../ToastContext';

/**
 * 구독 차단 화면 (통합)
 * - 체험 종료, 구독 만료, 복원 필요 등 모든 케이스에서 동일한 UI 표시
 */
export function SubscriptionBlockScreen() {
    const { logout, checkAuthStatus, setSubscriptionStatus } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

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

            // 복원 결과를 AsyncStorage에 저장 (SSOT에서 사용)
            const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
            await AsyncStorage.setItem('restore_succeeded', restored ? 'true' : 'false');

            if (restored) {
                showToast('구독이 복원되었습니다!');

                // 복원 성공 시 restore 플래그 제거 (C-2 상태 해제)
                await AsyncStorage.removeItem('restore_attempted');
                await AsyncStorage.removeItem('restore_succeeded');

                // SubscriptionManager 결제 완료 처리 (캐시 무효화 + 상태 설정)
                const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
                await SubscriptionManager.getInstance().handlePurchaseComplete();

                // 직접 구독 상태를 'active'로 설정 (서버 동기화 실패해도 UI는 즉시 전환)
                setSubscriptionStatus('active');

                // 서버 동기화는 별도 try-catch로 감싸서 실패해도 UI 전환에 영향 없음
                try {
                    const { handlePurchaseSuccess } = await import('../../services/subscription');
                    await handlePurchaseSuccess();
                } catch (syncError) {
                    console.warn('[Restore] Server sync failed, but subscription is active locally:', syncError);
                }
            } else {
                showToast('복원할 구독이 없습니다');

                // Auth 상태 다시 확인하여 loading 상태로 전환 (복원 재시도 화면 표시)
                await checkAuthStatus();
            }
        } catch (error: any) {
            console.error('Restore failed:', error);

            // 에러 시에도 복원 실패로 기록
            const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
            await AsyncStorage.setItem('restore_succeeded', 'false');

            showToast('구독 복원에 실패했습니다. 다시 시도해주세요.', { variant: 'error' });

            // Auth 상태 다시 확인하여 loading 상태로 전환 (복원 재시도 화면 표시)
            await checkAuthStatus();
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.centerSection}>
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={styles.title}>구독이 필요합니다</Text>
                    <Text style={styles.description}>
                        서비스를 계속 이용하려면{'\n'}구독을 복원하거나 새로 구독해 주세요.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.restoreButton, isRestoring && styles.buttonDisabled]}
                        onPress={handleRestore}
                        activeOpacity={0.8}
                        disabled={isLoading || isRestoring}
                    >
                        {isRestoring ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : (
                            <Text style={styles.restoreButtonText}>구독 복원하기</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.subscribeButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSubscribe}
                        activeOpacity={0.8}
                        disabled={isLoading || isRestoring}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>새로 구독하기</Text>
                        )}
                    </TouchableOpacity>

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
    logoutButton: {
        padding: 12,
    },
    logoutButtonText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textDecorationLine: 'underline',
    },
});

