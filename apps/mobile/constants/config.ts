import Constants from 'expo-constants';

const getDevApiUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('haroo.site')) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3001`;
    }
    return 'http://localhost:3001';
};

export const CONFIG = {
    TOAST_DURATION: 3000,           // ms
    FREE_DAYS_LIMIT: 15,            // 무료 사용자 접근 가능 일수
    BOTTOM_PADDING: 80,             // Bottom padding for toast space

    // PIN 잠금 설정
    PIN_AUTO_LOCK_TIMEOUT: 10 * 60 * 1000, // 10분 무활동 시 자동 재잠금
    PIN_LENGTH: 4,                  // PIN 길이

    // API 설정
    API_BASE_URL: __DEV__ ? getDevApiUrl() : 'https://myorok.haroo.site',
} as const;
