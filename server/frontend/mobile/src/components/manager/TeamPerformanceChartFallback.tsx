import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface TeamMember {
  id: string;
  name: string;
  performance: number; // 0-100
  tasksCompleted: number;
  hoursWorked: number;
}

interface TeamPerformanceChartProps {
  teamMembers: TeamMember[];
  maxPerformance?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 200;
const padding = 20;

export default function TeamPerformanceChart({ 
  teamMembers, 
  maxPerformance = 100 
}: TeamPerformanceChartProps) {
  if (teamMembers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No team performance data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...teamMembers.map(member => member.performance));
  const scaleY = (chartHeight - padding * 2) / maxValue;
  const barWidth = (chartWidth - padding * 2) / teamMembers.length - 10;

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return '#34C759';
    if (performance >= 60) return '#FFCC00';
    if (performance >= 40) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Performance Overview</Text>
      <View style={styles.chartContainer}>
        {/* Grid lines */}
        <View style={styles.gridContainer}>
          {[0, 25, 50, 75, 100].map((value, index) => {
            const y = chartHeight - padding - (value * scaleY);
            return (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: y }
                ]}
              />
            );
          })}
        </View>

        {/* Performance bars */}
        <View style={styles.barsContainer}>
          {teamMembers.map((member, index) => {
            const barHeight = (member.performance * scaleY);
            const x = padding + index * (barWidth + 10);
            
            return (
              <View key={member.id} style={styles.barGroup}>
                {/* Bar background */}
                <View
                  style={[
                    styles.barBackground,
                    {
                      width: barWidth,
                      height: chartHeight - padding * 2,
                      left: x,
                    }
                  ]}
                />
                
                {/* Performance bar */}
                <View
                  style={[
                    styles.performanceBar,
                    {
                      width: barWidth,
                      height: barHeight,
                      left: x,
                      bottom: padding,
                      backgroundColor: getPerformanceColor(member.performance),
                    }
                  ]}
                />
                
                {/* Performance value */}
                <Text
                  style={[
                    styles.performanceValue,
                    {
                      left: x + barWidth / 2,
                      bottom: barHeight + padding + 5,
                      color: getPerformanceColor(member.performance),
                    }
                  ]}
                >
                  {member.performance}%
                </Text>
                
                {/* Member name */}
                <Text
                  style={[
                    styles.memberName,
                    {
                      left: x + barWidth / 2,
                      bottom: 5,
                    }
                  ]}
                >
                  {member.name.split(' ')[0]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>Excellent (80%+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFCC00' }]} />
          <Text style={styles.legendText}>Good (60-79%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.legendText}>Fair (40-59%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>Needs Improvement</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
    height: chartHeight,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    width: chartWidth,
    height: chartHeight,
  },
  gridLine: {
    position: 'absolute',
    left: padding,
    right: padding,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  barsContainer: {
    position: 'absolute',
    width: chartWidth,
    height: chartHeight,
  },
  barGroup: {
    position: 'absolute',
    height: chartHeight,
  },
  barBackground: {
    position: 'absolute',
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
  },
  performanceBar: {
    position: 'absolute',
    borderRadius: 2,
  },
  performanceValue: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    transform: [{ translateX: -20 }],
  },
  memberName: {
    position: 'absolute',
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    transform: [{ translateX: -20 }],
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '45%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
