# 🎨 Unified Design System

Complete theme system with Light/Dark mode support, typography, spacing, and colors.

## 📦 Installation & Setup

### 1. Wrap your app with ThemeProvider

```tsx
// App.tsx
import { ThemeProvider } from './src/theme';

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Use the theme in components

```tsx
import { useTheme } from '@/theme';
import { View, Text, StyleSheet } from 'react-native';

export default function MyScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Hello World
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
  },
});
```

## 🎯 Usage Examples

### Colors

```tsx
const { theme } = useTheme();

// Brand colors
backgroundColor: theme.colors.primary        // '#6D63FF'
backgroundColor: theme.colors.primaryLight   // '#E9E7FF'

// Backgrounds
backgroundColor: theme.colors.background     // '#F5F6FA' (light) / '#000000' (dark)
backgroundColor: theme.colors.surface        // '#FFFFFF' (light) / '#1C1C1E' (dark)

// Text
color: theme.colors.text                     // '#1A1A1A' (light) / '#FFFFFF' (dark)
color: theme.colors.textSecondary            // '#6A6D73' (light) / '#ABABAB' (dark)

// Semantic colors
backgroundColor: theme.colors.success        // '#34C759'
backgroundColor: theme.colors.error          // '#FF3B30'
backgroundColor: theme.colors.warning        // '#FF9500'

// Status colors
backgroundColor: theme.colors.statusActive
backgroundColor: theme.colors.statusCompleted
```

### Spacing

```tsx
const { theme } = useTheme();

padding: theme.spacing.xs      // 4
padding: theme.spacing.sm      // 8
padding: theme.spacing.md      // 12
padding: theme.spacing.base    // 16
padding: theme.spacing.lg      // 20
padding: theme.spacing.xl      // 24
padding: theme.spacing.xxl     // 32
padding: theme.spacing.xxxl    // 48
```

### Border Radius

```tsx
const { theme } = useTheme();

borderRadius: theme.borderRadius.xs     // 4
borderRadius: theme.borderRadius.sm     // 6
borderRadius: theme.borderRadius.md     // 8
borderRadius: theme.borderRadius.base   // 10
borderRadius: theme.borderRadius.lg     // 12
borderRadius: theme.borderRadius.xl     // 16
borderRadius: theme.borderRadius.full   // 9999 (circle)
borderRadius: theme.borderRadius.pill   // 24
```

### Shadows

```tsx
const { theme } = useTheme();

style={[
  {
    backgroundColor: theme.colors.surface,
  },
  theme.shadows.sm  // Small shadow
]}

style={[myStyles.card, theme.shadows.md]}  // Medium shadow
style={[myStyles.card, theme.shadows.lg]}  // Large shadow
```

### Typography

```tsx
const { theme } = useTheme();

<Text style={{
  fontSize: theme.typography.fontSizes.lg,        // 18
  fontFamily: theme.typography.families.semibold, // 'Inter_600SemiBold'
  color: theme.colors.text,
}}>
  My Text
</Text>

// Font sizes: xs(10), sm(12), base(14), md(16), lg(18), xl(20), xxl(24), xxxl(32)
// Font weights: regular, medium, semibold, bold, extrabold
// Font families: regular, medium, semibold, bold, extrabold
```

### Layout Constants

```tsx
const { theme } = useTheme();

padding: theme.layout.screenPadding        // 16
width: theme.layout.cardWidth              // 240
height: theme.layout.headerHeight          // 60
width: theme.layout.avatarSizes.md         // 40
```

## 🔄 Theme Switching

```tsx
const { isDark, toggleTheme, setTheme } = useTheme();

// Toggle between light/dark
<Button onPress={toggleTheme} title={isDark ? 'Light' : 'Dark'} />

// Set specific theme
<Button onPress={() => setTheme('light')} title="Light" />
<Button onPress={() => setTheme('dark')} title="Dark" />
<Button onPress={() => setTheme('system')} title="System" />
```

## ✨ Creating Theme-Aware Styles

### Method 1: Dynamic Styles (Recommended)

```tsx
import { useTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export default function MyComponent() {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.base,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    },
    title: {
      fontSize: theme.typography.fontSizes.xl,
      fontFamily: theme.typography.families.bold,
      color: theme.colors.text,
    },
  });
  
  return <View style={styles.container}>...</View>;
}
```

### Method 2: Style Factory Pattern

```tsx
import { Theme } from '@/theme';
import { StyleSheet } from 'react-native';

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
  },
  // ... more styles
});

export default function MyComponent() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return <View style={styles.container}>...</View>;
}
```

## 📋 Migration from Old Files

### From `design/tokens.ts`:

```tsx
// OLD
import { colors, spacing } from '@/design/tokens';
backgroundColor: colors.primaryPurple

// NEW
import { useTheme } from '@/theme';
const { theme } = useTheme();
backgroundColor: theme.colors.primary
```

### From `context/ThemeContext.tsx`:

```tsx
// OLD
import { useTheme } from '@/context/ThemeContext';
const { theme } = useTheme();
backgroundColor: theme.colors.primary  // Was iOS blue

// NEW  
import { useTheme } from '@/theme';
const { theme } = useTheme();
backgroundColor: theme.colors.primary  // Now purple brand
```

## 🎨 Color Palette Reference

### Brand Colors
- `primary` - Main purple (`#6D63FF`)
- `primaryLight` - Light purple background
- `secondary` - Secondary purple (`#877ED2`)

### Semantic Colors
- `success` / `successLight` - Green states
- `warning` / `warningLight` - Orange/yellow states
- `error` / `errorLight` - Red states
- `info` / `infoLight` - Blue states

### Status Colors
- `statusActive` - Purple
- `statusCompleted` - Green
- `statusPending` - Orange
- `statusCancelled` - Red

### Attendance Colors
- `attendancePresent` - Green
- `attendanceAbsent` - Red
- `attendanceLate` - Orange

## 🚀 Best Practices

1. **Always use theme values**, never hardcode colors or spacing
2. **Create styles inside components** using `useTheme()` for dynamic theme support
3. **Use semantic colors** (success, error, warning) instead of raw colors
4. **Leverage spacing constants** instead of magic numbers
5. **Apply shadows** using theme.shadows for consistency

## 🔧 Customization

To change colors globally, edit `src/theme/index.ts`:

```ts
const lightColors: ThemeColors = {
  primary: '#YOUR_NEW_COLOR',  // Changes everywhere instantly!
  // ...
};
```

## 📱 TypeScript Support

Full TypeScript support with IntelliSense:

```tsx
const { theme } = useTheme();
theme.colors.    // Auto-complete shows all color options
theme.spacing.   // Auto-complete shows all spacing options
```
