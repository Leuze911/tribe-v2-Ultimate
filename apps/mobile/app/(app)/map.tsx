import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, TextInput, StyleSheet, Platform, ScrollView, Dimensions, KeyboardAvoidingView, Alert, Modal, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';
import { useMapStore } from '../../src/store/map';
import { useAuthStore } from '../../src/store/auth';
import { useOffline } from '../../src/hooks/useOffline';
import { useTheme } from '../../src/hooks/useTheme';
import { useDrawer } from './_layout';
import { MapView } from '../../src/components/MapView';
import { poisService } from '../../src/services/pois';
import { mediaService, PhotoResult } from '../../src/services/media';
import type { POI, Location as LocationType } from '../../src/types';

// Check if running in Expo Go (BottomSheet has issues with reanimated in Expo Go)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import BottomSheet only if not in Expo Go
let BottomSheet: any = null;
let BottomSheetScrollView: any = null;
let BottomSheetBackdrop: any = null;

if (!isExpoGo) {
  try {
    const bottomSheetModule = require('@gorhom/bottom-sheet');
    BottomSheet = bottomSheetModule.default;
    BottomSheetScrollView = bottomSheetModule.BottomSheetScrollView;
    BottomSheetBackdrop = bottomSheetModule.BottomSheetBackdrop;
  } catch (e) {
    console.log('BottomSheet not available');
  }
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type CategoryType = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const categories: CategoryType[] = [
  { id: 'all', label: 'Tous', icon: 'apps' },
  { id: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { id: 'cafe', label: 'Cafes', icon: 'cafe' },
  { id: 'parc', label: 'Parcs', icon: 'leaf' },
  { id: 'musee', label: 'Musees', icon: 'business' },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { searchQuery, setSearchQuery, isAddingPOI, startAddingPOI, cancelAddingPOI, confirmPOILocation, newPOILocation, setUserLocation, userLocation } = useMapStore();
  const { user } = useAuthStore();
  const { isOnline, syncStatus, isSyncing, createPOIOffline, getPendingCount } = useOffline();
  const { isDark, theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [poiName, setPoiName] = useState('');
  const [poiDescription, setPoiDescription] = useState('');
  const [poiCategory, setPoiCategory] = useState('restaurant');
  const [poiPhotos, setPoiPhotos] = useState<string[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // Request location permission and get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  // Load POIs from API - debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPois();
    }, searchQuery ? 300 : 0); // Debounce search queries
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, userLocation, searchQuery]);

  const loadPois = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
        params.radius = 5000; // 5km radius
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await poisService.getPOIs(params);
      setPois(data);
    } catch (error) {
      console.log('Error loading POIs:', error);
    }
  };

  // Bottom sheet refs
  const poiFormSheetRef = useRef<BottomSheet>(null);
  const poiDetailSheetRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points
  const formSnapPoints = useMemo(() => ['50%', '85%'], []);
  const detailSnapPoints = useMemo(() => ['35%', '70%'], []);

  const handleAddPOI = () => {
    startAddingPOI();
  };

  const handleConfirmLocation = () => {
    const location = confirmPOILocation();
    if (location) {
      poiFormSheetRef.current?.expand();
    }
  };

  const handleSavePOI = async () => {
    if (!poiName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le POI');
      return;
    }

    if (!newPOILocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner une position sur la carte');
      return;
    }

    setIsLoading(true);
    try {
      // Upload photos first if any and online
      let uploadedPhotoUrls: string[] = [];
      if (poiPhotos.length > 0 && isOnline) {
        try {
          const uploadPromises = poiPhotos.map((uri) => mediaService.uploadPhoto(uri));
          uploadedPhotoUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          // Continue without photos if upload fails
        }
      }

      if (isOnline) {
        // Try to create online first
        await poisService.createPOI({
          name: poiName,
          description: poiDescription || undefined,
          categoryId: poiCategory,
          latitude: newPOILocation.latitude,
          longitude: newPOILocation.longitude,
          images: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
        });
        Alert.alert('Succès', `POI "${poiName}" créé avec succès!`);
      } else {
        // Save offline if no connection
        await createPOIOffline({
          name: poiName,
          description: poiDescription || undefined,
          categoryId: poiCategory,
          latitude: newPOILocation.latitude,
          longitude: newPOILocation.longitude,
          // Photos will be synced later when online
        });
        Alert.alert(
          'POI sauvegardé',
          `"${poiName}" a été sauvegardé localement. Il sera synchronisé quand vous serez en ligne.`
        );
      }

      setIsLoading(false);
      poiFormSheetRef.current?.close();
      setPoiName('');
      setPoiDescription('');
      setPoiPhotos([]);
      cancelAddingPOI();

      loadPois(); // Reload POIs to show the new one
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer le POI');
    }
  };

  const handleCloseForm = () => {
    poiFormSheetRef.current?.close();
    cancelAddingPOI();
    setPoiName('');
    setPoiDescription('');
    setPoiPhotos([]);
  };

  const handleAddPhoto = async () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        {
          text: 'Appareil photo',
          onPress: async () => {
            const photo = await mediaService.takePhoto();
            if (photo) {
              setPoiPhotos([...poiPhotos, photo.uri]);
            }
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const photo = await mediaService.pickImage();
            if (photo) {
              setPoiPhotos([...poiPhotos, photo.uri]);
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

  const handleRemovePhoto = (index: number) => {
    setPoiPhotos(poiPhotos.filter((_, i) => i !== index));
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Full Screen MapLibre Map */}
      <MapView
        pois={pois}
        onPOIPress={(poi) => {
          setSelectedPoi(poi);
          poiDetailSheetRef.current?.expand();
        }}
        onMapPress={(location) => {
          if (isAddingPOI) {
            // Location is already handled in MapView component
          }
        }}
        showUserLocation={locationPermission}
      />

      {/* Offline Indicator Banner */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { top: insets.top }]}>
          <Ionicons name="cloud-offline" size={16} color={colors.white} />
          <Text style={styles.offlineBannerText}>Mode hors ligne</Text>
          {getPendingCount() > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{getPendingCount()}</Text>
            </View>
          )}
        </View>
      )}

      {/* Syncing Indicator */}
      {isOnline && isSyncing && (
        <View style={[styles.syncingBanner, { top: insets.top }]}>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.syncingBannerText}>Synchronisation...</Text>
        </View>
      )}

      {/* Floating Search Bar with Hamburger Menu */}
      <SafeAreaView style={styles.topFloatingUI} edges={['top']} pointerEvents="box-none">
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={[styles.menuButton, isDark && { backgroundColor: theme.surface }]}
            onPress={openDrawer}
            testID="menu-button"
            accessibilityLabel="Menu"
          >
            <Ionicons name="menu" size={24} color={isDark ? theme.text : colors.gray[700]} />
          </TouchableOpacity>

          <View style={[styles.searchBar, isDark && { backgroundColor: theme.surface }]}>
            <Ionicons name="search" size={20} color={isDark ? theme.textMuted : colors.gray[400]} />
            <TextInput
              style={[styles.searchInput, isDark && { color: theme.text }]}
              placeholder="Rechercher un lieu..."
              placeholderTextColor={isDark ? theme.textMuted : colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? theme.textMuted : colors.gray[400]} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                isDark && { backgroundColor: theme.surface },
                selectedCategory === cat.id && styles.chipActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={selectedCategory === cat.id ? colors.white : isDark ? theme.textSecondary : colors.gray[600]}
              />
              <Text style={[
                styles.chipText,
                isDark && { color: theme.textSecondary },
                selectedCategory === cat.id && styles.chipTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Adding POI Mode Banner */}
      {isAddingPOI && (
        <View style={[styles.addingBanner, { top: insets.top + 120 }]}>
          <Text style={styles.addingBannerText}>Touchez la carte pour placer le POI</Text>
          <View style={styles.addingBannerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelAddingPOI}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAB Buttons */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity
          style={[styles.fabSecondary, isDark && { backgroundColor: theme.surface }]}
          testID="locate-button"
          accessibilityLabel="Ma position"
        >
          <Ionicons name="locate" size={24} color={colors.primary[500]} />
        </TouchableOpacity>

        {!isAddingPOI && (
          <TouchableOpacity
            style={styles.fabPrimary}
            onPress={handleAddPOI}
            testID="add-poi-button"
            accessibilityLabel="Ajouter un POI"
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* User Level Badge - Bottom Left */}
      <View style={[styles.userBadge, isDark && { backgroundColor: theme.surface }, { bottom: insets.bottom + spacing.xl }]}>
        <View style={styles.userBadgeAvatar}>
          <Ionicons name="person" size={16} color={colors.white} />
        </View>
        <View>
          <Text style={[styles.userBadgeName, isDark && { color: theme.text }]}>Niveau {user?.level || 1}</Text>
          <Text style={[styles.userBadgeXp, isDark && { color: theme.textSecondary }]}>{user?.xp || 0} XP</Text>
        </View>
      </View>

      {/* POI Creation - BottomSheet or Modal based on environment */}
      {!isExpoGo && BottomSheet ? (
        <BottomSheet
          ref={poiFormSheetRef}
          index={-1}
          snapPoints={formSnapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandle}
          onChange={(index) => {
            if (index === -1) {
              cancelAddingPOI();
              setPoiName('');
              setPoiDescription('');
            }
          }}
        >
          <BottomSheetScrollView style={styles.bottomSheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nouveau POI</Text>
              <TouchableOpacity onPress={handleCloseForm} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {newPOILocation && (
              <View style={styles.coordinatesContainer}>
                <Ionicons name="location" size={18} color={colors.primary[500]} />
                <Text style={styles.coordinatesText}>
                  {newPOILocation.latitude.toFixed(6)}, {newPOILocation.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Nom du lieu *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Cafe de la Paix"
                placeholderTextColor={colors.gray[400]}
                value={poiName}
                onChangeText={setPoiName}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Decrivez ce lieu..."
                placeholderTextColor={colors.gray[400]}
                value={poiDescription}
                onChangeText={setPoiDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Categorie</Text>
              <View style={styles.categorySelect}>
                {categories.slice(1).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryOption, poiCategory === cat.id && styles.categoryOptionActive]}
                    onPress={() => setPoiCategory(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={poiCategory === cat.id ? colors.white : colors.gray[600]}
                    />
                    <Text style={[styles.categoryOptionText, poiCategory === cat.id && styles.categoryOptionTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Photos (optionnel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {poiPhotos.map((uri, index) => (
                  <View key={index} style={styles.photoPreview}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoRemoveButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.red[500]} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={handleAddPhoto}
                >
                  <Ionicons name="camera" size={32} color={colors.gray[400]} />
                  <Text style={styles.addPhotoText}>Ajouter</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePOI}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                  <Text style={styles.saveButtonText}>Creer le POI</Text>
                </>
              )}
            </TouchableOpacity>
          </BottomSheetScrollView>
        </BottomSheet>
      ) : null}

      {/* POI Detail - BottomSheet or Modal based on environment */}
      {!isExpoGo && BottomSheet ? (
        <BottomSheet
          ref={poiDetailSheetRef}
          index={-1}
          snapPoints={detailSnapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandle}
          onChange={(index) => {
            if (index === -1) {
              setSelectedPoi(null);
            }
          }}
        >
          <BottomSheetScrollView style={styles.bottomSheetContent}>
            {selectedPoi && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{selectedPoi.name}</Text>
                  <TouchableOpacity
                    onPress={() => poiDetailSheetRef.current?.close()}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={colors.gray[600]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.poiDetailContent}>
                  <View style={styles.poiCategoryBadge}>
                    <Text style={styles.poiCategoryText}>{selectedPoi.category?.name || 'POI'}</Text>
                  </View>

                  {selectedPoi.description && (
                    <Text style={styles.poiDescription}>{selectedPoi.description}</Text>
                  )}

                  <View style={styles.poiInfoRow}>
                    <Ionicons name="location-outline" size={18} color={colors.gray[500]} />
                    <Text style={styles.poiInfoText}>
                      {selectedPoi.latitude.toFixed(4)}, {selectedPoi.longitude.toFixed(4)}
                    </Text>
                  </View>

                  {selectedPoi.author && (
                    <View style={styles.poiInfoRow}>
                      <Ionicons name="person-outline" size={18} color={colors.gray[500]} />
                      <Text style={styles.poiInfoText}>
                        Ajouté par {selectedPoi.author.username}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.navigateButton}>
                    <Ionicons name="navigate" size={20} color={colors.white} />
                    <Text style={styles.navigateButtonText}>Itinéraire</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },

  // Top Floating UI
  topFloatingUI: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  menuButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    }),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    }),
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[800],
  },

  // Categories
  categoriesScroll: {
    marginTop: spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
    ...Platform.select({
      ios: shadows.sm,
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    }),
  },
  chipActive: {
    backgroundColor: colors.primary[500],
  },
  chipText: {
    color: colors.gray[700],
    fontWeight: '500',
    fontSize: fontSize.sm,
  },
  chipTextActive: {
    color: colors.white,
  },

  // Adding Banner
  addingBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    zIndex: 20,
    ...Platform.select({
      ios: shadows.lg,
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
    }),
  },
  addingBannerText: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: fontSize.base,
  },
  addingBannerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  confirmButtonText: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  // FAB Container
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    gap: spacing.md,
    zIndex: 10,
  },
  fabSecondary: {
    width: 56,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows.lg,
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    }),
  },
  fabPrimary: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows.lg,
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' },
    }),
  },

  // User Badge
  userBadge: {
    position: 'absolute',
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    zIndex: 10,
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    }),
  },
  userBadgeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeName: {
    fontWeight: '600',
    color: colors.gray[900],
    fontSize: fontSize.sm,
  },
  userBadgeXp: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
  },

  // Bottom Sheet
  bottomSheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
  bottomSheetHandle: {
    backgroundColor: colors.gray[300],
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  closeButton: {
    padding: spacing.sm,
  },

  // Coordinates
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  coordinatesText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Form
  formSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary[500],
  },
  categoryOptionText: {
    color: colors.gray[600],
    fontSize: fontSize.sm,
  },
  categoryOptionTextActive: {
    color: colors.white,
  },

  // Save Button
  saveButton: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.base,
  },

  // POI Detail Styles
  poiDetailContent: {
    paddingTop: spacing.md,
  },
  poiCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  poiCategoryText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  poiDescription: {
    color: colors.gray[700],
    fontSize: fontSize.base,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  poiInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  poiInfoText: {
    color: colors.gray[600],
    fontSize: fontSize.sm,
  },
  navigateButton: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  navigateButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.base,
  },

  // Offline/Sync Indicators
  offlineBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    zIndex: 100,
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    }),
  },
  offlineBannerText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: fontSize.sm,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: colors.yellow[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: colors.gray[900],
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
  syncingBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    zIndex: 100,
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' },
    }),
  },
  syncingBannerText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: fontSize.sm,
  },

  // Photos
  photosScroll: {
    marginTop: spacing.sm,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  addPhotoText: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
