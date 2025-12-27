# 공통 코드 컨벤션 (Common Convention)

> 웹(Next.js)과 앱(React Native/Expo) 모두에 적용되는 공통 규칙

📌 **플랫폼별 문서**: [웹 전용](./CONVENTION_WEB.md) | [앱 전용](./CONVENTION_APP.md)

---

## 기술 스택 버전

| 기술 | 버전 | 적용 범위 |
|------|------|----------|
| **React** | 19.x | 공통 |
| **TypeScript** | 5.x | 공통 (Strict 모드) |
| **ESLint** | 9.x | 공통 (Flat Config) |
| **Node.js** | 18+ | 공통 (LTS) |
| **Next.js** | 16.x | 웹만 |
| **React Native** | 0.81.x | 앱만 |
| **Expo** | 54.x | 앱만 |

---

## 1. 코드 스타일

| 항목 | 규칙 | 예시 |
|------|------|------|
| 들여쓰기 | **2칸 스페이스** | `··const x = 1;` |
| 세미콜론 | **항상 사용** | `const x = 1;` ✅ / `const x = 1` ❌ |
| 따옴표 | **single quote `'`** | `'hello'` ✅ / `"hello"` ❌ |
| 라인 길이 | **최대 100자** | 100자 초과 시 줄바꿈 |
| 린트/포맷 | **ESLint + Prettier 필수** | 커밋 전 반드시 적용 |

### Prettier 설정 (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

---

## 2. 네이밍 규칙

| 대상 | 규칙 | 올바른 예시 | 잘못된 예시 |
|------|------|-------------|-------------|
| 변수/상수 | `camelCase` | `userName`, `isLoading` | `user_name`, `UserName` |
| 함수 | `동사 + 명사` | `fetchUserData()`, `handleClick()` | `userData()`, `click()` |
| 컴포넌트 | `PascalCase` | `UserCard`, `VoteButton` | `userCard`, `vote-button` |
| 파일명 | `kebab-case` | `user-card.tsx`, `vote-button.tsx` | `UserCard.tsx`, `userCard.tsx` |
| 폴더명 | `kebab-case` | `user-profile/`, `vote-room/` | `UserProfile/`, `userProfile/` |
| 훅 | `use + PascalCase` | `useUserData`, `useVoteRoom` | `userDataHook`, `UseUserData` |
| 타입/인터페이스 | `PascalCase` 또는 `I` 접두사 | `User`, `IApiResponse` | `user`, `apiResponse` |
| 환경변수 | `SCREAMING_SNAKE_CASE` | `NEXT_PUBLIC_API_URL` | `nextPublicApiUrl` |

---

## 3. 상수 관리 (Constants) ⭐ 필수

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

---

## 4. 타입 / 인터페이스 정의

### 필수 타입 정의 대상

| 대상 | 필수 여부 | 설명 |
|------|----------|------|
| 컴포넌트 Props | ✅ 필수 | 모든 Props에 타입 정의 |
| 컴포넌트 State | ✅ 필수 | useState 훅의 제네릭 타입 명시 |
| API 응답 | ✅ 필수 | 외부 API 응답 구조 타입 정의 |
| 함수 파라미터/반환값 | ✅ 필수 | 명시적 타입 어노테이션 |

### TypeScript Strict 모드 대응

```typescript
// ✅ Optional chaining 활용
const userName = user?.profile?.name;

// ✅ Nullish coalescing 활용
const displayName = userName ?? '익명';

// ✅ 타입 가드 사용
if (user && user.id) {
  processUser(user);
}

// ❌ 금지: non-null assertion 남용
const name = user!.name;  // 피할 것
```

---

## 5. Import 정렬 규칙

### 정렬 순서 (위에서 아래로)

```typescript
// 1. React/Next.js 코어
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';  // 웹
import { useRouter } from 'expo-router';       // 앱

// 2. 외부 라이브러리
import { motion } from 'framer-motion';
import clsx from 'clsx';

// 3. 내부 컴포넌트
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

// 4. 훅, 유틸, 서비스
import { useUserData } from '@/hooks/useUserData';
import { formatDate } from '@/utils/date';

// 5. 타입 (type-only import)
import type { User, Room } from '@/types';

// 6. 스타일 (마지막)
import styles from './Component.module.css';  // 웹
```

### 경로 규칙

| 경로 타입 | 사용 기준 | 예시 |
|----------|----------|------|
| 절대 경로 `@/` | 다른 폴더 참조 시 | `import { Button } from '@/components/Button';` |
| 상대 경로 `./` | 같은 폴더 내 파일 | `import { helper } from './helper';` |

---

## 6. Error Boundary & Suspense 패턴

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
'use client';  // 웹만

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### Suspense 활용

```typescript
import { Suspense } from 'react';

// ✅ 공통 패턴
<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>
```

---

## 7. 리팩토링 원칙

### 핵심 원칙

| 원칙 | 설명 | 적용 예시 |
|------|------|----------|
| **SRP (단일 책임)** | 하나의 함수/컴포넌트는 하나의 역할만 | 데이터 fetch와 UI 렌더링 분리 |
| **중복 코드 제거** | 2회 이상 반복 시 공통 모듈화 | 유틸 함수, 공통 컴포넌트 추출 |
| **불필요한 렌더링 방지** | React 최적화 훅 활용 | `React.memo`, `useCallback`, `useMemo` |
| **비동기 처리 통일** | `async/await` 패턴 사용 | try-catch 에러 핸들링 필수 |
| **모듈화** | 기능 단위로 파일 분리 | 한 파일 200줄 이하 권장 |

### 비동기 처리 패턴

```typescript
// ✅ 올바른 패턴
const fetchData = async (): Promise<Data> => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
};

// ❌ 잘못된 패턴
const fetchData = () => {
  api.get('/endpoint').then(res => res.data);  // 에러 핸들링 없음
};
```

### 렌더링 최적화

```typescript
// 비용이 큰 계산은 useMemo 사용
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// 콜백 함수는 useCallback 사용
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// 자식 컴포넌트는 React.memo 고려
const ChildComponent = React.memo(({ data }: Props) => {
  return <div>{data}</div>;
});
```

---

## 8. 커밋 전 체크리스트

```
[ ] npm run lint 통과
[ ] npm run type-check 통과
[ ] 미사용 변수/import 없음
[ ] console.log / debugger 없음
[ ] TODO/FIXME 정리 여부 확인
```

---

## 9. 커밋 메시지 컨벤션

### Conventional Commits 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입 종류

| 타입 | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat(vote): 투표 마감 기능 추가` |
| `fix` | 버그 수정 | `fix(map): 마커 클릭 오류 수정` |
| `refactor` | 리팩토링 | `refactor(api): 에러 핸들링 통일` |
| `style` | 코드 스타일 (포맷팅 등) | `style: prettier 적용` |
| `docs` | 문서 수정 | `docs: README 업데이트` |
| `test` | 테스트 추가/수정 | `test(utils): formatDate 테스트 추가` |
| `chore` | 빌드, 설정 변경 | `chore: eslint 설정 업데이트` |

### 규칙

- **언어**: 한글 사용 (팀 내 일관성)
- **제목**: 50자 이내, 마침표 없음
- **본문**: 필요시 상세 설명 추가

---

## 요약: 핵심 규칙 10가지 (공통)

1. ✅ **들여쓰기 2칸**, **세미콜론 사용**, **single quote**
2. ✅ **파일/폴더명 kebab-case**, **컴포넌트 PascalCase**
3. ✅ **2회 이상 사용 문자열 → 상수화**
4. ✅ **모든 Props/State/API 타입 정의**
5. ✅ **async/await + try-catch**
6. ✅ **useMemo/useCallback 렌더링 최적화**
7. ✅ **한 파일 200줄 이하, SRP 준수**
8. ✅ **커밋 전 lint/type-check 통과**
9. ✅ **Error Boundary & Suspense 활용**
10. ✅ **Conventional Commits 메시지 규칙**
