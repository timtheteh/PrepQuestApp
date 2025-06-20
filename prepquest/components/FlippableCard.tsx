import React, { useState, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Text, Dimensions } from 'react-native';
import FlippableCardFrontFlipArrow from '@/assets/icons/flippableCardFrontFlipArrow.svg';
import FlippableCardBackFlipArrow from '@/assets/icons/flippableCardBackFlipArrow.svg';

interface FlippableCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  frontContentTitle?: string;
  backContentTitle?: string;
}

const FlippableCardFlipArrowSize = 30;

export const FlippableCard: React.FC<FlippableCardProps> = ({ 
  style, 
  children, 
  frontContent,
  backContent,
  frontContentTitle,
  backContentTitle,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    const toValue = isFlipped ? 0 : 1;
    
    Animated.timing(flipAnim, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
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

  return (
    <View style={[styles.container, style]}>
      {/* Red bordered area stacked above the card */}
      <View style={styles.transparentOverlayArea} >
        
      </View>
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
    </View>
  );
};

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
    borderColor: 'blue',
  },
  titleText: {
    fontFamily: 'Satoshi-Bold',
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
}); 