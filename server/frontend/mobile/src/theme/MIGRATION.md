# 🚀 Migration Guide: Old System → Unified Theme

Quick reference for converting existing code to the new unified theme system.

## 📦 Import Changes

### Before
```tsx
// Multiple imports
import { colors, spacing } from '../design/tokens';
import { useTheme } from '../context/ThemeContext';
```

### After
```tsx
// Single import
import { useTheme } from '@/theme';
```

---

## 🎨 Color Mappings

### From `design/tokens.ts` → `theme.colors`

| Old (`tokens.ts`) | New (`theme.colors`) | Value |
|---|---|---|
| `colors.primaryPurple` | `theme.colors.primary` | `#6D63FF` |
| `colors.primaryPurpleLight` | `theme.colors.primaryLight` | `#E9E7FF` |
| `colors.background` | `theme.colors.background` | `#F5F6FA` |
| `colors.surface` | `theme.colors.surface` | `#FFFFFF` |
| `colors.border` | `theme.colors.border` | `#E5E6EB` |
| `colors.textPrimary` | `theme.colors.text` | `#1A1A1A` |
| `colors.textSecondary` | `theme.colors.textSecondary` | `#6A6D73` |
| `colors.textMuted` | `theme.colors.textTertiary` | `#8E8E93` |
| `colors.badgeGreen` | `theme.colors.success` | `#34C759` |
| `colors.badgeBlue` | `theme.colors.info` | `#007AFF` |
| `colors.badgeGray` | `theme.colors.textTertiary` | `#8E8E93` |

### From `ThemeContext.tsx` → `theme.colors`

| Old (`ThemeContext`) | New (`theme.colors`) | Light Value | Dark Value |
|---|---|---|---|
| `theme.colors.primary` | `theme.colors.primary` | `#6D63FF` ⚠️ Changed from iOS blue | `#8B7EFF` |
| `theme.colors.secondary` | `theme.colors.secondary` | `#877ED2` ⚠️ Changed | `#9990E3` |
| `theme.colors.background` | `theme.colors.background` | `#F5F6FA` | `#000000` |
| `theme.colors.surface` | `theme.colors.surface` | `#FFFFFF` | `#1C1C1E` |
| `theme.colors.card` | `theme.colors.card` | `#FFFFFF` | `#2C2C2E` |
| `theme.colors.text` | `theme.colors.text` | `#1A1A1A` | `#FFFFFF` |
| `theme.colors.textSecondary` | `theme.colors.textSecondary` | `#6A6D73` | `#ABABAB` |
| `theme.colors.border` | `theme.colors.border` | `#E5E6EB` | `#38383A` |
| `theme.colors.success` | `theme.colors.success` | `#34C759` | `#30D158` |
| `theme.colors.warning` | `theme.colors.warning` | `#FF9500` | `#FFD60A` |
| `theme.colors.error` | `theme.colors.error` | `#FF3B30` | `#FF453A` |
| `theme.colors.info` | `theme.colors.info` | `#007AFF` | `#0A84FF` |

### Hardcoded Colors → Semantic Names

Replace these common hardcoded values:

```tsx
// ❌ Before
'#6B5CE7'  →  theme.colors.primary
'#877ED2'  →  theme.colors.secondary
'#FFFFFF'  →  theme.colors.surface
'#F0F0F0'  →  theme.colors.background
'#1A1A1A'  →  theme.colors.text
'#666666'  →  theme.colors.textSecondary
'#999999'  →  theme.colors.textTertiary
'#E8E8E8'  →  theme.colors.border
'#34C759'  →  theme.colors.success
'#FF3B30'  →  theme.colors.error
'#FF9500'  →  theme.colors.warning
'#007AFF'  →  theme.colors.info
```

---

## 📏 Spacing Mappings

### Unified Spacing Scale

| Old (`tokens.ts`) | Old (`ThemeContext`) | New (`theme.spacing`) | Value |
|---|---|---|---|
| `spacing.xs` | `spacing.xs` | `theme.spacing.xs` | `4` |
| `spacing.sm` | `spacing.sm` | `theme.spacing.sm` | `8` |
| `spacing.md` | - | `theme.spacing.md` | `12` |
| - | `spacing.md` | `theme.spacing.base` | `16` ⚠️ Renamed |
| `spacing.xl` | - | `theme.spacing.lg` | `20` |
| `spacing.xxl` | `spacing.lg` | `theme.spacing.xl` | `24` |
| - | `spacing.xl` | `theme.spacing.xxl` | `32` |
| - | `spacing.xxl` | `theme.spacing.xxxl` | `48` |

### Common Replacements

```tsx
// ❌ Before
padding: 4   →  padding: theme.spacing.xs
padding: 8   →  padding: theme.spacing.sm
padding: 12  →  padding: theme.spacing.md
padding: 16  →  padding: theme.spacing.base
padding: 20  →  padding: theme.spacing.lg
padding: 24  →  padding: theme.spacing.xl
padding: 32  →  padding: theme.spacing.xxl
```

---

## 🔲 Border Radius Mappings

| Old (`tokens.ts`) | Old (`ThemeContext`) | New (`theme.borderRadius`) | Value |
|---|---|---|---|
| - | `borderRadius.sm` | `theme.borderRadius.xs` | `4` |
| `radii.sm` | - | `theme.borderRadius.sm` | `6` |
| - | `borderRadius.md` | `theme.borderRadius.md` | `8` |
| `radii.md` | - | `theme.borderRadius.base` | `10` |
| `radii.lg` | `borderRadius.lg` | `theme.borderRadius.lg` | `12` |
| - | `borderRadius.xl` | `theme.borderRadius.xl` | `16` |
| - | - | `theme.borderRadius.xxl` | `20` |
| `radii.pill` | - | `theme.borderRadius.pill` | `24` |
| - | - | `theme.borderRadius.full` | `9999` |

### Common Replacements

```tsx
// ❌ Before
borderRadius: 4   →  borderRadius: theme.borderRadius.xs
borderRadius: 8   →  borderRadius: theme.borderRadius.md
borderRadius: 10  →  borderRadius: theme.borderRadius.base
borderRadius: 12  →  borderRadius: theme.borderRadius.lg
borderRadius: 16  →  borderRadius: theme.borderRadius.xl
borderRadius: 24  →  borderRadius: theme.borderRadius.pill
```

---

## ✍️ Typography Mappings

### Font Sizes

| Old (`tokens.ts`) | New (`theme.typography.fontSizes`) | Value |
|---|---|---|
| `typography.fontSizes.xs` | `theme.typography.fontSizes.xs` | `10` |
| `typography.fontSizes.sm` | `theme.typography.fontSizes.sm` | `12` |
| `typography.fontSizes.base` | `theme.typography.fontSizes.base` | `14` |
| `typography.fontSizes.md` | `theme.typography.fontSizes.md` | `16` |
| `typography.fontSizes.lg` | `theme.typography.fontSizes.lg` | `18` |
| `typography.fontSizes.xl` | `theme.typography.fontSizes.xl` | `20` |
| `typography.fontSizes.xxl` | `theme.typography.fontSizes.xxl` | `24` |
| - | `theme.typography.fontSizes.xxxl` | `32` ⭐ New |

### Font Families

```tsx
// ❌ Before (hardcoded strings)
fontFamily: 'Inter_400Regular'
fontFamily: 'Inter_500Medium'
fontFamily: 'Inter_600SemiBold'
fontFamily: 'Inter_700Bold'

// ✅ After
fontFamily: theme.typography.families.regular
fontFamily: theme.typography.families.medium
fontFamily: theme.typography.families.semibold
fontFamily: theme.typography.families.bold
```

---

## 🌑 Shadow Mappings

### From `tokens.ts` shadows

```tsx
// ❌ Before
import { shadows } from '../design/tokens';
...shadows.subtle

// ✅ After
...theme.shadows.xs   // Same as old 'subtle'
```

### From `ThemeContext` shadows

```tsx
// ❌ Before
...theme.shadows.sm
...theme.shadows.md
...theme.shadows.lg

// ✅ After - Same names!
...theme.shadows.sm
...theme.shadows.md
...theme.shadows.lg
```

### All Available Shadows

```tsx
...theme.shadows.none   // No shadow
...theme.shadows.xs     // Minimal shadow
...theme.shadows.sm     // Small shadow
...theme.shadows.md     // Medium shadow
...theme.shadows.lg     // Large shadow
...theme.shadows.xl     // Extra large shadow
```

---

## 🔄 Step-by-Step Migration Example

### Before (Multiple Issues)

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TaskCard({ title, status }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',      // ❌ Hardcoded
    padding: 16,                     // ❌ Hardcoded
    borderRadius: 12,                // ❌ Hardcoded
    shadowColor: '#000',             // ❌ Hardcoded shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,                    // ❌ Hardcoded
    fontWeight: '600',               // ❌ Hardcoded
    color: '#1A1A1A',                // ❌ Hardcoded - breaks in dark mode!
    marginBottom: 8,                 // ❌ Hardcoded
  },
  badge: {
    backgroundColor: '#6B5CE7',      // ❌ Hardcoded
    paddingHorizontal: 12,           // ❌ Hardcoded
    paddingVertical: 4,              // ❌ Hardcoded
    borderRadius: 24,                // ❌ Hardcoded
  },
  badgeText: {
    fontSize: 12,                    // ❌ Hardcoded
    color: '#FFFFFF',                // ❌ Hardcoded
  },
});
```

### After (Clean & Maintainable)

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function TaskCard({ title, status }) {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,        // ✅ Auto dark mode
      padding: theme.spacing.base,                  // ✅ Consistent
      borderRadius: theme.borderRadius.lg,          // ✅ Consistent
      ...theme.shadows.md,                          // ✅ One line!
    },
    title: {
      fontSize: theme.typography.fontSizes.md,      // ✅ Consistent
      fontFamily: theme.typography.families.semibold, // ✅ Consistent
      color: theme.colors.text,                     // ✅ Auto dark mode
      marginBottom: theme.spacing.sm,               // ✅ Consistent
    },
    badge: {
      backgroundColor: theme.colors.primary,        // ✅ Auto dark mode
      paddingHorizontal: theme.spacing.md,          // ✅ Consistent
      paddingVertical: theme.spacing.xs,            // ✅ Consistent
      borderRadius: theme.borderRadius.pill,        // ✅ Consistent
    },
    badgeText: {
      fontSize: theme.typography.fontSizes.sm,      // ✅ Consistent
      color: theme.colors.textInverse,              // ✅ Auto dark mode
    },
  });
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    </View>
  );
}
```

---

## 🎯 Quick Search & Replace

Use these regex patterns in VS Code to find hardcoded values:

### Find Hardcoded Colors
```
#[0-9A-Fa-f]{6}
```

### Find Hardcoded Padding/Margin
```
(padding|margin)(Top|Bottom|Left|Right|Horizontal|Vertical)?:\s*\d+
```

### Find Hardcoded Border Radius
```
borderRadius:\s*\d+
```

---

## ✅ Migration Checklist

- [ ] Replace all hardcoded hex colors with `theme.colors.*`
- [ ] Replace all hardcoded padding/margin with `theme.spacing.*`
- [ ] Replace all hardcoded borderRadius with `theme.borderRadius.*`
- [ ] Replace all shadow objects with `theme.shadows.*`
- [ ] Replace hardcoded font sizes with `theme.typography.fontSizes.*`
- [ ] Replace hardcoded font families with `theme.typography.families.*`
- [ ] Test component in both light and dark modes
- [ ] Remove old imports from `design/tokens.ts` and `context/ThemeContext.tsx`

---

## 🆘 Common Issues

### Issue: "Theme is undefined"
**Solution:** Ensure component is wrapped in `<ThemeProvider>`

### Issue: "Colors not changing in dark mode"
**Solution:** Using hardcoded values instead of `theme.colors.*`

### Issue: "Shadows not working on Android"
**Solution:** Use spread operator `...theme.shadows.md` (includes elevation)

### Issue: "Font not loading"
**Solution:** Ensure fonts are loaded in App.tsx before rendering
