import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View, PanResponder } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  duration?: number;
}

export function Toast({ visible, message, onHide, duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide toast after duration
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [visible, duration]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Clear timer when user starts interacting
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow upward movement
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped up more than 50px, dismiss the toast
        if (gestureState.dy < -50) {
          hideToast();
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View 
        style={styles.toast}
        {...panResponder.panHandlers}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingTop: 50, // Account for status bar
  },
  toast: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    textAlign: 'center',
  },
}); 