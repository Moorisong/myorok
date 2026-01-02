# Google Play 결제 모듈 구현 명세

## 1. 프로젝트 개요

| 항목 | 값 |
|------|------|
| 플랫폼 | Android |
| 프레임워크 | Expo (Managed) + React Native |
| 결제 방식 | Google Play In-App Purchase (구독) |
| 서버 검증 | 없음 (MVP 단계) |
| 데이터 저장 | 로컬 SQLite |
| 목적 | 월 구독 결제 및 구독 상태 관리 |

---

## 2. 결제 상품 정보

| 항목 | 값 |
|------|------|
| 상품 유형 | 정기 결제 (Subscription) |
| 상품 ID | `monthly_premium` |
| 가격 | 월 3,500원 |
| 무료 체험 | 앱 내부 로직으로 7일 처리 (Google 설정 ❌) |

---

## 2.1 구독 정책

### 구독 유형
- **월 단위 자동 갱신 구독**
- Google Play In-App Subscription 사용
- 구독 상태:
  - **Trial**: 7일 체험 (앱 내부 로직)
  - **Active**: 결제 완료, 월 단위 자동 갱신
  - **Expired**: 만료 또는 결제 실패 시

### 앱에서 구독 처리
| 역할 | 담당 |
|------|------|
| 자동 결제/갱신 | Google Play 서버 |
| 구독 상태 조회 | 앱 |
| 구독 해지 | Google Play (앱에서 링크 안내) |

### 구독하기 버튼
- **위치**: 설정 > 구독 관리 페이지
- **현재 상태**: 결제 모듈 미연동
- 버튼 클릭 시 안내 메시지 또는 테스트 플로우만 제공

### 앱 내 수동 결제/갱신 로직
- **없음** (Google Play가 모든 결제/갱신 관리)

---

## 3. 사용 라이브러리

- `expo-in-app-purchases` (또는 현재 Expo 권장 IAP 라이브러리)
- `expo-sqlite`

---

## 4. SQLite 스키마

### 테이블: subscription

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK, 항상 1 row |
| state | TEXT | `free` \| `trial` \| `active` \| `expired` |
| trial_start_at | INTEGER | timestamp, nullable |
| subscription_start_at | INTEGER | timestamp, nullable |
| updated_at | INTEGER | timestamp |

> ※ 하루 1 row 원칙 유지

---

## 5. 결제 플로우

### 5.1 앱 시작 시

1. Google Play 결제 연결 초기화
2. 기존 구매 내역 조회
3. 유효한 구독 존재 시:
   - `subscription.state = 'active'`
4. 없을 경우:
   - 상태 유지

### 5.2 무료 체험 로직

1. 최초 앱 실행 시:
   - `trial_start_at` 기록
   - `state = 'trial'`
2. 7일 경과 전:
   - 결제 버튼 노출
3. 7일 경과 후:
   - 결제 없으면 `state = 'expired'`

### 5.3 구독 결제 시

1. Google 결제 요청 실행
2. 결제 성공 시:
   - `subscription.state = 'active'`
   - `subscription_start_at` 저장
3. 결제 실패/취소 시:
   - 상태 변경 없음

### 5.4 구독 복원

- 앱 재설치 / 기기 변경 시
- Google 구매 내역 재조회
- active 구독 있으면 `state = 'active'`

---

## 6. UI 요구사항

### 결제 버튼

- **노출 조건**: `state = 'trial'` 또는 `state = 'expired'`
- **`state = 'active'` 일 때**:
  - "구독 중" 표시
  - 결제 버튼 비활성화

### 에러 처리

- 네트워크 오류 시: 토스트 또는 Alert 표시
- Google 결제 불가 상태: 안내 문구 노출

---

## 7. 테스트 조건

- Google Play 내부 테스트 트랙 사용
- 라이선스 테스트 계정으로 로그인
- 실제 결제 발생 ❌

---

## 8. 주의사항 ⚠️

> [!CAUTION]
> - Google Play Billing 외 결제 수단 사용 ❌
> - 카드사 / PG사 직접 연동 ❌
> - 서버 영수증 검증 ❌ (MVP 단계)

---

## 9. 완료 기준

- [ ] 내부 테스트에서 결제 성공
- [ ] 결제 취소 정상 처리
- [ ] 재설치 후 구독 복원 확인

---

## 10. 구독 해지 UI/UX 명세

### 10.1 기본 원칙

| 항목 | 정책 |
|------|------|
| 숨김 여부 | ❌ 숨기지 않음 |
| 강조 수준 | 결제 버튼보다 낮게 |
| 구현 방식 | 텍스트 링크 |
| 해지 처리 | 앱 내부 ❌ / Google Play에서 처리 ✅ |

### 10.2 위치

- **페이지**: 구독 관리 페이지 (`settings/pro.tsx`)
- **위치**: 페이지 최하단 (Footer 영역)
- **구성 순서**:
  1. 현재 구독 상태 (Active · 다음 결제일)
  2. 구독하기 버튼 (주요 CTA)
  3. 안내 문구 + 해지 링크

### 10.3 UI 명세

**텍스트 링크:**
- 문구: `구독 해지하기 →`
- 스타일: 텍스트 링크 (버튼 ❌)
- 색상: 회색 (`#888` ~ `#999`)
- 터치 영역: 최소 44px 확보

**보조 안내 문구:**
```
ℹ️ 구독은 언제든지 취소할 수 있습니다.
```

### 10.4 동작

- 링크 클릭 시 **Google Play 구독 관리 페이지로 이동**
- URL: `https://play.google.com/store/account/subscriptions`
- 앱 내 해지 처리 ❌

### 10.5 정책 대응 포인트

- ✔️ 해지 경로 명확히 인지 가능
- ✔️ 해지 버튼 숨기지 않음
- ✔️ Google Play 정책 준수

---

## 11. 환불 UI/UX 명세

### 11.1 기본 원칙

| 항목 | 정책 |
|------|------|
| 앱 내 환불 처리 | ❌ |
| 앱 내 환불 요청 API | ❌ |
| 환불 처리 주체 | Google Play에서만 처리 |
| 앱 역할 | **안내 + 이동(UI)만 제공** |

### 11.2 UI 위치 및 형태

| 항목 | 값 |
|------|------|
| 페이지 | 구독 관리 페이지 (`settings/pro.tsx`) |
| 위치 | 페이지 하단 (구독 해지 링크 아래 또는 동일 영역) |
| UI 형태 | 텍스트 안내 + 텍스트 링크 (버튼 ❌, 강조 UI ❌) |

### 11.3 UX 문구 명세

**기본 안내 문구:**
```
환불은 Google Play 정책에 따라 처리됩니다.
```

**링크 문구:**
```
Google Play 구독 관리로 이동 →
```

**또는 (해지와 통합 시):**
```
구독 해지·환불 관리 → Google Play 이동
```

### 11.4 이동 링크

- **URL**: `https://play.google.com/store/account/subscriptions`
- **동작**: 클릭 시 외부 브라우저 또는 Play Store 앱 열기
- **인앱 WebView**: ❌ 사용 금지
- 환불 / 해지 / 결제 내역 모두 처리 가능

### 11.5 구현 명세 (개발자용)

**컴포넌트 규칙:**
- `Text` + `TouchableOpacity` (또는 `Pressable`)
- 색상: 기본 텍스트 색상 또는 secondary color
- 밑줄 허용 (선택)
- 터치 영역: 최소 44px 확보

### 11.6 하지 않는 것 (명확화)

| ❌ 금지 항목 |
|-------------|
| 앱 내 환불 버튼 |
| 환불 요청 폼 |
| 고객센터 환불 접수 |
| 외부 웹 결제/환불 링크 (Google Play 외) |

### 11.7 정책 및 심사 대응

**Google Play 정책 준수 사항:**
- ✔️ 앱 내 환불 차단
- ✔️ 사용자에게 명확한 환불 경로 제공
- ✔️ Google Play 구독 관리 페이지 직접 연결

**심사 대응 문구:**
```
This app does not process refunds directly.
Refunds are handled by Google Play according to their policies.
```
