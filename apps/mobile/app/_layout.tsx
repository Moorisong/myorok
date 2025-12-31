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
import { useAuthRequest, ResponseType } from 'expo-auth-session';
import { getCurrentUserId, loginWithKakao } from '../services/auth';
import { KAKAO_CLIENT_ID, KAKAO_DISCOVERY, KAKAO_REDIRECT_URI } from '../services/auth/kakaoAuth';
import Constants from 'expo-constants';

export default function RootLayout() {
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Kakao Auth Request Hook
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: KAKAO_CLIENT_ID,
      scopes: ['profile_nickname', 'profile_image'],
      redirectUri: KAKAO_REDIRECT_URI,
      responseType: ResponseType.Code, // Explicitly set responseType to 'code' as requested
    },
    KAKAO_DISCOVERY
  );

  useEffect(() => {
    console.log('redirectUri =', KAKAO_REDIRECT_URI);
    console.log('ClientId loaded check:', KAKAO_CLIENT_ID ? `Yes (${KAKAO_CLIENT_ID.slice(0, 4)}...)` : 'No');
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

  // Handle Login Response
  useEffect(() => {
    // Debug: Log raw response
    if (response) {
      console.log('[KakaoAuth] Response received:', {
        type: response.type,
        params: response.type === 'success' ? response.params : null,
        error: response.type === 'error' ? response.error : null,
      });
    }

    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('[KakaoAuth] Authorization code received:', code ? `${code.slice(0, 10)}...` : 'null');
      if (code) {
        (async () => {
          setIsLoggingIn(true);
          try {
            const userId = await loginWithKakao(code);
            console.log('[RootLayout] Login successful:', userId);
            setIsLoggedIn(true);
          } catch (error) {
            console.error('[RootLayout] Login failed:', error);
            // Optional: Show error toast
          } finally {
            setIsLoggingIn(false);
          }
        })();
      }
    } else if (response?.type === 'error') {
      console.error('[RootLayout] Login error response:', response.error);
      setIsLoggingIn(false);
    } else if (response?.type === 'cancel') {
      console.log('[RootLayout] Login cancelled by user');
      setIsLoggingIn(false);
    }
  }, [response]);

  const handleLogin = async () => {
    console.log('[RootLayout] handleLogin called, request ready:', !!request);
    if (!request) {
      console.error('[RootLayout] Auth request not ready yet');
      return;
    }
    try {
      // Trigger login prompt (using server redirect URI)
      console.log('[RootLayout] Calling promptAsync...');
      const result = await promptAsync();
      console.log('[RootLayout] promptAsync returned:', result);
    } catch (error) {
      console.error('[RootLayout] Login prompt failed:', error);
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

