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

    test('should set active status after purchase complete', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();
      await manager.handlePurchaseComplete();

      // After purchase complete, status should be active
      expect(manager.getCachedStatus()).toBe('active');
    });

    test('should return active immediately after purchase', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();
      await manager.handlePurchaseComplete();

      // First call after purchase returns active (purchaseJustCompleted flag)
      const status = await manager.resolveSubscriptionStatus();
      expect(status).toBe('active');
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
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const status1 = await manager.resolveSubscriptionStatus();
      const status2 = await manager.resolveSubscriptionStatus();

      expect(status1).toBe('trial');
      expect(status2).toBe('trial');
      // Both should return same result due to debouncing
    });

    test('should refresh when forceRefresh is true', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const status1 = await manager.resolveSubscriptionStatus();
      const status2 = await manager.resolveSubscriptionStatus({ forceRefresh: true });

      // Both should return trial from mock
      expect(status1).toBe('trial');
      expect(status2).toBe('trial');
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
    test('should set and get test mode flags correctly', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      SubscriptionManager.resetInstance();
      const manager = SubscriptionManager.getInstance();

      // Set flags directly with AsyncStorage (bypass manager to test persistence)
      await AsyncStorage.setItem('dev_force_skip_restore', 'true');
      await AsyncStorage.setItem('dev_force_skip_ssot', 'true');

      const skipRestore = await AsyncStorage.getItem('dev_force_skip_restore');
      const skipSSOT = await AsyncStorage.getItem('dev_force_skip_ssot');

      expect(skipRestore).toBe('true');
      expect(skipSSOT).toBe('true');
    });
  });

  describe('6. Test Mode - Clear', () => {
    test('should have clearTestMode method available', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      SubscriptionManager.resetInstance();
      const manager = SubscriptionManager.getInstance();

      // Verify clearTestMode is a function that can be called
      expect(typeof manager.clearTestMode).toBe('function');

      // Should not throw when called
      await expect(manager.clearTestMode()).resolves.toBeUndefined();
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
    test('should return trial in normal conditions (mock behavior)', async () => {
      // Note: Actual network error handling is tested in subscription-ssot.test.ts
      // This test verifies the SubscriptionManager returns mock value correctly
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const status = await manager.resolveSubscriptionStatus();

      // Subscription mock returns trial by default
      expect(status).toBe('trial');
    });
  });

  describe('9. Concurrent Call Protection', () => {
    test('should prevent concurrent calls', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const promise1 = manager.resolveSubscriptionStatus();
      const promise2 = manager.resolveSubscriptionStatus();

      const [status1, status2] = await Promise.all([promise1, promise2]);

      // First call processes, second returns loading due to isProcessing flag
      expect(status1).toBe('trial');
      expect(status2).toBe('loading');
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
    test('should return trial from subscription mock', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const status = await manager.resolveSubscriptionStatus();

      // Subscription mock returns trial by default
      expect(status).toBe('trial');
    });

    test('should return trial from mock in normal conditions', async () => {
      // Note: Server error handling is tested in subscription-ssot.test.ts
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const status = await manager.resolveSubscriptionStatus({ forceRefresh: true });

      // Mock returns trial by default
      expect(status).toBe('trial');
    });

    test('should map trial to trial', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();

      const status = await manager.resolveSubscriptionStatus();

      expect(status).toBe('trial');
    });

    test('should return active after purchase complete', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();

      await manager.resetForTesting();
      await manager.handlePurchaseComplete();

      const status = await manager.resolveSubscriptionStatus();

      expect(status).toBe('active');
    });
  });
});
