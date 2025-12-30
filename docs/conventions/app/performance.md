# App Performance & Debugging

## 1. 환경변수 규칙 (Expo)

```typescript
// .env 파일
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

// ✅ 사용
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ⚠️ 주의: EXPO_PUBLIC_ 접두사 필수 (클라이언트 접근)
// NEXT_PUBLIC_ (웹) ≠ EXPO_PUBLIC_ (앱)
```

---

## 2. 디버깅 - console.log 제거 규칙

```typescript
// ✅ 개발 중에만 로그 출력
if (__DEV__) {
  console.log('Debug info:', data);
}

// ❌ 프로덕션에 console.log 금지
// ESLint 설정으로 자동 검출
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```
