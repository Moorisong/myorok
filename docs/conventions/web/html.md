# Web HTML Convention

> 시맨틱 마크업 및 구조

## 시맨틱 HTML (Semantic HTML) ⭐ 필수

> **의미 있는 HTML 태그 사용 필수** - SEO, 접근성, 유지보수성 향상

### 필수 시맨틱 태그

| 용도 | 올바른 태그 | 잘못된 태그 |
|------|------------|------------|
| 페이지 헤더 | `<header>` | `<div class="header">` |
| 네비게이션 | `<nav>` | `<div class="nav">` |
| 메인 콘텐츠 | `<main>` | `<div class="main">` |
| 섹션 | `<section>` | `<div class="section">` |
| 독립 콘텐츠 | `<article>` | `<div class="article">` |
| 부가 정보 | `<aside>` | `<div class="sidebar">` |
| 페이지 푸터 | `<footer>` | `<div class="footer">` |
| 제목 | `<h1>` ~ `<h6>` | `<div class="title">` |
| 버튼 | `<button>` | `<div onClick>` |
| 링크 | `<a href>` | `<span onClick>` |

### 페이지 구조 예시

```tsx
// ✅ 올바른 시맨틱 구조
<main>
  <header>
    <h1>투표방 제목</h1>
  </header>
  
  <section aria-labelledby="candidates-title">
    <h2 id="candidates-title">후보 장소</h2>
    <ul>
      <li><article>...</article></li>
    </ul>
  </section>
  
  <aside>
    <h3>주차 정보</h3>
  </aside>
  
  <footer>
    <nav aria-label="페이지 네비게이션">...</nav>
  </footer>
</main>
```

### 제목 계층 규칙

- **h1**: 페이지당 1개만 사용
- **h2~h6**: 순서대로 계층 유지 (h2 → h4 건너뛰기 ❌)
