/**
 * READY-TO-USE CODE SNIPPETS FOR App.tsx
 * 
 * Choose ONE of the options below to enable ThemeTestScreen
 */

// ============================================================================
// OPTION 1: Simple Replacement (Copy this entire file to App.tsx)
// ============================================================================

import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import './src/i18n';
import RootNavigator from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { TimerProvider } from './src/context/TimerContext';
import { RoleProvider } from './src/context/RoleContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { PermissionsProvider } from './src/context/PermissionsContext';
import { ThemeProvider } from './src/theme';
import SplashScreen from './src/screens/SplashScreen';
import ThemeTestScreen from './src/screens/ThemeTestScreen'; // ✅ ADD THIS LINE

ExpoSplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setAppIsReady(true);
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} onLayout={onLayoutRootView} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <PermissionsProvider>
              <TimerProvider>
                <ActivityProvider>
                  <ThemeTestScreen /> {/* ✅ REPLACE RootNavigator with ThemeTestScreen */}
                </ActivityProvider>
              </TimerProvider>
            </PermissionsProvider>
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

// ============================================================================
// OPTION 2: Toggle Mode (Recommended - Easy to switch back)
// ============================================================================

/*
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import './src/i18n';
import RootNavigator from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { TimerProvider } from './src/context/TimerContext';
import { RoleProvider } from './src/context/RoleContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { PermissionsProvider } from './src/context/PermissionsContext';
import { ThemeProvider } from './src/theme';
import SplashScreen from './src/screens/SplashScreen';
import ThemeTestScreen from './src/screens/ThemeTestScreen'; // ✅ ADD THIS LINE

ExpoSplashScreen.preventAutoHideAsync();

// ✅ ADD THIS FLAG
const SHOW_THEME_TEST = true; // Change to false to go back to normal app

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setAppIsReady(true);
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} onLayout={onLayoutRootView} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <PermissionsProvider>
              <TimerProvider>
                <ActivityProvider>
                  {SHOW_THEME_TEST ? ( // ✅ ADD THIS CONDITIONAL
                    <ThemeTestScreen />
                  ) : (
                    <RootNavigator />
                  )}
                </ActivityProvider>
              </TimerProvider>
            </PermissionsProvider>
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
*/

// ============================================================================
// INSTRUCTIONS
// ============================================================================

/*
1. Choose Option 1 OR Option 2 above
2. Copy the code (uncomment Option 2 if using that)
3. Replace the content of App.tsx with your chosen option
4. Save the file
5. Run: npm start -- --clear
6. Open on emulator/device

TO REVERT:
- Option 1: Change <ThemeTestScreen /> back to <RootNavigator />
- Option 2: Change SHOW_THEME_TEST to false
*/
