# Common Constants Convention

> 상수 관리 및 파일 구조

## 상수 관리 (Constants) ⭐ 필수

> **2회 이상 사용되는 문자열/경로는 반드시 상수로 관리**

### 상수화 필수 대상

| 대상 | 필수 여부 | 예시 |
|------|----------|------|
| API 경로 (Path) | ✅ **필수** | `/api/rooms`, `/api/parking` |
| 라우트 경로 | ✅ **필수** | `/room/[id]`, `/room/[id]/result` |
| 에러 메시지 | ✅ **필수** | `'투표가 마감되었습니다'` |
| 에러 코드 | ✅ **필수** | `'VOTE_CLOSED'`, `'ROOM_NOT_FOUND'` |
| LocalStorage 키 | ✅ **필수** | `'babmoa_participant_id'` |
| 매직 넘버 | ✅ **필수** | 타임아웃, 제한값 등 |
| 반복 사용 문자열 | ✅ 2회 이상 | 라벨, 상태값 등 |

### 상수 네이밍 규칙

| 종류 | 네이밍 | 예시 |
|------|--------|------|
| 일반 상수 | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| API 경로 | `API_` 접두사 | `API_ROOMS`, `API_PARKING` |
| 라우트 경로 | `ROUTE_` 접두사 | `ROUTE_HOME`, `ROUTE_ROOM` |
| 스토리지 키 | `STORAGE_KEY_` 접두사 | `STORAGE_KEY_PARTICIPANT_ID` |
| 에러 코드 | `ERROR_` 접두사 | `ERROR_VOTE_CLOSED` |

### 상수 파일 구조

```
src/
├─ constants/
│   ├─ index.ts          # 모든 상수 re-export
│   ├─ api.ts            # API 경로 상수
│   ├─ routes.ts         # 라우트 경로 상수
│   ├─ storage.ts        # LocalStorage 키 상수
│   ├─ error-codes.ts    # 에러 코드 상수
│   └─ config.ts         # 설정값 상수 (타임아웃 등)
```

### 코드 예시

```typescript
// constants/api.ts
export const API = {
  ROOMS: '/api/rooms',
  ROOM: (id: string) => `/api/rooms/${id}`,
  ROOM_VOTE: (id: string) => `/api/rooms/${id}/vote`,
} as const;

// constants/config.ts
export const CONFIG = {
  API_TIMEOUT: 10000,           // 10초
  MAX_CANDIDATES: 10,           // 최대 후보 수
} as const;

// ✅ 사용 예시
import { API, CONFIG } from '@/constants';
const response = await fetch(API.ROOM(roomId));
```
