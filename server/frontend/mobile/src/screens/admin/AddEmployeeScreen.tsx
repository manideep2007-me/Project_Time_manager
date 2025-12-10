import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/shared/Card';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import AppHeader from '../../components/shared/AppHeader';

type EmploymentType = 'Permanent' | 'Temp.' | 'Contract';
type PayCalc = 'hourly' | 'daily' | 'monthly';

export default function AddEmployeeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [saving, setSaving] = useState(false);

  // Personal
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDob, setShowDob] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Compliance
  const [aadhaar, setAadhaar] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [aadhaarFileAdded] = useState(false);

  // Employment & Pay
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [showJoining, setShowJoining] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Permanent');
  const [payCalc, setPayCalc] = useState<PayCalc>('monthly');
  const [payAmount, setPayAmount] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const validate = () => {
    const errors: string[] = [];
    if (!firstName.trim()) errors.push('First Name');
    if (!lastName.trim()) errors.push('Last Name');
    if (email && (!email.includes('@') || !email.includes('.'))) errors.push('Valid Email');
    if (!joiningDate) errors.push('Joining Date');
    if (payCalc === 'hourly') {
      if (!hourlyRate || isNaN(Number(hourlyRate))) errors.push('Hourly Rate');
    } else {
      if (!payAmount || isNaN(Number(payAmount))) errors.push('Pay Amount');
    }
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
      const employeeId = `EMP-${Date.now()}`;

      const payload: any = {
        employeeId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        salutation: salutation.trim() || undefined,
        dateOfBirth: dob ? dob.toISOString().split('T')[0] : undefined,
        joiningDate: joiningDate ? joiningDate.toISOString().split('T')[0] : undefined,
        employmentType: employmentType,
        aadhaarNumber: aadhaar.trim() || undefined,
        salaryType: payCalc,
        salaryAmount: payCalc === 'hourly' ? Number(hourlyRate) : Number(payAmount),
        hourlyRate: payCalc === 'hourly' ? Number(hourlyRate) : undefined,
      };

      // Create the employee first
      const createRes = await api.post('/api/employees', payload);
      const newEmployeeId = createRes.data?.employee?.id;

      // If a photo is selected, upload it
      if (newEmployeeId && photoUri) {
        const formData = new FormData();
        const filename = photoUri.split('/').pop() || `employee-${newEmployeeId}.jpg`;
        const file: any = { uri: photoUri, name: filename, type: 'image/jpeg' };
        formData.append('photo', file);
        await api.post(`/api/employees/${newEmployeeId}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      Alert.alert('Success', 'Employee saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error('Save employee failed:', e);
      let msg = 'Failed to save employee.';
      if (e?.response?.data?.error) msg = e.response.data.error;
      if (e?.response?.data?.details?.length) {
        msg += `\n\n${e.response.data.details.map((d: any) => `• ${d.msg} (${d.path})`).join('\n')}`;
      }
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('employees.add_employee')}</Text>
          <Text style={styles.subtitle}>{t('employees.enter_employee_info')}</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.section}>Personal & Contact</Text>
          <View style={styles.group}>
            <Text style={styles.label}>Salutation</Text>
            <TextInput style={styles.input} value={salutation} onChangeText={setSalutation} placeholder="Mr., Ms., Dr." placeholderTextColor="#999" />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('auth.first_name')} *</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder={t('auth.first_name')} placeholderTextColor="#999" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('auth.last_name')} *</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder={t('auth.last_name')} placeholderTextColor="#999" />
            </View>
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDob(true)}>
              <Text style={styles.dateTxt}>{dob ? dob.toLocaleDateString('en-US') : t('common.select_date')}</Text>
              <Text>📅</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>{t('auth.phone_number')}</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('auth.enter_phone')} placeholderTextColor="#999" keyboardType="phone-pad" />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>{t('auth.email')} *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={t('auth.enter_email')} placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Compliance & Attachments</Text>
          <View style={styles.group}>
            <Text style={styles.label}>Photo</Text>
            {photoUri ? (
              <View style={styles.photoRow}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={[styles.uploadBtn, { marginLeft: 12 }]}
                  onPress={() => setPhotoUri(null)}
                >
                  <Text style={styles.uploadTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={async () => {
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
                }}
              >
                <Text style={styles.uploadTxt}>Pick a photo</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Aadhaar No</Text>
            <TextInput style={styles.input} value={aadhaar} onChangeText={setAadhaar} placeholder="Enter Aadhaar number" placeholderTextColor="#999" />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Aadhaar - Attach</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => Alert.alert('Upload', 'Aadhaar attachment upload coming soon')}>
              <Text style={styles.uploadTxt}>{aadhaarFileAdded ? 'File added' : 'Upload document'}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Employment & Pay</Text>
          <View style={styles.group}>
            <Text style={styles.label}>Joining Date *</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowJoining(true)}>
              <Text style={styles.dateTxt}>{joiningDate ? joiningDate.toLocaleDateString('en-US') : t('common.select_date')}</Text>
              <Text>📅</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Employment Type</Text>
            <View style={styles.pillsRow}>
              {(['Permanent','Temp.','Contract'] as EmploymentType[]).map(type => (
                <TouchableOpacity key={type} style={[styles.pill, employmentType === type && styles.pillSelected]} onPress={() => setEmploymentType(type)}>
                  <Text style={[styles.pillTxt, employmentType === type && styles.pillTxtSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Pay Calculated</Text>
            <View style={styles.pillsRow}>
              {(['hourly','daily','monthly'] as PayCalc[]).map(type => (
                <TouchableOpacity key={type} style={[styles.pill, payCalc === type && styles.pillSelected]} onPress={() => setPayCalc(type)}>
                  <Text style={[styles.pillTxt, payCalc === type && styles.pillTxtSelected]}>{type === 'hourly' ? 'Hourly Rate' : type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {payCalc === 'hourly' ? (
            <View style={styles.group}>
              <Text style={styles.label}>Hourly Rate *</Text>
              <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} placeholder="Enter hourly rate" placeholderTextColor="#999" keyboardType="numeric" />
            </View>
          ) : (
            <View style={styles.group}>
              <Text style={styles.label}>Pay - Amount *</Text>
              <TextInput style={styles.input} value={payAmount} onChangeText={setPayAmount} placeholder="Enter pay amount" placeholderTextColor="#999" keyboardType="numeric" />
            </View>
          )}
        </Card>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelTxt}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveTxt}>{t('common.save')} {t('employees.employees')}</Text>}
          </TouchableOpacity>
        </View>

        {showDob && (
          <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={(e, d) => { setShowDob(false); if (d) setDob(d); }} />
        )}
        {showJoining && (
          <DateTimePicker value={joiningDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowJoining(false); if (d) setJoiningDate(d); }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e1e5e9' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  card: { margin: 16, padding: 20 },
  section: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  group: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1a1a1a', backgroundColor: '#fff' },
  dateBtn: { borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateTxt: { fontSize: 16, color: '#1a1a1a' },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  pillSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  pillTxt: { fontSize: 12, fontWeight: '600', color: '#666' },
  pillTxtSelected: { color: '#fff' },
  uploadBtn: { backgroundColor: '#F2F2F7', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  uploadTxt: { fontSize: 14, color: '#1a1a1a' },
  photoRow: { flexDirection: 'row', alignItems: 'center' },
  photoPreview: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E5E5EA' },
  actionsRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32 },
  cancelBtn: { flex: 1, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  cancelTxt: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveBtn: { flex: 1, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveTxt: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

