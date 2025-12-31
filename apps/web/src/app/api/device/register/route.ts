import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Device from '../../../../models/Device';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { deviceId, pushToken, settings } = body;

        if (!deviceId) {
            return NextResponse.json(
                { error: 'deviceId is required' },
                { status: 400 }
            );
        }

        // Update or Create
        const updateData: any = { updatedAt: new Date() };
        if (pushToken !== undefined) updateData.pushToken = pushToken;
        if (settings !== undefined) updateData.settings = settings;

        const device = await Device.findOneAndUpdate(
            { deviceId },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, device });
    } catch (error) {
        console.error('Error registering device:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
