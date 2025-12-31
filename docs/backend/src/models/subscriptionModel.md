# Subscription Model

**파일**: `src/models/subscriptionModel.ts`
**컬렉션명**: `subscriptions`

> **용도**: 유료 구독 상태 관리 (Server-side Validation Backup)

## 스키마 정의

```typescript
{
  deviceId: string (index, unique),
  status: 'free' | 'premium',
  startedAt: Date,
  expiredAt: Date | null
}
```

## 규칙
- 실제 결제 검증은 클라이언트(인앱결제)에서 주로 처리
- 서버는 결제 영수증 검증 후 상태를 동기화하여 저장하는 역할
- 기기 변경 시 구독 상태 복구용으로 활용 가능
