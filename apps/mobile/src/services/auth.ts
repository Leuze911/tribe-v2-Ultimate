import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import type { AuthTokens, LoginCredentials, RegisterData, User } from '../types';

// Cross-platform storage: use localStorage on web, AsyncStorage on native
const storage = {
  async setItem(key: string, value: string) {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Storage setItem error:', e);
    }
  },
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Storage getItem error:', e);
      return null;
    }
  },
  async removeItem(key: string) {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Storage removeItem error:', e);
    }
  },
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('🔐 Attempting login for:', credentials.email);
    const response = await api.post('/auth/login', credentials);
    console.log('🔐 Login response received');
    const { user, accessToken } = response.data;

    await storage.setItem('accessToken', accessToken);
    console.log('🔐 Token stored successfully');

    return { user, tokens: { accessToken } };
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('📝 Attempting registration for:', data.email);
    const response = await api.post('/auth/register', data);
    console.log('📝 Registration response received');
    const { user, accessToken } = response.data;

    await storage.setItem('accessToken', accessToken);
    console.log('📝 Token stored successfully');

    return { user, tokens: { accessToken } };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: { fullName?: string; phone?: string; avatarUrl?: string }): Promise<User> {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const response = await api.delete('/auth/account');
    await storage.removeItem('accessToken');
    await storage.removeItem('refreshToken');
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  async checkAuth(): Promise<User | null> {
    const token = await storage.getItem('accessToken');
    if (!token) return null;

    try {
      return await this.getProfile();
    } catch {
      return null;
    }
  },
};

export default authService;
