# Expo (EAS 미사용) Android 전용 AAB 로컬 빌드 가이드 (Signing 포함)

## 목적
- Expo EAS Build 없이
- Android 전용 앱을 로컬에서 **AAB(Android App Bundle)** 로 빌드
- **알리아스(alias)만 입력하면 바로 AAB 빌드 가능**한 상태 구성

---

## 지원 범위
- ✅ Android ONLY
- ❌ iOS 미지원
- ❌ EAS Build 미사용

---

## 전제 조건

### 필수 환경
- Node.js
- Android Studio
  - Android SDK
  - Android SDK Platform Tools
- JDK 17 이상 권장
- Expo 프로젝트
- 아래 명령이 정상 동작해야 함:
```bash
npx expo run:android
```

## 전체 흐름 요약
1. Android 네이티브 코드 생성 (`expo prebuild`)
2. 업로드 키(keystore) 생성
3. Gradle signing 설정
4. `bundleRelease` 실행 → AAB 생성

---

## 1️⃣ Android 네이티브 코드 생성
```bash
npx expo prebuild
```
- 프로젝트 루트에 `android/` 폴더 생성
- Android 네이티브 설정 직접 관리 상태로 전환

## 2️⃣ 업로드 키(keystore) 생성
⚠️ **앱 서명 키 아님**
- Google Play App Signing 기준 업로드 키임

### keystore 생성
```bash
keytool -genkeypair -v \
  -keystore upload-key.keystore \
  -alias release_upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
### 🔑 Alias 규칙
- alias 이름: **release_upload** (고정)
- 이후 빌드 시 alias 입력 불필요
- 비밀번호만 기억하면 됨

### keystore 위치
```bash
android/app/upload-key.keystore
```

## 3️⃣ Gradle 비밀정보 설정
`android/gradle.properties` 파일 생성 또는 수정
```properties
UPLOAD_STORE_FILE=upload-key.keystore
UPLOAD_STORE_PASSWORD=비밀번호입력
UPLOAD_KEY_ALIAS=release_upload
UPLOAD_KEY_PASSWORD=비밀번호입력
```
### ⚠️ 주의
- 이 파일은 **Git에 커밋 ❌**
- `.gitignore`에 포함 필수

## 4️⃣ Release Signing 설정
`android/app/build.gradle` 수정
```gradle
android {
    signingConfigs {
        release {
            storeFile file(UPLOAD_STORE_FILE)
            storePassword UPLOAD_STORE_PASSWORD
            keyAlias UPLOAD_KEY_ALIAS
            keyPassword UPLOAD_KEY_PASSWORD
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            shrinkResources false
        }
    }
}
```

## 5️⃣ AAB 빌드 (알리아스 입력 불필요)
```bash
cd android
./gradlew bundleRelease
```

### Windows:
```bash
gradlew bundleRelease
```
➡️ alias는 이미 고정되어 있으므로 추가 입력 없음

## 6️⃣ AAB 결과물 위치
```swift
android/app/build/outputs/bundle/release/app-release.aab
```
➡️ Google Play Console 업로드 가능

## 7️⃣ Google Play Console 설정
- **Play App Signing 사용 (권장)**
- 최초 업로드 시:
  - Google이 앱 서명 키 관리
  - 로컬 keystore는 업로드 전용

---

## 개발 & 배포 운영 전략
| 용도 | 명령 |
|---|---|
| 개발 / 테스트 | `npx expo run:android` |
| 스토어 배포 | `./gradlew bundleRelease` |
| 네이티브 설정 리셋 | `npx expo prebuild --clean` |

## 절대 금지 사항
- keystore 파일을 AI에게 전달 ❌
- 비밀번호를 메시지로 공유 ❌
- keystore를 GitHub에 커밋 ❌

## 결론
- Alias는 고정 (`release_upload`)
- 비밀번호만 로컬에 저장
- 명령 한 줄로 AAB 빌드 가능

## 최종 산출물
```swift
android/app/build/outputs/bundle/release/app-release.aab
```
