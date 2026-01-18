/**
 * subscriptionManager.test.ts
 * 
 * SubscriptionManager 클래스 동작 테스트
 * - 싱글톤 패턴
 * - 디바운싱/캐싱
 * - 결제 완료 처리
 * - 테스트 모드
 * 
 * 주의: jest.config.js의 moduleNameMapper를 사용하므로
 *       테스트 파일 내에서 jest.mock() 호출 금지
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 테스트용 상수
const mockServerTime = new Date('2025-01-18T12:00:00Z');
const mockFutureExpiry = new Date('2025-02-18T12:00:00Z');

/**
 * Mock VerificationResult 생성 헬퍼
 */
const createMockVerificationResult = (overrides: any = {}) => ({
  success: true,
  serverSyncSucceeded: true,
  entitlementActive: false,
  expiresDate: undefined,
  productId: undefined,
  isPending: false,
  source: 'server' as const,
  serverTime: mockServerTime,
  hasUsedTrial: false,
  trialActive: false,
  hasPurchaseHistory: false,
  restoreAttempted: false,
  restoreSucceeded: false,
  daysRemaining: 7,
  deviceBasedTrialBlock: false,
  deviceTrialInfo: null,
  ...overrides,
});

/**
 * Mock fetch 설정 헬퍼
 */
const setupMockFetch = (verificationResult: any) => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/subscription/verify')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: verificationResult }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

describe('SubscriptionManager - Singleton Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.resetModules();
    
    await AsyncStorage.setItem('current_user_id', 'test-user-123');
    await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
    
    // 싱글톤 인스턴스 초기화
    const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
    SubscriptionManager.resetInstance();
  });

  describe('1. Singleton Pattern', () => {
    test('should return same instance', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      
      const instance1 = SubscriptionManager.getInstance();
      const instance2 = SubscriptionManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('should create new instance after resetInstance', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      
      const instance1 = SubscriptionManager.getInstance();
      SubscriptionManager.resetInstance();
      const instance2 = SubscriptionManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });
});

describe('SubscriptionManager - Purchase Complete Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.resetModules();
    
    await AsyncStorage.setItem('current_user_id', 'test-user-123');
    await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
    
    const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
    SubscriptionManager.resetInstance();
  });

  describe('2. Purchase Just Completed Flag', () => {
    test('should return active immediately after purchase complete', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.handlePurchaseComplete();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('active');
    });

    test('should clear restore flags after purchase complete', async () => {
      await AsyncStorage.setItem('restore_attempted', 'true');
      await AsyncStorage.setItem('restore_succeeded', 'false');
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await AsyncStorage.setItem('restore_attempted', 'true');
      await AsyncStorage.setItem('restore_succeeded', 'false');
      
      await manager.handlePurchaseComplete();
      
      const restoreAttempted = await AsyncStorage.getItem('restore_attempted');
      const restoreSucceeded = await AsyncStorage.getItem('restore_succeeded');
      
      expect(restoreAttempted).toBeNull();
      expect(restoreSucceeded).toBeNull();
    });

    test('should only skip SSOT once after purchase', async () => {
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 5,
      });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.handlePurchaseComplete();
      
      const status1 = await manager.resolveSubscriptionStatus();
      expect(status1).toBe('active');
      
      manager.invalidateCache();
      const status2 = await manager.resolveSubscriptionStatus({ forceRefresh: true });
      expect(status2).toBe('trial');
    });
  });
});

describe('SubscriptionManager - Debouncing Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.resetModules();
    
    await AsyncStorage.setItem('current_user_id', 'test-user-123');
    await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
    
    const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
    SubscriptionManager.resetInstance();
  });

  describe('3. Debounce Within Time Window', () => {
    test('should return cached result within debounce window', async () => {
      const mockResult = createMockVerificationResult({ trialActive: true });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status1 = await manager.resolveSubscriptionStatus();
      const status2 = await manager.resolveSubscriptionStatus();
      
      expect(status1).toBe('trial');
      expect(status2).toBe('trial');
      // 디바운싱으로 인해 두 번째 호출은 캐시에서 반환 (fetch 1번만 호출)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should refresh when forceRefresh is true', async () => {
      const mockResult = createMockVerificationResult({ trialActive: true });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      await manager.resolveSubscriptionStatus();
      await manager.resolveSubscriptionStatus({ forceRefresh: true });
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Cache Invalidation', () => {
    test('should clear cache when invalidateCache is called', async () => {
      const mockResult = createMockVerificationResult({ trialActive: true });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      await manager.resolveSubscriptionStatus();
      
      expect(manager.getCachedStatus()).toBe('trial');
      
      manager.invalidateCache();
      
      expect(manager.getCachedStatus()).toBeNull();
    });
  });
});

describe('SubscriptionManager - Test Mode Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.resetModules();
    
    await AsyncStorage.setItem('current_user_id', 'test-user-123');
    await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
    
    const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
    SubscriptionManager.resetInstance();
  });

  describe('5. Test Mode - Skip Restore', () => {
    test('should skip restore when test mode is set with skipRestore', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.setTestMode(true, true);
      
      await AsyncStorage.setItem('subscription_status', 'expired');
      
      const mockResult = createMockVerificationResult({
        hasUsedTrial: true,
        hasPurchaseHistory: false,
        entitlementActive: false,
      });
      setupMockFetch(mockResult);
      
      const status = await manager.resolveSubscriptionStatus({ forceRefresh: true });
      
      expect(status).toBe('expired');
    });
  });

  describe('6. Test Mode - Clear', () => {
    test('should clear all test flags when clearTestMode is called', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.setTestMode(true, true);
      
      const skipRestoreBefore = await AsyncStorage.getItem('dev_force_skip_restore');
      expect(skipRestoreBefore).toBe('true');
      
      await manager.clearTestMode();
      
      const skipRestoreAfter = await AsyncStorage.getItem('dev_force_skip_restore');
      expect(skipRestoreAfter).toBeNull();
    });
  });

  describe('7. Reset For Testing', () => {
    test('should reset all internal state', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      const mockResult = createMockVerificationResult({ trialActive: true });
      setupMockFetch(mockResult);
      
      await manager.resolveSubscriptionStatus();
      expect(manager.getCachedStatus()).toBe('trial');
      
      await manager.resetForTesting();
      
      expect(manager.getCachedStatus()).toBeNull();
    });
  });
});

describe('SubscriptionManager - Error Handling Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.resetModules();
    
    await AsyncStorage.setItem('current_user_id', 'test-user-123');
    await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
    
    const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
    SubscriptionManager.resetInstance();
  });

  describe('8. Network Error Handling', () => {
    test('should return loading on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('loading');
    });
  });

  describe('9. Concurrent Call Protection', () => {
    test('should prevent concurrent calls', async () => {
      let resolveCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolveCount++;
            resolve({
              ok: true,
              json: () => Promise.resolve({
                data: createMockVerificationResult({ trialActive: true })
              })
            });
          }, 100);
        });
      });
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const promise1 = manager.resolveSubscriptionStatus();
      const promise2 = manager.resolveSubscriptionStatus();
      
      const [status1, status2] = await Promise.all([promise1, promise2]);
      
      expect(status1).toBe('trial');
      expect(status2).toBe('loading'); // 동시 호출 시 두 번째는 loading 반환
      expect(resolveCount).toBe(1); // fetch는 1번만 호출됨
    });
  });
});

describe('SubscriptionManager - UI Status Mapping Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.resetModules();
    
    await AsyncStorage.setItem('current_user_id', 'test-user-123');
    await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
    
    const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
    SubscriptionManager.resetInstance();
  });

  describe('10. SSOT to UI Status Mapping', () => {
    test('should map subscribed to active', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('active');
    });

    test('should map blocked to expired', async () => {
      const mockResult = createMockVerificationResult({
        hasUsedTrial: true,
        hasPurchaseHistory: false,
        entitlementActive: false,
      });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.setTestMode(true, true);
      
      const status = await manager.resolveSubscriptionStatus({ forceRefresh: true });
      
      expect(status).toBe('expired');
    });

    test('should map trial to trial', async () => {
      const mockResult = createMockVerificationResult({ trialActive: true });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('trial');
    });

    test('should map loading to loading', async () => {
      const mockResult = createMockVerificationResult({
        success: false,
      });
      setupMockFetch(mockResult);
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('loading');
    });
  });
});
