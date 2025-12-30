# Backend Security Spec

## 1. 데이터 보안 정책

### 1.1 저장소 보안
- **로컬**: 앱 샌드박스 내 저장 (OS 레벨 보호)
- **서버**: MongoDB Atlas (IP Whitelist, VPC Peering 권장)

### 1.2 전송 보안
- 모든 API 통신은 **HTTPS (SSL/TLS)** 필수

## 2. 앱 잠금 (App Lock)

> **핵심 원칙**: "서버가 기억하고, 클라이언트는 잠깐만 믿는다"

- PIN 번호는 **서버에만 저장** (클라이언트 저장 금지)
- 클라이언트는 "현재 세션이 잠금 해제되었음" 상태만 메모리에 유지
- 인증 실패 횟수 관리는 서버가 담당
- **5회 실패 시 5분간 계정 잠금** (Brute-force 방지)

## 3. 인증 (Authentication)

### v1 (현재)
- **Device ID 기반**: `deviceId` 헤더로 식별
- 별도 로그인 과정 없음 (익명/기기 기반)

### v2 (예정)
- **사용자 계정 도입**: 이메일/소셜 로그인
- **JWT 토큰**: `Authorization: Bearer <token>`
- **authMiddleware**: 토큰 검증 미들웨어 활성화

## 4. 암호화 (Encryption) - Future

- **E2E 암호화**: 백업 데이터 업로드 시 클라이언트에서 암호화 후 전송
- **utils/encryption.ts**: AES-256 암호화/복호화 유틸리티 구현 예정
