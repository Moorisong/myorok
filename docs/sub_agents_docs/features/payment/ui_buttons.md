# UI Buttons Module

> 결제 버튼 및 결제창 UI 구현

## 목적

결제 관련 버튼과 모달/창을 구현하고 결제 상태에 따른 UI를 분기합니다.

## 독립성

⚠️ **implementation 의존** - `paymentService.ts`와 `licenseChecker.ts`의 함수 사용  
✅ 프론트엔드 UI만 다룸

---

## 작업 내용

### 1. 결제 페이지 수정

**파일 위치**: `apps/mobile/app/(tabs)/settings/pro.tsx`

#### 1.1 서비스 임포트
```typescript
import { purchaseSubscription } from '@/services/paymentService';
import { handlePurchaseSuccess } from '@/services/subscription';
```

#### 1.2 구독 상태 조회
```typescript
const [subscriptionState, setSubscriptionState] = useState<'free' | 'trial' | 'active' | 'expired'>('free');

useEffect(() => {
  // 로컬 DB에서 구독 상태 조회
  const loadSubscriptionState = async () => {
    const state = await getSubscriptionState();
    setSubscriptionState(state);
  };
  loadSubscriptionState();
}, []);
```

### 2. 버튼 구현

#### 2.1 "구독 시작 / 결제하기" 버튼
```typescript
const handleSubscribe = async () => {
  try {
    const success = await purchaseSubscription();
    if (success) {
      await handlePurchaseSuccess();
      // UI 업데이트
      setSubscriptionState('active');
    } else {
      showToast('결제가 취소되었습니다', 'info');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    showToast('결제 중 오류가 발생했습니다', 'error');
  }
};

// 버튼 컴포넌트
{subscriptionState !== 'active' && (
  <TouchableOpacity 
    style={styles.subscribeButton}
    onPress={handleSubscribe}
  >
    <Text style={styles.subscribeButtonText}>구독 시작 / 결제하기</Text>
  </TouchableOpacity>
)}
```

#### 2.2 "무료 체험 시작" 버튼
```typescript
const handleStartTrial = async () => {
  try {
    await startTrialSubscription(); // 로컬 DB에 trial 상태 저장
    setSubscriptionState('trial');
    showToast('무료 체험이 시작되었습니다', 'success');
  } catch (error) {
    console.error('Trial start error:', error);
    showToast('오류가 발생했습니다', 'error');
  }
};

// 버튼 컴포넌트
{subscriptionState === 'free' && (
  <TouchableOpacity 
    style={styles.trialButton}
    onPress={handleStartTrial}
  >
    <Text style={styles.trialButtonText}>무료 체험 시작</Text>
  </TouchableOpacity>
)}
```

### 3. 상태별 UI 분기

```typescript
{subscriptionState === 'active' && (
  <View style={styles.activeSubscription}>
    <Text style={styles.activeText}>✓ 구독 중</Text>
    <Text style={styles.activeSubtext}>프리미엄 기능 사용 가능</Text>
  </View>
)}

{subscriptionState === 'trial' && (
  <View style={styles.trialSubscription}>
    <Text style={styles.trialText}>무료 체험 중</Text>
    <Text style={styles.trialSubtext}>7일 후 자동 만료</Text>
  </View>
)}

{(subscriptionState === 'free' || subscriptionState === 'expired') && (
  <View style={styles.freeSubscription}>
    <Text style={styles.freeText}>무료 사용자</Text>
  </View>
)}
```

### 4. 에러 메시지 처리

```typescript
// 토스트 유틸리티 (apps/mobile/utils/toast.ts)
export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  // Toast 또는 Alert 구현
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // Alert fallback
    Alert.alert('알림', message);
  }
}
```

**메시지 종류**:
- 성공: "구독이 활성화되었습니다"
- 실패: "결제가 취소되었습니다"
- 에러: "일시적인 오류가 발생했습니다. 다시 시도해주세요"

### 5. 스타일

```typescript
const styles = StyleSheet.create({
  subscribeButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trialButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  trialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeSubscription: {
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignItems: 'center',
  },
  activeText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '700',
  },
  activeSubtext: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 4,
  },
});
```

---

## 테스트 체크리스트

- [ ] "구독 시작 / 결제하기" 버튼 클릭 시 결제창 표시
- [ ] "무료 체험 시작" 버튼 클릭 시 trial 상태 저장
- [ ] 구독 중일 때 버튼 비활성화
- [ ] 결제 성공 시 UI 업데이트
- [ ] 결제 실패 시 적절한 메시지 표시
- [ ] 에러 발생 시 에러 메시지 표시
- [ ] 각 상태별 UI 정상 표시

---

## 출력 파일

- `apps/mobile/app/(tabs)/settings/pro.tsx` (수정)
- `apps/mobile/utils/toast.ts` (신규 또는 확장)

---

## 참조

- [implementation.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/implementation.md) - 사용하는 서비스 함수
- [spec.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/spec.md) - UI 요구사항
