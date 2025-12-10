import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { listProjects, listEmployees, createTimeEntry } from '../../api/endpoints';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import VoiceToTextButton from '../../components/shared/VoiceToTextButton';

export default function TimeEntryScreen() {
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      const [projectsData, employeesData] = await Promise.all([
        listProjects({ status: 'ACTIVE' }),
        listEmployees()
      ]);
      setProjects(projectsData.projects || []);
      setEmployees(employeesData.employees || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const setCurrentTime = (field: 'start' | 'end') => {
    const now = new Date();
    const timeString = formatDateTime(now);
    
    if (field === 'start') {
      setStartTime(timeString);
    } else {
      setEndTime(timeString);
    }
  };

  const validateForm = () => {
    if (!selectedProject) {
      Alert.alert('Validation Error', 'Please select a project');
      return false;
    }
    if (!selectedEmployee) {
      Alert.alert('Validation Error', 'Please select an employee');
      return false;
    }
    if (!startTime) {
      Alert.alert('Validation Error', 'Please enter start time');
      return false;
    }
    if (!endTime) {
      Alert.alert('Validation Error', 'Please enter end time');
      return false;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      Alert.alert('Validation Error', 'End time must be after start time');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        projectId: selectedProject!,
        employeeId: selectedEmployee!,
        startTime: startTime,
        endTime: endTime,
        description: description.trim() || undefined
      };
      
      await createTimeEntry(payload);
      
      Alert.alert('Success', 'Time entry created successfully!', [
        { text: 'OK', onPress: resetForm }
      ]);
    } catch (error) {
      console.error('Error creating time entry:', error);
      Alert.alert('Error', 'Failed to create time entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProject(null);
    setSelectedEmployee(null);
    setStartTime('');
    setEndTime('');
    setDescription('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  const ProjectCard = ({ project }: { project: any }) => (
    <TouchableOpacity
      style={[
        styles.selectionCard,
        selectedProject === project.id && styles.selectedCard
      ]}
      onPress={() => setSelectedProject(project.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.clientName}>{project.client_name}</Text>
        {project.description && (
          <Text style={styles.description} numberOfLines={2}>
            {project.description}
          </Text>
        )}
      </View>
      {selectedProject === project.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmployeeCard = ({ employee }: { employee: any }) => (
    <TouchableOpacity
      style={[
        styles.selectionCard,
        selectedEmployee === employee.id && styles.selectedCard
      ]}
      onPress={() => setSelectedEmployee(employee.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.employeeName}>
          {employee.first_name} {employee.last_name}
        </Text>
        {/* Hide raw employee IDs */}
        {employee.department && (
          <Text style={styles.department}>{employee.department}</Text>
        )}
      </View>
      {selectedEmployee === employee.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Manual Time Entry</Text>
        <Text style={styles.subtitle}>Log time worked on projects</Text>
      </View>

      {/* Project Selection */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Select Project</Text>
        <Text style={styles.sectionSubtitle}>Choose the project to log time for</Text>
        {projects.length === 0 ? (
          <Text style={styles.emptyText}>No active projects available</Text>
        ) : (
          <View style={styles.selectionGrid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </View>
        )}
      </Card>

      {/* Employee Selection */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Select Employee</Text>
        <Text style={styles.sectionSubtitle}>Choose the employee who worked</Text>
        {employees.length === 0 ? (
          <Text style={styles.emptyText}>No employees available</Text>
        ) : (
          <View style={styles.selectionGrid}>
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </View>
        )}
      </Card>

      {/* Time Inputs */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Time Details</Text>
        <Text style={styles.sectionSubtitle}>Enter start and end times</Text>
        
        <View style={styles.timeRow}>
          <View style={styles.timeInputContainer}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TextInput
              style={styles.timeInput}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setCurrentTime('start')}
            >
              <Text style={styles.timeButtonText}>Now</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.timeInputContainer}>
            <Text style={styles.inputLabel}>End Time</Text>
            <TextInput
              style={styles.timeInput}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setCurrentTime('end')}
            >
              <Text style={styles.timeButtonText}>Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Description */}
      <Card style={styles.section}>
        <View style={styles.labelRow}>
          <View>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <Text style={styles.sectionSubtitle}>Add details about the work performed</Text>
          </View>
          <VoiceToTextButton
            onResult={(text) => setDescription(prev => prev ? `${prev} ${text}` : text)}
            size="small"
          />
        </View>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the work performed..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title={submitting ? "Creating Entry..." : "Create Time Entry"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectionGrid: {
    gap: 12,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  cardContent: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  clientName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 14,
    color: '#666',
  },
  department: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    minHeight: 80,
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
