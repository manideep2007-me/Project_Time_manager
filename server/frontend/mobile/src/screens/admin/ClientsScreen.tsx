import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
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

  // ✅ Theme-aware styles created inside component
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background, // Was: '#F6F6F6'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xs, // Was: 10
      paddingTop: 30,
      paddingBottom: theme.spacing.base, // Was: 16
      backgroundColor: theme.colors.surface, // Was: '#F0F0F0'
    },
    backButton: {
      padding: theme.spacing.xs, // Was: 4
      marginRight: theme.spacing.xs, // Was: 8
    },
    headerTitle: {
      flex: 1,
      fontSize: theme.typography.fontSizes.xl, // Was: 20
      fontWeight: '400',
      fontFamily: theme.typography.families.regular, // Was: 'Inter_400Regular'
      color: theme.colors.text, // Was: '#000000'
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary, // Was: '#6B5CE7'
      paddingHorizontal: theme.spacing.base, // Was: 16
      paddingVertical: theme.spacing.xs, // Was: 8
      borderRadius: theme.borderRadius.md, // Was: 8
      gap: 6,
    },
    addButtonText: {
      color: theme.colors.surface, // Was: '#fff'
      fontSize: theme.typography.fontSizes.sm, // Was: 14
      fontWeight: '600',
    },
    screenContent: {
      flex: 1,
    },
    searchContainer: {
      paddingHorizontal: theme.spacing.base, // Was: 16
      paddingVertical: theme.spacing.md, // Was: 12
      backgroundColor: theme.colors.surface, // Was: '#F0F0F0'
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface, // Was: '#FFFFFF'
      borderRadius: theme.borderRadius.md, // Was: 8
      paddingHorizontal: theme.spacing.md, // Was: 12
      paddingVertical: theme.spacing.xs, // Was: 10
      borderWidth: 2,
      borderColor: theme.colors.border, // Was: '#E8E8E8'
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.fontSizes.base, // Was: 16
      color: theme.colors.text, // Was: '#1a1a1a'
      padding: 0,
    },
    summaryBar: {
      marginTop: theme.spacing.md, // Was: 12
      paddingHorizontal: theme.spacing.xs, // Was: 4
    },
    summaryText: {
      fontSize: theme.typography.fontSizes.sm, // Was: 14
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryLabel: {
      color: theme.colors.textSecondary, // Was: '#666666'
      fontWeight: '400',
    },
    summaryTotal: {
      color: theme.colors.textSecondary, // Was: '#666666'
      fontWeight: '600',
    },
    summaryActive: {
      color: theme.colors.primary, // Was: '#6B5CE7'
      fontWeight: '600',
    },
    summaryInactive: {
      color: theme.colors.primary, // Was: '#6B5CE7'
      fontWeight: '600',
    },
    summaryDivider: {
      color: theme.colors.textSecondary, // Was: '#666666'
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background, // Was: '#f8f9fa'
    },
    loadingText: {
      marginTop: theme.spacing.md, // Was: 12
      fontSize: theme.typography.fontSizes.base, // Was: 16
      color: theme.colors.textSecondary, // Was: '#666'
    },
    listContent: {
      paddingBottom: 80,
    },
    bigCard: {
      flex: 1,
      backgroundColor: theme.colors.surface, // Was: '#fff'
      marginHorizontal: theme.spacing.base, // Was: 16
      marginTop: theme.spacing.md, // Was: 12
      borderRadius: theme.borderRadius.lg, // Was: 12
      borderWidth: 1,
      borderColor: theme.colors.border, // Was: '#E8E8E8'
      overflow: 'hidden',
    },
    clientCard: {
      backgroundColor: theme.colors.surface, // Was: '#fff'
    },
    clientCardBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background, // Was: '#F0F0F0'
    },
    clientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.base, // Was: 16
      paddingVertical: theme.spacing.base, // Was: 16
    },
    clientHeaderLeft: {
      flex: 1,
    },
    clientName: {
      fontSize: theme.typography.fontSizes.base, // Was: 16
      fontWeight: '600',
      color: theme.colors.text, // Was: '#1a1a1a'
      marginBottom: theme.spacing.xs, // Was: 4
    },
    clientSubtitle: {
      fontSize: theme.typography.fontSizes.xs, // Was: 13
      color: theme.colors.textTertiary, // Was: '#888888'
      fontWeight: '400',
    },
    clientDetails: {
      paddingHorizontal: theme.spacing.base, // Was: 16
      paddingBottom: theme.spacing.base, // Was: 16
      paddingTop: theme.spacing.xs, // Was: 4
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md, // Was: 12
    },
    detailRowDouble: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md, // Was: 12
      gap: theme.spacing.base, // Was: 16
    },
    detailColumn: {
      flex: 1,
    },
    detailLabel: {
      fontSize: theme.typography.fontSizes.xs, // Was: 13
      color: theme.colors.textTertiary, // Was: '#999999'
      marginBottom: theme.spacing.xs, // Was: 4
      fontWeight: '400',
    },
    detailValue: {
      fontSize: theme.typography.fontSizes.sm, // Was: 14
      color: theme.colors.text, // Was: '#1a1a1a'
      fontWeight: '400',
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.md, // Was: 12
      paddingVertical: theme.spacing.xs, // Was: 4
      borderRadius: theme.borderRadius.lg, // Was: 12
      marginLeft: theme.spacing.xs, // Was: 8
    },
    statusActive: {
      backgroundColor: theme.colors.successLight, // Was: '#E8F5E9'
    },
    statusInactive: {
      backgroundColor: theme.colors.errorLight, // Was: '#FFEBEE'
    },
    statusText: {
      fontSize: theme.typography.fontSizes.xs, // Was: 13
      fontWeight: '500',
      color: theme.colors.success, // Was: '#4CAF50'
    },
    statusTextInactive: {
      color: theme.colors.error, // Was: '#F44336'
    },
    moreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight, // Was: '#F5F3FF'
      paddingHorizontal: theme.spacing.base, // Was: 16
      paddingVertical: theme.spacing.xs, // Was: 8
      borderRadius: theme.borderRadius.xxl, // Was: 20
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs, // Was: 8
    },
    moreButtonText: {
      fontSize: theme.typography.fontSizes.sm, // Was: 14
      color: theme.colors.primary, // Was: '#6B5CE7'
      fontWeight: '500',
      marginLeft: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    emptyText: {
      fontSize: theme.typography.fontSizes.base, // Was: 16
      fontWeight: '400',
      color: theme.colors.textTertiary, // Was: '#999999'
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
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.clientDetails}>
            {/* Status Badge */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, item.status === 'inactive' ? styles.statusInactive : styles.statusActive]}>
                <Text style={[styles.statusText, item.status === 'inactive' && styles.statusTextInactive]}>
                  {item.status === 'inactive' ? 'Inactive' : 'Active'}
                </Text>
              </View>
            </View>

            {/* Address */}
            {item.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{item.address}</Text>
              </View>
            )}

            {/* Mobile & Email */}
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

            {/* Onboard Date & Projects */}
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

            {/* More Button */}
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => handleClientPress(item)}
            >
              <Ionicons name="map-outline" size={16} color="#6B5CE7" />
              <Text style={styles.moreButtonText}>More</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };


  if (loading && clients.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B5CE7" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#101010" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('clients.clients')}</Text>
        {canManageClients && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddClient')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Client</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.screenContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search-outline" size={24} color="#6B5CE7" />
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

        {/* Big Card Container */}
        <View style={styles.bigCard}>
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderClientCard}
            onEndReached={loadMore}
            onEndReachedThreshold={0.6}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No Client</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>

      </View>
    </View>
  );
}

