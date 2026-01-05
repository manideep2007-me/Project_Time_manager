import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';
import Card from '../../components/shared/Card';
import QRCode from 'react-native-qrcode-svg';

export default function OrganizationQRCodeScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { code, name, uniqueId, adminEmail, adminPassword } = route.params || {};
  const [showPassword, setShowPassword] = useState(false);
  const payload = code; // simple payload; could be URL like https://app/join/<code>

  const handleGoToLogin = () => {
    // Navigate to the Auth stack which shows the Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <SafeAreaWrapper>
      <AppHeader />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>Organization Successfully Created!</Text>
          <Text style={styles.subtitle}>Organization: {name}</Text>
          {uniqueId && <Text style={styles.uniqueIdText}>Unique ID: {uniqueId}</Text>}
          
          <Text style={styles.instruction}>Share this QR code with your employees</Text>
          
          <View style={styles.qrWrap}>
            <QRCode value={payload} size={220} backgroundColor="#fff" color="#111" />
          </View>
          <Text style={styles.codeText}>Join Code: {code}</Text>
          <Text style={styles.note}>Employees can scan this QR code or enter the join code manually</Text>
          
          {/* Admin credentials display */}
          <View style={styles.credentialsBox}>
            <View style={styles.credentialsHeader}>
              <Ionicons name="key" size={20} color="#877ED2" />
              <Text style={styles.credentialsTitle}>Admin Login Credentials</Text>
            </View>
            
            <View style={styles.credentialRow}>
              <Text style={styles.credentialLabel}>Email:</Text>
              <Text style={styles.credentialValue}>{adminEmail || 'N/A'}</Text>
            </View>
            
            <View style={styles.credentialRow}>
              <Text style={styles.credentialLabel}>Password:</Text>
              <View style={styles.passwordRow}>
                <Text style={styles.credentialValue}>
                  {showPassword ? (adminPassword || 'N/A') : '••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={18} 
                    color="#877ED2" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.credentialsNote}>
              Save these credentials! You'll need them to login.
            </Text>
          </View>
          
          {/* Go to Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Card>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, padding: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#007AFF', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#333', marginBottom: 4, fontWeight: '600' },
  uniqueIdText: { fontSize: 14, color: '#666', marginBottom: 16, fontWeight: '500' },
  instruction: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  qrWrap: { padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 12 },
  codeText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#007AFF', marginBottom: 8 },
  note: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  credentialsBox: { 
    backgroundColor: '#F8F7FF', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E6F5',
    width: '100%',
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  credentialsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#877ED2',
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialLabel: {
    fontSize: 14,
    color: '#666',
    width: 75,
    fontWeight: '500',
  },
  credentialValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  credentialsNote: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#877ED2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
