import Subscription from '../models/Subscription';
import SubscriptionLog from '../models/SubscriptionLog';
import Device from '../models/Device';

interface DashboardData {
    kpi: {
        activeSubscriptions: number;
        monthlyRevenue: number;
        growthRate: number;
    };
    conversion: {
        trialUsers: number;
        conversionRate: number;
    };
    secondary: {
        totalDevices: number;
        newDevices7Days: number;
    };
}

/**
 * 대시보드 데이터 집계
 */
export async function aggregateDashboardData(): Promise<DashboardData> {
    const now = new Date();

    // 운영자 ID 목록 가져오기
    const adminsStr = process.env.ADMIN_KAKAO_IDS || '';
    const adminIds = adminsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);

    // 공통 필터: 운영자 제외
    const userFilter = adminIds.length > 0 ? { userId: { $nin: adminIds } } : {};

    // === KPI 지표 ===

    // 1. 유효 구독 수 (active이면서 만료되지 않은 것)
    const activeSubscriptions = await Subscription.countDocuments({
        status: 'active',
        subscriptionExpiryDate: { $gt: now },
        ...userFilter,
    });

    // 2. 월 매출 (유효 구독 × 3,500원)
    const monthlyRevenue = activeSubscriptions * 3500;

    // 3. 증감률 계산
    const growthRate = await calculateGrowthRate(now, userFilter);

    // === 전환 지표 ===

    // 1. 체험 사용자 수
    const trialUsers = await Subscription.countDocuments({
        status: 'trial',
        ...userFilter,
    });

    // 2. 전환율 계산
    const conversionRate = await calculateConversionRate(userFilter);

    // === 보조 지표 ===

    // 운영자 기기 식별 (Subscription을 통해 역추적)
    let deviceFilter = {};
    if (adminIds.length > 0) {
        const adminSubscriptions = await Subscription.find({ userId: { $in: adminIds } }).select('deviceId');
        const adminDeviceIds = adminSubscriptions
            .map(sub => sub.deviceId)
            .filter(id => id && id !== 'unknown');

        if (adminDeviceIds.length > 0) {
            deviceFilter = { deviceId: { $nin: adminDeviceIds } };
        }
    }

    // 1. 총 기기 수
    const totalDevices = await Device.countDocuments({
        ...deviceFilter,
    });

    // 2. 최근 7일 신규 기기 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newDevices7Days = await Device.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        ...deviceFilter,
    });

    return {
        kpi: {
            activeSubscriptions,
            monthlyRevenue,
            growthRate,
        },
        conversion: {
            trialUsers,
            conversionRate,
        },
        secondary: {
            totalDevices,
            newDevices7Days,
        },
    };
}

/**
 * 증감률 계산 (이번 달 vs 지난 달)
 */
async function calculateGrowthRate(now: Date, userFilter: any): Promise<number> {
    // 이번 달 첫날 00:00:00
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 지난 달 첫날 00:00:00
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 이번 달 active 수
    // (구독 시작일이 이번 달 시작 전 && 만료일이 이번 달 시작 이후)
    const thisMonthActive = await Subscription.countDocuments({
        status: 'active',
        subscriptionStartDate: { $lt: thisMonthStart },
        subscriptionExpiryDate: { $gt: thisMonthStart },
        ...userFilter,
    });

    // 지난 달 active 수
    const lastMonthActive = await Subscription.countDocuments({
        status: 'active',
        subscriptionStartDate: { $lt: lastMonthStart },
        subscriptionExpiryDate: { $gt: lastMonthStart },
        ...userFilter,
    });

    if (lastMonthActive === 0) {
        return thisMonthActive > 0 ? 100 : 0;
    }

    const growthRate = ((thisMonthActive - lastMonthActive) / lastMonthActive) * 100;
    return Math.round(growthRate * 10) / 10; // 소수점 1자리
}

/**
 * 전환율 계산 (trial → active)
 */
async function calculateConversionRate(userFilter: any): Promise<number> {
    // 전체 체험 시작 수 (SubscriptionLog에서 newStatus='trial' 카운트)
    const totalTrialStarts = await SubscriptionLog.countDocuments({
        newStatus: 'trial',
        ...userFilter,
    });

    if (totalTrialStarts === 0) {
        return 0;
    }

    // 체험→결제 전환 수 (previousStatus='trial' && newStatus='active')
    const trialToActiveCount = await SubscriptionLog.countDocuments({
        previousStatus: 'trial',
        newStatus: 'active',
        ...userFilter,
    });

    const conversionRate = (trialToActiveCount / totalTrialStarts) * 100;
    return Math.round(conversionRate * 10) / 10; // 소수점 1자리
}
