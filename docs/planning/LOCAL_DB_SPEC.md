# 🐾 반려묘 병상일지 앱 – 로컬 DB 명세 (SQLite, v2)

> **기준**
> - 앱의 모든 원본 데이터는 로컬 SQLite에 저장
> - **하루 1 row 원칙**
> - 삭제하지 않고 누적
> - 날짜 기준은 `YYYY-MM-DD`

---

## 1. pets

> 고양이 기본 정보 (다묘 지원)

```sql
pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  deletedAt TEXT -- 소프트 삭제 타임스탬프 (NULL = 활성 상태)
)
```

**다묘 지원:**
- 여러 마리 등록 가능 (각각 고유 ID)
- 삭제 시 하드 삭제하지 않고 `deletedAt`에 타임스탬프 저장
- 삭제된 고양이의 기록은 유지, UI에서 숨김 처리
- 복원 기능 제공 가능

---

## 2. daily_records

> 기본 컨디션 기록 (누적 카운트)

```sql
daily_records (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  date TEXT NOT NULL,
  peeCount INTEGER DEFAULT 0,
  poopCount INTEGER DEFAULT 0,
  diarrheaCount INTEGER DEFAULT 0,
  vomitCount INTEGER DEFAULT 0,
  vomitTypes TEXT, -- JSON array ["clear","white","food"]
  waterIntake INTEGER DEFAULT 0, -- 자발적 음수량 (ml)
  memo TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(petId, date)
)
```

**인덱스:** `idx_daily_records_pet_date` ON (petId, date)

---

## 3. supplements

> 약 / 영양제 정의 (라벨)

```sql
supplements (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- supplement | medicine
  createdAt TEXT NOT NULL,
  deletedAt TEXT -- 소프트 삭제 타임스탬프 (NULL = 활성 상태)
)
```

**삭제 정책:**
- 하드 삭제하지 않고 `deletedAt`에 타임스탬프 저장
- 과거 복용 기록(`supplement_records`)은 완전히 유지
- 삭제된 항목은 "오늘 복용 체크"에서 제외, 차트/캘린더에서는 "삭제됨" 배지 표시

**인덱스:** `idx_supplements_pet` ON (petId) WHERE deletedAt IS NULL

---

## 4. supplement_records

> 약 / 영양제 복용 체크

```sql
supplement_records (
  id TEXT PRIMARY KEY,
  supplementId TEXT NOT NULL,
  petId TEXT NOT NULL, -- v2에서 추가됨
  date TEXT NOT NULL,
  taken INTEGER NOT NULL DEFAULT 0
)
```

**인덱스:**
- `idx_supplement_records_pet` ON (petId)
- `idx_supplement_records_supp` ON (supplementId)

---

## 5. fluid_records

> 수액 및 강수 기록 (개별 기록)

```sql
fluid_records (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  date TEXT NOT NULL,
  fluidType TEXT NOT NULL, -- subcutaneous | iv | force
  volume INTEGER, -- ml
  memo TEXT,
  createdAt TEXT NOT NULL
)
```

**인덱스:** `idx_fluid_records_pet_date` ON (petId, date)

---

## 6. custom_metrics

> 사용자 정의 수치 항목

```sql
custom_metrics (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  name TEXT NOT NULL, -- 예: BUN, CREA
  unit TEXT, -- mg/dL 등
  createdAt TEXT NOT NULL
)
```

**인덱스:** `idx_custom_metrics_pet` ON (petId)

---

## 7. custom_metric_records

> 사용자 정의 수치 기록

```sql
custom_metric_records (
  id TEXT PRIMARY KEY,
  metricId TEXT NOT NULL,
  petId TEXT NOT NULL, -- v2에서 추가됨
  date TEXT NOT NULL,
  value REAL NOT NULL,
  memo TEXT,
  createdAt TEXT NOT NULL
)
```

**인덱스:**
- `idx_custom_metric_records_pet` ON (petId)
- `idx_custom_metric_records_metric` ON (metricId)

---

## 8. medication_memos

> 약물 메모 보관 (참고용)

```sql
medication_memos (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  medicationName TEXT NOT NULL,
  memo TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT -- 소프트 삭제
)
```

**인덱스:** `idx_medication_memos_pet` ON (petId) WHERE deletedAt IS NULL

---

## 9. food_preference_memos

> 사료 기호성 메모 보관 (참고용)

```sql
food_preference_memos (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  foodName TEXT NOT NULL,
  foodType TEXT NOT NULL, -- can | dry | etc
  memo TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT -- 소프트 삭제
)
```

**인덱스:** `idx_food_preference_memos_pet` ON (petId) WHERE deletedAt IS NULL

---

## 10. subscription_state

> 구독 상태 관리 (싱글톤)

```sql
subscription_state (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- 항상 1개만 존재
  trialStartDate TEXT NOT NULL,
  subscriptionStatus TEXT NOT NULL, -- trial | active | expired
  subscriptionStartDate TEXT,
  subscriptionExpiryDate TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

---

## 11. schema_migrations

> 마이그레이션 이력 추적

```sql
schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  appliedAt TEXT NOT NULL,
  checksum TEXT
)
```

---

## 12. 공통 설계 규칙

| 규칙 | 설명 |
|------|------|
| petId | 모든 테이블에 포함 (다묘 지원) |
| 날짜 | 문자열 `YYYY-MM-DD` 통일 |
| 삭제 | 하지 않음 (소프트 삭제만) |
| 구독 정책 | 7일 체험 후 구독 필요 (기능 차별 없음) |
| 다묘 필터 | 모든 조회는 petId 기준 |
| 인덱스 | 주요 조회 패턴에 맞춰 자동 생성 |

---

## 13. 백업 대상 테이블

- `pets` (deletedAt 포함)
- `daily_records`
- `supplements`
- `supplement_records`
- `fluid_records`
- `custom_metrics`
- `custom_metric_records`
- `medication_memos`
- `food_preference_memos`

> 위 테이블 전체를 JSON으로 export / import
>
> **다묘 지원**: petId별로 데이터 분리되어 백업됨

---

## 14. v1 → v2 마이그레이션 변경사항

| 변경 사항 | 설명 |
|----------|------|
| `supplement_records.petId` 추가 | 다묘 환경에서 빠른 조회를 위한 비정규화 |
| `custom_metric_records.petId` 추가 | 다묘 환경에서 빠른 조회를 위한 비정규화 |
| `food_records` 삭제 | `food_preference_memos`로 대체 |
| `hospital_records` 삭제 | 사용하지 않음 |
| `medication_memos` 추가 | 약물 메모 보관 기능 |
| `food_preference_memos` 추가 | 사료 기호성 메모 보관 기능 |
| `subscription_state` 추가 | 구독 상태 관리 |
| 성능 인덱스 추가 | 주요 조회 패턴 최적화 |

---

## 15. 데이터 초기화 기능

> 설정 탭에서 제공하는 초기화 버튼을 통해 로컬 DB 데이터를 삭제하는 기능

### 15.1 기능 개요

| 항목 | 설명 |
|------|------|
| 위치 | 설정 탭 > 데이터 초기화 |
| 목적 | 앱 내 기록 데이터 전체 삭제 |
| 구독 상태 | 유지 (trial/active/expired 등 삭제하지 않음) |
| 백업 | 제공하지 않음 (초기화 후 복구 불가) |
| 삭제 방식 | 하드 삭제 (`deletedAt` 소프트 삭제 무시) |

### 15.2 컨펌 메시지

```
⚠️ 초기화를 진행하면 모든 기록이 삭제됩니다.
구독 상태는 유지되며, 삭제된 데이터는 복구할 수 없습니다.
정말 초기화하시겠습니까?
```

| 버튼 | 동작 |
|------|------|
| 취소 | 아무 작업도 수행하지 않음 |
| 확인 | 데이터 삭제 수행 |

### 15.3 삭제 대상 테이블

| 테이블명 | 삭제 여부 | 비고 |
|----------|----------|------|
| daily_records | ✅ 삭제 | 기본 컨디션 기록 |
| supplements | ✅ 삭제 | 약/영양제 정의 |
| supplement_records | ✅ 삭제 | 약/영양제 복용 기록 |
| fluid_records | ✅ 삭제 | 수액/강수 기록 |
| custom_metrics | ✅ 삭제 | 사용자 정의 수치 항목 |
| custom_metric_records | ✅ 삭제 | 사용자 정의 수치 기록 |
| medication_memos | ✅ 삭제 | 약물 메모 |
| food_preference_memos | ✅ 삭제 | 사료 기호성 메모 |
| pets | ❌ 유지 | 고양이 정보는 유지 |
| subscription_state | ❌ 유지 | 구독 상태는 유지 |
| schema_migrations | ❌ 유지 | 마이그레이션 이력 유지 |

### 15.4 초기화 SQL

```sql
-- 데이터 초기화 (하드 삭제)
DELETE FROM daily_records;
DELETE FROM supplements;
DELETE FROM supplement_records;
DELETE FROM fluid_records;
DELETE FROM custom_metrics;
DELETE FROM custom_metric_records;
DELETE FROM medication_memos;
DELETE FROM food_preference_memos;
-- pets, subscription_state, schema_migrations는 삭제하지 않음
```

### 15.5 주의 사항

| 항목 | 설명 |
|------|------|
| 복원 불가 | 초기화 전 백업 기능 없음, 데이터 영구 삭제 |
| 버튼 강조 | 사용자 실수 방지를 위해 위험 표시 (Error 컬러) |
| 구독 유지 | trial/active/expired 상태 그대로 유지 |
| 고양이 정보 | 등록된 고양이 정보는 삭제되지 않음 |

---

## 요약

```
✅ SQLite = 단일 진실
✅ 백엔드 = 보관함
✅ 구조는 단순, 확장은 자유
✅ 마이그레이션 시스템으로 스키마 버전 관리
```
