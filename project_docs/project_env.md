# 📝 프로젝트 환경 및 세팅 구성 (`project_env.md`)

이 문서는 **묘록 (Myorok)** 프로젝트를 다시 빌드하고 실행하기 위한 개발 환경 설정, 의존성 패키지 명세 및 환경 변수 사양을 기록합니다.

---

## 🛠️ 1. 런타임 및 개발 환경 사양

### ⚙️ 런타임 환경
* **Node.js**: `18.x` 이상 권장 (package.json 의존성 기반)
* **패키지 매니저**: `npm` (npm workspaces 사용)
* **언어**: `TypeScript` (v5.x)

### 📦 주요 프레임워크 버전
* **Mobile App (`apps/mobile`)**: React Native (`0.81.5`), Expo (`~54.0.30`), Expo Router (`~6.0.21`)
* **Web App & Backend (`apps/web`)**: Next.js (`16.1.1`), React (`19.2.3`), Mongoose (`^9.0.2`)

---

## 📦 2. 핵심 의존성 패키지 및 역할

### 📱 모바일 앱 (`apps/mobile`)
| 패키지명 | 버전 | 역할 요약 |
| :--- | :--- | :--- |
| `expo` | `~54.0.30` | Expo 개발 프레임워크 코어 |
| `expo-sqlite` | `~16.0.10` | 로컬 온디바이스 SQLite 데이터 저장 |
| `expo-router` | `~6.0.21` | 파일 시스템 기반의 화면 라우팅 시스템 |
| `expo-auth-session` | `~7.0.10` | 카카오 OAuth 2.0 사용자 인증 처리 |
| `expo-notifications` | `~0.32.15` | Firebase Cloud Messaging (FCM) 푸시 알림 수신 |
| `@react-native-async-storage/async-storage` | `^2.2.0` | 펫 선택 정보(selected_pet_id) 등 간단한 키-값 로컬 영속성 관리 |
| `react-native-svg` | `15.12.1` | 일일 기록 및 차트 그래픽 UI 렌더링용 SVG 컴포넌트 |

### 🌐 웹 앱 및 백엔드 (`apps/web`)
| 패키지명 | 버전 | 역할 요약 |
| :--- | :--- | :--- |
| `next` | `16.1.1` | Next.js 프레임워크 (App Router 기반 서버리스 API 및 정적 웹 화면) |
| `mongoose` | `^9.0.2` | MongoDB 데이터베이스 모델링 및 ODM 연동 |
| `jsonwebtoken` | `^9.0.3` | 카카오 인증 유저 세션 관리를 위한 JWT 토큰 발급 및 검증 |
| `expo-server-sdk` | `^4.0.0` | 모바일 앱 푸시 알림 전송을 위한 Expo Push 알림 서버 API 라이브러리 |
| `bcryptjs` | `^3.0.3` | 비밀 데이터 또는 해싱 연산을 위한 라이브러리 |
| `google-auth-library` | `^10.5.0` | 구글 API 인증 및 로그인 연동용 라이브러리 |

---

## 🚀 3. 로컬 개발 환경 구축 및 실행 레시피

### 1️⃣ 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/Moorisong/myorok.git
cd myorok
npm install
```

### 2️⃣ 모바일 앱 실행
```bash
# Expo 개발 서버 시작
npm run mobile

# 특정 플랫폼 시뮬레이터 직접 구동 (Workspace context 적용)
npm run android --workspace=apps/mobile
npm run ios --workspace=apps/mobile
```

### 3️⃣ 웹 및 API 백엔드 서버 실행
```bash
# 포트 3001에서 실행됨 (http://localhost:3001)
npm run web
```

---

## 🔑 4. 환경 변수(`.env`) 명세

### 📱 모바일 환경 설정 (`apps/mobile/.env`)
```env
# 백엔드 API 서버 기본 URL
EXPO_PUBLIC_API_URL=https://your-api-server-url.com

# Kakao Developer Console에서 발급받은 카카오 REST API 키
EXPO_KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

### 🌐 웹 및 백엔드 설정 (`apps/web/.env`)
```env
# API 서버 URL 설정
EXPO_PUBLIC_API_URL=https://your-api-server-url.com

# MongoDB 클러스터 연결 URI
MONGODB_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/myorok

# 카카오 로그인 REST API 인증키 및 시크릿
KAKAO_REST_API_KEY=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 카카오 인증 콜백 리다이렉트 URI
KAKAO_REDIRECT_URI=https://your-api-server-url.com/auth/kakao

# JWT 토큰 암호화 시크릿 키
JWT_SECRET=your_jwt_secret_key

# 관리자 계정 권한을 가질 카카오 회원 고유 ID 목록 (콤마 구분)
ADMIN_KAKAO_IDS=your_admin_kakao_id1,your_admin_kakao_id2
```
