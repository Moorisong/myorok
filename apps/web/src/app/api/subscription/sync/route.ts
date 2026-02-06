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

interface SyncRequest {
    deviceId: string;
    status: 'trial' | 'active' | 'expired' | 'subscribed' | 'blocked';
    trialStartDate?: string | null;  // Optional for restore scenarios
    subscriptionStartDate?: string | null;
    subscriptionExpiryDate?: string | null;
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
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // 2. 요청 데이터 파싱
        const body: SyncRequest & { userId?: string } = await request.json();
        const {
            deviceId,
            status,
            trialStartDate,
            subscriptionStartDate,
            subscriptionExpiryDate,
            userId: bodyUserId, // Optional userId in body for test mode
        } = body;

        // 디버그: sync 요청 데이터 로그
        console.log('[Subscription] Sync request:', {
            userId: tokenUserId,
            status,
            trialStartDate,
            subscriptionStartDate,
            subscriptionExpiryDate,
        });

        // Use bodyUserId if it's a valid test user for this token, otherwise use token userId
        const isTestUserForToken = bodyUserId?.startsWith('test_') && bodyUserId?.endsWith(`_${tokenUserId}`);
        const userId = isTestUserForToken ? bodyUserId : tokenUserId;

        if (!deviceId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 3. 기존 구독 상태 확인
        const existingSubscription = await Subscription.findOne({ userId });

        // trialStartDate가 없는 경우: 기존 값 사용 또는 현재 시간 (복원 시나리오)
        const effectiveTrialStartDate = trialStartDate
            || existingSubscription?.trialStartDate?.toISOString()
            || new Date().toISOString();

        // 4. 상태 변경 감지 및 로그 기록
        if (existingSubscription && existingSubscription.status !== status) {
            await SubscriptionLog.create({
                userId,
                previousStatus: existingSubscription.status,
                newStatus: status,
                changedAt: new Date(),
            });
        }

        // 5. 구독 상태 upsert
        await Subscription.findOneAndUpdate(
            { userId },
            {
                $set: {
                    deviceId,
                    status,
                    trialStartDate: new Date(effectiveTrialStartDate),
                    subscriptionStartDate: subscriptionStartDate
                        ? new Date(subscriptionStartDate)
                        : null,
                    subscriptionExpiryDate: subscriptionExpiryDate
                        ? new Date(subscriptionExpiryDate)
                        : null,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        // 6. 최초 체험 시작 로그 기록 (기존 구독이 없는 경우)
        if (!existingSubscription && status === 'trial') {
            await SubscriptionLog.create({
                userId,
                previousStatus: 'expired',
                newStatus: 'trial',
                changedAt: new Date(),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error syncing subscription:', error);
        // Log more details if it's a validation error
        if (error.name === 'ValidationError') {
            console.error('Validation Error Details:', JSON.stringify(error.errors, null, 2));
        }
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
