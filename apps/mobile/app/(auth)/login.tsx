import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';
import { colors, spacing, borderRadius, fontSize } from '../../src/utils/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const { signInWithGoogle, isLoading: isGoogleLoading, isReady: isGoogleReady } = useGoogleAuth();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.type === 'success') {
        router.replace('/(app)/map');
      } else if (result.type === 'error') {
        Alert.alert('Erreur', result.error || 'Erreur de connexion Google');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Erreur de connexion Google');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/(app)/map');
    } catch (err) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="map" size={40} color={colors.white} />
              </View>
              <Text style={styles.title}>Tribe</Text>
              <Text style={styles.subtitle}>Découvrez le monde autour de vous</Text>
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.googleButton, (!isGoogleReady || isGoogleLoading) && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={!isGoogleReady || isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.gray[700]} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.gray[500]} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor={colors.gray[400]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.gray[500]} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[400]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.gray[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Pas encore de compte ? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>S'inscrire</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    color: colors.gray[900],
    fontSize: fontSize.base,
  },
  button: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.primary[400],
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['3xl'],
  },
  footerText: {
    color: colors.gray[500],
  },
  footerLink: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  googleButtonText: {
    color: colors.gray[700],
    fontWeight: '600',
    fontSize: fontSize.base,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },
  separatorText: {
    color: colors.gray[500],
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.sm,
  },
});
