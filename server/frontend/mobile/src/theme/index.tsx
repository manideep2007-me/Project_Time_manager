/**
 * Unified Design System Theme
 * 
 * Single source of truth for all colors, spacing, typography, and shadows.
 * Supports both Light and Dark modes.
 * 
 * Usage:
 *   import { theme } from '@/theme';
 *   // or use the hook:
 *   const { theme } = useTheme();
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// ============================================================================
// TYPOGRAPHY - Shared across all themes
// ============================================================================
export const typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  families: {
     regular: 'Inter_400Regular', 
    // regular:'System',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
} as const;

// ============================================================================
// SPACING - Shared across all themes
// ============================================================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ============================================================================
// BORDER RADIUS - Shared across all themes
// ============================================================================
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
  pill: 24,
} as const;

// ============================================================================
// LAYOUT CONSTANTS - Shared across all themes
// ============================================================================
export const layout = {
  screenPadding: spacing.base,
  cardWidth: 240,
  maxContentWidth: 1200,
  headerHeight: 60,
  tabBarHeight: 60,
  avatarSizes: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },
} as const;

// ============================================================================
// COLORS - Theme-specific
// ============================================================================

export interface ThemeColors {
  // Brand Colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  elevated: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Borders & Dividers
  border: string;
  divider: string;
  
  // Semantic Colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // UI State Colors
  disabled: string;
  placeholder: string;
  overlay: string;
  
  // Status Badge Colors
  statusActive: string;
  statusCompleted: string;
  statusPending: string;
  statusCancelled: string;
  
  // Attendance/Analytics Colors
  attendancePresent: string;
  attendanceAbsent: string;
  attendanceLate: string;
  productivityHigh: string;
  productivityMedium: string;
  productivityLow: string;
}

const lightColors: ThemeColors = {
  // Brand Colors - Purple Theme
  primary: '#6D63FF',
  primaryLight: '#E9E7FF',
  primaryDark: '#5850D6',
  secondary: '#877ED2',
  
  // Backgrounds
  background: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  
  // Text
  text: '#1A1A1A',
  textSecondary: '#6A6D73',
  textTertiary: '#8E8E93',
  textInverse: '#FFFFFF',
  
  // Borders & Dividers
  border: '#E5E6EB',
  divider: '#F0F0F0',
  
  // Semantic Colors
  success: '#34C759',
  successLight: '#E8F5E9',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  error: '#FF3B30',
  errorLight: '#FFEBEE',
  info: '#007AFF',
  infoLight: '#E3F2FD',
  
  // UI State Colors
  disabled: '#D1D1D6',
  placeholder: '#9CA3AF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Status Badge Colors
  statusActive: '#877ED2',
  statusCompleted: '#34C759',
  statusPending: '#FF9500',
  statusCancelled: '#FF3B30',
  
  // Attendance/Analytics Colors
  attendancePresent: '#34C759',
  attendanceAbsent: '#FF3B30',
  attendanceLate: '#FF9500',
  productivityHigh: '#34C759',
  productivityMedium: '#FF9500',
  productivityLow: '#FF3B30',
};

const darkColors: ThemeColors = {
  // Brand Colors - Purple Theme (adjusted for dark mode)
  primary: '#8B7EFF',
  primaryLight: '#2C2845',
  primaryDark: '#A399FF',
  secondary: '#9990E3',
  
  // Backgrounds
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  elevated: '#3C3C3E',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#ABABAB',
  textTertiary: '#8E8E93',
  textInverse: '#1A1A1A',
  
  // Borders & Dividers
  border: '#38383A',
  divider: '#2C2C2E',
  
  // Semantic Colors
  success: '#30D158',
  successLight: '#1C3B2A',
  warning: '#FFD60A',
  warningLight: '#3B3419',
  error: '#FF453A',
  errorLight: '#3B1C1B',
  info: '#0A84FF',
  infoLight: '#1C2D3B',
  
  // UI State Colors
  disabled: '#48484A',
  placeholder: '#636366',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Status Badge Colors
  statusActive: '#9990E3',
  statusCompleted: '#30D158',
  statusPending: '#FFD60A',
  statusCancelled: '#FF453A',
  
  // Attendance/Analytics Colors
  attendancePresent: '#30D158',
  attendanceAbsent: '#FF453A',
  attendanceLate: '#FFD60A',
  productivityHigh: '#30D158',
  productivityMedium: '#FFD60A',
  productivityLow: '#FF453A',
};

// ============================================================================
// SHADOWS - Theme-specific (different opacity for dark mode)
// ============================================================================

export interface ThemeShadows {
  none: object;
  xs: object;
  sm: object;
  md: object;
  lg: object;
  xl: object;
}

const lightShadows: ThemeShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

const darkShadows: ThemeShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============================================================================
// COMPLETE THEME OBJECT
// ============================================================================

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: ThemeShadows;
  layout: typeof layout;
}

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows: lightShadows,
  layout,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows: darkShadows,
  layout,
};

// ============================================================================
// THEME CONTEXT & PROVIDER
// ============================================================================

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('theme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode(savedTheme as 'light' | 'dark' | 'system');
        if (savedTheme === 'system') {
          setIsDark(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDark(savedTheme === 'dark');
        }
      } else {
        setIsDark(Appearance.getColorScheme() === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDark(Appearance.getColorScheme() === 'dark');
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    try {
      setThemeMode(mode);
      await SecureStore.setItemAsync('theme', mode);
      
      if (mode === 'system') {
        setIsDark(Appearance.getColorScheme() === 'dark');
      } else {
        setIsDark(mode === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// DEFAULT EXPORT - For backwards compatibility
// ============================================================================

export const theme = lightTheme;
