import { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useMapStore } from '../store/map';
import type { POI, Location } from '../types';

// Initialize MapLibre
MapLibreGL.setAccessToken(null);

const MAPTILER_KEY = 'get_your_own_key'; // Replace with your MapTiler key
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// Fallback to OSM style if no MapTiler key
const OSM_STYLE = 'https://demotiles.maplibre.org/style.json';

interface MapViewProps {
  pois: POI[];
  onPOIPress: (poi: POI) => void;
  onMapPress?: (location: Location) => void;
  showUserLocation?: boolean;
}

export function MapView({ pois, onPOIPress, onMapPress, showUserLocation = true }: MapViewProps) {
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const { region, userLocation, isAddingPOI, newPOILocation, setNewPOILocation, setRegion } =
    useMapStore();

  const handleMapPress = (event: any) => {
    if (isAddingPOI && event.geometry?.coordinates) {
      const [longitude, latitude] = event.geometry.coordinates;
      setNewPOILocation({ latitude, longitude });
    }
    onMapPress?.({
      latitude: event.geometry?.coordinates[1],
      longitude: event.geometry?.coordinates[0],
    });
  };

  const handleRegionChange = () => {
    // Region change handling if needed
  };

  const centerOnLocation = (location: Location) => {
    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 15,
      animationDuration: 500,
    });
  };

  useEffect(() => {
    if (userLocation && cameraRef.current) {
      centerOnLocation(userLocation);
    }
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={OSM_STYLE}
        onPress={handleMapPress}
        onRegionDidChange={handleRegionChange}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [region.longitude, region.latitude],
            zoomLevel: 12,
          }}
        />

        {/* User Location */}
        {showUserLocation && <MapLibreGL.UserLocation visible animated />}

        {/* POI Markers */}
        {pois.map((poi) => (
          <MapLibreGL.MarkerView
            key={poi.id}
            coordinate={[poi.longitude, poi.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View
              style={[styles.marker, { backgroundColor: poi.category.color }]}
              onTouchEnd={() => onPOIPress(poi)}
            >
              <View style={styles.markerInner} />
            </View>
          </MapLibreGL.MarkerView>
        ))}

        {/* New POI Marker (when adding) */}
        {isAddingPOI && newPOILocation && (
          <MapLibreGL.MarkerView
            coordinate={[newPOILocation.longitude, newPOILocation.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[styles.marker, styles.newPOIMarker]}>
              <View style={styles.markerInner} />
            </View>
          </MapLibreGL.MarkerView>
        )}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  newPOIMarker: {
    backgroundColor: '#EF4444',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default MapView;
