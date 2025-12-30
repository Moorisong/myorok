# Common Import Convention

> 파일 Import 순서 및 경로 규칙

## Import 정렬 규칙

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
