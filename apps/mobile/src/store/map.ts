import { create } from 'zustand';
import type { Location, MapRegion, Category } from '../types';

interface MapState {
  region: MapRegion;
  userLocation: Location | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  isAddingPOI: boolean;
  newPOILocation: Location | null;

  setRegion: (region: MapRegion) => void;
  setUserLocation: (location: Location) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  startAddingPOI: () => void;
  cancelAddingPOI: () => void;
  setNewPOILocation: (location: Location) => void;
  confirmPOILocation: () => Location | null;
}

const DEFAULT_REGION: MapRegion = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const useMapStore = create<MapState>((set, get) => ({
  region: DEFAULT_REGION,
  userLocation: null,
  selectedCategoryId: null,
  searchQuery: '',
  isAddingPOI: false,
  newPOILocation: null,

  setRegion: (region) => set({ region }),

  setUserLocation: (location) => set({ userLocation: location }),

  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  startAddingPOI: () => {
    const { region } = get();
    set({
      isAddingPOI: true,
      newPOILocation: {
        latitude: region.latitude,
        longitude: region.longitude,
      },
    });
  },

  cancelAddingPOI: () => set({ isAddingPOI: false, newPOILocation: null }),

  setNewPOILocation: (location) => set({ newPOILocation: location }),

  confirmPOILocation: () => {
    const { newPOILocation } = get();
    set({ isAddingPOI: false });
    return newPOILocation;
  },
}));

export default useMapStore;
