# Common Coding Style

> 코드 포맷팅 및 기본 스타일

## 1. 기술 스택 버전

| 기술 | 버전 | 적용 범위 |
|------|------|----------|
| **React** | 19.x | 공통 |
| **TypeScript** | 5.x | 공통 (Strict 모드) |
| **ESLint** | 9.x | 공통 (Flat Config) |
| **Node.js** | 18+ | 공통 (LTS) |
| **Next.js** | 16.x | 웹만 |
| **React Native** | 0.81.x | 앱만 |
| **Expo** | 54.x | 앱만 |

---

## 2. 코드 스타일

| 항목 | 규칙 | 예시 |
|------|------|------|
| 들여쓰기 | **2칸 스페이스** | `··const x = 1;` |
| 세미콜론 | **항상 사용** | `const x = 1;` ✅ / `const x = 1` ❌ |
| 따옴표 | **single quote `'`** | `'hello'` ✅ / `"hello"` ❌ |
| 라인 길이 | **최대 100자** | 100자 초과 시 줄바꿈 |
| 린트/포맷 | **ESLint + Prettier 필수** | 커밋 전 반드시 적용 |

### Prettier 설정 (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```
