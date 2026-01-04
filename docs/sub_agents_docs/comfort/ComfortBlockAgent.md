# Comfort Block Agent Reference

> 쉼터 탭 차단 기능 전담 에이전트

## COMFORT_SPEC.md (관련 섹션)

### 2.5 차단

| 항목 | 설명 |
|------|------|
| 대상 | 디바이스 (익명 ID) |
| 효과 | 차단한 사용자의 글/댓글 숨김 |
| UI | '차단됨' placeholder 대신 완전 숨김 |

---

## API 명세

### GET /api/comfort/block (차단 목록)

**응답**:
```json
{
  "blockedDevices": [
    {
      "deviceId": "user123",
      "blockedDeviceId": "blocked456",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/comfort/block (차단)

**Request Body**:
```json
{
  "blockedDeviceId": "string"
}
```

**응답 (성공)**:
```http
201 Created
```

### DELETE /api/comfort/block (차단 해제)

**Request Body**:
```json
{
  "blockedDeviceId": "string"
}
```

**응답 (성공)**:
```http
200 OK
```

---

## 데이터 구조

```typescript
interface BlockedDevice {
  deviceId: string;       // 차단한 사용자
  blockedDeviceId: string; // 차단된 사용자
  createdAt: string;
}
```

---

## AI 작업 지침

### 목적
사용자가 원하지 않는 다른 사용자의 게시글과 댓글을 완전히 숨겨 쾌적한 환경을 제공합니다.

### 작업 단계

#### 1. 백엔드 API 구현
- **GET /api/comfort/block**: 차단 목록 조회
  - 현재 deviceId의 차단 목록 반환
- **POST /api/comfort/block**: 차단 추가
  - `blockedDeviceId` 입력받아 차단 목록에 추가
  - 중복 차단 시 에러 또는 무시
- **DELETE /api/comfort/block**: 차단 해제
  - `blockedDeviceId` 입력받아 차단 목록에서 제거

#### 2. 게시글 목록 필터링
- `GET /api/comfort/posts` 호출 시:
  - 현재 deviceId의 차단 목록 조회
  - `post.deviceId NOT IN blockedDeviceIds` 조건 추가
  - 차단된 사용자의 게시글 완전 제외
- 클라이언트에서 추가 필터링 (이중 방어)

#### 3. 댓글 목록 필터링
- `GET /api/comfort/posts/:id/comments` 호출 시:
  - 현재 deviceId의 차단 목록 조회
  - `comment.deviceId NOT IN blockedDeviceIds` 조건 추가
  - 차단된 사용자의 댓글 완전 제외
- 클라이언트에서 추가 필터링 (이중 방어)

#### 4. 프론트엔드 UI 구현
- 게시글/댓글 `⋯` 버튼에 "차단하기" 메뉴 추가
- 본인은 차단 불가 (deviceId 비교)
- 차단 확인 모달
  - "이 사용자를 차단하시겠습니까?"
  - "차단하면 이 사용자의 모든 글과 댓글이 보이지 않습니다."
- 차단 성공 Toast: "차단되었습니다."
- 차단 목록 화면 (설정 등)
  - 차단한 사용자 닉네임 목록
  - 해제 버튼

#### 5. 완전 숨김 처리
- "차단됨" placeholder 표시 금지
- 차단된 게시글/댓글은 목록에서 완전 제외
- 카운트에도 포함 안 됨

### 주의사항

#### 완전 숨김 원칙
- Placeholder 표시 금지
- 목록에서 완전 제외
- 카운트에 포함 안 됨

#### 성능 고려
- 차단 목록 조회 최적화
  - 캐싱 (Redis 등)
  - deviceId 인덱스
- 대량 차단 시 성능 저하 주의
  - `NOT IN` 대신 조인 고려

#### 데이터 정책
- 차단은 개인 기준, 신고는 전체 기준
- 차단해도 데이터 삭제 안 됨
- 언제든지 해제 가능

#### 차단과 신고의 관계
- 차단: 개인적으로 보기 싫은 사용자
- 신고: 커뮤니티 규칙 위반
- 독립적으로 작동

#### Android 전용
- iOS 관련 코드 금지

#### 테스트 케이스
- [ ] 차단 추가 정상 작동
- [ ] 차단 해제 정상 작동
- [ ] 차단된 사용자 게시글 미노출
- [ ] 차단된 사용자 댓글 미노출
- [ ] 본인 차단 불가
- [ ] Placeholder 미표시 확인
