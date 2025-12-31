# App Components Convention

> 컴포넌트 구조, 핵심 컴포넌트 사용법, 리스트 처리

## 1. 컴포넌트 파일 구조 ⭐ 권장

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

## 2. Pressable vs TouchableOpacity ⭐ 필수

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

## 3. FlatList vs ScrollView 선택 기준 ⭐ 중요

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

## 4. Alert vs Modal 선택

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

## 5. 성능 최적화 - React.memo

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

## 6. TextInput 설정

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
