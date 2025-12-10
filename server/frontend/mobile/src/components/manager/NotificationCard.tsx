import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NotificationCardProps {
  id: string;
  type: 'task' | 'deadline' | 'team' | 'project' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  onPress?: () => void;
  onMarkAsRead?: (id: string) => void;
}

export default function NotificationCard({
  id,
  type,
  title,
  message,
  timestamp,
  isRead,
  priority,
  onPress,
  onMarkAsRead
}: NotificationCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'task': return '📋';
      case 'deadline': return '⏰';
      case 'team': return '👥';
      case 'project': return '📁';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getTimeAgo = () => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationTime.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={() => onMarkAsRead?.(id)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.container,
        !isRead && styles.unreadContainer,
        { borderLeftColor: getPriorityColor() }
      ]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{getTypeIcon()}</Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.title,
                !isRead && styles.unreadTitle
              ]} numberOfLines={1}>
                {title}
              </Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor() + '20' }
              ]}>
                <Text style={[
                  styles.priorityText,
                  { color: getPriorityColor() }
                ]}>
                  {priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
            <Text style={styles.timestamp}>
              {getTimeAgo()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});
