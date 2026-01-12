import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Subscription from '../../../../models/Subscription';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        const count = await Subscription.countDocuments();
        const output = [];

        // Fetch up to 10 records to inspect
        const samples = await Subscription.find().sort({ updatedAt: -1 }).limit(10).lean();

        output.push({
            info: 'DB Snapshot',
            dbName: mongoose.connection.name,
            host: mongoose.connection.host,
            totalSubscriptions: count,
            samples: samples.map(s => ({
                _id: s._id,
                userId: s.userId,
                status: s.status,
                trialStartDate: s.trialStartDate,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            }))
        });

        return NextResponse.json({
            success: true,
            data: output
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
