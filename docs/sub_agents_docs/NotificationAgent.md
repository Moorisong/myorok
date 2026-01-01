# Notification Agent Reference

## Notification Spec (NOTIFICATION_SPEC.md)
# 푸시 알림 기능 명세 (v1)

## 1. 개요
앱 사용자에게 필요한 정보를 적시에 전달하여 **참여 유도**, **기록 습관 유지**를 목표로 합니다.

---

## 2. 알림 종류 및 로직

### 2.1 내 글에 댓글이 달렸을 때
- **트리거**: 쉼터(Comfort) 탭에서 유저의 글에 새 댓글이 등록될 때
- **대상**: 해당 글 작성자 (deviceToken 기준)
- **동작**: Expo Push Notification 발송
- **메시지**:
  - 타이틀: "새 댓글이 달렸어요 💬"
  - 바디: "작성하신 글에 새로운 댓글이 등록되었습니다."
- **구현**:
  - Backend: 댓글 작성 API에서 작성자와 글 주인이 다를 경우 `sendPushNotification` 호출
  - **중복 방지**:
    - 동일 유저, 댓글 타입에 대해 **3시간 쿨타임** 적용
    - 쿨타임 중에는 카운트만 누적, 누적 3개 이상 시 즉시 발송 후 리셋
  - Mobile: 앱 실행 시 Expo Push Token을 발급받아 서버에 등록

### 2.2 3일 연속 미활동 (Inactivity) - v1 MVP

> **중요**: "미활동"은 **앱 미접속** 기준이며, 기록 여부와 무관합니다. 정확한 기록 기반 판단은 v2에서 서버 cron 기반으로 구현 예정입니다.

- **트리거**: 앱 실행 시 로컬 알림 스케줄링 리셋
- **동작**: 앱이 3일(72시간) 동안 실행되지 않으면 로컬 알림 발생
- **메시지**:
  - 타이틀: "3일 동안 기록이 없어요 😿"
  - 바디: "오늘 고양이 상태를 기록해 주세요."
- **중복 방지**:
  - 동일 알림 타입(INACTIVITY)은 항상 1건만 예약
  - 앱 실행 시마다 이전 예약을 취소하고 새로 설정 (3일 타이머 리셋)
- **구현**:
  - Mobile: `NotificationService`에서 `cancelAll` 후 단일 스케줄 등록
  - 로컬 알림 특성상 서버 체크 불가
- **기술적 제약**: 알림은 "기록 없음"이 아닌 "앱 미접속 3일"을 의미
- **테스트 방법**:
  - 개발 시 3일 → 10초로 변경하여 테스트
  - 알림 테스트 페이지에서 "10초 뒤 알림 예약" 버튼 사용

### 2.3 체험 종료 24시간 전 푸시 알림

- **목적**: 무료 체험 사용자가 체험 종료 전에 구독 결정을 할 수 있도록 알림
- **트리거**: 체험 종료 24시간 전
- **대상**: `subscriptionStatus === "trial"` 상태 사용자
- **메시지**:
  - 타이틀: "무료 체험이 곧 종료됩니다!"
  - 바디: "무료 체험 기간 동안 기록을 즐겨보셨나요? 체험이 내일 종료됩니다. 계속 사용하려면 구독이 필요합니다."
  - 액션: 구독 화면 이동 (`GO_TO_SUBSCRIBE`)
- **계산 로직**:
  ```
  trialEndDate = trialStartDate + 7일
  pushDate = trialEndDate - 1일 (24시간 전)
  ```
- **발송 조건**:
  - `subscriptionStatus === "trial"`
  - 현재 날짜 ≥ pushDate
  - 이전에 알림을 이미 발송하지 않은 경우
- **로컬 DB 저장**:
  ```typescript
  {
    userId: String,
    lastTrialPushAt: Date,    // 마지막 푸시 발송 시각 (ISO 8601)
    nextTrialPushAt: Date      // 다음 발송 예정 시각 (ISO 8601)
  }
  ```
- **중복 방지**:
  - 하루 1회만 알림
  - 발송 후 `lastTrialPushAt` 업데이트
  - 체험 종료 후 알림 중복 금지
- **구현**:
  - Backend: 사용자 체험 시작일 기록 (`trialStartDate`)
  - Mobile: 앱 실행 시 체험 종료 날짜 계산 및 푸시 예약
  - 알림 미수신 시: 앱 실행 시 로컬 체크 후 푸시 트리거 가능
- **플로우**:
  ```
  체험 시작일 기록
     │
     ▼
  체험 6일째
     │
     ▼
  푸시 알림 예약
     │
     ▼
  푸시 발송
     │
     ▼
  사용자 클릭 → 구독 화면
     │
     ▼
  구독 완료 → subscriptionStatus = active
  ```

---

## 3. 기술 스택 및 데이터베이스

### 3.1 Backend (Next.js API)
- **Device Model**: `deviceId`와 `pushToken` 매핑 저장
  ```typescript
  {
    deviceId: String,
    pushToken: String,
    settings: {
      inactivity: Boolean
    },
    updatedAt: Date
  }
  ```
- **Notification Model**: 발송 이력 저장
  ```typescript
  {
    deviceId: String,
    type: String, // 'COMMENT', 'INACTIVITY', 'TRIAL_END'
    title: String,
    body: String,
    createdAt: Date
  }
  ```

### 3.2 Mobile (Expo)
- **Library**: `expo-notifications`, `expo-device`
- **Permission**: 앱 최초 실행 시 권한 요청
- **Token**: Expo Push Token 사용
- **Local Notifications**: INACTIVITY 타입은 로컬 알림만 사용 (서버 푸시 ❌)

---

## 4. 푸시 알림 삭제 주기

### 4.1 목적
푸시 알림 데이터를 장기적으로 쌓아두면 DB 용량이 증가할 수 있으므로, 적절한 주기로 삭제하여 서버 안정성을 확보합니다.

### 4.2 삭제 주기 정책

| 알림 종류 | 삭제 기준 |
|-----------|-----------|
| 댓글 알림 (Comfort Comment) | 발송 후 10일 경과 시 삭제 |
| 미활동 알림 (Inactivity) | 발송 후 10일 경과 시 삭제 |
| 읽은 알림 (Read Notification) | 읽은 후 10일 경과 시 삭제 |

### 4.3 구현 방식
- 삭제는 백그라운드 크론 작업 또는 정기 배치로 수행
- 삭제 주기는 추후 DB 용량 및 서버 상태에 따라 유동적으로 조정 가능
- 서버 로그에는 삭제 이력 기록 필요 없음

---

## AI 작업 지침

### 목적
푸시 알림 시스템을 구현하고 관리하는 AI 에이전트를 위한 가이드

### 작업 단계

#### 1. 댓글 알림 구현
1. Backend API (`/api/comfort/comments`)에서 댓글 작성 시 알림 발송 로직 추가
2. `sendPushNotification` 함수 구현 (Expo Push API 사용)
3. 중복 방지 로직: 3시간 쿨타임 + 3개 누적 시 즉시 발송
4. Notification Model에 발송 이력 저장

#### 2. 미활동 알림 구현
1. Mobile `NotificationService` 생성
2. 앱 실행 시 이전 알림 취소 (`cancelAll`)
3. 3일 후 로컬 알림 예약 (`scheduleNotificationAsync`)
4. 테스트 모드: 3일 → 10초로 변경 가능하도록 구성

#### 3. 체험 종료 알림 구현
1. Backend: `subscription_state` 테이블에 `trialStartDate` 저장
2. Mobile: 앱 실행 시 체험 종료일 계산
   ```typescript
   const trialEndDate = addDays(trialStartDate, 7);
   const pushDate = subDays(trialEndDate, 1);
   ```
3. 푸시 예약: `scheduleNotificationAsync`로 pushDate에 알림 설정
4. 로컬 DB에 `lastTrialPushAt`, `nextTrialPushAt` 저장
5. 알림 클릭 시 구독 화면 이동 처리 (`GO_TO_SUBSCRIBE` 액션)
6. 구독 상태 변경 시 알림 취소

#### 4. DB 모델 업데이트
1. Notification type에 `TRIAL_END` 추가
2. Device settings에 `trialNotification: Boolean` 추가
3. User/Subscription 테이블에 `lastTrialPushAt`, `nextTrialPushAt` 컬럼 추가

### 주의사항

- **Android 전용**: iOS 관련 코드 작성 금지
- **권한 체크**: `expo-notifications` 권한 요청 필수
- **중복 방지**: 각 알림 타입별 중복 방지 로직 구현
- **에러 처리**: Expo Push Token 발급 실패 시 재시도 로직
- **테스트**: 개발 환경에서 시간 단축 버전으로 테스트 가능하도록 구성
- **데이터 정책**: 알림 이력은 10일 후 삭제 (데이터 보존 정책과 별개)

### 구현 가이드

**Expo Push Notification 발송 예시:**
```typescript
async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

**로컬 알림 예약 예시:**
```typescript
import * as Notifications from 'expo-notifications';

async function scheduleLocalNotification(seconds: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "3일 동안 기록이 없어요 😿",
      body: "오늘 고양이 상태를 기록해 주세요.",
    },
    trigger: {
      seconds: seconds,
    },
  });
}
```

**체험 종료 알림 계산 예시:**
```typescript
import { addDays, subDays, isBefore } from 'date-fns';

function calculateTrialEndPushDate(trialStartDate: Date): Date {
  const trialEndDate = addDays(trialStartDate, 7);
  const pushDate = subDays(trialEndDate, 1);
  return pushDate;
}

async function scheduleTrialEndNotification(userId: string, trialStartDate: Date) {
  const pushDate = calculateTrialEndPushDate(trialStartDate);

  // 이미 발송했는지 확인
  const lastPush = await getLastTrialPushDate(userId);
  if (lastPush && isBefore(pushDate, lastPush)) {
    return; // 이미 발송됨
  }

  // 알림 예약
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "무료 체험이 곧 종료됩니다!",
      body: "무료 체험 기간 동안 기록을 즐겨보셨나요? 체험이 내일 종료됩니다. 계속 사용하려면 구독이 필요합니다.",
      data: { action: 'GO_TO_SUBSCRIBE' },
    },
    trigger: {
      date: pushDate,
    },
  });

  // DB 업데이트
  await updateLastTrialPushDate(userId, new Date());
}
```
