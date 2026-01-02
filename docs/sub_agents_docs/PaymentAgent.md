# Payment Agent Reference

## Payment Spec (PAYMENT_SPEC.md)

# Google Play 결제 모듈 구현 명세

## 1. 프로젝트 개요

| 항목 | 값 |
|------|------|
| 플랫폼 | Android |
| 프레임워크 | Expo (Managed) + React Native |
| 결제 방식 | Google Play In-App Purchase (구독) |
| 서버 검증 | 없음 (MVP 단계) |
| 데이터 저장 | 로컬 SQLite |
| 목적 | 월 구독 결제 및 구독 상태 관리 |

---

## 2. 결제 상품 정보

| 항목 | 값 |
|------|------|
| 상품 유형 | 정기 결제 (Subscription) |
| 상품 ID | `monthly_premium` |
| 가격 | 월 3,500원 |
| 무료 체험 | 앱 내부 로직으로 7일 처리 (Google 설정 ❌) |

---

## 2.1 구독 정책

### 구독 유형
- **월 단위 자동 갱신 구독**
- Google Play In-App Subscription 사용
- 구독 상태:
  - **Trial**: 7일 체험 (앱 내부 로직)
  - **Active**: 결제 완료, 월 단위 자동 갱신
  - **Expired**: 만료 또는 결제 실패 시

### 앱에서 구독 처리
| 역할 | 담당 |
|------|------|
| 자동 결제/갱신 | Google Play 서버 |
| 구독 상태 조회 | 앱 |
| 구독 해지 | Google Play (앱에서 링크 안내) |

### 구독하기 버튼
- **위치**: 설정 > 구독 관리 페이지
- **현재 상태**: 결제 모듈 미연동
- 버튼 클릭 시 안내 메시지 또는 테스트 플로우만 제공

### 앱 내 수동 결제/갱신 로직
- **없음** (Google Play가 모든 결제/갱신 관리)

---

- `expo-in-app-purchases` (또는 현재 Expo 권장 IAP 라이브러리)
- `expo-sqlite`

---

## 4. SQLite 스키마

### 테이블: subscription

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK, 항상 1 row |
| state | TEXT | `free` \| `trial` \| `active` \| `expired` |
| trial_start_at | INTEGER | timestamp, nullable |
| subscription_start_at | INTEGER | timestamp, nullable |
| updated_at | INTEGER | timestamp |

---

## 5. 결제 플로우

### 5.1 앱 시작 시
1. Google Play 결제 연결 초기화
2. 기존 구매 내역 조회
3. 유효한 구독 존재 시: `state = 'active'`
4. 없을 경우: 상태 유지

### 5.2 무료 체험 로직
1. 최초 앱 실행 시: `trial_start_at` 기록, `state = 'trial'`
2. 7일 경과 전: 결제 버튼 노출
3. 7일 경과 후: 결제 없으면 `state = 'expired'`

### 5.3 구독 결제 시
1. Google 결제 요청 실행
2. 성공 시: `state = 'active'`, `subscription_start_at` 저장
3. 실패/취소 시: 상태 변경 없음

### 5.4 구독 복원
- 앱 재설치/기기 변경 시 Google 구매 내역 재조회
- active 구독 있으면 `state = 'active'`

---

## 6. UI 요구사항

- 결제 버튼 노출: `state = 'trial'` 또는 `expired`
- `state = 'active'`: "구독 중" 표시, 결제 버튼 비활성화
- 에러 처리: 네트워크 오류/Google 결제 불가 시 안내

---

## AI 작업 지침

### 목적
Google Play In-App Purchase를 통한 월 구독 결제 시스템 구현

### 작업 단계

#### 1. 라이브러리 설정
1. `expo-in-app-purchases` 설치 및 설정
2. `app.json`에 필요한 권한 추가
3. Google Play Console에서 상품 ID (`monthly_premium`) 등록

#### 2. 결제 서비스 구현
```typescript
// apps/mobile/services/paymentService.ts

import * as InAppPurchases from 'expo-in-app-purchases';

const PRODUCT_ID = 'monthly_premium';

export async function initializePayment(): Promise<void> {
  await InAppPurchases.connectAsync();
}

export async function getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
  const { results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
  return results;
}

export async function purchaseSubscription(): Promise<boolean> {
  try {
    await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
    return true;
  } catch (error) {
    console.error('Purchase failed:', error);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  const { results } = await InAppPurchases.getPurchaseHistoryAsync();
  const hasActiveSubscription = results.some(
    (purchase) => purchase.productId === PRODUCT_ID && purchase.acknowledged
  );
  return hasActiveSubscription;
}

export async function disconnectPayment(): Promise<void> {
  await InAppPurchases.disconnectAsync();
}
```

#### 3. 구독 상태 관리
```typescript
// apps/mobile/services/subscription.ts 확장

export async function handlePurchaseSuccess(): Promise<void> {
  await activateSubscription();
}

export async function checkAndRestoreSubscription(): Promise<void> {
  const hasActive = await restorePurchases();
  if (hasActive) {
    await activateSubscription();
  }
}
```

#### 4. UI 구현
1. `apps/mobile/app/(tabs)/settings/pro.tsx` 수정
   - `purchaseSubscription()` 함수 연결
   - 결제 상태에 따른 UI 분기
2. 에러 처리 토스트/Alert 구현

#### 5. 앱 시작 시 초기화
```typescript
// apps/mobile/app/_layout.tsx

useEffect(() => {
  const initPayment = async () => {
    await initializePayment();
    await checkAndRestoreSubscription();
  };
  initPayment();
  
  return () => {
    disconnectPayment();
  };
}, []);
```

### 주의사항

- **Android 전용**: iOS 관련 코드 작성 금지
- **결제 수단**: Google Play Billing만 사용, 카드사/PG사 직접 연동 금지
- **서버 검증**: MVP 단계에서는 서버 영수증 검증 미구현
- **테스트**: Google Play 내부 테스트 트랙 + 라이선스 테스트 계정 사용
- **에러 처리**: 네트워크 오류, 결제 불가 상태 모두 처리

### 테스트 체크리스트

- [ ] Google Play 결제 연결 초기화
- [ ] 상품 정보 조회
- [ ] 결제 요청 및 성공 처리
- [ ] 결제 취소 처리
- [ ] 앱 재설치 후 구독 복원
- [ ] 에러 케이스 처리

---

## 구독 해지 UI 구현 지침

### 위치
- `apps/mobile/app/(tabs)/settings/pro.tsx` 페이지 하단

### UI 구현
```typescript
// 구독 중일 때 하단에 해지 링크 추가
{isSubscribed && (
    <View style={styles.cancelSection}>
        <Text style={styles.cancelInfo}>
            ℹ️ 구독은 언제든지 취소할 수 있습니다.
        </Text>
        <Pressable
            onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
            style={styles.cancelLink}
        >
            <Text style={styles.cancelLinkText}>구독 해지하기 →</Text>
        </Pressable>
    </View>
)}
```

### 스타일
```typescript
cancelSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
},
cancelInfo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
},
cancelLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44, // 터치 영역 확보
},
cancelLinkText: {
    fontSize: 14,
    color: '#888',
},
```

### 동작
- Google Play 구독 관리 페이지로 이동
- URL: `https://play.google.com/store/account/subscriptions`

---

## 환불 UI 구현 지침

### 기본 원칙 ⚠️

> [!CAUTION]
> - 앱 내 환불 처리 ❌
> - 앱 내 환불 요청 API ❌
> - 환불은 **Google Play에서만 처리**
> - 앱은 **안내 + 이동(UI)만 제공**

### 위치
- `apps/mobile/app/(tabs)/settings/pro.tsx` 페이지 하단
- 구독 해지 링크 아래 또는 동일 영역

### UI 구현
```typescript
// 환불 안내 섹션 (구독 해지 링크 아래에 추가)
{isSubscribed && (
    <View style={styles.refundSection}>
        <Text style={styles.refundInfo}>
            환불은 Google Play 정책에 따라 처리됩니다.
        </Text>
        <Pressable
            onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
            style={styles.refundLink}
        >
            <Text style={styles.refundLinkText}>Google Play 구독 관리로 이동 →</Text>
        </Pressable>
    </View>
)}
```

### 스타일
```typescript
refundSection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
},
refundInfo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
},
refundLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44, // 터치 영역 확보
},
refundLinkText: {
    fontSize: 14,
    color: '#888',
    // textDecorationLine: 'underline', // 선택사항
},
```

### 통합 옵션 (해지와 환불 통합 시)
```typescript
// 해지와 환불을 하나의 링크로 통합할 경우
<Pressable
    onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
    style={styles.cancelLink}
>
    <Text style={styles.cancelLinkText}>구독 해지·환불 관리 → Google Play 이동</Text>
</Pressable>
```

### 하지 않는 것 (명확화)
- ❌ 앱 내 환불 버튼
- ❌ 환불 요청 폼
- ❌ 고객센터 환불 접수
- ❌ 외부 웹 결제/환불 링크 (Google Play 외)
- ❌ 인앱 WebView

### 심사 대응 문구
```
This app does not process refunds directly.
Refunds are handled by Google Play according to their policies.
```
