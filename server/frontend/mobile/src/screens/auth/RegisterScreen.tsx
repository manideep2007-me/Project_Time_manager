import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal, FlatList, TextInputProps, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { register as registerApi } from '../../api/endpoints';
import Button from '../../components/shared/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_PURPLE = '#877ED2';
const TEXT_DARK = '#333333';

// Floating Label Input Component
interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  required?: boolean;
}

function FloatingLabelInput({ label, required, style, ...rest }: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const displayLabel = required ? `${label}*` : label;

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <Text style={[styles.floatingLabel, styles.floatingLabelActive]}>
          {displayLabel}
        </Text>
      )}
      <TextInput
        {...rest}
        placeholder={showFloatingLabel ? '' : displayLabel}
        placeholderTextColor="#999"
        style={[
          styles.floatingInput,
          showFloatingLabel && styles.floatingInputWithLabel,
          isFocused && styles.floatingInputFocused,
          style,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          rest.onFocus && rest.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          rest.onBlur && rest.onBlur(e);
        }}
      />
    </View>
  );
}

// Floating Label Phone Input Component
interface FloatingLabelPhoneInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  phoneCode: string;
  onPhoneCodePress: () => void;
}

function FloatingLabelPhoneInput({ label, required, phoneCode, onPhoneCodePress, style, ...rest }: FloatingLabelPhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const displayLabel = required ? `${label}*` : label;

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <Text style={[styles.floatingLabel, styles.floatingLabelActive]}>
          {displayLabel}
        </Text>
      )}
      <View style={[
        styles.floatingPhoneWrapper,
        isFocused && styles.floatingInputFocused,
      ]}>
        <TouchableOpacity style={styles.floatingCountryCodeContainer} onPress={onPhoneCodePress}>
          <Text style={styles.floatingCountryCode}>{phoneCode}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <View style={styles.floatingPhoneDivider} />
        <TextInput
          {...rest}
          placeholder={showFloatingLabel ? '' : displayLabel}
          placeholderTextColor="#999"
          style={[
            styles.floatingPhoneInput,
            showFloatingLabel && styles.floatingPhoneInputWithLabel,
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus && rest.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur && rest.onBlur(e);
          }}
        />
      </View>
    </View>
  );
}

// Floating Label Dropdown Component
interface FloatingLabelDropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  required?: boolean;
}

function FloatingLabelDropdown({ label, value, options, onSelect, required }: FloatingLabelDropdownProps) {
  const [visible, setVisible] = useState(false);
  const hasValue = value && value.trim().length > 0;
  const displayLabel = required ? `${label}*` : label;

  return (
    <>
      <View style={styles.floatingContainer}>
        {hasValue && (
          <Text style={[styles.floatingLabel, styles.floatingLabelActive]}>
            {displayLabel}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.floatingDropdown, hasValue && styles.floatingDropdownWithLabel]}
          onPress={() => setVisible(true)}
        >
          <Text style={[styles.floatingDropdownText, !hasValue && styles.floatingDropdownPlaceholder]}>
            {value || displayLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, value === item && styles.modalOptionSelected]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, value === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {value === item && <Ionicons name="checkmark" size={20} color={PRIMARY_PURPLE} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Floating Label Date Input Component
interface FloatingLabelDateInputProps {
  label: string;
  value: Date | null;
  onPress: () => void;
  required?: boolean;
}

function FloatingLabelDateInput({ label, value, onPress, required }: FloatingLabelDateInputProps) {
  const hasValue = !!value;
  const displayLabel = required ? `${label}*` : label;

  return (
    <View style={styles.floatingContainer}>
      {hasValue && (
        <Text style={[styles.floatingLabel, styles.floatingLabelActive]}>
          {displayLabel}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.floatingDateInput, hasValue && styles.floatingDateInputWithLabel]}
        onPress={onPress}
      >
        <Text style={[styles.floatingDateText, !hasValue && styles.floatingDropdownPlaceholder]}>
          {value ? value.toLocaleDateString('en-GB') : displayLabel}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={PRIMARY_PURPLE} />
      </TouchableOpacity>
    </View>
  );
}

// Dropdown data
const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];

interface Country {
  country_id: string;
  name: string;
  code: string;
}

interface State {
  state_id: string;
  name: string;
  country_id: string;
}

interface Designation {
  designation_id: string;
  name: string;
  description: string;
}

const PHONE_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+65', country: 'Singapore' },
  { code: '+971', country: 'UAE' },
  { code: '+81', country: 'Japan' },
];

export default function RegisterScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const organizationCode = route?.params?.organizationCode;
  const organizationName = route?.params?.organizationName;

  const [loading, setLoading] = useState(false);

  // Countries and States from API
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);

  // Designations from API
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(true);

  // Personal & Contact
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDob, setShowDob] = useState(false);
  const [skill, setSkill] = useState('');
  const [skillId, setSkillId] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [showPhoneCodePicker, setShowPhoneCodePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [countryId, setCountryId] = useState('');
  const [state, setState] = useState('');
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Attachments
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFileUri, setAadhaarFileUri] = useState<string | null>(null);

  // Payments
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [showJoiningDate, setShowJoiningDate] = useState(false);
  const [employeeType, setEmployeeType] = useState<'Full Time' | 'Temporary' | 'Contract'>('Full Time');
  const [payCalculation, setPayCalculation] = useState<'Monthly' | 'Daily' | 'Hourly rate'>('Monthly');
  const [amount, setAmount] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      if (!organizationCode) return;
      try {
        setLoadingCountries(true);
        const response = await api.get('/api/auth/registration-data/countries', { params: { orgCode: organizationCode } });
        setCountries(response.data?.countries || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, [organizationCode]);

  // Fetch designations on mount
  useEffect(() => {
    const fetchDesignations = async () => {
      if (!organizationCode) return;
      try {
        setLoadingDesignations(true);
        const response = await api.get('/api/auth/registration-data/designations', { params: { orgCode: organizationCode } });
        setDesignations(response.data?.designations || []);
      } catch (error) {
        console.error('Error fetching designations:', error);
        setDesignations([]);
      } finally {
        setLoadingDesignations(false);
      }
    };
    fetchDesignations();
  }, [organizationCode]);

  // Fetch states when country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!countryId) {
        setStates([]);
        setState('');
        setStateId('');
        return;
      }
      try {
        setLoadingStates(true);
        const response = await api.get(`/api/auth/registration-data/countries/${countryId}/states`, { params: { orgCode: organizationCode } });
        setStates(response.data?.states || []);
      } catch (error) {
        console.error('Error fetching states:', error);
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, [countryId]);

  const handleCountrySelect = (countryName: string) => {
    setCountry(countryName);
    const selectedCountry = countries.find(c => c.name === countryName);
    setCountryId(selectedCountry?.country_id || '');
    setState('');
    setStateId('');
  };

  const handleStateSelect = (stateName: string) => {
    setState(stateName);
    const selectedState = states.find(s => s.name === stateName);
    setStateId(selectedState?.state_id || '');
  };

  const handleSkillSelect = (designationName: string) => {
    setSkill(designationName);
    const selectedDesignation = designations.find(d => d.name === designationName);
    setSkillId(selectedDesignation?.designation_id || '');
  };

  const validate = () => {
    const errors: string[] = [];
    if (!salutation) errors.push('Salutation');
    if (!firstName.trim()) errors.push('First Name');
    if (!lastName.trim()) errors.push('Last Name');
    if (!email.trim()) errors.push('Email');
    else if (!/\S+@\S+\.\S+/.test(email)) errors.push('Valid Email');
    if (!password) errors.push('Password');
    else if (password.length < 6) errors.push('Password (min 6 characters)');
    if (password !== confirmPassword) errors.push('Passwords must match');
    if (!skill) errors.push('Designation');
    if (!phone.trim()) errors.push('Phone Number');
    if (!address.trim()) errors.push('Address');
    if (!country) errors.push('Country');
    if (!state) errors.push('State');
    if (!city.trim()) errors.push('City');
    if (!zipCode.trim()) errors.push('Zip Code');
    if (!aadhaarNumber.trim()) errors.push('Aadhaar Number');
    if (!joiningDate) errors.push('Joining Date');
    if (!amount.trim()) errors.push('Amount');
    if (!overtimeRate.trim()) errors.push('Over Time rates');
    if (errors.length) {
      Alert.alert('Validation Error', `Please provide:\n\n• ${errors.join('\n• ')}`);
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await registerApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: `${phoneCode} ${phone.trim()}`,
        password: password,
        organizationCode: organizationCode,
        role: 'employee',
        salutation: salutation,
        dateOfBirth: dob ? dob.toISOString().split('T')[0] : undefined,
        designationId: skillId || undefined,
        address: address.trim(),
        countryId: countryId || undefined,
        stateId: stateId || undefined,
        city: city.trim(),
        zipCode: zipCode.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        joiningDate: joiningDate ? joiningDate.toISOString().split('T')[0] : undefined,
        employmentType: employeeType,
        salaryType: payCalculation === 'Hourly rate' ? 'hourly' : payCalculation.toLowerCase(),
        salaryAmount: Number(amount) || 0,
        overtimeRate: Number(overtimeRate) || 0,
      });

      // If the registration is pending admin approval (no user/token returned)
      if (result.pending) {
        Alert.alert(
          'Request Submitted',
          `Your registration request has been sent to the admin of ${result.organizationName || 'the organization'}. You will be able to login once the admin approves your request.`,
          [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
        );
        return;
      }

      // If photo was selected, upload it
      const newUserId = result.user?.id;
      if (newUserId && photoUri) {
        try {
          const formData = new FormData();
          const filename = photoUri.split('/').pop() || `employee-${newUserId}.jpg`;
          const file: any = { uri: photoUri, name: filename, type: 'image/jpeg' };
          formData.append('photo', file);
          await api.post(`/api/employees/${newUserId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${result.token}` },
          });
        } catch (photoErr) {
          console.error('Photo upload failed (non-blocking):', photoErr);
        }
      }

      // If aadhaar image was selected, upload it
      if (newUserId && aadhaarFileUri) {
        try {
          const formData = new FormData();
          const filename = aadhaarFileUri.split('/').pop() || `aadhaar-${newUserId}.jpg`;
          const file: any = { uri: aadhaarFileUri, name: filename, type: 'image/jpeg' };
          formData.append('aadhaar', file);
          await api.post(`/api/employees/${newUserId}/aadhaar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${result.token}` },
          });
        } catch (aadhaarErr) {
          console.error('Aadhaar upload failed (non-blocking):', aadhaarErr);
        }
      }

      Alert.alert(
        'Success',
        'Account created successfully! Please login with your credentials.',
        [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
      );
    } catch (e: any) {
      console.error('Registration error:', e);
      const errorMessage = e.response?.data?.error || e.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) setPhotoUri(result.assets[0].uri);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) setPhotoUri(result.assets[0].uri);
    }
  };

  const pickAadhaarImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) setAadhaarFileUri(result.assets[0].uri);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) setAadhaarFileUri(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Purple Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Account</Text>
            {organizationName && (
              <Text style={styles.orgText}>Joining: {organizationName}</Text>
            )}
          </View>
        </View>

        {/* Account Credentials */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Credentials</Text>

          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
          />

          <FloatingLabelInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            required
          />
        </View>

        {/* Personal & Contact Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal & Contact Information</Text>

          <FloatingLabelDropdown
            label="Salutation"
            value={salutation}
            options={SALUTATIONS}
            onSelect={setSalutation}
            required
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <FloatingLabelInput
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                required
              />
            </View>
            <View style={styles.halfInput}>
              <FloatingLabelInput
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                required
              />
            </View>
          </View>

          <FloatingLabelDateInput
            label="Date of birth"
            value={dob}
            onPress={() => setShowDob(true)}
          />

          {loadingDesignations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PRIMARY_PURPLE} />
              <Text style={styles.loadingText}>Loading designations...</Text>
            </View>
          ) : (
            <FloatingLabelDropdown
              label="Designation"
              value={skill}
              options={designations.map(d => d.name)}
              onSelect={handleSkillSelect}
              required
            />
          )}

          <FloatingLabelPhoneInput
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            phoneCode={phoneCode}
            onPhoneCodePress={() => setShowPhoneCodePicker(true)}
            required
          />

          <FloatingLabelInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            style={styles.addressInput}
            required
          />

          {loadingCountries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PRIMARY_PURPLE} />
              <Text style={styles.loadingText}>Loading countries...</Text>
            </View>
          ) : (
            <FloatingLabelDropdown
              label="Country"
              value={country}
              options={countries.map(c => c.name)}
              onSelect={handleCountrySelect}
              required
            />
          )}

          {loadingStates ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PRIMARY_PURPLE} />
              <Text style={styles.loadingText}>Loading states...</Text>
            </View>
          ) : (
            <FloatingLabelDropdown
              label="State"
              value={state}
              options={states.map(s => s.name)}
              onSelect={handleStateSelect}
              required
            />
          )}

          <FloatingLabelInput
            label="City"
            value={city}
            onChangeText={setCity}
            required
          />

          <FloatingLabelInput
            label="Zip Code"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
            required
          />

          {/* Upload Photograph */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Upload your photograph</Text>
            <Text style={styles.uploadHint}>png, jpg, Gif up to 2MB</Text>

            {photoUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <View style={styles.addFilesContainer}>
                  <Text style={styles.addFilesText}>Add files</Text>
                  <TouchableOpacity style={styles.attachButton} onPress={() => pickImage(false)}>
                    <Text style={styles.attachButtonText}>Attach</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cameraButton} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Attachments Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Attachments</Text>

          <FloatingLabelInput
            label="Aadhaar number"
            value={aadhaarNumber}
            onChangeText={setAadhaarNumber}
            keyboardType="numeric"
            maxLength={12}
            required
          />

          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Upload Aadhaar Card</Text>
            <Text style={styles.uploadHint}>png, jpg, Gif up to 2MB</Text>

            {aadhaarFileUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: aadhaarFileUri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setAadhaarFileUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <View style={styles.addFilesContainer}>
                  <Text style={styles.addFilesText}>Add files</Text>
                  <TouchableOpacity style={styles.attachButton} onPress={() => pickAadhaarImage(false)}>
                    <Text style={styles.attachButtonText}>Attach</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cameraButton} onPress={() => pickAadhaarImage(true)}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Payments Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payments</Text>

          <FloatingLabelDateInput
            label="Joining Date"
            value={joiningDate}
            onPress={() => setShowJoiningDate(true)}
            required
          />

          <Text style={styles.fieldLabel}>Employee Type</Text>
          <View style={styles.pillsRow}>
            {(['Full Time', 'Temporary', 'Contract'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pill, employeeType === type && styles.pillSelected]}
                onPress={() => setEmployeeType(type)}
              >
                <Text style={[styles.pillText, employeeType === type && styles.pillTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Pay Calculation</Text>
          <View style={styles.pillsRow}>
            {(['Monthly', 'Daily', 'Hourly rate'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pill, payCalculation === type && styles.pillSelected]}
                onPress={() => setPayCalculation(type)}
              >
                <Text style={[styles.pillText, payCalculation === type && styles.pillTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FloatingLabelInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            required
          />

          <FloatingLabelInput
            label="Over Time rates"
            value={overtimeRate}
            onChangeText={setOvertimeRate}
            keyboardType="numeric"
            required
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t('auth.already_have_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>{t('auth.sign_in')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker for DOB */}
      {showDob && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDob(false);
            if (d) setDob(d);
          }}
        />
      )}

      {/* Date Picker for Joining Date */}
      {showJoiningDate && (
        <DateTimePicker
          value={joiningDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowJoiningDate(false);
            if (d) setJoiningDate(d);
          }}
        />
      )}

      {/* Phone Code Picker Modal */}
      <Modal visible={showPhoneCodePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPhoneCodePicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setShowPhoneCodePicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PHONE_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, phoneCode === item.code && styles.modalOptionSelected]}
                  onPress={() => {
                    setPhoneCode(item.code);
                    setShowPhoneCodePicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, phoneCode === item.code && styles.modalOptionTextSelected]}>
                    {item.code} ({item.country})
                  </Text>
                  {phoneCode === item.code && <Ionicons name="checkmark" size={20} color={PRIMARY_PURPLE} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  header: {
    backgroundColor: PRIMARY_PURPLE,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 4,
    marginBottom: 8,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orgText: {
    fontSize: 14,
    color: '#E8E6F0',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  // Floating Label Input Styles
  floatingContainer: {
    position: 'relative',
    paddingTop: 4,
    marginBottom: 12,
  },
  floatingLabel: {
    position: 'absolute',
    left: 12,
    top: 14,
    fontSize: 14,
    color: '#9CA3AF',
    zIndex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  floatingLabelActive: {
    top: -6,
    fontSize: 11,
    color: PRIMARY_PURPLE,
  },
  floatingInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: TEXT_DARK,
    minHeight: 50,
  },
  floatingInputWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  floatingInputFocused: {
    borderColor: PRIMARY_PURPLE,
  },
  // Phone Input
  floatingPhoneWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 50,
  },
  floatingCountryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F8F9FA',
  },
  floatingCountryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  floatingPhoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5EA',
  },
  floatingPhoneInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  floatingPhoneInputWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  // Dropdown
  floatingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    minHeight: 50,
  },
  floatingDropdownWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  floatingDropdownText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  floatingDropdownPlaceholder: {
    color: '#999',
  },
  // Date Input
  floatingDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    minHeight: 50,
  },
  floatingDateInputWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  floatingDateText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  // Layout
  addressInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  // Upload
  uploadSection: {
    marginTop: 8,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addFilesContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  addFilesText: {
    fontSize: 14,
    color: '#999',
  },
  attachButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButtonText: {
    fontSize: 14,
    color: PRIMARY_PURPLE,
    fontWeight: '500',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: PRIMARY_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  // Payments
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  pillSelected: {
    backgroundColor: PRIMARY_PURPLE,
    borderColor: PRIMARY_PURPLE,
  },
  pillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#fff',
  },
  // Save Button
  saveButton: {
    backgroundColor: PRIMARY_PURPLE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B8B5C4',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Login link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  loginLink: {
    fontSize: 16,
    color: PRIMARY_PURPLE,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalOptionSelected: {
    backgroundColor: '#F8F7FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: PRIMARY_PURPLE,
    fontWeight: '500',
  },
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});
