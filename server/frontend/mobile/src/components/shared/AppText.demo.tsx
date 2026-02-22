/**
 * AppText Component - Live Demo
 * 
 * Copy this into any screen to see AppText in action
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../../theme';

export default function AppTextDemo() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* All Typography Variants */}
      <AppText variant="h1">This is H1 Heading</AppText>
      <AppText variant="h2">This is H2 Heading</AppText>
      <AppText variant="h3">This is H3 Heading</AppText>
      
      <View style={styles.spacer} />
      
      <AppText variant="bodyLarge">This is large body text (16px)</AppText>
      <AppText variant="body">This is regular body text (14px) - Default</AppText>
      <AppText variant="bodySmall">This is small body text (12px)</AppText>
      
      <View style={styles.spacer} />
      
      <AppText variant="label">This is a LABEL (12px medium)</AppText>
      <AppText variant="caption">This is a caption (10px secondary color)</AppText>
      
      <View style={styles.spacer} />
      
      {/* Font Weight Modifiers */}
      <AppText variant="body" bold>Bold body text</AppText>
      <AppText variant="body" semibold>Semibold body text</AppText>
      <AppText variant="body" medium>Medium body text</AppText>
      
      <View style={styles.spacer} />
      
      {/* Custom Colors */}
      <AppText variant="body" color={theme.colors.primary}>
        Primary colored text
      </AppText>
      <AppText variant="body" color={theme.colors.success}>
        Success colored text
      </AppText>
      <AppText variant="body" color={theme.colors.error}>
        Error colored text
      </AppText>
      
      <View style={styles.spacer} />
      
      {/* With Custom Styling */}
      <AppText 
        variant="h3" 
        style={{ 
          textAlign: 'center',
          backgroundColor: theme.colors.primaryLight,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
        }}
      >
        Centered with background
      </AppText>
      
      <View style={styles.spacer} />
      
      {/* Nested Example */}
      <AppText variant="body">
        This is a sentence with{' '}
        <AppText variant="body" bold color={theme.colors.primary}>
          bold highlighted
        </AppText>
        {' '}text in the middle.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8, // Space between items
  },
  spacer: {
    height: 16,
  },
});
