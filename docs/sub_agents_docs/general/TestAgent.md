# 구독 결제-만료-갱신 테스트 명세 (월 구독 기준 + SubscriptionBlockScreen 통합 차단 화면 포함)

## 1. 목적
- 실제 서비스 기준 월 구독 로직 검증 (SSOT 원칙 준수)
- 무료체험, 구독중, 만료, 복원 실패, 해지 상태 등 모든 케이스 테스트
- 설치 유형 혼합(신규/재설치/기존)
- [SubscriptionBlockScreen.tsx](cci:7://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/components/subscription/SubscriptionBlockScreen.tsx:0:0-0:0) 통합 차단 화면 동작 검증
- 네트워크 오류, 500 에러 등 예외 처리 검증
- AI 시뮬레이션 기반 상태 일관성 검증

---

## 2. 테스트 환경

| 항목 | 내용 |
|------|------|
| 플랫폼 | Android Expo Managed App |
| 테스트 계정 | 프로덕션/샌드박스 테스터 계정 혼합 가능 |
| 결제 모드 | 월 구독 (monthly) |
| 로컬 DB | SQLite (`subscription_state` 테이블) |
| 시간 기준 | 서버 기준 (`serverTime`) |
| 설치 유형 | 신규 설치 / 재설치 / 기존 설치 |
| 라이브러리 | `expo-in-app-purchases` 기반 자체 `paymentService` |
| 통합 차단 화면 | [apps/mobile/components/subscription/SubscriptionBlockScreen.tsx](cci:7://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/components/subscription/SubscriptionBlockScreen.tsx:0:0-0:0) |

---

## 3. 상태 정의

### UI 레이어 상태 ([useAuth.tsx](cci:7://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/hooks/useAuth.tsx:0:0-0:0), [SubscriptionManager.ts](cci:7://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/services/SubscriptionManager.ts:0:0-0:0))
| 상태 (Status) | 의미 | 대응하는 SSOT(서비스) 상태 |
|------|------|------|
| `loading` | 스토어/서버 검증 중 (스피너 표시) | `loading` |
| `trial` | 무료 체험 활성 | `trial` |
| `active` | 구독 활성 (정상 이용 가능) | `subscribed` |
| `expired` | 구독/체험 만료로 인한 차단 ([SubscriptionBlockScreen](cci:1://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/components/subscription-block-screen.tsx:12:0-69:1) 표시) | `blocked` |

---

## 4. 필수 체크 항목 (구현 변수명 일치)

### 가. AsyncStorage 전용 키 (`SUBSCRIPTION_KEYS`)
- `trial_start_date` : 무료 체험 시작 날짜 (ISO String)
- `subscription_status` : 로컬에 저장된 UI 상태 (`loading`, `trial`, `active`, `expired`)
- `subscription_start_date` : 정기 구독 시작 날짜
- `subscription_expiry_date` : 구독/체험 만료 예정 날짜
- `has_used_trial` : 무료체험 사용 여부
- `days_remaining` : 남은 체험 일수 (서버 계산값)
- `restore_attempted` : 복원 프로세스 시도 여부
- `restore_succeeded` : 복원 프로세스 최종 성공 여부

### 나. 검증 결과 객체 필드 ([VerificationResult](cci:2://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/services/subscription-ssot.ts:25:0-46:1))
- `entitlement_active` : 구글 플레이 구독 권한 활성 여부
- `hasPurchaseHistory` : 서버에 기록된 결제 이력 존재 여부
- `isPending` : 결제 승인 대기 중 여부
- `serverSyncSucceeded` : 서버 동기화 성공 여부
- `source` : `'server' | 'cache'`

---

## 5. 설치 유형별 초기 상태

| 설치 유형 | 기대 상태 | 검증 포인트 |
|-----------|-----------|-------------|
| 신규 설치 | `trial` 가능 여부 확인 | 서버: `hasUsedTrial=false`, UI: [TrialBanner](cci:1://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/app/%28tabs%29/index.tsx:127:4-136:6) 노출 |
| 재설치 | 기존 구독/체험 상태 복원 | `restoreSucceeded` 성공 시: `active` / 실패 시: `expired` |
| 기존 설치 | 현재 상태 유지 | 로컬 캐시/DB/서버 상태 일관성 |

---

## 6. 화면 및 상태 흐름 시나리오

### 6.1 무료 체험 상태 (`trial`)
- **오늘탭**: 상단 [TrialBanner](cci:1://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/app/%28tabs%29/index.tsx:127:4-136:6) 표시 ("무료 체험 D-N")
- **설정탭**: 구독 관리 서브타이틀 ("무료 체험 D-N")
- **구독 관리 페이지**: 상단 파란색 배너 ("무료 체험 중")

### 6.2 구독 중 상태 (`active`)
- **오늘탭**: 정상 진입, 무료체험 배너 없음
- **설정탭**: 구독 관리 서브타이틀 ("구독 중")
- **구독 관리 페이지**: 상단 초록색 배너 ("✓ 구독 중 / 다음 결제일")

### 6.3 복원 실패 / 구독 만료 / 무료체험 만료 (`expired`)
- **오늘탭/설정탭**: 접근 차단 → **[SubscriptionBlockScreen.tsx](cci:7://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/components/subscription/SubscriptionBlockScreen.tsx:0:0-0:0)** 표시
- **차단 화면**: "구독이 필요합니다" 자물쇠 화면
  - [새로 구독하기] 클릭 시 결제창 호출
  - [구독 복원하기] 클릭 시 복원 프로세스 실행
- **성공 시**: 즉시 상태가 `active`로 변경되며 메인 탭 진입 가능

### 6.4 네트워크 오류 / 서버 500 에러 (`loading`)
- [SubscriptionManager](cci:2://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/services/SubscriptionManager.ts:22:0-297:1)에서 서버 통신 실패 시 항상 **`loading`** 반환
- 로딩 화면과 함께 "구독 상태 확인 중..." 메시지 및 [재시도] 버튼 표시

---

## 7. 엣지 케이스 및 반복 테스트

| 케이스 | 조건 | 기대 상태 | 검증 |
|--------|------|-----------|------|
| **Restore 실패** | 결제 이력은 있으나 복원 실패 | `expired` | `isRestoreRetryNeeded` 활성화 시 즉시 차단 화면 |
| **Pending 상태** | 구글 결제 승인 대기 중 | `loading` | 차단 화면 대신 로딩 유지, 승인 완료 시 `active` 전환 |
| **Product ID 불일치** | 정의되지 않은 상품 ID | `loading` | [determineSubscriptionState](cci:1://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/services/subscription-ssot.ts:280:0-363:1)에서 처리를 보류하고 로딩 유지 |
| **시간 조작** | 기기 시간 변경 | `active`/`expired` | SSOT에서 서버 시간(`serverTime`) 기준 판정이므로 조작 무관하게 동작함 |
| **서버 500/네트워크** | 통신 불가 상황 | `loading` | 로컬 상 상태 추측을 금지하고 로딩 화면 유지 |

---

## 8. AI 자동화 체크 및 시뮬레이션 시나리오

1. **상태값 일치 확인**: [getTrialCountdownText](cci:1://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/services/subscription.ts:417:0-425:1), [getSubscriptionDescription](cci:1://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/app/%28tabs%29/settings/index.tsx:140:4-150:6) 함수 결과값이 테스트 기대값과 일치하는지 확인
2. **차단 로직 확인**: [app/_layout.tsx](cci:7://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/app/_layout.tsx:0:0-0:0)에서 `isLoggedIn === true && subscriptionStatus === 'expired'` 조건이 차단 화면을 띄우는지 확인
3. **SSOT 검증**: [SubscriptionManager](cci:2://file:///Users/shkim/Desktop/Project/myorok/apps/mobile/services/SubscriptionManager.ts:22:0-297:1) 싱글톤이 모든 상태 변화를 중앙에서 제어하는지 확인
4. **결제 완료 처리**: 결제 직후 `purchaseJustCompleted` 플래그에 의해 SSOT를 건너뛰고 즉시 `active`를 반환하는지 확인