import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { MOCK_DATA, User } from '../../data/mockData';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppText from '../../components/shared/AppText';
import otpService from '../../services/otpService';
import { useTheme } from '../../theme';

type LoginMethod = 'email' | 'phone';

// Floating Label Input Component
interface FloatingLabelInputProps extends TextInputProps {
  label: string;
}

function FloatingLabelInput({ label, style, ...rest }: FloatingLabelInputProps) {
  const { theme } = useTheme();
  const localVars = getLocalVars(theme);
  
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const basePlaceholder = (rest.placeholder as string) || label;
  const placeholderColor = rest.placeholderTextColor ?? localVars.placeholderColor;

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <AppText 
          style={[
            styles.floatingLabel(localVars), 
            styles.floatingLabelActive(localVars)
          ]}
        >
          {label}
        </AppText>
      )}
      <TextInput
        {...rest}
        placeholder={showFloatingLabel ? '' : basePlaceholder}
        placeholderTextColor={placeholderColor}
        style={[
          styles.floatingInput(localVars),
          showFloatingLabel && styles.floatingInputWithLabel,
          isFocused && styles.floatingInputFocused(localVars),
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

// Floating Label Password Input Component
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
  const { theme } = useTheme();
  const localVars = getLocalVars(theme);
  
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const basePlaceholder = (rest.placeholder as string) || label;
  const placeholderColor = rest.placeholderTextColor ?? localVars.placeholderColor;

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <AppText 
          style={[
            styles.floatingLabel(localVars), 
            styles.floatingLabelActive(localVars)
          ]}
        >
          {label}
        </AppText>
      )}
      <View style={[
        styles.floatingPasswordWrapper(localVars),
        isFocused && styles.floatingInputFocused(localVars),
      ]}>
        <TextInput
          {...rest}
          placeholder={showFloatingLabel ? '' : basePlaceholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={!showPassword}
          style={[
            styles.floatingPasswordInput(localVars),
            showFloatingLabel && styles.floatingPasswordInputWithLabel,
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
            color={localVars.primaryColor} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Floating Label Phone Input Component
interface FloatingLabelPhoneInputProps extends TextInputProps {
  label: string;
}

function FloatingLabelPhoneInput({ label, style, ...rest }: FloatingLabelPhoneInputProps) {
  const { theme } = useTheme();
  const localVars = getLocalVars(theme);
  
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = typeof rest.value === 'string' ? rest.value.trim().length > 0 : !!rest.value;
  const showFloatingLabel = isFocused || hasValue;
  const basePlaceholder = (rest.placeholder as string) || label;
  const placeholderColor = rest.placeholderTextColor ?? localVars.placeholderColor;

  return (
    <View style={styles.floatingContainer}>
      {showFloatingLabel && (
        <AppText 
          style={[
            styles.floatingLabel(localVars), 
            styles.floatingLabelActive(localVars)
          ]}
        >
          {label}
        </AppText>
      )}
      <View style={[
        styles.floatingPhoneWrapper(localVars),
        isFocused && styles.floatingInputFocused(localVars),
      ]}>
        <View style={styles.floatingCountryCodeContainer(localVars)}>
          <AppText style={styles.floatingFlagIcon}>🇮🇳</AppText>
          <AppText style={styles.floatingCountryCode(localVars)}>+91</AppText>
        </View>
        <View style={styles.floatingPhoneDivider(localVars)} />
        <TextInput
          {...rest}
          placeholder={showFloatingLabel ? '' : basePlaceholder}
          placeholderTextColor={placeholderColor}
          style={[
            styles.floatingPhoneInput(localVars),
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

// Local Variables Mapper - Maps global theme tokens to local component scope
const getLocalVars = (theme: any) => ({
  // Primary Colors - Main brand colors
  primaryColor: theme.colors.primary || '#877ED2',
  primaryDark: theme.colors.primaryDark || '#7C6AC8',
  primaryLight: theme.colors.primaryLight || '#F0EEF8',
  
  // Background Colors
  bgPrimary: theme.colors.background || '#F0EEF8',
  bgSurface: theme.colors.surface || '#FFFFFF',
  bgInput: theme.colors.surface || '#FFFFFF',
  bgCountryCode: theme.colors.backgroundSecondary || '#F8F9FA',
  
  // Text Colors
  textPrimary: theme.colors.text || '#333333',
  textSecondary: theme.colors.textSecondary || '#8E8E93',
  textMuted: theme.colors.textSecondary || '#8E8E93',
  textPlaceholder: theme.colors.textTertiary || '#9CA3AF',
  textInverse: '#FFFFFF',
  textAccent: theme.colors.info || '#6256C4',
  
  // Border Colors
  borderDefault: theme.colors.border || '#E5E5EA',
  borderFocused: theme.colors.primary || '#877ED2',
  borderDivider: theme.colors.border || '#E5E5EA',
  
  // Status Colors
  errorColor: theme.colors.error || '#FF3B30',
  
  // Spacing - Use theme spacing tokens
  spacingXs: theme.spacing?.xs || 4,
  spacingSm: theme.spacing?.sm || 8,
  spacingMd: theme.spacing?.md || 16,
  spacingLg: theme.spacing?.lg || 24,
  spacingXl: theme.spacing?.xl || 32,
  
  // Border Radius - Use theme border radius tokens
  radiusSm: theme.borderRadius?.sm || 4,
  radiusMd: theme.borderRadius?.md || 8,
  radiusLg: theme.borderRadius?.lg || 12,
  radiusXl: theme.borderRadius?.xl || 16,
  
  // Typography - Font Sizes
  fontSizeXs: theme.typography?.fontSizes?.xs || 10,
  fontSizeSm: theme.typography?.fontSizes?.sm || 12,
  fontSizeBase: theme.typography?.fontSizes?.base || 14,
  fontSizeMd: theme.typography?.fontSizes?.md || 16,
  fontSizeLg: theme.typography?.fontSizes?.lg || 18,
  fontSizeXl: theme.typography?.fontSizes?.xl || 20,
  fontSizeXxl: theme.typography?.fontSizes?.xxl || 24,
  fontSizeXxxl: theme.typography?.fontSizes?.xxxl || 32,
  
  // Typography - Font Weights
  fontWeightNormal: theme.typography?.weights?.regular || '400',
  fontWeightMedium: theme.typography?.weights?.medium || '500',
  fontWeightSemibold: theme.typography?.weights?.semibold || '600',
  fontWeightBold: theme.typography?.weights?.bold || '700',
  
  // Typography - Font Families ✅ MAPPED FROM THEME
  fontFamilyRegular: theme.typography?.families?.regular || 'Inter_400Regular',
  fontFamilyMedium: theme.typography?.families?.medium || 'Inter_500Medium',
  fontFamilySemibold: theme.typography?.families?.semibold || 'Inter_600SemiBold',
  fontFamilyBold: theme.typography?.families?.bold || 'Inter_700Bold',
  
  // Component-specific
  placeholderColor: '#727272',
  shadowColor: theme.colors.primary || '#877ED2',
});

export default function NewLoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { loginWithUser, login } = useContext(AuthContext);
  const { theme } = useTheme();
  const localVars = getLocalVars(theme);
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
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
    <SafeAreaWrapper backgroundColor={localVars.bgPrimary}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content(localVars)}>
            {/* Header with Logo */}
            <View style={styles.header(localVars)}>
              <View style={styles.logoContainer(localVars)}>
                <View style={styles.logoIcon(localVars)}>
                  <Ionicons name="checkmark" size={40} color={localVars.textInverse} />
                </View>
              </View>
              <AppText style={styles.appName(localVars)}>Taskly</AppText>
              <AppText style={styles.welcomeText(localVars)}>Welcome to Taskly!</AppText>
              <AppText style={styles.appTagline(localVars)}>Plan tasks. Track time. Work better</AppText>
            </View>

            {/* Login Method Toggle */}
            <View style={styles.toggleContainer(localVars)}>
              <TouchableOpacity
                style={[
                  styles.toggleButton(localVars),
                  loginMethod === 'email' && styles.toggleButtonActive(localVars)
                ]}
                onPress={() => setLoginMethod('email')}
              >
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={loginMethod === 'email' ? localVars.textInverse : localVars.primaryColor} 
                />
                <AppText style={[
                  styles.toggleButtonText(localVars),
                  loginMethod === 'email' && styles.toggleButtonTextActive(localVars)
                ]}>
                  Email
                </AppText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton(localVars),
                  loginMethod === 'phone' && styles.toggleButtonActive(localVars)
                ]}
                onPress={() => setLoginMethod('phone')}
              >
                <Ionicons 
                  name="phone-portrait-outline" 
                  size={20} 
                  color={loginMethod === 'phone' ? localVars.textInverse : localVars.primaryColor} 
                />
                <AppText style={[
                  styles.toggleButtonText(localVars),
                  loginMethod === 'phone' && styles.toggleButtonTextActive(localVars)
                ]}>
                  Phone
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Email/Password Form */}
            {loginMethod === 'email' && (
              <View style={styles.formContainer(localVars)}>
                <View style={styles.inputContainer(localVars)}>
                  <FloatingLabelInput
                    label="Email"
                    placeholder="Email"
                    placeholderTextColor={localVars.placeholderColor}
                    value={emailForm.email}
                    onChangeText={(text) => setEmailForm({ ...emailForm, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && (
                    <AppText style={styles.errorText(localVars)}>{errors.email}</AppText>
                  )}
                </View>

                <View style={styles.inputContainer(localVars)}>
                  <FloatingLabelPasswordInput
                    label="Password"
                    placeholder="Password"
                    placeholderTextColor={localVars.placeholderColor}
                    value={emailForm.password}
                    onChangeText={(text) => setEmailForm({ ...emailForm, password: text })}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(prev => !prev)}
                    autoCapitalize="none"
                  />
                  {errors.password && (
                    <AppText style={styles.errorText(localVars)}>{errors.password}</AppText>
                  )}
                </View>

                {/* Remember me & Forgot password row */}
                <View style={styles.optionsRow(localVars)}>
                  <TouchableOpacity 
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(prev => !prev)}
                  >
                    <View style={[
                      styles.checkbox(localVars), 
                      rememberMe && styles.checkboxChecked(localVars)
                    ]}>
                      {rememberMe && <Ionicons name="checkmark" size={14} color={localVars.textInverse} />}
                    </View>
                    <AppText style={styles.rememberMeText(localVars)}>Remember me</AppText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Password reset functionality coming soon!')}>
                    <AppText style={styles.forgotPasswordText(localVars)}>Forgot password</AppText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton(localVars), 
                    loading && styles.loginButtonDisabled
                  ]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                >
                  <AppText style={styles.loginButtonText(localVars)}>
                    {loading ? 'Signing in...' : 'Login'}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Phone/OTP Form */}
            {loginMethod === 'phone' && (
              <View style={styles.formContainer(localVars)}>
                <View style={styles.inputContainer(localVars)}>
                  <FloatingLabelPhoneInput
                    label="Phone Number"
                    placeholder="Phone Number"
                    placeholderTextColor={localVars.textMuted}
                    value={phoneForm.phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={11}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {errors.phoneNumber && (
                    <AppText style={styles.errorText(localVars)}>{errors.phoneNumber}</AppText>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton(localVars), 
                    otpLoading && styles.loginButtonDisabled
                  ]}
                  onPress={handlePhoneLogin}
                  disabled={otpLoading}
                >
                  <AppText style={styles.loginButtonText(localVars)}>
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </AppText>
                </TouchableOpacity>

                <AppText style={styles.otpInfo(localVars)}>
                  A verification code will be sent to your phone
                </AppText>
              </View>
            )}

            {/* Sign Up Link */}
            <View style={styles.signUpContainer(localVars)}>
              <AppText style={styles.signUpText(localVars)}>Don't have an account? </AppText>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <AppText style={styles.signUpLink(localVars)}>Sign Up</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

// Styles using local variables with proper type safety
const styles = {
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: (vars: ReturnType<typeof getLocalVars>) => ({
    flex: 1,
    padding: vars.spacingLg,
    justifyContent: 'center' as const,
  }),
  
  // Floating Label Input Styles
  floatingContainer: {
    position: 'relative' as const,
    paddingTop: 4,
  },
  floatingLabel: (vars: ReturnType<typeof getLocalVars>) => ({
    position: 'absolute' as const,
    left: 12,
    top: 14,
    fontSize: vars.fontSizeSm,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    color: vars.textPlaceholder,
    zIndex: 1,
    backgroundColor: vars.bgSurface,
    paddingHorizontal: 4,
  }),
  floatingLabelActive: (vars: ReturnType<typeof getLocalVars>) => ({
    top: -6,
    fontSize: vars.fontSizeXs,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    color: vars.primaryColor,
  }),
  floatingInput: (vars: ReturnType<typeof getLocalVars>) => ({
    backgroundColor: vars.bgInput,
    borderWidth: 1,
    borderColor: vars.borderDefault,
    borderRadius: vars.radiusLg,
    paddingHorizontal: vars.spacingMd,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: vars.fontSizeMd,
    fontFamily: vars.fontFamilyRegular, // ✅ THEME FONT - CRITICAL FIX
    color: vars.textPrimary,
    minHeight: 50,
  }),
  floatingInputWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  floatingInputFocused: (vars: ReturnType<typeof getLocalVars>) => ({
    borderColor: vars.borderFocused,
  }),
  
  // Floating Password Input Styles
  floatingPasswordWrapper: (vars: ReturnType<typeof getLocalVars>) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: vars.bgInput,
    borderWidth: 1,
    borderColor: vars.borderDefault,
    borderRadius: vars.radiusLg,
    paddingRight: 12,
    minHeight: 50,
  }),
  floatingPasswordInput: (vars: ReturnType<typeof getLocalVars>) => ({
    flex: 1,
    paddingHorizontal: vars.spacingMd,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: vars.fontSizeMd,
    fontFamily: vars.fontFamilyRegular, // ✅ THEME FONT - CRITICAL FIX
    color: vars.textPrimary,
  }),
  floatingPasswordInputWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  floatingPasswordToggle: {
    padding: 4,
  },
  
  // Floating Phone Input Styles
  floatingPhoneWrapper: (vars: ReturnType<typeof getLocalVars>) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: vars.bgInput,
    borderWidth: 1,
    borderColor: vars.borderDefault,
    borderRadius: vars.radiusLg,
    overflow: 'hidden' as const,
    minHeight: 50,
  }),
  floatingCountryCodeContainer: (vars: ReturnType<typeof getLocalVars>) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: vars.bgCountryCode,
  }),
  floatingFlagIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  floatingCountryCode: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeMd,
    fontFamily: vars.fontFamilySemibold, // ✅ THEME FONT
    fontWeight: vars.fontWeightSemibold as any,
    color: vars.textPrimary,
  }),
  floatingPhoneDivider: (vars: ReturnType<typeof getLocalVars>) => ({
    width: 1,
    height: 24,
    backgroundColor: vars.borderDivider,
  }),
  floatingPhoneInput: (vars: ReturnType<typeof getLocalVars>) => ({
    flex: 1,
    fontSize: vars.fontSizeMd,
    fontFamily: vars.fontFamilyRegular, // ✅ THEME FONT - CRITICAL FIX
    color: vars.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  }),
  floatingPhoneInputWithLabel: {
    paddingTop: 18,
    paddingBottom: 10,
  },
  
  // Header Styles
  header: (vars: ReturnType<typeof getLocalVars>) => ({
    alignItems: 'center' as const,
    marginBottom: 70,
  }),
  logoContainer: (vars: ReturnType<typeof getLocalVars>) => ({
    marginBottom: vars.spacingSm,
  }),
  logoIcon: (vars: ReturnType<typeof getLocalVars>) => ({
    width: 70,
    height: 70,
    borderRadius: vars.radiusXl,
    backgroundColor: vars.primaryDark,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: vars.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }),
  appName: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeXxxl,
    fontFamily: vars.fontFamilyBold, // ✅ THEME FONT
    fontWeight: vars.fontWeightBold as any,
    color: vars.primaryDark,
    marginBottom: vars.spacingMd,
  }),
  welcomeText: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeXl,
    fontFamily: vars.fontFamilySemibold, // ✅ THEME FONT
    fontWeight: vars.fontWeightSemibold as any,
    color: vars.textPrimary,
  }),
  appTagline: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeBase,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    color: vars.textAccent,
    fontWeight: vars.fontWeightMedium as any,
  }),
  
  // Toggle Styles
  toggleContainer: (vars: ReturnType<typeof getLocalVars>) => ({
    flexDirection: 'row' as const,
    backgroundColor: vars.bgSurface,
    borderRadius: vars.radiusLg,
    padding: 4,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  }),
  toggleButton: (vars: ReturnType<typeof getLocalVars>) => ({
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: vars.spacingMd,
    borderRadius: vars.radiusMd,
  }),
  toggleButtonActive: (vars: ReturnType<typeof getLocalVars>) => ({
    backgroundColor: vars.primaryColor,
  }),
  toggleButtonText: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeMd,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    fontWeight: vars.fontWeightMedium as any,
    color: vars.primaryColor,
    marginLeft: vars.spacingSm,
  }),
  toggleButtonTextActive: (vars: ReturnType<typeof getLocalVars>) => ({
    color: vars.textInverse,
  }),
  
  // Form Styles
  formContainer: (vars: ReturnType<typeof getLocalVars>) => ({
    marginBottom: vars.spacingLg,
  }),
  inputContainer: (vars: ReturnType<typeof getLocalVars>) => ({
    marginBottom: vars.spacingMd,
  }),
  optionsRow: (vars: ReturnType<typeof getLocalVars>) => ({
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: vars.spacingLg,
    marginTop: 4,
  }),
  rememberMeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  checkbox: (vars: ReturnType<typeof getLocalVars>) => ({
    width: 20,
    height: 20,
    borderRadius: vars.radiusSm,
    borderWidth: 2,
    borderColor: vars.primaryColor,
    marginRight: vars.spacingSm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  }),
  checkboxChecked: (vars: ReturnType<typeof getLocalVars>) => ({
    backgroundColor: vars.primaryColor,
    borderColor: vars.primaryColor,
  }),
  rememberMeText: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeSm,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    color: vars.textMuted,
    fontWeight: vars.fontWeightMedium as any,
  }),
  forgotPasswordText: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeSm,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    color: vars.primaryColor,
    fontWeight: vars.fontWeightMedium as any,
  }),
  
  // Button Styles
  loginButton: (vars: ReturnType<typeof getLocalVars>) => ({
    backgroundColor: vars.primaryColor,
    borderRadius: vars.radiusMd,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: vars.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 48,
    height: 50,
    width: 371,
  }),
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: (vars: ReturnType<typeof getLocalVars>) => ({
    color: vars.textInverse,
    fontSize: vars.fontSizeBase,
    fontFamily: vars.fontFamilyMedium, // ✅ THEME FONT
    fontWeight: vars.fontWeightMedium as any,
  }),
  
  // Error & Info Styles
  errorText: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: 13,
    fontFamily: vars.fontFamilyRegular, // ✅ THEME FONT
    color: vars.errorColor,
    marginTop: 6,
    marginLeft: 4,
  }),
  otpInfo: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: vars.fontSizeSm,
    fontFamily: vars.fontFamilyRegular, // ✅ THEME FONT
    color: vars.textMuted,
    textAlign: 'center' as const,
    marginTop: vars.spacingMd,
  }),
  
  // Sign Up Styles
  signUpContainer: (vars: ReturnType<typeof getLocalVars>) => ({
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 'auto' as const,
    paddingTop: 20,
  }),
  signUpText: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: 15,
    fontFamily: vars.fontFamilyRegular, // ✅ THEME FONT
    color: vars.textMuted,
  }),
  signUpLink: (vars: ReturnType<typeof getLocalVars>) => ({
    fontSize: 15,
    fontFamily: vars.fontFamilySemibold, // ✅ THEME FONT
    color: vars.primaryColor,
    fontWeight: vars.fontWeightSemibold as any,
  }),
};