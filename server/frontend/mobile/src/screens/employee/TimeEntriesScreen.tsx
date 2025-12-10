import React, { useEffect, useMemo, useState, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { listTimeEntries, listActiveTimeEntries, startTimeEntry, stopTimeEntry, listProjects, listEmployees } from '../../api/endpoints';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { AuthContext } from '../../context/AuthContext';

export default function TimeEntriesScreen() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState<any[]>([]);
  const [activeEntries, setActiveEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [starting, setStarting] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  
  // Calendar State
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const holidays = useMemo(() => new Set<string>([
    // YYYY-MM-DD holiday dates (example values)
    '2025-01-01',
    '2025-01-26',
    '2025-08-15',
    '2025-10-02',
    '2025-12-25',
  ]), []);

  // DB-only: no mock generators

  const loadData = async () => {
    try {
      const [timeEntriesRes, activeRes, projectsRes, employeesRes] = await Promise.all([
        listTimeEntries({ page: 1, limit: 20 }),
        listActiveTimeEntries(),
        listProjects({ limit: 100 }),
        listEmployees({ limit: 100 })
      ]);
      
      setItems(timeEntriesRes.timeEntries);
      setActiveEntries(activeRes.activeTimeEntries);
      setProjects(projectsRes.projects);
      setEmployees(employeesRes.employees);
      setHasNext(timeEntriesRes.pagination?.hasNext);
    } catch (error) {
      // Graceful fallback: if API is unavailable, keep UI usable without alerts
      console.log('API unavailable, using offline mode');
      setItems([]);
      setActiveEntries([]);
      setProjects([]);
      setEmployees([]);
      setHasNext(false);
      // No alert here to avoid noisy error on navigating from "View Timesheet"
    }
  };

  const loadMore = async () => {
    if (hasNext && !loading) {
      setLoading(true);
      try {
        const res = await listTimeEntries({ page: page + 1, limit: 20 });
        setItems([...items, ...res.timeEntries]);
        setHasNext(res.pagination?.hasNext);
        setPage(page + 1);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  // Load entries for selected date (DB-only view)
  const [entriesForSelectedDate, setEntriesForSelectedDate] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    const entries = items
      .filter((e) => e.employee_id === user.id && e.start_time?.slice(0,10) === selectedDate);
    setEntriesForSelectedDate(entries);
  }, [user?.id, selectedDate, items]);

  const handleStartTracking = async () => {
    if (!selectedProject || !selectedEmployee) {
      Alert.alert('Error', 'Please select both project and employee');
      return;
    }

    setStarting(true);
    try {
      await startTimeEntry({
        projectId: selectedProject.id,
        employeeId: selectedEmployee.id,
        description: description.trim()
      });
      
      Alert.alert('Success', 'Time tracking started successfully');
      setShowStartModal(false);
      setSelectedProject(null);
      setSelectedEmployee(null);
      setDescription('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to start time tracking');
    } finally {
      setStarting(false);
    }
  };

  const handleStopTracking = async (entryId: string) => {
    Alert.alert(
      'Stop Time Tracking',
      'Are you sure you want to stop this time entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopTimeEntry(entryId, { description: '' });
              Alert.alert('Success', 'Time tracking stopped successfully');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to stop time tracking');
            }
          }
        }
      ]
    );
  };

  const formatDuration = (minutes: any) => {
    const mins = Number(minutes || 0);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const ActiveEntryCard = ({ entry }: { entry: any }) => (
    <Card style={styles.activeCard}>
      <View style={styles.activeHeader}>
        <View style={styles.activeInfo}>
          <Text style={styles.activeProject}>{entry.project_name}</Text>
          <Text style={styles.activeEmployee}>{entry.first_name} {entry.last_name}</Text>
          <Text style={styles.activeTime}>Started: {formatTime(entry.start_time)}</Text>
        </View>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={() => handleStopTracking(entry.id)}
        >
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const TimeEntryCard = ({ item }: { item: any }) => (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryProject}>{item.project_name || 'Unknown Project'}</Text>
        <Text style={styles.entryCost}>₹{Number(item.cost || 0).toLocaleString('en-IN')}</Text>
      </View>
      <Text style={styles.entryEmployee}>{item.first_name || ''} {item.last_name || ''}</Text>
      <View style={styles.entryMeta}>
        <Text style={styles.entryDuration}>{formatDuration(item.duration_minutes)}</Text>
        <Text style={styles.entryDate}>
          {new Date(item.start_time).toLocaleDateString()} • {formatTime(item.start_time)} - {formatTime(item.end_time)}
        </Text>
      </View>
      {item.description && (
        <Text style={styles.entryDescription}>{item.description}</Text>
      )}
    </Card>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading time entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Tracking</Text>
      </View>

      <ScrollView style={styles.scrollView}>

      {/* Calendar Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>View Timesheet</Text>
        <Card style={styles.calendarCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
              <Text style={{ fontSize: 20 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {currentMonth?.toLocaleString('en-US', { month: 'long', year: 'numeric' }) || 'Loading...'}
            </Text>
            <TouchableOpacity onPress={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
              <Text style={{ fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <Text key={d} style={{ width: '13%', textAlign: 'center', color: '#666', fontSize: 12 }}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          {(() => {
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

                const selectable = inMonth && isPastOrToday && !isHoliday; // allow Mon-Sun except holidays
                const selected = dateStr === selectedDate;

                cells.push(
                  <TouchableOpacity
                    key={c}
                    onPress={() => selectable && setSelectedDate(dateStr)}
                    disabled={!selectable}
                    style={{ width: '13%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 4, borderRadius: 8, backgroundColor: selected ? '#e6f0ff' : '#fff', borderWidth: selected ? 1 : 0, borderColor: selected ? '#007AFF' : 'transparent', opacity: selectable ? 1 : 0.35 }}
                  >
                    <Text style={{ color: inMonth ? (isWeekend ? '#007AFF' : '#1a1a1a') : '#ccc', fontWeight: isToday ? '700' : '400' }}>
                      {inMonth ? d.getDate() : ''}
                    </Text>
                    {isHoliday && inMonth && (<Text style={{ fontSize: 8, color: '#dc3545' }}>Holiday</Text>)}
                  </TouchableOpacity>
                );
                dayCounter++;
              }
              rows.push(<View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{cells}</View>);
            }
            return rows;
          })()}
        </Card>
      </View>

      {/* Entries for selected date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entries on {new Date(selectedDate).toLocaleDateString()}</Text>
        {entriesForSelectedDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No entries on this date</Text>
          </View>
        ) : (
          entriesForSelectedDate.map((item) => (
            <Card key={String(item.id)} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryProject}>{item.projectName || 'Project'}</Text>
                <Text style={styles.entryDuration}>{Number(item.hours || 0).toFixed(2)}h</Text>
              </View>
              <Text style={styles.entryDate}>
                {item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - 
                {item.endTime ? new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </Text>
              {item.description ? <Text style={styles.entryDescription}>{item.description}</Text> : null}
            </Card>
          ))
        )}
      </View>
      {/* Active Time Entries */}
      {activeEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Timers</Text>
          {activeEntries.map((entry) => (
            <ActiveEntryCard key={entry.id} entry={entry} />
          ))}
        </View>
      )}

      {/* Time Entries List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {items.map((item) => (
          <TimeEntryCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No time entries found</Text>
            <Text style={styles.emptySubtext}>Start tracking time to see entries here</Text>
          </View>
        )}
      </View>

      </ScrollView>

      {/* Start Time Tracking Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start Time Tracking</Text>
            <TouchableOpacity onPress={() => setShowStartModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Project</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowProjectPicker(true)}
                disabled={projects.length === 0}
              >
                <Text style={[styles.pickerText, projects.length === 0 && styles.disabledText]}>
                  {selectedProject ? selectedProject.name : projects.length === 0 ? 'No projects available' : 'Select Project'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employee</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowEmployeePicker(true)}
                disabled={employees.length === 0}
              >
                <Text style={[styles.pickerText, employees.length === 0 && styles.disabledText]}>
                  {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : employees.length === 0 ? 'No employees available' : 'Select Employee'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="What are you working on?"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButton}>
              <Button
                title="Start Tracking"
                onPress={handleStartTracking}
                loading={starting}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Project Picker Modal */}
      <Modal
        visible={showProjectPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Project</Text>
            <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={projects}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedProject(item);
                  setShowProjectPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{item.name}</Text>
                {selectedProject?.id === item.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No projects available</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Employee Picker Modal */}
      <Modal
        visible={showEmployeePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <TouchableOpacity onPress={() => setShowEmployeePicker(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={employees}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedEmployee(item);
                  setShowEmployeePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>
                  {item.first_name} {item.last_name}
                </Text>
                {selectedEmployee?.id === item.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No employees available</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  activeCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 12,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeInfo: {
    flex: 1,
  },
  activeProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  activeEmployee: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  activeTime: {
    fontSize: 12,
    color: '#666',
  },
  stopButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  entryCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  entryEmployee: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
  },
  entryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalButton: {
    marginTop: 20,
  },
  disabledText: {
    color: '#999',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  calendarCard: {
    padding: 12,
    marginBottom: 16,
  },
});
