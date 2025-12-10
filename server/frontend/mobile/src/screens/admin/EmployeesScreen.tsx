import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
// DB-only: no selectors/mocks
import { api } from '../../api/client';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import AppHeader from '../../components/shared/AppHeader';
import { useNavigation } from '@react-navigation/native';
// Removed useRole import to avoid context errors

export default function EmployeesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  // Removed useRole to avoid context errors - admins can always manage users
  const canManageUsers = true;
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadEmployees = async (pageNum = 1) => {
    try {
      // Try database-first via API
      const limit = 20;
      const res = await api.get('/api/employees', { params: { page: pageNum, limit } });
      const list = Array.isArray(res.data?.employees) ? res.data.employees : [];
      const total = Number(res.data?.total || list.length || 0);

      // Admin sees all employees including managers with salary data
      console.log('Admin - Total employees loaded:', list.length);
      console.log('Admin - Employees by department:', list.reduce((acc: any, emp: any) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {}));
      console.log('Admin - Management employees:', list.filter((e: any) => e.department === 'Management').map((e: any) => `${e.first_name} ${e.last_name}`));
      
      setEmployees(pageNum === 1 ? list : [...employees, ...list]);
      setHasNext(pageNum * limit < total);
      setPage(pageNum);
      setTotalCount(total);
      
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    }
  };


  useEffect(() => {
    loadEmployees().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployees(1);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (hasNext && !loading) {
      setLoading(true);
      await loadEmployees(page + 1);
      setLoading(false);
    }
  };


  const formatCurrency = (amount: any) => `₹ ${Number(amount || 0).toLocaleString('en-IN')}`;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSalaryTypeColor = (type: string) => {
    switch (type) {
      case 'hourly': return '#007AFF';
      case 'daily': return '#34C759';
      case 'monthly': return '#FF9500';
      default: return '#666';
    }
  };


  const EmployeeCard = ({ employee }: { employee: any }) => {
    const name = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const isActive = employee.is_active ?? true;
    const salaryType = 'monthly';
    const salaryAmount = employee.salary_amount ?? 0; // show backend value only
    const hourlyRate = employee.hourly_rate ?? 0; // hourly rate from backend
    const jobTitle = employee.jobTitle || employee.department || '';
    return (
      <TouchableOpacity onPress={() => navigation.navigate('EmployeeDetail', { id: employee.id })}>
        <Card style={styles.employeeCard}>
          <View style={styles.employeeHeader}>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{name}</Text>
              {/* Hide raw IDs from UI */}
              {jobTitle ? (
                <Text style={styles.employeeDepartment}>{jobTitle}</Text>
              ) : null}
            </View>
            <View style={styles.employeeStatus}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: isActive ? '#34C759' : '#FF3B30' }
              ]}>
                <Text style={styles.statusText}>
                  {isActive ? t('dashboard.active') : t('common.no')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.employeeDetails}>
            <View style={styles.salaryInfo}>
              <Text style={styles.salaryLabel}>{t('employees.monthly_salary')}</Text>
              <View style={styles.salaryRow}>
                <Text style={styles.salaryAmount}>{formatCurrency(salaryAmount)}</Text>
              </View>
              <Text style={styles.hourlyRateText}>Hourly Rate: {formatCurrency(hourlyRate)}/hr</Text>
            </View>

            {employee.email && (
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Contact</Text>
                <Text style={styles.contactText}>{employee.email}</Text>
                {employee.phone && (
                  <Text style={styles.contactText}>{employee.phone}</Text>
                )}
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && employees.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('employees.employees')}{totalCount ? ` (${totalCount})` : ''}</Text>
          {canManageUsers && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                navigation.navigate('AddEmployee');
              }}
            >
              <Text style={styles.addButtonText}>+ {t('employees.add_employee')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <EmployeeCard employee={item} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('employees.no_employees')}</Text>
            <Text style={styles.emptySubtext}>
              {canManageUsers ? t('employees.add_employee') : t('common.no_data')}
            </Text>
            {canManageUsers && (
              <View style={styles.emptyButton}>
                <Button
                  title={t('employees.add_employee')}
                  onPress={() => {
                    navigation.navigate('AddEmployee');
                  }}
                />
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  employeeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  employeeDetails: {
    marginBottom: 16,
  },
  salaryInfo: {
    marginBottom: 12,
  },
  salaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  salaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  salaryTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  salaryTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  hourlyRate: {
    fontSize: 12,
    color: '#666',
  },
  hourlyRateText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});
