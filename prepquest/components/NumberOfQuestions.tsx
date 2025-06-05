import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

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
      <Text style={styles.title}>{title}</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity 
          style={[styles.button, value <= minValue && styles.buttonDisabled]} 
          onPress={handleDecrement}
          disabled={value <= minValue}
        >
          <View style={styles.buttonInner}>
            <Feather name="minus" size={30} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.numberText}>{value}</Text>
        
        <TouchableOpacity 
          style={[styles.button, value >= maxValue && styles.buttonDisabled]} 
          onPress={handleIncrement}
          disabled={value >= maxValue}
        >
          <View style={styles.buttonInner}>
            <Feather name="plus" size={30} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickSelectContainer}>
        {QUICK_SELECT_VALUES.map((quickValue) => (
          <TouchableOpacity
            key={quickValue}
            style={[
              styles.quickSelectButton,
              value === quickValue && styles.quickSelectButtonSelected
            ]}
            onPress={() => handleQuickSelect(quickValue)}
          >
            <Text 
              style={[
                styles.quickSelectText,
                value === quickValue && styles.quickSelectTextSelected
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
    color: '#000000',
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
    backgroundColor: '#4F41D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D5D4DD',
    opacity: 0.5,
  },
  numberText: {
    fontSize: 24,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
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
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectButtonSelected: {
    backgroundColor: '#4F41D8',
  },
  quickSelectText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#000000',
  },
  quickSelectTextSelected: {
    color: '#FFFFFF',
  },
}); 