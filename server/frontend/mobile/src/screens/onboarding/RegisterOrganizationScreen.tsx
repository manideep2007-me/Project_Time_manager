import React, { ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInputProps,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';
import Card from '../../components/shared/Card';
import { registerOrganization } from '../../api/endpoints';
import otp from '../../services/otpService';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  multiline?: boolean;
}

function FloatingLabelInput({ label, multiline, style, ...rest }: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const basePlaceholder = (rest.placeholder as string) || label;
  const placeholderColor = rest.placeholderTextColor ?? '#BBBBBB';

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <Text
          style={[
            styles.floatingLabel,
            styles.floatingLabelActive,
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        {...rest}
        multiline={multiline}
        placeholder={showFloatingLabel ? '' : basePlaceholder}
        placeholderTextColor={placeholderColor}
        style={[
          styles.floatingInput,
          showFloatingLabel && styles.floatingInputWithLabel,
          multiline && styles.floatingInputMultiline,
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

interface FloatingLabelPickerProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

function FloatingLabelPicker({
  label,
  selectedValue,
  onValueChange,
  children,
}: FloatingLabelPickerProps) {
  const hasValue = !!selectedValue;
  const showFloatingLabel = hasValue;

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <Text style={[styles.floatingLabel, styles.floatingLabelActive]}>
          {label}
        </Text>
      )}
      <View style={[styles.floatingInput, styles.floatingPicker]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(v: string) => onValueChange(v)}
          style={styles.picker}
        >
          {!hasValue && (
            <Picker.Item
              label={label}
              value=""
              color="#A0A0A0"
            />
          )}
          {children}
        </Picker>
      </View>
    </View>
  );
}

interface FloatingLabelPasswordInputProps extends TextInputProps {
  label: string;
  showPassword: boolean;
  onTogglePassword: () => void;
}

function FloatingLabelPasswordInput({ 
  label, 
  showPassword, 
  onTogglePassword, 
  style, 
  ...rest 
}: FloatingLabelPasswordInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const basePlaceholder = (rest.placeholder as string) || label;
  const placeholderColor = rest.placeholderTextColor ?? '#BBBBBB';

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <Text style={[styles.floatingLabel, styles.floatingLabelActive]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.floatingPasswordWrapper,
        isFocused && styles.floatingInputFocused,
      ]}>
        <TextInput
          {...rest}
          placeholder={showFloatingLabel ? '' : basePlaceholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={!showPassword}
          style={[
            styles.floatingPasswordInput,
            showFloatingLabel && styles.floatingInputWithLabel,
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
        <TouchableOpacity
          style={styles.floatingPasswordToggle}
          onPress={onTogglePassword}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons 
            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
            size={22} 
            color="#999999" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RegisterOrganizationScreen({ navigation }: any) {
  // Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 - Company Information
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [showLogoPickerModal, setShowLogoPickerModal] = useState(false);

  // Step 2 - Admin Credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpGenerated, setEmailOtpGenerated] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const slideAnim = useRef(new Animated.Value(500)).current;
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpDigits, setPhoneOtpDigits] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(30);
  const [phoneOtpGenerated, setPhoneOtpGenerated] = useState('');
  const phoneOtpInputRefs = useRef<(TextInput | null)[]>([]);
  const phoneSlideAnim = useRef(new Animated.Value(500)).current;

  // Step 3 - License
  const [licenceNumber, setLicenceNumber] = useState('');
  const [plan, setPlan] = useState<'trial' | 'buy'>('trial');
  const [showLicenseKeyModal, setShowLicenseKeyModal] = useState(false);
  const [showLicenseField, setShowLicenseField] = useState(false);

  // Hidden/derived
  const [maxEmployees, setMaxEmployees] = useState('50');
  const [submitting, setSubmitting] = useState(false);

  // Custom toast modal
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    // Auto dismiss after 2.5s
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, 2500);
  };

  // Progress calculation (must be at top level for hooks)
  const progressWidth = useMemo(() => (step / 3) * 100, [step]);

  // Country to States mapping
  const countryStates: Record<string, string[]> = {
    'India': ['Telangana', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Punjab', 'Haryana', 'Other'],
    'United States': ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'Other'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Other'],
    'Singapore': ['Central Region', 'North Region', 'East Region', 'West Region', 'Other'],
    'Other': ['Other'],
  };

  // Reset state when country changes
  useEffect(() => {
    if (country && stateProvince) {
      const statesForCountry = countryStates[country] || [];
      if (!statesForCountry.includes(stateProvince)) {
        setStateProvince('');
      }
    }
  }, [country]);

  // Utils
  const isValidEmail = (email: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email.trim());

  const handleSubmit = async () => {
    // Validation
    if (!companyName.trim()) {
      Alert.alert('Validation', 'Company name is required');
      return;
    }
    if (!companyAddress.trim() || !city.trim() || !country.trim()) {
      Alert.alert('Validation', 'Company address is required');
      return;
    }
    if (plan === 'buy' && !licenceNumber.trim()) {
      Alert.alert('Validation', 'Licence number is required for Buy plan');
      return;
    }
    if (!maxEmployees || parseInt(maxEmployees) < 1) {
      Alert.alert('Validation', 'Max employees must be at least 1');
      return;
    }
    if (!adminEmail.trim()) {
      Alert.alert('Validation', 'Admin email is required');
      return;
    }
    if (!adminPhone.trim()) {
      Alert.alert('Validation', 'Admin phone is required');
      return;
    }
    // OTP verification temporarily disabled - will re-enable later
    // if (!emailVerified) {
    //   Alert.alert('Validation', 'Please verify email with OTP');
    //   return;
    // }
    // if (!phoneVerified) {
    //   Alert.alert('Validation', 'Please verify phone with OTP');
    //   return;
    // }
    if (!adminPassword || adminPassword.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters');
      return;
    }
    if (adminPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      // Construct address combining city, state, country and zip
      const addressParts = [
        companyAddress.trim(),
        city.trim(),
        stateProvince.trim(),
        country.trim(),
        zipCode.trim() && `PIN ${zipCode.trim()}`,
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ');
      // Generate licence_key (trial generates a temp key)
      const licence_key = plan === 'trial' 
        ? `TRIAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        : `LIC-${(licenceNumber || '0000').replace(/\s+/g, '').toUpperCase()}`;

      const res = await registerOrganization({ 
        name: companyName.trim(),
        address: fullAddress,
        industry: industry.trim() || undefined,
        city: city.trim() || undefined,
        state_province: stateProvince.trim() || undefined,
        country: country.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
        logo_url: logoUri || undefined,
        licence_key,
        licence_number: licenceNumber.trim() || licence_key, // Use licence_key if licence_number is empty
        max_employees: parseInt(maxEmployees),
        licence_type: plan,
        admin_email: adminEmail.trim(),
        admin_phone: `+91${adminPhone.trim()}`,
        admin_password: adminPassword,
      });
      const code = res.organization.join_code;
      const uniqueId = res.organization.unique_id;
      navigation.replace('OrganizationQRCode', { 
        code, 
        name: res.organization.name, 
        uniqueId,
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword,
      });
    } catch (err: any) {
      console.error('Register org error:', err);
      const message = err.response?.data?.error || 'Failed to register organization';
      Alert.alert('Error', message);
    } finally { setSubmitting(false); }
  };

  // Step guards
  const canGoNextFromStep1 =
    companyName.trim() &&
    industry &&
    companyAddress.trim() &&
    country.trim() &&
    stateProvince.trim() &&
    city.trim() &&
    zipCode.trim();

    // const canGoNextFromStep2 = isValidEmail(adminEmail) && emailVerified && adminPhone.trim() && phoneVerified && adminPassword.length >= 6 && adminPassword === confirmPassword;
  // Temporarily allow progressing without enforcing email/phone OTP verification.
  // We'll re-enable strict OTP checks later.
  const canGoNextFromStep2 =
    isValidEmail(adminEmail) &&
    adminPhone.trim() &&
    adminPassword.length >= 6 &&
    adminPassword === confirmPassword;

  // Email OTP (mock local)
  const sendEmailOtp = () => {
    if (!isValidEmail(adminEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address before requesting OTP.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    setEmailOtpGenerated(code);
    setEmailOtpSent(true);
    setOtpTimer(30);
    setOtpDigits(['', '', '', '', '', '']);
    setShowEmailOtpModal(true);
    console.log('========================================');
    console.log(`[EMAIL OTP] Code for ${adminEmail}: ${code}`);
    console.log('========================================');
  };

  // Timer effect
  useEffect(() => {
    if (showEmailOtpModal && otpTimer > 0) {
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showEmailOtpModal, otpTimer]);

  // Modal animation
  useEffect(() => {
    if (showEmailOtpModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showEmailOtpModal]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    const newOtp = [...otpDigits];
    newOtp[index] = text;
    setOtpDigits(newOtp);

    // Auto-focus next input (6 digits for Email OTP)
    if (text && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.join('') === emailOtpGenerated) {
      setEmailVerified(true);
      setShowEmailOtpModal(false);
      showToast('success', 'Verified!', 'Email verified successfully');
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyEmailOtp = () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      showToast('error', 'Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }
    if (enteredOtp === emailOtpGenerated) {
      setEmailVerified(true);
      setShowEmailOtpModal(false);
      showToast('success', 'Verified!', 'Email verified successfully');
    } else {
      showToast('error', 'Invalid OTP', 'Please enter the correct code sent to your email');
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  const resendEmailOtp = () => {
    if (otpTimer === 0) {
      sendEmailOtp();
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    const masked = local.slice(0, 2) + 'x'.repeat(local.length - 2);
    return `${masked}@${domain}`;
  };

  // Phone OTP via WhatsApp
  const sendPhoneOtp = async () => {
    try {
      if (!adminPhone.trim()) {
        Alert.alert('Error', 'Please enter phone number');
        return;
      }
      if (adminPhone.trim().length !== 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        return;
      }
      
      setPhoneOtpTimer(30);
      setPhoneOtpDigits(['', '', '', '', '', '']); // 6-digit OTP
      setShowPhoneOtpModal(true);
      
      // Call the Phone OTP service
      const res = await otp.sendOTP(adminPhone);
      if (res.success) {
        // Store the OTP for verification (in development mode, API returns OTP)
        if (res.otp) {
          setPhoneOtpGenerated(res.otp);
          console.log('========================================');
          console.log(`[PHONE OTP] Code for +91 ${adminPhone}: ${res.otp}`);
          console.log('========================================');
        }
        // OTP sent successfully - modal is already open
      } else {
        Alert.alert('Error', res.message || 'Failed to send OTP to your phone');
      }
    } catch (error: any) {
      console.error('Send Phone OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please check your connection.');
    }
  };

  // Phone OTP timer effect
  useEffect(() => {
    if (showPhoneOtpModal && phoneOtpTimer > 0) {
      const timer = setInterval(() => {
        setPhoneOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showPhoneOtpModal, phoneOtpTimer]);

  // Phone modal animation
  useEffect(() => {
    if (showPhoneOtpModal) {
      Animated.spring(phoneSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(phoneSlideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPhoneOtpModal]);

  const handlePhoneOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    const newOtp = [...phoneOtpDigits];
    newOtp[index] = text;
    setPhoneOtpDigits(newOtp);

    // Auto-focus next input (6 digits for Phone OTP)
    if (text && index < 5) {
      phoneOtpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.join('') === phoneOtpGenerated) {
      setPhoneVerified(true);
      setShowPhoneOtpModal(false);
    }
  };

  const handlePhoneOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !phoneOtpDigits[index] && index > 0) {
      phoneOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPhoneOtp = async () => {
    const enteredOtp = phoneOtpDigits.join('');
    if (enteredOtp.length !== 6) {
      showToast('error', 'Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }
    
    try {
      // Verify OTP via backend
      const res = await otp.verifyOTP(adminPhone, enteredOtp);
      if (res.success) {
        setPhoneVerified(true);
        setShowPhoneOtpModal(false);
        showToast('success', 'Verified!', 'Phone number verified successfully');
      } else {
        showToast('error', 'Invalid OTP', res.message || 'Please enter the correct code sent to your phone');
        setPhoneOtpDigits(['', '', '', '', '', '']);
        phoneOtpInputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      // Fallback to local verification for development
      if (enteredOtp === phoneOtpGenerated) {
        setPhoneVerified(true);
        setShowPhoneOtpModal(false);
        showToast('success', 'Verified!', 'Phone number verified successfully');
      } else {
        showToast('error', 'Invalid OTP', 'Please enter the correct code sent to your phone');
        setPhoneOtpDigits(['', '', '', '', '', '']);
        phoneOtpInputRefs.current[0]?.focus();
      }
    }
  };

  const resendPhoneOtp = () => {
    if (phoneOtpTimer === 0) {
      sendPhoneOtp();
    }
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return 'xxxxxx' + phone.slice(-4);
  };

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title="Setting Up Your Company"
        backgroundColor="#877ED2"
        borderBottomRadius={20}
        rightAction={{
          iconName: 'ellipsis-vertical',
          iconColor: '#FFFFFF',
          iconSize: 20,
          onPress: () => {},
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Company Information</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressWidth}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressStepText}>{step} of 3</Text>
              </View>

              <FloatingLabelInput
                label="Name of your Organization*"
                placeholder="Name of your Organization*"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <FloatingLabelPicker
                label="Industry*"
                selectedValue={industry}
                onValueChange={(v) => setIndustry(v)}
              >
                <Picker.Item label="Information Technology" value="it" />
                <Picker.Item label="Manufacturing" value="manufacturing" />
                <Picker.Item label="Healthcare" value="healthcare" />
                <Picker.Item label="Education" value="education" />
                <Picker.Item label="Finance" value="finance" />
                <Picker.Item label="Retail" value="retail" />
                <Picker.Item label="Other" value="other" />
              </FloatingLabelPicker>

              <View style={styles.logoSection}>
                <Text style={styles.logoLabel}>Upload your organization logo</Text>
                <Text style={styles.logoHint}>png, jpg, gif up to 2MB</Text>
                <TouchableOpacity
                  style={styles.logoUploadRow}
                  activeOpacity={0.8}
                  onPress={() => setShowLogoPickerModal(true)}
                >
                  {logoUri ? (
                    <View style={styles.logoPreviewContainer}>
                      <Image source={{ uri: logoUri }} style={styles.logoPreview} />
                      <Text style={styles.logoFileName} numberOfLines={1}>{logoName}</Text>
                    </View>
                  ) : (
                    <Text style={styles.logoPlaceholder}>Add files</Text>
                  )}
                  <Text style={styles.logoAttachText}>{logoUri ? 'Change' : 'Attach'}</Text>
                </TouchableOpacity>
              </View>

              <FloatingLabelInput
                label="Address*"
                value={companyAddress}
                onChangeText={setCompanyAddress}
                multiline
                numberOfLines={3}
              />

              <FloatingLabelPicker
                label="Country*"
                selectedValue={country}
                onValueChange={(v) => {
                  setCountry(v);
                  setStateProvince(''); // Reset state when country changes
                }}
              >
                <Picker.Item label="India" value="India" />
                <Picker.Item label="United States" value="United States" />
                <Picker.Item label="United Kingdom" value="United Kingdom" />
                <Picker.Item label="Singapore" value="Singapore" />
                <Picker.Item label="Other" value="Other" />
              </FloatingLabelPicker>

              <FloatingLabelPicker
                label="State*"
                selectedValue={stateProvince}
                onValueChange={(v) => setStateProvince(v)}
              >
                {(countryStates[country] || countryStates['Other']).map((state: string) => (
                  <Picker.Item key={state} label={state} value={state} />
                ))}
              </FloatingLabelPicker>

              <FloatingLabelInput
                label="City*"
                value={city}
                onChangeText={setCity}
              />

              <FloatingLabelInput
                label="Zip Code*"
                value={zipCode}
                onChangeText={(text) => setZipCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    !canGoNextFromStep1 && styles.buttonDisabled,
                  ]}
                  onPress={() => setStep(2)}
                  disabled={!canGoNextFromStep1}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Admin Credentials</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressWidth}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressStepText}>{step} of 3</Text>
              </View>

              {emailVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#25D366" />
                  <Text style={styles.verifiedText}>Email verified</Text>
                </View>
              )}

              <View style={styles.emailRow}>
                <View style={styles.emailInputWrapper}>
                  <FloatingLabelInput
                    label="Email*"
                    value={adminEmail}
                    onChangeText={(t) => { setAdminEmail(t); setEmailVerified(false); }}
                    placeholder="Email*"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity style={styles.sendOtpButton} onPress={sendEmailOtp}>
                  <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.phoneRow}>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodePrefix}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <View style={styles.phoneInputField}>
                    <FloatingLabelInput
                      label="Phone*"
                      value={adminPhone}
                      onChangeText={(t) => { setAdminPhone(t); setPhoneVerified(false); }}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.sendOtpButton} onPress={sendPhoneOtp}>
                  <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                </TouchableOpacity>
              </View>

              {phoneVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#25D366" />
                  <Text style={styles.verifiedText}>Phone verified</Text>
                </View>
              )}

              <View style={styles.passwordFieldWithStrength}>
                <FloatingLabelPasswordInput
                  label="Password*"
                  placeholder="Password*"
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((prev) => !prev)}
                  autoCapitalize="none"
                />
                {adminPassword.length > 0 && (
                  <Text style={styles.passwordStrengthText}>
                    {adminPassword.length >= 6 ? 'Strong' : 'Weak'}
                  </Text>
                )}
              </View>

              <FloatingLabelPasswordInput
                label="Confirm Password*"
                placeholder="Confirm Password*"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
                autoCapitalize="none"
              />

              <View style={styles.spacer} />

              <View style={styles.step2NavRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={24} color="#877ED2" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.continueButton, !canGoNextFromStep2 && styles.buttonDisabled]} onPress={() => setStep(3)} disabled={!canGoNextFromStep2}>
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>License Details</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressWidth}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressStepText}>{step} of 3</Text>
              </View>

              <Text style={styles.labelInline}>Plan</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.chip, plan === 'trial' && styles.chipActive]}
                  onPress={() => {
                    setPlan('trial');
                    setShowLicenseKeyModal(true);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      plan === 'trial' && styles.chipTextActive,
                    ]}
                  >
                    Lite
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, plan === 'buy' && styles.chipActive]}
                  onPress={() => setPlan('buy')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      plan === 'buy' && styles.chipTextActive,
                    ]}
                  >
                    Pro
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.compareText}>
                Compare Lite and Pro version
              </Text>

              {showLicenseField && (
                <View style={styles.licenseFieldContainer}>
                  <Text style={styles.licenseFieldLabel}>License Number</Text>
                  <View style={styles.licenseFieldBox}>
                    <Text style={styles.licenseFieldValue}>
                      {licenceNumber || '****  ****  ****'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.spacer} />

              <View style={styles.step2NavRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(2)}
                >
                  <Ionicons name="arrow-back" size={24} color="#877ED2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.continueButton, submitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.buttonText}>
                    {submitting ? 'Creating...' : 'Create Organization'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

      </ScrollView>

      {/* Logo Picker Modal */}
      <Modal
        visible={showLogoPickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.logoModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoPickerModal(false)}
        >
          <View style={styles.logoModalContent}>
            <Text style={styles.logoModalTitle}>Upload Logo</Text>
            <TouchableOpacity
              style={styles.logoModalOption}
              onPress={async () => {
                setShowLogoPickerModal(false);
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                  return;
                }
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ['images'],
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]) {
                  const asset = result.assets[0];
                  const fileName = asset.uri.split('/').pop() || 'logo.jpg';
                  setLogoName(fileName);
                  setLogoUri(asset.uri);
                }
              }}
            >
              <Ionicons name="camera-outline" size={24} color="#877ED2" />
              <Text style={styles.logoModalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoModalOption}
              onPress={async () => {
                setShowLogoPickerModal(false);
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]) {
                  const asset = result.assets[0];
                  const fileName = asset.uri.split('/').pop() || 'logo.jpg';
                  setLogoName(fileName);
                  setLogoUri(asset.uri);
                }
              }}
            >
              <Ionicons name="images-outline" size={24} color="#877ED2" />
              <Text style={styles.logoModalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Email OTP Modal */}
      <Modal
        visible={showEmailOtpModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowEmailOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowEmailOtpModal(false)}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.phoneHeaderRow}>
                <Ionicons name="mail-outline" size={22} color="#877ED2" />
                <Text style={styles.modalTitle}>Verify Email</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEmailOtpModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Please enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>{adminEmail || 'your email'}</Text>
            </Text>

            <View style={styles.otpContainerSix}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    otpInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInputSix,
                    digit && styles.otpInputFilled,
                    index === otpDigits.findIndex((d) => d === '') && styles.otpInputActive,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {otpTimer > 0 && (
              <View style={styles.timerContainerCenter}>
                <View style={styles.timerSpinner} />
                <Text style={styles.timerText}>
                  Code expires in {String(Math.floor(otpTimer / 60)).padStart(2, '0')}:
                  {String(otpTimer % 60).padStart(2, '0')}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.resendLink, otpTimer > 0 && styles.resendLinkDisabled]}
              onPress={resendEmailOtp}
              disabled={otpTimer > 0}
            >
              <Ionicons 
                name="refresh-outline" 
                size={16} 
                color={otpTimer > 0 ? '#999' : '#877ED2'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.resendLinkText, otpTimer > 0 && styles.resendLinkTextDisabled]}>
                Resend OTP via Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.phoneConfirmButton} onPress={verifyEmailOtp}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.modalConfirmButtonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeEmailLink}
              onPress={() => {
                setShowEmailOtpModal(false);
              }}
            >
              <Text style={styles.changeEmailLinkText}>Change Email</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* WhatsApp Phone OTP Modal */}
      <Modal
        visible={showPhoneOtpModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowPhoneOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPhoneOtpModal(false)}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: phoneSlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.phoneHeaderRow}>
                <Ionicons name="call-outline" size={22} color="#877ED2" />
                <Text style={styles.modalTitle}>Verify Phone Number</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPhoneOtpModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Please enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>+91 {adminPhone || 'xxxxxxxxxx'}</Text>
            </Text>

            <View style={styles.otpContainerSix}>
              {phoneOtpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    phoneOtpInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInputSix,
                    digit && styles.otpInputFilled,
                    index === phoneOtpDigits.findIndex((d) => d === '') && styles.otpInputActive,
                  ]}
                  value={digit}
                  onChangeText={(text) => handlePhoneOtpChange(text, index)}
                  onKeyPress={(e) => handlePhoneOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {phoneOtpTimer > 0 && (
              <View style={styles.timerContainerCenter}>
                <View style={styles.timerSpinner} />
                <Text style={styles.timerText}>
                  Code expires in {String(Math.floor(phoneOtpTimer / 60)).padStart(2, '0')}:
                  {String(phoneOtpTimer % 60).padStart(2, '0')}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.resendLink, phoneOtpTimer > 0 && styles.resendLinkDisabled]}
              onPress={resendPhoneOtp}
              disabled={phoneOtpTimer > 0}
            >
              <Ionicons 
                name="refresh-outline" 
                size={16} 
                color={phoneOtpTimer > 0 ? '#999' : '#877ED2'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.resendLinkText, phoneOtpTimer > 0 && styles.resendLinkTextDisabled]}>
                Resend OTP via SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.phoneConfirmButton} onPress={verifyPhoneOtp}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.modalConfirmButtonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeEmailLink}
              onPress={() => {
                setShowPhoneOtpModal(false);
              }}
            >
              <Text style={styles.changeEmailLinkText}>Change Phone Number</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Generate License Key Modal */}
      <Modal
        visible={showLicenseKeyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLicenseKeyModal(false)}
      >
        <View style={styles.licenseModalOverlay}>
          <TouchableOpacity
            style={styles.licenseModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowLicenseKeyModal(false)}
          />
          <View style={styles.licenseModalContent}>
            <TouchableOpacity
              style={styles.licenseModalCloseButton}
              onPress={() => setShowLicenseKeyModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.licenseModalCloseIcon}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.licenseModalTitle}>Generate License Key</Text>
            <Text style={styles.licenseModalText}>
              License key will be sent to your registered email ID. The key is valid for 12 hours
            </Text>
            
            <TouchableOpacity
              style={styles.licenseModalSendButton}
              onPress={() => {
                // Generate a random license key (format: XXXX-XXXX-XXXX)
                const generateLicenseKey = () => {
                  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
                  return `${segment()}-${segment()}-${segment()}`;
                };
                
                const generatedKey = generateLicenseKey();
                console.log('═══════════════════════════════════════');
                console.log('🔑 LICENSE KEY GENERATED (FOR TESTING)');
                console.log('═══════════════════════════════════════');
                console.log('License Key:', generatedKey);
                console.log('Email:', adminEmail);
                console.log('Valid for: 12 hours');
                console.log('═══════════════════════════════════════');
                
                setLicenceNumber(generatedKey);
                setShowLicenseField(true);
                setShowLicenseKeyModal(false);
              }}
            >
              <Text style={styles.licenseModalSendButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.licenseModalCancelLink}
              onPress={() => setShowLicenseKeyModal(false)}
            >
              <Text style={styles.licenseModalCancelLinkText}>Changed my mind</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            toastType === 'success' ? styles.toastSuccess : styles.toastError,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toastIconWrapper}>
            <Ionicons
              name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={28}
              color={toastType === 'success' ? '#22C55E' : '#EF4444'}
            />
          </View>
          <View style={styles.toastTextWrapper}>
            <Text style={[
              styles.toastTitle,
              toastType === 'success' ? styles.toastTitleSuccess : styles.toastTitleError,
            ]}>
              {toastTitle}
            </Text>
            <Text style={styles.toastMessage}>{toastMessage}</Text>
          </View>
          <TouchableOpacity
            style={styles.toastDismiss}
            onPress={() => {
              Animated.timing(toastAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setToastVisible(false));
            }}
          >
            <Ionicons name="close" size={18} color="#999" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
    flexGrow: 1,
  },
  wizardHeader: {
    marginBottom: 16,
  },
  wizardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter_600SemiBold',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#877ED2',
  },
  progressStepText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '500', 
    marginTop: 0, 
    marginBottom: 16, 
    color: '#333333',
    fontFamily: 'Inter_500Medium',
  },
  floatingContainer: {
    marginBottom: 16,
    position: 'relative',
    paddingTop: 0,
  },
  floatingLabel: {
    position: 'absolute',
    left: 14,
    top: 18,
    fontSize: 14,
    color: '#999999',
    zIndex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  floatingLabelActive: {
    top: -8,
    fontSize: 12,
    color: '#999999',
  },
  floatingInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    minHeight: 52,
  },
  floatingInputWithLabel: {
    paddingTop: 20,
    paddingBottom: 14,
  },
  floatingInputMultiline: {
    // Address textarea height
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  floatingInputFocused: {
    borderColor: '#877ED2',
  },
  floatingPicker: {
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 52,
    height: 52,
  },
  picker: {
    // Extra height so the placeholder / selected text is fully visible
    height: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  inputFlex: {
    width: 260,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  emailInputWrapper: {
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  countryCodePrefix: {
    width: 60,
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneInputField: {
    flex: 1,
    marginBottom: -18,
    marginTop: 0,
  },
  sendOtpButton: {
    backgroundColor: '#877ED2',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 0,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  sendOtpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  labelInline: {
    fontSize: 14,
    color: '#8D8D8D',
    marginTop: 0,
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 14,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: 0,
  },
  verifiedText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  verified: { backgroundColor: '#E6FFED', borderColor: '#34C759' },
  chip: {
    flex: 1,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#877ED2',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: '#877ED2',
    borderColor: '#877ED2',
  },
  chipText: {
    color: '#877ED2',
    fontWeight: '500',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
    minHeight: 80,
  },
  navRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 32,
    paddingBottom: 24,
  },
  step2NavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingBottom: 24,
    gap: 12,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#877ED2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#877ED2',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  logoSection: {
    marginBottom: 16,
  },
  logoLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    marginTop: 0,
    marginBottom: 4,
    marginLeft: 0,
  },
  logoHint: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 0,
    marginBottom: 10,
    marginLeft: 0,
  },
  logoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 0,
    backgroundColor: '#FFFFFF',
    height: 52,
  },
  logoPlaceholder: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#A0A0A0',
  },
  logoAttachText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#877ED2',
    fontFamily: 'Inter_600SemiBold',
  },
  logoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoPreview: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
  },
  logoFileName: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#333333',
    flex: 1,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter_400Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingRight: 8,
    marginTop: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  passwordToggle: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  passwordToggleIcon: {
    fontSize: 16,
    color: '#6F67CC',
  },
  floatingPasswordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingRight: 12,
    minHeight: 52,
  },
  floatingPasswordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  floatingPasswordToggle: {
    padding: 4,
  },
  passwordFieldContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  passwordFieldWithStrength: {
    position: 'relative',
    marginBottom: 18,
  },
  passwordStrength: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  passwordStrengthText: {
    position: 'absolute',
    right: 10,
    top: '105%',
    transform: [{ translateY: -8 }],
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  passwordStrengthInline: {
    position: 'absolute',
    right: 4,
    bottom: -2,
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  button: { 
    backgroundColor: '#877ED2', 
    borderRadius: 8, 
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center', 
    justifyContent: 'center',
    width: '100%',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  outlineButton: { 
    borderWidth: 1, 
    borderColor: '#877ED2', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareText: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 14,
    color: '#877ED2',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  licenseFieldContainer: {
    marginTop: 24,
  },
  licenseFieldLabel: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 4,
    fontFamily: 'Inter_500Medium',
  },
  licenseFieldBox: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  licenseFieldValue: {
    fontSize: 16,
    color: '#808080',
    letterSpacing: 2,
  },
  outlineButtonText: { fontWeight: '700', color: '#111' },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e1e5e9', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepCircleActive: { backgroundColor: '#162cd4ff' },
  stepNumber: { fontWeight: '700', color: '#111' },
  stepNumberActive: { color: '#fff' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter_700Bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#877ED2',
    backgroundColor: '#F9FAFB',
  },
  otpInputActive: {
    borderColor: '#877ED2',
    borderWidth: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#877ED2',
    borderTopColor: 'transparent',
  },
  timerText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  resendLink: {
    alignSelf: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  resendLinkText: {
    fontSize: 14,
    color: '#877ED2',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  resendLinkTextDisabled: {
    color: '#999',
  },
  // Phone OTP Modal styles
  phoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneNumber: {
    color: '#877ED2',
    fontWeight: '600',
    fontSize: 15,
  },
  otpContainerSix: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  otpInputSix: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#F8F8FC',
  },
  timerContainerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 6,
  },
  phoneConfirmButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#877ED2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  changeEmailLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  changeEmailLinkText: {
    fontSize: 14,
    color: '#877ED2',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  // Logo Picker Modal styles
  logoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '80%',
    maxWidth: 320,
  },
  logoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  logoModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoModalOptionText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 16,
    fontFamily: 'Inter_500Medium',
  },
  // License Key Modal styles
  licenseModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  licenseModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  licenseModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    width: '90%',
    height: 320,
    alignItems: 'center',
    position: 'relative',
  },
  licenseModalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#404040',
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
    textAlign: 'center',
  },
  licenseModalText: {
    fontSize: 14,
    color: '#404040',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 8,
  },
  licenseModalSendButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  licenseModalSendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  licenseModalCancelLink: {
    alignItems: 'center',
  },
  licenseModalCancelLinkText: {
    fontSize: 14,
    color: '#877ED2',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  licenseModalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  licenseModalCloseIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  // Custom Toast styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  toastError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  toastIconWrapper: {
    marginRight: 12,
  },
  toastTextWrapper: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastTitleSuccess: {
    color: '#166534',
  },
  toastTitleError: {
    color: '#991B1B',
  },
  toastMessage: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  toastDismiss: {
    padding: 4,
    marginLeft: 8,
  },
});
