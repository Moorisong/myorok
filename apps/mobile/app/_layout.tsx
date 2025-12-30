import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from '../constants';
import { PetProvider } from '../hooks/use-selected-pet';
import { PinLockProvider } from '../hooks/use-pin-lock';
import { AppLockScreen } from '../components/app-lock-screen';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PetProvider>
          <PinLockProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="pro"
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="about"
                options={{
                  presentation: 'modal',
                }}
              />
            </Stack>
            {/* 앱 전체 잠금 화면 */}
            <AppLockScreen />
          </PinLockProvider>
        </PetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
