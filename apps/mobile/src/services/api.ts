import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Cross-platform token storage helper
const getToken = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error('Error getting token:', e);
    return null;
  }
};

const setToken = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (e) {
    console.error('Error setting token:', e);
  }
};

const removeToken = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Error removing token:', e);
  }
};

// Get the API URL from environment variable
const API_URL = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1`;

// Log the API URL for debugging
console.log('🔌 API URL configured:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request logging
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 Request error:', error.message);
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`📥 Error: ${error.message}`, error.config?.url);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
// Note: Backend uses 24h tokens without refresh - on 401, user must re-login
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear tokens
      // The app will detect this and redirect to login
      await removeToken('accessToken');
      console.log('🔐 Token invalid/expired - cleared');
    }
    return Promise.reject(error);
  }
);

export default api;
