/**
 * Custom error types for subscription system
 * Provides type-safe error handling across the subscription flow
 */

export class SubscriptionError extends Error {
  constructor(
    public code: string,
    message: string,
    public userMessage?: string,
    public isRetryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    this.userMessage = userMessage;
    this.isRetryable = isRetryable;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      isRetryable: this.isRetryable,
      originalError: this.originalError,
    };
  }
}

/**
 * Error codes for subscription system
 */
export enum SubscriptionErrorCode {
  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  
  // SSOT errors
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  VERIFICATION_TIMEOUT = 'VERIFICATION_TIMEOUT',
  INVALID_USER_ID = 'INVALID_USER_ID',
  NO_JWT_TOKEN = 'NO_JWT_TOKEN',
  
  // Purchase errors
  PURCHASE_FAILED = 'PURCHASE_FAILED',
  PURCHASE_PENDING = 'PURCHASE_PENDING',
  INVALID_PRODUCT_ID = 'INVALID_PRODUCT_ID',
  
  // Restore errors
  RESTORE_FAILED = 'RESTORE_FAILED',
  RESTORE_NO_SUBSCRIPTION = 'RESTORE_NO_SUBSCRIPTION',
  RESTORE_TIMEOUT = 'RESTORE_TIMEOUT',
  
  // State errors
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  CACHE_CORRUPTION = 'CACHE_CORRUPTION',
  
  // IAP errors
  IAP_NOT_INITIALIZED = 'IAP_NOT_INITIALIZED',
  IAP_CONNECTION_ERROR = 'IAP_CONNECTION_ERROR',
  IAP_TRANSACTION_FAILED = 'IAP_TRANSACTION_FAILED',
}

/**
 * Create typed subscription error
 */
export function createSubscriptionError(
  code: SubscriptionErrorCode,
  message: string,
  options?: {
    userMessage?: string;
    isRetryable?: boolean;
    originalError?: Error;
  }
): SubscriptionError {
  return new SubscriptionError(
    code,
    message,
    options?.userMessage,
    options?.isRetryable ?? false,
    options?.originalError
  );
}

/**
 * Check if error is retryable based on code
 */
export function isRetryableError(error: unknown): error is SubscriptionError {
  if (error instanceof SubscriptionError) {
    return error.isRetryable;
  }
  
  const retryableCodes = [
    SubscriptionErrorCode.NETWORK_TIMEOUT,
    SubscriptionErrorCode.NETWORK_ERROR,
    SubscriptionErrorCode.SERVER_UNAVAILABLE,
    SubscriptionErrorCode.VERIFICATION_TIMEOUT,
  ];
  
  return retryableCodes.some(code => 
    error instanceof SubscriptionError && error.code === code
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof SubscriptionError) {
    return error.userMessage || error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Parse network error and create appropriate subscription error
 */
export function parseNetworkError(error: Error): SubscriptionError {
  if (error.name === 'AbortError') {
    return createSubscriptionError(
      SubscriptionErrorCode.NETWORK_ERROR,
      'Request was cancelled',
      { isRetryable: false }
    );
  }
  
  if (error.message?.includes('timeout')) {
    return createSubscriptionError(
      SubscriptionErrorCode.NETWORK_TIMEOUT,
      'Request timed out. Please check your connection.',
      { isRetryable: true }
    );
  }
  
  return createSubscriptionError(
    SubscriptionErrorCode.NETWORK_ERROR,
    error.message || 'Network error occurred',
    { isRetryable: true }
  );
}

/**
 * Parse SSOT verification error
 */
export function parseSSOTError(response: any, originalError?: Error): SubscriptionError {
  if (!response || !response.ok) {
    return createSubscriptionError(
      SubscriptionErrorCode.VERIFICATION_FAILED,
      'Failed to verify subscription status',
      { isRetryable: true, originalError }
    );
  }
  
  if (response.status === 500) {
    return createSubscriptionError(
      SubscriptionErrorCode.SERVER_UNAVAILABLE,
      'Server is temporarily unavailable. Please try again later.',
      { isRetryable: true }
    );
  }
  
  return createSubscriptionError(
    SubscriptionErrorCode.VERIFICATION_FAILED,
    `Verification failed: ${response.statusText || 'Unknown error'}`,
    { isRetryable: false, originalError }
  );
}

/**
 * Parse IAP error
 */
export function parseIAPError(error: Error): SubscriptionError {
  if (error.message?.includes('initConnection')) {
    return createSubscriptionError(
      SubscriptionErrorCode.IAP_NOT_INITIALIZED,
      'Purchase service is not available. Please restart the app.',
      { isRetryable: false }
    );
  }
  
  if (error.message?.includes('getProducts')) {
    return createSubscriptionError(
      SubscriptionErrorCode.IAP_CONNECTION_ERROR,
      'Failed to load subscription options. Please check your connection.',
      { isRetryable: true }
    );
  }
  
  return createSubscriptionError(
    SubscriptionErrorCode.IAP_TRANSACTION_FAILED,
      error.message || 'Purchase failed',
    { isRetryable: false }
  );
}

/**
 * Parse restore error
 */
export function parseRestoreError(error: Error, hasSubscriptionHistory: boolean): SubscriptionError {
  if (!hasSubscriptionHistory) {
    return createSubscriptionError(
      SubscriptionErrorCode.RESTORE_NO_SUBSCRIPTION,
      'No subscription found to restore. Please purchase a subscription to continue.',
      { isRetryable: false }
    );
  }
  
  return createSubscriptionError(
    SubscriptionErrorCode.RESTORE_FAILED,
      'Failed to restore subscription',
      { isRetryable: true, originalError: error }
  );
}
