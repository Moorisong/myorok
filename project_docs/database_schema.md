# 🗄️ 데이터베이스 정의서 (`database_schema.md`)

이 문서는 **묘록 (Myorok)** 프로젝트에서 사용하는 클라이언트 사이드 로컬 SQLite 데이터베이스와 백엔드 서버사이드 MongoDB 데이터베이스의 상세 스키마 사양을 정의합니다.

---

## 📱 1. 클라이언트 로컬 SQLite 데이터베이스 명세

모바일 기기 내부의 `expo-sqlite`를 활용한 단일 온디바이스 DB 파일(`myorok.db`) 구조입니다.

### 1) `pets` (반려묘 프로필 테이블)
고양이 개별 프로필을 관리하며, 다묘 지원 기능의 중심이 됩니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 고양이 고유 식별자 (UUID) |
| `name` | TEXT | NOT NULL | 고양이 이름 |
| `createdAt` | TEXT | NOT NULL | 등록 일시 (ISO String) |
| `deletedAt` | TEXT | DEFAULT NULL | 삭제 일시 (Soft Delete 구현 필드) |

### 2) `daily_records` (일일 건강 기록 테이블)
고양이의 소변, 대변, 구토, 수액 및 일일 특이사항을 기록합니다.
* **하루 1 Row 규칙**: 동일 고양이(`petId`)에 대해 하루(`date`)에 단 하나의 행만 존재하도록 복합 유니크 인덱스를 지정합니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 레코드 고유 식별자 |
| `petId` | TEXT | NOT NULL, FK(`pets.id`) | 대상 고양이 ID |
| `date` | TEXT | NOT NULL | 기록 날짜 (`YYYY-MM-DD`) |
| `peeCount` | INTEGER | DEFAULT 0 | 소변 횟수 |
| `poopCount` | INTEGER | DEFAULT 0 | 정상 대변 횟수 |
| `diarrheaCount` | INTEGER | DEFAULT 0 | 묽은 변/설사 횟수 |
| `vomitCount` | INTEGER | DEFAULT 0 | 구토 횟수 |
| `vomitTypes` | TEXT | DEFAULT NULL | 구토 종류/색상 태그 (쉼표 등으로 구분 가능) |
| `waterIntake` | INTEGER | DEFAULT 0 | 자발적 수분 섭취량 (ml) |
| `memo` | TEXT | DEFAULT NULL | 일일 특이사항 메모 |
| `createdAt` | TEXT | NOT NULL | 생성 일시 (ISO String) |
| `updatedAt` | TEXT | NOT NULL | 최종 수정 일시 (ISO String) |

* **인덱스 및 제약**: `UNIQUE(petId, date)`

### 3) `supplements` (영양제/약물 정보 테이블)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 영양제 ID |
| `petId` | TEXT | NOT NULL | 고양이 ID |
| `name` | TEXT | NOT NULL | 영양제 이름 |
| `type` | TEXT | NOT NULL | 복용 형태/주기 정보 |
| `createdAt` | TEXT | NOT NULL | 등록 일시 |
| `deletedAt` | TEXT | DEFAULT NULL | 삭제 일시 (소프트 삭제) |

### 4) `supplement_records` (영양제 복용 체크 테이블)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 레코드 ID |
| `supplementId` | TEXT | NOT NULL, FK | 대상 영양제 ID |
| `date` | TEXT | NOT NULL | 복용 체크 날짜 (`YYYY-MM-DD`) |
| `taken` | INTEGER | DEFAULT 0 (boolean 대용) | 복용 여부 (0: 미복용, 1: 복용 완료) |

### 5) `fluid_records` (피하 수액 투여 기록 테이블)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 레코드 ID |
| `petId` | TEXT | NOT NULL | 고양이 ID |
| `date` | TEXT | NOT NULL | 수액 처치 날짜 (`YYYY-MM-DD`) |
| `fluidType` | TEXT | NOT NULL | 수액 종류 (하트만 등) |
| `volume` | INTEGER | DEFAULT 0 | 투여량 (ml) |
| `memo` | TEXT | DEFAULT NULL | 수액 처치 메모 |
| `createdAt` | TEXT | NOT NULL | 기록 일시 |

### 6) `custom_metrics` & `custom_metric_records` (커스텀 지표 정보 및 기록 테이블)
* **`custom_metrics`**: 유저가 직접 입력할 건강 인자 명칭(예: 체중, 혈압 등) 정의.
* **`custom_metric_records`**: 일자별 수치(`value`) 및 단위(`unit`) 기록.

---

## ☁️ 2. 서버사이드 MongoDB 컬렉션 명세

백엔드 서버(`apps/web`)에서 유저 장치 정보, 알림 수신 동의, 쉼터(커뮤니티) 게시물 및 구독 요금을 관리하기 위한 Mongoose 스키마 구조입니다.

### 1) `devices` (기기 정보 및 알림 설정 컬렉션)
* **`deviceId`**: String, Required, Unique (기기 UUID)
* **`pushToken`**: String (Expo Push Token 수신 값)
* **`settings`**: Object
  * `marketing`: Boolean, Default `false`
  * `comments`: Boolean, Default `true` (댓글 푸시 여부)
  * `inactivity`: Boolean, Default `true` (앱 미사용 72시간 리마인더 알림 수신 여부)
* **`createdAt` / `updatedAt`**: Date

### 2) `posts` (쉼터 익명 게시글 컬렉션)
* **`id`**: String, Required, Unique (게시글 고유 UUID)
* **`deviceId`**: String, Required (작성자 기기 ID)
* **`content`**: String, Required (욕설 필터 및 길이 필터가 적용된 본문)
* **`emoji`**: String, Default `'🐱'` (작성 시 선택한 카테고리/기분 이모지)
* **`likes`**: [String] (좋아요를 누른 `deviceId` 목록 배열)
* **`cheerCount`**: Number, Default `0` (응원 클릭 수)
* **`reportCount`**: Number, Default `0` (게시글 신고 횟수)
* **`reportedBy`**: [String] (신고를 실행한 `deviceId` 목록 배열)
* **`hidden`**: Boolean, Default `false` (신고 5회 초과 시 자동 숨김 전환 플래그)
* **`comments`**: Sub-document Array (`CommentSchema`)
  * `id`: String (댓글 고유 ID)
  * `deviceId`: String (댓글 작성자 기기 ID)
  * `content`: String (댓글 본문)
  * `createdAt` / `updatedAt`: String (ISO String)
  * `reportCount` / `reportedBy` / `hidden`: 신고 제어 속성
* **`createdAt` / `updatedAt`**: String (ISO 포맷팅 일관성을 위해 문자열 형식 유지)

### 3) `subscriptions` (유저 구독 상태 컬렉션)
* **`userId`**: String, Required, Unique, Indexed (카카오 사용자 고유 ID)
* **`deviceId`**: String, Default `'unknown'` (결제 시도 시점 기기 매칭용)
* **`status`**: String, Required, Enum[`trial`, `active`, `expired`, `subscribed`, `blocked`], Indexed
* **`trialStartDate`**: Date, Default `null`
* **`subscriptionStartDate`**: Date, Default `null`
* **`subscriptionExpiryDate`**: Date, Default `null`, Indexed
* **`forceExpired`**: Boolean, Default `false`
* **`createdAt` / `updatedAt`**: Date
