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
import EmptyState from '../../components/shared/EmptyState';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { salariesApi, Salary } from '../../api/salaries';

export const CurrentSalariesScreen: React.FC = () => {
  const [currentSalaries, setCurrentSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCurrentSalaries = async () => {
    try {
      setLoading(true);
      const response = await salariesApi.getCurrent();
      setCurrentSalaries(response.current_salaries);
    } catch (error) {
      console.error('Error loading current salaries:', error);
      Alert.alert('Error', 'Failed to load current salary data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCurrentSalaries();
  };

  const handleSalaryPress = (salary: Salary) => {
    // Navigate to salary details or edit screen
    console.log('Current salary pressed:', salary.id);
  };

  const getTotalSalaryCost = () => {
    return currentSalaries.reduce((total, salary) => total + salary.salary_amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    loadCurrentSalaries();
  }, []);

  const renderSalaryItem = ({ item }: { item: Salary }) => (
    <SalaryCard
      salary={item}
      showEmployeeInfo={true}
      onPress={() => handleSalaryPress(item)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Current Salaries</Text>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Monthly Cost</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(getTotalSalaryCost())}</Text>
        <Text style={styles.summarySubtext}>
          {currentSalaries.length} employees
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      title="No Current Salaries"
      message="No current salary records found. Add salary records to get started."
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text>Loading current salaries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderSummary()}
        
        <FlatList
          data={currentSalaries}
          renderItem={renderSalaryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#999',
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
