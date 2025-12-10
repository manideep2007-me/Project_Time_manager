import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { MOCK_DATA, User } from '../../data/mockData';
import Button from '../../components/shared/Button';
import AppLogo from '../../components/shared/AppLogo';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import otpService from '../../services/otpService';

type LoginMethod = 'email' | 'phone';

export default function NewLoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { loginWithUser, login } = useContext(AuthContext);
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Email/Password form data
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
  });
  
  // Phone/OTP form data
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmailForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!emailForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!emailForm.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (emailForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhoneForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!phoneForm.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const validation = otpService.validatePhoneNumber(phoneForm.phoneNumber);
      if (!validation.isValid) {
        newErrors.phoneNumber = validation.error || 'Invalid phone number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async () => {
    console.log('handleEmailLogin called');
    if (!validateEmailForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      const email = emailForm.email.trim().toLowerCase();
      const password = emailForm.password;
      console.log('Attempting login for:', email);

      // Check against mock credentials
      if (email === 'rajesh@company.com' && password === 'rajesh123') {
        console.log('Using mock credentials for Rajesh');
        const u = MOCK_DATA.users.find(u => u.id === 'user2') as User | undefined;
        await loginWithUser((u || { id: 'user2', name: 'Rajesh (Manager)', role: 'manager' }) as any);
        return;
      }

      if (email === 'alice@company.com' && password === 'alice123') {
        console.log('Using mock credentials for Alice');
        const u = MOCK_DATA.users.find(u => u.id === 'user3') as User | undefined;
        await loginWithUser((u || { id: 'user3', name: 'Alice Johnson (Employee)', role: 'employee' }) as any);
        return;
      }

      if (email === 'bob@company.com' && password === 'bob123') {
        console.log('Using mock credentials for Bob');
        const u = MOCK_DATA.users.find(u => u.id === 'user4') as User | undefined;
        await loginWithUser((u || { id: 'user4', name: 'Bob Williams (Employee)', role: 'employee' }) as any);
        return;
      }

      if (email === 'charlie@company.com' && password === 'charlie123') {
        console.log('Using mock credentials for Charlie');
        const u = MOCK_DATA.users.find(u => u.id === 'user5') as User | undefined;
        await loginWithUser((u || { id: 'user5', name: 'Charlie Davis (Employee)', role: 'employee' }) as any);
        return;
      }

      // Real backend login via AuthContext (handles token + navigation)
      console.log('Attempting real backend login');
      await login(email, password);
      console.log('Login successful');
      return;
    } catch (e: any) {
      console.error('Login error details:', e);
      console.error('Error response:', e.response);
      console.error('Error message:', e.message);
      console.error('Error code:', e.code);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.message) {
        if (e.message.includes('Network Error') || e.message.includes('ERR_NETWORK')) {
          errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:5000';
        } else {
          errorMessage = e.message;
        }
      } else if (e.code === 'ERR_NETWORK' || e.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check if the backend server is running.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!validatePhoneForm()) return;

    setOtpLoading(true);
    try {
      // Clean the phone number before sending (remove spaces and formatting)
      const cleanPhoneNumber = phoneForm.phoneNumber.replace(/\D/g, '');
      
      const result = await otpService.sendOTP(cleanPhoneNumber);
      
      if (result.success) {
        // Navigate to OTP verification screen with formatted phone number
        navigation.navigate('OTPVerification', {
          phoneNumber: phoneForm.phoneNumber, // Keep formatted for display
          userRole: 'employee' // Default role, can be determined based on phone number
        });
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };


  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as XXXXX XXXXX (5 digits space 5 digits)
    if (cleaned.length <= 5) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-digit characters first
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // Format as XXXXX XXXXX
    const formatted = limited.length <= 5 
      ? limited 
      : `${limited.slice(0, 5)} ${limited.slice(5)}`;
    
    setPhoneForm({ phoneNumber: formatted });
  };


  return (
    <SafeAreaWrapper backgroundColor="#ffffff">
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <AppLogo size="extra-large" showText={false} variant="primary" />
            </View>
            <Text style={styles.appName}>{t('auth.app_name')}</Text>
            <Text style={styles.appTagline}>{t('auth.app_tagline')}</Text>
          </View>

          {/* Login Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'email' && styles.toggleButtonActive
              ]}
              onPress={() => setLoginMethod('email')}
            >
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={loginMethod === 'email' ? '#FFFFFF' : '#007AFF'} 
              />
              <Text style={[
                styles.toggleButtonText,
                loginMethod === 'email' && styles.toggleButtonTextActive
              ]}>
                {t('auth.email')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'phone' && styles.toggleButtonActive
              ]}
              onPress={() => setLoginMethod('phone')}
            >
              <Ionicons 
                name="phone-portrait-outline" 
                size={20} 
                color={loginMethod === 'phone' ? '#FFFFFF' : '#007AFF'} 
              />
              <Text style={[
                styles.toggleButtonText,
                loginMethod === 'phone' && styles.toggleButtonTextActive
              ]}>
                {t('auth.phone')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email/Password Form */}
          {loginMethod === 'email' && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.email_address')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('auth.enter_email')}
                    value={emailForm.email}
                    onChangeText={(text) => setEmailForm({ ...emailForm, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('auth.enter_password')}
                    value={emailForm.password}
                    onChangeText={(text) => setEmailForm({ ...emailForm, password: text })}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword(prev => !prev)}
                    style={styles.passwordToggle}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.loginButton}>
                <Button
                  title={loading ? t('auth.signing_in') : t('auth.sign_in')}
                  onPress={handleEmailLogin}
                  disabled={loading}
                />
              </View>
            </View>
          )}

          {/* Phone/OTP Form */}
          {loginMethod === 'phone' && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.phone_number')}</Text>
                <View style={styles.phoneInputWrapper}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.flagIcon}>🇮🇳</Text>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <View style={styles.phoneInputDivider} />
                  <TextInput
                    style={styles.phoneTextInput}
                    placeholder={t('auth.enter_phone')}
                    value={phoneForm.phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={11} // 10 digits + 1 space
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              </View>

              <View style={styles.loginButton}>
                <Button
                  title={otpLoading ? t('common.loading') : t('auth.send_otp')}
                  onPress={handlePhoneLogin}
                  disabled={otpLoading}
                />
              </View>

              <Text style={styles.otpInfo}>
                {t('auth.otp_sent')}
              </Text>
            </View>
          )}


          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('auth.already_have_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>{t('auth.sign_up')}</Text>
            </TouchableOpacity>
          </View>

          {/* Organization Onboarding Link */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={styles.onboardingButton}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Ionicons name="business-outline" size={20} color="#007AFF" />
            <Text style={styles.onboardingButtonText}>Setup New Organization</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  passwordToggle: {
    marginLeft: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  flagIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5EA',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    textAlign: 'left',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  loginButton: {
    marginTop: 10,
  },
  otpInfo: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  registerLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  onboardingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  onboardingButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
});
