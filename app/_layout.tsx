import '@/src/lib/i18n';
import '../global.css';

import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { isRunningInExpoGo } from 'expo';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { DataProvider } from '@/providers/DataProvider';
import { configureGoogleSignIn } from '@/src/lib/auth/social-auth';
import { useThemePreferenceStore } from '@/src/stores/theme-preference-store';
import { ActivityIndicator, View } from '@/src/tw';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
  routeChangeTimeoutMs: 1000,
  ignoreEmptyBackNavigationTransactions: true,
});

type ExpoManifestMetadata = {
  updateGroup?: string;
};

type ExpoManifestExtra = {
  expoClient?: {
    owner?: string;
    slug?: string;
  };
};

function setExpoUpdateSentryTags(): void {
  const manifest = Updates.manifest;

  const metadata =
    manifest && typeof manifest === 'object' && 'metadata' in manifest
      ? (manifest.metadata as ExpoManifestMetadata | undefined)
      : undefined;

  const extra =
    manifest && typeof manifest === 'object' && 'extra' in manifest
      ? (manifest.extra as ExpoManifestExtra | undefined)
      : undefined;

  const updateGroup = metadata?.updateGroup;

  const scope = Sentry.getGlobalScope();
  scope.setTag('expo-update-id', Updates.updateId ?? 'none');
  scope.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));

  if (updateGroup) {
    scope.setTag('expo-update-group-id', updateGroup);

    const owner = extra?.expoClient?.owner ?? 'unknown-account';
    const slug = extra?.expoClient?.slug ?? 'unknown-project';
    scope.setTag(
      'expo-update-debug-url',
      `https://expo.dev/accounts/${owner}/projects/${slug}/updates/${updateGroup}`
    );
    return;
  }

  if (Updates.isEmbeddedLaunch) {
    scope.setTag(
      'expo-update-debug-url',
      'not applicable for embedded updates'
    );
  }
}

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
  dist: process.env.EXPO_PUBLIC_SENTRY_DIST,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: false,

  // Capture all traces in development, sample in production.
  tracesSampleRate: __DEV__ ? 1 : 0.2,

  // Native frame metrics are only supported in native builds (not Expo Go).
  enableNativeFramesTracking: !isRunningInExpoGo(),

  // Enable Logs
  enableLogs: __DEV__,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

setExpoUpdateSentryTags();

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      const isOnline =
        state.isInternetReachable == null
          ? !!state.isConnected
          : !!state.isConnected && !!state.isInternetReachable;
      setOnline(isOnline);
    })
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppLoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

function ReactQueryLifecycle(): null {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    function handleAppStateChange(status: AppStateStatus): void {
      focusManager.setFocused(status === 'active');
    }

    focusManager.setFocused(AppState.currentState === 'active');

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

function AuthRuntimeBootstrap(): null {
  useThemePreferenceStore((state) => state.preference);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return null;
}

function AuthenticatedDataProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{children}</>;

  return <DataProvider>{children}</DataProvider>;
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: t('back') }}>
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(shared)"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen name="(modals)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function RootLayout(): React.JSX.Element {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryLifecycle />
      <AuthRuntimeBootstrap />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AuthenticatedDataProvider>
            <RootLayoutNav />
          </AuthenticatedDataProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
