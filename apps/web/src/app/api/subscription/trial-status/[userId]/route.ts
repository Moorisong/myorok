import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../../lib/mongodb';
import Subscription from '../../../../../models/Subscription';

export const dynamic = 'force-dynamic';

interface JwtPayload {
    userId: string;
    nickname?: string;
}

/**
 * GET /api/subscription/trial-status/[userId]
 * 무료체험 사용 여부 조회 (CASE E)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await dbConnect();

        // 1. JWT 검증
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        try {
            jwt.verify(token, JWT_SECRET) as JwtPayload;
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        // 2. userId 파라미터 가져오기
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        // 3. 구독 상태 조회
        const subscription = await Subscription.findOne({ userId });
        const hasUsedTrial = !!subscription?.trialStartDate;

        // 4. deviceId 기반 추가 체험 가능 여부 확인 (앱 재설치 케이스)
        let deviceBasedTrialAvailable = false;
        let deviceTrialInfo = null;
        
        if (subscription?.deviceId && subscription?.deviceId !== 'unknown') {
            // deviceId가 있으면 해당 기기의 다른 유저에서 trial 사용 여부 확인
            const deviceSubscription = await Subscription.findOne({ 
                deviceId: subscription.deviceId,
                userId: { $ne: userId } // 다른 유저
            });
            
            deviceBasedTrialAvailable = !deviceSubscription?.trialStartDate;
            
            if (deviceSubscription?.trialStartDate) {
                deviceTrialInfo = {
                    deviceTrialUsed: true,
                    deviceTrialUserId: deviceSubscription.userId,
                    deviceTrialStartedAt: deviceSubscription.trialStartDate.toISOString(),
                };
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                userId,
                hasUsedTrial,
                trialStartedAt: subscription?.trialStartDate?.toISOString() || null,
                deviceId: subscription?.deviceId || null,
                deviceBasedTrialAvailable,
                deviceTrialInfo,
                serverTime: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] getTrialStatus error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
