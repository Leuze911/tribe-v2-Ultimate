import { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import type { POI } from '../types';

interface POIBottomSheetProps {
  poi: POI | null;
  onClose: () => void;
  onNavigate?: (poi: POI) => void;
}

const { width } = Dimensions.get('window');

export const POIBottomSheet = forwardRef<BottomSheet, POIBottomSheetProps>(
  ({ poi, onClose, onNavigate }, ref) => {
    const snapPoints = useMemo(() => ['40%', '80%'], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.3} />
      ),
      []
    );

    if (!poi) return null;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        backgroundStyle={{ borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Images */}
          {poi.images && poi.images.length > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
            >
              {poi.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={[styles.image, { width: width - 32 }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>{poi.name}</Text>
                <View style={styles.metaRow}>
                  <View
                    style={[styles.categoryBadge, { backgroundColor: poi.category.color + '20' }]}
                  >
                    <Text style={[styles.categoryText, { color: poi.category.color }]}>
                      {poi.category.name}
                    </Text>
                  </View>
                  {poi.distance && (
                    <Text style={styles.distanceText}>
                      {poi.distance < 1000
                        ? `${Math.round(poi.distance)}m`
                        : `${(poi.distance / 1000).toFixed(1)}km`}
                    </Text>
                  )}
                </View>
              </View>

              {/* Rating */}
              {poi.rating && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingValue}>
                    {poi.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>({poi.totalRatings})</Text>
                </View>
              )}
            </View>

            {/* Description */}
            {poi.description && (
              <Text style={styles.description}>{poi.description}</Text>
            )}

            {/* Author */}
            <View style={styles.authorContainer}>
              <View style={styles.authorAvatar}>
                {poi.author.avatar ? (
                  <Image
                    source={{ uri: poi.author.avatar }}
                    style={styles.authorAvatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={20} color="#4F46E5" />
                )}
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{poi.author.username}</Text>
                <Text style={styles.authorDate}>
                  Ajouté le{' '}
                  {new Date(poi.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => onNavigate?.(poi)}
              >
                <Ionicons name="navigate" size={20} color="#ffffff" />
                <Text style={styles.navigateText}>Y aller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={24} color="#4B5563" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="bookmark-outline" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  imageScroll: {
    height: 192,
  },
  image: {
    height: 192,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  distanceText: {
    color: '#6B7280',
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#B45309',
  },
  ratingCount: {
    color: '#D97706',
    fontSize: 12,
    marginLeft: 4,
  },
  description: {
    color: '#4B5563',
    marginTop: 16,
    lineHeight: 24,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontWeight: '500',
    color: '#111827',
  },
  authorDate: {
    color: '#6B7280',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2f9e44',
    paddingVertical: 16,
    borderRadius: 12,
  },
  navigateText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  iconButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
});

POIBottomSheet.displayName = 'POIBottomSheet';

export default POIBottomSheet;
