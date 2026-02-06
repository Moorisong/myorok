import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './database';
import { scheduleTrialEndNotification, cancelTrialEndNotification } from './NotificationService';
import { handleLicenseResponse, checkLicenseAfterPurchase } from './licenseChecker';
import { restorePurchases, getEntitlementVerification } from './paymentService';
import { CONFIG } from '../constants/config';
import { getDeviceId } from './device';

import {
    SUBSCRIPTION_KEYS,
    SubscriptionStatus,
    LegacySubscriptionStatus,
    VerificationResult,
    SubscriptionState,
    fetchServerTime,
    fetchTrialStatus,
    recordTrialStartOnServer,
    fetchSubscriptionVerification,
    verifySubscriptionWithServer,
    convertLegacyStatus,
    convertToLegacyStatus,
} from './subscription-ssot';

// Re-export for backward compatibility
export {
    SUBSCRIPTION_KEYS,
    SubscriptionStatus,
    LegacySubscriptionStatus,
    VerificationResult,
    SubscriptionState,
    fetchServerTime,
    fetchTrialStatus,
    recordTrialStartOnServer,
    fetchSubscriptionVerification,
    verifySubscriptionWithServer,
    convertLegacyStatus,
    convertToLegacyStatus,
} from './subscription-ssot';

// 로컬에서 사용하는 상수 정의
const TRIAL_DAYS = 7;
const API_URL = CONFIG.API_BASE_URL;

/**
 * Initialize subscription on first app launch
 * Sets trial start date if not already set
 *
 * 앱 재설치 시 서버 상태를 먼저 확인하여 중복 trial 방지
 */
export async function initializeSubscription(): Promise<void> {
    // 0. 테스트 모드 확인 - 테스트 중에는 자동 초기화를 건너뜀 (테스트 케이스에서 설정한 상태 보호)
    try {
        const TestUserManager = (await import('./testUserManager')).default;
        const testManager = TestUserManager.getInstance();
        if (await testManager.isTestModeActive()) {
            console.log('[Subscription] Test mode active, skipping automatic initialization');
            return;
        }
    } catch (e) {
        console.warn('[Subscription] Failed to check test mode:', e);
    }

    const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
    const existingStatus = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);

    // 이미 상태가 설정되어 있다면 (expired, subscribed 등) 덮어쓰지 않음
    // 단, trial 상태이면서 날짜가 없는 경우(오류)는 복구
    if (existingStatus && existingStatus !== 'trial') {
        console.log('[Subscription] Skipping initialization, existing status:', existingStatus);
        return;
    }

    if (!trialStartDate) {
        // 서버에서 trial 상태 확인 (앱 재설치 후 중복 trial 방지 - SSOT 강화)
        const userId = await AsyncStorage.getItem('current_user_id');
        if (userId) {
            const serverTrialStatus = await fetchTrialStatus(userId);

            if (serverTrialStatus) {
                // deviceId 기반 중복 trial 방지 로직 추가
                const deviceIdBasedBlock = !serverTrialStatus.deviceBasedTrialAvailable && serverTrialStatus.deviceTrialInfo?.deviceTrialUsed;

                // 서버에서 이미 trial을 사용한 경우
                if (serverTrialStatus.hasUsedTrial || deviceIdBasedBlock) {
                    console.log('[Subscription] Trial already used on server, syncing local state', {
                        hasUsedTrial: serverTrialStatus.hasUsedTrial,
                        deviceIdBasedBlock,
                        deviceTrialInfo: serverTrialStatus.deviceTrialInfo
                    });

                    // 서버의 trial 시작 날짜로 로컬 동기화
                    const trialStartedAt = serverTrialStatus.trialStartedAt || serverTrialStatus.deviceTrialInfo?.deviceTrialStartedAt;

                    if (trialStartedAt) {
                        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, trialStartedAt);
                        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.HAS_USED_TRIAL, 'true');

                        // trial이 아직 활성 상태인지 확인 (서버 시간 기준)
                        const trialStart = new Date(trialStartedAt);
                        const serverNow = serverTrialStatus.serverTime;
                        const trialEnd = new Date(trialStart);
                        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

                        const db = await getDatabase();
                        const nowIso = new Date().toISOString();

                        if (serverNow < trialEnd) {
                            // trial 아직 활성 - trial 상태로 설정
                            await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');
                            console.log('[Subscription] Trial still active, setting trial status');

                            await db.runAsync(
                                `INSERT OR REPLACE INTO subscription_state (id, trialStartDate, subscriptionStatus, createdAt, updatedAt)
                                 VALUES (1, ?, ?, ?, ?)`,
                                [trialStartedAt, 'trial', nowIso, nowIso]
                            );

                            // trial 알림 스케줄링
                            await scheduleTrialEndNotificationIfNeeded(trialStartedAt);
                        } else {
                            // trial 만료 - blocked 상태로 설정 (SSOT에서 최종 판정)
                            await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'blocked');
                            console.log('[Subscription] Trial expired on server, setting blocked status');

                            await db.runAsync(
                                `INSERT OR REPLACE INTO subscription_state (id, trialStartDate, subscriptionStatus, createdAt, updatedAt)
                                 VALUES (1, ?, ?, ?, ?)`,
                                [trialStartedAt, 'blocked', nowIso, nowIso]
                            );
                        }
                    }
                    return;
                }
                // 서버에서 trial 미사용 확인됨 - 아래에서 새 trial 시작
                console.log('[Subscription] Server confirmed: trial not used yet, deviceId available for trial');
            } else {
                // 서버 통신 실패 시 - SSOT에서 처리하도록 로컬 초기화 건너뜀
                console.log('[Subscription] Server trial status check failed, skipping local initialization (SSOT will handle)');
                return;
            }
        }

        // IMPORTANT: initializeSubscription SHOULD NOT calculate days remaining or expiration.
        // It only initializes state for new users or syncs from server.

        // 신규 사용자 또는 서버에서 trial 미사용 확인됨 - 새 trial 시작
        const now = new Date().toISOString();
        const initialDays = TRIAL_DAYS;

        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, now);
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');
        // SSOT: Initial local state for new trial serves as instant cache
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.DAYS_REMAINING, initialDays.toString());

        // Also save to database for backup
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO subscription_state (id, trialStartDate, subscriptionStatus, createdAt, updatedAt)
       VALUES (1, ?, ?, ?, ?)`,
            [now, 'trial', now, now]
        );

        // 서버에 trial 시작 기록 (verifySubscriptionWithServer 호출 전에 서버에 기록되어야 함)
        if (userId) {
            await recordTrialStartOnServer(userId);
        }

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
 * Note: 이 함수는 로컬 상태를 반환합니다. 최종 상태 판별은 verifySubscriptionWithStore()를 사용하세요.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionState> {
    const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
    const rawStatus = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
    const subscriptionStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
    const subscriptionExpiryDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);
    const hasPurchaseHistoryStr = await AsyncStorage.getItem('has_purchase_history');
    const daysRemainingStr = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.DAYS_REMAINING);

    // 레거시 상태 값 변환 ('active' -> 'subscribed', 'expired' -> 'blocked')
    let status: SubscriptionStatus;
    if (rawStatus === 'active') {
        status = 'subscribed';
    } else if (rawStatus === 'expired') {
        status = 'blocked';
    } else if (rawStatus === 'trial' || rawStatus === 'subscribed' || rawStatus === 'blocked' || rawStatus === 'loading') {
        status = rawStatus as SubscriptionStatus;
    } else {
        status = 'blocked'; // 안전한 기본값 (실수/오류 시 체험 부여 방지)
    }

    const hasPurchaseHistory = hasPurchaseHistoryStr === 'true';

    if (status === 'trial' && trialStartDate) {
        // SSOT Rule: daysRemaining is display-only.
        // Priority: 1. Server/Cache value  2. Local estimation (Fallback for UI)
        let daysRemaining: number | undefined;

        if (daysRemainingStr) {
            daysRemaining = parseInt(daysRemainingStr, 10);
        } else {
            // Fallback: If server/cache is missing (e.g. existing user or server not updated),
            // estimate locally for display to avoid stuck "Checking..." state.
            // This does NOT affect status/blocking logic.
            daysRemaining = estimateLocalDaysRemaining(trialStartDate);
        }

        return {
            status: 'trial',
            trialStartDate,
            daysRemaining,
            hasPurchaseHistory,
        };
    }

    if (status === 'subscribed') {
        // F-1: 로컬 시간 기반 만료 체크 제거 - SSOT 검증에서 서버 시간 기준으로 판정
        return {
            status: 'subscribed',
            subscriptionStartDate: subscriptionStartDate || undefined,
            subscriptionExpiryDate: subscriptionExpiryDate || undefined,
            hasPurchaseHistory,
        };
    }

    return {
        status: 'blocked',
        trialStartDate: trialStartDate || undefined,
        daysRemaining: 0,
        hasPurchaseHistory,
    };
}

/**
 * Calculate days remaining in trial period
 */
// calculateDaysRemaining removed - SSOT Rule: Server calculates days remaining.

/**
 * Estimate days remaining locally (Display Fallback Only)
 * SSOT: This MUST NOT be used for blocking/expiry logic. Only for UI.
 */
function estimateLocalDaysRemaining(trialStartDate: string): number {
    const startDate = new Date(trialStartDate);
    const now = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + TRIAL_DAYS);

    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // Don't return negative for estimation
}

/**
 * Check if user has access to app features
 * Returns false if trial expired and not subscribed
 */
export async function isAppAccessAllowed(): Promise<boolean> {
    const state = await getSubscriptionStatus();
    return state.status === 'trial' || state.status === 'subscribed';
}

/**
 * Activate subscription after successful purchase
 * @param expiryDate - Subscription expiry date
 * @param productId - Product ID from store
 * @param purchaseToken - Purchase token for verification
 * @param requireServerSync - If true, rollback to 'loading' if server sync fails (SSOT D-1 compliance)
 */
export async function activateSubscription(
    expiryDate?: string,
    productId?: string,
    purchaseToken?: string,
    requireServerSync: boolean = false
): Promise<void> {
    const now = new Date().toISOString();
    const expiry = expiryDate || getDefaultExpiryDate();

    // 서버 동기화가 필요한 경우, 먼저 서버에 동기화 시도
    if (requireServerSync) {
        const userId = await AsyncStorage.getItem('current_user_id');
        if (!userId) {
            // userId 없으면 서버 동기화 불가 -> 구독 활성화 거부
            console.log('[Subscription] No userId, cannot activate subscription (SSOT D-1)');
            await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'loading');
            throw new Error('No userId for server sync');
        }

        const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        try {
            await syncSubscriptionToServer(userId, {
                status: 'subscribed',
                trialStartDate: trialStartDate || undefined,
                subscriptionStartDate: now,
                subscriptionExpiryDate: expiry,
            }, productId, purchaseToken, true); // throwOnError = true
        } catch (error) {
            // 서버 동기화 실패 시 구독 활성화하지 않음 (SSOT D-1: 네트워크 없으면 loading 유지)
            console.log('[Subscription] Server sync failed, not activating subscription (SSOT D-1)');
            await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'loading');
            throw error;
        }
    }

    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'subscribed');
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE, now);
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE, expiry);

    // Update database
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE subscription_state
     SET subscriptionStatus = ?, subscriptionStartDate = ?, subscriptionExpiryDate = ?, updatedAt = ?
     WHERE id = 1`,
        ['subscribed', now, expiry, now]
    );

    // Cancel trial end notification
    await cancelTrialEndNotification();

    // Sync to server (if not already done above)
    if (!requireServerSync) {
        const userId = await AsyncStorage.getItem('current_user_id');
        if (userId) {
            const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
            await syncSubscriptionToServer(userId, {
                status: 'subscribed',
                trialStartDate: trialStartDate || undefined,
                subscriptionStartDate: now,
                subscriptionExpiryDate: expiry,
            }, productId, purchaseToken);
        }
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
export async function setSubscriptionStatus(
    status: SubscriptionStatus,
    options?: {
        skipSync?: boolean;
        daysRemaining?: number;
    }
): Promise<void> {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, status);

    const db = await getDatabase();
    await db.runAsync(
        `UPDATE subscription_state SET subscriptionStatus = ?, updatedAt = ? WHERE id = 1`,
        [status, now]
    );

    // Cache daysRemaining if provided (Display-only)
    if (options?.daysRemaining !== undefined) {
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.DAYS_REMAINING, options.daysRemaining.toString());
    } else {
        // If not provided (e.g. manual set), maybe clear it or keep existing? 
        // For safety/cleanness, if status is not trial, clear it.
        if (status !== 'trial') {
            await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.DAYS_REMAINING);
        }
    }

    // SSOT 검증 결과를 로컬에 저장할 때는 서버 sync를 건너뜀 (순환 방지)
    if (options?.skipSync) {
        console.log('[Subscription] Skipping server sync (SSOT result storage)');
        return;
    }

    // Sync to server - use the status parameter directly to avoid circular reference
    const userId = await AsyncStorage.getItem('current_user_id');
    if (userId) {
        // Build minimal state with the new status (don't call getSubscriptionStatus - it reads from AsyncStorage before it's fully synced)
        const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        const subscriptionStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
        const subscriptionExpiryDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);

        await syncSubscriptionToServer(userId, {
            status,
            trialStartDate: trialStartDate || undefined,
            subscriptionStartDate: subscriptionStartDate || undefined,
            subscriptionExpiryDate: subscriptionExpiryDate || undefined,
        });
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
export function getTrialCountdownText(daysRemaining: number | undefined): string {
    if (daysRemaining === undefined) return '무료 체험 확인 중';
    if (daysRemaining < 0) return '무료 체험 종료';
    if (daysRemaining === 0) return '무료 체험 오늘 종료';
    return `무료 체험 D-${daysRemaining}`;
}

/**
 * Reset subscription (for testing)
 */
export async function resetSubscription(): Promise<void> {
    try {
        console.log('[Subscription] Resetting subscription state...');

        // 0. SubscriptionManager 캐시 초기화 (테스트 격리)
        const SubscriptionManager = (await import('./SubscriptionManager')).default;
        const manager = SubscriptionManager.getInstance();
        await manager.resetForTesting();

        // 1. Reset Server Data
        const userId = await AsyncStorage.getItem('current_user_id');
        if (userId) {
            await resetServerSubscription(userId);
        }

        // 2. Clear AsyncStorage
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.HAS_USED_TRIAL);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED);

        // 3. Clear database
        const db = await getDatabase();
        await db.execAsync('DELETE FROM subscription_state');

        // 4. Re-initialize
        await initializeSubscription();

        // 5. Verify
        const status = await getSubscriptionStatus();
        console.log('[Subscription] Reset complete, new status:', status);
    } catch (error) {
        console.error('[Subscription] Reset failed:', error);
        throw error;
    }
}

/**
 * Reset server subscription data (Helper)
 */
async function resetServerSubscription(userId: string): Promise<void> {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
            console.log('[Subscription] No JWT token for server reset');
            return;
        }

        const response = await fetch(`${API_URL}/api/subscription/reset/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.log('[Subscription] Server reset failed:', response.status);
        } else {
            console.log('[Subscription] Server data reset successful');
        }
    } catch (error) {
        console.error('[Subscription] Server reset error:', error);
    }
}

/**
 * Sync subscription state to server
 */
async function syncSubscriptionToServer(
    userId: string,
    state: SubscriptionState,
    productId?: string,
    purchaseToken?: string,
    throwOnError: boolean = false
): Promise<void> {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
            console.warn('[Subscription] No JWT token, skipping server sync');
            return;
        }

        // SSOT: loading 상태는 일시적인 UI 상태이므로 서버에 동기화하지 않음 (500 에러 방지)
        if (state.status === 'loading') {
            console.log('[Subscription] Skipping sync for transient loading state');
            return;
        }

        const deviceId = await getDeviceId();

        // Timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        console.log(`[Subscription] Syncing to ${API_URL}/api/subscription/sync...`);

        const response = await fetch(`${API_URL}/api/subscription/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                userId,
                deviceId,
                status: state.status,
                trialStartDate: state.trialStartDate,
                subscriptionStartDate: state.subscriptionStartDate,
                subscriptionExpiryDate: state.subscriptionExpiryDate,
                productId,
                purchaseToken,
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Subscription] Server sync failed:', response.status, errorText);
            throw new Error(`Server sync failed: ${response.status}`);
        }

        console.log('[Subscription] Server sync successful');
    } catch (error) {
        console.error('[Subscription] Server sync error:', error);
        if (throwOnError) {
            throw error;
        }
        // Don't throw - sync is optional for normal usage
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
            subscriptionStatus: string; // DB에 레거시 값('active', 'expired')이 저장될 수 있음
            subscriptionStartDate: string | null;
            subscriptionExpiryDate: string | null;
        }>(
            'SELECT trialStartDate, subscriptionStatus, subscriptionStartDate, subscriptionExpiryDate FROM subscription_state WHERE userId = ?',
            [userId]
        );

        if (!record) {
            // No subscription record for this user
            return {
                status: 'blocked',
                daysRemaining: 0,
            };
        }

        const { trialStartDate, subscriptionStatus, subscriptionStartDate, subscriptionExpiryDate } = record;

        if (subscriptionStatus === 'trial' && trialStartDate) {
            // SSOT: Local calculation removed.
            // Server should update status to 'blocked' if expired.
            // We cannot know daysRemaining without server response or cached value.
            return {
                status: 'trial',
                trialStartDate,
                daysRemaining: undefined,
            };
        }

        // DB에서 읽은 레거시 상태 값 변환
        if (subscriptionStatus === 'active' || subscriptionStatus === 'subscribed') {
            return {
                status: 'subscribed',
                subscriptionStartDate: subscriptionStartDate || undefined,
                subscriptionExpiryDate: subscriptionExpiryDate || undefined,
            };
        }

        return {
            status: 'blocked',
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
 * SSOT: 서버에 먼저 기록 후 로컬 저장 (CASE E: 즉시 동기 기록)
 */
export async function startTrialForUser(userId: string): Promise<void> {
    try {
        // 1. 서버에 먼저 체험 시작 기록 (CASE E: 크래시 방지)
        const serverRecorded = await recordTrialStartOnServer(userId);
        if (!serverRecorded) {
            // 서버에 이미 기록이 있거나 실패 = 체험 불가
            console.log('[Subscription] Trial not allowed - server rejected or already used');
            throw new Error('Trial not allowed');
        }

        const db = await getDatabase();
        const now = new Date().toISOString();

        // 2. 로컬 저장
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, now);
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.HAS_USED_TRIAL, 'true');

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

        console.log('[Subscription] Trial started for user:', userId);
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
            ['subscribed', startDate, expiryDate, now, userId]
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
            ['blocked', now, userId]
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
        pushDate.setDate(pushDate.getDate() + 0); // 1 day trial - 1 day = 0 days

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

    // 실제 Google Play 구독 정보 가져오기
    const { getSubscriptionDetails } = await import('./paymentService');
    const subscriptionDetails = await getSubscriptionDetails();

    // License 확인
    const { checkLicenseAfterPurchase, handleLicenseResponse } = await import('./licenseChecker');
    const licenseResponse = await checkLicenseAfterPurchase();

    // License Response 처리 (실제 만료일 전달)
    await handleLicenseResponse(
        licenseResponse,
        subscriptionDetails.expiryDate,
        subscriptionDetails.productId,
        subscriptionDetails.purchaseToken
    );
}

/**
 * 앱 시작 시 구독 복원 및 확인
 * 주의: 이 함수는 로컬 상태가 expired일 때만 호출해야 합니다.
 * Google Play에서 구독을 찾으면 활성화하지만, 서버 동기화가 실패하면 loading 상태를 유지합니다 (D-1 SSOT).
 */
export async function checkAndRestoreSubscription(): Promise<boolean> {
    console.log('Checking and restoring subscription');

    try {
        // Google Play에서 구독 내역 조회
        const { restorePurchases, getSubscriptionDetails } = await import('./paymentService');
        const { handleLicenseResponse } = await import('./licenseChecker');
        // 자동 복원에서도 플래그 설정 (SSOT 판별을 위해 필요)
        const hasActive = await restorePurchases(true);

        if (hasActive) {
            // 활성 구독 있음 - 실제 만료일 가져오기
            const subscriptionDetails = await getSubscriptionDetails();
            // requireServerSync=true: 서버 동기화 실패 시 구독 활성화하지 않음 (D-1 SSOT)
            await handleLicenseResponse(
                'LICENSED',
                subscriptionDetails.expiryDate,
                subscriptionDetails.productId,
                subscriptionDetails.purchaseToken,
                true // requireServerSync
            );
            console.log('[Subscription] Subscription restored successfully');
            return true;
        } else {
            // 활성 구독 없음 - 기존 상태 유지 (NOT_LICENSED를 보내지 않음)
            console.log('[Subscription] No active subscription found in Google Play, keeping local state');

            // 자동 복원 실패 시 플래그 제거
            // CASE C-2는 사용자가 명시적으로 "복원하기" 버튼을 눌렀을 때만 표시되어야 함
            await AsyncStorage.removeItem('restore_attempted');
            await AsyncStorage.removeItem('restore_succeeded');
            console.log('[Subscription] Cleared restore flags (auto-restore failed, not user action)');
            return false;
        }
    } catch (error) {
        // Google Play 연결 실패 또는 서버 동기화 실패 시 loading 상태 유지 (D-1 SSOT)
        console.log('[Subscription] Restore failed, keeping loading state (D-1 SSOT):', error);

        // 에러 발생 시에도 플래그 제거 (자동 복원 실패)
        await AsyncStorage.removeItem('restore_attempted');
        await AsyncStorage.removeItem('restore_succeeded');
        return false;
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
 * 구독 상태 조회 (단순 버전) - 레거시 호환용 리턴 타입
 */
export async function getSubscriptionState(): Promise<'free' | 'trial' | 'active' | 'expired'> {
    const status = await getSubscriptionStatus();
    // 새 SSOT 상태를 레거시 상태로 변환
    if (status.status === 'trial') return 'trial';
    if (status.status === 'subscribed') return 'active';
    return 'expired'; // loading, blocked -> expired
}

/**
 * 구독 비활성화
 */
export async function deactivateSubscription(): Promise<void> {
    await setSubscriptionStatus('blocked');

    // 서버에도 체험 만료 알림 (테스트용)
    const userId = await AsyncStorage.getItem('current_user_id');
    if (userId) {
        try {
            const token = await AsyncStorage.getItem('jwt_token');
            if (token) {
                await fetch(`${API_URL}/api/subscription/expire-trial/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('[Subscription] Expired trial on server for testing');
            }

            // B-1: hasPurchaseHistory=true, entitlementActive=false (끝난 구독)
            await AsyncStorage.setItem('has_purchase_history', 'true');
            await AsyncStorage.setItem('entitlement_active', 'false');
        } catch (e) {
            console.error('[Subscription] Failed to expire trial on server:', e);
        }
    }
}

/**
 * forceExpired 플래그 제거 (테스트 후 정상 상태로 복귀)
 */
export async function clearForceExpiredFlag(): Promise<void> {
    const userId = await AsyncStorage.getItem('current_user_id');
    if (userId) {
        try {
            const token = await AsyncStorage.getItem('jwt_token');
            if (token) {
                await fetch(`${API_URL}/api/subscription/clear-force-expired/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('[Subscription] Cleared forceExpired flag on server');
            }
        } catch (e) {
            console.error('[Subscription] Failed to clear forceExpired flag:', e);
            throw e;
        }
    }
}

/**
 * Expire Trial for current user (Test only)
 */
export async function expireTrial(): Promise<void> {
    try {
        console.log('[Subscription] Expiring trial for current user...');

        const userId = await AsyncStorage.getItem('current_user_id');
        if (!userId) throw new Error('로그인이 필요합니다');

        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) throw new Error('JWT 토큰이 없습니다');

        // 1. 서버에 체험 만료 요청
        const response = await fetch(`${API_URL}/api/subscription/expire-trial/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`서버 요청 실패: ${response.status}`);
        }

        console.log('[Subscription] Expired trial on server');

        // 2. 로컬 캐시 무효화 및 SubscriptionManager 리셋
        const SubscriptionManager = (await import('./SubscriptionManager')).default;
        const manager = SubscriptionManager.getInstance();
        await manager.resetForTesting();

        console.log('[Subscription] Expire Trial Complete');
    } catch (error) {
        console.error('[Subscription] Expire trial failed:', error);
        throw error;
    }
}

/**
 * Setup Test Case C-1: Purchase History O, Entitlement X (CASE J)
 *
 * [신규 구조] TestUserManager 기반 - 독립된 테스트 userId 사용
 * 1. 테스트 userId로 전환 (test_c1_{원래userId})
 * 2. 과거 구독 이력 생성 (hasPurchaseHistory=true)
 * 3. 현재 blocked 상태로 설정
 * 4. 복원 시도 플래그 설정
 */
export async function setupTestCase_C1(): Promise<void> {
    try {
        console.log('[Subscription] Setting up Case C-1 (isolated)...');

        // 1. TestUserManager로 테스트 userId 전환
        const TestUserManager = (await import('./testUserManager')).default;
        const testManager = TestUserManager.getInstance();
        const testUserId = await testManager.startTest('C-1');
        console.log('[Subscription] Test userId:', testUserId);

        // 2. 과거 구독 이력 생성 (1년 전)
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        const pastExpiry = new Date(pastDate);
        pastExpiry.setMonth(pastExpiry.getMonth() + 1);

        await syncSubscriptionToServer(testUserId, {
            status: 'subscribed',
            trialStartDate: pastDate.toISOString(),
            subscriptionStartDate: pastDate.toISOString(),
            subscriptionExpiryDate: pastExpiry.toISOString(),
        }, 'test_product_id', 'test_token', true);
        console.log('[Subscription] Created past subscription history');

        // 3. 현재 blocked 상태로 설정
        await syncSubscriptionToServer(testUserId, {
            status: 'blocked',
            trialStartDate: pastDate.toISOString(),
        }, undefined, undefined, true);
        console.log('[Subscription] Set status to blocked');

        // 4. 로컬 데이터 초기화
        await testManager.cleanupTestLocalData();

        // 6. SubscriptionManager 설정
        const SubscriptionManager = (await import('./SubscriptionManager')).default;
        const manager = SubscriptionManager.getInstance();
        await manager.setTestMode(true, false);
        await manager.resetForTesting();

        // 7. 구독 정보 설정 (resetForTesting 이후에 설정)
        // Case C-1: 결제 이력은 있으나 권한은 없는 상태 (CASE J 유도)
        await AsyncStorage.setItem('has_purchase_history', 'true');
        await AsyncStorage.setItem('entitlement_active', 'false');
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'blocked');

        console.log('[Subscription] Case C-1 Setup Complete');
        console.log('[Subscription] 앱 재시작(r) 후 구독 복원 화면이 표시되어야 합니다');
    } catch (error) {
        console.error('[Subscription] Setup Case C-1 failed:', error);
        throw error;
    }
}

/**
 * Setup Test Case C-2: Restore 시도했으나 실패 (CASE D)
 *
 * [신규 구조] TestUserManager 기반 - 독립된 테스트 userId 사용
 * 1. 테스트 userId로 전환 (test_c2_{원래userId})
 * 2. 과거 구독 이력 생성
 * 3. 복원 실패 플래그 설정
 */
export async function setupTestCase_C2(): Promise<void> {
    try {
        console.log('[Subscription] Setting up Case C-2 (isolated)...');

        // 1. TestUserManager로 테스트 userId 전환
        const TestUserManager = (await import('./testUserManager')).default;
        const testManager = TestUserManager.getInstance();
        const testUserId = await testManager.startTest('C-2');
        console.log('[Subscription] Test userId:', testUserId);

        // 2. 과거 구독 이력 생성
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        const pastExpiry = new Date(pastDate);
        pastExpiry.setMonth(pastExpiry.getMonth() + 1);

        await syncSubscriptionToServer(testUserId, {
            status: 'subscribed',
            trialStartDate: pastDate.toISOString(),
            subscriptionStartDate: pastDate.toISOString(),
            subscriptionExpiryDate: pastExpiry.toISOString(),
        }, 'test_product_id', 'test_token', true);
        console.log('[Subscription] Created past subscription history');

        // 3. 현재 blocked 상태로 설정
        await syncSubscriptionToServer(testUserId, {
            status: 'blocked',
            trialStartDate: pastDate.toISOString(),
        }, undefined, undefined, true);
        console.log('[Subscription] Set status to blocked');

        // 4. 로컬 데이터 초기화
        await testManager.cleanupTestLocalData();

        // 6. SubscriptionManager 설정
        const SubscriptionManager = (await import('./SubscriptionManager')).default;
        const manager = SubscriptionManager.getInstance();
        await manager.setTestMode(true, false);
        await manager.resetForTesting();

        // 7. 복원 실패 플래그 설정 (resetForTesting 이후에 설정해야 지워지지 않음)
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED, 'true');
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.RESTORE_SUCCEEDED, 'false');
        await AsyncStorage.setItem('has_purchase_history', 'true');
        await AsyncStorage.setItem('entitlement_active', 'false');

        console.log('[Subscription] Case C-2 Setup Complete');
        console.log('[Subscription] 앱 재시작(r) 후 복원 재시도 화면이 표시되어야 합니다');
    } catch (error) {
        console.error('[Subscription] Setup Case C-2 failed:', error);
        throw error;
    }
}

/**
 * 테스트 모드 종료 및 원래 계정 복귀
 */
export async function endTestMode(): Promise<void> {
    try {
        console.log('[Subscription] Ending test mode...');

        const TestUserManager = (await import('./testUserManager')).default;
        const testManager = TestUserManager.getInstance();
        await testManager.endTest();

        // SubscriptionManager 클린업
        const SubscriptionManager = (await import('./SubscriptionManager')).default;
        const manager = SubscriptionManager.getInstance();
        await manager.clearTestMode();

        console.log('[Subscription] Test mode ended, original account restored');
    } catch (error) {
        console.error('[Subscription] End test mode failed:', error);
        throw error;
    }
}
