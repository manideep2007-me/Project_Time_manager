/**
 * Example Component showing BEFORE and AFTER migration to unified theme
 */

// ============================================================================
// ❌ BEFORE - Hardcoded values (DON'T DO THIS)
// ============================================================================

// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
//
// export default function OldWayCard({ title, description }) {
//   return (
//     <View style={styles.card}>
//       <Text style={styles.title}>{title}</Text>
//       <Text style={styles.description}>{description}</Text>
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: '#FFFFFF',      // ❌ Hardcoded
//     padding: 16,                     // ❌ Hardcoded
//     borderRadius: 12,                // ❌ Hardcoded
//     marginVertical: 8,               // ❌ Hardcoded
//     shadowColor: '#000',             // ❌ Hardcoded shadow
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   title: {
//     fontSize: 18,                    // ❌ Hardcoded
//     fontWeight: '600',               // ❌ Hardcoded
//     color: '#1A1A1A',                // ❌ Hardcoded - won't work in dark mode!
//     marginBottom: 8,                 // ❌ Hardcoded
//   },
//   description: {
//     fontSize: 14,                    // ❌ Hardcoded
//     color: '#666666',                // ❌ Hardcoded - won't work in dark mode!
//     lineHeight: 20,                  // ❌ Hardcoded
//   },
// });

// ============================================================================
// ✅ AFTER - Using unified theme (DO THIS!)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';

interface ThemedCardProps {
  title: string;
  description: string;
}

export default function ThemedCard({ title, description }: ThemedCardProps) {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,      // ✅ Adapts to light/dark mode
      padding: theme.spacing.base,                // ✅ 16px from theme
      borderRadius: theme.borderRadius.lg,        // ✅ 12px from theme
      marginVertical: theme.spacing.sm,           // ✅ 8px from theme
      ...theme.shadows.md,                        // ✅ Consistent shadow
    },
    title: {
      fontSize: theme.typography.fontSizes.lg,    // ✅ 18px from theme
      fontFamily: theme.typography.families.semibold, // ✅ Inter_600SemiBold
      color: theme.colors.text,                   // ✅ Auto switches in dark mode!
      marginBottom: theme.spacing.sm,             // ✅ 8px from theme
    },
    description: {
      fontSize: theme.typography.fontSizes.base,  // ✅ 14px from theme
      fontFamily: theme.typography.families.regular, // ✅ Inter_400Regular
      color: theme.colors.textSecondary,          // ✅ Auto switches in dark mode!
      lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.normal, // ✅ 21px
    },
  });
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

// ============================================================================
// ✅ ALTERNATIVE - Style Factory Pattern (also good!)
// ============================================================================

// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { useTheme, Theme } from '@/theme';
//
// const createStyles = (theme: Theme) => StyleSheet.create({
//   card: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.base,
//     borderRadius: theme.borderRadius.lg,
//     ...theme.shadows.md,
//   },
//   title: {
//     fontSize: theme.typography.fontSizes.lg,
//     fontFamily: theme.typography.families.semibold,
//     color: theme.colors.text,
//   },
//   description: {
//     fontSize: theme.typography.fontSizes.base,
//     color: theme.colors.textSecondary,
//   },
// });
//
// export default function ThemedCard({ title, description }) {
//   const { theme } = useTheme();
//   const styles = createStyles(theme);
//   
//   return (
//     <View style={styles.card}>
//       <Text style={styles.title}>{title}</Text>
//       <Text style={styles.description}>{description}</Text>
//     </View>
//   );
// }

// ============================================================================
// 📊 COMPARISON RESULTS
// ============================================================================

/**
 * Benefits of the new approach:
 * 
 * ✅ Dark mode support - colors automatically switch
 * ✅ Consistency - all cards use same spacing/shadows
 * ✅ Maintainable - change 1 value, updates everywhere
 * ✅ TypeScript - auto-complete shows all options
 * ✅ Scalable - add new themes easily
 * 
 * Example: Want all cards to have 20px padding instead of 16px?
 * 
 * OLD: Find and replace 100+ files
 * NEW: Change theme.spacing.base from 16 to 20 (1 line!)
 */

// ============================================================================
// 🎯 MORE EXAMPLES
// ============================================================================

/**
 * Button Example
 */
interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function ThemedButton({ title, onPress, variant = 'primary' }: ThemedButtonProps) {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    button: {
      backgroundColor: variant === 'primary' 
        ? theme.colors.primary 
        : 'transparent',
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.sm,
    },
    text: {
      fontSize: theme.typography.fontSizes.md,
      fontFamily: theme.typography.families.semibold,
      color: variant === 'primary' 
        ? theme.colors.textInverse 
        : theme.colors.primary,
      textAlign: 'center',
    },
  });
  
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

/**
 * Status Badge Example
 */
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { theme } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'active': return theme.colors.statusActive;
      case 'completed': return theme.colors.statusCompleted;
      case 'pending': return theme.colors.statusPending;
      case 'cancelled': return theme.colors.statusCancelled;
      default: return theme.colors.textTertiary;
    }
  };
  
  const styles = StyleSheet.create({
    badge: {
      backgroundColor: getStatusColor() + '20', // 20 = 12% opacity
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.pill,
    },
    text: {
      fontSize: theme.typography.fontSizes.xs,
      fontFamily: theme.typography.families.semibold,
      color: getStatusColor(),
      textTransform: 'uppercase',
    },
  });
  
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

/**
 * Screen Container Example
 */
interface ThemedScreenProps {
  children: React.ReactNode;
}

export function ThemedScreen({ children }: ThemedScreenProps) {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.layout.screenPadding,
    },
  });
  
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}
