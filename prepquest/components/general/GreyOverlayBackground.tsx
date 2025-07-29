import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GreyOverlayBackgroundProps {
  visible: boolean;
  opacity?: Animated.Value;
  onPress?: () => void;
}

export const GreyOverlayBackground = React.memo(({ 
  visible,
  opacity,
  onPress
}: GreyOverlayBackgroundProps) => {
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  // Memoize style objects to prevent recreation - MUST be before conditional return
  const baseStyle = useMemo(() => styles.overlay, []);
  const animatedStyle = useMemo(() => 
    opacity ? { opacity } : { opacity: 0 }, 
    [opacity]
  );

  // Memoize combined style array
  const combinedStyle = useMemo(() => [baseStyle, animatedStyle], [baseStyle, animatedStyle]);

  if (!visible) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View style={combinedStyle} />
    </TouchableWithoutFeedback>
  );
});

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