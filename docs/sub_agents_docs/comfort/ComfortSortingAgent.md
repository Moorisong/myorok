# Comfort Sorting Agent Reference

> 쉼터 탭 게시글 정렬 기능 전담 에이전트

## COMFORT_SPEC.md (관련 섹션)

### 2.6 정렬 (Filters) - v2.1

| 항목 | 설명 |
|------|------|
| 옵션 | 최신 순 (기본), 응원 많은 순, **댓글 많은 순** |
| UI | **Segmented Control (토글 버튼)** 형태 권장 |
| 유지 | 페이지 이동/새로고침 시 유지 (URL 쿼리 권장) |

**정렬 기준**:
- **최신 순 (latest)**: `ORDER BY createdAt DESC`
- **응원 많은 순 (cheer)**: `ORDER BY cheerCount DESC, createdAt DESC`
- **댓글 많은 순 (comment)**: `ORDER BY commentCount DESC, createdAt DESC`
  - 대화가 활발한 글 우선 노출

**의도**:
- 사용자 참여 유도 (최신)
- 공감/위로 가치 강화 (응원)
- **소통 활성화 (댓글)**

---

## API 명세

### GET /api/comfort/posts (목록 조회)

**Query Parameters**:
- `sort`: `latest` | `cheer` | `comment` (기본값: `latest`)

**응답**:
```json
{
  "posts": [
    {
      "id": "string",
      "content": "string",
      "cheerCount": 10,
      "commentCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**정렬 로직**:
- `sort=latest`: `ORDER BY createdAt DESC`
- `sort=cheer`: `ORDER BY cheerCount DESC, createdAt DESC`
- `sort=comment`: `ORDER BY commentCount DESC, createdAt DESC`

---

## AI 작업 지침

### 목적
사용자가 원하는 방식으로 게시글을 정렬하여 참여를 유도하고 소통을 활성화합니다.

### 작업 단계

#### 1. 백엔드 정렬 로직 구현
- `GET /api/comfort/posts`에 `sort` 쿼리 파라미터 처리 추가
- **최신 순 (latest)** - 기본값
  - `ORDER BY createdAt DESC`
  - 가장 최근 글 상단 노출
- **응원 많은 순 (cheer)**
  - `ORDER BY cheerCount DESC, createdAt DESC`
  - 좋아요(응원) 많은 글 우선, 동일하면 최신순
- **댓글 많은 순 (comment)**
  - `ORDER BY commentCount DESC, createdAt DESC`
  - 댓글 많은 글 우선, 동일하면 최신순
- `cheerCount`, `commentCount` 필드 유지 또는 동적 계산
  - Aggregation Pipeline에서 `$size`로 계산 가능
  - 성능을 위해 필드로 유지 권장

#### 2. 프론트엔드 Segmented Control UI 구현
- 상단에 3개 버튼 배치
  - `[최신순]` / `[응원 많은 순]` / `[댓글 많은 순]`
- 선택된 버튼 강조 표시 (색상, 굵기 등)
- 버튼 클릭 시:
  - 선택 상태 업데이트
  - `sort` 쿼리 파라미터로 API 재호출
  - 목록 즉시 갱신

#### 3. URL 상태 관리
- URL 쿼리로 정렬 상태 유지
  - 예: `/comfort?sort=cheer`
- 페이지 이동/새로고침 시:
  - URL에서 `sort` 파라미터 읽기
  - 해당 정렬 옵션으로 초기화
- 뒤로 가기/앞으로 가기 지원

#### 4. 성능 최적화
- `cheerCount`, `commentCount` 인덱스 생성
- `createdAt` 인덱스 생성 (이미 존재)
- 복합 인덱스 고려:
  - `{cheerCount: -1, createdAt: -1}`
  - `{commentCount: -1, createdAt: -1}`
- 캐싱 고려 (Redis 등)
  - 정렬 결과를 짧은 시간(30초) 캐싱

### 주의사항

#### 정렬 일관성
- 동일 카운트일 때 항상 최신순 적용
- 정렬 기준 변경 시 서버/클라이언트 동시 업데이트

#### 기본값
- `sort` 파라미터 없으면 `latest` 적용
- 잘못된 값이면 `latest`로 폴백

#### 댓글/좋아요 카운트 정확성
- 게시글 생성/삭제 시 카운트 업데이트
- 댓글 추가/삭제 시 `commentCount` 증감
- 좋아요 토글 시 `cheerCount` 증감
- 트랜잭션으로 일관성 보장

#### Android 전용
- iOS 관련 코드 금지
- React Native Segmented Control 사용

#### 접근성
- Segmented Control에 적절한 레이블
- 선택 상태를 명확히 전달

#### 테스트 케이스
- [ ] 최신순 정렬 정상 작동
- [ ] 응원 많은 순 정렬 정상 작동
- [ ] 댓글 많은 순 정렬 정상 작동
- [ ] 동일 카운트 시 최신순 적용
- [ ] URL 상태 유지 확인
- [ ] 페이지 새로고침 시 정렬 유지
