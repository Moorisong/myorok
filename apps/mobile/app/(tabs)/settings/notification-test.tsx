import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card, Button } from '../../../components';
import { getDeviceId } from '../../../services/device';
import {
    scheduleTestNotification,
    registerForPushNotificationsAsync,
    sendTokenToBackend
} from '../../../services/NotificationService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export default function NotificationTestScreen() {
    const router = useRouter();

    const [deviceId, setDeviceId] = useState('');
    const [tokenRegistered, setTokenRegistered] = useState<boolean | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initializeScreen();
    }, []);

    const initializeScreen = async () => {
        const id = await getDeviceId();
        setDeviceId(id);
        await checkTokenStatus(id);
    };

    const checkTokenStatus = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/comfort/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get-device-info',
                    deviceId: id
                })
            });
            const json = await response.json();
            setTokenRegistered(!!json.device?.pushToken);
        } catch (error) {
            console.error('Token status check failed:', error);
            setTokenRegistered(null);
        }
    };

    const handleRegisterToken = async () => {
        try {
            setLoading(true);
            setStatusMessage('토큰 등록 중...');

            const token = await registerForPushNotificationsAsync();
            if (!token) {
                const errorMessage =
                    '토큰 발급 실패\n\n' +
                    '가능한 원인:\n' +
                    '1. Expo Go 사용 중 (SDK 53+ 미지원)\n' +
                    '2. 시뮬레이터 사용 중 (실기기 필요)\n' +
                    '3. 알림 권한 거부됨\n' +
                    '4. Firebase 미설정 (Android)\n\n' +
                    '콘솔 로그를 확인하세요.';

                setStatusMessage('✗ 토큰 발급 실패 (콘솔 확인)');
                Alert.alert('토큰 발급 실패', errorMessage);
                return;
            }

            await sendTokenToBackend(deviceId, token);
            setTokenRegistered(true);
            setStatusMessage('✓ 토큰이 성공적으로 등록되었습니다');

            Alert.alert('성공', '푸시 토큰이 등록되었습니다. 이제 원격 푸시를 받을 수 있습니다.');
        } catch (error) {
            console.error('Token registration failed:', error);
            setStatusMessage(`✗ 등록 실패: ${error}`);
            Alert.alert('오류', '토큰 등록에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleLocalNotificationTest = async () => {
        try {
            setLoading(true);
            setStatusMessage('로컬 알림 예약 중...');

            const result = await scheduleTestNotification(10);
            console.log('[Test] Local notification scheduled:', result);

            // Check if notification was actually scheduled
            const Notifications = require('expo-notifications');
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            console.log('[Test] All scheduled notifications:', scheduled);

            setStatusMessage(`✓ 10초 후 알림이 도착합니다 (ID: ${scheduled.length}개 예약됨)`);
            Alert.alert(
                '알림 예약 완료',
                `10초 후 로컬 알림이 발송됩니다.\n\n현재 예약된 알림: ${scheduled.length}개\n\n알림을 받으려면 앱을 백그라운드로 전환하세요.`,
                [{ text: '확인' }]
            );
        } catch (error) {
            console.error('Local notification test failed:', error);
            setStatusMessage(`✗ 예약 실패: ${error}`);
            Alert.alert('오류', `알림 예약에 실패했습니다.\n\n${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRemotePushTest = async () => {
        if (!tokenRegistered) {
            Alert.alert(
                '토큰 미등록',
                '먼저 푸시 토큰을 등록해야 합니다.\n\n"토큰 재등록" 버튼을 눌러주세요.',
                [{ text: '확인' }]
            );
            return;
        }

        try {
            setLoading(true);
            setStatusMessage('원격 푸시 발송 중...');

            const response = await fetch(`${API_URL}/api/comfort/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'simulate-push-no-cooldown',
                    deviceId,
                    title: '댓글 알림 테스트',
                    body: '새로운 댓글이 달렸습니다!'
                })
            });

            const json = await response.json();
            console.log('[Test] Remote push response:', JSON.stringify(json, null, 2));

            if (json.success && json.pushResult?.status === 'sent') {
                setStatusMessage('✓ 푸시 발송 성공! 알림을 확인하세요');
                Alert.alert('성공', '푸시 알림이 발송되었습니다!');
            } else if (json.pushResult?.status === 'error') {
                setStatusMessage(`✗ 발송 실패: ${json.pushResult.message}`);
                Alert.alert('오류', json.pushResult.message || '푸시 발송에 실패했습니다.');
            } else if (json.pushResult?.status === 'skipped') {
                setStatusMessage(`⚠ 발송 건너뜀: ${json.pushResult.message}`);
                Alert.alert('알림', json.pushResult.message || '푸시가 건너뛰어졌습니다.');
            } else {
                const debugInfo = `상태: ${json.pushResult?.status || 'undefined'}\n메시지: ${json.pushResult?.message || 'undefined'}\n전체 응답: ${JSON.stringify(json)}`;
                setStatusMessage(`⚠ ${json.pushResult?.message || '알 수 없는 상태'}`);
                Alert.alert('디버그 정보', debugInfo);
            }
        } catch (error) {
            console.error('Remote push test failed:', error);
            setStatusMessage(`✗ 네트워크 오류: ${error}`);
            Alert.alert('오류', '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getTokenStatusIcon = () => {
        if (tokenRegistered === null) return { name: 'help-circle', color: COLORS.textSecondary };
        if (tokenRegistered) return { name: 'check-circle', color: COLORS.primary };
        return { name: 'x-circle', color: COLORS.error };
    };

    const getTokenStatusText = () => {
        if (tokenRegistered === null) return '확인 중...';
        if (tokenRegistered) return '등록됨';
        return '미등록';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>알림 테스트</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Device Info */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>기기 정보</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Device ID</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {deviceId || '로딩 중...'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>푸시 토큰</Text>
                        <View style={styles.tokenStatus}>
                            <Feather
                                name={getTokenStatusIcon().name as any}
                                size={16}
                                color={getTokenStatusIcon().color}
                            />
                            <Text style={[styles.infoValue, { color: getTokenStatusIcon().color }]}>
                                {getTokenStatusText()}
                            </Text>
                        </View>
                    </View>

                    <Button
                        title="토큰 재등록"
                        onPress={handleRegisterToken}
                        variant="secondary"
                        disabled={loading}
                        style={{ marginTop: 12 }}
                    />
                </Card>

                {/* Test Buttons */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>알림 테스트</Text>

                    {/* Local Notification Test */}
                    <Pressable
                        style={styles.testButton}
                        onPress={handleLocalNotificationTest}
                        disabled={loading}
                    >
                        <View style={styles.testButtonIcon}>
                            <Feather name="bell" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.testButtonContent}>
                            <Text style={styles.testButtonTitle}>로컬 알림 (10초 후)</Text>
                            <Text style={styles.testButtonDesc}>미활동 알림 테스트</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                    </Pressable>

                    {/* Remote Push Test */}
                    <Pressable
                        style={styles.testButton}
                        onPress={handleRemotePushTest}
                        disabled={loading || !tokenRegistered}
                    >
                        <View style={styles.testButtonIcon}>
                            <Feather name="message-circle" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.testButtonContent}>
                            <Text style={styles.testButtonTitle}>댓글 알림 (즉시)</Text>
                            <Text style={styles.testButtonDesc}>원격 푸시 알림 테스트</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                    </Pressable>
                </Card>

                {/* Status Display */}
                {statusMessage ? (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>상태</Text>
                        <Text style={styles.statusMessage}>{statusMessage}</Text>
                    </Card>
                ) : null}

                {/* Help */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>도움말</Text>
                    <View style={styles.helpItem}>
                        <Feather name="info" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.helpText}>
                            로컬 알림은 앱을 백그라운드로 전환해야 표시됩니다
                        </Text>
                    </View>
                    <View style={styles.helpItem}>
                        <Feather name="info" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.helpText}>
                            원격 푸시는 토큰 등록 후 즉시 받을 수 있습니다
                        </Text>
                    </View>
                    <View style={styles.helpItem}>
                        <Feather name="info" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.helpText}>
                            Expo Go에서는 로컬 알림이 지원되지 않습니다
                        </Text>
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
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
        padding: 16
    },
    card: {
        marginBottom: 16,
        padding: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: COLORS.textPrimary,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
        maxWidth: 200,
    },
    tokenStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    testButtonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    testButtonContent: {
        flex: 1,
    },
    testButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    testButtonDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    statusMessage: {
        fontSize: 14,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    helpItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
});
