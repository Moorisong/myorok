# Notification Agent Reference

## Notification Spec (NOTIFICATION_SPEC.md)
# 🔔 알림(Notification) 명세 (v1)

> MVP 단계에서는 **로컬 알림(Local Notification)** 위주 + 최소한의 푸시

---

## 1. 로컬 알림 (Local Notification)

> 서버 없이 앱 자체적으로 스케줄링

### 1.1 리텐션 알림 (Retention)
- **조건**: 마지막 기록 입력 후 **3일간** 앱 실행 없음
- **메시지**:
  - "우리 아이 기록, 잊지 않으셨나요? 📝"
  - "꾸준한 기록이 건강 관리의 첫걸음이에요!"
- **시각**: 오전 10:00 or 오후 8:00 (사용자 설정 가능)

### 1.2 투약 알림 (Medication)
- 사용자가 설정한 투약 시간에 알림 발송
- 반복: 매일 / 격일 / 주간
- **Action**: 알림 꾹 눌러서 '먹였어요' 체크 (Android Action Button 활용)

---

## 2. 푸시 알림 (Remote Push)

> 서버 도입 후 (v1.5~) 구현 예정

### 2.1 커뮤니티(쉼터) 반응
- 내 글에 **댓글**이 달렸을 때
- 내 글에 **위로(좋아요)**가 N개 쌓였을 때

### 2.2 공지사항
- 중요 업데이트, 서버 점검 등

---

## 3. 설정 옵션

| 항목 | 기본값 | 설명 |
|------|--------|------|
| 알림 전체 끄기 | OFF | 마스터 스위치 |
| 기록 알림 | ON | 3일 미접속 시 |
| 투약 알림 | ON | 투약 스케줄 |
| 커뮤니티 알림 | ON | 댓글/좋아요 |
| 마케팅 정보 | OFF | 광고성 정보 |

---

## 4. 기술 스택

- `expo-notifications` 라이브러리 사용
- Android Channel ID 관리 필수 (`myorok_default_channel`)
