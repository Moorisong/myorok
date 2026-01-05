# Payment Implementation Module

> 핵심 결제 로직 및 샌드박스 테스트 구현

## 목적

Google Play In-App Purchase를 통한 월 구독 결제 시스템의 핵심 로직을 구현하고 샌드박스 환경에서 테스트합니다.

## 독립성

✅ **완전 독립 모듈** - 다른 모듈과 병렬로 작업 가능  
⚠️ UI 모듈들이 이 모듈의 서비스 함수를 사용함

---

## 작업 단계

### Step 1: Google Play Console 샌드박스 환경 구성

#### 1.1 내부 테스트 트랙 생성
- Google Play Console > 테스트 > 내부 테스트
- 새 릴리스 생성 및 APK/AAB 업로드

#### 1.2 라이선스 테스터 계정 추가
- Google Play Console > 설정 > 라이선스 테스트
- 테스트 계정 이메일 추가
- 테스트 응답 설정: `LICENSED` (기본)

#### 1.3 테스트용 상품 등록
- 상품 ID: `monthly_premium`
- 가격: 월 3,500원
- 샌드박스 모드 확인

---

### Step 2: 라이브러리 설정

1. `expo-in-app-purchases` 설치
   ```bash
   npx expo install expo-in-app-purchases
   ```

2. `app.json`에 필요한 권한 추가
   ```json
   {
     "expo": {
       "android": {
         "permissions": [
           "com.android.vending.BILLING"
         ]
       }
     }
   }
   ```

3. Google Play Console에서 상품 ID 확인
   - 상품 ID: `monthly_premium`
   - 상품 유형: 구독 (Subscription)

---

### Step 3: 결제 서비스 구현

**파일 위치**: `apps/mobile/services/paymentService.ts`

```typescript
// apps/mobile/services/paymentService.ts

import * as InAppPurchases from 'expo-in-app-purchases';

const PRODUCT_ID = 'monthly_premium';

/**
 * Google Play 결제 시스템 초기화
 */
export async function initializePayment(): Promise<void> {
  try {
    await InAppPurchases.connectAsync();
    console.log('Payment system initialized');
  } catch (error) {
    console.error('Failed to initialize payment system:', error);
    throw error;
  }
}

/**
 * 상품 정보 조회
 */
export async function getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
  try {
    const { results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
    return results;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * 구독 결제 요청
 */
export async function purchaseSubscription(): Promise<boolean> {
  try {
    await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
    console.log('Purchase initiated');
    return true;
  } catch (error) {
    console.error('Purchase failed:', error);
    return false;
  }
}

/**
 * 구독 복원 (재설치 시)
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const { results } = await InAppPurchases.getPurchaseHistoryAsync();
    const hasActiveSubscription = results.some(
      (purchase) => purchase.productId === PRODUCT_ID && purchase.acknowledged
    );
    return hasActiveSubscription;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return false;
  }
}

/**
 * 결제 시스템 연결 해제
 */
export async function disconnectPayment(): Promise<void> {
  try {
    await InAppPurchases.disconnectAsync();
    console.log('Payment system disconnected');
  } catch (error) {
    console.error('Failed to disconnect payment system:', error);
  }
}
```

---

### Step 4: License Response 처리 구현

**파일 위치**: `apps/mobile/services/licenseChecker.ts`

```typescript
// apps/mobile/services/licenseChecker.ts

import { activateSubscription, deactivateSubscription } from './subscription';
import { showToast } from '../utils/toast';

/**
 * Google Play License Response 타입
 */
export type LicenseResponse = 
  | 'LICENSED'          // 유효한 라이선스
  | 'NOT_LICENSED'      // 라이선스 없음
  | 'ERROR_SERVER_FAILURE'  // 서버 오류
  | 'ERROR_NOT_MARKET_MANAGED';  // 마켓 관리 불가

/**
 * License Response 코드에 따른 처리
 */
export async function handleLicenseResponse(response: LicenseResponse): Promise<void> {
  switch (response) {
    case 'LICENSED':
      // 구독 활성화
      console.log('License valid - activating subscription');
      await activateSubscription(); // state = 'active', isPro=true
      showToast('구독이 활성화되었습니다', 'success');
      break;
      
    case 'NOT_LICENSED':
      // 무료 사용자
      console.log('No license - free user');
      await deactivateSubscription(); // state = 'free', isPro=false
      showToast('구독이 없습니다', 'info');
      break;
      
    case 'ERROR_SERVER_FAILURE':
      // 서버 오류 - 재시도 로직
      console.error('License server failure');
      showToast('일시적인 오류가 발생했습니다. 다시 시도해주세요', 'error');
      // 기존 state 유지 - DB 업데이트 하지 않음
      break;
      
    case 'ERROR_NOT_MARKET_MANAGED':
      // 마켓 관리 불가
      console.error('Not market managed');
      showToast('Google Play 설정을 확인해주세요', 'error');
      // 기존 state 유지
      break;
      
    default:
      console.error('Unknown license response:', response);
      break;
  }
}

/**
 * 구매 성공 후 License Response 확인
 */
export async function checkLicenseAfterPurchase(): Promise<LicenseResponse> {
  try {
    // 실제로는 Google Play Licensing API를 통해 확인
    // 샌드박스에서는 자동으로 LICENSED 반환
    return 'LICENSED';
  } catch (error) {
    console.error('Failed to check license:', error);
    return 'ERROR_SERVER_FAILURE';
  }
}
```

---

### Step 5: 구독 상태 관리 확장

**파일 위치**: `apps/mobile/services/subscription.ts` (기존 파일 확장)

기존 `subscription.ts` 파일에 다음 함수들을 추가합니다:

```typescript
// apps/mobile/services/subscription.ts

import { handleLicenseResponse, checkLicenseAfterPurchase } from './licenseChecker';
import { restorePurchases } from './paymentService';

/**
 * 결제 성공 후 처리
 */
export async function handlePurchaseSuccess(): Promise<void> {
  console.log('Handling purchase success');
  
  // License 확인
  const licenseResponse = await checkLicenseAfterPurchase();
  
  // License Response 처리
  await handleLicenseResponse(licenseResponse);
}

/**
 * 앱 시작 시 구독 복원 및 확인
 */
export async function checkAndRestoreSubscription(): Promise<void> {
  console.log('Checking and restoring subscription');
  
  // Google Play에서 구독 내역 조회
  const hasActive = await restorePurchases();
  
  if (hasActive) {
    // 활성 구독 있음
    await handleLicenseResponse('LICENSED');
  } else {
    // 활성 구독 없음
    await handleLicenseResponse('NOT_LICENSED');
  }
}
```

---

### Step 8: 샌드박스 테스트 시나리오 실행

#### 8.1 무료 체험 테스트
```
1. "무료 체험 시작" 버튼 클릭
2. 로컬 DB 확인: isPro=false
3. 기능 사용 가능 확인
```

#### 8.2 구독 결제 성공 테스트
```
1. "구독 시작 / 결제하기" 버튼 클릭
2. 샌드박스 결제창 표시 확인
3. 테스트 계정으로 결제 완료
4. License Response: LICENSED 확인
5. 로컬 DB 확인: isPro=true
6. UI 업데이트 확인 (구독 중 표시)
```

#### 8.3 구독 결제 취소 테스트
```
1. "구독 시작 / 결제하기" 버튼 클릭
2. 결제창에서 취소 버튼 클릭
3. License Response: NOT_LICENSED 확인
4. 로컬 DB 확인: isPro=false 유지
5. 취소 메시지 표시 확인
```

#### 8.4 에러 응답 테스트
```
1. 네트워크 비활성화
2. "구독 시작 / 결제하기" 버튼 클릭
3. ERROR_SERVER_FAILURE 처리 확인
4. 적절한 에러 메시지 표시 확인
5. 기존 isPro 상태 유지 확인
```

#### 8.5 구독 복원 테스트
```
1. 앱 제거
2. 앱 재설치
3. 앱 실행 시 자동 복원 확인
4. isPro 상태 정상 복원 확인
5. UI 상태 정상 표시 확인
```

---

## 주의사항

- **Android 전용**: iOS 관련 코드 작성 금지
- **로컬 DB 전용**: 서버 없이 SQLite만 사용
- **샌드박스 필수**: 실제 결제 발생하지 않도록 테스트 환경 확인
- **테스트 계정**: 라이선스 테스터 계정으로만 테스트
- **에러 처리**: 모든 License Response 코드 처리 필수
- **보안**: keystore 및 API key 절대 공유 금지

---

## 테스트 체크리스트

- [ ] Google Play Console 샌드박스 설정 완료
- [ ] 라이선스 테스터 계정 추가
- [ ] `paymentService.ts` 구현 완료
- [ ] `licenseChecker.ts` 구현 완료
- [ ] `subscription.ts` 확장 완료
- [ ] Google Play 결제 연결 초기화 성공
- [ ] 상품 정보 조회 성공
- [ ] 결제 요청 및 성공 처리 (`LICENSED`)
- [ ] 결제 취소 처리 (`NOT_LICENSED`)
- [ ] 서버 오류 처리 (`ERROR_SERVER_FAILURE`)
- [ ] 마켓 관리 불가 처리 (`ERROR_NOT_MARKET_MANAGED`)
- [ ] 앱 재설치 후 구독 복원 성공
- [ ] 로컬 DB 상태 동기화 확인
- [ ] 모든 테스트 시나리오 통과

---

## 출력 파일

1. `apps/mobile/services/paymentService.ts` (신규)
2. `apps/mobile/services/licenseChecker.ts` (신규)
3. `apps/mobile/services/subscription.ts` (확장)

---

## 다음 단계

이 모듈 완료 후 다음 모듈들을 병렬로 진행 가능:
- [ui_buttons.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/ui_buttons.md)
- [app_initialization.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/app_initialization.md)
