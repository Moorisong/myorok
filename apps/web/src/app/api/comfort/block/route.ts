import { NextRequest, NextResponse } from 'next/server';
import { getModelsAsync, generateNickname } from '@/lib/comfort';

export const dynamic = 'force-dynamic';

// GET /api/comfort/block - 차단 목록 조회
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

        const { BlockedDeviceModel } = await getModelsAsync();
        const blockedEntries = await BlockedDeviceModel.find({ deviceId }).lean();

        const blockedDevices = blockedEntries.map((b: any) => ({
            blockedDeviceId: b.blockedDeviceId,
            displayId: generateNickname(b.blockedDeviceId),
            createdAt: b.createdAt,
        }));

        return NextResponse.json({
            success: true,
            data: { blockedDevices },
        });
    } catch (error) {
        console.error('차단 목록 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// POST /api/comfort/block - 사용자 차단
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { deviceId, blockedDeviceId } = body;

        if (!deviceId || typeof deviceId !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        if (!blockedDeviceId || typeof blockedDeviceId !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_BLOCKED_ID', message: '차단할 사용자 ID가 필요합니다.' } },
                { status: 400 }
            );
        }

        // 자기 자신 차단 불가
        if (deviceId === blockedDeviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'SELF_BLOCK', message: '자신을 차단할 수 없습니다.' } },
                { status: 400 }
            );
        }

        const { BlockedDeviceModel } = await getModelsAsync();

        // 이미 차단했는지 확인
        const alreadyBlocked = await BlockedDeviceModel.findOne({ deviceId, blockedDeviceId });

        if (alreadyBlocked) {
            return NextResponse.json(
                { success: false, error: { code: 'ALREADY_BLOCKED', message: '이미 차단한 사용자입니다.' } },
                { status: 400 }
            );
        }

        await BlockedDeviceModel.create({
            deviceId,
            blockedDeviceId,
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('차단 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// DELETE /api/comfort/block - 차단 해제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');
        const blockedDeviceId = searchParams.get('blockedDeviceId');

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        if (!blockedDeviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_BLOCKED_ID', message: '차단 해제할 사용자 ID가 필요합니다.' } },
                { status: 400 }
            );
        }

        const { BlockedDeviceModel } = await getModelsAsync();
        const result = await BlockedDeviceModel.deleteOne({ deviceId, blockedDeviceId });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_BLOCKED', message: '차단된 사용자가 아닙니다.' } },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('차단 해제 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
