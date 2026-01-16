/**
 * TRIBE v2 - useTheme Hook
 *
 * Provides current theme colors based on dark/light mode
 */

import { useMemo } from 'react';
import { useThemeStore } from '../store/theme';
import { colors, lightTheme, darkTheme, ThemeColors } from '../utils/theme';

interface UseThemeResult {
  isDark: boolean;
  theme: ThemeColors;
  colors: typeof colors;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeResult {
  const { isDark, toggleTheme } = useThemeStore();

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  return {
    isDark,
    theme,
    colors,
    toggleTheme,
  };
}

export default useTheme;
