import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n'; // Initialize i18n
import RootNavigator from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { TimerProvider } from './src/context/TimerContext';
import { RoleProvider } from './src/context/RoleContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { PermissionsProvider } from './src/context/PermissionsContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Could render a Splash component if desired
  }
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RoleProvider>
          <PermissionsProvider>
            <TimerProvider>
              <ActivityProvider>
                <RootNavigator />
              </ActivityProvider>
            </TimerProvider>
          </PermissionsProvider>
        </RoleProvider>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
