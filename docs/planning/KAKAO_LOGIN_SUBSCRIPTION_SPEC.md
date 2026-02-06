# 🐾 묘록 카카오 로그인 & 월 구독 상세 명세

## 1. 개요
묘록은 로컬 SQLite 기반의 다묘 병상일지 앱으로, 월 구독 결제 도입과 사용자 식별을 위해 카카오 로그인을 필수로 합니다.  
본 명세는 AI나 서브 에이전트가 바로 기능을 구현할 수 있는 수준으로 작성되었습니다.

---

## 2. 사용자 식별 및 DB 구조

### 2.1 users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 카카오 고유 ID (PK) |
| nickname | TEXT | 카카오 닉네임 |
| profileImage | TEXT | 프로필 이미지 URL |
| createdAt | TEXT | 최초 로그인 시각 |
| lastLogin | TEXT | 마지막 로그인 시각 |

### 2.2 subscription_state 테이블 (사용자 단위)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK, 항상 1개 per user |
| userId | TEXT | users.id 참조 |
| trialStartDate | TEXT | 체험 시작일 |
| subscriptionStatus | TEXT | trial / active / expired |
| subscriptionStartDate | TEXT | 정식 구독 시작일 |
| subscriptionExpiryDate | TEXT | 구독 만료일 |
| createdAt | TEXT | 생성일 |
| updatedAt | TEXT | 갱신일 |

> 기존 `subscription_state` 테이블을 사용자 단위로 확장, petId 기반 데이터와 연계

### 2.3 pets & 기록 테이블 연계

- 모든 기존 테이블 (`pets`, `daily_records`, `supplements`, `supplement_records`, `fluid_records`, `custom_metrics`, `custom_metric_records`, `medication_memos`, `food_preference_memos`)에 `userId` 컬럼 추가
- 로그인 후 `userId` 기준 필터링 → 다묘 데이터 분리
- petId는 기존 방식 유지

---

## 3. 로그인/로그아웃 플로우

1. **앱 실행**
   - 로그인 상태 확인: `users` 테이블에서 `userId` 존재 여부
   - 로그인 안 된 경우 → 로그인 페이지로 이동
2. **카카오 로그인**
   - SDK / OAuth2 연동
   - 동의 시 사용자 정보(`id`, `nickname`, `profileImage`) 수집
   - DB 저장/갱신: `users`, `subscription_state`
3. **로그인 후**
   - 구독 상태 확인: `subscriptionStatus` 기반 기능 제한/허용
   - 로컬 DB와 클라우드 동기화:
     - 신규 기기: JSON 백업/복원
     - 기존 기기: petId별 기록 병합
4. **로그아웃**
   - `userId` 제거
   - 로컬 pet 데이터는 삭제하지 않음
   - 기능 접근 제한: 구독 관련 기능만 차단

---

## 4. 구독 상태 처리

| 상태 | 동작 |
|------|------|
| trial | 무료 체험 기능 허용, 만료일 표시 |
| active | 모든 기능 접근 허용 |
| expired | 기능 제한 (예: 기록 확인 가능, 신규 기록 입력 제한) |

### 4.1 구독 만료 알림
- 앱 실행 시 구독 만료 체크
- 알림/팝업으로 결제 유도

---

## 5. API / 함수 정의 (서브 에이전트용)

### 5.1 사용자 관리

- `loginWithKakao() → userId`
- `logout()`
- `getUser(userId) → User`
- `updateLastLogin(userId)`

### 5.2 구독 관리

- `getSubscriptionStatus(userId) → subscriptionStatus`
- `startTrial(userId)`
- `activateSubscription(userId, startDate, expiryDate)`
- `expireSubscription(userId)`

### 5.3 데이터 동기화

- `syncPets(userId, localData) → mergedData`
- `backupToJSON(userId) → JSON`
- `restoreFromJSON(userId, JSON)`

### 5.4 예외 처리

- 로그인 실패 → 팝업 안내
- 구독 상태 불일치 → 로컬 DB 재동기화
- petId 중복 → 자동 UUID 생성
- JSON 백업/복원 실패 → 로그 기록 및 알림

---

## 6. UI/UX 명세

1. **로그인 페이지**
   - 카카오 로그인 버튼
   - 로그인 안내 문구: "월 구독 결제로 묘록을 이용하려면 로그인하세요."
2. **구독 상태 표시**
   - trial: 남은 일수 표시
   - active: 만료일 표시
   - expired: 결제 유도 버튼
3. **다묘 데이터 접근**
   - 로그인 시 userId 기준 필터링
   - pet 선택 화면: 등록/삭제/복원 가능
4. **백업/복원**
   - JSON export/import UI 제공
   - userId 포함 → 기기 간 데이터 동기화

---

## 7. 보안 정책

- 카카오 OAuth2 표준 준수
- 로컬 DB는 기기 내 암호화 권장
- 개인정보 최소화: ID, 닉네임, 프로필 이미지만 저장
- 로그아웃 시 userId 제거, 구독/데이터 접근 차단

---

## 8. AI/서브 에이전트용 구현 포인트

- 테이블 구조 및 컬럼 정의 완전 명시
- 로그인/구독/데이터 동기화 API 명세 포함
- UI 요소와 상태별 동작 정의
- 예외 처리, 알림, 병합 로직까지 상세화
- 다묘 + 사용자별 데이터 구조 연계

---

## 9. 기대 효과

- AI 기반 에이전트가 바로 로그인/구독 기능 구현 가능
- 사용자 데이터 안전하게 관리
- 월 구독 결제 안정화
- 다묘 환경에서 데이터 동기화 용이
- 로컬 DB + JSON 백업/복원 전략 통합

---

## 10. 묘록 로그인 후 구독 플로우 명세

### 10.1 앱 실행 시

1. 앱 실행 후 **로그인 상태 확인**
   - `userId` 존재 여부 확인
   - 로그인 안 되어 있으면 **로그인 페이지**로 이동

---

### 10.2 로그인 성공

1. 카카오 로그인 성공
2. `users` 테이블에 사용자 정보 저장/갱신
3. `subscription_state`에서 구독 상태 확인
   - **trial**: 무료 체험 중
   - **active**: 구독 중
   - **expired**: 체험/구독 종료

---

### 10.3 구독 필요 여부 판단

| 상태       | 동작                                         |
|-----------|--------------------------------------------|
| active    | 오늘 탭 진입, 모든 기능 접근 가능             |
| trial     | 오늘 탭 진입, 모든 기능 접근 가능             |
| expired   | 전면 구독 화면 표시, 기록/입력 기능 차단     |

---

### 10.4 오늘 탭

- 선택한 고양이 기준으로 오늘 기록 입력 화면 노출
- 다묘 지원: 상단 고양이 선택 드롭다운
- 기록 입력:
  - 소변/배변/묽은 변/구토 +1 버튼
  - 약/영양제 체크
  - 수액 기록
  - 특이사항 메모

---

### 10.5 추가 UX 포인트

- **체험 종료 24시간 전**: 푸시 알림
- 오늘 탭 진입 시 **구독 만료 체크**
- 미구독 상태:
  - 기록, 차트, 캘린더 접근 불가
  - 구독 화면만 허용

---

### 10.6 플로우 요약

앱 실행
│
▼
로그인 상태 확인
│
├─ 로그인 안 됨 → 로그인 페이지
│
▼
로그인 성공
│
▼
구독 상태 확인 (subscription_state)
│
├─ active / trial → 오늘 탭 진입 (모든 기능 사용)
│
└─ expired → 전면 구독 화면 표시 (기록 차단)

