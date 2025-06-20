import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, ImageBackground, Platform, Pressable, Dimensions, ImageSourcePropType, Animated, Text, Image } from 'react-native';
import { CircleSelectButton } from './CircleSelectButton';
import { FavoriteButton } from './FavoriteButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LARGE_SCREEN_THRESHOLD = 390; // iPhone 14 width as reference point

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
  backgroundImage: ImageSourcePropType;
  pressedBackgroundImage: ImageSourcePropType;
  containerWidthPercentage?: Animated.Value;
  isSelectMode?: boolean;
  selected?: boolean;
  onSelectPress?: () => void;
  circleButtonOpacity?: Animated.Value;
  percent?: number;
  showProgress?: boolean;
  image?: ImageSourcePropType;
  cardType?: string;
  title?: string;
  date?: string;
  flashcardCount?: number;
}

export function Card({ 
  style, 
  children, 
  onPress, 
  backgroundImage, 
  pressedBackgroundImage,
  containerWidthPercentage = new Animated.Value(100),
  isSelectMode = false,
  selected = false,
  onSelectPress,
  circleButtonOpacity,
  percent = 0,
  showProgress = false,
  image,
  cardType,
  title,
  date,
  flashcardCount,
}: CardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isLargeScreen = SCREEN_WIDTH > LARGE_SCREEN_THRESHOLD;
  const [showSelectPill, setShowSelectPill] = useState(isSelectMode);
  const selectPillAnim = useRef(new Animated.Value(isSelectMode ? 1 : 0)).current;
  const unselectPillAnim = useRef(new Animated.Value(isSelectMode ? 0 : 1)).current;
  const [showProgressRow, setShowProgressRow] = useState(showProgress);
  const progressAnim = useRef(new Animated.Value(showProgress ? 1 : 0)).current;

  useEffect(() => {
    if (isSelectMode) {
      setShowSelectPill(true);
      Animated.parallel([
        Animated.timing(selectPillAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(unselectPillAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(selectPillAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(unselectPillAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSelectPill(false));
    }
  }, [isSelectMode]);

  useEffect(() => {
    if (showProgress) {
      setShowProgressRow(true);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowProgressRow(false));
    }
  }, [showProgress]);

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

  // Card type color and label logic
  const cardTypeMap: Record<string, { color: string; label: string }> = {
    behavioral: { color: '#FDAE61', label: 'Behavioral' },
    technical: { color: '#D7191C', label: 'Technical' },
    brainteasers: { color: '#357AF6', label: 'Brainteasers' },
    'case study': { color: '#C3EB79', label: 'Case Study' },
    others: { color: '#FDAE61', label: 'Others' },
    study: { color: '#5CC8BE', label: 'Study' },
  };
  const typeInfo = cardTypeMap[cardType || 'study'] || cardTypeMap['study'];

  return (
    <View style={styles.outerContainer}>
      <View style={styles.shadowContainer}>
        <Pressable 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          <Animated.View style={[styles.container, containerStyle, style]}>
            <ImageBackground 
              source={isPressed && !isSelectMode ? pressedBackgroundImage : backgroundImage}
              style={styles.imageBackground}
              imageStyle={[
                styles.backgroundImage,
                { resizeMode: isLargeScreen ? 'stretch' : 'contain' }
              ]}
            >
              <View style={styles.cardContentContainer}>
                {/* Icon image at top left */}
                {image && (
                  <Image source={image} style={styles.cardIconImage} />
                )}
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
                      styles.cardTitle,
                      isSelectMode && styles.cardTitleSelectMode
                    ]} 
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                )}
                {/* Date and Flashcard Count Row */}
                {(date || flashcardCount !== undefined) && (
                  <View 
                    style={[
                      styles.dateFlashcardRow,
                      isSelectMode && styles.dateFlashcardRowSelectMode
                    ]}
                  >
                    {!isSelectMode && date && (
                      <Text style={styles.dateText}>{date}</Text>
                    )}
                    {flashcardCount !== undefined && (
                      <Text style={styles.flashcardCountText}>{flashcardCount} cards</Text>
                    )}
                  </View>
                )}
                {/* Animated card type pill crossfade */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.cardTypePill,
                    styles.cardTypePillUnselected,
                    { borderColor: typeInfo.color, opacity: unselectPillAnim }
                  ]}
                >
                  <Text style={[styles.cardTypeText, { color: '#000' }]}>{typeInfo.label}</Text>
                </Animated.View>
                {showSelectPill && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.cardTypePill,
                      styles.cardTypePillSelected,
                      { borderColor: typeInfo.color, opacity: selectPillAnim }
                    ]}
                  >
                    <Text style={[styles.cardTypeText, { color: '#000' }]}>{typeInfo.label}</Text>
                  </Animated.View>
                )}
              {children}
                {showProgressRow && (
                  <Animated.View style={[styles.progressRow, { opacity: progressAnim }]}> 
                    <View style={styles.loadingBarFlexWrapper}>
                      <LoadingBar percent={percent} />
                    </View>
                    <Text style={styles.progressLabel}>{percent}% progress</Text>
                  </Animated.View>
                )}
              </View>
            </ImageBackground>
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

function LoadingBar({ percent }: { percent: number }) {
  const isComplete = percent === 100;
  return (
    <View style={styles.loadingBarBg}>
      <View style={[styles.loadingBarFg, { width: `${percent}%`, backgroundColor: isComplete ? '#44B88A' : '#4F41D8' }]} />
      {isComplete && (
        <View style={styles.loadingBarTextContainer}>
          <Text style={styles.loadingBarCompleteText}>Completed!</Text>
        </View>
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
  container: {
    height: 124,
    borderRadius: 20,
    overflow: 'hidden', // This ensures the image respects the border radius
  },
  imageBackground: {
    height: '100%',
    width: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  circleSelectButton: {
    position: 'absolute',
    right: 8,
    top: Dimensions.get('window').height < 670 ? '41%' : '50%',
    zIndex: 1,
  },
  firstCardCircleButton: {
    transform: [{ translateY: Dimensions.get('window').height < 670 ? 0 : -15 }],
  },
  cardContentContainer: {
    flex: 1,
    margin: 10,
    justifyContent: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  loadingBarFlexWrapper: {
    flex: 1,
    marginRight: 12,
    marginLeft: 8,
  },
  loadingBarBg: {
    height: 11,
    borderRadius: 13,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    width: '100%',
  },
  loadingBarFg: {
    height: 11,
    borderRadius: 13,
    backgroundColor: '#4F41D8',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  progressLabel: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 12,
    color: '#222',
    textAlign: 'right',
    minWidth: 70,
    marginRight: 8,
  },
  loadingBarTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -2.5,
    bottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loadingBarCompleteText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  cardIconImage: {
    position: 'absolute',
    top: 15,
    left: 10,
    width: 54,
    height: 54,
    resizeMode: 'contain',
    zIndex: 2,
  },
  cardTypePill: {
    position: 'absolute',
    width: 84,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardTypePillUnselected: {
    top: 42,
    right: 2,
    height: 38,
    borderRadius: 21,
  },
  cardTypePillSelected: {
    bottom: Dimensions.get('window').height < 670 ? '10%' : '5%',
    right: '45%',
    height: 24,
    borderRadius: 12,
  },
  cardTypeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 5,
    right: 2,
    zIndex: 3,
  },
  favoriteButtonContainerSelectMode: {
    top: Dimensions.get('window').height < 670 ? '62%' : '70%',
    right: 2,
    zIndex: 3,
  },
  cardTitle: {
    position: 'absolute',
    top: 5,
    right: 90,
    left: 80,
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    color: '#000',
    zIndex: 2,
    lineHeight: 26,
  },
  cardTitleSelectMode: {
    top: Dimensions.get('window').height < 670 ? 10 : 5,
    right: 5,
    left: 80,
    textAlign: 'right',
  },
  dateFlashcardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 65,
    right: 100,
    left: 80,
    zIndex: 2,
  },
  dateFlashcardRowSelectMode: {
    justifyContent: 'center',
    top: Dimensions.get('window').height < 670 ? '70%' : '75%',
    right: 35,
    left: '57%',
    zIndex: 2,
  },
  dateText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
  },
  flashcardCountText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
  },
});