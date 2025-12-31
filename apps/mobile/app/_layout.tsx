import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';

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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      responseType: ResponseType.Code,
      usePKCE: false, // Disable PKCE since server handles token exchange
    },
    KAKAO_DISCOVERY
  );

  useEffect(() => {
    console.log('redirectUri =', KAKAO_REDIRECT_URI);
    console.log('ClientId loaded check:', KAKAO_CLIENT_ID ? `Yes (${KAKAO_CLIENT_ID.slice(0, 4)}...)` : 'No');
    let subscription: any;
    let linkingSubscription: ReturnType<typeof Linking.addEventListener> | undefined;

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

    // Handle deep links for OAuth callback
    const handleDeepLink = async (event: Linking.EventType) => {
      const url = event.url;
      console.log('[DeepLink] Received URL:', url);

      // Parse myorok://?token=xxx&user=xxx (root path with query params)
      if (url.includes('token=') && url.includes('user=')) {
        const { queryParams } = Linking.parse(url);
        const token = queryParams?.token as string;
        const userString = queryParams?.user as string;

        if (token && userString) {
          console.log('[DeepLink] JWT token and user info received');
          try {
            // Parse user info
            const user = JSON.parse(decodeURIComponent(userString));
            console.log('[DeepLink] User info:', { id: user.id, nickname: user.nickname });

            // Store JWT token and user info
            await AsyncStorage.setItem('jwt_token', token);
            await AsyncStorage.setItem('current_user_id', user.id);
            await AsyncStorage.setItem('kakao_user_info', JSON.stringify(user));

            setIsLoggedIn(true);
            setIsLoggingIn(false);
            console.log('[DeepLink] Login successful via deep link');
          } catch (error) {
            console.error('[DeepLink] Failed to save token:', error);
            setIsLoggingIn(false);
          }
        }
      }
    };

    // Listen for deep link events
    linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (linkingSubscription) {
        linkingSubscription.remove();
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

