# 🐾 반려묘 병상일지 앱 – 로컬 DB 명세 (SQLite, v1)

> **기준**
> - 앱의 모든 원본 데이터는 로컬 SQLite에 저장
> - **하루 1 row 원칙**
> - 삭제하지 않고 누적
> - 날짜 기준은 `YYYY-MM-DD`

---

## 1. pets

> 고양이 기본 정보 (v1에서는 1묘만 사용, 구조는 다묘 대비)

```sql
pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL
)
```

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

---

## 3. food_records

> 사료 기호성 기록

```sql
food_records (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  date TEXT NOT NULL,
  foodType TEXT NOT NULL, -- can | dry | etc
  preference TEXT NOT NULL, -- good | normal | reject
  comment TEXT,
  createdAt TEXT NOT NULL
)
```

---

## 4. supplements

> 약 / 영양제 정의 (라벨)

```sql
supplements (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- supplement | medicine
  createdAt TEXT NOT NULL
)
```

---

## 5. supplement_records

> 약 / 영양제 복용 체크

```sql
supplement_records (
  id TEXT PRIMARY KEY,
  supplementId TEXT NOT NULL,
  date TEXT NOT NULL,
  taken INTEGER NOT NULL DEFAULT 0
)
```

---

## 6. fluid_records

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

---

## 7. hospital_records

> 병원 방문 기록

```sql
hospital_records (
  id TEXT PRIMARY KEY,
  petId TEXT NOT NULL,
  date TEXT NOT NULL,
  memo TEXT,
  createdAt TEXT NOT NULL
)
```

---

## 8. custom_metrics

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

---

## 9. custom_metric_records

> 사용자 정의 수치 기록

```sql
custom_metric_records (
  id TEXT PRIMARY KEY,
  metricId TEXT NOT NULL,
  date TEXT NOT NULL,
  value REAL NOT NULL,
  memo TEXT,
  createdAt TEXT NOT NULL
)
```

---

## 9. 공통 설계 규칙

| 규칙 | 설명 |
|------|------|
| petId | 모든 테이블에 포함 |
| 날짜 | 문자열 `YYYY-MM-DD` 통일 |
| 삭제 | 하지 않음 |
| 무료/유료 제한 | 조회 레벨에서만 적용 |

---

## 10. 백업 대상 테이블

- `pets`
- `daily_records`
- `food_records`
- `supplements`
- `supplement_records`
- `hospital_records`
- `custom_metrics`
- `custom_metric_records`

> 위 테이블 전체를 JSON으로 export / import

---

## 요약

```
✅ SQLite = 단일 진실
✅ 백엔드 = 보관함
✅ 구조는 단순, 확장은 자유
```
