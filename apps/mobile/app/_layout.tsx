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
import { CONFIG } from '../constants/config';
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
import { initializePayment, disconnectPayment } from '../services/paymentService';
import { checkAndRestoreSubscription } from '../services/subscription';

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
    let subscription: any;
    let linkingSubscription: ReturnType<typeof Linking.addEventListener> | undefined;

    (async () => {
      try {
        // Check login status first using context
        await checkAuthStatus();

        // Initialize payment system
        try {
          console.log('Initializing payment system...');

          // 1. Google Play 결제 시스템 연결
          await initializePayment();

          // 2. Purchase listener 설정
          const { setupPurchaseListeners, completePurchase } = await import('../services/paymentService');
          const { handlePurchaseSuccess: handleSubscriptionSuccess } = await import('../services/subscription');

          const cleanupListeners = setupPurchaseListeners(
            async (purchase) => {
              // 결제 완료 처리
              try {
                console.log('Purchase successful, processing...');
                await completePurchase(purchase);
                await handleSubscriptionSuccess();
                console.log('Purchase processing completed');

                // Auth context 업데이트하여 구독 상태 갱신
                await checkAuthStatus();

                // 성공 토스트 표시
                setTimeout(() => {
                  const { showToast } = require('../utils/toast');
                  showToast('구독이 활성화되었습니다', 'success');
                }, 100);
              } catch (error) {
                console.error('Failed to process purchase:', error);
                setTimeout(() => {
                  const { showToast } = require('../utils/toast');
                  showToast('결제 처리 중 오류가 발생했습니다', 'error');
                }, 100);
              }
            },
            (error) => {
              // 사용자가 결제를 취소한 경우 - 정상 케이스, 별도 처리 없이 조용히 무시
              if (error.code === 'user-cancelled') {
                console.log('[Payment] User cancelled the purchase');
                return;
              }

              // 결제 에러 처리
              console.error('Purchase error:', error);

              // SKU not found 에러 처리
              if (error.code === 'sku-not-found') {
                setTimeout(() => {
                  const { showToast } = require('../utils/toast');
                  showToast('상품이 Google Play Console에 등록되지 않았습니다', 'error');
                }, 100);
                return;
              }

              // 이미 구독 중인 경우 (already-owned) - 구독 상태 동기화
              if (error.code === 'already-owned') {
                (async () => {
                  try {
                    setTimeout(() => {
                      const { showToast } = require('../utils/toast');
                      showToast('구독 상태 확인 중...', 'info');
                    }, 100);

                    // Google Play에서 구독 복원
                    await checkAndRestoreSubscription();

                    // Auth context 업데이트하여 화면 갱신
                    await checkAuthStatus();

                    setTimeout(() => {
                      const { showToast } = require('../utils/toast');
                      showToast('이미 구독 중입니다', 'success');
                    }, 300);
                  } catch (restoreError) {
                    console.error('Failed to restore subscription:', restoreError);
                    setTimeout(() => {
                      const { showToast } = require('../utils/toast');
                      showToast('구독 상태 확인 실패', 'error');
                    }, 100);
                  }
                })();
                return;
              }

              // 기타 에러
              setTimeout(() => {
                const { showToast } = require('../utils/toast');
                showToast('결제 중 오류가 발생했습니다', 'error');
              }, 100);
            }
          );

          // Cleanup 함수를 subscription 변수에 할당하여 나중에 제거
          subscription = { remove: cleanupListeners };

          // 3. 기존 구독 복원 (재설치 시)
          await checkAndRestoreSubscription();

          console.log('Payment system initialized successfully');
        } catch (error) {
          console.error('Failed to initialize payment system:', error);
          // 초기화 실패해도 앱은 계속 실행
        }

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

            // Handle trial end notification
            if (data?.type === 'TRIAL_END' && data?.action === 'GO_TO_SUBSCRIBE') {

              // Mark notification as sent
              await markTrialNotificationAsSent();

              // Navigate to subscription preview screen
              try {
                router.push('/(tabs)/settings/subscription-preview');
              } catch (error) {
                console.error('[Notification] Navigation failed:', error);
              }
            }

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
            console.log('[DeepLink] Received user data:', user);
            console.log('[DeepLink] isAdmin:', user.isAdmin);

            // Store JWT token and user info in AsyncStorage
            await AsyncStorage.setItem('jwt_token', token);
            await AsyncStorage.setItem('current_user_id', user.id);
            await AsyncStorage.setItem('kakao_user_info', JSON.stringify(user));

            // Store isAdmin status (from server response)
            const isAdminValue = user.isAdmin ? 'true' : 'false';
            console.log('[DeepLink] Storing isAdmin:', isAdminValue);
            await AsyncStorage.setItem('is_admin', isAdminValue);

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
      // Cleanup: 앱 종료 시 결제 시스템 연결 해제
      disconnectPayment().catch(error => {
        console.error('Failed to disconnect payment system:', error);
      });

      if (subscription) {
        subscription.remove();
      }
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
      // Construct OAuth URL directly without PKCE to avoid server-side issues
      const authUrl =
        `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${KAKAO_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
        `&response_type=code` +
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
          <ToastProvider>
            <SubscriptionBlockScreen />
          </ToastProvider>
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
