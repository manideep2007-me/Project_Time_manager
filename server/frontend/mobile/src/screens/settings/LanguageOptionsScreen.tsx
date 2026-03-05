import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@app_language';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export default function LanguageOptionsScreen() {
  const { i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) setSelectedLanguage(storedLanguage);
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const handleChange = async () => {
    try {
      await changeLanguage(selectedLanguage);
      navigation.goBack();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleClose = () => navigation.goBack();

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Floating close button */}
      <View style={styles.closeButtonRow}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color="#555555" />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
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

        <TouchableOpacity style={styles.changeButton} onPress={handleChange} activeOpacity={0.8}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
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
