import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import QRCode from 'react-native-qrcode-svg';

const PRIMARY = '#877ED2';

export default function OrganizationQRCodeScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { code, name, uniqueId, adminEmail, adminPassword } = route.params || {};
  const [showPassword, setShowPassword] = useState(false);
  const payload = code;

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <SafeAreaWrapper backgroundColor={PRIMARY}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Purple Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={52} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Organization Created!</Text>
          <Text style={styles.headerSubtitle}>{name}</Text>
          {uniqueId && (
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>{uniqueId}</Text>
            </View>
          )}
        </View>

        {/* White Content Card */}
        <View style={styles.contentCard}>
          {/* QR Code Section */}
          <Text style={styles.sectionLabel}>Share this QR code with your employees</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrWrap}>
              <QRCode value={payload} size={180} backgroundColor="#fff" color="#111" />
            </View>
          </View>

          <View style={styles.joinCodeRow}>
            <Ionicons name="qr-code-outline" size={16} color={PRIMARY} />
            <Text style={styles.joinCodeLabel}>Join Code:</Text>
            <Text style={styles.joinCodeValue}>{code}</Text>
          </View>

          <Text style={styles.note}>
            Employees can scan this QR code or enter the join code manually
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Credentials Section */}
          <View style={styles.credentialsBox}>
            <View style={styles.credentialsHeader}>
              <View style={styles.credIconCircle}>
                <Ionicons name="key-outline" size={16} color={PRIMARY} />
              </View>
              <Text style={styles.credentialsTitle}>Admin Login Credentials</Text>
            </View>

            <View style={styles.credentialRow}>
              <Text style={styles.credentialLabel}>Email</Text>
              <Text style={styles.credentialValue} numberOfLines={1}>{adminEmail || 'N/A'}</Text>
            </View>

            <View style={styles.credentialDivider} />

            <View style={styles.credentialRow}>
              <Text style={styles.credentialLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <Text style={styles.credentialValue}>
                  {showPassword ? (adminPassword || 'N/A') : '••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.warningRow}>
            <Ionicons name="information-circle-outline" size={16} color="#E67E22" />
            <Text style={styles.warningText}>
              Save these credentials! You'll need them to login.
            </Text>
          </View>

          {/* Go to Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin} activeOpacity={0.85}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header
  headerSection: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  idBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Content
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrWrap: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#877ED2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  joinCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  joinCodeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  joinCodeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1,
  },
  note: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 22,
  },
  // Credentials
  credentialsBox: {
    backgroundColor: '#FAFAFE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEDF5',
    padding: 16,
    marginBottom: 12,
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  credIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EEFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  credentialsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  credentialLabel: {
    fontSize: 13,
    color: '#999',
    width: 72,
    fontWeight: '500',
  },
  credentialValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  credentialDivider: {
    height: 1,
    backgroundColor: '#EEEDF5',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#E67E22',
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
