/**
 * TRIBE v2 - Theme Store
 *
 * Manages dark/light mode theme state with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Get system color scheme
const getSystemIsDark = (): boolean => {
  return Appearance.getColorScheme() === 'dark';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: getSystemIsDark(),

      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'system' ? getSystemIsDark() : mode === 'dark';
        set({ mode, isDark });
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
        set({ mode: newMode, isDark: newMode === 'dark' });
      },
    }),
    {
      name: 'tribe-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate isDark based on stored mode
          const isDark = state.mode === 'system' ? getSystemIsDark() : state.mode === 'dark';
          state.isDark = isDark;
        }
      },
    }
  )
);

// Listen to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const state = useThemeStore.getState();
  if (state.mode === 'system') {
    useThemeStore.setState({ isDark: colorScheme === 'dark' });
  }
});

export default useThemeStore;
