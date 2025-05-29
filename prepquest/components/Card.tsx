import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, ImageBackground, Platform, Pressable } from 'react-native';

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
}

export function Card({ style, children, onPress }: CardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <View style={styles.shadowContainer}>
      <Pressable 
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
      >
        <ImageBackground 
          source={isPressed 
            ? require('@/assets/images/deckCover1Pressed.png')
            : require('@/assets/images/deckCover1.png')
          }
          style={[styles.container, style]}
          imageStyle={styles.backgroundImage}
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
  container: {
    height: 124,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden', // This ensures the image respects the border radius
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});