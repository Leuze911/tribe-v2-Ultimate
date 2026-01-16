/**
 * TRIBE v2 - Edit Profile Screen
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../../src/utils/theme';
import { useAuthStore } from '../../../src/store/auth';
import { authService } from '../../../src/services/auth';
import { mediaService } from '../../../src/services/media';

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.displayName || user?.username || '');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      // Update local state
      setUser({
        ...user!,
        displayName: updatedUser.fullName || undefined,
        avatar: avatarUrl || undefined,
      });

      Alert.alert('Succès', 'Profil mis à jour avec succès');
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    Alert.alert(
      'Changer la photo',
      'Choisissez une source',
      [
        {
          text: 'Appareil photo',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const photo = await mediaService.takePhoto();
              if (photo) {
                const url = await mediaService.uploadPhoto(photo.uri);
                setAvatarUrl(url);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de charger la photo');
            } finally {
              setIsUploadingAvatar(false);
            }
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const photo = await mediaService.pickImage();
              if (photo) {
                const url = await mediaService.uploadPhoto(photo.uri);
                setAvatarUrl(url);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de charger la photo');
            } finally {
              setIsUploadingAvatar(false);
            }
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Text style={styles.saveButtonText}>Sauver</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleChangeAvatar} disabled={isUploadingAvatar}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={48} color={colors.white} />
                  </View>
                )}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Touchez pour changer</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                editable={false}
              />
              <Text style={styles.inputHint}>L'email ne peut pas être modifié</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Téléphone (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+221 77 123 45 67"
                placeholderTextColor={colors.gray[400]}
                keyboardType="phone-pad"
              />
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
  },
  saveButton: {
    paddingLeft: spacing.md,
  },
  saveButtonText: {
    color: colors.primary[500],
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.white,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarHint: {
    marginTop: spacing.md,
    color: colors.gray[500],
    fontSize: fontSize.sm,
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
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  inputDisabled: {
    backgroundColor: colors.gray[100],
    color: colors.gray[500],
  },
  inputHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
});
