type AppConfig = {
  apiBaseUrl: string;
};

// Your PC's local network IP - update this when your IP changes
const LAN_IP = '10.10.53.182';

// Set to true to use emulator URL (10.0.2.2), false for real device (LAN IP)
const USE_EMULATOR = false;

export function getConfig(): AppConfig {
  // Prefer explicit env variable
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return { apiBaseUrl: explicit };

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform } = require('react-native');
    
    if (Platform && Platform.OS === 'web') {
      return { apiBaseUrl: 'http://localhost:5000' };
    }
    
    if (Platform && Platform.OS === 'android') {
      if (USE_EMULATOR) {
        // Android emulator maps host loopback to 10.0.2.2
        return { apiBaseUrl: 'http://10.0.2.2:5000' };
      }
      // Real device - use LAN IP
      return { apiBaseUrl: `http://${LAN_IP}:5000` };
    }
    
    if (Platform && Platform.OS === 'ios') {
      return { apiBaseUrl: `http://${LAN_IP}:5000` };
    }
  } catch {}

  return { apiBaseUrl: `http://${LAN_IP}:5000` };
}

export const API_BASE_URL = getConfig().apiBaseUrl;

console.log('📡 API Base URL configured:', API_BASE_URL);
