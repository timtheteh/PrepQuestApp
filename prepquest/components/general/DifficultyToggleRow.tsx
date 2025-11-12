import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle, ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  language: languageProp,
  ...props
}: DifficultyToggleRowProps) => {
  const { theme } = useTheme();
  const { language: languageFromContext } = useLanguage();
  const colors = Colors[theme];
  
  // Use prop language if provided, otherwise use context language, fallback to English
  const language = languageProp || languageFromContext || 'English';
  
  const options = useMemo(() => [
    strings[language as keyof typeof strings]?.difficultyOptions?.default ?? strings.English.difficultyOptions.default,
    strings[language as keyof typeof strings]?.difficultyOptions?.again ?? strings.English.difficultyOptions.again,
    strings[language as keyof typeof strings]?.difficultyOptions?.hard ?? strings.English.difficultyOptions.hard,
    strings[language as keyof typeof strings]?.difficultyOptions?.good ?? strings.English.difficultyOptions.good,
    strings[language as keyof typeof strings]?.difficultyOptions?.easy ?? strings.English.difficultyOptions.easy,
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

  const handlePress = (index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index);
      onToggle?.(index);
    }
  };

  // Animated highlight position
  const translateX = positionAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, segmentWidth, segmentWidth * 2, segmentWidth * 3, segmentWidth * 4],
  });

  // Animated background color for toggleBackground
  const colorRange = [
    '#44B88A', // index 0
    '#F8696B', // index 1
    '#FA9473', // index 2
    '#FFEB84', // index 3
    '#98CE7F', // index 4
  ];
  const interpolatedColor = useMemo(() => positionAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: colorRange,
  }), [positionAnim, colorRange]);

  // Animated text color for each option
  const getTextColor = (idx: number) => {
    if (theme === 'dark') {
      // In dark mode, use unselectedText for unselected options, background for selected
      return colorAnim.interpolate({
        inputRange: [0, 1, 2, 3, 4],
        outputRange: idx === 0
          ? [colors.background, colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.unselectedText]
          : idx === 1
          ? [colors.unselectedText, colors.background, colors.unselectedText, colors.unselectedText, colors.unselectedText]
          : idx === 2
          ? [colors.unselectedText, colors.unselectedText, colors.background, colors.unselectedText, colors.unselectedText]
          : idx === 3
          ? [colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.background, colors.unselectedText]
          : [colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.background]
      });
    } else {
      // In light mode, use original colors
      return colorAnim.interpolate({
        inputRange: [0, 1, 2, 3, 4],
        outputRange: idx === 0
          ? [colors.background, colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.unselectedText]
          : idx === 1
          ? [colors.unselectedText, colors.background, colors.unselectedText, colors.unselectedText, colors.unselectedText]
          : idx === 2
          ? [colors.unselectedText, colors.unselectedText, colors.background, colors.unselectedText, colors.unselectedText]
          : idx === 3
          ? [colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.text, colors.unselectedText]
          : [colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.unselectedText, colors.background]
      });
    }
  };

  return (
    <View style={[styles.container, { width: containerWidth, backgroundColor: colors.secondaryShade }, style]} {...props}>
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
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
}); 