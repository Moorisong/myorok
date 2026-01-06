import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { aggregateDashboardData } from '../../../../lib/dashboard-aggregation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. 운영자 권한 확인
        const authResult = await requireAdmin(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // 2. MongoDB 연결
        await dbConnect();

        // 3. 대시보드 데이터 집계
        const dashboardData = await aggregateDashboardData();

        // 4. 응답 반환
        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
