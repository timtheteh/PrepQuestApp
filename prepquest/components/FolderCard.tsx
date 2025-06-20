import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Platform, Pressable, Animated, Dimensions, Text } from 'react-native';
import { CircleSelectButton } from './CircleSelectButton';
import { FavoriteButton } from './FavoriteButton';
import FolderCardIcon from '@/assets/icons/FolderCardIcon.svg';
import Svg, { Path } from 'react-native-svg';

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
}

export function FolderCard({ 
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
  deckCount
}: FolderCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const containerStyle = {
    width: containerWidthPercentage.interpolate({
      inputRange: [85, 100],
      outputRange: ['85%', '100%']
    })
  };

  const handlePressIn = () => {
    if (!isSelectMode) {
      setIsPressed(true);
    }
  };

  const handlePressOut = () => {
    if (!isSelectMode) {
      setIsPressed(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.shadowContainer,
        isPressed && styles.shadowContainerPressed
      ]}>
        <Pressable 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[
            styles.container, 
            containerStyle, 
            style,
            isPressed && styles.containerPressed
          ]}>
            <View style={styles.cardContentContainer}>
              {/* Folder Icon */}
              <FolderCardIcon width={45} height={40} style={styles.folderIcon} />
              {/* Favorite button at top right */}
              <View 
                style={[
                  styles.favoriteButtonContainer,
                  isSelectMode && styles.favoriteButtonContainerSelectMode
                ]}
              >
                <FavoriteButton isSelectMode={isSelectMode} />
              </View>
              {/* Title */}
              {title && (
                <Text 
                  style={[
                    styles.folderTitle,
                    isSelectMode && styles.folderTitleSelectMode
                  ]} 
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {/* Date and Deck Count Row */}
              {(dateCreated || deckCount !== undefined) && (
                <View 
                  style={[
                    styles.dateDeckRow,
                    isSelectMode && styles.dateDeckRowSelectMode
                  ]}
                >
                  {dateCreated && (
                    <Text style={styles.dateText}>{dateCreated}</Text>
                  )}
                  {deckCount !== undefined && (
                    <Text style={styles.deckCountText}>{deckCount} decks</Text>
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
          style={{
            ...styles.circleSelectButton,
            ...(style?.marginTop === 5 ? styles.firstCardCircleButton : {})
          }}
          selected={selected}
          onPress={onSelectPress}
          opacity={circleButtonOpacity}
        />
      )}
    </View>
  );
}

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
    backgroundColor: Platform.OS === 'android' ? '#EFEFEF' : '#F8F8F8',
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
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    color: '#000',
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
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
  },
  deckCountText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
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
    // borderWidth: 1,
    // borderColor: 'red',
  },
  dateDeckRowSelectMode: {
    top: Dimensions.get('window').height < 670 ? '70%' : '70%',
    right: 35,
    zIndex: 2,
  },
}); 