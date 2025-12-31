import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from '../constants';
import { PetProvider } from '../hooks/use-selected-pet';
import { ToastProvider } from '../components/ToastContext';
import { SubscriptionBlockScreen } from '../components';
import { LoginScreen } from '../components/auth/LoginScreen';
import { useEffect, useState } from 'react';
import { registerForPushNotificationsAsync, sendTokenToBackend, scheduleInactivityNotification } from '../services/NotificationService';
import { initializeSubscription, isAppAccessAllowed } from '../services';
import { getCurrentUserId, loginWithKakao } from '../services/auth';
import Constants from 'expo-constants';

export default function RootLayout() {
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let subscription: any;

    (async () => {
      try {
        // Check login status first
        const userId = await getCurrentUserId();
        setIsLoggedIn(!!userId);

        // Initialize subscription on first launch
        await initializeSubscription();

        // Check if app access is allowed (skip blocking in dev mode)
        if (!__DEV__) {
          const accessAllowed = await isAppAccessAllowed();
          setSubscriptionBlocked(!accessAllowed);
        } else {
          // In dev mode, always allow access
          setSubscriptionBlocked(false);
        }

        await scheduleInactivityNotification();
        const token = await registerForPushNotificationsAsync();
        if (token) {
          // Device ID is now managed by auth service
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

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const userId = await loginWithKakao();
      console.log('[RootLayout] Login successful:', userId);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('[RootLayout] Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show loading or login screen if not logged in
  if (isLoggedIn === false) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <LoginScreen
            onLoginSuccess={(userId) => setIsLoggedIn(true)}
            onLoginPress={handleLogin}
            isLoading={isLoggingIn}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PetProvider>
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
            <SubscriptionBlockScreen visible={subscriptionBlocked} />
          </ToastProvider>
        </PetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

