# Local DB Spec (SQLite)

> **기준**
> - 앱의 모든 원본 데이터는 로컬 SQLite에 저장
> - **하루 1 row 원칙**
> - 삭제하지 않고 누적
> - 날짜 기준은 `YYYY-MM-DD`

## 테이블 구조 (요약)

| 테이블명 | 역할 | 주요 필드 |
|----------|------|-----------|
| `pets` | 고양이 정보 | id, name, birthDate, **petId** |
| `daily_records` | 일일 기록 | date, poopCount, peeCount, vomitCount, **petId** |
| `medications` | 투약 정보 | id, name, type, **petId** |
| `med_records` | 투약 기록 | date, medId, isTaken, **petId** |
| `settings` | 앱 설정 | key, value (JSON) |

> **중요**: 다묘 지원을 위해 모든 레코드 테이블에 `petId` foreign key 필수

상세 스키마는 **[DatabaseSpecAgent](../sub_agents_docs/DatabaseSpecAgent.md)**를 참조하세요.
