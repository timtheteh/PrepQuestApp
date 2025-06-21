import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Text, Dimensions, ScrollView } from 'react-native';
import FlippableCardFrontFlipArrow from '@/assets/icons/flippableCardFrontFlipArrow.svg';
import FlippableCardBackFlipArrow from '@/assets/icons/flippableCardBackFlipArrow.svg';
import MicIcon from '@/assets/icons/micIcon.svg';
import Svg, { Path } from 'react-native-svg';
import { DrawableOptionsRow } from './DrawableOptionsRow';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLastTypedText } from '../app/textInputModal';
import ImageIconFilled from '@/assets/icons/imageIconFilled.svg';
import CameraIconFilled from '@/assets/icons/cameraIconFilled.svg';

interface CardContent {
  content: React.ReactNode;
  type: 'camera' | 'marker' | 'mic' | 'text' | 'none';
}

interface FlippableCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  frontContentTitle?: string;
  backContentTitle?: string;
  fadeOpacity?: Animated.Value;
  cardType?: 'camera' | 'marker' | 'mic' | 'text' | 'none';
  onCardFlip?: () => void;
  onContentChange?: (hasContent: boolean) => void;
}

export interface FlippableCardRef {
  resetToFront: () => void;
  resetContent: () => void;
  hasContent: () => boolean;
  getCurrentContent: () => CardContent | null;
  getFrontContent: () => CardContent | null;
  getBackContent: () => CardContent | null;
  clearFrontContent: () => void;
  clearBackContent: () => void;
  loadCachedContent: (frontContent: CardContent | null, backContent: CardContent | null) => void;
}

const FlippableCardFlipArrowSize = 30;

export const FlippableCard = forwardRef<FlippableCardRef, FlippableCardProps>(({ 
  style, 
  children, 
  frontContentTitle,
  backContentTitle,
  fadeOpacity,
  cardType = 'text',
  onCardFlip,
  onContentChange,
}, ref) => {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontContent, setFrontContent] = useState<CardContent | null>(null);
  const [backContent, setBackContent] = useState<CardContent | null>(null);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const [displayedCardType, setDisplayedCardType] = useState(cardType);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Listen for focus events to check if text was typed in modal
  useFocusEffect(
    React.useCallback(() => {
      const typedText = getLastTypedText();
      if (typedText) {
        if (typedText === '__CLEAR_CONTENT__') {
          // Clear content based on current flip state
          if (isFlipped) {
            setBackContent(null);
          } else {
            setFrontContent(null);
          }
        } else {
          // Determine which side to update based on current flip state
          if (isFlipped) {
            setBackContent({
              content: <Text style={styles.contentText}>{typedText}</Text>,
              type: cardType
            });
          } else {
            setFrontContent({
              content: <Text style={styles.contentText}>{typedText}</Text>,
              type: cardType
            });
          }
        }
      }
    }, [isFlipped, cardType])
  );

  // Watch for cardType changes and animate overlay
  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      setDisplayedCardType(cardType);
      return;
    }

    if (displayedCardType !== cardType) {
      // Fade out current content
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Update displayed card type to show new content
        setDisplayedCardType(cardType);
        // Fade in new content
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [cardType, displayedCardType, isInitialRender]);

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    resetToFront: () => {
      setIsFlipped(false);
      // Instantly set the animation value without triggering the animation
      flipAnim.setValue(0);
      // Fade in overlay content
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    resetContent: () => {
      setFrontContent(null);
      setBackContent(null);
    },
    hasContent: () => {
      return frontContent !== null && backContent !== null;
    },
    getCurrentContent: () => {
      return isFlipped ? backContent : frontContent;
    },
    getFrontContent: () => {
      return frontContent;
    },
    getBackContent: () => {
      return backContent;
    },
    clearFrontContent: () => {
      setFrontContent(null);
    },
    clearBackContent: () => {
      setBackContent(null);
    },
    loadCachedContent: (frontContent: CardContent | null, backContent: CardContent | null) => {
      setFrontContent(frontContent);
      setBackContent(backContent);
    }
  }));

  const handlePress = () => {
    const toValue = isFlipped ? 0 : 1;
    
    // Fade out overlay area before flip
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Start flip animation
      Animated.timing(flipAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsFlipped(!isFlipped);
        // Call the callback to notify parent component
        onCardFlip?.();
        // Fade in overlay area after flip
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const getOverlayText = () => {
    switch (displayedCardType) {
      case 'text':
        return "Type here!";
      case 'mic':
        return "Press & hold mic \nbutton to record";
      case 'marker':
        return "Draw here!";
      case 'camera':
        return "Click here to take\nyour picture or\nupload from library!";
      case 'none':
        return "Choose your manual \noption above";
      default:
        return "Choose your manual \noption above";
    }
  };

  const handleOverlayPress = () => {
    if (cardType === 'text') {
        // Extract existing text from the current side
        let existingText = '';
        if (isFlipped && backContent) {
            // If we're on the back side and there's content, extract the text
            if (React.isValidElement(backContent.content) && backContent.content.type === Text) {
                const textElement = backContent.content as React.ReactElement<{ children?: string }>;
                existingText = textElement.props.children || '';
            }
        } else if (!isFlipped && frontContent) {
            // If we're on the front side and there's content, extract the text
            if (React.isValidElement(frontContent.content) && frontContent.content.type === Text) {
                const textElement = frontContent.content as React.ReactElement<{ children?: string }>;
                existingText = textElement.props.children || '';
            }
        }
        
        // Navigate to modal with existing text as parameter
        router.push({
            pathname: '/textInputModal',
            params: { existingText }
        });
    }
  };

  useEffect(() => {
    if (onContentChange) {
      onContentChange(frontContent !== null && backContent !== null);
    }
  }, [frontContent, backContent, onContentChange]);

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeOpacity }]}>
        <Animated.View style={[styles.transparentOverlayArea, { opacity: overlayOpacity }]} >
            {((!isFlipped && !frontContent) || (isFlipped && !backContent)) && (
            <>
                <View style={styles.topBar2}>
                {cardType === 'marker' && <DrawableOptionsRow />}
                </View>
                <Pressable onPress={handleOverlayPress} style={styles.overlayPressable}>
                    <View style={styles.container}>
                    <View style={[styles.overlayTextContainer, { transform: displayedCardType === 'mic' || displayedCardType === 'camera' ? [{ translateY: -30 }] : [{ translateY: 0 }] }]}>
                    <Text style={styles.overlayText}>{getOverlayText()}</Text>
                    </View>
                    {displayedCardType === 'mic' && (
                        <View style={styles.micButtonsContainer}>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.micButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {
                                console.log('Mic button pressed');
                                // Add your mic functionality here
                            }}
                            >
                            <MicIcon width={36} height={36} />
                            </Pressable>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.replayButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {
                                console.log('Replay button pressed');
                                // Add your replay functionality here
                            }}
                            >
                            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                                <Path 
                                d="M8 5v14l11-7z" 
                                fill="black"
                                transform="rotate(0 12 12)"
                                />
                            </Svg>
                            </Pressable>
                        </View>
                    )}
                    {displayedCardType === 'camera' && (
                        <View style={styles.micButtonsContainer}>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.micButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {
                                console.log('Image button pressed');
                                // Add your mic functionality here
                            }}
                            >
                            <ImageIconFilled width={30} height={30} />
                            </Pressable>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.replayButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {
                                console.log('Camera button pressed');
                                // Add your replay functionality here
                            }}
                            >
                            <CameraIconFilled width={38} height={38} />
                            </Pressable>
                        </View>
                    )}
                    </View>
                </Pressable>
            </>
            )}
            {(!isFlipped && frontContent) && (
                <View style={styles.mainContent}>
                    <ScrollView 
                        style={styles.scrollContainer}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        <Pressable onPress={handleOverlayPress} style={styles.overlayPressable}>
                        {frontContent.content || children}
                        </Pressable>
                    </ScrollView>
                </View>
            )}
            {(isFlipped && backContent) && (
            <View style={styles.mainContent}>
                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <Pressable onPress={handleOverlayPress} style={styles.overlayPressable}>
                    {backContent.content || children}
                    </Pressable>
                </ScrollView>
            </View>
            )}             
        </Animated.View>
      <View style={styles.transparentOverlayArea2} ></View>
      
      <Pressable onPress={handlePress} style={styles.pressableContainer}>
        <View style={styles.cardContainer}>
          <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                {frontContentTitle && (
                    <Text style={styles.titleText}>{frontContentTitle}</Text>
                )}
            </View>
            {/* Empty Area Do not touch this*/}
            <View style={styles.mainContent} />
            
            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <FlippableCardFrontFlipArrow width={FlippableCardFlipArrowSize} height={FlippableCardFlipArrowSize} style={styles.frontFlipArrow}/>
            </View>
          </Animated.View>
          
          <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              {backContentTitle && (
                <Text style={styles.titleText}>{backContentTitle}</Text>
              )}
            </View>
            
            {/* Main Content */}
            <View style={styles.mainContent} />
            
            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <FlippableCardBackFlipArrow width={FlippableCardFlipArrowSize} height={FlippableCardFlipArrowSize} style={styles.backFlipArrow}/>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayPressable: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'red',
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
  },
  card: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    backgroundColor: '#F8F8F8',
  },
  backCard: {
    backgroundColor: '#F8F8F8',
  },
  topBar: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
  },
  topBar2: {
    height: 70,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 5,
    backgroundColor: 'transparent',
  },
  titleText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '600',
    fontSize: 24,
    color: '#000',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  contentText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    color: '#000',
    lineHeight: 24,
    textAlign: 'center',
  },
  bottomBar: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
  },
  frontFlipArrow: {
    marginRight: '1%',
    marginBottom: Dimensions.get('window').height < 670 ? -8 : Dimensions.get('window').height > 920 ? '3%' : Dimensions.get('window').height > 900 ? '2%' : '0.5%',
    marginLeft: '85%',
  },
  backFlipArrow: {
    marginRight: '1%',
    marginBottom: Dimensions.get('window').height < 670 ? -8 : Dimensions.get('window').height > 920 ? '3%' : Dimensions.get('window').height > 900 ? '2%' : '0.5%',
    marginLeft: '85%',
  },
  transparentOverlayArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    height: '90%',
    backgroundColor: 'transparent',
  },
  transparentOverlayArea2: {
    position: 'absolute',
    top: '90%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    height: '10%',
    width: '85%',
    backgroundColor: 'transparent',
  },
  pressableContainer: {
    flex: 1,
  },
  overlayTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  overlayText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 28,
    color: '#D5D4DD',
    textAlign: 'center',
  },
  micButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: '25%',
  },
  micButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replayButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E8E8E8',
    transform: [{ scale: 0.95 }],
  },
  scrollContainer: {
    flex: 1,
    marginTop: 45,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
}); 