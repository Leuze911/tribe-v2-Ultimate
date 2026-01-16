import * as SecureStore from 'expo-secure-store';
import api from './api';
import type { AuthTokens, LoginCredentials, RegisterData, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/login', credentials);
    const { user, accessToken, refreshToken } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return { user, tokens: { accessToken, refreshToken } };
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/register', data);
    const { user, accessToken, refreshToken } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return { user, tokens: { accessToken, refreshToken } };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async checkAuth(): Promise<User | null> {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return null;

    try {
      return await this.getProfile();
    } catch {
      return null;
    }
  },
};

export default authService;
