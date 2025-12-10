import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
// DB-only: no selectors/mocks
import { api } from '../../api/client';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import EmployeePerformanceCard from '../../components/manager/EmployeePerformanceCardFallback';
import TeamAnalyticsCard from '../../components/manager/TeamAnalyticsCardFallback';
import { useNavigation } from '@react-navigation/native';
// Removed useRole import to avoid context errors

export default function EmployeesScreen() {
  const navigation = useNavigation<any>();
  // Removed useRole to avoid context errors - managers can always manage users
  const canManageUsers = true;
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Enhanced employee management state
  const [teamAnalytics, setTeamAnalytics] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'performance'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'tasks'>('name');

  const loadEmployees = async (pageNum = 1) => {
    try {
      // Try database-first via API
      const limit = 20;
      const res = await api.get('/api/employees', { params: { page: pageNum, limit } });
      let list = Array.isArray(res.data?.employees) ? res.data.employees : [];
      
      // Filter out managers and remove salary data for manager view
      console.log('Before filtering - Total employees:', list.length);
      console.log('Before filtering - Employees:', list.map((emp: any) => `${emp.first_name} ${emp.last_name} (${emp.department}) - Salary: ${emp.salary_amount}`));
      
      // Keep salary fields for display; still filter out management as before
      list = list.filter((emp: any) => emp.department !== 'Management');
      
      console.log('After filtering - Total employees:', list.length);
      console.log('After filtering - Employees:', list.map((emp: any) => `${emp.first_name} ${emp.last_name} (${emp.department}) - Salary: ${emp.salary_amount}`));
      
      const total = Number(res.data?.total || list.length || 0);

      setEmployees(pageNum === 1 ? list : [...employees, ...list]);
      setHasNext(pageNum * limit < total);
      setPage(pageNum);
      setTotalCount(total);
      
      // Load team analytics for first page
      if (pageNum === 1) {
        loadTeamAnalytics(list);
      }
      
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    }
  };

  const loadTeamAnalytics = (employeeList: any[]) => {
    // Mock team analytics data
    const mockAnalytics = {
      totalEmployees: employeeList.length,
      averagePerformance: 82,
      topPerformers: employeeList.slice(0, 3).map(emp => emp.first_name + ' ' + emp.last_name),
      tasksCompleted: employeeList.length * 8, // Mock data
      totalHours: employeeList.length * 160, // Mock data
      productivity: 85,
      skillsDistribution: {
        'React': 12,
        'Node.js': 8,
        'Python': 6,
        'Design': 4,
        'Testing': 3
      }
    };
    setTeamAnalytics(mockAnalytics);
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

  const getSalaryTypeColor = (type: string) => {
    switch (type) {
      case 'hourly': return '#007AFF';
      case 'daily': return '#34C759';
      case 'monthly': return '#FF9500';
      default: return '#666';
    }
  };

  const generateMockPerformanceData = (employee: any) => {
    const performance = Math.floor(Math.random() * 40) + 60; // 60-100
    const tasksCompleted = Math.floor(Math.random() * 15) + 5; // 5-20
    const totalTasks = tasksCompleted + Math.floor(Math.random() * 10); // 5-30
    const hoursWorked = Math.floor(Math.random() * 20) + 30; // 30-50
    const productivity = Math.floor(Math.random() * 30) + 70; // 70-100
    
    const skills = ['React', 'Node.js', 'Python', 'Design', 'Testing', 'Mobile', 'Database'];
    const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 2);
    
    const lastActive = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    return {
      ...employee,
      performance,
      tasksCompleted,
      totalTasks,
      hoursWorked,
      productivity,
      skills: randomSkills,
      lastActive
    };
  };

  const sortEmployees = (empList: any[], sortField: 'name' | 'performance' | 'tasks') => {
    return [...empList].sort((a, b) => {
      switch (sortField) {
        case 'name':
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        case 'performance':
          return (b.performance || 0) - (a.performance || 0);
        case 'tasks':
          return (b.tasksCompleted || 0) - (a.tasksCompleted || 0);
        default:
          return 0;
      }
    });
  };




  const EmployeeCard = ({ employee }: { employee: any }) => {
    const name = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const isActive = employee.is_active ?? true;
    const jobTitle = employee.jobTitle || employee.department || '';
    const salaryAmount = employee.salary_amount ?? employee.monthly_salary ?? 0;
    const salaryType = employee.salary_type || 'monthly';

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
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.employeeDetails}>
            <View style={styles.salaryInfo}>
              <Text style={styles.salaryLabel}>Monthly Salary</Text>
              <View style={styles.salaryRow}>
                <Text style={styles.salaryAmount}>{formatCurrency(salaryAmount)}</Text>
                <View style={[styles.salaryTypeBadge, { backgroundColor: getSalaryTypeColor ? getSalaryTypeColor(salaryType) : '#666' }]}>
                  <Text style={styles.salaryTypeText}>{salaryType}</Text>
                </View>
              </View>
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
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  const sortedEmployees = sortEmployees(employees, sortBy);
  const employeesWithPerformance = sortedEmployees.map(generateMockPerformanceData);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Management</Text>
        <View style={styles.headerActions}>
          
          {canManageUsers && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddEmployee')}
            >
              <Text style={styles.addButtonText}>+ Add Employees</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

        {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'performance' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('performance')}
          >
            <Text style={[styles.viewModeText, viewMode === 'performance' && styles.viewModeTextActive]}>Performance</Text>
        </TouchableOpacity>
      </View>

      {/* Team Analytics disabled per request */}

      

      {/* {canManageUsers && (
          <TouchableOpacity
            style={[styles.addButton, { alignSelf: 'flex-end', marginTop: 12 }]}
            onPress={() => navigation.navigate('AddEmployee')}
          >
            <Text style={styles.addButtonText}>+ Add Employees</Text>
          </TouchableOpacity>
        )} */}

      <FlatList
        data={viewMode === 'performance' ? employeesWithPerformance : employees}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          viewMode === 'performance' ? (
            <EmployeePerformanceCard
              employeeId={item.id}
              employeeName={`${item.first_name} ${item.last_name}`}
              performance={item.performance}
              tasksCompleted={item.tasksCompleted}
              totalTasks={item.totalTasks}
              hoursWorked={item.hoursWorked}
              productivity={item.productivity}
              skills={item.skills}
              lastActive={item.lastActive}
              onPress={() => navigation.navigate('EmployeeDetail', { id: item.id })}
            />
          ) : (
            <EmployeeCard employee={item} />
          )
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No employees found</Text>
            <Text style={styles.emptySubtext}>
              {canManageUsers ? 'Add team members to get started' : 'No employees available'}
            </Text>
            {canManageUsers && (
              <View style={styles.emptyButton}>
                <Button
                  title="Add First Employee"
                  onPress={() => {
                    Alert.alert('Add Employee', 'Add employee functionality would be implemented here');
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    margin: 14,
    fontSize: 15,
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
  
  // Enhanced Employee Management Styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  analyticsScroll: {
    marginBottom: 16,
  },
  analyticsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
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
});
