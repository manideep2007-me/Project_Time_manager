import React, { useState, useEffect, useRef, useContext } from 'react';
import { dashboardApi } from '../../api/dashboard';
import { AuthContext } from '../../context/AuthContext';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  Platform,
  Image,
  Dimensions,
  AppState,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AnalogTimePicker from '../../components/AnalogTimePicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AppHeader from '../../components/shared/AppHeader';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import TimestampCamera from '../../components/camera/TimestampCamera';
import PhotoProofViewer from '../../components/camera/PhotoProofViewer';
import { savePhotoProof, createPhotoProof } from '../../services/photoProofService';
import { typography } from '../../design/tokens';


interface TaskDetails {
  id: string;
  title: string;
  projectName: string;
  clientName: string;
  location: string;
  status: 'To Do' | 'Active' | 'Completed' | 'Cancelled' | 'On Hold';
  assignedDate: string;
  dueDate: string;
  isOverdue: boolean;
  delayDays?: number;
  description?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  remainingDays?: number;
}

export default function TaskDetailsScreen() {
  const [showTimeReportsModal, setShowTimeReportsModal] = useState(false);
  // More state declarations for timer and modals
  const [timerCategory, setTimerCategory] = useState<string>('Development');
  const [timerNotes, setTimerNotes] = useState<string>('');
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showLiveTimePicker, setShowLiveTimePicker] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState<'start' | 'end'>('start');
  // Additional state declarations for UI
  const [isListView, setIsListView] = useState(false);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const route = useRoute<any>();
  const { taskId } = route.params || {};
  const navigation = useNavigation();
  // Timer and related state declarations
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [totalTimeToday, setTotalTimeToday] = useState<number>(0);
  const [currentProject, setCurrentProject] = useState<string>('Wardrobe Installation');
  const [liveStartTime, setLiveStartTime] = useState<Date>(new Date());
  const [liveEndTime, setLiveEndTime] = useState<Date>(new Date());
  const [actualEndTime, setActualEndTime] = useState<Date | null>(null);
  const [actualStartTime, setActualStartTime] = useState<Date | null>(null); // Persist the real start time of the current/last timer session
  const [nowTime, setNowTime] = useState<Date>(new Date()); // Live clock before timer starts
  const [calculatedHours, setCalculatedHours] = useState<number>(0);
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  const [showLiveDatePicker, setShowLiveDatePicker] = useState(false);
  
  // Editable timer times
  const [editableStartTime, setEditableStartTime] = useState<Date>(new Date());
  const [editableEndTime, setEditableEndTime] = useState<Date | null>(null);
  const [showTimerTimePicker, setShowTimerTimePicker] = useState(false);
  const [timerTimePickerMode, setTimerTimePickerMode] = useState<'start' | 'end'>('start');
  const [timerTimePickerListView, setTimerTimePickerListView] = useState(false);
  const [manualStartTimeSet, setManualStartTimeSet] = useState(false);
  const [manualEndTimeSet, setManualEndTimeSet] = useState(false);
  
  // Productivity section state
  const [productivityView, setProductivityView] = useState<'week' | 'month'>('week');
  const [chartView, setChartView] = useState<'bar' | 'list'>('bar');
  const [showProductivityReportModal, setShowProductivityReportModal] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Adjust to Sunday (getDay() returns 0 for Sunday)
    const sunday = new Date(today);
    sunday.setDate(diff);
    return sunday;
  });

  // Get week/month date range for productivity
  const getProductivityWeekRange = () => {
    if (productivityView === 'month') {
      const month = currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return month;
    }
    
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      return `${day} ${month}`;
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Navigate week/month
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      if (productivityView === 'month') {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      } else {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      }
      return newDate;
    });
  };

  // Function to record completed time entry manually
  const recordCompletedTime = async (start: Date, end: Date, notes: string) => {
    try {
      if (!start || !end || end <= start) {
        Alert.alert('Invalid time', 'Please select valid start and end times.');
        return;
      }
      await dashboardApi.createTimeEntry({
        taskId: taskDetails.id,
        employeeId: user?.id || '',
        workDate: start.toISOString().slice(0, 10),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        description: notes,
      });
      Alert.alert('Success', 'Time entry recorded successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record time entry.');
    }
  };



interface TimeEntry {
  id: string;
  date: string;
  workDate?: string; // Original work_date from API (YYYY-MM-DD format)
  startTime: string;
  endTime: string;
  originalStartTime?: string; // Original start time before editing
  originalEndTime?: string; // Original end time before editing
  duration: string;
  durationSeconds: number;
  project: string;
  category: string;
  notes?: string;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimeReport {
  date: string;
  totalTime: number;
  projectBreakdown: { [key: string]: number };
  categoryBreakdown: { [key: string]: number };
  entries: TimeEntry[];
}

interface Project {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  // Original dummy field loggedTime retained for backward compatibility, but real implementation uses timeToday (seconds)
  loggedTime?: string; // optional legacy string duration
  timeToday: number; // total logged seconds today for this member
  taskLoggedTime: number; // total logged seconds for THIS task
}

interface Photo {
  id: string;
  uri: string;
  caption?: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  workType?: string;
  metadata?: {
    taskTitle: string;
    projectName: string;
    taskId: string;
    workType?: string;
  };
}

// Remove duplicate export and function implementation. Only keep the first export default function TaskDetailsScreen.
  
  // Attachments popup state
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Photo management state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showTimestampCamera, setShowTimestampCamera] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterWorkType, setFilterWorkType] = useState<string>('All');
  const [attachmentFilter, setAttachmentFilter] = useState<'all' | 'document' | 'photo' | 'video'>('all');
  const [showStatusRecordModal, setShowStatusRecordModal] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  
  // Edit time entry state
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<Date>(new Date());
  const [editEndDate, setEditEndDate] = useState<Date>(new Date());
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editTimePickerType, setEditTimePickerType] = useState<'start' | 'end'>('start');
  const [editPickerTime, setEditPickerTime] = useState<Date>(new Date());
    // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Background timer and notifications
  const appState = useRef(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState<number>(0);
  const [isInBackground, setIsInBackground] = useState<boolean>(false);

  // Team data
  const [teamMembersData, setTeamMembersData] = useState<TeamMember[]>([]);
  
  // Recent activity data
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Attachments data
  const [attachments, setAttachments] = useState<any[]>([
    // Dummy attachments for testing
    {
      id: '1',
      file_name: 'Wardrobe drawing and measurement.pdf',
      file_extension: '.pdf',
      file_url: 'https://example.com/wardrobe-drawing.pdf',
      mime_type: 'application/pdf',
      created_at: '2025-11-02T10:00:00Z',
    },
    {
      id: '2',
      file_name: 'Laminate code.pdf',
      file_extension: '.pdf',
      file_url: 'https://example.com/laminate-code.pdf',
      mime_type: 'application/pdf',
      created_at: '2025-11-02T11:00:00Z',
    },
    {
      id: '3',
      file_name: 'Sample_1.jpg',
      file_extension: '.jpg',
      file_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
      mime_type: 'image/jpeg',
      created_at: '2025-11-03T09:00:00Z',
    },
    {
      id: '4',
      file_name: 'simple-wardrobe-design-08.jpg',
      file_extension: '.jpg',
      file_url: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400',
      mime_type: 'image/jpeg',
      created_at: '2025-11-03T10:00:00Z',
    },
    {
      id: '5',
      file_name: 'Sample_1.mp4',
      file_extension: '.mp4',
      file_url: 'https://example.com/sample-video.mp4',
      mime_type: 'video/mp4',
      created_at: '2025-11-04T14:00:00Z',
    },
  ]);

  // Task description expanded state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  // Task details state
  const [taskDetails, setTaskDetails] = useState<TaskDetails>({
    id: taskId,
    title: 'Loading...',
    projectName: 'Loading...',
    clientName: 'Loading...',
    location: 'Loading...',
    status: 'To Do',
    assignedDate: '',
    dueDate: '',
    isOverdue: false,
    delayDays: 0,
    remainingDays: 0,
  });

  // Enhanced time tracking data
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const [projects] = useState<Project[]>([
    { id: '1', name: 'Wardrobe Installation', color: '#007AFF', isActive: true },
    { id: '2', name: 'Kitchen Renovation', color: '#34C759', isActive: true },
    { id: '3', name: 'Bathroom Remodel', color: '#FF9500', isActive: false },
    { id: '4', name: 'Office Setup', color: '#FF3B30', isActive: true },
  ]);

  const [categories] = useState<Category[]>([
    { id: '1', name: 'Development', color: '#007AFF', icon: 'code' },
    { id: '2', name: 'Testing', color: '#34C759', icon: 'checkmark-circle' },
    { id: '3', name: 'Documentation', color: '#FF9500', icon: 'document-text' },
    { id: '4', name: 'Meeting', color: '#FF3B30', icon: 'people' },
    { id: '5', name: 'Research', color: '#8E8E93', icon: 'search' },
    { id: '6', name: 'Review', color: '#AF52DE', icon: 'eye' },
  ]);

  // Enhanced timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  // Calculate total time today
  useEffect(() => {
    const today = new Date().toDateString();
    const todayEntries = timeEntries.filter(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
    const totalSeconds = todayEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    setTotalTimeToday(totalSeconds);
  }, [timeEntries]);

  // Background timer handling
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isTimerRunning && timerStartTime) {
          const now = new Date();
          const backgroundDuration = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
          setBackgroundTime(backgroundDuration);
          setElapsedTime(backgroundDuration);
        }
        setIsInBackground(false);
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        setIsInBackground(true);
        if (isTimerRunning) {
          // Show notification that timer is running in background
          Alert.alert(
            'Timer Running',
            'Your timer is still running in the background. You can continue tracking time even when the app is not active.',
            [{ text: 'OK' }]
          );
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isTimerRunning, timerStartTime]);

  // Timer notifications
  useEffect(() => {
    if (isTimerRunning && elapsedTime > 0) {
      // Show periodic notifications for long-running timers
      if (elapsedTime === 3600) { // 1 hour
        Alert.alert(
          'Timer Update',
          `You've been working for 1 hour on ${currentProject}. Great job!`,
          [{ text: 'Continue', style: 'default' }]
        );
      } else if (elapsedTime === 7200) { // 2 hours
        Alert.alert(
          'Timer Update',
          `You've been working for 2 hours on ${currentProject}. Consider taking a break!`,
          [{ text: 'Continue', style: 'default' }]
        );
      }
    }
  }, [elapsedTime, isTimerRunning, currentProject]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Calculate hours between start and end time
  const calculateHoursBetween = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours); // Ensure non-negative
  };

  // Update calculated hours when times change
  useEffect(() => {
    const hours = calculateHoursBetween(liveStartTime, liveEndTime);
    setCalculatedHours(hours);
  }, [liveStartTime, liveEndTime]);

  // Real-time update for live timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
        setLiveEndTime(now); // Update end time in real-time
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);


  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Fetch task details and time entries on component mount
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) return;
      
      try {
        setLoading(true);
        
        // Fetch task details
        const taskData = await dashboardApi.getTaskDetails(taskId);
        console.log('Task data:', taskData);
        
        // Format dates for display (e.g. "02 Nov 2025")
        const formatDisplayDate = (dateStr: string) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
        };

        // Calculate if overdue
        const dueDate = new Date(taskData.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = taskData.status !== 'Completed' && dueDate < today;
        const delayDays = isOverdue ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const remainingDays = !isOverdue 
          ? Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        setTaskDetails({
          id: taskData.id,
          title: taskData.title || 'Untitled Task',
          projectName: taskData.project_name || 'Unknown Project',
          clientName: taskData.client_name || 'No Client',
          location: taskData.location || 'No Location',
          status: taskData.status || 'To Do',
          assignedDate: formatDisplayDate(taskData.created_at),
          dueDate: formatDisplayDate(taskData.due_date),
          isOverdue,
          delayDays,
          remainingDays,
          description: taskData.description || taskData.notes || '',
          // Project start / end dates shown under location in header
          projectStartDate: taskData.project_start_date
            ? formatDisplayDate(taskData.project_start_date)
            : taskData.start_date
            ? formatDisplayDate(taskData.start_date)
            : undefined,
          projectEndDate: taskData.project_end_date
            ? formatDisplayDate(taskData.project_end_date)
            : taskData.end_date
            ? formatDisplayDate(taskData.end_date)
            : undefined,
        });

        // Fetch time entries for this task
        const timeEntriesData = await dashboardApi.getTaskTimeEntries(taskId);
        console.log('Time entries data:', timeEntriesData);
        
        // Format time entries
        const formattedEntries = timeEntriesData.map((entry: any) => {
          const workDate = new Date(entry.work_date);
          const startTime = new Date(entry.start_time);
          const endTime = new Date(entry.end_time);
          
          const durationMinutes = entry.duration_minutes || 0;
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          const durationStr = hours > 0 
            ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` 
            : `${minutes}m`;

          const formattedStartTime = startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          
          // Check if entry was edited and get original times
          const isEdited = entry.updated_at && entry.created_at && entry.updated_at !== entry.created_at;
          const originalStartTime = entry.original_start_time 
            ? new Date(entry.original_start_time).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
            : undefined;
          const originalEndTime = entry.original_end_time
            ? new Date(entry.original_end_time).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
            : undefined;
          
          return {
            id: entry.id.toString(),
            date: workDate.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              weekday: 'short'
            }).replace(/\//g, '-'),
            workDate: entry.work_date, // Store original work_date (YYYY-MM-DD format)
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            originalStartTime: originalStartTime,
            originalEndTime: originalEndTime,
            duration: durationStr,
            durationSeconds: durationMinutes * 60,
            project: entry.task_title || taskData.title,
            category: 'Work', // Default category
            notes: entry.description || '',
            canEdit: true,
            createdAt: entry.created_at,
            updatedAt: entry.updated_at,
          };
        });
        
        setTimeEntries(formattedEntries);

        // Fetch project team members
        if (taskData.project_id) {
          try {
            const teamData = await dashboardApi.getProjectTeam(taskData.project_id.toString());
            console.log('Team members:', teamData);
            
            // Get time entries for each team member for this task
            const today = new Date().toISOString().split('T')[0];
            const teamWithTime = await Promise.all(
              teamData.teamMembers.map(async (member: any) => {
                try {
                  // Get time entries for today (for timeToday)
                  const memberTimeEntriesToday = await dashboardApi.getTimeEntries({
                    employeeId: member.id.toString(),
                    startDate: today,
                    endDate: today,
                  });
                  
                  const totalSecondsToday = memberTimeEntriesToday.timeEntries.reduce(
                    (sum: number, entry: any) => sum + (entry.duration_minutes || 0) * 60,
                    0
                  );
                  
                  // Get time entries for THIS task
                  const memberTimeEntriesForTask = await dashboardApi.getTimeEntries({
                    employeeId: member.id.toString(),
                    taskId: taskId,
                  });
                  
                  const totalSecondsForTask = memberTimeEntriesForTask.timeEntries.reduce(
                    (sum: number, entry: any) => sum + (entry.duration_minutes || 0) * 60,
                    0
                  );
                  
                  return {
                    id: member.id.toString(),
                    name: `${member.first_name} ${member.last_name}`,
                    role: member.role || member.department || 'Team Member',
                    timeToday: totalSecondsToday,
                    taskLoggedTime: totalSecondsForTask,
                  };
                } catch (error) {
                  console.error(`Error fetching time for member ${member.id}:`, error);
                  return {
                    id: member.id.toString(),
                    name: `${member.first_name} ${member.last_name}`,
                    role: member.role || member.department || 'Team Member',
                    timeToday: 0,
                    taskLoggedTime: 0,
                  };
                }
              })
            );
            
            setTeamMembersData(teamWithTime);
            
            // Fetch recent activity logs for this task
            try {
              const activityLogs = await dashboardApi.getTaskActivityLogs(taskId, 10);
              setRecentActivity(activityLogs);
            } catch (error) {
              console.error('Error fetching activity logs:', error);
            }
          } catch (error) {
            console.error('Error fetching team members:', error);
          }
        }

        // Fetch task attachments
        try {
          const taskAttachments = await dashboardApi.getTaskAttachments(taskId);
          // Only update if we got attachments from API, otherwise keep dummy data for testing
          if (taskAttachments && taskAttachments.length > 0) {
            setAttachments(taskAttachments);
          }
        } catch (error) {
          console.error('Error fetching task attachments:', error);
          // Keep dummy data on error
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching task data:', error);
        Alert.alert('Error', 'Failed to load task details');
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request location permission
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationPermission.status === 'granted');
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos for work documentation.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };


  const handleViewToggle = () => {
    setIsListView(!isListView);
  };

  const handleViewAllAttachments = () => {
    setShowAttachmentsModal(true);
  };

  // Photo capture functions
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const timestamp = new Date().toISOString();
        let location = null;

        // Get location if permission is granted
        if (locationPermission) {
          try {
            const locationData = await Location.getCurrentPositionAsync({});
            location = {
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
            };
          } catch (error) {
            console.log('Location not available:', error);
          }
        }

        const newPhoto: Photo = {
          id: Date.now().toString(),
          uri: asset.uri,
          timestamp,
          location: location || undefined,
          caption: `Work photo - ${new Date().toLocaleString()}`,
          workType: 'General',
        };

        setPhotos(prev => [newPhoto, ...prev]);
        setShowCameraModal(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const timestamp = new Date().toISOString();

        const newPhoto: Photo = {
          id: Date.now().toString(),
          uri: asset.uri,
          timestamp,
          caption: `Work photo - ${new Date().toLocaleString()}`,
          workType: 'General',
        };

        setPhotos(prev => [newPhoto, ...prev]);
        setShowCameraModal(false);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const showCameraOptions = () => {
    // Open timestamp camera with overlays
    setShowTimestampCamera(true);
  };

  const handlePhotoTaken = async (photoData: {
    uri: string;
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    metadata: {
      taskTitle: string;
      projectName: string;
      taskId: string;
      workType?: string;
    };
  }) => {
    try {
      // Save photo proof with metadata
      const proofData = await savePhotoProof(photoData.uri, {
        timestamp: photoData.timestamp,
        location: photoData.location,
        taskTitle: photoData.metadata.taskTitle,
        projectName: photoData.metadata.projectName,
        taskId: photoData.metadata.taskId,
        workType: photoData.metadata.workType,
      });

      // Create photo object
      const photoProof = createPhotoProof(proofData.uri, proofData.metadata);

      // Add to photos list
      const newPhoto: Photo = {
        id: Date.now().toString(),
        uri: photoProof.uri,
        timestamp: photoProof.timestamp,
        location: photoProof.location,
        caption: `${photoProof.displayInfo.workType} - ${photoProof.displayInfo.timestamp}`,
        workType: photoProof.displayInfo.workType,
        notes: `Task: ${photoProof.displayInfo.taskTitle}\nProject: ${photoProof.displayInfo.projectName}\nLocation: ${photoProof.displayInfo.location}`,
        metadata: photoProof.metadata,
      };

      setPhotos(prev => [newPhoto, ...prev]);
      setShowTimestampCamera(false);
      
      Alert.alert('Success', 'Photo proof captured with timestamp and location!');
    } catch (error) {
      console.error('Error saving photo proof:', error);
      Alert.alert('Error', 'Failed to save photo proof. Please try again.');
    }
  };

  const showWorkTypeSelection = (source: 'camera' | 'gallery') => {
    console.log('showWorkTypeSelection called with source:', source);
    Alert.alert(
      'Work Type',
      'Select the type of work for this photo:',
      [
        { text: 'Before Work', onPress: () => {
          console.log('Before Work selected');
          capturePhotoWithTemplate(source, 'Before Work');
        }},
        { text: 'During Work', onPress: () => {
          console.log('During Work selected');
          capturePhotoWithTemplate(source, 'During Work');
        }},
        { text: 'After Work', onPress: () => {
          console.log('After Work selected');
          capturePhotoWithTemplate(source, 'After Work');
        }},
        { text: 'Issue/Problem', onPress: () => {
          console.log('Issue/Problem selected');
          capturePhotoWithTemplate(source, 'Issue/Problem');
        }},
        { text: 'General', onPress: () => {
          console.log('General selected');
          capturePhotoWithTemplate(source, 'General');
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const capturePhotoWithTemplate = async (source: 'camera' | 'gallery', workType: string) => {
    console.log('capturePhotoWithTemplate called with source:', source, 'workType:', workType);
    try {
      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
      
      console.log('ImagePicker result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const timestamp = new Date().toISOString();
        let location = null;

        // Get location if permission is granted
        if (locationPermission) {
          try {
            const locationData = await Location.getCurrentPositionAsync({});
            location = {
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
            };
          } catch (error) {
            console.log('Location not available:', error);
          }
        }

        const newPhoto: Photo = {
          id: Date.now().toString(),
          uri: asset.uri,
          timestamp,
          location: location || undefined,
          caption: `${workType} - ${new Date().toLocaleString()}`,
          workType,
        };

        setPhotos(prev => [newPhoto, ...prev]);
        setShowCameraModal(false);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  // Photo management functions
  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPhotos(prev => prev.filter(photo => photo.id !== photoId));
            setShowPhotoModal(false);
            setSelectedPhoto(null);
          }
        }
      ]
    );
  };

  const editPhotoNotes = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    Alert.prompt(
      'Edit Photo Notes',
      'Add or edit notes for this photo:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (notes: string | undefined) => {
            setPhotos(prev => prev.map(p => 
              p.id === photoId ? { ...p, notes: notes || '' } : p
            ));
          }
        }
      ],
      'plain-text',
      photo.notes || ''
    );
  };

  const showPhotoOptions = (photo: Photo) => {
    Alert.alert(
      'Photo Options',
      'What would you like to do with this photo?',
      [
        { text: 'View Details', onPress: () => {
          setSelectedPhoto(photo);
          setShowPhotoModal(true);
        }},
        { text: 'Edit Notes', onPress: () => editPhotoNotes(photo.id) },
        { text: 'Export', onPress: () => exportPhoto(photo) },
        { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(photo.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Export functions
  const exportPhoto = (photo: Photo) => {
    Alert.alert(
      'Export Photo',
      'Choose export format:',
      [
        { text: 'Share Image', onPress: () => sharePhoto(photo) },
        { text: 'Export with Metadata', onPress: () => exportWithMetadata(photo) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const sharePhoto = (photo: Photo) => {
    // For now, we'll show an alert. In a real app, you'd use expo-sharing
    Alert.alert(
      'Share Photo',
      `Photo captured at: ${new Date(photo.timestamp).toLocaleString()}\nLocation: ${photo.location ? `${photo.location.latitude.toFixed(4)}, ${photo.location.longitude.toFixed(4)}` : 'Not available'}\nNotes: ${photo.notes || 'None'}`,
      [{ text: 'OK' }]
    );
  };

  const exportWithMetadata = (photo: Photo) => {
    const metadata = {
      timestamp: photo.timestamp,
      location: photo.location,
      caption: photo.caption,
      notes: photo.notes,
      workType: photo.workType,
    };
    
    Alert.alert(
      'Export Metadata',
      `Metadata exported:\n${JSON.stringify(metadata, null, 2)}`,
      [{ text: 'OK' }]
    );
  };

  const exportAllPhotos = () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'There are no photos to export.');
      return;
    }

    Alert.alert(
      'Export All Photos',
      `Export ${photos.length} photos with metadata?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          const exportData = photos.map(photo => ({
            id: photo.id,
            timestamp: photo.timestamp,
            location: photo.location,
            caption: photo.caption,
            notes: photo.notes,
            workType: photo.workType,
          }));
          
          Alert.alert(
            'Export Complete',
            `Exported ${photos.length} photos with metadata.`,
            [{ text: 'OK' }]
          );
        }}
      ]
    );
  };

  // Time data export functions
  const exportTimeData = () => {
    Alert.alert(
      'Export Time Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV', onPress: () => exportToCSV() },
        { text: 'JSON', onPress: () => exportToJSON() },
        { text: 'PDF Report', onPress: () => exportToPDF() }
      ]
    );
  };

  const exportToCSV = () => {
    const csvData = timeEntries.map(entry => ({
      Date: entry.date,
      'Start Time': entry.startTime,
      'End Time': entry.endTime,
      Duration: entry.duration,
      Project: entry.project,
      Category: entry.category,
      Notes: entry.notes || '',
      'Created At': entry.createdAt
    }));

    // TODO: Implement actual CSV export
    Alert.alert('Export Complete', 'Time data exported to CSV successfully!');
  };

  const exportToJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalEntries: timeEntries.length,
      totalTime: formatTime(totalTimeToday),
      entries: timeEntries
    };

    // TODO: Implement actual JSON export
    Alert.alert('Export Complete', 'Time data exported to JSON successfully!');
  };

  const exportToPDF = () => {
    // TODO: Implement PDF report generation
    Alert.alert('Export Complete', 'PDF report generated successfully!');
  };


  // Filter and search functions
  const getFilteredPhotos = () => {
    let filtered = photos;

    // Filter by work type
    if (filterWorkType !== 'All') {
      filtered = filtered.filter(photo => photo.workType === filterWorkType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(photo => 
        photo.caption?.toLowerCase().includes(query) ||
        photo.notes?.toLowerCase().includes(query) ||
        photo.workType?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const showFilterOptions = () => {
    const workTypes = ['All', 'Before Work', 'During Work', 'After Work', 'Issue/Problem', 'General'];
    
    Alert.alert(
      'Filter by Work Type',
      'Select a work type to filter photos:',
      [
        ...workTypes.map(type => ({
          text: type,
          onPress: () => setFilterWorkType(type),
          style: (type === filterWorkType ? 'default' : 'cancel') as 'default' | 'cancel'
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Live Timer functions - Cumulative tracking system
  const handleLiveTimerToggle = () => {
    if (isTimerRunning) {
      // Stop timer and add to cumulative total
      stopTimer();
    } else {
      // Start new timer session
      startTimer();
    }
  };

  const startTimer = () => {
    const now = new Date();
    setTimerStartTime(now);
    setActualStartTime(now);
    setEditableStartTime(now);
    setLiveStartTime(now);
    setIsTimerRunning(true);
    setElapsedTime(0);
    setActualEndTime(null); // Clear end time when starting new session
    setEditableEndTime(null); // Clear editable end time when starting new session
    // Reset manual time states when starting timer
    setManualStartTimeSet(false);
    setManualEndTimeSet(false);
  };

  const stopTimer = async () => {
    if (!timerStartTime) {
      setIsTimerRunning(false);
      return;
    }
    
    let endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timerStartTime.getTime()) / 1000);
    
    // Ensure minimum duration of 1 minute (60 seconds)
    if (duration < 60) {
      Alert.alert('Minimum Duration', 'Please record at least 1 minute of work time.');
      return;
    }
    
    // Ensure end time is at least 1 second after start time to avoid validation errors
    if (endTime.getTime() <= timerStartTime.getTime()) {
      endTime = new Date(timerStartTime.getTime() + 1000); // Add 1 second
    }
    
    // Set the actual end time for display
    setActualEndTime(endTime);
    setEditableEndTime(endTime);
    setLiveEndTime(endTime);
    
    // Save time entry to database
    try {
      if (!taskId) {
        Alert.alert('Error', 'Task ID is missing');
        return;
      }

      // Format dates for API
      const workDate = liveDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const startTimeISO = timerStartTime.toISOString();
      const endTimeISO = endTime.toISOString();

      // Save to database
      // For employees, the backend will automatically find the employee ID from the user's email
      // So we don't need to pass employeeId - the backend will find it
      await dashboardApi.createTimeEntry({
        taskId: taskId,
        // employeeId is optional - backend will find employee by email for employees
        workDate: workDate,
        startTime: startTimeISO,
        endTime: endTimeISO,
        description: timerNotes || '',
      });

      // Reload time entries from database to update hours taken
      const timeEntriesData = await dashboardApi.getTaskTimeEntries(taskId);
      
      // Format time entries
      const formattedEntries = timeEntriesData.map((entry: any) => {
        const workDate = new Date(entry.work_date);
        const startTime = new Date(entry.start_time);
        const endTime = new Date(entry.end_time);
        
        const durationMinutes = entry.duration_minutes || 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationStr = hours > 0 
          ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` 
          : `${minutes}m`;

        return {
          id: entry.id.toString(),
          date: workDate.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            weekday: 'short'
          }).replace(/\//g, '-'),
          startTime: startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          endTime: endTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          duration: durationStr,
          durationSeconds: durationMinutes * 60,
          project: entry.task_title || taskDetails.title,
          category: 'Work',
          notes: entry.description || '',
          canEdit: true,
          createdAt: entry.created_at,
          updatedAt: entry.updated_at,
        };
      });
      
      setTimeEntries(formattedEntries);
      
      // Refresh team member data to update logged time
      if (taskDetails.id && taskDetails.projectName) {
        try {
          const taskData = await dashboardApi.getTaskDetails(taskDetails.id);
          if (taskData.project_id) {
            const teamData = await dashboardApi.getProjectTeam(taskData.project_id.toString());
            const today = new Date().toISOString().split('T')[0];
            const teamWithTime = await Promise.all(
              teamData.teamMembers.map(async (member: any) => {
                try {
                  const memberTimeEntriesToday = await dashboardApi.getTimeEntries({
                    employeeId: member.id.toString(),
                    startDate: today,
                    endDate: today,
                  });
                  
                  const totalSecondsToday = memberTimeEntriesToday.timeEntries.reduce(
                    (sum: number, entry: any) => sum + (entry.duration_minutes || 0) * 60,
                    0
                  );
                  
                  const memberTimeEntriesForTask = await dashboardApi.getTimeEntries({
                    employeeId: member.id.toString(),
                    taskId: taskId,
                  });
                  
                  const totalSecondsForTask = memberTimeEntriesForTask.timeEntries.reduce(
                    (sum: number, entry: any) => sum + (entry.duration_minutes || 0) * 60,
                    0
                  );
                  
                  return {
                    id: member.id.toString(),
                    name: `${member.first_name} ${member.last_name}`,
                    role: member.role || member.department || 'Team Member',
                    timeToday: totalSecondsToday,
                    taskLoggedTime: totalSecondsForTask,
                  };
                } catch (error) {
                  console.error(`Error refreshing time for member ${member.id}:`, error);
                  return {
                    id: member.id.toString(),
                    name: `${member.first_name} ${member.last_name}`,
                    role: member.role || member.department || 'Team Member',
                    timeToday: 0,
                    taskLoggedTime: 0,
                  };
                }
              })
            );
            setTeamMembersData(teamWithTime);
          }
        } catch (error) {
          console.error('Error refreshing team data:', error);
        }
      }
      
      // Refresh activity logs
      try {
        const activityLogs = await dashboardApi.getTaskActivityLogs(taskId, 10);
        setRecentActivity(activityLogs);
      } catch (error) {
        console.error('Error refreshing activity logs:', error);
      }
      
      Alert.alert('Success', 'Time entry saved successfully');
    } catch (error: any) {
      console.error('Error saving time entry:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save time entry. Please try again.';
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', errorMessage);
    }
    
    // Reset running state
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    setTimerNotes('');
  };

  // Save manually selected time entry (when both start and end times are manually set)
  const saveManualTimeEntry = async () => {
    if (!editableStartTime || !editableEndTime) {
      Alert.alert('Error', 'Please select both start time and end time');
      return;
    }

    // Calculate duration
    const duration = Math.floor((editableEndTime.getTime() - editableStartTime.getTime()) / 1000);
    
    // Validate duration
    if (duration < 60) {
      Alert.alert('Minimum Duration', 'Please record at least 1 minute of work time.');
      return;
    }
    
    if (duration <= 0) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    try {
      if (!taskId) {
        Alert.alert('Error', 'Task ID is missing');
        return;
      }

      // Format dates for API
      const workDate = liveDate.toISOString().split('T')[0];
      const startTimeISO = editableStartTime.toISOString();
      const endTimeISO = editableEndTime.toISOString();

      // Save to database
      await dashboardApi.createTimeEntry({
        taskId: taskId,
        workDate: workDate,
        startTime: startTimeISO,
        endTime: endTimeISO,
        description: timerNotes || '',
      });

      // Reload time entries from database
      const timeEntriesData = await dashboardApi.getTaskTimeEntries(taskId);
      
      // Format time entries
      const formattedEntries = timeEntriesData.map((entry: any) => {
        const entryWorkDate = new Date(entry.work_date);
        const startTime = new Date(entry.start_time);
        const endTime = new Date(entry.end_time);
        
        const durationMinutes = entry.duration_minutes || 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationStr = hours > 0 
          ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` 
          : `${minutes}m`;

        return {
          id: entry.id.toString(),
          date: entryWorkDate.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            weekday: 'short'
          }).replace(/\//g, '-'),
          workDate: entry.work_date,
          startTime: startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          endTime: endTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          originalStartTime: entry.original_start_time 
            ? new Date(entry.original_start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : undefined,
          originalEndTime: entry.original_end_time
            ? new Date(entry.original_end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : undefined,
          duration: durationStr,
          durationSeconds: durationMinutes * 60,
          project: entry.task_title || taskDetails?.title,
          category: 'Work',
          notes: entry.description || '',
          canEdit: true,
          createdAt: entry.created_at,
          updatedAt: entry.updated_at,
        };
      });
      
      setTimeEntries(formattedEntries);
      
      // Reset manual time states
      setManualStartTimeSet(false);
      setManualEndTimeSet(false);
      setEditableEndTime(null);
      setTimerNotes('');
      
      Alert.alert('Success', 'Time entry saved successfully');
    } catch (error: any) {
      console.error('Error saving manual time entry:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save time entry. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  // Live clock updater (shows current time before timer starts)
  useEffect(() => {
    if (!actualStartTime) {
      const interval = setInterval(() => {
        setNowTime(new Date());
      }, 15000); // update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [actualStartTime]);

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    if (timerStartTime) {
      setIsTimerRunning(true);
    }
  };

  // Helper to format seconds as HH:MM:SS
  const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Edit time entry functions
  const handleEditTimeEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditStartTime(entry.startTime);
    setEditEndTime(entry.endTime);
    
    // Parse time strings to Date objects
    const parseTimeToDate = (timeStr: string) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3];
        
        if (period) {
          if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      return new Date();
    };
    
    setEditStartDate(parseTimeToDate(entry.startTime));
    setEditEndDate(parseTimeToDate(entry.endTime));
    setShowEditTimeModal(true);
  };

  const handleEditTimePickerOpen = (type: 'start' | 'end') => {
    setEditTimePickerType(type);
    setEditPickerTime(type === 'start' ? editStartDate : editEndDate);
    setShowEditTimePicker(true);
  };

  const handleEditTimePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditTimePicker(false);
      if (event.type === 'set' && selectedDate) {
        updateEditTime(selectedDate);
      }
    } else if (selectedDate) {
      setEditPickerTime(selectedDate);
    }
  };

  const handleEditTimePickerConfirm = () => {
    updateEditTime(editPickerTime);
    setShowEditTimePicker(false);
  };

  const updateEditTime = (selectedDate: Date) => {
    const timeStr = selectedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    if (editTimePickerType === 'start') {
      setEditStartDate(selectedDate);
      setEditStartTime(timeStr);
    } else {
      setEditEndDate(selectedDate);
      setEditEndTime(timeStr);
    }
  };

  const calculateEditDuration = () => {
    const startMs = editStartDate.getHours() * 60 + editStartDate.getMinutes();
    let endMs = editEndDate.getHours() * 60 + editEndDate.getMinutes();
    
    // If end is before start, assume next day
    if (endMs <= startMs) {
      endMs += 24 * 60;
    }
    
    const diffMinutes = endMs - startMs;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${String(hours).padStart(2, '0')}hr ${String(minutes).padStart(2, '0')}min`;
  };

  const handleSaveEditTimeEntry = async () => {
    if (!editingEntry) return;
    
    try {
      setLoading(true);
      
      // Get work date from entry
      const workDate = editingEntry.workDate || editingEntry.date;
      let workDateObj: Date;
      
      if (workDate) {
        const dateMatch = workDate.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          workDateObj = new Date(dateMatch[0] + 'T00:00:00');
        } else {
          const dateMatch2 = workDate.match(/(\d{2})-(\d{2})-(\d{4})/);
          if (dateMatch2) {
            workDateObj = new Date(`${dateMatch2[3]}-${dateMatch2[2]}-${dateMatch2[1]}T00:00:00`);
          } else {
            workDateObj = new Date();
            workDateObj.setHours(0, 0, 0, 0);
          }
        }
      } else {
        workDateObj = new Date();
        workDateObj.setHours(0, 0, 0, 0);
      }
      
      // Combine work date with times
      const startDate = new Date(workDateObj);
      startDate.setHours(editStartDate.getHours(), editStartDate.getMinutes(), 0, 0);
      
      const endDate = new Date(workDateObj);
      endDate.setHours(editEndDate.getHours(), editEndDate.getMinutes(), 0, 0);
      
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      // Update via API
      await dashboardApi.updateTimeEntry(editingEntry.id, {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });
      
      // Reload time entries
      if (taskId) {
        const timeEntriesData = await dashboardApi.getTaskTimeEntries(taskId);
        const formattedEntries = timeEntriesData.map((entry: any) => {
          const entryWorkDate = new Date(entry.work_date);
          const startTime = new Date(entry.start_time);
          const endTime = new Date(entry.end_time);
          
          const durationMinutes = entry.duration_minutes || 0;
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          const durationStr = hours > 0 
            ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` 
            : `${minutes}m`;
          
          return {
            id: entry.id.toString(),
            date: entryWorkDate.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              weekday: 'short'
            }).replace(/\//g, '-'),
            workDate: entry.work_date,
            startTime: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            endTime: endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            originalStartTime: entry.original_start_time 
              ? new Date(entry.original_start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              : undefined,
            originalEndTime: entry.original_end_time
              ? new Date(entry.original_end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              : undefined,
            duration: durationStr,
            durationSeconds: durationMinutes * 60,
            project: entry.project_name || taskDetails?.projectName || '',
            category: entry.category || timerCategory || 'Development',
            canEdit: true,
            notes: entry.description || '',
            createdAt: entry.created_at,
            updatedAt: entry.updated_at,
          };
        });
        setTimeEntries(formattedEntries);
      }
      
      setShowEditTimeModal(false);
      setEditingEntry(null);
      Alert.alert('Success', 'Time entry updated successfully');
    } catch (error: any) {
      console.error('Error updating time entry:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update time entry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#34C759';
      case 'Active': return '#877ED2';
      case 'Cancelled': return '#FF3B30';
      case 'On Hold': return '#FF9500';
      case 'To Do': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed': return 'Completed';
      case 'Active': return 'Active';
      case 'Cancelled': return 'Cancelled';
      case 'On Hold': return 'On Hold';
      case 'To Do': return 'To Do';
      default: return status;
    }
  };


  // Format date for display (e.g., "10 Nov, 2025")
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Format date for timer (e.g., "10 Nov, 2025")
  const formatTimerDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Calculate remaining days
  const getRemainingDays = () => {
    try {
      if (!taskDetails.dueDate) return 5;
      const due = new Date(taskDetails.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const days = Math.max(0, diff);
      return isNaN(days) ? 5 : days;
    } catch (error) {
      return 5;
    }
  };

  // Calculate progress percentage (for progress bar)
  const getProgressPercentage = () => {
    // Default to 75% if in progress, adjust based on actual progress if available
    if (taskDetails.status === 'Active') {
      return 75;
    } else if (taskDetails.status === 'Completed') {
      return 100;
    }
    return 0;
  };

  // Productivity data for the week
  const getProductivityData = () => {
    if (productivityView === 'month') {
      return getProductivityMonthData();
    }
    
    const sunday = new Date(currentWeekStart);
    sunday.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Get Sunday of the week
    
    const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const day = dayAbbreviations[d.getDay()];
      const date = d.getDate().toString();
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      // Full date format for list view: "Sun, 06 Nov 2025"
      const fullDate = `${day}, ${date.padStart(2, '0')} ${month} ${year}`;
      
      // Calculate hours from time entries for this day using work_date
      const dayStr = d.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Filter time entries for this day using workDate
      const dayEntries = timeEntries.filter(entry => {
        if (entry.workDate) {
          return entry.workDate === dayStr;
        }
        // Fallback to parsing the date string if workDate is not available
        try {
          const entryDate = new Date(entry.date.split(',')[0].trim() || entry.createdAt);
          const entryDayStr = entryDate.toISOString().split('T')[0];
          return entryDayStr === dayStr;
        } catch {
          return false;
        }
      });
      
      // Calculate total hours for this day
      const totalSeconds = dayEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
      const hours = totalSeconds / 3600;
      
      return { day, date, hours: Math.round(hours * 10) / 10, fullDate }; // Round to 1 decimal place
    });
  };

  // Productivity data for the month
  const getProductivityMonthData = () => {
    const firstDay = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
    const lastDay = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[currentWeekStart.getMonth()];
    
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(firstDay);
      d.setDate(i + 1);
      const dayOfMonth = d.getDate();
      const dateLabel = `${dayOfMonth} ${monthName}`; // e.g., "3 Nov"
      
      // Calculate hours from time entries for this day using work_date
      const dayStr = d.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Filter time entries for this day
      const dayEntries = timeEntries.filter(entry => {
        // Check workDate first - it may be ISO timestamp like "2025-12-07T18:30:00.000Z"
        if (entry.workDate) {
          // Extract just the date part from ISO timestamp
          const entryWorkDate = entry.workDate.split('T')[0];
          return entryWorkDate === dayStr;
        }
        // Fallback to parsing the date string if workDate is not available
        try {
          // Try to parse the formatted date string (e.g., "02-11-2025, Mon" or "Mon, 08-12-2025")
          const dateStr = entry.date;
          // Look for DD-MM-YYYY pattern anywhere in the string
          const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
          if (match) {
            const [_, day, month, year] = match;
            const entryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const entryDayStr = entryDate.toISOString().split('T')[0];
            return entryDayStr === dayStr;
          }
          // Fallback to createdAt
          const entryDate = new Date(entry.createdAt);
          const entryDayStr = entryDate.toISOString().split('T')[0];
          return entryDayStr === dayStr;
        } catch {
          return false;
        }
      });
      
      // Calculate total hours for this day
      const totalSeconds = dayEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
      const hours = totalSeconds / 3600;
      
      // Show label only at exact intervals: 3rd, 9th, 15th, 21st, 27th
      const showLabel = dayOfMonth === 3 || dayOfMonth === 9 || dayOfMonth === 15 || dayOfMonth === 21 || dayOfMonth === 27;
      
      return { day: dateLabel, date: dayOfMonth.toString(), hours: Math.round(hours * 10) / 10, showLabel, fullDate: dateLabel };
    });
  };

  // Get weekly grouped data for month list view
  const getMonthlyWeeklyData = () => {
    const firstDay = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
    const lastDay = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[currentWeekStart.getMonth()];
    
    const weeks: { weekLabel: string; totalHours: number; startDate: string; endDate: string }[] = [];
    let currentWeekStartDay = 1;
    
    while (currentWeekStartDay <= daysInMonth) {
      const weekStartDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), currentWeekStartDay);
      // Find the end of the week (Saturday) or end of month
      const daysUntilSaturday = 6 - weekStartDate.getDay();
      let weekEndDay = Math.min(currentWeekStartDay + daysUntilSaturday, daysInMonth);
      const weekEndDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), weekEndDay);
      
      // Calculate total hours for this week
      let weekTotalHours = 0;
      for (let d = currentWeekStartDay; d <= weekEndDay; d++) {
        const dayDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), d);
        const dayStr = dayDate.toISOString().split('T')[0];
        
        const dayEntries = timeEntries.filter(entry => {
          if (entry.workDate) {
            const entryWorkDate = entry.workDate.split('T')[0];
            return entryWorkDate === dayStr;
          }
          return false;
        });
        
        const totalSeconds = dayEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
        weekTotalHours += totalSeconds / 3600;
      }
      
      // Format: "06 Nov - 12 Nov 2025"
      const startDateStr = `${currentWeekStartDay.toString().padStart(2, '0')} ${monthName}`;
      const endDateStr = `${weekEndDay.toString().padStart(2, '0')} ${monthName} ${weekEndDate.getFullYear()}`;
      const weekLabel = `${startDateStr} - ${endDateStr}`;
      
      weeks.push({
        weekLabel,
        totalHours: Math.round(weekTotalHours * 10) / 10,
        startDate: startDateStr,
        endDate: endDateStr,
      });
      
      // Move to next week (next Sunday)
      currentWeekStartDay = weekEndDay + 1;
    }
    
    return weeks;
  };

  const productivityData = getProductivityData();
  const monthlyWeeklyData = productivityView === 'month' ? getMonthlyWeeklyData() : [];
  const maxHours = Math.max(...productivityData.map(d => d.hours), 1);

  // Format time for display (HH:MM format)
  const formatTimeDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Calculate total recorded time on this task (sum of all time entries)
  const totalTaskTime = timeEntries.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
  
  // Add current running timer time to total if timer is running
  const displayTotalTime = formatTimeDisplay(totalTaskTime + (isTimerRunning ? elapsedTime : 0));

  // Get start and end times for timer display
  const timerStartTimeStr = editableStartTime
    ? editableStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '8:25';
  const timerEndTimeStr = editableEndTime
    ? editableEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '-- --';

  // Handle time picker open
  const handleTimerTimeClick = (type: 'start' | 'end') => {
    setTimerTimePickerMode(type);
    if (type === 'start') {
      setEditableStartTime(editableStartTime || new Date());
    } else {
      setEditableEndTime(editableEndTime || new Date());
    }
    setShowTimerTimePicker(true);
  };

  // Handle time picker change
  const handleTimerTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        if (timerTimePickerMode === 'start') {
          setEditableStartTime(selectedDate);
          setLiveStartTime(selectedDate);
          if (!isTimerRunning) {
            setTimerStartTime(selectedDate);
            setManualStartTimeSet(true);
          }
        } else {
          setEditableEndTime(selectedDate);
          setLiveEndTime(selectedDate);
          setActualEndTime(selectedDate);
          if (!isTimerRunning) {
            setManualEndTimeSet(true);
          }
        }
        setShowTimerTimePicker(false);
      } else if (event.type === 'dismissed') {
        setShowTimerTimePicker(false);
      }
    } else {
      // iOS
      if (selectedDate) {
        if (timerTimePickerMode === 'start') {
          setEditableStartTime(selectedDate);
          setLiveStartTime(selectedDate);
          if (!isTimerRunning) {
            setTimerStartTime(selectedDate);
            setManualStartTimeSet(true);
          }
        } else {
          setEditableEndTime(selectedDate);
          setLiveEndTime(selectedDate);
          setActualEndTime(selectedDate);
          if (!isTimerRunning) {
            setManualEndTimeSet(true);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#877ED2" />
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#F5F6FA">
      <View style={styles.container}>
        {/* Fixed Header with Purple Background */}
        <View style={styles.fixedHeader}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              My Task
            </Text>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Purple Background Section (150px height) */}
            <View style={styles.purpleBackgroundSection}>
              <View style={styles.purpleBackgroundContent}>
                <Text style={styles.purpleProjectLabel}>Project</Text>
                <Text style={styles.purpleProjectName}>{taskDetails.projectName || 'Project'}</Text>
                <Text style={styles.purpleLocation}>{taskDetails.location || 'Location'}</Text>
                <View style={styles.purpleDatesRow}>
                  <View style={styles.purpleDateItem}>
                    <Text style={styles.purpleDateLabel}>Start </Text>
                    <Text style={styles.purpleDateValue}>
                      {taskDetails.projectStartDate || taskDetails.assignedDate || '-'}
                    </Text>
                  </View>
                  <View style={styles.purpleDateItem}>
                    <Text style={styles.purpleDateLabel}>End </Text>
                    <Text style={styles.purpleDateValue}>
                      {taskDetails.projectEndDate || taskDetails.dueDate || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Task Details Card */}
            <View style={[styles.card, styles.firstCard]}>
          <View style={[styles.cardHeader, styles.firstCardHeader]}>
            <View style={[styles.statusBadge]}>
              <Text style={styles.statusBadgeText}>In Progress</Text>
            </View>
          </View>
          
          <View style={styles.taskTitleRow}>
            <Text style={styles.taskTitle}>{taskDetails.title}</Text>
            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Ionicons name={isDescriptionExpanded ? "chevron-up" : "chevron-down"} size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          <View style={styles.taskDescriptionContainer}>
            {isDescriptionExpanded && (
              <Text style={styles.taskDescription}>
                {taskDetails.description || 'Full-height wardrobe for the master bedroom with hanging space, shelves, drawers and loft storage. Spec details is added. Contact Akash for light fittings.'}
              </Text>
            )}
          </View>
          
          <View style={styles.taskDatesRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Assigned date</Text>
              <Text style={styles.dateValue}>{taskDetails.assignedDate || '2 Nov, 2025'}</Text>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Due date</Text>
              <Text style={styles.dateValue}>{taskDetails.dueDate || '10 Nov, 2025'}</Text>
            </View>
            <View style={styles.progressColumn}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>In Progress</Text>
                <Text style={styles.progressDays}>{String(getRemainingDays())}d</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${getProgressPercentage()}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Live Timer Card */}
        <View style={[styles.card, styles.liveTimerCard]}>
          <View style={styles.timerHeader}>
            <View style={styles.timerHeaderLeft}>
              <Text style={styles.timerTitle}>Live Timer</Text>
              <Text style={styles.timerDate}>{formatTimerDate(liveDate)}</Text>
            </View>
            <View style={styles.timerHeaderRight}>
              <Text style={styles.elapsedLabel}>Elapsed</Text>
              <Text style={styles.elapsedTime}>{displayTotalTime}</Text>
            </View>
          </View>
          
          <View style={styles.timerTimesRow}>
            <View style={styles.timerTimeColumn}>
              <Text style={styles.timerTimeLabel}>Start time</Text>
              <TouchableOpacity onPress={() => handleTimerTimeClick('start')}>
                <Text style={[styles.timerTimeValue, manualStartTimeSet && !isTimerRunning && styles.timerTimeValueSelected]}>
                  {timerStartTimeStr}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timerTimeColumn}>
              <Text style={styles.timerTimeLabel}>End Time</Text>
              <TouchableOpacity onPress={() => handleTimerTimeClick('end')}>
                <Text style={[styles.timerTimeValue, manualEndTimeSet && !isTimerRunning && styles.timerTimeValueSelected]}>
                  {timerEndTimeStr}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Show tick button when both times are manually set and timer is NOT running */}
            {manualStartTimeSet && manualEndTimeSet && !isTimerRunning && editableEndTime && (
              <TouchableOpacity 
                style={styles.manualSaveButton}
                onPress={saveManualTimeEntry}
              >
                <Ionicons name="checkmark-circle" size={28} color="#34C759" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.stopTimerButton}
              onPress={handleLiveTimerToggle}
            >
              <Ionicons name={isTimerRunning ? "time-outline" : "play"} size={20} color="#FFFFFF" />
              <Text style={styles.stopTimerText}>{isTimerRunning ? 'Stop Timer' : 'Start Timer'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Status Card */}
        <View style={[styles.card, styles.taskStatusCard]}>
          <View style={styles.taskStatusRow}>
            <View style={styles.taskStatusIconContainer}>
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.taskStatusContent}>
              <Text style={styles.taskStatusTitle}>Task Status</Text>
              <Text style={styles.taskStatusSubtitle}>Daily work status record</Text>
            </View>
            <View style={styles.taskStatusButtons}>
              <TouchableOpacity style={styles.taskStatusButton} onPress={showCameraOptions}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.teamSection}>
          <Text style={styles.teamTitle}>Team</Text>
          
          <View style={styles.teamCard}>
            {/* Manager Row - Show first team member as manager if available */}
            {teamMembersData.length > 0 && (
              <View style={styles.teamManagerRow}>
                <View style={styles.teamManagerInfo}>
                  <Text style={styles.teamManagerLabel}>Manager  </Text>
                  <Text style={styles.teamManagerName}>{teamMembersData[0]?.name || 'N/A'}</Text>
                </View>
                <Text style={styles.teamManagerTimeLabel}>Today</Text>
              </View>
            )}

            {/* Team Members List */}
            <View style={styles.teamMembersList}>
              {teamMembersData.length > 1 ? (
                teamMembersData.slice(1).map((member, index) => {
                  const initials = member.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  
                  const colors = ['#34C759', '#877ED2', '#FF9500', '#FF3B30', '#007AFF', '#AF52DE'];
                  const avatarColor = colors[index % colors.length];
                  
                  const formatTimeForDisplay = (seconds: number) => {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    return { hours, minutes };
                  };

                  const timeDisplay = formatTimeForDisplay(member.taskLoggedTime);

                  return (
                    <View key={member.id} style={styles.teamMemberRow}>
                      <View style={[styles.teamMemberAvatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.teamMemberAvatarText}>{initials}</Text>
                      </View>
                      <View style={styles.teamMemberInfo}>
                        <Text style={styles.teamMemberName}>{member.name}</Text>
                        <Text style={styles.teamMemberRole}>{member.role}</Text>
                      </View>
                      <View style={styles.teamMemberTimeContainer}>
                        <Text style={styles.teamMemberTimeNumber}>
                          {String(timeDisplay.hours).padStart(2, '0')}
                        </Text>
                        <Text style={styles.teamMemberTimeUnit}>hr </Text>
                        <Text style={styles.teamMemberTimeNumber}>
                          {String(timeDisplay.minutes).padStart(2, '0')}
                        </Text>
                        <Text style={styles.teamMemberTimeUnit}>min</Text>
                      </View>
                    </View>
                  );
                })
              ) : teamMembersData.length === 0 ? (
                <View style={styles.teamMemberRow}>
                  <Text style={styles.teamMemberName}>No team members found</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            setShowProductivityReportModal(true);
          }}
        >
          <View style={styles.bottomNavIcon}>
            <Ionicons name="bar-chart-outline" size={24} color="#877ED2" />
          </View>
          <Text style={styles.bottomNavLabel}>Productivity</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={async () => {
            // Refresh time entries before showing modal
            try {
              console.log('Fetching time entries for taskId:', taskId);
              const timeEntriesData = await dashboardApi.getTaskTimeEntries(taskId);
              console.log('Refreshed time entries count:', timeEntriesData?.length);
              
              if (!timeEntriesData || timeEntriesData.length === 0) {
                console.log('No time entries returned from API');
                setShowStatusRecordModal(true);
                return;
              }
              
              const formattedEntries = timeEntriesData.map((entry: any) => {
                const workDate = new Date(entry.work_date);
                const startTime = new Date(entry.start_time);
                const endTime = new Date(entry.end_time);
                
                const durationMinutes = entry.duration_minutes || 0;
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;
                const durationStr = hours > 0 
                  ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` 
                  : `${minutes}m`;

                const formattedStartTime = startTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });
                const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });
                
                const isEdited = entry.updated_at && entry.created_at && entry.updated_at !== entry.created_at;
                const originalStartTime = entry.original_start_time 
                  ? new Date(entry.original_start_time).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })
                  : undefined;
                const originalEndTime = entry.original_end_time
                  ? new Date(entry.original_end_time).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })
                  : undefined;
                
                return {
                  id: entry.id.toString(),
                  date: workDate.toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    weekday: 'short'
                  }).replace(/\//g, '-'),
                  workDate: entry.work_date,
                  startTime: formattedStartTime,
                  endTime: formattedEndTime,
                  originalStartTime: originalStartTime,
                  originalEndTime: originalEndTime,
                  duration: durationStr,
                  durationSeconds: durationMinutes * 60,
                  project: entry.task_title || taskDetails.title,
                  category: 'Work',
                  notes: entry.description || '',
                  canEdit: true,
                  createdAt: entry.created_at,
                  updatedAt: entry.updated_at,
                };
              });
              
              setTimeEntries(formattedEntries);
            } catch (error) {
              console.error('Error refreshing time entries:', error);
            }
            setShowStatusRecordModal(true);
          }}
        >
          <View style={styles.bottomNavIcon}>
            <Ionicons name="clipboard-outline" size={24} color="#877ED2" />
            <View style={styles.bottomNavBadge}>
              <Ionicons name="time-outline" size={8} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.bottomNavLabel}>Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            setShowAttachmentsModal(true);
          }}
        >
          <View style={styles.bottomNavIcon}>
            <Ionicons name="document-outline" size={24} color="#877ED2" />
          </View>
          <Text style={styles.bottomNavLabel}>Attachments</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Time Picker Modal */}
      <Modal
        visible={showTimerTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimerTimePicker(false)}
      >
        <View style={styles.timePickerModalOverlay}>
          <View style={styles.timePickerModalContent}>
            <View style={styles.timePickerModalHeader}>
              <Text style={styles.timePickerModalTitle}>
                Select {timerTimePickerMode === 'start' ? 'Start' : 'End'} Time
              </Text>
              <View style={styles.timePickerViewToggle}>
                <TouchableOpacity
                  style={[styles.timePickerViewButton, !timerTimePickerListView && styles.timePickerViewButtonActive]}
                  onPress={() => setTimerTimePickerListView(false)}
                >
                  <Ionicons name="time-outline" size={20} color={!timerTimePickerListView ? '#877ED2' : '#8E8E93'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timePickerViewButton, timerTimePickerListView && styles.timePickerViewButtonActive]}
                  onPress={() => setTimerTimePickerListView(true)}
                >
                  <Ionicons name="list" size={20} color={timerTimePickerListView ? '#877ED2' : '#8E8E93'} />
                </TouchableOpacity>
              </View>
            </View>

            {timerTimePickerListView ? (
              <View style={styles.timePickerListContainer}>
                <ScrollView>
                  {Array.from({ length: 24 }, (_, hour) => 
                    Array.from({ length: 4 }, (_, quarter) => {
                      const minutes = quarter * 15;
                      const time = new Date();
                      time.setHours(hour, minutes, 0, 0);
                      const timeStr = time.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      });
                      return (
                        <TouchableOpacity
                          key={`${hour}-${minutes}`}
                          style={styles.timePickerListItem}
                          onPress={() => {
                            handleTimerTimeChange(null, time);
                            setShowTimerTimePicker(false);
                          }}
                        >
                          <Text style={styles.timePickerListItemText}>{timeStr}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.timePickerClockContainer}>
                <DateTimePicker
                  value={timerTimePickerMode === 'start' ? editableStartTime : (editableEndTime || new Date())}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimerTimeChange}
                  style={styles.timePicker}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.timePickerConfirmButton}
                    onPress={() => setShowTimerTimePicker(false)}
                  >
                    <Text style={styles.timePickerConfirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.timePickerModalFooter}>
              <TouchableOpacity
                style={styles.timePickerCancelButton}
                onPress={() => setShowTimerTimePicker(false)}
              >
                <Text style={styles.timePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Timestamp Camera with Overlays */}
      <TimestampCamera
        visible={showTimestampCamera}
        onClose={() => setShowTimestampCamera(false)}
        onPhotoTaken={handlePhotoTaken}
        taskTitle={taskDetails.title}
        projectName={taskDetails.projectName}
        taskId={taskDetails.id}
        workType={filterWorkType !== 'All' ? filterWorkType : 'General'}
      />

      {/* Photo Proof Viewer */}
      {selectedPhoto && (
        <PhotoProofViewer
          visible={showPhotoModal}
          onClose={() => {
            setShowPhotoModal(false);
            setSelectedPhoto(null);
          }}
          imageUri={selectedPhoto.uri}
          timestamp={selectedPhoto.timestamp}
          location={selectedPhoto.location}
          metadata={{
            taskTitle: selectedPhoto.metadata?.taskTitle || taskDetails.title,
            projectName: selectedPhoto.metadata?.projectName || taskDetails.projectName,
            workType: selectedPhoto.metadata?.workType || selectedPhoto.workType || 'General',
          }}
        />
      )}

      {/* Attachments Modal */}
      <Modal
        visible={showAttachmentsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAttachmentsModal(false)}
      >
        <SafeAreaWrapper>
          <View style={styles.attachmentsModalContainer}>
            {/* Header */}
            <View style={styles.attachmentsModalHeader}>
              <TouchableOpacity 
                style={styles.attachmentsModalBackButton}
                onPress={() => setShowAttachmentsModal(false)}
              >
                <Ionicons name="chevron-back" size={28} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.attachmentsModalTitle}>Attachments</Text>
              <TouchableOpacity style={styles.attachmentsModalMoreButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <View style={styles.attachmentsTabs}>
              {(() => {
                const documents = attachments.filter(a => 
                  a.file_extension === '.pdf' || 
                  a.file_extension === '.doc' || 
                  a.file_extension === '.docx' || 
                  a.file_extension === '.xls' || 
                  a.file_extension === '.xlsx' || 
                  a.file_extension === '.ppt' || 
                  a.file_extension === '.pptx' || 
                  a.file_extension === '.txt'
                );
                const photos = attachments.filter(a => a.is_image || 
                  a.file_extension === '.jpg' || 
                  a.file_extension === '.jpeg' || 
                  a.file_extension === '.png' || 
                  a.file_extension === '.gif'
                );
                const videos = attachments.filter(a => 
                  a.file_extension === '.mp4' || 
                  a.file_extension === '.mov' || 
                  a.file_extension === '.avi' || 
                  a.mime_type?.includes('video')
                );

                const tabs = [
                  { key: 'all', label: `All (${attachments.length})` },
                  { key: 'document', label: `Document (${documents.length})` },
                  { key: 'photo', label: `Photo (${photos.length})` },
                  { key: 'video', label: `Video (${videos.length})` },
                ];

                return (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.attachmentsTabsScroll}
                    contentContainerStyle={styles.attachmentsTabsContent}
                  >
                    {tabs.map((tab) => (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.attachmentsTab,
                          attachmentFilter === tab.key && styles.attachmentsTabActive
                        ]}
                        onPress={() => setAttachmentFilter(tab.key as any)}
                      >
                        <Text
                          style={[
                            styles.attachmentsTabText,
                            attachmentFilter === tab.key && styles.attachmentsTabTextActive
                          ]}
                        >
                          {tab.label}
                        </Text>
                        {attachmentFilter === tab.key && (
                          <View style={styles.attachmentsTabIndicator} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                );
              })()}
            </View>

            {/* Attachments Grid */}
            <ScrollView 
              style={styles.attachmentsModalContent}
              contentContainerStyle={styles.attachmentsGridContainer}
            >
              {(() => {
                let filteredAttachments = attachments;
                
                if (attachmentFilter === 'document') {
                  filteredAttachments = attachments.filter(a => 
                    a.file_extension === '.pdf' || 
                    a.file_extension === '.doc' || 
                    a.file_extension === '.docx' || 
                    a.file_extension === '.xls' || 
                    a.file_extension === '.xlsx' || 
                    a.file_extension === '.ppt' || 
                    a.file_extension === '.pptx' || 
                    a.file_extension === '.txt'
                  );
                } else if (attachmentFilter === 'photo') {
                  filteredAttachments = attachments.filter(a => a.is_image || 
                    a.file_extension === '.jpg' || 
                    a.file_extension === '.jpeg' || 
                    a.file_extension === '.png' || 
                    a.file_extension === '.gif'
                  );
                } else if (attachmentFilter === 'video') {
                  filteredAttachments = attachments.filter(a => 
                    a.file_extension === '.mp4' || 
                    a.file_extension === '.mov' || 
                    a.file_extension === '.avi' || 
                    a.mime_type?.includes('video')
                  );
                }

                if (filteredAttachments.length === 0) {
                  return (
                    <View style={styles.attachmentsEmpty}>
                      <Text style={styles.attachmentsEmptyText}>No attachments found</Text>
                    </View>
                  );
                }

                return (
                  <View style={styles.attachmentsGrid}>
                    {filteredAttachments.map((attachment, index) => {
                      const isDocument = attachment.file_extension === '.pdf' || 
                        attachment.file_extension === '.doc' || 
                        attachment.file_extension === '.docx';
                      const isPhoto = attachment.is_image || 
                        attachment.file_extension === '.jpg' || 
                        attachment.file_extension === '.jpeg' || 
                        attachment.file_extension === '.png';
                      const isVideo = attachment.file_extension === '.mp4' || 
                        attachment.file_extension === '.mov' || 
                        attachment.mime_type?.includes('video');

                      return (
                        <TouchableOpacity
                          key={attachment.id || index}
                          style={styles.attachmentGridItem}
                          onPress={() => {
                            // Open full screen viewer for photos/videos, link for documents
                            if (isPhoto || isVideo) {
                              setSelectedAttachment(attachment);
                              setShowAttachmentViewer(true);
                            } else if (attachment.file_url) {
                              Linking.openURL(attachment.file_url);
                            }
                          }}
                        >
                          {isPhoto && attachment.file_url ? (
                            <Image
                              source={{ uri: attachment.file_url }}
                              style={styles.attachmentThumbnail}
                              resizeMode="cover"
                            />
                          ) : isVideo ? (
                            <View style={styles.attachmentVideoContainer}>
                              <Image
                                source={{ uri: attachment.file_url || attachment.thumbnail_url }}
                                style={styles.attachmentThumbnail}
                                resizeMode="cover"
                              />
                              <View style={styles.attachmentPlayIcon}>
                                <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.attachmentDocumentContainer}>
                              <Ionicons 
                                name={attachment.file_extension === '.pdf' ? 'document-text' : 'document'} 
                                size={48} 
                                color="#DC143C" 
                              />
                              <Text style={styles.attachmentPDFLabel}>PDF</Text>
                            </View>
                          )}
                          <Text style={styles.attachmentGridFileName} numberOfLines={2}>
                            {attachment.original_name || attachment.file_name || 'Untitled'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </SafeAreaWrapper>
      </Modal>

      {/* Attachment Full Screen Viewer Modal */}
      <Modal
        visible={showAttachmentViewer}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAttachmentViewer(false)}
      >
        <View style={styles.attachmentViewerContainer}>
          {/* Header */}
          <View style={styles.attachmentViewerHeader}>
            <View style={styles.attachmentViewerHeaderLeft}>
              <TouchableOpacity 
                style={styles.attachmentViewerBackButton}
                onPress={() => setShowAttachmentViewer(false)}
              >
                <Ionicons name="chevron-back" size={28} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.attachmentViewerTitle}>Attachments</Text>
            </View>
            <View>
              <TouchableOpacity 
                style={styles.attachmentViewerMoreButton}
                onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
              </TouchableOpacity>
              {showAttachmentMenu && (
                <View style={styles.attachmentMenuDropdown}>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => {
                      setShowAttachmentMenu(false);
                      // Handle save
                    }}
                  >
                    <Text style={styles.attachmentMenuItemText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => {
                      setShowAttachmentMenu(false);
                      // Handle share
                    }}
                  >
                    <Text style={styles.attachmentMenuItemText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => {
                      setShowAttachmentMenu(false);
                      // Handle delete
                    }}
                  >
                    <Text style={styles.attachmentMenuItemText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Full Screen Image/Video */}
          <View style={styles.attachmentViewerContent}>
            {selectedAttachment && (
              <>
                {(selectedAttachment.file_extension === '.mp4' || 
                  selectedAttachment.file_extension === '.mov' || 
                  selectedAttachment.mime_type?.includes('video')) ? (
                  <View style={styles.attachmentViewerVideoContainer}>
                    <Image
                      source={{ uri: selectedAttachment.file_url }}
                      style={styles.attachmentViewerImage}
                      resizeMode="contain"
                    />
                    <TouchableOpacity 
                      style={styles.attachmentViewerPlayButton}
                      onPress={() => {
                        if (selectedAttachment.file_url) {
                          Linking.openURL(selectedAttachment.file_url);
                        }
                      }}
                    >
                      <Ionicons name="play-circle" size={64} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image
                    source={{ uri: selectedAttachment.file_url }}
                    style={styles.attachmentViewerImage}
                    resizeMode="contain"
                  />
                )}
              </>
            )}
          </View>

          {/* File Name at Bottom */}
          <View style={styles.attachmentViewerFooter}>
            <Text style={styles.attachmentViewerFileName}>
              {selectedAttachment?.original_name || selectedAttachment?.file_name || 'Untitled'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Status Record Modal */}
      <Modal
        visible={showStatusRecordModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowStatusRecordModal(false)}
      >
        <SafeAreaWrapper>
          <View style={styles.statusRecordContainer}>
            {/* Header */}
            <View style={styles.statusRecordHeader}>
              <TouchableOpacity 
                style={styles.statusRecordBackButton}
                onPress={() => setShowStatusRecordModal(false)}
              >
                <Ionicons name="chevron-back" size={28} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.statusRecordTitle}>Status Record</Text>
              <TouchableOpacity style={styles.statusRecordMoreButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.statusRecordContent} showsVerticalScrollIndicator={false}>
              {(() => {
                console.log('Status Modal - timeEntries:', timeEntries);
                console.log('Status Modal - timeEntries count:', timeEntries.length);
                
                // Show empty state if no time entries
                if (timeEntries.length === 0) {
                  return (
                    <View style={styles.srEmptyState}>
                      <Ionicons name="time-outline" size={48} color="#8E8E93" />
                      <Text style={styles.srEmptyStateText}>No time entries recorded</Text>
                      <Text style={styles.srEmptyStateSubtext}>Start the timer to record your work</Text>
                    </View>
                  );
                }
                
                // Group time entries by date
                const entriesByDate: { [key: string]: TimeEntry[] } = {};
                timeEntries.forEach(entry => {
                  let dateKey = '';
                  
                  // First try to get date from workDate (ISO format like "2026-01-14T18:30:00.000Z")
                  if (entry.workDate) {
                    if (entry.workDate.includes('T')) {
                      // Extract just the date part from ISO datetime
                      dateKey = entry.workDate.split('T')[0];
                    } else if (entry.workDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      // Already in YYYY-MM-DD format
                      dateKey = entry.workDate;
                    }
                  }
                  
                  // Fallback: try to parse from date string (format: "15-01-2026, Wed")
                  if (!dateKey && entry.date) {
                    const datePart = entry.date.split(',')[0].trim();
                    if (datePart) {
                      const parts = datePart.split('-');
                      if (parts.length === 3) {
                        // Convert DD-MM-YYYY to YYYY-MM-DD
                        dateKey = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                    }
                  }
                  
                  console.log('Entry:', entry.id, 'workDate:', entry.workDate, '-> dateKey:', dateKey);
                  
                  if (dateKey) {
                    if (!entriesByDate[dateKey]) {
                      entriesByDate[dateKey] = [];
                    }
                    entriesByDate[dateKey].push(entry);
                  }
                });

                const sortedDates = Object.keys(entriesByDate).sort((a, b) => 
                  new Date(b).getTime() - new Date(a).getTime()
                );
                
                console.log('Sorted dates:', sortedDates);

                return sortedDates.map((dateKey) => {
                  const dateEntries = entriesByDate[dateKey];
                  const date = new Date(dateKey + 'T00:00:00');
                  if (isNaN(date.getTime())) return null;

                  const dateStr = date.toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  });

                  // Calculate total duration
                  const totalSeconds = dateEntries.reduce((sum, entry) => 
                    sum + (entry.durationSeconds || 0), 0
                  );
                  const totalHours = Math.floor(totalSeconds / 3600);
                  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

                  const hasEdited = dateEntries.some(entry => 
                    entry.updatedAt && entry.createdAt && entry.updatedAt !== entry.createdAt
                  );
                  const isExpanded = expandedDates.has(dateKey);

                  // Get photos for this date
                  const datePhotos = photos.filter(photo => {
                    try {
                      const photoDateStr = new Date(photo.timestamp).toISOString().split('T')[0];
                      return photoDateStr === dateKey;
                    } catch { return false; }
                  });

                  return (
                    <View key={dateKey} style={styles.srDateSection}>
                      {/* Date Header Row */}
                      <TouchableOpacity
                        style={styles.srDateHeader}
                        onPress={() => {
                          const newExpanded = new Set(expandedDates);
                          isExpanded ? newExpanded.delete(dateKey) : newExpanded.add(dateKey);
                          setExpandedDates(newExpanded);
                        }}
                      >
                        <Text style={styles.srDateText}>{dateStr}</Text>
                        <View style={styles.srDateDuration}>
                          <Text style={styles.srDurationNum}>{String(totalHours).padStart(2, '0')}</Text>
                          <Text style={styles.srDurationUnit}>hr </Text>
                          <Text style={styles.srDurationNum}>{String(totalMinutes).padStart(2, '0')}</Text>
                          <Text style={styles.srDurationUnit}>min</Text>
                        </View>
                        {hasEdited && <Text style={styles.srEditedLabel}>edited</Text>}
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#8E8E93" 
                        />
                      </TouchableOpacity>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <View style={styles.srExpandedContent}>
                          {/* Time Entries */}
                          {dateEntries.map((entry, index) => {
                            const isEdited = entry.updatedAt && entry.createdAt && entry.updatedAt !== entry.createdAt;
                            
                            // Parse duration for current times
                            const durationSec = entry.durationSeconds || 0;
                            const hrs = Math.floor(durationSec / 3600);
                            const mins = Math.floor((durationSec % 3600) / 60);

                            // Parse time to get just HH:MM
                            const parseTime = (timeStr: string) => {
                              const match = timeStr.match(/(\d{1,2}):(\d{2})/);
                              return match ? `${match[1].padStart(2, '0')}:${match[2]}` : timeStr;
                            };

                            // Calculate original duration if edited
                            let originalHrs = 0;
                            let originalMins = 0;
                            if (isEdited && entry.originalStartTime && entry.originalEndTime) {
                              const parseTimeToMinutes = (timeStr: string) => {
                                const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                                if (match) {
                                  let hours = parseInt(match[1]);
                                  const minutes = parseInt(match[2]);
                                  const period = match[3];
                                  if (period) {
                                    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                                    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                                  }
                                  return hours * 60 + minutes;
                                }
                                return 0;
                              };
                              const origStartMins = parseTimeToMinutes(entry.originalStartTime);
                              let origEndMins = parseTimeToMinutes(entry.originalEndTime);
                              if (origEndMins <= origStartMins) origEndMins += 24 * 60;
                              const origDiffMins = origEndMins - origStartMins;
                              originalHrs = Math.floor(origDiffMins / 60);
                              originalMins = origDiffMins % 60;
                            }

                            return (
                              <View key={entry.id || index} style={styles.srTimeEntry}>
                                {/* Current times row */}
                                <View style={styles.srTimeRow}>
                                  <Text style={styles.srTimeText}>{parseTime(entry.startTime)}</Text>
                                  <Text style={styles.srTimeText}>{parseTime(entry.endTime)}</Text>
                                  <View style={styles.srEntryDuration}>
                                    <Text style={styles.srDurationNum}>{String(hrs).padStart(2, '0')}</Text>
                                    <Text style={styles.srDurationUnit}>hr </Text>
                                    <Text style={styles.srDurationNum}>{String(mins).padStart(2, '0')}</Text>
                                    <Text style={styles.srDurationUnit}>min</Text>
                                  </View>
                                  {isEdited ? (
                                    <Ionicons name="checkmark" size={20} color="#877ED2" />
                                  ) : (
                                    <TouchableOpacity 
                                      onPress={() => handleEditTimeEntry(entry)}
                                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                      <Ionicons name="create-outline" size={20} color="#877ED2" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                                {/* Original times (if edited) - shown below in purple */}
                                {isEdited && entry.originalStartTime && entry.originalEndTime && (
                                  <View style={styles.srTimeRowEdited}>
                                    <Text style={styles.srTimeOriginal}>{parseTime(entry.originalStartTime)}</Text>
                                    <Text style={styles.srTimeOriginal}>{parseTime(entry.originalEndTime)}</Text>
                                    <View style={styles.srEntryDuration}>
                                      <Text style={[styles.srDurationNum, styles.srDurationEdited]}>
                                        {String(originalHrs).padStart(2, '0')}
                                      </Text>
                                      <Text style={[styles.srDurationUnit, styles.srDurationEdited]}>hr </Text>
                                      <Text style={[styles.srDurationNum, styles.srDurationEdited]}>
                                        {String(originalMins).padStart(2, '0')}
                                      </Text>
                                      <Text style={[styles.srDurationUnit, styles.srDurationEdited]}>min</Text>
                                    </View>
                                    <Text style={styles.srEditedLabel}>edited</Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}

                          {/* Photos Section */}
                          {datePhotos.length > 0 && (
                            <View style={styles.srPhotosSection}>
                              <View style={styles.srPhotosRow}>
                                {datePhotos.slice(0, 4).map((photo, idx) => (
                                  <TouchableOpacity
                                    key={photo.id || idx}
                                    onPress={() => {
                                      setSelectedPhoto(photo);
                                      setShowPhotoModal(true);
                                    }}
                                  >
                                    <Image
                                      source={{ uri: photo.uri }}
                                      style={styles.srPhotoThumb}
                                      resizeMode="cover"
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Notes/Messages Section */}
                          {dateEntries.some(e => e.notes) && (
                            <View style={styles.srMessagesSection}>
                              {dateEntries.filter(e => e.notes).map((entry, idx) => {
                                const noteTime = new Date(entry.createdAt || new Date())
                                  .toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false 
                                  });
                                return (
                                  <View key={idx}>
                                    {/* User's note (left aligned) */}
                                    <View style={styles.srMessageLeft}>
                                      <Text style={styles.srMessageTime}>{noteTime}</Text>
                                      <Text style={styles.srMessageText}>{entry.notes}</Text>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                }).filter(Boolean);
              })()}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </SafeAreaWrapper>
      </Modal>

      {/* Edit Time Entry Modal */}
      <Modal
        visible={showEditTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditTimeModal(false)}
      >
        <View style={styles.editTimeModalOverlay}>
          <View style={styles.editTimeModalContent}>
            {/* Header */}
            <View style={styles.editTimeModalHeader}>
              <TouchableOpacity onPress={() => setShowEditTimeModal(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.editTimeModalTitle}>Edit Time Entry</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Body */}
            <View style={styles.editTimeModalBody}>
              {/* Start Time */}
              <View style={styles.editTimeRow}>
                <Text style={styles.editTimeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.editTimeButton}
                  onPress={() => handleEditTimePickerOpen('start')}
                >
                  <Text style={styles.editTimeValue}>{editStartTime || 'Select time'}</Text>
                  <Ionicons name="time-outline" size={20} color="#877ED2" />
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={styles.editTimeRow}>
                <Text style={styles.editTimeLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.editTimeButton}
                  onPress={() => handleEditTimePickerOpen('end')}
                >
                  <Text style={styles.editTimeValue}>{editEndTime || 'Select time'}</Text>
                  <Ionicons name="time-outline" size={20} color="#877ED2" />
                </TouchableOpacity>
              </View>

              {/* Duration Preview */}
              {editStartTime && editEndTime && (
                <View style={styles.editTimeDurationPreview}>
                  <Text style={styles.editTimeDurationLabel}>Duration:</Text>
                  <Text style={styles.editTimeDurationValue}>{calculateEditDuration()}</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.editTimeModalFooter}>
              <TouchableOpacity
                style={styles.editTimeCancelButton}
                onPress={() => setShowEditTimeModal(false)}
              >
                <Text style={styles.editTimeCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editTimeSaveButton, (!editStartTime || !editEndTime) && styles.editTimeSaveButtonDisabled]}
                onPress={handleSaveEditTimeEntry}
                disabled={!editStartTime || !editEndTime || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editTimeSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Time Picker Modal */}
      <Modal
        visible={showEditTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditTimePicker(false)}
      >
        <View style={styles.editTimePickerOverlay}>
          <View style={styles.editTimePickerContent}>
            <View style={styles.editTimePickerHeader}>
              <Text style={styles.editTimePickerTitle}>
                Select {editTimePickerType === 'start' ? 'Start' : 'End'} Time
              </Text>
            </View>

            <View style={styles.editTimePickerBody}>
              <DateTimePicker
                value={editPickerTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEditTimePickerChange}
                style={{ width: '100%' }}
              />
            </View>

            {Platform.OS === 'ios' && (
              <View style={styles.editTimePickerFooter}>
                <TouchableOpacity
                  style={styles.editTimePickerCancelBtn}
                  onPress={() => setShowEditTimePicker(false)}
                >
                  <Text style={styles.editTimePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editTimePickerConfirmBtn}
                  onPress={handleEditTimePickerConfirm}
                >
                  <Text style={styles.editTimePickerConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Productivity Report Modal */}
      <Modal
        visible={showProductivityReportModal}
        animationType="slide"
        onRequestClose={() => {
          setShowProductivityReportModal(false);
        }}
      >
        <SafeAreaWrapper backgroundColor="#F5F6FA">
          <View style={styles.productivityReportContainer}>
            {/* Header */}
            <View style={styles.productivityReportHeader} pointerEvents="box-none">
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  setShowProductivityReportModal(false);
                }}
                style={styles.productivityReportBackButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={20} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.productivityReportTitle}>Productivity Report</Text>
              <TouchableOpacity style={styles.productivityReportMenuButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* ScrollView for content */}
            <ScrollView 
              style={styles.productivityReportScrollView}
              contentContainerStyle={styles.productivityReportScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Existing Productivity Section */}
              <View style={styles.productivitySection}>
                <View style={styles.productivityCard}>
                  {/* Header with toggles and navigation */}
                  <View style={styles.productivityCardHeader}>
                    {/* First Row: Toggles */}
                    <View style={styles.productivityHeaderTopRow}>
                      {/* Left: Week/Month Toggle with Week text below */}
                      <View style={styles.productivityHeaderLeft}>
                        <View style={styles.productivityViewToggle}>
                          <TouchableOpacity
                            style={[styles.productivityToggleButton, productivityView === 'week' && styles.productivityToggleButtonActive]}
                            onPress={() => setProductivityView('week')}
                          >
                            <Text style={[styles.productivityToggleText, productivityView === 'week' && styles.productivityToggleTextActive]}>Week</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.productivityToggleButton, productivityView === 'month' && styles.productivityToggleButtonActive]}
                            onPress={() => setProductivityView('month')}
                          >
                            <Text style={[styles.productivityToggleText, productivityView === 'month' && styles.productivityToggleTextActive]}>Month</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Right: Chart Type Toggle */}
                      <View style={styles.productivityChartToggle}>
                        <TouchableOpacity
                          style={[styles.productivityChartToggleButton, chartView === 'bar' && styles.productivityChartToggleButtonActive]}
                          onPress={() => setChartView('bar')}
                        >
                          <Ionicons name="bar-chart" size={20} color={chartView === 'bar' ? '#877ED2' : '#8E8E93'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.productivityChartToggleButton, chartView === 'list' && styles.productivityChartToggleButtonActive]}
                          onPress={() => setChartView('list')}
                        >
                          <Ionicons name="list" size={20} color={chartView === 'list' ? '#877ED2' : '#8E8E93'} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Second Row: Week/Month Navigation - Full Width */}
                    <View style={styles.productivityWeekNav}>
                      <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.productivityNavButton}>
                        <Ionicons name="chevron-back" size={20} color="#727272" />
                      </TouchableOpacity>
                      <View style={styles.productivityWeekNavText}>
                        <Text style={styles.productivityWeekLabelCenter}>{productivityView === 'week' ? 'Week' : 'Month'}</Text>
                        <Text style={styles.productivityWeekRange}>{getProductivityWeekRange()}</Text>
                      </View>
                      <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.productivityNavButton}>
                        <Ionicons name="chevron-forward" size={20} color="#727272" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Bar Chart */}
                  {chartView === 'bar' && (
                    <View style={[
                      styles.productivityChartArea,
                      productivityView === 'month' && styles.productivityChartAreaMonth
                    ]}>
                      {/* Horizontal Grid Lines - 9 lines representing 0-8 hours */}
                      <View style={[
                        styles.productivityGridLines,
                        productivityView === 'month' && styles.productivityGridLinesMonth
                      ]}>
                        {/* 8hrs - top */}
                        <View style={styles.productivityGridLine} />
                        {/* 7hrs */}
                        <View style={styles.productivityGridLine} />
                        {/* 6hrs */}
                        <View style={styles.productivityGridLine} />
                        {/* 5hrs */}
                        <View style={styles.productivityGridLine} />
                        {/* 4hrs */}
                        <View style={styles.productivityGridLine} />
                        {/* 3hrs */}
                        <View style={styles.productivityGridLine} />
                        {/* 2hrs */}
                        <View style={styles.productivityGridLine} />
                        {/* 1hr */}
                        <View style={styles.productivityGridLine} />
                        {/* 0hrs - bottom (base of bars) */}
                        <View style={styles.productivityGridLine} />
                      </View>
                      
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.productivityChartScrollContainer}
                        contentContainerStyle={[
                          productivityView === 'week' ? styles.productivityChartScrollContentWeek : styles.productivityChartScrollContentMonth,
                          productivityView === 'week' && styles.productivityChartScrollContentCentered
                        ]}
                        scrollEnabled={productivityView !== 'week'}
                      >
                        <View style={[styles.productivityChartContainer, productivityView === 'week' && { width: '100%' }]}>
                          <View style={[
                            styles.productivityChart, 
                            productivityView === 'week' && { justifyContent: 'space-between', width: '100%' },
                            productivityView === 'month' && styles.productivityChartMonth
                          ]}>
                            {(() => {
                              // Debug log
                              console.log('=== Productivity Debug ===');
                              console.log('View:', productivityView);
                              console.log('Month:', currentWeekStart.toLocaleDateString());
                              console.log('Data length:', productivityData.length);
                              console.log('Max hours:', maxHours);
                              console.log('Entries with hours:', productivityData.filter(d => d.hours > 0));
                              console.log('Time entries:', timeEntries.length);
                              return null;
                            })()}
                            {productivityData.map((item, index) => {
                              // Use fixed 8-hour scale: 0hrs at bottom, 8hrs at top
                              const maxBarHeight = productivityView === 'month' ? 180 : 200;
                              const maxHoursScale = 8; // Fixed 8-hour scale
                              const barHeightPercent = item.hours > 0 ? (item.hours / maxHoursScale) * 100 : 0;
                              const fillHeight = item.hours > 0 ? Math.min((barHeightPercent / 100) * maxBarHeight, maxBarHeight) : 0;
                              const isSelected = selectedBarIndex === index && productivityView === 'month';
                              const showLabel = productivityView === 'week' || (item as any).showLabel;
                              
                              return (
                                <TouchableOpacity 
                                  key={index} 
                                  style={[
                                    styles.productivityBarColumn,
                                    productivityView === 'month' && styles.productivityBarColumnMonth
                                  ]}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    if (productivityView === 'month') {
                                      setSelectedBarIndex(isSelected ? null : index);
                                    }
                                  }}
                                >
                                  {/* Tooltip for selected bar in month view */}
                                  {isSelected && item.hours > 0 && (
                                    <View style={styles.productivityBarTooltip}>
                                      <Text style={styles.productivityBarTooltipHours}>{item.hours}hrs</Text>
                                      <Text style={styles.productivityBarTooltipDate}>{(item as any).fullDate || item.day}</Text>
                                    </View>
                                  )}
                                  {/* Hour Value Badge - Only show for week view */}
                                  {productivityView === 'week' && (
                                    <View style={[styles.productivityBarValueBadge, item.hours === 0 && styles.productivityBarValueBadgeZero]}>
                                      <Text style={[styles.productivityBarValue, item.hours === 0 && styles.productivityBarValueZero]}>{item.hours}</Text>
                                    </View>
                                  )}
                                  <View style={[
                                    styles.productivityBarWrapper,
                                    productivityView === 'month' && styles.productivityBarWrapperMonth
                                  ]}>
                                    <View 
                                      style={[
                                        styles.productivityBarFill,
                                        productivityView === 'month' && styles.productivityBarFillMonth,
                                        { 
                                          height: item.hours > 0 ? fillHeight : 0,
                                          backgroundColor: '#877ED2'
                                        }
                                      ]} 
                                    />
                                  </View>
                                  {/* Labels - Show for week view or at intervals for month view */}
                                  {showLabel && productivityView === 'month' && (
                                    <Text style={styles.productivityBarDateMonth}>{(item as any).fullDate || `${item.date}`}</Text>
                                  )}
                                  {productivityView === 'week' && (
                                    <View style={styles.productivityBarLabels}>
                                      <Text style={styles.productivityBarDay}>{item.day}</Text>
                                      <Text style={styles.productivityBarDate}>{item.date}</Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* List View */}
                  {chartView === 'list' && (
                    <View style={styles.productivityListContainer}>
                      {/* Week View - Show individual days */}
                      {productivityView === 'week' && productivityData.map((item, index) => {
                        const displayHours = Math.round(item.hours);
                        
                        return (
                          <View key={index} style={styles.productivityListItem}>
                            <Text style={styles.productivityListItemFullDate}>
                              {(item as any).fullDate || `${item.day}, ${item.date}`}
                            </Text>
                            <Text style={styles.productivityListItemDots} numberOfLines={1}>
                              {'·'.repeat(100)}
                            </Text>
                            <Text style={[
                              styles.productivityListItemHours,
                              displayHours === 0 && styles.productivityListItemHoursZero
                            ]}>
                              {displayHours}
                            </Text>
                          </View>
                        );
                      })}
                      
                      {/* Month View - Show weeks grouped */}
                      {productivityView === 'month' && monthlyWeeklyData.map((week, index) => {
                        const displayHours = Math.round(week.totalHours);
                        
                        return (
                          <View key={index} style={styles.productivityListItem}>
                            <Text style={styles.productivityListItemFullDate}>
                              {week.weekLabel}
                            </Text>
                            <Text style={styles.productivityListItemDots} numberOfLines={1}>
                              {'·'.repeat(100)}
                            </Text>
                            <Text style={[
                              styles.productivityListItemHours,
                              displayHours === 0 && styles.productivityListItemHoursZero
                            ]}>
                              {displayHours}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Summary */}
                  <View style={[
                    styles.productivitySummary,
                    productivityView === 'month' && chartView === 'bar' && styles.productivitySummaryMonth,
                    productivityView === 'week' && chartView === 'list' && styles.productivitySummaryWeekList,
                    productivityView === 'month' && chartView === 'list' && styles.productivitySummaryMonthList
                  ]}>
                    <View style={styles.productivitySummaryLeft}>
                      <Text style={styles.productivitySummaryLabel}>Time worked</Text>
                      <View style={styles.productivitySummaryHours}>
                        <Text style={styles.productivitySummaryHoursNumber}>
                          {Math.round(productivityData.reduce((sum, d) => sum + d.hours, 0))}
                        </Text>
                        <Text style={styles.productivitySummaryHoursUnit}>
                          hr
                        </Text>
                        <Text style={styles.productivitySummaryHoursSeparator}>
                          {' / '}
                        </Text>
                        <Text style={styles.productivitySummaryHoursNumber}>
                          {productivityData.filter(d => d.hours > 0).length}
                        </Text>
                        <Text style={styles.productivitySummaryHoursUnit}>
                          d
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productivitySummaryRight}>
                      <Text style={styles.productivitySummaryLabel}>Task</Text>
                      <Text style={styles.productivitySummaryTaskNumber}>
                        {timeEntries.filter(entry => {
                          if (productivityView === 'week') {
                            const sunday = new Date(currentWeekStart);
                            sunday.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
                            const weekEnd = new Date(sunday);
                            weekEnd.setDate(sunday.getDate() + 6);
                            const weekStartStr = sunday.toISOString().split('T')[0];
                            const weekEndStr = weekEnd.toISOString().split('T')[0];
                            return entry.workDate && entry.workDate >= weekStartStr && entry.workDate <= weekEndStr;
                          } else {
                            const firstDay = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
                            const lastDay = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0);
                            const monthStartStr = firstDay.toISOString().split('T')[0];
                            const monthEndStr = lastDay.toISOString().split('T')[0];
                            return entry.workDate && entry.workDate >= monthStartStr && entry.workDate <= monthEndStr;
                          }
                        }).length}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaWrapper>
      </Modal>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  fixedHeader: {
    backgroundColor: '#877ED2',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    // marginLeft: 10,
    fontSize: 20,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  cardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  purpleBackgroundSection: {
    backgroundColor: '#877ED2',
    height: 180,
    marginTop: -16,
    marginHorizontal: -16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: -40,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  purpleBackgroundContent: {
    flex: 1,
  },
  purpleProjectLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    marginLeft: 16,
  },
  purpleProjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: typography.families.medium,
    marginLeft: 16,
  },
  purpleLocation: {
    fontSize: 11,
    color: '#E8E7ED',
    opacity: 0.9,
    marginBottom: 16,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    marginLeft: 16,
  },
  purpleDatesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
    gap: 16,
  },
  purpleDateItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 16,
  },
  purpleDateLabel: {
    fontSize: 10,
    color: '#E8E7ED',
    opacity: 0.8,
    fontWeight: '400',
    fontFamily: typography.families.regular,
  },
  purpleDateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: typography.families.medium,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstCard: {
    zIndex: 10,
    paddingTop: 0,
    width: 372,
    height: 200,
    alignSelf: 'center',
    borderRadius: 10,
  },
  liveTimerCard: {
    width: 372,
    alignSelf: 'center',
    borderRadius: 10,
  },
  taskStatusCard: {
    width: 372,
    alignSelf: 'center',
    borderRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  firstCardHeader: {
    paddingTop: 0,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  statusBadge: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#7E99D2',
    width: 74,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#FFFFFF',
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#404040',
    marginRight: 8,
  },
  taskDescriptionContainer: {
    height: 70,
  },
  taskDescription: {
    fontSize: 12,
    color: '#8F8F8F',
    fontFamily: typography.families.regular,
    lineHeight: 18,
    marginBottom: 16,
  },
  taskDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#727272',
    fontFamily: typography.families.regular,
    fontWeight: '400',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#404040',
    fontFamily: typography.families.medium,
  },
  progressColumn: {
    flex: 1.5,
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 10,
    color: '#727272',
    fontFamily: typography.families.regular,
    fontWeight: '400',
    paddingLeft: 15,
  },
  progressBarContainer: {
    width: '80%',
    height: 6,
    backgroundColor: '#85C369',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: -2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressDays: {
    fontSize: 10,
    fontWeight: '700',
    color: '#85C369',
    fontFamily: typography.families.bold,
    minWidth: 24,
    paddingLeft: 14,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timerHeaderLeft: {
    flexDirection: 'column',
  },
  timerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#404040',
    marginBottom: 2,
    marginTop: -4,
  },
  timerDate: {
    fontSize: 10,
    color: '#8D8D8D',
    fontFamily: typography.families.medium,
    fontWeight: '500',
  },
  elapsedLabel: {
    fontSize: 10,
    color: '#727272',
    marginTop: 8,
    fontFamily: typography.families.regular,
    fontWeight: '400',
  },
  elapsedTime: {
    fontSize: 32,
    fontWeight: '500',
    color: '#404040',
    fontFamily: typography.families.medium,
    marginTop: -6,
  },
  timerTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  timerTimeColumn: {
    flex: 1,
  },
  timerTimeLabel: {
    fontSize: 10,
    color: '#727272',
    fontFamily: typography.families.regular,
    fontWeight: '400',
  },
  timerTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#404040',
    fontFamily: typography.families.medium,
  },
  timerTimeValueSelected: {
    color: '#877ED2',
    fontWeight: '600',
  },
  manualSaveButton: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  stopTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6F67CC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
    marginLeft: 50,
  },
  stopTimerText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: typography.families.regular,
  },
  taskStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStatusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#877ED2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskStatusContent: {
    flex: 1,
  },
  taskStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  taskStatusSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  taskStatusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  taskStatusButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#877ED2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productivitySection: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  productivityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  productivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 450,
  },
  productivityCardHeader: {
    marginBottom: 16,
  },
  productivityHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productivityHeaderLeft: {
    alignItems: 'flex-start',
  },
  productivityViewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 30,
    marginBottom: 4,
    height: 24,
    width: 200,
    textAlign: 'center',
  },
  productivityWeekLabelBelow: {
    fontSize: 12,
    color: '#8E8E93',
    // marginTop: 4,
  },
  productivityToggleButton: {
    paddingHorizontal: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  productivityToggleButtonActive: {
    backgroundColor: '#877ED2',
    width: 100,
  },
  productivityToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: typography.families.regular,
  },
  productivityToggleTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: typography.families.regular,
  },
  productivityWeekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 8,
    position: 'relative',
  },
  productivityNavButton: {
    zIndex: 1,
  },
  productivityWeekNavText: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  productivityWeekLabelCenter: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  productivityWeekRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  productivityChartToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F4',
    height: 24,
    borderRadius: 30,
    gap: 2,
  },
  productivityChartToggleButton: {
    width: 40,
    height: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productivityChartToggleButtonActive: {
    backgroundColor: '#6F67CC',
    borderRadius: 30,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productivityChartArea: {
    position: 'relative',
    marginBottom: 16,
    height: 270,
    overflow: 'visible',
    paddingBottom: 20,
  },
  productivityChartAreaMonth: {
    height: 280,
    paddingBottom: 30,
  },
  productivityGridLines: {
    position: 'absolute',
    top: 36, // Positioned to align with top of bars (badge height ~28px + marginBottom 8px = 36px)
    left: 0,
    right: 0,
    height: 200, // Same as bar height (productivityBarWrapper height)
    justifyContent: 'space-between',
    zIndex: 0,
  },
  productivityGridLinesMonth: {
    top: 50, // Align with top of month view bars (adjusted for month chart layout)
    bottom: 42, // Align bottom grid line with base of bars
    height: 180, // Match bar wrapper height
  },
  productivityGridLine: {
    height: 1,
    backgroundColor: '#E5E5EA',
    width: '100%',
  },
  productivityChartContainer: {
    marginBottom: 0,
    overflow: 'visible',
  },
  productivityChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 340,
    width: '100%',
    overflow: 'visible',
    paddingBottom: 60,
  },
  productivityBarColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    minWidth: 0,
    overflow: 'visible',
  },
  productivityBarValueBadge: {
    backgroundColor: '#E8E7ED',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 34,
    alignItems: 'center',
  },
  productivityBarValueBadgeZero: {
    backgroundColor: '#F5F5F5',
  },
  productivityBarValue: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#727272',
    textAlign: 'center',
  },
  productivityBarValueZero: {
    color: '#8E8E93',
  },
  productivityBarWrapper: {
    width: 14,
    height: 200,
    marginBottom: 10,
    alignSelf: 'center',
    borderRadius: 7,
    backgroundColor: '#E8E7ED',
    justifyContent: 'flex-end',
  },
  productivityBarBackground: {
    width: 14,
    height: 200,
    borderRadius: 7,
    backgroundColor: '#E8E7ED',
  },
  productivityBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  productivityBarLabels: {
    alignItems: 'center',
    marginTop: 4,
  },
  productivityBarDay: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#6F67CC',
    textAlign: 'center',
  },
  productivityBarDate: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#6F67CC',
    textAlign: 'center',
  },
  productivityBarDateMonth: {
    fontSize: 9,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#877ED2',
    textAlign: 'center',
    position: 'absolute',
    bottom: -20,
    width: 40,
    left: -17,
  },
  productivityBarFillMonth: {
    width: 6,
    borderRadius: 20,
  },
  productivityChartMonth: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    height: 260,
    paddingBottom: 20,
  },
  productivityBarColumnMonth: {
    width: 7,
    minWidth: 8,
    marginHorizontal: 1.5,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  productivityBarWrapperMonth: {
    width: 6,
    height: 180,
    marginBottom: 0,
    borderRadius: 20,
    backgroundColor: '#E8E7ED',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  productivityBarTooltip: {
    position: 'absolute',
    top: -45,
    left: -20,
    backgroundColor: '#404040',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 1000,
    alignItems: 'center',
    minWidth: 45,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  productivityBarTooltipHours: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.families.semibold,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  productivityBarTooltipDate: {
    fontSize: 9,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#AAAAAA',
    lineHeight: 12,
  },
  productivityChartScrollContentMonth: {
    // paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
  productivitySummary: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 10,
    gap: 40,
  },
  productivitySummaryMonth: {
    marginTop: -20,
  },
  productivitySummaryWeekList: {
    marginTop: -5,
    paddingTop: 5,
  },
  productivitySummaryMonthList: {
    marginTop: 55,
  },
  productivitySummaryLeft: {
  },
  productivitySummaryRight: {
  },
  productivitySummaryLabel: {
    fontSize: 10,
    color: '#727272',
    fontWeight: '400',
    fontFamily: typography.families.regular,
  },
  productivitySummaryHours: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productivitySummaryHoursNumber: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.families.bold,
    color: '#404040',
  },
  productivitySummaryHoursUnit: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#727272',
    marginLeft: 2,
  },
  productivitySummaryHoursSeparator: {
    fontSize: 14,
    color: '#8E8E93',
  },
  productivitySummaryTaskNumber: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.families.bold,
    color: '#404040',
  },
  productivitySummarySubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  productivityChartScrollContainer: {
    overflow: 'visible',
  },
  productivityChartScrollContent: {
    paddingHorizontal: 8,
  },
  productivityChartScrollContentWeek: {
    paddingHorizontal: 0,
    width: '100%',
  },
  productivityChartScrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  productivityListContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  productivityListScroll: {
    flex: 1,
  },
  productivityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  productivityListItemFullDate: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#877ED2',
  },
  productivityListItemDots: {
    flex: 1,
    marginHorizontal: 4,
    color: '#D1D1D6',
    fontSize: 12,
    letterSpacing: 2,
    overflow: 'hidden',
  },
  productivityListItemHours: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#000000',
    minWidth: 24,
    textAlign: 'right',
  },
  productivityListItemHoursZero: {
    color: '#8E8E93',
  },
  productivityListItemLeft: {
    flex: 1,
  },
  productivityListItemDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productivityListItemDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    minWidth: 40,
  },
  productivityListItemDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  productivityListItemRight: {
    alignItems: 'flex-end',
  },
  productivityListItemTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#877ED2',
  },
  productivityListItemTimeZero: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  timePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  timePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  timePickerViewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  timePickerViewButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerViewButtonActive: {
    backgroundColor: '#E5E5EA',
  },
  timePickerClockContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
  },
  timePickerListContainer: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  timePickerListItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  timePickerListItemText: {
    fontSize: 16,
    color: '#000000',
  },
  timePickerConfirmButton: {
    backgroundColor: '#877ED2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
  },
  timePickerConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timePickerModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  timePickerCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  timePickerCancelButtonText: {
    color: '#877ED2',
    fontSize: 16,
    fontWeight: '600',
  },
  teamSection: {
    marginBottom: 16,
    marginHorizontal: 8,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 372,
    alignSelf: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamManagerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
  },
  teamManagerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teamManagerLabel: {
    fontSize: 10,
    color: '#727272',
    fontWeight: '400',
    fontFamily: typography.families.regular,
  },
  teamManagerName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#404040',
  },
  teamManagerTimeLabel: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#727272',
  },
  teamMembersList: {
    gap: 16,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#877ED2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamMemberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#404040',
    marginBottom: 2,
  },
  teamMemberRole: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#727272',
  },
  teamMemberTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  teamMemberTimeNumber: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#000000',
  },
  teamMemberTimeUnit: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomNavIcon: {
    position: 'relative',
    marginBottom: 4,
  },
  bottomNavBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#877ED2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bottomNavBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    lineHeight: 10,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#877ED2',
    marginTop: 2,
  },
  // Attachments Modal Styles
  attachmentsModalContainer: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  attachmentsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  attachmentsModalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentsModalTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#000000',
    flex: 1,
    marginLeft: 2,
  },
  attachmentsModalMoreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentsTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDDCE6',
  },
  attachmentsTabsScroll: {
    maxHeight: 50,
  },
  attachmentsTabsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  attachmentsTab: {
    marginRight: 24,
    paddingBottom: 8,
    position: 'relative',
  },
  attachmentsTabActive: {
    // Active state handled by indicator
  },
  attachmentsTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  attachmentsTabTextActive: {
    color: '#877ED2',
    fontWeight: '600',
  },
  attachmentsTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#877ED2',
    borderRadius: 1,
  },
  attachmentsModalContent: {
    flex: 1,
  },
  attachmentsGridContainer: {
    padding: 16,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attachmentGridItem: {
    width: '30%',
    marginBottom: 8,
  },
  attachmentThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F6FA',
  },
  attachmentVideoContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F6FA',
  },
  attachmentPlayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  attachmentDocumentContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FDF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentPDFLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC143C',
    marginTop: 8,
  },
  attachmentGridFileName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
  },
  attachmentsEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  attachmentsEmptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  // Attachment Full Screen Viewer Styles
  attachmentViewerContainer: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  attachmentViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F6FA',
    paddingTop: 50,
  },
  attachmentViewerHeaderLeft: {
    flexDirection: 'row',
    textAlign: 'left',
  },
  attachmentViewerBackButton: {
    paddingLeft: 4,
  },
  attachmentViewerTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#000000',
    marginLeft: 8,
  },
  attachmentViewerMoreButton: {
    padding: 4,
  },
  attachmentMenuDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  attachmentMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachmentMenuItemText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  attachmentViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  attachmentViewerImage: {
    width: '100%',
    height: '100%',
  },
  attachmentViewerVideoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentViewerPlayButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentViewerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
  },
  attachmentViewerFileName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  // Status Record Modal Styles
  statusRecordContainer: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  statusRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#F6F6F6',
  },
  statusRecordBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRecordTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    fontFamily: typography.families.regular,
    flex: 1,
    marginLeft: 4,
  },
  statusRecordMoreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRecordContent: {
    flex: 1,
  },
  statusRecordDateSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusRecordDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusRecordDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statusRecordDateMiddle: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 30,
  },
  statusRecordDateDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  statusRecordDateHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusRecordDateDurationUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusRecordEdited: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  statusRecordDateContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  statusRecordTimeEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  statusRecordTimeRangeContainer: {
    flex: 1,
  },
  statusRecordTimeRange: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  statusRecordTimeRangeOriginal: {
    marginBottom: 4,
  },
  statusRecordTimeStrikethrough: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  statusRecordTimeRangeEdited: {
    color: '#877ED2',
    fontWeight: '600',
  },
  statusRecordTimeEntryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statusRecordTimeEntryDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusRecordDurationPart: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statusRecordDurationNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  statusRecordDurationUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#727272',
  },
  statusRecordDurationSpace: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusRecordTimeEntryDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statusRecordTimeEntryDurationEdited: {
    color: '#877ED2',
  },
  statusRecordTimeEntryEdited: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  statusRecordEditButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRecordEditButtonDisabled: {
    opacity: 0.5,
  },
  statusRecordPhotosSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  statusRecordPhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  statusRecordPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statusRecordPhotoItem: {
    width: '31%',
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusRecordPhotoThumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F5F6FA',
  },
  statusRecordMessages: {
    marginTop: 8,
  },
  statusRecordMessage: {
    marginBottom: 12,
  },
  statusRecordMessageTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  statusRecordMessageText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 20,
  },
  productivityReportContainer: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  productivityReportScrollView: {
    flex: 1,
  },
  productivityReportScrollContent: {
    padding: 4,
    paddingBottom: 20,
  },
  productivityReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: 1000,
    elevation: 5,
  },
  productivityReportBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    elevation: 6,
  },
  productivityReportTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#000000',
    textAlign: 'left',
  },
  productivityReportMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productivityReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productivityReportToggleRow: {
    marginBottom: 16,
  },
  productivityReportViewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 30,
    padding: 2,
    alignSelf: 'flex-start',
  },
  productivityReportToggleButton: {
    paddingHorizontal: 16,
    borderRadius: 30,
  },
  productivityReportToggleButtonActive: {
    backgroundColor: '#877ED2',
  },
  productivityReportToggleText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#8E8E93',
  },
  productivityReportToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  productivityReportWeekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  productivityReportWeekLabel: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: typography.families.regular,
    color: '#727272',
    marginRight: 8,
  },
  productivityReportNavButton: {
    padding: 4,
  },
  productivityReportWeekRange: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: typography.families.medium,
    color: '#404040',
  },
  productivityReportChartToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  productivityReportChartToggleButton: {
    padding: 6,
    borderRadius: 6,
  },
  productivityReportChartToggleButtonActive: {
    backgroundColor: '#877ED2',
  },
  productivityReportChartContainer: {
    marginBottom: 24,
  },
  productivityReportChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
  },
  productivityReportBarColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  productivityReportBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  productivityReportBarValueZero: {
    color: '#8E8E93',
  },
  productivityReportBarWrapper: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
    position: 'relative',
    alignSelf: 'center',
  },
  productivityReportBarBackground: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    position: 'absolute',
    bottom: 0,
  },
  productivityReportBarFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    position: 'absolute',
    bottom: 0,
    minHeight: 4,
  },
  productivityReportBarLabels: {
    alignItems: 'center',
  },
  productivityReportBarDay: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  productivityReportBarDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  productivityReportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  productivityReportSummaryLeft: {
    flex: 1,
  },
  productivityReportSummaryRight: {
    alignItems: 'flex-end',
  },
  productivityReportSummaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  productivityReportSummaryHours: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productivityReportSummaryHoursNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  productivityReportSummaryHoursUnit: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  productivityReportSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  // New Status Record Styles
  srDateSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  srDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  srDateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    width: 100,
  },
  srDateDuration: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  srDurationNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  srDurationUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#727272',
  },
  srEditedLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    marginRight: 8,
  },
  srExpandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  srTimeEntry: {
    paddingVertical: 8,
  },
  srTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  srTimeText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    width: 50,
    marginRight: 16,
  },
  srTimeOriginal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#877ED2',
    width: 50,
    marginRight: 16,
  },
  srTimeEdited: {
    color: '#877ED2',
    fontWeight: '500',
  },
  srEntryDuration: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  srDurationEdited: {
    color: '#877ED2',
  },
  srPhotosSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  srPhotosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  srPhotoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  srMessagesSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  srMessageLeft: {
    marginBottom: 12,
  },
  srMessageRight: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  srMessageTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#877ED2',
    marginBottom: 4,
  },
  srMessageText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 20,
  },
  srMessageSender: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 4,
  },
  srTimeRowEdited: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 2,
  },
  srEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  srEmptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginTop: 16,
  },
  srEmptyStateSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 8,
  },
  // Edit Time Modal Styles
  editTimeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editTimeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editTimeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  editTimeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  editTimeModalBody: {
    padding: 20,
  },
  editTimeRow: {
    marginBottom: 20,
  },
  editTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  editTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  editTimeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  editTimeDurationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
    marginTop: 8,
  },
  editTimeDurationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  editTimeDurationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#877ED2',
  },
  editTimeModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  editTimeCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTimeCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  editTimeSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#877ED2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTimeSaveButtonDisabled: {
    backgroundColor: '#D1D1D6',
    opacity: 0.6,
  },
  editTimeSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Edit Time Picker Styles
  editTimePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editTimePickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  editTimePickerHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  editTimePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  editTimePickerBody: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  editTimePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  editTimePickerCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
  },
  editTimePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  editTimePickerConfirmBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#877ED2',
    alignItems: 'center',
  },
  editTimePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
