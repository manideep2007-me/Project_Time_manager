import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import Card from '../../components/shared/Card';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';

interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  work_date: string;
  duration_minutes: number;
  cost: number;
  description: string;
}

interface DepartmentData {
  department: string;
  employees: {
    name: string;
    employeeId: string;
    hours: number;
    cost: number;
    entries: TimeEntry[];
  }[];
  totalHours: number;
  totalCost: number;
}

export default function TaskViewScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { taskId, projectId, projectName } = route.params || {};
  const { user } = useContext(AuthContext);

  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const loadData = async () => {
    try {
      if (!taskId || !projectId) {
        Alert.alert('Error', 'Task information is missing');
        setLoading(false);
        return;
      }

      // Load task details
      const taskResponse = await api.get(`/api/tasks/${taskId}`);
      setTask(taskResponse.data.task);

      // Load time entries for this task
      const entriesResponse = await api.get('/api/time-entries', {
        params: { taskId, page: 1, limit: 1000 }
      });
      const timeEntries: TimeEntry[] = entriesResponse.data?.timeEntries || [];

      // Calculate totals
      const hours = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60;
      const cost = timeEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
      setTotalHours(Math.round(hours * 10) / 10);
      setTotalCost(Math.round(cost * 100) / 100);

      // Group by department
      const departmentMap = new Map<string, Map<string, { name: string; employeeId: string; hours: number; cost: number; entries: TimeEntry[] }>>();

      timeEntries.forEach(entry => {
        const dept = entry.description || 'Unassigned';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, new Map());
        }
        const deptMap = departmentMap.get(dept)!;
        
        const empId = entry.employee_id;
        if (!deptMap.has(empId)) {
          deptMap.set(empId, {
            name: entry.employee_name || 'Unknown',
            employeeId: empId,
            hours: 0,
            cost: 0,
            entries: [],
          });
        }

        const emp = deptMap.get(empId)!;
        const entryHours = (entry.duration_minutes || 0) / 60;
        emp.hours += entryHours;
        emp.cost += entry.cost || 0;
        emp.entries.push(entry);
      });

      // Convert to array format
      const departments: DepartmentData[] = Array.from(departmentMap.entries()).map(([dept, empMap]) => {
        const employees = Array.from(empMap.values()).map(emp => ({
          ...emp,
          hours: Math.round(emp.hours * 10) / 10,
          cost: Math.round(emp.cost * 100) / 100,
        }));

        const deptHours = employees.reduce((sum, emp) => sum + emp.hours, 0);
        const deptCost = employees.reduce((sum, emp) => sum + emp.cost, 0);

        return {
          department: dept,
          employees,
          totalHours: Math.round(deptHours * 10) / 10,
          totalCost: Math.round(deptCost * 100) / 100,
        };
      });

      setDepartmentData(departments);

      // Generate recent activity from time entries
      setRecentActivity(timeEntries.slice(0, 5).map((entry, idx) => ({
        id: idx + 1,
        type: 'time_logged',
        user: entry.employee_name || 'Team Member',
        action: 'logged time',
        hours: Math.round((entry.duration_minutes || 0) / 60 * 10) / 10,
        timestamp: entry.work_date ? new Date(entry.work_date) : new Date(),
        description: entry.description,
      })));

    } catch (error: any) {
      console.error('Error loading task data:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [taskId, projectId]);

  const handleEdit = () => {
    Alert.alert('Edit Task', 'Edit functionality coming soon');
  };

  const handleEmployeeClick = (employee: any, department: string) => {
    navigation.navigate('EmployeeTaskDetail', {
      taskId,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      department,
      entries: employee.entries,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Task view</Text>
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.projectLink}>{projectName}</Text>
            <Text style={styles.headerDivider}>|</Text>
            <Text style={styles.dueByText}>Due by: {formatDate(task.due_date)}</Text>
          </View>
        </View>

        {/* Task Information */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Task name</Text>
            <Text style={styles.infoValue}>{task.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{task.metadata?.location || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned date</Text>
            <Text style={styles.infoValue}>{formatDate(task.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due date</Text>
            <Text style={styles.infoValue}>{formatDate(task.due_date)}</Text>
          </View>
        </Card>

        {/* Overall Summary */}
        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalHours}h</Text>
            <Text style={styles.summaryLabel}>Total Hr</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₹{totalCost.toLocaleString('en-IN')}</Text>
            <Text style={styles.summaryLabel}>Total Cost</Text>
          </Card>
        </View>

        {/* Single Column Layout */}
        <View style={styles.singleColumnContainer}>
          {/* Department Breakdown */}
          {departmentData.length > 0 ? (
            departmentData.map((dept, deptIndex) => (
              <View key={deptIndex} style={styles.departmentSection}>
                <View style={styles.departmentHeader}>
                  <Text style={styles.departmentName}>{dept.department}</Text>
                  <View style={styles.departmentTotals}>
                    <Text style={styles.deptTotalText}>{dept.totalHours}h</Text>
                    <Text style={styles.deptTotalText}>₹{dept.totalCost.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {dept.employees.map((emp, empIndex) => (
                  <TouchableOpacity
                    key={empIndex}
                    style={styles.employeeRow}
                    onPress={() => handleEmployeeClick(emp, dept.department)}
                  >
                    <Text style={styles.employeeName}>{emp.name}</Text>
                    <View style={styles.employeeStats}>
                      <Text style={styles.employeeStat}>{emp.hours}h</Text>
                      <Text style={styles.employeeStat}>₹{emp.cost.toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No time entries logged yet</Text>
          )}

          {/* Recent Activity */}
          <Card style={styles.activityCard}>
            <Text style={styles.activityTitle}>Recent activity</Text>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <Text style={styles.activityText}>
                    {activity.user} logged {activity.hours}h
                  </Text>
                  <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noActivityText}>No recent activity</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  editButton: {
    padding: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerDivider: {
    fontSize: 16,
    color: '#E5E5EA',
  },
  dueByText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  singleColumnContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  departmentSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  departmentTotals: {
    flexDirection: 'row',
    gap: 16,
  },
  deptTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  employeeName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  employeeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  employeeStat: {
    fontSize: 14,
    color: '#8E8E93',
    minWidth: 60,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 40,
  },
  activityCard: {
    padding: 16,
    marginTop: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  activityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  activityText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  noActivityText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
});

