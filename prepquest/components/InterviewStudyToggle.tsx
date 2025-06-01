import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';

type ToggleOption = 'study' | 'interview';

interface InterviewStudyToggleProps {
  onToggle?: (option: ToggleOption) => void;
}

export function InterviewStudyToggle({ onToggle }: InterviewStudyToggleProps) {
  const [selected, setSelected] = useState<ToggleOption>('study');
  const translateX = useState(new Animated.Value(0))[0];

  const handleToggle = (option: ToggleOption) => {
    setSelected(option);
    if (onToggle) {
      onToggle(option);
    }

    Animated.timing(translateX, {
      toValue: option === 'study' ? 0 : 93,
      duration: 300,
      useNativeDriver: true,
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
            Study
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
            Interview
          </Text>
        </TouchableOpacity>
      </View>
      <Animated.View 
        style={[
          styles.underline,
          {
            transform: [{ translateX }]
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
    backgroundColor: '#FFFFFF',
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