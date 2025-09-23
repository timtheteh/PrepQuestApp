import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface NumberOfQuestionsProps {
  title: string;
  value: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
}

const QUICK_SELECT_VALUES = [10, 15, 20, 30, 40];

export function NumberOfQuestions({
  title,
  value,
  onValueChange,
  minValue = 1,
  maxValue = 40
}: NumberOfQuestionsProps) {
  const { theme } = useTheme();
  const themeColors = Colors[theme as keyof typeof Colors];
  const handleDecrement = () => {
    if (value > minValue) {
      onValueChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < maxValue) {
      onValueChange(value + 1);
    }
  };

  const handleQuickSelect = (selectedValue: number) => {
    onValueChange(selectedValue);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: themeColors.brandColor2 },
            value <= minValue && { backgroundColor: themeColors.unselectedText, opacity: 0.5 }
          ]} 
          onPress={handleDecrement}
          disabled={value <= minValue}
        >
          <View style={styles.buttonInner}>
            <Feather name="minus" size={30} color={themeColors.contrastText} />
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.numberText, { color: themeColors.text }]}>{value}</Text>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: themeColors.brandColor2 },
            value >= maxValue && { backgroundColor: themeColors.unselectedText, opacity: 0.5 }
          ]} 
          onPress={handleIncrement}
          disabled={value >= maxValue}
        >
          <View style={styles.buttonInner}>
            <Feather name="plus" size={30} color={themeColors.contrastText} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickSelectContainer}>
        {QUICK_SELECT_VALUES.map((quickValue) => (
          <TouchableOpacity
            key={quickValue}
            style={[
              styles.quickSelectButton,
              { backgroundColor: themeColors.secondaryShade },
              value === quickValue && { backgroundColor: themeColors.brandColor2 }
            ]}
            onPress={() => handleQuickSelect(quickValue)}
          >
            <Text 
              style={[
                styles.quickSelectText,
                { color: themeColors.text },
                value === quickValue && { color: themeColors.contrastText }
              ]}
            >
              {quickValue}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    marginBottom: 16,
    height: 32
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 40,
    marginBottom: 16,
  },
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 24,
    fontFamily: 'Satoshi-Medium',
    width: 40,
    textAlign: 'center',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickSelectButton: {
    width: '17%',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
  },
}); 