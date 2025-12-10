import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import translation files
import enTranslations from '../locales/en/translation.json';
import hiTranslations from '../locales/hi/translation.json';
import teTranslations from '../locales/te/translation.json';
import taTranslations from '../locales/ta/translation.json';
import knTranslations from '../locales/kn/translation.json';
import mlTranslations from '../locales/ml/translation.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Custom language detector for React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First, try to get stored language preference
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage) {
        callback(storedLanguage);
        return;
      }
      
      // If no stored preference, use device language (expo-localization v15+)
      const primaryLocale = Localization.getLocales?.()[0];
      const localeTag = primaryLocale?.languageTag || primaryLocale?.languageCode || 'en';
      const deviceLanguage = localeTag.split('-')[0]; // Get language code (e.g., 'en' from 'en-US')
      const supportedLanguages = ['en', 'hi', 'te', 'ta', 'kn', 'ml'];
      
      // Check if device language is supported
      if (deviceLanguage && supportedLanguages.includes(deviceLanguage)) {
        callback(deviceLanguage);
      } else {
        callback('en'); // Default to English
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en'); // Fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // Removed deprecated/invalid compatibilityJSON 'v3' (only 'v4' supported) – default behavior is fine
    resources: {
      en: {
        translation: enTranslations,
      },
      hi: {
        translation: hiTranslations,
      },
      te: {
        translation: teTranslations,
      },
      ta: {
        translation: taTranslations,
      },
      kn: {
        translation: knTranslations,
      },
      ml: {
        translation: mlTranslations,
      },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Helper function to change language and persist
export const changeLanguage = async (language: string) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export default i18n;

