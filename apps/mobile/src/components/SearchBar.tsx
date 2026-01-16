import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMapStore } from '../store/map';

interface SearchBarProps {
  onMenuPress?: () => void;
}

export function SearchBar({ onMenuPress }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useMapStore();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color="#4B5563" />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: '#1F2937',
    fontSize: 16,
  },
});

export default SearchBar;
