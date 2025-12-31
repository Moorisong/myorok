# Backup Service

**파일**: `src/services/backupService.ts`

## 역할
SQLite에서 추출한 대용량 JSON 데이터의 유효성을 검증하고, MongoDB 저장 포맷으로 변환합니다.

## 주요 함수

### `validateData(data: any): boolean`
- 필수 테이블 키 존재 여부 확인 (pets, daily_records 등)
- 데이터 타입 기초 검증
- 잘못된 형식의 백업 거부

### `transformToMongo(sqliteData: any): object`
- SQLite의 플랫한 구조를 MongoDB의 Document 구조에 맞게 매핑
- 필요 시 Date string 변환 등 타입 캐스팅 수행
