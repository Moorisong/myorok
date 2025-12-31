import { NextRequest, NextResponse } from 'next/server';
import { getDevicePinSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/settings/pin/status - PIN 상태 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        const settings = getDevicePinSettings(deviceId);

        if (!settings) {
            return NextResponse.json({
                success: true,
                data: {
                    isPinSet: false,
                    isLocked: false,
                    lockedUntil: null,
                },
            });
        }

        // Check if currently locked
        let isLocked = false;
        let lockedUntil: string | null = null;

        if (settings.lockedUntil) {
            const lockedUntilDate = new Date(settings.lockedUntil);
            if (lockedUntilDate > new Date()) {
                isLocked = true;
                lockedUntil = settings.lockedUntil;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                isPinSet: true,
                isLocked,
                lockedUntil,
                failedAttempts: settings.failedAttempts,
            },
        });
    } catch (error) {
        console.error('PIN 상태 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
