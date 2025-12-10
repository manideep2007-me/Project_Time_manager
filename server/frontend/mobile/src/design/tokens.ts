// Central design tokens inferred from provided mockup screenshot.
// Adjust any values you have exact specs for; these are best approximations.
export const colors = {
  primaryPurple: '#6D63FF',
  primaryPurpleLight: '#E9E7FF',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E5E6EB',
  textPrimary: '#1A1A1A',
  textSecondary: '#6A6D73',
  textMuted: '#8A8D91',
  badgeGreen: '#2FCA66',
  badgeBlue: '#2D6BFF',
  badgeGray: '#A0A4AA',
  attendanceIconBg: '#F3F2FF',
  productivityGrayBar: '#D9DADE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 12,
  pill: 24,
};

export const typography = {
  fontSizes: {
    xs: 10,
    sm: 11,
    base: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Font family names expected to be loaded via expo-font in App.tsx
  families: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
};

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export const layout = {
  projectCardWidth: 240, // fixed width to match design proportion
  taskCardWidth: 240,
};

export const tokens = { colors, spacing, radii, typography, shadows, layout };
