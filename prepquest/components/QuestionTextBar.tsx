import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuestionTextBarProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  helperText?: string;
}

export function QuestionTextBar({
  label,
  placeholder,
  value,
  onChangeText,
  helperText
}: QuestionTextBarProps) {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
        />
        {value.length > 0 && (
          <TouchableWithoutFeedback onPress={handleClear}>
            <View style={styles.closeButtonContainer}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'close-circle' : 'close-circle'}
                size={24}
                color="#D5D4DD"
              />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
      {helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    color: '#000000',
    marginBottom: 16,
    height: 32
  },
  textInputContainer: {
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    paddingVertical: 0,
  },
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontFamily: 'Neuton-Regular',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#000000',
    marginTop: 8,
  },
}); 