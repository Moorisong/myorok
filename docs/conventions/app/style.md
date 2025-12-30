# App Style Convention

> 스타일링, 레이아웃, 플랫폼 분기, 색상 관련 규칙

## 1. StyleSheet 사용 규칙 ⭐ 필수

> **모든 스타일은 `StyleSheet.create()` 사용 필수** - 성능 최적화 및 타입 안전성

```typescript
// ✅ 올바른 사용 - StyleSheet.create()
import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
});

// ❌ 잘못된 사용 - 인라인 객체 (성능 저하)
<View style={{ flex: 1, padding: 16 }} />

// ⚠️ 예외: 동적 값만 인라인 허용
<View 
  style={[
    styles.container, 
    { width: dynamicWidth }  // 동적 값만 인라인
  ]} 
/>
```

---

## 2. SafeAreaView 사용 규칙 ⭐ 필수

> **`react-native-safe-area-context` 사용 필수** - 노치/홈 인디케이터 영역 대응

```typescript
// ✅ 올바른 사용 - edges 명시
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container} edges={['top']}>
  {/* 화면 콘텐츠 */}
</SafeAreaView>

// ❌ 잘못된 사용 - react-native의 SafeAreaView (구식, 안드로이드 미지원)
import { SafeAreaView } from 'react-native';  // ❌ 사용 금지
```

| edges 옵션 | 설명 | 사용 시기 |
|-----------|------|----------|
| `['top']` | 상단만 적용 | 가장 일반적 (헤더 있는 화면) |
| `['bottom']` | 하단만 적용 | 탭바 있을 때 |
| `['top', 'bottom']` | 상하단 | 전체 화면 |
| `[]` | SafeArea 없음 | 배경 이미지 등 |

---

## 3. Platform 분기 처리

> **iOS/Android 차이 처리** - Platform.OS 사용

```typescript
import { Platform } from 'react-native';

// ✅ 스타일 내 Platform 분기
const styles = StyleSheet.create({
  toast: {
    bottom: Platform.OS === 'ios' ? 100 : 80,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
});

// ✅ KeyboardAvoidingView behavior
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
```

---

## 4. 색상 상수 관리 ⭐ 필수

> **모든 색상은 COLORS 상수 사용** - 하드코딩 금지

```typescript
// constants/colors.ts
export const COLORS = {
  primary: '#5DB075',       // Soft Green
  secondary: '#6B6B6B',     // Warm Gray
  background: '#F7F7F7',    // Light Gray
  surface: '#FFFFFF',       // White
  textPrimary: '#2E2E2E',   // Dark Gray
  textSecondary: '#8A8A8A', // Gray
  border: '#E0E0E0',        // Light Border
  error: '#E57373',         // Soft Red
  warning: '#FFB300',       // Amber
} as const;

// ✅ 사용
import { COLORS } from '@/constants';
backgroundColor: COLORS.primary

// ❌ 금지 - 하드코딩
backgroundColor: '#5DB075'
```

---

## 5. Expo Icons 사용 규칙

```typescript
import { Feather } from '@expo/vector-icons';

// ✅ 올바른 사용
<Feather name="menu" size={24} color={COLORS.textPrimary} />

// 권장 아이콘 라이브러리:
// - Feather: 일반 UI 아이콘
// - MaterialIcons: Material Design
// - Ionicons: iOS 스타일
```

---

## 6. Image vs Expo Image

```typescript
// ✅ 최신 권장 - expo-image (성능 우수)
import { Image } from 'expo-image';

<Image
  source={require('./image.png')}
  style={styles.image}
  contentFit="cover"
  transition={1000}
  placeholder={blurhash}
/>

// ⚠️ 레거시 - react-native Image
// 새 프로젝트는 expo-image 사용 권장
```
