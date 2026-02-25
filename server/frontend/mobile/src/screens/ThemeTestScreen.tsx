import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/shared/AppText';
import { useTheme } from '../theme';

/**
 * ThemeTestScreen - Verify theme system and AppText component
 * 
 * This is a temporary test screen to verify:
 * - All AppText variants render correctly
 * - Dark mode toggle works
 * - Theme colors are reactive
 * - Typography scales properly
 */
export default function ThemeTestScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Dark Mode Toggle */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <AppText variant="h2" color={theme.colors.surface}>
          Theme Test Screen
        </AppText>
        
        <View style={styles.themeToggle}>
          <Ionicons 
            name={isDark ? 'moon' : 'sunny'} 
            size={24} 
            color={theme.colors.surface} 
          />
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ 
              false: theme.colors.border, 
              true: theme.colors.primaryLight 
            }}
            thumbColor={theme.colors.surface}
            style={styles.switch}
          />
          <AppText variant="label" color={theme.colors.surface}>
            {isDark ? 'Dark' : 'Light'}
          </AppText>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Typography Variants Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="h3" style={styles.sectionTitle}>
            📝 Typography Variants
          </AppText>
          
          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="h1"
            </AppText>
            <AppText variant="h1">Heading 1 - 32px Bold</AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="h2"
            </AppText>
            <AppText variant="h2">Heading 2 - 24px Semibold</AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="h3"
            </AppText>
            <AppText variant="h3">Heading 3 - 20px Semibold</AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="bodyLarge"
            </AppText>
            <AppText variant="bodyLarge">
              Body Large - 16px Regular. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="body"
            </AppText>
            <AppText variant="body">
              Body - 14px Regular (Default). Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="bodySmall"
            </AppText>
            <AppText variant="bodySmall">
              Body Small - 12px Regular. Lorem ipsum dolor sit amet.
            </AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="label"
            </AppText>
            <AppText variant="label">LABEL - 12px Medium</AppText>
          </View>

          <View style={styles.variantItem}>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              variant="caption"
            </AppText>
            <AppText variant="caption">Caption - 10px Regular Secondary</AppText>
          </View>
        </View>

        {/* Font Weight Modifiers */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="h3" style={styles.sectionTitle}>
            💪 Font Weight Modifiers
          </AppText>
          
          <AppText variant="body">Regular (default)</AppText>
          <AppText variant="body" medium>Medium weight</AppText>
          <AppText variant="body" semibold>Semibold weight</AppText>
          <AppText variant="body" bold>Bold weight</AppText>
        </View>

        {/* Theme Colors Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="h3" style={styles.sectionTitle}>
            🎨 Theme Colors (Reactive)
          </AppText>
          
          <View style={styles.colorGrid}>
            <ColorSwatch 
              label="Primary" 
              color={theme.colors.primary}
              textColor={theme.colors.surface}
            />
            <ColorSwatch 
              label="Primary Light" 
              color={theme.colors.primaryLight}
              textColor={theme.colors.primary}
            />
            <ColorSwatch 
              label="Background" 
              color={theme.colors.background}
              textColor={theme.colors.text}
              bordered
            />
            <ColorSwatch 
              label="Surface" 
              color={theme.colors.surface}
              textColor={theme.colors.text}
              bordered
            />
            <ColorSwatch 
              label="Text" 
              color={theme.colors.text}
              textColor={theme.colors.surface}
            />
            <ColorSwatch 
              label="Text Secondary" 
              color={theme.colors.textSecondary}
              textColor={theme.colors.surface}
            />
            <ColorSwatch 
              label="Success" 
              color={theme.colors.success}
              textColor={theme.colors.surface}
            />
            <ColorSwatch 
              label="Error" 
              color={theme.colors.error}
              textColor={theme.colors.surface}
            />
            <ColorSwatch 
              label="Warning" 
              color={theme.colors.warning}
              textColor={theme.colors.surface}
            />
            <ColorSwatch 
              label="Info" 
              color={theme.colors.info}
              textColor={theme.colors.surface}
            />
          </View>
        </View>

        {/* Semantic Colors */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="h3" style={styles.sectionTitle}>
            ✨ Semantic Text Colors
          </AppText>
          
          <AppText variant="body" color={theme.colors.primary}>
            Primary colored text
          </AppText>
          <AppText variant="body" color={theme.colors.success}>
            Success colored text ✓
          </AppText>
          <AppText variant="body" color={theme.colors.error}>
            Error colored text ✗
          </AppText>
          <AppText variant="body" color={theme.colors.warning}>
            Warning colored text ⚠
          </AppText>
          <AppText variant="body" color={theme.colors.info}>
            Info colored text ℹ
          </AppText>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Secondary text (subtle)
          </AppText>
          <AppText variant="body" color={theme.colors.textTertiary}>
            Tertiary text (most subtle)
          </AppText>
        </View>

        {/* Shadow & Spacing Showcase */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="h3" style={styles.sectionTitle}>
            🎭 Shadows & Spacing
          </AppText>
          
          <View style={[
            styles.shadowBox, 
            { backgroundColor: theme.colors.surface },
            theme.shadows.sm
          ]}>
            <AppText variant="label">Small Shadow (sm)</AppText>
          </View>

          <View style={[
            styles.shadowBox, 
            { backgroundColor: theme.colors.surface },
            theme.shadows.md
          ]}>
            <AppText variant="label">Medium Shadow (md)</AppText>
          </View>

          <View style={[
            styles.shadowBox, 
            { backgroundColor: theme.colors.surface },
            theme.shadows.lg
          ]}>
            <AppText variant="label">Large Shadow (lg)</AppText>
          </View>
        </View>

        {/* Interactive Card Example */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="h3" style={styles.sectionTitle}>
            🎯 Interactive Card Example
          </AppText>
          
          <TouchableOpacity 
            style={[
              styles.interactiveCard,
              { 
                backgroundColor: theme.colors.primaryLight,
                borderColor: theme.colors.primary,
              },
              theme.shadows.md
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <AppText variant="h3" color={theme.colors.primary}>
                  Theme Working! ✓
                </AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  All systems operational
                </AppText>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            
            <AppText variant="body">
              Your theme system is properly configured and reactive to dark mode changes.
            </AppText>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <AppText variant="h2" color={theme.colors.success}>8</AppText>
                <AppText variant="caption">Variants</AppText>
              </View>
              <View style={styles.stat}>
                <AppText variant="h2" color={theme.colors.info}>35+</AppText>
                <AppText variant="caption">Colors</AppText>
              </View>
              <View style={styles.stat}>
                <AppText variant="h2" color={theme.colors.warning}>2</AppText>
                <AppText variant="caption">Themes</AppText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status/Instructions */}
        <View style={[styles.section, { backgroundColor: theme.colors.infoLight }]}>
          <AppText variant="label" color={theme.colors.info}>
            ℹ️ TEST SCREEN INSTRUCTIONS
          </AppText>
          <AppText variant="bodySmall" style={{ marginTop: theme.spacing.xs }}>
            1. Toggle dark mode using the switch above{'\n'}
            2. Verify all text colors change appropriately{'\n'}
            3. Check that shadows adapt to the theme{'\n'}
            4. Confirm all AppText variants render correctly{'\n'}
            5. Remove this screen when testing is complete
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

// Color Swatch Component
function ColorSwatch({ 
  label, 
  color, 
  textColor,
  bordered = false 
}: { 
  label: string; 
  color: string; 
  textColor: string;
  bordered?: boolean;
}) {
  return (
    <View 
      style={[
        styles.colorSwatch, 
        { backgroundColor: color },
        bordered && { borderWidth: 1, borderColor: '#E0E0E0' }
      ]}
    >
      <AppText variant="bodySmall" color={textColor} style={{ textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switch: {
    marginHorizontal: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  variantItem: {
    gap: 4,
    paddingVertical: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: '30%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowBox: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  interactiveCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
});
