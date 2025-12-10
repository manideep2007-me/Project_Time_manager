import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Edit profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.are_you_sure_logout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleEditProfile = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert(t('common.error'), t('profile.first_last_name_required'));
      return;
    }

    if (!editEmail.trim() || !editEmail.includes('@')) {
      Alert.alert(t('common.error'), t('profile.valid_email_required'));
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/api/employees/${user?.id}`, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email: editEmail.trim(),
      });

      setShowEditModal(false);
      Alert.alert(t('common.success'), t('profile.profile_updated_success'));
      
      // Optionally logout user to refresh data
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('profile.failed_to_update_profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(t('profile.change_password'), t('profile.change_password_coming_soon'));
  };

  const handleSettings = () => {
    Alert.alert(t('profile.settings'), t('profile.settings_coming_soon'));
  };

  const handleHelp = () => {
    Alert.alert(t('profile.help_support'), t('profile.help_support_coming_soon'));
  };

  const handleAbout = () => {
    Alert.alert(t('profile.about'), t('profile.about_app'));
  };

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <Text style={styles.profileItemIcon}>{icon}</Text>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        {rightElement || (showArrow && <Text style={styles.arrow}>›</Text>)}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaWrapper backgroundColor="#f8f9fa">
      <ScrollView style={styles.scrollContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Employment Details (Employees only) */}
      {user?.role === 'employee' && (
        <View style={styles.section}>
          <SectionHeader title={t('profile.employment_details')} />
          <Card style={styles.sectionCard}>
            <View style={styles.profileItem}>
              <View style={styles.profileItemLeft}>
                <Text style={styles.profileItemIcon}>💼</Text>
                <View style={styles.profileItemText}>
                  <Text style={styles.profileItemTitle}>{t('profile.role')}</Text>
                  <Text style={styles.profileItemSubtitle}>{user?.jobTitle || 'Employee'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileItem}>
              <View style={styles.profileItemLeft}>
                <Text style={styles.profileItemIcon}>💰</Text>
                <View style={styles.profileItemText}>
                  <Text style={styles.profileItemTitle}>{t('employees.monthly_salary')}</Text>
                  <Text style={styles.profileItemSubtitle}>
                    ₹ {((user?.salaryMonthly || 0)).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Account Section */}
      <View style={styles.section}>
        <SectionHeader title="Account" />
        <Card style={styles.sectionCard}>
          <ProfileItem
            icon="👤"
            title="Personal Information"
            subtitle="Update your personal details"
            onPress={handleEditProfile}
          />
          <ProfileItem
            icon="🔒"
            title="Change Password"
            subtitle="Update your password"
            onPress={handleChangePassword}
          />
          <ProfileItem
            icon="📧"
            title="Email Settings"
            subtitle="Manage email notifications"
            onPress={handleSettings}
          />
          <ProfileItem
            icon="📍"
            title="My Location"
            subtitle="View and track your current location"
            onPress={() => navigation.navigate('Location')}
          />
        </Card>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <SectionHeader title="Preferences" />
        <Card style={styles.sectionCard}>
          <ProfileItem
            icon="🔔"
            title="Notifications"
            subtitle="Manage notification settings"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                thumbColor={notificationsEnabled ? '#fff' : '#fff'}
              />
            }
            showArrow={false}
          />
          <ProfileItem
            icon="🌙"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                thumbColor={darkModeEnabled ? '#fff' : '#fff'}
              />
            }
            showArrow={false}
          />
        </Card>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <SectionHeader title="Support" />
        <Card style={styles.sectionCard}>
          <ProfileItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={handleHelp}
          />
          <ProfileItem
            icon="📋"
            title="Terms of Service"
            subtitle="View terms and conditions"
            onPress={() => Alert.alert(t('profile.terms_of_service'), t('profile.terms_of_service_coming_soon'))}
          />
          <ProfileItem
            icon="🔒"
            title="Privacy Policy"
            subtitle="View privacy policy"
            onPress={() => Alert.alert(t('profile.privacy_policy'), t('profile.privacy_policy_coming_soon'))}
          />
          <ProfileItem
            icon="ℹ️"
            title="About"
            subtitle="App version and information"
            onPress={handleAbout}
          />
        </Card>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <Card style={styles.sectionCard}>
          <ProfileItem
            icon="🚪"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showArrow={false}
          />
        </Card>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 Project Time Manager</Text>
      </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  editButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageSwitcherContainer: {
    paddingVertical: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  profileItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#99c9ff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});