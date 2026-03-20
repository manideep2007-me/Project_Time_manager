import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { tokens } from '../../design/tokens';

const { colors, typography } = tokens;

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'active' | 'todo' | 'completed' | 'all'>('active');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = (dateStr: string) => dateStr === todayStr;

  const loadProjects = async () => {
    try {
      setLoading(true);
      if (!user?.id) { setProjects([]); return; }
      const response = await api.get('/api/projects/assigned');
      setProjects(response.data?.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const statusCounts = {
    active: projects.filter(p => p.status === 'Active').length,
    todo: projects.filter(p => p.status === 'To Do').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    all: projects.length,
  };

  const filterTabs: Array<{ key: 'active' | 'todo' | 'completed' | 'all'; label: string }> = [
    { key: 'active', label: 'In Progress' },
    { key: 'todo', label: 'New' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ];

  const filteredProjects = projects.filter(project => {
    if (selectedFilter === 'active' && project.status !== 'Active') return false;
    if (selectedFilter === 'todo' && project.status !== 'To Do') return false;
    if (selectedFilter === 'completed' && project.status !== 'Completed') return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#7E99D2';
      case 'Completed': return '#34C759';
      case 'To Do': return '#7E99D2';
      case 'On Hold': return '#FF9500';
      case 'Cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active': return 'In Progress';
      case 'To Do': return 'In Progress';
      case 'Completed': return 'Completed';
      case 'On Hold': return 'On Hold';
      case 'Cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return 0;
    const due = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (endDate: string) => getDaysRemaining(endDate) < 0;

  const formatProjectDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleProjectPress = (project: any) => {
    navigation.navigate('EmployeeProjectDetails', { id: project.id });
  };

  if (loading && projects.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#877ED2" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper style={styles.container} backgroundColor="#F0F0F0">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Projects</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date strip */}
        <View style={styles.dateSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelectorContent}>
            {weekDays.map((day) => {
              const isTodayDate = isToday(day.dateStr);
              const isSelected = day.dateStr === selectedDate;
              const isSelectedNotToday = isSelected && !isTodayDate;
              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={[
                    styles.dateItem,
                    isTodayDate && styles.dateItemToday,
                    isSelectedNotToday && styles.dateItemSelected,
                  ]}
                  onPress={() => setSelectedDate(day.dateStr)}
                >
                  <Text style={[styles.dateNumber, isTodayDate ? styles.dateNumberToday : isSelectedNotToday ? styles.dateNumberSelected : null]}>
                    {day.dayNum}
                  </Text>
                  <Text style={[styles.dateDay, isTodayDate ? styles.dateDayToday : isSelectedNotToday ? styles.dateDaySelected : null]}>
                    {day.dayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.calendarIcon}
              onPress={() => { setCalendarDate(new Date()); setShowCalendarPicker(true); }}
            >
              <View style={styles.calendarIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={colors.primaryPurple} />
                <View style={styles.clockOverlay}>
                  <Ionicons name="time-outline" size={10} color={colors.primaryPurple} />
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {filterTabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, selectedFilter === tab.key && styles.filterTabActive]}
                onPress={() => setSelectedFilter(tab.key)}
              >
                <Text style={[styles.filterText, selectedFilter === tab.key && styles.filterTextActive]}>
                  {tab.label} ({statusCounts[tab.key] || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Project cards */}
        <View style={styles.projectsContainer}>
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptySubtitle}>No projects match your current filters.</Text>
            </View>
          ) : (
            filteredProjects.map(project => {
              const overdue = isOverdue(project.end_date || project.endDate);
              const daysRemaining = getDaysRemaining(project.end_date || project.endDate);
              const statusColor = getStatusColor(project.status);

              return (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => handleProjectPress(project)}
                  activeOpacity={0.85}
                >
                  {/* Badge row */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusBadgeText}>{getStatusText(project.status)}</Text>
                    </View>
                  </View>

                  {/* Avatar stack (absolute) */}
                  <View style={styles.avatarAbsolute}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={13} color="#fff" />
                    </View>
                    <View style={styles.avatarPlus}>
                      <Text style={styles.avatarPlusText}>+</Text>
                    </View>
                  </View>

                  {project.location && (
                    <Text style={styles.locationText}>{project.location}</Text>
                  )}

                  <Text style={styles.projectName}>{project.name}</Text>

                  {/* Dates row */}
                  <View style={styles.datesContainer}>
                    <View style={styles.dateSection}>
                      <Text style={styles.dateLabel}>Start</Text>
                      <Text style={styles.dateValue}>
                        {formatProjectDate(project.start_date || project.startDate)}
                      </Text>
                    </View>
                    <View style={styles.dateSection}>
                      <Text style={styles.dateLabel}>End</Text>
                      <Text style={styles.dateValue}>
                        {formatProjectDate(project.end_date || project.endDate)}
                      </Text>
                    </View>
                    <View style={styles.dateSection}>
                      {overdue ? (
                        <>
                          <View style={styles.statusRow}>
                            <Text style={styles.dateLabel}>Over due</Text>
                            <Text style={styles.overdueValue}>{Math.abs(daysRemaining)}d</Text>
                          </View>
                          <View style={styles.overdueBar} />
                        </>
                      ) : project.status === 'Active' || project.status === 'To Do' ? (
                        <>
                          <View style={styles.statusRow}>
                            <Text style={styles.dateLabel}>In Progress</Text>
                            <Text style={styles.inProgressDays}>{daysRemaining}d</Text>
                          </View>
                          <View style={styles.inProgressBar} />
                        </>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Calendar Picker Modal */}
      {Platform.OS === 'ios' && showCalendarPicker && (
        <Modal visible={showCalendarPicker} transparent animationType="slide" onRequestClose={() => setShowCalendarPicker(false)}>
          <View style={styles.calendarModalOverlay}>
            <View style={styles.calendarModalContent}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.calendarModalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowCalendarPicker(false)}>
                  <Ionicons name="close" size={24} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
              <DateTimePicker value={calendarDate} mode="date" display="spinner" onChange={(e, d) => { if (d) setCalendarDate(d); if (e.type === 'dismissed') setShowCalendarPicker(false); }} />
              <TouchableOpacity style={styles.calendarConfirmButton} onPress={() => { setSelectedDate(calendarDate.toISOString().split('T')[0]); setShowCalendarPicker(false); }}>
                <Text style={styles.calendarConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {Platform.OS === 'android' && showCalendarPicker && (
        <DateTimePicker value={calendarDate} mode="date" display="default" onChange={(e, d) => { setShowCalendarPicker(false); if (d && e.type === 'set') { setCalendarDate(d); setSelectedDate(d.toISOString().split('T')[0]); } }} />
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: typography.families.semibold,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  // ── Date strip ──────────────────────────────────────────────
  dateSelector: {
    backgroundColor: '#F0F0F0',
    paddingTop: 4,
    paddingBottom: 8,
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#EBEBEB',
    width: 52,
    height: 56,
  },
  dateItemToday: {
    backgroundColor: '#877ED2',
  },
  dateItemSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#877ED2',
  },
  dateNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: typography.families.semibold,
    marginBottom: 2,
  },
  dateNumberToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateNumberSelected: {
    color: '#877ED2',
    fontWeight: '700',
  },
  dateDay: {
    fontSize: 11,
    color: '#888888',
    fontFamily: typography.families.regular,
  },
  dateDayToday: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dateDaySelected: {
    color: '#877ED2',
    fontWeight: '500',
  },
  calendarIcon: {
    marginLeft: 4,
    height: 56,
    justifyContent: 'center',
  },
  calendarIconContainer: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clockOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryPurple,
  },
  // ── Calendar modal ──────────────────────────────────────────
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: typography.families.semibold,
  },
  calendarConfirmButton: {
    backgroundColor: colors.primaryPurple,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.families.semibold,
  },
  // ── Filter tabs ─────────────────────────────────────────────
  filterContainer: {
    backgroundColor: '#F0F0F0',
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E2E2',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 4,
  },
  filterTab: {
    marginRight: 16,
    paddingBottom: 8,
  },
  filterTabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: '#877ED2',
    marginBottom: -1,
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: typography.families.regular,
    fontWeight: '400',
  },
  filterTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: typography.families.semibold,
  },
  // ── Project cards ───────────────────────────────────────────
  projectsContainer: {
    padding: 14,
    paddingTop: 16,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 18,
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 0,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: typography.families.semibold,
  },
  avatarAbsolute: {
    position: 'absolute',
    top: 10,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarPlus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#5F5F6E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarPlusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 14,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 2,
    fontFamily: typography.families.regular,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 14,
    fontFamily: typography.families.semibold,
    lineHeight: 24,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  dateSection: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '400',
    fontFamily: typography.families.regular,
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: typography.families.semibold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  overdueValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
    fontFamily: typography.families.bold,
  },
  overdueBar: {
    height: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    width: '100%',
  },
  inProgressDays: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34C759',
    fontFamily: typography.families.bold,
  },
  inProgressBar: {
    height: 4,
    backgroundColor: '#34C759',
    borderRadius: 4,
    width: '100%',
  },
  // ── Empty ───────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    fontFamily: typography.families.semibold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: typography.families.regular,
  },
});
