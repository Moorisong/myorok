import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, AppState, View, ActivityIndicator, Text, StyleSheet, TouchableOpacity as RNTouchableOpacity } from 'react-native';
const TouchableOpacity = RNTouchableOpacity;
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../constants';
import { CONFIG } from '../constants/config';
import { PetProvider } from '../hooks/use-selected-pet';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../components/ToastContext';
import { LoginScreen } from '../components/auth/LoginScreen';
import { registerForPushNotificationsAsync, scheduleInactivityNotification } from '../services/NotificationService';
import { loginWithKakao } from '../services/auth';
import { KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI } from '../services/auth/kakaoAuth';
import { getCurrentUserId } from '../services/auth';

// Main app content that uses auth context
function AppContent() {
  const { isLoggedIn, setIsLoggedIn, isLoggingIn, setIsLoggingIn, checkAuthStatus } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const NotificationsRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Direct OAuth URL construction (bypasses expo-auth-session to avoid PKCE issues)

  useEffect(() => {
    (async () => {
      try {
        // Check login status first using context
        await checkAuthStatus();

        // Get login status after check
        const currentUserId = await getCurrentUserId();




        // Register push token first
        const token = await registerForPushNotificationsAsync();
        if (token) {
          const { getDeviceId } = await import('../services/device');
          const { sendTokenToBackend } = await import('../services/NotificationService');
          const deviceId = await getDeviceId();
          await sendTokenToBackend(deviceId, token);
        }

        // Check inactivity notification setting before scheduling
        const { getDeviceId } = await import('../services/device');
        const deviceId = await getDeviceId();

        try {
          const response = await fetch(`${CONFIG.API_BASE_URL}/api/device/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId }),
          });
          const data = await response.json();

          // Only schedule inactivity notification if setting is enabled (default: true)
          const inactivityEnabled = data.device?.settings?.inactivity !== false;
          if (inactivityEnabled) {
            await scheduleInactivityNotification();
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
            // Notification received in foreground
          });

          // Notification response listener (when user taps notification)
          responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response: any) => {

            const data = response.notification.request.content.data;

            // Handle inactivity notification
            if (data?.type === 'INACTIVITY') {
              try {
                router.push('/(tabs)');
              } catch (error) {
                console.error('[Notification] Navigation failed:', error);
              }
            }

            // Handle comment notification
            if (data?.type === 'COMMENT') {
              try {
                router.push('/(tabs)/comfort');
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

      // Parse myorok://?token=xxx&user=xxx (root path with query params)
      if (url.includes('token=') && url.includes('user=')) {
        const { queryParams } = Linking.parse(url);
        const token = queryParams?.token as string;
        const userString = queryParams?.user as string;

        if (token && userString) {
          setIsLoggingIn(true); // Prevent login screen flash during processing
          try {
            // Parse user info
            const user = JSON.parse(decodeURIComponent(userString));

            // Store JWT token and user info in AsyncStorage
            await AsyncStorage.setItem('jwt_token', token);
            await AsyncStorage.setItem('current_user_id', user.id);
            await AsyncStorage.setItem('kakao_user_info', JSON.stringify(user));

            // Store isAdmin status (from server response)
            const isAdminValue = user.isAdmin ? 'true' : 'false';
            await AsyncStorage.setItem('is_admin', isAdminValue);

            // Save user to database and handle trial
            const { getUser } = await import('../services/auth/userService');
            const { getDatabase } = await import('../services/database');

            const { migrateLegacyDataToUser } = await import('../services/auth/migrateLegacyData');

            const existingUser = await getUser(user.id);
            const db = await getDatabase();
            const now = new Date().toISOString();

            if (!existingUser) {
              // New user - create in DB
              await db.runAsync(
                `INSERT INTO users (id, nickname, profileImage, createdAt, lastLogin)
                 VALUES (?, ?, ?, ?, ?)`,
                [user.id, user.nickname, user.profileImage || null, now, now]
              );

              // Dev auto-login에서는 trial 시작 건너뛰기 (이미 서버에 기록된 사용자일 수 있음)
              const isDevAutoLogin = await AsyncStorage.getItem('dev_auto_login');
              if (isDevAutoLogin) {
                console.log('[DeepLink] Skipping trial start for dev auto-login');
              }

              // Migrate legacy data (data created before login)
              await migrateLegacyDataToUser(user.id);
            } else {
              // Existing user - update last login
              await db.runAsync(
                'UPDATE users SET lastLogin = ? WHERE id = ?',
                [now, user.id]
              );
            }

            await checkAuthStatus();

            setIsLoggingIn(false);
          } catch (error) {
            console.error('[DeepLink] Failed to save token:', error);
            setIsLoggingIn(false);
          }
        }
      }
    };

    // Listen for deep link events
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {

      if (linkingSubscription) {
        linkingSubscription.remove();
      }
      if (NotificationsRef.current?.removeNotificationSubscription) {
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
    if (!KAKAO_CLIENT_ID) {
      console.error('[RootLayout] KAKAO_CLIENT_ID is not defined');
      return;
    }

    try {
      const returnUrl = Linking.createURL('');
      const authUrl =
        `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${KAKAO_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
        `&response_type=code` +
        `&state=${encodeURIComponent(returnUrl)}` +
        `&scope=profile_nickname,profile_image`;

      // Platform-specific browser handling for better 2FA experience
      if (Platform.OS === 'android') {
        // Android: Use external browser to prevent session loss during KakaoTalk 2FA
        // External browser runs as separate app, so it persists when switching to KakaoTalk
        await Linking.openURL(authUrl);
      } else {
        // iOS: Use in-app browser for better UX (iOS handles app switching better)
        await WebBrowser.openBrowserAsync(authUrl, {
          showInRecents: true,
        });
      }
    } catch (error) {
      console.error('[RootLayout] Login prompt failed:', error);
    }
  };



  // 1. Initial Loading (로그인 상태 확인 중)
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

  // 3. Logging In
  if (isLoggingIn) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <View style={loadingStyles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={loadingStyles.text}>로그인 중...</Text>

          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 5. Active / Trial -> Main App
  // SSOT: 'active' = 'subscribed', 'trial' = trial
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
            {/* {subscriptionBlocked && <SubscriptionBlockScreen />} */}
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

// Loading screen styles
const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

});
