import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/auth';
// import { syncService } from '../src/services/sync'; // Temporarily disabled for web debugging
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { useThemeStore } from '../src/store/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    const init = async () => {
      // Sync service temporarily disabled for web debugging
      // try {
      //   await syncService.init();
      //   console.log('✅ Sync service initialized');
      // } catch (error) {
      //   console.error('❌ Failed to initialize sync service:', error);
      // }

      // Check auth
      await checkAuth();
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
