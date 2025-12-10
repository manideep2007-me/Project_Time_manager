import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Linking, Dimensions, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getProject, listProjectTasks } from '../../api/endpoints';
import { dashboardApi } from '../../api/dashboard';
import { api } from '../../api/client';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

export default function ProjectDetailsScreen() {
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [attachmentsCount, setAttachmentsCount] = useState<number>(0);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [employeeTasks, setEmployeeTasks] = useState<any[]>([]);
  const [teamMembersWithTime, setTeamMembersWithTime] = useState<any[]>([]);
  const [projectAttachments, setProjectAttachments] = useState<any[]>([]);

  const loadData = async () => {
    try {
      if (!id) return;
      
      // Load project data
      let projectData: any | null = null;
      try {
        const res = await getProject(id);
        projectData = res.project;
      } catch (e: any) {
        console.log('Error loading project:', e.message);
        return;
      }

      if (!projectData) return;
      setProject(projectData);

      // Load tasks
      let totalTasks = 0;
      try {
        const taskRes = await listProjectTasks(String(id), 1, 200);
        totalTasks = (taskRes.tasks || []).length;
      } catch (e) {
        totalTasks = 0;
      }

      // Load team members
      let teamMembersData: any[] = [];
      try {
        const teamResponse = await api.get(`/api/projects/${id}/team`);
        const members = teamResponse.data?.teamMembers || [];
        teamMembersData = members.map((member: any) => ({
          id: member.id,
          name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
        }));
      } catch (e: any) {
        teamMembersData = [];
      }

      setTeamMembers(teamMembersData);
      setTasksCount(totalTasks);

      // Load team members with time logged for the project
      try {
        const teamData = await dashboardApi.getProjectTeam(String(id));
        const stats = await dashboardApi.getProjectStats(String(id));
        const employeeBreakdown = stats?.employeeBreakdown || [];
        
        const teamWithTime = teamData.teamMembers.map((member: any) => {
          const statsForMember = employeeBreakdown.find((emp: any) => emp.id === member.id);
          const totalMinutes = statsForMember ? (statsForMember.totalMinutes || 0) : 0;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          return {
            id: member.id,
            name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
            role: member.role || member.department || 'Team Member',
            totalTime: totalMinutes,
            hours,
            minutes,
            avatar: member.avatar || null,
          };
        });
        
        setTeamMembersWithTime(teamWithTime);
      } catch (error) {
        console.error('Error loading team with time:', error);
        setTeamMembersWithTime([]);
      }

      // Fetch attachments count and filter employee tasks
      try {
        const tasks = await listProjectTasks(String(id), 1, 200);
        let allAttachments: any[] = [];
        
        // Filter tasks where current employee is a team member
        const employeeId = user?.id;
        const userEmail = user?.email?.toLowerCase();
        console.log('Employee ID:', employeeId);
        console.log('User Email:', userEmail);
        console.log('All tasks:', tasks.tasks?.length);
        
        const filteredTasks = (tasks.tasks || []).filter((task: any) => {
          // Parse assigned_employees if it's a string (JSON)
          let assignedEmployees = task.assigned_employees || [];
          if (typeof assignedEmployees === 'string') {
            try {
              assignedEmployees = JSON.parse(assignedEmployees);
            } catch (e) {
              console.error('Error parsing assigned_employees:', e);
              assignedEmployees = [];
            }
          }
          
          // Normalize IDs for comparison
          const employeeIdStr = employeeId?.toString();
          const employeeIdNum = typeof employeeId === 'number' ? employeeId : null;
          
          // Check if employee is in assigned_employees array (by ID or email)
          const isAssigned = assignedEmployees.some((emp: any) => {
            if (!emp) return false;
            
            // Match by ID
            if (emp.id) {
              const empIdStr = emp.id?.toString();
              const empIdNum = typeof emp.id === 'number' ? emp.id : null;
              
              const idMatch = (
                empIdStr === employeeIdStr ||
                empIdNum === employeeIdNum ||
                emp.id === employeeId ||
                empIdStr === String(employeeId) ||
                String(emp.id) === employeeIdStr
              );
              
              if (idMatch) return true;
            }
            
            // Match by email (fallback if IDs don't match)
            if (userEmail && emp.email) {
              const empEmail = emp.email?.toLowerCase();
              if (empEmail === userEmail) {
                console.log(`  Matched by email: ${empEmail}`);
                return true;
              }
            }
            
            return false;
          });
          
          // Also check if task.assigned_to matches (for backward compatibility)
          const assignedToStr = task.assigned_to?.toString();
          const assignedToNum = typeof task.assigned_to === 'number' ? task.assigned_to : null;
          const isDirectlyAssigned = (
            assignedToStr === employeeIdStr ||
            assignedToNum === employeeIdNum ||
            task.assigned_to === employeeId ||
            assignedToStr === String(employeeId) ||
            String(task.assigned_to) === employeeIdStr
          );
          
          const isMatch = isAssigned || isDirectlyAssigned;
          console.log(`Task ${task.id} "${task.title}": assigned_employees=${assignedEmployees.length}, isAssigned=${isAssigned}, assigned_to=${task.assigned_to}, isDirectlyAssigned=${isDirectlyAssigned}, MATCH=${isMatch}`);
          if (assignedEmployees.length > 0) {
            console.log(`  Employee IDs in task:`, assignedEmployees.map((e: any) => `${e.id} (${e.email || 'no email'})`));
          }
          
          return isMatch;
        });
        
        console.log('Filtered tasks count:', filteredTasks.length);
        if (filteredTasks.length > 0) {
          console.log('Filtered task IDs:', filteredTasks.map((t: any) => t.id));
        }
        
        // Fetch attachments for each filtered task
        const tasksWithAttachments = await Promise.all(
          filteredTasks.map(async (task: any) => {
            try {
              const taskAttachments = await dashboardApi.getTaskAttachments(task.id.toString());
              return {
                ...task,
                attachments: taskAttachments,
              };
            } catch (error) {
              return {
                ...task,
                attachments: [],
              };
            }
          })
        );
        
        setEmployeeTasks(tasksWithAttachments);
        console.log('Employee tasks set:', tasksWithAttachments.length);
        
        for (const task of tasks.tasks || []) {
          try {
            const taskAttachments = await dashboardApi.getTaskAttachments(task.id.toString());
            allAttachments.push(...taskAttachments);
          } catch (error) {
            // Ignore individual task errors
          }
        }
        setAttachmentsCount(allAttachments.length);
        setProjectAttachments(allAttachments);
      } catch (error) {
        setAttachmentsCount(0);
        setEmployeeTasks([]);
        setProjectAttachments([]);
      }

    } catch (error: any) {
      console.error('Error loading project data:', error.message);
    }
  };

  useEffect(() => {
    if (id) {
      loadData().finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddressPress = () => {
    const address = project?.client_address || project?.address || 'Doddaballapura Main Rd, Bengaluru, Karnataka 560119';
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.google.com/?q=${encodedAddress}`;
    Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
  };

  // Categorize attachments
  const categorizeAttachments = (attachments: any[]) => {
    const categorized: { [key: string]: any[] } = {
      Document: [],
      Photo: [],
      Video: [],
    };
    
    attachments.forEach((attachment) => {
      const mimeType = attachment.mime_type?.toLowerCase() || '';
      if (mimeType.startsWith('image/')) {
        categorized.Photo.push(attachment);
      } else if (mimeType.startsWith('video/')) {
        categorized.Video.push(attachment);
      } else {
        categorized.Document.push(attachment);
      }
    });
    
    return categorized;
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    const mime = mimeType?.toLowerCase() || '';
    if (mime.startsWith('image/')) {
      return 'image';
    } else if (mime.startsWith('video/')) {
      return 'videocam';
    } else {
      return 'document-text';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format time as "Xhr Ymin"
  const formatTime = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return '0hr 0min';
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}hr`;
    return `${hours}hr ${minutes}min`;
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80', '#E74C3C', '#3498DB'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getDaysCount = () => {
    if (project?.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    if (project?.start_date) {
      const startDate = new Date(project.start_date);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return tasksCount;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#877ED2" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#F5F6FA">
      <View style={styles.container}>
        {/* Purple Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {project.name || 'Project'}
            </Text>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* White Content Card - Positioned on top */}
        <View style={styles.cardContainer}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentCard, styles.overlappingCard]}>
            {/* Location Label */}
            <Text style={styles.locationLabel}>
              {project.location || project.client_address || 'Yelahanka, Bangalore'}
            </Text>

            {/* Project Title */}
            <Text style={styles.projectTitle}>{project.name || 'Project'}</Text>

            {/* Description */}
            <Text style={styles.description}>
              {project.description || project.notes || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'}
            </Text>

            {/* Address with Map Marker */}
            <TouchableOpacity style={styles.addressContainer} onPress={handleAddressPress} activeOpacity={0.7}>
              <Ionicons name="location" size={20} color="#877ED2" style={styles.locationIcon} />
              <Text style={styles.addressText}>
                {project.client_address || project.address || 'Doddaballapura Main Rd, Bengaluru, Karnataka 560119'}
              </Text>
            </TouchableOpacity>

            {/* Footer Statistics */}
            <View style={styles.footerStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color="#877ED2" />
                <Text style={styles.statNumber}>{teamMembers.length || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="document-text" size={24} color="#877ED2" />
                <Text style={styles.statNumber}>{attachmentsCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={24} color="#877ED2" />
                <Text style={styles.statNumber}>{getDaysCount()}</Text>
              </View>
            </View>
          </View>

          {/* Tasks Section */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Task</Text>
              <TouchableOpacity style={styles.allButton}>
                <Text style={styles.allButtonText}>All</Text>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            {employeeTasks.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tasksScrollContent}
              >
                {employeeTasks.map((task) => {
                  const assignedEmployees = task.assigned_employees || [];
                  const taskAttachments = task.attachments || [];
                  
                  // Get status badge color
                  const getStatusColor = (status: string) => {
                    switch (status?.toLowerCase()) {
                      case 'new':
                        return '#34C759';
                      case 'in progress':
                        return '#5AC8FA';
                      case 'completed':
                        return '#007AFF';
                      case 'on hold':
                        return '#FF9500';
                      default:
                        return '#8E8E93';
                    }
                  };

                  // Format date
                  const formatDate = (dateString: string) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
                  };

                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskCard}
                      onPress={() => navigation.navigate('TaskDetails', { id: task.id })}
                    >
                      {/* Status Badge */}
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                        <Text style={styles.statusBadgeText}>{task.status || 'New'}</Text>
                      </View>

                      {/* Location/Client */}
                      <Text style={styles.taskLocation}>
                        {project?.client_name 
                          ? `${project.client_name}, ${project?.location || 'yelahanka'}`.toLowerCase()
                          : project?.location || 'Yelahanka, Bangalore'}
                      </Text>

                      {/* Task Title */}
                      <Text style={styles.taskTitle} numberOfLines={2}>
                        {task.title || 'Task'}
                      </Text>

                      {/* Assigned Date */}
                      <View style={styles.taskDateRow}>
                        <Text style={styles.taskDateLabel}>Assigned date</Text>
                        <Text style={styles.taskDateValue}>
                          {formatDate(task.created_at) || 'N/A'}
                        </Text>
                      </View>

                      {/* Due Date */}
                      <View style={styles.taskDateRow}>
                        <Text style={styles.taskDateLabel}>Due date</Text>
                        <Text style={styles.taskDateValue}>
                          {formatDate(task.due_date) || 'N/A'}
                        </Text>
                      </View>

                      {/* Footer Icons */}
                      <View style={styles.taskFooter}>
                        <View style={styles.taskStatItem}>
                          <Ionicons name="people" size={16} color="#877ED2" />
                          <Text style={styles.taskStatNumber}>{assignedEmployees.length || 0}</Text>
                        </View>
                        <View style={styles.taskStatItem}>
                          <Ionicons name="document-text" size={16} color="#877ED2" />
                          <Text style={styles.taskStatNumber}>{taskAttachments.length || 0}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksText}>No tasks assigned to you in this project</Text>
              </View>
            )}
          </View>

          {/* Team Section */}
          <View style={styles.teamSection}>
            <View style={styles.teamCard}>
              <View style={styles.teamCardHeader}>
                <Text style={styles.teamCardTitle}>Team</Text>
                <Text style={styles.teamCardTotalTime}>Total Time</Text>
              </View>
              {teamMembersWithTime.map((member) => (
                <View key={member.id} style={styles.teamMemberRow}>
                  <View style={styles.avatarContainer}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: getAvatarColor(member.name) }]}>
                        <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.teamMemberInfo}>
                    <Text style={styles.teamMemberName}>{member.name}</Text>
                    <Text style={styles.teamMemberRole}>{member.role}</Text>
                  </View>
                  <Text style={styles.teamMemberTime}>
                    {formatTime(member.hours, member.minutes)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attachments Section */}
          <View style={styles.attachmentsSection}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {projectAttachments.length > 0 ? (
              (() => {
                const categorized = categorizeAttachments(projectAttachments);
                return (
                  <>
                    <View style={styles.attachmentCategories}>
                      {Object.entries(categorized).map(([category, items]) => (
                        items.length > 0 && (
                          <View key={category} style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {category} {items.length}
                            </Text>
                          </View>
                        )
                      ))}
                    </View>
                    <View style={styles.attachmentsGrid}>
                      {projectAttachments.map((attachment, index) => (
                        <View key={index} style={styles.attachmentCard}>
                          <Ionicons 
                            name={getFileIcon(attachment.mime_type)} 
                            size={24} 
                            color="#877ED2" 
                          />
                          <Text style={styles.attachmentFileName} numberOfLines={2}>
                            {attachment.original_name || 'Attachment'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                );
              })()
            ) : (
              <Text style={styles.noAttachmentsText}>No attachments available</Text>
            )}
          </View>
          </ScrollView>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#877ED2',
    paddingTop: 12,
    paddingBottom: 140,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    zIndex: 1,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 168,
    paddingBottom: 20,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 10,
  },
  overlappingCard: {
    marginTop: -80,
  },
  locationLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
    fontWeight: '400',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  description: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '400',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  locationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#877ED2',
    textDecorationLine: 'underline',
    lineHeight: 20,
    fontWeight: '400',
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  tasksSection: {
    marginTop: 24,
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  allButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 4,
  },
  tasksScrollContent: {
    paddingRight: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskLocation: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '400',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    lineHeight: 22,
  },
  taskDateRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  taskDateLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
    marginBottom: 4,
  },
  taskDateValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  taskFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
  },
  taskStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  taskStatNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  noTasksContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  teamSection: {
    marginTop: 32,
    paddingBottom: 20,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  teamCardTotalTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  teamMemberRole: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  teamMemberTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  attachmentsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  attachmentCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  attachmentCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attachmentFileName: {
    fontSize: 12,
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
  },
  noAttachmentsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
