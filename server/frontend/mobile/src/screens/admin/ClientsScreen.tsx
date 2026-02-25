import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// DB-only: no selectors/mocks
import { AuthContext } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionsContext';
import { useTheme } from '../../theme'; // ✅ New unified theme
// Removed useRole import to avoid context errors
import { api } from '../../api/client';
import ClientCard from '../../components/shared/ClientCard';
import Button from '../../components/shared/Button';

export default function ClientsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { has } = usePermissions();
  const { theme } = useTheme(); // ✅ Access theme
  // Show Add Client button only if permission is granted
  const canManageClients = has('clients.add');
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F0F0F0',
    },
    screenContent: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: '#F0F0F0',
    },
    backButton: {
      padding: 4,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '400',
      fontFamily: theme.typography.families.regular,
      color: '#000000',
    },
    headerAddButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#877ED2',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    addButton: {
      display: 'none',
    },
    addButtonText: {
      display: 'none',
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: '#F0F0F0',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#1a1a1a',
      padding: 0,
      fontWeight: '400',
    },
    summaryBar: {
      marginTop: 12,
      paddingHorizontal: 4,
    },
    summaryText: {
      fontSize: 13,
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryLabel: {
      color: '#333333',
      fontWeight: '400',
    },
    summaryTotal: {
      color: '#333333',
      fontWeight: '700',
    },
    summaryActive: {
      color: '#877ED2',
      fontWeight: '700',
    },
    summaryInactive: {
      color: '#877ED2',
      fontWeight: '700',
    },
    summaryDivider: {
      color: '#999999',
      fontWeight: '400',
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
      fontWeight: '400',
    },
    listContent: {
      paddingBottom: 20,
    },
    bigCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    clientCard: {
      backgroundColor: '#FFFFFF',
    },
    clientCardBorder: {
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    clientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    clientHeaderLeft: {
      flex: 1,
    },
    clientHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: '#F0EEFF',
    },
    deleteButton: {
      backgroundColor: '#FFEBEE',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 10,
    },
    clientName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: 4,
    },
    clientSubtitle: {
      fontSize: 13,
      color: '#999999',
      fontWeight: '400',
    },
    clientDetails: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 4,
      backgroundColor: '#FFFFFF',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    addressRow: {
      flexDirection: 'column',
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
      marginBottom: 4,
      fontWeight: '400',
    },
    detailValue: {
      fontSize: 14,
      color: '#1a1a1a',
      fontWeight: '400',
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusActive: {
      backgroundColor: '#E8F5E9',
    },
    statusInactive: {
      backgroundColor: '#FFEBEE',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4CAF50',
    },
    statusTextInactive: {
      color: '#F44336',
    },
    moreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#877ED2',
      paddingHorizontal: 18,
      height: 40,
      borderRadius: 10,
      flex: 1,
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
      marginLeft: 6,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 24,
    },
    emptyPill: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '400',
      color: '#666666',
    },
  });

  const loadClients = async (pageNum = 1) => {
    try {
      console.log('🔄 Loading clients from database...');
      
      // Load clients directly from API
      let all = [];
      try {
        console.log('📡 Making API call to /api/clients...');
        const response = await api.get('/api/clients', { params: { page: 1, limit: 100 } });
        console.log('📊 API Response:', response.data);
        
        const apiClients = response.data?.clients || [];
        console.log('✅ Clients loaded from database:', apiClients.length);
        
        if (apiClients.length === 0) {
          console.log('⚠️ No clients returned from API, checking database...');
        }
        
        all = apiClients.map((c: any, index: number) => ({
          id: c.id,
          name: c.name,
          clientCode: `CLT-${String(index + 1).padStart(3, '0')}`, // Generate user-friendly client code
          client_type: c.client_type || 'Client',
          location: c.location || '',
          email: c.email,
          phone: c.phone,
          address: c.address,
          contact_person: c.contact_person,
          onboard_date: c.onboard_date || c.created_at,
          project_count: c.project_count || 0,
          status: c.status || 'active', // Default to active if not specified
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
        
        console.log('📋 Mapped clients:', all.length);
        
      } catch (error) {
        console.log('❌ Clients API failed:', (error as Error).message);
        console.log('Error details:', (error as any).response?.data || error);
        all = [];
      }
      
      const pageSize = 20;
      const start = (pageNum - 1) * pageSize;
      const slice = all.slice(start, start + pageSize);
      setClients(pageNum === 1 ? slice : [...clients, ...slice]);
      setFilteredClients(pageNum === 1 ? slice : [...clients, ...slice]);
      setHasNext(start + pageSize < all.length);
      setPage(pageNum);
      
      console.log('✅ Final clients loaded:', all.length, 'Displayed:', slice.length);
    } catch (error) {
      console.error('❌ Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    }
  };

  // Filter clients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client =>
        client.name?.toLowerCase().includes(query) ||
        client.client_type?.toLowerCase().includes(query) ||
        client.location?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  useEffect(() => {
    // Only load clients if user is authenticated
    if (user) {
      console.log('👤 User authenticated, loading clients...');
      loadClients().finally(() => setLoading(false));
    } else {
      console.log('⏳ Waiting for user authentication...');
      setLoading(false);
    }
  }, [user]);

  // Reload clients when screen comes into focus (e.g., returning from AddClient)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('🔄 Screen focused, reloading clients...');
        loadClients(1); // Always reload from page 1
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients(1);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (hasNext && !loading) {
      setLoading(true);
      await loadClients(page + 1);
      setLoading(false);
    }
  };

  const handleDeleteClient = async (client: any) => {
    try {
      console.log('🗑️ Attempting to delete client:', client.name, client.id);
      
      const projectCount = client.project_count || 0;
      const warningMessage = projectCount > 0 
        ? `Are you sure you want to delete "${client.name}"?\n\n⚠️ WARNING: This will also delete ${projectCount} project(s) associated with this client!\n\nThis action cannot be undone.`
        : `Are you sure you want to delete "${client.name}"?\n\nThis action cannot be undone.`;
      
      Alert.alert(
        'Delete Client',
        warningMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await api.delete(`/api/clients/${client.id}`);
                const deletedProjects = response.data?.deletedProjects || 0;
                console.log('✅ Client deleted successfully. Projects deleted:', deletedProjects);
                Alert.alert(
                  'Success', 
                  deletedProjects > 0 
                    ? `Client and ${deletedProjects} project(s) deleted successfully`
                    : 'Client deleted successfully'
                );
                // Reload clients
                loadClients(1);
              } catch (error: any) {
                console.error('❌ Error deleting client:', error);
                const errorMsg = error.response?.data?.error || 'Failed to delete client';
                Alert.alert('Error', errorMsg);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error in delete handler:', error);
    }
  };

  const handleClientPress = async (client: any) => {
    try {
      console.log('🔄 Loading projects for client:', client.name);
      
      // Load projects for this specific client from database
      let clientProjects = [];
      try {
        console.log('📡 Making API call to /api/projects for client:', client.id);
          const response = await api.get(`/api/clients/${client.id}/projects`, { params: { page: 1, limit: 100 } });
        
        const apiProjects = response.data?.projects || [];
        console.log('✅ Client projects loaded from database:', apiProjects.length);
        
        clientProjects = apiProjects.map((p: any, index: number) => ({
          id: p.id,
          name: p.name,
          projectCode: `PRJ-${String(index + 1).padStart(3, '0')}`, // Generate user-friendly project code
          description: p.description,
          status: p.status,
          start_date: p.start_date,
          end_date: p.end_date,
          budget: p.budget || 0,
          location: p.location,
          allocated_hours: p.allocated_hours || 0,
          client_id: p.client_id,
          client_name: p.client_name,
        }));
        
          // Fallback: if none returned, try generic projects filter (defensive)
          if (clientProjects.length === 0) {
            console.log('ℹ️ No projects via /api/clients/:id/projects, falling back to /api/projects?clientId=...');
            const fallback = await api.get('/api/projects', { params: { page: 1, limit: 100, clientId: client.id } });
            const fbProjects = fallback.data?.projects || [];
            clientProjects = fbProjects.map((p: any, index: number) => ({
              id: p.id,
              name: p.name,
              projectCode: `PRJ-${String(index + 1).padStart(3, '0')}`,
              description: p.description,
              status: p.status,
              start_date: p.start_date,
              end_date: p.end_date,
              budget: p.budget || 0,
              location: p.location,
              allocated_hours: p.allocated_hours || 0,
              client_id: p.client_id,
              client_name: p.client_name,
            }));
          }
      } catch (error) {
        console.log('❌ Client projects API failed:', (error as Error).message);
        console.log('Error details:', (error as any).response?.data || error);
        // Fallback to generic projects endpoint filtered by clientId if the dedicated endpoint is unavailable
        try {
          console.log('↩️ Falling back to /api/projects?clientId=...');
          const fallback = await api.get('/api/projects', { params: { page: 1, limit: 100, clientId: client.id } });
          const fbProjects = fallback.data?.projects || [];
          clientProjects = fbProjects.map((p: any, index: number) => ({
            id: p.id,
            name: p.name,
            projectCode: `PRJ-${String(index + 1).padStart(3, '0')}`,
            description: p.description,
            status: p.status,
            start_date: p.start_date,
            end_date: p.end_date,
            budget: p.budget || 0,
            location: p.location,
            allocated_hours: p.allocated_hours || 0,
            client_id: p.client_id,
            client_name: p.client_name,
          }));
          console.log('✅ Fallback loaded projects:', clientProjects.length);
        } catch (fallbackError) {
          console.log('❌ Fallback /api/projects also failed:', (fallbackError as Error).message);
          console.log('Error details:', (fallbackError as any).response?.data || fallbackError);
          clientProjects = [];
        }
      }
      
      console.log('📋 Final client projects:', clientProjects.length);
      navigation.navigate('ClientProjects', { client, projects: clientProjects });
      
    } catch (error) {
      console.error('❌ Error loading client projects:', error);
      // Fallback to empty array
      navigation.navigate('ClientProjects', { client, projects: [] });
    }
  };

  const handleEditClient = (client: any) => {
    navigation.navigate('EditClient', { client });
  };

  const formatCurrency = (amount: any) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const toggleClientExpand = (clientId: number) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const getClientCounts = () => {
    const total = filteredClients.length;
    const active = filteredClients.filter(c => c.status === 'active' || !c.status).length;
    const inactive = filteredClients.filter(c => c.status === 'inactive').length;
    return { total, active, inactive };
  };

  const renderClientCard = ({ item, index }: { item: any; index: number }) => {
    const isExpanded = expandedClientId === item.id;
    const isLast = index === filteredClients.length - 1;

    return (
      <View style={[styles.clientCard, !isLast && styles.clientCardBorder]}>
        {/* Collapsed Header */}
        <TouchableOpacity 
          style={styles.clientHeader}
          onPress={() => toggleClientExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.clientHeaderLeft}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientSubtitle}>{item.client_type} | {item.location}</Text>
          </View>
          <View style={styles.clientHeaderActions}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={22} 
              color="#877ED2" 
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.clientDetails}>
            {/* Status Row */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, item.status === 'inactive' ? styles.statusInactive : styles.statusActive]}>
                <Text style={[styles.statusText, item.status === 'inactive' && styles.statusTextInactive]}>
                  {item.status === 'inactive' ? 'Inactive' : 'Active'}
                </Text>
              </View>
            </View>

            {/* Address Block */}
            {item.address && (
              <View style={styles.addressRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{item.address}</Text>
              </View>
            )}

            {/* Mobile & Email (two columns) */}
            <View style={styles.detailRowDouble}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Mobile:</Text>
                <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{item.email || 'N/A'}</Text>
              </View>
            </View>

            {/* Onboard Date & Projects (two columns) */}
            <View style={styles.detailRowDouble}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Onboard Date:</Text>
                <Text style={styles.detailValue}>
                  {item.onboard_date 
                    ? new Date(item.onboard_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Number of Projects:</Text>
                <Text style={styles.detailValue}>{item.project_count || 0}</Text>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => handleClientPress(item)}
              >
                <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                <Text style={styles.moreButtonText}>More</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditClient(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={18} color="#877ED2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteClient(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };


  if (loading && clients.length === 0) {
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
        <Text style={styles.headerTitle}>{t('clients.clients')}</Text>
        {canManageClients && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddClient')}
            style={styles.headerAddButton}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.screenContent}>
        {/* Search Bar - Only show when there are clients */}
        {filteredClients.length > 0 && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#AAAAAA"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Ionicons name="search-outline" size={20} color="#877ED2" />
            </View>

            {/* Summary Bar */}
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Total: </Text>
                <Text style={styles.summaryTotal}>{getClientCounts().total}</Text>
                <Text style={styles.summaryDivider}> | </Text>
                <Text style={styles.summaryLabel}>Active: </Text>
                <Text style={styles.summaryActive}>{getClientCounts().active}</Text>
                <Text style={styles.summaryDivider}> | </Text>
                <Text style={styles.summaryLabel}>Inactive: </Text>
                <Text style={styles.summaryInactive}>{getClientCounts().inactive}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Client List Container */}
        {filteredClients.length > 0 ? (
          <View style={styles.bigCard}>
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderClientCard}
              onEndReached={loadMore}
              onEndReachedThreshold={0.6}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContent}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyPill}>
              <Text style={styles.emptyText}>No Client</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

