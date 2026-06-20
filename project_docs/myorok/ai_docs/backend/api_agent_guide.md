# 🤖 백엔드 API AI 서브 에이전트 지침서 (`api_agent_guide.md`)

## 1. 연동 기획 명세
* **도메인**: 묘록 (Myorok) - 백엔드 API 서버리스 아키텍처.
* **타겟 환경**: Next.js App Router (Route Handlers `src/app/api/...`), MongoDB, 카카오 OAuth.
* **관련 문서**: 
  * 백엔드 구조: `human_docs/backend/backend_spec.md`
  * 데이터베이스: `human_docs/backend/database_schema.md` (서버사이드 MongoDB)

## 2. 목적 및 개발 지침
본 지침은 모바일 클라이언트와 통신하는 묘록의 백엔드 API를 개발 및 관리하는 AI 에이전트를 위한 규칙입니다.

### 아키텍처 및 보안 인증
* **서버리스 API 패턴**: 별도의 Express 서버 없이 Next.js의 Route Handlers를 통해 엔드포인트를 구현합니다.
* **인증 및 인가 (JWT/카카오)**: 모바일 앱에서 전달한 카카오 OAuth 코드로 토큰과 유저 정보를 카카오 API를 통해 조회하고, 자체 서명된 JWT(30일 만료)를 발급합니다.
* **미들웨어 검증**: API 진입 전 미들웨어를 통해 헤더의 JWT Bearer 토큰을 검사하고 인가합니다.

### 비즈니스 기능 및 데이터베이스 로직
* **Mongoose 연동**: 비즈니스 로직 작성 시 Mongoose ODM을 활용하여 클라우드 MongoDB 데이터(`devices`, `posts`, `subscriptions` 등)를 조작합니다.
* **특화 기능 처리**:
  * 쉼터(커뮤니티) 게시판 운영 시 비속어 필터, 1시간 작성 Cooldown, 차단/도배 예외 처리를 철저히 점검합니다.
  * 유저 차단 시 쿼리에 차단 목록을 필터링하도록 자동 처리합니다.

## 3. 제약 조건
* 단일 파일 **300줄 하드 한계**를 준수하여 컨트롤러, 라우터 핸들러, 비즈니스 유틸리티 등으로 구조 분해를 우선 고려합니다.
* `.env`를 통한 환경 변수 처리 누락 방지 (특히 카카오 시크릿 및 JWT 키 접근) 규칙을 엄수합니다.
