/**
 * TRIBE v2 - POI Edit Screen
 * Edit existing POI
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../../../src/utils/theme';
import { poisService } from '../../../../src/services/pois';
import type { POI } from '../../../../src/types';

const categories = [
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' as const },
  { id: 'cafe', label: 'Cafe', icon: 'cafe' as const },
  { id: 'parc', label: 'Parc', icon: 'leaf' as const },
  { id: 'musee', label: 'Musee', icon: 'business' as const },
];

export default function POIEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [poi, setPoi] = useState<POI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('restaurant');

  useEffect(() => {
    loadPOI();
  }, [id]);

  const loadPOI = async () => {
    try {
      const data = await poisService.getPOI(id);
      setPoi(data);
      setName(data.name);
      setDescription(data.description || '');
      setCategoryId(data.categoryId || 'restaurant');
    } catch (error) {
      console.error('Failed to load POI:', error);
      Alert.alert('Erreur', 'Impossible de charger le POI');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    setIsSaving(true);
    try {
      await poisService.updatePOI(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId,
      });
      Alert.alert('Succès', 'POI mis à jour avec succès');
      router.back();
    } catch (error) {
      console.error('Failed to update POI:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le POI');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le POI</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Text style={styles.saveButtonText}>Sauver</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom du lieu *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Cafe de la Paix"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Decrivez ce lieu..."
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Categorie</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryOption, categoryId === cat.id && styles.categoryOptionActive]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={24}
                      color={categoryId === cat.id ? colors.white : colors.gray[600]}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        categoryId === cat.id && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryOptionText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: colors.white,
  },
});
