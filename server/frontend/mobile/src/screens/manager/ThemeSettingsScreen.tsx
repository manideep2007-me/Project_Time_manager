import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';
import EnhancedButton from '../../components/shared/EnhancedButton';
import AnimatedCard from '../../components/shared/AnimatedCard';

export default function ThemeSettingsScreen() {
  const { theme, isDark, toggleTheme, setTheme, themeMode } = useTheme();

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all theme settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setTheme('system');
          }
        }
      ]
    );
  };

  const themeOptions = [
    {
      id: 'light',
      title: 'Light Mode',
      description: 'Clean and bright interface',
      icon: '☀️',
      isSelected: themeMode === 'light'
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      description: 'Easy on the eyes in low light',
      icon: '🌙',
      isSelected: themeMode === 'dark'
    },
    {
      id: 'system',
      title: 'System Default',
      description: 'Follows your device settings',
      icon: '⚙️',
      isSelected: themeMode === 'system'
    }
  ];

  const colorPalette = [
    { name: 'Primary', color: theme.colors.primary },
    { name: 'Secondary', color: theme.colors.secondary },
    { name: 'Success', color: theme.colors.success },
    { name: 'Warning', color: theme.colors.warning },
    { name: 'Error', color: theme.colors.error },
    { name: 'Info', color: theme.colors.info },
  ];

  return (
    <SafeAreaWrapper>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader />
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Theme Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Customize the appearance of your app
          </Text>

          {/* Current Theme Preview */}
          <AnimatedCard
            style={{ ...styles.previewCard, backgroundColor: theme.colors.card }}
            animationType="fade"
            delay={100}
          >
            <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
              Preview
            </Text>
            <View style={[styles.previewContent, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.previewItem, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.previewText, { color: theme.colors.text }]}>
                  Sample Card
                </Text>
                <View style={[styles.previewBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.previewBadgeText}>Active</Text>
                </View>
              </View>
              <View style={[styles.previewItem, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.previewText, { color: theme.colors.textSecondary }]}>
                  Secondary text
                </Text>
                <Text style={[styles.previewText, { color: theme.colors.success }]}>
                  Success
                </Text>
              </View>
            </View>
          </AnimatedCard>

          {/* Theme Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Theme Mode
            </Text>
            {themeOptions.map((option, index) => (
              <AnimatedCard
                key={option.id}
                style={{
                  ...styles.optionCard,
                  backgroundColor: theme.colors.card,
                  borderColor: option.isSelected ? theme.colors.primary : theme.colors.border
                }}
                onPress={() => handleThemeChange(option.id as 'light' | 'dark' | 'system')}
                animationType="slide"
                delay={200 + index * 100}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                  {option.isSelected && (
                    <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.selectedText}>✓</Text>
                    </View>
                  )}
                </View>
              </AnimatedCard>
            ))}
          </View>

          {/* Color Palette */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Color Palette
            </Text>
            <AnimatedCard
              style={{ ...styles.paletteCard, backgroundColor: theme.colors.card }}
              animationType="fade"
              delay={500}
            >
              <View style={styles.paletteGrid}>
                {colorPalette.map((color, index) => (
                  <View key={color.name} style={styles.colorItem}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color.color }
                      ]}
                    />
                    <Text style={[styles.colorName, { color: theme.colors.text }]}>
                      {color.name}
                    </Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.actionButtons}>
              <EnhancedButton
                title="Toggle Theme"
                onPress={toggleTheme}
                variant="outline"
                icon="🔄"
                style={styles.actionButton}
              />
              <EnhancedButton
                title="Reset Settings"
                onPress={handleResetSettings}
                variant="ghost"
                icon="🔄"
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  previewCard: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewContent: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  previewText: {
    fontSize: 14,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paletteCard: {
    padding: 20,
    borderRadius: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
