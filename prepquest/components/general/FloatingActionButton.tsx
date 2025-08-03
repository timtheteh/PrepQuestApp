import React, { ReactNode, useContext } from 'react';
import { StyleSheet, TouchableOpacity, ViewProps, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Feather } from '@expo/vector-icons';
import { MenuContext } from '@/contexts/MenuContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import { Colors } from '@/constants/Colors';

interface FloatingActionButtonProps extends ViewProps {
  onPress?: () => void;
  children?: ReactNode;
  disableOverlay?: boolean;
  backgroundColor?: string;
  animationType?: 'default' | 'viewFlashcards';
}

export const FloatingActionButton = ({ 
  style, 
  onPress,
  children,
  disableOverlay = false,
  backgroundColor,
  animationType = 'default',
  ...props 
}: FloatingActionButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isBackgroundTaskRunning } = useBackgroundTask();
  
  // Debug logging
  console.log('FloatingActionButton - isBackgroundTaskRunning:', isBackgroundTaskRunning);
  
  const { 
    setIsMenuOpen, 
    setIsAddDeckOpen, 
    menuOverlayOpacity, 
    addDeckOpacity 
  } = useContext(MenuContext);

  const handlePress = () => {
    if (disableOverlay) {
      if (onPress) {
        onPress();
      }
      return;
    }

    if (onPress) {
      onPress();
    }

    setIsMenuOpen(true);
    setIsAddDeckOpen(true);

    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(addDeckOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor: backgroundColor || colors.brandColor2 }, 
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      {...props}
    >
      {isBackgroundTaskRunning ? (
        <LottieView
          source={animationType === 'viewFlashcards' 
            ? require('@/assets/animations/addDeckLoadingAnimation2.json')
            : require('@/assets/animations/addDeckLoadingAnimation.json')
          }
          autoPlay
          loop
          style={styles.loadingAnimation}
          cacheComposition={true}
        />
      ) : (
        children || <Feather name="plus" size={38} color="white" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 67,
    height: 67,
    borderRadius: 67 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8, // for Android shadow
  },
  loadingAnimation: {
    width: 38,
    height: 38,
  },
}); 