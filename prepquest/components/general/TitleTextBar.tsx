import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface TitleTextBarProps {
  title: string;
  highlightedWord?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function TitleTextBar({
  title,
  highlightedWord,
  placeholder,
  value,
  onChangeText,
  disabled = false
}: TitleTextBarProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const titleParts = highlightedWord 
    ? title.split(highlightedWord)
    : [title];
  
  const handleClear = () => {
    if (!disabled) {
      onChangeText('');
    }
  };

  return (
    <View style={styles.inputRow}>
      <Text style={[styles.label, { color: colors.text }]}>
        {titleParts[1]}
        {highlightedWord && <Text style={[styles.highlightedText, { color: colors.brandColor1 }]}>{highlightedWord}</Text>}
        {titleParts[0]}
      </Text>
      <View style={[styles.textInputContainer, { backgroundColor: colors.secondaryShade }]}>
        <TextInput
          style={[
            styles.textInput, 
            { color: colors.text },
            disabled && { color: colors.unselectedText }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.unselectedText}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
        />
        {value.length > 0 && !disabled && (
          <TouchableWithoutFeedback onPress={handleClear}>
            <View style={styles.closeButtonContainer}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'close-circle' : 'close-circle'}
                size={24}
                color={colors.unselectedText}
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
    fontFamily: Fonts.title,
    marginBottom: 16,
    height: 40
  },
  highlightedText: {
    // Color will be set dynamically
  },
  textInputContainer: {
    height: 46,
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    paddingVertical: 0,
  },
  disabledText: {
    // Color will be set dynamically
  },
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 