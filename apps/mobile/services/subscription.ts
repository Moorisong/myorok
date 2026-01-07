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
    HAS_USED_TRIAL: 'has_used_trial',
    RESTORE_ATTEMPTED: 'restore_attempted',
};

// ============================================================
// SSOT Types (구독 상태 판별 단일 진실 소스)
// ============================================================

/**
 * 구독 상태 (SSOT)
 * - loading: 스토어 검증 진행 중 / 데이터 불완전
 * - trial: 무료체험 활성
 * - subscribed: 유효한 구독 상태
 * - blocked: 접근 차단 상태
 */
export type SubscriptionStatus = 'loading' | 'trial' | 'subscribed' | 'blocked';

/**
 * 레거시 호환 상태 (기존 코드 호환용)
 */
export type LegacySubscriptionStatus = 'trial' | 'active' | 'expired';

/**
 * 스토어/서버 검증 결과 (SSOT 판별 기준)
 */
export interface VerificationResult {
    success: boolean;                    // 스토어 검증 성공 여부
    serverSyncSucceeded: boolean;        // 서버 통신 성공 여부 (CASE H)
    entitlementActive: boolean;          // 구독 권한 활성 여부
    expiresDate?: Date;                  // 만료일 (유효한 Date 객체만)
    productId?: string;                  // 스토어에서 반환된 상품 ID
    isPending?: boolean;                 // 결제 진행 중 여부 (CASE G)
    source: 'server' | 'cache';          // 데이터 출처
    serverTime: Date;                    // 서버 시간
    hasUsedTrial: boolean;               // 서버에서 확인된 체험 사용 여부
    hasPurchaseHistory: boolean;         // 서버에서 확인된 결제 이력
    restoreAttempted?: boolean;          // restore 시도 여부 (CASE D)
    restoreSucceeded?: boolean;          // restore 성공 여부
}

export interface SubscriptionState {
    status: SubscriptionStatus;
    trialStartDate?: string;
    daysRemaining?: number;
    subscriptionStartDate?: string;
    subscriptionExpiryDate?: string;
    hasPurchaseHistory?: boolean;        // CASE J 대응
}

// ============================================================
// SSOT Constants
// ============================================================

const TRIAL_DAYS = 7;
const API_URL = CONFIG.API_BASE_URL;
const EXPECTED_PRODUCT_ID = 'myorok_monthly_premium';
const LEGACY_PRODUCT_IDS = ['myorok_monthly_legacy_v1']; // CASE I: 레거시 상품 ID 허용 목록
const TIME_SYNC_TOLERANCE_MS = 5 * 60 * 1000; // 5분 (CASE F: 시간 조작 감지 허용치)

// ============================================================
// SSOT Core Function (핵심 상태 판별 함수)
// ============================================================

/**
 * 구독 상태 판별 (SSOT - 단일 진실 소스)
 * 
 * 우선순위:
 * 1. verification 실패 OR 불완전 데이터 OR 서버 통신 실패 (CASE H) → loading
 * 2. pending transaction 존재 (CASE G) → loading
 * 3. source === 'cache' (CASE C) → loading
 * 4. restore 미시도 OR restore 실패 (CASE D) → loading
 * 5. productId 불일치 AND not in allowlist (CASE B) → loading
 * 6. 시간 차이 > 5분 (CASE F) → loading
 * 7. entitlement 활성 AND verification 성공 AND (productId 일치 OR allowlist) → subscribed
 * 8. 체험 가능 (결제 ❌ AND 체험 ❌ AND 검증 완료) → trial
 * 9. 그 외 (CASE J 포함) → blocked
 */
export function determineSubscriptionState(result: VerificationResult): SubscriptionStatus {
    const {
        success,
        serverSyncSucceeded,
        entitlementActive,
        expiresDate,
        productId,
        isPending,
        source,
        serverTime,
        hasUsedTrial,
        hasPurchaseHistory,
        restoreAttempted,
        restoreSucceeded,
    } = result;

    // 1. 검증 실패, 불완전 데이터, 또는 서버 통신 실패 (CASE A, H)
    if (!success || !serverSyncSucceeded) {
        console.log('[SSOT] State: loading (verification or server sync failed)');
        return 'loading';
    }

    // 2. 결제 진행 중 (CASE G)
    if (isPending) {
        console.log('[SSOT] State: loading (pending transaction)');
        return 'loading';
    }

    // 3. 캐시 데이터 (서버 미검증) (CASE C)
    if (source === 'cache') {
        console.log('[SSOT] State: loading (cache data, server verification required)');
        return 'loading';
    }

    // 4. restore 미시도 또는 실패 (CASE D) - 첫 설치가 아닌 경우에만 적용
    // Note: 최초 설치에서는 restore 없이도 trial 가능
    if (restoreAttempted === false && hasPurchaseHistory) {
        console.log('[SSOT] State: loading (restore not attempted but has purchase history)');
        return 'loading';
    }
    if (restoreAttempted === true && restoreSucceeded === false && hasPurchaseHistory) {
        console.log('[SSOT] State: loading (restore failed but has purchase history)');
        return 'loading';
    }

    // 5. expiresDate 유효성 검사 (CASE A)
    if (entitlementActive && (!expiresDate || isNaN(expiresDate.getTime()))) {
        console.log('[SSOT] State: loading (expiresDate invalid)');
        return 'loading';
    }

    // 6. Product ID 검사 (CASE B, I)
    const isValidProductId = productId === EXPECTED_PRODUCT_ID || LEGACY_PRODUCT_IDS.includes(productId || '');
    if (entitlementActive && !isValidProductId) {
        console.log('[SSOT] State: loading (productId mismatch:', productId, ')');
        return 'loading';
    }

    // 7. 유효한 구독 상태
    if (entitlementActive && expiresDate && expiresDate > serverTime) {
        console.log('[SSOT] State: subscribed (entitlement active, expires:', expiresDate, ')');
        return 'subscribed';
    }

    // 8. 체험 가능 조건
    if (!hasPurchaseHistory && !hasUsedTrial) {
        console.log('[SSOT] State: trial (new user, no purchase history, no trial used)');
        return 'trial';
    }

    // 9. 그 외 (CASE J 포함)
    console.log('[SSOT] State: blocked (hasPurchaseHistory:', hasPurchaseHistory, ', hasUsedTrial:', hasUsedTrial, ')');
    return 'blocked';
}

/**
 * 레거시 상태를 새 SSOT 상태로 변환
 */
export function convertLegacyStatus(legacy: LegacySubscriptionStatus): SubscriptionStatus {
    switch (legacy) {
        case 'active':
            return 'subscribed';
        case 'expired':
            return 'blocked';
        case 'trial':
            return 'trial';
        default:
            return 'blocked';
    }
}

/**
 * 새 SSOT 상태를 레거시 상태로 변환 (기존 코드 호환용)
 */
export function convertToLegacyStatus(status: SubscriptionStatus): LegacySubscriptionStatus {
    switch (status) {
        case 'subscribed':
            return 'active';
        case 'blocked':
            return 'expired';
        case 'loading':
            return 'expired'; // loading은 기존에 없으므로 expired로 처리 (안전 측)
        case 'trial':
            return 'trial';
        default:
            return 'expired';
    }
}

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
 * Note: 이 함수는 로컬 상태를 반환합니다. 최종 상태 판별은 verifySubscriptionWithStore()를 사용하세요.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionState> {
    const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
    const rawStatus = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
    const subscriptionStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
    const subscriptionExpiryDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);

    // 레거시 상태 값 변환 ('active' -> 'subscribed', 'expired' -> 'blocked')
    let status: SubscriptionStatus;
    if (rawStatus === 'active') {
        status = 'subscribed';
    } else if (rawStatus === 'expired') {
        status = 'blocked';
    } else if (rawStatus === 'trial' || rawStatus === 'subscribed' || rawStatus === 'blocked' || rawStatus === 'loading') {
        status = rawStatus as SubscriptionStatus;
    } else {
        status = 'trial'; // 기본값
    }

    if (status === 'trial' && trialStartDate) {
        const daysRemaining = calculateDaysRemaining(trialStartDate);

        // Auto-expire trial if time is up
        if (daysRemaining <= 0) {
            await setSubscriptionStatus('blocked');
            return {
                status: 'blocked',
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

    if (status === 'subscribed') {
        // Active 구독 만료 체크
        if (subscriptionExpiryDate) {
            const expiryDate = new Date(subscriptionExpiryDate);
            const now = new Date();

            if (expiryDate < now) {
                // 구독 만료됨
                await setSubscriptionStatus('blocked');
                return {
                    status: 'blocked',
                    subscriptionStartDate: subscriptionStartDate || undefined,
                    subscriptionExpiryDate: subscriptionExpiryDate,
                    daysRemaining: 0,
                };
            }
        }

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
    return state.status === 'trial' || state.status === 'subscribed';
}

/**
 * Activate subscription after successful purchase
 */
export async function activateSubscription(expiryDate?: string): Promise<void> {
    const now = new Date().toISOString();
    const expiry = expiryDate || getDefaultExpiryDate();

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

    // Sync to server
    const userId = await AsyncStorage.getItem('current_user_id');
    if (userId) {
        const trialStartDate = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        await syncSubscriptionToServer(userId, {
            status: 'subscribed',
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
            const daysRemaining = calculateDaysRemaining(trialStartDate);

            if (daysRemaining <= 0) {
                await expireSubscriptionForUser(userId);
                return {
                    status: 'blocked',
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

    // 실제 Google Play 구독 정보 가져오기
    const { getSubscriptionDetails } = await import('./paymentService');
    const subscriptionDetails = await getSubscriptionDetails();

    // License 확인
    const { checkLicenseAfterPurchase, handleLicenseResponse } = await import('./licenseChecker');
    const licenseResponse = await checkLicenseAfterPurchase();

    // License Response 처리 (실제 만료일 전달)
    await handleLicenseResponse(licenseResponse, subscriptionDetails.expiryDate);
}

/**
 * 앱 시작 시 구독 복원 및 확인
 * 주의: 이 함수는 로컬 상태가 expired일 때만 호출해야 합니다.
 * Google Play에서 구독을 찾으면 활성화하지만, 찾지 못해도 기존 상태를 변경하지 않습니다.
 */
export async function checkAndRestoreSubscription(): Promise<void> {
    console.log('Checking and restoring subscription');

    try {
        // Google Play에서 구독 내역 조회
        const { restorePurchases, getSubscriptionDetails } = await import('./paymentService');
        const { handleLicenseResponse } = await import('./licenseChecker');
        const hasActive = await restorePurchases();

        if (hasActive) {
            // 활성 구독 있음 - 실제 만료일 가져오기
            const subscriptionDetails = await getSubscriptionDetails();
            await handleLicenseResponse('LICENSED', subscriptionDetails.expiryDate);
            console.log('[Subscription] Subscription restored successfully');
        } else {
            // 활성 구독 없음 - 기존 상태 유지 (NOT_LICENSED를 보내지 않음)
            console.log('[Subscription] No active subscription found in Google Play, keeping local state');
        }
    } catch (error) {
        // Google Play 연결 실패 시에도 기존 상태 유지
        console.error('[Subscription] Failed to check Google Play subscription:', error);
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
}
