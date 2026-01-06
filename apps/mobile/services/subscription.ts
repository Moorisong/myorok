import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './database';
import { scheduleTrialEndNotification, cancelTrialEndNotification } from './NotificationService';
import { handleLicenseResponse, checkLicenseAfterPurchase } from './licenseChecker';
import { restorePurchases } from './paymentService';
import { CONFIG } from '../constants/config';
import { getDeviceId } from './device';

const SUBSCRIPTION_KEYS = {
    TRIAL_START_DATE: 'trial_start_date',
    SUBSCRIPTION_STATUS: 'subscription_status',
    SUBSCRIPTION_START_DATE: 'subscription_start_date',
    SUBSCRIPTION_EXPIRY_DATE: 'subscription_expiry_date',
};

export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export interface SubscriptionState {
    status: SubscriptionStatus;
    trialStartDate?: string;
    daysRemaining?: number;
    subscriptionStartDate?: string;
    subscriptionExpiryDate?: string;
}

const TRIAL_DAYS = 7;
const API_URL = CONFIG.API_BASE_URL;

/**
 * Initialize subscription on first app launch
 * Sets trial start date if not already set
 */
export async function initializeSubscription(): Promise<void> {
    const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);

    if (!trialStartDate) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, now);
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');

        // Also save to database for backup
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO subscription_state (id, trialStartDate, subscriptionStatus, createdAt, updatedAt)
       VALUES (1, ?, ?, ?, ?)`,
            [now, 'trial', now, now]
        );

        // Schedule trial end notification
        await scheduleTrialEndNotificationIfNeeded(now);
    } else {
        // Check if notification needs to be scheduled for existing trial
        const status = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS) as SubscriptionStatus;
        if (status === 'trial') {
            await scheduleTrialEndNotificationIfNeeded(trialStartDate);
        }
    }
}

/**
 * Get current subscription status with detailed information
 */
export async function getSubscriptionStatus(): Promise<SubscriptionState> {
    const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
    const status = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS) as SubscriptionStatus || 'trial';
    const subscriptionStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
    const subscriptionExpiryDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);

    if (status === 'trial' && trialStartDate) {
        const daysRemaining = calculateDaysRemaining(trialStartDate);

        // Auto-expire trial if time is up
        if (daysRemaining <= 0) {
            await setSubscriptionStatus('expired');
            return {
                status: 'expired',
                trialStartDate,
                daysRemaining: 0,
            };
        }

        return {
            status: 'trial',
            trialStartDate,
            daysRemaining,
        };
    }

    if (status === 'active') {
        // Active 구독 만료 체크
        if (subscriptionExpiryDate) {
            const expiryDate = new Date(subscriptionExpiryDate);
            const now = new Date();

            if (expiryDate < now) {
                // 구독 만료됨
                await setSubscriptionStatus('expired');
                return {
                    status: 'expired',
                    subscriptionStartDate: subscriptionStartDate || undefined,
                    subscriptionExpiryDate: subscriptionExpiryDate,
                    daysRemaining: 0,
                };
            }
        }

        return {
            status: 'active',
            subscriptionStartDate: subscriptionStartDate || undefined,
            subscriptionExpiryDate: subscriptionExpiryDate || undefined,
        };
    }

    return {
        status: 'expired',
        trialStartDate: trialStartDate || undefined,
        daysRemaining: 0,
    };
}

/**
 * Calculate days remaining in trial period
 */
function calculateDaysRemaining(trialStartDate: string): number {
    const startDate = new Date(trialStartDate);
    const now = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + TRIAL_DAYS);

    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

/**
 * Check if user has access to app features
 * Returns false if trial expired and not subscribed
 */
export async function isAppAccessAllowed(): Promise<boolean> {
    const state = await getSubscriptionStatus();
    return state.status === 'trial' || state.status === 'active';
}

/**
 * Activate subscription after successful purchase
 */
export async function activateSubscription(expiryDate?: string): Promise<void> {
    const now = new Date().toISOString();
    const expiry = expiryDate || getDefaultExpiryDate();

    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'active');
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE, now);
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE, expiry);

    // Update database
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE subscription_state
     SET subscriptionStatus = ?, subscriptionStartDate = ?, subscriptionExpiryDate = ?, updatedAt = ?
     WHERE id = 1`,
        ['active', now, expiry, now]
    );

    // Cancel trial end notification
    await cancelTrialEndNotification();

    // Sync to server
    const userId = await AsyncStorage.getItem('current_user_id');
    if (userId) {
        const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        await syncSubscriptionToServer(userId, {
            status: 'active',
            trialStartDate: trialStartDate || undefined,
            subscriptionStartDate: now,
            subscriptionExpiryDate: expiry,
        });
    }
}

/**
 * Get default expiry date (30 days from now)
 */
function getDefaultExpiryDate(): string {
    const now = new Date();
    now.setDate(now.getDate() + 30);
    return now.toISOString();
}

/**
 * Set subscription status manually (for testing)
 */
export async function setSubscriptionStatus(status: SubscriptionStatus): Promise<void> {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, status);

    const db = await getDatabase();
    await db.runAsync(
        `UPDATE subscription_state SET subscriptionStatus = ?, updatedAt = ? WHERE id = 1`,
        [status, now]
    );

    // Sync to server
    const userId = await AsyncStorage.getItem('current_user_id');
    if (userId) {
        const state = await getSubscriptionStatus();
        await syncSubscriptionToServer(userId, state);
    }
}

/**
 * Check if trial expiration warning should be shown (24 hours before)
 */
export async function shouldShowTrialWarning(): Promise<boolean> {
    const state = await getSubscriptionStatus();
    return state.status === 'trial' && (state.daysRemaining || 0) <= 1;
}

/**
 * Get formatted trial countdown text
 */
export function getTrialCountdownText(daysRemaining: number): string {
    if (daysRemaining <= 0) return '무료 체험 종료';
    return `무료 체험 D-${daysRemaining}`;
}

/**
 * Reset subscription (for testing)
 */
export async function resetSubscription(): Promise<void> {
    try {
        console.log('[Subscription] Resetting subscription state...');

        // Clear AsyncStorage
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);

        // Clear database
        const db = await getDatabase();
        await db.execAsync('DELETE FROM subscription_state');

        // Re-initialize
        await initializeSubscription();

        // Verify
        const status = await getSubscriptionStatus();
        console.log('[Subscription] Reset complete, new status:', status);
    } catch (error) {
        console.error('[Subscription] Reset failed:', error);
        throw error;
    }
}

/**
 * Sync subscription state to server
 */
async function syncSubscriptionToServer(userId: string, state: SubscriptionState): Promise<void> {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
            console.warn('[Subscription] No JWT token, skipping server sync');
            return;
        }

        const deviceId = await getDeviceId();

        const response = await fetch(`${API_URL}/api/subscription/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceId,
                status: state.status,
                trialStartDate: state.trialStartDate,
                subscriptionStartDate: state.subscriptionStartDate,
                subscriptionExpiryDate: state.subscriptionExpiryDate,
            }),
        });

        if (!response.ok) {
            console.error('[Subscription] Server sync failed:', response.status);
        } else {
            console.log('[Subscription] Server sync successful');
        }
    } catch (error) {
        console.error('[Subscription] Server sync error:', error);
        // Don't throw - sync is optional
    }
}


// ============================================================
// User-based subscription functions (for Kakao login)
// ============================================================

/**
 * Get subscription status for a specific user
 */
export async function getSubscriptionStatusForUser(userId: string): Promise<SubscriptionState> {
    try {
        const db = await getDatabase();
        const record = await db.getFirstAsync<{
            trialStartDate: string;
            subscriptionStatus: SubscriptionStatus;
            subscriptionStartDate: string | null;
            subscriptionExpiryDate: string | null;
        }>(
            'SELECT trialStartDate, subscriptionStatus, subscriptionStartDate, subscriptionExpiryDate FROM subscription_state WHERE userId = ?',
            [userId]
        );

        if (!record) {
            // No subscription record for this user
            return {
                status: 'expired',
                daysRemaining: 0,
            };
        }

        const { trialStartDate, subscriptionStatus, subscriptionStartDate, subscriptionExpiryDate } = record;

        if (subscriptionStatus === 'trial' && trialStartDate) {
            const daysRemaining = calculateDaysRemaining(trialStartDate);

            if (daysRemaining <= 0) {
                await expireSubscriptionForUser(userId);
                return {
                    status: 'expired',
                    trialStartDate,
                    daysRemaining: 0,
                };
            }

            return {
                status: 'trial',
                trialStartDate,
                daysRemaining,
            };
        }

        if (subscriptionStatus === 'active') {
            return {
                status: 'active',
                subscriptionStartDate: subscriptionStartDate || undefined,
                subscriptionExpiryDate: subscriptionExpiryDate || undefined,
            };
        }

        return {
            status: 'expired',
            trialStartDate: trialStartDate || undefined,
            daysRemaining: 0,
        };
    } catch (error) {
        console.error('[Subscription] Get status for user failed:', error);
        throw error;
    }
}

/**
 * Start trial for a specific user
 * Note: subscription_state has CHECK(id = 1) constraint, so we update the single row
 */
export async function startTrialForUser(userId: string): Promise<void> {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();

        // Update AsyncStorage first (getSubscriptionStatus reads from here)
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, now);
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');

        // Check if subscription_state row exists
        const existing = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM subscription_state WHERE id = 1'
        );

        if (existing) {
            // Update existing row with new userId
            await db.runAsync(
                `UPDATE subscription_state
                 SET userId = ?, trialStartDate = ?, subscriptionStatus = ?, updatedAt = ?
                 WHERE id = 1`,
                [userId, now, 'trial', now]
            );
        } else {
            // Insert new row with id = 1
            await db.runAsync(
                `INSERT INTO subscription_state (id, userId, trialStartDate, subscriptionStatus, createdAt, updatedAt)
                 VALUES (1, ?, ?, ?, ?, ?)`,
                [userId, now, 'trial', now, now]
            );
        }

        // Schedule trial end notification
        await scheduleTrialEndNotificationIfNeeded(now);

        // Sync to server
        await syncSubscriptionToServer(userId, {
            status: 'trial',
            trialStartDate: now,
        });
    } catch (error) {
        console.error('[Subscription] Start trial failed:', error);
        throw error;
    }
}

/**
 * Activate subscription for a specific user
 */
export async function activateSubscriptionForUser(
    userId: string,
    startDate: string,
    expiryDate: string
): Promise<void> {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();

        await db.runAsync(
            `UPDATE subscription_state 
             SET subscriptionStatus = ?, subscriptionStartDate = ?, subscriptionExpiryDate = ?, updatedAt = ?
             WHERE userId = ?`,
            ['active', startDate, expiryDate, now, userId]
        );
    } catch (error) {
        console.error('[Subscription] Activate subscription failed:', error);
        throw error;
    }
}

/**
 * Expire subscription for a specific user
 */
export async function expireSubscriptionForUser(userId: string): Promise<void> {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();

        await db.runAsync(
            `UPDATE subscription_state SET subscriptionStatus = ?, updatedAt = ? WHERE userId = ?`,
            ['expired', now, userId]
        );
    } catch (error) {
        console.error('[Subscription] Expire subscription failed:', error);
        throw error;
    }
}

/**
 * Schedule trial end notification if not already sent
 * @param trialStartDate ISO 8601 date string of when trial started
 */
async function scheduleTrialEndNotificationIfNeeded(trialStartDate: string): Promise<void> {
    try {
        const db = await getDatabase();

        // Check if notification was already sent
        const record = await db.getFirstAsync<{
            lastTrialPushAt: string | null;
        }>(
            'SELECT lastTrialPushAt FROM subscription_state WHERE id = 1'
        );

        // If already sent, skip
        if (record?.lastTrialPushAt) {
            return;
        }

        // Calculate push date (6 days after trial start)
        const startDate = new Date(trialStartDate);
        const pushDate = new Date(startDate);
        pushDate.setDate(pushDate.getDate() + 6); // 7 days trial - 1 day = 6 days

        const now = new Date();

        // If push date is in the future, schedule it
        if (pushDate > now) {
            const identifier = await scheduleTrialEndNotification(trialStartDate);

            if (identifier) {
                // Update database with next push date
                await db.runAsync(
                    `UPDATE subscription_state SET nextTrialPushAt = ?, updatedAt = ? WHERE id = 1`,
                    [pushDate.toISOString(), now.toISOString()]
                );
            }
        }
    } catch (error) {
        console.error('[Subscription] Failed to schedule trial end notification:', error);
    }
}

/**
 * Mark trial notification as sent
 */
export async function markTrialNotificationAsSent(): Promise<void> {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();

        await db.runAsync(
            `UPDATE subscription_state SET lastTrialPushAt = ?, updatedAt = ? WHERE id = 1`,
            [now, now]
        );
    } catch (error) {
        console.error('[Subscription] Failed to mark trial notification as sent:', error);
    }
}

/**
 * Set trial to expire in 24 hours (for testing)
 * Adjusts trial start date so notification will be scheduled naturally by the system
 */
export async function setTrialExpiringTestMode(): Promise<void> {
    try {
        const now = new Date();

        // Set trial start to (6 days - 10 seconds) ago
        // This makes push date = start + 6 days = now + 10 seconds (future!)
        // So the system will naturally schedule the notification
        const trialStartTime = now.getTime() - (6 * 24 * 60 * 60 * 1000) + (10 * 1000);
        const trialStart = new Date(trialStartTime).toISOString();

        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, trialStart);
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');

        const db = await getDatabase();

        // id=1이 없을 수도 있으므로 upsert 처리
        const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM subscription_state WHERE id = 1');

        if (existing) {
            await db.runAsync(
                `UPDATE subscription_state 
                 SET trialStartDate = ?, subscriptionStatus = 'trial', updatedAt = ?
                 WHERE id = 1`,
                [trialStart, now.toISOString()]
            );
        } else {
            await db.runAsync(
                `INSERT INTO subscription_state (id, trialStartDate, subscriptionStatus, createdAt, updatedAt)
                 VALUES (1, ?, 'trial', ?, ?)`,
                [trialStart, now.toISOString(), now.toISOString()]
            );
        }

        // 테스트를 위해 lastTrialPushAt 초기화 (알림을 다시 보낼 수 있도록)
        await db.runAsync(
            `UPDATE subscription_state SET lastTrialPushAt = NULL WHERE id = 1`
        );

        // Let the system naturally schedule the notification
        await scheduleTrialEndNotificationIfNeeded(trialStart);

        console.log('[Subscription] Trial expiring test mode - trial start set to:', trialStart);
    } catch (error) {
        console.error('[Subscription] Set trial expiring test mode failed:', error);
        throw error;
    }
}

// ============================================================
// Payment-related functions
// ============================================================

/**
 * 결제 성공 후 처리
 */
export async function handlePurchaseSuccess(): Promise<void> {
    console.log('Handling purchase success');

    // License 확인
    const { checkLicenseAfterPurchase, handleLicenseResponse } = await import('./licenseChecker');
    const licenseResponse = await checkLicenseAfterPurchase();

    // License Response 처리
    await handleLicenseResponse(licenseResponse);
}

/**
 * 앱 시작 시 구독 복원 및 확인
 */
export async function checkAndRestoreSubscription(): Promise<void> {
    console.log('Checking and restoring subscription');

    // Google Play에서 구독 내역 조회
    const { restorePurchases } = await import('./paymentService');
    const { handleLicenseResponse } = await import('./licenseChecker');
    const hasActive = await restorePurchases();

    if (hasActive) {
        // 활성 구독 있음
        await handleLicenseResponse('LICENSED');
    } else {
        // 활성 구독 없음
        await handleLicenseResponse('NOT_LICENSED');
    }
}

/**
 * 무료 체험 시작
 */
export async function startTrialSubscription(): Promise<void> {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, now);
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');

    // Database에도 저장
    const db = await getDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO subscription_state (id, trialStartDate, subscriptionStatus, createdAt, updatedAt)
         VALUES (1, ?, ?, ?, ?)`,
        [now, 'trial', now, now]
    );

    // Schedule trial end notification
    await scheduleTrialEndNotificationIfNeeded(now);
}

/**
 * 구독 상태 조회 (단순 버전)
 */
export async function getSubscriptionState(): Promise<'free' | 'trial' | 'active' | 'expired'> {
    const status = await getSubscriptionStatus();
    return status.status === 'trial' ? 'trial' : status.status === 'active' ? 'active' : 'expired';
}

/**
 * 구독 비활성화
 */
export async function deactivateSubscription(): Promise<void> {
    await setSubscriptionStatus('expired');
}
