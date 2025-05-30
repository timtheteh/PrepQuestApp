import React from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GreyOverlayBackgroundProps {
  visible: boolean;
  opacity?: Animated.Value;
}

export function GreyOverlayBackground({ 
  visible,
  opacity = new Animated.Value(0)
}: GreyOverlayBackgroundProps) {
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: opacity
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
}); 