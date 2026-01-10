/**
 * TestUserManager - 테스트 케이스별 독립적인 userId 관리
 *
 * 각 테스트 케이스가 서로 영향을 주지 않도록 별도의 테스트 userId를 사용합니다.
 * - 테스트 시작: 원래 userId 백업 → 테스트 userId로 전환
 * - 테스트 종료: 원래 userId로 복귀
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    ORIGINAL_USER_ID: 'test_original_user_id',
    ORIGINAL_JWT_TOKEN: 'test_original_jwt_token',
    ORIGINAL_IS_ADMIN: 'test_original_is_admin',
    ACTIVE_TEST_CASE: 'test_active_case',
    CURRENT_USER_ID: 'current_user_id',
    JWT_TOKEN: 'jwt_token',
    IS_ADMIN: 'is_admin',
};

export type TestCaseId = 'A-1' | 'A-2' | 'A-3' | 'B-1' | 'C-1' | 'C-2' | 'D-1' | 'D-2';

interface TestCaseInfo {
    id: TestCaseId;
    name: string;
    description: string;
}

export const TEST_CASES: Record<TestCaseId, TestCaseInfo> = {
    'A-1': { id: 'A-1', name: '완전 신규 유저', description: '서버 초기화 + Google Play 복원 건너뛰기' },
    'A-2': { id: 'A-2', name: '체험만료+재설치', description: '서버에 체험기록 남김 → 로컬삭제' },
    'A-3': { id: 'A-3', name: '유효 구독 유저', description: '구독 활성 상태에서 앱 재설치' },
    'B-1': { id: 'B-1', name: '구독 만료', description: '구독 만료 상태 시뮬레이션' },
    'C-1': { id: 'C-1', name: '결제이력O+만료', description: '결제 이력 O, entitlement X' },
    'C-2': { id: 'C-2', name: 'Restore 실패', description: '복원 시도했으나 실패' },
    'D-1': { id: 'D-1', name: '신규+네트워크없음', description: '신규 유저 + 네트워크 없음' },
    'D-2': { id: 'D-2', name: '서버 500 에러', description: '서버 에러 시뮬레이션' },
};

class TestUserManager {
    private static instance: TestUserManager;

    private constructor() {}

    static getInstance(): TestUserManager {
        if (!TestUserManager.instance) {
            TestUserManager.instance = new TestUserManager();
        }
        return TestUserManager.instance;
    }

    /**
     * 테스트용 userId 생성
     * 형식: test_{케이스ID}_{원래userId}
     */
    generateTestUserId(testCaseId: TestCaseId, originalUserId: string): string {
        const sanitizedCaseId = testCaseId.replace('-', '').toLowerCase();
        return `test_${sanitizedCaseId}_${originalUserId}`;
    }

    /**
     * 현재 활성화된 테스트 케이스 조회
     */
    async getActiveTestCase(): Promise<TestCaseId | null> {
        const activeCase = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TEST_CASE);
        return activeCase as TestCaseId | null;
    }

    /**
     * 테스트 모드 활성화 여부
     */
    async isTestModeActive(): Promise<boolean> {
        const activeCase = await this.getActiveTestCase();
        return activeCase !== null;
    }

    /**
     * 원래 userId 조회 (테스트 모드일 때)
     */
    async getOriginalUserId(): Promise<string | null> {
        return AsyncStorage.getItem(STORAGE_KEYS.ORIGINAL_USER_ID);
    }

    /**
     * 테스트 시작 - 테스트용 userId로 전환
     * @returns 테스트용 userId
     */
    async startTest(testCaseId: TestCaseId): Promise<string> {
        // 이미 다른 테스트가 진행 중이면 먼저 종료
        const existingTest = await this.getActiveTestCase();
        if (existingTest) {
            console.log(`[TestUserManager] Ending existing test ${existingTest} before starting ${testCaseId}`);
            await this.endTest();
        }

        // 원래 사용자 정보 백업
        const originalUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        const originalJwtToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        const originalIsAdmin = await AsyncStorage.getItem(STORAGE_KEYS.IS_ADMIN);

        if (!originalUserId) {
            throw new Error('로그인된 사용자가 없습니다');
        }

        // 백업 저장
        await AsyncStorage.setItem(STORAGE_KEYS.ORIGINAL_USER_ID, originalUserId);
        if (originalJwtToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.ORIGINAL_JWT_TOKEN, originalJwtToken);
        }
        if (originalIsAdmin) {
            await AsyncStorage.setItem(STORAGE_KEYS.ORIGINAL_IS_ADMIN, originalIsAdmin);
        }

        // 테스트용 userId 생성 및 전환
        const testUserId = this.generateTestUserId(testCaseId, originalUserId);
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, testUserId);
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TEST_CASE, testCaseId);

        // dev_auto_login 플래그 설정 (세션 검증 건너뛰기)
        await AsyncStorage.setItem('dev_auto_login', 'true');

        console.log(`[TestUserManager] Started test ${testCaseId}`);
        console.log(`[TestUserManager] Original userId: ${originalUserId}`);
        console.log(`[TestUserManager] Test userId: ${testUserId}`);

        return testUserId;
    }

    /**
     * 테스트 종료 - 원래 userId로 복귀
     */
    async endTest(): Promise<void> {
        const activeCase = await this.getActiveTestCase();
        if (!activeCase) {
            console.log('[TestUserManager] No active test to end');
            return;
        }

        // 원래 사용자 정보 복원
        const originalUserId = await AsyncStorage.getItem(STORAGE_KEYS.ORIGINAL_USER_ID);
        const originalJwtToken = await AsyncStorage.getItem(STORAGE_KEYS.ORIGINAL_JWT_TOKEN);
        const originalIsAdmin = await AsyncStorage.getItem(STORAGE_KEYS.ORIGINAL_IS_ADMIN);

        if (originalUserId) {
            await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, originalUserId);
        }
        if (originalJwtToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, originalJwtToken);
        }
        if (originalIsAdmin) {
            await AsyncStorage.setItem(STORAGE_KEYS.IS_ADMIN, originalIsAdmin);
        }

        // 백업 데이터 삭제
        await AsyncStorage.removeItem(STORAGE_KEYS.ORIGINAL_USER_ID);
        await AsyncStorage.removeItem(STORAGE_KEYS.ORIGINAL_JWT_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.ORIGINAL_IS_ADMIN);
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TEST_CASE);

        // 테스트 관련 플래그 제거
        await AsyncStorage.removeItem('dev_auto_login');
        await AsyncStorage.removeItem('force_skip_restore');
        await AsyncStorage.removeItem('force_skip_ssot');
        await AsyncStorage.removeItem('force_server_error');

        // SubscriptionManager 리셋
        try {
            const SubscriptionManager = (await import('./SubscriptionManager')).default;
            const manager = SubscriptionManager.getInstance();
            await manager.clearTestMode();
        } catch (e) {
            console.warn('[TestUserManager] Failed to clear SubscriptionManager:', e);
        }

        console.log(`[TestUserManager] Ended test ${activeCase}, restored userId: ${originalUserId}`);
    }

    /**
     * 테스트 데이터 정리 (서버 데이터는 유지, 로컬만 정리)
     */
    async cleanupTestLocalData(): Promise<void> {
        const { SUBSCRIPTION_KEYS } = await import('./subscription');

        // 구독 관련 로컬 데이터 삭제
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_START_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_EXPIRY_DATE);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.HAS_USED_TRIAL);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED);
        await AsyncStorage.removeItem(SUBSCRIPTION_KEYS.RESTORE_SUCCEEDED);
        await AsyncStorage.removeItem('has_purchase_history');
        await AsyncStorage.removeItem('entitlement_active');

        // 로컬 DB 구독 상태 삭제
        const { getDatabase } = await import('./database');
        const db = await getDatabase();
        await db.execAsync('DELETE FROM subscription_state');

        console.log('[TestUserManager] Cleaned up local test data');
    }

    /**
     * 현재 테스트 상태 정보 조회
     */
    async getTestStatus(): Promise<{
        isActive: boolean;
        testCaseId: TestCaseId | null;
        testUserId: string | null;
        originalUserId: string | null;
    }> {
        const testCaseId = await this.getActiveTestCase();
        const currentUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        const originalUserId = await AsyncStorage.getItem(STORAGE_KEYS.ORIGINAL_USER_ID);

        return {
            isActive: testCaseId !== null,
            testCaseId,
            testUserId: testCaseId ? currentUserId : null,
            originalUserId,
        };
    }
}

export default TestUserManager;
