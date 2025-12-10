import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import AppHeader from '../../components/shared/AppHeader';

export default function OnboardingChoiceScreen({ navigation }: any) {
  const { t } = useTranslation();
  
  return (
    <SafeAreaWrapper>
      <AppHeader showLanguageSwitcher={true} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('common.welcome')}</Text>
        <Text style={styles.subtitle}>{t('organization.get_started')}</Text>

        <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => navigation.navigate('RegisterOrganization') }>
          <Text style={styles.buttonTextPrimary}>{t('organization.register_organization')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={() => navigation.navigate('ScanOrganization') }>
          <Text style={styles.buttonTextSecondary}>{t('organization.scan_to_link')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Auth')}>
          <Text style={styles.skipText}>{t('organization.skip_to_login')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  primary: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  secondary: { backgroundColor: '#fff', borderColor: '#e1e5e9' },
  buttonTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonTextSecondary: { color: '#111', fontWeight: '700', fontSize: 16 },
  skip: { marginTop: 8, alignItems: 'center' },
  skipText: { color: '#007AFF', fontWeight: '600' },
});
