import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setupNotifications } from '../services/downloadService';
import { useDownloadStore } from '../store/downloadStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const { resetDailyCountIfNeeded, setPremium } = useDownloadStore();

  useEffect(() => {
    // Setup notifications
    setupNotifications();

    // Reset daily counter if needed
    resetDailyCountIfNeeded();

    // Restore premium state
    AsyncStorage.getItem('premium_state').then((val) => {
      if (val) {
        try {
          const saved = JSON.parse(val);
          useDownloadStore.setState({ premium: saved });
          resetDailyCountIfNeeded();
        } catch {}
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0A0A14" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
