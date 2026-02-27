import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { register as registerApi } from '../../api/endpoints';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';

export default function RegisterScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const organizationCode = route?.params?.organizationCode;
  const organizationName = route?.params?.organizationName;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('auth.first_name') + ' ' + t('common.error').toLowerCase();
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('auth.last_name') + ' ' + t('common.error').toLowerCase();
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.email') + ' ' + t('common.error').toLowerCase();
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = t('auth.password') + ' ' + t('common.error').toLowerCase();
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerApi({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        organizationCode: organizationCode, // Pass organization code if available
        role: 'employee', // Default to employee role for QR code registrations
      });
      
      // Show success message and navigate to login screen
      Alert.alert(
        'Success', 
        'Account created successfully! Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
    } catch (e: any) {
      console.error('Registration error details:', e);
      const errorMessage = e.response?.data?.error || e.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>⏱️</Text>
            <Text style={styles.appName}>Project Manager</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>{t('auth.create_account')}</Text>
            {organizationName && (
              <Text style={styles.orgText}>Joining: {organizationName}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Input
                  label={t('auth.first_name')}
                  placeholder={t('auth.first_name')}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  error={errors.firstName}
                />
              </View>
              <View style={styles.nameInput}>
                <Input
                  label={t('auth.last_name')}
                  placeholder={t('auth.last_name')}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  error={errors.lastName}
                />
              </View>
            </View>

            <Input
              label={t('auth.email')}
              placeholder={t('auth.email')}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.password')}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={true}
              error={errors.password}
            />

            <Input
              label={t('auth.confirm_password')}
              placeholder={t('auth.confirm_password')}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={true}
              error={errors.confirmPassword}
            />
          </View>

          <View style={styles.registerButton}>
            <Button
              title={t('auth.create_account')}
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.already_have_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('auth.sign_in')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#877ED2',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingVertical: 40,
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orgText: {
    fontSize: 14,
    color: '#877ED2',
    marginTop: 8,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  registerButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  loginLink: {
    fontSize: 16,
    color: '#877ED2',
    fontWeight: '600',
  },
});
