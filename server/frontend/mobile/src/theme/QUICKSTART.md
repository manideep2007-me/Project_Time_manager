# 🚀 Quick Start: Using Your Unified Theme

## Step 1: Update Your App.tsx

Replace the old ThemeProvider with the new one:

```tsx
// App.tsx
import React from 'react';
import { ThemeProvider } from './src/theme';  // New unified theme
// Remove old import: import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      {/* Your existing app content */}
    </ThemeProvider>
  );
}
```

## Step 2: Use in a Component

### Option A: With Relative Import (Works Immediately)

```tsx
import { useTheme } from '../theme';
// or adjust path: '../../theme', '../../../theme', etc.

export default function MyScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello!</Text>
    </View>
  );
}
```

### Option B: With Alias (Requires Babel Setup)

```tsx
import { useTheme } from '@/theme';  // Clean import!

export default function MyScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello!</Text>
    </View>
  );
}
```

**Note:** For Option B to work, you need to:
1. Install: `npm install --save-dev babel-plugin-module-resolver`
2. Create `babel.config.js` in `/mobile/` folder:

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/theme': './src/theme',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/utils': './src/utils',
          },
        },
      ],
    ],
  };
};
```

## Step 3: Test Theme Switching

Create a simple test screen:

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useTheme } from '../theme';  // Adjust path as needed

export default function ThemeTestScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    card: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
      width: '100%',
      maxWidth: 400,
    },
    title: {
      fontSize: theme.typography.fontSizes.xxl,
      fontFamily: theme.typography.families.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.md,
      fontFamily: theme.typography.families.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.pill,
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
    badgeText: {
      fontSize: theme.typography.fontSizes.sm,
      fontFamily: theme.typography.families.semibold,
      color: theme.colors.textInverse,
    },
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isDark ? '🌙 DARK MODE' : '☀️ LIGHT MODE'}
          </Text>
        </View>
        
        <Text style={styles.title}>
          Theme Test
        </Text>
        
        <Text style={styles.subtitle}>
          This component uses the unified theme system.
          All colors, spacing, and typography come from one source!
        </Text>
        
        <Button 
          title="Toggle Theme" 
          onPress={toggleTheme}
          color={theme.colors.primary}
        />
      </View>
    </View>
  );
}
```

## Step 4: Check Colors in Dark Mode

Run your app and toggle the theme. You should see:

**Light Mode:**
- Background: Light gray (#F5F6FA)
- Card: White
- Text: Dark (#1A1A1A)
- Primary: Purple (#6D63FF)

**Dark Mode:**
- Background: Black (#000000)
- Card: Dark gray (#1C1C1E)
- Text: White (#FFFFFF)
- Primary: Light purple (#8B7EFF)

## Step 5: Migrate One Component at a Time

Pick a simple component and convert it:

### Before:
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',  // ❌
    padding: 16,                  // ❌
    borderRadius: 12,             // ❌
  },
  text: {
    color: '#1A1A1A',            // ❌
    fontSize: 16,                 // ❌
  },
});
```

### After:
```tsx
const { theme } = useTheme();

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,    // ✅
    padding: theme.spacing.base,              // ✅
    borderRadius: theme.borderRadius.lg,      // ✅
  },
  text: {
    color: theme.colors.text,                 // ✅
    fontSize: theme.typography.fontSizes.md,  // ✅
  },
});
```

## Common Replacements Cheat Sheet

```tsx
const { theme } = useTheme();

// Colors
'#6D63FF'     →  theme.colors.primary
'#FFFFFF'     →  theme.colors.surface
'#F5F6FA'     →  theme.colors.background
'#1A1A1A'     →  theme.colors.text
'#666666'     →  theme.colors.textSecondary
'#E5E6EB'     →  theme.colors.border
'#34C759'     →  theme.colors.success
'#FF3B30'     →  theme.colors.error

// Spacing
padding: 4    →  padding: theme.spacing.xs
padding: 8    →  padding: theme.spacing.sm
padding: 12   →  padding: theme.spacing.md
padding: 16   →  padding: theme.spacing.base
padding: 20   →  padding: theme.spacing.lg
padding: 24   →  padding: theme.spacing.xl

// Border Radius
borderRadius: 8   →  borderRadius: theme.borderRadius.md
borderRadius: 12  →  borderRadius: theme.borderRadius.lg
borderRadius: 16  →  borderRadius: theme.borderRadius.xl

// Shadows
shadowColor: '#000',           →  ...theme.shadows.sm
shadowOffset: { ... },         →  ...theme.shadows.md
shadowOpacity: 0.1,            →  ...theme.shadows.lg
shadowRadius: 4,
elevation: 3,

// Fonts
fontSize: 16              →  fontSize: theme.typography.fontSizes.md
fontFamily: 'Inter_600SemiBold'  →  fontFamily: theme.typography.families.semibold
```

## Troubleshooting

### "Cannot find module '@/theme'"
**Solution:** Use relative imports: `'../theme'`, `'../../theme'`, etc.

### "Theme is undefined"
**Solution:** Make sure your App.tsx is wrapped in `<ThemeProvider>`

### "Colors not changing in dark mode"
**Solution:** You're still using hardcoded colors. Replace with `theme.colors.*`

### "Module resolver not working"
**Solution:** Install babel-plugin-module-resolver and configure babel.config.js (see Step 2, Option B)

## Next Steps

1. ✅ Test theme switching in your app
2. ✅ Convert 1-2 simple components as practice
3. ✅ Gradually migrate more components
4. ✅ Remove old theme files when migration is complete

**That's it! You're ready to use your unified theme system! 🎉**
