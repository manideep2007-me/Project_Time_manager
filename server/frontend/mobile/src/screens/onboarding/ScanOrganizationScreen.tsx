import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Keyboard, StatusBar, ScrollView, Modal, FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';
import Card from '../../components/shared/Card';
import { joinOrganization, resolveOrganizationByCode, register as registerApi } from '../../api/endpoints';
import otpService from '../../services/otpService';

const CODE_LENGTH = 10;
const FRAME_SIZE = 230;

const GENDERS = ['Male', 'Female', 'Other'];
const PHONE_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
];

export default function ScanOrganizationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'scan' | 'manual' | 'register'>('scan');
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Registration form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showPhoneCodePicker, setShowPhoneCodePicker] = useState(false);
  const [otpNoticeVisible, setOtpNoticeVisible] = useState(false);
  const [otpNoticeTitle, setOtpNoticeTitle] = useState('');
  const [otpNoticeMessage, setOtpNoticeMessage] = useState('');
  const [otpNoticeType, setOtpNoticeType] = useState<'info' | 'success' | 'error'>('info');
  const [otpNoticeCallback, setOtpNoticeCallback] = useState<(() => void) | null>(null);

  // OTP States
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const code = codeDigits.join('');

  const handleDigitChange = (text: string, index: number) => {
    const char = text.replace(/[^A-Za-z0-9]/g, '').slice(-1).toUpperCase();
    const newDigits = [...codeDigits];
    newDigits[index] = char;
    setCodeDigits(newDigits);
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const scannedCode = data.trim();
    const digits = scannedCode.slice(0, CODE_LENGTH).split('');
    setCodeDigits([...digits, ...Array(CODE_LENGTH - digits.length).fill('')]);
    setVerifying(true);
    try {
      const res = await resolveOrganizationByCode(scannedCode);
      setOrgName(res.organization?.name || '');
      setOrgCode(scannedCode);
      setMode('register');
    } catch {
      showOtpNotice('Invalid QR Code', 'The scanned code does not match any organization. Please try again or enter the code manually.', 'error');
      setScanned(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== CODE_LENGTH) {
      showOtpNotice('Validation', 'Please enter the complete 10-character code.', 'error');
      return;
    }
    Keyboard.dismiss();
    setVerifying(true);
    try {
      const res = await resolveOrganizationByCode(code);
      setOrgName(res.organization?.name || '');
      setOrgCode(code);
      setMode('register');
    } catch {
      showOtpNotice('Invalid Code', 'We could not find an organization for this code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Password strength calculation (simplified for testing - 6+ chars = Strong)
  const getPasswordStrength = () => {
    if (!password) return { strength: '', color: '#CCC' };
    if (password.length >= 6) return { strength: 'Strong', color: '#877ED2' };
    if (password.length >= 4) return { strength: 'Fair', color: '#B8B0E8' };
    return { strength: 'Weak', color: '#D4CFEF' };
  };

  const passwordStrength = getPasswordStrength();

  // Handle registration
  const handleCreateAccount = async () => {
    // Validation
    const errors: string[] = [];
    if (!firstName.trim()) errors.push('First Name');
    if (!lastName.trim()) errors.push('Last Name');
    if (!email.trim()) errors.push('Email');
    else if (!/\S+@\S+\.\S+/.test(email)) errors.push('Valid Email');
    if (!phoneVerified) errors.push('Phone Verification (Please verify your phone)');
    if (!phone.trim()) errors.push('Phone Number');
    if (!password) errors.push('Password');
    else if (password.length < 6) errors.push('Password (min 6 characters)');
    if (password !== confirmPassword) errors.push('Passwords must match');
    if (!agreeTerms) errors.push('Accept Terms & Policy');

    if (errors.length) {
      showOtpNotice('Validation Error', `Please provide:\n\n• ${errors.join('\n• ')}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: `${phoneCode} ${phone.trim()}`,
        password: password,
        organizationCode: orgCode,
        role: 'employee',
        gender: gender || undefined,
        age: age ? parseInt(age) : undefined,
      });

      showOtpNotice(
        'Request Submitted',
        `Your registration request has been sent to the admin of ${orgName || 'the organization'}. You will be able to login once the admin approves your request.`,
        'success',
        () => navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Login' } }] })
      );
    } catch (e: any) {
      console.error('Registration error:', e);
      const errorMessage = e.response?.data?.error || e.message || 'Registration failed. Please try again.';
      
      // Handle specific error cases
      if (e.response?.status === 409) {
        // Registration already pending
        showOtpNotice(
          'Request Already Pending', 
          `${errorMessage}\n\nPlease wait for admin approval or contact the organization admin for assistance.`,
          'info'
        );
      } else {
        showOtpNotice('Registration Failed', errorMessage, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!code) { showOtpNotice('Error', 'Please enter a valid code.', 'error'); return; }
    if (!firstName.trim()) { showOtpNotice('Validation', 'Please enter your name.', 'error'); return; }
    setSubmitting(true);
    try {
      await joinOrganization({
        code,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      showOtpNotice('Success', 'You have been linked to the organization.', 'success', () => navigation.replace('Auth'));
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to join organization';
      showOtpNotice('Error', message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // OTP Timer Effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneOtpTimer > 0) {
      interval = setInterval(() => {
        setPhoneOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneOtpTimer]);

  const showOtpNotice = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info', callback?: () => void) => {
    setOtpNoticeTitle(title);
    setOtpNoticeMessage(message);
    setOtpNoticeType(type);
    setOtpNoticeCallback(callback ? () => callback : null);
    setOtpNoticeVisible(true);
  };

  const handleNoticeClose = () => {
    setOtpNoticeVisible(false);
    if (otpNoticeCallback) {
      otpNoticeCallback();
      setOtpNoticeCallback(null);
    }
  };

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    if (!email.trim()) {
      showOtpNotice('Validation', 'Please enter your email address.', 'error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showOtpNotice('Validation', 'Please enter a valid email address.', 'error');
      return;
    }

    setSendingEmailOtp(true);
    try {
      // Try sending via backend first
      let otp: string | undefined;
      try {
        const res = await api.post('/api/otp/send', { phoneNumber: email });
        otp = res.data?.otp; // Dev mode returns OTP in response
      } catch {
        // Fallback: generate client-side
      }

      if (!otp) {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
      }
      
      console.log(`OTP sent to ${email}: ${otp}`);
      
      (global as any).emailOtpStore = { email, otp, expiresAt: Date.now() + 5 * 60 * 1000 };
      
      setEmailOtpSent(true);
      setEmailOtpTimer(300);
      showOtpNotice('OTP Sent', `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`, 'info');
    } catch (error) {
      console.error('Send email OTP error:', error);
      showOtpNotice('Error', 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = () => {
    if (!emailOtp || emailOtp.length !== 6) {
      showOtpNotice('Validation', 'Please enter the 6-digit OTP.', 'error');
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      const stored = (global as any).emailOtpStore;
      if (!stored || stored.email !== email) {
        showOtpNotice('Error', 'Please request a new OTP.', 'error');
        setVerifyingEmailOtp(false);
        return;
      }

      if (Date.now() > stored.expiresAt) {
        showOtpNotice('Expired', 'OTP has expired. Please request a new one.', 'error');
        setVerifyingEmailOtp(false);
        return;
      }

      if (emailOtp === stored.otp) {
        setEmailVerified(true);
        showOtpNotice('Success', 'Email verified successfully!', 'success');
      } else {
        showOtpNotice('Invalid OTP', 'The OTP you entered is incorrect. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Verify email OTP error:', error);
      showOtpNotice('Error', 'Failed to verify OTP.', 'error');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // Send Phone OTP
  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      showOtpNotice('Validation', 'Please enter your phone number.', 'error');
      return;
    }
    if (phone.trim().length < 10) {
      showOtpNotice('Validation', 'Please enter a valid phone number.', 'error');
      return;
    }

    setSendingPhoneOtp(true);
    try {
      const fullPhone = `${phoneCode}${phone.trim()}`;
      const result = await otpService.sendOTP(phone.trim());
      
      if (result.success) {
        setPhoneOtpSent(true);
        setPhoneOtpTimer(300);
        const otpMsg = result.otp 
          ? `Your verification code is: ${result.otp}\n\nSent to ${fullPhone}. Expires in 5 minutes.`
          : `Verification code sent to ${fullPhone}. Check your WhatsApp for the OTP.`;
        showOtpNotice('OTP Sent', otpMsg, 'info');
      } else {
        showOtpNotice('Error', result.message || 'Failed to send OTP.', 'error');
      }
    } catch (error) {
      console.error('Send phone OTP error:', error);
      showOtpNotice('Error', 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      showOtpNotice('Validation', 'Please enter the 6-digit OTP');
      return;
    }

    setVerifyingPhoneOtp(true);
    try {
      const result = await otpService.verifyOTP(phone.trim(), phoneOtp);
      
      if (result.success) {
        setPhoneVerified(true);
        showOtpNotice('Success', 'Phone number verified successfully!');
      } else {
        showOtpNotice('Invalid OTP', result.message || 'The OTP you entered is incorrect.');
      }
    } catch (error) {
      console.error('Verify phone OTP error:', error);
      showOtpNotice('Error', 'Failed to verify OTP.');
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  // Format timer to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (mode === 'scan' && permission && !permission.granted && !permission.canAskAgain) {
      showOtpNotice('Camera Permission Required', 'Please enable camera permission in your device settings.', 'error');
    }
  }, [mode, permission]);

  const handleSwitchToScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showOtpNotice('Permission Required', 'Camera permission is required. Please enable it in settings.', 'error');
        return;
      }
    }
    setMode('scan');
    setScanned(false);
    setCodeDigits(Array(CODE_LENGTH).fill(''));
    setCodeVerified(false);
  };

  // ─── Scanner: full-screen camera, header overlaid ──────────────────────────
  const renderScanner = () => {
    if (!permission) {
      return (
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#877ED2" />
          <Text style={styles.loadingText}>Checking camera permission...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#999" />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <Text style={styles.permissionSubtext}>Please grant camera access to scan QR codes</Text>
          <TouchableOpacity style={styles.enterManuallyButton} onPress={requestPermission}>
            <Text style={styles.enterManuallyButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.enterManuallyButton, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#877ED2', marginTop: 12 }]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.enterManuallyButtonText, { color: '#877ED2' }]}>Enter Code Manually</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const topOverlayHeight = insets.top + 52;

    return (
      <>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.overlayTop, { height: topOverlayHeight }]} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={styles.scanLine} />
            </View>
            <View style={styles.overlaySide} />
          </View>

          <View style={styles.overlayBottom}>
            <View style={styles.bottomTopSection}>
              <Text style={styles.scanInstruction}>
                {t('organization.position_qr_frame') || 'Position the QR code within the frame'}
              </Text>
              {scanned && !verifying && (
                <View style={styles.scannedIndicator}>
                  <Ionicons name="checkmark-circle" size={22} color="#877ED2" />
                  <Text style={styles.scannedText}>{t('organization.code_scanned') || 'Code scanned!'}</Text>
                </View>
              )}
              {verifying && (
                <View style={styles.scannedIndicator}>
                  <ActivityIndicator size="small" color="#877ED2" />
                  <Text style={[styles.scannedText, { color: '#877ED2' }]}>Verifying...</Text>
                </View>
              )}
            </View>
            <View style={styles.bottomButtonSection}>
              <Text style={styles.orText}>or</Text>
              <TouchableOpacity
                style={styles.enterManuallyButton}
                onPress={() => {
                  setMode('manual');
                  setScanned(false);
                  setCodeDigits(Array(CODE_LENGTH).fill(''));
                }}
              >
                <Text style={styles.enterManuallyButtonText}>Enter Code Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Overlaid transparent header */}
        <View style={[styles.overlaidHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
          <View pointerEvents="auto">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View pointerEvents="auto">
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // ─── Manual entry ──────────────────────────────────────────────────────────
  const renderManualEntry = () => {
    return (
      // Light gray background with card at bottom
      <View style={styles.manualEntryContainer}>

        {/* Top area — dismiss button bottom-right */}
        <View style={styles.topArea}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Blue-bordered card at bottom */}
        <View style={styles.codeEntryCard}>
          <Text style={styles.codeEntryTitle}>Enter Organization Code</Text>
          <Text style={styles.codeEntrySubtitle}>Code valid for 12 hours</Text>

          {/* OTP digit row */}
          <View style={styles.digitContainer}>
            {codeDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.digitInput,
                  digit ? styles.digitInputFilled : {},
                  index === codeDigits.findIndex(d => d === '') ? styles.digitInputActive : {},
                ]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="default"
                autoCapitalize="characters"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Code */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (verifying || code.length !== CODE_LENGTH) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={verifying || code.length !== CODE_LENGTH}
          >
            <Text style={styles.verifyButtonText}>
              {verifying ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          {/* Scan QR Code */}
          <TouchableOpacity style={styles.scanQRButton} onPress={handleSwitchToScan}>
            <Ionicons name="qr-code-outline" size={18} color="#877ED2" style={{ marginRight: 8 }} />
            <Text style={styles.scanQRButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Registration Form ─────────────────────────────────────────────────────
  const renderRegistrationForm = () => {
    return (
      <View style={styles.registerContainer}>
        {/* Purple Header with curved bottom */}
        <View style={[styles.registerHeader, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setMode('scan')} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Your Account</Text>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* White Content Area */}
        <ScrollView 
          style={styles.registerContent}
          contentContainerStyle={styles.registerContentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.formInput}
                placeholder="First Name*"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.formInput}
                placeholder="Last Name*"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Email with Send OTP */}
          <View style={styles.rowContainer}>
            <View style={styles.emailInputContainer}>
              <TextInput
                style={[styles.formInput, emailVerified && styles.inputVerified]}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailVerified(false);
                  setEmailOtpSent(false);
                  setEmailOtp('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailVerified}
              />
              {emailVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#877ED2" style={styles.verifiedIcon} />
              )}
            </View>
            {!emailVerified && (
              <TouchableOpacity 
                style={[styles.sendOtpButton, (sendingEmailOtp || emailOtpTimer > 0) && styles.buttonDisabled]}
                onPress={handleSendEmailOtp}
                disabled={sendingEmailOtp || emailOtpTimer > 0}
              >
                {sendingEmailOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendOtpText}>
                    {emailOtpTimer > 0 ? formatTimer(emailOtpTimer) : 'Send OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Email OTP Input */}
          {emailOtpSent && !emailVerified && (
            <View style={styles.otpVerifyRow}>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#999"
                value={emailOtp}
                onChangeText={setEmailOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity 
                style={[styles.verifyOtpButton, verifyingEmailOtp && styles.buttonDisabled]}
                onPress={handleVerifyEmailOtp}
                disabled={verifyingEmailOtp}
              >
                {verifyingEmailOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyOtpText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Gender and Age Row */}
          <View style={styles.rowContainer}>
            <TouchableOpacity 
              style={[styles.halfInput, styles.dropdownButton]}
              onPress={() => setShowGenderPicker(true)}
            >
              <Text style={[styles.dropdownText, !gender && styles.placeholderText]}>
                {gender || 'Gender'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.formInput}
                placeholder="Age"
                placeholderTextColor="#999"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          {/* Phone with Country Code and Send OTP */}
          <View style={styles.rowContainer}>
            <TouchableOpacity 
              style={styles.phoneCodeButton}
              onPress={() => !phoneVerified && setShowPhoneCodePicker(true)}
              disabled={phoneVerified}
            >
              <Text style={styles.phoneCodeText}>{phoneCode}</Text>
            </TouchableOpacity>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={[styles.formInput, phoneVerified && styles.inputVerified]}
                placeholder="Phone*"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setPhoneVerified(false);
                  setPhoneOtpSent(false);
                  setPhoneOtp('');
                }}
                keyboardType="phone-pad"
                editable={!phoneVerified}
              />
              {phoneVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#877ED2" style={styles.verifiedIcon} />
              )}
            </View>
            {!phoneVerified && (
              <TouchableOpacity 
                style={[styles.sendOtpButton, (sendingPhoneOtp || phoneOtpTimer > 0) && styles.buttonDisabled]}
                onPress={handleSendPhoneOtp}
                disabled={sendingPhoneOtp || phoneOtpTimer > 0}
              >
                {sendingPhoneOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendOtpText}>
                    {phoneOtpTimer > 0 ? formatTimer(phoneOtpTimer) : 'Send OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Phone OTP Input */}
          {phoneOtpSent && !phoneVerified && (
            <View style={styles.otpVerifyRow}>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#999"
                value={phoneOtp}
                onChangeText={setPhoneOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity 
                style={[styles.verifyOtpButton, verifyingPhoneOtp && styles.buttonDisabled]}
                onPress={handleVerifyPhoneOtp}
                disabled={verifyingPhoneOtp}
              >
                {verifyingPhoneOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyOtpText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.formInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#877ED2" 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordHintRow}>
            <Text style={styles.passwordHint}>Minimum 6 characters</Text>
            <Text style={[styles.passwordStrength, { color: passwordStrength.color }]}>
              {passwordStrength.strength}
            </Text>
          </View>

          {/* Confirm Password */}
          <TextInput
            style={styles.formInput}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          {/* Terms Checkbox */}
          <TouchableOpacity 
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>I agree to Taskly Terms & Policy</Text>
          </TouchableOpacity>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Create Account Button at Bottom */}
        <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.createAccountButton, submitting && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.createAccountButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Gender Picker Modal */}
        <Modal visible={showGenderPicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowGenderPicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={GENDERS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, gender === item && styles.modalOptionSelected]}
                    onPress={() => {
                      setGender(item);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, gender === item && styles.modalOptionTextSelected]}>
                      {item}
                    </Text>
                    {gender === item && <Ionicons name="checkmark" size={20} color="#877ED2" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Phone Code Picker Modal */}
        <Modal visible={showPhoneCodePicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowPhoneCodePicker(false)}
          >
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
                    {phoneCode === item.code && <Ionicons name="checkmark" size={20} color="#877ED2" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={otpNoticeVisible} transparent animationType="fade" onRequestClose={handleNoticeClose}>
          <View style={styles.noticeOverlay}>
            <View style={styles.noticeCard}>
              <View style={styles.noticeAccent} />
              <View style={styles.noticeIconWrap}>
                <Ionicons
                  name={otpNoticeType === 'success' ? 'checkmark-circle' : otpNoticeType === 'error' ? 'alert-circle' : 'mail-outline'}
                  size={28}
                  color="#877ED2"
                />
              </View>
              <Text style={styles.noticeTitle}>{otpNoticeTitle}</Text>
              <Text style={styles.noticeMessage}>{otpNoticeMessage}</Text>
              <TouchableOpacity style={styles.noticeButton} onPress={handleNoticeClose}>
                <Text style={styles.noticeButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // ─── Root ──────────────────────────────────────────────────────────────────
  if (mode === 'scan') {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {renderScanner()}
      </View>
    );
  }

  if (mode === 'register') {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#877ED2" />
        {renderRegistrationForm()}
      </View>
    );
  }

  // Manual mode: purple header with rounded bottom edges, light gray body
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
      <StatusBar barStyle="light-content" backgroundColor="#877ED2" />
      {/* Purple header area with rounded bottom */}
      <View style={{ backgroundColor: '#877ED2', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        {/* Safe area top */}
        <View style={{ height: insets.top }} />
        {/* Header row */}
        <View style={styles.manualHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Body - light gray background */}
      <View style={{ flex: 1 }}>
        {renderManualEntry()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Scanner ────────────────────────────────────────────────
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayTop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#6B8CFF',
  },
  topLeft:     { top: 0,    left: 0,  borderTopWidth: 3,    borderLeftWidth: 3 },
  topRight:    { top: 0,    right: 0, borderTopWidth: 3,    borderRightWidth: 3 },
  bottomLeft:  { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(255,70,70,0.85)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 52,
  },
  bottomTopSection: {
    alignItems: 'center',
    gap: 12,
  },
  scanInstruction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  scannedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(135,126,210,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  scannedText: {
    color: '#877ED2',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomButtonSection: {
    width: '100%',
    alignItems: 'center',
  },
  orText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 14,
  },
  enterManuallyButton: {
    width: '100%',
    backgroundColor: '#877ED2',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#877ED2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  enterManuallyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ─── Overlaid scanner header ─────────────────────────────────
  overlaidHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ─── Manual mode header ──────────────────────────────────────
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },

  // ─── Manual entry body ───────────────────────────────────────
  manualEntryContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',   // light gray background like screenshot
  },
  topArea: {
    flex: 1,                        // grows to fill space above the card
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dismissButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(180,180,180,0.5)',  // subtle gray tint on light background
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── White bottom-sheet card ─────────────────────────────────
  codeEntryCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  codeEntryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  codeEntrySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },

  // ─── OTP digit inputs ────────────────────────────────────────
  digitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  digitInput: {
    // 10 digits: flex them evenly with small gap
    flex: 1,
    marginHorizontal: 3,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F7F7',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
  },
  digitInputFilled: {
    borderColor: '#877ED2',
    backgroundColor: '#fff',
  },
  digitInputActive: {
    borderColor: '#877ED2',
    borderWidth: 2,
    backgroundColor: '#fff',
  },

  // ─── Buttons ─────────────────────────────────────────────────
  verifyButton: {
    backgroundColor: '#9E95D4',   // lighter purple matching screenshot's muted tone
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonDisabled: {
    opacity: 0.65,
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  scanQRButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#877ED2',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scanQRButtonText: {
    color: '#877ED2',
    fontWeight: '600',
    fontSize: 16,
  },

  // ─── Permission fallback ──────────────────────────────────────
  permissionContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },

  // ─── Org join form ────────────────────────────────────────────
  card: { margin: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  label: { fontSize: 14, color: '#333', marginTop: 10, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  link: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#877ED2', fontWeight: '600' },

  // ─── Registration Form Styles ────────────────────────────────
  registerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  registerHeader: {
    backgroundColor: '#877ED2',
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  registerContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  registerContentInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#333',
  },
  emailInputContainer: {
    flex: 1,
    position: 'relative',
  },
  sendOtpButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendOtpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  phoneCodeButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCodeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  phoneInputContainer: {
    flex: 1,
    position: 'relative',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  passwordHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
  },
  passwordStrength: {
    fontSize: 12,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#877ED2',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#877ED2',
  },
  termsText: {
    fontSize: 14,
    color: '#333',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F5F5F5',
  },
  createAccountButton: {
    backgroundColor: '#877ED2',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#877ED2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  createAccountButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  // ─── Modal Styles ────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#F8F6FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#877ED2',
    fontWeight: '600',
  },
  noticeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noticeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noticeAccent: {
    width: '100%',
    height: 6,
    backgroundColor: '#877ED2',
    marginBottom: 18,
  },
  noticeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  noticeMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6A6D73',
    textAlign: 'center',
    marginBottom: 20,
  },
  noticeButton: {
    minWidth: 132,
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── OTP Verification Styles ─────────────────────────────────
  otpVerifyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#333',
    letterSpacing: 2,
  },
  verifyOtpButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyOtpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputVerified: {
    borderColor: '#877ED2',
    backgroundColor: '#F3F0FF',
  },
  verifiedIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
});