import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavBar } from '@/components/NavBar';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { createContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

// Create context for menu state management
export const MenuContext = createContext<{
  isMenuOpen: boolean;
  menuOverlayOpacity: Animated.Value;
  setIsMenuOpen: (value: boolean) => void;
}>({
  isMenuOpen: false,
  menuOverlayOpacity: new Animated.Value(0),
  setIsMenuOpen: () => {},
});

export default function TabLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;

  return (
    <MenuContext.Provider value={{ isMenuOpen, menuOverlayOpacity, setIsMenuOpen }}>
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
