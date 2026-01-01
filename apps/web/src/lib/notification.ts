import { Expo } from 'expo-server-sdk';
import dbConnect from './mongodb';
import Device from '../models/Device';
import Notification from '../models/Notification';
import NotificationState from '../models/NotificationState';

const expo = new Expo();

export interface PushOptions {
    cooldownMs?: number;    // Minimum time between pushes (default: 0)
    countThreshold?: number; // Send only after N events if within cooldown (default: 1)
    type?: string;          // Notification Type (Required for throttling)
    notificationCategory?: 'comments' | 'inactivity' | 'marketing'; // For checking user settings
}

export async function sendPushNotification(
    deviceId: string,
    title: string,
    body: string,
    data: any = {},
    options: PushOptions = {}
): Promise<{ status: 'sent' | 'throttled' | 'error' | 'skipped', message?: string }> {
    console.log(`[Push] Attempting to send to ${deviceId}: ${title}`);

    await dbConnect();

    // Throttling Logic
    if (options.type && options.cooldownMs && options.cooldownMs > 0) {
        const state = await NotificationState.findOneAndUpdate(
            { deviceId, type: options.type },
            { $setOnInsert: { unreadCount: 0, lastSentAt: null } },
            { upsert: true, new: true }
        );

        const now = new Date();
        const lastSent = state.lastSentAt ? new Date(state.lastSentAt) : null;
        const diffMs = lastSent ? now.getTime() - lastSent.getTime() : Infinity;

        console.log(`[Push] Debug Throttling: lastSent=${lastSent?.toISOString()}, now=${now.toISOString()}, diffMs=${diffMs}, cooldown=${options.cooldownMs}`);

        // If within cooldown
        if (diffMs < options.cooldownMs) {
            // Increment unread count
            state.unreadCount = (state.unreadCount || 0) + 1;

            console.log(`[Push] Throttled. Count: ${state.unreadCount} (Strict Cooldown Active)`);
            await state.save();
            return { status: 'throttled', message: `쿨타임 적용 중 (Count: ${state.unreadCount})` };
        }
    }
    const device = await Device.findOne({ deviceId });

    if (!device) {
        console.log(`[Push] No device found for ${deviceId}`);
        return { status: 'error', message: '기기 정보를 찾을 수 없음' };
    }

    // Check notification settings (default: true if not set)
    if (options.notificationCategory) {
        const isEnabled = device.settings?.[options.notificationCategory] !== false;
        if (!isEnabled) {
            console.log(`[Push] Notification category '${options.notificationCategory}' is disabled for device ${deviceId}`);
            return { status: 'skipped', message: `사용자가 ${options.notificationCategory} 알림을 비활성화함` };
        }
    }

    if (!device.pushToken) {
        console.log(`[Push] No token for device ${deviceId}`);
        return { status: 'error', message: '토큰 없음' };
    }

    if (!Expo.isExpoPushToken(device.pushToken)) {
        console.error(`[Push] Token ${device.pushToken} is not a valid Expo push token`);
        return { status: 'error', message: '유효하지 않은 토큰' };
    }

    const messages = [{
        to: device.pushToken,
        sound: 'default' as const,
        title,
        body,
        data,
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }
        console.log(`[Push] Sent successfully to ${deviceId}`);

        // Log to DB
        await Notification.create({
            deviceId,
            type: data.type || options.type || 'SYSTEM',
            title,
            body,
            data
        });

        // Update State (Reset count, update lastSentAt)
        if (options.type) {
            await NotificationState.findOneAndUpdate(
                { deviceId, type: options.type },
                {
                    $set: {
                        lastSentAt: new Date(),
                        unreadCount: 0
                    }
                },
                { upsert: true }
            );
        }
        return { status: 'sent', message: '발송 성공' };

    } catch (error) {
        console.error('[Push] Error sending notification:', error);
        return { status: 'error', message: `전송 중 오류: ${error}` };
    }
}
