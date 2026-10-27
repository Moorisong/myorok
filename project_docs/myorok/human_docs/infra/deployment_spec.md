# 🏠 홈서버 및 배포 인프라 명세 (`deployment_spec.md`)

이 문서는 **묘록 (Myorok)** 서비스의 모바일 앱 빌드/출시 설정 및 Next.js 백엔드 웹 앱을 홈서버에 원격 배포하기 위한 환경 사양을 정의합니다.

---

## 📱 1. 모바일 앱 빌드 및 출시 설정 (Expo EAS)

묘록 앱은 **Expo Application Services (EAS)**를 활용하여 클라우드 빌드 및 마켓 등록을 관리합니다.

### ⚙️ EAS 빌드 프로필 (`apps/mobile/eas.json`)
* **CLI 버전 조건**: `>= 16.28.0`
* **개발 빌드 (development)**: `developmentClient` 활성화 및 내부 테스트 배포(`internal`) 설정.
* **미리보기 빌드 (preview)**: 내부 애드혹 배포(`internal` - Ad-hoc/APK/IPA 다운로드) 설정.
* **프로덕션 빌드 (production)**: 빌드 시 버전 자동 증가(`autoIncrement: true`) 활성화.

### 🤖 안드로이드 빌드 사양 (`apps/mobile/app.json`)
* **패키지명 (Package Name)**: `com.myorok.app`
* **버전코드 (versionCode)**: `56` (수동/EAS 업그레이드 관리)
* **푸시 및 구글 연동**: `./google-services.json` 설정 기반 FCM 연결.
* **플러그인 의존성**: `expo-sqlite`, `expo-router`, `expo-web-browser`, `expo-notifications`.

### 🚀 EAS 빌드 및 배포 실행 명령어
```bash
# apps/mobile 디렉토리 기준

# 1) Android Preview APK 빌드 (EAS 클라우드 실행)
eas build --platform android --profile preview

# 2) Google Play Store 프로덕션 릴리즈 제출
eas submit --platform android
```

---

## 🌐 2. 웹/백엔드 배포 및 PM2 구동 설정 (rsync 방식)

웹 및 API 백엔드 서비스는 Next.js로 구성되어 있으며, 로컬 사설 홈서버에 SSH rsync 및 PM2 무중단 구동 래퍼로 배포됩니다.

### 🗺️ 배포 인프라 및 서버 정보
* **서버 호스트**: 사설 홈서버 (`192.168.0.6` 또는 외부 `125.190.25.48`)
* **SSH 포트**: 기본 `22` (외부 접속 시 `2222` 포트 포워딩 적용)
* **원격 프로젝트 경로**: `/home/ksh/myorok`
* **웹 소스 경로**: `/home/ksh/myorok/apps/web`
* **실행 Node.js 버전**: NVM 기반 Node.js `20` 권장

### 📜 자동 배포 스크립트 (`deploy-web.sh`)
루트 디렉토리의 `deploy-web.sh`를 실행하여 빌드 및 프로세스 재시작을 자동화합니다.

```bash
# 루트 디렉토리에서 실행
./deploy-web.sh
```

#### 배포 파이프라인 단계 요약:
1. **rsync 동기화**: 로컬 `apps/web/` 내의 소스코드를 원격지 `$SERVER_WEB_DIR/`로 전송. 이때 `node_modules`, `.next`, `.git` 폴더는 제외하여 전송 최적화.
2. **원격 Node.js 버전 활성화**: NVM을 통해 Node.js 20 런타임 활성화.
3. **의존성 설치**: `npm install` 실행으로 패키지 정렬.
4. **Next.js 빌드**: `npm run build` 명령어로 프로덕션 최적화 정적/동적 자원 컴파일.
5. **PM2 재시작**:
   * PM2 앱 이름: `myorok`
   * PM2를 통해 Next.js를 포트 `3001`에서 프로덕션 모드로 무중단 시작.
   * `pm2 restart myorok || pm2 start npm --name "myorok" -- run start -p 3001`
