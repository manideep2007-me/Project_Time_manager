import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';

// Onboarding landing screen redesigned to match the provided mock
export default function OnboardingChoiceScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.screen}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft} />
          <LanguageSwitcher
            renderTrigger={(open) => (
              <TouchableOpacity onPress={open} style={styles.menuButton} activeOpacity={0.8}>
                <Ionicons name="ellipsis-vertical" size={22} color="#000000" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.welcome}>{t('onboarding.welcome')}</Text>
          <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
          <Text style={styles.lead}>{t('onboarding.get_started')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('onboarding.organization_owner')}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('RegisterOrganization')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>{t('onboarding.create_organization')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>{t('onboarding.or')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('onboarding.team_member')}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ScanOrganization')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>{t('onboarding.scan_qr_join')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('onboarding.already_have_account')}</Text>
          <TouchableOpacity onPress={() => navigation.replace('Auth')} activeOpacity={0.8}>
            <Text style={styles.loginLink}>{t('onboarding.log_in')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const PRIMARY = '#7A6AC8';
const TEXT = '#333333';
const MUTED = '#666666';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 44,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 22,
  },
  welcome: {
    fontSize: 40,
    fontWeight: '800',
    color: '#574ABF',
    textAlign: 'center',
    fontFamily: 'Inter_800ExtraBold',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6256C4',
    marginTop: 2,
    textAlign: 'center',
  },
  lead: {
    fontSize: 14,
    color: '#404040',
    marginTop: 14,
    marginBottom: 80,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  section: {
    alignItems: 'center',
    width: '100%',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#404040',
    marginBottom: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#877ED2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  orText: {
    textAlign: 'center',
    color: '#404040',
    fontWeight: '400',
    fontSize: 14,
    fontFamily: 'Inter_400Medium',
    marginVertical: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 100,
  },
  footerText: {
    color: '#404040',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  loginLink: {
    color: '#877ED2',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
});