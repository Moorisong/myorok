# 🐾 반려묘 병상일지 앱 – 백엔드 & DB 명세 (v1)

> **목적**
> - v1에서는 **안정적인 데이터 백업/복원** 지원
> - 핵심 역할: **백업/복원**, **유료 상태 검증**, **사용자 인증**
> - 모든 원본 데이터는 **클라이언트 로컬 DB가 기준** (Offline Support)

---

## 1. 백엔드 역할 정의

### v1 필수
- 데이터 백업 저장
- 데이터 복원 제공

### v1 선택
- 유료(Premium) 상태 검증
- 향후 계정 연동 대비

---

## 2. 기술 스택

| 항목 | 기술 |
|------|------|
| 런타임 | Node.js |
| 프레임워크 | Express |
| 데이터베이스 | MongoDB |
| 인증 | 카카오 OAuth + JWT | 필수 |
| 식별자 | userId (Kakao ID) 기반 |

---

## 3. 데이터 구조 개념

### 데이터 철학
- **백엔드는 원본 데이터를 해석하지 않음**
- 앱 로컬 SQLite 전체를 **JSON 덤프 형태로 저장**
- 백엔드는 단순 저장소 역할

---

## 4. MongoDB 스키마

### 4.1 backups

```json
{
  "_id": "ObjectId",
  "deviceId": "string",
  "data": {
    "pets": [],
    "daily_records": [],
    "food_records": [],
    "supplements": [],
    "supplement_records": [],
    "hospital_records": [],
    "custom_metrics": [],
    "custom_metric_records": []
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### 4.2 notifications (v1 추가)

```json
{
  "_id": "ObjectId",
  "deviceId": "string",
  "type": "string", // 'COMMENT' | 'SYSTEM'
  "title": "string",
  "body": "string",
  "isRead": "boolean",
  "createdAt": "ISODate"
}
```

### 4.3 devices (v1 추가)

```json
{
  "_id": "ObjectId",
  "deviceId": "string",
  "pushToken": "string", // Expo Push Token
  "updatedAt": "ISODate"
}
```

| 규칙 | 설명 |
|------|------|
| deviceId 당 | 1개 문서 |
| 백업 시 | overwrite |

| 규칙 | 설명 |
|------|------|
| deviceId 당 | 1개 문서 |
| 백업 시 | overwrite |

---

### 4.2 subscriptions (v1 선택)

```json
{
  "_id": "ObjectId",
  "deviceId": "string",
  "status": "free | premium",
  "startedAt": "ISODate",
  "expiredAt": "ISODate | null"
}
```

| 항목 | 설명 |
|------|------|
| 결제 검증 | 클라이언트에서 처리 |
| 서버 역할 | 상태 전달만 담당 |

---

## 5. API 명세

### 5.1 백업 업로드

```
POST /api/backup
```

**Body:**
```json
{
  "deviceId": "string",
  "data": { ...sqlite_export_json }
}
```

**동작:**
- deviceId 기준으로 기존 데이터 overwrite
- updatedAt 갱신

---

### 5.2 백업 다운로드

```
GET /api/backup/:deviceId
```

**Response:**
```json
{
  "data": { ...sqlite_export_json }
}
```

---

### 5.3 유료 상태 조회 (선택)

```
GET /api/subscription/status?deviceId=xxx
```

**Response:**
```json
{
  "status": "free | premium"
}
```

---

## 6. 보안 및 제한 (v1 기준)

| 항목 | 상태 |
|------|------|
| 인증 | 없음 |
| 암호화 | 없음 |
| 민감 정보 | 없음 |
| 사용 전제 | 집사 개인 사용 |

> v2에서 계정/암호화/자동 백업 도입

---

## 7. 확장 설계 포인트 (v2 대비)

- `deviceId` → `userId` 전환 가능 구조
- backup document에 `version` 필드 추가 가능
- 다묘 지원 데이터 그대로 유지

---

## 요약

```
✅ 클라이언트 로컬 DB가 진짜
✅ 백엔드는 금고 및 인증 처리
✅ 서버와 앱은 유기적으로 동작 (백업/동기화)
✅ "잃지 않는 기록" 완성
```
