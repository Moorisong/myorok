/**
 * subscription-ssot.test.ts
 * 
 * SSOT 상태 판정 로직 테스트
 * - determineSubscriptionState 함수의 순수 로직 검증
 * - 각 상태(trial, subscribed, blocked, loading) 전환 조건 검증
 * 
 * 주의: jest.config.js의 moduleNameMapper를 사용하므로
 *       테스트 파일 내에서 jest.mock() 호출 금지
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_KEYS } from '../../services/subscription-ssot';
import { createMockVerificationResult, setupMockFetch, setupSubscriptionTest, cleanupSubscriptionTest, mockServerTime, mockFutureExpiry, mockPastExpiry } from '../testUtils';

describe('Subscription SSOT - Trial State Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('1. Trial Status - New User', () => {
    test('should return trial status for new user without trial used', async () => {
      const mockResult = createMockVerificationResult({
        hasUsedTrial: false,
        trialActive: false,
        hasPurchaseHistory: false,
        entitlementActive: false,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('trial');
    });

    test('should return trial status when trialActive is true', async () => {
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 5,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('trial');
      expect(result.state.daysRemaining).toBe(5);
    });

    test('should save trial status to local cache', async () => {
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 3,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      await verifySubscriptionWithServer();

      const savedStatus = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
      const savedDays = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.DAYS_REMAINING);
      
      expect(savedStatus).toBe('trial');
      expect(savedDays).toBe('3');
    });
  });

  describe('2. Trial Status - Days Remaining Calculation', () => {
    test('should correctly store days remaining from server', async () => {
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 1,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.state.daysRemaining).toBe(1);
    });

    test('should handle zero days remaining', async () => {
      const mockResult = createMockVerificationResult({
        trialActive: true,
        daysRemaining: 0,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('trial');
      expect(result.state.daysRemaining).toBe(0);
    });
  });
});

describe('Subscription SSOT - Active/Subscribed State Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('3. Subscribed Status - Valid Entitlement', () => {
    test('should return subscribed when entitlement is active and not expired', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('subscribed');
      expect(result.state.subscriptionExpiryDate).toBe(mockFutureExpiry.toISOString());
    });

    test('should save subscribed status to local cache', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      await verifySubscriptionWithServer();

      const savedStatus = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.SUBSCRIPTION_STATUS);
      expect(savedStatus).toBe('subscribed');
    });
  });

  describe('4. Subscribed Status - Expiry Handling', () => {
    test('should block when entitlement is active but expired', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockPastExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });
});

describe('Subscription SSOT - Expired/Blocked State Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('5. Blocked Status - Trial Used', () => {
    test('should block when trial used and no active subscription', async () => {
      const mockResult = createMockVerificationResult({
        hasUsedTrial: true,
        trialActive: false,
        entitlementActive: false,
        hasPurchaseHistory: false,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('6. Blocked Status - Purchase History Without Entitlement (CASE J)', () => {
    test('should block when has purchase history but no active entitlement', async () => {
      const mockResult = createMockVerificationResult({
        hasPurchaseHistory: true,
        entitlementActive: false,
        hasUsedTrial: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('7. Blocked Status - Device Based Trial Block', () => {
    test('should block when device-based trial is blocked', async () => {
      const mockResult = createMockVerificationResult({
        deviceBasedTrialBlock: true,
        deviceTrialInfo: {
          deviceTrialUsed: true,
          deviceTrialUserId: 'other-user',
          deviceTrialStartedAt: '2025-01-01T00:00:00Z',
        },
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });
});

describe('Subscription SSOT - Restore Process Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('8. Restore - C-1 Case (Not Attempted)', () => {
    test('should block when restore not attempted but has purchase history', async () => {
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED, 'false');
      
      const mockResult = createMockVerificationResult({
        hasPurchaseHistory: true,
        entitlementActive: false,
        restoreAttempted: false,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('9. Restore - C-2 Case (Attempted but Failed)', () => {
    test('should return loading when restore attempted but failed with purchase history', async () => {
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.RESTORE_ATTEMPTED, 'true');
      await AsyncStorage.setItem(SUBSCRIPTION_KEYS.RESTORE_SUCCEEDED, 'false');
      
      const mockResult = createMockVerificationResult({
        hasPurchaseHistory: true,
        entitlementActive: false,
        restoreAttempted: true,
        restoreSucceeded: false,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });
});

describe('Subscription SSOT - Network/Server Error Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('10. Server Error - 500 Response', () => {
    test('should return loading when server returns 500', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/subscription/verify')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('11. Network Error - Fetch Failure', () => {
    test('should return loading when network fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('12. No JWT Token', () => {
    test('should return loading when no JWT token', async () => {
      await AsyncStorage.removeItem('jwt_token');

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('13. No User ID', () => {
    test('should return blocked when no user ID', async () => {
      await AsyncStorage.removeItem('current_user_id');

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });
});

describe('Subscription SSOT - Edge Case Tests', () => {
  beforeEach(async () => {
    await setupSubscriptionTest();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('14. Pending Transaction (CASE G)', () => {
    test('should return loading when transaction is pending', async () => {
      const mockResult = createMockVerificationResult({
        isPending: true,
        entitlementActive: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('15. Product ID Mismatch', () => {
    test('should return loading when product ID is invalid', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'invalid_product_id',
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('16. Valid Product ID', () => {
    test('should accept valid product ID (monthly_test_260111)', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
        productId: 'monthly_test_260111',
        hasPurchaseHistory: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('subscribed');
    });
  });

  describe('17. Invalid Expiry Date', () => {
    test('should block when expiry date is invalid', async () => {
      const mockResult = createMockVerificationResult({
        entitlementActive: true,
        expiresDate: null,
        productId: 'monthly_test_260111',
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('blocked');
    });
  });

  describe('18. Cache Source - Should Require Server Verification', () => {
    test('should return loading when source is cache', async () => {
      const mockResult = createMockVerificationResult({
        source: 'cache',
        entitlementActive: true,
        expiresDate: mockFutureExpiry,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('19. Server Sync Failed', () => {
    test('should return loading when server sync failed', async () => {
      const mockResult = createMockVerificationResult({
        success: true,
        serverSyncSucceeded: false,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });

  describe('20. Verification Failed', () => {
    test('should return loading when verification failed', async () => {
      const mockResult = createMockVerificationResult({
        success: false,
        serverSyncSucceeded: true,
      });
      setupMockFetch(mockResult);

      const { verifySubscriptionWithServer } = await import('../../services/subscription-ssot');
      const result = await verifySubscriptionWithServer();

      expect(result.status).toBe('loading');
    });
  });
});

describe('Subscription SSOT - Status Conversion Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('21. Legacy Status Conversion', () => {
    test('should convert legacy active to subscribed', async () => {
      const { convertLegacyStatus } = await import('../../services/subscription-ssot');
      
      expect(convertLegacyStatus('active')).toBe('subscribed');
    });

    test('should convert legacy expired to blocked', async () => {
      const { convertLegacyStatus } = await import('../../services/subscription-ssot');
      
      expect(convertLegacyStatus('expired')).toBe('blocked');
    });

    test('should keep trial as trial', async () => {
      const { convertLegacyStatus } = await import('../../services/subscription-ssot');
      
      expect(convertLegacyStatus('trial')).toBe('trial');
    });
  });

  describe('22. To Legacy Status Conversion', () => {
    test('should convert subscribed to active', async () => {
      const { convertToLegacyStatus } = await import('../../services/subscription-ssot');
      
      expect(convertToLegacyStatus('subscribed')).toBe('active');
    });

    test('should convert blocked to expired', async () => {
      const { convertToLegacyStatus } = await import('../../services/subscription-ssot');
      
      expect(convertToLegacyStatus('blocked')).toBe('expired');
    });

    test('should convert loading to expired', async () => {
      const { convertToLegacyStatus } = await import('../../services/subscription-ssot');
      
      expect(convertToLegacyStatus('loading')).toBe('expired');
    });
  });
});
