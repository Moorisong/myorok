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
