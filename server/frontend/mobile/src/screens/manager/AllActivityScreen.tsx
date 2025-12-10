import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { dashboardApi, ActivityLog } from '../../api/dashboard';
import AppHeader from '../../components/shared/AppHeader';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

const PAGE_SIZE = 20;

export default function AllActivityScreen() {
  const [entries, setEntries] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async (pageNum = 1, append = false) => {
    setLoading(pageNum === 1);
    setRefreshing(pageNum !== 1);
    try {
      // Use dashboardApi.getOverview to get recentActivity (no pagination yet)
      const res = await dashboardApi.getOverview();
      // For now, just use recentActivity (latest 10)
      setTotal(res.recentActivity.length);
      setPage(1);
      setEntries(res.recentActivity);
      setError(null);
    } catch (err) {
      setError('Failed to load activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEntries(1);
    // eslint-disable-next-line
  }, []);

  const onRefresh = () => fetchEntries(1);
  const onEndReached = () => {
    if (entries.length < total && !loading) {
      fetchEntries(page + 1, true);
    }
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diffMs = Math.max(0, now - then);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDuration = (mins?: number) => {
    if (!mins || mins <= 0) return '';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created': return '📝';
      case 'task_assigned': return '📤';
      case 'time_logged': return '⏰';
      default: return '📢';
    }
  };

  const renderItem = ({ item }: { item: ActivityLog }) => {
    let icon = getActivityIcon(item.type);
    let message = '';
    let projectName = item.project_name || 'Project';
    if (item.type === 'task_created') {
      message = `${item.actor_name || 'Manager'} created task "${item.task_title}"`;
    } else if (item.type === 'task_assigned') {
      message = `${item.actor_name || 'Manager'} assigned task "${item.task_title}" to ${item.employee_name || 'employee'}`;
    } else if (item.type === 'time_logged') {
      message = `${item.employee_name || 'Employee'} logged time${item.description ? ` • ${item.description}` : ''}`;
    } else {
      message = item.description || 'Activity';
    }
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
        <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: '#1a1a1a', marginBottom: 2 }}>{message}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>{projectName}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#999' }}>{formatRelativeTime(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <AppHeader rightAction={{ title: '', onPress: () => {} }} />
      <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: '#1a1a1a' }}>All Activity</Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        {loading && page === 1 ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : error ? (
          <Text style={{ color: '#FF3B30', textAlign: 'center', marginTop: 20 }}>{error}</Text>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#666' }}>No activity found.</Text>}
          />
        )}
      </View>
    </SafeAreaWrapper>
  );
}
