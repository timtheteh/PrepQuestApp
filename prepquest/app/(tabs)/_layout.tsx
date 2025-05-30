import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavBar } from '@/components/NavBar';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { createContext, useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

// Create context for menu state management
export const MenuContext = createContext<{
  isMenuOpen: boolean;
  menuOverlayOpacity: Animated.Value;
  setIsMenuOpen: (value: boolean) => void;
  handleDismissMenu: () => void;
}>({
  isMenuOpen: false,
  menuOverlayOpacity: new Animated.Value(0),
  setIsMenuOpen: () => {},
  handleDismissMenu: () => {},
});

export default function TabLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;

  const handleDismissMenu = useCallback(() => {
    Animated.timing(menuOverlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuOpen(false);
    });
  }, []);

  return (
    <MenuContext.Provider value={{ 
      isMenuOpen, 
      menuOverlayOpacity, 
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
