import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { changePassword as changePasswordApi } from '../../api/endpoints';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { logout, user } = useContext(AuthContext);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!currentPassword.trim()) return 'Current password is required';
    if (!newPassword.trim()) return 'New password is required';
    if (newPassword.trim().length < 6) return 'New password must be at least 6 characters';
    if (newPassword !== confirmPassword) return 'New password and confirm password do not match';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    try {
      setSaving(true);
      await changePasswordApi({ currentPassword, newPassword });

      Alert.alert(
        'Success',
        'Password changed. Please log in again with the same email.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await logout();
              } finally {
                // RootNavigator will render Auth stack again after logout
              }
            },
          },
        ],
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        'Failed to change password. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor="#F5F5F5">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>

      <View style={styles.container}>
        {user?.email ? (
          <Text style={styles.subtitle}>Sign-in email: {user.email}</Text>
        ) : null}

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Enter current password"
          autoCapitalize="none"
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Enter new password"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm new password"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Updating...' : 'Update Password'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    marginLeft: 6,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 18,
    height: 50,
    backgroundColor: '#877ED2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

