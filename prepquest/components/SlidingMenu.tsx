import React from 'react';
import { StyleSheet, Animated, View, Platform, Dimensions } from 'react-native';

interface SlidingMenuProps {
  visible: boolean;
  translateX: Animated.Value;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function SlidingMenu({ 
  visible,
  translateX
}: SlidingMenuProps) {
  
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.menu,
        {
          transform: [{ translateX }]
        }
      ]}
    >
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: SCREEN_HEIGHT <= 670 ? 40 : 70,
    left: 0,
    width: 171,
    height: 152,
    backgroundColor: '#4F41D8',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1001, // Higher than the grey overlay
  },
}); 