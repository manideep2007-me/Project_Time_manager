import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ProjectProgressCardProps {
  projectName: string;
  progress: number; // 0-100
  totalTasks: number;
  completedTasks: number;
  dueDate: string;
  teamSize: number;
  status: 'on-track' | 'at-risk' | 'delayed';
  onPress?: () => void;
}

export default function ProjectProgressCard({
  projectName,
  progress,
  totalTasks,
  completedTasks,
  dueDate,
  teamSize,
  status,
  onPress
}: ProjectProgressCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'on-track': return '#34C759';
      case 'at-risk': return '#FF9500';
      case 'delayed': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'on-track': return 'On Track';
      case 'at-risk': return 'At Risk';
      case 'delayed': return 'Delayed';
      default: return 'Unknown';
    }
  };

  const getDaysUntilDue = () => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0;
  const statusColor = getStatusColor();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.projectName} numberOfLines={1}>
              {projectName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: statusColor,
                }
              ]}
            />
          </View>
        </View>

        {/* Project Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{teamSize}</Text>
            <Text style={styles.statLabel}>Team</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              isOverdue && styles.overdueText
            ]}>
              {isOverdue ? `${Math.abs(daysUntilDue)}d` : `${daysUntilDue}d`}
            </Text>
            <Text style={styles.statLabel}>
              {isOverdue ? 'Overdue' : 'Due'}
            </Text>
          </View>
        </View>

        {/* Due Date */}
        <Text style={styles.dueDate}>
          Due: {new Date(dueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
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
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  overdueText: {
    color: '#FF3B30',
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
