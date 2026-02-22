/**
 * AppText Component - Migration Examples
 * 
 * This file demonstrates how to replace hardcoded Text components
 * with the new AppText component that uses our unified theme system.
 */

// ============================================================================
// EXAMPLE 1: Simple Text Replacement
// ============================================================================

// ❌ BEFORE - Hardcoded font and color
/*
<Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF' }}>
  Welcome Admin
</Text>
*/

// ✅ AFTER - Using AppText with theme
/*
import AppText from '@/components/shared/AppText';

<AppText variant="h3" color="#FFFFFF">
  Welcome Admin
</AppText>
*/

// ============================================================================
// EXAMPLE 2: Body Text with Custom Styling
// ============================================================================

// ❌ BEFORE
/*
<Text style={{
  fontFamily: 'Inter_400Regular',
  fontSize: 14,
  color: '#666666',
  textAlign: 'center'
}}>
  No data available
</Text>
*/

// ✅ AFTER - variant="body" automatically applies fontSize 14 + regular font
/*
import { useTheme } from '@/theme';

const { theme } = useTheme();

<AppText 
  variant="body" 
  color={theme.colors.textSecondary}
  style={{ textAlign: 'center' }}
>
  No data available
</AppText>
*/

// ============================================================================
// EXAMPLE 3: Heading with Bold
// ============================================================================

// ❌ BEFORE
/*
<Text style={{
  fontSize: 24,
  fontWeight: '700',
  fontFamily: 'Inter_700Bold',
  color: '#1A1A1A'
}}>
  Dashboard
</Text>
*/

// ✅ AFTER - variant="h2" automatically uses fontSize 24 + bold font
/*
<AppText variant="h2">
  Dashboard
</AppText>
*/

// ============================================================================
// EXAMPLE 4: Caption/Small Text
// ============================================================================

// ❌ BEFORE
/*
<Text style={{
  fontSize: 10,
  fontFamily: 'Inter_400Regular',
  color: '#E8E7ED',
  opacity: 0.8
}}>
  Role: Admin
</Text>
*/

// ✅ AFTER
/*
<AppText 
  variant="caption" 
  style={{ opacity: 0.8 }}
  color="#E8E7ED"
>
  Role: Admin
</AppText>
*/

// ============================================================================
// EXAMPLE 5: Medium Weight Label
// ============================================================================

// ❌ BEFORE
/*
<Text style={{
  fontSize: 12,
  fontWeight: '500',
  fontFamily: 'Inter_500Medium',
  color: '#6B5CE7'
}}>
  View All
</Text>
*/

// ✅ AFTER
/*
const { theme } = useTheme();

<AppText 
  variant="label" 
  color={theme.colors.primary}
>
  View All
</AppText>
*/

// ============================================================================
// EXAMPLE 6: AdminDashboardScreen - Real Migration
// ============================================================================

// ❌ BEFORE - From AdminDashboardScreen.tsx
/*
import { Text } from 'react-native';

// ... in render:
<Text style={styles.greeting}>Good Morning</Text>
<Text style={styles.subGreeting}>{userName}</Text>
<Text style={styles.roleText}>Role: {userRole}</Text>

// ... in StyleSheet:
const styles = StyleSheet.create({
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
});
*/

// ✅ AFTER - Using AppText
/*
import AppText from '../../components/shared/AppText';

// ... in render:
<AppText variant="h3" color="#FFFFFF" bold>
  Good Morning
</AppText>
<AppText 
  variant="h3" 
  color="#FFFFFF" 
  style={{ opacity: 0.95, marginTop: -2 }}
>
  {userName}
</AppText>
<AppText 
  variant="caption" 
  color="#E8E7ED" 
  style={{ opacity: 0.8 }}
>
  Role: {userRole}
</AppText>

// ... in StyleSheet: NO MORE FONT STYLES NEEDED! ✨
const styles = StyleSheet.create({
  // Remove greeting, subGreeting, roleText styles
  // Only keep layout-related styles like margins, padding, etc.
});
*/

// ============================================================================
// EXAMPLE 7: Dynamic Color with Theme
// ============================================================================

// ❌ BEFORE
/*
<Text style={{
  fontSize: 16,
  fontFamily: 'Inter_600SemiBold',
  color: status === 'active' ? '#4CAF50' : '#F44336'
}}>
  {status}
</Text>
*/

// ✅ AFTER
/*
const { theme } = useTheme();

<AppText 
  variant="bodyLarge" 
  semibold
  color={status === 'active' ? theme.colors.success : theme.colors.error}
>
  {status}
</AppText>
*/

// ============================================================================
// SUMMARY OF BENEFITS
// ============================================================================

/*
✅ Consistent typography across the app
✅ Automatic dark mode support (text colors adapt)
✅ Reduced StyleSheet bloat (no more font-related styles)
✅ Type-safe variants with IntelliSense
✅ Easier to maintain (change fontSize once in theme)
✅ DRY principle - Don't Repeat Yourself

MIGRATION CHECKLIST:
1. Import AppText from '@/components/shared/AppText'
2. Replace <Text> with <AppText variant="...">
3. Choose appropriate variant: h1, h2, h3, body, bodyLarge, bodySmall, caption, label
4. Replace hardcoded colors with theme.colors.xxx
5. Remove fontSize, fontFamily, fontWeight from StyleSheet
6. Keep only layout styles (margin, padding, textAlign, etc.)
*/

export {};
