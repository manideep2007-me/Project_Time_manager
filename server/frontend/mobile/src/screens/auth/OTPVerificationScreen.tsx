import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import otpService from '../../services/otpService';
import Button from '../../components/shared/Button';

interface OTPVerificationScreenProps {
  route?: {
    params?: {
      phoneNumber?: string;
      userRole?: 'manager' | 'employee';
    };
  };
}

export default function OTPVerificationScreen({ route }: OTPVerificationScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { phoneNumber, userRole = 'employee' } = route?.params || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    startTimer();
    return () => {
      // Cleanup timer
    };
  }, []);

  const startTimer = () => {
    setTimer(otpService.getRemainingTime(phoneNumber || '') || 300); // 5 minutes default
    setCanResend(false);
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await otpService.verifyOTP(phoneNumber || '', otpToVerify);
      
      if (result.success) {
        // OTP verified successfully
        Alert.alert(
          'Success!',
          'Phone number verified successfully',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to appropriate screen based on role
                // For now, we'll use mock login
                navigation.navigate('Login', { 
                  verifiedPhone: phoneNumber,
                  userRole 
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.message);
        // Clear OTP on failure
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const result = await otpService.resendOTP(phoneNumber || '');
      
      if (result.success) {
        Alert.alert('OTP Sent', result.message);
        startTimer(); // Restart timer
        setOtp(['', '', '', '', '', '']); // Clear OTP fields
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('auth.verify_otp')}</Text>
        </View>

        {/* Phone Number Display */}
        <View style={styles.phoneContainer}>
          <View style={styles.phoneDisplayWrapper}>
            <Text style={styles.flagIcon}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
            <Text style={styles.phoneNumber}>{(phoneNumber || '').replace(/\D/g, '')}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {t('auth.enter_otp')}
        </Text>

        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Timer */}
        {timer > 0 && (
          <Text style={styles.timer}>
            {t('auth.resend_otp')} {formatTime(timer)}
          </Text>
        )}

        {/* Verify Button */}
        <View style={styles.verifyButton}>
          <Button
            title={loading ? t('common.loading') : t('auth.verify_otp')}
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.some(digit => digit === '')}
          />
        </View>
        
        {/* Resend Button */}
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={!canResend || resendLoading}
          style={[
            styles.resendButton,
            (!canResend || resendLoading) && styles.resendButtonDisabled
          ]}
        >
          {resendLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[
              styles.resendButtonText,
              (!canResend || resendLoading) && styles.resendButtonTextDisabled
            ]}>
              {t('auth.resend_otp')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#8E8E93" />
          <Text style={styles.helpText}>
            {t('auth.otp_sent')}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  phoneDisplayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  flagIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  timer: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  verifyButton: {
    marginBottom: 20,
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: '#8E8E93',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
});
