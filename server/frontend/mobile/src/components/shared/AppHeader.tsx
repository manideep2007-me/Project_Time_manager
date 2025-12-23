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
}

export default function AppHeader({
  title,
  backgroundColor,
  rightAction,
  leftAction,
  showLanguageSwitcher = false,
  renderLanguageTrigger,
  hideLogo = false
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top },
        backgroundColor && { backgroundColor, borderBottomColor: backgroundColor },
      ]}
    >
      {/* Left Section - Logo or Left Action */}
      <View style={styles.headerLeft}>
        {leftAction ? (
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  rightActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
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
