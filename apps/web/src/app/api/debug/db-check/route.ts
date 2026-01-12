import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[DEBUG_PROD] /api/debug/db-check called');

        const startTime = Date.now();
        await dbConnect();
        const connectionTime = Date.now() - startTime;

        const stateCheck = mongoose.connection.readyState;
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized',
        };

        const dbStatus = {
            status: stateMap[stateCheck] || 'unknown',
            dbName: mongoose.connection.name,
            host: mongoose.connection.host,
            connectionTimeMs: connectionTime,
            models: Object.keys(mongoose.models),
        };

        console.log('[DEBUG_PROD] DB Check Result:', JSON.stringify(dbStatus, null, 2));

        return NextResponse.json({
            success: true,
            data: dbStatus
        });

    } catch (error) {
        console.error('[DEBUG_PROD] DB Check Check Failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
