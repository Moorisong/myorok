# Document Update Agent Reference

## 목적
사용자가 제공한 내용을 기반으로 프로젝트 문서를 자동으로 추가하거나 업데이트

## 작업 프로세스

### 1. 내용 분석
- 사용자 내용의 주제 파악 (기능/스펙/정책)
- 기존 문서와의 연관성 판단

### 2. docs/planning/ 문서 처리

**기존 문서 리스트:**
- `AI_CONTEXT.md` - 프로젝트 컨텍스트
- `BACKEND_SPEC.md` - 백엔드
- `CALENDAR_SPEC.md` - 캘린더
- `CHART_SPEC.md` - 차트
- `COMFORT_SPEC.md` - 쉼터
- `DESIGN_SYSTEM.md` - 디자인
- `MULTI_PET_SPEC.md` - 다묘
- `PAGE_SPEC.md` - 페이지
- `PRICING.md` - 가격
- `TAB_UX_SPEC.md` - 탭 UX
- `NOTIFICATION_SPEC.md` - 알림
- `LOCAL_DB_SPEC.md` - 로컬 DB
- `KAKAO_LOGIN_SUBSCRIPTION_SPEC.md` - 카카오 로그인/구독
- `PAYMENT_SPEC.md` - Google Play 결제
- `ADMIN_DASHBOARD_SPEC.md` - 운영자 대시보드

**작업:**
1. 관련 문서 찾기 (Glob, Grep 활용)
2. 있으면: Read → Edit로 업데이트
3. 없으면: Write로 신규 생성 (구조: 목적 → 구조 → UX → 데이터 → 구현)

### 3. docs/sub_agents_docs/ 문서 처리

**서브에이전트 문서 구조:**
```markdown
# [기능명] Agent Reference

## [Planning 문서명] (파일명.md)
[해당 planning 문서의 전체 내용]

---

## AI 작업 지침
### 목적
### 작업 단계
### 주의사항
```

**작업:**
1. 관련 에이전트 문서 찾기
2. 있으면: Read → Edit로 planning 내용 반영 및 AI 지침 추가
3. 없으면: Write로 신규 생성
4. 병렬로 진행할 수 있도록 모듈화 가능하면 무조건 모듈화 하기

## 주요 원칙

- **데이터 정책**: 삭제 없음, 데이터 보존
- **Android 전용**: iOS 관련 내용 금지
- **일관성**: 기존 문서 구조/톤 유지
- **명확성**: 애매한 표현 금지

## 완료 보고 형식

```
✅ 문서 업데이트 완료

📝 업데이트: docs/planning/[파일명].md
📝 업데이트: docs/sub_agents_docs/[파일명].md
(또는)
🆕 생성: docs/planning/[파일명].md
🆕 생성: docs/sub_agents_docs/[파일명].md
```
