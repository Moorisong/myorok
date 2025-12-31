# Kakao Login & Subscription Agent Reference

## 개요
카카오 로그인 및 월 구독 기능 구현을 위한 서브 에이전트입니다.
앱하루는 로컬 SQLite 기반의 다묘 병상일지 앱으로, 사용자 식별 및 월 구독 결제를 위해 카카오 로그인을 필수로 합니다.

---

## 🎯 모듈화 구조 (병렬 처리 가능)

### Phase 1: 독립 모듈 (동시 작업 가능) ⚡

```
┌─────────────────────────────────────────────────────────────────────┐
│  Module A: DB Migration      │  Module B: Kakao SDK    │  Module C: UI Components  │
│  ────────────────────       │  ───────────────────   │  ─────────────────────────  │
│  • users 테이블 생성          │  • OAuth2 연동          │  • LoginScreen             │
│  • subscription_state 확장    │  • 토큰 관리            │  • SubscriptionStatus      │
│  • userId 컬럼 추가           │  • 세션 관리            │  • SubscriptionPopup       │
│  의존성: 없음                  │  의존성: 없음           │  의존성: 없음                │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: 서비스 모듈 (Phase 1 완료 후 동시 작업 가능)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Module D: User Service              │  Module E: Subscription Service    │
│  ─────────────────────────          │  ──────────────────────────────   │
│  • loginWithKakao()                  │  • getSubscriptionStatus()         │
│  • logout()                          │  • startTrial()                    │
│  • getUser()                         │  • activateSubscription()          │
│  • updateLastLogin()                 │  • expireSubscription()            │
│  의존성: Module A, B                  │  의존성: Module A                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 3: 통합 (Phase 2 완료 후)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Module F: Integration & Testing                                    │
│  ───────────────────────────────                                   │
│  • UI ↔ Service 연결                                                │
│  • 플로우 테스트                                                     │
│  • 예외 처리 검증                                                    │
│  의존성: Module C, D, E                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module A: DB Migration

### 참조 파일
- `apps/mobile/services/migrations/migrationManager.ts`
- `apps/mobile/services/migrations/migrations.ts`

### 신규 파일
- `apps/mobile/services/migrations/v2_add_users_table.ts`

### 스키마 정의

#### users 테이블
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,        -- 카카오 고유 ID
  nickname TEXT,              -- 카카오 닉네임
  profileImage TEXT,          -- 프로필 이미지 URL
  createdAt TEXT NOT NULL,    -- 최초 로그인 시각
  lastLogin TEXT NOT NULL     -- 마지막 로그인 시각
);
```

#### subscription_state 테이블 확장
```sql
ALTER TABLE subscription_state ADD COLUMN userId TEXT REFERENCES users(id);
```

#### 기존 테이블 userId 추가
```sql
-- 모든 데이터 테이블에 userId 컬럼 추가
ALTER TABLE pets ADD COLUMN userId TEXT;
ALTER TABLE daily_records ADD COLUMN userId TEXT;
ALTER TABLE supplements ADD COLUMN userId TEXT;
-- ... (나머지 테이블도 동일)
```

### 구현 체크리스트
- [ ] Migration 파일 생성 (`v2_add_users_table.ts`)
- [ ] `users` 테이블 생성 쿼리
- [ ] `subscription_state`에 `userId` 추가
- [ ] 기존 테이블에 `userId` 컬럼 추가
- [ ] Migration 등록 (`migrations.ts`에 추가)

---

## Module B: Kakao SDK

### 신규 파일
- `apps/mobile/services/auth/kakaoAuth.ts`

### 패키지 설치
```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

### API 정의

```typescript
// apps/mobile/services/auth/kakaoAuth.ts

export interface KakaoUser {
  id: string;
  nickname: string;
  profileImage?: string;
}

/**
 * 카카오 OAuth2 인증 수행
 * @returns 인증된 사용자 정보
 */
export async function authenticateWithKakao(): Promise<KakaoUser>;

/**
 * 카카오 로그아웃
 */
export async function logoutFromKakao(): Promise<void>;

/**
 * 현재 인증 상태 확인
 */
export async function getAuthSession(): Promise<KakaoUser | null>;
```

### 구현 체크리스트
- [ ] expo-auth-session 설치 및 설정
- [ ] 카카오 개발자 콘솔 앱 설정
- [ ] `authenticateWithKakao()` 구현
- [ ] `logoutFromKakao()` 구현
- [ ] `getAuthSession()` 구현
- [ ] 에러 핸들링

---

## Module C: UI Components

### 신규 파일
- `apps/mobile/components/auth/LoginScreen.tsx`
- `apps/mobile/components/subscription/SubscriptionStatus.tsx`
- `apps/mobile/components/subscription/SubscriptionPopup.tsx`

### LoginScreen

```typescript
// apps/mobile/components/auth/LoginScreen.tsx

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
}

/**
 * 로그인 화면 컴포넌트
 * - 카카오 로그인 버튼 (노란색, 카카오 디자인 가이드 준수)
 * - 안내 문구: "월 구독 결제로 앱하루를 이용하려면 로그인하세요."
 */
export function LoginScreen({ onLoginSuccess }: LoginScreenProps): JSX.Element;
```

### SubscriptionStatus

```typescript
// apps/mobile/components/subscription/SubscriptionStatus.tsx

interface SubscriptionStatusProps {
  status: 'trial' | 'active' | 'expired';
  daysRemaining?: number;
  expiryDate?: string;
  onSubscribe?: () => void;
}

/**
 * 구독 상태 표시 컴포넌트
 * - trial: "무료 체험 중 (N일 남음)"
 * - active: "구독 중 (YYYY-MM-DD까지)"
 * - expired: "구독 만료" + 결제 유도 버튼
 */
export function SubscriptionStatus(props: SubscriptionStatusProps): JSX.Element;
```

### SubscriptionPopup

```typescript
// apps/mobile/components/subscription/SubscriptionPopup.tsx

interface SubscriptionPopupProps {
  visible: boolean;
  onSubscribe: () => void;
  onDismiss: () => void;
}

/**
 * 구독 만료 팝업 컴포넌트
 * - "구독하기" / "나중에" 버튼
 */
export function SubscriptionPopup(props: SubscriptionPopupProps): JSX.Element;
```

### 구현 체크리스트
- [ ] LoginScreen 레이아웃 구현
- [ ] 카카오 로그인 버튼 스타일링
- [ ] SubscriptionStatus 컴포넌트 구현
- [ ] SubscriptionPopup 컴포넌트 구현

---

## Module D: User Service

### 신규 파일
- `apps/mobile/services/auth/userService.ts`

### API 정의

```typescript
// apps/mobile/services/auth/userService.ts

export interface User {
  id: string;
  nickname: string;
  profileImage?: string;
  createdAt: string;
  lastLogin: string;
}

/**
 * 카카오 로그인 수행 및 사용자 DB 저장
 * - 신규 유저: INSERT + startTrial()
 * - 기존 유저: updateLastLogin()
 */
export async function loginWithKakao(): Promise<string>;

/**
 * 로그아웃
 * - userId 제거 (로컬 세션)
 * - 로컬 pet 데이터 유지
 */
export async function logout(): Promise<void>;

/**
 * 사용자 정보 조회
 */
export async function getUser(userId: string): Promise<User | null>;

/**
 * 마지막 로그인 시각 갱신
 */
export async function updateLastLogin(userId: string): Promise<void>;

/**
 * 현재 로그인된 사용자 ID 조회
 */
export async function getCurrentUserId(): Promise<string | null>;
```

### 구현 체크리스트
- [ ] `loginWithKakao()` 구현 (Module B 사용)
- [ ] `logout()` 구현
- [ ] `getUser()` 구현 (Module A 사용)
- [ ] `updateLastLogin()` 구현
- [ ] `getCurrentUserId()` 구현 (AsyncStorage)

---

## Module E: Subscription Service

### 수정 파일
- `apps/mobile/services/subscription.ts` (기존 파일 확장)

### API 정의 (추가)

```typescript
// apps/mobile/services/subscription.ts 확장

/**
 * 사용자별 구독 상태 조회
 */
export async function getSubscriptionStatusForUser(userId: string): Promise<SubscriptionState>;

/**
 * 무료 체험 시작 (사용자별)
 */
export async function startTrialForUser(userId: string): Promise<void>;

/**
 * 구독 활성화 (사용자별)
 */
export async function activateSubscriptionForUser(
  userId: string,
  startDate: string,
  expiryDate: string
): Promise<void>;

/**
 * 구독 만료 처리 (사용자별)
 */
export async function expireSubscriptionForUser(userId: string): Promise<void>;
```

### 구현 체크리스트
- [ ] 기존 함수에 userId 파라미터 추가
- [ ] `getSubscriptionStatusForUser()` 구현
- [ ] `startTrialForUser()` 구현
- [ ] `activateSubscriptionForUser()` 구현
- [ ] `expireSubscriptionForUser()` 구현

---

## Module F: Integration

### 수정 파일
- `apps/mobile/app/_layout.tsx` (앱 진입점)
- `apps/mobile/app/(tabs)/settings/index.tsx` (설정 페이지)

### 플로우 구현

#### 앱 실행 플로우
```
앱 실행 → getCurrentUserId() 확인
  ↓
[null] → LoginScreen 표시
[userId] → getSubscriptionStatusForUser(userId) 확인
  ↓
[expired] → SubscriptionPopup 표시
[trial/active] → 메인 화면 진입
```

#### 로그인 플로우
```
LoginScreen → loginWithKakao()
  ↓
[신규] → startTrialForUser(userId)
[기존] → updateLastLogin(userId)
  ↓
메인 화면 이동
```

### 구현 체크리스트
- [ ] _layout.tsx에 인증 상태 체크 추가
- [ ] 로그인 화면 라우팅 추가
- [ ] 설정 페이지에 SubscriptionStatus 추가
- [ ] 로그아웃 버튼 추가
- [ ] 구독 만료 팝업 연동

---

## 예외 처리

| 상황 | 처리 |
|------|------|
| 카카오 로그인 실패 | Alert: "로그인에 실패했습니다. 다시 시도해주세요." |
| 네트워크 오류 | Alert: "네트워크 연결을 확인해주세요." |
| DB 마이그레이션 실패 | 로그 기록 + 이전 버전 유지 |
| 구독 상태 불일치 | 로컬 DB 재동기화 |

---

## 보안 정책

- 카카오 OAuth2 표준 준수
- 로컬 DB 암호화 권장 (expo-secure-store)
- 개인정보 최소화: ID, 닉네임, 프로필 이미지만 저장
- 로그아웃 시 userId 제거, 구독/데이터 접근 차단

---

## 파일 구조 요약

```
apps/mobile/
├── services/
│   ├── auth/
│   │   ├── kakaoAuth.ts        # [B] 카카오 SDK 연동
│   │   └── userService.ts      # [D] 사용자 관리
│   ├── subscription.ts         # [E] 구독 관리 (확장)
│   └── migrations/
│       └── v2_add_users_table.ts  # [A] DB 마이그레이션
├── components/
│   ├── auth/
│   │   └── LoginScreen.tsx     # [C] 로그인 UI
│   └── subscription/
│       ├── SubscriptionStatus.tsx   # [C] 구독 상태
│       └── SubscriptionPopup.tsx    # [C] 구독 팝업
└── app/
    ├── _layout.tsx             # [F] 인증 체크 (수정)
    └── (tabs)/settings/
        └── index.tsx           # [F] 구독 상태 표시 (수정)
```

---

## 작업 순서 권장

### 🟢 Phase 1 (병렬 가능: 3명 동시 작업)
1. **Module A** 담당: DB 마이그레이션
2. **Module B** 담당: 카카오 SDK 연동
3. **Module C** 담당: UI 컴포넌트 (껍데기)

### 🟡 Phase 2 (병렬 가능: 2명 동시 작업)
4. **Module D** 담당: 사용자 관리 서비스
5. **Module E** 담당: 구독 관리 서비스

### 🔵 Phase 3
6. **Module F** 담당: 통합 및 테스트

---

## 참조 문서

- [KAKAO_LOGIN_SUBSCRIPTION_SPEC.md](file:///Users/shkim/Desktop/Project/myorok/docs/planning/KAKAO_LOGIN_SUBSCRIPTION_SPEC.md)
- [LOCAL_DB_SPEC.md](file:///Users/shkim/Desktop/Project/myorok/docs/planning/LOCAL_DB_SPEC.md)
