# 🐾 묘록 (Myorok)

**사랑으로 만든 환묘 상태 기록 앱**

반려묘의 건강 상태를 세심하게 기록하고 관리할 수 있는 모바일 앱입니다. 배변, 구토, 수분 섭취, 영양제 복용 등 일상적인 건강 지표를 추적하여 집사님들이 아이의 건강을 더 잘 돌볼 수 있도록 돕습니다.

---

## 📱 주요 기능

### 🏠 건강 기록 관리
- **일일 기록**: 배변(소변/배변/묽은 변), 구토, 수분 섭취량 기록
- **영양제/약물 관리**: 복용 체크리스트 및 메모
- **수액 기록**: 피하수액 투여량 기록
- **특이사항 메모**: 일일 건강 상태 기록

### 📊 데이터 시각화
- **차트 분석**: 건강 지표의 추세를 한눈에 파악
- **달력 뷰**: 월별 기록 조회 및 패턴 분석
- **통계**: 일/주/월 단위 건강 상태 요약

### 🐱 다묘 가구 지원
- 여러 마리의 고양이 프로필 관리
- 고양이별 독립적인 건강 기록
- 간편한 고양이 전환 기능

### 💬 쉼터 (커뮤니티)
- 익명 기반 집사 커뮤니티
- 고민 공유 및 위로의 공간
- 매일 자정 자동 삭제로 안전한 익명성 보장

### 🔔 스마트 알림
- 댓글 알림
- 미활동 기록 리마인더
- 구독 만료 안내 (체험 종료 24시간 전)

### ☁️ 데이터 백업 (예정)
- 클라우드 백업 및 복원
- 기기 간 데이터 동기화
- JSON 형식 데이터 내보내기/가져오기

---

## 🏗️ 프로젝트 구조

```
myorok/
├── apps/
│   ├── mobile/          # React Native + Expo 모바일 앱
│   ├── web/             # Next.js 웹 앱 (약관, 개인정보처리방침)
│   └── backend/         # 서버리스 백엔드 (예정)
├── packages/            # 공유 패키지 및 유틸리티
└── docs/               # 프로젝트 문서 및 명세
```

---

## 🛠️ 기술 스택

### Mobile App
- **프레임워크**: React Native (Expo 54)
- **라우팅**: Expo Router
- **상태 관리**: React Context API + Custom Hooks
- **데이터베이스**: SQLite (expo-sqlite)
- **인증**: Kakao OAuth 2.0
- **푸시 알림**: Firebase Cloud Messaging (FCM)
- **언어**: TypeScript

### Web App
- **프레임워크**: Next.js 16
- **스타일링**: CSS Modules
- **용도**: 이용약관, 개인정보처리방침, 선택적 데이터 삭제 안내

### 백엔드
- **프레임워크**: Express.js
- **언어**: TypeScript
- **인증**: Kakao OAuth 2.0
- **토큰**: JWT (JSON Web Token)
- **배포**: https://myorok.haroo.site
- **주요 기능**:
  - Kakao OAuth 인증 처리
  - JWT 토큰 발급 및 검증
  - 사용자 정보 조회
  - Health check API

---

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Android Studio (Android 개발 시)
- Xcode (iOS 개발 시)

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/Moorisong/myorok.git
cd myorok
```

### 2️⃣ 의존성 설치

```bash
npm install
```

### 3️⃣ 모바일 앱 실행

```bash
# Expo 개발 서버 시작
npm run mobile

# Android 에뮬레이터
npm run android --workspace=apps/mobile

# iOS 시뮬레이터 (macOS만 가능)
npm run ios --workspace=apps/mobile
```

### 4️⃣ 웹 앱 실행

```bash
npm run web
```

웹 앱은 `http://localhost:3001`에서 실행됩니다.

---

## 🔑 환경 설정

### Mobile App (`apps/mobile/.env`)

```env
# Kakao Login
EXPO_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key

# Server URL
EXPO_PUBLIC_SERVER_URL=https://your-server-url.com
```

### Firebase 설정 (Android Push Notifications)

1. Firebase Console에서 프로젝트 생성
2. `google-services.json` 다운로드
3. `apps/mobile/google-services.json`에 배치

---

## 💳 구독 및 결제

### 현재 상태
- **무료 체험**: 7일간 모든 기능 이용 가능
- **구독 가격**: 월 3,500원 (VAT 포함)
- **결제 플랫폼**: Google Play In-App Purchase

### 구독 상태
| 상태 | 설명 | 기능 접근 |
|------|------|-----------|
| `trial` | 7일 무료 체험 중 | 모든 기능 사용 가능 |
| `active` | 구독 중 | 모든 기능 사용 가능 |
| `expired` | 체험/구독 종료 | 기록 조회만 가능, 신규 입력 제한 |

### 결제 모듈 구현 계획

#### Google Play In-App Purchase
- **라이브러리**: `expo-in-app-purchases` (또는 최신 Expo IAP 라이브러리)
- **상품 ID**: `monthly_premium`
- **결제 방식**: 월 단위 자동 갱신
- **복원**: 앱 재설치 시 구독 상태 자동 복원

#### 구현 예정 기능
- [ ] Google Play Billing 연동
- [ ] 구독 상태 실시간 동기화
- [ ] 구독 해지/환불 안내 UI
- [ ] 결제 내역 조회
- [ ] 영수증 검증 (서버 측)

#### 구독 관리
- **구독 해지**: Google Play Store 앱에서 처리
- **환불 정책**: Google Play 정책 준수
- **자동 갱신**: Google Play에서 자동 처리

자세한 결제 구현 명세는 [`docs/planning/PAYMENT_SPEC.md`](docs/planning/PAYMENT_SPEC.md)를 참조하세요.

---

## 📂 주요 디렉토리 구조

### Mobile App

```
apps/mobile/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   │   ├── index.tsx      # 오늘 탭 (홈)
│   │   ├── calendar/      # 달력 탭
│   │   ├── chart/         # 차트 탭
│   │   ├── comfort/       # 쉼터 탭
│   │   └── settings/      # 설정 탭
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
├── constants/             # 상수 (색상, 폰트 등)
├── hooks/                 # Custom Hooks
├── services/              # 비즈니스 로직 및 데이터 서비스
│   ├── database.ts        # SQLite 데이터베이스
│   ├── auth.ts            # 인증 서비스
│   └── NotificationService.ts  # 푸시 알림
└── types/                 # TypeScript 타입 정의
```

### Web App

```
apps/web/
└── src/
    └── app/
        ├── terms/         # 이용약관
        ├── privacy/       # 개인정보처리방침
        └── partial-delete/ # 선택적 데이터 삭제 안내
```

---

## 🗃️ 데이터베이스 스키마

### 주요 테이블

#### `users`
사용자 정보 (Kakao 로그인)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 카카오 고유 ID (PK) |
| nickname | TEXT | 카카오 닉네임 |
| profileImage | TEXT | 프로필 이미지 URL |
| createdAt | TEXT | 최초 로그인 시각 |
| lastLogin | TEXT | 마지막 로그인 시각 |

#### `pets`
반려묘 프로필

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 고양이 ID (UUID) |
| userId | TEXT | 사용자 ID (FK) |
| name | TEXT | 고양이 이름 |
| createdAt | TEXT | 등록 일시 |

#### `daily_records`
일일 건강 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| petId | TEXT | 고양이 ID (FK) |
| date | TEXT | 기록 날짜 (YYYY-MM-DD) |
| peeCount | INTEGER | 소변 횟수 |
| poopCount | INTEGER | 배변 횟수 |
| softPoopCount | INTEGER | 묽은 변 횟수 |
| vomitCount | INTEGER | 구토 횟수 |
| notes | TEXT | 특이사항 메모 |

#### `subscription_state`
구독 상태 관리

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| userId | TEXT | 사용자 ID (FK) |
| trialStartDate | TEXT | 체험 시작일 |
| subscriptionStatus | TEXT | trial / active / expired |
| subscriptionExpiryDate | TEXT | 구독 만료일 |

자세한 스키마는 [`docs/planning/LOCAL_DB_SPEC.md`](docs/planning/LOCAL_DB_SPEC.md)를 참조하세요.

---

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: `#5DB075` (녹색)
- **Secondary**: `#F5F5F5` (연한 회색)
- **Text Primary**: `#1A1A1A`
- **Text Secondary**: `#999999`
- **Error**: `#FF3B30`

### 타이포그래피
- **Title**: 28px, Bold
- **Heading**: 20px, SemiBold
- **Body**: 16px, Regular
- **Caption**: 14px, Regular

자세한 디자인 시스템은 [`docs/planning/DESIGN_SYSTEM.md`](docs/planning/DESIGN_SYSTEM.md)를 참조하세요.

---

## 🔐 인증 및 보안

### 카카오 로그인
- **OAuth 2.0** 기반 인증
- **최소 정보 수집**: ID, 닉네임, 프로필 이미지만 저장
- **익명성 보장**: 쉼터(커뮤니티)는 완전 익명

### 데이터 보안
- 로컬 SQLite 데이터베이스 (기기 내 저장)
- 클라우드 백업 데이터 암호화 (예정)
- HTTPS 통신으로 데이터 전송 보호

### 개인정보 보호
- 이메일, 전화번호 등 개인 식별 정보 미수집
- 결제 정보는 Google Play에서 처리 (앱에서 미저장)
- 데이터 최소 수집 원칙 준수

자세한 내용은 [개인정보처리방침](https://myorok.vercel.app/privacy)을 참조하세요.

---

## 📱 빌드 및 배포

### Android APK 빌드

```bash
cd apps/mobile
eas build --platform android --profile preview
```

### Google Play Store 배포

```bash
eas submit --platform android
```

자세한 안드로이드 빌드 가이드는 [`docs/planning/ANDROID_BUILD_GUIDE.md`](docs/planning/ANDROID_BUILD_GUIDE.md)를 참조하세요.

---

## 🧪 테스트

### 개발 테스트 기능
- **구독 상태 시뮬레이션**: 설정 > Dev 섹션
- **체험 24시간 남음 설정**: 체험 종료 알림 테스트
- **구독 상태 리셋**: 구독 플로우 재테스트
- **테스트 데이터 생성**: 365일치 무작위 건강 기록 생성

---

## 📝 개발 가이드

### 코딩 컨벤션
- **언어**: TypeScript 사용
- **린팅**: ESLint 설정 준수
- **네이밍**: camelCase (변수/함수), PascalCase (컴포넌트/타입)

### Git 브랜치 전략
- `main`: 프로덕션 브랜치
- `dev`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 및 설정 변경
```

---

## 📚 문서

- [페이지 명세](docs/planning/PAGE_SPEC.md)
- [차트 명세](docs/planning/CHART_SPEC.md)
- [달력 명세](docs/planning/CALENDAR_SPEC.md)
- [쉼터(커뮤니티) 명세](docs/planning/COMFORT_SPEC.md)
- [알림 시스템 명세](docs/planning/NOTIFICATION_SPEC.md)
- [카카오 로그인 & 구독 명세](docs/planning/KAKAO_LOGIN_SUBSCRIPTION_SPEC.md)
- [결제 모듈 구현 명세](docs/planning/PAYMENT_SPEC.md)

---

## 🤝 기여하기

이 프로젝트는 개인 프로젝트이지만, 버그 리포트나 제안은 언제나 환영합니다!

1. 이슈 등록: [GitHub Issues](https://github.com/Moorisong/myorok/issues)
2. 포크 및 Pull Request 제출

---

## 💌 문의

- **이메일**: thiagooo@naver.com
- **개인정보 보호책임자**: thiagooo@naver.com

---

## 📲 다운로드

- **Google Play Store**: (출시 예정)
- **웹사이트**: https://myorok.vercel.app

---

<div align="center">

**🐾 묘록과 함께 우리 아이의 건강을 지켜주세요 🐾**

Made with 💓 for all 집사님들

</div>
