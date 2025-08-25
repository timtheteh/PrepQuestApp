import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface StripedProgressBarProps {
  progress: number; // 0-100
  width?: number;
  height?: number;
  borderRadius?: number;
  currentItems?: number;
  totalItems?: number;
  showLabel?: boolean;
  immediateProgress?: boolean; // If true, progress updates immediately without animation
}

export const StripedProgressBar: React.FC<StripedProgressBarProps> = ({
  progress,
  width,
  height = 60,
  borderRadius = 30,
  currentItems,
  totalItems,
  showLabel = true,
  immediateProgress = false,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  // Animate the stripes continuously
  useEffect(() => {
    Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      { iterations: -1 } // Infinite loop
    ).start();
  }, [animationValue]);

  // Animate progress changes
  useEffect(() => {
    if (isFirstRender.current) {
      // On first render, set the progress immediately without animation
      progressValue.setValue(progress);
      isFirstRender.current = false;
    } else if (immediateProgress) {
      // Set progress immediately without animation
      progressValue.setValue(progress);
    } else {
      // Animate to new progress value
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [progress, progressValue, immediateProgress]);

  const translateX = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40], // Move stripes 40px to create animation effect
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Generate progress label text
  const getProgressLabel = () => {
    const percentage = Math.round(progress);
    if (currentItems !== undefined && totalItems !== undefined) {
      return `${percentage}% (${currentItems}/${totalItems} items uploaded)`;
    }
    return `${percentage}%`;
  };

  return (
    <View style={[
      styles.container,
      {
        width: width || '100%',
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
      
      {/* Progress Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text 
            style={[
              styles.progressLabel,
              {
                fontSize: height * 0.25, // Scale font size with height
                color: 'white',
              }
            ]}
          >
            {getProgressLabel()}
          </Text>
        </View>
      )}
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
    top: -10,
    bottom: -10,
    width: 20,
    transform: [{ rotateZ: '20deg' }],
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  progressLabel: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
