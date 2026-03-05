import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';
import { tokens } from '../../design/tokens';

const { typography } = tokens;

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'active' | 'todo' | 'completed' | 'all'>('active');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  const loadProjects = async () => {
    try {
      if (!user?.id) {
        setProjects([]);
        return;
      }
      const response = await api.get('/api/projects', { params: { page: 1, limit: 100 } });
      const allProjects = response.data?.projects || [];
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  const loadClients = async () => {
    try {
      const response = await api.get('/api/clients', { params: { page: 1, limit: 100 } });
      setClients(response.data?.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  useEffect(() => {
    Promise.all([loadProjects(), loadClients()]).finally(() => setLoading(false));
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadProjects();
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProjects(), loadClients()]);
    setRefreshing(false);
  };

  // Map status values for filtering
  const normalizeStatus = (status: string) => {
    if (!status) return 'unknown';
    const s = status.toLowerCase();
    if (s === 'active' || s === 'in progress' || s === 'in_progress') return 'active';
    if (s === 'to do' || s === 'todo' || s === 'new') return 'todo';
    if (s === 'completed' || s === 'done') return 'completed';
    return s;
  };

  const getStatusCounts = () => {
    const active = projects.filter(p => normalizeStatus(p.status) === 'active').length;
    const todo = projects.filter(p => normalizeStatus(p.status) === 'todo').length;
    const completed = projects.filter(p => normalizeStatus(p.status) === 'completed').length;
    return { active, todo, completed, all: projects.length };
  };

  const statusCounts = getStatusCounts();

  const filteredProjects = projects.filter(project => {
    // Status filter
    if (selectedFilter !== 'all') {
      if (normalizeStatus(project.status) !== selectedFilter) return false;
    }
    // Client filter
    if (selectedClientId !== null) {
      if (project.client_id !== selectedClientId) return false;
    }
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      if (
        !project.name?.toLowerCase().includes(s) &&
        !project.location?.toLowerCase().includes(s) &&
        !project.client_name?.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'active': return '#877ED2';
      case 'completed': return '#34C759';
      case 'todo': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      case 'todo': return 'New';
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

  const handleProjectPress = (project: any) => {
    navigation.navigate('ProjectDetails', { id: project.id });
  };

  const toggleExpand = (projectId: number) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const selectedClientName = selectedClientId
    ? clients.find(c => c.id === selectedClientId)?.name || 'Unknown'
    : 'All Clients';

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get team member initials for avatars (from team_members or assigned data)
  const getTeamAvatars = (project: any) => {
    const members = project.team_members || project.assigned_to || [];
    if (Array.isArray(members)) {
      return members.slice(0, 3).map((m: any) => {
        if (typeof m === 'string') return m.charAt(0).toUpperCase();
        return (m.name || m.first_name || '?').charAt(0).toUpperCase();
      });
    }
    return [];
  };

  const renderProjectCard = ({ item, index }: { item: any; index: number }) => {
    const isExpanded = expandedProjectId === item.id;
    const isLast = index === filteredProjects.length - 1;
    const overdue = isOverdue(item.end_date || item.endDate);
    const daysRemaining = getDaysRemaining(item.end_date || item.endDate);
    const statusColor = getStatusColor(item.status);
    const avatars = getTeamAvatars(item);
    const avatarColors = ['#FF9500', '#877ED2', '#34C759', '#FF3B30', '#007AFF'];

    return (
      <View key={item.id} style={[styles.projectCard, !isLast && styles.projectCardBorder]}>
        {/* Collapsed Header */}
        <TouchableOpacity
          style={styles.projectHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.projectHeaderLeft}>
            <Text style={styles.projectName}>{item.name}</Text>
            <Text style={styles.projectSubtitle}>
              {item.location || item.client_name || 'No location'}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color="#877ED2"
          />
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Status Row */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            {/* Client Row */}
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Client:</Text>
              <Text style={styles.detailValue}>{item.client_name || 'N/A'}</Text>
            </View>

            {/* Start & End Date Row */}
            <View style={styles.detailRowDouble}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Start:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.start_date || item.startDate)}
                </Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>End:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.end_date || item.endDate)}
                </Text>
              </View>
            </View>

            {/* Team Members Avatars */}
            {avatars.length > 0 && (
              <View style={styles.avatarsRow}>
                {avatars.map((initial: string, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: avatarColors[i % avatarColors.length] },
                      i > 0 && { marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Overdue / In Progress Bar */}
            {(item.end_date || item.endDate) && normalizeStatus(item.status) !== 'completed' && (
              <View style={styles.progressSection}>
                {overdue ? (
                  <>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.detailLabel}>Over due</Text>
                      <Text style={styles.overdueValue}>{Math.abs(daysRemaining)}d</Text>
                    </View>
                    <View style={styles.overdueBar} />
                  </>
                ) : normalizeStatus(item.status) === 'active' ? (
                  <>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.detailLabel}>In Progress</Text>
                      <Text style={styles.inProgressValue}>{daysRemaining}d</Text>
                    </View>
                    <View style={styles.inProgressBar} />
                  </>
                ) : null}
              </View>
            )}

            {/* More Button */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => handleProjectPress(item)}
              >
                <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                <Text style={styles.moreButtonText}>More</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#101010" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Projects</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
              style={styles.searchInput}
              placeholderTextColor="#AAAAAA"
            />
            <TouchableOpacity style={styles.searchIconButton}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <VoiceToTextButton
            onResult={text => setSearch(text)}
            size="small"
            style={styles.voiceButton}
            color="#877ED2"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'active', label: `In Progress (${statusCounts.active})` },
            { key: 'todo', label: `New (${statusCounts.todo})` },
            { key: 'completed', label: `Completed (${statusCounts.completed})` },
            { key: 'all', label: `All (${statusCounts.all})` },
          ]}
          contentContainerStyle={styles.filterContent}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === item.key && styles.filterTabActive]}
              onPress={() => setSelectedFilter(item.key as any)}
            >
              <Text style={[styles.filterText, selectedFilter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Client Filter Dropdown */}
      <View style={styles.clientFilterContainer}>
        <TouchableOpacity
          style={styles.clientDropdown}
          onPress={() => setShowClientDropdown(!showClientDropdown)}
          activeOpacity={0.7}
        >
          <Text style={styles.clientDropdownText}>{selectedClientName}</Text>
          <Ionicons
            name={showClientDropdown ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#9CA3AF"
          />
        </TouchableOpacity>

        {showClientDropdown && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.dropdownItem, selectedClientId === null && styles.dropdownItemActive]}
              onPress={() => { setSelectedClientId(null); setShowClientDropdown(false); }}
            >
              <Text style={[styles.dropdownItemText, selectedClientId === null && styles.dropdownItemTextActive]}>
                All Clients
              </Text>
            </TouchableOpacity>
            {clients.map(client => (
              <TouchableOpacity
                key={client.id}
                style={[styles.dropdownItem, selectedClientId === client.id && styles.dropdownItemActive]}
                onPress={() => { setSelectedClientId(client.id); setShowClientDropdown(false); }}
              >
                <Text style={[styles.dropdownItemText, selectedClientId === client.id && styles.dropdownItemTextActive]}>
                  {client.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Project List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredProjects.length > 0 ? (
          <View style={styles.bigCard}>
            {filteredProjects.map((item, index) => renderProjectCard({ item, index }))}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>No Project</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 15,
    color: '#666666',
    fontFamily: typography.families.regular,
  },

  // ─── Header ──────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    fontFamily: typography.families.regular,
    marginLeft: 2,
  },

  // ─── Search ──────────────────────────────
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: typography.families.regular,
  },
  searchIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    marginLeft: 12,
  },

  // ─── Filter Tabs ─────────────────────────
  filterContainer: {
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  filterTab: {
    marginRight: 24,
    paddingBottom: 10,
    position: 'relative',
  },
  filterTabActive: {
    borderBottomWidth: 3,
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

  // ─── Client Filter Dropdown ──────────────
  clientFilterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#F0F0F0',
    zIndex: 10,
  },
  clientDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clientDropdownText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: typography.families.regular,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#F5F3FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: typography.families.regular,
  },
  dropdownItemTextActive: {
    color: '#877ED2',
    fontWeight: '600',
    fontFamily: typography.families.semibold,
  },

  // ─── Scroll container ───────────────────
  scrollView: {
    flex: 1,
  },

  // ─── Big Card (list container) ───────────
  bigCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  // ─── Project Card (row in big card) ──────
  projectCard: {
    backgroundColor: '#FFFFFF',
  },
  projectCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  projectHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: typography.families.semibold,
    marginBottom: 3,
  },
  projectSubtitle: {
    fontSize: 13,
    color: '#999999',
    fontFamily: typography.families.regular,
  },

  // ─── Expanded Content ────────────────────
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailBlock: {
    marginBottom: 12,
  },
  detailRowDouble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 16,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999999',
    fontFamily: typography.families.regular,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '400',
    fontFamily: typography.families.regular,
  },

  // ─── Status Badge ────────────────────────
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: typography.families.semibold,
  },

  // ─── Team Avatars ────────────────────────
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: typography.families.bold,
  },

  // ─── Progress / Overdue ──────────────────
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  overdueValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
    fontFamily: typography.families.semibold,
  },
  overdueBar: {
    height: 3,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
    width: '100%',
  },
  inProgressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
    fontFamily: typography.families.semibold,
  },
  inProgressBar: {
    height: 3,
    backgroundColor: '#34C759',
    borderRadius: 2,
    width: '100%',
  },

  // ─── Action Buttons ──────────────────────
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#877ED2',
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    shadowColor: '#877ED2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  moreButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: typography.families.semibold,
    marginLeft: 6,
  },

  // ─── Empty State ─────────────────────────
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#666666',
    fontFamily: typography.families.regular,
  },
});
