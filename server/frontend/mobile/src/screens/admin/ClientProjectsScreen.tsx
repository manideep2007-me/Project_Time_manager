import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ClientProjectsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { client, projects } = route.params || { client: {}, projects: [] };
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState(projects);

  // Hide the default navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter((project: any) =>
        project.name?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.status?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  // Calculate stats
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter((p: any) => p.status?.toLowerCase() === 'in progress').length;
  const completedProjects = filteredProjects.filter((p: any) => p.status?.toLowerCase() === 'completed').length;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getProgressInfo = (project: any) => {
    const status = project.status?.toLowerCase() || 'in progress';
    const isCompleted = status.includes('completed');
    const isOverdue = status.includes('overdue');
    
    if (isCompleted) {
      return {
        label: 'Completed',
        color: '#7986CB',
        progress: 100,
        days: null
      };
    } else if (isOverdue) {
      return {
        label: 'Over due',
        color: '#EF5350',
        progress: 100,
        days: '2d'
      };
    } else {
      return {
        label: 'In Progress',
        color: '#81C784',
        progress: 70,
        days: '5d'
      };
    }
  };

  const renderProjectCard = ({ item }: any) => {
    const progressInfo = getProgressInfo(item);
    const statusBadgeColor = item.status?.toLowerCase().includes('completed') ? '#8E97F0' : item.status?.toLowerCase().includes('overdue') ? '#EF5350' : '#8E97F0';

    return (
      <View style={styles.projectCard}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
          <Text style={styles.statusBadgeText}>{item.status || 'In Progress'}</Text>
        </View>

        {/* Location */}
        <Text style={styles.projectLocation}>{item.location || 'Yelahanka, Bangalore'}</Text>

        {/* Project Info Row */}
        <View style={styles.projectMainRow}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{item.name}</Text>
          </View>
          
          {/* Avatar with Plus Button */}
          <View style={styles.avatarGroup}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=' + (item.id || 1) }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.plusButton}>
              <Ionicons name="add" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer: Dates and Progress */}
        <View style={styles.projectFooter}>
          <View style={styles.datesContainer}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Start</Text>
              <Text style={styles.dateValue}>{formatDate(item.start_date)}</Text>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>End</Text>
              <Text style={styles.dateValue}>{formatDate(item.end_date)}</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: progressInfo.color }]}>
                {progressInfo.label}
              </Text>
              {progressInfo.days && (
                <Text style={[styles.daysText, { color: progressInfo.color }]}>
                  {progressInfo.days}
                </Text>
              )}
            </View>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progressInfo.progress}%`, backgroundColor: progressInfo.color }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#101010" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clients</Text>
      </View>

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <TextInput 
                placeholder="Search" 
                style={styles.searchInput}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Ionicons name="search-outline" size={22} color="#6B5CE7" />
            </View>

            {/* Summary Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                Total: <Text style={styles.statBold}>{totalProjects}</Text>
              </Text>
              <View style={styles.divider} />
              <Text style={styles.statPurple}>Active: {activeProjects}</Text>
              <View style={styles.divider} />
              <Text style={styles.statPurple}>Inactive: {completedProjects}</Text>
            </View>

            {/* Client Detail Card */}
            <View style={styles.clientCard}>
              {/* Client Header */}
              <View style={styles.clientHeader}>
                <Text style={styles.clientName}>{client.name || 'Shriram Properties Ltd'}</Text>
                <Ionicons name="chevron-up" size={24} color="#8E97F0" />
              </View>
              <Text style={styles.clientSubtitle}>
                {client.client_type || 'Residential properties developer'} | {client.location || 'Bangalore'}
              </Text>
              
              {/* Status */}
              <View style={styles.statusRow}>
                <Text style={styles.label}>Status:</Text>
                <View style={styles.activeStatusBadge}>
                  <Text style={styles.activeStatusText}>Active</Text>
                </View>
              </View>

              {/* Address */}
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.infoValue}>
                {client.address || '17/1, Campbell Road, Bangalore – 560 047'}
              </Text>

              {/* Mobile & Email Row */}
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Text style={styles.label}>Mobile:</Text>
                  <Text style={styles.infoValue}>{client.phone || '+91 98868 51817'}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.infoValue}>{client.email || 'sales@shriramprop.in'}</Text>
                </View>
              </View>

              {/* Onboard Date & Projects Row */}
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Text style={styles.label}>Onboard Date:</Text>
                  <Text style={styles.infoValue}>
                    {client.onboard_date 
                      ? formatDate(client.onboard_date)
                      : '12 May 2020'}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Number of Projects:</Text>
                  <Text style={styles.infoValue}>{projects.length}</Text>
                </View>
              </View>
            </View>

            {/* Projects Section Title */}
            <Text style={styles.projectsTitle}>Projects</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 16,
    backgroundColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#000000',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
  },
  
  // Summary Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
  },
  statBold: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statPurple: {
    fontSize: 14,
    color: '#8E97F0',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 10,
  },
  
  // Client Card
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clientSubtitle: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeStatusBadge: {
    backgroundColor: '#81C784',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  activeStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '400',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  column: {
    flex: 1,
  },
  
  // Projects Section
  projectsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  
  // Project Card
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  projectMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  projectInfo: {
    flex: 1,
  },
  projectLocation: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 6,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  plusButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  dateColumn: {
    minWidth: 70,
  },
  dateLabel: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  progressContainer: {
    flex: 1,
    maxWidth: 180,
    alignItems: 'flex-end',
  },
  progressHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  daysText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
});