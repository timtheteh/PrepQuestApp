import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, Platform, Pressable, Animated, Dimensions, Text } from 'react-native';
import { CircleSelectButton } from '../general/CircleSelectButton';
import { FavoriteButton } from '../general/FavoriteButton';
import FolderCardIcon from '@/assets/icons/FolderCardIcon.svg';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';

interface FolderCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
  containerWidthPercentage?: Animated.Value;
  isSelectMode?: boolean;
  selected?: boolean;
  onSelectPress?: () => void;
  circleButtonOpacity?: Animated.Value;
  title?: string;
  dateCreated?: string;
  deckCount?: number;
  sourcePage?: string;
  folderId?: string;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

export const FolderCard = React.memo(({ 
  style, 
  children, 
  onPress, 
  containerWidthPercentage = new Animated.Value(100),
  isSelectMode = false,
  selected = false,
  onSelectPress,
  circleButtonOpacity,
  title,
  dateCreated,
  deckCount,
  sourcePage,
  folderId,
  isFavorited = false,
  onFavoriteToggle,
}: FolderCardProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Memoize container style to prevent recreation on every render
  const containerStyle = useMemo(() => ({
    width: containerWidthPercentage.interpolate({
      inputRange: [85, 100],
      outputRange: ['85%', '100%']
    })
  }), [containerWidthPercentage]);

  // Memoize dynamic styles based on theme to prevent recreation
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: Platform.OS === 'android' ? Colors[theme].androidSecondaryShade : Colors[theme].secondaryShade,
    },
    folderTitle: {
      color: Colors[theme].text,
    },
    dateText: {
      color: Colors[theme].text,
    },
    deckCountText: {
      color: Colors[theme].text,
    },
  }), [theme]);

  // Memoize press handlers to prevent recreation
  const handlePressIn = useCallback(() => {
    if (!isSelectMode) {
      setIsPressed(true);
    }
  }, [isSelectMode]);

  const handlePressOut = useCallback(() => {
    if (!isSelectMode) {
      setIsPressed(false);
    }
  }, [isSelectMode]);

  const handleFolderPress = useCallback(() => {
    if (!isSelectMode) {
      // Navigate to deck details page with card information
      router.push({
        pathname: '/(tabs)/viewDecksInFolder',
        params: {
          folderTitle: title,
          folderId: folderId,
          sourcePage: sourcePage
        }
      });
    }
    
    // Call the original onPress if provided
    if (onPress) {
      onPress();
    }
  }, [isSelectMode, title, folderId, sourcePage, onPress]);

  // Memoize deck count text to prevent recalculation
  const deckCountText = useMemo(() => {
    if (deckCount !== undefined) {
      return `${deckCount} ${strings[language].decks}`;
    }
    return null;
  }, [deckCount, language]);

  // Memoize shadow container styles
  const shadowContainerStyle = useMemo(() => [
    styles.shadowContainer,
    isPressed && styles.shadowContainerPressed
  ], [isPressed]);

  // Memoize animated container styles
  const animatedContainerStyle = useMemo(() => [
    styles.container, 
    dynamicStyles.container,
    containerStyle, 
    style,
    isPressed && styles.containerPressed
  ], [dynamicStyles.container, containerStyle, style, isPressed]);

  // Memoize favorite button container styles
  const favoriteButtonContainerStyle = useMemo(() => [
    styles.favoriteButtonContainer,
    isSelectMode && styles.favoriteButtonContainerSelectMode
  ], [isSelectMode]);

  // Memoize folder title styles
  const folderTitleStyle = useMemo(() => [
    styles.folderTitle,
    dynamicStyles.folderTitle,
    isSelectMode && styles.folderTitleSelectMode
  ], [dynamicStyles.folderTitle, isSelectMode]);

  // Memoize date deck row styles
  const dateDeckRowStyle = useMemo(() => [
    styles.dateDeckRow,
    isSelectMode && styles.dateDeckRowSelectMode
  ], [isSelectMode]);

  // Memoize date text styles
  const dateTextStyle = useMemo(() => [
    styles.dateText, 
    dynamicStyles.dateText
  ], [dynamicStyles.dateText]);

  // Memoize deck count text styles
  const deckCountTextStyle = useMemo(() => [
    styles.deckCountText, 
    dynamicStyles.deckCountText
  ], [dynamicStyles.deckCountText]);

  // Memoize circle select button styles
  const circleSelectButtonStyle = useMemo(() => ({
    ...styles.circleSelectButton,
    ...(style?.marginTop === 5 ? styles.firstCardCircleButton : {})
  }), [style?.marginTop]);

  return (
    <View style={styles.outerContainer}>
      <View style={shadowContainerStyle}>
        <Pressable 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleFolderPress}
        >
          <Animated.View style={animatedContainerStyle}>
            <View style={styles.cardContentContainer}>
              {/* Folder Icon */}
              <FolderCardIcon width={45} height={40} style={styles.folderIcon} />
              {/* Favorite button at top right */}
              <View style={favoriteButtonContainerStyle}>
                <FavoriteButton isSelectMode={isSelectMode} favorited={isFavorited} onFavoriteToggle={onFavoriteToggle} />
              </View>
              {/* Title */}
              {title && (
                <Text 
                  style={folderTitleStyle} 
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {/* Date and Deck Count Row */}
              {(dateCreated || deckCount !== undefined) && (
                <View style={dateDeckRowStyle}>
                  {dateCreated && (
                    <Text style={dateTextStyle}>{dateCreated}</Text>
                  )}
                  {deckCountText && (
                    <Text style={deckCountTextStyle}>{deckCountText}</Text>
                  )}
                </View>
              )}
              {children}
            </View>
          </Animated.View>
        </Pressable>
      </View>
      {isSelectMode && (
        <CircleSelectButton
          style={circleSelectButtonStyle}
          selected={selected}
          onPress={onSelectPress}
          opacity={circleButtonOpacity}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  shadowContainer: {
    width: '97%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      
    }),
  },
  shadowContainerPressed: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
    }),
  },
  container: {
    height: 96,
    borderRadius: 20,
  },
  containerPressed: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: -4, // Negative elevation for inner shadow effect
      },
      android: {
        elevation: 2,
        shadowColor: 'rgba(0, 0, 0, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
        borderWidth: 4,
        borderColor: 'transparent', // Transparent border to create space for shadow
      },
    }),
  },
  circleSelectButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    zIndex: 1,
  },
  firstCardCircleButton: {
    transform: [{ translateY: -15 }],
  },
  cardContentContainer: {
    flex: 1,
    margin: 10,
    position: 'relative',
  },
  folderIcon: {
    position: 'absolute',
    left: 5,
    top: '50%',
    transform: [{ translateY: -19 }], // Half of the icon height (35/2) to center it
  },
  favoriteButtonContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  favoriteButtonContainerSelectMode: {
    top: Dimensions.get('window').height < 670 ? '60%' : '60%',
    right: 2,
  },
  folderTitle: {
    position: 'absolute',
    top: 10,
    right: 50,
    left: 65,
    fontFamily: Fonts.title,
    fontSize: 24,
    zIndex: 2,
    lineHeight: Platform.OS === 'ios' ? 24 : 28,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  folderTitleSelectMode: {
    top: Dimensions.get('window').height < 670 ? 10 : 5,
    right: 5,
    textAlign: 'right',
  },
  dateText: {
    fontFamily: Fonts.bodyItalic,
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
  },
  deckCountText: {
    fontFamily: Fonts.bodyItalic,
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
  },
  dateDeckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: '75%',
    right: 10,
    left: 65,
    zIndex: 2,
  },
  dateDeckRowSelectMode: {
    top: Dimensions.get('window').height < 670 ? '70%' : '70%',
    right: 35,
    zIndex: 2,
  },
}); 