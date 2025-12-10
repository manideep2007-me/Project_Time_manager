import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  color?: string;
}

export default function Logo({ size = 'medium', showText = true, color = '#007AFF' }: LogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 40, height: 40 },
          icon: { fontSize: 20 },
          text: { fontSize: 12 }
        };
      case 'large':
        return {
          container: { width: 80, height: 80 },
          icon: { fontSize: 40 },
          text: { fontSize: 18 }
        };
      default: // medium
        return {
          container: { width: 60, height: 60 },
          icon: { fontSize: 30 },
          text: { fontSize: 14 }
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Text style={[styles.icon, sizeStyles.icon]}>📊</Text>
      </View>
      {showText && (
        <Text style={[styles.text, sizeStyles.text, { color }]}>
          Project Manager
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    color: '#fff',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
