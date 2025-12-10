import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from './AppLogo';
import LanguageSwitcher from './LanguageSwitcher';

interface AppHeaderProps {
  rightAction?: {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
  };
  leftAction?: {
    icon: string;
    onPress: () => void;
    style?: ViewStyle;
    iconStyle?: TextStyle;
  };
  showLanguageSwitcher?: boolean;
}

export default function AppHeader({
  rightAction,
  leftAction,
  showLanguageSwitcher = false
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {/* Left Section - Logo or Left Action */}
      <View style={styles.headerLeft}>
        {leftAction ? (
          <TouchableOpacity
            style={[styles.leftActionButton, leftAction.style]}
            onPress={leftAction.onPress}
          >
            <Text style={[styles.leftActionText, leftAction.iconStyle]}>{leftAction.icon}</Text>
          </TouchableOpacity>
        ) : (
          <AppLogo size="medium" showText={false} variant="primary" />
        )}
      </View>

      {/* Right Section - Language Switcher and/or Action */}
      <View style={styles.headerRight}>
        {showLanguageSwitcher && <LanguageSwitcher />}
        {rightAction && (
          <TouchableOpacity
            style={[styles.rightActionButton, rightAction.style, showLanguageSwitcher && { marginLeft: 8 }]}
            onPress={rightAction.onPress}
          >
            <Text style={[styles.rightActionText, rightAction.textStyle]}>
              {rightAction.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerLeft: {
    minWidth: 40,
  },
  headerRight: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rightActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  leftActionButton: {
    padding: 0,
    borderRadius: 8,
  },
  leftActionText: {
    fontSize: 34,
    color: '#007AFF',
  },
});
