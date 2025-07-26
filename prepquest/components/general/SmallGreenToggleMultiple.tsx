import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle, ViewProps } from 'react-native';

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
        ? ['#FFFFFF', '#D5D4DD', '#D5D4DD', '#D5D4DD']
        : idx === 1
        ? ['#D5D4DD', '#FFFFFF', '#D5D4DD', '#D5D4DD']
        : idx === 2
        ? ['#D5D4DD', '#D5D4DD', '#FFFFFF', '#D5D4DD']
        : ['#D5D4DD', '#D5D4DD', '#D5D4DD', '#FFFFFF']
    });

  return (
    <View style={[styles.container, { width: containerWidth }, style]} {...props}>
      <View style={styles.innerContainer}>
        <Animated.View
          style={[
            styles.toggleBackground,
            {
              width: segmentWidth,
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
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
  },
  toggleBackground: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#44B88A',
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
    fontFamily: 'Satoshi-Medium',
  },
}); 