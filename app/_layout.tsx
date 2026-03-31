import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../context/LanguageContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { registerForPushNotificationsAsync } from './lib/notificationService';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  React.useEffect(() => {
    registerForPushNotificationsAsync();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <LanguageProvider>
        <SubscriptionProvider>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Index is the onboarding screen */}
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
            </Stack>
          </SafeAreaProvider>
        </SubscriptionProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});