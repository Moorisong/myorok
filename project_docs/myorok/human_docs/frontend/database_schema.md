# 📱 모바일 로컬 데이터베이스 명세 (`database_schema.md`)

이 문서는 **묘록 (Myorok)** 앱 클라이언트 사이드의 온디바이스 로컬 SQLite 데이터베이스(`expo-sqlite`) 상세 스키마 사양을 정의합니다.

---

## 1. `pets` (반려묘 프로필 테이블)
고양이 개별 프로필을 관리하며, 다묘 지원 기능의 중심이 됩니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 고양이 고유 식별자 (UUID) |
| `name` | TEXT | NOT NULL | 고양이 이름 |
| `createdAt` | TEXT | NOT NULL | 등록 일시 (ISO String) |
| `deletedAt` | TEXT | DEFAULT NULL | 삭제 일시 (Soft Delete 구현 필드) |

## 2. `daily_records` (일일 건강 기록 테이블)
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

## 3. `supplements` (영양제/약물 정보 테이블)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 영양제 ID |
| `petId` | TEXT | NOT NULL | 고양이 ID |
| `name` | TEXT | NOT NULL | 영양제 이름 |
| `type` | TEXT | NOT NULL | 복용 형태/주기 정보 |
| `createdAt` | TEXT | NOT NULL | 등록 일시 |
| `deletedAt` | TEXT | DEFAULT NULL | 삭제 일시 (소프트 삭제) |

## 4. `supplement_records` (영양제 복용 체크 테이블)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 레코드 ID |
| `supplementId` | TEXT | NOT NULL, FK | 대상 영양제 ID |
| `date` | TEXT | NOT NULL | 복용 체크 날짜 (`YYYY-MM-DD`) |
| `taken` | INTEGER | DEFAULT 0 (boolean 대용) | 복용 여부 (0: 미복용, 1: 복용 완료) |

## 5. `fluid_records` (피하 수액 투여 기록 테이블)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 레코드 ID |
| `petId` | TEXT | NOT NULL | 고양이 ID |
| `date` | TEXT | NOT NULL | 수액 처치 날짜 (`YYYY-MM-DD`) |
| `fluidType` | TEXT | NOT NULL | 수액 종류 (하트만 등) |
| `volume` | INTEGER | DEFAULT 0 | 투여량 (ml) |
| `memo` | TEXT | DEFAULT NULL | 수액 처치 메모 |
| `createdAt` | TEXT | NOT NULL | 기록 일시 |

## 6. `custom_metrics` & `custom_metric_records` (커스텀 지표 정보 및 기록 테이블)
* **`custom_metrics`**: 유저가 직접 입력할 건강 인자 명칭(예: 체중, 혈압 등) 정의.
* **`custom_metric_records`**: 일자별 수치(`value`) 및 단위(`unit`) 기록.
