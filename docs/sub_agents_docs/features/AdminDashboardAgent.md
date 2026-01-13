# Admin Dashboard Agent Reference

## ADMIN_DASHBOARD_SPEC.md (운영자 대시보드 명세)

> **반려묘 병상일지 앱 – 묘록**  
> 운영자만 접근 가능한 대시보드 제공  
> 구독 기반 서비스 상태를 5초 안에 파악  
> 차트 없이 숫자 카드 중심 구성

### 핵심 사항

#### 운영자 식별
- 카카오 `userId` 기준
- 환경변수 `ADMIN_KAKAO_IDS`에 등록된 ID만 운영자
- 서버에서만 `isAdmin` 판단

#### 대시보드 지표
| 영역 | 지표 |
|------|------|
| 핵심 (KPI) | 유효 구독 수, 월 매출, 증감률 |
| 전환 | 체험 사용자 수, 전환율 |
| 보조 | 총 기기 수, 7일 신규 기기 |

#### 접근 제어
- 앱: `isAdmin === true`일 때만 버튼 노출
- 서버: `/admin/*` API에 `requireAdmin` 미들웨어 적용
- 권한 없으면 403 FORBIDDEN

---

## AI 작업 지침

### 목적
운영자 계정 판별 및 대시보드 기능을 구현하여, 운영자가 서비스 상태를 빠르게 파악할 수 있도록 한다.

### 작업 단계

#### Phase 1: 서버 – 운영자 판별

1. **환경변수 설정**
   - `.env`에 `ADMIN_KAKAO_IDS` 추가
   - 콤마로 복수 ID 등록 가능

2. **isAdminUser 함수 구현**
   ```typescript
   function isAdminUser(kakaoUserId: string): boolean {
     const admins = process.env.ADMIN_KAKAO_IDS?.split(",") ?? [];
     return admins.includes(kakaoUserId);
   }
   ```

3. **로그인 응답 확장**
   - `/api/auth/login` 응답에 `isAdmin` 필드 추가

---

#### Phase 2: 서버 – 대시보드 API

1. **requireAdmin 미들웨어 구현**
   ```typescript
   function requireAdmin(req, res, next) {
     if (!req.user?.isAdmin) {
       return res.status(403).json({ message: "FORBIDDEN" });
     }
     next();
   }
   ```

2. **대시보드 API 구현**
   - `GET /api/admin/dashboard`
   - 응답 구조:
     ```json
     {
       "kpi": {
         "activeSubscriptions": 128,
         "monthlyRevenue": 448000,
         "growthRate": 12.5
       },
       "conversion": {
         "trialUsers": 42,
         "conversionRate": 18.0
       },
       "secondary": {
         "totalDevices": 1024,
         "newDevices7Days": 56
       }
     }
     ```

3. **데이터 집계 로직**
   - `subscription_state` 테이블에서 active/trial 카운트
   - `devices` 컬렉션에서 기기 수 집계
   - `subscription_logs`에서 전환율 계산

---

#### Phase 3: 클라이언트 – 운영자 상태 관리

1. **로그인 시 isAdmin 저장**
   - AuthContext 또는 전역 상태에 `isAdmin` 저장
   - SecureStore 등에 캐싱

2. **useAuth Hook 확장**
   ```typescript
   const { user, isAdmin } = useAuth();
   ```

---

#### Phase 4: 클라이언트 – 대시보드 UI

1. **설정 탭에 버튼 추가**
   - 위치: 설정 탭 하단
   - 조건: `isAdmin === true`
   - 텍스트: "운영자 대시보드"

2. **대시보드 화면 구현**
   - 경로: `/admin/dashboard` 또는 모달
   - 레이아웃: 3개 영역 (핵심/전환/보조)
   - 컴포넌트: 숫자 카드 (MetricCard)

3. **MetricCard 컴포넌트**
   ```typescript
   interface MetricCardProps {
     label: string;
     value: string | number;
     unit: string; // '명' | '원' | '%'
     highlight?: boolean;
   }
   ```

4. **데이터 로딩**
   - 화면 진입 시 `/api/admin/dashboard` 호출
   - 로딩/에러 상태 처리

---

#### Phase 5: 접근 제어

1. **앱 레벨 보호**
   - `isAdmin` 아닌 경우 대시보드 라우트 접근 불가
   - 접근 시도 시 "접근 권한이 없습니다" 표시

2. **서버 레벨 보호**
   - 모든 `/admin/*` API에 `requireAdmin` 적용

---

### 주의사항

1. **보안 최우선**
   - `isAdmin`은 **절대 클라이언트에서 조작 불가**
   - 서버에서만 환경변수 기반 판단

2. **Android 전용**
   - iOS 관련 코드/설정 금지

3. **MVP 범위 준수**
   - 차트 사용 금지
   - 상세 사용자 분석 구현 금지
   - 관리자 권한 레벨 분리 금지

4. **일관된 단위 표시**
   - 명 / 원 / % 명확히 구분
   - 금액은 천 단위 콤마 적용

5. **데이터 보존 정책**
   - 기존 데이터 삭제 금지
   - `subscription_logs` 테이블 신규 추가 시 마이그레이션 고려

6. **성능**
   - 대시보드 데이터는 실시간 집계
   - 캐싱 불필요 (진입 시마다 최신 데이터)

---

### 연관 문서

- [KAKAO_LOGIN_SUBSCRIPTION_SPEC.md](../planning/KAKAO_LOGIN_SUBSCRIPTION_SPEC.md) - 로그인/구독 기반
- [BACKEND_SPEC.md](../planning/BACKEND_SPEC.md) - 서버 API 기반
- [PAYMENT_SPEC.md](../planning/PAYMENT_SPEC.md) - 결제 플로우 참조
