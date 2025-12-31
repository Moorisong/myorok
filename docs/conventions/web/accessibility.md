# Web Accessibility Convention

> 웹 접근성(a11y) 필수 규격

## 접근성 (a11y) 규칙

### 필수 속성

| 요소 | 필수 속성 | 설명 |
|------|----------|------|
| 아이콘 버튼 | `aria-label` | 버튼 목적 설명 |
| 모달 | `role="dialog"`, `aria-modal` | 모달임을 명시 |
| 로딩 상태 | `aria-busy`, `aria-live` | 상태 변화 알림 |
| 폼 입력 | `<label>` 연결 또는 `aria-label` | 입력 필드 설명 |

```tsx
// ✅ 아이콘 버튼
<button aria-label="메뉴 닫기">
  <CloseIcon />
</button>

// ✅ 로딩 상태
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? <Spinner /> : <Content />}
</div>

// ✅ 폼 입력
<label htmlFor="title">투표 제목</label>
<input id="title" type="text" />
```

### 키보드 네비게이션

- 모든 인터랙티브 요소는 **Tab 키로 접근 가능**해야 함
- Enter/Space로 활성화 가능해야 함
- 포커스 상태 시각적으로 표시 (`focus:ring-2`)
