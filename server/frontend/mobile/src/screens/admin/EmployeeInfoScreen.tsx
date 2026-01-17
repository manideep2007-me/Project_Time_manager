import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { getEmployee, deleteEmployee } from '../../api/endpoints';

const PRIMARY_PURPLE = '#877ED2';
const BG_COLOR = '#F0F0F0';

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  is_active: boolean;
  employment_type?: string;
  date_of_birth?: string;
  joining_date?: string;
  location?: string;
  address?: string;
  country?: string;
  aadhar_number?: string;
  aadhar_image?: string;
  salary?: number;
  overtime_rate?: number;
  pay_calculation?: string;
  photo_url?: string;
}

export default function EmployeeInfoScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id, employeeData } = route.params as { id: string; employeeData?: EmployeeData };
  
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always load fresh data from API to ensure all fields are populated
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const res = await getEmployee(id);
      setEmployee(res.employee);
    } catch (error) {
      console.error('Error loading employee:', error);
      Alert.alert('Error', 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditEmployee', { id: employee?.id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${employee?.first_name} ${employee?.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(id);
              Alert.alert('Success', 'Employee deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting employee:', error);
              Alert.alert('Error', 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  };

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={BG_COLOR}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!employee) {
    return (
      <SafeAreaWrapper backgroundColor={BG_COLOR}>
        <View style={styles.loadingContainer}>
          <Text>Employee not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const fullName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

  return (
    <SafeAreaWrapper backgroundColor={BG_COLOR}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Employee info</Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Container */}
          <View style={styles.card}>
            {/* Profile Photo */}
            <View style={styles.photoContainer}>
              {employee.photo_url ? (
                <Image source={{ uri: employee.photo_url }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(employee.first_name, employee.last_name)}</Text>
                </View>
              )}
            </View>

            {/* Status Badges */}
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

            {/* Info Fields */}
            <View style={styles.infoSection}>
              <InfoField label="Name:" value={fullName} />
              <InfoField label="Designation:" value={employee.designation || 'N/A'} />
              <InfoField label="Date of Birth:" value={formatDate(employee.date_of_birth)} />
              <InfoField label="Mobile:" value={employee.phone || 'N/A'} />
              <InfoField label="Email:" value={employee.email || 'N/A'} />
              <InfoField label="Location:" value={employee.location || 'N/A'} />
              <InfoField label="Address:" value={employee.address || 'N/A'} multiline />
              <InfoField label="Country:" value={employee.country || 'India'} />
              
              {/* Aadhar with Image */}
              <View style={styles.aadharRow}>
                <View style={styles.aadharInfo}>
                  <Text style={styles.fieldLabel}>Aadhar:</Text>
                  <Text style={styles.fieldValue}>{employee.aadhar_number || 'N/A'}</Text>
                </View>
                {employee.aadhar_image && (
                  <Image source={{ uri: employee.aadhar_image }} style={styles.aadharImage} />
                )}
              </View>

              <InfoField label="Joining Date:" value={formatDate(employee.joining_date)} />
              <InfoField label="Location:" value={employee.location || 'N/A'} />
              <InfoField label="Pay Calculation:" value={employee.pay_calculation || 'Monthly'} />
              <InfoField label="Salary:" value={`₹${employee.salary?.toLocaleString() || '0'}`} />
              <InfoField label="Over time rate:" value={`${employee.overtime_rate || '0'}`} />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
}

const InfoField = ({ label, value, multiline }: InfoFieldProps) => (
  <View style={[styles.fieldContainer, multiline && styles.fieldContainerMultiline]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={[styles.fieldValue, multiline && styles.fieldValueMultiline]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    fontSize:20,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginTop: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#E8B86D',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#9FB996',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8B86D',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8F8F8F',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: '#83B465',
  },
  inactiveBadge: {
    backgroundColor: '#FF6B6B',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#FFFFFF',
  },
  employmentTypeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E8E7ED',
  },
  employmentTypeText: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldContainerMultiline: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#8F8F8F',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#000000',
  },
  fieldValueMultiline: {
    lineHeight: 22,
  },
  aadharRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aadharInfo: {
    flex: 1,
  },
  aadharImage: {
    width: 80,
    height: 50,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#F0F0F0',
  },
  editButton: {
    flex: 1,
    backgroundColor: PRIMARY_PURPLE,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#7B73C8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
