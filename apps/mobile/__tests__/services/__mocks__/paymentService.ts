/**
 * Mock for paymentService.ts
 */

export const initializePayment = jest.fn().mockResolvedValue(undefined);

export const setupPurchaseListeners = jest.fn().mockReturnValue({
  remove: jest.fn(),
});

export const fetchProducts = jest.fn().mockResolvedValue([]);

export const purchaseSubscription = jest.fn().mockResolvedValue(undefined);

export const completePurchase = jest.fn().mockResolvedValue(undefined);

export const restorePurchases = jest.fn().mockResolvedValue(false);

export const getSubscriptionDetails = jest.fn().mockResolvedValue({
  isSubscribed: false,
  expiryDate: null,
  productId: null,
});

export const getEntitlementVerification = jest.fn().mockResolvedValue({
  isPending: false,
  entitlementActive: false,
  expiresDate: undefined,
  productId: undefined,
});

export const disconnectPayment = jest.fn().mockResolvedValue(undefined);
