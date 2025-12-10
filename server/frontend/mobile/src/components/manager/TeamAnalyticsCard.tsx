import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TeamAnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  icon?: string;
  onPress?: () => void;
  showChart?: boolean;
  chartData?: number[];
}

export default function TeamAnalyticsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = '#007AFF',
  icon,
  onPress,
  showChart = false,
  chartData = []
}: TeamAnalyticsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#34C759';
      case 'down': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const renderMiniChart = () => {
    if (!showChart || chartData.length === 0) return null;

    const maxValue = Math.max(...chartData);
    const minValue = Math.min(...chartData);
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {chartData.map((value, index) => {
            const height = ((value - minValue) / range) * 20;
            return (
              <View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height: Math.max(height, 2),
                    backgroundColor: color + '60',
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[color + '10', color + '05']}
        style={[styles.container, { borderLeftColor: color }]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={styles.title}>{title}</Text>
            </View>
            {trend && trendValue && (
              <View style={[styles.trendContainer, { backgroundColor: getTrendColor() + '20' }]}>
                <Text style={[styles.trendIcon, { color: getTrendColor() }]}>
                  {getTrendIcon()}
                </Text>
                <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                  {trendValue}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.value, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          {renderMiniChart()}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  chartContainer: {
    marginTop: 8,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 2,
  },
  chartBar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 2,
  },
});
