import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMapStore } from '../store/map';

interface SearchBarProps {
  onMenuPress?: () => void;
}

export function SearchBar({ onMenuPress }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useMapStore();

  return (
    <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-lg mx-4">
      <TouchableOpacity onPress={onMenuPress} className="mr-2">
        <Ionicons name="menu" size={24} color="#4B5563" />
      </TouchableOpacity>
      <TextInput
        className="flex-1 py-2 text-gray-800"
        placeholder="Rechercher un lieu..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="search" size={20} color="#9CA3AF" />
      )}
    </View>
  );
}

export default SearchBar;
