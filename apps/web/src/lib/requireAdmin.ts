import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from './admin';

interface JwtPayload {
    userId: string;
    nickname?: string;
}

/**
 * 운영자 권한 검증 미들웨어
 * @param request - Next.js Request 객체
 * @returns userId 또는 403 응답
 */
export async function requireAdmin(
    request: NextRequest
): Promise<{ userId: string } | NextResponse> {
    // 1. JWT 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json(
            { message: 'FORBIDDEN' },
            { status: 403 }
        );
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

    // 2. JWT 검증
    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return NextResponse.json(
                { message: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const userId = decoded.userId;

        // 3. 운영자 확인
        if (!isAdminUser(userId)) {
            return NextResponse.json(
                { message: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        return { userId };
    } catch (error) {
        return NextResponse.json(
            { message: 'FORBIDDEN' },
            { status: 403 }
        );
    }
}
