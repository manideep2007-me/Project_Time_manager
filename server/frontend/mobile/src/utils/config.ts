type AppConfig = {
  apiBaseUrl: string;
};

export function getConfig(): AppConfig {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return { apiBaseUrl: explicit };

  // Android emulator maps host loopback to 10.0.2.2
  return { apiBaseUrl: 'http://10.0.2.2:5000' };
}

export const API_BASE_URL = getConfig().apiBaseUrl;

console.log('📡 API Base URL configured:', API_BASE_URL);
