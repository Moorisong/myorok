# 서버 SSOT 구독 로직 (Server SSOT Subscription Logic)

이 문서는 묘록(Myorok)의 구독 시스템, 특히 체험(Trial) 상태 및 만료와 관련된 **단일 진실 공급원(SSOT)** 규칙을 정의합니다.

## 핵심 원칙 (Core Principles)

1.  **서버의 절대적 권한 (Server Authority)**
    *   **백엔드 서버**만이 다음을 결정할 유일한 권한을 가집니다:
        *   구독 상태 (`trial`, `subscribed`, `expired`, `blocked`)
        *   체험 가능 여부
        *   체험 남은 기간 (Remaining Days)
    *   **클라이언트(앱)는 절대로 로컬 시간이나 저장된 날짜를 기반으로 구독 상태를 추론, 계산, 변경해서는 안 됩니다.**

2.  **`daysRemaining`은 표시 전용 (Display-Only)**
    *   서버로부터 받은(또는 캐시된) `daysRemaining` 값은 오직 **UI 표시 목적**으로만 사용합니다.
    *   사용자의 접근 권한을 판단하는 비즈니스 로직에 이 값을 사용해서는 안 됩니다 (예: `if (daysRemaining <= 0) blockAccess()` ❌ 금지).
    *   접근 제어는 오직 `status` 필드에 의해서만 결정됩니다.
    *   만약 `status`가 `trial`인데 로컬의 `daysRemaining`이 0이나 음수로 보이는 상황이라도, 서버가 명시적으로 `blocked`나 `expired`로 상태를 바꾸기 전까지는 사용자는 여전히 접근 권한을 가집니다.

## 클라이언트 구현 규칙 (Client Implementation Rules)

### 1. 상태 관리 (State Management)
*   **출처**: 클라이언트 상태는 오직 `/api/subscription/verify` (또는 유사 검증 API)의 응답으로만 채워집니다(Hydrate).
*   **캐싱**: 서버 응답(status, daysRemaining)은 오프라인 지원이나 빠른 앱 실행을 위해 로컬(`AsyncStorage`)에 캐시될 수 있습니다. 하지만 이 캐시는 서버 상태의 스냅샷일 뿐이며, 로컬 계산의 재료가 되어서는 안 됩니다.

### 2. 금지된 로직 (Prohibited Logic)
*   ❌ `calculateDaysRemaining(startDate)`: `TRIAL_START_DATE`와 `Device.Date.Now`를 비교하여 남은 기간을 계산하는 행위.
*   ❌ `if (Date.now() > expiryDate) setStatus('expired')`: 로컬 시간 기준의 만료 체크.

### 3. 앱 재설치 / 기기 변경
*   진실은 서버에 있으므로, 깨끗한 상태에서 앱을 새로 설치해도 로그인/검증 시 서버로부터 정확한 `daysRemaining`과 `status`를 받아옵니다.
*   클라이언트는 제한을 적용하기 위해 "체험 시작일"의 로컬 영구 저장에 의존하지 않으며, 이로써 재설치 시 체험 시간이 초기화되는 문제를 방지합니다.

## 서버 인터페이스 요구사항 (Server Interface Requirement)

검증 API는 명시적으로 계산된 값을 제공해야 합니다.

```typescript
interface ServerVerificationResponse {
  // 접근 제어의 절대적 기준
  status: 'trial' | 'active' | 'expired' | 'blocked';
  
  // 서버 시간 기준으로 계산된 남은 기간
  // 선택사항, 'trial' 상태일 때만 유의미함
  daysRemaining?: number; 
  
  // ISO 날짜 문자열 (참고용일 뿐, 로직 사용 금지)
  trialStartDate?: string;
  subscriptionExpiryDate?: string;
}
```
