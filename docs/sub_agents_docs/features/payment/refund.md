# Refund Module

> 환불 UI 구현

## 목적

환불 안내를 제공하여 사용자가 Google Play 정책에 따라 환불을 요청할 수 있도록 안내합니다.

## 독립성

✅ **완전 독립 모듈** - 다른 모듈과 병렬로 작업 가능  
✅ 독립적인 UI 컴포넌트

---

## 기본 원칙

> [!CAUTION]
> - 앱 내 환불 처리 ❌
> - 앱 내 환불 요청 API ❌
> - 환불은 **Google Play에서만 처리**
> - 앱은 **안내 + 이동(UI)만 제공**

---

## 작업 내용

### 파일 수정

**파일 위치**: `apps/mobile/app/(tabs)/settings/pro.tsx` 페이지 하단  
**위치**: 구독 해지 링크 아래 또는 동일 영역

### UI 구현

```typescript
import { View, Text, Pressable, Linking } from 'react-native';

// 환불 안내 섹션 (구독 해지 링크 아래에 추가)
{subscriptionState === 'active' && (
  <View style={styles.refundSection}>
    <Text style={styles.refundInfo}>
      환불은 Google Play 정책에 따라 처리됩니다.
    </Text>
    <Pressable
      onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
      style={styles.refundLink}
    >
      <Text style={styles.refundLinkText}>Google Play 구독 관리로 이동 →</Text>
    </Pressable>
  </View>
)}
```

### 스타일

```typescript
const styles = StyleSheet.create({
  refundSection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  refundInfo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  refundLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44, // 터치 영역 확보
  },
  refundLinkText: {
    fontSize: 14,
    color: '#888',
    // textDecorationLine: 'underline', // 선택사항
  },
});
```

### 통합 옵션 (해지와 환불 통합 시)

```typescript
// 해지와 환불을 하나의 링크로 통합할 경우
{subscriptionState === 'active' && (
  <View style={styles.manageSection}>
    <Text style={styles.manageInfo}>
      구독 및 환불 관리
    </Text>
    <Pressable
      onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
      style={styles.manageLink}
    >
      <Text style={styles.manageLinkText}>구독 해지·환불 관리 → Google Play 이동</Text>
    </Pressable>
  </View>
)}
```

---

## 동작

### 링크 클릭 시
1. Google Play 구독 관리 페이지로 이동
2. URL: `https://play.google.com/store/account/subscriptions`
3. 사용자가 Google Play에서 직접 환불 요청
4. ❌ 인앱 WebView 사용 금지 - 외부 브라우저 또는 Play Store 앱 열기

### 앱에서 하지 않는 것

| ❌ 금지 항목 |
|-------------|
| 앱 내 환불 버튼 |
| 환불 요청 폼 |
| 고객센터 환불 접수 |
| 외부 웹 결제/환불 링크 (Google Play 외) |

---

## Google Play 정책 준수

### ✅ 준수 사항
- 앱 내 환불 차단
- 사용자에게 명확한 환불 경로 제공
- Google Play 구독 관리 페이지 직접 연결
- 정책 준수 문구 표시

### 심사 대응 문구

```
This app does not process refunds directly.
Refunds are handled by Google Play according to their policies.
Users can request refunds through the Google Play subscription management page.
```

---

## UX 가이드라인

### 1. 강조하지 않기
- 결제 버튼보다 낮은 강조
- 회색 텍스트 사용
- 버튼이 아닌 텍스트 링크 형태

### 2. 명확성 유지
- 환불 경로 명확히 안내
- Google Play 정책에 따름을 명시
- 앱에서 직접 처리 안 함을 명시

### 3. 접근성 확보
- 터치 영역 최소 44px
- 읽기 쉬운 텍스트
- 구독 중일 때만 표시

---

## 테스트 체크리스트

- [ ] 구독 중일 때만 환불 안내 표시
- [ ] 링크 클릭 시 Google Play 페이지 열림
- [ ] 외부 브라우저 또는 Play Store 앱으로 열림
- [ ] 인앱 WebView 사용 안 함
- [ ] 텍스트가 명확하고 읽기 쉬움
- [ ] 무료 사용자에게는 표시 안 됨

---

## 출력 파일

- `apps/mobile/app/(tabs)/settings/pro.tsx` (수정)

---

## 참조

- [spec.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/spec.md) - Section 11: 환불 UI/UX 명세
- [subscription_cancellation.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/subscription_cancellation.md) - 유사한 UI 패턴
