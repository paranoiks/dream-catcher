import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DreamsProvider } from '@/data/dreams-store';
import { ThemeProvider } from '@/theme/theme';
import { EDITIONS } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const INK = EDITIONS['Ink & Gold'].bg0;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Marcellus: require('@/assets/fonts/Marcellus-Regular.ttf'),
    Spectral: require('@/assets/fonts/Spectral-Regular.ttf'),
    SpectralItalic: require('@/assets/fonts/Spectral-Italic.ttf'),
    SpectralMedium: require('@/assets/fonts/Spectral-Medium.ttf'),
    SpectralSemiBold: require('@/assets/fonts/Spectral-SemiBold.ttf'),
    SpectralSemiBoldItalic: require('@/assets/fonts/Spectral-SemiBoldItalic.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: INK }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DreamsProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: INK },
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="dream/[id]" />
              <Stack.Screen name="symbol/[tag]" />
              <Stack.Screen name="reading/[id]" />
              <Stack.Screen name="record" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
          </DreamsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
