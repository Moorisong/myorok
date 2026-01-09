import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscription/server-time
 * 서버 시간 반환 (CASE F: 기기 시간 조작 방지)
 */
export async function GET() {
    const serverTime = new Date();

    return NextResponse.json({
        success: true,
        data: {
            serverTime: serverTime.toISOString(),
            timestamp: serverTime.getTime(),
        },
    });
}
