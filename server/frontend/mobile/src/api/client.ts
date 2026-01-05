import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../utils/config';

const TOKEN_KEY = 'auth_token';

// Web-compatible storage fallback
const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore errors
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore errors
        }
      }
    };
  }
  return null;
};

export async function setStoredToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = getStorage();
    if (storage) {
      if (token) {
        storage.setItem(TOKEN_KEY, token);
      } else {
        storage.removeItem(TOKEN_KEY);
      }
      return;
    }
  }
  
  // Native platforms use SecureStore
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
}

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const storage = getStorage();
    if (storage) {
      return storage.getItem(TOKEN_KEY);
    }
    return null;
  }
  
  // Native platforms use SecureStore
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getStoredToken();
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    console.log('Request data:', config.data);
    console.log('Base URL:', config.baseURL);
    console.log('Token:', !!token);
    
    // List of endpoints that don't require authentication
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/api/organizations/register',
      '/api/organizations/resolve',
      '/api/organizations/join',
      '/api/otp/send',
      '/api/otp/verify',
      '/api/otp/resend'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    // If no token and this is not a public endpoint, reject the request
    if (!token && !isPublicEndpoint) {
      console.log('No token available, rejecting API request for offline mode');
      return Promise.reject(new Error('No authentication token available - offline mode'));
    }
    
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    // Only set Content-Type for non-FormData requests
    // Check if data exists and if it has FormData-like properties (for RN compatibility)
    const isFormData = config.data && (
      (typeof FormData !== 'undefined' && config.data instanceof FormData) ||
      (config.data && config.data._parts !== undefined) // React Native FormData check
    );
    if (!isFormData) {
      (config.headers as any)['Content-Type'] = 'application/json';
    }
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('✅ API Response:', response.status, response.config.url);
      console.log('Response data:', response.data);
      return response;
    },
    async (error) => {
      console.error('❌ API Error occurred');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);
      console.error('Full error:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received. Request details:', error.request);
        console.error('This usually means:');
        console.error('1. Backend server is not running');
        console.error('2. CORS is blocking the request');
        console.error('3. Network connectivity issue');
      } else {
        // Error in request setup
        console.error('Error setting up request:', error.message);
      }
      
      // Handle 401 Unauthorized - clear token and redirect to login
      if (error.response?.status === 401) {
        console.log('401 Unauthorized - clearing stored token');
        await setStoredToken(null);
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
}

export const api = createApiClient();
