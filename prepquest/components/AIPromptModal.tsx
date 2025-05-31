import React from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIPromptModalProps {
  visible: boolean;
  opacity?: Animated.Value;
}

export function AIPromptModal({ 
  visible,
  opacity = new Animated.Value(0)
}: AIPromptModalProps) {
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacity
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 350,
    height: 504,
    marginLeft: -175, // Half of width
    marginTop: -252, // Half of height
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
}); 