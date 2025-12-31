# PIN Service

**파일**: `src/services/pinService.ts`

## 역할
PIN 번호의 암호화, 검증, 잠금 시간 계산 등 보안 관련 비즈니스 로직을 담당합니다.

## 주요 함수

### `hashPin(pin: string): Promise<string>`
- Input: 4자리 숫자 문자열
- Logic: `bcrypt.hash(pin, 10)`
- Output: Hashed string

### `comparePin(pin: string, hash: string): Promise<boolean>`
- Logic: `bcrypt.compare(pin, hash)`

### `checkLockStatus(lockedUntil: Date | null): boolean`
- 현재 시간과 `lockedUntil`을 비교하여 잠금 상태 반환

### `calculateLockTime(): Date`
- 현재 시간 + 5분(설정값)을 반환
