# Subscription Controller & API

**관련 파일**: 
- `routes/subscriptionRoutes.ts`
- `controllers/subscriptionController.ts`
- `services/subscriptionService.ts`

## 유료 상태 조회

**Endpoint**: `GET /api/subscription/status`
**Query**: `?deviceId=xxx`

**처리 흐름**:
1. `subscriptionController.getStatus()`: deviceId 추출
2. `subscriptionModel.findOne()`: DB 조회
3. `status` 필드 및 만료일 판단하여 응답

**응답**:
```json
{
  "status": "free | premium"
}
```
