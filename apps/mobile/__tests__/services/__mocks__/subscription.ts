/**
 * Mock for subscription.ts
 * Used by SubscriptionManager tests
 *
 * Note: These mocks can be overridden in tests using:
 *   (getSubscriptionState as jest.Mock).mockResolvedValue('expired')
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUBSCRIPTION_KEYS = {
  TRIAL_START_DATE: 'trial_start_date',
  SUBSCRIPTION_STATUS: 'subscription_status',
  SUBSCRIPTION_START_DATE: 'subscription_start_date',
  SUBSCRIPTION_EXPIRY_DATE: 'subscription_expiry_date',
  HAS_USED_TRIAL: 'has_used_trial',
  RESTORE_ATTEMPTED: 'restore_attempted',
  RESTORE_SUCCEEDED: 'restore_succeeded',
  DAYS_REMAINING: 'days_remaining',
};

export const getSubscriptionState = jest.fn().mockResolvedValue('trial');

export const checkAndRestoreSubscription = jest.fn().mockResolvedValue(false);

// Smart mock that checks for dev_force_server_error flag
export const verifySubscriptionWithServer = jest.fn().mockImplementation(async () => {
  const forceError = await AsyncStorage.getItem('dev_force_server_error');
  if (forceError === 'true') {
    throw new Error('Simulated server error');
  }
  return {
    status: 'trial',
    state: { status: 'trial', daysRemaining: 7 },
  };
});

export const initializeSubscription = jest.fn().mockResolvedValue(undefined);

export const getSubscriptionStatus = jest.fn().mockResolvedValue({
  status: 'trial',
  daysRemaining: 7,
});

export const isAppAccessAllowed = jest.fn().mockResolvedValue(true);

export const activateSubscription = jest.fn().mockResolvedValue(undefined);

export const setSubscriptionStatus = jest.fn().mockResolvedValue(undefined);

export const shouldShowTrialWarning = jest.fn().mockResolvedValue(false);

export const getTrialCountdownText = jest.fn().mockReturnValue('7일 남음');

export const resetSubscription = jest.fn().mockResolvedValue(undefined);

export const handlePurchaseSuccess = jest.fn().mockResolvedValue(undefined);

export const startTrialSubscription = jest.fn().mockResolvedValue(undefined);

export const deactivateSubscription = jest.fn().mockResolvedValue(undefined);

export const convertLegacyStatus = jest.fn((status: string) => {
  if (status === 'active') return 'subscribed';
  if (status === 'expired') return 'blocked';
  return status;
});

export const convertToLegacyStatus = jest.fn((status: string) => {
  if (status === 'subscribed') return 'active';
  if (status === 'blocked') return 'expired';
  if (status === 'loading') return 'expired';
  return status;
});
