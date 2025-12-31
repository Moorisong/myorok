# Common Error Handling

> Error Boundary 및 Suspense 패턴

## Error Boundary & Suspense 패턴

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
