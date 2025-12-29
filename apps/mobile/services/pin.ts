import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants';

const DEVICE_ID_KEY = '@myorok_device_id';

// Device ID 관리 (고유 식별자)
export async function getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

function generateDeviceId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// API 응답 타입
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    lockedUntil?: string;
    remainingAttempts?: number;
}

interface PinStatusData {
    isPinSet: boolean;
    isLocked: boolean;
    lockedUntil: string | null;
    failedAttempts?: number;
}

// API 호출 함수
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        return await response.json();
    } catch {
        // 서버 연결 실패 - 서버가 아직 없을 때 정상적인 상황
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: '서버에 연결할 수 없습니다.',
            },
        };
    }
}

// PIN 상태 조회
export async function getPinStatus(): Promise<ApiResponse<PinStatusData>> {
    const deviceId = await getDeviceId();
    return apiCall<PinStatusData>(`/api/settings/pin/status?deviceId=${encodeURIComponent(deviceId)}`);
}

// PIN 설정
export async function setPin(pin: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall('/api/settings/pin', {
        method: 'POST',
        body: JSON.stringify({ deviceId, pin }),
    });
}

// PIN 검증
export async function verifyPin(pin: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall('/api/settings/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ deviceId, pin }),
    });
}

// PIN 해제
export async function removePin(): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/settings/pin?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
    });
}
