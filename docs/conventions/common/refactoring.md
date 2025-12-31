# Common Refactoring Guide

> 리팩토링, 최적화, 비동기 처리 원칙

## 리팩토링 원칙

### 핵심 원칙

| 원칙 | 설명 | 적용 예시 |
|------|------|----------|
| **SRP (단일 책임)** | 하나의 함수/컴포넌트는 하나의 역할만 | 데이터 fetch와 UI 렌더링 분리 |
| **중복 코드 제거** | 2회 이상 반복 시 공통 모듈화 | 유틸 함수, 공통 컴포넌트 추출 |
| **불필요한 렌더링 방지** | React 최적화 훅 활용 | `React.memo`, `useCallback`, `useMemo` |
| **비동기 처리 통일** | `async/await` 패턴 사용 | try-catch 에러 핸들링 필수 |
| **모듈화** | 기능 단위로 파일 분리 | 한 파일 200줄 이하 권장 |

### 비동기 처리 패턴

```typescript
// ✅ 올바른 패턴
const fetchData = async (): Promise<Data> => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
};

// ❌ 잘못된 패턴
const fetchData = () => {
  api.get('/endpoint').then(res => res.data);  // 에러 핸들링 없음
};
```

### 렌더링 최적화

```typescript
// 비용이 큰 계산은 useMemo 사용
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// 콜백 함수는 useCallback 사용
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// 자식 컴포넌트는 React.memo 고려
const ChildComponent = React.memo(({ data }: Props) => {
  return <div>{data}</div>;
});
```
