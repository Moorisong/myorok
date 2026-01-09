import { Request, Response } from 'express';
import { TrialRecord, SubscriptionRecord, PurchaseVerification } from '../config/database';
import { googlePlayVerifier } from '../services/googlePlayVerifier';

/**
 * GET /api/subscription/server-time
 * 서버 시간 반환 (CASE F: 기기 시간 조작 방지)
 */
export const getServerTime = (_req: Request, res: Response): void => {
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
export const getTrialStatus = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        const record = await TrialRecord.findOne({ userId });
        const hasUsedTrial = !!record;

        res.json({
            success: true,
            data: {
                userId,
                hasUsedTrial,
                trialStartedAt: record?.trialStartedAt?.toISOString() || null,
                serverTime: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] getTrialStatus error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * POST /api/subscription/trial-start
 * 무료체험 시작 기록 (즉시 동기 기록 - CASE E)
 * Body: { userId, deviceId }
 */
export const recordTrialStart = async (req: Request, res: Response): Promise<void> => {
    const { userId, deviceId } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        // 이미 체험 기록이 있는지 확인
        const existing = await TrialRecord.findOne({ userId });

        if (existing) {
            res.status(409).json({
                success: false,
                error: 'Trial already used',
                data: {
                    hasUsedTrial: true,
                    trialStartedAt: existing.trialStartedAt?.toISOString(),
                },
            });
            return;
        }

        const now = new Date();

        // 새 체험 기록 생성
        await TrialRecord.create({
            userId,
            deviceId: deviceId || 'unknown',
            trialStartedAt: now,
        });

        // 구독 상태도 업데이트 (upsert)
        await SubscriptionRecord.findOneAndUpdate(
            { userId },
            {
                userId,
                status: 'trial',
                trialStartedAt: now,
            },
            { upsert: true, new: true }
        );

        console.log(`[Subscription] Trial started for user ${userId} at ${now.toISOString()}`);

        res.status(201).json({
            success: true,
            data: {
                userId,
                trialStartedAt: now.toISOString(),
                serverTime: now.toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] recordTrialStart error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * GET /api/subscription/status/:userId
 * 구독 상태 조회 (서버 기준 SSOT)
 */
export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        const subscription = await SubscriptionRecord.findOne({ userId });
        const trial = await TrialRecord.findOne({ userId });
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
                trialStartedAt: trial?.trialStartedAt?.toISOString() || null,
                subscriptionStartedAt: subscription?.subscriptionStartedAt?.toISOString() || null,
                subscriptionExpiresAt: subscription?.subscriptionExpiresAt?.toISOString() || null,
                productId: subscription?.productId || null,
                lastVerifiedAt: subscription?.lastVerifiedAt?.toISOString() || null,
                serverTime: serverTime.toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] getSubscriptionStatus error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * POST /api/subscription/sync
 * 클라이언트에서 구독 상태 동기화
 * Body: { userId, status, productId, subscriptionStartDate, subscriptionExpiryDate, purchaseToken }
 */
export const syncSubscription = async (req: Request, res: Response): Promise<void> => {
    const { userId, status, productId, subscriptionStartDate, subscriptionExpiryDate, expiresAt, purchaseToken } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        // Check if user has forceExpired flag (테스트용)
        // forceExpired가 true면 모든 sync 요청을 무시 (클라이언트 복원이 서버 상태를 덮어쓰지 못하게)
        const existingRecord = await SubscriptionRecord.findOne({ userId });
        if (existingRecord?.forceExpired) {
            console.log(`[Subscription] User ${userId} has forceExpired flag, ignoring all sync attempts`);
            res.json({
                success: true,
                data: {
                    userId,
                    status: 'blocked',  // Always return blocked for force-expired users
                    serverTime: new Date().toISOString(),
                },
            });
            return;
        }

        const now = new Date();

        // subscriptionExpiryDate 또는 expiresAt 둘 중 하나 사용 (호환성)
        const expiryDate = subscriptionExpiryDate || expiresAt;

        const updateData: any = {
            userId,
            status: status || 'blocked',
            productId,
            subscriptionExpiresAt: expiryDate ? new Date(expiryDate) : undefined,
            purchaseToken,
            lastVerifiedAt: now,
        };

        // status가 'subscribed'이고 subscriptionStartDate가 있으면 subscriptionStartedAt 설정
        if (status === 'subscribed' && subscriptionStartDate) {
            updateData.subscriptionStartedAt = new Date(subscriptionStartDate);
        }

        await SubscriptionRecord.findOneAndUpdate(
            { userId },
            updateData,
            { upsert: true, new: true }
        );

        console.log(`[Subscription] Synced for user ${userId}: ${status} (startedAt: ${subscriptionStartDate || 'N/A'})`);

        res.json({
            success: true,
            data: {
                userId,
                status: status || 'blocked',
                serverTime: now.toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] syncSubscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * POST /api/subscription/verify
 * 구독 상태 검증 (SSOT 판별용)
 * Body: { userId }
 */
export const verifySubscription = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        const subscription = await SubscriptionRecord.findOne({ userId });
        const trial = await TrialRecord.findOne({ userId });
        const serverTime = new Date();

        // 구독 활성 여부 먼저 확인
        const entitlementActive = subscription?.status === 'subscribed';

        // 체험 활성 여부 계산 (7일)
        // 단, 구독이 활성이면 체험은 비활성으로 처리 (구독이 우선)
        const TRIAL_DAYS = 7; // 7일 (원래 값으로 복구)
        let trialActive = false;
        if (!entitlementActive && trial?.trialStartedAt) {
            const trialExpiresAt = new Date(trial.trialStartedAt);
            trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);
            trialActive = serverTime < trialExpiresAt;
        }

        // VerificationResult 형식으로 응답
        const result = {
            success: true,
            serverSyncSucceeded: true,
            entitlementActive,
            expiresDate: subscription?.subscriptionExpiresAt?.toISOString() || null,
            productId: subscription?.productId || null,
            isPending: false,
            source: 'server' as const,
            serverTime: serverTime.toISOString(),
            hasUsedTrial: !!trial,
            trialActive,  // 체험이 현재 활성 상태인지
            hasPurchaseHistory: !!subscription?.subscriptionStartedAt,
        };

        console.log(`[Subscription] Verify for user ${userId}:`, result);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Subscription] verifySubscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * POST /api/subscription/verify-purchase
 * Google Play 구매 검증 (purchaseToken 유효성 확인)
 * Body: { userId, purchaseToken, productId }
 */
export const verifyPurchase = async (req: Request, res: Response): Promise<void> => {
    const { userId, purchaseToken, productId } = req.body;

    if (!userId || !purchaseToken || !productId) {
        res.status(400).json({
            success: false,
            error: 'userId, purchaseToken, and productId are required',
        });
        return;
    }

    try {
        // Google Play API로 구매 검증
        const verifyResult = await googlePlayVerifier.verifySubscription(purchaseToken, productId);

        if (!verifyResult.success) {
            res.status(400).json({
                success: false,
                error: verifyResult.error || 'Purchase verification failed',
            });
            return;
        }

        const now = new Date();
        const expiresAt = verifyResult.expiryTimeMillis
            ? new Date(parseInt(verifyResult.expiryTimeMillis, 10))
            : null;

        // 검증 결과 저장 (감사 로그)
        await PurchaseVerification.create({
            userId,
            purchaseToken,
            orderId: verifyResult.orderId,
            productId,
            verificationResult: verifyResult,
            verifiedAt: now,
        });

        // 구독이 활성 상태면 SubscriptionRecord 업데이트
        if (verifyResult.isActive) {
            await SubscriptionRecord.findOneAndUpdate(
                { userId },
                {
                    userId,
                    status: 'subscribed',
                    subscriptionStartedAt: now,
                    subscriptionExpiresAt: expiresAt,
                    productId,
                    purchaseToken,
                    orderId: verifyResult.orderId,
                    lastVerifiedAt: now,
                },
                { upsert: true, new: true }
            );

            console.log(`[Subscription] Purchase verified and activated for user ${userId}`);
        }

        res.json({
            success: true,
            data: {
                isActive: verifyResult.isActive,
                expiresAt: expiresAt?.toISOString() || null,
                autoRenewing: verifyResult.autoRenewing,
                orderId: verifyResult.orderId,
                serverTime: now.toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] verifyPurchase error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification error',
        });
    }
};

/**
 * DELETE /api/subscription/reset/:userId
 * 구독 데이터 초기화 (테스트용)
 */
export const resetSubscriptionData = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        console.log(`[Subscription] Resetting data for user ${userId}...`);

        // 구독 및 체험 기록 삭제
        await SubscriptionRecord.deleteOne({ userId });
        await TrialRecord.deleteOne({ userId });

        // 구매 검증 기록은 감사 로그이므로 남겨둘 수도 있지만, 완전 초기화를 위해 삭제
        // await PurchaseVerification.deleteMany({ userId });

        console.log(`[Subscription] Reset complete for user ${userId}`);

        res.json({
            success: true,
            message: 'Subscription data reset successfully',
        });
    } catch (error) {
        console.error('[Subscription] resetSubscriptionData error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * POST /api/subscription/expire-trial/:userId
 * 체험 만료 처리 (테스트용) - trialStartedAt을 8일 전으로 설정
 */
export const expireTrial = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        console.log(`[Subscription] Expiring trial for user ${userId}...`);

        // trialStartedAt을 8일 전으로 설정 (7일 체험 기간 + 1일 = 만료)
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 8);

        await TrialRecord.findOneAndUpdate(
            { userId },
            { trialStartedAt: expiredDate },
            { new: true }
        );

        // 구독 상태도 blocked로 업데이트 + 만료일을 과거로 설정
        const pastExpiryDate = new Date();
        pastExpiryDate.setDate(pastExpiryDate.getDate() - 1); // 1일 전

        await SubscriptionRecord.findOneAndUpdate(
            { userId },
            {
                status: 'blocked',
                subscriptionExpiresAt: pastExpiryDate,  // 만료일을 과거로
                subscriptionStartedAt: null,  // 구독 시작일 제거 (hasPurchaseHistory: false)
                forceExpired: true  // 강제 만료 플래그 (테스트용)
            },
            { new: true }
        );

        console.log(`[Subscription] Trial expired for user ${userId} (set to ${expiredDate.toISOString()})`);

        res.json({
            success: true,
            message: 'Trial expired successfully',
            data: {
                trialStartedAt: expiredDate.toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] expireTrial error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};

/**
 * POST /api/subscription/clear-force-expired/:userId
 * forceExpired 플래그 제거 (테스트 후 정상 상태로 복귀)
 */
export const clearForceExpired = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        console.log(`[Subscription] Clearing forceExpired flag for user ${userId}...`);

        await SubscriptionRecord.findOneAndUpdate(
            { userId },
            { forceExpired: false },
            { new: true }
        );

        console.log(`[Subscription] forceExpired flag cleared for user ${userId}`);

        res.json({
            success: true,
            message: 'forceExpired flag cleared successfully',
        });
    } catch (error) {
        console.error('[Subscription] clearForceExpired error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
        });
    }
};
