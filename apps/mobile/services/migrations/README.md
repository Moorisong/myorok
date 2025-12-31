# 데이터베이스 마이그레이션 시스템

묘록 모바일 앱의 SQLite 데이터베이스를 위한 강력한 마이그레이션 버전 관리 시스템입니다.

## 개요

이 마이그레이션 시스템은 다음을 제공합니다:
- **버전 추적**: `schema_migrations` 테이블을 통해 어떤 마이그레이션이 적용되었는지 추적
- **트랜잭션 안전성**: 각 마이그레이션을 트랜잭션으로 감싸서 실패 시 자동 롤백
- **자동 백업**: 마이그레이션 실행 전 데이터베이스 백업 자동 생성
- **롤백 지원**: `down` 함수를 사용하여 마이그레이션 롤백 가능
- **진행률 추적**: 마이그레이션 진행 상황 모니터링을 위한 콜백 제공

## 디렉토리 구조

```
apps/mobile/services/migrations/
├── README.md              # 이 파일
├── types.ts              # 마이그레이션용 TypeScript 인터페이스
├── migrationManager.ts   # 핵심 마이그레이션 엔진
├── migrations.ts         # 모든 마이그레이션 정의
└── index.ts             # 쉬운 import를 위한 export 파일
```

## 작동 방식

### 1. Schema Migrations 테이블

시스템은 적용된 마이그레이션을 추적하는 `schema_migrations` 테이블을 유지합니다:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  appliedAt TEXT NOT NULL,
  checksum TEXT
);
```

### 2. 마이그레이션 흐름

앱이 시작될 때:
1. 데이터베이스가 열림
2. 테이블이 초기화됨
3. 마이그레이션 시스템이 대기 중인 마이그레이션을 확인
4. 대기 중인 마이그레이션이 있으면:
   - 데이터베이스 백업 생성
   - 각 마이그레이션을 순서대로 트랜잭션 내에서 실행
   - 성공한 마이그레이션을 `schema_migrations`에 기록
   - 에러 발생 시 롤백하고 중단

## 새 마이그레이션 생성하기

새 마이그레이션을 추가하려면 `migrations.ts`의 `migrations` 배열에 항목을 추가하세요:

```typescript
import { Migration } from './types';

export const migrations: Migration[] = [
  // ... 기존 마이그레이션
  {
    version: 5, // 순차적이어야 함 (이전 버전 + 1)
    name: 'add_new_feature', // 설명적인 이름
    up: async (db: SQLite.SQLiteDatabase) => {
      // 변경사항 적용
      await db.execAsync(`
        ALTER TABLE my_table ADD COLUMN new_column TEXT;
      `);
    },
    down: async (db: SQLite.SQLiteDatabase) => {
      // 변경사항 롤백 (가능한 경우)
      // 참고: SQLite는 DROP COLUMN을 지원하지 않음
      console.warn('SQLite에서는 컬럼을 삭제할 수 없습니다');
    },
  },
];
```

## 마이그레이션 모범 사례

### 1. 항상 순차적인 버전 사용

```typescript
// 좋은 예
{ version: 1, ... }
{ version: 2, ... }
{ version: 3, ... }

// 나쁜 예
{ version: 1, ... }
{ version: 5, ... }
{ version: 3, ... }
```

### 2. 멱등성 있게 만들기

마이그레이션은 여러 번 실행해도 안전해야 합니다:

```typescript
// 좋은 예 - 컬럼 존재 여부를 먼저 확인
up: async (db) => {
  const tableInfo = await db.getAllAsync('PRAGMA table_info(my_table)');
  const hasColumn = tableInfo.some(col => col.name === 'new_column');

  if (!hasColumn) {
    await db.execAsync('ALTER TABLE my_table ADD COLUMN new_column TEXT;');
  }
}

// 나쁜 예 - 컬럼이 이미 존재하면 실패
up: async (db) => {
  await db.execAsync('ALTER TABLE my_table ADD COLUMN new_column TEXT;');
}
```

### 3. 데이터 마이그레이션 신중히 처리

데이터를 수정할 때는 결과를 검증하세요:

```typescript
up: async (db) => {
  // 컬럼 추가
  await db.execAsync('ALTER TABLE records ADD COLUMN petId TEXT;');

  // 데이터 채우기
  await db.execAsync(`
    UPDATE records
    SET petId = (SELECT petId FROM pets WHERE pets.id = records.petRef)
  `);

  // NULL 값이 남아있지 않은지 확인
  const nullCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM records WHERE petId IS NULL'
  );

  if (nullCount && nullCount.count > 0) {
    throw new Error(`데이터 마이그레이션 실패: ${nullCount.count}개의 레코드에 NULL petId`);
  }
}
```

### 4. 인덱스는 현명하게 사용

데이터 마이그레이션 후에 인덱스를 생성하여 더 나은 성능을 확보하세요:

```typescript
up: async (db) => {
  // 1. 컬럼 추가
  await db.execAsync('ALTER TABLE records ADD COLUMN petId TEXT;');

  // 2. 데이터 마이그레이션
  await db.execAsync('UPDATE records SET petId = ...');

  // 3. 인덱스 생성
  await db.execAsync('CREATE INDEX idx_records_pet ON records(petId);');
}
```

### 5. 복잡한 마이그레이션은 문서화

명확하지 않은 로직은 주석으로 설명하세요:

```typescript
{
  version: 7,
  name: 'restructure_supplement_records',
  up: async (db) => {
    // 영양제가 삭제되더라도 과거 기록을 보존해야 하므로
    // supplement 이름을 records 테이블에 비정규화합니다
    await db.execAsync(`
      ALTER TABLE supplement_records ADD COLUMN supplementName TEXT;
    `);

    // 기존 레코드에 현재 영양제 이름으로 채우기
    await db.execAsync(`
      UPDATE supplement_records
      SET supplementName = (
        SELECT name FROM supplements
        WHERE supplements.id = supplement_records.supplementId
      )
    `);
  },
  down: async (db) => {
    // SQLite에서는 컬럼을 삭제할 수 없으므로 인덱스만 삭제
    console.warn('SQLite에서는 이 마이그레이션을 완전히 롤백할 수 없습니다');
  },
}
```

## SQLite 제약사항

SQLite는 마이그레이션에 영향을 주는 몇 가지 제약사항이 있습니다:

### DROP COLUMN 불가

SQLite는 컬럼 삭제를 지원하지 않습니다. 컬럼을 제거하려면:
1. 컬럼이 없는 새 테이블 생성
2. 기존 테이블에서 새 테이블로 데이터 복사
3. 기존 테이블 삭제
4. 새 테이블 이름 변경

예시:
```typescript
down: async (db) => {
  await db.execAsync(`
    CREATE TABLE new_table (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
      -- 제거할 컬럼은 포함하지 않음
    );

    INSERT INTO new_table SELECT id, name FROM old_table;
    DROP TABLE old_table;
    ALTER TABLE new_table RENAME TO old_table;
  `);
}
```

### 기존 컬럼 수정 불가

컬럼 타입이나 제약조건을 변경할 수 없습니다. 테이블을 다시 만들어야 합니다.

### 기존 컬럼에 NOT NULL 추가 불가

NOT NULL 없이 컬럼을 추가하고, 데이터를 채운 다음, 필요한 경우 테이블을 다시 만들어야 합니다.

## API 참조

### runMigrations()
대기 중인 모든 마이그레이션을 실행합니다.

```typescript
await runMigrations(
  db: SQLite.SQLiteDatabase,
  migrations: Migration[],
  dbName: string = 'myorok.db',
  options?: {
    createBackup?: boolean;      // 기본값: true
    useTransaction?: boolean;    // 기본값: true
    onProgress?: (current: number, total: number, name: string) => void;
  }
): Promise<MigrationResult[]>
```

### rollbackMigrations()
마지막 N개의 마이그레이션을 롤백합니다.

```typescript
await rollbackMigrations(
  db: SQLite.SQLiteDatabase,
  migrations: Migration[],
  count: number = 1,
  options?: {
    useTransaction?: boolean;    // 기본값: true
  }
): Promise<MigrationResult[]>
```

### getMigrationStatus()
현재 마이그레이션 상태를 가져옵니다.

```typescript
const status = await getMigrationStatus(
  db: SQLite.SQLiteDatabase,
  migrations: Migration[]
);

// 반환값:
{
  currentVersion: number;
  latestVersion: number;
  appliedMigrations: MigrationRecord[];
  pendingMigrations: Migration[];
}
```

## 사용 예시

### database.ts에서

```typescript
import { runMigrations } from './migrations/migrationManager';
import { migrations } from './migrations/migrations';

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeTables(db);

    // 진행률 추적과 함께 마이그레이션 실행
    await runMigrations(db, migrations, DB_NAME, {
      createBackup: true,
      useTransaction: true,
      onProgress: (current, total, name) => {
        console.log(`마이그레이션 ${current}/${total}: ${name}`);
      },
    });

    dbInstance = db;
    return db;
  })();

  return dbPromise;
}
```

### 마이그레이션 상태 확인 (디버깅용)

```typescript
import { getDatabase } from './database';
import { getMigrationStatus } from './migrations';
import { migrations } from './migrations/migrations';

async function checkMigrations() {
  const db = await getDatabase();
  const status = await getMigrationStatus(db, migrations);

  console.log(`현재 버전: ${status.currentVersion}`);
  console.log(`최신 버전: ${status.latestVersion}`);
  console.log(`대기 중인 마이그레이션: ${status.pendingMigrations.length}`);
}
```

## 문제 해결

### 마이그레이션 실패

마이그레이션이 실패하면:
1. 콘솔에서 에러 메시지 확인
2. 트랜잭션이 자동으로 롤백됨
3. 마이그레이션 코드 수정
4. 다음 앱 시작 시 마이그레이션이 재시도됨

### 데이터베이스 백업

백업은 다음 위치에 생성됩니다:
```
${FileSystem.documentDirectory}SQLite/backup_[타임스탬프]_myorok.db
```

백업에서 복원하려면:
1. 백업 파일 찾기
2. 현재 데이터베이스를 대체하도록 복사
3. 앱 재시작

### 마이그레이션 초기화 (개발 전용)

모든 마이그레이션을 초기화하고 새로 시작하려면:

```typescript
// 경고: 모든 마이그레이션 히스토리가 삭제됩니다
await db.execAsync('DROP TABLE IF EXISTS schema_migrations;');
```

그런 다음 앱을 재시작하여 모든 마이그레이션을 다시 실행하세요.

## 마이그레이션 테스트

마이그레이션을 배포하기 전에:

1. **프로덕션 데이터 복사본에서 테스트**
   - 프로덕션 데이터베이스 내보내기
   - 로컬에서 마이그레이션 실행
   - 데이터 무결성 확인

2. **롤백 테스트**
   - `down` 함수가 작동하는지 확인 (가능한 경우)
   - 데이터가 올바르게 복원되는지 확인

3. **멱등성 테스트**
   - 마이그레이션을 두 번 실행
   - 실패하거나 중복 데이터가 생성되지 않는지 확인

4. **성능 모니터링**
   - 큰 테이블의 경우 마이그레이션 속도 테스트
   - 느린 마이그레이션에 대해 진행률 표시기 추가 고려

## 현재 마이그레이션

1. **v1: enable_foreign_keys** - 외래 키 제약조건 활성화
2. **v2: add_petid_to_supplement_records** - 쿼리 성능 향상을 위해 supplement_records에 petId 컬럼 추가
3. **v3: add_petid_to_custom_metric_records** - custom_metric_records에 petId 컬럼 추가
4. **v4: create_performance_indexes** - 자주 조회되는 컬럼에 인덱스 생성

## 관련 문서

- [DBImprovementAgent.md](../../../../docs/sub_agents_docs/DBImprovementAgent.md) - 데이터베이스 개선 로드맵
- [LOCAL_DB_SPEC.md](../../../../docs/specs/LOCAL_DB_SPEC.md) - 데이터베이스 스키마 명세
