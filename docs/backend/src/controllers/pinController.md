# PIN Controller & API

**관련 파일**: 
- `routes/pinRoutes.ts`
- `controllers/pinController.ts`
- `services/pinService.ts`

## 1. PIN 설정

**Endpoint**: `POST /api/settings/pin`

**요청**:
```json
{ "deviceId": "uuid", "pin": "1234" }
```

**로직**:
- `pinService.hashPin(pin)`: bcrypt 해싱
- 기존 PIN 덮어쓰기 (Upsert)
- `failedAttempts` 0으로 초기화

---

## 2. PIN 검증 (잠금 해제)

**Endpoint**: `POST /api/settings/pin/verify`

**요청**:
```json
{ "deviceId": "uuid", "pin": "1234" }
```

**로직**:
1. **잠금 확인**: `lockedUntil` > 현재시간이면 거부 (`ACCOUNT_LOCKED`)
2. **해시 비교**: `pinService.comparePin()`
3. **성공 시**: `failedAttempts = 0`, `{ success: true }` 반환
4. **실패 시**: 
   - `failedAttempts` 증가
   - 5회 도달 시 `lockedUntil` = 현재 + 5분 설정
   - 남은 횟수 포함하여 에러 반환

---

## 3. PIN 상태 조회

**Endpoint**: `GET /api/settings/pin/status?deviceId=xxx`

**응답**:
```json
{
  "success": true,
  "data": {
    "isPinSet": true,
    "isLocked": false,
    "lockedUntil": null,
    "failedAttempts": 0
  }
}
```

---

## 4. PIN 해제

**Endpoint**: `DELETE /api/settings/pin?deviceId=xxx`

**로직**:
- 해당 deviceId의 PIN 데이터 삭제 (Soft Delete 아님)
