import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Modal,
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { translateStatus, translatePriority } from '../../utils/translations';
import { tokens } from '../../design/tokens';
const { colors, spacing, radii, typography } = tokens;
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { useActivity } from '../../context/ActivityContext';
import { dashboardApi, dashboardHelpers, Project, TimeEntry } from '../../api/dashboard';
import { getEmployeeTasks, updateTask } from '../../api/endpoints';
import { api } from '../../api/client';
import Card from '../../components/shared/Card';
import AppHeader from '../../components/shared/AppHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Task types
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
  project_name: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  assigned_employees?: Employee[];
  // Legacy fields (backward compatibility)
  assigned_to?: string;
  first_name?: string;
  last_name?: string;
  priority?: string;
}

export default function EmployeeDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { addActivity, getRecentActivities } = useActivity();
  
  // Employee Dashboard State
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [weekTimeEntries, setWeekTimeEntries] = useState<TimeEntry[]>([]);
  const [allTimeEntries, setAllTimeEntries] = useState<TimeEntry[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task creation modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  // Assignee selection modal state
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  // Form state
  const [taskName, setTaskName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [attachments, setAttachments] = useState<{uri: string, name: string, type: string}[]>([]);

  // Stable sorting helpers to avoid reshuffling on each render/reload
  const sortProjects = (projects: Project[]): Project[] => {
    return [...projects].sort((a, b) => {
      const byName = (a.name || '').localeCompare(b.name || '');
      if (byName !== 0) return byName;
      const aCreated = (a as any).created_at || '';
      const bCreated = (b as any).created_at || '';
      return String(aCreated).localeCompare(String(bCreated));
    });
  };

  const sortTimeEntries = (entries: TimeEntry[]): TimeEntry[] => {
    return [...entries].sort((a, b) => {
      const aTime = new Date(a.start_time || (a as any).created_at || 0).getTime();
      const bTime = new Date(b.start_time || (b as any).created_at || 0).getTime();
      return bTime - aTime; // newest first
    });
  };

  // No cache: always load from DB

  const loadEmployeeData = async () => {
    try {
      console.log('Loading employee data for user:', user?.id);
      
      if (!user?.id) {
        setError('User not authenticated. Please log in again.');
        return;
      }
      
      setError(null);
      
      // Load assigned projects
      console.log('Fetching assigned projects...');
      const projectsData = await dashboardApi.getAssignedProjects();
      console.log('Projects data:', projectsData);
      const stableProjects = sortProjects(projectsData || []);
      setAssignedProjects(stableProjects);
      
      // Load user's time entries
      console.log('Fetching time entries for user:', user.id);
      const timeEntriesData = await dashboardApi.getUserTimeEntries(user.id, { limit: 100 });
      console.log('Time entries data:', timeEntriesData);
      const stableEntries = sortTimeEntries(timeEntriesData?.timeEntries || []);
      setAllTimeEntries(stableEntries);
      
      // Get this week's data (starting from Sunday)
      const todayDate = new Date();
      const sunday = new Date(todayDate);
      sunday.setDate(todayDate.getDate() - todayDate.getDay()); // getDay() returns 0 for Sunday
      const sundayStr = sunday.toISOString().split('T')[0];
      
      const weekEntries = dashboardHelpers.getTimeEntriesForWeek(stableEntries, sundayStr);
      setWeekTimeEntries(weekEntries);

      // Load user's tasks
      console.log('Fetching user tasks for user:', user.id);
      try {
        const tasksData = await getEmployeeTasks(user.id, 1, 50);
        console.log('Tasks data:', tasksData);
        setMyTasks(tasksData.tasks || []);
      } catch (taskError) {
        console.error('Error fetching tasks:', taskError);
        setMyTasks([]);
      }

      console.log('Employee data loaded successfully');
      
    } catch (error) {
      console.error('Error loading employee data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data. Please try again.';
      setError(errorMessage);
    }
  };

  useEffect(() => {
    loadEmployeeData().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployeeData();
    setRefreshing(false);
  };

  // Utility functions
  const getWeekTotalHours = () => {
    const hours = dashboardHelpers.calculateTotalHours(weekTimeEntries);
    // Round to whole number for display
    return Math.round(hours);
  };

  const getWeekDateRange = () => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay()); // shift to Sunday
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6); // Saturday is 6 days after Sunday
    
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      return `${day} ${month}`;
    };
    
    return `${formatDate(sunday)} - ${formatDate(saturday)}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#FF3B30';
      case 'Medium': return '#FF9500';
      case 'Low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#34C759';
      case 'active': return '#007AFF';
      case 'on_hold': return '#FF9500';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return '#34C759';
      case 'Active': return '#877ED2';
      case 'Cancelled': return '#FF3B30';
      case 'On Hold': return '#FF9500';
      case 'To Do': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getTaskStatusText = (status: TaskStatus) => {
    return translateStatus(status, t);
  };

  const formatTaskDueDate = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const formatTaskDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    // Add comma after month: "16 Nov 2025" -> "16 Nov, 2025"
    return formatted.replace(/(\w+)\s+(\d{4})/, '$1, $2');
  };

  const formatTaskAssignedDate = (assignedDate: string) => {
    if (!assignedDate) return 'Unknown';
    return formatTaskDate(assignedDate);
  };

  const getAssignedEmployeeName = (task: Task) => {
    if (task.assigned_employees && task.assigned_employees.length > 0) {
      const emp = task.assigned_employees[0];
      return `${emp.first_name} ${emp.last_name}`.trim();
    }
    if (task.first_name && task.last_name) {
      return `${task.first_name} ${task.last_name}`.trim();
    }
    return 'Unassigned';
  };

  const getTaskLocation = (task: Task, projects: Project[]) => {
    const project = projects.find(p => p.id === task.project_id);
    return (project as any)?.location || '';
  };

  

  const handleStartTracking = (projectId: string) => {
    // Navigate to time tracking with pre-selected project
    navigation.navigate('TimeEntries', { projectId });
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      
      // Update local state
      setMyTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Add activity
      addActivity({
        type: 'task_status',
        description: `Updated task status to ${getTaskStatusText(newStatus)}`,
        userId: String(user?.id || ''),
        taskName: taskId,
        status: newStatus,
      });
      
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

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

  const loadTeamMembers = async (projectId: string) => {
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

  const handleAddTask = async () => {
    setShowTaskModal(true);
    // Reset form
    setTaskName('');
    setLocation('');
    setStartDate(new Date());
    setEndDate(new Date());
    setDescription('');
    setIsHighPriority(false);
    setShowLocationDropdown(false);
    setAttachments([]);
    setSelectedAssignees([]);
    setSelectedProject('');
    setSelectedProjectName('');
    setTeamMembers([]);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    // Reset form
    setTaskName('');
    setLocation('');
    setStartDate(new Date());
    setEndDate(new Date());
    setDescription('');
    setIsHighPriority(false);
    setShowLocationDropdown(false);
    setAttachments([]);
    setSelectedAssignees([]);
    setSelectedProject('');
    setSelectedProjectName('');
  };

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project.id);
    setSelectedProjectName(project.name);
    setShowProjectDropdown(false);
    // Load team members for the selected project
    const members = await loadTeamMembers(project.id);
    setTeamMembers(members);
    setSelectedAssignees([]);
  };

  const handleCreateTask = async () => {
    if (!selectedProject) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

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
        project_id: selectedProject,
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
      loadEmployeeData(); // Refresh tasks
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEmployeeData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // DESIGN: New dashboard layout with purple header, attendance card, horizontal sections
  const { colors, spacing, radii, typography, layout } = tokens;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Exact Header Layout */}
        <View style={styles.heroHeader}>
          <View style={styles.headerInner}>
            <Text style={styles.headerDateTop}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </Text>
            <View style={styles.headerRowBelowDate}>
              <View style={styles.avatarCircleLeft}>
                <Text style={styles.avatarInitial}>{(user?.firstName || user?.name || 'E')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.heroGreeting}>Hello {(user?.firstName || user?.name?.split(' ')[0] || 'Employee')}!</Text>
                <Text style={styles.heroSubGreeting}>Good Morning</Text>
                <Text style={styles.heroMeta}>{[user?.jobTitle, user?.role].filter(Boolean).join(' | ')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Card slight overlap below header */}
        <View style={styles.attendanceWrapper}>
          <Card style={styles.attendanceCard}>
            <View style={styles.attendanceContent}>
              <View style={styles.attendanceIconContainer}>
                <Ionicons name="calendar-outline" size={28} color="#877ED2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attendanceTitle}>Mark your attendance</Text>
                <Text style={styles.attendanceTime}>9 AM - 5 PM</Text>
              </View>
              <TouchableOpacity
                style={styles.attendanceButton}
                onPress={() => navigation.navigate('ProofOfWorkCapture')}
              >
                <Text style={styles.attendanceButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Projects Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.dashboardSectionTitle}>Projects</Text>
            <TouchableOpacity style={styles.sectionActionRow} onPress={() => navigation.navigate('EmployeeProjects')}>
              <Text style={styles.sectionAction}>All</Text>
              <Ionicons name="chevron-forward" size={20} color="#8F8F8F" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectsHorizontalList}>
            {assignedProjects.slice(0, 5).map(project => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => navigation.navigate('EmployeeProjectDetails', { id: project.id })}
              >
                <View style={styles.projectCardBorder} />
                <View style={styles.projectCardContent}>
                  <Text style={styles.projectCardName} numberOfLines={1}>{project.name}</Text>
                  <Text style={styles.projectCardLocation} numberOfLines={1}>{(project as any).location || 'No location'}</Text>
                  <View style={styles.projectCardDatesRow}>
                    <Text style={styles.projectCardDateLabel}>Start </Text>
                    <Text style={styles.projectCardDateValue}>
                      {(project as any).start_date 
                        ? new Date((project as any).start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')
                        : '—'}
                    </Text>
                    <Text style={styles.projectCardDateLabel}>  End </Text>
                    <Text style={styles.projectCardDateValue}>
                      {(project as any).end_date 
                        ? new Date((project as any).end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')
                        : '—'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {assignedProjects.length === 0 && (
              <View style={[styles.miniCardEmpty, { width: layout?.projectCardWidth || 200 }]}> 
                <Text style={styles.emptyMiniText}>No projects assigned</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Tasks Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.dashboardSectionTitle}>Task</Text>
            <TouchableOpacity style={styles.sectionActionRow} onPress={() => navigation.navigate('EmployeeAllTasks')}>
              <Text style={styles.sectionAction}>All</Text>
              <Ionicons name="chevron-forward" size={20} color="#8F8F8F" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {myTasks.slice(0, 8).map(task => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskMiniCard, { width: 200 }]}
                onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
              >
                <View style={styles.taskBadgeRow}>
                  <View style={[styles.smallStatusBadge, { backgroundColor: getTaskStatusColor(task.status) }]}>
                    <Text style={styles.smallStatusText}>{getTaskStatusText(task.status)}</Text>
                  </View>
                </View>
                {getTaskLocation(task, assignedProjects) && (
                  <Text style={styles.taskLocation} numberOfLines={1}>{getTaskLocation(task, assignedProjects)}</Text>
                )}
                <Text style={styles.taskMiniTitle} numberOfLines={2}>{task.title}</Text>
                <View style={styles.taskDateRow}>
                  <View style={styles.taskDateItem}>
                    <Text style={styles.taskDateLabel}>Assigned date</Text>
                    <Text style={styles.taskDateValue}>{formatTaskAssignedDate(task.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.taskDateRow}>
                  <View style={styles.taskDateItem}>
                    <Text style={styles.taskDateLabel}>Due date</Text>
                    <Text style={styles.taskDateValue}>{formatTaskDate(task.due_date)}</Text>
                  </View>
                </View>
                <View style={styles.taskFooterIcons}>
                  <View style={styles.iconStat}><Ionicons name="people-outline" size={16} color={colors.textSecondary} /><Text style={styles.iconStatText}>{(task.assigned_employees||[]).length || 0}</Text></View>
                  <View style={styles.iconStat}><Ionicons name="document-text-outline" size={16} color={colors.textSecondary} /><Text style={styles.iconStatText}>0</Text></View>
                </View>
              </TouchableOpacity>
            ))}
            {myTasks.length === 0 && (
              <View style={[styles.miniCardEmpty, { width: layout.taskCardWidth }]}> 
                <Text style={styles.emptyMiniText}>No tasks yet</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Productivity Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.dashboardSectionTitle}>Productivity</Text>
            <TouchableOpacity style={styles.sectionActionRow} onPress={() => navigation.navigate('TimeEntries')}>
              <Text style={styles.sectionAction}>All</Text>
              <Ionicons name="chevron-forward" size={20} color="#8F8F8F" />
            </TouchableOpacity>
          </View>
          <Card style={styles.productivityCard}>
            <View style={styles.productivityContent}>
              <View style={styles.productivityTextColumn}>
                <View style={styles.productivityInfoRow}>
                  <Text style={styles.productivityInfoLabel}>This week</Text>
                  <Text style={styles.productivityDateValue}>{getWeekDateRange()}</Text>
                </View>
                <View style={styles.productivityInfoRow}>
                  <Text style={styles.productivityInfoLabel}>Time worked</Text>
                  <View style={styles.hoursContainer}>
                    <Text style={styles.hoursNumber}>{getWeekTotalHours()}</Text>
                    <Text style={styles.hoursUnit}> hr</Text>
                    <Text style={styles.hoursDivider}>/</Text>
                    <Text style={styles.hoursUnit}>5 d</Text>
                  </View>
                </View>
                <View style={styles.productivityInfoRow}>
                  <Text style={styles.productivityInfoLabel}>Task</Text>
                  <Text style={styles.productivityTaskValue}>{myTasks.length}</Text>
                </View>
              </View>
              <View style={styles.productivityBars}>
                {(() => {
                  // Build week days array (Sun-Sat) with actual time entry data
                  const today = new Date();
                  const sunday = new Date(today);
                  sunday.setDate(today.getDate() - today.getDay()); // shift to Sunday
                  
                  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  
                  const days = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date(sunday);
                    d.setDate(sunday.getDate() + i);
                    const dateKey = d.toISOString().split('T')[0];
                    const day = dayAbbreviations[d.getDay()];
                    const date = d.getDate().toString();
                    
                    // Calculate hours for this day from time entries
                    const dayEntries = weekTimeEntries.filter(entry => {
                      const entryDate = new Date(entry.start_time || entry.created_at || '').toISOString().split('T')[0];
                      return entryDate === dateKey;
                    });
                    
                    let hours = dashboardHelpers.calculateTotalHours(dayEntries);
                    // Round to whole number for display
                    hours = Math.round(hours);
                    
                    return { day, date, hours, dateKey };
                  });
                  
                  const maxHours = Math.max(...days.map(d => d.hours), 8); // minimum 8 for proper scaling
                  
                  return days.map((item, index) => {
                    const isWeekend = item.day === 'Sun' || item.day === 'Sat';
                    // Force weekends to 0 hours (holidays)
                    const displayHours = isWeekend ? 0 : item.hours;
                    const barHeightPercent = maxHours > 0 && displayHours > 0 ? (displayHours / maxHours) * 100 : 0;
                    // Calculate actual height in pixels (71px is the full bar height)
                    const fillHeight = displayHours > 0 ? Math.max((barHeightPercent / 100) * 71, 8) : 0;
                    
                    return (
                      <View key={index} style={styles.barContainer}>
                        {displayHours === 0 ? (
                          <View style={styles.barCountCircle}>
                            <Text style={styles.barCountZeroText}>{displayHours}</Text>
                          </View>
                        ) : (
                          <Text style={styles.barCount}>{displayHours}</Text>
                        )}
                        <View style={styles.barWrapper}>
                          <View style={styles.barBackground} />
                          {displayHours > 0 && (
                            <View 
                              style={[
                                styles.barFill, 
                                { height: fillHeight }
                              ]} 
                            />
                          )}
                        </View>
                        <Text style={styles.barDay}>{item.day}</Text>
                        <Text style={styles.barDate}>{item.date}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          </Card>
        </View>

        {/* Add Task Button */}
        <View style={styles.addTaskButtonContainer}>
          <TouchableOpacity style={styles.addTaskButtonLarge} onPress={handleAddTask}>
            <Text style={styles.addTaskButtonLargeText}>Add Task</Text>
          </TouchableOpacity>
        </View>
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
              <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.createTaskTitle}>Create New Task</Text>
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#1C1C1E" />
            </TouchableOpacity>
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

            {/* Select Project Dropdown */}
            <TouchableOpacity 
              style={styles.inputField}
              onPress={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <View style={styles.inputContainer}>
                <Text style={[styles.inputText, !selectedProjectName && styles.placeholderText]}>
                  {selectedProjectName || 'Select Project*'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            {showProjectDropdown && (
              <View style={styles.dropdownList}>
                {assignedProjects.map((project) => (
                  <TouchableOpacity 
                    key={project.id}
                    style={styles.dropdownItem}
                    onPress={() => handleProjectSelect(project)}
                  >
                    <Text style={styles.dropdownItemText}>{project.name}</Text>
                  </TouchableOpacity>
                ))}
                {assignedProjects.length === 0 && (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.placeholderText}>No projects assigned</Text>
                  </View>
                )}
              </View>
            )}

            {/* Task Title */}
            <View style={styles.inputFieldRow}>
              <View style={styles.inputFieldFlex}>
                <TextInput
                  style={styles.textInputBordered}
                  placeholder="Task Title"
                  value={taskName}
                  onChangeText={setTaskName}
                  placeholderTextColor="#8E8E93"
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
                  placeholderTextColor="#8E8E93"
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
            <View style={styles.teamSectionModal}>
              <View style={styles.teamHeaderModal}>
                <Text style={styles.teamTitleModal}>Team ({selectedAssignees.length})</Text>
                <TouchableOpacity 
                  style={styles.addTeamButtonModal}
                  onPress={() => setShowAssigneeModal(true)}
                >
                  <Ionicons name="add" size={20} color="#877ED2" />
                </TouchableOpacity>
              </View>
              
              {/* Selected Team Members */}
              {selectedAssignees.length > 0 && teamMembers.filter(m => selectedAssignees.includes(m.id)).map((member) => (
                <View key={member.id} style={styles.teamMemberRowModal}>
                  <View style={styles.teamMemberInfoModal}>
                    <View style={styles.teamMemberAvatarModal}>
                      <Text style={styles.teamMemberInitialsModal}>
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.teamMemberNameModal}>{member.first_name} {member.last_name}</Text>
                      <Text style={styles.teamMemberRoleModal}>{member.department || 'Team Member'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setSelectedAssignees(prev => prev.filter(id => id !== member.id))}
                  >
                    <Ionicons name="close" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Attachment Section */}
            <View style={styles.attachmentSectionModal}>
              <Text style={styles.attachmentTitleModal}>Attachment ({attachments.length})</Text>
              
              {attachments.length > 0 && (
                <View style={styles.attachmentPreviewRowModal}>
                  {attachments.map((att, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.attachmentPreviewModal}
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
                        <Image source={{ uri: att.uri }} style={styles.attachmentImageModal} />
                      ) : (
                        <Ionicons name="document" size={40} color="#8E8E93" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View style={styles.addFilesRowModal}>
                <Text style={styles.addFilesTextModal}>Add files</Text>
                <TouchableOpacity onPress={handlePickAttachment}>
                  <Text style={styles.attachButtonTextModal}>Attach</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createTaskButtonModal, submitting && styles.createTaskButtonDisabledModal]}
              onPress={handleCreateTask}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createTaskButtonTextModal}>Create Task</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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

      {/* Assignee Selection Modal */}
      <Modal
        visible={showAssigneeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssigneeModal(false)}
      >
        <View style={styles.assigneeModalOverlay}>
          <View style={styles.assigneeModalContent}>
            {/* Header */}
            <View style={styles.assigneeModalHeader}>
              <Text style={styles.assigneeModalTitle}>Select Assignees</Text>
              <TouchableOpacity onPress={() => setShowAssigneeModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.assigneeSearchContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.assigneeSearchIcon} />
              <TextInput
                style={styles.assigneeSearchInput}
                placeholder="Search employees..."
                value={assigneeSearch}
                onChangeText={setAssigneeSearch}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Employee List */}
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
              {teamMembers.length === 0 && (
                <View style={styles.assigneeOption}>
                  <Text style={styles.placeholderText}>Select a project first to see team members</Text>
                </View>
              )}
            </ScrollView>

            {/* Footer Buttons */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroHeader: {
    backgroundColor: '#877ED2', 
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 38,
    height: 200,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerInner: {
    position: 'relative',
    flexDirection: 'column',
    width: '100%',
  },
  leftWithAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  textBlock: {
    flexShrink: 1,
    paddingTop: 2,
  },
  textOnlyBlock: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: typography.families.bold,
  },
  heroSubGreeting: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: typography.families.regular,
  },
  headerDateTop: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 6,
    fontFamily: typography.families.medium,
  },
  headerRowBelowDate: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  heroMeta: {
    fontSize: 10,
    color: '#E8E7ED',
    fontWeight: '400',
    fontFamily: typography.families.regular,
    textTransform: 'uppercase',
  },
  avatarPlaceholder: {
    display: 'none',
  },
  avatarCircle: {
    position: 'absolute',
    right: 18,
    top: 22,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleLeft: {
    width: 41,
    height: 41,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 6,
    marginBottom: 24,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  attendanceWrapper: {
    marginTop: -55,
    paddingHorizontal: 18,
  },
  attendanceCard: {
    height: 69,
    width: 372,
    padding: spacing.lg + 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#877ED2',
    shadowOpacity: 0.15,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
  },
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  attendanceIconContainer: {
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#F3F2FF',
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#404040',
    fontFamily: typography.families.medium,
  },
  attendanceTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#727272',
    fontFamily: typography.families.regular,
    marginTop: 4,
  },
  attendanceButton: {
    backgroundColor: '#877ED2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    width: 81,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: typography.families.medium,
  },
  sectionBlock: {
    paddingTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dashboardSectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    fontFamily: typography.families.medium,
  },
  sectionAction: {
    fontSize: 16,
    color: '#8F8F8F',
    fontFamily: typography.families.regular,
    fontWeight: '400',
  },
  sectionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 12,
    paddingBottom: 10,
    paddingTop: 10,
  },
  projectsHorizontalList: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 12,
    paddingBottom: 10,
    paddingTop: 10,
    justifyContent: 'center',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 280,
    height: 90,
    marginRight: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  projectCardBorder: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  projectCardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  projectCardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#404040',
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
  },
  projectCardLocation: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '400',
    fontFamily: typography.families.regular,
    lineHeight: 14,
    marginTop: -2,
  },
  projectCardDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginTop: 2,
  },
  projectCardDateLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '400',
    fontFamily: typography.families.regular,
  },
  projectCardDateValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: typography.families.medium,
  },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: 332,
    height: 95,
    marginRight: 12,
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E6EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  miniCardContent: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  miniCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#404040',
    marginBottom: 4,
    fontFamily: typography.families.medium,
    lineHeight: 22,
    textAlign: 'left',
  },
  miniCardMeta: {
    fontSize: 10,
    color: '#727272',
    fontWeight: '400',
    marginBottom: 6,
    fontFamily: typography.families.regular,
    textAlign: 'left',
  },
  miniCardDates: {
    fontSize: 10,
    color: '#727272',
    fontWeight: '400',
    fontFamily: typography.families.regular,
    lineHeight: 18,
    textAlign: 'left',
  },
  miniCardDateValue: {
    fontWeight: '500',
    fontFamily: typography.families.medium,
    fontSize: 12,
    color: '#404040',
  },
  miniCardEmpty: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8ED',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  emptyMiniText: {
    fontSize: 12,
    color: '#999',
  },
  taskMiniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg + 2,
    height: 250,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 14,
    elevation: 4,
    marginRight: 12,
  },
  taskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  smallStatusBadge: {
    backgroundColor: '#6FC264',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginRight: 6,
    marginTop: -19,
  },
  smallStatusText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: typography.families.regular,
    letterSpacing: 0.3,
  },
  taskMiniTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#404040',
    marginBottom: 12,
    fontFamily: typography.families.medium,
    lineHeight: 22,
    height: 44,
  },
  taskFooterIcons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  iconStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconStatText: {
    fontSize: 12,
    color: '#727272',
    fontWeight: '400',
    fontFamily: typography.families.regular,
  },
  // taskBadgeRow already defined above; removed duplicate
  taskAssignedTo: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: -12,
  },
  taskMiniMeta: {
    fontSize: typography.fontSizes.base,
    color: '#6A6D73',
    marginBottom: 10,
    fontFamily: typography.families.regular,
  },
  taskLocation: {
    fontSize: 10,
    color: '#727272',
    marginBottom: 2,
    marginTop: 4,
    fontFamily: typography.families.regular, 
    fontWeight: '400',
  },
  taskDateRow: {
    marginBottom: 8,
  },
  taskDateItem: {
    flexDirection: 'column',
  },
  taskDateLabel: {
    fontSize: 10,
    color: '#727272',
    marginBottom: 3,
    fontFamily: typography.families.regular,
    fontWeight: '400',
  },
  taskDateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#404040',
    fontFamily: typography.families.medium,
    letterSpacing: 0,
  },
  taskMiniFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskFooterText: {
    fontSize: 11,
    color: '#666',
  },
  productivityCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  productivityContent: {
    flexDirection: 'row',
    gap: 16,
  },
  productivityTextColumn: {
    flex: 0.9,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  productivityInfoRow: {
    marginBottom: 14,
  },
  productivityInfoLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '400',
    fontFamily: typography.families.regular,
    marginBottom: 2,
  },
  productivityInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: typography.families.bold,
  },
  productivityDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  productivityTaskValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: typography.families.bold,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hoursNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: typography.families.bold,
  },
  hoursUnit: {
    fontSize: 11,
    color: '#888888',
    fontFamily: typography.families.regular,
  },
  hoursDivider: {
    fontSize: 11,
    color: '#888888',
    marginHorizontal: 3,
    fontFamily: typography.families.regular,
  },
  productivityBars: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 28,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#888888',
    marginBottom: 4,
    textAlign: 'center',
  },
  barCountCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  barCountZeroText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#888888',
  },
  barWrapper: {
    width: 12,
    height: 110,
    justifyContent: 'flex-end',
    marginBottom: 6,
    position: 'relative',
    alignItems: 'center',
    borderWidth: 6,
    borderRadius: 20,
    borderColor: '#F4F4F4',
  },
  barBackground: {
    width: 12,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#F4F4F4',
    position: 'absolute',
  },
  barFill: {
    width: 12,
    borderRadius: 6,
    backgroundColor: '#F4F4F4',
    position: 'absolute',
    bottom: 0,
  },
  barDay: {
    fontSize: 10,
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
  },
  barDate: {
    fontSize: 10,
    fontWeight: '400',
    color: '#F4F4F4',
    textAlign: 'center',
  },
  totalHoursText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  quickActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  quickActionPrimary: {
    flex: 1,
    backgroundColor: colors.primaryPurple,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.families.semibold,
  },
  quickActionSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionSecondaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.families.semibold,
  },
  screenContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  currentDate: {
    fontSize: 14,
    color: '#666',
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
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  quickActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Task Cards Styles
  tasksList: {
    gap: 12,
  },
  taskCard: {
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
    fontFamily: typography.families.semibold,
  },
  taskProject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  
  taskProgress: {
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e5e9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  startTimerButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startTimerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Performance Styles
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timesheetLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  timesheetLinkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Activity Styles
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
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
  
  // Add Task Button Styles
  addTaskButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  addTaskButtonLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addTaskButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  
  // Create Task Modal Styles
  createTaskScreen: {
    flex: 1,
    backgroundColor: '#F8F8FA',
  },
  createTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  createTaskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  menuButton: {
    padding: 4,
  },
  createTaskContent: {
    flex: 1,
    padding: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priorityLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
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
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  inputField: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  inputFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  inputFieldFlex: {
    flex: 1,
  },
  textInputBordered: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textAreaBordered: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  voiceButtonTop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateFieldText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginTop: -12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  teamSectionModal: {
    marginBottom: 20,
  },
  teamHeaderModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamTitleModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  addTeamButtonModal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamMemberRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  teamMemberInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamMemberAvatarModal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamMemberInitialsModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  teamMemberNameModal: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  teamMemberRoleModal: {
    fontSize: 13,
    color: '#8E8E93',
  },
  attachmentSectionModal: {
    marginBottom: 24,
  },
  attachmentTitleModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  attachmentPreviewRowModal: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  attachmentPreviewModal: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  attachmentImageModal: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  addFilesRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addFilesTextModal: {
    fontSize: 16,
    color: '#8E8E93',
  },
  attachButtonTextModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#877ED2',
  },
  createTaskButtonModal: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  createTaskButtonDisabledModal: {
    opacity: 0.6,
  },
  createTaskButtonTextModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Assignee Modal Styles
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
    marginBottom: 20,
  },
  assigneeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  assigneeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  assigneeSearchIcon: {
    marginRight: 8,
  },
  assigneeSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  assigneeList: {
    maxHeight: 400,
  },
  assigneeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  assigneeName: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  assigneeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeCheckboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  assigneeModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  assigneeCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  assigneeCancelButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  assigneeApplyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  assigneeApplyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
