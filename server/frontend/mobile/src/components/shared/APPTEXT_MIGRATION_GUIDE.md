# AppText Migration Guide

## Quick Reference

| Old Code | New Code | Variant |
|----------|----------|---------|
| `fontFamily: 'Inter_700Bold', fontSize: 32` | `<AppText variant="h1">` | h1 (32px, bold) |
| `fontFamily: 'Inter_600SemiBold', fontSize: 24` | `<AppText variant="h2">` | h2 (24px, semibold) |
| `fontFamily: 'Inter_600SemiBold', fontSize: 20` | `<AppText variant="h3">` | h3 (20px, semibold) |
| `fontFamily: 'Inter_400Regular', fontSize: 16` | `<AppText variant="bodyLarge">` | bodyLarge (16px) |
| `fontFamily: 'Inter_400Regular', fontSize: 14` | `<AppText variant="body">` | body (14px) - default |
| `fontFamily: 'Inter_400Regular', fontSize: 12` | `<AppText variant="bodySmall">` | bodySmall (12px) |
| `fontFamily: 'Inter_500Medium', fontSize: 12` | `<AppText variant="label">` | label (12px, medium) |
| `fontFamily: 'Inter_400Regular', fontSize: 10` | `<AppText variant="caption">` | caption (10px, secondary) |

## Font Weight Modifiers

- `bold` prop → Uses Inter_700Bold
- `semibold` prop → Uses Inter_600SemiBold  
- `medium` prop → Uses Inter_500Medium

---

## Real Example: AdminDashboardScreen.tsx

### Step 1: Add Import

```tsx
// Add this import at the top
import AppText from '../../components/shared/AppText';
```

### Step 2: Replace Loading Text

**Before:**
```tsx
<View style={styles.center}>
  <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
  <Text style={styles.loadingText}>Loading dashboard...</Text>
</View>

// In StyleSheet:
loadingText: {
  marginTop: 8,
  fontSize: 14,
  fontFamily: 'Inter_400Regular',
  color: '#666',
},
```

**After:**
```tsx
import { useTheme } from '../../theme';

// In component:
const { theme } = useTheme();

<View style={styles.center}>
  <ActivityIndicator size="large" color={theme.colors.primary} />
  <AppText 
    variant="body" 
    color={theme.colors.textSecondary}
    style={{ marginTop: 8 }}
  >
    Loading dashboard...
  </AppText>
</View>

// In StyleSheet:
// ✅ Remove loadingText styles - no longer needed!
```

### Step 3: Replace Error Text

**Before:**
```tsx
<Text style={styles.errorText}>{error}</Text>
<TouchableOpacity style={styles.retryButton} onPress={loadData}>
  <Text style={styles.retryButtonText}>Retry</Text>
</TouchableOpacity>

// In StyleSheet:
errorText: {
  fontSize: 16,
  fontFamily: 'Inter_400Regular',
  color: '#F44336',
  textAlign: 'center',
},
retryButtonText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontFamily: 'Inter_600SemiBold',
},
```

**After:**
```tsx
<AppText 
  variant="bodyLarge" 
  color={theme.colors.error}
  style={{ textAlign: 'center' }}
>
  {error}
</AppText>
<TouchableOpacity style={styles.retryButton} onPress={loadData}>
  <AppText variant="body" semibold color={theme.colors.surface}>
    Retry
  </AppText>
</TouchableOpacity>

// In StyleSheet:
// ✅ Remove errorText and retryButtonText - no longer needed!
```

### Step 4: Replace Greeting Header

**Before:**
```tsx
<Text style={styles.greeting}>Good Morning</Text>
<Text style={styles.subGreeting}>{user?.name || 'User'}</Text>
<Text style={styles.roleText}>Role: Admin</Text>

// In StyleSheet:
greeting: {
  fontSize: 20,
  fontWeight: '700',
  fontFamily: 'Inter_700Bold',
  color: '#FFFFFF',
},
subGreeting: {
  fontSize: 20,
  fontWeight: '400',
  fontFamily: 'Inter_400Regular',
  color: '#FFFFFF',
  opacity: 0.95,
  marginTop: -2,
},
roleText: {
  fontSize: 10,
  fontWeight: '400',
  fontFamily: 'Inter_400Regular',
  color: '#E8E7ED',
  opacity: 0.8,
},
```

**After:**
```tsx
<AppText variant="h3" bold color="#FFFFFF">
  Good Morning
</AppText>
<AppText 
  variant="h3" 
  color="#FFFFFF"
  style={{ opacity: 0.95, marginTop: -2 }}
>
  {user?.name || 'User'}
</AppText>
<AppText 
  variant="caption" 
  color="#E8E7ED"
  style={{ opacity: 0.8 }}
>
  Role: Admin
</AppText>

// In StyleSheet:
// ✅ Remove greeting, subGreeting, roleText - no longer needed!
```

### Step 5: Replace Stat Card Text

**Before:**
```tsx
<Text style={styles.statCardTitle}>{title}</Text>
<Text style={styles.statCardValue}>{value}</Text>
<Text style={styles.statCardButtonText}>{buttonText}</Text>

// In StyleSheet:
statCardTitle: {
  fontSize: 13,
  fontFamily: 'Inter_400Regular',
  color: '#666666',
  marginBottom: 8,
},
statCardValue: {
  fontSize: 32,
  fontWeight: '700',
  fontFamily: 'Inter_700Bold',
  color: '#000000',
  marginBottom: 12,
},
statCardButtonText: {
  fontSize: 12,
  fontWeight: '500',
  fontFamily: 'Inter_500Medium',
  color: '#6B5CE7',
},
```

**After:**
```tsx
<AppText 
  variant="bodySmall" 
  color={theme.colors.textSecondary}
  style={{ marginBottom: 8 }}
>
  {title}
</AppText>
<AppText 
  variant="h1" 
  bold
  style={{ marginBottom: 12 }}
>
  {value}
</AppText>
<AppText variant="label" color={theme.colors.primary}>
  {buttonText}
</AppText>

// In StyleSheet:
// ✅ Remove statCardTitle, statCardValue, statCardButtonText!
```

---

## Benefits Summary

### Before Migration:
- 200+ lines of StyleSheet font styles
- Hard to maintain consistent sizing
- Dark mode colors won't work
- Copy-paste styling across screens
- Manual font family management

### After Migration:
- 50+ lines of StyleSheet removed
- Single source of truth for typography
- Automatic dark mode support
- Reusable across all screens
- Type-safe with IntelliSense

---

## Complete Migration Checklist

- [ ] Import `AppText` component
- [ ] Import `useTheme` hook if using theme colors
- [ ] Replace all `<Text style={styles.xxx}>` with `<AppText variant="...">`
- [ ] Map fontSize to appropriate variant (see table above)
- [ ] Replace hardcoded colors with `theme.colors.xxx` or `color` prop
- [ ] Remove font-related styles from StyleSheet (fontSize, fontFamily, fontWeight)
- [ ] Keep layout styles (margin, padding, textAlign, etc.) in `style` prop
- [ ] Test in light and dark mode

---

## Common Patterns

### Pattern 1: Conditional Color
```tsx
// ❌ Before
<Text style={{ color: isActive ? '#4CAF50' : '#666666', fontSize: 14 }}>
  {status}
</Text>

// ✅ After
<AppText 
  variant="body" 
  color={isActive ? theme.colors.success : theme.colors.textSecondary}
>
  {status}
</AppText>
```

### Pattern 2: Multiple Styles
```tsx
// ❌ Before
<Text style={[styles.baseText, styles.boldText, customStyle]}>
  Title
</Text>

// ✅ After
<AppText variant="body" bold style={customStyle}>
  Title
</AppText>
```

### Pattern 3: Nested Text (Inline Styling)
```tsx
// ❌ Before
<Text style={styles.paragraph}>
  Hello <Text style={styles.boldText}>World</Text>
</Text>

// ✅ After
<AppText variant="body">
  Hello <AppText variant="body" bold>World</AppText>
</AppText>
```

---

## Need Help?

- View [AppText.tsx](./AppText.tsx) for full implementation
- View [AppText.examples.tsx](./AppText.examples.tsx) for more examples
- Check [src/theme/index.tsx](../../theme/index.tsx) for available theme tokens
