# Web CSS Convention

> 스타일링 규칙 (Tailwind CSS, CSS Modules)

## 1. Tailwind CSS 클래스 정렬 ⭐ 권장

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

## 2. CSS Modules 규칙 (옵션)

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
