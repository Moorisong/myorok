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
 * POST /api/subscription/clear-force-expired/[userId]
 * forceExpired 플래그 제거 (테스트 후 정상 상태로 복귀)
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

        console.log(`[Subscription] Clearing forceExpired flag for user ${userId}...`);

        // 3. forceExpired 플래그 제거
        await Subscription.findOneAndUpdate(
            { userId },
            {
                $set: {
                    forceExpired: false,
                    updatedAt: new Date(),
                },
            },
            { new: true }
        );

        console.log(`[Subscription] forceExpired flag cleared for user ${userId}`);

        return NextResponse.json({
            success: true,
            message: 'forceExpired flag cleared successfully',
        });
    } catch (error) {
        console.error('[Subscription] clearForceExpired error:', error);
        return NextResponse.json(
            { success: false, error: 'Database error' },
            { status: 500 }
        );
    }
}
