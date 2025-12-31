# Common Types Convention

> TypeScript 타입 정의 규칙

## 타입 / 인터페이스 정의

### 필수 타입 정의 대상

| 대상 | 필수 여부 | 설명 |
|------|----------|------|
| 컴포넌트 Props | ✅ 필수 | 모든 Props에 타입 정의 |
| 컴포넌트 State | ✅ 필수 | useState 훅의 제네릭 타입 명시 |
| API 응답 | ✅ 필수 | 외부 API 응답 구조 타입 정의 |
| 함수 파라미터/반환값 | ✅ 필수 | 명시적 타입 어노테이션 |

### TypeScript Strict 모드 대응

```typescript
// ✅ Optional chaining 활용
const userName = user?.profile?.name;

// ✅ Nullish coalescing 활용
const displayName = userName ?? '익명';

// ✅ 타입 가드 사용
if (user && user.id) {
  processUser(user);
}

// ❌ 금지: non-null assertion 남용
const name = user!.name;  // 피할 것
```
