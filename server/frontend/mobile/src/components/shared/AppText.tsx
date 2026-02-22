import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyLarge' | 'bodySmall' | 'caption' | 'label';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  bold?: boolean;
  semibold?: boolean;
  medium?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AppText - Unified Typography Component
 * 
 * Uses theme system for consistent fonts, sizes, and colors across the app.
 * Automatically adapts to light/dark mode.
 * 
 * @example
 * ```tsx
 * // Basic usage with variant
 * <AppText variant="h1">Welcome</AppText>
 * 
 * // With custom color
 * <AppText variant="body" color={theme.colors.primary}>Click here</AppText>
 * 
 * // With bold
 * <AppText variant="h2" bold>Important Title</AppText>
 * 
 * // With custom style
 * <AppText variant="caption" style={{ textAlign: 'center' }}>Centered text</AppText>
 * ```
 */
export default function AppText({
  variant,
  color,
  bold,
  semibold,
  medium,
  style,
  children,
  ...restProps
}: AppTextProps) {
  const { theme } = useTheme();

  // ============================================================================
  // VARIANT STYLE MAPPING
  // ============================================================================
  
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: theme.typography.fontSizes.xxxl,  // 32
          fontFamily: theme.typography.families.bold,
          fontWeight: theme.typography.weights.bold,
          lineHeight: theme.typography.fontSizes.xxxl * theme.typography.lineHeights.tight,
        };
      
      case 'h2':
        return {
          fontSize: theme.typography.fontSizes.xxl,   // 24
          fontFamily: theme.typography.families.semibold,
          fontWeight: theme.typography.weights.semibold,
          lineHeight: theme.typography.fontSizes.xxl * theme.typography.lineHeights.tight,
        };
      
      case 'h3':
        return {
          fontSize: theme.typography.fontSizes.xl,    // 20
          fontFamily: theme.typography.families.semibold,
          fontWeight: theme.typography.weights.semibold,
          lineHeight: theme.typography.fontSizes.xl * theme.typography.lineHeights.normal,
        };
      
      case 'bodyLarge':
        return {
          fontSize: theme.typography.fontSizes.md,    // 16
          fontFamily: theme.typography.families.regular,
          fontWeight: theme.typography.weights.regular,
          lineHeight: theme.typography.fontSizes.md * theme.typography.lineHeights.relaxed,
        };
      
      case 'body':
        return {
          fontSize: theme.typography.fontSizes.base,  // 14
          fontFamily: theme.typography.families.regular,
          fontWeight: theme.typography.weights.regular,
          lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.normal,
        };
      
      case 'bodySmall':
        return {
          fontSize: theme.typography.fontSizes.sm,    // 12
          fontFamily: theme.typography.families.regular,
          fontWeight: theme.typography.weights.regular,
          lineHeight: theme.typography.fontSizes.sm * theme.typography.lineHeights.normal,
        };
      
      case 'caption':
        return {
          fontSize: theme.typography.fontSizes.xs,    // 10
          fontFamily: theme.typography.families.regular,
          fontWeight: theme.typography.weights.regular,
          lineHeight: theme.typography.fontSizes.xs * theme.typography.lineHeights.normal,
          color: theme.colors.textSecondary,
        };
      
      case 'label':
        return {
          fontSize: theme.typography.fontSizes.sm,    // 12
          fontFamily: theme.typography.families.medium,
          fontWeight: theme.typography.weights.medium,
          lineHeight: theme.typography.fontSizes.sm * theme.typography.lineHeights.tight,
          letterSpacing: 0.5,
        };
      
      default:
        // Default to body style
        return {
          fontSize: theme.typography.fontSizes.base,
          fontFamily: theme.typography.families.regular,
          fontWeight: theme.typography.weights.regular,
          lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.normal,
        };
    }
  };

  // ============================================================================
  // FONT WEIGHT OVERRIDES
  // ============================================================================
  
  const getFontWeightOverride = (): Partial<TextStyle> => {
    if (bold) {
      return {
        fontFamily: theme.typography.families.bold,
        fontWeight: theme.typography.weights.bold,
      };
    }
    if (semibold) {
      return {
        fontFamily: theme.typography.families.semibold,
        fontWeight: theme.typography.weights.semibold,
      };
    }
    if (medium) {
      return {
        fontFamily: theme.typography.families.medium,
        fontWeight: theme.typography.weights.medium,
      };
    }
    return {};
  };

  // ============================================================================
  // COMPOSE FINAL STYLES
  // ============================================================================
  
  const variantStyle = getVariantStyle();
  const fontWeightOverride = getFontWeightOverride();
  const colorStyle = color ? { color } : { color: theme.colors.text };

  const finalStyle = StyleSheet.flatten([
    variantStyle,
    fontWeightOverride,
    colorStyle,
    style, // User's custom style has highest priority
  ]);

  return (
    <Text style={finalStyle} {...restProps}>
      {children}
    </Text>
  );
}
