import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';
import { getDeviceId } from './device';
import { getEntitlementVerification } from './paymentService';

export { getEntitlementVerification } from './paymentService';

export const SUBSCRIPTION_KEYS = {
    TRIAL_START_DATE: 'trial_start_date',
    SUBSCRIPTION_STATUS: 'subscription_status',
    SUBSCRIPTION_START_DATE: 'subscription_start_date',
    SUBSCRIPTION_EXPIRY_DATE: 'subscription_expiry_date',
    HAS_USED_TRIAL: 'has_used_trial',
    RESTORE_ATTEMPTED: 'restore_attempted',
    RESTORE_SUCCEEDED: 'restore_succeeded',
    DAYS_REMAINING: 'days_remaining',
};

const TRIAL_DAYS = 7;
const API_URL = CONFIG.API_BASE_URL;
const LEGACY_PRODUCT_IDS: string[] = [];

export type SubscriptionStatus = 'loading' | 'trial' | 'subscribed' | 'blocked' | 'expired';
export type LegacySubscriptionStatus = 'trial' | 'active' | 'expired';

export interface VerificationResult {
    success: boolean;
    serverSyncSucceeded: boolean;
    entitlementActive: boolean;
    expiresDate?: Date;
    productId?: string;
    isPending?: boolean;
    source: 'server' | 'cache';
    serverTime: Date;
    hasUsedTrial: boolean;
    trialActive?: boolean;
    hasPurchaseHistory: boolean;
    restoreAttempted?: boolean;
    restoreSucceeded?: boolean;
    daysRemaining?: number;
    deviceBasedTrialBlock?: boolean;
    deviceTrialInfo?: {
        deviceTrialUsed: boolean;
        deviceTrialUserId: string;
        deviceTrialStartedAt: string;
    } | null;
}

export interface SubscriptionState {
    status: SubscriptionStatus;
    trialStartDate?: string;
    daysRemaining?: number;
    subscriptionStartDate?: string;
    subscriptionExpiryDate?: string;
    hasPurchaseHistory?: boolean;
}

export async function fetchServerTime(): Promise<Date | null> {
    try {
        const response = await fetch(`${API_URL}/api/subscription/server-time`);
        if (!response.ok) {
            console.log('[SSOT] Server time fetch failed:', response.status);
            return null;
        }
        const data = await response.json();
        return new Date(data.data.serverTime);
    } catch (error) {
        console.error('[SSOT] Server time fetch error:', error);
        return null;
    }
}

export async function fetchTrialStatus(userId: string): Promise<{
    hasUsedTrial: boolean;
    trialStartedAt: string | null;
    serverTime: Date;
    deviceId?: string | null;
    deviceBasedTrialAvailable?: boolean;
    deviceTrialInfo?: {
        deviceTrialUsed: boolean;
        deviceTrialUserId: string;
        deviceTrialStartedAt: string;
    } | null;
} | null> {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
            console.log('[SSOT] No JWT token');
            return null;
        }

        const response = await fetch(`${API_URL}/api/subscription/trial-status/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.log('[SSOT] Trial status fetch failed:', response.status);
            return null;
        }

        const data = await response.json();
        return {
            hasUsedTrial: data.data.hasUsedTrial,
            trialStartedAt: data.data.trialStartedAt,
            serverTime: new Date(data.data.serverTime),
            deviceId: data.data.deviceId,
            deviceBasedTrialAvailable: data.data.deviceBasedTrialAvailable,
            deviceTrialInfo: data.data.deviceTrialInfo,
        };
    } catch (error) {
        console.error('[SSOT] Trial status fetch error:', error);
        return null;
    }
}

export async function recordTrialStartOnServer(userId: string): Promise<boolean> {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
            console.log('[SSOT] No JWT token for trial start');
            return false;
        }

        const deviceId = await getDeviceId();

        const response = await fetch(`${API_URL}/api/subscription/trial-start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, deviceId }),
        });

        if (response.status === 409) {
            console.log('[SSOT] Trial already used on server');
            return false;
        }

        if (!response.ok) {
            console.log('[SSOT] Trial start record failed:', response.status);
            return false;
        }

        console.log('[SSOT] Trial start recorded on server');
        return true;
    } catch (error) {
        console.error('[SSOT] Trial start record error:', error);
        return false;
    }
}

export async function fetchSubscriptionVerification(userId: string): Promise<VerificationResult | null> {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
            console.log('[SSOT] No JWT token for verification');
            return null;
        }

        const response = await fetch(`${API_URL}/api/subscription/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            console.log('[SSOT] Verification fetch failed:', response.status);
            return null;
        }

        const data = await response.json();
        const result = data.data;
        console.log('[SSOT] Raw server result:', JSON.stringify(result, null, 2));

        return {
            success: result.success,
            serverSyncSucceeded: result.serverSyncSucceeded,
            entitlementActive: result.entitlementActive,
            expiresDate: result.expiresDate ? new Date(result.expiresDate) : undefined,
            productId: result.productId || undefined,
            isPending: result.isPending || false,
            source: result.source || 'server',
            serverTime: new Date(result.serverTime),
            hasUsedTrial: result.hasUsedTrial,
            trialActive: result.trialActive,
            hasPurchaseHistory: result.hasPurchaseHistory,
            restoreAttempted: undefined,
            restoreSucceeded: undefined,
            daysRemaining: result.daysRemaining,
            deviceBasedTrialBlock: result.deviceBasedTrialBlock,
            deviceTrialInfo: result.deviceTrialInfo,
        };
    } catch (error) {
        console.error('[SSOT] Verification fetch error:', error);
        return null;
    }
}

export async function verifySubscriptionWithServer(): Promise<{
    status: SubscriptionStatus;
    state: SubscriptionState;
}> {
    const forceServerError = await AsyncStorage.getItem('dev_force_server_error');
    if (forceServerError === 'true') {
        console.log('[SSOT] D-2 Test: Simulating server 500 error');
        throw new Error('D-2 Test: Simulated server 500 error');
    }

    const userId = await AsyncStorage.getItem('current_user_id');

    if (!userId) {
        console.log('[SSOT] No user ID, returning blocked');
        return {
            status: 'blocked',
            state: { status: 'blocked' },
        };
    }

    const serverResult = await fetchSubscriptionVerification(userId);

    if (!serverResult) {
        console.log('[SSOT] Server verification failed, returning loading');
        return {
            status: 'loading',
            state: { status: 'loading' },
        };
    }

    const restoreAttempted = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED);
    const restoreSucceeded = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.RESTORE_SUCCEEDED);
    serverResult.restoreAttempted = restoreAttempted === 'true';
    serverResult.restoreSucceeded = restoreSucceeded === 'true';

    const localVerification = await getEntitlementVerification();
    if (localVerification.isPending) {
        console.log('[SSOT] Local pending transaction detected (CASE G)');
        serverResult.isPending = true;
        serverResult.restoreAttempted = false;
        serverResult.restoreSucceeded = false;
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.RESTORE_SUCCEEDED);
    }

    const status = determineSubscriptionState(serverResult);
    console.log(`[SSOT] Determined status for ${userId}: ${status}`);

    // SSOT 검증 결과를 로컬 캐시에 저장 (설정 탭 서브타이틀 등에서 사용)
    // loading 상태는 일시적이므로 저장하지 않음
    if (status !== 'loading') {
        await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, status);
        console.log(`[SSOT] Saved status '${status}' to local cache`);
    }

    await AsyncStorage.setItem(SUBSCRIPTION_KEYS.DAYS_REMAINING, serverResult.daysRemaining?.toString() || '0');
    await AsyncStorage.setItem('has_purchase_history', serverResult.hasPurchaseHistory ? 'true' : 'false');
    await AsyncStorage.setItem('entitlement_active', serverResult.entitlementActive ? 'true' : 'false');

    const state: SubscriptionState = {
        status,
        hasPurchaseHistory: serverResult.hasPurchaseHistory,
    };

    if (status === 'trial' && serverResult.daysRemaining !== undefined) {
        state.daysRemaining = serverResult.daysRemaining;
    }

    if (status === 'subscribed' && serverResult.expiresDate) {
        state.subscriptionExpiryDate = serverResult.expiresDate.toISOString();
    }

    console.log('[SSOT] Final status:', status);
    return { status, state };
}

function determineSubscriptionState(result: VerificationResult): SubscriptionStatus {
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
        trialActive,
        deviceBasedTrialBlock,
        deviceTrialInfo,
    } = result;

    if (!success || !serverSyncSucceeded) {
        console.log('[SSOT] State: loading (verification or server sync failed)');
        return 'loading';
    }

    if (isPending) {
        console.log('[SSOT] State: loading (pending transaction)');
        return 'loading';
    }

    if (source === 'cache') {
        console.log('[SSOT] State: loading (cache data, server verification required)');
        return 'loading';
    }

    if (deviceBasedTrialBlock) {
        console.log('[SSOT] State: blocked (device-based trial block)');
        return 'blocked';
    }

    if (trialActive) {
        console.log('[SSOT] State: trial (trial is active)');
        return 'trial';
    }

    if (entitlementActive && expiresDate && expiresDate > serverTime) {
        if (productId) {
            const isValidProductId = productId === 'monthly_test_260111' || LEGACY_PRODUCT_IDS.includes(productId || '');
            if (!isValidProductId) {
                console.log('[SSOT] State: loading (productId mismatch)');
                return 'loading';
            }
        }
        console.log('[SSOT] State: subscribed (entitlement active, expires:', expiresDate, ')');
        return 'subscribed';
    }

    if (restoreAttempted === false && hasPurchaseHistory) {
        console.log('[SSOT] State: blocked (restore not attempted but has purchase history - C-1)');
        return 'blocked';
    }

    if (restoreAttempted === true && restoreSucceeded === false && hasPurchaseHistory) {
        console.log('[SSOT] State: loading (restore failed but has purchase history - CASE C-2)');
        return 'loading';
    }

    if (entitlementActive && (!expiresDate || isNaN(expiresDate.getTime()))) {
        console.log('[SSOT] State: blocked (expiresDate invalid - treating as error)');
        return 'blocked';
    }

    if (!hasPurchaseHistory && !hasUsedTrial) {
        console.log('[SSOT] State: trial (new user, no purchase history, no trial used)');
        return 'trial';
    }

    if (hasPurchaseHistory) {
        console.log('[SSOT] State: blocked (has purchase history but no active entitlement - CASE J/C-1: has purchase history but no active entitlement)');
        return 'blocked';
    }

    console.log('[SSOT] State: blocked (hasPurchaseHistory:', hasPurchaseHistory, ', hasUsedTrial:', hasUsedTrial, ')');
    return 'blocked';
}

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

export function convertToLegacyStatus(status: SubscriptionStatus): LegacySubscriptionStatus {
    switch (status) {
        case 'subscribed':
            return 'active';
        case 'blocked':
            return 'expired';
        case 'loading':
            return 'expired';
        case 'trial':
            return 'trial';
        default:
            return 'expired';
    }
}
