import { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCategories, useCreatePOI, useUploadImage } from '../hooks/usePOIs';
import type { Location, Category } from '../types';

interface AddPOIBottomSheetProps {
  location: Location | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPOIBottomSheet = forwardRef<BottomSheet, AddPOIBottomSheetProps>(
  ({ location, onClose, onSuccess }, ref) => {
    const snapPoints = useMemo(() => ['90%'], []);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [images, setImages] = useState<string[]>([]);

    const { data: categories } = useCategories();
    const createPOI = useCreatePOI();
    const uploadImage = useUploadImage();

    const isSubmitting = createPOI.isPending || uploadImage.isPending;

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    const pickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages([...images, result.assets[0].uri]);
      }
    };

    const takePhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages([...images, result.assets[0].uri]);
      }
    };

    const removeImage = (index: number) => {
      setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
      if (!name.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer un nom');
        return;
      }
      if (!selectedCategory) {
        Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
        return;
      }
      if (!location) {
        Alert.alert('Erreur', 'Position invalide');
        return;
      }

      try {
        // Upload images first
        const uploadedUrls: string[] = [];
        for (const uri of images) {
          const url = await uploadImage.mutateAsync(uri);
          uploadedUrls.push(url);
        }

        // Create POI
        await createPOI.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
          categoryId: selectedCategory.id,
          images: uploadedUrls,
        });

        Alert.alert('Succès', 'POI créé avec succès !');
        resetForm();
        onSuccess();
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de créer le POI');
      }
    };

    const resetForm = () => {
      setName('');
      setDescription('');
      setSelectedCategory(null);
      setImages([]);
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={() => {
          resetForm();
          onClose();
        }}
        backgroundStyle={{ borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">Nouveau POI</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Location Info */}
            {location && (
              <View className="flex-row items-center bg-gray-50 p-3 rounded-xl mb-6">
                <Ionicons name="location" size={20} color="#4F46E5" />
                <Text className="ml-2 text-gray-600 text-sm">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Nom du lieu <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 text-gray-900"
                placeholder="Ex: Café de la Paix"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 text-gray-900"
                placeholder="Décrivez ce lieu..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ minHeight: 80 }}
              />
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Catégorie <Text className="text-red-500">*</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {categories?.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      className={`px-4 py-3 rounded-xl border-2 ${
                        selectedCategory?.id === category.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        className={`font-medium ${
                          selectedCategory?.id === category.id
                            ? 'text-primary-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Images */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {/* Add buttons */}
                  <TouchableOpacity
                    className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center border-2 border-dashed border-gray-300"
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={28} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500 mt-1">Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center border-2 border-dashed border-gray-300"
                    onPress={pickImage}
                  >
                    <Ionicons name="images" size={28} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500 mt-1">Galerie</Text>
                  </TouchableOpacity>

                  {/* Preview images */}
                  {images.map((uri, index) => (
                    <View key={index} className="relative">
                      <Image
                        source={{ uri }}
                        className="w-24 h-24 rounded-xl"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close" size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Submit */}
            <TouchableOpacity
              className={`py-4 rounded-xl items-center ${
                isSubmitting ? 'bg-primary-400' : 'bg-primary-600'
              }`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <Text className="ml-2 text-white font-semibold text-lg">Créer le POI</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

AddPOIBottomSheet.displayName = 'AddPOIBottomSheet';

export default AddPOIBottomSheet;
