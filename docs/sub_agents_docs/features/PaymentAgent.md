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

## 2.1 구독 상태 판별 전체 케이스 (SSOT - 배포 안정화 기준)

본 내용은 **앱 최초 실행 / 재설치 / 기기 변경 / 네트워크 지연** 등 실서비스에서 발생 가능한 모든 구독 관련 케이스를 포함한 **단일 진실 소스(Single Source of Truth)** 이다.

### 0. 전제 원칙 (절대 규칙)

#### RULE 0-1. 검증 전에는 아무 상태도 확정하지 않는다
- 앱 최초 실행 시 기본 상태는 반드시 `loading`
- **절대 금지**
  - 구독중 선표시
  - 무료체험 선지급

#### RULE 0-2. 로컬 데이터는 참고용일 뿐
- 판단 기준은 **스토어 응답 (영수증 / Entitlement)** 이다
- reinstall / 기기 변경 시 로컬 데이터는 신뢰하지 않는다

#### RULE 0-3. 시간은 반드시 서버 기준
- `now`는 **서버 시간** 기준으로 판단
- **로컬 기기 시간 사용 금지** (시간 조작 방지)

#### RULE 0-4. 캐시된 entitlement는 신뢰 금지
- `source === 'cache'`인 경우 subscribed 처리 금지
- 반드시 `source === 'server'` AND `verificationSucceeded === true`

---

### 1. 상태 정의 (최소 필요 상태)

| 상태 | 설명 |
|----|----|
| `loading` | 스토어 검증 진행 중 |
| `trial` | 무료체험 활성 |
| `subscribed` | 유효한 구독 상태 |
| `blocked` | 접근 차단 상태 |

---

### 2. 핵심 판별 기준 값

#### 필수 체크 항목
- `hasPurchaseHistory` : 결제 이력 존재 여부
- `hasUsedTrial` : 무료체험 사용 여부 (**서버 기록 기준**)
- `isEntitlementActive` : 구독 권한(Entitlement) 활성 여부
- `expiresDate` : 만료일 (**유효한 Date 객체 필수**)
- `now` : 현재 시각 (**서버 시간 기준**)
- `verificationSucceeded` : 영수증 검증 성공 여부
- `expectedProductId` : 앱에서 기대하는 상품 ID
- `actualProductId` : 스토어에서 반환된 실제 상품 ID
- `isPendingTransaction` : 결제 진행 중 여부
- `restoreAttempted` : restore 시도 여부
- `restoreSucceeded` : restore 성공 여부
- `source` : 데이터 출처 (`'server'` | `'cache'`)

#### VerificationResult 타입 정의 (구현 필수)
```typescript
type VerificationResult = {
  success: boolean;
  serverSyncSucceeded: boolean; // 서버 통신 성공 여부 (CASE H)
  entitlementActive: boolean;
  expiresDate?: Date;          // 유효한 Date 객체만
  productId?: string;
  isPending?: boolean;
  source: 'server' | 'cache';
  serverTime: Date;            // 서버 시간
  hasUsedTrial: boolean;       // 서버에서 확인된 체험 사용 여부
  hasPurchaseHistory: boolean; // 서버에서 확인된 결제 이력
}
```

---

### 3. 전체 케이스 테이블 (구현 기준)

#### 기본 케이스

| # | 상황 | 조건 | 시작 상태 |
|--|----|----|----|
| 1 | 완전 신규 | 결제 ❌ / 체험 ❌ / 검증 완료 | `trial` |
| 2 | 체험만 사용 | 체험 O / 결제 ❌ | `blocked` |
| 3 | 유효 구독 | entitlement O / expires > now / productId 일치 | `subscribed` |
| 4 | 취소했지만 기간 남음 | willRenew ❌ / expires > now | `subscribed` |
| 5 | 구독 만료 | entitlement ❌ / expires ≤ now | `blocked` |
| 6 | 재설치 | 로컬 데이터 없음 / entitlement O | `subscribed` |
| 7 | 기기 변경 | Google 계정 동일 / entitlement O | `subscribed` |
| 8 | 영수증 검증 실패 | verification ❌ | `loading` |
| 9 | 네트워크 지연 | 응답 미도착 | `loading` |
| 10 | 스토어 오류 | store error | `loading` |
| 11 | 샌드박스 꼬임 | entitlement ghost | `loading` |
| 12 | 복원 미실행 | restore 안 했지만 entitlement O | `subscribed` |

#### 🔴 치명적 엣지 케이스 (CASE A~J)

| # | 상황 | 조건 | 시작 상태 | 비고 |
|--|----|----|----|----|  
| A | 불완전 데이터 | expiresDate 없음/파싱실패/null | `loading` | 절대 subscribed 금지 |
| B | Product ID 불일치 | entitlement O / actualProductId ≠ expectedProductId | `loading` | 상품 migration 고려 |
| C | 캐시된 entitlement | source === 'cache' | `loading` | 서버 검증 필수 |
| D-1 | restore 미시도 | restoreAttempted ❌ | `loading` | restore 먼저 시도 |
| D-2 | restore 실패 | restoreAttempted O / restoreSucceeded ❌ | `loading` | 재시도 안내 |
| D-3 | restore 성공 | restoreAttempted O / restoreSucceeded O | 다음 판별 | 정상 플로우 |
| E | trial 기록 전 크래시 | trial 시작 / 서버 기록 전 앱 종료 | `loading` | hasUsedTrial 서버 확인 필수 |
| F | 시간 조작 | 기기 시간 ≠ 서버 시간 (>5분 차이) | `loading` | 서버 시간으로 재검증 |
| G | 결제 진행 중 | isPendingTransaction O | `loading` | 결제 확정 전 subscribed 금지 |
| H | 서버 통신 실패 | 스토어 OK / serverSyncSucceeded ❌ | `loading` | 재시도 필요 |
| I | Legacy Product ID | entitlement O / id ∈ allowlist | `subscribed` | 레거시 지원 |
| J | 결제 O / Entitlement ❌ | hasPurchaseHistory O / entitlement ❌ | `blocked` | 복원 유도 안내 메시지 |

---

### 4. 무료체험 관련 절대 규칙

#### 무료체험 지급 조건
```text
결제 이력 ❌ (서버 확인)
AND 무료체험 사용 ❌ (서버 확인)
AND 검증 완료 (source === 'server' AND serverSyncSucceeded)
```

#### 무료체험 차단 조건
```text
무료체험 사용 이력 O (서버 기록)
OR 재설치 (서버에서 이미 체험 기록 확인)
OR 기기 변경 (동일 계정 = 서버 기록 공유)

➡️ 무료체험은 계정 단위, 기기 단위 아님
```

#### hasUsedTrial 신뢰 기준
```text
⚠️ 로컬 AsyncStorage의 hasUsedTrial → 참고용
✅ 서버 API의 hasUsedTrial → 진실
```

- trial 시작 시점에 **즉시 서버에 기록** (비동기 X, 동기 필수)
- 앱 크래시/강제종료 대비: trial 시작 → 서버 기록 → UI 업데이트 순서

---

### 5. 상태 결정 우선순위 (최종 권장판)

```text
1. verification 실패 OR 불완전 데이터 OR 서버 통신 실패 (CASE H) → loading
2. pending transaction 존재 → loading
3. source === 'cache' (서버 미검증) → loading
4. restore 미시도 OR restore 실패 → loading
5. productId 불일치 (AND not in allowlist) → loading
6. 시간 차이 > 5분 (조작 의심) → loading
7. entitlement 활성 AND verification 성공 AND (productId 일치 OR allowlist) → subscribed
8. 체험 가능 (결제 ❌ AND 체험 ❌ AND 검증 완료) → trial
9. 그 외 (결제 이력 O 포함 CASE J) → blocked
```

---

### 6. 구현용 의사코드 (최종 권장)

```typescript
const EXPECTED_PRODUCT_ID = 'myorok_monthly_premium';
const LEGACY_PRODUCT_IDS = ['myorok_monthly_legacy_v1']; // CASE I

function determineSubscriptionState(result: VerificationResult): SubscriptionStatus {
  const { 
    success, serverSyncSucceeded, entitlementActive, expiresDate, productId, 
    isPending, source, serverTime, hasUsedTrial, hasPurchaseHistory 
  } = result;
  
  // 1. 검증 실패, 불완전 데이터, 또는 서버 통신 실패 (CASE A, H)
  if (!success || !serverSyncSucceeded) {
    return 'loading';
  }
  
  // 2. 결제 진행 중 (CASE G)
  if (isPending) {
    return 'loading';
  }
  
  // 3. 캐시 데이터 (서버 미검증) (CASE C)
  if (source === 'cache') {
    return 'loading';
  }
  
  // 4. expiresDate 유효성 검사 (CASE A)
  if (entitlementActive && (!expiresDate || isNaN(expiresDate.getTime()))) {
    return 'loading';
  }
  
  // 5. Product ID 검사 (CASE B, I)
  if (entitlementActive && productId !== EXPECTED_PRODUCT_ID && !LEGACY_PRODUCT_IDS.includes(productId || '')) {
    return 'loading';
  }
  
  // 6. 유효한 구독 상태
  if (entitlementActive && expiresDate && expiresDate > serverTime) {
    return 'subscribed';
  }
  
  // 7. 체험 가능 조건
  if (!hasPurchaseHistory && !hasUsedTrial) {
    return 'trial';
  }
  
  // 8. 그 외 (CASE J 포함)
  return 'blocked';
}
```

---

### 7. 절대 하면 안 되는 실수 TOP 7

| ❌ 금지 사항 | 이유 |
|-------------|------|
| entitlement 조회 전 subscribed 처리 | CASE C 위반 |
| 로컬 플래그만 보고 무료체험 재지급 | CASE E 위반 |
| 취소됨 = 만료됨 으로 처리 | 기간 남은 구독자 차단 |
| expiresDate null인데 subscribed 처리 | CASE A 위반 |
| cache 데이터로 상태 결정 | CASE C 위반 |
| 로컬 기기 시간으로 만료 판단 | CASE F 위반 |
| pending 상태에서 subscribed 처리 | CASE G 위반 |

---

### 8. QA 체크리스트 (필수 테스트)

#### 기본 케이스
- [ ] 앱 삭제 후 재설치 (결제 없음) → `trial`
- [ ] 무료체험만 사용 후 재설치 → `blocked`
- [ ] 유효 구독 상태에서 재설치 → `subscribed`
- [ ] 구독 취소 후 기간 남은 상태 → `subscribed`
- [ ] 구독 만료 상태 → `blocked`
- [ ] 네트워크 끊은 상태 최초 실행 → `loading` 유지
- [ ] 기기 변경 후 설치 (동일 계정) → `subscribed`

#### 엣지 케이스 (CASE A~G)
- [ ] expiresDate null 응답 → `loading`
- [ ] 다른 productId 구독 → `loading`
- [ ] restore 실패 → `loading` + 재시도 안내
- [ ] trial 시작 직후 앱 강제종료 → 재실행 시 서버 확인
- [ ] 기기 시간 1일 앞으로 설정 → `loading` (서버 시간 기준 재검증)
- [ ] 결제 중 앱 종료 → `loading` (pending 상태)


### 9. 내부 기준 문장 (문서용)
> "구독 상태는 로컬이 아닌 **서버/스토어 기준**으로 판단하며, 검증 완료 전에는 어떤 접근 권한도 확정하지 않는다.
> 불완전한 데이터, 캐시, pending 상태에서는 **무조건 loading**으로 처리한다."
```

- trial 시작 시점에 **즉시 서버에 기록** (비동기 X, 동기 필수)
- 앱 크래시/강제종료 대비: trial 시작 → 서버 기록 → UI 업데이트 순서

---

### 5. 상태 결정 우선순위 (최종 권장판)

```text
1. verification 실패 OR 불완전 데이터 → loading
2. pending transaction 존재 → loading
3. source === 'cache' (서버 미검증) → loading
4. restore 미시도 OR restore 실패 → loading
5. productId 불일치 → loading
6. 시간 차이 > 5분 (조작 의심) → loading
7. entitlement 활성 AND verification 성공 AND productId 일치 → subscribed
8. 체험 가능 (결제 ❌ AND 체험 ❌ AND 검증 완료) → trial
9. 그 외 → blocked
```

---

### 6. 구현용 의사코드 (최종 권장)

```typescript
const EXPECTED_PRODUCT_ID = 'myorok_monthly_premium';

function determineSubscriptionState(result: VerificationResult): SubscriptionStatus {
  const { 
    success, entitlementActive, expiresDate, productId, 
    isPending, source, serverTime, hasUsedTrial, hasPurchaseHistory 
  } = result;
  
  // 1. 검증 실패 또는 불완전 데이터
  if (!success) {
    return 'loading';
  }
  
  // 2. 결제 진행 중
  if (isPending) {
    return 'loading';
  }
  
  // 3. 캐시 데이터 (서버 미검증)
  if (source === 'cache') {
    return 'loading';
  }
  
  // 4. expiresDate 유효성 검사
  if (entitlementActive && (!expiresDate || isNaN(expiresDate.getTime()))) {
    return 'loading';  // 불완전 데이터 (CASE A)
  }
  
  // 5. Product ID 불일치 (CASE B)
  if (entitlementActive && productId !== EXPECTED_PRODUCT_ID) {
    return 'loading';
  }
  
  // 6. 유효한 구독 상태
  if (entitlementActive && expiresDate && expiresDate > serverTime) {
    return 'subscribed';
  }
  
  // 7. 체험 가능 조건
  if (!hasPurchaseHistory && !hasUsedTrial) {
    return 'trial';
  }
  
  // 8. 그 외
  return 'blocked';
}
```

---

### 7. 절대 하면 안 되는 실수 TOP 7

| ❌ 금지 사항 | 이유 |
|-------------|------|
| entitlement 조회 전 subscribed 처리 | CASE C 위반 |
| 로컬 플래그만 보고 무료체험 재지급 | CASE E 위반 |
| 취소됨 = 만료됨 으로 처리 | 기간 남은 구독자 차단 |
| expiresDate null인데 subscribed 처리 | CASE A 위반 |
| cache 데이터로 상태 결정 | CASE C 위반 |
| 로컬 기기 시간으로 만료 판단 | CASE F 위반 |
| pending 상태에서 subscribed 처리 | CASE G 위반 |

---

### 8. QA 체크리스트 (필수 테스트)

#### 기본 케이스
- [ ] 앱 삭제 후 재설치 (결제 없음) → `trial`
- [ ] 무료체험만 사용 후 재설치 → `blocked`
- [ ] 유효 구독 상태에서 재설치 → `subscribed`
- [ ] 구독 취소 후 기간 남은 상태 → `subscribed`
- [ ] 구독 만료 상태 → `blocked`
- [ ] 네트워크 끊은 상태 최초 실행 → `loading` 유지
- [ ] 기기 변경 후 설치 (동일 계정) → `subscribed`

#### 엣지 케이스 (CASE A~G)
- [ ] expiresDate null 응답 → `loading`
- [ ] 다른 productId 구독 → `loading`
- [ ] restore 실패 → `loading` + 재시도 안내
- [ ] trial 시작 직후 앱 강제종료 → 재실행 시 서버 확인
- [ ] 기기 시간 1일 앞으로 설정 → `loading` (서버 시간 기준 재검증)
- [ ] 결제 중 앱 종료 → `loading` (pending 상태)

---

### 9. 내부 기준 문장 (문서용)
> "구독 상태는 로컬이 아닌 **서버/스토어 기준**으로 판단하며, 검증 완료 전에는 어떤 접근 권한도 확정하지 않는다.
> 불완전한 데이터, 캐시, pending 상태에서는 **무조건 loading**으로 처리한다."

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

> ※ 하루 1 row 원칙 유지

---



## 6. UI 요구사항

### 결제 버튼

- **노출 조건**: `state = 'trial'` 또는 `state = 'expired'`
- **`state = 'active'` 일 때**:
  - "구독 중" 표시
  - 결제 버튼 비활성화

### 에러 처리

- 네트워크 오류 시: 토스트 또는 Alert 표시
- Google 결제 불가 상태: 안내 문구 노출

---

## 7. 테스트 조건

- Google Play 내부 테스트 트랙 사용
- 라이선스 테스트 계정으로 로그인
- 실제 결제 발생 ❌

---

## 8. 주의사항 ⚠️

> [!CAUTION]
> > - Google Play Billing 외 결제 수단 사용 ❌
> > - 카드사 / PG사 직접 연동 ❌
> > - 서버 영수증 검증 ❌ (MVP 단계)

---

## 9. 완료 기준

- [ ] 내부 테스트에서 결제 성공
- [ ] 결제 취소 정상 처리
- [ ] 재설치 후 구독 복원 확인

---

## 10. 구독 해지 UI/UX 명세

### 10.1 기본 원칙

| 항목 | 정책 |
|------|------|
| 숨김 여부 | ❌ 숨기지 않음 |
| 강조 수준 | 결제 버튼보다 낮게 |
| 구현 방식 | 텍스트 링크 |
| 해지 처리 | 앱 내부 ❌ / Google Play에서 처리 ✅ |

### 10.2 위치

- **페이지**: 구독 관리 페이지 (`settings/pro.tsx`)
- **위치**: 페이지 최하단 (Footer 영역)
- **구성 순서**:
  1. 현재 구독 상태 (Active · 다음 결제일)
  2. 구독하기 버튼 (주요 CTA)
  3. 안내 문구 + 해지 링크

### 10.3 UI 명세

**텍스트 링크:**
- 문구: `구독 해지하기 →`
- 스타일: 텍스트 링크 (버튼 ❌)
- 색상: 회색 (`#888` ~ `#999`)
- 터치 영역: 최소 44px 확보

**보조 안내 문구:**
```
ℹ️ 구독은 언제든지 취소할 수 있습니다.
```

### 10.4 동작

- 링크 클릭 시 **Google Play 구독 관리 페이지로 이동**
- URL: `https://play.google.com/store/account/subscriptions`
- 앱 내 해지 처리 ❌

### 10.5 정책 대응 포인트

- ✔️ 해지 경로 명확히 인지 가능
- ✔️ 해지 버튼 숨기지 않음
- ✔️ Google Play 정책 준수

---

## 11. 환불 UI/UX 명세

### 11.1 기본 원칙

| 항목 | 정책 |
|------|------|
| 앱 내 환불 처리 | ❌ |
| 앱 내 환불 요청 API | ❌ |
| 환불 처리 주체 | Google Play에서만 처리 |
| 앱 역할 | **안내 + 이동(UI)만 제공** |

### 11.2 UI 위치 및 형태

| 항목 | 값 |
|------|------|
| 페이지 | 구독 관리 페이지 (`settings/pro.tsx`) |
| 위치 | 페이지 하단 (구독 해지 링크 아래 또는 동일 영역) |
| UI 형태 | 텍스트 안내 + 텍스트 링크 (버튼 ❌, 강조 UI ❌) |

### 11.3 UX 문구 명세

**기본 안내 문구:**
```
환불은 Google Play 정책에 따라 처리됩니다.
```

**링크 문구:**
```
Google Play 구독 관리로 이동 →
```

**또는 (해지와 통합 시):**
```
구독 해지·환불 관리 → Google Play 이동
```

### 11.4 이동 링크

- **URL**: `https://play.google.com/store/account/subscriptions`
- **동작**: 클릭 시 외부 브라우저 또는 Play Store 앱 열기
- **인앱 WebView**: ❌ 사용 금지
- 환불 / 해지 / 결제 내역 모두 처리 가능

### 11.5 구현 명세 (개발자용)

**컴포넌트 규칙:**
- `Text` + `TouchableOpacity` (또는 `Pressable`)
- 색상: 기본 텍스트 색상 또는 secondary color
- 밑줄 허용 (선택)
- 터치 영역: 최소 44px 확보

### 11.6 하지 않는 것 (명확화)

| ❌ 금지 항목 |
|-------------|
| 앱 내 환불 버튼 |
| 환불 요청 폼 |
| 고객센터 환불 접수 |
| 외부 웹 결제/환불 링크 (Google Play 외) |

### 11.7 정책 및 심사 대응

**Google Play 정책 준수 사항:**
- ✔️ 앱 내 환불 차단
- ✔️ 사용자에게 명확한 환불 경로 제공
- ✔️ Google Play 구독 관리 페이지 직접 연결

**심사 대응 문구:**
```
This app does not process refunds directly.
Refunds are handled by Google Play according to their policies.
```

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

> 모든 버튼은 **클릭 시 결제 모달**을 띄우고, 결제 완료 여부를 로컬 DB와 동기화

### 13.2 결제 플로우

1. 사용자 앱 실행
2. 홈 화면 배너 클릭 또는 내 정보 화면 이동
3. **결제 버튼 클릭**
4. 결제 모달/창 표시 (샌드박스 모드)
5. 결제 성공 → 로컬 DB `isPro=true` → 클라이언트 UI 업데이트
6. 결제 실패/취소 → 로컬 DB `isPro=false` → 실패 메시지 표시
7. 무료 체험 종료 시 → 로컬 DB `isPro` 갱신

### 13.3 License Response 처리

Google Play License Response 코드에 따른 처리:

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
| 구독 갱신 | **구독 갱신 / 재결제** | 샌드박스 반복 결제 → 로컬 DB 상태 갱신, 알림 확인 |
| 구독 만료 | - | 테스트 샌드박스 만료 시 알림 표시, 기능 제한 없음 |

### 14.2 에러 응답 테스트 시나리오

| 시나리오 | Response Code | 예상 처리 |
|----------|---------------|-----------|
| 서버 오류 발생 | `ERROR_SERVER_FAILURE` | 재시도 안내 메시지, 기존 `isPro` 상태 유지 |
| 마켓 관리 불가 | `ERROR_NOT_MARKET_MANAGED` | 오류 안내 메시지, Google Play 설정 확인 요청 |

> 모든 버튼 클릭 시 **결제창(모달)이 제대로 떠야 함**  
> UI/UX 체크: 버튼 활성화/비활성화, 텍스트 상태, 팝업 닫기/취소 동작

---

## 15. 로컬 DB 연동 체크리스트

### 15.1 로컬 SQLite 처리

1. **구독 상태 테이블 업데이트**
   - `subscription` 테이블의 `state` 필드 업데이트
   - License Response 코드에 따른 상태 매핑

2. **License Response 매핑**
   - `LICENSED` → `state = 'active'`, `isPro=true`
   - `NOT_LICENSED` → `state = 'expired'` or `state = 'free'`, `isPro=false`
   - 에러 응답 → 기존 상태 유지 + 에러 메시지 로깅

### 15.2 클라이언트 UI

1. **결제 성공/실패 메시지 표시**
   - 토스트 또는 Alert로 결과 표시
   - 성공: "구독이 활성화되었습니다"
   - 실패: "결제가 취소되었습니다"
   - 에러: "일시적인 오류가 발생했습니다. 다시 시도해주세요"

2. **UI 구독 상태 표시**
   - 아이콘 변경 (Pro 뱃지 등)
   - 텍스트 상태: "구독 중" / "무료"
   - 버튼 상태: 구독 중일 때 "구독 중" 표시, 결제 버튼 비활성화

---

## 16. 테스트 주의사항

> [!CAUTION]
> - 테스트 계정 외 결제 금지
> - 실제 결제 청구되지 않도록 **Google Play 샌드박스 환경 필수**
> - 테스트 완료 후 샌드박스 계정 로그아웃
> - keystore/API key 절대 공유 금지

### 16.1 보안 체크리스트

- [ ] Google Play Console 테스트 트랙 설정 확인
- [ ] 라이선스 테스터 계정 등록
- [ ] 실제 결제 발생 여부 재확인
- [ ] API key 및 keystore 보안 관리
- [ ] 테스트 완료 후 테스트 계정 정리

---

## 17. 테스트 최종 목표

### 17.1 검증 항목

- [x] 계좌 없이도 결제 모듈 연동과 동작 확인
- [x] 버튼 클릭 시 결제창 정상 표시
- [x] License Response 코드별 처리 확인
- [x] 로컬 DB 상태 동기화 정상 확인
- [x] UI 상태 변화 정상 반영
- [x] 에러 케이스 처리 확인
- [x] 정식 결제 연동 전 플로우 안전 검증

### 17.2 완료 기준

- Google Play 샌드박스에서 결제 성공
- 모든 License Response 코드 처리 확인
- 로컬 DB와 UI 상태 정상 동기화
- 에러 케이스 적절한 메시지 표시
- 재설치 후 구독 복원 정상 동작

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

> [!IMPORTANT]
> **SSOT 준수 필수**: 위 `PAYMENT_SPEC.md`의 **Section 2.1 구독 상태 판별 전체 케이스**를 Single Source of Truth로 간주하고, 모든 구현 시 해당 규칙을 최우선으로 따라야 한다. **특히 앱 시작 시 `loading` 상태 처리와 무료체험 악용 방지 로직**을 철저히 구현하시오.

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
