import { createContext, RefObject } from 'react';
import { Animated } from 'react-native';
import { NavBarRef } from '@/components/general/NavBar';

interface SlidingMenuContextType {
  isMenuOpen: boolean;
  menuOverlayOpacity: Animated.Value;
  menuTranslateX: Animated.Value;
  setIsMenuOpen: (value: boolean) => void;
  handleDismissMenu: () => void;
  showSlidingMenu: boolean;
  setShowSlidingMenu: (value: boolean) => void;
  navbarRef: RefObject<NavBarRef | null>;
}

export const SlidingMenuContext = createContext<SlidingMenuContextType>({
  isMenuOpen: false,
  menuOverlayOpacity: new Animated.Value(0),
  menuTranslateX: new Animated.Value(-171),
  setIsMenuOpen: () => {},
  handleDismissMenu: () => {},
  showSlidingMenu: false,
  setShowSlidingMenu: () => {},
  navbarRef: { current: null },
});
