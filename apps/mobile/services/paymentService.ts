// apps/mobile/services/paymentService.ts

import {
  initConnection,
  endConnection,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  Product,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import { Platform } from 'react-native';

export const SUBSCRIPTION_SKU = 'myorok_monthly_premium';
// const PRODUCT_ID = 'myorok_monthly_premium'; // Replaced by exported constant

// Export requestPurchase so it can be used directly if needed, or use purchaseSubscription wrapper
export { requestPurchase };

// 전역 콜백 저장
let globalOnPurchaseSuccess: ((purchase: Purchase) => void) | null = null;
let globalOnPurchaseError: ((error: PurchaseError) => void) | null = null;

/**
 * Google Play 결제 시스템 초기화
 */
export async function initializePayment(): Promise<void> {
  try {
    await initConnection();
    console.log('Payment system initialized');
  } catch (error) {
    console.error('Failed to initialize payment system:', error);
    throw error;
  }
}

/**
 * Purchase listener 설정 (앱 초기화 시 호출)
 */
export function setupPurchaseListeners(
  onPurchaseUpdate: (purchase: Purchase) => void,
  onPurchaseError: (error: PurchaseError) => void
): () => void {
  console.log('Setting up purchase listeners...');

  // Purchase 업데이트 리스너
  const purchaseUpdateSubscription = purchaseUpdatedListener((purchase: Purchase) => {
    console.log('Purchase update received:', purchase);
    onPurchaseUpdate(purchase);
  });

  // Purchase 에러 리스너
  const purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
    console.log('Purchase error received:', error);
    onPurchaseError(error);
  });

  console.log('Purchase listeners setup completed');

  // Cleanup 함수 반환
  return () => {
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
    console.log('Purchase listeners removed');
  };
}

/**
 * 상품 정보 조회
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    // For react-native-iap v14, products are fetched automatically
    // This function is kept for compatibility
    console.warn('Product fetching in v14 is handled internally');
    return [];
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * 구독 결제 요청 (이벤트 기반)
 */
export async function purchaseSubscription(): Promise<void> {
  try {
    console.log('Purchase request initiated');
    // react-native-iap v14 requires request object with platform-specific fields
    await requestPurchase({
      request: {
        google: {
          skus: [SUBSCRIPTION_SKU],
        },
      },
      type: 'subs', // 'subs' for subscriptions, 'in-app' for one-time purchases
    });
    // 결제 완료는 purchaseUpdatedListener에서 처리됨
    // Promise는 결제창을 띄우는 것만 확인
  } catch (error) {
    console.error('Failed to initiate purchase:', error);
    throw error;
  }
}

/**
 * Purchase 완료 처리
 */
export async function completePurchase(purchase: Purchase): Promise<void> {
  try {
    console.log('Completing purchase:', purchase.productId);

    // 구독은 consumable이 아님
    await finishTransaction({
      purchase,
      isConsumable: false,
    });

    console.log('Purchase completed and finished');
  } catch (error) {
    console.error('Failed to complete purchase:', error);
    throw error;
  }
}

/**
 * 구독 복원 (재설치 시)
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const purchases = await getAvailablePurchases();
    const hasActiveSubscription = purchases.some(
      (purchase: Purchase) => purchase.productId === SUBSCRIPTION_SKU
    );
    return hasActiveSubscription;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return false;
  }
}

export interface SubscriptionDetails {
  isActive: boolean;
  autoRenewing: boolean;  // true면 구독중, false면 해지 예정
  transactionDate?: string;  // 마지막 결제일
  expiryDate?: string;  // 만료 예정일 (다음 결제일)
}

/**
 * 구독 상세 정보 조회 (해지 예정 여부 포함)
 */
export async function getSubscriptionDetails(): Promise<SubscriptionDetails> {
  try {
    const purchases = await getAvailablePurchases();
    const subscription = purchases.find(
      (purchase: Purchase) => purchase.productId === SUBSCRIPTION_SKU
    );

    if (!subscription) {
      return { isActive: false, autoRenewing: false };
    }

    // autoRenewingAndroid: 자동 갱신 여부 (해지하면 false)
    const autoRenewing = (subscription as any).autoRenewingAndroid ?? true;

    // transactionDate: 마지막 결제 시간 (밀리초)
    const transactionDate = subscription.transactionDate
      ? new Date(subscription.transactionDate).toISOString()
      : undefined;

    // 만료일 계산: 마지막 결제일 + 30일 (월간 구독 기준)
    let expiryDate: string | undefined;
    if (subscription.transactionDate) {
      const expiry = new Date(subscription.transactionDate);
      expiry.setDate(expiry.getDate() + 30);
      expiryDate = expiry.toISOString();
    }

    console.log('[PaymentService] Subscription details:', {
      autoRenewing,
      transactionDate,
      expiryDate
    });

    return {
      isActive: true,
      autoRenewing,
      transactionDate,
      expiryDate,
    };
  } catch (error) {
    console.error('Failed to get subscription details:', error);
    return { isActive: false, autoRenewing: false };
  }
}


/**
 * 결제 시스템 연결 해제
 */
export async function disconnectPayment(): Promise<void> {
  try {
    await endConnection();
    console.log('Payment system disconnected');
  } catch (error) {
    console.error('Failed to disconnect payment system:', error);
  }
}
