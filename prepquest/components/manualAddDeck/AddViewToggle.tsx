import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, ViewStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface AddViewToggleProps {
  onToggle?: (option: 'add' | 'view') => void;
  initialState?: 'add' | 'view';
  selected?: 'add' | 'view';
  style?: ViewStyle;
}

export function AddViewToggle({
  onToggle,
  initialState = 'add',
  selected: externalSelected,
  style
}: AddViewToggleProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [internalSelected, setInternalSelected] = useState<'add' | 'view'>(initialState);
  const translateX = useState(new Animated.Value(initialState === 'add' ? 0 : 1))[0];
  const screenWidth = Dimensions.get('window').width;
  
  // Use external selected state if provided, otherwise use internal state
  const selected = externalSelected !== undefined ? externalSelected : internalSelected;
  
  // Calculate the distance to move
  // Each half is 50% of screen width, so we move from 14% to (50% + 14%) of screen width
  const startPosition = -30;
  const endPosition = (screenWidth * 0.5) - 45; // Move to center of right half

  useEffect(() => {
    const newSelected = externalSelected !== undefined ? externalSelected : initialState;
    setInternalSelected(newSelected);
    Animated.timing(translateX, {
      toValue: newSelected === 'add' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [externalSelected, initialState, translateX]);

  const handleToggle = (option: 'add' | 'view') => {
    if (externalSelected !== undefined) {
      // If external state is provided, only call the callback
      if (onToggle) {
        onToggle(option);
      }
    } else {
      // Otherwise use internal state
      setInternalSelected(option);
      if (onToggle) {
        onToggle(option);
      }
    }

    Animated.timing(translateX, {
      toValue: option === 'add' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const translatePosition = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [startPosition, endPosition],
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.toggleHalf}
        onPress={() => handleToggle('add')}
      >
        <View style={styles.textContainer}>
          <Text style={[
            styles.text,
            { color: selected === 'add' ? colors.text : colors.unselectedText }
          ]}>
            {strings[language].addFlashcards}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.toggleHalf}
        onPress={() => handleToggle('view')}
      >
        <View style={styles.textContainer}>
          <Text style={[
            styles.text,
            { color: selected === 'view' ? colors.text : colors.unselectedText }
          ]}>
            {strings[language].viewFlashcards}
          </Text>
        </View>
      </TouchableOpacity>
      <Animated.View 
        style={[
          styles.underlineContainer,
          {
            transform: [{ translateX: translatePosition }]
          }
        ]}
      >
        <View style={[styles.staticUnderline, { backgroundColor: colors.brandColor2 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    height: 50,
    position: 'relative',
  },
  toggleHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 20,
  },
  underlineContainer: {
    position: 'absolute',
    bottom: 0,
    left: '14%',
    width: '37%',
    alignItems: 'center',
  },
  staticUnderline: {
    height: 2,
    width: '100%',
  },
}); 