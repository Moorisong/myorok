import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Subscription from '../../../../../models/Subscription';

export const dynamic = 'force-dynamic';

const TRIAL_DAYS = 7;

/**
 * GET /api/debug/subscription/[userId]
 * 디버깅용: 특정 유저의 구독 상태를 상세하게 조회
 * 
 * 사용법: curl https://myorok.haroo.site/api/debug/subscription/{userId}
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await dbConnect();

        const { userId } = await params;
        const serverTime = new Date();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // 구독 정보 조회
        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return NextResponse.json({
                userId,
                serverTime: serverTime.toISOString(),
                status: 'NOT_FOUND',
                message: '구독 정보가 없습니다. 이 유저는 아직 앱에서 로그인하지 않았거나 구독 초기화가 되지 않았습니다.',
                expectedClientStatus: 'trial (new user)',
            });
        }

        // 상태 계산
        const entitlementActive = subscription.subscriptionExpiryDate
            ? subscription.subscriptionExpiryDate > serverTime
            : false;

        let trialActive = false;
        let trialExpiresAt: Date | null = null;
        if (!entitlementActive && subscription.trialStartDate) {
            trialExpiresAt = new Date(subscription.trialStartDate);
            trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);
            trialActive = serverTime < trialExpiresAt;
        }

        const hasUsedTrial = !!subscription.trialStartDate;
        const hasPurchaseHistory = !!subscription.subscriptionStartDate;

        // 남은 일수 계산
        let daysRemaining: number | undefined;
        if (trialActive && subscription.trialStartDate && trialExpiresAt) {
            const diffMs = trialExpiresAt.getTime() - serverTime.getTime();
            daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, daysRemaining);
        }

        // deviceId 기반 중복 체크
        let deviceTrialInfo = null;
        if (subscription.deviceId && subscription.deviceId !== 'unknown') {
            const otherDeviceSubscription = await Subscription.findOne({
                deviceId: subscription.deviceId,
                userId: { $ne: userId },
                trialStartDate: { $exists: true }
            });

            if (otherDeviceSubscription) {
                deviceTrialInfo = {
                    deviceTrialUsedByOtherUser: true,
                    otherUserId: otherDeviceSubscription.userId,
                    otherTrialStartedAt: otherDeviceSubscription.trialStartDate?.toISOString(),
                };
            }
        }

        // 예상 클라이언트 상태
        const expectedClientStatus =
            entitlementActive ? 'subscribed' :
                trialActive ? 'trial' :
                    deviceTrialInfo?.deviceTrialUsedByOtherUser ? 'blocked (device trial used by other user)' :
                        hasPurchaseHistory ? 'blocked (has purchase history but expired)' :
                            hasUsedTrial ? 'blocked (trial expired)' : 'trial (new user)';

        return NextResponse.json({
            userId,
            serverTime: serverTime.toISOString(),

            // === DB 원본 데이터 ===
            dbRawData: {
                status: subscription.status,
                deviceId: subscription.deviceId,
                trialStartDate: subscription.trialStartDate?.toISOString() || null,
                subscriptionStartDate: subscription.subscriptionStartDate?.toISOString() || null,
                subscriptionExpiryDate: subscription.subscriptionExpiryDate?.toISOString() || null,
                forceExpired: subscription.forceExpired,
                createdAt: subscription.createdAt?.toISOString(),
                updatedAt: subscription.updatedAt?.toISOString(),
            },

            // === 계산된 상태 ===
            computedState: {
                entitlementActive,
                trialActive,
                trialExpiresAt: trialExpiresAt?.toISOString() || null,
                hasUsedTrial,
                hasPurchaseHistory,
                daysRemaining,
            },

            // === 예상 클라이언트 상태 ===
            expectedClientStatus,

            // === deviceId 관련 체크 ===
            deviceTrialInfo,

            // === 디버깅 힌트 ===
            debugHints: {
                설정탭_구독관리_서브타이틀:
                    expectedClientStatus === 'subscribed' ? '구독 중' :
                        expectedClientStatus.includes('trial') ? `무료 체험 D-${daysRemaining || 0}` :
                            '무료 체험 종료',

                구독관리_페이지_상태:
                    '이 값은 Google Play에서 조회됨 (서버에서 알 수 없음)',

                오늘탭_배너:
                    expectedClientStatus.includes('trial') ? `무료 체험 D-${daysRemaining || 0} 배너 표시` :
                        expectedClientStatus === 'subscribed' ? '배너 없음 (구독 중)' :
                            '차단 화면 또는 구독 유도',
            },

            // === 문제 가능성 분석 ===
            possibleIssues: getPossibleIssues(subscription, entitlementActive, trialActive, hasPurchaseHistory),
        });
    } catch (error) {
        console.error('[Debug] Subscription query error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        );
    }
}

function getPossibleIssues(
    subscription: any,
    entitlementActive: boolean,
    trialActive: boolean,
    hasPurchaseHistory: boolean
): string[] {
    const issues: string[] = [];

    // 문제 1: DB status와 계산 결과 불일치
    const expectedDbStatus =
        entitlementActive ? 'subscribed' :
            trialActive ? 'trial' : 'blocked';

    if (subscription.status !== expectedDbStatus &&
        !(subscription.status === 'active' && expectedDbStatus === 'subscribed')) {
        issues.push(`⚠️ DB status('${subscription.status}')와 계산된 상태('${expectedDbStatus}')가 다름. sync API 호출 누락 가능성.`);
    }

    // 문제 2: subscriptionExpiryDate가 있는데 만료됨
    if (hasPurchaseHistory && !entitlementActive) {
        issues.push('⚠️ 결제 이력이 있지만 구독이 만료됨 → Google Play에서 해지했거나 갱신 실패');
    }

    // 문제 3: 체험 만료
    if (subscription.trialStartDate && !trialActive && !entitlementActive) {
        issues.push('⚠️ 무료 체험이 만료됨 → blocked 상태여야 함');
    }

    // 문제 4: forceExpired 플래그
    if (subscription.forceExpired) {
        issues.push('⚠️ forceExpired=true → 테스트용 강제 만료 상태');
    }

    // 문제 5: 프로덕션 vs 개발 차이 가능성
    issues.push('💡 설정탭 서브타이틀: 로컬 캐시(AsyncStorage)에서 읽음. 서버 상태와 다를 수 있음.');
    issues.push('💡 구독관리 페이지: Google Play에서 직접 조회함. 서버 DB와 다를 수 있음.');
    issues.push('💡 프로덕션 빌드는 이전 캐시 값이 남아있을 수 있음. 개발 빌드는 매번 초기화될 수 있음.');

    return issues;
}
