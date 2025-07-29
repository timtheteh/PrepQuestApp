import React from 'react';
import { StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GreyOverlayBackgroundProps {
  visible: boolean;
  opacity?: Animated.Value;
  onPress?: () => void;
}

export const GreyOverlayBackground = ({ 
  visible,
  opacity,
  onPress
}: GreyOverlayBackgroundProps) => {
  if (!visible) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={[
        styles.overlay,
        opacity ? { opacity } : { opacity: 0 }
      ]} />
    </TouchableWithoutFeedback>
  );
};

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