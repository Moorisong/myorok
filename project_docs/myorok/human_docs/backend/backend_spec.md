# ⚙️ 백엔드 아키텍처 및 API 명세 (`backend_spec.md`)

이 문서는 **묘록 (Myorok)**의 서버리스 백엔드(Next.js App Router API)의 아키텍처 구조, 보안 인증 체계, 그리고 모바일 앱과 통신하는 주요 API 엔드포인트 명세를 정의합니다.

---

## 🏗️ 1. 백엔드 아키텍처 패턴

웹 서비스 겸 백엔드는 Next.js의 Route Handlers를 활용한 **서버리스 API 패턴**으로 구현되어 있습니다.

```text
[모바일 클라이언트 (HTTP/HTTPS Fetch 요청)]
                 │
                 ▼
[Next.js App Router API: `src/app/api/...`]
                 │
        ┌────────┴────────┐
        ▼                 ▼
  [인증/인가 미들웨어]    [비즈니스 유틸리티] (`src/lib/comfort.ts` 등)
        │                 │
        └────────┬────────┘
                 │
                 ▼
  [MongoDB ODM: Mongoose]
                 │
                 ▼
     [클라우드 MongoDB 데이터베이스]
```

---

## 🔒 2. 인증 및 보안 아키텍처

### 🔑 카카오 로그인 및 JWT 발급 흐름
1. **OAuth 인증**: 모바일 앱에서 카카오 로그인을 성공하면 인가 코드(`code`)를 백엔드 `POST /api/auth/kakao`로 전달합니다.
2. **토큰 및 정보 요청**: 백엔드는 카카오 API 서버(`kauth.kakao.com`)와 통신하여 `access_token`을 획득하고, 다시 유저 정보(`kapi.kakao.com/v2/user/me`)를 조회해 `id`(카카오 고유 ID), `nickname`, `profileImage`를 추출합니다.
3. **JWT 발급**: 카카오 고유 ID를 페이로드에 포함하여 백엔드 고유 서명 값(`JWT_SECRET`)으로 암호화한 **JWT 토큰(30일 만료)**을 발급해 모바일 앱에 반환합니다.
4. **미들웨어 인증**: 사용자 조회가 필요한 API 요청 시 모바일 앱은 HTTP Headers에 `Authorization: Bearer <JWT_TOKEN>`을 실어 보냅니다. 백엔드는 토큰을 검증해 요청을 인가합니다.

### 🛡️ 관리자 권한
* `.env` 파일에 기록된 `ADMIN_KAKAO_IDS` 문자열에 카카오 ID가 매칭되는 경우 관리자(`isAdmin: true`) 플래그를 부여하고 디버그 및 관리자 대시보드 진입 권한을 해제합니다.

---

## 📋 3. 주요 API 엔드포인트 명세

### 1) 사용자 인증 및 기기 관리 (`/api/auth`, `/api/device`)
* **`POST /api/auth/kakao`**
  * **설명**: 카카오 인가 코드를 전달받아 JWT 토큰 및 회원 프로필 반환.
  * **Request**: `{ "code": "AUTHORIZATION_CODE" }`
  * **Response**: `{ "success": true, "token": "JWT_TOKEN", "user": { "id", "nickname", "profileImage", "isAdmin" } }`
* **`POST /api/device/register`**
  * **설명**: 기기 고유 ID 등록 및 푸시 알림 동의 기본 설정 조회/저장.
  * **Request**: `{ "deviceId": "DEVICE_UUID" }`
* **`POST /api/device/token`**
  * **설명**: Expo Push 알림 발송용 모바일 기기 토큰 등록/갱신.
  * **Request**: `{ "deviceId": "DEVICE_UUID", "pushToken": "EXPO_PUSH_TOKEN" }`

### 2) 쉼터 (커뮤니티) 서비스 (`/api/comfort`)
* **`GET /api/comfort/posts`**
  * **설명**: 자정이 지나지 않은 활성 게시글 목록 반환. 차단 사용자의 게시글/댓글 자동 필터링 및 숨김 처리 반영.
  * **Query Params**: `deviceId=DEVICE_ID`, `sort=latest|cheer|comment` (최신순, 응원순, 댓글순 정렬)
* **`POST /api/comfort/posts`**
  * **설명**: 익명 게시글 작성. 비속어 필터 적용 및 작성 Cooldown(1시간) 검증 수행.
  * **Request**: `{ "deviceId": "DEVICE_ID", "content": "내용", "emoji": "🐱" }`
* **`POST /api/comfort/posts/[id]/comments`**
  * **설명**: 게시글 내 익명 댓글 달기. (1분 10개, 5분 50개 도배 예외 처리 적용)
* **`POST /api/comfort/block`**
  * **설명**: 유저가 특정 `deviceId`를 차단하여 피드 및 댓글에서 차단 대상의 글 숨김.

### 3) 구독 및 결제 관리 (`/api/subscription`)
* **`POST /api/subscription/trial-start`**
  * **설명**: 최초 7일 무료체험 상태 등록.
* **`POST /api/subscription/sync`**
  * **설명**: 기기 내 구독 정보와 원격 MongoDB 구독 정보를 동기화.
* **`POST /api/subscription/verify-purchase`**
  * **설명**: Google Play Store 인앱 영수증 정보 검증 및 구독 상태 실시간 업데이트.
