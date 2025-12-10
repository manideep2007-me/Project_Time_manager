import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';
import Card from '../../components/shared/Card';
import QRCode from 'react-native-qrcode-svg';

export default function OrganizationQRCodeScreen({ route }: any) {
  const { code, name, uniqueId } = route.params || {};
  const payload = code; // simple payload; could be URL like https://app/join/<code>

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
});
