import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../../lib/mongodb';
import Subscription from '../../../../../models/Subscription';
import SubscriptionLog from '../../../../../models/SubscriptionLog';

export const dynamic = 'force-dynamic';

interface JwtPayload {
    userId: string;
    nickname?: string;
}

/**
 * DELETE /api/subscription/reset/[userId]
 * 구독 데이터 초기화 (테스트용)
 */
export async function DELETE(
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

        console.log(`[Subscription] Resetting data for user ${userId}...`);

        // 3. 구독 데이터 삭제
        await Subscription.deleteOne({ userId });

        // 4. 로그 기록 (선택적)
        await SubscriptionLog.create({
            userId,
            previousStatus: 'unknown',
            newStatus: 'reset',
            changedAt: new Date(),
        });

        console.log(`[Subscription] Reset complete for user ${userId}`);

        return NextResponse.json({
            success: true,
            message: 'Subscription data reset successfully',
        });
    } catch (error) {
        console.error('[Subscription] resetSubscriptionData error:', error);
        return NextResponse.json(
            { success: false, error: 'Database error' },
            { status: 500 }
        );
    }
}
