/**
 * TRIBE v2 - Change Password Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../../src/utils/theme';
import { authService } from '../../../src/services/auth';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Succès', 'Mot de passe modifié avec succès');
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de changer le mot de passe');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changer le mot de passe</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Entrez votre mot de passe actuel"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 caractères"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Retapez le nouveau mot de passe"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleChangePassword}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Changer le mot de passe</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    paddingRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: 50,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
