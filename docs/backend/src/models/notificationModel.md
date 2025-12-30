# Notification Model

**파일**: `src/models/notificationModel.ts`
**컬렉션명**: `notifications`

> **용도**: 전송된 푸시 알림의 이력 저장 (알림함 기능용)

## 스키마 정의

```typescript
{
  deviceId: string (index),
  type: 'COMMENT' | 'SYSTEM',
  title: string,
  body: string,
  isRead: boolean,
  createdAt: Date
}
```

## 규칙
- deviceId로 조회 (알림 목록)
- 사용자가 확인 시 `isRead` 업데이트
- `createdAt` 기준 정렬 및 만료 처리 (TTL Index 고려 가능)
