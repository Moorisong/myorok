import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { CONFIG } from '../../../constants/config';
import { Card } from '../../../components';

const API_URL = CONFIG.API_BASE_URL;

interface NotificationSettings {
    marketing: boolean;
    comments: boolean;
    inactivity: boolean;
}

interface SettingToggleItemProps {
    emoji: string;
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}

function SettingToggleItem({ emoji, title, description, value, onValueChange, disabled }: SettingToggleItemProps) {
    return (
        <View style={styles.settingItem}>
            <Text style={styles.settingEmoji}>{emoji}</Text>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {description && (
                    <Text style={styles.settingDescription}>
                        {description}
                    </Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={value ? COLORS.surface : COLORS.lightGray}
            />
        </View>
    );
}

export default function NotificationSettingsScreen() {
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        marketing: true,
        comments: true,
        inactivity: true,
    });

    useFocusEffect(
        useCallback(() => {
            loadNotificationSettings();
        }, [])
    );

    const loadNotificationSettings = async () => {
        try {
            const { getDeviceId } = await import('../../../services/device');
            const deviceId = await getDeviceId();

            const response = await fetch(`${API_URL}/api/device/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
            });

            const data = await response.json();
            if (data.success && data.device?.settings) {
                setNotificationSettings(data.device.settings);
                console.log('[NotificationSettings] Loaded settings:', data.device.settings);
            }
        } catch (error) {
            console.error('[NotificationSettings] Failed to load settings:', error);
        }
    };

    const updateNotificationSetting = async (key: keyof NotificationSettings, value: boolean) => {
        // Optimistic update
        const previousSettings = { ...notificationSettings };
        setNotificationSettings(prev => ({ ...prev, [key]: value }));

        try {
            const { getDeviceId } = await import('../../../services/device');
            const deviceId = await getDeviceId();

            const response = await fetch(`${API_URL}/api/device/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    settings: { ...notificationSettings, [key]: value },
                }),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error('Failed to update settings');
            }

            console.log(`[NotificationSettings] Updated ${key} to ${value}`);

            // If inactivity setting changed, update notification scheduling
            if (key === 'inactivity') {
                const { scheduleInactivityNotification } = await import('../../../services/NotificationService');
                if (value) {
                    await scheduleInactivityNotification();
                    console.log('[NotificationSettings] Inactivity notification scheduled');
                } else {
                    // Cancel inactivity notifications
                    const Constants = await import('expo-constants');
                    if (Constants.default.executionEnvironment !== 'storeClient') {
                        const Notifications = require('expo-notifications');
                        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                        for (const notification of scheduled) {
                            if (notification.content?.data?.type === 'INACTIVITY') {
                                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                            }
                        }
                        console.log('[NotificationSettings] Inactivity notifications cancelled');
                    }
                }
            }
        } catch (error) {
            console.error(`[NotificationSettings] Failed to update ${key}:`, error);
            // Revert optimistic update
            setNotificationSettings(previousSettings);
            Alert.alert('오류', '알림 설정 업데이트에 실패했습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen
                options={{
                    title: '알림 설정',
                    headerShown: true,
                }}
            />
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.headerDescription}>
                        알림 유형별로 수신 여부를 설정할 수 있습니다.
                    </Text>
                </View>

                <Card style={styles.card}>
                    <SettingToggleItem
                        emoji="💬"
                        title="댓글 알림"
                        description="내 글에 댓글이 달렸을 때 알림을 받습니다"
                        value={notificationSettings.comments}
                        onValueChange={(value) => updateNotificationSetting('comments', value)}
                    />
                    <SettingToggleItem
                        emoji="😿"
                        title="미활동 알림"
                        description="3일 동안 앱을 사용하지 않으면 알림을 받습니다"
                        value={notificationSettings.inactivity}
                        onValueChange={(value) => updateNotificationSetting('inactivity', value)}
                    />
                    <SettingToggleItem
                        emoji="📢"
                        title="마케팅 알림"
                        description="마케팅 알림은 현재 발송되지 않으며, 추후 적용될 예정입니다."
                        value={notificationSettings.marketing}
                        onValueChange={(value) => updateNotificationSetting('marketing', value)}
                    />
                </Card>

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
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    bottomPadding: {
        height: 32,
    },
});
