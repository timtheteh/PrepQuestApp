import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TitleTextBarProps {
  title: string;
  highlightedWord?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export function TitleTextBar({
  title,
  highlightedWord,
  placeholder,
  value,
  onChangeText
}: TitleTextBarProps) {
  const titleParts = highlightedWord 
    ? title.split(highlightedWord)
    : [title];
  
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.inputRow}>
      <Text style={styles.label}>
        {titleParts[1]}
        {highlightedWord && <Text style={styles.highlightedText}>{highlightedWord}</Text>}
        {titleParts[0]}
      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 32,
    fontFamily: 'Neuton-Regular',
    color: '#000000',
    marginBottom: 16,
    height: 40
  },
  highlightedText: {
    color: '#44B88A',
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
}); 