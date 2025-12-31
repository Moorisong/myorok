# App Database Convention

> 로컬 데이터베이스(SQLite) 사용 규칙

## SQLite 사용 규칙 (expo-sqlite) ⭐ 필수

> **Parameterized Query 필수** - SQL Injection 방지

```typescript
import * as SQLite from 'expo-sqlite';

// ✅ 데이터베이스 열기
const db = await SQLite.openDatabaseAsync('app.db');

// ✅ Parameterized Query (필수)
await db.runAsync(
  'INSERT INTO users (id, name) VALUES (?, ?)',
  [userId, userName]
);

const users = await db.getAllAsync(
  'SELECT * FROM users WHERE age > ?',
  [minAge]
);

// ❌ 금지 - String Interpolation (SQL Injection 취약)
await db.runAsync(`INSERT INTO users VALUES ('${userId}', '${userName}')`);
```
