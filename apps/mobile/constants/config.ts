export const CONFIG = {
    TOAST_DURATION: 3000,           // ms
    FREE_DAYS_LIMIT: 15,            // 무료 사용자 접근 가능 일수
    BOTTOM_PADDING: 80,             // Bottom padding for toast space

    // PIN 잠금 설정
    PIN_AUTO_LOCK_TIMEOUT: 10 * 60 * 1000, // 10분 무활동 시 자동 재잠금
    PIN_LENGTH: 4,                  // PIN 길이

    // API 설정 (서버 배포 후 변경 필요)
    API_BASE_URL: __DEV__
        ? 'http://192.168.0.7:3001'   // 개발 환경 (Network IP, 환경변수 무시하고 강제 적용)
        : (process.env.EXPO_PUBLIC_API_URL || 'https://api.myorok.app'), // 프로덕션 환경
} as const;
