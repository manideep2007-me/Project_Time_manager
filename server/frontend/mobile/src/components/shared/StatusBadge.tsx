import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatusBadgeProps = {
  status: string;
  size?: 'small' | 'medium' | 'large';
  color?: string; // optional override color
};

export default function StatusBadge({ status, size = 'medium', color }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#34C759';
      case 'completed': return '#007AFF';
      case 'on_hold': return '#FF9500';
      case 'cancelled': return '#FF3B30';
      case 'pending': return '#FF9500';
      case 'inactive': return '#FF3B30';
      default: return '#666';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
        };
      default: // medium
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.badge,
      { backgroundColor: color || getStatusColor(status) },
      { paddingHorizontal: sizeStyles.paddingHorizontal, paddingVertical: sizeStyles.paddingVertical }
    ]}>
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
