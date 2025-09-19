import { Platform } from 'react-native';

// Optimized animation durations for different platforms and device capabilities
export const ANIMATION_DURATIONS = {
  // Reduced durations for Android to improve perceived performance
  slidingMenu: Platform.OS === 'android' ? 250 : 300,
  overlay: Platform.OS === 'android' ? 150 : 200,
  modal: Platform.OS === 'android' ? 200 : 250,
  fast: Platform.OS === 'android' ? 100 : 150,
} as const;

// Pre-defined animation configurations to prevent recreation on every render
export const ANIMATION_CONFIGS = {
  overlay: {
    toValue: 0,
    duration: ANIMATION_DURATIONS.overlay,
    useNativeDriver: true,
  },
  overlayShow: {
    toValue: 0.4,
    duration: ANIMATION_DURATIONS.overlay,
    useNativeDriver: true,
  },
  slidingMenu: {
    toValue: 0,
    duration: ANIMATION_DURATIONS.slidingMenu,
    useNativeDriver: true,
  },
  slidingMenuShow: {
    toValue: 0.4,
    duration: ANIMATION_DURATIONS.slidingMenu,
    useNativeDriver: true,
  },
  menuTranslateHide: {
    toValue: -171,
    duration: ANIMATION_DURATIONS.slidingMenu,
    useNativeDriver: true,
  },
  menuTranslateShow: {
    toValue: 0,
    duration: ANIMATION_DURATIONS.slidingMenu,
    useNativeDriver: true,
  },
  modalShow: {
    toValue: 1,
    duration: ANIMATION_DURATIONS.modal,
    useNativeDriver: true,
  },
  modalHide: {
    toValue: 0,
    duration: ANIMATION_DURATIONS.modal,
    useNativeDriver: true,
  },
} as const;
