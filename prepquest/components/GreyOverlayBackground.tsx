import React, { useCallback } from 'react';
import { StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GreyOverlayBackgroundProps {
  visible: boolean;
  opacity?: Animated.Value;
  onPress?: () => void;
}

export function GreyOverlayBackground({ 
  visible,
  opacity,
  onPress
}: GreyOverlayBackgroundProps) {
  if (!visible) {
    return null;
  }

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  const baseStyle = styles.overlay;
  const animatedStyle = opacity ? { opacity } : { opacity: 0 };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View style={[baseStyle, animatedStyle]} />
    </TouchableWithoutFeedback>
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