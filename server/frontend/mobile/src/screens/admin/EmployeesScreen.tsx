import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  TextInput,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

const PRIMARY_PURPLE = '#7E73D8';
const BG_COLOR = '#F3F3F5';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  department: string;
  designation?: string;
  role?: string;
  is_active: boolean;
  photo_url?: string;
  email?: string;
  phone?: string;
  salary?: number;
  overtime_rate?: number;
  location?: string;
  address?: string;
  country?: string;
  employment_type?: string;
  date_of_birth?: string;
  joining_date?: string;
  aadhar_number?: string;
  aadhar_image?: string;
  pay_calculation?: string;
}

export default function EmployeesScreen() {
  const navigation = useNavigation<any>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [roleFilters, setRoleFilters] = useState<string[]>(['All']);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEmployeeId(expandedEmployeeId === id ? null : id);
  };
  const [summaryCounts, setSummaryCounts] = useState({ total: 0, active: 0, offDuty: 0 });

  const handleEditEmployee = (employee: Employee) => {
    // Navigate to AddEmployee screen with employee data for editing
    navigation.navigate('AddEmployee', { 
      editEmployee: {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
        department: employee.department,
        salary: employee.salary,
        overtimeRate: employee.overtime_rate,
        address: employee.address,
        employmentType: employee.employment_type,
        dateOfBirth: employee.date_of_birth,
        joiningDate: employee.joining_date,
        aadhaarNumber: employee.aadhar_number,
        payCalculation: employee.pay_calculation,
        isActive: employee.is_active,
      }
    });
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    
    const name = employeeToDelete.name || `${employeeToDelete.first_name || ''} ${employeeToDelete.last_name || ''}`.trim();
    setDeleteModalVisible(false);
    setDeletingId(employeeToDelete.id);
    
    try {
      await api.delete(`/api/employees/${employeeToDelete.id}`);
      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete.id));
      setExpandedEmployeeId(null);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Failed to delete employee';
      Alert.alert('Error', msg);
    } finally {
      setDeletingId(null);
      setEmployeeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setEmployeeToDelete(null);
  };

  const handleToggleEmployeeStatus = async (employee: Employee) => {
    const nextActive = !employee.is_active;
    const actionLabel = nextActive ? 'activate' : 'deactivate';
    const name = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

    Alert.alert(
      nextActive ? 'Activate Employee' : 'Deactivate Employee',
      `Are you sure you want to ${actionLabel} ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Activate' : 'Deactivate',
          style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            setStatusUpdatingId(employee.id);
            try {
              const res = await api.put(`/api/employees/${employee.id}`, { isActive: nextActive });
              const updatedActive = res?.data?.employee?.is_active ?? nextActive;
              setEmployees((prev) => prev.map((emp) => (
                emp.id === employee.id ? { ...emp, is_active: updatedActive } : emp
              )));
            } catch (error: any) {
              const msg = error?.response?.data?.error || 'Failed to update employee status';
              Alert.alert('Error', msg);
            } finally {
              setStatusUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const getEmployeeRoleLabel = (employee: Employee) => {
    const raw = employee.designation || employee.role || employee.department || 'Employee';
    return String(raw || 'Employee').trim() || 'Employee';
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/api/employees', { params: { limit: 500, active: 'all' } });
      const list = Array.isArray(res.data?.employees) ? res.data.employees : [];
      setEmployees(list);
      
      // Extract unique roles/designations from real employee data
      const roleMap = new Map<string, string>();
      list.forEach((emp: Employee) => {
        const roleLabel = getEmployeeRoleLabel(emp);
        const key = roleLabel.toLowerCase();
        if (!roleMap.has(key)) {
          roleMap.set(key, roleLabel);
        }
      });
      setRoleFilters(['All', ...Array.from(roleMap.values())]);
      
      filterEmployees(list, searchQuery, selectedRole);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const filterEmployees = useCallback((empList: Employee[], search: string, roleFilter: string) => {
    let filtered = empList;
    
    // Filter by dynamic role/designation
    if (roleFilter !== 'All') {
      filtered = filtered.filter(emp => getEmployeeRoleLabel(emp) === roleFilter);
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(emp => {
        const name = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
        const roleLabel = getEmployeeRoleLabel(emp).toLowerCase();
        return name.toLowerCase().includes(searchLower) || 
               roleLabel.includes(searchLower) ||
               emp.department?.toLowerCase().includes(searchLower);
      });
    }
    
    const activeCount = filtered.filter(emp => emp.is_active).length;
    const offDutyCount = filtered.filter(emp => !emp.is_active).length;
    setSummaryCounts({
      total: filtered.length,
      active: activeCount,
      offDuty: offDutyCount,
    });

    setFilteredEmployees(filtered);
  }, []);

  // Refresh when screen is focused (after editing)
  useFocusEffect(
    useCallback(() => {
      loadEmployees().finally(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    filterEmployees(employees, searchQuery, selectedRole);
  }, [searchQuery, selectedRole, employees, filterEmployees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
  };

  const getActiveCount = () => summaryCounts.active;
  const getOffDutyCount = () => summaryCounts.offDuty;

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#9FB996', '#96B6B9', '#9697B9'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const EmployeeItem = ({ employee, index, total }: { employee: Employee; index: number; total: number }) => {
    const name = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const initials = getInitials(employee.first_name, employee.last_name);
    const avatarColor = getAvatarColor(name);
    const isExpanded = expandedEmployeeId === employee.id;
    const isDeleting = deletingId === employee.id;
    const isUpdatingStatus = statusUpdatingId === employee.id;
    
    return (
      <View style={[styles.cardContainer, index !== total - 1 && styles.cardContainerWithDivider]}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <TouchableOpacity 
            style={styles.employeeLeft}
            onPress={() => navigation.navigate('EmployeeInfo', { id: employee.id, employeeData: employee })}
          >
            {employee.photo_url ? (
              <Image source={{ uri: employee.photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{name}</Text>
              <Text style={styles.employeeRole}>{employee.designation || employee.role || 'Employee'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingLeft: 8, paddingVertical: 8 }}
            onPress={() => toggleExpand(employee.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={PRIMARY_PURPLE}
            />
          </TouchableOpacity>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Status Row */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusBadge, employee.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusBadgeText, employee.is_active ? styles.activeText : styles.inactiveText]}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <View style={styles.employmentTypeBadge}>
                <Text style={styles.employmentTypeText}>
                  {employee.employment_type || 'Full Time'}
                </Text>
              </View>
            </View>

            {/* Salary Row */}
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Monthly Salary:</Text>
                <Text style={styles.detailValue}>₹{employee.salary?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Overtime Rate:</Text>
                <Text style={styles.detailValue}>{employee.overtime_rate || '0'}</Text>
              </View>
            </View>

            {/* Contact Row */}
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Mobile:</Text>
                <Text style={styles.detailValue}>{employee.phone || 'N/A'}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{employee.email || 'N/A'}</Text>
              </View>
            </View>

            {/* Location Row */}
            <View style={styles.locationRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{employee.location || 'N/A'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditEmployee(employee)}
                disabled={isDeleting || isUpdatingStatus}
              >
                <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteButton, isDeleting && { opacity: 0.6 }]}
                onPress={() => handleDeleteEmployee(employee)}
                disabled={isDeleting || isUpdatingStatus}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusToggleButton,
                  employee.is_active ? styles.deactivateButton : styles.activateButton,
                  isUpdatingStatus && { opacity: 0.6 },
                ]}
                onPress={() => handleToggleEmployeeStatus(employee)}
                disabled={isDeleting || isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name={employee.is_active ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={16} color="#FFFFFF" />
                    <Text style={styles.statusToggleButtonText}>{employee.is_active ? 'Inactive' : 'Active'}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('EmployeeInfo', { id: employee.id, employeeData: employee })}
                disabled={isDeleting || isUpdatingStatus}
              >
                <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                <Text style={styles.viewMoreButtonText}>More</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && employees.length === 0) {
    return (
      <SafeAreaWrapper backgroundColor={BG_COLOR}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={BG_COLOR}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#101010" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Employees</Text>
        </View>

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
            <Ionicons name="search" size={20} color={PRIMARY_PURPLE} />
          </View>
        </View>

        {/* Dynamic Role Filter Label */}
        <Text style={styles.filterLabel}>List by department</Text>

        {/* Dynamic Role Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {roleFilters.map((roleName) => (
            <TouchableOpacity
              key={roleName}
              style={[
                styles.filterChip,
                selectedRole === roleName && styles.filterChipActive,
              ]}
              onPress={() => setSelectedRole(roleName)}
            >
              <Text style={[
                styles.filterChipText,
                selectedRole === roleName && styles.filterChipTextActive,
              ]}>
                {roleName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsLabel}>Total: </Text>
          <Text style={styles.statsValue}>{summaryCounts.total}</Text>
          <Text style={styles.statsDivider}>|</Text>
          <Text style={styles.statsActiveLabel}>Active: </Text>
          <Text style={styles.statsActiveValue}>{getActiveCount()}</Text>
          <Text style={styles.statsDivider}>|</Text>
          <Text style={styles.statsOffDutyLabel}>Off Duty: </Text>
          <Text style={styles.statsOffDutyValue}>{getOffDutyCount()}</Text>
        </View>

        {/* Employee List */}
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <EmployeeItem employee={item} index={index} total={filteredEmployees.length} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No employees found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.flatList}
        />
      </View>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <Ionicons name="trash-outline" size={36} color={PRIMARY_PURPLE} />
            </View>
            
            {/* Title */}
            <Text style={styles.modalTitle}>Delete Employee</Text>
            
            {/* Message */}
            <Text style={styles.modalMessage}>
              Are you sure you want to delete{' '}
              <Text style={styles.modalEmployeeName}>
                "{employeeToDelete?.name || `${employeeToDelete?.first_name || ''} ${employeeToDelete?.last_name || ''}`.trim()}"
              </Text>
              ?
            </Text>
            <Text style={styles.modalSubMessage}>
              This will deactivate the employee account.
            </Text>
            
            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelDelete}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteButton} onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#2C2C2C',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E7E5EF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#8A8A8A',
  },
  filterLabel: {
    fontSize: 12,
    color: '#8B8B8B',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterContainer: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 29,
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#B5B5B5',
    backgroundColor: BG_COLOR,
    marginRight: 8,
    marginBottom: 4,
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#7E73D8',
    borderRadius: 5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#8F8F8F',
  },
  filterChipTextActive: {
    color: '#6F64CC',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#3F3F3F',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  statsValue: {
    fontSize: 14,
    color: '#3F3F3F',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  statsDivider: {
    fontSize: 16,
    color: '#A2A2A2',
    marginHorizontal: 8,
  },
  statsActiveLabel: {
    fontSize: 14,
    color: '#8176D8',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  statsActiveValue: {
    fontSize: 14,
    color: PRIMARY_PURPLE,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  statsOffDutyLabel: {
    fontSize: 14,
    color: '#8176D8',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  statsOffDutyValue: {
    fontSize: 14,
    color: '#877ED2',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardContainerWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedContent: {
    paddingTop: 12,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#8F8F8F',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 25,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: '#8EBF72',
  },
  inactiveBadge: {
    backgroundColor: '#F05A50',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#FFFFFF',
  },
  employmentTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 25,
    backgroundColor: '#ECECF1',
  },
  employmentTypeText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#404040',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#8F8F8F',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#404040',
  },
  locationRow: {
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: PRIMARY_PURPLE,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: PRIMARY_PURPLE,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: PRIMARY_PURPLE,
    gap: 6,
  },
  viewMoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  statusToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  deactivateButton: {
    backgroundColor: '#E55252',
  },
  activateButton: {
    backgroundColor: '#58A55C',
  },
  statusToggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  employeeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  employeeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_500Medium',
    color: '#4A4A4A',
  },
  employeeRole: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#9B9B9B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(135, 126, 210, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_500Medium',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalEmployeeName: {
    fontWeight: '600',
    color: '#333',
  },
  modalSubMessage: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#999',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
  modalDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PRIMARY_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalDeleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
});
