import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from '../constants';
import { PetProvider } from '../hooks/use-selected-pet';
import { PinLockProvider } from '../hooks/use-pin-lock';
import { ToastProvider } from '../components/ToastContext';
import { AppLockScreen, SubscriptionBlockScreen } from '../components';
import { useEffect, useState } from 'react';
import { registerForPushNotificationsAsync, sendTokenToBackend, scheduleInactivityNotification } from '../services/NotificationService';
import { getDeviceId } from '../services/pin';
import { initializeSubscription, isAppAccessAllowed } from '../services';
import Constants from 'expo-constants';

export default function RootLayout() {
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);

  useEffect(() => {
    let subscription: any;

    (async () => {
      try {
        // Initialize subscription on first launch
        await initializeSubscription();

        // Check if app access is allowed
        const accessAllowed = await isAppAccessAllowed();
        setSubscriptionBlocked(!accessAllowed);

        await scheduleInactivityNotification();
        const token = await registerForPushNotificationsAsync();
        if (token) {
          const deviceId = await getDeviceId();
          await sendTokenToBackend(deviceId, token);
        }

        // Foreground Notification Listener (Skip in Expo Go)
        if (Constants.executionEnvironment !== 'storeClient') {
          const Notifications = require('expo-notifications');
          subscription = Notifications.addNotificationReceivedListener((notification: any) => {
            console.log('Foreground notification:', notification);
          });
        }
      } catch (e) {
        console.log('Notification setup failed:', e);
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

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
              <SubscriptionBlockScreen visible={subscriptionBlocked} />
            </ToastProvider>
          </PinLockProvider>
        </PetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

