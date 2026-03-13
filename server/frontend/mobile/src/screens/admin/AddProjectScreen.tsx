import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import Input from '../../components/shared/Input';
import * as DocumentPicker from 'expo-document-picker';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';

interface TimeEntry {
  id: string;
  userName: string;
  duration: string; // e.g., "2h 30m"
  startTime: string;
  endTime: string;
  date: string;
}
interface Task {
  id: string;
  taskName: string;
  assigneeIds: string[]; // multiple employee ids
  assigneeNames: string[]; // human-readable names
  // Dates
  startDate?: string; // ISO date (YYYY-MM-DD)
  endDate?: string;   // ISO date (YYYY-MM-DD)
  // Legacy single due date kept for backend payload compatibility
  dueDate?: string;
  // Location and details
  location?: string;
  description?: string; // instructions/description
  // Attachments selected in UI (upload after task is created)
  attachments?: Array<{ uri: string; name: string; type?: string }>; 
  // Backend status - default to 'To Do'
  status: 'To Do' | 'Active' | 'Completed' | 'Cancelled' | 'On Hold';
  // Time tracking
  timeEntries?: TimeEntry[];
  totalTrackedTime?: string; // e.g., "25h 25m"
}

export default function AddProjectScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { clientId, clientName, onProjectAdded } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  
  // Project form state
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [estimatedValue, setEstimatedValue] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>({
    id: '',
    taskName: '',
    assigneeIds: [],
    assigneeNames: [],
    startDate: '',
    endDate: '',
    dueDate: '',
    location: '',
    description: '',
    attachments: [],
    status: 'To Do',
  });
  const [showTaskStartDatePicker, setShowTaskStartDatePicker] = useState(false);
  const [showTaskEndDatePicker, setShowTaskEndDatePicker] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Time tracking modal state
  const [showTimeTrackingModal, setShowTimeTrackingModal] = useState(false);
  const [timeEntryInput, setTimeEntryInput] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timeEntryDate, setTimeEntryDate] = useState(new Date());
  const [showTimeEntryDatePicker, setShowTimeEntryDatePicker] = useState(false);
  const [timeEntryStartTime, setTimeEntryStartTime] = useState<Date | null>(null);
  const [timeEntryEndTime, setTimeEntryEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Employees for assignee dropdown
  const [employees, setEmployees] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - timerStartTime.getTime();
        setTimerElapsed(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerStartTime]);

  const loadEmployees = async () => {
    if (loadingEmployees || employees.length > 0) return;
    try {
      setLoadingEmployees(true);
  const res = await api.get('/api/employees', { params: { page: 1, limit: 200, active: 'all' } });
      const rows: any[] = res.data?.employees || res.data?.data || res.data || [];
      const mapped = rows.map((e: any) => ({ id: String(e.id), first_name: e.first_name || e.firstName || '', last_name: e.last_name || e.lastName || '' }));
      setEmployees(mapped);
    } catch (err) {
      // noop; dropdown will stay empty
    } finally {
      setLoadingEmployees(false);
    }
  };

  const validateForm = () => {
    if (!projectName.trim()) {
      Alert.alert('Validation Error', 'Project name is required');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Location is required');
      return false;
    }
    return true;
  };

  const handleAddTask = () => {
    setEditingTaskId(null);
    setCurrentTask({
      id: '',
      taskName: '',
      assigneeIds: [],
      assigneeNames: [],
      startDate: '',
      endDate: '',
      dueDate: '',
      location: '',
      description: '',
      attachments: [],
      status: 'To Do',
      timeEntries: [],
      totalTrackedTime: '0h 0m',
    });
    setShowAddTaskModal(true);
  };

  const calculateTotalTime = (entries: TimeEntry[]): string => {
    let totalMinutes = 0;
    entries.forEach(entry => {
      const match = entry.duration.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleOpenTimeTracking = () => {
    setTimeEntryInput('');
    setShowTimeTrackingModal(true);
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    const now = new Date();
    setTimerStartTime(now);
    setTimeEntryDate(now);
    setTimeEntryStartTime(now);
    setTimerElapsed(0);
  };

  const handleStopTimer = () => {
    if (!timerStartTime) return;
    
    const endTime = new Date();
    const durationMs = endTime.getTime() - timerStartTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      userName: 'Current User', // You can get this from auth context
      duration: `${hours}h ${minutes}m`,
      startTime: timerStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      endTime: endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: timeEntryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };

    const updatedEntries = [...(currentTask.timeEntries || []), newEntry];
    setCurrentTask({
      ...currentTask,
      timeEntries: updatedEntries,
      totalTrackedTime: calculateTotalTime(updatedEntries),
    });

    setIsTimerRunning(false);
    setTimerStartTime(null);
    setTimerElapsed(0);
    setTimeEntryInput('');
    setTimeEntryEndTime(endTime);
  };

  const handleAddManualTime = () => {
    const now = new Date();
    // Compute duration: prefer start/end selection; else use typed duration; fallback 0m
    let durationLabel = timeEntryInput.trim();
    if (timeEntryStartTime && timeEntryEndTime) {
      let diffMs = timeEntryEndTime.getTime() - timeEntryStartTime.getTime();
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // cross midnight
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      durationLabel = `${h}h ${m}m`;
    }
    if (!durationLabel) durationLabel = '0h 0m';

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      userName: 'Current User',
      duration: durationLabel,
      startTime: (timeEntryStartTime || now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      endTime: (timeEntryEndTime || now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: timeEntryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };

    const updatedEntries = [...(currentTask.timeEntries || []), newEntry];
    setCurrentTask({
      ...currentTask,
      timeEntries: updatedEntries,
      totalTrackedTime: calculateTotalTime(updatedEntries),
    });

    setTimeEntryInput('');
    setTimeEntryStartTime(null);
    setTimeEntryEndTime(null);
    setShowTimeTrackingModal(false);
  };

  const handleSaveTask = () => {
    if (!currentTask.taskName.trim()) {
      Alert.alert('Error', 'Task name is required');
      return;
    }
    
    const taskToAdd: Task = {
      ...currentTask,
      id: editingTaskId || `${Date.now()}`,
    };
    
    if (editingTaskId) {
      // Update existing task
      setTasks(tasks.map(t => t.id === editingTaskId ? taskToAdd : t));
    } else {
      // Add new task
      setTasks([...tasks, taskToAdd]);
    }
    
    setShowAddTaskModal(false);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask({ ...task });
    setEditingTaskId(task.id);
    setShowAddTaskModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTasks(tasks.filter(t => t.id !== taskId));
          },
        },
      ]
    );
  };

  // Geocode address to get coordinates using OpenStreetMap Nominatim
  const geocodeAddress = async (address: string): Promise<string | null> => {
    if (!address.trim()) return null;
    try {
      const encodedAddress = encodeURIComponent(address.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'ProjectTimeManager/1.0',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return `${lat},${lon}`;
      }
      return null;
    } catch (error) {
      console.warn('Geocoding failed:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Auto-geocode the location address
      const coordinates = await geocodeAddress(location);
      
      // Create the project
      const projectResponse = await api.post('/api/projects', {
        name: projectName.trim(),
        clientId: clientId,
        description: description.trim() || null,
        startDate: startDate.toISOString().split('T')[0],
        endDate: dueDate.toISOString().split('T')[0],
        status: 'To Do',
        budget: estimatedValue ? parseFloat(estimatedValue) : null,
        location: location.trim() || null,
        coordinates: coordinates,
      });

      console.log('Project created successfully:', projectResponse.data);
      const projectId = projectResponse.data.project.id;
      
      // Create tasks for the project
      if (tasks.length > 0) {
        const taskPromises = tasks.map(task => {
          const dueDateObj = task.dueDate ? new Date(task.dueDate) : new Date();
          return api.post(`/api/projects/${projectId}/tasks`, {
            title: task.taskName,
            status: task.status,
            // Support multiple assignees. Backend should accept an array of employee IDs.
            assignedTo: (task.assigneeIds && task.assigneeIds.length > 0) ? task.assigneeIds : undefined,
            dueDate: dueDateObj.toISOString().split('T')[0],
          });
        });
        
        await Promise.all(taskPromises);
        console.log(`Created ${tasks.length} tasks for the project`);
      }
      
      // If callback provided (from Add Client screen), call it with project data
      if (onProjectAdded) {
        onProjectAdded({
          id: projectId,
          name: projectName,
          budget: estimatedValue ? parseFloat(estimatedValue) : null,
          description: description.trim() || null,
        });
      }

      Alert.alert(
        'Success',
        `Project created successfully${tasks.length > 0 ? ` with ${tasks.length} task${tasks.length !== 1 ? 's' : ''}` : ''}!`,
        [
          {
            text: 'Add Another Project',
            onPress: () => {
              // Reset form to add another project
              setProjectName('');
              setLocation('');
              setDescription('');
              setStartDate(new Date());
              setDueDate(new Date());
              setEstimatedValue('');
              setTasks([]);
            },
          },
          {
            text: onProjectAdded ? 'Done' : 'View Projects',
            onPress: () => {
              if (onProjectAdded) {
                // Go back to Add Client screen
                navigation.goBack();
              } else {
                // Navigate directly to the client's projects with a highlight on the newly created project
                navigation.navigate('ClientProjects', {
                  client: { id: clientId, name: clientName },
                  projects: [],
                  highlightProjectId: projectId,
                });
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating project:', error);
      
      let errorMessage = 'Failed to create project. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (projectName || location || description || tasks.length > 0) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#101010" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('projects.create_project')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Project Name */}
          <View style={styles.voiceRow}>
            <View style={styles.voiceInputFlex}>
              <Input
                label={`${t('projects.project_name')} *`}
                placeholder={t('projects.project_name')}
                value={projectName}
                onChangeText={setProjectName}
                autoCapitalize="words"
              />
            </View>
            <VoiceToTextButton
              onResult={(text) => setProjectName(prev => prev ? `${prev} ${text}` : text)}
              size="small"
            />
          </View>

          {/* Client (Read Only) */}
          <View style={styles.readOnlyGroup}>
            <Text style={styles.readOnlyLabel}>{t('projects.client')}</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{clientName || 'Not specified'}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.voiceRow}>
            <View style={styles.voiceInputFlex}>
              <Input
                label={t('common.location')}
                placeholder={t('common.location')}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
            </View>
            <VoiceToTextButton
              onResult={(text) => setLocation(prev => prev ? `${prev} ${text}` : text)}
              size="small"
            />
          </View>

          {/* Description */}
          <View style={styles.voiceRow}>
            <View style={styles.voiceInputFlex}>
              <Input
                label={t('projects.project_description')}
                placeholder={t('projects.project_description')}
                value={description}
                onChangeText={setDescription}
              />
            </View>
            <VoiceToTextButton
              onResult={(text) => setDescription(prev => prev ? `${prev} ${text}` : text)}
              size="small"
            />
          </View>

          {/* Dates Row */}
          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                <Text style={styles.dateText}>
                  {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#877ED2" />
              </TouchableOpacity>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>Due Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDueDatePicker(true)}>
                <Text style={styles.dateText}>
                  {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#877ED2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Estimated Value */}
          <Input
            label="Estimated Value"
            placeholder="Enter estimated value"
            value={estimatedValue}
            onChangeText={setEstimatedValue}
            keyboardType="numeric"
          />
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksCard}>
          <View style={styles.tasksHeader}>
            <Text style={styles.sectionTitle}>{t('tasks.tasks')} ({tasks.length})</Text>
            <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addTaskButtonText}>{t('tasks.create_task')}</Text>
            </TouchableOpacity>
          </View>

          {tasks.length > 0 && (
            <View style={styles.tasksList}>
              {tasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskItemContent}>
                    <Text style={styles.taskItemName}>{task.taskName}</Text>
                    <Text style={styles.taskItemDetails}>
                      {task.assigneeNames && task.assigneeNames.length > 0 
                        ? `Assigned to: ${task.assigneeNames.join(', ')} • ` 
                        : ''}
                      {task.startDate ? `Start: ${new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                      {task.startDate && (task.endDate || task.dueDate) ? ' • ' : ''}
                      {task.endDate
                        ? `End: ${new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : task.dueDate
                        ? `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'No dates'}
                      {task.totalTrackedTime && task.totalTrackedTime !== '0h 0m' ? `\n⏱️ ${task.totalTrackedTime}` : ''}
                    </Text>
                  </View>
                  <View style={styles.taskItemActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditTask(task)}>
                      <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(task.id)}>
                      <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}
        {showDueDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDueDatePicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}

        {/* Add Task Modal */}
        <Modal
          visible={showAddTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddTaskModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingTaskId ? t('common.edit') + ' ' + t('tasks.tasks') : t('tasks.create_task')}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAddTaskModal(false)}
                >
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Task Name */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('tasks.task_name')} *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={currentTask.taskName}
                    onChangeText={(value) =>
                      setCurrentTask({ ...currentTask, taskName: value })
                    }
                    placeholder={t('tasks.task_name')}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Project Name (Read-only) */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('projects.project_name')}</Text>
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>
                      {projectName || t('common.not_specified')}
                    </Text>
                  </View>
                </View>

                {/* Assigned to (Multi-select) */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('tasks.assigned_to')}</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={async () => { await loadEmployees(); setShowAssigneePicker(!showAssigneePicker); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectorText, (!currentTask.assigneeNames || currentTask.assigneeNames.length === 0) && { color: '#999' }]}>
                      {currentTask.assigneeNames && currentTask.assigneeNames.length > 0
                        ? (currentTask.assigneeNames.length <= 2
                            ? currentTask.assigneeNames.join(', ')
                            : `${currentTask.assigneeNames.slice(0,2).join(', ')} +${currentTask.assigneeNames.length - 2} more`)
                        : t('tasks.select_employees')}
                    </Text>
                    <Text style={styles.selectorIcon}>▾</Text>
                  </TouchableOpacity>
                  {showAssigneePicker && (
                    <View style={styles.dropdown}>
                      {loadingEmployees ? (
                        <View style={styles.dropdownLoading}><ActivityIndicator /></View>
                      ) : employees.length === 0 ? (
                        <Text style={styles.dropdownEmpty}>{t('employees.no_employees')}</Text>
                      ) : (
                        <>
                          <ScrollView 
                            style={{ maxHeight: 240 }}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                          >
                            {employees.map(emp => {
                              const fullName = `${emp.first_name} ${emp.last_name}`.trim();
                              const alreadySelected = (currentTask.assigneeIds || []).includes(emp.id);
                              return (
                                <TouchableOpacity
                                  key={emp.id}
                                  style={[styles.dropdownItem, alreadySelected && styles.dropdownItemSelected]}
                                  onPress={() => {
                                    const ids = new Set(currentTask.assigneeIds || []);
                                    const names = new Set(currentTask.assigneeNames || []);
                                    if (alreadySelected) {
                                      ids.delete(emp.id);
                                      names.delete(fullName);
                                    } else {
                                      ids.add(emp.id);
                                      names.add(fullName);
                                    }
                                    setCurrentTask({ 
                                      ...currentTask, 
                                      assigneeIds: Array.from(ids), 
                                      assigneeNames: Array.from(names) 
                                    });
                                  }}
                                >
                                  <Text style={[styles.dropdownItemText, alreadySelected && styles.dropdownItemTextSelected]}>
                                    {alreadySelected ? '✓ ' : ''}{fullName || 'Unnamed'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                          <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#e1e5e9', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                              onPress={() => {
                                setCurrentTask({ ...currentTask, assigneeIds: [], assigneeNames: [] });
                              }}
                              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                            >
                              <Text style={{ color: '#FF3B30', fontWeight: '600' }}>{t('common.clear')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setShowAssigneePicker(false)}
                              style={{ backgroundColor: '#877ED2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
                            >
                              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.done')}</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>

                {/* Location */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('common.location')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={currentTask.location || ''}
                    onChangeText={(value) => setCurrentTask({ ...currentTask, location: value })}
                    placeholder={t('common.location')}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Start Date */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('tasks.start_date')}</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowTaskStartDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {currentTask.startDate
                        ? new Date(currentTask.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : t('tasks.select_start_date')}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#877ED2" />
                  </TouchableOpacity>
                </View>

                {/* End Date */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('tasks.end_date')}</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowTaskEndDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {currentTask.endDate
                        ? new Date(currentTask.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : t('tasks.select_end_date')}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#877ED2" />
                  </TouchableOpacity>
                </View>

                {/* Description / Instructions */}
                <View style={styles.modalInputGroup}>
                  <View style={styles.modalLabelRow}>
                    <Text style={styles.modalLabel}>{t('tasks.description')}</Text>
                    <VoiceToTextButton
                      onResult={(text) => setCurrentTask({ ...currentTask, description: (currentTask.description || '') + (currentTask.description ? ' ' : '') + text })}
                      size="small"
                    />
                  </View>
                  <TextInput
                    style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                    value={currentTask.description || ''}
                    onChangeText={(value) => setCurrentTask({ ...currentTask, description: value })}
                    placeholder={t('tasks.description')}
                    placeholderTextColor="#999"
                    multiline
                  />
                </View>

                {/* Time Tracking */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Time Tracking</Text>
                  <TouchableOpacity
                    style={styles.timeTrackingButton}
                    onPress={handleOpenTimeTracking}
                  >
                    <View style={styles.timeTrackingButtonLeft}>
                      <Text style={styles.timeTrackingIcon}>⏱️</Text>
                      <Text style={styles.timeTrackingLabel}>Track Time</Text>
                    </View>
                    <Text style={styles.timeTrackingValue}>
                      {currentTask.totalTrackedTime || '0h 0m'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Attachments */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Attachments</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={async () => {
                      try {
                        const result = await DocumentPicker.getDocumentAsync({ multiple: true });
                        if (!(result as any).canceled) {
                          const assets = (result as any).assets || [];
                          const newFiles = assets.map((f: any) => ({ uri: f.uri, name: f.name, type: f.mimeType }));
                          setCurrentTask({
                            ...currentTask,
                            attachments: [ ...(currentTask.attachments || []), ...newFiles ],
                          });
                        }
                      } catch (e) {
                        // ignore picker errors
                      }
                    }}
                  >
                    <Text style={styles.dateText}>Pick files</Text>
                    <Ionicons name="attach-outline" size={18} color="#877ED2" />
                  </TouchableOpacity>
                  {(currentTask.attachments || []).length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      {(currentTask.attachments || []).map((file, idx) => (
                        <Text key={`${file.uri}-${idx}`} style={{ fontSize: 12, color: '#666' }}>• {file.name}</Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Status removed per requirement - default remains 'todo' */}

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowAddTaskModal(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSaveTask}
                  >
                    <Text style={styles.modalSaveButtonText}>{t('common.save')} {t('tasks.tasks')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {showTaskStartDatePicker && (
          <DateTimePicker
            value={currentTask.startDate ? new Date(currentTask.startDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTaskStartDatePicker(false);
              if (selectedDate) {
                setCurrentTask({
                  ...currentTask,
                  startDate: selectedDate.toISOString(),
                });
              }
            }}
          />
        )}
        {showTaskEndDatePicker && (
          <DateTimePicker
            value={currentTask.endDate ? new Date(currentTask.endDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTaskEndDatePicker(false);
              if (selectedDate) {
                setCurrentTask({
                  ...currentTask,
                  endDate: selectedDate.toISOString(),
                });
              }
            }}
          />
        )}

        {/* Time Tracking Modal */}
        <Modal
          visible={showTimeTrackingModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTimeTrackingModal(false)}
        >
          <View style={styles.timeModalOverlay}>
            <View style={styles.timeModalContent}>
              <View style={styles.timeModalHeader}>
                <Text style={styles.timeModalTitle}>Track Time</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowTimeTrackingModal(false)}
                >
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.timeModalScrollView}>
                {/* Total Time Display */}
                <View style={styles.totalTimeSection}>
                  <Text style={styles.totalTimeLabel}>Time on this task</Text>
                  <Text style={styles.totalTimeValue}>
                    {currentTask.totalTrackedTime || '0h 0m'}
                  </Text>
                </View>

                {/* Time Entry Input */}
                <View style={styles.timeInputSection}>
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={styles.timeInput}
                      value={isTimerRunning 
                        ? `${Math.floor(timerElapsed / (1000 * 60 * 60))}h ${Math.floor((timerElapsed % (1000 * 60 * 60)) / (1000 * 60))}m`
                        : timeEntryInput}
                      onChangeText={setTimeEntryInput}
                      placeholder="Enter time (ex: 3h 20m) or start timer"
                      placeholderTextColor="#999"
                      editable={!isTimerRunning}
                    />
                    <TouchableOpacity
                      style={styles.timerButton}
                      onPress={isTimerRunning ? handleStopTimer : handleStartTimer}
                    >
                      <Text style={styles.timerButtonIcon}>
                        {isTimerRunning ? '⏹️' : '▶️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Date / Start / End chips */}
                <View style={[styles.timeDetailRow, { borderBottomWidth: 0, paddingVertical: 0 }]}> 
                  <Text style={styles.timeDetailIcon}>🕐</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                    <TouchableOpacity
                      style={styles.timeChip}
                      onPress={() => setShowTimeEntryDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeChipText}>
                        {timeEntryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.timeChip}
                      onPress={() => setShowStartTimePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeChipText}>
                        {timeEntryStartTime
                          ? timeEntryStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                          : 'Start time'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.timeChip}
                      onPress={() => {
                        if (!timeEntryStartTime) {
                          setShowStartTimePicker(true);
                        } else {
                          setShowEndTimePicker(true);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeChipText}>
                        {timeEntryEndTime
                          ? timeEntryEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                          : 'End time'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveTimeButton}
                  onPress={handleAddManualTime}
                >
                  <Text style={styles.saveTimeButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>

                {/* Time Entries List */}
                {currentTask.timeEntries && currentTask.timeEntries.length > 0 && (
                  <View style={styles.timeEntriesSection}>
                    <Text style={styles.timeEntriesTitle}>Time Entries</Text>
                    {currentTask.timeEntries.map((entry) => (
                      <View key={entry.id} style={styles.timeEntryItem}>
                        <View style={styles.timeEntryLeft}>
                          <View style={styles.timeEntryAvatar}>
                            <Text style={styles.timeEntryAvatarText}>
                              {entry.userName.charAt(0)}
                            </Text>
                          </View>
                          <View style={styles.timeEntryDetails}>
                            <Text style={styles.timeEntryUserName}>{entry.userName}</Text>
                            <Text style={styles.timeEntryTime}>
                              {entry.date} {entry.startTime} - {entry.endTime}
                            </Text>
                            {/* Notes removed per requirement */}
                          </View>
                        </View>
                        <Text style={styles.timeEntryDuration}>{entry.duration}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Start Time Picker Modal */}
        <Modal
          visible={showStartTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStartTimePicker(false)}
        >
          <View style={styles.timeModalOverlay}>
            <View style={styles.timePickerContent}>
              <ScrollView style={{ maxHeight: 320 }}>
                {[...Array(96)].map((_, idx) => {
                  const minutes = idx * 15;
                  const d = new Date(timeEntryDate);
                  d.setHours(0, minutes, 0, 0);
                  const label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  return (
                    <TouchableOpacity
                      key={`start-${idx}`}
                      style={styles.timeSelectItem}
                      onPress={() => { setTimeEntryStartTime(d); setShowStartTimePicker(false); }}
                    >
                      <Text style={styles.timeSelectLabel}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* End Time Picker Modal */}
        <Modal
          visible={showEndTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEndTimePicker(false)}
        >
          <View style={styles.timeModalOverlay}>
            <View style={styles.timePickerContent}>
              <ScrollView style={{ maxHeight: 320 }}>
                {[...Array(96)].map((_, idx) => {
                  // If start time is set, list should begin 15 minutes AFTER start, wrap across midnight
                  const baseDate = new Date(timeEntryDate);
                  let startMinutes = 0;
                  if (timeEntryStartTime) {
                    startMinutes = timeEntryStartTime.getHours() * 60 + timeEntryStartTime.getMinutes();
                  }
                  const minutesTotal = timeEntryStartTime
                    ? (startMinutes + 15 + idx * 15) % 1440
                    : idx * 15;
                  const dayOffset = timeEntryStartTime && minutesTotal <= startMinutes ? 1 : 0;

                  const d = new Date(baseDate);
                  d.setDate(baseDate.getDate() + dayOffset);
                  d.setHours(0, minutesTotal, 0, 0);

                  const label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                  // Show duration hint from selected start
                  let hint = '';
                  if (timeEntryStartTime) {
                    const startMs = new Date(baseDate);
                    startMs.setHours(timeEntryStartTime.getHours(), timeEntryStartTime.getMinutes(), 0, 0);
                    const endMs = d.getTime();
                    let diff = endMs - startMs.getTime();
                    if (diff < 0) diff += 24 * 60 * 60 * 1000;
                    const hh = Math.floor(diff / (1000 * 60 * 60));
                    const mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const hPart = hh > 0 ? `${hh}h ` : '';
                    const mPart = `${mm}m`;
                    hint = `${hPart}${mPart}`;
                  }

                  return (
                    <TouchableOpacity
                      key={`end-${idx}`}
                      style={styles.timeSelectItem}
                      onPress={() => { setTimeEntryEndTime(d); setShowEndTimePicker(false); }}
                    >
                      <Text style={styles.timeSelectLabel}>{label}</Text>
                      {hint ? <Text style={styles.timeSelectHint}>{hint}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Time Entry Date Picker */}
        {showTimeEntryDatePicker && (
          <DateTimePicker
            value={timeEntryDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimeEntryDatePicker(false);
              if (selectedDate) setTimeEntryDate(selectedDate);
            }}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t('projects.create_project')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 24,
    flexGrow: 1,
  },
  formCard: {
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  voiceInputFlex: {
    flex: 1,
  },
  readOnlyGroup: {
    marginBottom: 20,
  },
  readOnlyLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 6,
    fontFamily: 'Inter_400Regular',
  },
  readOnlyField: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateCol: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  dateText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  // Tasks Section
  tasksCard: {
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#877ED2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#A098DC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  addTaskButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  taskItemContent: {
    marginBottom: 10,
  },
  taskItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskItemDetails: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  taskItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#877ED2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Submit
  submitButton: {
    backgroundColor: '#877ED2',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#A098DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#666',
    fontWeight: '300',
  },
  modalScrollView: {
    padding: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
    minHeight: 56,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#877ED2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#A098DC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Time Tracking
  timeTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    minHeight: 52,
  },
  timeTrackingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeTrackingIcon: {
    fontSize: 18,
  },
  timeTrackingLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeTrackingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#877ED2',
  },
  // Time Modal
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timeModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  timeModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  timeModalScrollView: {
    padding: 20,
  },
  totalTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalTimeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  timeInputSection: {
    marginBottom: 20,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#877ED2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  timerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#877ED2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonIcon: {
    fontSize: 20,
  },
  timeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  timeDetailIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  timeDetailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  timeDetailInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  billableToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#877ED2',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  billableText: {
    fontSize: 14,
    color: '#666',
  },
  saveTimeButton: {
    backgroundColor: '#877ED2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#A098DC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  saveTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timeEntriesSection: {
    marginTop: 20,
  },
  timeEntriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  timeEntryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeEntryLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  timeEntryAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#877ED2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeEntryAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timeEntryDetails: {
    flex: 1,
  },
  timeEntryUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  timeEntryTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timeEntryNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  timeEntryDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  // Time chips
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  timeChipText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  timePickerContent: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 80,
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: '60%',
  },
  timeSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeSelectLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  timeSelectHint: {
    fontSize: 12,
    color: '#999',
  },
  timeTrackingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonSelected: {
    backgroundColor: '#877ED2',
    borderColor: '#877ED2',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextSelected: {
    color: '#fff',
  },
  // Assignee selector
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    minHeight: 56,
  },
  selectorText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  selectorIcon: {
    fontSize: 16,
    color: '#666',
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  dropdownLoading: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownEmpty: {
    padding: 16,
    color: '#666',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3F1FC',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  dropdownItemTextSelected: {
    color: '#877ED2',
    fontWeight: '600',
  },
});

