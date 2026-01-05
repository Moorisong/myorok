# App Initialization Module

> 앱 시작 시 결제 시스템 초기화

## 목적

앱이 시작될 때 Google Play 결제 시스템을 초기화하고 구독 상태를 복원합니다.

## 독립성

⚠️ **implementation 의존** - `paymentService.ts`의 초기화 함수 사용  
✅ 앱 라이프사이클만 다룸

---

## 작업 내용

### 파일 수정

**파일 위치**: `apps/mobile/app/_layout.tsx`

### 구현

```typescript
// apps/mobile/app/_layout.tsx

import { useEffect } from 'react';
import { initializePayment, disconnectPayment } from '@/services/paymentService';
import { checkAndRestoreSubscription } from '@/services/subscription';

export default function RootLayout() {
  // 결제 시스템 초기화
  useEffect(() => {
    const initPayment = async () => {
      try {
        console.log('Initializing payment system...');
        
        // 1. Google Play 결제 시스템 연결
        await initializePayment();
        
        // 2. 기존 구독 복원 (재설치 시)
        await checkAndRestoreSubscription();
        
        console.log('Payment system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize payment system:', error);
        // 초기화 실패해도 앱은 계속 실행
      }
    };

    initPayment();
    
    // Cleanup: 앱 종료 시 결제 시스템 연결 해제
    return () => {
      disconnectPayment().catch(error => {
        console.error('Failed to disconnect payment system:', error);
      });
    };
  }, []);

  return (
    // ... 기존 레이아웃 코드
  );
}
```

---

## 동작 설명

### 1. 앱 시작 시 (useEffect 실행)
1. `initializePayment()` 호출 → Google Play 결제 시스템 연결
2. `checkAndRestoreSubscription()` 호출 → 구독 복원 및 License 확인
3. License Response에 따라 로컬 DB 상태 업데이트

### 2. 앱 종료 시 (cleanup 함수)
1. `disconnectPayment()` 호출 → Google Play 연결 해제
2. 리소스 정리

### 3. 재설치 시나리오
```
사용자 앱 제거 → 재설치 → 앱 실행
   ↓
   initPayment()
   ↓
   checkAndRestoreSubscription()
   ↓
   Google Play에서 구독 내역 조회
   ↓
   활성 구독 있음 → LICENSED → isPro=true
   활성 구독 없음 → NOT_LICENSED → isPro=false
```

---

## 주의사항

- ✅ 초기화 실패해도 앱은 계속 실행되어야 함
- ✅ cleanup 함수 반드시 구현 (메모리 릭 방지)
- ✅ 에러는 로그만 출력, 사용자에게 알림 표시 안 함
- ✅ 백그라운드 실행 (사용자 차단하지 않음)

---

## 테스트 체크리스트

- [ ] 앱 최초 설치 시 초기화 성공
- [ ] 앱 재실행 시 초기화 성공
- [ ] 앱 재설치 시 구독 복원 성공
- [ ] 초기화 실패 시에도 앱 정상 실행
- [ ] 앱 종료 시 cleanup 정상 실행
- [ ] 네트워크 없을 때도 앱 정상 실행

---

## 출력 파일

- `apps/mobile/app/_layout.tsx` (수정)

---

## 참조

- [implementation.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/implementation.md) - 초기화 함수
- [spec.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/features/payment/spec.md) - 앱 시작 시 플로우
