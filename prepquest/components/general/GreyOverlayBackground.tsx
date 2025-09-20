import React from 'react';
import { StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

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
  const insets = useSafeAreaInsets();
  
  if (!visible) {
    return null;
  }

  const overlayStyle = {
    ...styles.overlay,
    // Extend beyond safe area to cover full screen
    top: -insets.top,
    left: -insets.left,
    width: SCREEN_WIDTH + insets.left + insets.right,
    height: SCREEN_HEIGHT + insets.top + insets.bottom,
  };

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={[
        overlayStyle,
        opacity ? { opacity } : { opacity: 0 }
      ]} />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: '#000000',
    zIndex: 1000,
  },
}); 