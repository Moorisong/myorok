import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDevicePinSettings, setDevicePinSettings } from '@/lib/db';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5분

// POST /api/settings/pin/verify - PIN 검증
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

        if (!pin || typeof pin !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_PIN', message: 'PIN을 입력해주세요.' } },
                { status: 400 }
            );
        }

        const settings = getDevicePinSettings(deviceId);

        if (!settings) {
            return NextResponse.json(
                { success: false, error: { code: 'PIN_NOT_SET', message: 'PIN이 설정되어 있지 않습니다.' } },
                { status: 404 }
            );
        }

        // Check if locked
        if (settings.lockedUntil) {
            const lockedUntilDate = new Date(settings.lockedUntil);
            if (lockedUntilDate > new Date()) {
                const remainingMs = lockedUntilDate.getTime() - Date.now();
                const remainingMinutes = Math.ceil(remainingMs / 60000);
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'ACCOUNT_LOCKED',
                            message: `너무 많은 시도로 인해 잠겼습니다. ${remainingMinutes}분 후 다시 시도해주세요.`
                        },
                        lockedUntil: settings.lockedUntil,
                    },
                    { status: 423 }
                );
            }
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin, settings.pinHash);

        if (isValid) {
            // Reset failed attempts on success
            setDevicePinSettings(deviceId, {
                failedAttempts: 0,
                lockedUntil: null,
            });

            return NextResponse.json({ success: true });
        } else {
            // Increment failed attempts
            const newFailedAttempts = settings.failedAttempts + 1;
            let lockedUntil: string | null = null;

            if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
                lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
            }

            setDevicePinSettings(deviceId, {
                failedAttempts: newFailedAttempts,
                lockedUntil,
            });

            const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;

            if (lockedUntil) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'ACCOUNT_LOCKED',
                            message: '너무 많은 시도로 인해 잠겼습니다. 5분 후 다시 시도해주세요.'
                        },
                        lockedUntil,
                    },
                    { status: 423 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_PIN',
                        message: `인증에 실패했습니다. (${remainingAttempts}회 남음)`
                    },
                    remainingAttempts,
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('PIN 검증 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
