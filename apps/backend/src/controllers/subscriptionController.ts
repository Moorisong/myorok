import { Request, Response } from 'express';
import { pool } from '../config/database';
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
        const result = await pool.query(
            'SELECT user_id, trial_started_at FROM trial_records WHERE user_id = $1',
            [userId]
        );

        const record = result.rows[0];
        const hasUsedTrial = !!record;

        res.json({
            success: true,
            data: {
                userId,
                hasUsedTrial,
                trialStartedAt: record?.trial_started_at?.toISOString() || null,
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
        const existing = await pool.query(
            'SELECT user_id, trial_started_at FROM trial_records WHERE user_id = $1',
            [userId]
        );

        if (existing.rows.length > 0) {
            res.status(409).json({
                success: false,
                error: 'Trial already used',
                data: {
                    hasUsedTrial: true,
                    trialStartedAt: existing.rows[0].trial_started_at?.toISOString(),
                },
            });
            return;
        }

        const now = new Date();

        // 새 체험 기록 생성
        await pool.query(
            'INSERT INTO trial_records (user_id, device_id, trial_started_at) VALUES ($1, $2, $3)',
            [userId, deviceId || 'unknown', now]
        );

        // 구독 상태도 업데이트 (upsert)
        await pool.query(`
            INSERT INTO subscription_records (user_id, status, trial_started_at, updated_at)
            VALUES ($1, 'trial', $2, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET status = 'trial', trial_started_at = $2, updated_at = $2
        `, [userId, now]);

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
        const subscriptionResult = await pool.query(
            'SELECT * FROM subscription_records WHERE user_id = $1',
            [userId]
        );
        const trialResult = await pool.query(
            'SELECT * FROM trial_records WHERE user_id = $1',
            [userId]
        );

        const subscription = subscriptionResult.rows[0];
        const trial = trialResult.rows[0];
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
                hasPurchaseHistory: !!subscription?.subscription_started_at,
                status: subscription?.status || null,
                trialStartedAt: trial?.trial_started_at?.toISOString() || null,
                subscriptionStartedAt: subscription?.subscription_started_at?.toISOString() || null,
                subscriptionExpiresAt: subscription?.subscription_expires_at?.toISOString() || null,
                productId: subscription?.product_id || null,
                lastVerifiedAt: subscription?.last_verified_at?.toISOString() || null,
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
 * Body: { userId, status, productId, expiresAt, purchaseToken }
 */
export const syncSubscription = async (req: Request, res: Response): Promise<void> => {
    const { userId, status, productId, expiresAt, purchaseToken } = req.body;

    if (!userId) {
        res.status(400).json({
            success: false,
            error: 'userId is required',
        });
        return;
    }

    try {
        const now = new Date();

        await pool.query(`
            INSERT INTO subscription_records (
                user_id, status, product_id, subscription_expires_at, 
                purchase_token, last_verified_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $6)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                status = COALESCE($2, subscription_records.status),
                product_id = COALESCE($3, subscription_records.product_id),
                subscription_expires_at = COALESCE($4, subscription_records.subscription_expires_at),
                purchase_token = COALESCE($5, subscription_records.purchase_token),
                last_verified_at = $6,
                updated_at = $6
        `, [userId, status || 'blocked', productId, expiresAt, purchaseToken, now]);

        console.log(`[Subscription] Synced for user ${userId}: ${status}`);

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
        const subscriptionResult = await pool.query(
            'SELECT * FROM subscription_records WHERE user_id = $1',
            [userId]
        );
        const trialResult = await pool.query(
            'SELECT * FROM trial_records WHERE user_id = $1',
            [userId]
        );

        const subscription = subscriptionResult.rows[0];
        const trial = trialResult.rows[0];
        const serverTime = new Date();

        // VerificationResult 형식으로 응답
        const result = {
            success: true,
            serverSyncSucceeded: true,
            entitlementActive: subscription?.status === 'subscribed',
            expiresDate: subscription?.subscription_expires_at?.toISOString() || null,
            productId: subscription?.product_id || null,
            isPending: false,
            source: 'server' as const,
            serverTime: serverTime.toISOString(),
            hasUsedTrial: !!trial,
            hasPurchaseHistory: !!subscription?.subscription_started_at,
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
        await pool.query(`
            INSERT INTO purchase_verifications (
                user_id, purchase_token, order_id, product_id, verification_result
            )
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, purchaseToken, verifyResult.orderId, productId, JSON.stringify(verifyResult)]);

        // 구독이 활성 상태면 subscription_records 업데이트
        if (verifyResult.isActive) {
            await pool.query(`
                INSERT INTO subscription_records (
                    user_id, status, subscription_started_at, subscription_expires_at,
                    product_id, purchase_token, order_id, last_verified_at, updated_at
                )
                VALUES ($1, 'subscribed', $2, $3, $4, $5, $6, $2, $2)
                ON CONFLICT (user_id)
                DO UPDATE SET 
                    status = 'subscribed',
                    subscription_started_at = COALESCE(subscription_records.subscription_started_at, $2),
                    subscription_expires_at = $3,
                    product_id = $4,
                    purchase_token = $5,
                    order_id = $6,
                    last_verified_at = $2,
                    updated_at = $2
            `, [userId, now, expiresAt, productId, purchaseToken, verifyResult.orderId]);

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
