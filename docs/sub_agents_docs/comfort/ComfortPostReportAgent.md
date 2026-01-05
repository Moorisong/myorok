# Comfort Post Report Agent Reference

> 쉼터 탭 게시글 신고 기능 전담 에이전트

## COMFORT_SPEC.md (관련 섹션)

### 2.4.1 게시글 신고

| 항목 | 설명 |
|------|------|
| 대상 | 게시글 |
| 사유 | 부적절한 내용(INAPPROPRIATE), 스팸/광고(SPAM), 욕설/공격적 표현(ABUSE), 욕설 우회(EVASION), 기타(OTHER) |
| UI | 커스텀 모달 (배경 탭 시 닫기 지원), 성공 시 Toast 알림 |
| 자동 숨김 | 3회 이상 신고 시 |
| 관리자 검토 | 없음 (자동 처리) |
| 복구 | 불가 (자동 처리) |

**UI 진입**
- 게시글 우측 상단 `⋯` (More) 버튼 → '신고하기' 메뉴

**신고 플로우**
1. `⋯` 버튼 탭
2. `신고하기` 선택
3. 신고 사유 선택 모달 표시
4. 확인 시 서버로 신고 요청
5. 성공 시 Toast: "신고가 접수되었습니다."
6. 중복 신고 시: "이미 신고한 게시글입니다."

**자동 처리**
- 신고 횟수 ≥ 3: 게시글 자동 숨김
- 게시글 데이터는 삭제하지 않음 (`hidden: true` 처리)
- 클라이언트에 완전 미노출 ("신고로 숨김됨" placeholder ❌)

---

## API 명세

### POST /api/comfort/posts/:id/report (게시글 신고)

**Request Body**:
```json
{
  "reason": "INAPPROPRIATE | SPAM | ABUSE | EVASION | OTHER"
}
```

**서버 처리 로직**:
1. 인증 토큰 또는 헤더에서 `deviceId` 추출
2. 해당 게시글 조회
3. 이미 신고한 `deviceId`인지 검사
   - 이미 존재 시 `409 Conflict` 반환
4. 신고 정보 반영:
   - `reportedBy.push(deviceId)`
   - `reportCount += 1`
   - `reportCount >= 3` → `hidden = true`
5. 결과 반환

**응답 (성공)**:
```http
200 OK
```

**응답 (중복 신고)**:
```http
409 Conflict
```
```json
{
  "code": "ALREADY_REPORTED",
  "message": "이미 신고한 게시글입니다."
}
```

---

## 데이터 구조

```typescript
interface Post {
  id: string;
  deviceId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  cheerCount: number;
  likes: string[];
  comments: Comment[];
  reportCount: number;     // 신고 횟수
  reportedBy: string[];    // 신고한 deviceIds
  hidden: boolean;         // 3회 이상 신고 시 true
}
```

---

## AI 작업 지침

### 목적
쉼터 탭의 게시글 신고 기능을 구현하고 유지보수합니다. 관리자 개입 없이 자동으로 악성 게시글을 정화합니다.

### 작업 단계

#### 1. 백엔드 API 구현
- `POST /api/comfort/posts/:id/report` 엔드포인트 생성
- deviceId 기반 중복 신고 검사
  - `reportedBy` 배열에 deviceId 존재 여부 확인
  - 이미 신고한 경우 `409 Conflict` 반환
- 신고 정보 업데이트
  - `reportedBy.push(deviceId)`
  - `reportCount += 1`
  - `reportCount >= 3`이면 `hidden = true` 설정
- 트랜잭션 처리로 데이터 일관성 보장

#### 2. 프론트엔드 UI 구현
- 게시글 컴포넌트에 `⋯` (More) 버튼 추가
- 본인 게시글은 신고 메뉴 미표시 (deviceId 비교)
- 신고 사유 선택 모달 구현
  - 5가지 사유: INAPPROPRIATE, SPAM, ABUSE, EVASION, OTHER
  - 한글 라벨: "부적절한 내용", "스팸/광고", "욕설/공격적 표현", "욕설 우회", "기타"
  - 배경 탭 시 모달 닫기
- Toast 메시지 처리
  - 성공: "신고가 접수되었습니다."
  - 중복: "이미 신고한 게시글입니다."

#### 3. 게시글 목록 필터링
- `GET /api/comfort/posts` 응답에서 `hidden: true` 게시글 제외
- 클라이언트에서 추가 필터링 (이중 방어)
- "신고로 숨김됨" placeholder 표시 금지 → 완전 미노출

#### 4. 테스트
- 중복 신고 방지 테스트
- 3회 신고 시 자동 숨김 테스트
- 숨겨진 게시글 목록 미노출 테스트
- 본인 게시글 신고 메뉴 미표시 테스트

### 주의사항

#### 데이터 정책
- **삭제 금지**: `hidden: true` 처리만 수행, 실제 삭제 금지
- **익명성 유지**: deviceId 기반, 개인정보 수집 금지
- **복구 불가**: 자동 처리 정책, 관리자 개입 없음

#### 신고 사유 코드
- 백엔드와 프론트엔드 코드 일치 필수
- Enum 또는 상수로 관리
- 댓글 신고와 동일한 코드 사용

#### 성능 고려
- `reportedBy` 배열 조회 시 인덱스 활용
- 게시글 목록 조회 시 `hidden` 필드 인덱스 활용
- 대량 게시글 처리 시 페이지네이션 고려

#### Android 전용
- iOS 관련 코드 금지
- React Native 코드는 Android만 고려

#### 에러 처리
- 409 Conflict: 중복 신고 시 적절한 메시지
- 404 Not Found: 게시글 없음
- 401 Unauthorized: 인증 실패
- 500 Server Error: 서버 오류 시 재시도 유도
