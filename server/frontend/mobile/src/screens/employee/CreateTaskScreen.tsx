import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  Switch,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { dashboardApi, Project } from '../../api/dashboard';
import { createProjectTask, listEmployees } from '../../api/endpoints';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';

type TaskStatus = 'To Do' | 'Active' | 'Completed' | 'Cancelled' | 'On Hold';

interface TimeEntry {
  id: string;
  userName: string;
  duration: string;
  startTime: string;
  endTime: string;
  date: string;
}

interface NewTask {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  projectId: string;
  projectName: string;
  timeEntries?: TimeEntry[];
  totalTrackedTime?: string;
}

interface EmployeeItem {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department?: string;
}

export default function CreateTaskScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStartDate, setTaskStartDate] = useState(new Date());
  const [taskEndDate, setTaskEndDate] = useState(new Date());
  const [showTaskStartDatePicker, setShowTaskStartDatePicker] = useState(false);
  const [showTaskEndDatePicker, setShowTaskEndDatePicker] = useState(false);

  // Priority & extras
  const [highPriority, setHighPriority] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  // Assignees state
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);

  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalTrackedTime, setTotalTrackedTime] = useState('0h 0m');
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

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getAssignedProjects();
      setProjects(response);
      if (response.length > 0) {
        setSelectedProject(response[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await listEmployees({ page: 1, limit: 200, active: 'all' as any });
      const list = (res as any).employees ?? [];
      setEmployees(list);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleAddAttachment = () => {
    Alert.alert('Attach File', 'File picker will be available soon.');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDropdown(false);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowTaskStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setTaskStartDate(selectedDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowTaskEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) setTaskEndDate(selectedDate);
  };

  const toggleAssignee = (id: string) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const calculateTotalTime = (entries: TimeEntry[]): string => {
    let totalMinutes = 0;
    entries.forEach(entry => {
      const match = entry.duration.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
      }
    });
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
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
      userName: 'Current User',
      duration: `${hours}h ${minutes}m`,
      startTime: timerStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      endTime: endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: timeEntryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    setTotalTrackedTime(calculateTotalTime(updatedEntries));
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setTimerElapsed(0);
  };

  const handleAddManualTime = () => {
    if (!timeEntryInput.trim() || !timeEntryStartTime || !timeEntryEndTime) {
      Alert.alert('Error', 'Please fill in all time entry fields');
      return;
    }
    const match = timeEntryInput.match(/(\d+)h\s*(\d+)m/);
    if (!match) {
      Alert.alert('Error', 'Please enter time in format: Xh Ym (e.g., 2h 30m)');
      return;
    }
    let durationLabel = timeEntryInput.trim();
    if (!durationLabel.includes('h')) durationLabel = '0h ' + durationLabel;
    if (!durationLabel.includes('m')) durationLabel = durationLabel + ' 0m';
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      userName: 'Current User',
      duration: durationLabel,
      startTime: timeEntryStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      endTime: timeEntryEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: timeEntryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    setTotalTrackedTime(calculateTotalTime(updatedEntries));
    setTimeEntryInput('');
    setTimeEntryStartTime(null);
    setTimeEntryEndTime(null);
  };

  const handleDeleteTimeEntry = (entryId: string) => {
    const updatedEntries = timeEntries.filter(entry => entry.id !== entryId);
    setTimeEntries(updatedEntries);
    setTotalTrackedTime(calculateTotalTime(updatedEntries));
  };

  const validateForm = (): string | null => {
    if (!taskTitle.trim()) return 'Task title is required';
    if (!taskDescription.trim()) return 'Task description is required';
    if (!selectedProject) return 'Please select a project';
    if (taskEndDate < taskStartDate) return 'End date cannot be before start date';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }
    if (!selectedProject) {
      Alert.alert('Error', 'Please select a project');
      return;
    }
    setSubmitting(true);
    try {
      const assignees = selectedAssigneeIds.length > 0 ? selectedAssigneeIds : [user?.id || ''];
      const makeUnassignedToo = assignees.length === 1 && assignees[0] === '';
      if (makeUnassignedToo) {
        await createProjectTask(selectedProject.id, { title: taskTitle.trim(), status: 'todo' });
      } else {
        const validAssignees = assignees.filter(Boolean);
        await Promise.all(
          validAssignees.map(empId =>
            createProjectTask(selectedProject.id, { title: taskTitle.trim(), status: 'todo', assignedTo: empId })
          )
        );
      }
      Alert.alert(
        'Success',
        selectedAssigneeIds.length > 1
          ? `Created ${selectedAssigneeIds.length} tasks (one per assignee) in "${selectedProject.name}"`
          : `Task "${taskTitle}" has been created in project "${selectedProject.name}"`,
        [{
          text: 'OK',
          onPress: () => {
            setTaskTitle('');
            setTaskDescription('');
            setTaskStartDate(new Date());
            setTaskEndDate(new Date());
            setTimeEntries([]);
            setTotalTrackedTime('0h 0m');
            setSelectedAssigneeIds([]);
            setSelectedProject(projects.length > 0 ? projects[0] : null);
            navigation.goBack();
          },
        }]
      );
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // ─── Loading ───
  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={[s.headerBar, { paddingTop: insets.top }]}>
          <View style={s.headerSide} />
          <Text style={s.headerText}>Create New Task</Text>
          <View style={s.headerSide} />
        </View>
        <View style={s.centered}>
          <Text style={s.loadingText}>Loading projects...</Text>
        </View>
      </View>
    );
  }

  // ─── Empty state ───
  if (projects.length === 0) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={[s.headerBar, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerSide}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerText}>Create New Task</Text>
          <View style={s.headerSide} />
        </View>
        <View style={s.centered}>
          <Ionicons name="folder-outline" size={64} color="#8E8E93" />
          <Text style={s.emptyTitle}>No Projects Available</Text>
          <Text style={s.emptyMsg}>You are not assigned to any projects yet.</Text>
        </View>
      </View>
    );
  }

  // ─── Main form ───
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* ── Header ── */}
      <View style={[s.headerBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerSide}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.headerText}>Create New Task</Text>
        <TouchableOpacity style={s.headerSide}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── High Priority ── */}
        <View style={s.priorityRow}>
          <Text style={s.priorityLabel}>High Priority</Text>
          <Switch
            value={highPriority}
            onValueChange={setHighPriority}
            trackColor={{ false: '#D1D5DB', true: '#6D28D9' }}
            thumbColor="#fff"
            ios_backgroundColor="#D1D5DB"
          />
        </View>

        {/* ── Select Project ── */}
        <TouchableOpacity style={s.field} onPress={() => setShowProjectDropdown(true)}>
          <Text style={selectedProject ? s.fieldValue : s.fieldPlaceholder}>
            {selectedProject ? selectedProject.name : 'Select Project*'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ── Task Title ── */}
        <View style={s.fieldWithIcon}>
          <TextInput
            style={s.fieldTextInput}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Task Title"
            placeholderTextColor="#9CA3AF"
          />
          <View style={s.micBtn}>
            <VoiceToTextButton
              onResult={(text) => setTaskTitle(prev => prev ? `${prev} ${text}` : text)}
              size="small"
              color="#7C3AED"
            />
          </View>
        </View>

        {/* ── Description ── */}
        <View style={[s.fieldWithIcon, s.fieldDescWrap]}>
          <TextInput
            style={[s.fieldTextInput, s.fieldDescInput]}
            value={taskDescription}
            onChangeText={setTaskDescription}
            placeholder="Description*"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={[s.micBtn, { alignSelf: 'flex-end', marginBottom: 12 }]}>
            <VoiceToTextButton
              onResult={(text) => setTaskDescription(prev => prev ? `${prev} ${text}` : text)}
              size="small"
              color="#7C3AED"
            />
          </View>
        </View>

        {/* ── Start / End ── */}
        <View style={s.dateRow}>
          <TouchableOpacity style={s.dateField} onPress={() => setShowTaskStartDatePicker(true)}>
            <Text style={s.dateValue}>
              {taskStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity style={s.dateField} onPress={() => setShowTaskEndDatePicker(true)}>
            <Text style={s.dateValue}>
              {taskEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* ── Location ── */}
        <TouchableOpacity style={s.field} onPress={() => setShowLocationDropdown(true)}>
          <Text style={selectedLocation ? s.fieldValue : s.fieldPlaceholder}>
            {selectedLocation || 'Location'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ── Team ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Team ({selectedAssigneeIds.length})</Text>
            <TouchableOpacity style={s.addCircle} onPress={() => setShowAssigneeModal(true)}>
              <Ionicons name="add" size={18} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          {selectedAssigneeIds.map((id, idx) => {
            const emp = employees.find(e => e.id === id);
            const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
            const role = emp?.department || '';
            const initials = emp
              ? `${emp.first_name.charAt(0)}${emp.last_name.charAt(0)}`
              : '?';
            return (
              <View key={id} style={s.memberRow}>
                <View style={[s.avatar, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{name}</Text>
                  {role ? <Text style={s.memberRole}>{role}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => toggleAssignee(id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={s.removeX}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ── Attachment ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Attachment ({attachments.length})</Text>
          {attachments.length > 0 && (
            <View style={s.thumbRow}>
              {attachments.map((uri, i) => (
                <Image key={i} source={{ uri }} style={s.thumb} />
              ))}
            </View>
          )}
          <View style={s.attachRow}>
            <Text style={s.attachPlaceholder}>Add files</Text>
            <TouchableOpacity onPress={handleAddAttachment}>
              <Text style={s.attachLink}>Attach</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Create Task ── */}
        <TouchableOpacity
          style={[s.createBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={s.createBtnText}>{submitting ? 'Creating...' : 'Create Task'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ══════ Modals ══════ */}

      {/* Assignee Modal */}
      <Modal visible={showAssigneeModal} transparent animationType="fade" onRequestClose={() => setShowAssigneeModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalHeadTitle}>Select Team Members</Text>
              <TouchableOpacity onPress={() => setShowAssigneeModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={s.searchRow}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={s.searchInput}
                placeholder="Search employees..."
                placeholderTextColor="#9CA3AF"
                value={assigneeSearch}
                onChangeText={setAssigneeSearch}
              />
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {employees
                .filter(e => {
                  const term = assigneeSearch.trim().toLowerCase();
                  if (!term) return true;
                  const full = `${e.first_name} ${e.last_name}`.toLowerCase();
                  return full.includes(term) || (e.email?.toLowerCase().includes(term) ?? false);
                })
                .map(e => {
                  const checked = selectedAssigneeIds.includes(e.id);
                  return (
                    <TouchableOpacity key={e.id} style={s.optionRow} onPress={() => toggleAssignee(e.id)}>
                      <Text style={s.optionName}>{e.first_name} {e.last_name}</Text>
                      <View style={[s.checkBox, checked && s.checkBoxOn]}>
                        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAssigneeModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.applyBtn} onPress={() => setShowAssigneeModal(false)}>
                <Text style={s.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal visible={showLocationDropdown} transparent animationType="fade" onRequestClose={() => setShowLocationDropdown(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowLocationDropdown(false)}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalHeadTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationDropdown(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {['Office', 'Remote', 'Client Site', 'Hybrid'].map(loc => (
              <TouchableOpacity
                key={loc}
                style={s.optionRow}
                onPress={() => { setSelectedLocation(loc); setShowLocationDropdown(false); }}
              >
                <Text style={[s.optionName, selectedLocation === loc && { color: '#7C3AED', fontWeight: '600' }]}>
                  {loc}
                </Text>
                {selectedLocation === loc && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Project Modal */}
      <Modal visible={showProjectDropdown} transparent animationType="fade" onRequestClose={() => setShowProjectDropdown(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowProjectDropdown(false)}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalHeadTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setShowProjectDropdown(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={[s.optionRow, selectedProject?.id === project.id && { backgroundColor: '#F5F3FF' }]}
                  onPress={() => handleProjectSelect(project)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.optionName, selectedProject?.id === project.id && { color: '#7C3AED', fontWeight: '600' }]}>
                      {project.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{project.client_name}</Text>
                  </View>
                  {selectedProject?.id === project.id && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers */}
      {showTaskStartDatePicker && (
        <DateTimePicker value={taskStartDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleStartDateChange} />
      )}
      {showTaskEndDatePicker && (
        <DateTimePicker value={taskEndDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleEndDateChange} />
      )}
      {showTimeEntryDatePicker && (
        <DateTimePicker value={timeEntryDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowTimeEntryDatePicker(false); if (d) setTimeEntryDate(d); }} />
      )}
      {showStartTimePicker && (
        <DateTimePicker value={timeEntryStartTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, t) => { setShowStartTimePicker(false); if (t) setTimeEntryStartTime(t); }} />
      )}
      {showEndTimePicker && (
        <DateTimePicker value={timeEntryEndTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, t) => { setShowEndTimePicker(false); if (t) setTimeEntryEndTime(t); }} />
      )}

      {/* Time Tracking Modal */}
      <Modal visible={showTimeTrackingModal} animationType="slide" transparent onRequestClose={() => setShowTimeTrackingModal(false)}>
        <View style={s.sheetOverlay}>
          <View style={s.sheetContent}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Track Time</Text>
              <TouchableOpacity onPress={() => setShowTimeTrackingModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Total time tracked</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>{totalTrackedTime}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput
                  style={{ flex: 1, borderWidth: 2, borderColor: '#7C3AED', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 }}
                  value={isTimerRunning ? `${Math.floor(timerElapsed / 3600000)}h ${Math.floor((timerElapsed % 3600000) / 60000)}m` : timeEntryInput}
                  onChangeText={setTimeEntryInput}
                  placeholder="e.g., 2h 30m"
                  placeholderTextColor="#9CA3AF"
                  editable={!isTimerRunning}
                />
                <TouchableOpacity
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' }}
                  onPress={isTimerRunning ? handleStopTimer : handleStartTimer}
                >
                  <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} onPress={() => setShowTimeEntryDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={{ flex: 1, marginLeft: 8, fontSize: 14, color: '#6B7280' }}>Date</Text>
                <Text style={{ fontSize: 14, color: '#1F2937' }}>{timeEntryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Start Time</Text>
                  <TouchableOpacity style={{ backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => setShowStartTimePicker(true)}>
                    <Text style={{ fontSize: 14, color: '#1F2937' }}>{timeEntryStartTime ? timeEntryStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Start time'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>End Time</Text>
                  <TouchableOpacity style={{ backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => setShowEndTimePicker(true)}>
                    <Text style={{ fontSize: 14, color: '#1F2937' }}>{timeEntryEndTime ? timeEntryEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'End time'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={{ backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 }} onPress={handleAddManualTime}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
              {timeEntries.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 }}>Time Entries</Text>
                  {timeEntries.map(entry => (
                    <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{entry.userName.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>{entry.duration}</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>{entry.startTime} - {entry.endTime}</Text>
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{entry.date}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteTimeEntry(entry.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   StyleSheet — pixel-matched to the Figma design
   ═══════════════════════════════════════════════════ */

const s = StyleSheet.create({
  // ── Root ──
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // ── Header ──
  headerBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerSide: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── Loading / Empty ──
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyMsg: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },

  // ── Priority ──
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
  },

  // ── Generic field (dropdown) ──
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  fieldValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  fieldPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },

  // ── Field with icon (title / desc) ──
  fieldWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingRight: 4,
  },
  fieldDescWrap: {
    alignItems: 'flex-start',
    minHeight: 80,
  },
  fieldTextInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
  },
  fieldDescInput: {
    height: undefined,
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 14,
    paddingBottom: 14,
  },
  micBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Dates row ──
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  datePlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dateValue: {
    fontSize: 14,
    color: '#1F2937',
  },

  // ── Section (Team / Attachment) ──
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Team member row ──
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  memberRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
    lineHeight: 16,
  },
  removeX: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
    paddingHorizontal: 6,
  },

  // ── Attachment ──
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  attachPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  attachLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // ── Create button ──
  createBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Modal shared ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  optionName: {
    fontSize: 14,
    color: '#1F2937',
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxOn: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  applyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // ── Bottom sheet (time tracking) ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});
