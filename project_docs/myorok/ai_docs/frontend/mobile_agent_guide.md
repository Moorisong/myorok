# 🤖 모바일 앱 AI 서브 에이전트 지침서 (`mobile_agent_guide.md`)

## 1. 연동 기획 명세
* **도메인**: 묘록 (Myorok) - 반려묘 일일 건강 기록 및 쉼터 커뮤니티 모바일 앱.
* **타겟 플랫폼**: Expo 환경 기반의 React Native 모바일 애플리케이션 (Android/iOS).
* **관련 문서**: 
  * 기획/설계: `human_docs/frontend/frontend_spec.md`, `human_docs/frontend/mobile_ui_spec.md`
  * 데이터베이스: `human_docs/frontend/database_schema.md` (로컬 SQLite)

## 2. 목적 및 개발 지침
본 지침은 모바일 프론트엔드 기능을 개발하거나 유지보수하는 AI 에이전트를 위한 규칙입니다.

### 아키텍처 및 상태 관리
* **Offline-First 구조**: 외부 서버 연결 실패를 대비하여 핵심 데이터(`pets`, `daily_records`)는 기기 로컬의 `expo-sqlite`에 우선 저장하고 조회해야 합니다.
* **Hook-Service 계층 분리**: UI 컴포넌트에는 프레젠테이션 로직만 남기고, 데이터 접근과 비즈니스 처리 파이프라인은 반드시 커스텀 훅(`use-*`) 및 서비스 모듈로 완전히 분리해야 합니다.
* **전역 상태**: `AuthProvider`(인증), `PetProvider`(고양이 선택), `ToastProvider`(알림) Context를 활용하며, 불필요한 전역 상태 추가를 피합니다.

### 통신 및 에러 핸들링
* **API 통신**: 가벼운 네이티브 `fetch`를 사용하며, 서버 에러 발생 시 UI 파괴를 방지하기 위해 반드시 `try-catch`로 감싸고 `useToast`로 친절한 안내 메시지를 출력해야 합니다.

## 3. 제약 조건
* 기능 단위별 모듈 파편화 원칙에 따라 하나의 파일에 여러 역할을 몰아넣지 않아야 합니다.
* 단일 파일 **300줄 하드 한계** 제약을 준수하며, 초과 시 컴포넌트를 서브 폴더로 분리합니다.
* 사용하지 않는 변수와 미사용 `import` 구문은 작성 즉시 제거해야 합니다.
