import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { listProjects, listEmployees, listTimeEntries } from '../../api/endpoints';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

export default function ManagerTimeTrackingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  
  // Calendar and time entries state
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDateEntries, setSelectedDateEntries] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Holiday dates
  const holidays = useMemo(() => new Set<string>([
    '2025-01-01', '2025-01-26', '2025-08-15', '2025-10-02', '2025-12-25',
  ]), []);

  // DB-only: no mock generators

  const loadData = async () => {
    try {
      const [employeesRes, projectsRes, entriesRes] = await Promise.all([
        listEmployees({ page: 1, limit: 500 }),
        listProjects({ page: 1, limit: 500 }),
        listTimeEntries({ page: 1, limit: 1000 }),
      ]);
      setAllEmployees(employeesRes.employees || []);
      setAllProjects(projectsRes.projects || []);
      // Preload entries for current selected date from DB result
      const dateStr = selectedDate;
      const filtered = (entriesRes.timeEntries || []).filter((e: any) => String(e.start_time || '').slice(0,10) === dateStr);
      // Map into UI format with computed hours
      const mapped = filtered.map((e: any) => ({
        id: e.id,
        employeeId: e.employee_id,
        employeeName: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
        projectId: e.project_id,
        projectName: e.project_name,
        hours: (e.duration_minutes || 0) / 60,
        description: e.description,
        date: String(e.start_time).slice(0,10),
        startTime: e.start_time,
        endTime: e.end_time,
      }));
      setSelectedDateEntries(mapped);
    } catch (error) {
      console.error('Error loading data:', error);
      setAllEmployees([]);
      setAllProjects([]);
      setSelectedDateEntries([]);
    }
  };

  const loadEntriesForDate = async (dateStr: string) => {
    try {
      const res = await listTimeEntries({ page: 1, limit: 1000, startDate: `${dateStr}T00:00:00`, endDate: `${dateStr}T23:59:59` });
      const mapped = (res.timeEntries || []).map((e: any) => ({
        id: e.id,
        employeeId: e.employee_id,
        employeeName: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
        projectId: e.project_id,
        projectName: e.project_name,
        hours: (e.duration_minutes || 0) / 60,
        description: e.description,
        date: String(e.start_time).slice(0,10),
        startTime: e.start_time,
        endTime: e.end_time,
      }));
      setSelectedDateEntries(mapped);
    } catch (error) {
      console.error('Failed to load entries for date:', error);
      setSelectedDateEntries([]);
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEntriesForDate(selectedDate);
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const onDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // Calendar rendering
  const renderCalendar = () => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDay = (first.getDay() + 6) % 7; // Monday-start index 0-6
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const rows: React.ReactElement[] = [];
    let dayCounter = 1 - startDay;
    const todayStr = new Date().toISOString().split('T')[0];

    for (let r = 0; r < 6; r++) {
      const cells: React.ReactElement[] = [];
      for (let c = 0; c < 7; c++) {
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayCounter);
        const inMonth = d.getMonth() === currentMonth.getMonth();
        const dateStr = d.toISOString().split('T')[0];
        const isHoliday = holidays.has(dateStr);
        const isToday = dateStr === todayStr;
        const isPastOrToday = d <= new Date();
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isSelected = dateStr === selectedDate;

        const selectable = inMonth && isPastOrToday && !isHoliday;
        const hasEntries = selectedDateEntries.some(entry => entry.date === dateStr);

        cells.push(
          <TouchableOpacity
            key={c}
            onPress={() => selectable && onDateSelect(dateStr)}
            disabled={!selectable}
            style={[
              styles.calendarDay,
              isSelected && styles.selectedDay,
              hasEntries && styles.dayWithEntries,
              !selectable && styles.disabledDay
            ]}
          >
            <Text style={[
              styles.dayText,
              isToday && styles.todayText,
              isWeekend && styles.weekendText,
              !selectable && styles.disabledText
            ]}>
              {inMonth ? d.getDate() : ''}
            </Text>
            {hasEntries && <View style={styles.entryIndicator} />}
            {isHoliday && inMonth && <Text style={styles.holidayText}>H</Text>}
          </TouchableOpacity>
        );
        dayCounter++;
      }
      rows.push(<View key={r} style={styles.calendarRow}>{cells}</View>);
    }
    return rows;
  };

  // Group entries by employee
  const entriesByEmployee = selectedDateEntries.reduce((acc, entry) => {
    if (!acc[entry.employeeId]) {
      acc[entry.employeeId] = {
        employee: allEmployees.find(emp => emp.id === entry.employeeId) || { name: 'Unknown Employee' },
        entries: []
      };
    }
    acc[entry.employeeId].entries.push(entry);
    return acc;
  }, {} as any);

  const totalHours = selectedDateEntries.reduce((sum, entry) => sum + entry.hours, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading time tracking overview...</Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Time Tracking Overview</Text>
            <Text style={styles.subtitle}>Select a date to view employee time entries</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <Card style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <Text style={styles.monthNavButton}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {currentMonth?.toLocaleString('en-US', { month: 'long', year: 'numeric' }) || 'Loading...'}
              </Text>
              <TouchableOpacity onPress={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                <Text style={styles.monthNavButton}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdayHeader}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <Text key={d} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            {renderCalendar()}
          </Card>
        </View>

        {/* Selected Date Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Entries for {new Date(selectedDate).toLocaleDateString()}
          </Text>
          
          <View style={styles.dateSummary}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{Object.keys(entriesByEmployee).length}</Text>
              <Text style={styles.summaryLabel}>Active Employees</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{selectedDateEntries.length}</Text>
              <Text style={styles.summaryLabel}>Time Entries</Text>
            </Card>
          </View>
        </View>

        {/* Employee Time Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Time Entries</Text>
          
          {selectedDateEntries.length === 0 ? (
            <Card style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No Time Entries</Text>
              <Text style={styles.emptyStateSubtitle}>No employees logged time on this date</Text>
            </Card>
          ) : (
            <View style={styles.entriesList}>
              {Object.values(entriesByEmployee).map((group: any) => {
                const employeeTotal = group.entries.reduce((sum: number, entry: any) => sum + entry.hours, 0);
                
                return (
                  <Card key={group.employee.id} style={styles.employeeCard}>
                    <View style={styles.employeeHeader}>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{group.employee.name}</Text>
                        <Text style={styles.employeeRole}>{group.employee.jobTitle || 'Employee'}</Text>
                      </View>
                      <View style={styles.employeeTotal}>
                        <Text style={styles.employeeTotalHours}>{employeeTotal.toFixed(1)}h</Text>
                        <Text style={styles.employeeEntryCount}>{group.entries.length} entries</Text>
                      </View>
                    </View>
                    
                    <View style={styles.entriesList}>
                      {group.entries.map((entry: any, index: number) => (
                        <View key={entry.id || index} style={styles.entryItem}>
                          <View style={styles.entryHeader}>
                            <Text style={styles.entryProject}>{entry.projectName}</Text>
                            <Text style={styles.entryHours}>{entry.hours.toFixed(1)}h</Text>
                          </View>
                          <Text style={styles.entryDescription}>{entry.description}</Text>
                          <Text style={styles.entryTime}>
                            {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  
  // Calendar Styles
  calendarCard: {
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavButton: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14%',
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calendarDay: {
    width: '14%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#e6f0ff',
    borderColor: '#007AFF',
  },
  dayWithEntries: {
    backgroundColor: '#f0f8ff',
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  todayText: {
    fontWeight: '700',
    color: '#007AFF',
  },
  weekendText: {
    color: '#007AFF',
  },
  disabledText: {
    color: '#ccc',
  },
  entryIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34C759',
  },
  holidayText: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    color: '#dc3545',
    fontWeight: '600',
  },
  
  // Date Summary Styles
  dateSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Employee Entries Styles
  entriesList: {
    gap: 12,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  employeeRole: {
    fontSize: 14,
    color: '#666',
  },
  employeeTotal: {
    alignItems: 'flex-end',
  },
  employeeTotalHours: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  employeeEntryCount: {
    fontSize: 12,
    color: '#666',
  },
  entryItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryProject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  entryHours: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  entryDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  
  // Empty State Styles
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});