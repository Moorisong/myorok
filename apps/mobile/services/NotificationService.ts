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

    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule single notification: After 3 days of app inactivity
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "3일 동안 기록이 없어요 😿",
            body: "오늘 고양이 상태를 기록해 주세요.",
            sound: true,
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
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '테스트 알림 🔔',
                body: `${seconds}초 후 알림이 도착했습니다!`,
                sound: 'default',
            },
            trigger: { seconds },
        });
        console.log(`[Local] Scheduled test notification in ${seconds}s`);
    } catch (error) {
        console.log('Error scheduling test notification:', error);
    }
}
