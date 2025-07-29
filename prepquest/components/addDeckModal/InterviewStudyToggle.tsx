import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type ToggleOption = 'study' | 'interview';

interface InterviewStudyToggleProps {
  onToggle?: (option: ToggleOption) => void;
  initialState?: ToggleOption;
  isInViewFlashcardsPage?: boolean;
}

export const InterviewStudyToggle = function InterviewStudyToggle({ 
  onToggle,
  initialState = 'study',
  isInViewFlashcardsPage = false
}: InterviewStudyToggleProps) {
  const [selected, setSelected] = useState<ToggleOption>(initialState);
  const translateX = useState(new Animated.Value(initialState === 'study' ? 0 : 93))[0];
  const { language } = useLanguage();
  const { theme } = useTheme();

  const animationConfig = {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: false, // Reverted to false since transform properties aren't supported with native driver
  };

  const translateXValues = {
    study: language === 'English' ? 0 : -3,
    interview: language === 'English' ? 93 : 108,
  };

  useEffect(() => {
    setSelected(initialState);
    Animated.timing(translateX, {
      toValue: translateXValues[initialState],
      ...animationConfig,
    }).start();
  }, [initialState, translateXValues, animationConfig]);

  const handleToggle = (option: ToggleOption) => {
    setSelected(option);
    if (onToggle) {
      onToggle(option);
    }

    Animated.timing(translateX, {
      toValue: translateXValues[option],
      ...animationConfig,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity 
          onPress={() => handleToggle('study')}
          style={styles.option}
        >
          <Text style={[
            styles.text,
            { color: selected === 'study' ? Colors[theme].text : Colors[theme].unselectedText }
          ]}>
            {strings[language].study}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleToggle('interview')}
          style={styles.option}
        >
          <Text style={[
            styles.text,
            { color: selected === 'interview' ? Colors[theme].text : Colors[theme].unselectedText }
          ]}>
            {strings[language].interview}
          </Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={[
        styles.underline,
        {
          transform: [{ translateX }],
          backgroundColor: isInViewFlashcardsPage ? Colors[theme].brandColor1 : Colors[theme].brandColor2
        }
      ]} />
    </View>
  );
};

// Also export as default for compatibility
export default InterviewStudyToggle;

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 35,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  option: {
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: -3,
    width: 70,
    height: 2,
  },
}); 