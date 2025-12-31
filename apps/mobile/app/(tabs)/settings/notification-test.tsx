import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card, Button } from '../../../components';
import { useToast } from '../../../components/ToastContext';
import { getDeviceId } from '../../../services/pin';
import { scheduleTestNotification } from '../../../services/NotificationService';

type TabType = 'quick' | 'state' | 'settings';
type LogType = 'success' | 'error' | 'warning' | 'info';

interface LogEntry {
    message: string;
    type: LogType;
    timestamp: Date;
}

export default function NotificationTestScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('quick');

    // Settings
    const [myDeviceId, setMyDeviceId] = useState('');
    const [targetDeviceId, setTargetDeviceId] = useState('');
    const [apiUrl, setApiUrl] = useState(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001');

    // Notification state (fixed to COMFORT_COMMENT, INACTIVITY uses local notifications only)
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastSentHoursAgo, setLastSentHoursAgo] = useState(0);
    const [currentState, setCurrentState] = useState<any>(null);

    // UI state
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getDeviceId().then(id => {
            setMyDeviceId(id);
            setTargetDeviceId(id);
        });
        // Auto-fetch state on mount
        setTimeout(() => fetchState(), 500);
    }, []);

    const addLog = (message: string, logType: LogType = 'info') => {
        setLogs(prev => [{ message, type: logType, timestamp: new Date() }, ...prev.slice(0, 19)]);
    };

    const getRelativeTime = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return '방금 전';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}분 전`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        return `${days}일 전`;
    };

    const fetchState = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/comfort/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get-notification-state',
                    deviceId: targetDeviceId,
                    type: 'COMFORT_COMMENT'
                })
            });
            const json = await res.json();
            if (json.success) {
                setCurrentState(json.state);
                addLog(`상태 조회 성공`, 'success');
            } else {
                addLog(`조회 실패: ${json.error}`, 'error');
            }
        } catch (e) {
            addLog(`오류: ${e}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateState = async (unread: number, hoursAgo: number) => {
        try {
            setLoading(true);
            const lastSentAt = hoursAgo === 0
                ? null
                : new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

            const res = await fetch(`${apiUrl}/api/comfort/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'set-notification-state',
                    deviceId: targetDeviceId,
                    type: 'COMFORT_COMMENT',
                    unreadCount: unread,
                    lastSentAt
                })
            });
            const json = await res.json();
            if (json.success) {
                setCurrentState(json.state);
                addLog(`상태 업데이트 완료 (Unread: ${unread}, 마지막: ${hoursAgo === 0 ? '없음' : hoursAgo + '시간 전'})`, 'success');
            } else {
                addLog(`업데이트 실패: ${json.error}`, 'error');
            }
        } catch (e) {
            addLog(`오류: ${e}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const simulatePush = async () => {
        try {
            setLoading(true);
            addLog('푸시 발송 시도 중...', 'info');
            const options = { cooldownMs: 3 * 60 * 60 * 1000 }; // 3 hours

            const res = await fetch(`${apiUrl}/api/comfort/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'simulate-push',
                    deviceId: targetDeviceId,
                    type: 'COMFORT_COMMENT',
                    title: 'Test COMFORT_COMMENT',
                    body: '테스트 알림입니다.',
                    options: { ...options, type: 'COMFORT_COMMENT' }
                })
            });
            const json = await res.json();
            if (json.success) {
                setCurrentState(json.state);
                const result = json.pushResult;
                if (result?.status === 'throttled') {
                    addLog(`⛔️ 쿨타임으로 차단됨 - ${result.message}`, 'warning');
                } else if (result?.status === 'sent') {
                    addLog(`✅ 알림 발송 성공!`, 'success');
                } else {
                    addLog(`⚠️ ${result?.message || '알 수 없는 상태'}`, 'warning');
                }
            } else {
                addLog(`시뮬레이션 실패: ${json.error}`, 'error');
            }
        } catch (e) {
            addLog(`오류: ${e}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const registerDummyDevice = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/comfort/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register-dummy-device',
                    deviceId: targetDeviceId
                })
            });
            const json = await res.json();
            if (json.success) {
                addLog(`기기 등록 성공`, 'success');
            } else {
                addLog(`등록 실패: ${json.error}`, 'error');
            }
        } catch (e) {
            addLog(`오류: ${e}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLocalTest = async () => {
        try {
            await scheduleTestNotification(10);
            addLog('10초 뒤 로컬 알림 예약 완료! 앱을 백그라운드로 전환하세요.', 'success');
        } catch (e) {
            addLog(`예약 실패: ${e}`, 'error');
        }
    };

    // Preset scenarios
    const runScenario = async (scenario: string) => {
        switch (scenario) {
            case 'first-comment':
                await updateState(1, 0);
                setTimeout(() => simulatePush(), 500);
                break;
            case 'cooldown-test':
                await updateState(0, 3);
                setTimeout(() => simulatePush(), 500);
                break;
            case 'accumulated':
                await updateState(3, 0);
                setTimeout(() => simulatePush(), 500);
                break;
            case 'reset':
                await updateState(0, 0);
                break;
        }
    };

    const getCooldownStatus = () => {
        if (!currentState?.lastSentAt) return { text: '발송 가능', color: COLORS.primary, icon: 'check-circle' };

        const lastSent = new Date(currentState.lastSentAt);
        const hoursAgo = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
        const cooldownHours = 3; // COMFORT_COMMENT: 3 hours

        if (hoursAgo >= cooldownHours) {
            return { text: '발송 가능', color: COLORS.primary, icon: 'check-circle' };
        } else {
            const remaining = Math.ceil(cooldownHours - hoursAgo);
            return { text: `쿨타임 (${remaining}시간 남음)`, color: COLORS.error, icon: 'clock' };
        }
    };

    const renderQuickTestTab = () => (
        <View>
            {/* Current State Display */}
            {currentState && (
                <Card style={styles.card}>
                    <View style={styles.stateHeader}>
                        <Text style={styles.sectionTitle}>현재 상태</Text>
                        <Pressable onPress={fetchState} disabled={loading}>
                            <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                        </Pressable>
                    </View>
                    <View style={styles.stateRow}>
                        <View style={styles.stateItem}>
                            <Text style={styles.stateLabel}>누적 알림</Text>
                            <Text style={styles.stateValue}>{currentState.unreadCount || 0}개</Text>
                        </View>
                        <View style={styles.stateItem}>
                            <Text style={styles.stateLabel}>마지막 발송</Text>
                            <Text style={styles.stateValue}>
                                {currentState.lastSentAt ? getRelativeTime(new Date(currentState.lastSentAt)) : '없음'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.cooldownBadge, { backgroundColor: getCooldownStatus().color + '20' }]}>
                        <Feather name={getCooldownStatus().icon as any} size={16} color={getCooldownStatus().color} />
                        <Text style={[styles.cooldownText, { color: getCooldownStatus().color }]}>
                            {getCooldownStatus().text}
                        </Text>
                    </View>
                </Card>
            )}

            {/* Preset Scenarios */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>빠른 시나리오 테스트</Text>
                <Text style={styles.helpText}>원클릭으로 상황을 설정하고 푸시를 발송합니다</Text>

                <Pressable
                    style={styles.scenarioBtn}
                    onPress={() => runScenario('first-comment')}
                    disabled={loading}
                >
                    <View style={styles.scenarioBtnContent}>
                        <Feather name="message-circle" size={20} color={COLORS.primary} />
                        <View style={styles.scenarioText}>
                            <Text style={styles.scenarioBtnTitle}>첫 댓글 알림</Text>
                            <Text style={styles.scenarioBtnDesc}>누적 1개, 이전 발송 없음 → 발송</Text>
                        </View>
                    </View>
                </Pressable>

                <Pressable
                    style={styles.scenarioBtn}
                    onPress={() => runScenario('cooldown-test')}
                    disabled={loading}
                >
                    <View style={styles.scenarioBtnContent}>
                        <Feather name="clock" size={20} color={COLORS.warning} />
                        <View style={styles.scenarioText}>
                            <Text style={styles.scenarioBtnTitle}>쿨타임 테스트</Text>
                            <Text style={styles.scenarioBtnDesc}>3시간 전 발송 → 차단됨</Text>
                        </View>
                    </View>
                </Pressable>

                <Pressable
                    style={styles.scenarioBtn}
                    onPress={() => runScenario('accumulated')}
                    disabled={loading}
                >
                    <View style={styles.scenarioBtnContent}>
                        <Feather name="layers" size={20} color={COLORS.error} />
                        <View style={styles.scenarioText}>
                            <Text style={styles.scenarioBtnTitle}>누적 알림 테스트</Text>
                            <Text style={styles.scenarioBtnDesc}>누적 3개 → 즉시 발송</Text>
                        </View>
                    </View>
                </Pressable>

                <Pressable
                    style={styles.scenarioBtn}
                    onPress={() => runScenario('reset')}
                    disabled={loading}
                >
                    <View style={styles.scenarioBtnContent}>
                        <Feather name="rotate-ccw" size={20} color={COLORS.textSecondary} />
                        <View style={styles.scenarioText}>
                            <Text style={styles.scenarioBtnTitle}>상태 초기화</Text>
                            <Text style={styles.scenarioBtnDesc}>모든 값을 0으로 리셋</Text>
                        </View>
                    </View>
                </Pressable>
            </Card>

            {/* Local Notification Test */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>로컬 알림 테스트</Text>
                <Text style={styles.helpText}>미활동 알림 (실제는 3일/7일, 테스트는 10초)</Text>
                <Button
                    title="10초 뒤 알림 예약"
                    onPress={handleLocalTest}
                    variant="secondary"
                />
            </Card>
        </View>
    );

    const renderStateManagementTab = () => (
        <View>
            {/* Current State Display */}
            {currentState && (
                <Card style={styles.card}>
                    <View style={styles.stateHeader}>
                        <Text style={styles.sectionTitle}>현재 상태</Text>
                        <Pressable onPress={fetchState} disabled={loading}>
                            <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                        </Pressable>
                    </View>
                    <View style={styles.stateRow}>
                        <View style={styles.stateItem}>
                            <Text style={styles.stateLabel}>누적 알림</Text>
                            <Text style={styles.stateValue}>{currentState.unreadCount || 0}개</Text>
                        </View>
                        <View style={styles.stateItem}>
                            <Text style={styles.stateLabel}>마지막 발송</Text>
                            <Text style={styles.stateValue}>
                                {currentState.lastSentAt ? getRelativeTime(new Date(currentState.lastSentAt)) : '없음'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.cooldownBadge, { backgroundColor: getCooldownStatus().color + '20' }]}>
                        <Feather name={getCooldownStatus().icon as any} size={16} color={getCooldownStatus().color} />
                        <Text style={[styles.cooldownText, { color: getCooldownStatus().color }]}>
                            {getCooldownStatus().text}
                        </Text>
                    </View>
                </Card>
            )}

            {/* Unread Count */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>누적 알림 수</Text>
                <View style={styles.presetRow}>
                    {[0, 1, 2, 3, 5].map(count => (
                        <Pressable
                            key={count}
                            style={[styles.presetBtn, unreadCount === count && styles.presetBtnActive]}
                            onPress={() => setUnreadCount(count)}
                        >
                            <Text style={[styles.presetBtnText, unreadCount === count && styles.presetBtnTextActive]}>
                                {count}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Card>

            {/* Last Sent Time */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>마지막 발송 시간</Text>
                <View style={styles.presetRow}>
                    {[
                        { label: '없음', hours: 0 },
                        { label: '1시간', hours: 1 },
                        { label: '3시간', hours: 3 },
                        { label: '6시간', hours: 6 },
                        { label: '1일', hours: 24 },
                    ].map(preset => (
                        <Pressable
                            key={preset.hours}
                            style={[styles.presetBtn, lastSentHoursAgo === preset.hours && styles.presetBtnActive]}
                            onPress={() => setLastSentHoursAgo(preset.hours)}
                        >
                            <Text style={[styles.presetBtnText, lastSentHoursAgo === preset.hours && styles.presetBtnTextActive]}>
                                {preset.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Card>

            {/* Actions */}
            <Card style={styles.card}>
                <Button
                    title="상태 업데이트"
                    onPress={() => updateState(unreadCount, lastSentHoursAgo)}
                    disabled={loading}
                />
                <Button
                    title="푸시 발송 시도"
                    onPress={simulatePush}
                    variant="secondary"
                    style={{ marginTop: 10 }}
                    disabled={loading}
                />
            </Card>
        </View>
    );

    const renderSettingsTab = () => (
        <View>
            {/* API URL */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>API 서버</Text>
                <TextInput
                    style={styles.input}
                    value={apiUrl}
                    onChangeText={setApiUrl}
                    placeholder="http://..."
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <View style={styles.presetRow}>
                    <Pressable
                        style={[styles.presetBtn, apiUrl.includes('192.168.0.7') && styles.presetBtnActive]}
                        onPress={() => setApiUrl('http://192.168.0.7:3001')}
                    >
                        <Text style={[styles.presetBtnText, apiUrl.includes('192.168.0.7') && styles.presetBtnTextActive]}>
                            LAN
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.presetBtn, apiUrl.includes('haroo.site') && styles.presetBtnActive]}
                        onPress={() => setApiUrl('https://myorok.haroo.site')}
                    >
                        <Text style={[styles.presetBtnText, apiUrl.includes('haroo.site') && styles.presetBtnTextActive]}>
                            Prod
                        </Text>
                    </Pressable>
                </View>
            </Card>

            {/* Device ID */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>대상 기기</Text>
                <Text style={styles.helpText}>기기 ID (자동 입력됨)</Text>
                <TextInput
                    style={styles.input}
                    value={targetDeviceId}
                    onChangeText={setTargetDeviceId}
                    placeholder="Device ID"
                />
                <Button
                    title="테스트용 기기 등록"
                    onPress={registerDummyDevice}
                    variant="secondary"
                    style={{ marginTop: 10 }}
                    disabled={loading}
                />
            </Card>
        </View>
    );

    const getLogIcon = (logType: LogType) => {
        switch (logType) {
            case 'success': return { name: 'check-circle', color: COLORS.primary };
            case 'error': return { name: 'x-circle', color: COLORS.error };
            case 'warning': return { name: 'alert-triangle', color: COLORS.warning };
            default: return { name: 'info', color: COLORS.textSecondary };
        }
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

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'quick' && styles.tabActive]}
                    onPress={() => setActiveTab('quick')}
                >
                    <Feather name="zap" size={18} color={activeTab === 'quick' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'quick' && styles.tabTextActive]}>빠른 테스트</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'state' && styles.tabActive]}
                    onPress={() => setActiveTab('state')}
                >
                    <Feather name="sliders" size={18} color={activeTab === 'state' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'state' && styles.tabTextActive]}>상태 관리</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Feather name="settings" size={18} color={activeTab === 'settings' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>설정</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView}>
                {activeTab === 'quick' && renderQuickTestTab()}
                {activeTab === 'state' && renderStateManagementTab()}
                {activeTab === 'settings' && renderSettingsTab()}

                {/* Logs */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>로그 (최근 20개)</Text>
                    {logs.length === 0 ? (
                        <Text style={styles.emptyLog}>아직 로그가 없습니다</Text>
                    ) : (
                        logs.slice(0, 10).map((log, i) => {
                            const icon = getLogIcon(log.type);
                            return (
                                <View key={i} style={styles.logItem}>
                                    <Feather name={icon.name as any} size={14} color={icon.color} />
                                    <View style={styles.logContent}>
                                        <Text style={styles.logMessage}>{log.message}</Text>
                                        <Text style={styles.logTime}>{getRelativeTime(log.timestamp)}</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
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

    // Tab Navigation
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },

    scrollView: {
        flex: 1,
        padding: 16
    },
    card: {
        marginBottom: 16,
        padding: 16
    },

    // State Display
    stateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stateRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    stateItem: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
    },
    stateLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    stateValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    cooldownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    cooldownText: {
        fontSize: 14,
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.textPrimary,
    },
    helpText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },

    // Scenario Buttons
    scenarioBtn: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    scenarioBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scenarioText: {
        flex: 1,
    },
    scenarioBtnTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    scenarioBtnDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },

    // Type Selection
    row: {
        flexDirection: 'row',
        gap: 10
    },
    typeBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    typeBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    typeText: {
        fontSize: 13,
        color: COLORS.textSecondary
    },
    typeTextActive: {
        color: '#FFF',
        fontWeight: '600'
    },

    // Preset Buttons
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 4,
    },
    presetBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    presetBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    presetBtnText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    presetBtnTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },

    // Input
    label: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4,
        marginTop: 10
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.surface,
        marginTop: 4,
    },

    // Legacy state box
    stateBox: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 8
    },
    stateText: {
        fontSize: 12,
        color: '#333'
    },

    // Logs
    emptyLog: {
        textAlign: 'center',
        fontSize: 13,
        color: COLORS.textSecondary,
        paddingVertical: 20,
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    logContent: {
        flex: 1,
    },
    logMessage: {
        fontSize: 13,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    logTime: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
});
