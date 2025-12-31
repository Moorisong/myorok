import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = '@myorok/device_id';

/**
 * Get or generate a unique device ID
 * This replaces the PIN service's getDeviceId function
 */
export async function getDeviceId(): Promise<string> {
    try {
        let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (!deviceId) {
            deviceId = Crypto.randomUUID();
            await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('[Device] Failed to get device ID:', error);
        // Fallback: generate a temporary ID
        return `temp-${Date.now()}`;
    }
}
