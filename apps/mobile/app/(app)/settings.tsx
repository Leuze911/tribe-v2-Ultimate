import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';
import { useAuthStore } from '../../src/store/auth';
import { authService } from '../../src/services/auth';

export default function SettingsScreen() {
  const { logout } = useAuthStore();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteAccount();
              await logout();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de supprimer le compte');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Parametres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Notifications push</Text>
            </View>
            <Switch
              trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
              thumbColor={colors.white}
              value={true}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Notifications email</Text>
            </View>
            <Switch
              trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
              thumbColor={colors.white}
              value={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affichage</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Mode sombre</Text>
            </View>
            <Switch
              trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
              thumbColor={colors.white}
              value={false}
            />
          </View>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Langue</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>Francais</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/profile/edit' as any)}>
            <View style={styles.settingInfo}>
              <Ionicons name="person-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Modifier le profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/change-password' as any)}>
            <View style={styles.settingInfo}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Confidentialite</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A propos</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Aide et support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={22} color={colors.gray[600]} />
              <Text style={styles.settingLabel}>Version</Text>
            </View>
            <Text style={styles.versionText}>2.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color={colors.red[500]} />
          <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </ScrollView>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.base,
    color: colors.gray[700],
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingValueText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  versionText: {
    fontSize: fontSize.base,
    color: colors.gray[400],
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing['2xl'],
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.red[100],
    borderRadius: borderRadius.lg,
  },
  deleteButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.red[600],
  },
});
