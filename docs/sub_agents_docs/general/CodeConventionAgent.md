# 코드 컨벤션 에이전트 참조 (Code Convention Agent Reference)

> 코드 컨벤션 형상이 `docs/conventions/` 디렉토리로 모듈화되었습니다.
> 상세 규칙은 아래의 각 파일을 참고해주세요.

## 1. 앱 컨벤션 (React Native/Expo)
**디렉토리**: `docs/conventions/app/`

| 파일 | 주요 주제 |
|------|------------|
| [index.md](../conventions/app/index.md) | 요약 및 목차 |
| [style.md](../conventions/app/style.md) | StyleSheet, SafeAreaView, Platform, 색상 규칙 |
| [navigation.md](../conventions/app/navigation.md) | Expo Router, useFocusEffect 사용법 |
| [components.md](../conventions/app/components.md) | 컴포넌트 구조, Pressable, FlatList, Alert/Modal |
| [accessibility.md](../conventions/app/accessibility.md) | 접근성 역할(Role) & 라벨(Label) 필수 규칙 |
| [database.md](../conventions/app/database.md) | SQLite Parameterized Query 필수 규칙 |
| [performance.md](../conventions/app/performance.md) | 최적화, 콘솔 로그 제거, 환경변수 |

## 2. 웹 컨벤션 (Next.js)
**디렉토리**: `docs/conventions/web/`

| 파일 | 주요 주제 |
|------|------------|
| [index.md](../conventions/web/index.md) | 요약 및 목차 |
| [server-client.md](../conventions/web/server-client.md) | Server vs Client 컴포넌트 분리 기준 |
| [html.md](../conventions/web/html.md) | 시맨틱 HTML, 구조 설계 |
| [seo.md](../conventions/web/seo.md) | 메타데이터, 이미지 최적화, 환경변수 |
| [accessibility.md](../conventions/web/accessibility.md) | ARIA 속성, 키보드 네비게이션 |
| [file-convention.md](../conventions/web/file-convention.md) | page.tsx, layout.tsx 등 파일 규칙 |
| [css.md](../conventions/web/css.md) | Tailwind 클래스 정렬, CSS Modules |

## 3. 공통 컨벤션
**디렉토리**: `docs/conventions/common/`

| 파일 | 주요 주제 |
|------|------------|
| [index.md](../conventions/common/index.md) | 요약 및 목차 |
| [coding-style.md](../conventions/common/coding-style.md) | Prettier, ESLint, 들여쓰기 등 기본 스타일 |
| [naming.md](../conventions/common/naming.md) | 변수, 함수, 파일 네이밍 규칙 |
| [constants.md](../conventions/common/constants.md) | 상수 관리 원칙, 경로 구조 |
| [types.md](../conventions/common/types.md) | Props, State, API 타입 정의 |
| [import.md](../conventions/common/import.md) | Import 정렬 순서 |
| [error-boundary.md](../conventions/common/error-boundary.md) | Error Boundary, Suspense 패턴 |
| [refactoring.md](../conventions/common/refactoring.md) | SRP, 비동기 처리, 메모이제이션 원칙 |
| [commit.md](../conventions/common/commit.md) | 커밋 메시지 컨벤션 |
