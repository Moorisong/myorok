import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/mongodb';
import Subscription from '../../../../models/Subscription';
import SubscriptionLog from '../../../../models/SubscriptionLog';

export const dynamic = 'force-dynamic';

interface JwtPayload {
    userId: string;
    nickname?: string;
}

interface TrialStartRequest {
    userId: string;
    deviceId?: string;
}

/**
 * POST /api/subscription/trial-start
 * 무료체험 시작 기록 (즉시 동기 기록 - CASE E)
 */
export async function POST(request: NextRequest) {
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

        let tokenUserId: string;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            tokenUserId = decoded.userId;
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        // 2. 요청 데이터 파싱
        const body: TrialStartRequest = await request.json();
        const { userId, deviceId } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        // 토큰의 userId와 요청의 userId 일치 확인
        if (tokenUserId !== userId) {
            return NextResponse.json(
                { success: false, error: 'userId mismatch' },
                { status: 403 }
            );
        }

        // 3. 이미 체험 기록이 있는지 확인
        const existing = await Subscription.findOne({ userId });

        if (existing?.trialStartDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Trial already used',
                    data: {
                        hasUsedTrial: true,
                        trialStartedAt: existing.trialStartDate.toISOString(),
                    },
                },
                { status: 409 }
            );
        }

        const now = new Date();

        // 4. 구독 상태 upsert
        await Subscription.findOneAndUpdate(
            { userId },
            {
                $set: {
                    deviceId: deviceId || 'unknown',
                    status: 'trial',
                    trialStartDate: now,
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
            },
            { upsert: true, new: true }
        );

        // 5. 로그 기록
        await SubscriptionLog.create({
            userId,
            previousStatus: 'expired',
            newStatus: 'trial',
            changedAt: now,
        });

        console.log(`[Subscription] Trial started for user ${userId} at ${now.toISOString()}`);

        return NextResponse.json({
            success: true,
            data: {
                userId,
                trialStartedAt: now.toISOString(),
                serverTime: now.toISOString(),
            },
        }, { status: 201 });
    } catch (error) {
        console.error('[Subscription] recordTrialStart error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
