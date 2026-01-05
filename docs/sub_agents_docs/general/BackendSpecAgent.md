# 백엔드 스펙 에이전트 참조 (Backend Spec Agent Reference)

> 백엔드 명세가 `docs/backend/` 디렉토리로 모듈화되었습니다.
> 상세 내용은 아래의 각 파일을 참고해주세요.

## 1. 개요 (Overview)
**디렉토리**: `docs/backend/`

| 파일 | 내용 |
|------|---------|
| [index.md](../backend/index.md) | 소개 및 전체 목차 |
| [architecture.md](../backend/architecture.md) | 아키텍처 원칙, 기술 스택, 폴더 구조 |
| [security.md](../backend/security.md) | 보안 정책, PIN 잠금 명세 |
| [database-local.md](../backend/database-local.md) | 로컬 DB (SQLite) 요약 스키마 |

## 2. 모델 (MongoDB Schema)
**디렉토리**: `docs/backend/src/models/`

| 파일 | 컬렉션 / 용도 |
|------|---------------------|
| [backupModel.md](../backend/src/models/backupModel.md) | `backups` - SQLite 백업 데이터 저장 |
| [pinModel.md](../backend/src/models/pinModel.md) | `settings_security` - PIN 해시 및 잠금 상태 |
| [deviceModel.md](../backend/src/models/deviceModel.md) | `devices` - 푸시 알림 토큰 |
| [notificationModel.md](../backend/src/models/notificationModel.md) | `notifications` - 알림 발송 이력 |
| [subscriptionModel.md](../backend/src/models/subscriptionModel.md) | `subscriptions` - 구독 결제 상태 |

## 3. 컨트롤러 및 API
**디렉토리**: `docs/backend/src/controllers/`

| 파일 | API 라우트 |
|------|------------|
| [backupController.md](../backend/src/controllers/backupController.md) | `POST /api/backup`, `GET /api/backup/:id` |
| [pinController.md](../backend/src/controllers/pinController.md) | `POST /settings/pin`, `VERIFY`, `DELETE` |
| [subscriptionController.md](../backend/src/controllers/subscriptionController.md) | `GET /subscription/status` |

## 4. 서비스 (Business Logic)
**디렉토리**: `docs/backend/src/services/`

| 파일 | 담당 역할 |
|------|----------------|
| [backupService.md](../backend/src/services/backupService.md) | 데이터 검증, 형식 변환 |
| [pinService.md](../backend/src/services/pinService.md) | 해싱 (bcrypt), 잠금 로직 |

---

## 5. 폴더 구조 참조
```
backend/
├─ src/
│  ├─ app/
│  ├─ config/
│  ├─ controllers/
│  ├─ routes/
│  ├─ models/
│  ├─ services/
│  ├─ middlewares/
│  └─ utils/
├─ tests/
├─ package.json
└─ tsconfig.json
```
