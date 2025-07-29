import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle, ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { strings } from '@/constants/strings';

interface DifficultyToggleRowProps extends ViewProps {
  onToggle?: (selectedIndex: number) => void;
  initialIndex?: number;
  optionLabelStyle?: StyleProp<TextStyle>;
  language?: string;
}

export const DifficultyToggleRow = React.memo(({
  onToggle,
  initialIndex = 0,
  optionLabelStyle,
  style,
  language,
  ...props
}: DifficultyToggleRowProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  
  const options = useMemo(() => [
    strings[language || 'English'].difficultyOptions.default,
    strings[language || 'English'].difficultyOptions.again,
    strings[language || 'English'].difficultyOptions.hard,
    strings[language || 'English'].difficultyOptions.good,
    strings[language || 'English'].difficultyOptions.easy,
  ], [language]);
  
  const { width: windowWidth } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const positionAnim = useRef(new Animated.Value(initialIndex)).current;
  const colorAnim = useRef(new Animated.Value(initialIndex)).current;

  // The toggle should fill the width of its container
  // We'll use 92% of the window width minus some padding for the statistics page
  const containerWidth = useMemo(() => windowWidth - 32, [windowWidth]);
  const segmentWidth = useMemo(() => containerWidth / 5, [containerWidth]);

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

  const handlePress = useCallback((index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index);
      onToggle?.(index);
    }
  }, [selectedIndex, onToggle]);

  // Animated highlight position
  const translateX = positionAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, segmentWidth, segmentWidth * 2, segmentWidth * 3, segmentWidth * 4],
  });

  // Animated background color for toggleBackground
  const colorRange = useMemo(() => [
    '#44B88A', // index 0
    '#F8696B', // index 1
    '#FA9473', // index 2
    '#FFEB84', // index 3
    '#98CE7F', // index 4
  ], []);
  const interpolatedColor = useMemo(() => positionAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: colorRange,
  }), [positionAnim, colorRange]);

  // Animated text color for each option
  const getTextColor = useCallback((idx: number) =>
    colorAnim.interpolate({
      inputRange: [0, 1, 2, 3, 4],
      outputRange: idx === 0
        ? ['#FFFFFF', '#D5D4DD', '#D5D4DD', '#D5D4DD', '#D5D4DD']
        : idx === 1
        ? ['#D5D4DD', '#FFFFFF', '#D5D4DD', '#D5D4DD', '#D5D4DD']
        : idx === 2
        ? ['#D5D4DD', '#D5D4DD', '#FFFFFF', '#D5D4DD', '#D5D4DD']
        : idx === 3
        ? ['#D5D4DD', '#D5D4DD', '#D5D4DD', '#000000', '#D5D4DD']
        : ['#D5D4DD', '#D5D4DD', '#D5D4DD', '#D5D4DD', '#FFFFFF']
    }), [colorAnim]);

  return (
    <View style={[styles.container, { width: containerWidth }, style]} {...props}>
      <View style={styles.innerContainer}>
        <Animated.View
          style={[
            styles.toggleBackground,
            {
              width: segmentWidth,
              transform: [{ translateX }],
              backgroundColor: interpolatedColor,
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
});

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    height: 26,
    backgroundColor: colors.secondaryShade,
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
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
}); 