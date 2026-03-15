import '../global.css';
import NetInfo from '@react-native-community/netinfo';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { DataProvider } from '@/providers/DataProvider';
import { Colors } from '@/constants/colors';
import '@/src/lib/i18n';
import { ActivityIndicator, View } from '@/src/tw';

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

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
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
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(shared)" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="(modals)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryLifecycle />
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
