import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = '@myorok/device_id';

/**
 * Get or generate a unique device ID (SSOT 기준)
 * 앱 재설치 후에도 일관성 있는 deviceId 생성 및 관리
 *
 * 중요: 버전 체크를 제거하여 앱 재설치 후에도 동일한 deviceId 유지
 * - 최초 생성된 deviceId는 절대 변경되지 않음
 * - deviceId 기반 중복 trial 방지가 항상 작동하도록 보장
 */
export async function getDeviceId(): Promise<string> {
    try {
        let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        // deviceId가 없는 경우에만 새로 생성 (최초 설치 시)
        if (!deviceId) {
            deviceId = Crypto.randomUUID();
            await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
            console.log('[Device] Generated new deviceId:', deviceId);
        } else {
            console.log('[Device] Using existing deviceId:', deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('[Device] Failed to get device ID:', error);
        // Fallback: generate a temporary ID (에러 로깅용)
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('[Device] Using temporary deviceId:', tempId);
        return tempId;
    }
}

/**
 * Reset deviceId for testing purposes
 */
export async function resetDeviceId(): Promise<void> {
    try {
        await AsyncStorage.removeItem(DEVICE_ID_KEY);
        console.log('[Device] Device ID reset');
    } catch (error) {
        console.error('[Device] Failed to reset device ID:', error);
    }
}

/**
 * Check if deviceId exists and is valid
 */
export async function hasValidDeviceId(): Promise<boolean> {
    try {
        const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        return !!deviceId;
    } catch (error) {
        console.error('[Device] Failed to check device ID validity:', error);
        return false;
    }
}
