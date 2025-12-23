import { ScrollView, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
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
      <View className="h-12 items-center justify-center">
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4"
      contentContainerStyle={{ gap: 8, paddingRight: 16 }}
    >
      <TouchableOpacity
        className={`flex-row items-center px-4 py-2 rounded-full ${
          !selectedCategoryId ? 'bg-primary-600' : 'bg-white'
        }`}
        onPress={() => setSelectedCategory(null)}
      >
        <Ionicons
          name="apps-outline"
          size={16}
          color={!selectedCategoryId ? '#ffffff' : '#4B5563'}
        />
        <Text
          className={`ml-2 font-medium ${
            !selectedCategoryId ? 'text-white' : 'text-gray-700'
          }`}
        >
          Tous
        </Text>
      </TouchableOpacity>

      {categories?.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        const iconName = CATEGORY_ICONS[category.icon] || CATEGORY_ICONS.default;

        return (
          <TouchableOpacity
            key={category.id}
            className={`flex-row items-center px-4 py-2 rounded-full ${
              isSelected ? 'bg-primary-600' : 'bg-white'
            }`}
            onPress={() => setSelectedCategory(isSelected ? null : category.id)}
          >
            <Ionicons name={iconName} size={16} color={isSelected ? '#ffffff' : category.color} />
            <Text
              className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default CategoryChips;
