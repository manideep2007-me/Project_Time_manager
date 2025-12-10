import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { listProjects, listTimeEntries } from '../../api/endpoints';
import { AuthContext } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

export default function TimeTrackingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { addTimer, activeTimers, removeTimer } = useTimer();
  
  // Time Tracking State
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [todayTimeEntries, setTodayTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Time Tracking State
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  
  // Manual Entry State
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    projectId: '',
    hours: '',
    description: ''
  });

  const loadTimeTrackingData = async () => {
    try {
      if (!user?.id) return;
      
      // Load employee-specific projects from DB
      const projectsRes = await listProjects({ page: 1, limit: 200 });
      const userProjects = (projectsRes.projects || []);
      
      // Get today's date in YYYY-MM-DD format and fetch entries from DB
      const today = new Date().toISOString().split('T')[0];
      const entriesRes = await listTimeEntries({ page: 1, limit: 500, employeeId: user.id, startDate: `${today}T00:00:00`, endDate: `${today}T23:59:59` });
      const todayEntries = (entriesRes.timeEntries || []).map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        projectName: e.project_name,
        hours: (e.duration_minutes || 0) / 60,
        description: e.description,
        date: String(e.start_time).slice(0,10),
        startTime: e.start_time,
        endTime: e.end_time,
      }));
      
      setAssignedProjects(userProjects);
      setTodayTimeEntries(todayEntries);
      
    } catch (error) {
      console.error('Error loading time tracking data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  useEffect(() => {
    loadTimeTrackingData().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTimeTrackingData();
    setRefreshing(false);
  };

  // Utility functions
  const getTodayTotalHours = () => {
    return todayTimeEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const handleStartTracking = () => {
    setSelectedProject(null);
    setShowStartModal(true);
  };

  const handleStopTracking = async () => {
    try {
      if (user?.id && activeTimers[user.id]) {
        removeTimer(user.id);
        Alert.alert('Success', 'Time tracking stopped successfully!');
        await loadTimeTrackingData(); // Refresh data
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      Alert.alert('Error', 'Failed to stop time tracking. Please try again.');
    }
  };

  const handleStartEntry = async (projectId: string) => {
    if (!projectId || !user?.id) {
      Alert.alert('Validation Error', 'Please select a project');
      return;
    }

    setStarting(true);
    try {
      const project = assignedProjects.find(p => p.id === projectId);
      
      if (!project) {
        Alert.alert('Error', 'Project not found');
        return;
      }

      // Create a timer entry
      const timerEntry = {
        id: `temp-${Date.now()}`,
        employeeId: user.id,
        employeeName: user.name || 'Me',
        projectName: project.name,
        startTime: new Date().toISOString()
      };

      addTimer(timerEntry);
      setShowStartModal(false);
      setSelectedProject(null);
      
      Alert.alert('Success', 'Timer started successfully!');
      
    } catch (error) {
      console.error('Error starting time entry:', error);
      Alert.alert('Error', 'Failed to start time tracking. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const getDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getCurrentEmployeeTimer = () => {
    if (!user?.id) return null;
    return activeTimers[user.id] || null;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading time tracking...</Text>
      </View>
    );
  }

  const currentEmployeeTimer = getCurrentEmployeeTimer();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Time Tracking</Text>
            <Text style={styles.subtitle}>Track your work time efficiently</Text>
          </View>
        </View>

        {/* Live Time Tracking Block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Time Tracking</Text>
          
          {currentEmployeeTimer ? (
            <Card style={styles.activeTimerCard}>
              <View style={styles.activeTimerHeader}>
                <View style={styles.timerInfo}>
                  <Text style={styles.timerProjectName}>{currentEmployeeTimer.projectName}</Text>
                  {currentEmployeeTimer.taskName && (
                    <Text style={styles.timerTaskName}>{currentEmployeeTimer.taskName}</Text>
                  )}
                  <Text style={styles.timerStartTime}>
                    Started: {new Date(currentEmployeeTimer.startTime).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.timerDisplay}>
                  <Text style={styles.timerTime}>{getDuration(currentEmployeeTimer.startTime)}</Text>
                  <Text style={styles.timerStatus}>Running...</Text>
                </View>
              </View>
              <View style={styles.timerActions}>
                <Button
                  title="Stop Timer"
                  onPress={handleStopTracking}
                  variant="secondary"
                />
              </View>
            </Card>
          ) : (
            <Card style={styles.noTimerCard}>
              <Text style={styles.noTimerTitle}>No Active Timer</Text>
              <Text style={styles.noTimerSubtitle}>Start tracking time for any of your projects</Text>
              <TouchableOpacity
                style={styles.startTimerButton}
                onPress={handleStartTracking}
              >
                <Text style={styles.startTimerButtonText}>Start Timer</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Today's Total Hours */}
          <Card style={styles.todayHoursCard}>
            <View style={styles.todayHoursHeader}>
              <Text style={styles.todayHoursTitle}>Today's Total Hours</Text>
              <Text style={styles.todayHoursValue}>{getTodayTotalHours().toFixed(1)}h</Text>
            </View>
            <View style={styles.todayHoursBreakdown}>
              {todayTimeEntries.length === 0 ? (
                <Text style={styles.noEntriesText}>No time entries for today</Text>
              ) : (
                todayTimeEntries.map((entry, index) => (
                  <View key={index} style={styles.hoursEntry}>
                    <Text style={styles.hoursProject}>{entry.description || 'Time Entry'}</Text>
                    <Text style={styles.hoursValue}>{entry.hours}h</Text>
                  </View>
                ))
              )}
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleStartTracking}
            >
              <Text style={styles.quickActionIcon}>⏱️</Text>
              <Text style={styles.quickActionTitle}>Start Timer</Text>
              <Text style={styles.quickActionSubtitle}>Begin tracking time</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setShowManualEntry(true)}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionTitle}>Manual Entry</Text>
              <Text style={styles.quickActionSubtitle}>Add time manually</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Timesheet')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionTitle}>View Timesheet</Text>
              <Text style={styles.quickActionSubtitle}>See all entries</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Projects')}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionTitle}>My Projects</Text>
              <Text style={styles.quickActionSubtitle}>View assignments</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Start Tracking Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start Time Tracking</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStartModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Select Project</Text>
              <Text style={styles.modalSectionSubtitle}>
                Choose a project to start tracking your time
              </Text>
              
              {assignedProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.selectionCard,
                    selectedProject === project.id && styles.selectedCard
                  ]}
                  onPress={() => setSelectedProject(project.id)}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectClient}>{project.clientName}</Text>
                  </View>
                  {selectedProject === project.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.cancelButton}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowStartModal(false);
                  setSelectedProject(null);
                }}
                variant="secondary"
              />
            </View>
            <View style={styles.confirmButton}>
              <Button
                title={starting ? "Starting..." : "Start Tracking"}
                onPress={() => selectedProject && handleStartEntry(selectedProject)}
                disabled={starting || !selectedProject}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manual Time Entry</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowManualEntry(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Add Time Entry</Text>
              <Text style={styles.modalSectionSubtitle}>
                Log time manually for any of your projects
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Project</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputText}>
                    {manualEntry.projectId ? 
                      assignedProjects.find(p => p.id === manualEntry.projectId)?.name : 
                      'Select Project'
                    }
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hours</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualEntry.hours}
                  onChangeText={(text) => setManualEntry(prev => ({ ...prev, hours: text }))}
                  placeholder="0.0"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualEntry.description}
                  onChangeText={(text) => setManualEntry(prev => ({ ...prev, description: text }))}
                  placeholder="What did you work on?"
                  multiline
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.cancelButton}>
              <Button
                title="Cancel"
                onPress={() => setShowManualEntry(false)}
                variant="secondary"
              />
            </View>
            <View style={styles.confirmButton}>
              <Button
                title="Add Entry"
                onPress={() => {
                  // In a real app, this would save to the backend
                  Alert.alert('Success', 'Time entry added successfully!');
                  setShowManualEntry(false);
                  setManualEntry({ projectId: '', hours: '', description: '' });
                }}
                disabled={!manualEntry.hours || !manualEntry.projectId}
              />
            </View>
          </View>
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
  manualEntryButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualEntryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
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
  
  // Live Time Tracking Styles
  activeTimerCard: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    marginBottom: 16,
  },
  activeTimerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timerInfo: {
    flex: 1,
  },
  timerProjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timerTaskName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  timerStartTime: {
    fontSize: 12,
    color: '#666',
  },
  timerDisplay: {
    alignItems: 'flex-end',
  },
  timerTime: {
    fontSize: 32,
    fontWeight: '700',
    color: '#34C759',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  timerStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  timerActions: {
    alignItems: 'center',
  },
  noTimerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  noTimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noTimerSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  startTimerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startTimerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  todayHoursCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  todayHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  todayHoursValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  todayHoursBreakdown: {
    gap: 8,
  },
  hoursEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hoursProject: {
    fontSize: 14,
    color: '#666',
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  noEntriesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Quick Actions Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  cardContent: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  projectClient: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  textInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
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