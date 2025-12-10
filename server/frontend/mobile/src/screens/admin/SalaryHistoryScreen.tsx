import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SalaryCard } from '../../components/shared/SalaryCard';
import { SalaryStatsCard } from '../../components/shared/SalaryStatsCard';
import EmptyState from '../../components/shared/EmptyState';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { salariesApi, Salary, SalaryStats, SalaryFilters } from '../../api/salaries';

export const SalaryHistoryScreen: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [stats, setStats] = useState<SalaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<SalaryFilters>({
    page: 1,
    limit: 20,
  });
  const [showStats, setShowStats] = useState(true);

  const loadSalaries = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }

      const [salariesResponse, statsResponse] = await Promise.all([
        salariesApi.getAll(filters),
        salariesApi.getStats(),
      ]);

      if (reset) {
        setSalaries(salariesResponse.salaries);
      } else {
        setSalaries(prev => [...prev, ...salariesResponse.salaries]);
      }

      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading salaries:', error);
      Alert.alert('Error', 'Failed to load salary data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setFilters(prev => ({ ...prev, page: 1 }));
    loadSalaries(true);
  };

  const loadMore = () => {
    if (!loading) {
      setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  };

  const handleSalaryPress = (salary: Salary) => {
    // Navigate to salary details or edit screen
    console.log('Salary pressed:', salary.id);
  };

  const toggleStats = () => {
    setShowStats(!showStats);
  };

  useEffect(() => {
    loadSalaries(true);
  }, [filters.page, filters.limit]);

  const renderSalaryItem = ({ item }: { item: Salary }) => (
    <SalaryCard
      salary={item}
      showEmployeeInfo={true}
      onPress={() => handleSalaryPress(item)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Salary History</Text>
      <TouchableOpacity onPress={toggleStats} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>
          {showStats ? 'Hide' : 'Show'} Stats
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    if (!showStats || !stats) return null;

    return (
      <View style={styles.statsContainer}>
        <SalaryStatsCard stats={stats} />
      </View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      title="No Salary Records"
      message="No salary records found. Create some salary records to get started."
    />
  );

  if (loading && salaries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text>Loading salary data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderStats()}
        
        <FlatList
          data={salaries}
          renderItem={renderSalaryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196F3',
    borderRadius: 16,
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    marginVertical: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
