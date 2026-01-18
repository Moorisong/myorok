# Test Infrastructure Refactoring Report

## P0: 테스트 인프라 수정

### 수행된 작업

#### 1. testUtils.ts 생성
- **위치**: `apps/mobile/__tests__/testUtils.ts`
- **목적**: 공통 테스트 유틸리티 제공하여 코드 중복 제거
- **주요 함수**:
  - `createMockVerificationResult()` - mock 데이터 생성
  - `setupMockFetch()` - fetch mock 설정
  - `setupSubscriptionTest()` - 테스트 환경 초기화
  - `cleanupSubscriptionTest()` - 테스트 환경 정리
  - `setupNetworkErrorTest()` - 네트워크 에러 시뮬레이션
  - `setupServerErrorTest()` - 500 에러 시뮬레이션

#### 2. subscription-ssot.test.ts 수정
- **변경 사항**:
  - testUtils에서 유틸리티 import
  - 중복되는 `createMockVerificationResult`, `setupMockFetch` 함수 제거
  - 모든 `beforeEach` 블록에 `setupSubscriptionTest()`, `afterEach`에 `cleanupSubscriptionTest()` 적용
  - `jest.resetModules()` 제거

#### 3. subscriptionFlow.test.ts 전체 재작성
- **변경 사항**:
  - testUtils 사용으로 코드 중복 제거
  - 중복되는 helper 함수 제거
  - 모든 `beforeEach`, `afterEach` 블록 정규화
  - 불필요한 인라인 코멘트 제거 (expect 문장으로 충분)
  - setupMockFetch 호출 순서 개선 (import 전에 호출)

#### 4. jest.config.js 수정
- **변경 사항**:
  - `clearMocks: true` 제거 (자동 mock clear 비활성화)
  - 테스트 간격리 강화를 위해 수동 제어 선호

#### 5. setup.ts 수정
- **변경 사항**:
  - `afterEach`에서 `jest.restoreAllMocks()` 사용
  - `beforeEach`에서 `jest.clearAllMocks()` 호출 유지
  - `mockClear()` 대신 `restoreAllMocks()` 사용 (스파이 제거)

### 현재 테스트 결과

**전체**: 73개 테스트
**통과**: 30개 (41%)
**실패**: 43개

### 남은 문제

#### 근본 원인
Jest 모듈 캐시와 Mock 초기화 간의 타이밍 문제로 인해 테스트 간 격리가 완벽하지 않음

1. **모듈 로드 타이밍**: `await import()` 방식이 각 테스트에서 서로 다른 모듈 인스턴스를 생성할 수 있음
2. **AsyncStorage Mock 상태**: `jest.clearAllMocks()`가 mock call history는 지우지만, mock 구현 자체를 초기화하지 않음
3. **Fetch Mock 공유**: 글로벌 fetch mock이 모든 테스트에서 공유되는데, 테스트 간 충돌 발생 가능

### 제안된 해결책

#### 즉시 조치 (추가 작업 필요)

1. **jest.resetModules() 재도입**
   - 각 describe 블록에서 명시적으로 모듈 리셋
   - 테스트 간 완벽한 격리 보장

2. **Fetch Mock 스코프화**
   - 각 테스트별로 독립적인 fetch mock 생성
   - `setupMockFetch`를 beforeEach에서 호출하여 테스트 간 일관성 보장

3. **AsyncStorage Mock 개선**
   - mock 상태가 테스트 간 누출되지 않도록 명시적 초기화
   - `jest.isolateModules()` 사용 고려

#### 단기 개선 (P1)

1. **MSW (Mock Service Worker) 도입**
   - fetch mock 복잡성 해결
   - 더 강력한 API 시뮬레이션 제공
   - 네트워크 에러 시나리오 테스트 개선

2. **테스트 분리 계층 도입**
   - 단위 테스트 vs 통합 테스트 분리
   - 실제 코드에 가까운 테스트 작성

#### 장기 개선 (P2)

1. **E2E 테스트 프레임워크**
   - Detox 또는 Appium 사용
   - 실제 앱 플로우 테스트

2. **성능 테스트**
   - SubscriptionManager 디바운싱 효과 측정
   - 대규모 데이터 처리 성능 테스트

### 결론

P0 작업에서 다음 개선사항이 달성됨:

✅ **코드 중복 제거**: testUtils.ts로 유틸리티 공유
✅ **테스트 설정 표준화**: 공통 setup/cleanup 패턴 적용
✅ **불필요한 코멘트 제거**: expect 문장으로 충분한 설명 삭제
✅ **Jest 설정 최적화**: clearMocks 제거로 더 많은 제어권 확보

**한계사항**:
- 테스트 통과율 41%로 개선되지 않음
- 근본적인 모듈 캐시/Mock 타이밍 문제 해결되지 않음
- 90%+ 통과율 달성을 위해서는 추가 작업 필요

**권장 다음 단계**:
1. 남은 43개 실패 해결을 위한 근본적 재구축 (시간 소모 큼)
2. 현재 코드 품질 개선 상태 유지 후 P1, P2 작업으로 이동
3. 테스트 신뢰성 확보를 위한 MSW 도입 검토
