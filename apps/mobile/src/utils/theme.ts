export const colors = {
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  secondary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  yellow: {
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  orange: {
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
  },
  purple: {
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
  },
  white: '#FFFFFF',
  black: '#000000',
};

// Light mode semantic colors
export const lightTheme = {
  background: colors.gray[50],
  surface: colors.white,
  surfaceElevated: colors.white,
  text: colors.gray[900],
  textSecondary: colors.gray[500],
  textMuted: colors.gray[400],
  border: colors.gray[200],
  borderLight: colors.gray[100],
  card: colors.white,
  input: colors.gray[50],
  inputBorder: colors.gray[200],
};

// Dark mode semantic colors
export const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#1E293B',
  card: '#1E293B',
  input: '#1E293B',
  inputBorder: '#334155',
};

// Legacy export for backwards compatibility
export const darkColors = darkTheme;

// Type for theme colors
export type ThemeColors = typeof lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Cross-platform shadow helper (works on iOS, Android, and Web)
import { Platform, ViewStyle } from 'react-native';

type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl';

const webShadows: Record<ShadowLevel, string> = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 2px 8px rgba(0,0,0,0.12)',
  lg: '0 4px 12px rgba(0,0,0,0.15)',
  xl: '0 8px 24px rgba(0,0,0,0.2)',
};

export const getShadow = (level: ShadowLevel): ViewStyle => {
  if (Platform.OS === 'web') {
    return { boxShadow: webShadows[level] } as ViewStyle;
  }
  return shadows[level];
};

// Helper for cross-platform shadows in StyleSheet (typed to allow different shapes)
type PlatformShadowConfig = {
  ios?: ViewStyle;
  android?: ViewStyle;
  web?: Record<string, any>;
};

export const platformShadow = (config: PlatformShadowConfig): ViewStyle => {
  return Platform.select({
    ios: config.ios,
    android: config.android,
    web: config.web,
    default: {},
  }) as ViewStyle;
};
