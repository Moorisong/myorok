# 앱 전용 코드 컨벤션 (React Native/Expo)

> React Native + Expo 앱에만 적용되는 규칙

📌 **다른 문서**: [공통 규칙](./CONVENTION_COMMON.md) | [웹 전용](./CONVENTION_WEB.md)

---

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

## 3. Pressable vs TouchableOpacity ⭐ 필수

> **Pressable 우선 사용** - 최신 API, 더 나은 접근성

```typescript
// ✅ 우선 사용 - Pressable (최신 권장)
import { Pressable } from 'react-native';

<Pressable 
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed  // 눌림 상태 스타일
  ]}
  accessible={true}
  accessibilityRole="button"
>
  <Text>버튼</Text>
</Pressable>

// ⚠️ 레거시 - TouchableOpacity
// 기존 코드 유지만, 새 코드에서는 Pressable 사용
```

---

## 4. Platform 분기 처리

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

## 5. 색상 상수 관리 ⭐ 필수

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

## 6. Expo Icons 사용 규칙

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

## 7. Expo Router 네비게이션 ⭐ 필수

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

## 8. useFocusEffect 훅 사용 ⭐ 중요

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

---

## 9. TextInput 키보드 설정

```typescript
<TextInput
  keyboardType="numeric"        // 숫자 입력
  keyboardType="email-address"  // 이메일
  keyboardType="phone-pad"      // 전화번호
  autoCapitalize="none"         // 자동 대문자 방지
  autoCorrect={false}           // 자동 수정 방지
  returnKeyType="done"          // 완료 버튼
  placeholder="입력하세요"
/>
```

---

## 10. FlatList vs ScrollView 선택 기준 ⭐ 중요

> **20개 이상 항목 → FlatList** (가상화로 성능 최적화)

```typescript
// ✅ 데이터 많을 때 (20개 이상) - FlatList
<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  keyExtractor={item => item.id}
  initialNumToRender={10}
/>

// ✅ 적은 데이터 (20개 미만) - ScrollView
<ScrollView>
  {items.map(item => <Item key={item.id} data={item} />)}
</ScrollView>
```

---

## 11. Alert vs Modal 선택

```typescript
// ✅ 간단한 확인 - Alert (네이티브)
import { Alert } from 'react-native';

Alert.alert('제목', '메시지', [
  { text: '취소', style: 'cancel' },
  { text: '확인', onPress: () => handleConfirm() }
]);

// ✅ 복잡한 UI - Modal 컴포넌트
import { Modal } from 'react-native';

<Modal 
  visible={visible} 
  transparent 
  animationType="fade"
  onRequestClose={handleClose}
>
  <View style={styles.modalOverlay}>
    {/* 커스텀 UI */}
  </View>
</Modal>
```

---

## 12. Image vs Expo Image

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

---

## 13. 접근성 (Accessibility) 속성 ⭐ 필수

> **모든 인터랙티브 요소에 접근성 속성 필수**

```typescript
// ✅ 버튼 접근성
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="메뉴 열기"
  accessibilityHint="탭하면 메뉴가 열립니다"
  onPress={handlePress}
>
  <Feather name="menu" size={24} />
</Pressable>

// ✅ 이미지 접근성
<Image
  source={profileImage}
  accessible={true}
  accessibilityLabel="고양이 프로필 사진"
  accessibilityRole="image"
/>

// ✅ 텍스트 입력 접근성
<TextInput
  accessible={true}
  accessibilityLabel="이름 입력"
  accessibilityHint="반려동물 이름을 입력하세요"
/>
```

| 속성 | 설명 | 필수 여부 |
|------|------|----------|
| `accessibilityRole` | 요소 유형 (button, header, image, text 등) | ✅ 필수 |
| `accessibilityLabel` | 스크린리더가 읽을 텍스트 | ✅ 필수 |
| `accessibilityHint` | 추가 설명 (선택적) | ⚠️ 권장 |
| `accessible` | 접근성 활성화 | ✅ 필수 |

---

## 14. 환경변수 규칙 (Expo)

```typescript
// .env 파일
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

// ✅ 사용
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ⚠️ 주의: EXPO_PUBLIC_ 접두사 필수 (클라이언트 접근)
// NEXT_PUBLIC_ (웹) ≠ EXPO_PUBLIC_ (앱)
```

---

## 15. 컴포넌트 파일 구조 ⭐ 권장

```typescript
// components/Header/index.tsx (default export 사용)
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export default function Header({ title, showBack }: HeaderProps) {
  const router = useRouter();
  
  return (
    <View style={styles.header}>
      {showBack && (
        <Pressable onPress={() => router.back()}>
          <Text>←</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

// ✅ 스타일은 컴포넌트 하단에 위치
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

// components/index.ts (re-export)
export { default as Header } from './Header';
export { default as Card } from './Card';
```

---

## 16. SQLite 사용 규칙 (expo-sqlite) ⭐ 필수

> **Parameterized Query 필수** - SQL Injection 방지

```typescript
import * as SQLite from 'expo-sqlite';

// ✅ 데이터베이스 열기
const db = await SQLite.openDatabaseAsync('app.db');

// ✅ Parameterized Query (필수)
await db.runAsync(
  'INSERT INTO users (id, name) VALUES (?, ?)',
  [userId, userName]
);

const users = await db.getAllAsync(
  'SELECT * FROM users WHERE age > ?',
  [minAge]
);

// ❌ 금지 - String Interpolation (SQL Injection 취약)
await db.runAsync(`INSERT INTO users VALUES ('${userId}', '${userName}')`);
```

---

## 17. 성능 최적화 - React.memo

> **FlatList 아이템은 React.memo 필수**

```typescript
// ✅ 리스트 아이템은 React.memo로 감싸기
const ListItem = React.memo(({ item, onPress }: Props) => {
  return (
    <Pressable onPress={() => onPress(item.id)} style={styles.item}>
      <Text>{item.title}</Text>
    </Pressable>
  );
});

// FlatList에서 사용
<FlatList
  data={items}
  renderItem={({ item }) => (
    <ListItem item={item} onPress={handlePress} />
  )}
  keyExtractor={item => item.id}
/>
```

---

## 18. 디버깅 - console.log 제거 규칙

```typescript
// ✅ 개발 중에만 로그 출력
if (__DEV__) {
  console.log('Debug info:', data);
}

// ❌ 프로덕션에 console.log 금지
// ESLint 설정으로 자동 검출
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

---

## 요약: 앱 필수 규칙 10가지

1. ✅ **StyleSheet.create()** 사용 (인라인 스타일 금지)
2. ✅ **SafeAreaView** with `edges` 속성
3. ✅ **COLORS 상수** 사용 (하드코딩 금지)
4. ✅ **Expo Router** 네비게이션
5. ✅ **접근성 속성** (accessibilityRole, accessibilityLabel 필수)
6. ✅ **SQL Parameterized Queries** (Injection 방지)
7. ✅ **Pressable** over TouchableOpacity
8. ✅ **useFocusEffect** for data refresh
9. ✅ **FlatList** for large lists (20개 이상)
10. ✅ **React.memo** for list items
