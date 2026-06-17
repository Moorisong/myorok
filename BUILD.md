# Myorok 빌드 및 실행 가이드 (Android / Expo)

이 문서는 모바일 앱(`apps/mobile`) 프로젝트의 로컬 빌드 및 Expo Go 실행 명령어와 관련 트러블슈팅 방법을 정리해 둔 문서입니다.

---

## 1. Android 로컬 프로덕션 빌드 (EAS Build Local)

플레이 스토어 제출용 배포 빌드(`.aab` 파일 생성)를 내 로컬 환경의 자원을 활용하여 수행하는 방법입니다.

### 실행 방법
`apps/mobile` 경로로 이동한 뒤 아래 명령어를 실행합니다.
```bash
cd apps/mobile
eas build --platform android --profile production --local
```

> [!NOTE]
> 빌드가 완료되면 `apps/mobile/build-xxxxxxxxxxxxx.aab` 파일이 생성됩니다.

### ⚠️ 빌드 실패 시 주요 해결법

#### ① Kotlin KSP Metaspace OOM 에러가 발생하는 경우
Gradle 빌드 중 `OutOfMemoryError: Metaspace` 에러로 실패하는 경우, 로컬 Gradle 설정에서 JVM 및 Metaspace 메모리를 증설해야 합니다.
`apps/mobile/android/gradle.properties` 파일에 아래 설정을 적용해 주세요:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

#### ② Gradle Lock 락 파일 충돌 에러가 발생하는 경우
이전 빌드가 강제로 취소되거나 비정상 종료되어 `journal-1.lock` 락 파일 충돌 에러가 발생하는 경우, 아래 명령어들로 기존 Gradle 데몬 프로세스를 종료하고 락 파일을 직접 삭제해 줍니다.
```bash
# 실행 중인 Gradle 데몬 일괄 종료
pkill -f gradle

# Gradle 락 파일 삭제
rm -f ~/.gradle/caches/journal-1/journal-1.lock
```

---

## 2. Expo Go 실행 (로컬 개발 환경)

에뮬레이터나 실기기(Expo Go 앱)에서 실시간 핫 리로딩 개발 서버를 연결하여 테스트하는 방법입니다.

### 실행 방법
`apps/mobile` 경로로 이동한 뒤 아래 명령어를 실행합니다.
```bash
cd apps/mobile
npm run start
```
또는
```bash
cd apps/mobile
npx expo start
```

### 💡 유용한 옵션
- **QR 코드로 실기기(Expo Go) 연결**: 실행 시 터미널에 출력되는 QR 코드를 스마트폰 카메라나 Expo Go 앱으로 스캔합니다.
- **안드로이드 에뮬레이터 바로 켜기**: 개발 서버 실행 후 터미널에서 `a` 키를 누르면 로컬 안드로이드 에뮬레이터에 연결 및 앱이 설치/실행됩니다.
- **캐시 초기화 실행**: 앱 로드 문제나 패키지 변경 사항이 꼬였을 때:
  ```bash
  npx expo start -c
  ```
