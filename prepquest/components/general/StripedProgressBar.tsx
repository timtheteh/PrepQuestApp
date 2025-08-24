import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface StripedProgressBarProps {
  progress: number; // 0-100
  width?: number;
  height?: number;
  borderRadius?: number;
}

export const StripedProgressBar: React.FC<StripedProgressBarProps> = ({
  progress,
  width = 300,
  height = 60,
  borderRadius = 30,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  // Animate the stripes continuously
  useEffect(() => {
    const animate = () => {
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        animationValue.setValue(0);
        animate();
      });
    };
    animate();
  }, [animationValue]);

  // Animate progress changes
  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressValue]);

  const translateX = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40], // Move stripes 40px to create animation effect
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[
      styles.container,
      {
        width,
        height,
        borderRadius,
        backgroundColor: colors.secondaryShade,
      }
    ]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: progressWidth,
            height,
            borderRadius,
            backgroundColor: colors.brandColor1,
            overflow: 'hidden',
          }
        ]}
      >
        <Animated.View
          style={[
            styles.stripesContainer,
            {
              transform: [{ translateX }],
            }
          ]}
        >
          {/* Create multiple stripe elements */}
          {Array.from({ length: 20 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.stripe,
                {
                  backgroundColor: colors.brandColor2,
                  left: index * 40,
                }
              ]}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stripesContainer: {
    position: 'absolute',
    top: 0,
    left: -40,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    transform: [{ skewX: '-20deg' }],
  },
});
