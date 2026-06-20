# 🤖 인프라/배포 AI 서브 에이전트 지침서 (`deployment_agent_guide.md`)

## 1. 연동 기획 명세
* **도메인**: 묘록 (Myorok) - 모바일 앱 EAS 빌드 및 웹 무중단 배포 인프라.
* **타겟 환경**: Expo EAS (모바일), PM2/rsync 홈서버 (웹 및 백엔드 API).
* **관련 문서**: 
  * 인프라 구조: `human_docs/infra/deployment_spec.md`, `human_docs/infra/project_env.md`

## 2. 목적 및 개발 지침
본 지침은 서비스 배포 스크립트 갱신이나 빌드 환경설정을 담당하는 AI 에이전트 전용 규칙입니다.

### 모바일 빌드 인프라 (EAS)
* **빌드 프로필 제어**: `eas.json`과 `app.json` 구성을 관리하여 `development`, `preview`, `production` 환경을 안전하게 분리합니다.
* **버전 관리 자동화**: Android의 `versionCode` 등 빌드 증분을 자동 제어합니다.

### 서버사이드 무중단 배포 관리
* **Rsync & PM2 워크플로우**: `deploy-web.sh` 스크립트를 통한 rsync 자동화 동기화 및 PM2 무중단 래핑 배포 프로세스를 유지합니다.
* **의존성 최적화**: 전송 과정에서 `node_modules`, `.next`, `.git`은 제외되도록 설정 관리하여 배포 속도 저하를 방지합니다.

## 3. 제약 조건
* 시스템 파괴성 명령어(예: `rm -rf`)나 `pm2 kill` 같은 전역 서비스 종료 명령을 신중하게 감시하고 제어해야 합니다.
* 환경변수나 시크릿 정보(`.env`)가 깃 리포지토리나 로컬 파일 배포 과정에서 평문으로 노출되지 않도록 가드레일을 적용합니다.
