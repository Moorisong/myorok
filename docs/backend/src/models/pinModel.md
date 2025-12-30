# PIN Model

**파일**: `src/models/pinModel.ts`
**컬렉션명**: `settings_security`

> **용도**: 앱 잠금(PIN) 설정 및 검증 상태 관리

## 스키마 정의

```typescript
{
  deviceId: string (index, unique),
  pinHash: string,          // bcrypt 해시값
  failedAttempts: number,   // 연속 실패 횟수
  lockedUntil: Date | null, // 잠금 해제 가능 시각
  createdAt: Date,
  updatedAt: Date
}
```

## 보안 규칙
- **PIN 평문 저장 절대 금지**
- `bcrypt` 해시 사용 (salt rounds: 10)
- 5회 실패 시 `lockedUntil` 설정 (5분 잠금)
- 잠금 해제 전까지 모든 인증 요청 거부
