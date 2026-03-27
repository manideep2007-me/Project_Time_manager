import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, FlatList, TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';

// Theme colors
const PRIMARY_PURPLE = '#6C5CE7';
const TEXT_DARK = '#333333';

/** Same spirit as express-validator isEmail — enough for client-side checks before API */
function isValidEmailFormat(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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
                  {value === item && <Ionicons name="checkmark" size={20} color="#6C5CE7" />}
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

// Route params type for pending registration approval and edit mode
interface PendingRegistrationData {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  gender?: string;
  age?: number;
}

interface EditEmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  salary?: number;
  overtimeRate?: number;
  address?: string;
  employmentType?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  aadhaarNumber?: string;
  payCalculation?: string;
  isActive?: boolean;
  photoUrl?: string;
}

type AddEmployeeRouteParams = {
  AddEmployee: {
    pendingRegistration?: PendingRegistrationData;
    editEmployee?: EditEmployeeData;
  };
};

// Country and State types
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

const ADD_EMPLOYEE_DRAFT_KEY = 'add_employee_form_draft_v1';

export default function AddEmployeeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AddEmployeeRouteParams, 'AddEmployee'>>();
  
  // Check if this is a pending registration approval or edit mode
  const pendingRegistration = route.params?.pendingRegistration;
  const editEmployee = route.params?.editEmployee;
  const isApprovalMode = !!pendingRegistration;
  const isEditMode = !!editEmployee;

  const [saving, setSaving] = useState(false);
  const [loadingEditDetails, setLoadingEditDetails] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Countries and States from API
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);

  // Designations from API
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(true);

  // Personal & Contact Information
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

  // Pre-fill form with pending registration data
  useEffect(() => {
    if (pendingRegistration) {
      setFirstName(pendingRegistration.first_name || '');
      setLastName(pendingRegistration.last_name || '');
      setEmail(pendingRegistration.email || '');
      
      // Parse phone number - handle formats like "+91 9876543210" or "9876543210"
      const phoneStr = pendingRegistration.phone || '';
      const phoneMatch = phoneStr.match(/^(\+\d{1,4})\s*(.*)$/);
      if (phoneMatch) {
        setPhoneCode(phoneMatch[1]);
        setPhone(phoneMatch[2]);
      } else {
        setPhone(phoneStr);
      }
      
      // Set salutation based on gender if available
      if (pendingRegistration.gender) {
        const gender = pendingRegistration.gender.toLowerCase();
        if (gender === 'male') setSalutation('Mr.');
        else if (gender === 'female') setSalutation('Ms.');
      }
      
      // Calculate DOB from age if provided
      if (pendingRegistration.age && pendingRegistration.age > 0) {
        const birthYear = new Date().getFullYear() - pendingRegistration.age;
        setDob(new Date(birthYear, 0, 1));
      }
    }
  }, [pendingRegistration]);

  const applyEditDataToForm = (data: any) => {
    setFirstName(data?.first_name || data?.firstName || '');
    setLastName(data?.last_name || data?.lastName || '');
    setEmail(data?.email || '');

    const phoneStr = data?.phone || '';
    const phoneMatch = String(phoneStr).match(/^(\+\d{1,4})\s*(.*)$/);
    if (phoneMatch) {
      setPhoneCode(phoneMatch[1]);
      setPhone(phoneMatch[2]);
    } else {
      setPhone(String(phoneStr || ''));
    }

    if (data?.designation) {
      setSkill(String(data.designation));
    }
    if (data?.designation_id) {
      setSkillId(String(data.designation_id));
    }

    setAddress(data?.address || '');
    setAadhaarNumber(data?.aadhar_number || data?.aadhaarNumber || '');

    if (data?.date_of_birth || data?.dateOfBirth) {
      const parsed = new Date(data.date_of_birth || data.dateOfBirth);
      if (!Number.isNaN(parsed.getTime())) setDob(parsed);
    }

    if (data?.joining_date || data?.joiningDate) {
      const parsed = new Date(data.joining_date || data.joiningDate);
      if (!Number.isNaN(parsed.getTime())) setJoiningDate(parsed);
    }

    const empType = data?.employment_type || data?.employmentType;
    if (empType === 'Full Time' || empType === 'Temporary' || empType === 'Contract') {
      setEmployeeType(empType);
    }

    const salaryValue = data?.salary ?? data?.salaryAmount;
    if (salaryValue !== undefined && salaryValue !== null) {
      setAmount(String(salaryValue));
    }

    const overtimeValue = data?.overtime_rate ?? data?.overtimeRate;
    if (overtimeValue !== undefined && overtimeValue !== null) {
      setOvertimeRate(String(overtimeValue));
    }

    const payCalc = data?.pay_calculation || data?.payCalculation || data?.salary_type;
    if (payCalc === 'monthly' || payCalc === 'Monthly') {
      setPayCalculation('Monthly');
    } else if (payCalc === 'daily' || payCalc === 'Daily') {
      setPayCalculation('Daily');
    } else if (payCalc === 'hourly' || payCalc === 'Hourly rate') {
      setPayCalculation('Hourly rate');
    }

    setSalutation(data?.salutation || '');
    setCountry(data?.country || '');
    setCountryId(data?.country_id || '');
    setState(data?.location || data?.state || '');
    setStateId(data?.state_id || '');

    if (data?.photo_url || data?.photoUrl) {
      setPhotoUri(data.photo_url || data.photoUrl);
    }
    if (data?.aadhar_image) {
      setAadhaarFileUri(data.aadhar_image);
    }
  };

  // Pre-fill form with existing employee data for editing
  useEffect(() => {
    if (!editEmployee) return;

    // Seed immediate values (for quick render), then fetch full details.
    applyEditDataToForm(editEmployee);

    const fetchEmployeeDetails = async () => {
      try {
        setLoadingEditDetails(true);
        const res = await api.get(`/api/employees/${editEmployee.id}`);
        if (res?.data?.employee) {
          applyEditDataToForm(res.data.employee);
        }
      } catch (error) {
        console.error('Failed to fetch full employee details for edit:', error);
      } finally {
        setLoadingEditDetails(false);
      }
    };

    fetchEmployeeDetails();
  }, [editEmployee]);

  // Restore draft in create mode so accidental reloads don't wipe form.
  useEffect(() => {
    const restoreDraft = async () => {
      if (isEditMode || isApprovalMode) {
        setDraftRestored(true);
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(ADD_EMPLOYEE_DRAFT_KEY);
        if (!raw) {
          setDraftRestored(true);
          return;
        }
        const draft = JSON.parse(raw);
        if (draft.firstName) setFirstName(String(draft.firstName));
        if (draft.lastName) setLastName(String(draft.lastName));
        if (draft.email) setEmail(String(draft.email));
        if (draft.phoneCode) setPhoneCode(String(draft.phoneCode));
        if (draft.phone) setPhone(String(draft.phone));
        if (draft.salutation) setSalutation(String(draft.salutation));
        if (draft.skill) setSkill(String(draft.skill));
        if (draft.skillId) setSkillId(String(draft.skillId));
        if (draft.address) setAddress(String(draft.address));
        if (draft.country) setCountry(String(draft.country));
        if (draft.countryId) setCountryId(String(draft.countryId));
        if (draft.state) setState(String(draft.state));
        if (draft.stateId) setStateId(String(draft.stateId));
        if (draft.city) setCity(String(draft.city));
        if (draft.zipCode) setZipCode(String(draft.zipCode));
        if (draft.photoUri) setPhotoUri(String(draft.photoUri));
        if (draft.aadhaarNumber) setAadhaarNumber(String(draft.aadhaarNumber));
        if (draft.aadhaarFileUri) setAadhaarFileUri(String(draft.aadhaarFileUri));
        if (draft.joiningDate) {
          const parsed = new Date(draft.joiningDate);
          if (!Number.isNaN(parsed.getTime())) setJoiningDate(parsed);
        }
        if (draft.employeeType) setEmployeeType(draft.employeeType);
        if (draft.payCalculation) setPayCalculation(draft.payCalculation);
        if (draft.amount) setAmount(String(draft.amount));
        if (draft.overtimeRate) setOvertimeRate(String(draft.overtimeRate));
      } catch (err) {
        console.warn('Failed to restore Add Employee draft:', (err as any)?.message);
      } finally {
        setDraftRestored(true);
      }
    };
    restoreDraft();
  }, [isEditMode, isApprovalMode]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await api.get('/api/countries');
        setCountries(response.data?.countries || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to empty array - countries API might not be available
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch designations on mount
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        setLoadingDesignations(true);
        const response = await api.get('/api/designations');
        setDesignations(response.data?.designations || []);
      } catch (error) {
        console.error('Error fetching designations:', error);
        setDesignations([]);
      } finally {
        setLoadingDesignations(false);
      }
    };
    fetchDesignations();
  }, []);

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
        const response = await api.get(`/api/countries/${countryId}/states`);
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

  // Auto-save draft while typing in create mode.
  useEffect(() => {
    if (!draftRestored || isEditMode || isApprovalMode) return;
    const draftPayload = {
      salutation,
      firstName,
      lastName,
      skill,
      skillId,
      phoneCode,
      phone,
      email,
      address,
      country,
      countryId,
      state,
      stateId,
      city,
      zipCode,
      photoUri,
      aadhaarNumber,
      aadhaarFileUri,
      joiningDate: joiningDate ? joiningDate.toISOString() : null,
      employeeType,
      payCalculation,
      amount,
      overtimeRate,
    };
    const timeoutId = setTimeout(() => {
      AsyncStorage.setItem(ADD_EMPLOYEE_DRAFT_KEY, JSON.stringify(draftPayload)).catch((err) =>
        console.warn('Failed to persist Add Employee draft:', err?.message)
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [
    draftRestored,
    isEditMode,
    isApprovalMode,
    salutation,
    firstName,
    lastName,
    skill,
    skillId,
    phoneCode,
    phone,
    email,
    address,
    country,
    countryId,
    state,
    stateId,
    city,
    zipCode,
    photoUri,
    aadhaarNumber,
    aadhaarFileUri,
    joiningDate,
    employeeType,
    payCalculation,
    amount,
    overtimeRate,
  ]);

  // Handle country selection
  const handleCountrySelect = (countryName: string) => {
    setCountry(countryName);
    const selectedCountry = countries.find(c => c.name === countryName);
    setCountryId(selectedCountry?.country_id || '');
    // Reset state when country changes
    setState('');
    setStateId('');
  };

  // Handle state selection
  const handleStateSelect = (stateName: string) => {
    setState(stateName);
    const selectedState = states.find(s => s.name === stateName);
    setStateId(selectedState?.state_id || '');
  };

  // Handle designation/skill selection
  const handleSkillSelect = (designationName: string) => {
    setSkill(designationName);
    const selectedDesignation = designations.find(d => d.name === designationName);
    setSkillId(selectedDesignation?.designation_id || '');
  };

  const validate = () => {
    const errors: string[] = [];
    
    // Basic required fields for all modes
    if (!firstName.trim()) errors.push('First Name');
    if (!lastName.trim()) errors.push('Last Name');
    if (!phone.trim()) errors.push('Phone Number');
    
    // For edit mode, only require basic fields
    if (isEditMode) {
      if (email && !isValidEmailFormat(email)) errors.push('Valid Email');
      if (errors.length) {
        Alert.alert('Validation Error', `Please provide:\n\n• ${errors.join('\n• ')}`);
        return false;
      }
      return true;
    }

    // Direct add (not QR approval): email required — backend registers employees_registry for login
    if (!isApprovalMode) {
      if (!email.trim()) errors.push('Email (required for app login)');
      else if (!isValidEmailFormat(email)) errors.push('Valid email format');
    }
    
    // Full validation for new employee and approval modes
    if (!salutation) errors.push('Salutation');
    if (!skill) errors.push('Designation');
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

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);

      const payload: any = {
        salutation: salutation,
        dateOfBirth: dob ? dob.toISOString().split('T')[0] : undefined,
        designationId: skillId || undefined,
        address: address.trim(),
        countryId: countryId || undefined,
        stateId: stateId || undefined,
        aadhaarNumber: aadhaarNumber.trim(),
        joiningDate: joiningDate ? joiningDate.toISOString().split('T')[0] : undefined,
        employmentType: employeeType,
        salaryType: payCalculation === 'Hourly rate' ? 'hourly' : payCalculation.toLowerCase(),
        salaryAmount: Number(amount) || 0,  
        overtimeRate: Number(overtimeRate) || 0,
      };

      let newEmployeeId: string | undefined;
      let successMsg = '';

      if (isApprovalMode && pendingRegistration) {
        const approveRes = await api.post(`/api/pending-registrations/${pendingRegistration.id}/approve`, payload);
        newEmployeeId = approveRes.data?.employee?.id;
        successMsg = `${pendingRegistration.first_name} ${pendingRegistration.last_name} has been approved and added as an employee.`;
      } else if (isEditMode && editEmployee) {
        const updatePayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: `${phoneCode} ${phone.trim()}`,
          salutation: salutation || undefined,
          dateOfBirth: dob ? dob.toISOString().split('T')[0] : undefined,
          joiningDate: joiningDate ? joiningDate.toISOString().split('T')[0] : undefined,
          employmentType: employeeType,
          aadhaarNumber: aadhaarNumber.trim() || undefined,
          address: address.trim() || undefined,
          countryId: countryId || undefined,
          stateId: stateId || undefined,
          designationId: skillId || undefined,
          salaryType: payCalculation === 'Hourly rate' ? 'hourly' : payCalculation.toLowerCase(),
          salaryAmount: Number(amount) || 0,
          overtimeRate: Number(overtimeRate) || 0,
          isActive: true,
        };

        await api.put(`/api/employees/${editEmployee.id}`, updatePayload);
        newEmployeeId = editEmployee.id;
        successMsg = 'Employee updated successfully';
      } else {
        const employeeId = `EMP-${Date.now()}`;
        const createPayload = {
          ...payload,
          employeeId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: `${phoneCode} ${phone.trim()}`,
          city: city.trim(),
          zipCode: zipCode.trim(),
        };

        const createRes = await api.post('/api/employees', createPayload);
        newEmployeeId = createRes.data?.employee?.id;
        const tempPw = createRes.data?.tempPassword as string | undefined;
        const loginEmail = email.trim();
        successMsg = tempPw
          ? `Employee added successfully.\n\nEmail: ${loginEmail}\nTemporary Password: ${tempPw}\n\nPlease share these credentials with the employee.`
          : `Employee added successfully.\n\nEmail: ${loginEmail}\n\nPlease share the sign-in credentials with the employee.`;
      }

      // Upload photo and aadhaar BEFORE showing success
      if (newEmployeeId && photoUri) {
        try {
          const formData = new FormData();
          const filename = photoUri.split('/').pop() || `employee-${newEmployeeId}.jpg`;
          const file: any = { uri: photoUri, name: filename, type: 'image/jpeg' };
          formData.append('photo', file);
          await api.post(`/api/employees/${newEmployeeId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (photoErr: any) {
          console.warn('Photo upload failed (non-blocking):', photoErr?.message);
        }
      }

      if (newEmployeeId && aadhaarFileUri) {
        try {
          const formData = new FormData();
          const filename = aadhaarFileUri.split('/').pop() || `aadhaar-${newEmployeeId}.jpg`;
          const file: any = { uri: aadhaarFileUri, name: filename, type: 'image/jpeg' };
          formData.append('aadhaar', file);
          await api.post(`/api/employees/${newEmployeeId}/aadhaar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (aadhaarErr: any) {
          console.warn('Aadhaar upload failed (non-blocking):', aadhaarErr?.message);
        }
      }

      if (!isEditMode && !isApprovalMode) {
        await AsyncStorage.removeItem(ADD_EMPLOYEE_DRAFT_KEY);
      }
      Alert.alert('Success', successMsg, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error('Save employee failed:', e);
      let msg = isApprovalMode ? 'Failed to approve registration.' : isEditMode ? 'Failed to update employee.' : 'Failed to save employee.';
      if (e?.response?.data?.error) msg = e.response.data.error;
      if (e?.response?.data?.details?.length) {
        msg += `\n\n${e.response.data.details.map((d: any) => `• ${d.msg} (${d.path})`).join('\n')}`;
      }
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow camera access to take a photo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotoUri(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow photo library access to pick a photo.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotoUri(result.assets[0].uri);
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const pickAadhaarImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow camera access to take a photo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          // Keep this native flow simple and light; crop UI can cause restarts on some Android devices.
          allowsEditing: false,
          quality: 0.4,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const nextUri = result.assets[0]?.uri;
          if (nextUri) setAadhaarFileUri(nextUri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow photo library access to pick a photo.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          // Keep this native flow simple and light; crop UI can cause restarts on some Android devices.
          allowsEditing: false,
          quality: 0.4,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const nextUri = result.assets[0]?.uri;
          if (nextUri) setAadhaarFileUri(nextUri);
        }
      }
    } catch (error: any) {
      console.error('Aadhaar image picker error:', error);
      Alert.alert('Error', 'Failed to pick Aadhaar image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isApprovalMode ? 'Complete Employee Details' : isEditMode ? 'Edit Employee' : 'Add Employee'}
          </Text>
        </View>
      </View>

      {/* Show pre-filled info banner in approval mode */}
      {isApprovalMode && pendingRegistration && (
        <View style={styles.prefillBanner}>
          <Ionicons name="information-circle" size={20} color="#1976D2" />
          <Text style={styles.prefillBannerText}>
            Pre-filled with registration data. Complete the remaining fields.
          </Text>
        </View>
      )}

      {/* Show edit info banner in edit mode */}
      {isEditMode && editEmployee && (
        <View style={styles.prefillBanner}>
          <Ionicons name="create" size={20} color="#1976D2" />
          <Text style={styles.prefillBannerText}>
            {loadingEditDetails
              ? 'Loading complete employee details...'
              : `Editing ${firstName || editEmployee.firstName} ${lastName || editEmployee.lastName}'s details.`}
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Personal & Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal & Contact Information</Text>

          {/* Salutation */}
          <FloatingLabelDropdown
            label="Salutation"
            value={salutation}
            options={SALUTATIONS}
            onSelect={setSalutation}
            required
          />

          {/* First Name & Last Name */}
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

          {/* Date of Birth */}
          <FloatingLabelDateInput
            label="Date of birth"
            value={dob}
            onPress={() => setShowDob(true)}
          />

          {/* Designation/Skill */}
          {loadingDesignations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C5CE7" />
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

          {/* Phone Number with Country Code */}
          <FloatingLabelPhoneInput
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            phoneCode={phoneCode}
            onPhoneCodePress={() => setShowPhoneCodePicker(true)}
            required
          />

          {/* Email ID — required for direct add so backend can create employees_registry row */}
          <FloatingLabelInput
            label="Email ID"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required={!isApprovalMode}
          />

          {/* Address */}
          <FloatingLabelInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            style={styles.addressInput}
            required
          />

          {/* Country */}
          {loadingCountries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C5CE7" />
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

          {/* State */}
          {loadingStates ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C5CE7" />
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

          {/* City */}
          <FloatingLabelInput
            label="City"
            value={city}
            onChangeText={setCity}
            required
          />

          {/* Zip Code */}
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

          {/* Aadhaar Number */}
          <FloatingLabelInput
            label="Aadhaar number"
            value={aadhaarNumber}
            onChangeText={setAadhaarNumber}
            keyboardType="numeric"
            maxLength={12}
            required
          />

          {/* Add Aadhaar File */}
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

          {/* Joining Date */}
          <FloatingLabelDateInput
            label="Joining Date"
            value={joiningDate}
            onPress={() => setShowJoiningDate(true)}
            required
          />

          {/* Employee Type */}
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

          {/* Pay Calculation */}
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

          {/* Amount */}
          <FloatingLabelInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            required
          />

          {/* Over Time rates */}
          <FloatingLabelInput
            label="Over Time rates"
            value={overtimeRate}
            onChangeText={setOvertimeRate}
            keyboardType="numeric"
            required
          />
        </View>

        {/* Add Employee Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditMode ? 'Update Employee' : 'Add Employee'}</Text>
          )}
        </TouchableOpacity>

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
                  {phoneCode === item.code && <Ionicons name="checkmark" size={20} color="#6C5CE7" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  prefillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  prefillBannerText: {
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C5CE7',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
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
  // Floating Phone Input Styles
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
  // Floating Dropdown Styles
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
  // Floating Date Input Styles
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
  // Other Styles
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
    borderColor: '#6C5CE7',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButtonText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#6C5CE7',
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
  // Payments styles
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
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  pillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    marginHorizontal: 16,
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
  // Modal styles
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
    color: '#6C5CE7',
    fontWeight: '500',
  },
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

