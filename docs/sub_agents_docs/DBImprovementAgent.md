# DB Improvement Agent Reference

## 목적
현재 SQLite 데이터베이스 구조의 안정성과 확장성을 개선하여 장기적인 데이터 무결성과 성능을 보장합니다.

---

## 🎯 개선 작업 목록

### Phase 1: 긴급 개선 사항 (현재 스프린트)

#### 1. Foreign Key 제약조건 활성화
**목적**: 참조 무결성 보장, 고아 레코드 방지

**구현 사항**:
```sql
-- database.ts 초기화 시 추가
PRAGMA foreign_keys = ON;
```

**영향 범위**:
- 모든 테이블의 참조 관계 검증 시작
- 부모 레코드 삭제 시 자동으로 자식 레코드 처리
- 데이터 무결성 향상

**주의사항**:
- 기존 데이터에 고아 레코드가 있으면 마이그레이션 실패 가능
- 마이그레이션 전 데이터 정합성 검증 필요

---

#### 2. supplement_records 테이블에 petId 추가
**목적**: 다묘 가구에서 데이터 접근 효율성 향상 및 데이터 정합성 보장

**현재 문제**:
```sql
-- 현재: petId 없음, JOIN 필수
SELECT sr.* FROM supplement_records sr
JOIN supplements s ON sr.supplementId = s.id
WHERE s.petId = ?
```

**개선 후**:
```sql
-- 개선: petId로 직접 필터링 가능
ALTER TABLE supplement_records ADD COLUMN petId TEXT NOT NULL;

-- 기존 데이터 마이그레이션
UPDATE supplement_records
SET petId = (
  SELECT petId FROM supplements
  WHERE supplements.id = supplement_records.supplementId
);
```

**장점**:
- 쿼리 성능 향상 (JOIN 불필요)
- supplement 삭제 시에도 petId 정보 유지
- 인덱스 생성 가능 (petId 기준 필터링 최적화)

**마이그레이션 체크리스트**:
1. ✅ 새 컬럼 추가 (`petId TEXT`)
2. ✅ 기존 데이터에 petId 채우기 (supplements 테이블 참조)
3. ✅ NOT NULL 제약조건 추가
4. ✅ 인덱스 생성 (`petId`, `supplementId`)

---

#### 3. custom_metric_records 테이블에 petId 추가
**목적**: supplement_records와 동일한 이유로 petId 추가

**현재 문제**:
```sql
-- 현재: petId 없음, JOIN 필수
SELECT cmr.* FROM custom_metric_records cmr
JOIN custom_metrics cm ON cmr.metricId = cm.id
WHERE cm.petId = ?
```

**개선 후**:
```sql
ALTER TABLE custom_metric_records ADD COLUMN petId TEXT NOT NULL;

-- 기존 데이터 마이그레이션
UPDATE custom_metric_records
SET petId = (
  SELECT petId FROM custom_metrics
  WHERE custom_metrics.id = custom_metric_records.metricId
);
```

**마이그레이션 체크리스트**:
1. ✅ 새 컬럼 추가 (`petId TEXT`)
2. ✅ 기존 데이터에 petId 채우기 (custom_metrics 테이블 참조)
3. ✅ NOT NULL 제약조건 추가
4. ✅ 인덱스 생성 (`petId`, `metricId`)

---

#### 4. 인덱스 생성
**목적**: 쿼리 성능 최적화

**생성할 인덱스**:
```sql
-- daily_records: petId + date 조합 조회가 가장 빈번
CREATE INDEX IF NOT EXISTS idx_daily_records_pet_date
ON daily_records(petId, date);

-- supplements: petId로 필터링
CREATE INDEX IF NOT EXISTS idx_supplements_pet
ON supplements(petId) WHERE deletedAt IS NULL;

-- supplement_records: supplementId와 petId 모두 필요
CREATE INDEX IF NOT EXISTS idx_supplement_records_supp
ON supplement_records(supplementId);

CREATE INDEX IF NOT EXISTS idx_supplement_records_pet
ON supplement_records(petId);

-- fluid_records: petId + date 조합
CREATE INDEX IF NOT EXISTS idx_fluid_records_pet_date
ON fluid_records(petId, date);

-- custom_metrics: petId로 필터링
CREATE INDEX IF NOT EXISTS idx_custom_metrics_pet
ON custom_metrics(petId);

-- custom_metric_records: metricId와 petId
CREATE INDEX IF NOT EXISTS idx_custom_metric_records_metric
ON custom_metric_records(metricId);

CREATE INDEX IF NOT EXISTS idx_custom_metric_records_pet
ON custom_metric_records(petId);

-- medication_memos: petId
CREATE INDEX IF NOT EXISTS idx_medication_memos_pet
ON medication_memos(petId) WHERE deletedAt IS NULL;

-- food_preference_memos: petId
CREATE INDEX IF NOT EXISTS idx_food_preference_memos_pet
ON food_preference_memos(petId) WHERE deletedAt IS NULL;
```

**성능 향상 예상**:
- 1,000건 미만: 체감 차이 없음
- 10,000건: 2-5배 속도 향상
- 100,000건: 10-50배 속도 향상

---

#### 5. 마이그레이션 버전 관리 시스템
**목적**: 체계적인 DB 스키마 관리 및 안전한 업데이트

**현재 문제**:
- 앱 시작 시마다 마이그레이션 체크 (PRAGMA table_info)
- 버전 추적 없음
- 롤백 불가능
- 실패 시 복구 어려움

**개선안**:
```sql
-- 마이그레이션 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  appliedAt TEXT NOT NULL,
  checksum TEXT -- 마이그레이션 내용 해시
);
```

**마이그레이션 함수 구조**:
```typescript
interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
  down: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'add_foreign_keys',
    up: async (db) => {
      await db.execAsync('PRAGMA foreign_keys = ON;');
    },
    down: async (db) => {
      await db.execAsync('PRAGMA foreign_keys = OFF;');
    }
  },
  {
    version: 2,
    name: 'add_petid_to_supplement_records',
    up: async (db) => {
      // petId 컬럼 추가 및 데이터 마이그레이션
    },
    down: async (db) => {
      // 롤백 로직
    }
  },
  // ... 더 많은 마이그레이션
];
```

**실행 로직**:
```typescript
async function runMigrations(db: SQLite.SQLiteDatabase) {
  // 1. schema_migrations 테이블 생성
  // 2. 현재 적용된 최신 버전 확인
  // 3. 미적용 마이그레이션 순차 실행
  // 4. 각 마이그레이션 성공 시 schema_migrations에 기록
  // 5. 실패 시 트랜잭션 롤백
}
```

---

## 📋 작업 순서

```
1. 마이그레이션 버전 시스템 구축 (기반 작업)
   ↓
2. Foreign Key 활성화 마이그레이션 작성
   ↓
3. petId 추가 마이그레이션 작성 (supplement_records)
   ↓
4. petId 추가 마이그레이션 작성 (custom_metric_records)
   ↓
5. 인덱스 생성 마이그레이션 작성
   ↓
6. 테스트 및 검증
   ↓
7. 배포
```

---

## 🧪 테스트 시나리오

### 1. 데이터 정합성 테스트
- [ ] 기존 데이터 백업 후 마이그레이션 실행
- [ ] supplement_records의 모든 행에 올바른 petId 할당 확인
- [ ] custom_metric_records의 모든 행에 올바른 petId 할당 확인
- [ ] 고아 레코드 존재 여부 확인

### 2. 성능 테스트
- [ ] 10,000건 이상 데이터에서 쿼리 속도 측정
- [ ] 인덱스 적용 전/후 비교
- [ ] 메모리 사용량 확인

### 3. Foreign Key 동작 테스트
- [ ] supplement 삭제 시 supplement_records 처리 확인
- [ ] custom_metric 삭제 시 custom_metric_records 처리 확인
- [ ] pet 삭제 시 관련 레코드 처리 확인

---

## ⚠️ 위험 요소 및 대응 방안

### 1. 기존 데이터 손실 위험
**대응**: 마이그레이션 전 자동 백업
```typescript
async function backupBeforeMigration() {
  const timestamp = new Date().toISOString();
  const backupPath = `${FileSystem.documentDirectory}backup_${timestamp}.db`;
  // SQLite 파일 복사
}
```

### 2. 마이그레이션 실패 시 앱 크래시
**대응**: try-catch 및 트랜잭션 사용
```typescript
async function safeMigration(db: SQLite.SQLiteDatabase, migration: Migration) {
  try {
    await db.execAsync('BEGIN TRANSACTION;');
    await migration.up(db);
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
```

### 3. 앱 업데이트 중 사용자 데이터 불일치
**대응**: 마이그레이션 중 UI 블로킹 및 진행률 표시
```typescript
// 마이그레이션 진행 중 스플래시 화면 표시
<MigrationScreen progress={migrationProgress} />
```

---

## 📊 예상 효과

| 항목 | 개선 전 | 개선 후 | 개선율 |
|------|---------|---------|--------|
| 데이터 무결성 | ⚠️ 중간 | ✅ 높음 | +80% |
| 쿼리 성능 (10K+ 레코드) | 🐢 느림 | 🚀 빠름 | +500% |
| 유지보수성 | ⚠️ 어려움 | ✅ 용이 | +200% |
| 확장성 | ⚠️ 제한적 | ✅ 우수 | +300% |

---

## 🔗 관련 파일

- `apps/mobile/services/database.ts` - 데이터베이스 초기화 및 마이그레이션
- `apps/mobile/services/supplements.ts` - supplement_records 관련 로직
- `apps/mobile/services/customMetrics.ts` - custom_metric_records 관련 로직
- `docs/specs/LOCAL_DB_SPEC.md` - 데이터베이스 명세 문서 (업데이트 필요)

---

## ✅ 완료 기준

1. ✅ 모든 마이그레이션이 성공적으로 실행됨
2. ✅ 기존 데이터가 손실 없이 유지됨
3. ✅ Foreign Key 제약조건이 활성화됨
4. ✅ supplement_records와 custom_metric_records에 petId가 추가되고 채워짐
5. ✅ 모든 인덱스가 생성됨
6. ✅ 쿼리 성능이 측정 가능하게 향상됨
7. ✅ 마이그레이션 버전 시스템이 정상 작동함
8. ✅ 테스트가 모두 통과함
9. ✅ 문서가 업데이트됨

---

## 📝 배포 후 모니터링

- [ ] Sentry/Crashlytics에서 마이그레이션 관련 오류 모니터링
- [ ] 사용자 피드백 수집 (성능 개선 체감 여부)
- [ ] 데이터베이스 크기 증가율 추적
- [ ] 쿼리 성능 메트릭 수집

---

## 📚 참고 자료

- SQLite Foreign Key Support: https://www.sqlite.org/foreignkeys.html
- SQLite Index: https://www.sqlite.org/lang_createindex.html
- React Native SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
