import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { changeLanguage } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@app_language';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function LanguageOptionsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिंदी',
      flag: '🇮🇳',
    },
    {
      code: 'te',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      flag: '🇮🇳',
    },
    {
      code: 'ta',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      flag: '🇮🇳',
    },
    {
      code: 'kn',
      name: 'Kannada',
      nativeName: 'ಕನ್ನಡ',
      flag: '🇮🇳',
    },
    {
      code: 'ml',
      name: 'Malayalam',
      nativeName: 'മലയാളം',
      flag: '🇮🇳',
    },
  ];

  useEffect(() => {
    // Load the current language preference
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
          setSelectedLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setSelectedLanguage(languageCode);
      
      Alert.alert(
        'Language Changed',
        'Your language preference has been updated successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language. Please try again.');
    }
  };

  return (
    <SafeAreaWrapper backgroundColor="#F5F5F5">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language Option</Text>
      </View>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Select your preferred language for the app
          </Text>
        </View>

        {/* Language List */}
        <View style={styles.languageListContainer}>
          {languages.map((language, index) => {
            const isSelected = selectedLanguage === language.code;
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  index < languages.length - 1 && styles.languageItemBorder,
                  isSelected && styles.languageItemSelected,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.6}
              >
                <View style={styles.languageInfo}>
                  <View style={styles.languageFlagContainer}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                  </View>
                  <View style={styles.languageTextContainer}>
                    <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                      {language.name}
                    </Text>
                    <Text style={[styles.languageNativeName, isSelected && styles.languageNativeNameSelected]}>
                      {language.nativeName}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#877ED2" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Current Language Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={18} color="#877ED2" />
          <Text style={styles.infoText}>
            Changes will take effect immediately
          </Text>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    marginLeft: 4,
  },

  // Description
  descriptionContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontWeight: '400',
  },

  // Language List
  languageListContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 72,
  },
  languageItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageItemSelected: {
    backgroundColor: '#F8F7FC',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlagContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  languageNameSelected: {
    color: '#877ED2',
    fontWeight: '600',
  },
  languageNativeName: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
  },
  languageNativeNameSelected: {
    color: '#877ED2',
  },
  selectedIndicator: {
    marginLeft: 12,
  },

  // Info
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#F8F7FC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontWeight: '400',
  },
});
