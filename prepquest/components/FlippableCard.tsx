import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Text, Dimensions } from 'react-native';
import FlippableCardFrontFlipArrow from '@/assets/icons/flippableCardFrontFlipArrow.svg';
import FlippableCardBackFlipArrow from '@/assets/icons/flippableCardBackFlipArrow.svg';
import MicIcon from '@/assets/icons/micIcon.svg';
import Svg, { Path } from 'react-native-svg';
import { DrawableOptionsRow } from './DrawableOptionsRow';

interface FlippableCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  frontContentTitle?: string;
  backContentTitle?: string;
  fadeOpacity?: Animated.Value;
  cardType?: 'image' | 'camera' | 'marker' | 'mic' | 'text';
}

export interface FlippableCardRef {
  resetToFront: () => void;
}

const FlippableCardFlipArrowSize = 30;

export const FlippableCard = forwardRef<FlippableCardRef, FlippableCardProps>(({ 
  style, 
  children, 
  frontContent,
  backContent,
  frontContentTitle,
  backContentTitle,
  fadeOpacity,
  cardType = 'text',
}, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const [displayedCardType, setDisplayedCardType] = useState(cardType);
  const [isInitialRender, setIsInitialRender] = useState(true);

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
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsFlipped(!isFlipped);
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
        return "Click here to take\nyour picture!";
      case 'image':
        return "Click here to upload\nyour picture!";
      default:
        return "Type here!";
    }
  };

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeOpacity }]}>
      {/* Red bordered area stacked above the card */}
      <Animated.View style={[styles.transparentOverlayArea, { opacity: overlayOpacity }]} >
        <View style={styles.topBar2}>
          {cardType === 'marker' && <DrawableOptionsRow />}
        </View>
        <View style={[styles.overlayTextContainer, { transform: displayedCardType === 'mic' || displayedCardType === 'image' || displayedCardType === 'camera' ? [{ translateY: -30 }] : [{ translateY: 0 }] }]}>
          <Text style={styles.overlayText}>{getOverlayText()}</Text>
        </View>
        
        {displayedCardType === 'mic' && (
          <View style={styles.micButtonsContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.micButton,
                pressed && styles.buttonPressed
              ]}
              android_ripple={{ color: '#E0E0E0', borderless: false }}
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
              android_ripple={{ color: '#E0E0E0', borderless: false }}
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
            {/* Main Content */}
            <View style={styles.mainContent}>
              {frontContent || children}
            </View>
            
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
            <View style={styles.mainContent}>
              {backContent}
            </View>
            
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
    borderWidth: 1,
    borderColor: 'yellow',
  },
  topBar2: {
    height: 70,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 5,
    borderWidth: 1,
    borderColor: 'blue',
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
    borderWidth: 2,
    borderColor: 'red',
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
    borderWidth: 2,
    borderColor: 'green',
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
    borderWidth: 1,
    borderColor: 'red',
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
}); 