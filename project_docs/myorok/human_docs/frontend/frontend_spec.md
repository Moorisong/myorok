# 💻 프론트엔드 아키텍처 명세 (`frontend_spec.md`)

이 문서는 **묘록 (Myorok)** 모바일 앱 클라이언트의 아키텍처 패턴, 전역 상태 관리 체계, 주요 UI 컴포넌트 및 네트워크/에러 핸들링 구조를 정의합니다.

---

## 🧱 1. 프론트엔드 아키텍처 패턴

묘록 앱은 **온디바이스 독립형(Offline-First) 구조**와 **Hook-Service 계층 아키텍처**를 채택하고 있습니다.

```text
[UI 레이어: Screens / Components] (React Native 컴포넌트)
        │
        ▼ (사용자 액션 전달 및 지역 상태 바인딩)
[Custom Hooks] (`hooks/use-today-screen.ts` 등 - 프리젠테이션 로직 제어)
        │
        ▼ (비즈니스 정책 수행 및 데이터 가공)
[Service 레이어] (`services/database.ts`, `services/auth/` 등)
        │
        ├───▶ [Local Storage] (SQLite `expo-sqlite`, `AsyncStorage`)
        └───▶ [Remote API] (Fetch 기반 Next.js 백엔드 통신)
```

### 아키텍처적 핵심 특징
* **오프라인 우선 작동 (Offline-First)**: 사용자 건강 기록은 외부 서버가 마비되거나 네트워크가 끊겨도 온디바이스 SQLite 데이터베이스를 통해 끊김 없이 조회 및 생성할 수 있도록 설계되었습니다.
* **로직 및 뷰 격리**: 페이지 UI 파일(`app/(tabs)/index.tsx` 등)은 컴포넌트 구조만을 정의하고, 폼 제어 및 비동기 파이프라인 처리는 대응되는 커스텀 훅(`use-today-screen.ts` 등)으로 완전 위임하여 테스트 및 유지보수성을 극대화합니다.

---

## 🧠 2. 전역 상태 관리 및 데이터 흐름

전역 상태관리는 Context API를 사용해 필요한 컨텍스트만 결합하는 독립성 위주로 구성되어 있습니다.

| Context Provider | Hook 이름 | 전역 상태 역할 |
| :--- | :--- | :--- |
| `AuthProvider` | `useAuth` | Kakao OAuth 2.0 로그인 여부, 토큰 영속성(Storage), 사용자 아이디 및 관리자 여부(`isAdmin`) 관리 |
| `PetProvider` | `useSelectedPet` | 다묘 가구 지원을 위해 현재 선택된 고양이(`selectedPetId`, `selectedPet`) 상태 및 고양이 리스트 관리 |
| `ToastProvider` | `useToast` | 앱의 전역 하단 경고 및 성공 피드백 토스트 알림 메시지 큐 관리 |

---

## 🎨 3. 주요 공통 UI 컴포넌트 및 위젯 리스트

* **`MetricCard.tsx` / `custom-metric-section.tsx`**
  * 일일 기록 화면에서 소변, 대변, 구토 횟수 등을 표시하고 가감할 수 있는 카드 뷰 및 수치 조절 섹션.
* **`NumberEditModal.tsx` / `memo-edit-modal.tsx`**
  * 섭취 수분량(ml), 특이사항 메모 등을 키패드를 이용해 정밀 수정할 수 있도록 제공되는 바텀시트 형식 모달.
* **`calendar-grid.tsx`**
  * 달력 탭에서 일일 기록 유무를 파악해 똥/구토/메모 등의 미니어처 배지를 달력 눈금 단위로 표기해주는 달력 레이아웃 그리드 컴포넌트.
* **`comfort-post-card.tsx`**
  * 쉼터(커뮤니티) 리스트 및 디테일에서 개별 익명 게시글 카드를 렌더링하고 공감(하트), 댓글수, 삭제 및 신고 인터랙션을 수행하는 카드 컴포넌트.
* **`pet-selector.tsx`**
  * 앱 헤더 영역 또는 설정에서 다묘 가구가 원클릭으로 기록 대상을 스위칭할 수 있도록 돕는 펫 선택 드롭다운 UI.

---

## 🛡️ 4. API 통신 및 글로벌 에러 핸들링 구조

### 🌐 API 네트워크 클라이언트
* Axios나 React Query 같은 무거운 라이브러리 대신 경량 모바일 환경을 위해 네이티브 `fetch` API를 사용하여 래핑 구현되었습니다.
* 서버 주소는 `constants/config.ts`에 정의된 `CONFIG.API_BASE_URL`을 이용합니다.

### ⚠️ 에러 핸들링 및 네트워크 사이드 이펙트 방어
* **서버 통신 예외**: `apps/mobile/P2_ERROR_HANDLING_REPORT.md` 지침에 따라 서버 연결 차단 또는 에러 응답(`status >= 400`) 수신 시 앱의 UI가 파괴(White Screen)되지 않도록 `try-catch` 블록으로 안전하게 감싸고, 실패 시 즉시 `useToast`를 통해 친절한 에러 문구(`"네트워크 연결을 확인해주세요."`)를 출력합니다.
* **로컬 DB 폴백**: 로그인 상태 조회 및 커뮤니티 데이터 조회 등 외부 API 서버 장애 상황에서도 `users`, `pets`, `daily_records` 등 로컬 기기 내에서 처리 가능한 핵심 로직은 데이터 조작 오류가 발생하지 않도록 로컬 데이터에 임시 백업/싱크하고 이력을 기록합니다.
