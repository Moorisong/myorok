import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDevicePinSettings, setDevicePinSettings, deleteDevicePinSettings } from '@/lib/db';

const SALT_ROUNDS = 10;

// POST /api/settings/pin - PIN 설정
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { deviceId, pin } = body;

        if (!deviceId || typeof deviceId !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_PIN', message: 'PIN은 4자리 숫자여야 합니다.' } },
                { status: 400 }
            );
        }

        // Hash the PIN
        const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

        // Save to database
        setDevicePinSettings(deviceId, {
            pinHash,
            failedAttempts: 0,
            lockedUntil: null,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PIN 설정 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// DELETE /api/settings/pin - PIN 해제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        const deleted = deleteDevicePinSettings(deviceId);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: { code: 'PIN_NOT_FOUND', message: 'PIN이 설정되어 있지 않습니다.' } },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PIN 해제 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
