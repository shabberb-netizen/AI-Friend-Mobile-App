import React, { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '@/context/AppContext';
import { SecurityGate, SecurityProvider } from '@/context/SecurityContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
import { Redirect, Stack, useSegments } from 'expo-router';

const queryClient = new QueryClient();

setBaseUrl(process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : null);
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';

  if (!isLoaded) return null;
  if (!isSignedIn && !inAuthGroup) return <Redirect href="/(auth)/sign-in" />;
  if (isSignedIn && inAuthGroup) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="friend-chat" options={{ headerShown: false }} />
    </Stack>
  );
}

function AuthTransport({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return children;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SecurityProvider>
          <SecurityGate>
            <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache} proxyUrl={clerkProxyUrl}>
              <AuthTransport>
                <ThemeProvider>
                  <AppProvider>
                    <QueryClientProvider client={queryClient}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <KeyboardProvider>
                          <RootLayoutNav />
                        </KeyboardProvider>
                      </GestureHandlerRootView>
                    </QueryClientProvider>
                  </AppProvider>
                </ThemeProvider>
              </AuthTransport>
            </ClerkProvider>
          </SecurityGate>
        </SecurityProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
