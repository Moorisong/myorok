import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/mongodb';
import Subscription from '../../../../models/Subscription';

export const dynamic = 'force-dynamic';

const TRIAL_DAYS = 7;

interface JwtPayload {
    userId: string;
    nickname?: string;
}

interface VerifyRequest {
    userId: string;
}

/**
 * POST /api/subscription/verify
 * SSOT 구독 상태 검증
 */
/**
 * deviceId 기반 중복 trial 블록 확인 (SSOT - 앱 재설치 후 방지)
 * deviceId가 'unknown'이면 신규 사용자로 간주하여 블록하지 않음
 */
async function checkDeviceBasedTrialBlock(
    subscription: any,
    userId: string
): Promise<{ block: boolean; info: any }> {
    if (!subscription?.deviceId || subscription?.deviceId === 'unknown') {
        return { block: false, info: null };
    }

    // 해당 deviceId로 다른 유저가 이미 trial 사용했는지 확인
    const deviceSubscription = await Subscription.findOne({
        deviceId: subscription.deviceId,
        userId: { $ne: userId }, // 다른 유저
        trialStartDate: { $exists: true }
    });

    if (deviceSubscription) {
        const deviceTrialInfo = {
            deviceTrialUsed: true,
            deviceTrialUserId: deviceSubscription.userId,
            deviceTrialStartedAt: deviceSubscription.trialStartDate.toISOString(),
        };
        console.log(`[DEBUG_PROD] [SSOT] Device-based trial block for ${userId}:`, deviceTrialInfo);
        return { block: true, info: deviceTrialInfo };
    }

    return { block: false, info: null };
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // 1. JWT 검증
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        let tokenUserId: string;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            tokenUserId = decoded.userId;
        } catch {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // 2. 요청 데이터 파싱
        const body: VerifyRequest = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        // 토큰의 userId와 요청의 userId 일치 확인
        // Allow if it matches or if it's a test user belonging to this token (test_{case}_{originalUserId})
        const isTestUserForToken = userId.startsWith('test_') && userId.endsWith(`_${tokenUserId}`);

        if (tokenUserId !== userId && !isTestUserForToken) {
            return NextResponse.json(
                { success: false, error: 'userId mismatch' },
                { status: 403 }
            );
        }

        // 3. 구독 상태 조회 (SSOT - deviceId 기반 중복 trial 방지)
        console.log(`[DEBUG_PROD] Finding subscription for userId: ${userId}`);
        const subscription = await Subscription.findOne({ userId });
        const serverTime = new Date();

        // 3-1. deviceId 기반 trial 상태 확인 (앱 재설치 후 SSOT 강화)
        const { block: deviceBasedTrialBlock, info: deviceTrialInfo } = await checkDeviceBasedTrialBlock(subscription, userId);

        // 디버그: DB에서 조회된 구독 정보
        console.log(`[DEBUG_PROD] [Subscription] Verify DB lookup for ${userId}:`, subscription ? {
            _id: subscription._id,
            status: subscription.status,
            trialStartDate: subscription.trialStartDate,
            subscriptionStartDate: subscription.subscriptionStartDate,
            subscriptionExpiryDate: subscription.subscriptionExpiryDate,
            deviceId: subscription.deviceId,
            deviceBasedTrialBlock,
            createdAt: subscription.createdAt,
            serverTime: serverTime.toISOString(),
        } : 'NOT FOUND - Proceeding as NEW user');

        // 4. 구독이 없으면 신규 유저 (deviceId 기반 체크 포함)
        if (!subscription) {
            const result = {
                success: true,
                serverSyncSucceeded: true,
                entitlementActive: false,
                expiresDate: null,
                productId: null,
                isPending: false,
                source: 'server' as const,
                serverTime: serverTime.toISOString(),
                hasUsedTrial: false,
                trialActive: false,
                hasPurchaseHistory: false,
                deviceBasedTrialBlock,
                deviceTrialInfo,
            };

            console.log(`[DEBUG_PROD] [Subscription] Verify for user ${userId}: new user (returning status: trial candidate)`);

            return NextResponse.json({
                success: true,
                data: result,
            });
        }

        // 5. 구독 상태 계산 (expiryDate 기반 - 테스트 초기화 260111)
        // status 기반이 아닌 expiryDate 기반으로 판별하여 만료된 구독은 확실히 차단
        const entitlementActive = subscription.subscriptionExpiryDate
            ? subscription.subscriptionExpiryDate > serverTime
            : false;

        // 체험 활성 여부 계산 (SSOT: deviceId 기반 블록 우선 적용)
        let trialActive = false;
        if (!entitlementActive && subscription.trialStartDate && !deviceBasedTrialBlock) {
            const trialExpiresAt = new Date(subscription.trialStartDate);
            trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);

            // trial 기간이 남아있으면 trialActive = true (DB status와 무관)
            trialActive = serverTime < trialExpiresAt;

            console.log(`[DEBUG_PROD] Trial Check for ${userId}:`, {
                trialStartDate: subscription.trialStartDate,
                trialExpiresAt: trialExpiresAt.toISOString(),
                serverTime: serverTime.toISOString(),
                deviceBasedTrialBlock,
                isExpired: serverTime >= trialExpiresAt,
                result: trialActive
            });
        } else if (deviceBasedTrialBlock) {
            console.log(`[DEBUG_PROD] Trial blocked for ${userId} due to device-based trial usage`);
        }

        // 체험 사용 여부 (trialStartDate가 있으면 사용한 것)
        const hasUsedTrial = !!subscription.trialStartDate;

        // 결제 이력 여부 (subscriptionStartDate가 있으면 결제한 적 있음)
        const hasPurchaseHistory = !!subscription.subscriptionStartDate;

        // trial 남은 일수 계산 (서버 시간 기준 - SSOT)
        let daysRemaining: number | undefined;
        if (trialActive && subscription.trialStartDate) {
            const trialExpiresAt = new Date(subscription.trialStartDate);
            trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);

            const diffMs = trialExpiresAt.getTime() - serverTime.getTime();
            daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, daysRemaining);

            console.log(`[DEBUG_PROD] daysRemaining calculation for ${userId}:`, {
                trialStartDate: subscription.trialStartDate,
                trialExpiresAt: trialExpiresAt.toISOString(),
                serverTime: serverTime.toISOString(),
                diffMs,
                daysRemaining
            });
        }

        const result = {
            success: true,
            serverSyncSucceeded: true,
            entitlementActive,
            expiresDate: subscription.subscriptionExpiryDate?.toISOString() || null,
            productId: null, // Web에서는 productId 저장 안 함
            isPending: false,
            source: 'server' as const,
            serverTime: serverTime.toISOString(),
            hasUsedTrial,
            trialActive,
            hasPurchaseHistory,
            daysRemaining,
            deviceBasedTrialBlock,
            deviceTrialInfo,
        };

        console.log(`[DEBUG_PROD] [Subscription] Verify FINAL result for user ${userId}:`, JSON.stringify(result));

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Subscription] Verify error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
