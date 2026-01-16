import { useEffect, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

// Required for web browser to close after auth
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  type: 'success' | 'cancel' | 'error';
  error?: string;
}

/**
 * Hook for Google OAuth authentication
 */
export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleToken(authentication.idToken);
      }
    } else if (response?.type === 'error') {
      setError('Erreur lors de la connexion Google');
      setIsLoading(false);
    }
  }, [response]);

  // Exchange Google token for our JWT
  const handleGoogleToken = async (idToken: string) => {
    try {
      setIsLoading(true);

      // Call our backend Google auth endpoint
      const res = await api.post('/auth/google/token', { idToken });

      // Store tokens
      await SecureStore.setItemAsync('accessToken', res.data.accessToken);
      if (res.data.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
      }

      setIsLoading(false);
      return { type: 'success' as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setIsLoading(false);
      return { type: 'error' as const, error: message };
    }
  };

  // Start Google sign in
  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!request) {
        throw new Error('Google auth not initialized');
      }

      const result = await promptAsync();

      if (result.type === 'cancel') {
        setIsLoading(false);
        return { type: 'cancel' };
      }

      // Response is handled by useEffect
      return { type: 'success' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setIsLoading(false);
      return { type: 'error', error: message };
    }
  }, [request, promptAsync]);

  return {
    signInWithGoogle,
    isLoading,
    error,
    isReady: !!request,
  };
}
