import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, ImageBackground, Platform, Pressable, Dimensions, ImageSourcePropType } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LARGE_SCREEN_THRESHOLD = 390; // iPhone 14 width as reference point

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
  backgroundImage: ImageSourcePropType;
  pressedBackgroundImage: ImageSourcePropType;
}

export function Card({ style, children, onPress, backgroundImage, pressedBackgroundImage }: CardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isLargeScreen = SCREEN_WIDTH > LARGE_SCREEN_THRESHOLD;

  return (
    <View style={[
      styles.shadowContainer,
      isPressed && styles.noShadow
    ]}>
      <Pressable 
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
      >
        <ImageBackground 
          source={isPressed ? pressedBackgroundImage : backgroundImage}
          style={[styles.container, style]}
          imageStyle={[
            styles.backgroundImage,
            { resizeMode: isLargeScreen ? 'stretch' : 'contain' }
          ]}
        >
          {children}
        </ImageBackground>
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
  noShadow: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
    }),
  },
  container: {
    height: 124,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden', // This ensures the image respects the border radius
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
});