import { useState, createContext, useContext, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DrawerContent from '../../src/components/DrawerContent';
import { colors } from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

// Create Drawer Context
type DrawerContextType = {
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
};

const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);

export default function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(0));

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    Animated.spring(drawerAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [drawerAnimation]);

  const closeDrawer = useCallback(() => {
    Animated.spring(drawerAnimation, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  }, [drawerAnimation]);

  const translateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const overlayOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          {/* Main Content */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="map" />
            <Stack.Screen name="my-pois" options={{ presentation: 'modal' }} />
            <Stack.Screen name="rewards" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
            <Stack.Screen name="leaderboard" options={{ presentation: 'modal' }} />
          </Stack>

          {/* Drawer Overlay */}
          {isDrawerOpen && (
            <Animated.View
              style={[
                styles.overlay,
                {
                  opacity: overlayOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={closeDrawer}
              />
            </Animated.View>
          )}

          {/* Drawer */}
          {isDrawerOpen && (
            <Animated.View
              style={[
                styles.drawer,
                {
                  transform: [{ translateX }],
                  width: DRAWER_WIDTH,
                },
              ]}
            >
              <DrawerContent closeDrawer={closeDrawer} />
            </Animated.View>
          )}
        </View>
      </GestureHandlerRootView>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 101,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
      },
    }),
  },
});
