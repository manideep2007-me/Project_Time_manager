import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Modal, Alert, Platform, ScrollView } from 'react-native';
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
  const currentLanguage = i18n.language || 'en';

  useEffect(() => {
    const handleLanguageChanged = () => {};
    i18n.on('languageChanged', handleLanguageChanged);
    return () => { i18n.off('languageChanged', handleLanguageChanged); };
  }, [i18n]);

  useEffect(() => {
    if (modalVisible) setSelectedLanguage(currentLanguage);
  }, [modalVisible, currentLanguage]);

  const handleConfirm = async () => {
    try {
      await changeLanguage(selectedLanguage);
      setModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), 'Failed to change language. Please try again.');
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openModal)
      ) : (
        <TouchableOpacity style={styles.switcherButton} onPress={openModal}>
          <Ionicons name="language" size={20} color="#877ED2" />
          <Text style={styles.switcherText}>{currentLang.nativeName}</Text>
          <Ionicons name="chevron-down" size={16} color="#877ED2" />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          {/* Floating close button */}
          <View style={styles.closeButtonRow}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#555555" />
            </TouchableOpacity>
          </View>

          {/* Bottom sheet */}
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
            <Text style={styles.title}>Change Language</Text>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.languageList}>
                {languages.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.languageRow, isSelected && styles.languageRowSelected]}
                      onPress={() => setSelectedLanguage(lang.code)}
                      activeOpacity={0.7}
                    >
                      {isSelected && <View style={styles.leftAccent} />}
                      <View style={[styles.languageTexts, !isSelected && styles.languageTextsNoAccent]}>
                        <Text style={[styles.nativeName, isSelected && styles.nativeNameSelected]}>
                          {lang.nativeName}
                        </Text>
                        <Text style={styles.englishName}>{lang.name}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.changeButton} onPress={handleConfirm} activeOpacity={0.8}>
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
    color: '#877ED2',
  },

  /* Overlay */
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  /* Floating X */
  closeButtonRow: {
    alignItems: 'flex-end',
    paddingRight: 24,
    marginBottom: -20,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },

  /* Sheet */
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },

  /* Language list */
  languageList: {
    gap: 12,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  languageRowSelected: {
    borderColor: '#E5E5E5',
  },
  leftAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#877ED2',
  },
  languageTexts: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 14,
  },
  languageTextsNoAccent: {
    paddingLeft: 18,
  },
  nativeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  nativeNameSelected: {
    color: '#574ABF',
  },
  englishName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#999999',
    marginTop: 3,
  },

  /* Checkbox */
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxSelected: {
    backgroundColor: '#6C63AC',
    borderColor: '#6C63AC',
  },

  /* Change Button */
  changeButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

