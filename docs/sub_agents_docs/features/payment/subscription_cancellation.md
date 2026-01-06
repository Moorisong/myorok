# Subscription Cancellation Module

> 구독 해지 UI 구현

## 목적

구독 해지 링크를 제공하여 사용자가 Google Play에서 직접 구독을 해지할 수 있도록 합니다.

## 독립성

✅ **완전 독립 모듈** - 다른 모듈과 병렬로 작업 가능  
✅ 독립적인 UI 컴포넌트

---

## 작업 내용

### 파일 수정

**파일 위치**: `apps/mobile/app/(tabs)/settings/pro.tsx` 페이지 하단

### UI 구현

```typescript
import { View, Text, Pressable, Linking } from 'react-native';

// 구독 중일 때만 하단에 해지 링크 표시
{subscriptionState === 'active' && (
  <View style={styles.cancelSection}>
    <Text style={styles.cancelInfo}>
      ℹ️ 구독은 언제든지 취소할 수 있습니다.
    </Text>
    <Pressable
      onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
      style={styles.cancelLink}
    >
      <Text style={styles.cancelLinkText}>구독 해지하기 →</Text>
    </Pressable>
  </View>
)}
```

### 스타일

```typescript
const styles = StyleSheet.create({
  cancelSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 32,
  },
  cancelInfo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  cancelLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44, // 터치 영역 확보
  },
  cancelLinkText: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'none', // 밑줄 없음
  },
});
```

---

## 디자인 원칙

### 1. 낮은 강조 수준
- 색상: 회색 (`#888`)
- 버튼 아님 → 텍스트 링크로 표현
- 결제 버튼보다 덜 눈에 띄게

### 2. 명확한 접근성
- 터치 영역: 최소 44px 확보
- Google Play 정책 준수
- 숨기지 않음

### 3. 위치
- 페이지 최하단 (Footer 영역)
- 구독 상태 표시 아래
- 구독 중일 때만 표시

---

## 동작

### 링크 클릭 시
1. Google Play 구독 관리 페이지로 이동
2. URL: `https://play.google.com/store/account/subscriptions`
3. 사용자가 직접 해지 처리

### 앱에서 하지 않는 것
- ❌ 앱 내 해지 처리
- ❌ 앱 내 해지 API 호출
- ❌ 확인 다이얼로그 표시 (Google Play로 직행)

---

## Google Play 정책 준수

### ✅ 준수 사항
- 해지 경로 명확히 인지 가능
- 해지 버튼 숨기지 않음
- Google Play로 직접 이동
- 앱 내부에서 해지 차단하지 않음

### 심사 대응 문구
```
Users can cancel their subscription anytime by visiting the Google Play subscription management page. The app provides a clear link to this page.
```

---

## 테스트 체크리스트

- [ ] 구독 중일 때만 해지 링크 표시
- [ ] 링크 클릭 시 Google Play 페이지 열림
- [ ] 터치 영역 충분히 확보됨 (최소 44px)
- [ ] 텍스트가 읽기 쉬움
- [ ] 무료 사용자에게는 표시 안 됨

---

## 출력 파일

- `apps/mobile/app/(tabs)/settings/pro.tsx` (수정)

---

## 참조

- [spec.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/spec.md) - Section 10: 구독 해지 UI/UX 명세
