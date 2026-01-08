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
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VerificationResult } from './subscription';

export const SUBSCRIPTION_SKU = 'myorok_monthly_premium';
const LEGACY_PRODUCT_IDS = ['myorok_monthly_legacy_v1']; // 레거시 상품 ID 허용 목록

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
  // Purchase 업데이트 리스너
  const purchaseUpdateSubscription = purchaseUpdatedListener((purchase: Purchase) => {
    onPurchaseUpdate(purchase);
  });

  // Purchase 에러 리스너
  const purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
    onPurchaseError(error);
  });

  // Cleanup 함수 반환
  return () => {
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
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
    // 구독은 consumable이 아님
    await finishTransaction({
      purchase,
      isConsumable: false,
    });
  } catch (error) {
    console.error('Failed to complete purchase:', error);
    throw error;
  }
}

/**
 * 구독 복원 (재설치 시)
 * SSOT: restore 시도를 기록 (CASE D)
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    // restore 시도 기록 (CASE D)
    await AsyncStorage.setItem('restore_attempted', 'true');

    const purchases = await getAvailablePurchases();
    const hasActiveSubscription = purchases.some(
      (purchase: Purchase) =>
        purchase.productId === SUBSCRIPTION_SKU ||
        LEGACY_PRODUCT_IDS.includes(purchase.productId)
    );

    if (hasActiveSubscription) {
      console.log('[Payment] Restore successful');
    } else {
      console.log('[Payment] No active subscription found');
    }

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
  productId?: string;
  purchaseToken?: string;
}

/**
 * 구독 상세 정보 조회 (해지 예정 여부 포함)
 */
export async function getSubscriptionDetails(): Promise<SubscriptionDetails> {
  try {
    const purchases = await getAvailablePurchases();
    const subscription = purchases.find(
      (purchase: Purchase) =>
        purchase.productId === SUBSCRIPTION_SKU ||
        LEGACY_PRODUCT_IDS.includes(purchase.productId)
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


    return {
      isActive: true,
      autoRenewing,
      transactionDate,
      expiryDate,
      productId: subscription.productId,
      purchaseToken: subscription.purchaseToken || undefined,
    };
  } catch (error) {
    console.error('Failed to get subscription details:', error);
    return { isActive: false, autoRenewing: false };
  }
}

/**
 * SSOT용 Entitlement 검증 (VerificationResult 형식)
 * Google Play 스토어에서 구독 상태를 조회하여 SSOT 판별에 사용
 */
export async function getEntitlementVerification(): Promise<Partial<VerificationResult>> {
  try {
    const purchases = await getAvailablePurchases();
    const subscription = purchases.find(
      (purchase: Purchase) =>
        purchase.productId === SUBSCRIPTION_SKU ||
        LEGACY_PRODUCT_IDS.includes(purchase.productId)
    );

    if (!subscription) {
      // 구독 없음
      return {
        success: true,
        entitlementActive: false,
        productId: undefined,
        expiresDate: undefined,
        isPending: false,
        source: 'cache', // 로컬 스토어 캐시에서 가져옴
      };
    }

    // 만료일 계산
    let expiresDate: Date | undefined;
    if (subscription.transactionDate) {
      expiresDate = new Date(subscription.transactionDate);
      expiresDate.setDate(expiresDate.getDate() + 30);
    }

    // pending 상태 확인
    const isPending = (subscription as any).purchaseStateAndroid === 4; // PENDING state

    return {
      success: true,
      entitlementActive: true,
      productId: subscription.productId,
      expiresDate,
      isPending,
      source: 'cache', // 로컬 스토어 캐시에서 가져옴
    };
  } catch (error) {
    console.error('[Payment] Entitlement verification failed:', error);
    return {
      success: false,
      entitlementActive: false,
      source: 'cache',
    };
  }
}

/**
 * 결제 시스템 연결 해제
 */
export async function disconnectPayment(): Promise<void> {
  try {
    await endConnection();
  } catch (error) {
    console.error('Failed to disconnect payment system:', error);
  }
}

