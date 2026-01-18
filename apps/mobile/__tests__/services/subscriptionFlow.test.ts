/**
 * subscriptionFlow.test.ts
 * 
 * 전체 구독 플로우 테스트
 * - 설치 유형 (신규/재설치/기존)
 * - 결제 사이클 (무료체험 → 구독 → 갱신/만료)
 * - 복원 프로세스
 * - 네트워크 에러 시나리오
 * - SubscriptionBlockScreen 동작 검증
 * 
 * 주의: jest.config.js의 moduleNameMapper를 사용하므로
 *       테스트 파일 내에서 jest.mock() 호출 금지
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as reactNativeIap from 'react-native-iap';
import { SUBSCRIPTION_KEYS } from '../../services/subscription-ssot';
import { createMockVerificationResult, setupMockFetch, setupSubscriptionTest, cleanupSubscriptionTest, mockServerTime, mockFutureExpiry } from '../testUtils';

describe('Subscription Flow - Installation Type Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('1. New Installation - First Time User', () => {
    beforeEach(async () => {
      await setupSubscriptionTest();
    });
  });

  describe('1. New Installation - First Time User', () => {
    test('should start trial for new user without any history', async () => {
      const mockResult = createMockVerificationResult({
        hasUsedTrial: false,
        trialActive: false,
        hasPurchaseHistory: false,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('trial');
    });

    test('should display TrialBanner for new user', async () => {
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 7,
        hasUsedTrial: true,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('trial');
      expect(result.state.daysRemaining).toBe(7);
    });
  });

  describe('2. Reinstall - User With Active Subscription', () => {
    test('should restore active subscription on reinstall', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
        hasUsedTrial: true,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('subscribed');
    });
  });

  describe('3. Reinstall - User With Expired Subscription (C-1)', () => {
    test('should show blocked for user with expired subscription', async () => {
      const mockResult = createMockVerificationResult({
        hasPurchaseHistory: true,
        entitlementActive: false,
        hasUsedTrial: true,
        restoreAttempted: false,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('4. Reinstall - User With Expired Trial', () => {
    test('should block user with expired trial on reinstall', async () => {
      const mockResult = createMockVerificationResult({
        hasUsedTrial: true,
        trialActive: false,
        hasPurchaseHistory: false,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('5. Existing Installation - Trial Still Active', () => {
    test('should maintain trial status for existing user with active trial', async () => {
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'trial');
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.TRIAL_START_DATE, '2025-01-15T12:00:00Z');
      
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 4,
        hasUsedTrial: true,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('trial');
      expect(result.state.daysRemaining).toBe(4);
    });
  });
});

describe('Subscription Flow - Payment Cycle Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('6. Trial to Subscription - Payment Success', () => {
    test('should transition from trial to active after payment', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const mockResult = createMockVerificationResult({ trialActive: true });
      setupMockFetch(mockResult);
      
      const status1 = await manager.resolveSubscriptionStatus();
      expect(status1).toBe('trial');
      
      await manager.handlePurchaseComplete();
      
      const status2 = await manager.resolveSubscriptionStatus({ forceRefresh: true });
      expect(status2).toBe('active');
    });

    test('should hide TrialBanner after payment success', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.handlePurchaseComplete();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('active');
      expect(status).not.toBe('trial');
    });
  });

  describe('7. Subscription Renewal - Auto Renew Success', () => {
    test('should maintain active status after successful renewal', async () => {
      const newExpiry = new Date('2025-03-18T12:00:00Z');
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: newExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('subscribed');
      expect(result.state.subscriptionExpiryDate).toBe(newExpiry.toISOString());
    });
  });

  describe('8. Subscription Expiry - Renewal Failed', () => {
    test('should transition to blocked when subscription expires', async () => {
      const expiredDate = new Date('2025-01-10T12:00:00Z');
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: expiredDate,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('9. Blocked to Active - Re-subscription', () => {
    test('should transition from blocked to active after re-subscription', async () => {
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'blocked');
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.handlePurchaseComplete();
      
      const status = await manager.resolveSubscriptionStatus();
      expect(status).toBe('active');
    });
  });
});

describe('Subscription Flow - Restore Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('10. Manual Restore - Success', () => {
    test('should transition to active when restore succeeds', async () => {
      (reactNativeIap.getAvailablePurchases as jest.Mock).mockResolvedValue([
        {
          productId: 'monthly_test_260111',
          transactionDate: Date.now(),
          purchaseToken: 'test-token',
          autoRenewingAndroid: true,
          dataAndroid: JSON.stringify({
            expiryTimeMillis: mockFutureExpiry.getTime().toString(),
          }),
        },
      ]);
      
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);
      
      const { restorePurchases } = await import('../../services/paymentService');
      const restored = await restorePurchases(true);

      expect(restored).toBe(true);
      
      const restoreAttempted = await AsyncStorage.getItem('restore_attempted');
      const restoreSucceeded = await AsyncStorage.getItem('restore_succeeded');
      
      expect(restoreAttempted).toBe('true');
      expect(restoreSucceeded).toBe('true');
    });
  });

  describe('11. Manual Restore - Failure (No Subscription)', () => {
    test('should remain blocked when no subscription found on restore', async () => {
      (reactNativeIap.getAvailablePurchases as jest.Mock).mockResolvedValue([]);
      
      const { restorePurchases } = await import('../../services/paymentService');
      const restored = await restorePurchases(true);

      expect(restored).toBe(false);
      
      const restoreAttempted = await AsyncStorage.getItem('restore_attempted');
      const restoreSucceeded = await AsyncStorage.getItem('restore_succeeded');
      
      expect(restoreAttempted).toBe('true');
      expect(restoreSucceeded).toBe('false');
    });
  });

  describe('12. Auto Restore - Should Not Set Flags', () => {
    test('should not set restore flags when auto restore (setFlags=false)', async () => {
      (reactNativeIap.getAvailablePurchases as jest.Mock).mockResolvedValue([]);
      
      const { restorePurchases } = await import('../../services/paymentService');
      await restorePurchases(false);

      const restoreAttempted = await AsyncStorage.getItem('restore_attempted');
      const restoreSucceeded = await AsyncStorage.getItem('restore_succeeded');
      
      expect(restoreAttempted).toBeNull();
      expect(restoreSucceeded).toBeNull();
    });
  });
});

describe('Subscription Flow - Network Scenario Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('13. D-1 Case - New User Without Network', () => {
    test('should return loading when network unavailable for new user', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('loading');
    });
  });

  describe('14. D-2 Case - Server 500 Error', () => {
    test('should return loading when server returns 500', async () => {
      await AsyncStorage.setItem('dev_force_server_error', 'true');
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('loading');
      
      await AsyncStorage.removeItem('dev_force_server_error');
    });
  });

  describe('15. Network Recovery - Loading to Active', () => {
    test('should transition from loading to correct status when network recovers', async () => {
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const status1 = await manager.resolveSubscriptionStatus();
      expect(status1).toBe('loading');
      
      manager.invalidateCache();
      
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);
      
      const status2 = await manager.resolveSubscriptionStatus({ forceRefresh: true });
      expect(status2).toBe('active');
    });
  });
});

describe('Subscription Flow - Edge Case Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('16. G Case - Pending Transaction', () => {
    test('should show loading when transaction is pending', async () => {
      (reactNativeIap.getAvailablePurchases as jest.Mock).mockResolvedValue([
        {
          productId: 'monthly_test_260111',
          purchaseStateAndroid: 4,
        },
      ]);
      
      const mockResult = createMockVerificationResult({
        isPending: true,
        entitlementActive: false,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('17. Device-Based Trial Block', () => {
    test('should block when same device used trial with different account', async () => {
      const mockResult = createMockVerificationResult({
        deviceBasedTrialBlock: true,
        deviceTrialInfo: {
          deviceTrialUsed: true,
          deviceTrialUserId: 'other-user-456',
          deviceTrialStartedAt: '2025-01-01T00:00:00Z',
        },
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('18. Legacy Product ID', () => {
    test('should reject legacy product IDs', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'legacy_product_id',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('19. Valid Product ID', () => {
    test('should accept valid product ID (monthly_test_260111)', async () => {
      setupMockFetch(createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      }));
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('subscribed');
    });
  });
});

describe('Subscription Flow - SubscriptionBlockScreen Integration Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('20. SubscriptionBlockScreen - Trial Expired', () => {
    test('should show block screen when trial expires', async () => {
      const mockResult = createMockVerificationResult({
        hasUsedTrial: true,
        trialActive: false,
        hasPurchaseHistory: false,
        entitlementActive: false,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('21. SubscriptionBlockScreen - Subscription Expired', () => {
    test('should show block screen when subscription expires', async () => {
      const expiredDate = new Date('2025-01-10T12:00:00Z');
      const mockResult = createMockVerificationResult({
        hasUsedTrial: true,
        hasPurchaseHistory: true,
        entitlementActive: true,
        expiresDate: expiredDate,
        productId: 'monthly_test_260111',
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('22. SubscriptionBlockScreen - Restore Failed (C-1)', () => {
    test('should show block screen when restore not attempted', async () => {
      const mockResult = createMockVerificationResult({
        hasPurchaseHistory: true,
        entitlementActive: false,
        hasUsedTrial: true,
        restoreAttempted: false,
      });
      setupMockFetch(mockResult);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('23. SubscriptionBlockScreen to Normal Screen - After Payment', () => {
    test('should dismiss block screen after successful payment', async () => {
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS, 'blocked');
      
      const SubscriptionManager = (await import('../../services/SubscriptionManager')).default;
      const manager = SubscriptionManager.getInstance();
      
      await manager.resetForTesting();
      await manager.handlePurchaseComplete();
      
      const status = await manager.resolveSubscriptionStatus();
      
      expect(status).toBe('active');
    });
  });

  describe('24. SubscriptionBlockScreen to Normal Screen - After Restore', () => {
    test('should dismiss block screen after successful restore', async () => {
      (reactNativeIap.getAvailablePurchases as jest.Mock).mockResolvedValue([
        {
          productId: 'monthly_test_260111',
          transactionDate: Date.now(),
          purchaseToken: 'test-token',
          autoRenewingAndroid: true,
          dataAndroid: JSON.stringify({
            expiryTimeMillis: mockFutureExpiry.getTime().toString(),
          }),
        },
      ]);
      
      setupMockFetch(createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      }));
      
      const { restorePurchases } = await import('../../services/paymentService');
      const restored = await restorePurchases(true);

      expect(restored).toBe(true);
      
      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('subscribed');
    });
  });
});
