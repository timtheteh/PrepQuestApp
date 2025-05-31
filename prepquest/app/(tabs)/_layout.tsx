import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavBar } from '@/components/NavBar';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { SlidingMenu } from '@/components/SlidingMenu';
import { AIPromptModal } from '@/components/AIPromptModal';
import { CalendarModal } from '@/components/CalendarModal';
import { createContext, useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

// Create context for menu state management
export const MenuContext = createContext<{
  isMenuOpen: boolean;
  menuOverlayOpacity: Animated.Value;
  menuTranslateX: Animated.Value;
  setIsMenuOpen: (value: boolean) => void;
  handleDismissMenu: () => void;
  showSlidingMenu: boolean;
  setShowSlidingMenu: (value: boolean) => void;
  isAIPromptOpen: boolean;
  setIsAIPromptOpen: (value: boolean) => void;
  aiPromptOpacity: Animated.Value;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (value: boolean) => void;
  calendarOpacity: Animated.Value;
}>({
  isMenuOpen: false,
  menuOverlayOpacity: new Animated.Value(0),
  menuTranslateX: new Animated.Value(-171),
  setIsMenuOpen: () => {},
  handleDismissMenu: () => {},
  showSlidingMenu: false,
  setShowSlidingMenu: () => {},
  isAIPromptOpen: false,
  setIsAIPromptOpen: () => {},
  aiPromptOpacity: new Animated.Value(0),
  isCalendarOpen: false,
  setIsCalendarOpen: () => {},
  calendarOpacity: new Animated.Value(0),
});

export default function TabLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSlidingMenu, setShowSlidingMenu] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateX = useRef(new Animated.Value(-171)).current;
  const aiPromptOpacity = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(0)).current;

  const slidingMenuDuration = 300;

  const handleDismissMenu = useCallback(() => {
    if (isAIPromptOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        }),
        Animated.timing(aiPromptOpacity, {
          toValue: 0,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAIPromptOpen(false);
      });
    } else if (isCalendarOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 0,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsCalendarOpen(false);
      });
    } else if (showSlidingMenu) {
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
        setShowSlidingMenu(false);
      });
    } else {
      Animated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: slidingMenuDuration,
        useNativeDriver: true,
      }).start(() => {
        setIsMenuOpen(false);
      });
    }
  }, [showSlidingMenu, isAIPromptOpen, isCalendarOpen]);

  return (
    <MenuContext.Provider value={{ 
      isMenuOpen, 
      menuOverlayOpacity, 
      menuTranslateX,
      setIsMenuOpen,
      handleDismissMenu,
      showSlidingMenu,
      setShowSlidingMenu,
      isAIPromptOpen,
      setIsAIPromptOpen,
      aiPromptOpacity,
      isCalendarOpen,
      setIsCalendarOpen,
      calendarOpacity
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
        {showSlidingMenu && (
          <SlidingMenu
            visible={isMenuOpen}
            translateX={menuTranslateX}
          />
        )}
        <AIPromptModal
          visible={isAIPromptOpen}
          opacity={aiPromptOpacity}
        />
        <CalendarModal
          visible={isCalendarOpen}
          opacity={calendarOpacity}
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
