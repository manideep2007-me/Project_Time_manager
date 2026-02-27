import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export default function Button({ title, onPress, loading = false, variant = 'primary', disabled = false }: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) {
      console.log('Button press ignored - disabled:', disabled, 'loading:', loading);
      return;
    }
    console.log('Button pressed:', title);
    try {
      onPress();
    } catch (error) {
      console.error('Error in button onPress handler:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        (disabled || loading) && styles.disabled
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      // Web-specific props for better compatibility
      {...(Platform.OS === 'web' && {
        role: 'button',
        tabIndex: disabled || loading ? -1 : 0,
        onKeyPress: (e: any) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
            e.preventDefault();
            handlePress();
          }
        }
      })}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#007AFF'} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#877ED2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#877ED2',
  },
  disabled: {
    backgroundColor: '#CFCBEA',
    opacity: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#877ED2',
  },
});
