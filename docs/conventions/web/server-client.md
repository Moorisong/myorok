# Web Server/Client Convention

> Next.js 15 Server Components vs Client Components

## Server Components / Client Components ⭐ 필수

### 기본 원칙

> **Server Component 우선**. 클라이언트 상태가 필요한 경우에만 `'use client'` 사용

### 구분 기준

| 사용 케이스 | 컴포넌트 타입 | 디렉티브 |
|------------|--------------|----------|
| 데이터 fetching | Server | 없음 (기본값) |
| SEO 메타데이터 | Server | 없음 |
| useState, useEffect | Client | `'use client'` |
| onClick, onChange | Client | `'use client'` |
| 브라우저 API (localStorage 등) | Client | `'use client'` |

### 코드 예시

```typescript
// ✅ Server Component (기본값, 디렉티브 없음)
// app/room/[id]/page.tsx
export default async function RoomPage({ params }: Props) {
  const room = await fetchRoom(params.id);
  return <RoomDetail room={room} />;
}

// ✅ Client Component (상호작용 필요)
// components/VoteButton.tsx
'use client';

import { useState } from 'react';

export function VoteButton({ roomId }: Props) {
  const [isVoted, setIsVoted] = useState(false);
  return <button onClick={() => setIsVoted(true)}>투표하기</button>;
}
```

---

## API 응답 표준 형식

### 성공/실패 응답 구조

```typescript
// ✅ 성공 응답
{
  success: true,
  data: { ... }
}

// ✅ 실패 응답
{
  success: false,
  error: {
    code: 'VOTE_CLOSED',
    message: '투표가 마감되었습니다'
  }
}
```

### 에러 코드 정의

| 에러 코드 | 설명 | HTTP Status |
|----------|------|-------------|
| `ROOM_NOT_FOUND` | 투표방 없음 | 404 |
| `VOTE_CLOSED` | 투표 마감됨 | 400 |
| `ALREADY_VOTED` | 이미 투표함 | 400 |
| `RATE_LIMITED` | 요청 제한 초과 | 429 |
| `INVALID_INPUT` | 잘못된 입력값 | 400 |
