# 🔐 반려묘 병상일지 앱 – 보안 명세 (v2)

> 설정 탭 PIN 잠금 및 인증 관련 보안 정책 정의

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 목적 | 민감한 설정 변경 보호 |
| 인증 방식 | 4자리 PIN (서버 검증) |
| 서버 연동 | ✅ 필수 (PIN 해시 저장) |

### 핵심 원칙

> **"서버가 기억하고, 클라이언트는 잠깐만 믿는다"**

- PIN은 **클라이언트에 저장하지 않음**
- PIN 검증, 실패 횟수, 잠금 상태는 **서버가 단일 책임**
- 클라이언트는 **"현재 세션에서 잠금이 풀렸는지 여부"만 기억**

---

## 2. 전체 아키텍처

```
[Client]                        [Server]
  PIN 입력 UI          ────▶     PIN 해시 저장
  unlocked (session)   ◀────     실패 횟수 관리
  자동 재잠금 타이머             잠금 상태 관리
                                 PIN 검증 API
```

---

## 3. 서버 데이터 모델

### settings_security (파일 기반 JSON → MongoDB 마이그레이션 예정)

| 필드 | 타입 | 설명 |
|------|------|------|
| deviceId | string | 기기 고유 식별자 (Primary Key) |
| pinHash | string | bcrypt 해시값 |
| failedAttempts | number | 연속 실패 횟수 |
| lockedUntil | string | null | 잠금 해제 가능 시각 (ISO 8601) |
| createdAt | string | 생성 시각 |
| updatedAt | string | 마지막 변경 시각 |

> ⚠️ PIN 평문 저장 금지, bcrypt (salt rounds: 10) 사용

---

## 4. API 명세

### 4.1 PIN 설정

```
POST /api/settings/pin
```

**요청:**
```json
{
  "deviceId": "uuid",
  "pin": "1234"
}
```

**처리:**
- 서버에서 bcrypt 해시 생성
- 기존 PIN 덮어쓰기
- 실패 횟수 초기화
- 성공 시 Toast 알림 ("PIN이 설정되었습니다")

**응답:**
```json
{ "success": true }
```

---

### 4.2 PIN 검증 (잠금 해제)

```
POST /api/settings/pin/verify
```

**요청:**
```json
{
  "deviceId": "uuid",
  "pin": "1234"
}
```

**서버 로직:**
1. `lockedUntil` 확인 (잠금 상태 체크)
2. PIN 해시 비교
3. 성공 시:
   - `failedAttempts = 0`
   - 응답 `success: true`
4. 실패 시:
   - `failedAttempts + 1`
   - 5회 초과 시 `lockedUntil` 설정 (5분)

**응답 (성공):**
```json
{ "success": true }
```

**응답 (실패):**
```json
{
  "success": false,
  "error": { "code": "INVALID_PIN", "message": "인증에 실패했습니다. (3회 남음)" },
  "remainingAttempts": 3
}
```

**응답 (잠금):**
```json
{
  "success": false,
  "error": { "code": "ACCOUNT_LOCKED", "message": "너무 많은 시도로 인해 잠겼습니다. 5분 후 다시 시도해주세요." },
  "lockedUntil": "2025-12-29T16:10:00.000Z"
}
```

---

### 4.3 PIN 상태 조회

```
GET /api/settings/pin/status?deviceId=xxx
```

**응답:**
```json
{
  "success": true,
  "data": {
    "isPinSet": true,
    "isLocked": false,
    "lockedUntil": null,
    "failedAttempts": 0
  }
}
```

---

### 4.4 PIN 해제

```
DELETE /api/settings/pin?deviceId=xxx
```

**처리:**
- deviceId에 해당하는 PIN 데이터 삭제
- 성공 시 Toast 알림 ("PIN 설정이 해제되었습니다")

---

## 5. 클라이언트 상태 관리

### 세션 상태

```typescript
interface PinLockState {
  isPinSet: boolean;      // 서버에 PIN 설정 여부
  isLocked: boolean;      // 현재 세션 잠금 여부
  serverAvailable: boolean; // 서버 연결 상태
}
```

### 동작 규칙

| 이벤트 | 동작 |
|--------|------|
| PIN 검증 성공 | `isLocked = false` |
| 앱 종료 / 백그라운드 | `isLocked = true` |
| 10분 무활동 | `isLocked = true` (자동 재잠금) |
| 서버 연결 실패 | `isLocked = true` (보안 우선) |

---

## 6. 설정 UI 동작 규칙

### 잠금 상태 (`isLocked = true`)

- 🔒 상단 배너: "설정이 잠겨 있습니다" + [잠금 해제] 버튼
- 설정 값 조회 가능
- 설정 값 수정 불가
- 민감한 설정 UI disabled (고양이 관리, 데이터 초기화)

### 잠금 해제 상태 (`isLocked = false`)

- 설정 UI 활성화
- 수정 가능
- 무활동 시 자동 재잠금 타이머 작동

---

## 7. 보안 정책

| 정책 | 내용 |
|------|------|
| PIN 저장 위치 | 서버만 (클라이언트 저장 금지) |
| 해시 알고리즘 | bcrypt (salt rounds: 10) |
| 최대 실패 횟수 | 5회 |
| 잠금 시간 | 5분 |
| 자동 재잠금 | 10분 무활동 |
| 실패 메시지 | 단순화 ("인증에 실패했습니다") |

### 금지 사항

- ❌ PIN 또는 해시를 LocalStorage/AsyncStorage에 저장
- ❌ 클라이언트 단독 검증
- ❌ 잠금 상태를 URL 파라미터나 클라이언트 상태만으로 제어
- ❌ 실패 횟수를 클라이언트에서 관리

---

## 8. PIN 분실 대응

- **PIN 찾기 기능 없음**
- 보안 정책상 복구 불가

### 초기화 방법

- 앱 데이터 초기화
- 또는 앱 재설치

> ⚠️ PIN 분실 시 기존 데이터는 복구 불가 (명시 필요)

---

## 9. 기술 스택 요약

| 항목 | 기술 |
|------|------|
| 서버 PIN 저장 | 파일 기반 JSON (MVP) → MongoDB |
| 해시 | bcrypt (bcryptjs) |
| 클라이언트 상태 | React Context (메모리) |
| 기기 식별 | AsyncStorage (UUID 생성 후 저장) |
| 생체 인증 | Expo LocalAuthentication (추후 추가) |

---

## 10. UX 검수 체크리스트

- [ ] 새로고침/앱 재시작 시 잠금이 유지되는가
- [ ] 서버 장애 시 설정 변경이 차단되는가
- [ ] 실패 횟수 제한이 서버 기준으로 동작하는가
- [ ] 10분 무활동 후 자동 잠금되는가
- [ ] 백그라운드 전환 후 잠금되는가
- [ ] 5회 실패 시 5분 잠금이 작동하는가

---

## 요약

```
✅ PIN은 서버만 저장
✅ 클라이언트는 세션 상태만 기억
✅ 서버 연결 실패 = 잠금 유지
✅ 10분 무활동/백그라운드 = 자동 잠금
```
