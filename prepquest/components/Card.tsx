import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, ImageBackground, Platform, Pressable, Dimensions, ImageSourcePropType, Animated } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LARGE_SCREEN_THRESHOLD = 390; // iPhone 14 width as reference point

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
  backgroundImage: ImageSourcePropType;
  pressedBackgroundImage: ImageSourcePropType;
  containerWidthPercentage?: Animated.Value;
}

export function Card({ 
  style, 
  children, 
  onPress, 
  backgroundImage, 
  pressedBackgroundImage,
  containerWidthPercentage = new Animated.Value(100)
}: CardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isLargeScreen = SCREEN_WIDTH > LARGE_SCREEN_THRESHOLD;

  const containerStyle = {
    width: containerWidthPercentage.interpolate({
      inputRange: [85, 100],
      outputRange: ['85%', '100%']
    })
  };

  return (
    <View style={styles.shadowContainer}>
      <Pressable 
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
      >
        <Animated.View style={[styles.container, containerStyle, style]}>
          <ImageBackground 
            source={isPressed ? pressedBackgroundImage : backgroundImage}
            style={styles.imageBackground}
            imageStyle={[
              styles.backgroundImage,
              { resizeMode: isLargeScreen ? 'stretch' : 'contain' }
            ]}
          >
            {children}
          </ImageBackground>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});