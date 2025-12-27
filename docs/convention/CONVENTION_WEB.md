# 웹 전용 코드 컨벤션 (Next.js)

> Next.js 웹 애플리케이션에만 적용되는 규칙

📌 **다른 문서**: [공통 규칙](./CONVENTION_COMMON.md) | [앱 전용](./CONVENTION_APP.md)

---

## 1. Server Components / Client Components (Next.js 15) ⭐ 필수

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

## 2. 환경변수 규칙

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

## 3. API 응답 표준 형식

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

## 4. Tailwind CSS 클래스 정렬 ⭐ 권장

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

## 5. 시맨틱 HTML (Semantic HTML) ⭐ 필수

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

## 6. SEO 필수 규칙

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

## 7. 접근성 (a11y) 규칙

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

## 8. Next.js 15 파일 컨벤션

| 파일 | 용도 |
|------|------|
| `loading.tsx` | Suspense 자동 래핑 |
| `error.tsx` | Error Boundary 자동 래핑 |
| `not-found.tsx` | 404 페이지 |
| `layout.tsx` | 레이아웃 컴포넌트 |
| `page.tsx` | 페이지 컴포넌트 |

---

## 9. CSS Modules 규칙 (옵션)

> **Tailwind 우선, 필요시 CSS Modules 사용**

```tsx
// components/Header/index.tsx
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      {/* ... */}
    </header>
  );
}
```

---

## 요약: 웹 필수 규칙 8가지

1. ✅ **Server Component 우선**, 필요시만 `'use client'`
2. ✅ **시맨틱 HTML** 사용 (`<main>`, `<section>`, `<button>`)
3. ✅ **이미지 alt 필수**, Next.js `Image` 사용
4. ✅ **메타데이터 generateMetadata** 함수 작성
5. ✅ **환경변수 NEXT_PUBLIC_** 접두사 구분
6. ✅ **Tailwind CSS 클래스 정렬** 규칙
7. ✅ **접근성 속성** (aria-label, aria-live 등)
8. ✅ **Next.js 파일 컨벤션** (loading.tsx, error.tsx 등)
