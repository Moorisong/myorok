import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from '../constants';
import { PetProvider } from '../hooks/use-selected-pet';
import { PinLockProvider } from '../hooks/use-pin-lock';
import { ToastProvider } from '../components/ToastContext';
import { AppLockScreen } from '../components';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PetProvider>
          <PinLockProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: COLORS.background },
                }}
              >
                <Stack.Screen name="(tabs)" />
              </Stack>
              <AppLockScreen />
            </ToastProvider>
          </PinLockProvider>
        </PetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

