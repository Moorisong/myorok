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

        // 3. 구독 상태 조회
        console.log(`[DEBUG_PROD] Finding subscription for userId: ${userId}`);
        const subscription = await Subscription.findOne({ userId });
        const serverTime = new Date();

        // 디버그: DB에서 조회된 구독 정보
        console.log(`[DEBUG_PROD] [Subscription] Verify DB lookup for ${userId}:`, subscription ? {
            _id: subscription._id,
            status: subscription.status,
            trialStartDate: subscription.trialStartDate,
            subscriptionStartDate: subscription.subscriptionStartDate,
            subscriptionExpiryDate: subscription.subscriptionExpiryDate,
            createdAt: subscription.createdAt,
            serverTime: serverTime.toISOString(),
        } : 'NOT FOUND - Proceeding as NEW user');

        // 4. 구독이 없으면 신규 유저
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

        // 체험 활성 여부 계산
        let trialActive = false;
        if (!entitlementActive && subscription.trialStartDate) {
            const trialExpiresAt = new Date(subscription.trialStartDate);
            trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);

            trialActive = serverTime < trialExpiresAt && subscription.status === 'trial';

            console.log(`[DEBUG_PROD] Trial Check for ${userId}:`, {
                trialStartDate: subscription.trialStartDate,
                trialExpiresAt: trialExpiresAt.toISOString(),
                serverTime: serverTime.toISOString(),
                isExpired: serverTime >= trialExpiresAt,
                status: subscription.status,
                result: trialActive
            });
        }

        // 체험 사용 여부 (trialStartDate가 있으면 사용한 것)
        const hasUsedTrial = !!subscription.trialStartDate;

        // 결제 이력 여부 (subscriptionStartDate가 있으면 결제한 적 있음)
        const hasPurchaseHistory = !!subscription.subscriptionStartDate;

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
