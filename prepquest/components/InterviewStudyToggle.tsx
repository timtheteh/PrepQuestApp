import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

type ToggleOption = 'study' | 'interview';

interface InterviewStudyToggleProps {
  onToggle?: (option: ToggleOption) => void;
  initialState?: ToggleOption;
  isInViewFlashcardsPage?: boolean;
}

export function InterviewStudyToggle({ 
  onToggle,
  initialState = 'study',
  isInViewFlashcardsPage = false
}: InterviewStudyToggleProps) {
  const [selected, setSelected] = useState<ToggleOption>(initialState);
  const translateX = useState(new Animated.Value(initialState === 'study' ? 0 : 93))[0];
  const { language } = useLanguage();

  useEffect(() => {
    setSelected(initialState);
    Animated.timing(translateX, {
      toValue: language === 'English' ? (initialState === 'study' ? 0 : 93) : (initialState === 'study' ? -3 : 108),
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [initialState]);

  const handleToggle = (option: ToggleOption) => {
    setSelected(option);
    if (onToggle) {
      onToggle(option);
    }

    Animated.timing(translateX, {
      toValue: language === 'English' ? (option === 'study' ? 0 : 93) : (option === 'study' ? -3 : 108),
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
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
            selected === 'study' ? styles.selectedText : styles.unselectedText
          ]}>
            {language === 'Chinese' ? '学习' : 'Study'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleToggle('interview')}
          style={styles.option}
        >
          <Text style={[
            styles.text,
            selected === 'interview' ? styles.selectedText : styles.unselectedText
          ]}>
            {language === 'Chinese' ? '面试' : 'Interview'}
          </Text>
        </TouchableOpacity>
      </View>
      <Animated.View 
        style={[
          styles.underline,
          {
            transform: [{ translateX }],
            backgroundColor: isInViewFlashcardsPage ? '#44B88A' : '#4F41D8'
          }
        ]} 
      />
    </View>
  );
}

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
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
  },
  selectedText: {
    color: '#000000',
  },
  unselectedText: {
    color: '#D5D4DD',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: -3,
    width: 70,
    height: 2,
    backgroundColor: '#4F41D8',
  },
}); 