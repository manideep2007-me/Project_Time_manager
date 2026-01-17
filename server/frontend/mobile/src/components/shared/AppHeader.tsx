import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from './AppLogo';
import LanguageSwitcher from './LanguageSwitcher';

interface AppHeaderProps {
  title?: string;
  backgroundColor?: string;
  rightAction?: {
    title?: string;
    iconName?: string;
    iconSize?: number;
    iconColor?: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
  };
  renderLanguageTrigger?: (open: () => void) => React.ReactNode;
  leftAction?: {
    icon: string;
    onPress: () => void;
    style?: ViewStyle;
    iconStyle?: TextStyle;
  };
  showLanguageSwitcher?: boolean;
  hideLogo?: boolean;
  compact?: boolean;
  borderBottomRadius?: number;
}

export default function AppHeader({
  title,
  backgroundColor,
  rightAction,
  leftAction,
  showLanguageSwitcher = false,
  renderLanguageTrigger,
  hideLogo = false,
  compact = false,
  borderBottomRadius = 0
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.headerOuter,
        { paddingTop: insets.top },
        backgroundColor && { backgroundColor, borderBottomColor: backgroundColor },
        borderBottomRadius > 0 && { borderBottomLeftRadius: borderBottomRadius, borderBottomRightRadius: borderBottomRadius },
      ]}
    >
      <View style={[styles.headerInner, compact && { paddingVertical: 8 }]}>
        {/* Left Section - Logo or Left Action */}
        <View style={styles.headerLeft}>
          {leftAction && title ? (
            <View style={styles.headerLeftRow}>
              <TouchableOpacity
                style={[styles.leftActionButton, leftAction.style]}
                onPress={leftAction.onPress}
              >
                <Text style={[styles.leftActionText, leftAction.iconStyle]}>{leftAction.icon}</Text>
              </TouchableOpacity>
              <Text style={styles.titleText}>{title}</Text>
            </View>
          ) : leftAction ? (
            <TouchableOpacity
              style={[styles.leftActionButton, leftAction.style]}
              onPress={leftAction.onPress}
            >
              <Text style={[styles.leftActionText, leftAction.iconStyle]}>{leftAction.icon}</Text>
            </TouchableOpacity>
          ) : title ? (
            <Text style={styles.titleText}>{title}</Text>
          ) : hideLogo ? (
            null
          ) : (
            <AppLogo size="medium" showText={false} variant="primary" />
          )}
        </View>

        {/* Right Section - Language Switcher and/or Action */}
        <View style={styles.headerRight}>
          {showLanguageSwitcher && <LanguageSwitcher renderTrigger={renderLanguageTrigger} />}
          {rightAction && (
            <TouchableOpacity
              style={[styles.rightActionButton, rightAction.style, showLanguageSwitcher && { marginLeft: 8 }]}
              onPress={rightAction.onPress}
            >
              {rightAction.iconName ? (
                <Ionicons
                  name={rightAction.iconName as any}
                  size={rightAction.iconSize ?? 20}
                  color={rightAction.iconColor ?? '#111'}
                />
              ) : (
                <Text style={[styles.rightActionText, rightAction.textStyle]}>
                  {rightAction.title}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: {
    backgroundColor: '#FFFFFF',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 44,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  rightActionText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  leftActionButton: {
    padding: 0,
    borderRadius: 8,
  },
  leftActionText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
});
