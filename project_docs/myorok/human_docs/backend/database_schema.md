# ☁️ 서버사이드 데이터베이스 명세 (`database_schema.md`)

이 문서는 **묘록 (Myorok)** 프로젝트의 백엔드 서버(`apps/web`)에서 유저 장치 정보, 알림 수신 동의, 쉼터(커뮤니티) 게시물 및 구독 요금을 관리하기 위한 MongoDB Mongoose 스키마 구조를 정의합니다.

---

## 1. `devices` (기기 정보 및 알림 설정 컬렉션)
* **`deviceId`**: String, Required, Unique (기기 UUID)
* **`pushToken`**: String (Expo Push Token 수신 값)
* **`settings`**: Object
  * `marketing`: Boolean, Default `false`
  * `comments`: Boolean, Default `true` (댓글 푸시 여부)
  * `inactivity`: Boolean, Default `true` (앱 미사용 72시간 리마인더 알림 수신 여부)
* **`createdAt` / `updatedAt`**: Date

## 2. `posts` (쉼터 익명 게시글 컬렉션)
* **`id`**: String, Required, Unique (게시글 고유 UUID)
* **`deviceId`**: String, Required (작성자 기기 ID)
* **`content`**: String, Required (욕설 필터 및 길이 필터가 적용된 본문)
* **`emoji`**: String, Default `'🐱'` (작성 시 선택한 카테고리/기분 이모지)
* **`likes`**: [String] (좋아요를 누른 `deviceId` 목록 배열)
* **`cheerCount`**: Number, Default `0` (응원 클릭 수)
* **`reportCount`**: Number, Default `0` (게시글 신고 횟수)
* **`reportedBy`**: [String] (신고를 실행한 `deviceId` 목록 배열)
* **`hidden`**: Boolean, Default `false` (신고 5회 초과 시 자동 숨김 전환 플래그)
* **`comments`**: Sub-document Array (`CommentSchema`)
  * `id`: String (댓글 고유 ID)
  * `deviceId`: String (댓글 작성자 기기 ID)
  * `content`: String (댓글 본문)
  * `createdAt` / `updatedAt`: String (ISO String)
  * `reportCount` / `reportedBy` / `hidden`: 신고 제어 속성
* **`createdAt` / `updatedAt`**: String (ISO 포맷팅 일관성을 위해 문자열 형식 유지)

## 3. `subscriptions` (유저 구독 상태 컬렉션)
* **`userId`**: String, Required, Unique, Indexed (카카오 사용자 고유 ID)
* **`deviceId`**: String, Default `'unknown'` (결제 시도 시점 기기 매칭용)
* **`status`**: String, Required, Enum[`trial`, `active`, `expired`, `subscribed`, `blocked`], Indexed
* **`trialStartDate`**: Date, Default `null`
* **`subscriptionStartDate`**: Date, Default `null`
* **`subscriptionExpiryDate`**: Date, Default `null`, Indexed
* **`forceExpired`**: Boolean, Default `false`
* **`createdAt` / `updatedAt`**: Date
