# Backup Controller & API

**관련 파일**: 
- `routes/backupRoutes.ts`
- `controllers/backupController.ts`
- `services/backupService.ts`

## 1. 백업 업로드

**Endpoint**: `POST /api/backup`

**요청 Body**:
```json
{
  "deviceId": "string",
  "data": { ...sqlite_export_json }
}
```

**처리 흐름**:
1. `backupController.uploadBackup()`: Payload 파싱
2. `backupService.validateData()`: JSON 구조 검증
3. `backupModel.findOneAndUpdate()`: deviceId 기준 upsert 수행
4. `updatedAt` 최신화

**응답**:
```json
{ "success": true }
```

---

## 2. 백업 다운로드

**Endpoint**: `GET /api/backup/:deviceId`

**처리 흐름**:
1. `backupController.downloadBackup()`: Parameter에서 deviceId 추출
2. `backupModel.findOne()`: 해당 기기의 데이터 조회
3. 데이터 존재 시 JSON 반환

**응답**:
```json
{
  "data": { ...sqlite_export_json }
}
```
