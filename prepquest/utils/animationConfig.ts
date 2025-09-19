import { Platform, Dimensions } from 'react-native';

// Performance-based animation configuration
export const getAnimationConfig = () => {
  const { width, height } = Dimensions.get('window');
  
  // Detect low-end devices based on screen size and platform
  const isLowEndDevice = Platform.OS === 'android' && (width < 360 || height < 640);
  
  return {
    // Faster animations for low-end devices
    duration: isLowEndDevice ? 100 : 150,
    // Reduce parallel animations on low-end devices
    maxParallelAnimations: isLowEndDevice ? 3 : 7,
    // Use native driver for all animations when possible
    useNativeDriver: true,
    // Stagger animations on low-end devices to reduce load
    staggerDelay: isLowEndDevice ? 50 : 0,
  };
};

// Optimized animation timing configuration
export const ANIMATION_TIMING = {
  FAST: 100,
  NORMAL: 150,
  SLOW: 200,
};

// Easing configurations for different performance levels
export const ANIMATION_EASING = {
  // More responsive easing for low-end devices
  FAST: {
    duration: ANIMATION_TIMING.FAST,
    useNativeDriver: true,
  },
  NORMAL: {
    duration: ANIMATION_TIMING.NORMAL,
    useNativeDriver: true,
  },
  SLOW: {
    duration: ANIMATION_TIMING.SLOW,
    useNativeDriver: true,
  },
};
