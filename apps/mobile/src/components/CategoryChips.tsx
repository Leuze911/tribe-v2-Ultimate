import { ScrollView, TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../hooks/usePOIs';
import { useMapStore } from '../store/map';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  cafe: 'cafe-outline',
  bar: 'beer-outline',
  shop: 'cart-outline',
  park: 'leaf-outline',
  museum: 'business-outline',
  sport: 'football-outline',
  beach: 'sunny-outline',
  hotel: 'bed-outline',
  default: 'location-outline',
};

export function CategoryChips() {
  const { data: categories, isLoading } = useCategories();
  const { selectedCategoryId, setSelectedCategory } = useMapStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={[styles.chip, !selectedCategoryId ? styles.chipSelected : styles.chipUnselected]}
        onPress={() => setSelectedCategory(null)}
      >
        <Ionicons
          name="apps-outline"
          size={16}
          color={!selectedCategoryId ? '#ffffff' : '#4B5563'}
        />
        <Text style={[styles.chipText, !selectedCategoryId ? styles.chipTextSelected : styles.chipTextUnselected]}>
          Tous
        </Text>
      </TouchableOpacity>

      {categories?.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        const iconName = CATEGORY_ICONS[category.icon] || CATEGORY_ICONS.default;

        return (
          <TouchableOpacity
            key={category.id}
            style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
            onPress={() => setSelectedCategory(isSelected ? null : category.id)}
          >
            <Ionicons name={iconName} size={16} color={isSelected ? '#ffffff' : category.color} />
            <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  chipSelected: {
    backgroundColor: '#2f9e44',
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextUnselected: {
    color: '#374151',
  },
});

export default CategoryChips;
