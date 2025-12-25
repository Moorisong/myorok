# 코드 컨벤션 요약본 (Quick Reference)

> 🚀 새로운 팀원 및 AI를 위한 핵심 규칙 요약 (2~3분 읽기)

## ✅ 커밋 전 체크리스트

```
[ ] ESLint 통과 (npm run lint)
[ ] 타입 에러 없음 (npm run type-check)
[ ] 미사용 변수/import 제거
[ ] console.log / debugger 제거
[ ] 이미지 alt 속성 확인
[ ] 시맨틱 태그 사용 확인
[ ] 커밋은 한국어로 입력
```

---

## 🎨 코드 스타일 한눈에

| 항목 | 규칙 |
|------|------|
| 들여쓰기 | **2칸 스페이스** |
| 세미콜론 | **항상 사용** |
| 따옴표 | **single quote `'`** |
| 파일명 | **kebab-case** (`user-card.tsx`) |
| 컴포넌트 | **PascalCase** (`UserCard`) |
| 상수 | **SCREAMING_SNAKE_CASE** |

---

## 📁 필수 네이밍 규칙

```typescript
// 변수/함수
const userName = 'kim';           // camelCase
const fetchUserData = async () => {};  // 동사 + 명사

// 컴포넌트
function UserCard() {}            // PascalCase

// 상수
const API_TIMEOUT = 10000;        // SCREAMING_SNAKE_CASE

// 파일/폴더
user-card.tsx                     // kebab-case
```

---

## 🔧 Server vs Client Component

```typescript
// ✅ Server Component (기본값) - 데이터 fetching
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Client Component - 상호작용 필요시만
'use client';
import { useState } from 'react';
export function Button() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

---

## 📦 상수 관리 (2회 이상 사용 시 필수)

```typescript
// constants/api.ts
export const API = {
  ROOMS: '/api/rooms',
  ROOM: (id: string) => `/api/rooms/${id}`,
} as const;

// 사용
import { API } from '@/constants';
fetch(API.ROOM(roomId));  // ✅
fetch(`/api/rooms/${roomId}`);  // ❌ 하드코딩 금지
```

---

## 🏷️ 시맨틱 HTML 필수

| 용도 | 태그 |
|------|------|
| 페이지 메인 | `<main>` |
| 섹션 | `<section>` |
| 버튼 | `<button>` (div onClick ❌) |
| 링크 | `<a href>` (span onClick ❌) |

---

## 🖼️ 이미지 필수 속성 (SEO)

```tsx
// ✅ 필수
<Image
  src="/photo.jpg"
  alt="식당 외관 사진"  // 필수!
  width={400}
  height={300}
/>

// ❌ 금지
<img src="/photo.jpg" />  // alt 없음
```

---

## 🚫 AI/개발자 금지 사항

| 금지 | 대안 |
|------|------|
| `any` 타입 | 명시적 타입 정의 |
| `console.log` 방치 | 커밋 전 제거 |
| 하드코딩 문자열 | 상수 사용 |
| `<div onClick>` | `<button>` 사용 |
| 이미지 alt 누락 | 의미 있는 설명 추가 |
| 200줄 초과 파일 | 모듈 분리 |

---

## 📝 커밋 메시지

```
feat(vote): 투표 마감 기능 추가
fix(map): 마커 클릭 오류 수정
refactor(api): 에러 핸들링 통일
docs: README 업데이트
```

---

## 🔗 전체 문서

자세한 내용은 [CONVENTION.md](./CONVENTION.md) 참고
