import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface QuestionTextBarProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  helperText?: string;
}

export const QuestionTextBar = React.memo(({
  label,
  placeholder,
  value,
  onChangeText,
  helperText
}: QuestionTextBarProps) => {
  const { theme } = useTheme();
  
  const handleClear = () => {
    onChangeText('');
  };

  const dynamicStyles = {
    label: {
      color: Colors[theme].text,
    },
    textInputContainer: {
      backgroundColor: Colors[theme].secondaryShade,
    },
    textInput: {
      color: Colors[theme].text,
    },
    helperText: {
      color: Colors[theme].text,
    },
  };

  const textInputProps = {
    style: [styles.textInput, dynamicStyles.textInput],
    placeholder,
    placeholderTextColor: Colors[theme].unselectedText,
    value,
    onChangeText,
  };

  return (
    <View style={styles.inputRow}>
      <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
      <View style={[styles.textInputContainer, dynamicStyles.textInputContainer]}>
        <TextInput {...textInputProps} />
        {value.length > 0 && (
          <TouchableWithoutFeedback onPress={handleClear}>
            <View style={styles.closeButtonContainer}>
              <Ionicons
                name={'close-circle'}
                size={24}
                color={Colors[theme].unselectedText}
              />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
      {helperText && (
        <Text style={[styles.helperText, dynamicStyles.helperText]}>{helperText}</Text>
      )}
    </View>
  );
});

QuestionTextBar.displayName = 'QuestionTextBar';

const styles = StyleSheet.create({
  inputRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 24,
    fontFamily: Fonts.title,
    marginBottom: 16,
    height: 32
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
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 16,
    marginTop: 8,
    opacity: 0.5,   
  },
}); 