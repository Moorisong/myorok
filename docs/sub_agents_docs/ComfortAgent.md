# Comfort Agent Reference

## Comfort Spec (COMFORT_SPEC.md)
# 🏰 쉼터(Community) 탭 명세

> "아픈 아이를 돌보는 집사들의 안식처"
> - 익명 기반
> - 하루가 지나면 사라지는 글 (자정 삭제)
> - 서로 응원하고 위로하는 공간

---

## 1. UX 컨셉

- **휘발성**: 모든 글은 **자정(00:00)에 자동 삭제** or 작성 24시간 후 삭제
- **익명성**: 닉네임 없음, 랜덤한 '고양이 종' 이름 부여 (예: 지나가는 치즈냥)
- **따뜻함**: 비난/조언 금지, 오직 '공감'과 '위로'만 존재

---

## 2. 기능 상세

### 2.1 글쓰기
- 텍스트 위주 (짧은 한탄, 기도, 다짐)
- 배경색 선택 가능 (파스텔 톤)
- 사진 1장 첨부 가능 (선택)

### 2.2 리스트 (피드)
- 최신순 정로
- 무한 스크롤
- **반응**: 좋아요(❤️), 기도해요(🙏), 쓰담쓰담(👋) - 아이콘 터치
- **댓글**: 짧은 응원 문구만 가능

### 2.3 제약 사항
- **검색 불가**: 흘러가는 이야기
- **프로필 불가**: 나를 드러내지 않음
- **신고 기능**: 부적절한 글(광고, 욕설) 즉시 블라인드

---

## 3. 데이터 구조 (Firebase/Supabase 활용 시)

```typescript
interface Post {
  id: string;
  deviceId: string; // 식별용 (노출 X)
  content: string;
  emotion: 'sad' | 'hope' | 'tired';
  background: string;
  likes: number;
  createdAt: Timestamp;
}
```

---

## 4. 운영 정책

- **조언 금지**: "병원 가보세요", "이 약 써보세요" 등 의료적 조언 금지 (운영 피로도 ↓)
- **오직 위로**: "힘드시겠어요", "오늘도 고생하셨어요" 식의 공감 문화 지향
- 상단 고정 공지: "이곳은 조언보다 위로를 건네는 공간입니다."

---

## 5. 서버 구현 (myorok-server)

### 5.1 기술 스택

- **Runtime**: Node.js (v20+)
- **Framework**: Express or Fastify
- **Database**: MongoDB (Atlas) - 유연한 스키마, TTL Index 활용
- **Hosting**: Vercel or Railway

### 5.2 API 명세 (Draft)

#### GET /api/comfort/posts
- **Query**: `cursor` (pagenation), `limit` (default 20)
- **Response**: Post 목록

#### POST /api/comfort/posts
- **Body**: `{ content, background, emotion }`
- **Rate Limit**: 1분에 1회 작성 제한 (도배 방지)

#### POST /api/comfort/posts/:id/react
- **Body**: `{ type: 'like' | 'pray' | 'pat' }`
- **Logic**: 한 기기당 1회 제한 없음(무한 칭찬) or 1회 제한

### 5.3 데이터 모델 (MongoDB)

```typescript
interface ComfortPost {
  _id: ObjectId;
  deviceId: string;       // 작성자 식별 (해시 처리 권장)
  content: string;
  background: string;     // color code
  emotion: string;
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
