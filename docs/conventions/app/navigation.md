# App Navigation Convention

> Expo Router 및 네비게이션 관련 규칙

## 1. Expo Router 네비게이션 ⭐ 필수

> **파일 기반 라우팅** - Next.js App Router와 유사

```typescript
import { useRouter, Link, Redirect } from 'expo-router';

// ✅ 프로그래매틱 네비게이션
const router = useRouter();
router.push('/settings');      // 새 화면으로 이동
router.back();                 // 뒤로가기
router.replace('/home');       // 현재 화면 교체 (뒤로가기 불가)

// ✅ 선언적 네비게이션
<Link href="/settings" asChild>
  <Pressable>
    <Text>설정</Text>
  </Pressable>
</Link>

// 파일 구조:
// app/(tabs)/index.tsx → /
// app/(tabs)/settings.tsx → /settings
// app/about.tsx → /about
// app/(tabs)/_layout.tsx → 탭 레이아웃
```

---

## 2. useFocusEffect 훅 사용 ⭐ 중요

> **화면 포커스 시 실행** - 탭 이동, 뒤로가기에도 반응

```typescript
import { useFocusEffect } from 'expo-router';

// ✅ 화면 포커스 시 데이터 새로고침
useFocusEffect(
  useCallback(() => {
    loadData();
  }, [])
);

// ❌ useEffect는 mount 시만 실행 (탭 이동 시 실행 안됨)
useEffect(() => {
  loadData();  // 탭 전환 시 호출되지 않음
}, []);
```
