import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EmployeePerformanceCardProps {
  employeeId: string;
  employeeName: string;
  performance: number; // 0-100
  tasksCompleted: number;
  totalTasks: number;
  hoursWorked: number;
  productivity: number; // 0-100
  skills: string[];
  lastActive: string;
  onPress?: () => void;
}

export default function EmployeePerformanceCard({
  employeeId,
  employeeName,
  performance,
  tasksCompleted,
  totalTasks,
  hoursWorked,
  productivity,
  skills,
  lastActive,
  onPress
}: EmployeePerformanceCardProps) {
  const getPerformanceColor = (perf: number) => {
    if (perf >= 90) return '#34C759';
    if (perf >= 75) return '#FFCC00';
    if (perf >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const getPerformanceLabel = (perf: number) => {
    if (perf >= 90) return 'Excellent';
    if (perf >= 75) return 'Good';
    if (perf >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const lastActiveDate = new Date(timestamp);
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastActiveDate.toLocaleDateString();
  };

  const performanceColor = getPerformanceColor(performance);
  const performanceLabel = getPerformanceLabel(performance);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <Text style={styles.employeeId}>ID: {employeeId}</Text>
          </View>
          <View style={[styles.performanceBadge, { backgroundColor: performanceColor + '20' }]}>
            <Text style={[styles.performanceText, { color: performanceColor }]}>
              {performance}%
            </Text>
          </View>
        </View>

        {/* Performance Bar */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceBar}>
            <LinearGradient
              colors={[performanceColor, performanceColor + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.performanceFill, { width: `${performance}%` }]}
            />
          </View>
          <Text style={[styles.performanceLabel, { color: performanceColor }]}>
            {performanceLabel}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tasksCompleted}/{totalTasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hoursWorked}h</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{productivity}%</Text>
            <Text style={styles.statLabel}>Productivity</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTimeAgo(lastActive)}</Text>
            <Text style={styles.statLabel}>Last Active</Text>
          </View>
        </View>

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              {skills.length > 3 && (
                <View style={styles.skillTag}>
                  <Text style={styles.skillText}>+{skills.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 12,
    color: '#666',
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  performanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  skillsSection: {
    marginTop: 8,
  },
  skillsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
});
