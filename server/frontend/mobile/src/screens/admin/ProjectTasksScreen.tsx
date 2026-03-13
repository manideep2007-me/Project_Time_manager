import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { translateStatus, translatePriority } from '../../utils/translations';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import Card from '../../components/shared/Card';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Admin Project Tasks Screen - Updated

type TaskStatus = 'To Do' | 'Active' | 'Completed' | 'Cancelled' | 'On Hold';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  project_id: string;
  assigned_to: string;
  assigned_employees: Employee[];
  first_name: string;
  last_name: string;
  department: string;
  employee_email: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  // Optional aggregated metrics
  total_time_minutes?: number;
  total_cost?: number;
}

interface DepartmentGroup {
  department: string;
  tasks: Task[];
  totalHours: number;
  totalCost: number;
}

export default function ProjectTasksScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { projectId, projectName } = route.params || {};
  const { user } = useContext(AuthContext);

  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Task creation modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Status picker modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusSearch, setStatusSearch] = useState('');
  
  // Assignee selection modal state
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  // Form state
  const [taskName, setTaskName] = useState('');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [attachments, setAttachments] = useState<{uri: string, name: string, type: string}[]>([]);

  // Handle attachment picker
  const handlePickAttachment = async () => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        {
          text: 'Photo Library',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets) {
                const newAttachments = result.assets.map(asset => ({
                  uri: asset.uri,
                  name: asset.fileName || `image_${Date.now()}.jpg`,
                  type: 'image'
                }));
                setAttachments(prev => [...prev, ...newAttachments]);
              }
            } catch (error) {
              console.error('Image picker error:', error);
              Alert.alert('Error', 'Failed to pick image');
            }
          }
        },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setAttachments(prev => [...prev, {
                  uri: result.assets[0].uri,
                  name: `photo_${Date.now()}.jpg`,
                  type: 'image'
                }]);
              }
            } catch (error) {
              console.error('Camera error:', error);
              Alert.alert('Error', 'Failed to take photo');
            }
          }
        },
        {
          text: 'Documents',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                multiple: true,
              });
              if (!result.canceled && result.assets) {
                const newAttachments = result.assets.map(asset => ({
                  uri: asset.uri,
                  name: asset.name,
                  type: 'document'
                }));
                setAttachments(prev => [...prev, ...newAttachments]);
              }
            } catch (error) {
              console.error('Document picker error:', error);
              Alert.alert('Error', 'Failed to pick document');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const loadTeamMembers = async () => {
    try {
      console.log('Loading team members for project:', projectId);
      const response = await api.get(`/api/projects/${projectId}/team`);
      console.log('Team members response:', response.data);
      const members = response.data?.teamMembers || [];
      console.log('Loaded team members count:', members.length);
      return members;
    } catch (error) {
      console.error('Error loading team members:', error);
      return [];
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (!projectId) {
        setDepartmentGroups([]);
        return;
      }
      
      // Load tasks for this project with employee info
      console.log('🔍 Fetching tasks for project:', projectId);
      const response = await api.get(`/api/projects/${projectId}/tasks`, { params: { page: 1, limit: 100 } });
      
      console.log('📊 API Response:', JSON.stringify(response.data, null, 2));
      
      const tasks: Task[] = response.data.tasks || [];
      
      console.log('📋 Loaded tasks from API:', tasks.length);
      console.log('📋 Sample task data:', tasks[0]);
      
      if (tasks.length === 0) {
        console.warn('⚠️ No tasks found for this project');
      }
      
      // Load team members for department mapping
      const members = await loadTeamMembers();
      setTeamMembers(members);
      
      // Load time entries to calculate hours and cost per department
      const entriesResponse = await api.get('/api/time-entries', {
        params: { projectId, page: 1, limit: 1000 }
      });
      const timeEntries = entriesResponse.data?.timeEntries || [];
      
      // Debug: Log time entries to check cost values
      console.log('📊 Time entries loaded:', timeEntries.length);
      if (timeEntries.length > 0) {
        console.log('Sample time entry:', {
          id: timeEntries[0].id,
          task_id: timeEntries[0].task_id,
          duration_minutes: timeEntries[0].duration_minutes,
          cost: timeEntries[0].cost,
          costType: typeof timeEntries[0].cost
        });
      }
      
      // Group tasks by assigned employee's department
      // If a task has multiple assignees from different departments,
      // create a separate task entry for each department showing only that department's assignees
      const departmentMap = new Map<string, Task[]>();
      
      for (const task of tasks) {
        // If task has multiple assignees, split by department
        if (task.assigned_employees && task.assigned_employees.length > 0) {
          // Group assignees by their department
          const assigneesByDept = new Map<string, Employee[]>();
          
          task.assigned_employees.forEach(emp => {
            if (!assigneesByDept.has(emp.department)) {
              assigneesByDept.set(emp.department, []);
            }
            assigneesByDept.get(emp.department)!.push(emp);
          });
          
          // Create a separate task entry for each department
          assigneesByDept.forEach((deptAssignees, dept) => {
            if (!departmentMap.has(dept)) {
              departmentMap.set(dept, []);
            }
            
            // Create a new task object with only this department's assignees
            const taskForDept = {
              ...task,
              assigned_employees: deptAssignees
            };
            
            departmentMap.get(dept)!.push(taskForDept);
          });
        } else {
          // No assignees - put in Unassigned
          const dept = 'Unassigned';
          if (!departmentMap.has(dept)) {
            departmentMap.set(dept, []);
          }
          departmentMap.get(dept)!.push(task);
        }
      }
      
      console.log('📊 Department groups created:', Array.from(departmentMap.keys()));
      
      // Calculate totals for each department and per task
      const groups: DepartmentGroup[] = Array.from(departmentMap.entries()).map(([dept, deptTasks]) => {
        const deptEmployeeIds = deptTasks.map(t => t.assigned_to).filter(Boolean);
        
        // Calculate hours and cost for this department
        const deptEntries = timeEntries.filter((entry: any) => 
          deptEmployeeIds.includes(entry.employee_id)
        );
        
        const totalMinutes = deptEntries.reduce((sum: number, entry: any) => 
          sum + (entry.duration_minutes || 0), 0
        );
        const totalCost = deptEntries.reduce((sum: number, entry: any) => 
          sum + (entry.cost || 0), 0
        );
        
        // Calculate totals for each task
        const tasksWithTotals = deptTasks.map(task => {
          // Get time entries for this specific task
          const taskEntries = timeEntries.filter((entry: any) => 
            entry.task_id === task.id
          );
          
          const taskTotalMinutes = taskEntries.reduce((sum: number, entry: any) => 
            sum + (parseInt(entry.duration_minutes) || 0), 0
          );
          const taskTotalCost = taskEntries.reduce((sum: number, entry: any) => {
            // Handle both string and number cost values from PostgreSQL
            const cost = entry.cost != null ? parseFloat(String(entry.cost)) : 0;
            if (isNaN(cost)) {
              console.warn(`Invalid cost value for entry ${entry.id}:`, entry.cost);
              return sum;
            }
            return sum + cost;
          }, 0);
          
          return {
            ...task,
            total_time_minutes: taskTotalMinutes,
            total_cost: Math.round(taskTotalCost * 100) / 100,
          };
        });
        
        return {
          department: dept,
          tasks: tasksWithTotals,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          totalCost: Math.round(totalCost * 100) / 100,
        };
      });
      
      setDepartmentGroups(groups);
      console.log('✅ Final department groups:', groups.length, 'with', groups.reduce((sum, g) => sum + g.tasks.length, 0), 'total tasks');
    } catch (error) {
      console.error('❌ Error loading project tasks:', error);
      setDepartmentGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: TaskStatus | string) => {
    switch (status) {
      case 'Completed': return '#34C759';
      case 'Active': return '#877ED2';
      case 'Cancelled': return '#FF3B30';
      case 'On Hold': return '#FF9500';
      case 'To Do': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const handleEditTask = (taskId: string) => {
    navigation.navigate('TaskView', { taskId, projectId, projectName });
  };

  const handleAttachment = (taskId: string) => {
    Alert.alert('Attachments', 'View attachments functionality coming soon');
  };

  const handleAddTask = async (department: string) => {
    setSelectedDepartment(department);
    setShowTaskModal(true);
    // Load team members for the project
    const members = await loadTeamMembers();
    setTeamMembers(members);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    // Reset form
    setTaskName('');
    setLocation('');
    setAssignedTo('');
    setStartDate(new Date());
    setEndDate(new Date());
    setDescription('');
    setIsHighPriority(false);
    setShowLocationDropdown(false);
    setAttachments([]);
    setSelectedAssignees([]);
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    // Require at least 2 team members
    if (selectedAssignees.length < 2) {
      Alert.alert('Error', 'Please assign at least 2 team members to this task');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create task via API - send selectedAssignees array
      await api.post('/api/tasks', {
        project_id: projectId,
        title: taskName,
        status: 'todo',
        assigned_to: selectedAssignees,
        description: description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        high_priority: isHighPriority,
        location: location || null,
      });

      Alert.alert('Success', 'Task created successfully');
      handleCloseModal();
      loadData(); // Refresh tasks
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusClick = (task: Task) => {
    setSelectedTask(task);
    setStatusSearch('');
    setShowStatusModal(true);
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!selectedTask) return;

    try {
      await api.patch(`/api/tasks/${selectedTask.id}`, {
        status: newStatus
      });

      Alert.alert('Success', 'Task status updated successfully');
      setShowStatusModal(false);
      setSelectedTask(null);
      loadData(); // Refresh tasks
      
      // Navigate back and pass refresh flag
      console.log('✅ Navigating back with refresh flag...');
      navigation.navigate('ProjectDetails', { 
        id: projectId,
        refresh: Date.now() // Use timestamp to force refresh
      });
      
    } catch (error: any) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  // Map UI-friendly labels to backend-supported TaskStatus values
  const statusOptions: { value: TaskStatus; label: string; icon: string; color: string }[] = [
    { value: 'To Do', label: t('status.todo', 'TO DO').toUpperCase(), icon: '○', color: '#8E8E93' },
    { value: 'Active', label: t('status.active', 'ACTIVE').toUpperCase(), icon: '⟳', color: '#877ED2' },
    { value: 'Completed', label: t('status.completed', 'COMPLETED').toUpperCase(), icon: '●', color: '#34C759' },
    { value: 'Cancelled', label: t('status.cancelled', 'CANCELLED').toUpperCase(), icon: '●', color: '#FF3B30' },
    { value: 'On Hold', label: t('status.on_hold', 'ON HOLD').toUpperCase(), icon: '●', color: '#FF9500' },
  ];

  const filteredStatusOptions = statusOptions.filter(option =>
    option.label.toLowerCase().includes(statusSearch.toLowerCase())
  );

  const totalTasks = departmentGroups.reduce((sum, g) => sum + g.tasks.length, 0);

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor="#877ED2">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#877ED2">
      {/* Fixed Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle} numberOfLines={1}>{String(projectName || 'Project Tasks')}</Text>
        <TouchableOpacity onPress={() => handleAddTask('')} style={styles.headerActionBtn}>
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={departmentGroups.length === 0 ? styles.scrollContentEmpty : styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#877ED2" colors={['#877ED2']} />}
        showsVerticalScrollIndicator={false}
      >
        {departmentGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="clipboard-outline" size={48} color="#877ED2" />
            </View>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first task{"\n"}or pull down to refresh</Text>
          </View>
        ) : (
          departmentGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.departmentSection}>
              {/* Section Title */}
              <Text style={styles.sectionTitle}>{group.department}</Text>

              {/* Summary Row */}
              <View style={styles.summaryCards}>
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIconBg, { backgroundColor: '#F3F2FF' }]}> 
                    <Ionicons name="time-outline" size={16} color="#877ED2" />
                  </View>
                  <View>
                    <Text style={styles.summaryValue}>{group.totalHours}h</Text>
                    <Text style={styles.summaryLabel}>Hours</Text>
                  </View>
                </View>
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIconBg, { backgroundColor: '#E8FAF0' }]}> 
                    <Ionicons name="cash-outline" size={16} color="#34C759" />
                  </View>
                  <View>
                    <Text style={styles.summaryValue}>₹{group.totalCost.toLocaleString('en-IN')}</Text>
                    <Text style={styles.summaryLabel}>Cost</Text>
                  </View>
                </View>
              </View>

              {/* Task Cards */}
              {group.tasks.map((task) => {
                const statusColor = getStatusColor(task.status);
                return (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    onPress={() => handleEditTask(task.id)}
                    activeOpacity={0.7}
                  >
                    {/* Status badge at top */}
                    <View style={[styles.taskStatusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.taskStatusBadgeText}>{translateStatus(task.status, t)}</Text>
                    </View>

                    <Text style={styles.taskName} numberOfLines={2}>{task.title}</Text>

                    {/* Assignee */}
                    <View style={styles.taskMetaRow}>
                      <Ionicons name="person-outline" size={14} color="#8E8E93" />
                      <Text style={styles.taskMetaText} numberOfLines={1}>
                        {task.assigned_employees && task.assigned_employees.length > 0
                          ? task.assigned_employees.map(emp => `${emp.first_name} ${emp.last_name}`).join(', ')
                          : 'Unassigned'}
                      </Text>
                    </View>

                    {/* Dates row */}
                    <View style={styles.taskDatesRow}>
                      <View style={styles.taskDateItem}>
                        <Text style={styles.taskDateLabel}>Start</Text>
                        <Text style={styles.taskDateValue}>
                          {task.created_at
                            ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '-'}
                        </Text>
                      </View>
                      <View style={styles.taskDateItem}>
                        <Text style={styles.taskDateLabel}>Due</Text>
                        <Text style={styles.taskDateValue}>
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '-'}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.taskFooter}>
                      <View style={styles.taskFooterStats}>
                        <Ionicons name="time-outline" size={13} color="#877ED2" />
                        <Text style={styles.taskFooterText}>
                          {task.total_time_minutes
                            ? `${Math.floor(task.total_time_minutes / 60)}h ${task.total_time_minutes % 60}m`
                            : '0h'}
                        </Text>
                        <View style={styles.taskFooterDot} />
                        <Ionicons name="cash-outline" size={13} color="#34C759" />
                        <Text style={styles.taskFooterText}>
                          ₹{task.total_cost ? task.total_cost.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                        </Text>
                      </View>
                      <View style={styles.taskFooterActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleStatusClick(task)}
                        >
                          <Ionicons name="swap-horizontal" size={15} color="#877ED2" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditTask(task.id)}
                        >
                          <Ionicons name="create-outline" size={15} color="#877ED2" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.createTaskScreen}>
          {/* Header */}
          <View style={styles.createTaskHeader}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.createTaskTitle}>Create New Task</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.createTaskContent} showsVerticalScrollIndicator={false}>
            {/* High Priority Toggle */}
            <View style={styles.priorityRow}>
              <Text style={styles.priorityLabel}>High Priority</Text>
              <TouchableOpacity 
                style={[styles.toggleSwitch, isHighPriority && styles.toggleSwitchActive]}
                onPress={() => setIsHighPriority(!isHighPriority)}
              >
                <View style={[styles.toggleKnob, isHighPriority && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

            {/* Select Project (read-only) */}
            <View style={styles.inputField}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>{projectName || 'Select Project*'}</Text>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </View>
            </View>

            {/* Task Title */}
            <View style={styles.inputFieldRow}>
              <View style={styles.inputFieldFlex}>
                <TextInput
                  style={styles.textInputBordered}
                  placeholder="Task Title"
                  value={taskName}
                  onChangeText={setTaskName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <VoiceToTextButton
                onResult={(text) => setTaskName(prev => prev ? `${prev} ${text}` : text)}
                size="small"
                color="#877ED2"
              />
            </View>

            {/* Description */}
            <View style={styles.inputFieldRow}>
              <View style={styles.inputFieldFlex}>
                <TextInput
                  style={styles.textAreaBordered}
                  placeholder="Description*"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <VoiceToTextButton
                onResult={(text) => setDescription(prev => prev ? `${prev} ${text}` : text)}
                size="small"
                color="#877ED2"
                style={styles.voiceButtonTop}
              />
            </View>

            {/* Start and End Date Row */}
            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={styles.dateField}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={[styles.dateFieldText, !startDate && styles.placeholderText]}>
                  {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start*'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#877ED2" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dateField}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[styles.dateFieldText, !endDate && styles.placeholderText]}>
                  {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'End*'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#877ED2" />
              </TouchableOpacity>
            </View>

            {/* Location Dropdown */}
            <TouchableOpacity 
              style={styles.inputField}
              onPress={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <View style={styles.inputContainer}>
                <Text style={[styles.inputText, !location && styles.placeholderText]}>
                  {location || 'Location'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </View>
            </TouchableOpacity>
            
            {showLocationDropdown && (
              <View style={styles.dropdownList}>
                {['At Site', 'Factory', 'Office', 'Remote'].map((loc) => (
                  <TouchableOpacity 
                    key={loc}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setLocation(loc);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Team Section */}
            <View style={styles.teamSection}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamTitle}>Team ({selectedAssignees.length})</Text>
                <TouchableOpacity 
                  style={styles.addTeamButton}
                  onPress={() => setShowAssigneeModal(true)}
                >
                  <Ionicons name="add" size={20} color="#877ED2" />
                </TouchableOpacity>
              </View>
              
              {selectedAssignees.length > 0 && teamMembers.filter(m => selectedAssignees.includes(m.id)).map((member) => (
                <View key={member.id} style={styles.teamMemberRow}>
                  <View style={styles.teamMemberInfo}>
                    <View style={styles.teamMemberAvatar}>
                      <Text style={styles.teamMemberInitials}>
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.teamMemberName}>{member.first_name} {member.last_name}</Text>
                      <Text style={styles.teamMemberRole}>{member.department || 'Team Member'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setSelectedAssignees(prev => prev.filter(id => id !== member.id))}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Attachment Section */}
            <View style={styles.attachmentSection}>
              <Text style={styles.attachmentTitle}>Attachment ({attachments.length})</Text>
              
              {attachments.length > 0 && (
                <View style={styles.attachmentPreviewRow}>
                  {attachments.map((att, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.attachmentPreview}
                      onPress={() => {
                        Alert.alert(
                          'Remove Attachment',
                          `Remove ${att.name}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => setAttachments(prev => prev.filter((_, i) => i !== idx)) }
                          ]
                        );
                      }}
                    >
                      {att.type === 'image' ? (
                        <Image source={{ uri: att.uri }} style={styles.attachmentImage} />
                      ) : (
                        <Ionicons name="document" size={40} color="#8E8E93" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View style={styles.addFilesRow}>
                <Text style={styles.addFilesText}>Add files</Text>
                <TouchableOpacity onPress={handlePickAttachment}>
                  <Text style={styles.attachButtonText}>Attach</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createTaskButton, submitting && styles.createTaskButtonDisabled]}
              onPress={handleCreateTask}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createTaskButtonText}>Create Task</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

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
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.statusModalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.statusModalContent}>
            <Text style={styles.statusModalTitle}>Change Status</Text>
            <View style={styles.statusSearchContainer}>
              <TextInput
                style={styles.statusSearchInput}
                placeholder="Search..."
                value={statusSearch}
                onChangeText={setStatusSearch}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <ScrollView style={styles.statusList}>
              {filteredStatusOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.statusOption,
                    selectedTask?.status === option.value && styles.statusOptionActive
                  ]}
                  onPress={() => handleStatusChange(option.value as TaskStatus)}
                >
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusOptionDot, { backgroundColor: option.color }]} />
                    <Text style={styles.statusOptionLabel}>{option.label}</Text>
                  </View>
                  {selectedTask?.status === option.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#877ED2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assignee Selection Modal */}
      <Modal
        visible={showAssigneeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssigneeModal(false)}
      >
        <View style={styles.assigneeModalOverlay}>
          <View style={styles.assigneeModalContent}>
            <View style={styles.assigneeModalHeader}>
              <Text style={styles.assigneeModalTitle}>Select Assignees</Text>
              <TouchableOpacity onPress={() => setShowAssigneeModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.assigneeSearchContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.assigneeSearchIcon} />
              <TextInput
                style={styles.assigneeSearchInput}
                placeholder="Search employees..."
                value={assigneeSearch}
                onChangeText={setAssigneeSearch}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <ScrollView style={styles.assigneeList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {teamMembers
                .filter(member => 
                  `${member.first_name} ${member.last_name}`.toLowerCase().includes(assigneeSearch.toLowerCase())
                )
                .map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.assigneeOption}
                    onPress={() => {
                      setSelectedAssignees(prev => 
                        prev.includes(member.id)
                          ? prev.filter(id => id !== member.id)
                          : [...prev, member.id]
                      );
                    }}
                  >
                    <Text style={styles.assigneeName}>
                      {member.first_name} {member.last_name}
                    </Text>
                    <View style={[
                      styles.assigneeCheckbox,
                      selectedAssignees.includes(member.id) && styles.assigneeCheckboxChecked
                    ]}>
                      {selectedAssignees.includes(member.id) && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.assigneeModalFooter}>
              <TouchableOpacity
                style={styles.assigneeCancelButton}
                onPress={() => setShowAssigneeModal(false)}
              >
                <Text style={styles.assigneeCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.assigneeApplyButton}
                onPress={() => setShowAssigneeModal(false)}
              >
                <Text style={styles.assigneeApplyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 20,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#877ED2',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // ── Header ──────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#877ED2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero Extension (Figma rounded purple area) ─────
  heroExtension: {
    height: 100,
    backgroundColor: '#877ED2',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  // ── Project Info Card (overlaps hero) ───────────────
  projectInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -70,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  projectInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  projectStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  projectStat: {
    flex: 1,
    alignItems: 'center',
  },
  projectStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  projectStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  projectStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },

  // ── Empty State ─────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Department Section ──────────────────────────────
  departmentSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 14,
  },

  // ── Summary Cards ───────────────────────────────────
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // ── Task Card ───────────────────────────────────────
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  taskStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  taskStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  taskMetaText: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  taskDatesRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  taskDateItem: {},
  taskDateLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  taskDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  taskFooterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  taskFooterDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 2,
  },
  taskFooterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Status Modal ────────────────────────────────────
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '80%',
    maxWidth: 300,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusSearchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusSearchInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
  },
  statusList: {
    maxHeight: 300,
    paddingHorizontal: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusOptionActive: {
    backgroundColor: '#F3F2FF',
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionLabel: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },

  // ── Assignee Modal ──────────────────────────────────
  assigneeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  assigneeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  assigneeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assigneeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  assigneeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  assigneeSearchIcon: {
    marginRight: 8,
  },
  assigneeSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
  },
  assigneeList: {
    maxHeight: 400,
  },
  assigneeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  assigneeName: {
    fontSize: 15,
    color: '#000000',
  },
  assigneeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeCheckboxChecked: {
    backgroundColor: '#877ED2',
    borderColor: '#877ED2',
  },
  assigneeModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  assigneeCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
  },
  assigneeCancelButtonText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
  },
  assigneeApplyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#877ED2',
  },
  assigneeApplyButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ── Create Task Screen ──────────────────────────────
  createTaskScreen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  createTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#877ED2',
  },
  backButton: {
    padding: 4,
  },
  createTaskTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createTaskContent: {
    flex: 1,
    padding: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D1D6',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#877ED2',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  inputField: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    fontSize: 15,
    color: '#000000',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  inputFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  inputFieldFlex: {
    flex: 1,
  },
  textInputBordered: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
  },
  textAreaBordered: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  voiceButtonTop: {
    marginTop: 8,
  },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateFieldText: {
    fontSize: 15,
    color: '#000000',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    marginTop: -8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#000000',
  },

  // ── Team Section (Create Task) ──────────────────────
  teamSection: {
    marginBottom: 20,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  addTeamButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  teamMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamMemberInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#877ED2',
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  teamMemberRole: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // ── Attachment Section ──────────────────────────────
  attachmentSection: {
    marginBottom: 24,
  },
  attachmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  attachmentPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  attachmentPreview: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  addFilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addFilesText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  attachButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#877ED2',
  },

  // ── Create Task Button ──────────────────────────────
  createTaskButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  createTaskButtonDisabled: {
    opacity: 0.5,
  },
  createTaskButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
