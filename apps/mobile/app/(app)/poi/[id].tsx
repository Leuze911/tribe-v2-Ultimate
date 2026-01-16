/**
 * TRIBE v2 - POI Detail Screen
 * View and edit individual POI
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../../src/utils/theme';
import { poisService } from '../../../src/services/pois';
import { useAuthStore } from '../../../src/store/auth';
import type { POI } from '../../../src/types';

export default function POIDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [poi, setPoi] = useState<POI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPOI();
  }, [id]);

  const loadPOI = async () => {
    try {
      const data = await poisService.getPOI(id);
      setPoi(data);
    } catch (error) {
      console.error('Failed to load POI:', error);
      Alert.alert('Erreur', 'Impossible de charger le POI');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/poi/${id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le POI',
      'Êtes-vous sûr de vouloir supprimer ce POI ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await poisService.deletePOI(id);
              Alert.alert('Succès', 'POI supprimé avec succès');
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le POI');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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

  if (!poi) {
    return null;
  }

  const isOwner = user?.id === poi.userId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du POI</Text>
        {isOwner && (
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Photos */}
        {poi.images && poi.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {poi.images.map((imageUrl, index) => (
              <Image key={index} source={{ uri: imageUrl }} style={styles.photo} />
            ))}
          </ScrollView>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.poiName}>{poi.name}</Text>

          {poi.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name={getCategoryIcon(poi.category.id) as any} size={16} color={colors.primary[600]} />
              <Text style={styles.categoryText}>{poi.category.name}</Text>
            </View>
          )}

          {poi.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{poi.description}</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={colors.primary[500]} />
              <Text style={styles.coordinates}>
                {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statut</Text>
            <View style={styles.statusRow}>
              {poi.status === 'validated' && (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
                  <Text style={styles.statusTextValidated}>Validé</Text>
                </>
              )}
              {poi.status === 'pending' && (
                <>
                  <Ionicons name="time-outline" size={20} color={colors.yellow[500]} />
                  <Text style={styles.statusTextPending}>En attente de validation</Text>
                </>
              )}
              {poi.status === 'rejected' && (
                <>
                  <Ionicons name="close-circle" size={20} color={colors.red[500]} />
                  <Text style={styles.statusTextRejected}>Rejeté</Text>
                </>
              )}
            </View>
          </View>

          {/* Actions for owner */}
          {isOwner && (
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color={colors.white} />
                    <Text style={styles.deleteButtonText}>Supprimer le POI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getCategoryIcon(categoryId: string): string {
  const icons: Record<string, string> = {
    restaurant: 'restaurant',
    cafe: 'cafe',
    parc: 'leaf',
    musee: 'business',
  };
  return icons[categoryId] || 'location';
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  photosScroll: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.xl,
    marginRight: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    ...shadows.md,
  },
  poiName: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  categoryText: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coordinates: {
    fontSize: fontSize.base,
    color: colors.gray[700],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusTextValidated: {
    fontSize: fontSize.base,
    color: colors.primary[600],
    fontWeight: '600',
  },
  statusTextPending: {
    fontSize: fontSize.base,
    color: colors.yellow[600],
    fontWeight: '600',
  },
  statusTextRejected: {
    fontSize: fontSize.base,
    color: colors.red[600],
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  deleteButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.base,
  },
});
