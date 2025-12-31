# Backend Architecture

## 1. 아키텍처 원칙

1. **Local First**: 모든 읽기/쓰기는 로컬 DB에서 수행
2. **Offline Ready**: 인터넷 연결 없이 100% 기능 사용 가능
3. **Sync When Online**: 백업은 사용자가 원할 때 명시적으로 수행 (또는 와이파이 연결 시 백그라운드)

## 2. 역할 정의

| 역할 | 설명 |
|------|------|
| **클라이언트 (App)** | 데이터 생성, 조회, 수정의 주체 (Source of Truth) |
| **서버 (Node.js)** | 단순 데이터 저장소 (Backup Storage) |
| **DB (MongoDB)** | JSON 덤프 데이터 보관 |

## 3. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 런타임 | Node.js |
| 프레임워크 | Express.js |
| DB | MongoDB (Mongoose) |
| 해시 | bcrypt (bcryptjs) |
| 언어 | TypeScript |
| 테스트 | Jest |

## 4. 백엔드 폴더 구조

```
backend/
├─ src/
│  ├─ app/                      # Express 앱 초기화 및 공통 미들웨어
│  │  └─ index.ts              # Express 앱 설정, CORS, body-parser 등
│  ├─ config/                   # 환경 변수 및 설정
│  │  ├─ db.ts                 # MongoDB 연결 설정
│  │  └─ server.ts             # 서버 포트, 환경 변수 등
│  ├─ controllers/              # 요청 처리 로직
│  │  ├─ backupController.ts   # 백업 업로드/다운로드 핸들러
│  │  ├─ pinController.ts      # PIN 설정/검증/해제 핸들러
│  │  └─ subscriptionController.ts  # 구독 상태 조회 핸들러
│  ├─ routes/                   # API 라우터
│  │  ├─ backupRoutes.ts       # POST /api/backup, GET /api/backup/:deviceId
│  │  ├─ pinRoutes.ts          # PIN 관련 API 라우팅
│  │  └─ subscriptionRoutes.ts # GET /api/subscription/status
│  ├─ models/                   # MongoDB 스키마
│  │  ├─ backupModel.ts        # backups 컬렉션 스키마
│  │  ├─ deviceModel.ts        # devices 컬렉션 스키마
│  │  ├─ notificationModel.ts  # notifications 컬렉션 스키마
│  │  ├─ pinModel.ts           # settings_security (PIN) 스키마
│  │  └─ subscriptionModel.ts  # subscriptions 컬렉션 스키마
│  ├─ services/                 # 비즈니스 로직, utils
│  │  ├─ backupService.ts      # 백업 데이터 검증, 변환 로직
│  │  ├─ pinService.ts         # bcrypt 해시, 잠금 로직
│  │  └─ subscriptionService.ts # 구독 검증 로직
│  ├─ middlewares/              # 인증, 오류 처리 등
│  │  └─ authMiddleware.ts     # deviceId 검증 (향후 확장)
│  └─ utils/                    # 공통 유틸 함수
│     └─ encryption.ts         # 암호화/복호화 유틸
├─ tests/                       # 단위 테스트
│  ├─ backup.test.ts
│  └─ pin.test.ts
├─ package.json
└─ tsconfig.json
```
