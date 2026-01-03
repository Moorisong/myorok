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
| 대상 | 게시글 |
| 사유 | 부적절한 내용, 스팸/광고, 욕설 우회, 기타 |
| UI | 커스텀 모달 (배경 탭 시 닫기 지원), 성공 시 Toast 알림 |
| 자동 숨김 | 3회 이상 신고 시 |
| 관리자 검토 | 없음 (자동 처리) |

### 2.5 차단

| 항목 | 설명 |
|------|------|
| 대상 | 디바이스 (익명 ID) |
| 효과 | 차단한 사용자의 글/댓글 숨김 |
| UI | '차단됨' placeholder 대신 완전 숨김 |

### 2.6 정렬 (Filters)

| 항목 | 설명 |
|------|------|
| 옵션 | 최신 순 (기본), 응원해요 순 |
| 유지 | 페이지 이동/새로고침 시 유지 (URL 쿼리 권장) |

**정렬 기준**:
- **최신 순**: `createdAt DESC` (신규 글 우선)
- **응원해요 순**: `cheerCount DESC`, `createdAt DESC` (공감 많은 글 우선)

**의도**:
- 사용자 참여 유도 (최신)
- 공감/위로 가치 강화 (응원)

---

## 3. API 명세

### 3.1 게시글

```
GET    /api/comfort/posts              - 목록 조회 (sort=latest|cheer)
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
  likes: string[];        // 좋아요한 deviceIds
  comments: Comment[];
  reportCount: number;
  reportedBy: string[];   // 신고한 deviceIds
  hidden: boolean;        // 3회 이상 신고 시 true
}

interface Comment {
  id: string;
  deviceId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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
- 게시글 목록 (최신 순 / 응원해요 순 토글)
- FAB 글쓰기 버튼

### 5.2 빈 상태

- 서버 연결 실패: "서버 준비 중이에요 🐱"
- 게시글 없음: "아직 글이 없어요"

### 5.3 자동 갱신

- 30초 폴링 (WebSocket 미사용)
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

- [ ] 댓글 신고 기능
- [ ] 실시간 WebSocket 업데이트
- [ ] 글쓰기 이미지 첨부
- [ ] 관리자 대시보드
- [ ] 동일 내용 반복 댓글 감지 (content hash)
- [ ] 신고 누적 사용자 댓글 빈도 제한 강화
- [ ] 관리자 계정 빈도 제한 제외
- [ ] Redis 기반 인메모리 캐시로 빈도 제한 성능 향상
