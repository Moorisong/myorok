import { Request, Response } from 'express';

// Types
interface TrialRecord {
    userId: string;
    trialStartedAt: string;
    deviceId: string;
}

interface SubscriptionRecord {
    userId: string;
    status: 'trial' | 'subscribed' | 'blocked';
    trialStartedAt?: string;
    subscriptionStartedAt?: string;
    subscriptionExpiresAt?: string;
    productId?: string;
    purchaseToken?: string;
    lastVerifiedAt?: string;
}

// In-memory storage (실제 운영에서는 DB 사용)
// TODO: Replace with actual database (e.g., PostgreSQL, MongoDB)
const trialRecords: Map<string, TrialRecord> = new Map();
const subscriptionRecords: Map<string, SubscriptionRecord> = new Map();

/**
 * GET /api/subscription/server-time
 * 서버 시간 반환 (CASE F: 기기 시간 조작 방지)
 */
export const getServerTime = (_req: Request, res: Response) => {
    const serverTime = new Date();

    res.json({
        success: true,
        data: {
            serverTime: serverTime.toISOString(),
            timestamp: serverTime.getTime(),
        },
    });
};

/**
 * GET /api/subscription/trial-status/:userId
 * 무료체험 사용 여부 조회 (CASE E: trial 기록 확인 - 서버 기준)
 */
export const getTrialStatus = (req: Request, res: Response): void => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    const record = trialRecords.get(userId);
    const hasUsedTrial = !!record;

    res.json({
        success: true,
        data: {
            userId,
            hasUsedTrial,
            trialStartedAt: record?.trialStartedAt || null,
            serverTime: new Date().toISOString(),
        },
    });
};

/**
 * POST /api/subscription/trial-start
 * 무료체험 시작 기록 (즉시 동기 기록 - CASE E)
 * Body: { userId, deviceId }
 */
export const recordTrialStart = (req: Request, res: Response): void => {
    const { userId, deviceId } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    // 이미 체험 기록이 있는지 확인
    const existingRecord = trialRecords.get(userId);
    if (existingRecord) {
        res.status(409).json({
            success: false,
            error: 'Trial already used',
            data: {
                hasUsedTrial: true,
                trialStartedAt: existingRecord.trialStartedAt,
            },
        });
        return;
    }

    // 새 체험 기록 생성 (동기 처리)
    const now = new Date().toISOString();
    const record: TrialRecord = {
        userId,
        trialStartedAt: now,
        deviceId: deviceId || 'unknown',
    };

    trialRecords.set(userId, record);

    // 구독 상태도 업데이트
    subscriptionRecords.set(userId, {
        userId,
        status: 'trial',
        trialStartedAt: now,
    });

    console.log(`[Subscription] Trial started for user ${userId} at ${now}`);

    res.status(201).json({
        success: true,
        data: {
            userId,
            trialStartedAt: now,
            serverTime: now,
        },
    });
};

/**
 * GET /api/subscription/status/:userId
 * 구독 상태 조회 (서버 기준 SSOT)
 */
export const getSubscriptionStatus = (req: Request, res: Response): void => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    const subscription = subscriptionRecords.get(userId);
    const trial = trialRecords.get(userId);
    const serverTime = new Date();

    // 구독 레코드가 없고 trial도 없으면 신규 유저
    if (!subscription && !trial) {
        res.json({
            success: true,
            data: {
                userId,
                hasUsedTrial: false,
                hasPurchaseHistory: false,
                status: null,
                serverTime: serverTime.toISOString(),
            },
        });
        return;
    }

    res.json({
        success: true,
        data: {
            userId,
            hasUsedTrial: !!trial,
            hasPurchaseHistory: !!subscription?.subscriptionStartedAt,
            status: subscription?.status || null,
            trialStartedAt: trial?.trialStartedAt || null,
            subscriptionStartedAt: subscription?.subscriptionStartedAt || null,
            subscriptionExpiresAt: subscription?.subscriptionExpiresAt || null,
            productId: subscription?.productId || null,
            lastVerifiedAt: subscription?.lastVerifiedAt || null,
            serverTime: serverTime.toISOString(),
        },
    });
};

/**
 * POST /api/subscription/sync
 * 클라이언트에서 구독 상태 동기화
 * Body: { userId, deviceId, status, productId, expiresAt, purchaseToken }
 */
export const syncSubscription = (req: Request, res: Response): void => {
    const { userId, status, productId, expiresAt, purchaseToken } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    const now = new Date().toISOString();
    const existingRecord = subscriptionRecords.get(userId);

    const record: SubscriptionRecord = {
        userId,
        status: status || existingRecord?.status || 'blocked',
        trialStartedAt: existingRecord?.trialStartedAt,
        subscriptionStartedAt: status === 'subscribed' ? (existingRecord?.subscriptionStartedAt || now) : existingRecord?.subscriptionStartedAt,
        subscriptionExpiresAt: expiresAt || existingRecord?.subscriptionExpiresAt,
        productId: productId || existingRecord?.productId,
        purchaseToken: purchaseToken || existingRecord?.purchaseToken,
        lastVerifiedAt: now,
    };

    subscriptionRecords.set(userId, record);

    console.log(`[Subscription] Synced for user ${userId}: ${status}`);

    res.json({
        success: true,
        data: {
            userId,
            status: record.status,
            serverTime: now,
        },
    });
};

/**
 * POST /api/subscription/verify
 * 구독 상태 검증 (SSOT 판별용)
 * Body: { userId, deviceId }
 * 
 * 이 API는 클라이언트의 determineSubscriptionState()에서 사용할 
 * VerificationResult 형식으로 응답합니다.
 */
export const verifySubscription = (req: Request, res: Response): void => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    const subscription = subscriptionRecords.get(userId);
    const trial = trialRecords.get(userId);
    const serverTime = new Date();

    // VerificationResult 형식으로 응답
    const result = {
        success: true,
        serverSyncSucceeded: true,
        entitlementActive: subscription?.status === 'subscribed',
        expiresDate: subscription?.subscriptionExpiresAt || null,
        productId: subscription?.productId || null,
        isPending: false,
        source: 'server' as const,
        serverTime: serverTime.toISOString(),
        hasUsedTrial: !!trial,
        hasPurchaseHistory: !!subscription?.subscriptionStartedAt,
    };

    console.log(`[Subscription] Verify for user ${userId}:`, result);

    res.json({
        success: true,
        data: result,
    });
};
