import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/mongodb';
import Subscription from '../../../../models/Subscription';
import { getGooglePlayVerifier } from '../../../../lib/googlePlayVerifier';

export const dynamic = 'force-dynamic';

interface JwtPayload {
    userId: string;
    nickname?: string;
}

interface VerifyPurchaseRequest {
    userId: string;
    purchaseToken: string;
    productId: string;
}

/**
 * POST /api/subscription/verify-purchase
 * Google Play 구매 검증 (purchaseToken 유효성 확인)
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
        const body: VerifyPurchaseRequest = await request.json();
        const { userId, purchaseToken, productId } = body;

        if (!userId || !purchaseToken || !productId) {
            return NextResponse.json(
                { success: false, error: 'userId, purchaseToken, and productId are required' },
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

        // 3. Google Play API로 구매 검증
        const googlePlayVerifier = getGooglePlayVerifier();
        const verifyResult = await googlePlayVerifier.verifySubscription(purchaseToken, productId);

        if (!verifyResult.success) {
            return NextResponse.json(
                { success: false, error: verifyResult.error || 'Purchase verification failed' },
                { status: 400 }
            );
        }

        const now = new Date();
        const expiresAt = verifyResult.expiryTimeMillis
            ? new Date(parseInt(verifyResult.expiryTimeMillis, 10))
            : null;

        // 4. 구독이 활성 상태면 Subscription 업데이트
        if (verifyResult.isActive) {
            await Subscription.findOneAndUpdate(
                { userId },
                {
                    $set: {
                        status: 'active',
                        subscriptionStartDate: now,
                        subscriptionExpiryDate: expiresAt,
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                },
                { upsert: true, new: true }
            );

            console.log(`[Subscription] Purchase verified and activated for user ${userId}`);
        }

        return NextResponse.json({
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
        return NextResponse.json(
            { success: false, error: 'Verification error' },
            { status: 500 }
        );
    }
}
