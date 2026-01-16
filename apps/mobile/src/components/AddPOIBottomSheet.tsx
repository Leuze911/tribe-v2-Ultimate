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
  StyleSheet,
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
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Nouveau POI</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Location Info */}
            {location && (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#4F46E5" />
                <Text style={styles.locationText}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nom du lieu <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Café de la Paix"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez ce lieu..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Catégorie <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  {categories?.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory?.id === category.id
                          ? styles.categoryChipSelected
                          : styles.categoryChipUnselected,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategory?.id === category.id
                            ? styles.categoryChipTextSelected
                            : styles.categoryChipTextUnselected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Images */}
            <View style={styles.inputGroupLarge}>
              <Text style={styles.label}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imageRow}>
                  {/* Add buttons */}
                  <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={28} color="#9CA3AF" />
                    <Text style={styles.addImageText}>Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <Ionicons name="images" size={28} color="#9CA3AF" />
                    <Text style={styles.addImageText}>Galerie</Text>
                  </TouchableOpacity>

                  {/* Preview images */}
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.removeImageButton}
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
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Créer le POI</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupLarge: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#111827',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  categoryChipSelected: {
    borderColor: '#2f9e44',
    backgroundColor: '#ecfdf5',
  },
  categoryChipUnselected: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryChipText: {
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#2f9e44',
  },
  categoryChipTextUnselected: {
    color: '#374151',
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addImageButton: {
    width: 96,
    height: 96,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  addImageText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#2f9e44',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#86efac',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
});

AddPOIBottomSheet.displayName = 'AddPOIBottomSheet';

export default AddPOIBottomSheet;
