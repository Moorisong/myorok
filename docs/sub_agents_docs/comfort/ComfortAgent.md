# Comfort Agent Reference

> 쉼터 탭 전반적인 기능 담당 에이전트

## 관련 모듈화 에이전트

복잡한 기능은 별도 에이전트로 분리하여 병렬 개발 가능:

- **[ComfortNicknameAgent.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/comfort/ComfortNicknameAgent.md)** - 닉네임 자동 생성
  - deviceId 해싱 알고리즘
  - 50개 한글 단어 리스트
  - 일관성 보장

- **[ComfortCommentRateLimitAgent.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/comfort/ComfortCommentRateLimitAgent.md)** - 댓글 빈도 제한
  - 30초 최소 간격
  - 5분 내 최대 3개
  - 쿨타임 UI/UX

- **[ComfortPostReportAgent.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/comfort/ComfortPostReportAgent.md)** - 게시글 신고
  - 신고 사유 선택
  - 3회 자동 숨김
  - 관리자 개입 없음

- **[ComfortCommentReportAgent.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/comfort/ComfortCommentReportAgent.md)** - 댓글 신고
  - 게시글 신고와 동일 정책
  - 자동 정화 시스템
  - 완전 숨김 처리

- **[ComfortSortingAgent.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/comfort/ComfortSortingAgent.md)** - 게시글 정렬
  - 최신순/응원많은순/댓글많은순
  - Segmented Control UI
  - URL 상태 관리

- **[ComfortBlockAgent.md](file:///Users/shkim/Desktop/Project/myorok/docs/sub_agents_docs/comfort/ComfortBlockAgent.md)** - 차단 기능
  - 디바이스 기반 차단
  - 글/댓글 완전 숨김
  - 차단 목록 관리

---

## COMFORT_SPEC.md (쉼터 탭 기획/설계 명세)

# 쉼터 탭 기획/설계 명세 (v2)

> 사랑과 희망으로 버틴 오늘, 환묘와 나 그리고 우리.

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 탭 이름 | 쉼터 |
| 목적 | 환묘 집사들의 하루 경험/감정 공유, 위로와 응원 교환 |
| 특성 | 당일 게시글만 유지 (자정에 삭제) |
| 익명성 | 한글 닉네임 자동 생성 (예: 미르4832, 노을7291) |

---

## 1.1 닉네임 생성

### 구조
```
<단어><숫자>
```
- 단어: 50개 한글 단어 중 deviceId 해싱으로 선택
- 숫자: 1000 ~ 9999 범위

### 단어 리스트 (50개)
```
미르, 노을, 달토리, 소나기, 햇살비, 구름결, 별무리, 바람꽃, 조약돌, 물빛,
솜사탕, 풀내음, 새벽별, 해님, 달그림자, 별하늘, 꽃샘, 바다빛, 달맞이, 노루발,
햇살꽃잎, 봄바람결, 눈꽃송이, 달빛잔향, 포근함, 솜구름, 봄향기, 물안개꽃, 달빛노래, 푸른숲,
노을빛, 달빛숲, 별빛샘, 햇살나래, 달빛송이, 푸른별, 봄눈, 별빛잔향, 햇살바람, 포근달빛,
달빛바다, 별빛숲, 햇살빛나래, 눈빛, 바람결, 해무리, 달빛꽃, 솔향기, 별빛노래, 바람결빛
```

### 특징
- 동일 기기는 항상 동일 닉네임 (deviceId 해싱)
- 익명성 유지하면서 일관된 식별 가능

---

## 2. 주요 기능

### 2.1 게시글 작성

| 항목 | 설명 |
|------|------|
| 작성 제한 | 1시간에 1회 (서버 기준) |
| 글 길이 | 최대 500자 |
| 이모지 선택 | 글 작성 시 프로필 이모지 선택 가능 |
| 욕설 필터 | `***` 마스킹 (클라이언트+서버) |
| 자동 삭제 | 매일 자정 (createdAt 기준) |

### 2.2 댓글

| 항목 | 설명 |
|------|------|
| 다중 댓글 | 같은 게시글에 여러 댓글 작성 가능 ⭕ |
| 작성 제한 | 시간 기반 빈도 제한 (Rate Limit) |
| 최소 간격 | 30초 (userId + postId 기준) |
| 단기 제한 | 5분 내 최대 3개 |
| 댓글 길이 | 최대 300자 |
| UI | 접기/펼치기 |
| 삭제 시 | 게시글 삭제 시 함께 삭제 |

#### 빈도 제한 정책 (Rate Limit)

**정책 원칙**: 자연스러운 대화형 댓글 흐름 유지 + 스팸/도배 방지

| 항목 | 값 |
|------|------|
| 기준 | userId + postId |
| 최소 간격 | 30초 |
| 단기 제한 | 5분 내 최대 3개 |

**서버 검증**:
- 마지막 댓글 작성 시점 < 현재 - 30초
- 최근 5분 내 댓글 개수 ≤ 3
- 조건 충족 시 댓글 생성, 초과 시 `429 Too Many Requests` 반환

**에러 응답 (429)**:
```json
{
  "code": "COMMENT_RATE_LIMIT",
  "message": "댓글은 잠시 후 다시 작성할 수 있습니다.",
  "retryAfter": 30
}
```

**프론트엔드 UX**:
- 댓글 작성 성공 후 입력창 비활성화 (30초 쿨타임)
- 남은 시간 카운트다운 표시
- 429 에러 수신 시 `retryAfter` 기준으로 타이머 동기화
- 안내 문구: "잠시 후 다시 댓글을 작성할 수 있어요 (30초)"

### 2.3 좋아요

- 게시글에만 좋아요 가능
- 토글 방식 (눌렀다 다시 누르면 취소)

### 2.4 신고

| 항목 | 설명 |
|------|------|
| 대상 | 게시글, 댓글 |
| 사유 | 부적절한 내용(INAPPROPRIATE), 스팸/광고(SPAM), 욕설/공격적 표현(ABUSE), 욕설 우회(EVASION), 기타(OTHER) |
| UI | 커스텀 모달 (배경 탭 시 닫기 지원), 성공 시 Toast 알림 |
| 자동 숨김 | 3회 이상 신고 시 |
| 관리자 검토 | 없음 (자동 처리) |
| 복구 | 불가 (자동 처리) |

#### 2.4.1 게시글 신고

**UI 진입**
- 게시글 우측 상단 `⋯` (More) 버튼 → '신고하기' 메뉴

**신고 플로우**
1. `⋯` 버튼 탭
2. `신고하기` 선택
3. 신고 사유 선택 모달 표시
4. 확인 시 서버로 신고 요청
5. 성공 시 Toast: "신고가 접수되었습니다."
6. 중복 신고 시: "이미 신고한 게시글입니다."

#### 2.4.2 댓글 신고

**UI 진입**
- 댓글 우측 상단 `⋯` (More) 버튼 → '신고하기' 메뉴
- 본인 댓글 제외 (선택)

**신고 플로우**
1. 댓글 `⋯` 버튼 탭
2. `신고하기` 선택
3. 신고 사유 선택 모달 표시: "이 댓글을 신고하는 이유를 선택해 주세요."
4. 확인 시 서버로 신고 요청
5. 성공 시 Toast: "신고가 접수되었습니다."
6. 중복 신고 시: "이미 신고한 댓글입니다."

**자동 처리**
- 신고 횟수 ≥ 3: 댓글 자동 숨김
- 댓글 데이터는 삭제하지 않음 (`hidden: true` 처리)
- 클라이언트에 완전 미노출 ("신고로 숨김됨" placeholder ❌)

### 2.5 차단

| 항목 | 설명 |
|------|------|
| 대상 | 디바이스 (익명 ID) |
| 효과 | 차단한 사용자의 글/댓글 숨김 |
| UI | '차단됨' placeholder 대신 완전 숨김 |

| UI | '차단됨' placeholder 대신 완전 숨김 |

### 2.6 정렬 (Filters) - v2.1

| 항목 | 설명 |
|------|------|
| 옵션 | 최신 순 (기본), 응원 많은 순, **댓글 많은 순 (New)** |
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

## 3. API 명세

### 3.1 게시글

```
GET    /api/comfort/posts              - 목록 조회 (sort=latest|cheer|comment)
POST   /api/comfort/posts              - 작성
PUT    /api/comfort/posts/:id          - 수정
DELETE /api/comfort/posts/:id          - 삭제
POST   /api/comfort/posts/:id/like     - 좋아요 토글
```

### 3.2 댓글

```
GET    /api/comfort/posts/:id/comments - 목록 조회
POST   /api/comfort/posts/:id/comments - 작성
PUT    /api/comfort/comments/:id       - 수정
DELETE /api/comfort/comments/:id       - 삭제
POST   /api/comfort/comments/:id/report - 신고
```

#### POST /api/comfort/posts/:id/comments (댓글 작성)

**Request Body**:
```json
{
  "content": "string"
}
```

**서버 처리 로직**:
1. 인증 토큰에서 `userId` (또는 `deviceId`) 추출
2. `userId + postId` 기준 최근 댓글 목록 조회
3. 빈도 제한 검사:
   - 마지막 댓글 작성 시점 < 현재 - 30초
   - 최근 5분 내 댓글 개수 ≤ 3
4. 조건 충족 시 댓글 생성
5. 초과 시 요청 거절

**응답 (성공)**:
```http
201 Created
```

**응답 (빈도 제한 초과)**:
```http
429 Too Many Requests
```
```json
{
  "code": "COMMENT_RATE_LIMIT",
  "message": "댓글은 잠시 후 다시 작성할 수 있습니다.",
  "retryAfter": 30
}
```

#### POST /api/comfort/comments/:id/report (댓글 신고)

**Request Body**:
```json
{
  "reason": "INAPPROPRIATE | SPAM | ABUSE | EVASION | OTHER"
}
```

**서버 처리 로직**:
1. 인증 토큰 또는 헤더에서 `deviceId` 추출
2. 해당 댓글 조회
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
  "message": "이미 신고한 댓글입니다."
}
```


### 3.3 신고/차단

```
POST   /api/comfort/report             - 신고
GET    /api/comfort/block              - 차단 목록
POST   /api/comfort/block              - 차단
DELETE /api/comfort/block              - 차단 해제
```

### 3.4 디버그 (개발용)

```
POST   /api/comfort/debug              - 테스트 액션 수행
       body: {
         action: 'reset-cooldown' | 'create-sample' | 'time-travel' | 'reset-time',
         ...params
       }
```

---

## 4. 데이터 구조

```typescript
interface Post {
  id: string;
  deviceId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  cheerCount: number;     // 좋아요 수 (성능 최적화용)
  likes: string[];        // 좋아요한 deviceIds
  comments: Comment[];
  reportCount: number;
  reportedBy: string[];   // 신고한 deviceIds
  hidden: boolean;        // 3회 이상 신고 시 true
}

interface Comment {
  id: string;
  postId: string;
  deviceId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reportCount: number;     // 신고 횟수
  reportedBy: string[];    // 신고한 deviceIds
  hidden: boolean;         // 3회 이상 신고 시 true
}

interface BlockedDevice {
  deviceId: string;       // 차단한 사용자
  blockedDeviceId: string; // 차단된 사용자
  createdAt: string;
}
```

---

## 5. 클라이언트 UX

### 5.1 탭 구성

- 헤더: "오늘의 위로" + 서브타이틀
- 자정 삭제 안내 배너 (항상 표시)
- 게시글 목록 (최신 순 / 응원해요 순 Segmented Control)
- FAB 글쓰기 버튼

### 5.2 빈 상태

- 서버 연결 실패: "서버 준비 중이에요 🐱"
- 게시글 없음: "아직 글이 없어요"

### 5.3 자동 갱신

- 30초 폴링 (WebSocket 미사용)
- Pull-to-refresh 지원

### 5.4 테스트 모드 (개발 환경)

- 진입: 탭 헤더 우측 '🧪 테스트' 버튼
- 기능: 쿨타임 리셋, 샘플 게시글 생성(다중), 시간 이동/리셋
- 목적: 개발 및 QA 효율성 증대

---

## 6. 보안 정책

| 정책 | 내용 |
|------|------|
| 사용자 식별 | 디바이스 기반 (로그인 없음) |
| 개인정보 | 수집 없음 |
| 욕설 필터 | 서버+클라이언트 이중 적용 |
| 작성 제한 | 서버에서 체크 (클라는 보조) |

---

## 7. 추후 확장 고려

- [x] 댓글 신고 기능 (v2.2 완료)
- [ ] 실시간 WebSocket 업데이트
- [ ] 글쓰기 이미지 첨부
- [ ] 관리자 대시보드
- [ ] 동일 내용 반복 댓글 감지 (content hash)
- [ ] 신고 누적 사용자 댓글 빈도 제한 강화
- [ ] 관리자 계정 빈도 제한 제외
- [ ] Redis 기반 인메모리 캐시로 빈도 제한 성능 향상

---

## AI 작업 지침

### 목적
쉼터 탭의 게시글, 댓글, 좋아요, 신고, 차단 기능을 구현하고 유지보수합니다. 특히 댓글 빈도 제한 정책을 서버와 클라이언트 양쪽에서 올바르게 구현하여 자연스러운 대화형 댓글 흐름과 스팸 방지를 동시에 달성합니다.

### 작업 단계

#### 1. 댓글 빈도 제한 구현 (백엔드)
- `POST /api/comfort/posts/:id/comments` API에서 빈도 제한 로직 구현
- userId + postId 기준으로 최근 댓글 조회
- 마지막 댓글 작성 후 30초 미만이면 `429` 응답
- 최근 5분 내 댓글이 3개 이상이면 `429` 응답
- 429 응답 시 `retryAfter` 필드 포함
- 서버 시간 기준으로 판단 (클라이언트 시간 신뢰 금지)

#### 2. 댓글 빈도 제한 UX (프론트엔드)
- 댓글 작성 성공 후 자동으로 입력창 비활성화 (30초 쿨타임)
- 카운트다운 타이머 표시: "잠시 후 다시 댓글을 작성할 수 있어요 (30초)"
- 429 에러 수신 시 서버의 `retryAfter` 값으로 타이머 동기화
- 타이머 종료 후 입력창 자동 활성화

#### 3. 게시글 정렬 기능 (v2.2)
- **백엔드**: `GET /api/comfort/posts`에 `sort` 쿼리 파라미터 처리
  - **최신 순 (latest)**: `ORDER BY createdAt DESC` (기본값)
  - **응원 많은 순 (cheer)**: `ORDER BY cheerCount DESC, createdAt DESC`
  - **댓글 많은 순 (comment)**: `ORDER BY commentCount DESC, createdAt DESC`
  - `cheerCount`, `commentCount`는 Aggegation Pipeline에서 `$size`로 동적 계산하거나 필드로 유지
- **프론트엔드**: 상단 **Segmented Control** UI 구현
  - `[최신순]` / `[응원 많은 순]` / `[댓글 많은 순]`
  - 선택 시 즉시 목록 재조회
  - 페이지 이동/새로고침 시 상태 유지 (URL Query `?sort=...` 권장)

#### 4. 댓글 신고 기능 (v2.2)
- **백엔드**: `POST /api/comfort/comments/:id/report` API 구현
  - deviceId 기반 중복 신고 방지
  - 신고 3회 이상 시 `hidden: true` 자동 처리
  - `reportedBy` 배열에 deviceId 추가
  - `reportCount` 증가
  - 중복 신고 시 `409 Conflict` 응답
- **프론트엔드**: 댓글 신고 UI 구현
  - 댓글 `⋯` 버튼 → "신고하기" 메뉴
  - 신고 사유 선택 모달: 게시글 신고와 동일한 사유 리스트
  - 성공 Toast: "신고가 접수되었습니다."
  - 중복 신고 Toast: "이미 신고한 댓글입니다."
  - `hidden: true` 댓글은 목록에서 완전 제외 (미노출)

#### 5. 기타 쉼터 기능 구현
- 게시글 1시간 제한 (서버 기준)
- 닉네임 자동 생성 (deviceId 해싱)
- 욕설 필터 (클라이언트+서버 이중 적용)
- 신고 3회 시 자동 숨김
- 차단 기능 (완전 숨김 방식)
- 자정 자동 삭제 (createdAt 기준)

### 주의사항

#### 데이터 정책
- **데이터 삭제 금지**: 자정 삭제는 자동화된 정책, 수동 삭제 금지
- **deviceId 기반**: 로그인 없이 디바이스 식별
- **개인정보 수집 금지**: 닉네임, 이메일 등 수집 금지

#### 빈도 제한 구현
- **서버 기준 필수**: 클라이언트 시간은 보조 UX용, 서버 시간이 최종 판단
- **프론트 제한은 UX용**: 서버 제한을 통과하지 못하면 의미 없음
- **429 에러 필수**: 빈도 제한 초과 시 반드시 `429 Too Many Requests` 반환
- **retryAfter 필수**: 429 응답에 `retryAfter` 필드 포함 필수

#### Android 전용
- iOS 관련 코드 금지
- React Native 코드는 Android만 고려

#### 일관성
- 기존 코드 스타일 유지
- COMFORT_SPEC.md와 불일치 시 명세 우선

#### 성능 고려
- Redis 등 인메모리 캐시 사용 권장 (추후 확장)
- 빈도 제한 조회 시 인덱스 활용

#### 모듈화
- 댓글 빈도 제한 로직을 별도 함수로 분리
- 재사용 가능한 구조로 설계
- 게시글 빈도 제한과 동일한 패턴 활용
