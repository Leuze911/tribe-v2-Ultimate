import { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
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
              className="h-48"
            >
              {poi.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  className="h-48"
                  style={{ width: width - 32 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <View className="px-6 pt-4">
            {/* Header */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">{poi.name}</Text>
                <View className="flex-row items-center mt-1">
                  <View
                    className="px-2 py-1 rounded-full mr-2"
                    style={{ backgroundColor: poi.category.color + '20' }}
                  >
                    <Text style={{ color: poi.category.color }} className="text-xs font-medium">
                      {poi.category.name}
                    </Text>
                  </View>
                  {poi.distance && (
                    <Text className="text-gray-500 text-sm">
                      {poi.distance < 1000
                        ? `${Math.round(poi.distance)}m`
                        : `${(poi.distance / 1000).toFixed(1)}km`}
                    </Text>
                  )}
                </View>
              </View>

              {/* Rating */}
              {poi.rating && (
                <View className="flex-row items-center bg-yellow-100 px-3 py-1.5 rounded-full">
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text className="ml-1 font-bold text-yellow-700">
                    {poi.rating.toFixed(1)}
                  </Text>
                  <Text className="text-yellow-600 text-xs ml-1">({poi.totalRatings})</Text>
                </View>
              )}
            </View>

            {/* Description */}
            {poi.description && (
              <Text className="text-gray-600 mt-4 leading-6">{poi.description}</Text>
            )}

            {/* Author */}
            <View className="flex-row items-center mt-6 p-3 bg-gray-50 rounded-xl">
              <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                {poi.author.avatar ? (
                  <Image
                    source={{ uri: poi.author.avatar }}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <Ionicons name="person" size={20} color="#4F46E5" />
                )}
              </View>
              <View className="ml-3">
                <Text className="font-medium text-gray-900">{poi.author.username}</Text>
                <Text className="text-gray-500 text-xs">
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
            <View className="flex-row mt-6 gap-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-primary-600 py-4 rounded-xl"
                onPress={() => onNavigate?.(poi)}
              >
                <Ionicons name="navigate" size={20} color="#ffffff" />
                <Text className="ml-2 text-white font-semibold">Y aller</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 items-center justify-center bg-gray-100 rounded-xl">
                <Ionicons name="share-outline" size={24} color="#4B5563" />
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 items-center justify-center bg-gray-100 rounded-xl">
                <Ionicons name="bookmark-outline" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

POIBottomSheet.displayName = 'POIBottomSheet';

export default POIBottomSheet;
