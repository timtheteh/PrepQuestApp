import React, { ReactNode, useContext } from 'react';
import { StyleSheet, TouchableOpacity, ViewProps, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Feather } from '@expo/vector-icons';
import { MenuContext } from '@/contexts/MenuContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

interface FloatingActionButtonProps extends ViewProps {
  onPress?: () => void;
  children?: ReactNode;
  disableOverlay?: boolean;
  backgroundColor?: string;
  animationType?: 'default' | 'viewFlashcards';
  isFoldersPage?: boolean;
  isFavoritesPageFavFolders?: boolean;
}

export const FloatingActionButton = ({ 
  style, 
  onPress,
  children,
  disableOverlay = false,
  backgroundColor,
  animationType = 'default',
  isFoldersPage = false,
  isFavoritesPageFavFolders = false,
  ...props 
}: FloatingActionButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isBackgroundTaskRunning, backgroundTaskProgress } = useBackgroundTask();
  const router = useRouter();
  
  // Debug logging
  console.log('FloatingActionButton - isBackgroundTaskRunning:', isBackgroundTaskRunning);
  
  const { 
    setIsMenuOpen, 
    setIsAddDeckOpen, 
    menuOverlayOpacity, 
    addDeckOpacity 
  } = useContext(MenuContext);

  const handlePress = () => {
    // If there's a background task running and we're not on the folders page or favorites page fav folders,
    // navigate to the deck creation status page instead of showing the add deck modal
    if (isBackgroundTaskRunning && !isFoldersPage && !isFavoritesPageFavFolders && backgroundTaskProgress) {
      // If manual add task, go to loading page; otherwise go to status page
      if (backgroundTaskProgress.taskType === 'manualAdd') {
        router.push({
          pathname: '/DeckCreationLoadingPage',
        });
      } else {
        router.push({
          pathname: '/deckCreationStatusPage',
          params: {
            isInViewFlashcardsPage: backgroundTaskProgress.isInViewFlashcardsPage ? 'true' : 'false'
          }
        });
      }
      return;
    }

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
      {isBackgroundTaskRunning && !isFoldersPage && !isFavoritesPageFavFolders ? (
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