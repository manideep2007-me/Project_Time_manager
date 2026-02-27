import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import Input from '../../components/shared/Input';

const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const CATEGORIES = ['Individual', 'Company', 'Government', 'Non-Profit', 'Freelancer'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Singapore', 'UAE'];
const STATES: Record<string, string[]> = {
  'India': ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Delhi', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar'],
  'United States': ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'Michigan', 'Washington'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
  'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
  'Germany': ['Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'Saxony'],
  'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Occitanie'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Fukuoka'],
  'Singapore': ['Singapore'],
  'UAE': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman'],
};

// Picker Component styled to match Input
interface PickerInputProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

function PickerInput({
  label,
  selectedValue,
  onValueChange,
  children,
}: PickerInputProps) {
  return (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(v: string) => onValueChange(v)}
          style={styles.picker}
        >
          <Picker.Item label={label} value="" color="#999" />
          {children}
        </Picker>
      </View>
    </View>
  );
}

export default function AddClientScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingClient = route.params?.client;
  const isEditing = !!editingClient;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    salutation: '',
    firstName: '',
    lastName: '',
    gst: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
  });
  const [clientId, setClientId] = useState<string | null>(null);
  const [addedProjects, setAddedProjects] = useState<any[]>([]);

  // Pre-fill form when editing an existing client
  useEffect(() => {
    if (editingClient) {
      const name = editingClient.name || '';
      const nameParts = name.split(' ');
      // Try to parse address into components
      const fullAddress = editingClient.address || '';
      const addressParts = fullAddress.split(' ');
      
      setFormData({
        companyName: editingClient.company_name || name || '',
        salutation: editingClient.salutation || '',
        firstName: editingClient.first_name || nameParts[0] || '',
        lastName: editingClient.last_name || nameParts.slice(1).join(' ') || '',
        gst: editingClient.gst_number || editingClient.gst || '',
        category: editingClient.category || editingClient.client_type || '',
        email: editingClient.email || '',
        phone: editingClient.phone || '',
        address: editingClient.address || '',
        country: editingClient.country || '',
        state: editingClient.state || '',
        city: editingClient.city || editingClient.location || '',
        zipCode: editingClient.zip_code || editingClient.zipCode || '',
      });
      setClientId(editingClient.id);
    }
  }, [editingClient]);

  // Reload projects when returning from Add Project screen
  useFocusEffect(
    React.useCallback(() => {
      if (clientId) {
        loadClientProjects();
      }
    }, [clientId])
  );

  const loadClientProjects = async () => {
    if (!clientId) return;
    
    try {
      // Prefer the dedicated endpoint
      try {
        const res = await api.get(`/api/clients/${clientId}/projects`, { params: { page: 1, limit: 100 } });
        const projects = res.data?.projects || [];
        setAddedProjects(projects);
        return;
      } catch (e) {
        // Fallback to generic endpoint with correct param name
        const fallback = await api.get('/api/projects', { params: { page: 1, limit: 100, clientId } });
        const projects = fallback.data?.projects || [];
        setAddedProjects(projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    // Company Name - Required
    if (!formData.companyName.trim()) {
      Alert.alert('Validation Error', 'Company name is required');
      return false;
    }

    // First Name - Required
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    
    // Last Name - Required
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    
    // Phone - Required
    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    
    // Email - Optional but validate format if provided
    if (formData.email.trim()) {
      if (!formData.email.includes('@') || !formData.email.includes('.')) {
        Alert.alert('Validation Error', 'Please enter a valid email address');
        return false;
      }
    }
    
    // Address - Required
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return false;
    }

    // Country - Required
    if (!formData.country.trim()) {
      Alert.alert('Validation Error', 'Country is required');
      return false;
    }

    // State - Required
    if (!formData.state.trim()) {
      Alert.alert('Validation Error', 'State is required');
      return false;
    }

    // City - Required
    if (!formData.city.trim()) {
      Alert.alert('Validation Error', 'City is required');
      return false;
    }

    // Zip Code - Required
    if (!formData.zipCode.trim()) {
      Alert.alert('Validation Error', 'Zip code is required');
      return false;
    }
    
    // GST Number - Optional but validate format if provided
    if (formData.gst.trim()) {
      const gst = formData.gst.trim();
      if (gst.length !== 15) {
        Alert.alert('Validation Error', 'GST number must be exactly 15 characters');
        return false;
      }
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gst)) {
        Alert.alert('Validation Error', 'Invalid GST number format.\n\nFormat: State Code(2) + PAN(10) + Entity(1) + Z + Checksum(1)\n\nExample: 27ABCDE1234F1Z5');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('Creating new client:', formData);
      const payload = {
        companyName: formData.companyName.trim(),
        salutation: formData.salutation.trim() || null,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gstNumber: formData.gst.trim() || null,
        category: formData.category.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        zipCode: formData.zipCode.trim(),
      } as any;

      let savedClientId = clientId;
      if (clientId) {
        // Update existing client (created earlier via Add Projects)
        const res = await api.put(`/api/clients/${clientId}`, payload);
        console.log('Client updated successfully:', res.data);
        savedClientId = res.data?.client?.id || clientId;
      } else {
        // Create new client now
        const res = await api.post('/api/clients', payload);
        console.log('Client created successfully:', res.data);
        savedClientId = res.data?.client?.id;
        setClientId(savedClientId);
      }
      
      Alert.alert(
        'Success',
        clientId ? 'Client updated successfully!' : 'Client added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to clients screen
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating client:', error);
      
      let errorMessage = 'Failed to add client. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'A client with this email already exists.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.companyName || formData.firstName || formData.lastName || formData.email || formData.phone || formData.address || formData.city || formData.zipCode) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#101010" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Client' : 'Add Client'}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Form Card Container */}
        <View style={styles.formCard}>
          {/* Company Name */}
          <Input
            label="Company name*"
            placeholder="Company name*"
            value={formData.companyName}
            onChangeText={(value) => handleInputChange('companyName', value)}
            autoCapitalize="words"
          />

          {/* Salutation */}
          <PickerInput
            label="Salutation"
            selectedValue={formData.salutation}
            onValueChange={(v) => handleInputChange('salutation', v)}
          >
            {SALUTATIONS.map((sal) => (
              <Picker.Item key={sal} label={sal} value={sal} />
            ))}
          </PickerInput>

          {/* First Name */}
          <Input
            label="First Name*"
            placeholder="First Name*"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            autoCapitalize="words"
          />

          {/* Last Name */}
          <Input
            label="Last Name*"
            placeholder="Last Name*"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            autoCapitalize="words"
          />

          {/* GST Number */}
          <Input
            label="GST Number (e.g. 27ABCDE1234F1Z5)"
            placeholder="GST Number (e.g. 27ABCDE1234F1Z5)"
            value={formData.gst}
            onChangeText={(value) => handleInputChange('gst', value.toUpperCase())}
            autoCapitalize="characters"
          />

          {/* Category */}
          <PickerInput
            label="Category"
            selectedValue={formData.category}
            onValueChange={(v) => handleInputChange('category', v)}
          >
            {CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </PickerInput>

          {/* Phone Number */}
          <Input
            label="Phone number*"
            placeholder="Phone number*"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />

          {/* Email ID */}
          <Input
            label="Email ID"
            placeholder="Email ID"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Address */}
          <Input
            label="Address*"
            placeholder="Address*"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />

          {/* Country */}
          <PickerInput
            label="Country*"
            selectedValue={formData.country}
            onValueChange={(v) => {
              handleInputChange('country', v);
              handleInputChange('state', '');
            }}
          >
            {COUNTRIES.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </PickerInput>

          {/* State */}
          <PickerInput
            label="State*"
            selectedValue={formData.state}
            onValueChange={(v) => handleInputChange('state', v)}
          >
            {(STATES[formData.country] || []).map((s) => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </PickerInput>

          {/* City */}
          <Input
            label="City*"
            placeholder="City*"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            autoCapitalize="words"
          />

          {/* Zip Code */}
          <Input
            label="Zip Code*"
            placeholder="Zip Code*"
            value={formData.zipCode}
            onChangeText={(value) => handleInputChange('zipCode', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Add Projects Section */}
        <View style={styles.addProjectsContainer}>
          <View style={styles.addProjectsHeader}>
            <Text style={styles.addProjectsTitle}>Projects</Text>
            <TouchableOpacity
              style={styles.addProjectsButton}
              onPress={async () => {
                try {
                  // Ensure all required client fields entered first
                  if (!validateForm()) return;

                  let currentClientId = clientId;
                  if (!currentClientId) {
                    setLoading(true);
                    const res = await api.post('/api/clients', {
                      companyName: formData.companyName.trim(),
                      salutation: formData.salutation.trim() || null,
                      firstName: formData.firstName.trim(),
                      lastName: formData.lastName.trim(),
                      gstNumber: formData.gst.trim() || null,
                      category: formData.category.trim() || null,
                      email: formData.email.trim() || null,
                      phone: formData.phone.trim(),
                      address: formData.address.trim(),
                      country: formData.country.trim(),
                      state: formData.state.trim(),
                      city: formData.city.trim(),
                      zipCode: formData.zipCode.trim(),
                    });
                    currentClientId = res.data?.client?.id;
                    setClientId(currentClientId);
                  }

                  const clientName = `${formData.firstName} ${formData.lastName}`.trim();
                  navigation.navigate('AddProject', {
                    clientId: currentClientId,
                    clientName,
                    onProjectAdded: (project: any) => {
                      setAddedProjects(prev => [...prev, project]);
                    },
                  });
                } catch (error: any) {
                  let errorMessage = 'Failed to add client before creating projects.';
                  if (error.response?.status === 409) {
                    errorMessage = 'A client with this email already exists.';
                  } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                  }
                  Alert.alert('Error', errorMessage);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.addProjectsButtonText}>➕ Add Projects</Text>
            </TouchableOpacity>
          </View>

          {/* Display Added Projects */}
          {addedProjects.length > 0 && (
            <View style={styles.projectsList}>
              {addedProjects.map((project, index) => (
                <View key={index} style={styles.projectCard}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectDetails}>
                    Budget: ${project.budget?.toLocaleString() || 'N/A'}
                  </Text>
                  {project.description && (
                    <Text style={styles.projectDescription} numberOfLines={2}>
                      {project.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditing ? 'Update Client' : 'Save Client'}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

  const styles = StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: '#F0F0F0',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 24,
    flexGrow: 1,
  },
  formCard: {
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
  },
  addProjectsContainer: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  addProjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addProjectsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1a1a1a',
  },
  addProjectsButton: {
    backgroundColor: '#877ED2',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A098DC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  addProjectsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  projectDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#877ED2',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#A098DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
