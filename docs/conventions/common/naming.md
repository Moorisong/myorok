# Common Naming Convention

> 변수, 함수, 파일 네이밍 규칙

## 네이밍 규칙

| 대상 | 규칙 | 올바른 예시 | 잘못된 예시 |
|------|------|-------------|-------------|
| 변수/상수 | `camelCase` | `userName`, `isLoading` | `user_name`, `UserName` |
| 함수 | `동사 + 명사` | `fetchUserData()`, `handleClick()` | `userData()`, `click()` |
| 컴포넌트 | `PascalCase` | `UserCard`, `VoteButton` | `userCard`, `vote-button` |
| 파일명 | `kebab-case` | `user-card.tsx`, `vote-button.tsx` | `UserCard.tsx`, `userCard.tsx` |
| 폴더명 | `kebab-case` | `user-profile/`, `vote-room/` | `UserProfile/`, `userProfile/` |
| 훅 | `use + PascalCase` | `useUserData`, `useVoteRoom` | `userDataHook`, `UseUserData` |
| 타입/인터페이스 | `PascalCase` 또는 `I` 접두사 | `User`, `IApiResponse` | `user`, `apiResponse` |
| 환경변수 | `SCREAMING_SNAKE_CASE` | `NEXT_PUBLIC_API_URL` | `nextPublicApiUrl` |
