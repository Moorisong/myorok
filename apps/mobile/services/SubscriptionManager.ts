/**
 * SubscriptionManager - 구독 상태 관리 싱글톤
 * 
 * 모든 구독 상태 변경은 이 클래스를 통해서만 수행됩니다.
 * - 중복 호출 방지 (isProcessing 플래그)
 * - 디바운싱 (DEBOUNCE_MS)
 * - 복원 성공 시 SSOT 건너뛰기
 * 
 * @see docs/conventions/common/refactoring.md - SRP 원칙
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type UISubscriptionStatus = 'loading' | 'active' | 'trial' | 'expired';

interface ResolveOptions {
    /** 강제로 새로 체크 (캐시 무시) */
    forceRefresh?: boolean;
    /** 복원 시도 건너뛰기 (AppState 등에서 사용) */
    skipRestore?: boolean;
}

class SubscriptionManager {
    private static instance: SubscriptionManager;

    // 중복 호출 방지
    private isProcessing: boolean = false;

    // 디바운싱
    private lastProcessedAt: number = 0;
    private lastResult: UISubscriptionStatus | null = null;
    private readonly DEBOUNCE_MS = 3000; // 3초 내 재호출 시 캐시 반환

    // 결제 완료 플래그 (결제 직후 SSOT 건너뛰기용)
    private purchaseJustCompleted: boolean = false;

    // 테스트용: Google Play 복원 강제 건너뛰기
    private forceSkipRestore: boolean = false;
    // 테스트용: SSOT 서버 검증도 건너뛰기 (C-1 등, D-1에서는 false로 SSOT 시도)
    private forceSkipSSOT: boolean = false;
    private testModeLoaded: boolean = false;

    private constructor() {
        console.log('[SubscriptionManager] Instance created');
    }

    static getInstance(): SubscriptionManager {
        if (!SubscriptionManager.instance) {
            SubscriptionManager.instance = new SubscriptionManager();
        }
        return SubscriptionManager.instance;
    }

    async setTestMode(skipRestore: boolean, skipSSOT: boolean = true): Promise<void> {
        this.forceSkipRestore = skipRestore;
        this.forceSkipSSOT = skipSSOT;
        // (A-1 테스트 로직 제거됨)
        // AsyncStorage에 저장하여 앱 재시작 후에도 유지
        if (skipRestore) {
            await AsyncStorage.setItem('dev_force_skip_restore', 'true');
            await AsyncStorage.setItem('dev_force_skip_ssot', skipSSOT ? 'true' : 'false');
        } else {
            await AsyncStorage.removeItem('dev_force_skip_restore');
            await AsyncStorage.removeItem('dev_force_skip_ssot');
        }
        console.log('[SubscriptionManager] Test mode set, forceSkipRestore:', skipRestore, 'forceSkipSSOT:', skipSSOT);
    }

    /**
     * 앱 시작 시 테스트 모드 로드
     */
    private async loadTestMode(): Promise<void> {
        if (this.testModeLoaded) return;

        const skipRestoreFlag = await AsyncStorage.getItem('dev_force_skip_restore');
        const skipSSOTFlag = await AsyncStorage.getItem('dev_force_skip_ssot');

        this.forceSkipRestore = skipRestoreFlag === 'true';
        this.forceSkipSSOT = skipSSOTFlag === 'true'; // 기본 false (D-1처럼 SSOT 시도)
        this.testModeLoaded = true;

        if (this.forceSkipRestore) {
            console.log('[SubscriptionManager] Test mode loaded: forceSkipRestore=true, forceSkipSSOT=', this.forceSkipSSOT);
        }
    }

    /**
     * 유일한 구독 상태 체크/갱신 진입점
     * 
     * 흐름:
     * 1. 중복 호출/디바운싱 체크
     * 2. 결제 직후면 바로 'active' 반환
     * 3. 로컬 상태가 'expired'면 Google Play에서 복원 시도
     * 4. 복원 성공 시 'active' 반환 (SSOT 건너뜀)
     * 5. 복원 실패/안 함 → SSOT 서버 검증
     * 6. 결과 캐시 및 반환
     */
    async resolveSubscriptionStatus(options: ResolveOptions = {}): Promise<UISubscriptionStatus> {
        const { forceRefresh = false, skipRestore = false } = options;

        // 0. 테스트 모드 로드 (AsyncStorage에서)
        await this.loadTestMode();

        // 1. 디바운싱 체크 (forceRefresh가 아닐 때)
        if (!forceRefresh && this.lastResult !== null) {
            const elapsed = Date.now() - this.lastProcessedAt;
            if (elapsed < this.DEBOUNCE_MS) {
                console.log(`[SubscriptionManager] Debounce: returning cached result '${this.lastResult}' (${elapsed}ms ago)`);
                return this.lastResult;
            }
        }

        // 2. 중복 호출 방지
        if (this.isProcessing) {
            console.log('[SubscriptionManager] Already processing, returning cached or loading');
            return this.lastResult ?? 'loading';
        }

        this.isProcessing = true;
        console.log('[SubscriptionManager] Starting subscription resolution...');

        try {
            // 3. 결제 직후 플래그 체크
            if (this.purchaseJustCompleted) {
                console.log('[SubscriptionManager] Purchase just completed, returning active');
                this.purchaseJustCompleted = false;
                this.lastResult = 'active';
                this.lastProcessedAt = Date.now();
                return 'active';
            }

            // 4. 로컬 상태 확인 및 복원 시도
            const { getSubscriptionState, checkAndRestoreSubscription } = await import('./subscription');
            const localState = await getSubscriptionState();
            console.log('[SubscriptionManager] Local state:', localState);

            // F-1: 로컬 만료일로 active 판정 금지 (기기 시간 조작 방지)
            // 구독 active 판정은 항상 서버(SSOT) 기준
            // 오프라인에서는 loading 유지 (active 추측 안 함)

            let restored = false;
            if (!skipRestore && !this.forceSkipRestore && localState === 'expired') {
                console.log('[SubscriptionManager] Attempting restore...');
                restored = await checkAndRestoreSubscription();
                console.log('[SubscriptionManager] Restore result:', restored);
            } else if (this.forceSkipRestore) {
                console.log('[SubscriptionManager] Skipping restore (test mode)');
            }

            // 5. 복원 성공 시 SSOT 건너뜀
            if (restored) {
                console.log('[SubscriptionManager] Restore succeeded, trusting local state');
                this.lastResult = 'active';
                this.lastProcessedAt = Date.now();
                return 'active';
            }

            // 6. 테스트 모드에서 SSOT도 건너뛰기 (C-1 등)
            // D-1에서는 forceSkipSSOT=false로 SSOT 시도 → 네트워크 에러 시 loading
            if (this.forceSkipRestore && this.forceSkipSSOT && localState === 'expired') {
                console.log('[SubscriptionManager] Test mode: skipping SSOT (forceSkipSSOT=true)');
                this.lastResult = 'expired';
                this.lastProcessedAt = Date.now();
                return 'expired';
            }

            // 7. SSOT 서버 검증
            console.log('[SubscriptionManager] Running SSOT verification...');
            const { verifySubscriptionWithServer } = await import('./subscription');
            const { status } = await verifySubscriptionWithServer();
            console.log('[SubscriptionManager] SSOT status:', status);

            // 7. SSOT 상태를 UI 상태로 변환
            let uiStatus: UISubscriptionStatus;
            if (status === 'subscribed') {
                uiStatus = 'active';
            } else if (status === 'blocked') {
                uiStatus = 'expired';
            } else if (status === 'trial') {
                uiStatus = 'trial';
            } else {
                uiStatus = 'loading';
            }

            console.log('[SubscriptionManager] Final UI status:', uiStatus);
            this.lastResult = uiStatus;
            this.lastProcessedAt = Date.now();
            return uiStatus;

        } catch (error) {
            console.error('[SubscriptionManager] Error during resolution:', error);
            // F-1 오프라인 처리 원칙:
            // - 마지막 상태가 active/trial → loading (추측 금지)
            // - 마지막 상태가 expired → blocked 유지
            const lastStatus = await AsyncStorage.getItem('subscription_status');
            if (lastStatus === 'blocked' || lastStatus === 'expired') {
                console.log('[SubscriptionManager] Offline + expired → blocked');
                this.lastResult = 'expired';
                this.lastProcessedAt = Date.now();
                return 'expired';
            }
            console.log('[SubscriptionManager] Offline + unknown/active → loading');
            this.lastResult = 'loading';
            this.lastProcessedAt = Date.now();
            return 'loading';
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 결제 완료 후 호출
     * - 즉시 active 상태로 전환
     * - 다음 resolveSubscriptionStatus 호출 시 SSOT 건너뜀
     */
    async handlePurchaseComplete(): Promise<void> {
        console.log('[SubscriptionManager] Purchase completed, setting flags');

        // restore 플래그 제거
        await AsyncStorage.removeItem('restore_attempted');
        await AsyncStorage.removeItem('restore_succeeded');

        // 결제 완료 플래그 설정
        this.purchaseJustCompleted = true;
        this.lastResult = 'active';
        this.lastProcessedAt = Date.now();
    }

    /**
     * 테스트용 상태 초기화
     * - 모든 내부 플래그 리셋
     * - 테스트 케이스 시작 전 호출 필수
     */
    async resetForTesting(): Promise<void> {
        console.log('[SubscriptionManager] Resetting for testing...');

        this.isProcessing = false;
        this.lastProcessedAt = 0;
        this.lastResult = null;
        this.purchaseJustCompleted = false;

        // restore 플래그도 초기화
        await AsyncStorage.removeItem('restore_attempted');
        await AsyncStorage.removeItem('restore_succeeded');

        console.log('[SubscriptionManager] Reset complete');
    }

    /**
     * 캐시 무효화 (수동 복원 후 호출)
     * - 디바운스 캐시를 초기화하여 다음 호출 시 새로 체크
     */
    invalidateCache(): void {
        console.log('[SubscriptionManager] Cache invalidated');
        this.lastResult = null;
        this.lastProcessedAt = 0;
    }

    /**
     * 캐시된 결과 반환 (UI 렌더링용)
     * - resolveSubscriptionStatus보다 빠름
     * - null이면 아직 체크 안 됨
     */
    getCachedStatus(): UISubscriptionStatus | null {
        return this.lastResult;
    }

    /**
     * 테스트 모드 완전 해제
     * - 모든 테스트 관련 플래그 제거
     * - 캐시 초기화
     */
    async clearTestMode(): Promise<void> {
        console.log('[SubscriptionManager] Clearing test mode...');

        // 메모리 플래그 초기화
        this.forceSkipRestore = false;
        this.forceSkipSSOT = false;
        this.testModeLoaded = false;
        this.isProcessing = false;
        this.lastResult = null;
        this.lastProcessedAt = 0;
        this.purchaseJustCompleted = false;

        // AsyncStorage 플래그 제거
        await AsyncStorage.removeItem('dev_force_skip_restore');
        await AsyncStorage.removeItem('dev_force_skip_ssot');
        await AsyncStorage.removeItem('dev_force_ignore_entitlement');
        await AsyncStorage.removeItem('dev_force_server_error');
        await AsyncStorage.removeItem('restore_attempted');
        await AsyncStorage.removeItem('restore_succeeded');

        console.log('[SubscriptionManager] Test mode cleared');
    }

    /**
     * 상태 강제 초기화 (D-1/D-2 복구용)
     */
    async forceReset(): Promise<void> {
        console.log('[SubscriptionManager] Force resetting internal state');
        this.isProcessing = false;
        this.lastResult = null;
        this.lastProcessedAt = 0;
        await this.clearTestMode();
    }
}

export default SubscriptionManager;
