import React from 'react';
import { StyleSheet, Animated, Dimensions, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddDeckModalProps {
  visible: boolean;
  opacity?: Animated.Value;
}

export function AddDeckModal({ 
  visible,
  opacity = new Animated.Value(0)
}: AddDeckModalProps) {
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacity
        }
      ]}
    >
      <View style={styles.content}>
        {/* Content will be added here */}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: '50%',
    width: 355,
    height: 388,
    marginLeft: -177.5, // Half of width
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 10,
    borderColor: '#4F41D8',
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  content: {
    flex: 1,
    padding: 24,
  },
}); 