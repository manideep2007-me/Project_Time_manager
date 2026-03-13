import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { dashboardApi } from '../../api/dashboard';
import { 
  getPermissionsMatrix, 
  updatePermissions, 
  getUserPermissions, 
  updateUserPermissions,
  PermissionMatrixRow,
  UserPermissionRow 
} from '../../api/endpoints';
import { PermissionsContext } from '../../context/PermissionsContext';

const PRIMARY_PURPLE = '#877ED2';
const LIGHT_PURPLE = '#E8E7ED';
const BG_COLOR = '#F5F5F8';

type Role = 'manager' | 'employee';
type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
}

// Custom Toggle Component - Perfectly Rounded iOS-Style Design
const CustomToggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
  <TouchableOpacity 
    style={[toggleStyles.toggleSwitch, value && toggleStyles.toggleSwitchActive]}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={[toggleStyles.toggleKnob, value && toggleStyles.toggleKnobActive]} />
  </TouchableOpacity>
);

const toggleStyles = StyleSheet.create({
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E5E5EA',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: PRIMARY_PURPLE,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    position: 'absolute',
    left: 2,
  },
  toggleKnobActive: {
    left: 22,
  },
});

export default function AdminPermissionsScreen() {
  const navigation = useNavigation();
  const { refresh: refreshGlobalPermissions } = useContext(PermissionsContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'role' | 'individual'>('role');
  const [selectedRole, setSelectedRole] = useState<Role>('manager');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // API permissions data
  const [apiPermissions, setApiPermissions] = useState<PermissionMatrixRow[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissionRow[]>([]);
  
  // Track pending changes
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Map<string, boolean>>(new Map());
  const [pendingUserChanges, setPendingUserChanges] = useState<Map<string, boolean>>(new Map());
  
  // Permission categories for UI display (derived from API data)
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([
    { id: 'manage_client', name: 'Manage Client', permissions: { view: false, add: false, edit: false, delete: false } },
    { id: 'manage_project', name: 'Manage Project', permissions: { view: false, add: false, edit: false, delete: false } },
    { id: 'manage_task', name: 'Manage Task', permissions: { view: false, add: false, edit: false, delete: false } },
    { id: 'manage_employee', name: 'Manage Employee', permissions: { view: false, add: false, edit: false, delete: false } },
    { id: 'manage_attachments', name: 'Manage Attachments', permissions: { view: false, add: false, edit: false, delete: false } },
  ]);

  const [expensePermissions, setExpensePermissions] = useState({
    view: false,
    approve: false,
  });

  const [attendancePermissions, setAttendancePermissions] = useState({
    view: false,
    approve: false,
  });

  const [otherPermissions, setOtherPermissions] = useState({
    setTaskPriority: false,
  });

  // Helper function to map API permission name to category info
  const getPermissionInfo = (name: string): { category: string; action: string } | null => {
    const parts = name.split('.');
    if (parts.length !== 2) return null;
    const [entity, action] = parts;
    const categoryMap: Record<string, string> = {
      'clients': 'manage_client',
      'projects': 'manage_project',
      'tasks': 'manage_task',
      'employees': 'manage_employee',
      'attachments': 'manage_attachments',
      'expenses': 'expenses',
      'attendance': 'attendance',
    };
    return { category: categoryMap[entity] || entity, action };
  };

  // Update UI state from API permissions for a specific role
  const updateUIFromPermissions = (permissions: PermissionMatrixRow[], role: Role) => {
    const newCategories: PermissionCategory[] = [
      { id: 'manage_client', name: 'Manage Client', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_project', name: 'Manage Project', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_task', name: 'Manage Task', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_employee', name: 'Manage Employee', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_attachments', name: 'Manage Attachments', permissions: { view: false, add: false, edit: false, delete: false } },
    ];
    const newExpense = { view: false, approve: false };
    const newAttendance = { view: false, approve: false };
    const newOther = { setTaskPriority: false };

    for (const perm of permissions) {
      // Check if there's a pending change for this permission
      const pendingValue = pendingRoleChanges.get(`${role}:${perm.id}`);
      const hasAccess = pendingValue !== undefined ? pendingValue : perm.access[role];
      
      const info = getPermissionInfo(perm.name);
      if (!info) continue;
      
      const cat = newCategories.find(c => c.id === info.category);
      if (cat && ['view', 'add', 'edit', 'delete'].includes(info.action)) {
        (cat.permissions as any)[info.action] = hasAccess;
      } else if (info.category === 'expenses') {
        (newExpense as any)[info.action] = hasAccess;
      } else if (info.category === 'attendance') {
        (newAttendance as any)[info.action] = hasAccess;
      } else if (perm.name === 'tasks.priority') {
        newOther.setTaskPriority = hasAccess;
      }
    }

    setPermissionCategories(newCategories);
    setExpensePermissions(newExpense);
    setAttendancePermissions(newAttendance);
    setOtherPermissions(newOther);
  };

  // Update UI state from user-specific permissions
  const updateUIFromUserPermissions = (permissions: UserPermissionRow[]) => {
    const newCategories: PermissionCategory[] = [
      { id: 'manage_client', name: 'Manage Client', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_project', name: 'Manage Project', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_task', name: 'Manage Task', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_employee', name: 'Manage Employee', permissions: { view: false, add: false, edit: false, delete: false } },
      { id: 'manage_attachments', name: 'Manage Attachments', permissions: { view: false, add: false, edit: false, delete: false } },
    ];
    const newExpense = { view: false, approve: false };
    const newAttendance = { view: false, approve: false };
    const newOther = { setTaskPriority: false };

    for (const perm of permissions) {
      // Check if there's a pending change for this permission
      const pendingValue = pendingUserChanges.get(perm.id);
      const hasAccess = pendingValue !== undefined ? pendingValue : perm.hasAccess;
      
      const info = getPermissionInfo(perm.name);
      if (!info) continue;
      
      const cat = newCategories.find(c => c.id === info.category);
      if (cat && ['view', 'add', 'edit', 'delete'].includes(info.action)) {
        (cat.permissions as any)[info.action] = hasAccess;
      } else if (info.category === 'expenses') {
        (newExpense as any)[info.action] = hasAccess;
      } else if (info.category === 'attendance') {
        (newAttendance as any)[info.action] = hasAccess;
      } else if (perm.name === 'tasks.priority') {
        newOther.setTaskPriority = hasAccess;
      }
    }

    setPermissionCategories(newCategories);
    setExpensePermissions(newExpense);
    setAttendancePermissions(newAttendance);
    setOtherPermissions(newOther);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load role permissions when role changes
  useEffect(() => {
    if (activeTab === 'role' && selectedRole && apiPermissions.length > 0) {
      updateUIFromPermissions(apiPermissions, selectedRole);
    }
  }, [selectedRole, apiPermissions, pendingRoleChanges]);

  // Load user permissions when employee changes
  useEffect(() => {
    if (activeTab === 'individual' && selectedEmployee) {
      loadUserPermissions(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  // Update UI when user permissions or pending changes update
  useEffect(() => {
    if (activeTab === 'individual' && userPermissions.length > 0) {
      updateUIFromUserPermissions(userPermissions);
    }
  }, [userPermissions, pendingUserChanges]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load permissions matrix from API
      console.log('Loading permissions matrix...');
      const permData = await getPermissionsMatrix();
      console.log('Permissions loaded:', permData.permissions?.length, 'permissions');
      setApiPermissions(permData.permissions || []);
      
      // Load employees for the dropdown
      const employeesData = await dashboardApi.getEmployees();
      console.log('Employees API response:', employeesData);
      if (employeesData?.employees && Array.isArray(employeesData.employees)) {
        const mappedEmployees = employeesData.employees.map((emp: any) => ({
          id: String(emp.id),
          name: emp.name || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          role: emp.role || emp.department || emp.position || 'Employee',
        }));
        setEmployees(mappedEmployees);
      } else if (Array.isArray(employeesData)) {
        const mappedEmployees = employeesData.map((emp: any) => ({
          id: String(emp.id),
          name: emp.name || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          role: emp.role || emp.department || emp.position || 'Employee',
        }));
        setEmployees(mappedEmployees);
      }
      
      // Initialize with selected role permissions
      if (selectedRole && permData.permissions) {
        updateUIFromPermissions(permData.permissions, selectedRole);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      Alert.alert('Error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      setLoading(true);
      console.log('Loading user permissions for:', userId);
      const data = await getUserPermissions(userId);
      console.log('User permissions loaded:', data.permissions?.length);
      setUserPermissions(data.permissions || []);
      setPendingUserChanges(new Map()); // Reset pending changes for new user
    } catch (err: any) {
      console.error('Error loading user permissions:', err);
      Alert.alert('Error', 'Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  };

  // Find permission ID by name from API data
  const findPermissionId = (permName: string): string | null => {
    const perm = apiPermissions.find(p => p.name === permName);
    return perm?.id || null;
  };

  const findUserPermissionId = (permName: string): string | null => {
    const perm = userPermissions.find(p => p.name === permName);
    return perm?.id || null;
  };

  const togglePermission = (categoryId: string, action: PermissionAction) => {
    // Map category + action to permission name
    const categoryToEntity: Record<string, string> = {
      'manage_client': 'clients',
      'manage_project': 'projects',
      'manage_task': 'tasks',
      'manage_employee': 'employees',
      'manage_attachments': 'attachments',
    };
    const entity = categoryToEntity[categoryId];
    if (!entity) return;

    const permName = `${entity}.${action}`;
    
    if (activeTab === 'role' && selectedRole) {
      const permId = findPermissionId(permName);
      if (!permId) return;
      
      // Get current value
      const currentPerm = apiPermissions.find(p => p.id === permId);
      const pendingKey = `${selectedRole}:${permId}`;
      const currentValue = pendingRoleChanges.has(pendingKey) 
        ? pendingRoleChanges.get(pendingKey) 
        : currentPerm?.access[selectedRole] || false;
      
      // Toggle the value
      const newChanges = new Map(pendingRoleChanges);
      newChanges.set(pendingKey, !currentValue);
      setPendingRoleChanges(newChanges);
    } else if (activeTab === 'individual' && selectedEmployee) {
      const permId = findUserPermissionId(permName);
      if (!permId) return;
      
      // Get current value
      const currentPerm = userPermissions.find(p => p.id === permId);
      const currentValue = pendingUserChanges.has(permId) 
        ? pendingUserChanges.get(permId) 
        : currentPerm?.hasAccess || false;
      
      // Toggle the value
      const newChanges = new Map(pendingUserChanges);
      newChanges.set(permId, !currentValue);
      setPendingUserChanges(newChanges);
    }
  };

  const toggleExpensePermission = (action: 'view' | 'approve') => {
    const permName = `expenses.${action}`;
    
    if (activeTab === 'role' && selectedRole) {
      const permId = findPermissionId(permName);
      if (!permId) return;
      
      const currentPerm = apiPermissions.find(p => p.id === permId);
      const pendingKey = `${selectedRole}:${permId}`;
      const currentValue = pendingRoleChanges.has(pendingKey) 
        ? pendingRoleChanges.get(pendingKey) 
        : currentPerm?.access[selectedRole] || false;
      
      const newChanges = new Map(pendingRoleChanges);
      newChanges.set(pendingKey, !currentValue);
      setPendingRoleChanges(newChanges);
    } else if (activeTab === 'individual' && selectedEmployee) {
      const permId = findUserPermissionId(permName);
      if (!permId) return;
      
      const currentPerm = userPermissions.find(p => p.id === permId);
      const currentValue = pendingUserChanges.has(permId) 
        ? pendingUserChanges.get(permId) 
        : currentPerm?.hasAccess || false;
      
      const newChanges = new Map(pendingUserChanges);
      newChanges.set(permId, !currentValue);
      setPendingUserChanges(newChanges);
    }
  };

  const toggleAttendancePermission = (action: 'view' | 'approve') => {
    const permName = `attendance.${action}`;
    
    if (activeTab === 'role' && selectedRole) {
      const permId = findPermissionId(permName);
      if (!permId) return;
      
      const currentPerm = apiPermissions.find(p => p.id === permId);
      const pendingKey = `${selectedRole}:${permId}`;
      const currentValue = pendingRoleChanges.has(pendingKey) 
        ? pendingRoleChanges.get(pendingKey) 
        : currentPerm?.access[selectedRole] || false;
      
      const newChanges = new Map(pendingRoleChanges);
      newChanges.set(pendingKey, !currentValue);
      setPendingRoleChanges(newChanges);
    } else if (activeTab === 'individual' && selectedEmployee) {
      const permId = findUserPermissionId(permName);
      if (!permId) return;
      
      const currentPerm = userPermissions.find(p => p.id === permId);
      const currentValue = pendingUserChanges.has(permId) 
        ? pendingUserChanges.get(permId) 
        : currentPerm?.hasAccess || false;
      
      const newChanges = new Map(pendingUserChanges);
      newChanges.set(permId, !currentValue);
      setPendingUserChanges(newChanges);
    }
  };

  const toggleOtherPermission = (action: 'setTaskPriority') => {
    const permName = action === 'setTaskPriority' ? 'tasks.priority' : '';
    if (!permName) return;
    
    if (activeTab === 'role' && selectedRole) {
      const permId = findPermissionId(permName);
      if (!permId) return;
      
      const currentPerm = apiPermissions.find(p => p.id === permId);
      const pendingKey = `${selectedRole}:${permId}`;
      const currentValue = pendingRoleChanges.has(pendingKey) 
        ? pendingRoleChanges.get(pendingKey) 
        : currentPerm?.access[selectedRole] || false;
      
      const newChanges = new Map(pendingRoleChanges);
      newChanges.set(pendingKey, !currentValue);
      setPendingRoleChanges(newChanges);
    } else if (activeTab === 'individual' && selectedEmployee) {
      const permId = findUserPermissionId(permName);
      if (!permId) return;
      
      const currentPerm = userPermissions.find(p => p.id === permId);
      const currentValue = pendingUserChanges.has(permId) 
        ? pendingUserChanges.get(permId) 
        : currentPerm?.hasAccess || false;
      
      const newChanges = new Map(pendingUserChanges);
      newChanges.set(permId, !currentValue);
      setPendingUserChanges(newChanges);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'role') {
        // Save role-based permissions
        const updates: Array<{ role: 'admin' | 'manager' | 'employee'; permissionId: string; hasAccess: boolean }> = [];
        
        pendingRoleChanges.forEach((hasAccess, key) => {
          const [role, permId] = key.split(':');
          if (role && permId) {
            updates.push({ role: role as 'manager' | 'employee', permissionId: permId, hasAccess });
          }
        });
        
        if (updates.length > 0) {
          console.log('Saving role permissions:', updates.length, 'changes');
          await updatePermissions(updates);
          
          // Reload permissions to get fresh data
          const permData = await getPermissionsMatrix();
          setApiPermissions(permData.permissions || []);
          setPendingRoleChanges(new Map());
          
          // Refresh global permissions context so changes take effect immediately
          await refreshGlobalPermissions();
          
          Alert.alert('Success', 'Role permissions updated successfully');
        } else {
          Alert.alert('Info', 'No changes to save');
        }
      } else if (activeTab === 'individual' && selectedEmployee) {
        // Save user-specific permissions
        const updates: Array<{ permissionId: string; hasAccess: boolean }> = [];
        
        pendingUserChanges.forEach((hasAccess, permId) => {
          updates.push({ permissionId: permId, hasAccess });
        });
        
        if (updates.length > 0) {
          console.log('Saving user permissions:', updates.length, 'changes');
          await updateUserPermissions(selectedEmployee.id, updates);
          
          // Reload user permissions
          await loadUserPermissions(selectedEmployee.id);
          
          // Refresh global permissions context
          await refreshGlobalPermissions();
          
          Alert.alert('Success', 'User permissions updated successfully');
        } else {
          Alert.alert('Info', 'No changes to save');
        }
      }
    } catch (err: any) {
      console.error('Error saving permissions:', err);
      Alert.alert('Error', 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  // Check if there are pending changes
  const hasPendingChanges = activeTab === 'role' 
    ? pendingRoleChanges.size > 0 
    : pendingUserChanges.size > 0;

  if (loading) {
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
          <Text style={styles.headerTitle}>Permission</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'role' && styles.tabActive]}
            onPress={() => setActiveTab('role')}
          >
            <Text style={[styles.tabText, activeTab === 'role' && styles.tabTextActive]}>
              By Role
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'individual' && styles.tabActive]}
            onPress={() => setActiveTab('individual')}
          >
            <Text style={[styles.tabText, activeTab === 'individual' && styles.tabTextActive]}>
              By Individual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Selector */}
        {activeTab === 'role' ? (
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowRoleDropdown(true)}
          >
            <Text style={[styles.dropdownText, !selectedRole && styles.dropdownPlaceholder]}>
              {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : 'Select Role'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowEmployeeDropdown(true)}
          >
            <Text style={[styles.dropdownText, !selectedEmployee && styles.dropdownPlaceholder]}>
              {selectedEmployee?.name || 'Select Employee'}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#8F8F8F" />
          </TouchableOpacity>
        )}

        {/* Permissions Table */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Main Permissions Card */}
          <View style={styles.card}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableHeaderEmpty} />
              <Text style={styles.tableHeaderText}>View</Text>
              <Text style={styles.tableHeaderText}>Add</Text>
              <Text style={styles.tableHeaderText}>Edit</Text>
              <Text style={styles.tableHeaderText}>Delete</Text>
            </View>

            {/* Permission Rows */}
            {permissionCategories.map((category) => (
              <View key={category.id} style={styles.permissionRow}>
                <Text style={styles.permissionName}>{category.name}</Text>
                <View style={styles.togglesRow}>
                  <View style={styles.toggleWrapper}>
                    <CustomToggle
                      value={category.permissions.view}
                      onToggle={() => togglePermission(category.id, 'view')}
                    />
                  </View>
                  <View style={styles.toggleWrapper}>
                    <CustomToggle
                      value={category.permissions.add}
                      onToggle={() => togglePermission(category.id, 'add')}
                    />
                  </View>
                  <View style={styles.toggleWrapper}>
                    <CustomToggle
                      value={category.permissions.edit}
                      onToggle={() => togglePermission(category.id, 'edit')}
                    />
                  </View>
                  <View style={styles.toggleWrapper}>
                    <CustomToggle
                      value={category.permissions.delete}
                      onToggle={() => togglePermission(category.id, 'delete')}
                    />
                  </View>
                </View>
              </View>
            ))}

            {/* Expenses Row - Special case with View and Approve */}
            <View style={styles.permissionRow}>
            <Text style={styles.permissionName}>Expenses</Text>
            <View style={styles.expenseTogglesRow}>
              <View style={styles.expenseToggle}>
                <Text style={styles.expenseLabel}>View</Text>
                <CustomToggle
                  value={expensePermissions.view}
                  onToggle={() => toggleExpensePermission('view')}
                />
              </View>
              <View style={styles.expenseToggle}>
                <Text style={styles.expenseLabel}>Approve</Text>
                <CustomToggle
                  value={expensePermissions.approve}
                  onToggle={() => toggleExpensePermission('approve')}
                />
              </View>
            </View>
          </View>

            {/* Attendance Row - with View and Approve */}
            <View style={styles.permissionRow}>
              <Text style={styles.permissionName}>Attendance</Text>
              <View style={styles.expenseTogglesRow}>
                <View style={styles.expenseToggle}>
                  <Text style={styles.expenseLabel}>View</Text>
                  <CustomToggle
                    value={attendancePermissions.view}
                    onToggle={() => toggleAttendancePermission('view')}
                  />
                </View>
                <View style={styles.expenseToggle}>
                  <Text style={styles.expenseLabel}>Approve</Text>
                  <CustomToggle
                    value={attendancePermissions.approve}
                    onToggle={() => toggleAttendancePermission('approve')}
                  />
                </View>
              </View>
            </View>

            {/* Set task priority */}
            <View style={styles.singlePermissionRowLast}>
              <Text style={styles.permissionName}>Set task priority</Text>
              <CustomToggle
                value={otherPermissions.setTaskPriority}
                onToggle={() => toggleOtherPermission('setTaskPriority')}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, !hasPendingChanges && !saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || !hasPendingChanges}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : hasPendingChanges ? `Save ${activeTab === 'role' ? pendingRoleChanges.size : pendingUserChanges.size} Changes` : 'Save Permission Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Role Dropdown Modal */}
        <Modal
          visible={showRoleDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRoleDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowRoleDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              {(['manager', 'employee'] as Role[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.dropdownItem,
                    selectedRole === role && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedRole(role);
                    setShowRoleDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedRole === role && styles.dropdownItemTextSelected,
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                  {selectedRole === role && (
                    <Ionicons name="checkmark" size={20} color={PRIMARY_PURPLE} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Employee Dropdown Modal */}
        <Modal
          visible={showEmployeeDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmployeeDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEmployeeDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.dropdownModal}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <FlatList
                data={employees}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>No employees found</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedEmployee?.id === item.id && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedEmployee(item);
                      setShowEmployeeDropdown(false);
                    }}
                  >
                    <View>
                      <Text style={[
                        styles.dropdownItemText,
                        selectedEmployee?.id === item.id && styles.dropdownItemTextSelected,
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.dropdownItemRole}>{item.role}</Text>
                    </View>
                    {selectedEmployee?.id === item.id && (
                      <Ionicons name="checkmark" size={20} color={PRIMARY_PURPLE} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.employeeList}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
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
    paddingHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: BG_COLOR,
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
    color: '#000000',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginRight: 24,
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  tabTextActive: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E8E7ED',
  },
  tableHeaderEmpty: {
    width: 10,
  },
  tableHeaderText: {
    width: 88,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  permissionRow: {
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionName: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 12,
  },
  toggleWrapper: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 18,
  },
  switch: {
    width: 88,
    transform: [{ scaleX: 1.0 }, { scaleY: 1.0 }],
  },
  expenseTogglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 80,
    paddingRight: 10,
  },
  expenseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  expenseLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 4,
    fontWeight: '500',
  },
  expenseSwitch: {
    transform: [{ scaleX: 1.0 }, { scaleY: 1.0 }],
  },
  singlePermissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingRight: 10,
  },
  singlePermissionRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingTop: 14,
    paddingBottom: 18,
    paddingRight: 10,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG_COLOR,
  },
  saveButton: {
    backgroundColor: PRIMARY_PURPLE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    maxHeight: 350,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  dropdownItemSelected: {
    backgroundColor: '#F0EEFF',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: PRIMARY_PURPLE,
    fontWeight: '600',
  },
  dropdownItemRole: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },
  employeeList: {
    maxHeight: 320,
  },
  emptyListContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
});


