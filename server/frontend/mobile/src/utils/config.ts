type AppConfig = {
  apiBaseUrl: string;
};

export function getConfig(): AppConfig {
  // Prefer explicit env, otherwise try to detect LAN IP for Expo device testing
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return { apiBaseUrl: explicit };

  // For web platform, use localhost (works when backend is on same machine)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform } = require('react-native');
    if (Platform && Platform.OS === 'web') {
      // On web, use localhost - backend should be running on same machine
      return { apiBaseUrl: 'http://localhost:5000' };
    }
    if (Platform && Platform.OS === 'android') {
      // Android emulator maps host loopback to 10.0.2.2
      return { apiBaseUrl: 'http://10.0.2.2:5000' };
    }
  } catch {}

  // Try to infer LAN IP at runtime from Expo manifest if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const manifest = Constants?.expoConfig || Constants?.manifest;
    const hostUri: string | undefined = Constants?.expoConfig?.hostUri || Constants?.manifest?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      const guessed = `http://${host}:5000`;
      return { apiBaseUrl: guessed };
    }
  } catch {}

  // Fallback to localhost
  return { apiBaseUrl: 'http://localhost:5000' };
}

export const API_BASE_URL = getConfig().apiBaseUrl;
