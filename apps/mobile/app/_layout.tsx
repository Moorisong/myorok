import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, AppState, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
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
  const { isLoggedIn, setIsLoggedIn, isLoggingIn, setIsLoggingIn, checkAuthStatus, subscriptionStatus, setSubscriptionStatus } = useAuth();
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [isRestoreRetryNeeded, setIsRestoreRetryNeeded] = useState(false);
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const NotificationsRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);
  const subscriptionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const subscriptionStatusRef = useRef(subscriptionStatus); // For closure access

  // Direct OAuth URL construction (bypasses expo-auth-session to avoid PKCE issues)

  useEffect(() => {
    let subscription: any;
    let linkingSubscription: ReturnType<typeof Linking.addEventListener> | undefined;

    (async () => {
      try {
        // Check login status first using context
        await checkAuthStatus();

        // Get login status after check (needed for conditional restore)
        const currentUserId = await getCurrentUserId();

        // Initialize payment system
        try {

          // 1. Google Play 결제 시스템 연결
          await initializePayment();

          // 2. Purchase listener 설정
          const { setupPurchaseListeners, completePurchase } = await import('../services/paymentService');
          const { handlePurchaseSuccess: handleSubscriptionSuccess } = await import('../services/subscription');

          const cleanupListeners = setupPurchaseListeners(
            async (purchase) => {
              // 결제 완료 처리
              try {
                // 1. SubscriptionManager를 통해 상태 업데이트 (중앙 집중식) - 레이스 컨디션 방지를 위해 최상단에서 수행
                const SubscriptionManager = (await import('../services/SubscriptionManager')).default;
                const manager = SubscriptionManager.getInstance();
                await manager.handlePurchaseComplete();

                // 2. UI 상태를 즉시 업데이트
                console.log('[Payment] Purchase complete, setting status to active');
                setSubscriptionStatus('active');

                // 3. 결제 완료 처리 및 서버 동기화 (네트워크 작업은 백그라운드 성격으로 진행)
                try {
                  await completePurchase(purchase);
                  await handleSubscriptionSuccess();
                } catch (syncError) {
                  console.error('[Payment] Background sync failed:', syncError);
                  // UI는 이미 active이므로 사용자에게는 성공으로 보임
                }

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
                console.log('[Payment] User cancelled purchase');
                return;
              }

              // 이미 구독 중인 경우 (already-owned) - 정상 케이스, 구독 상태 동기화
              if (error.code === 'already-owned') {
                console.log('[Payment] Item already owned, syncing subscription status');
                (async () => {
                  try {
                    // 1. 먼저 restore 플래그를 제거 (C-2 상태 해제 - 가장 먼저 해야 함)
                    console.log('[Payment] Removing restore flags...');
                    await AsyncStorage.removeItem('restore_attempted');
                    await AsyncStorage.removeItem('restore_succeeded');

                    // 2. 이미 구독 중이므로 Google Play에서 상태 가져오기
                    const { getSubscriptionDetails } = await import('../services/paymentService');
                    const { handleLicenseResponse } = await import('../services/licenseChecker');

                    const subscriptionDetails = await getSubscriptionDetails();

                    if (subscriptionDetails.isActive) {
                      // 3. 구독 활성화 처리 (실제 productId와 purchaseToken 전달)
                      await handleLicenseResponse(
                        'LICENSED',
                        subscriptionDetails.expiryDate,
                        subscriptionDetails.productId,
                        subscriptionDetails.purchaseToken
                      );

                      // 4. UI 상태를 즉시 업데이트 (차단 화면 해제)
                      console.log('[Payment] Setting subscription status to active');
                      setSubscriptionStatus('active');

                      // 5. 강제로 메인 탭으로 이동 (React 상태 업데이트가 UI에 반영되지 않는 문제 해결)
                      router.replace('/(tabs)');

                      setTimeout(() => {
                        const { showToast } = require('../utils/toast');
                        showToast('이미 구독 중입니다', 'success');
                      }, 100);
                    }
                  } catch (restoreError) {
                    console.error('[Payment] Failed to sync already-owned subscription:', restoreError);
                    setTimeout(() => {
                      const { showToast } = require('../utils/toast');
                      showToast('구독 상태 확인 실패', 'error');
                    }, 100);
                  }
                })();
                return;
              }

              // 실제 에러 케이스 - 로그 출력
              console.error('[Payment] Purchase error:', error);

              // SKU not found 에러 처리
              if (error.code === 'sku-not-found') {
                setTimeout(() => {
                  const { showToast } = require('../utils/toast');
                  showToast('상품이 Google Play Console에 등록되지 않았습니다', 'error');
                }, 100);
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

          // 3. 기존 구독 복원 (재설치 시) - 이제 checkAuthStatus()에서 처리됨
          // (Auto-restore가 checkAuthStatus() 내부에서 SSOT 호출 전에 실행됨)
          if (currentUserId) {
            console.log('[App] Auto-restore is now handled in checkAuthStatus()');
          } else {
            console.log('[App] Skip restore - not logged in');
          }

        } catch (error) {
          console.error('Failed to initialize payment system:', error);
          // 초기화 실패해도 앱은 계속 실행
        }

        if (currentUserId) {
          // initializeSubscription is now handled within checkAuthStatus() 
          // to ensure trial start date is set before main screen renders
          console.log('[App] initializeSubscription is now handled in checkAuthStatus');
        } else {
          console.log('[App] Skip initializeSubscription - not logged in');
        }

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
            const { startTrialForUser } = await import('../services/subscription');
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
              if (!isDevAutoLogin) {
                try {
                  await startTrialForUser(user.id);
                } catch (trialError) {
                  // 체험 시작 실패 (이미 사용함) - 로그인은 계속 진행
                  // checkAuthStatus에서 blocked 상태로 전환됨
                  console.log('[DeepLink] Trial start failed (already used or rejected), continuing login:', trialError);
                }
              } else {
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

            // SubscriptionManager가 checkAuthStatus() 내에서 복원 + SSOT 처리
            // 별도 restore 호출 불필요 (중복 호출 방지)
            console.log('[DeepLink] Calling checkAuthStatus (SubscriptionManager handles restore + SSOT)');
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

      // Cleanup subscription check interval
      if (subscriptionCheckInterval.current) {
        clearInterval(subscriptionCheckInterval.current);
      }
    };
  }, []);

  // Check if restore retry is needed when in loading state
  useEffect(() => {
    // 약간의 지연을 두고 체크 (플래그 제거가 완전히 반영되도록)
    const timeoutId = setTimeout(async () => {
      if (subscriptionStatus === 'loading') {
        try {
          const restoreAttempted = await AsyncStorage.getItem('restore_attempted');
          const restoreSucceeded = await AsyncStorage.getItem('restore_succeeded');

          console.log('[AppContent] Checking restore retry:', { restoreAttempted, restoreSucceeded });

          // CASE C-2: Restore 시도했으나 실패
          // restoreAttempted === 'true' && restoreSucceeded === 'false'는
          // 복원을 시도했지만 실패했다는 의미
          if (restoreAttempted === 'true' && restoreSucceeded === 'false') {
            console.log('[AppContent] Restore retry needed - showing block screen');
            setIsRestoreRetryNeeded(true);
          } else {
            console.log('[AppContent] Restore retry not needed');
            setIsRestoreRetryNeeded(false);
          }
        } catch (error) {
          console.error('[AppContent] Failed to check restore retry:', error);
          setIsRestoreRetryNeeded(false);
        }
      } else {
        setIsRestoreRetryNeeded(false);
      }
    }, 100); // 100ms 지연

    return () => clearTimeout(timeoutId);
  }, [subscriptionStatus]);

  // AppState listener and periodic subscription check
  useEffect(() => {
    // 로그인하지 않았거나 로그인 중이면 체크하지 않음
    if (!isLoggedIn || isLoggingIn) {
      return;
    }

    // Ref를 현재 값으로 업데이트 (closure 문제 해결)
    subscriptionStatusRef.current = subscriptionStatus;

    // 구독 상태 체크 함수 (SubscriptionManager 사용)
    const checkSubscriptionStatus = async () => {
      try {
        // Ref에서 현재 상태 읽기 (closure가 아닌 최신 값)
        const currentStatus = subscriptionStatusRef.current;

        // SSOT가 아직 실행되지 않았거나 'loading'을 반환한 경우, 체크하지 않음
        if (currentStatus === null || currentStatus === 'loading') {
          console.log('[AppState] Skipping status check - status is', currentStatus, '(D-1 SSOT)');
          return;
        }

        // SubscriptionManager를 통해 상태 확인 (skipRestore: 포그라운드 전환에서는 복원 생략)
        const SubscriptionManager = (await import('../services/SubscriptionManager')).default;
        const manager = SubscriptionManager.getInstance();
        const uiStatus = await manager.resolveSubscriptionStatus({ skipRestore: true });

        // 상태가 변경되었으면 context 업데이트
        if (uiStatus !== subscriptionStatus) {
          console.log('[AppState] Subscription status changed:', subscriptionStatus, '→', uiStatus);
          setSubscriptionStatus(uiStatus);
        }
      } catch (error) {
        console.error('[AppState] Failed to check subscription status:', error);
      }
    };

    // AppState 변경 리스너 (백그라운드 → 포그라운드)
    const handleAppStateChange = (nextAppState: any) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[AppState] App has come to the foreground, checking subscription');
        checkSubscriptionStatus();
      }

      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // 주기적인 구독 상태 체크 (10분마다)
    subscriptionCheckInterval.current = setInterval(() => {
      console.log('[AppState] Periodic subscription check');
      checkSubscriptionStatus();
    }, 10 * 60 * 1000); // 10분 (운영 환경 기준, 서버 부하 최소화)

    // 초기 체크
    checkSubscriptionStatus();

    return () => {
      appStateSubscription.remove();
      if (subscriptionCheckInterval.current) {
        clearInterval(subscriptionCheckInterval.current);
      }
    };
  }, [isLoggedIn, isLoggingIn, subscriptionStatus, setSubscriptionStatus]);

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

  // 3. Logging In / Checking Subscription / SSOT Loading State
  // SSOT: subscriptionStatus === 'loading'일 때도 로딩 UI 표시 (스토어 검증 중)
  // CASE C-2: Restore 실패 시 복원 재시도 화면 표시
  if (isLoggingIn || (isLoggedIn === true && (subscriptionStatus === null || subscriptionStatus === 'loading'))) {
    // C-2: Restore 재시도 필요 (복원 실패)
    if (subscriptionStatus === 'loading' && isRestoreRetryNeeded) {
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

    // 일반 로딩 상태
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <View style={loadingStyles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={loadingStyles.text}>
              {isLoggingIn ? '로그인 중...' : '구독 상태 확인 중...'}
            </Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 4. Logged In & Expired/Blocked -> Block Screen
  // SSOT: 'expired' 상태 = 'blocked' 상태 (차단 화면 표시)
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
