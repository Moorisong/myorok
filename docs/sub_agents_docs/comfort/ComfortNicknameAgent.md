# Comfort Nickname Agent Reference

> 쉼터 탭 닉네임 자동 생성 기능 전담 에이전트

## COMFORT_SPEC.md (관련 섹션)

### 1.1 닉네임 생성

**구조**:
```
<단어><숫자>
```
- 단어: 50개 한글 단어 중 deviceId 해싱으로 선택
- 숫자: 1000 ~ 9999 범위

**단어 리스트 (50개)**:
```
미르, 노을, 달토리, 소나기, 햇살비, 구름결, 별무리, 바람꽃, 조약돌, 물빛,
솜사탕, 풀내음, 새벽별, 해님, 달그림자, 별하늘, 꽃샘, 바다빛, 달맞이, 노루발,
햇살꽃잎, 봄바람결, 눈꽃송이, 달빛잔향, 포근함, 솜구름, 봄향기, 물안개꽃, 달빛노래, 푸른숲,
노을빛, 달빛숲, 별빛샘, 햇살나래, 달빛송이, 푸른별, 봄눈, 별빛잔향, 햇살바람, 포근달빛,
달빛바다, 별빛숲, 햇살빛나래, 눈빛, 바람결, 해무리, 달빛꽃, 솔향기, 별빛노래, 바람결빛
```

**특징**:
- 동일 기기는 항상 동일 닉네임 (deviceId 해싱)
- 익명성 유지하면서 일관된 식별 가능

---

## 닉네임 생성 알고리즘

### 1. 단어 선택
```typescript
const words = [
  "미르", "노을", "달토리", "소나기", "햇살비", 
  // ... 총 50개
];

function selectWord(deviceId: string): string {
  // deviceId를 해시하여 0-49 범위의 인덱스 생성
  const hash = hashFunction(deviceId);
  const index = hash % 50;
  return words[index];
}
```

### 2. 숫자 생성
```typescript
function generateNumber(deviceId: string): number {
  // deviceId를 해시하여 1000-9999 범위의 숫자 생성
  const hash = hashFunction(deviceId);
  return 1000 + (hash % 9000);
}
```

### 3. 최종 닉네임
```typescript
function generateNickname(deviceId: string): string {
  const word = selectWord(deviceId);
  const number = generateNumber(deviceId);
  return `${word}${number}`;
}
```

---

## AI 작업 지침

### 목적
익명성을 유지하면서 사용자를 일관되게 식별할 수 있는 닉네임을 자동 생성합니다.

### 작업 단계

#### 1. 해시 함수 선택
- deviceId를 숫자로 변환하는 안정적인 해시 함수 필요
- 권장: CRC32, MD5, SHA-256 등
- 동일 입력에 항상 동일 출력 보장

**예시 (Node.js)**:
```typescript
import crypto from 'crypto';

function hashDeviceId(deviceId: string): number {
  const hash = crypto.createHash('md5').update(deviceId).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}
```

#### 2. 단어 선택 로직
- 50개 한글 단어 배열 정의
- 해시값을 50으로 나눈 나머지로 인덱스 계산
- 동일 deviceId는 항상 동일 단어

```typescript
const WORDS = [
  "미르", "노을", "달토리", "소나기", "햇살비", "구름결", "별무리", "바람꽃", "조약돌", "물빛",
  "솜사탕", "풀내음", "새벽별", "해님", "달그림자", "별하늘", "꽃샘", "바다빛", "달맞이", "노루발",
  "햇살꽃잎", "봄바람결", "눈꽃송이", "달빛잔향", "포근함", "솜구름", "봄향기", "물안개꽃", "달빛노래", "푸른숲",
  "노을빛", "달빛숲", "별빛샘", "햇살나래", "달빛송이", "푸른별", "봄눈", "별빛잔향", "햇살바람", "포근달빛",
  "달빛바다", "별빛숲", "햇살빛나래", "눈빛", "바람결", "해무리", "달빛꽃", "솔향기", "별빛노래", "바람결빛"
];

function getWord(deviceId: string): string {
  const hash = hashDeviceId(deviceId);
  const index = hash % WORDS.length;
  return WORDS[index];
}
```

#### 3. 숫자 생성 로직
- 해시값을 9000으로 나눈 나머지에 1000 더하기
- 범위: 1000 ~ 9999

```typescript
function getNumber(deviceId: string): number {
  const hash = hashDeviceId(deviceId);
  return 1000 + (hash % 9000);
}
```

#### 4. 닉네임 조합
```typescript
export function generateNickname(deviceId: string): string {
  const word = getWord(deviceId);
  const number = getNumber(deviceId);
  return `${word}${number}`;
}
```

#### 5. 프론트엔드/백엔드 공통 로직
- 닉네임 생성 로직은 서버와 클라이언트 모두 필요
- 동일한 알고리즘 사용 필수
- 유틸리티 함수로 공통화

### 주의사항

#### 일관성 보장
- 동일 deviceId는 항상 동일 닉네임
- 해시 함수 변경 금지 (기존 사용자 닉네임 변경됨)
- 단어 리스트 순서 변경 금지

#### 익명성 유지
- deviceId로부터 역산 불가능해야 함
- 해시 함수 사용으로 일방향 변환

#### 충돌 가능성
- 50개 단어 × 9000개 숫자 = 450,000 조합
- 실제 사용자 수가 적으면 충돌 거의 없음
- 충돌 발생 시 deviceId로 구분

#### 단어 리스트 관리
- 50개 정확히 유지
- 순서 변경 금지
- 추가 시 맨 뒤에만 추가

#### Android 전용
- iOS 관련 코드 금지

#### 테스트 케이스
- [ ] 동일 deviceId → 동일 닉네임
- [ ] 다른 deviceId → 다른 닉네임 (높은 확률)
- [ ] 단어가 50개 단어 중 하나
- [ ] 숫자가 1000-9999 범위
- [ ] 서버와 클라이언트 생성 결과 동일
