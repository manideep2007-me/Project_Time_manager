# How to View ThemeTestScreen

## ✅ Test Screen Created Successfully

Your test screen is ready at: `src/screens/ThemeTestScreen.tsx`

---

## 🚀 Quick Setup - Show Test Screen

### **Option 1: Replace RootNavigator (Fastest)**

Edit `App.tsx` and temporarily replace the navigator:

```tsx
// At the top, add the import:
import ThemeTestScreen from './src/screens/ThemeTestScreen';

// Then in the return statement, replace:
<RootNavigator />

// With:
<ThemeTestScreen />
```

**Full App.tsx example:**
```tsx
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
import ThemeTestScreen from './src/screens/ThemeTestScreen'; // ✅ ADD THIS

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
                  <ThemeTestScreen /> {/* ✅ CHANGED: Use test screen instead of RootNavigator */}
                  {/* <RootNavigator /> */}
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
```

---

### **Option 2: Add Test Mode Toggle (Best for Development)**

Add a conditional flag to easily switch between test and production:

```tsx
import ThemeTestScreen from './src/screens/ThemeTestScreen';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // ✅ ADD THIS: Toggle to show test screen
  const SHOW_THEME_TEST = true; // Set to false when done testing
  
  // ... rest of your code ...

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <PermissionsProvider>
              <TimerProvider>
                <ActivityProvider>
                  {SHOW_THEME_TEST ? (
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
```

---

## 📱 Running the Test Screen

### **Start Your Development Server:**

```bash
# Clear cache and start
npm start -- --clear

# Or with Expo
npx expo start -c
```

Then press:
- `a` for Android emulator
- `i` for iOS simulator
- Or scan QR code for physical device

---

## 🧪 What to Test

Once the screen loads, verify:

### ✅ **Typography Variants**
- [ ] All 8 variants display correctly (h1, h2, h3, bodyLarge, body, bodySmall, label, caption)
- [ ] Font sizes are appropriate (32px for h1 down to 10px for caption)
- [ ] Font weights render correctly (bold, semibold, regular)

### ✅ **Dark Mode Toggle**
- [ ] Toggle switch at top works
- [ ] All text colors change when switching themes
- [ ] Background colors invert properly
- [ ] Primary colors stay consistent
- [ ] Shadows adapt to dark mode

### ✅ **Color System**
- [ ] All color swatches display
- [ ] Semantic colors (success, error, warning, info) are visible
- [ ] Text colors (primary, secondary, tertiary) show hierarchy
- [ ] Surface and background colors differ

### ✅ **Interactive Elements**
- [ ] Card with shadow renders
- [ ] Touch feedback on card works
- [ ] Icons display correctly
- [ ] Spacing between elements is consistent

---

## 🔄 Revert to Normal App

When testing is complete, remove the test screen:

**Option 1 users:** Change back to `<RootNavigator />`

**Option 2 users:** Set `SHOW_THEME_TEST = false`

Or completely remove:
```tsx
// Remove the import
import ThemeTestScreen from './src/screens/ThemeTestScreen';

// And restore
<RootNavigator />
```

**Optional:** Delete the test file:
```bash
rm src/screens/ThemeTestScreen.tsx
```

---

## 🎯 Expected Results

### **Light Mode:**
- White/light gray backgrounds
- Dark text (nearly black)
- Purple primary color (#6D63FF)
- Readable contrast

### **Dark Mode:**
- Dark gray/black backgrounds
- White/light gray text
- Purple primary color (same)
- Subtle shadows

### **All Modes:**
- Smooth theme transitions
- No color flash/flicker
- Icons render properly
- Text remains readable

---

## 🐛 Troubleshooting

### **Screen is blank:**
```bash
# Reload the app
Press 'r' in terminal
# Or shake device and press "Reload"
```

### **Fonts not loading:**
```bash
# Check fonts are imported in App.tsx
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
```

### **Theme colors wrong:**
```bash
# Clear cache and restart
npm start -- --clear
```

### **Dark mode not toggling:**
- Check `useTheme()` hook is imported correctly
- Verify `ThemeProvider` wraps the test screen in App.tsx
- Look for console errors

---

## 📸 Share Results

If you encounter issues, take screenshots of:
1. Light mode view
2. Dark mode view
3. Any console errors
4. DevTools (Cmd/Ctrl + M → Debug JS Remotely)

Happy testing! 🎨✨
