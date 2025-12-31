# Common Commit Convention

> Git 커밋 메시지 규칙 및 체크리스트

## 1. 커밋 전 체크리스트

```
[ ] npm run lint 통과
[ ] npm run type-check 통과
[ ] 미사용 변수/import 없음
[ ] console.log / debugger 없음
[ ] TODO/FIXME 정리 여부 확인
```

## 2. 커밋 메시지 컨벤션

### Conventional Commits 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입 종류

| 타입 | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat(vote): 투표 마감 기능 추가` |
| `fix` | 버그 수정 | `fix(map): 마커 클릭 오류 수정` |
| `refactor` | 리팩토링 | `refactor(api): 에러 핸들링 통일` |
| `style` | 코드 스타일 (포맷팅 등) | `style: prettier 적용` |
| `docs` | 문서 수정 | `docs: README 업데이트` |
| `test` | 테스트 추가/수정 | `test(utils): formatDate 테스트 추가` |
| `chore` | 빌드, 설정 변경 | `chore: eslint 설정 업데이트` |

### 규칙

- **언어**: 한글 사용 (팀 내 일관성)
- **제목**: 50자 이내, 마침표 없음
- **본문**: 필요시 상세 설명 추가
