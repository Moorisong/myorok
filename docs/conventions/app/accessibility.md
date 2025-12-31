# App Accessibility Convention

> 모바일 접근성 필수 규격

## 접근성 (Accessibility) 속성 ⭐ 필수

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
