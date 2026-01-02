import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../constants';
import { PetProvider } from '../hooks/use-selected-pet';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../components/ToastContext';
import { SubscriptionBlockScreen } from '../components/subscription/SubscriptionBlockScreen';
import { LoginScreen } from '../components/auth/LoginScreen';
import { registerForPushNotificationsAsync, scheduleInactivityNotification } from '../services/NotificationService';
import { initializeSubscription, isAppAccessAllowed, markTrialNotificationAsSent } from '../services';
import { loginWithKakao } from '../services/auth';
import { KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI } from '../services/auth/kakaoAuth';
import { getCurrentUserId } from '../services/auth';

// Main app content that uses auth context
function AppContent() {
  const { isLoggedIn, setIsLoggedIn, isLoggingIn, setIsLoggingIn, checkAuthStatus, subscriptionStatus } = useAuth();
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const NotificationsRef = useRef<any>(null);

  // Direct OAuth URL construction (bypasses expo-auth-session to avoid PKCE issues)

  useEffect(() => {
    console.log('redirectUri =', KAKAO_REDIRECT_URI);
    console.log('ClientId loaded check:', KAKAO_CLIENT_ID ? `Yes (${KAKAO_CLIENT_ID.slice(0, 4)}...)` : 'No');
    let subscription: any;
    let linkingSubscription: ReturnType<typeof Linking.addEventListener> | undefined;

    (async () => {
      try {
        // Check login status first using context
        await checkAuthStatus();

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

        // Register push token first
        const token = await registerForPushNotificationsAsync();
        if (token) {
          const { getDeviceId } = await import('../services/device');
          const { sendTokenToBackend } = await import('../services/NotificationService');
          const deviceId = await getDeviceId();
          await sendTokenToBackend(deviceId, token);
          console.log('[App] Push token registered:', deviceId);
        }

        // Check inactivity notification setting before scheduling
        const { getDeviceId } = await import('../services/device');
        const deviceId = await getDeviceId();
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

        try {
          const response = await fetch(`${API_URL}/api/device/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId }),
          });
          const data = await response.json();

          // Only schedule inactivity notification if setting is enabled (default: true)
          const inactivityEnabled = data.device?.settings?.inactivity !== false;
          if (inactivityEnabled) {
            await scheduleInactivityNotification();
            console.log('[App] Inactivity notification scheduled (enabled by user)');
          } else {
            console.log('[App] Inactivity notification skipped (disabled by user)');
          }
        } catch (error) {
          console.error('[App] Failed to check notification settings:', error);
          // Fallback: schedule notification if settings check fails
          await scheduleInactivityNotification();
        }

        // Foreground Notification Listener (Skip in Expo Go)
        if (Constants.executionEnvironment !== 'storeClient') {
          const Notifications = require('expo-notifications');
          NotificationsRef.current = Notifications;

          // Foreground notification listener
          notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
            console.log('[Notification] Foreground notification received:', notification);
          });

          // Notification response listener (when user taps notification)
          responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response: any) => {
            console.log('[Notification] User tapped notification:', response);

            const data = response.notification.request.content.data;

            // Handle trial end notification
            if (data?.type === 'TRIAL_END' && data?.action === 'GO_TO_SUBSCRIBE') {
              console.log('[Notification] Trial end notification tapped, navigating to subscription');

              // Mark notification as sent
              await markTrialNotificationAsSent();

              // Navigate to subscription preview screen
              try {
                router.push('/(tabs)/settings/subscription-preview');
              } catch (error) {
                console.error('[Notification] Navigation failed:', error);
              }
            }
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
          setIsLoggingIn(true); // Prevent login screen flash during processing
          try {
            // Parse user info
            const user = JSON.parse(decodeURIComponent(userString));
            console.log('[DeepLink] User info:', { id: user.id, nickname: user.nickname });

            // Store JWT token and user info in AsyncStorage
            await AsyncStorage.setItem('jwt_token', token);
            await AsyncStorage.setItem('current_user_id', user.id);
            await AsyncStorage.setItem('kakao_user_info', JSON.stringify(user));

            // Save user to database and handle trial
            const { getUser } = await import('../services/auth/userService');
            const { getDatabase } = await import('../services/database');
            const { startTrialForUser } = await import('../services/subscription');
            const { migrateLegacyDataToUser } = await import('../services/auth/migrateLegacyData');

            const existingUser = await getUser(user.id);
            const db = await getDatabase();
            const now = new Date().toISOString();

            if (!existingUser) {
              // New user - create in DB and start trial
              await db.runAsync(
                `INSERT INTO users (id, nickname, profileImage, createdAt, lastLogin)
                 VALUES (?, ?, ?, ?, ?)`,
                [user.id, user.nickname, user.profileImage || null, now, now]
              );
              await startTrialForUser(user.id);
              console.log('[DeepLink] New user created in DB');

              // Migrate legacy data (data created before login)
              await migrateLegacyDataToUser(user.id);
            } else {
              // Existing user - update last login
              await db.runAsync(
                'UPDATE users SET lastLogin = ? WHERE id = ?',
                [now, user.id]
              );
              console.log('[DeepLink] Existing user updated');
            }

            // Re-check auth status to update context (including subscription)
            await checkAuthStatus();

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
      if (NotificationsRef.current) {
        if (notificationListener.current) {
          NotificationsRef.current.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          NotificationsRef.current.removeNotificationSubscription(responseListener.current);
        }
      }
    };
  }, []);

  // Note: Login response is now handled via deep link in the useEffect above

  const handleLogin = async () => {
    console.log('[RootLayout] handleLogin called');
    console.log('[RootLayout] KAKAO_CLIENT_ID:', KAKAO_CLIENT_ID ? `${KAKAO_CLIENT_ID.slice(0, 4)}...` : 'undefined');

    if (!KAKAO_CLIENT_ID) {
      console.error('[RootLayout] KAKAO_CLIENT_ID is not defined');
      return;
    }

    try {
      // Construct OAuth URL directly without PKCE to avoid server-side issues
      const authUrl =
        `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${KAKAO_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=profile_nickname,profile_image`;

      console.log('[RootLayout] Opening OAuth URL...');

      // Platform-specific browser handling for better 2FA experience
      if (Platform.OS === 'android') {
        // Android: Use external browser to prevent session loss during KakaoTalk 2FA
        // External browser runs as separate app, so it persists when switching to KakaoTalk
        await Linking.openURL(authUrl);
        console.log('[RootLayout] External browser opened (Android)');
      } else {
        // iOS: Use in-app browser for better UX (iOS handles app switching better)
        await WebBrowser.openBrowserAsync(authUrl, {
          showInRecents: true,
        });
        console.log('[RootLayout] In-app browser opened (iOS)');
      }
    } catch (error) {
      console.error('[RootLayout] Login prompt failed:', error);
    }
  };

  // 1. Initial Loading
  if (isLoggedIn === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          {/* Loading screen - can be replaced with a splash screen */}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 2. Not Logged In
  if (isLoggedIn === false && !isLoggingIn) {
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

  // 3. Logging In Or Checking Subscription (Logged In but status unknown)
  if (isLoggingIn || (isLoggedIn === true && subscriptionStatus === null)) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          {/* Loading screen during login process */}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 4. Logged In & Expired -> Block Screen
  if (isLoggedIn === true && subscriptionStatus === 'expired') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <SubscriptionBlockScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 5. Active / Trial -> Main App
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
            {/* Dev/Update blocking if needed */}
            {subscriptionBlocked && <SubscriptionBlockScreen />}
          </ToastProvider>
        </PetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Root layout with AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
