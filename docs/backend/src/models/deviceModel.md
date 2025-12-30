# Device Model

**파일**: `src/models/deviceModel.ts`
**컬렉션명**: `devices`

> **용도**: Push 알림을 위한 Expo Push Token 저장

## 스키마 정의

```typescript
{
  deviceId: string (index, unique),
  pushToken: string,
  updatedAt: Date
}
```

## 규칙
- deviceId 당 1개 문서 (1:1 매핑)
- 토큰 업데이트 시 overwrite (마지막 로그인 기기 기준)
