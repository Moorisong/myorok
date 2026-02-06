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
 * POST /api/subscription/expire-trial/[userId]
 * 체험 만료 처리 (테스트용) - trialStartDate를 8일 전으로 설정
 */
export async function POST(
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

        console.log(`[Subscription] Expiring trial for user ${userId}...`);

        // 3. trialStartDate를 8일 전으로 설정 (7일 체험 기간 + 1일 = 만료)
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 8);

        const pastExpiryDate = new Date();
        pastExpiryDate.setDate(pastExpiryDate.getDate() - 1);

        // 4. 구독 상태 업데이트
        await Subscription.findOneAndUpdate(
            { userId },
            {
                $set: {
                    trialStartDate: expiredDate,
                    status: 'expired',
                    subscriptionExpiryDate: pastExpiryDate,
                    subscriptionStartDate: null,
                    forceExpired: true,
                    updatedAt: new Date(),
                },
            },
            { new: true }
        );

        console.log(`[Subscription] Trial expired for user ${userId} (set to ${expiredDate.toISOString()})`);

        return NextResponse.json({
            success: true,
            message: 'Trial expired successfully',
            data: {
                trialStartedAt: expiredDate.toISOString(),
            },
        });
    } catch (error) {
        console.error('[Subscription] expireTrial error:', error);
        return NextResponse.json(
            { success: false, error: 'Database error' },
            { status: 500 }
        );
    }
}
