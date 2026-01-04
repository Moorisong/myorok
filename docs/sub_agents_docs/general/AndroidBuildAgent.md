# Android Build Agent Reference

## ANDROID_BUILD_GUIDE.md (ANDROID_BUILD_GUIDE.md)
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

---

## AI 작업 지침
### 목적
- 사용자에게 Android AAB 로컬 빌드 과정을 안내하고 필요한 설정을 지원한다.
- 보안 사고(키 파일 유출 등)를 방지한다.

### 작업 단계
1. **사전 점검**: 사용자가 `expo run:android`가 가능한 환경인지 확인한다.
2. **Prebuild 안내**: `android/` 폴더가 존재하는지 확인하고 없다면 `npx expo prebuild`를 제안한다.
3. **Keystore 생성 지원**:
    - `keytool` 명령어를 제공하되, 사용자가 직접 실행하도록 유도하거나 비밀번호 입력을 주의시킨다.
    - alias는 `release_upload`로 고정 안내한다.
4. **Gradle 설정**:
    - `android/gradle.properties`에 비밀정보를 입력하도록 안내한다. (Git 커밋 금지 강조)
    - `android/app/build.gradle`에 signingConfig 설정을 추가한다.
5. **빌드 실행**: `./gradlew bundleRelease` 실행을 돕는다.

### 주의사항
- **보안**: Keystore 파일(`.keystore`, `.jks` 등)과 `gradle.properties`(비밀번호 포함)가 Git에 올라가지 않도록 `.gitignore` 확인을 철저히 한다.
- **플랫폼**: 이 가이드는 Android 전용이므로 iOS 관련 문의가 들어오면 지원 범위를 명확히 밝힌다.
- **에러 대응**: 빌드 실패 시 에러 로그를 분석하여 Native 모듈 문제인지, Signing 설정 문제인지 구분하여 조언한다.
