import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { changeLanguage } from '../../i18n';

type TriggerRenderer = (open: () => void) => React.ReactNode;

interface LanguageSwitcherProps {
  renderTrigger?: TriggerRenderer;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export default function LanguageSwitcher({ renderTrigger }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  // Use i18n.language directly to always reflect current language
  const currentLanguage = i18n.language || 'en';

  // Sync with i18n language changes
  useEffect(() => {
    // This will cause re-render when language changes
    const handleLanguageChanged = () => {
      // Force re-render by updating component
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Reset selected language when modal opens
  useEffect(() => {
    if (modalVisible) {
      setSelectedLanguage(currentLanguage);
    }
  }, [modalVisible, currentLanguage]);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = async () => {
    try {
      await changeLanguage(selectedLanguage);
      setModalVisible(false);
      // Language change will trigger re-render via useTranslation hook
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), 'Failed to change language. Please try again.');
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const openModal = () => setModalVisible(true);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openModal)
      ) : (
        <TouchableOpacity
          style={styles.switcherButton}
          onPress={openModal}
        >
          <Ionicons name="language" size={20} color="#007AFF" />
          <Text style={styles.switcherText}>{currentLang.nativeName}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Change Language</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <View style={styles.closeCircle}>
                  <Ionicons name="close" size={18} color="#666" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Language Options */}
            <View style={styles.languageList}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={styles.languageItem}
                  onPress={() => handleLanguageSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemContent}>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    selectedLanguage === language.code && styles.checkboxSelected
                  ]}>
                    {selectedLanguage === language.code && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Change Button */}
            <TouchableOpacity style={styles.changeButton} onPress={handleConfirm}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  switcherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  languageItemContent: {
    flex: 1,
  },
  languageNative: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    fontFamily: 'Inter_500Medium',
  },
  languageName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#877ED2',
    borderColor: '#877ED2',
  },
  changeButton: {
    backgroundColor: '#877ED2',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

