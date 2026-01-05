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

        // Set default settings on insert (not on update)
        const defaultSettings = {
            marketing: false,
            comments: true,
            inactivity: true,
        };

        // Conditionally structure the update query to prevent conflicts
        // If settings are being updated, don't use $setOnInsert for settings
        const updateQuery: any = { $set: updateData };
        if (settings === undefined) {
            updateQuery.$setOnInsert = { settings: defaultSettings };
        }

        const device = await Device.findOneAndUpdate(
            { deviceId },
            updateQuery,
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
