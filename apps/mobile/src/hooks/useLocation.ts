import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useMapStore } from '../store/map';

export function useLocation() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userLocation, setUserLocation, setRegion } = useMapStore();

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError('Permission de localisation refusée');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newLocation);
      return newLocation;
    } catch (err) {
      setError('Impossible de récupérer votre position');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const centerOnUser = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setRegion({
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    userLocation,
    error,
    isLoading,
    getCurrentLocation,
    centerOnUser,
    requestPermission,
  };
}

export default useLocation;
