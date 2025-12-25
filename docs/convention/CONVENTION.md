# 코드 컨벤션 (Code Convention)

> AI 및 개발자가 코드 작성/리팩토링 시 반드시 따라야 하는 규칙

📌 **빠른 참고**: [요약본 보기 (CONVENTION_SUMMARY.md)](./CONVENTION_SUMMARY.md)

---

## 기술 스택 버전

| 기술 | 버전 | 비고 |
|------|------|------|
| **React Native** | 0.81.x | Expo Managed |
| **Expo** | 54.x | SDK 54 |
| **Next.js** | 16.x | App Router (웹) |
| **React** | 19.x | - |
| **TypeScript** | 5.x | Strict 모드 |
| **SQLite** | expo-sqlite | 로컬 저장소 (모바일) |
| **ESLint** | 9.x | Flat Config |
| **Node.js** | 18+ | LTS |

---

## 1. 코드 스타일

| 항목 | 규칙 | 예시 |
|------|------|------|
| 들여쓰기 | **2칸 스페이스** | `··const x = 1;` |
| 세미콜론 | **항상 사용** | `const x = 1;` ✅ / `const x = 1` ❌ |
| 따옴표 | **single quote `'`** | `'hello'` ✅ / `"hello"` ❌ |
| 라인 길이 | **최대 100자** | 100자 초과 시 줄바꿈 |
| 린트/포맷 | **ESLint + Prettier 필수** | 커밋 전 반드시 적용 |

### ESLint 설정 (eslint.config.mjs)

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      // 커밋 전 정리 필수
      'no-unused-vars': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      
      // React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // 접근성
      'jsx-a11y/alt-text': 'error',
    },
  },
];
```

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

### package.json 스크립트

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "pre-commit": "npm run lint && npm run type-check"
  }
}
```

---

## 2. 폴더 / 파일 구조

```
src/
├─ components/   # React 컴포넌트 (UI 단위)
├─ hooks/        # 커스텀 훅 (use* 네이밍)
├─ services/     # API 호출 및 비즈니스 로직
├─ utils/        # 범용 유틸리티 함수
├─ types/        # TypeScript 타입/인터페이스 정의
├─ assets/       # 이미지, 아이콘, 폰트 등 정적 파일
├─ pages/        # Next.js App Router 페이지 (또는 라우트)
└─ lib/          # 외부 라이브러리 래퍼, API 클라이언트
```

---

## 3. 네이밍 규칙

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

## 4. 상수 관리 (Constants)

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
  ROOM_RESULTS: (id: string) => `/api/rooms/${id}/results`,
  PARKING: '/api/parking',
  PARKING_STATS: (placeId: string) => `/api/parking/${placeId}/stats`,
  PLACES_SEARCH: '/api/places/search',
  PLACES_DISTRICT: (district: string) => `/api/places/district/${district}`,
} as const;

// constants/routes.ts
export const ROUTES = {
  HOME: '/',
  ROOM: (id: string) => `/room/${id}`,
  ROOM_RESULT: (id: string) => `/room/${id}/result`,
  ROOM_PARKING: (id: string) => `/room/${id}/parking`,
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// constants/storage.ts
export const STORAGE_KEYS = {
  PARTICIPANT_ID: 'babmoa_participant_id',
  VOTED: (roomId: string) => `voted_${roomId}`,
  PARKING: (roomId: string) => `parking_${roomId}`,
  LAST_CREATED_ROOM_AT: 'lastCreatedRoomAt',
} as const;

// constants/error-codes.ts
export const ERROR_CODES = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  VOTE_CLOSED: 'VOTE_CLOSED',
  ALREADY_VOTED: 'ALREADY_VOTED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

// constants/config.ts
export const CONFIG = {
  API_TIMEOUT: 10000,           // 10초
  RATE_LIMIT_DURATION: 60000,   // 1분
  MAX_CANDIDATES: 10,           // 최대 후보 수
  MIN_PARKING_RECORDS: 3,       // 주차 통계 표시 최소 기록 수
  STORAGE_EXPIRY_DAYS: 14,      // 스토리지 만료 일수
} as const;
```

### 사용 예시

```typescript
// ✅ 올바른 사용
import { API, ROUTES, STORAGE_KEYS } from '@/constants';

const response = await fetch(API.ROOM(roomId));
router.push(ROUTES.ROOM_RESULT(roomId));
localStorage.setItem(STORAGE_KEYS.PARTICIPANT_ID, id);

// ❌ 잘못된 사용 (하드코딩)
const response = await fetch(`/api/rooms/${roomId}`);
router.push(`/room/${roomId}/result`);
localStorage.setItem('babmoa_participant_id', id);
```

### 상수 정의 시 `as const` 사용

```typescript
// ✅ as const로 리터럴 타입 보장
export const PARKING_BADGE = {
  EASY: '주차 수월',
  MODERATE: '애매함',
  HARD: '거의 불가',
  UNKNOWN: '정보 부족',
} as const;

type ParkingBadge = typeof PARKING_BADGE[keyof typeof PARKING_BADGE];
// => '주차 수월' | '애매함' | '거의 불가' | '정보 부족'
```

---

## 5. 타입 / 인터페이스 정의

### 필수 타입 정의 대상

| 대상 | 필수 여부 | 설명 |
|------|----------|------|
| 컴포넌트 Props | ✅ 필수 | 모든 Props에 타입 정의 |
| 컴포넌트 State | ✅ 필수 | useState 훅의 제네릭 타입 명시 |
| API 응답 | ✅ 필수 | 외부 API 응답 구조 타입 정의 |
| 함수 파라미터/반환값 | ✅ 필수 | 명시적 타입 어노테이션 |

### 인터페이스 네이밍

```typescript
// 방법 1: I 접두사 사용
interface IUser {
  id: string;
  name: string;
}

// 방법 2: 접두사 없이 사용 (프로젝트 내 일관성 유지)
interface User {
  id: string;
  name: string;
}

// Props 타입
interface UserCardProps {
  user: IUser;
  onClick: () => void;
}
```

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

## 6. Import 정렬 규칙

### 정렬 순서 (위에서 아래로)

```typescript
// 1. React/Next.js 코어
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

// 6. 스타일 (있는 경우)
import styles from './Component.module.css';
```

### 경로 규칙

| 경로 타입 | 사용 기준 | 예시 |
|----------|----------|------|
| 절대 경로 `@/` | 다른 폴더 참조 시 | `import { Button } from '@/components/Button';` |
| 상대 경로 `./` | 같은 폴더 내 파일 | `import { helper } from './helper';` |

---

## 7. Server Components / Client Components (Next.js 15)

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

## 8. 환경변수 규칙

### 네이밍 규칙

| 접두사 | 노출 범위 | 예시 |
|--------|----------|------|
| `NEXT_PUBLIC_` | 클라이언트 + 서버 | `NEXT_PUBLIC_KAKAO_JS_KEY` |
| 접두사 없음 | 서버 전용 | `MONGODB_URI`, `KAKAO_REST_API_KEY` |

### 주의사항

```typescript
// ✅ 올바른 사용
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ 클라이언트에서 서버 전용 변수 접근 불가
const dbUri = process.env.MONGODB_URI;  // undefined (클라이언트)

// ✅ 환경변수 타입 정의 권장
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      MONGODB_URI: string;
    }
  }
}
```

---

## 9. API 응답 표준 형식

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

---

## 10. Tailwind CSS 클래스 정렬

### 정렬 순서

```
레이아웃 → 위치 → 크기 → 간격 → 배경/색상 → 테두리 → 텍스트 → 효과/애니메이션
```

### 예시

```tsx
// ✅ 올바른 순서
<div className="flex items-center justify-between w-full px-4 py-2 bg-white border rounded-lg text-gray-800 shadow-md hover:shadow-lg transition-shadow">

// ✅ 긴 클래스는 cn() 유틸 사용 (clsx + tailwind-merge)
import { cn } from '@/lib/utils';

<button className={cn(
  'flex items-center justify-center',
  'w-full px-4 py-2',
  'bg-blue-500 text-white',
  'rounded-lg',
  'hover:bg-blue-600 transition-colors',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
```

---

## 10.1 CSS Modules 규칙

> **컴포넌트별 스타일 분리 필수** - 스타일 충돌 방지, 유지보수성 향상

### 기본 원칙

| 항목 | 규칙 |
|------|------|
| 파일 위치 | 컴포넌트와 동일 디렉토리 내 |
| 네이밍 | `ComponentName.module.css` |
| 클래스 네이밍 | `camelCase` |
| 조건부 스타일 | `classnames` 라이브러리 사용 |
| 인라인 스타일 | 동적 값(애니메이션 딜레이 등)만 허용 |

### 디렉토리 구조

```
components/
├─ Header/
│   ├─ index.tsx            # 컴포넌트 코드 (default export)
│   └─ Header.module.css    # 스타일
├─ VoteCard/
│   ├─ index.tsx
│   └─ VoteCard.module.css
└─ index.ts                 # 전체 컴포넌트 re-export
```

### 컴포넌트 파일 작성 규칙

```tsx
// components/Header/index.tsx
'use client';

import classNames from 'classnames';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      {/* ... */}
    </header>
  );
}
```

### 메인 index.ts 작성 규칙

```typescript
// components/index.ts (전체 export)
export { default as Header } from './Header';
export { default as VoteCard } from './VoteCard';
export { default as Footer } from './Footer';
```

### CSS Module 사용 예시

```tsx
// ✅ 올바른 사용
import classNames from 'classnames';
import styles from './Button.module.css';

export function Button({ variant, disabled }: Props) {
  return (
    <button
      className={classNames(styles.button, {
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
        [styles.disabled]: disabled,
      })}
    >
      Click me
    </button>
  );
}
```

```css
/* Button.module.css */
.button {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.primary {
  background-color: #6366f1;
  color: white;
}

.secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Import 순서 (스타일)

```typescript
// 1. React/Next.js 코어
import { useState } from 'react';

// 2. 외부 라이브러리
import classNames from 'classnames';

// 3. 내부 모듈 (컴포넌트, 훅, 유틸)
import { formatDate } from '@/lib/utils';

// 4. 타입
import type { ButtonProps } from '@/types';

// 5. 스타일 (마지막)
import styles from './Button.module.css';
```

### 클래스 네이밍 컨벤션

| 용도 | 네이밍 패턴 | 예시 |
|------|------------|------|
| 컨테이너 | `container`, `wrapper` | `.container`, `.cardWrapper` |
| 상태 | 형용사 | `.active`, `.disabled`, `.selected` |
| 변형 | 명사/형용사 | `.primary`, `.large`, `.outlined` |
| 레이아웃 | 위치/역할 | `.header`, `.content`, `.footer` |
| 요소 부분 | 부모_자식 | `.card`, `.cardTitle`, `.cardContent` |

### 조건부 클래스 패턴

```tsx
// ✅ classnames 사용
<div className={classNames(styles.card, {
  [styles.selected]: isSelected,
  [styles.disabled]: isDisabled,
})}>

// ✅ 다중 기본 클래스
<button className={classNames(
  styles.btn,
  styles.btnPrimary,
  isLoading && styles.loading
)}>

// ❌ 피해야 할 패턴 (템플릿 리터럴)
<div className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
```

### 동적 스타일 처리

```tsx
// ✅ 애니메이션 딜레이 등 동적 값은 style prop 사용
<div 
  className={styles.card}
  style={{ animationDelay: `${index * 0.1}s` }}
>

// ✅ CSS 변수 활용
<div 
  className={styles.progress}
  style={{ '--progress': `${percentage}%` } as React.CSSProperties}
>
```

```css
/* progress bar에서 CSS 변수 사용 */
.progress::after {
  width: var(--progress);
}
```

### 금지 사항

| 금지 | 이유 |
|------|------|
| 인라인 Tailwind 클래스 | CSS Modules로 통일 |
| globals.css에 컴포넌트 스타일 | 컴포넌트별 모듈로 분리 |
| `!important` 남용 | 스타일 우선순위 혼란 |
| 깊은 셀렉터 (`>`, 후손 셀렉터) | 결합도 증가 |

---

## 11. 시맨틱 HTML (Semantic HTML)

> **의미 있는 HTML 태그 사용 필수** - SEO, 접근성, 유지보수성 향상

### 필수 시맨틱 태그

| 용도 | 올바른 태그 | 잘못된 태그 |
|------|------------|------------|
| 페이지 헤더 | `<header>` | `<div class="header">` |
| 네비게이션 | `<nav>` | `<div class="nav">` |
| 메인 콘텐츠 | `<main>` | `<div class="main">` |
| 섹션 | `<section>` | `<div class="section">` |
| 독립 콘텐츠 | `<article>` | `<div class="article">` |
| 부가 정보 | `<aside>` | `<div class="sidebar">` |
| 페이지 푸터 | `<footer>` | `<div class="footer">` |
| 제목 | `<h1>` ~ `<h6>` | `<div class="title">` |
| 버튼 | `<button>` | `<div onClick>` |
| 링크 | `<a href>` | `<span onClick>` |

### 페이지 구조 예시

```tsx
// ✅ 올바른 시맨틱 구조
<main>
  <header>
    <h1>투표방 제목</h1>
  </header>
  
  <section aria-labelledby="candidates-title">
    <h2 id="candidates-title">후보 장소</h2>
    <ul>
      <li><article>...</article></li>
    </ul>
  </section>
  
  <aside>
    <h3>주차 정보</h3>
  </aside>
  
  <footer>
    <nav aria-label="페이지 네비게이션">...</nav>
  </footer>
</main>
```

### 제목 계층 규칙

- **h1**: 페이지당 1개만 사용
- **h2~h6**: 순서대로 계층 유지 (h2 → h4 건너뛰기 ❌)

---

## 12. SEO 필수 규칙

### 이미지 규칙

| 항목 | 필수 여부 | 설명 |
|------|----------|------|
| `alt` 속성 | ✅ **필수** | 모든 이미지에 의미 있는 설명 |
| `width`, `height` | ✅ 권장 | CLS(레이아웃 시프트) 방지 |
| Next.js `Image` | ✅ 권장 | 최적화 자동 적용 |

```tsx
// ✅ 올바른 이미지 사용
import Image from 'next/image';

<Image
  src="/restaurant.jpg"
  alt="강남역 맛있는 고기집 외관"
  width={400}
  height={300}
  priority  // LCP 이미지인 경우
/>

// ❌ 잘못된 사용
<img src="/restaurant.jpg" />  // alt 없음
<Image src="/icon.svg" alt="" />  // 빈 alt (장식용 아니면 금지)
```

### 장식용 이미지

```tsx
// 장식용 이미지는 빈 alt + aria-hidden
<Image src="/decoration.svg" alt="" aria-hidden="true" />
```

### 메타 태그 (Next.js 15)

```tsx
// app/room/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await fetchRoom(params.id);
  
  return {
    title: `${room.title} | 밥모아`,
    description: `${room.title} 투표에 참여하세요`,
    openGraph: {
      title: room.title,
      description: `${room.places.length}개 후보 중 투표`,
      images: ['/og-image.png'],
    },
  };
}
```

---

## 13. 접근성 (a11y) 규칙

### 필수 속성

| 요소 | 필수 속성 | 설명 |
|------|----------|------|
| 아이콘 버튼 | `aria-label` | 버튼 목적 설명 |
| 모달 | `role="dialog"`, `aria-modal` | 모달임을 명시 |
| 로딩 상태 | `aria-busy`, `aria-live` | 상태 변화 알림 |
| 폼 입력 | `<label>` 연결 또는 `aria-label` | 입력 필드 설명 |

```tsx
// ✅ 아이콘 버튼
<button aria-label="메뉴 닫기">
  <CloseIcon />
</button>

// ✅ 로딩 상태
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? <Spinner /> : <Content />}
</div>

// ✅ 폼 입력
<label htmlFor="title">투표 제목</label>
<input id="title" type="text" />
```

### 키보드 네비게이션

- 모든 인터랙티브 요소는 **Tab 키로 접근 가능**해야 함
- Enter/Space로 활성화 가능해야 함
- 포커스 상태 시각적으로 표시 (`focus:ring-2`)

---

## 14. 에러 바운더리 & Suspense 패턴

### Error Boundary

```tsx
// components/ErrorBoundary.tsx
'use client';

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

```tsx
// app/room/[id]/page.tsx
import { Suspense } from 'react';

export default function RoomPage() {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomContent />
    </Suspense>
  );
}
```

### Next.js 15 파일 컨벤션

| 파일 | 용도 |
|------|------|
| `loading.tsx` | Suspense 자동 래핑 |
| `error.tsx` | Error Boundary 자동 래핑 |
| `not-found.tsx` | 404 페이지 |

---

## 15. 커밋 전 체크리스트 & CI 연동

> **커밋 전 반드시 확인하고 정리할 항목** - 자동화 권장

### 체크리스트

```
[ ] npm run lint 통과
[ ] npm run type-check 통과
[ ] 미사용 변수/import 없음
[ ] console.log / debugger 없음
[ ] 이미지 alt 속성 확인
[ ] 시맨틱 태그 사용 확인
[ ] TODO/FIXME 정리 여부 확인
```

### Husky + lint-staged 설정 (권장)

```bash
# 설치
npm install -D husky lint-staged
npx husky init
```

```javascript
// .husky/pre-commit
npm run pre-commit
```

```json
// package.json
{
  "scripts": {
    "pre-commit": "lint-staged && npm run type-check"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### GitHub Actions CI 예시

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
```

---

## 16. 커밋 메시지 컨벤션

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

## 17. 리팩토링 원칙

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

## 18. 테스트

| 테스트 종류 | 도구 | 적용 대상 |
|------------|------|----------|
| 단위 테스트 | Jest, React Testing Library | 유틸 함수, 훅, 컴포넌트 |
| 통합 테스트 | Jest | API 호출 로직, 복합 기능 |
| E2E 테스트 | (추후 적용) | 주요 사용자 플로우 |

### 테스트 필수 대상

- ✅ 핵심 비즈니스 로직
- ✅ 유틸리티 함수
- ✅ 커스텀 훅
- ✅ 복잡한 상태 관리 로직

---

## 19. 문서화

### 주석 규칙

```typescript
/**
 * 사용자 데이터를 서버에서 조회합니다.
 * @param userId - 조회할 사용자 ID
 * @returns 사용자 정보 객체
 * @throws API 호출 실패 시 에러
 */
const fetchUser = async (userId: string): Promise<IUser> => {
  // ...
};
```

### README 필수 항목

| 항목 | 포함 여부 |
|------|----------|
| 프로젝트 구조 | ✅ 필수 |
| 실행 방법 | ✅ 필수 |
| 환경 변수 설명 | ✅ 필수 |
| 주요 기능 | ✅ 필수 |
| 라이센스 | ❌ **언급 금지** |

---

## 20. AI 리팩토링 지침

> AI가 코드를 생성하거나 리팩토링할 때 따를 규칙

### 생성 원칙

| 원칙 | 설명 |
|------|------|
| **Server Component 우선** | 상호작용 필요시만 `'use client'` |
| **타입 안전성** | 모든 Props, State, API에 타입 정의 |
| **시맨틱 HTML** | `<main>`, `<section>`, `<button>` 사용 |
| **렌더링 최적화** | `useMemo`, `useCallback` 활용 |
| **에러 핸들링** | `async/await` + `try-catch` |
| **모듈화** | 한 파일 200줄 이하 |

### 금지 사항

| 금지 | 대안 |
|------|------|
| `any` 타입 | 명시적 타입 정의 |
| `console.log` | 커밋 전 제거 (ESLint 자동) |
| 하드코딩 문자열 | 상수 파일 사용 |
| `<div onClick>` | `<button>` 사용 |
| 이미지 alt 누락 | 의미 있는 설명 필수 |
| 인라인 스타일 | Tailwind CSS 사용 |

---

## 요약: 핵심 규칙 11가지

1. **들여쓰기 2칸**, **세미콜론 사용**, **single quote**
2. **파일/폴더명 kebab-case**, **컴포넌트 PascalCase**
3. **2회 이상 사용 문자열 → 상수화**
4. **모든 Props/State/API 타입 정의**
5. **async/await + try-catch**
6. **useMemo/useCallback 렌더링 최적화**
7. **한 파일 200줄 이하, SRP 준수**
8. **Server Component 우선**
9. **시맨틱 HTML** (`<main>`, `<section>`, `<button>`)
10. **이미지 alt 필수**
11. **커밋 전 lint/type-check 통과**
