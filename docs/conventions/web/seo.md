# Web SEO Convention

> 검색엔진 최적화, 이미지, 메타데이터, 환경변수

## 1. 이미지 규칙

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

---

## 2. 메타 태그 (Next.js 15)

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

## 3. 환경변수 규칙

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
