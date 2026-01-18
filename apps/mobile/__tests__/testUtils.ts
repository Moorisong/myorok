/**
 * Shared test utilities for subscription tests
 * Resolves AsyncStorage/fetch timing issues with proper setup ordering
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionManager from '../services/SubscriptionManager';

export const mockServerTime = new Date('2025-01-18T12:00:00Z');
export const mockFutureExpiry = new Date('2025-02-18T12:00:00Z');
export const mockPastExpiry = new Date('2025-01-10T12:00:00Z');

/**
 * Create a mock VerificationResult with default values
 */
export const createMockVerificationResult = (overrides: any = {}) => ({
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
 * Setup global fetch mock based on URL patterns
 * Call this BEFORE importing services in tests
 */
export const setupMockFetch = (verificationResult: any, options: { serverError?: boolean } = {}) => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (options.serverError && url.includes('/api/subscription/verify')) {
      return Promise.resolve({ ok: false, status: 500 });
    }

    if (url.includes('/api/subscription/verify')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: verificationResult }),
      });
    }

    if (url.includes('/api/subscription/server-time')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { serverTime: mockServerTime.toISOString() } }),
      });
    }

    if (url.includes('/api/subscription/trial-status')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            hasUsedTrial: verificationResult.hasUsedTrial || false,
            trialStartedAt: null,
            serverTime: mockServerTime.toISOString(),
            deviceBasedTrialAvailable: !verificationResult.deviceBasedTrialBlock,
            deviceTrialInfo: verificationResult.deviceTrialInfo || null,
          }
        }),
      });
    }

    if (url.includes('/api/subscription/trial-start')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }

    if (url.includes('/api/subscription/sync')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

/**
 * Standard setup for subscription tests
 * Clears AsyncStorage, sets up required initial state, resets SubscriptionManager singleton, clears all mocks
 *
 * IMPORTANT: Call this BEFORE importing services in beforeEach
 */
export const setupSubscriptionTest = async () => {
  await AsyncStorage.clear();
  SubscriptionManager.resetInstance();
  await AsyncStorage.setItem('current_user_id', 'test-user-123');
  await AsyncStorage.setItem('jwt_token', 'test-jwt-token');
};

/**
 * Setup for network error simulation tests
 */
export const setupNetworkErrorTest = async () => {
  await setupSubscriptionTest();

  (global.fetch as jest.Mock).mockImplementation(() => {
    return Promise.reject(new Error('Network error'));
  });
};

/**
 * Setup for server 500 error simulation tests
 */
export const setupServerErrorTest = async () => {
  await setupSubscriptionTest();

  await AsyncStorage.setItem('dev_force_server_error', 'true');

  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/subscription/verify')) {
      return Promise.resolve({ ok: false, status: 500 });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

/**
 * Clean up test environment
 * Call this in afterEach
 *
 * CRITICAL: DO NOT call jest.resetModules() here as it causes timing issues
 * with AsyncStorage and fetch setup
 */
export const cleanupSubscriptionTest = async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
};
