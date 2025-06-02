import React from 'react';
import { StyleSheet, Animated, View } from 'react-native';

interface GenericModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  children?: React.ReactNode;
}

export function GenericModal({ 
  visible,
  opacity = new Animated.Value(0),
  children
}: GenericModalProps) {
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
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 305,
    height: 233,
    marginLeft: -152.5, // Half of width
    marginTop: -116.5, // Half of height
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