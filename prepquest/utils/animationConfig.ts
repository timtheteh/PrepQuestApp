import { Platform, Dimensions } from 'react-native';

// Performance-based animation configuration
export const getAnimationConfig = () => {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = require('react-native').PixelRatio.get();
  
  // Ultra-aggressive device detection for performance classification
  const screenArea = width * height;
  const isSmallScreen = width < 375 || height < 667; // iPhone 6/7/8 baseline
  const isLowPixelRatio = pixelRatio < 2.5; // More aggressive threshold
  const isAndroid = Platform.OS === 'android';
  
  // Ultra-aggressive low-end device detection - cast wider net
  const isLowEndDevice = isAndroid && (
    isSmallScreen || 
    isLowPixelRatio || 
    screenArea < 400000 || // Less than ~632x632 equivalent
    width < 375 ||
    height < 667
  );
  
  // Expanded mid-range device detection
  const isMidRangeDevice = isAndroid && !isLowEndDevice && (
    width < 450 || 
    height < 900 || 
    pixelRatio < 3.5 ||
    screenArea < 810000 // Less than ~900x900 equivalent
  );
  
  const config = {
    // Ultra-fast or instant for low-end devices
    duration: isLowEndDevice ? 0 : isMidRangeDevice ? 80 : 150,
    // No parallel animations for low-end devices
    maxParallelAnimations: isLowEndDevice ? 0 : isMidRangeDevice ? 2 : 7,
    // Use native driver when animations are enabled
    useNativeDriver: true,
    // No stagger delays for low-end (instant), minimal for mid-range
    staggerDelay: isLowEndDevice ? 0 : isMidRangeDevice ? 20 : 0,
    // Performance flags
    isLowEndDevice,
    isMidRangeDevice,
    // Completely disable animations on low-end devices
    enableComplexAnimations: !isLowEndDevice,
    enableAnimations: !isLowEndDevice,
    // Instant mode for low-end devices
    instantMode: isLowEndDevice,
  };
  
  // Log device classification for debugging
  if (__DEV__) {
    console.log(`[Performance] Device: ${width}x${height}, Pixel Ratio: ${pixelRatio}, Area: ${screenArea}`);
    console.log(`[Performance] Classification: ${isLowEndDevice ? 'Low-End' : isMidRangeDevice ? 'Mid-Range' : 'High-End'}`);
    console.log(`[Performance] Instant Mode: ${config.instantMode}`);
  }
  
  return config;
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
