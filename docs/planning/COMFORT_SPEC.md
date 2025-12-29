# 오늘의 위로 탭 기획/설계 명세 (v1)

> 집사들이 하루 동안 서로 위로와 응원을 나누는 익명 커뮤니티 공간

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 목적 | 환묘 집사들의 하루 경험/감정 공유, 위로와 응원 교환 |
| 특성 | 당일 게시글만 유지 (자정에 삭제) |
| 익명성 | 디바이스 기반 식별 (Device-XXXX) |

---

## 2. 주요 기능

### 2.1 게시글 작성

| 항목 | 설명 |
|------|------|
| 작성 제한 | 1시간에 1회 (서버 기준) |
| 글 길이 | 최대 500자 |
| 욕설 필터 | `***` 마스킹 (클라이언트+서버) |
| 자동 삭제 | 매일 자정 (createdAt 기준) |

### 2.2 댓글

| 항목 | 설명 |
|------|------|
| 작성 제한 | 없음 |
| 댓글 길이 | 최대 300자 |
| UI | 접기/펼치기 |
| 삭제 시 | 게시글 삭제 시 함께 삭제 |

### 2.3 좋아요

- 게시글에만 좋아요 가능
- 토글 방식 (눌렀다 다시 누르면 취소)

### 2.4 신고

| 항목 | 설명 |
|------|------|
| 대상 | 게시글 |
| 사유 | 부적절한 내용, 스팸/광고, 욕설 우회, 기타 |
| 자동 숨김 | 3회 이상 신고 시 |
| 관리자 검토 | 없음 (자동 처리) |

### 2.5 차단

| 항목 | 설명 |
|------|------|
| 대상 | 디바이스 (익명 ID) |
| 효과 | 차단한 사용자의 글/댓글 숨김 |
| UI | '차단됨' placeholder 대신 완전 숨김 |

---

## 3. API 명세

### 3.1 게시글

```
GET    /api/comfort/posts              - 목록 조회
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

### 3.3 신고/차단

```
POST   /api/comfort/report             - 신고
GET    /api/comfort/block              - 차단 목록
POST   /api/comfort/block              - 차단
DELETE /api/comfort/block              - 차단 해제
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
- 게시글 목록 (최신순)
- FAB 글쓰기 버튼

### 5.2 빈 상태

- 서버 연결 실패: "서버 준비 중이에요 🐱"
- 게시글 없음: "아직 글이 없어요"

### 5.3 자동 갱신

- 30초 폴링 (WebSocket 미사용)
- Pull-to-refresh 지원

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
