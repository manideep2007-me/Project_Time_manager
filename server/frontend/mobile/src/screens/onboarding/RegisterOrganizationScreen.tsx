import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';
import Card from '../../components/shared/Card';
import { registerOrganization } from '../../api/endpoints';
import otp from '../../services/otpService';

export default function RegisterOrganizationScreen({ navigation }: any) {
  // Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 - Company Information
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('it');
  const [companyAddress, setCompanyAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');

  // Step 2 - Admin Credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3 - License
  const [licenceNumber, setLicenceNumber] = useState('');
  const [plan, setPlan] = useState<'trial' | 'buy'>('trial');

  // Hidden/derived
  const [maxEmployees, setMaxEmployees] = useState('50');
  const [submitting, setSubmitting] = useState(false);

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
    if (!emailVerified) {
      Alert.alert('Validation', 'Please verify email with OTP');
      return;
    }
    if (!phoneVerified) {
      Alert.alert('Validation', 'Please verify phone with OTP');
      return;
    }
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
      // Construct address combining city and country
      const fullAddress = `${companyAddress.trim()}, ${city.trim()}, ${country.trim()}`;
      // Generate licence_key (trial generates a temp key)
      const licence_key = plan === 'trial' 
        ? `TRIAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        : `LIC-${(licenceNumber || '0000').replace(/\s+/g, '').toUpperCase()}`;

      const res = await registerOrganization({ 
        name: companyName.trim(),
        address: fullAddress,
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
      navigation.replace('OrganizationQRCode', { code, name: res.organization.name, uniqueId });
    } catch (err: any) {
      console.error('Register org error:', err);
      const message = err.response?.data?.error || 'Failed to register organization';
      Alert.alert('Error', message);
    } finally { setSubmitting(false); }
  };

  // Step guards
  const canGoNextFromStep1 = companyName.trim() && industry && companyAddress.trim() && city.trim() && country.trim();
  const canGoNextFromStep2 = isValidEmail(adminEmail) && emailVerified && adminPhone.trim() && phoneVerified && adminPassword.length >= 6 && adminPassword === confirmPassword;

  // Email OTP (mock local)
  const [emailOtpGenerated, setEmailOtpGenerated] = useState('');
  const sendEmailOtp = () => {
    if (!isValidEmail(adminEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address before requesting OTP.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setEmailOtpGenerated(code);
    setEmailOtpSent(true);
    Alert.alert('Email OTP', `Your verification code is ${code}`);
  };
  const verifyEmailOtp = () => {
    if (emailOtp === emailOtpGenerated && emailOtp.length === 6) {
      setEmailVerified(true);
      Alert.alert('Success', 'Email verified');
    } else {
      setEmailVerified(false);
      Alert.alert('Invalid OTP', 'Please enter the correct code');
    }
  };

  // Phone OTP via service
  const sendPhoneOtp = async () => {
    try {
      if (!adminPhone.trim()) {
        Alert.alert('Error', 'Please enter phone number');
        return;
      }
      const res = await otp.sendOTP(adminPhone);
      if (res.success) {
        Alert.alert('Phone OTP', res.otp ? `Your verification code is ${res.otp}` : 'OTP sent to your phone');
      } else {
        Alert.alert('Error', res.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send phone OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please check your connection.');
    }
  };
  const verifyPhoneOtp = async () => {
    const res = await otp.verifyOTP(adminPhone, phoneOtp);
    if (res.success) {
      setPhoneVerified(true);
      Alert.alert('Success', 'Phone verified');
    } else {
      setPhoneVerified(false);
      Alert.alert('Invalid OTP', res.message);
    }
  };

  return (
    <SafeAreaWrapper>
      <AppHeader />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.title}>Register your Organization</Text>

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Company Information</Text>

              <Text style={styles.label}>Name of Organization *</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Acme Corp"
              />

              <Text style={styles.label}>Industry *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={industry} onValueChange={(v: string) => setIndustry(v)} style={styles.picker}>
                  <Picker.Item label="Information Technology" value="it" />
                  <Picker.Item label="Manufacturing" value="manufacturing" />
                  <Picker.Item label="Healthcare" value="healthcare" />
                  <Picker.Item label="Education" value="education" />
                  <Picker.Item label="Finance" value="finance" />
                  <Picker.Item label="Retail" value="retail" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={companyAddress}
                onChangeText={setCompanyAddress}
                placeholder="Street, Area"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Hyderabad" />

              <Text style={styles.label}>Country *</Text>
              <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="India" />

              <View style={styles.navRow}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={[styles.button, !canGoNextFromStep1 && styles.buttonDisabled]} onPress={() => setStep(2)} disabled={!canGoNextFromStep1}>
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Admin Credentials</Text>

              <Text style={styles.label}>Email *</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={adminEmail}
                  onChangeText={(t) => { setAdminEmail(t); setEmailVerified(false); }}
                  placeholder="admin@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.secondaryButton} onPress={sendEmailOtp}>
                  <Text style={styles.secondaryButtonText}>{emailOtpSent ? 'Resend OTP' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={[styles.secondaryButton, emailVerified && styles.verified]} onPress={verifyEmailOtp}>
                  <Text style={styles.secondaryButtonText}>{emailVerified ? 'Verified' : 'Verify'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Phone *</Text>
              <View style={styles.row}>
                <View style={[styles.phoneContainer, styles.inputFlex]}>
                  <View style={styles.countryCodeBox}><Text style={styles.countryCodeText}>+91</Text></View>
                  <TextInput
                    style={styles.phoneInput}
                    value={adminPhone}
                    onChangeText={(t) => { setAdminPhone(t); setPhoneVerified(false); }}
                    placeholder="9876543210"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity style={styles.secondaryButton} onPress={sendPhoneOtp}>
                  <Text style={styles.secondaryButtonText}>Send OTP</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={phoneOtp}
                  onChangeText={setPhoneOtp}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={[styles.secondaryButton, phoneVerified && styles.verified]} onPress={verifyPhoneOtp}>
                  <Text style={styles.secondaryButtonText}>{phoneVerified ? 'Verified' : 'Verify'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Password *</Text>
              <TextInput style={styles.input} value={adminPassword} onChangeText={setAdminPassword} placeholder="At least 6 characters" secureTextEntry autoCapitalize="none" />
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry autoCapitalize="none" />

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.outlineButton} onPress={() => setStep(1)}>
                  <Text style={styles.outlineButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, !canGoNextFromStep2 && styles.buttonDisabled]} onPress={() => setStep(3)} disabled={!canGoNextFromStep2}>
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>License Details</Text>

              <Text style={styles.label}>License Number {plan === 'buy' ? '*' : '(optional)'}</Text>
              <TextInput style={styles.input} value={licenceNumber} onChangeText={setLicenceNumber} placeholder="LIC-XXXX-XXXX" />

              <Text style={styles.label}>Plan</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, plan === 'trial' && styles.chipActive]} onPress={() => setPlan('trial')}>
                  <Text style={[styles.chipText, plan === 'trial' && styles.chipTextActive]}>Trial</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, plan === 'buy' && styles.chipActive]} onPress={() => setPlan('buy')}>
                  <Text style={[styles.chipText, plan === 'buy' && styles.chipTextActive]}>Buy</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.outlineButton} onPress={() => setStep(2)}>
                  <Text style={styles.outlineButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                  <Text style={styles.buttonText}>{submitting ? 'Creating...' : 'Create Organization'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Stepper */}
          <View style={styles.stepper}>
            {[1,2,3].map((n) => (
              <View key={n} style={[styles.stepCircle, step === n && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, step === n && styles.stepNumberActive]}>{n}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, padding: 16, marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#007AFF', textAlign: 'center' },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginTop: 12, 
    marginBottom: 12, 
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 6,
  },
  label: { fontSize: 14, color: '#333', marginTop: 10, marginBottom: 6, fontWeight: '500' },
  input: { 
    borderWidth: 1, 
    borderColor: '#e1e5e9', 
    borderRadius: 10, 
    padding: 12, 
    backgroundColor: '#f8f9fa',
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  inputFlex: { flex: 1 },
  secondaryButton: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e1e5e9', backgroundColor: '#fff' },
  secondaryButtonText: { fontWeight: '700', color: '#111' },
  verified: { backgroundColor: '#E6FFED', borderColor: '#34C759' },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e1e5e9', marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#007AFF22', borderColor: '#007AFF' },
  chipText: { color: '#111', fontWeight: '600' },
  chipTextActive: { color: '#007AFF' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  countryCodeBox: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e1e5e9',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    borderWidth: 0,
  },
  button: { 
    backgroundColor: '#007AFF', 
    borderRadius: 12, 
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center', 
    marginTop: 24,
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fafdfdff', fontWeight: 'bold', fontSize: 16 },
  outlineButton: { borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: '#fff' },
  outlineButtonText: { fontWeight: '700', color: '#111' },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e1e5e9', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepCircleActive: { backgroundColor: '#162cd4ff' },
  stepNumber: { fontWeight: '700', color: '#111' },
  stepNumberActive: { color: '#fff' },
});
