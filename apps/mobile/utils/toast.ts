// apps/mobile/utils/toast.ts

import { Platform, ToastAndroid, Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  // Toast 또는 Alert 구현
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // Alert fallback
    Alert.alert('알림', message);
  }
}
