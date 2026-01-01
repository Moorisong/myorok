import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications'; // Removed for Expo Go compatibility
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Fallback to localhost if not defined
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Notifications handler setup moved to register function to allow conditional require
let Notifications: any;
try {
    // Only require in native environment if needed, or handle inside functions
    // actually, we will require it inside strict checks
} catch (e) { }

export async function registerForPushNotificationsAsync() {
    let token;

    // Check for Expo Go
    if (Constants.executionEnvironment === 'storeClient') {
        console.log("Dev Note: Running in Expo Go. Push Notifications are not supported in SDK 53+. Using mock/no-op.");
        return;
    }

    try {
        // Dynamic require for native env
        Notifications = require('expo-notifications');

        // Set Handler dynamically
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Permission not granted');
                return;
            }

            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                if (!projectId) {
                    console.log("Warning: No Project ID found in config. Attempting default fetch...");
                    token = (await Notifications.getExpoPushTokenAsync()).data;
                } else {
                    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                }
                console.log("Expo Push Token:", token);
            } catch (e: any) {
                // Handle "No projectId found" specifically
                if (e.message?.includes('No "projectId" found')) {
                    console.log("Dev Note: Expo Project ID is missing.");
                } else if (e.message?.includes('Default FirebaseApp is not initialized')) {
                    console.warn("Firebase Warning: google-services.json is missing or not configured. Push notifications will not work.");
                } else {
                    console.error("Error getting push token:", e);
                }
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }
    } catch (e) {
        console.error("Failed to initialize notifications module:", e);
    }

    return token;
}

export async function sendTokenToBackend(deviceId: string, token: string | undefined) {
    if (!token) return;
    try {
        console.log(`Sending token to ${API_URL}/api/device/register`);
        const response = await fetch(`${API_URL}/api/device/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId,
                pushToken: token,
            })
        });
        const json = await response.json();
        console.log('Token register response:', json);
    } catch (e) {
        console.error("Failed to register token", e);
    }
}

export async function scheduleInactivityNotification() {
    // Check for Expo Go
    if (Constants.executionEnvironment === 'storeClient') {
        return;
    }

    Notifications = require('expo-notifications');

    // Cancel only INACTIVITY type notifications (not all)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
        if (notification.content?.data?.type === 'INACTIVITY') {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }

    // Schedule single notification: After 3 days of app inactivity
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "3일 동안 기록이 없어요 😿",
            body: "오늘 고양이 상태를 기록해 주세요.",
            sound: true,
            data: { type: 'INACTIVITY' }, // Add type identifier
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3 * 24 * 60 * 60, // 3 days
        },
    });

    console.log("Scheduled inactivity notification for 3 days later");
}

export async function scheduleTestNotification(seconds: number) {
    if (Constants.executionEnvironment === 'storeClient') return;

    try {
        const Notifications = require('expo-notifications');
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: '테스트 알림 🔔',
                body: `${seconds}초 후 알림이 도착했습니다!`,
                sound: 'default',
                data: { type: 'TEST' }, // Add type identifier to prevent cancellation
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds
            },
        });
        console.log(`[Local] Scheduled test notification in ${seconds}s, ID: ${identifier}`);
        return identifier;
    } catch (error) {
        console.log('Error scheduling test notification:', error);
        throw error;
    }
}

/**
 * Schedule trial end notification (24 hours before trial expires)
 * @param trialStartDate ISO 8601 date string of when trial started
 * @returns Promise<string | null> Returns the notification identifier if scheduled, null if already sent or skipped
 */
export async function scheduleTrialEndNotification(trialStartDate: string): Promise<string | null> {
    // Check for Expo Go
    if (Constants.executionEnvironment === 'storeClient') {
        console.log('[TrialNotification] Skipped in Expo Go');
        return null;
    }

    try {
        const Notifications = require('expo-notifications');

        // Calculate trial end date and push date
        const startDate = new Date(trialStartDate);
        const trialEndDate = new Date(startDate);
        trialEndDate.setDate(trialEndDate.getDate() + 7); // Trial lasts 7 days

        const pushDate = new Date(trialEndDate);
        pushDate.setDate(pushDate.getDate() - 1); // Notify 24 hours before

        const now = new Date();

        // Check if push date is in the past
        if (pushDate <= now) {
            console.log('[TrialNotification] Push date is in the past, skipping');
            return null;
        }

        // Cancel any existing trial end notifications
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        for (const notification of scheduledNotifications) {
            if (notification.content?.data?.type === 'TRIAL_END') {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                console.log('[TrialNotification] Cancelled existing trial end notification');
            }
        }

        // Schedule notification
        const identifier = await Notifications.scheduleNotificationAsync({
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
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: pushDate,
            },
        });

        console.log(`[TrialNotification] Scheduled for ${pushDate.toISOString()}`);
        return identifier;
    } catch (error) {
        console.error('[TrialNotification] Error scheduling:', error);
        return null;
    }
}

/**
 * Cancel trial end notification
 */
export async function cancelTrialEndNotification(): Promise<void> {
    if (Constants.executionEnvironment === 'storeClient') return;

    try {
        const Notifications = require('expo-notifications');
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

        for (const notification of scheduledNotifications) {
            if (notification.content?.data?.type === 'TRIAL_END') {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                console.log('[TrialNotification] Cancelled trial end notification');
            }
        }
    } catch (error) {
        console.error('[TrialNotification] Error cancelling:', error);
    }
}
