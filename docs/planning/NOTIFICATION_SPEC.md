# 푸시 알림 기능 명세 (v1)

## 1. 개요
앱 사용자에게 필요한 정보를 적시에 전달하여 **참여 유도**, **기록 습관 유지**를 목표로 합니다.

---

## 2. 알림 종류 및 로직

### 2.1 최근 15일 이전 기록 접근 안내
- **트리거**: 캘린더에서 오늘로부터 15일 이전의 날짜를 선택 시
- **동작**: 화면 하단에 Toast 메시지 표시
- **메시지**: "프리미엄에서 전체 기록을 확인할 수 있어요."
- **구현**: 클라이언트 로컬 체크 (`calendar.tsx`)

### 2.2 내 글에 댓글이 달렸을 때
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

### 2.3 3일 연속 미활동 (Inactivity) - v1 MVP

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
    type: String, // 'COMMENT', 'INACTIVITY'
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
