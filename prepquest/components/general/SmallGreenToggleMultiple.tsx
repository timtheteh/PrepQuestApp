import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle, ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface SmallGreenToggleMultipleProps extends ViewProps {
  options: string[]; // Must be length 4
  onToggle?: (selectedIndex: number) => void;
  initialIndex?: number;
  optionLabelStyle?: StyleProp<TextStyle>;
}

export function SmallGreenToggleMultiple({
  options,
  onToggle,
  initialIndex = 0,
  optionLabelStyle,
  style,
  ...props
}: SmallGreenToggleMultipleProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const positionAnim = useRef(new Animated.Value(initialIndex)).current;
  const colorAnim = useRef(new Animated.Value(initialIndex)).current;

  // The toggle should fill the width of its container
  // We'll use 92% of the window width minus some padding for the statistics page
  const containerWidth = windowWidth - 32;
  const segmentWidth = containerWidth / 4;

  useEffect(() => {
    Animated.timing(positionAnim, {
      toValue: selectedIndex,
      duration: 220,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    Animated.timing(colorAnim, {
      toValue: selectedIndex,
      duration: 220,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [selectedIndex]);

  const handlePress = (index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index);
      onToggle?.(index);
    }
  };

  // Animated highlight position
  const translateX = positionAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, segmentWidth, segmentWidth * 2, segmentWidth * 3],
  });

  // Animated text color for each option
  const getTextColor = (idx: number) =>
    colorAnim.interpolate({
      inputRange: [0, 1, 2, 3],
      outputRange: idx === 0
        ? [colors.background, colors.unselectedText, colors.unselectedText, colors.unselectedText]
        : idx === 1
        ? [colors.unselectedText, colors.background, colors.unselectedText, colors.unselectedText]
        : idx === 2
        ? [colors.unselectedText, colors.unselectedText, colors.background, colors.unselectedText]
        : [colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.background]
    });

  return (
    <View style={[styles.container, { width: containerWidth, backgroundColor: colors.secondaryShade }, style]} {...props}>
      <View style={styles.innerContainer}>
        <Animated.View
          style={[
            styles.toggleBackground,
            {
              width: segmentWidth,
              backgroundColor: colors.brandColor2,
              transform: [{ translateX }],
            },
          ]}
        />
        <View style={styles.labelContainer}>
          {options.map((label, idx) => (
            <TouchableWithoutFeedback key={label} onPress={() => handlePress(idx)}>
              <View style={[styles.labelSection, { width: segmentWidth }]}> 
                <Animated.Text style={[optionLabelStyle ? optionLabelStyle : styles.label, { color: getTextColor(idx) }]}> 
                  {label}
                </Animated.Text>
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 26,
    borderRadius: 10,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
  },
  toggleBackground: {
    position: 'absolute',
    height: '100%',
    borderRadius: 10,
    zIndex: 1,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
  },
  labelSection: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
}); 