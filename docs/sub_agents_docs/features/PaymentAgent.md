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

---

## 3. 사용 라이브러리
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

## 12. Google Play 샌드박스 테스트 기획 개요

> 목적: 사업자 계좌 없이도 결제 모듈 테스트 및 구독 기능 플로우 검증

### 12.1 상황 요약

| 항목 | 상태 |
|------|------|
| 사업자 등록 | ✅ 완료 |
| 사업자 계좌 | ❌ 미등록 |
| 테스트 목적 | 결제 모듈 연동 및 동작 확인 |
| 테스트 환경 | Android Expo 앱 (MVP) |
| 결제 방식 | Google Play Billing 샌드박스 |

> [!CAUTION]
> 실제 결제 금액이 청구되지 않도록 **샌드박스 / 테스트 모드** 필수 사용

---

## 13. UI 버튼 및 결제 흐름

### 13.1 버튼 위치 및 이름

| 버튼 | 위치 | 동작 |
|------|------|------|
| **구독 시작 / 결제하기** | 홈 화면 상단 배너 하단, 또는 내 정보 화면 | 클릭 시 결제 모달 / 결제창 오픈 |
| **무료 체험 시작** | 구독 안내 팝업 | 클릭 시 무료 체험 시작, 로컬 DB `isPro=false` |

### 13.2 결제 플로우

1. 사용자 앱 실행
2. 홈 화면 배너 클릭 또는 내 정보 화면 이동
3. **결제 버튼 클릭**
4. 결제 모달/창 표시 (샌드박스 모드)
5. 결제 성공 → 로컬 DB `isPro=true` → 클라이언트 UI 업데이트
6. 결제 실패/취소 → 로컬 DB `isPro=false` → 실패 메시지 표시
7. 무료 체험 종료 시 → 로컬 DB `isPro` 갱신

### 13.3 License Response 처리

| Response Code | 의미 | 처리 |
|---------------|------|------|
| `LICENSED` | 유효한 라이선스 | `isPro=true`, 구독 활성화 |
| `NOT_LICENSED` | 라이선스 없음 | `isPro=false`, 무료 사용자 |
| `ERROR_SERVER_FAILURE` | 서버 오류 | 재시도 로직, 기존 상태 유지 |
| `ERROR_NOT_MARKET_MANAGED` | 마켓 관리 불가 | 오류 안내 메시지 표시 |

---

## 14. 테스트 시나리오

### 14.1 기본 테스트 시나리오

| 시나리오 | 버튼 | 예상 결과 |
|----------|------|------------|
| 무료 체험 시작 | **무료 체험 시작** | 로컬 DB `isPro=false`, 기능 사용 가능 |
| 구독 결제 성공 | **구독 시작 / 결제하기** | Response: `LICENSED`, 로컬 DB `isPro=true`, UI 구독 상태 반영 |
| 구독 결제 실패 | **구독 시작 / 결제하기** | Response: `NOT_LICENSED`, 로컬 DB `isPro=false`, 알림 표시 |
| 구독 갱신 | **구독 갱신 / 재결제** | 샌드박스 반복 결제 → 로컬 DB 상태 갱신 |
| 구독 만료 | - | 테스트 샌드박스 만료 시 알림 표시 |

### 14.2 에러 응답 테스트 시나리오

| 시나리오 | Response Code | 예상 처리 |
|----------|---------------|-----------|
| 서버 오류 발생 | `ERROR_SERVER_FAILURE` | 재시도 안내 메시지 |
| 마켓 관리 불가 | `ERROR_NOT_MARKET_MANAGED` | 오류 안내 메시지 |

---

## 15. 로컬 DB 연동 체크리스트

### 15.1 로컬 SQLite 처리
- `subscription` 테이블의 `state` 필드 업데이트
- License Response 매핑:
  - `LICENSED` → `state = 'active'`, `isPro=true`
  - `NOT_LICENSED` → `state = 'expired'` or `state = 'free'`, `isPro=false`
  - 에러 응답 → 기존 상태 유지 + 에러 메시지 로깅

### 15.2 클라이언트 UI
- 결제 성공/실패 메시지 표시
- UI 구독 상태 표시 (아이콘, 텍스트)
- 버튼 상태 관리

---

## 16. 테스트 주의사항

> [!CAUTION]
> - 테스트 계정 외 결제 금지
> - **Google Play 샌드박스 환경 필수**
> - 테스트 완료 후 샌드박스 계정 로그아웃
> - keystore/API key 절대 공유 금지

---

## 17. 테스트 최종 목표

- 계좌 없이도 결제 모듈 연동과 동작 확인
- 버튼 클릭 시 결제창 정상 표시
- License Response 코드별 처리 확인
- 로컬 DB 상태 동기화 정상 확인
- 정식 결제 연동 전 플로우 안전 검증

---

## 18. 구독 만료 자동 감지 전략 (운영 환경)

### 18.1 목적
운영 환경에서 구독 만료 상태를 **실시간으로 감지**하고, 사용자가 앱을 계속 사용하는 동안 **만료 시 차단 페이지**를 표시하기 위함.  
단, 서버 및 클라이언트 부하를 최소화하는 것을 목표로 함.

---

### 18.2 구독 만료 체크 이벤트

#### 18.2.1 앱 시작 시 체크
- 사용자가 앱을 시작할 때 **1회 서버 호출**
- 최신 구독 상태를 서버에서 가져옴
- 만료 시 즉시 차단 페이지 표시

#### 18.2.2 포그라운드 진입 시 체크
- 앱이 백그라운드 → 포그라운드로 전환될 때 **1회 서버 호출**
- 구독 만료 상태를 즉시 확인
- UX: 앱 사용 도중 만료 감지 가능

#### 18.2.3 주기적 폴링
- 운영 환경 기준 **10분 간격**
- 서버 요청 최소화, 부하 경감
- 만료 시 차단 페이지 표시
- **권장 간격:** 10분 (구독 만료 대응 시간 충분, 서버 부담 낮음)

> ❌ 1분 폴링은 운영 환경에서 사용자 수가 많아지면 서버 부하 증가 가능 → 권장하지 않음

---

### 18.3 서버 및 클라이언트 로직

#### 18.3.1 서버 역할
- 구독 상태 확인 및 반환 (Play Store Receipt 검증)
- 마지막 확인 시각 캐싱 가능
- 클라이언트 요청 시 최신 상태 제공

#### 18.3.2 클라이언트 역할
- 앱 시작, 포그라운드 진입, 10분 주기 폴링 시 서버 호출
- 구독 만료 시 차단 페이지 표시
- 만료 전에는 앱 기능 정상 사용
- 필요 시 로컬 캐시 활용하여 불필요한 요청 방지

---

### 18.4 UX 고려 사항
- 구독 만료 확인 즉시 차단 페이지 노출
- 앱 사용 중 갑작스러운 폴링 실패 시: 
  - 로컬 상태 기준으로 1회 더 확인 후 차단
- 폴링 간격이 길어도 UX 영향 최소화:
  - 10분 폴링 → 대부분의 사용자 경험에서는 충분히 빠름

---

### 18.5 요약 (운영 환경 기준)
| 이벤트 | 서버 호출 | 목적 |
|--------|-----------|------|
| 앱 시작 | 1회 | 최신 구독 상태 확인 |
| 포그라운드 진입 | 1회 | 사용 도중 만료 감지 |
| 주기적 폴링 | 10분 단위 | 자동 만료 감지 및 차단 페이지 표시 |

> ✅ 서버 부하 최소화  
> ✅ 사용자 경험 유지  
> ✅ 구독 만료 즉시 차단 가능

---

## AI 작업 지침

### 목적
Google Play In-App Purchase를 통한 월 구독 결제 시스템 구현 및 샌드박스 환경에서 테스트

### 작업 단계

#### 1. Google Play Console 샌드박스 환경 구성

1. **내부 테스트 트랙 생성**
   - Google Play Console > 테스트 > 내부 테스트
   - 새 릴리스 생성 및 APK/AAB 업로드

2. **라이선스 테스터 계정 추가**
   - Google Play Console > 설정 > 라이선스 테스트
   - 테스트 계정 이메일 추가
   - 테스트 응답 설정: `LICENSED` (기본)

3. **테스트용 상품 등록**
   - 상품 ID: `monthly_premium`
   - 가격: 월 3,500원
   - 샌드박스 모드 확인

#### 2. 라이브러리 설정

1. `expo-in-app-purchases` 설치 및 설정
2. `app.json`에 필요한 권한 추가
3. Google Play Console에서 상품 ID (`monthly_premium`) 등록

#### 3. 결제 서비스 구현

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

#### 4. License Response 처리 구현

```typescript
// apps/mobile/services/licenseChecker.ts

export type LicenseResponse = 
  | 'LICENSED' 
  | 'NOT_LICENSED' 
  | 'ERROR_SERVER_FAILURE' 
  | 'ERROR_NOT_MARKET_MANAGED';

export async function handleLicenseResponse(response: LicenseResponse): Promise<void> {
  switch (response) {
    case 'LICENSED':
      // 구독 활성화
      await activateSubscription(); // state = 'active', isPro=true
      showToast('구독이 활성화되었습니다');
      break;
      
    case 'NOT_LICENSED':
      // 무료 사용자
      await deactivateSubscription(); // state = 'free', isPro=false
      showToast('구독이 없습니다');
      break;
      
    case 'ERROR_SERVER_FAILURE':
      // 서버 오류 - 재시도 로직
      console.error('License server failure');
      showToast('일시적인 오류가 발생했습니다. 다시 시도해주세요');
      // 기존 state 유지
      break;
      
    case 'ERROR_NOT_MARKET_MANAGED':
      // 마켓 관리 불가
      console.error('Not market managed');
      showToast('Google Play 설정을 확인해주세요');
      break;
  }
}
```

#### 5. 구독 상태 관리

```typescript
// apps/mobile/services/subscription.ts 확장

export async function handlePurchaseSuccess(): Promise<void> {
  await activateSubscription();
  await handleLicenseResponse('LICENSED');
}

export async function checkAndRestoreSubscription(): Promise<void> {
  const hasActive = await restorePurchases();
  if (hasActive) {
    await handleLicenseResponse('LICENSED');
  } else {
    await handleLicenseResponse('NOT_LICENSED');
  }
}
```

#### 6. UI 구현

1. `apps/mobile/app/(tabs)/settings/pro.tsx` 수정
   - `purchaseSubscription()` 함수 연결
   - 결제 상태에 따른 UI 분기
   - License Response 처리 후 UI 업데이트

2. 버튼 구현
   - "구독 시작 / 결제하기" 버튼
   - "무료 체험 시작" 버튼
   - 버튼 활성화/비활성화 로직

3. 에러 처리 토스트/Alert 구현
   - 성공 메시지
   - 실패 메시지
   - 에러 메시지 (각 Response Code별)

#### 7. 앱 시작 시 초기화

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

#### 8. 샌드박스 테스트 시나리오 실행

1. **무료 체험 테스트**
   - "무료 체험 시작" 버튼 클릭
   - `isPro=false` 확인
   - 기능 사용 가능 확인

2. **구독 결제 성공 테스트**
   - "구독 시작 / 결제하기" 버튼 클릭
   - 샌드박스 결제창 표시 확인
   - 결제 완료
   - Response: `LICENSED` 확인
   - `isPro=true` 상태 확인
   - UI 업데이트 확인

3. **구독 결제 취소 테스트**
   - "구독 시작 / 결제하기" 버튼 클릭
   - 결제창에서 취소
   - Response: `NOT_LICENSED` 확인
   - `isPro=false` 유지 확인

4. **에러 응답 테스트**
   - 네트워크 끊고 테스트
   - `ERROR_SERVER_FAILURE` 처리 확인
   - 적절한 에러 메시지 표시 확인

5. **구독 복원 테스트**
   - 앱 재설치
   - 자동 복원 확인
   - `isPro` 상태 정상 복원 확인


#### 9. 구독 만료 체크 로직 구현 (운영 환경 대비)

1. **포그라운드 진입 감지**
2. **10분 주기 폴링 (Interval)**
3. **구독 상태 재확인 함수 (`checkAndRestoreSubscription`) 활용**

```typescript
// apps/mobile/app/_layout.tsx 수정 예시

import { AppState } from 'react-native';

useEffect(() => {
  // 1. 앱 시작 시 체크
  checkAndRestoreSubscription();

  // 2. 포그라운드 진입 시 체크
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      checkAndRestoreSubscription();
    }
  });

  // 3. 주기적 폴링 (10분)
  const interval = setInterval(() => {
    checkAndRestoreSubscription();
  }, 10 * 60 * 1000); // 10 minutes

  return () => {
    subscription.remove();
    clearInterval(interval);
  };
}, []);
```

### 주의사항

- **Android 전용**: iOS 관련 코드 작성 금지
- **결제 수단**: Google Play Billing만 사용, 카드사/PG사 직접 연동 금지
- **로컬 DB 전용**: MVP 단계에서는 서버 없이 로컬 SQLite만 사용
- **샌드박스 필수**: 실제 결제 발생하지 않도록 테스트 환경 확인
- **테스트 계정**: 라이선스 테스터 계정으로만 테스트
- **에러 처리**: 모든 License Response 코드 처리 필수
- **보안**: keystore 및 API key 절대 공유 금지

### 테스트 체크리스트

- [ ] Google Play Console 샌드박스 설정 완료
- [ ] 라이선스 테스터 계정 추가
- [ ] Google Play 결제 연결 초기화
- [ ] 상품 정보 조회
- [ ] 결제 요청 및 성공 처리 (`LICENSED`)
- [ ] 결제 취소 처리 (`NOT_LICENSED`)
- [ ] 서버 오류 처리 (`ERROR_SERVER_FAILURE`)
- [ ] 마켓 관리 불가 처리 (`ERROR_NOT_MARKET_MANAGED`)
- [ ] 앱 재설치 후 구독 복원
- [ ] 로컬 DB 상태 동기화 확인
- [ ] UI 상태 변화 확인
- [ ] 모든 에러 케이스 처리 확인

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
