import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavBar } from '@/components/NavBar';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { SlidingMenu } from '@/components/SlidingMenu';
import { createContext, useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

// Create context for menu state management
export const MenuContext = createContext<{
  isMenuOpen: boolean;
  menuOverlayOpacity: Animated.Value;
  menuTranslateX: Animated.Value;
  setIsMenuOpen: (value: boolean) => void;
  handleDismissMenu: () => void;
}>({
  isMenuOpen: false,
  menuOverlayOpacity: new Animated.Value(0),
  menuTranslateX: new Animated.Value(-171),
  setIsMenuOpen: () => {},
  handleDismissMenu: () => {},
});

export default function TabLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateX = useRef(new Animated.Value(-171)).current;

  const slidingMenuDuration = 300;

  const handleDismissMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: slidingMenuDuration,
        useNativeDriver: true,
      }),
      Animated.timing(menuTranslateX, {
        toValue: -171,
        duration: slidingMenuDuration,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsMenuOpen(false);
    });
  }, []);

  return (
    <MenuContext.Provider value={{ 
      isMenuOpen, 
      menuOverlayOpacity,
      menuTranslateX,
      setIsMenuOpen,
      handleDismissMenu 
    }}>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
          tabBar={() => <NavBar />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="account" />
          <Tabs.Screen name="statistics" />
          <Tabs.Screen name="awards" />
        </Tabs>
        <GreyOverlayBackground 
          visible={isMenuOpen}
          opacity={menuOverlayOpacity}
          onPress={handleDismissMenu}
        />
        <SlidingMenu
          visible={isMenuOpen}
          translateX={menuTranslateX}
        />
      </View>
    </MenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  }
});
