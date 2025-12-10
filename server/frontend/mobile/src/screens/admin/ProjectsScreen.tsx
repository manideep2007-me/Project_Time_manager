import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, TextInput, RefreshControl, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/shared/Card';
import ProjectCard from '../../components/shared/ProjectCard';
import AppHeader from '../../components/shared/AppHeader';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hasNext, setHasNext] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'on_hold' | 'cancelled' | 'todo' | 'pending' | 'all'>('all');
  const [showAll, setShowAll] = useState(false);
  const [allItems, setAllItems] = useState<any[]>([]);
  const { user } = useContext(AuthContext);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>(['all']);
  const [appliedFilters, setAppliedFilters] = useState({
    status: ['all'] as string[]
  });

  const load = async (pageNum = 1, q = '', status = statusFilter) => {
    setLoading(true);
    try {
      console.log('🔄 Loading projects from database for ADMIN...');
      console.log('👤 User role:', user?.role);
      
      // Admin: Show ALL projects with full access
      let all = [];
      try {
        console.log('📡 Making API call to /api/projects with status filter:', status);
        const response = await api.get('/api/projects', { params: { page: 1, limit: 100, status: status === 'all' ? '' : status } });
        console.log('📊 API Response:', response.data);
        
        const apiProjects = response.data?.projects || [];
        console.log('✅ Projects loaded from database:', apiProjects.length);
        
        all = apiProjects.map((p: any, index: number) => ({
          id: p.id,
          name: p.name,
          projectCode: `PRJ-${String(index + 1).padStart(3, '0')}`,
          totalHours: 0,
          totalCost: 0,
          status: p.status,
          startDate: p.start_date,
          endDate: p.end_date,
          location: p.location,
          assignedEmployees: [],
          employees: [],
          clientId: p.client_id,
          clientName: p.client_name,
          budget: p.budget || 0,
          allocatedHours: p.allocated_hours || 0,
        }));
        
        console.log('📋 Mapped projects:', all.length);
        
      } catch (error) {
        console.log('❌ Projects API failed:', (error as Error).message);
        console.log('Error details:', (error as any).response?.data || error);
        all = [];
      }
      
      let filtered = q
        ? all.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase()))
        : all;
      
      // Store all items for show all functionality
      setAllItems(filtered);
      
      // Status filtering is now handled by the API
      const pageSize = 20;
      const start = (pageNum - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);
      setItems(pageNum === 1 ? slice : [...items, ...slice]);
      setHasNext(start + pageSize < filtered.length);
      setPage(pageNum);
      
      console.log('✅ Final projects loaded:', all.length, 'Filtered:', filtered.length, 'Displayed:', slice.length);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load projects if user is authenticated
    if (user) {
      console.log('👤 User authenticated, loading projects...');
      load(1, search, statusFilter);
    } else {
      console.log('⏳ Waiting for user authentication...');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, search, statusFilter);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (hasNext && !loading) {
      await load(page + 1, search, statusFilter);
    }
  };

  const toggleShowAll = () => {
    if (showAll) {
      // Show only first 20 items
      setItems(allItems.slice(0, 20));
      setShowAll(false);
    } else {
      // Show all items
      setItems(allItems);
      setShowAll(true);
    }
  };

  const handleProjectPress = (project: any) => {
    navigation.navigate('ProjectDetails', { id: project.id });
  };

  // Filter functions
  const openFilterModal = () => {
    setFilterStatus(appliedFilters.status);
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  // Instant apply when status is selected
  const handleStatusSelect = (status: string) => {
    setFilterStatus([status]);
    setAppliedFilters({ status: [status] });
    setStatusFilter(status as any);
    load(1, search, status as any);
    closeFilterModal();
  };

  const getFilterButtonText = () => {
    const activeFilters = [] as string[];
    if (appliedFilters.status.length > 0 && appliedFilters.status[0] !== 'all') {
      activeFilters.push('Status');
    }
    return activeFilters.length > 0 ? `Filter (${activeFilters.length})` : 'Filter';
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        rightAction={allItems.length > 20 ? {
          title: showAll ? 'Show Less' : `Show All (${allItems.length})`,
          onPress: toggleShowAll,
          style: styles.toggleButton,
          textStyle: styles.toggleButtonText
        } : undefined}
      />
      
      <View style={styles.screenContent}>
        <Text style={styles.title}>
          {t('projects.projects')} ({showAll ? allItems.length : items.length}/{allItems.length})
        </Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('common.search')}
                style={styles.search}
                onSubmitEditing={() => load(1, search, statusFilter)}
              />
              <VoiceToTextButton
                onResult={(text) => {
                  setSearch(text);
                  load(1, text, statusFilter);
                }}
                size="small"
                style={{ marginRight: 4 }}
              />
              <TouchableOpacity
                onPress={() => load(1, search, statusFilter)}
                style={styles.searchIconButton}
              >
                <Text style={styles.searchIconText}>🔍</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={openFilterModal}
              style={styles.filterButton}
            >
              <Text style={styles.filterButtonText}>{getFilterButtonText()}</Text>
            </TouchableOpacity>
          </View>
        </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProjectCard 
            project={item} 
            onPress={() => handleProjectPress(item)}
          />
        )}
        onEndReached={showAll ? undefined : loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('projects.no_projects')}</Text>
            <Text style={styles.emptySubtext}>
              {search ? t('common.search') : t('projects.create_project')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeFilterModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeFilterModal}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalBody}>
              <View style={styles.statusContainer}>
                {['all', 'active', 'todo', 'pending', 'completed', 'on_hold', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleStatusSelect(status)}
                    style={[
                      styles.statusChip,
                      filterStatus.includes(status) && styles.statusChipActive
                    ]}
                  >
                    <Text style={[
                      styles.statusChipText,
                      filterStatus.includes(status) && styles.statusChipTextActive
                    ]}>
                      {status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  screenContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
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
  toggleButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingRight: 4,
  },
  search: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  searchIconButton: {
    padding: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 20,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  statusChipActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#007AFF',
  },
  statusChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
