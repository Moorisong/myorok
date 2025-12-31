# Backup Model

**파일**: `src/models/backupModel.ts`
**컬렉션명**: `backups`

> **용도**: SQLite 데이터를 통째로 JSON 변환하여 저장

## 스키마 정의

```typescript
{
  deviceId: string (index, unique),
  version: number,
  data: {
    pets: Array,
    daily_records: Array,
    food_records: Array,
    supplements: Array,
    supplement_records: Array,
    hospital_records: Array,
    custom_metrics: Array,
    custom_metric_records: Array
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 규칙
- deviceId 당 1개 문서
- 백업 시 overwrite (upsert)
- 로컬 DB의 JSON dump 구조를 그대로 저장
