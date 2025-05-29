import React from 'react';
import { View, StyleSheet, ViewStyle, ImageBackground, Platform } from 'react-native';

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Card({ style, children }: CardProps) {
  return (
    <View style={styles.shadowContainer}>
      <ImageBackground 
        source={require('@/assets/images/deckCover1.png')}
        style={[styles.container, style]}
        imageStyle={styles.backgroundImage}
      >
        {children}
      </ImageBackground>
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