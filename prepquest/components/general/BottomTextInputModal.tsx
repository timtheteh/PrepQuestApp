import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface BottomTextInputModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onDone: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const BottomTextInputModal: React.FC<BottomTextInputModalProps> = React.memo(({
  visible,
  value,
  onChangeText,
  onDone,
  placeholder = 'Type your text here...',
  autoFocus = true,
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  const themeStyles = {
    modalView: { backgroundColor: Colors[theme].background },
    headerTitle: { color: Colors[theme].text },
    doneButton: { color: Colors[theme].brandColor1 },
    input: { color: Colors[theme].text },
    placeholderTextColor: Colors[theme].unselectedText,
  };

  const currentStrings = strings[language as keyof typeof strings];

  if (!visible) return null;

  return (
    <View style={styles.absoluteFill} pointerEvents="box-none">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.modalView, themeStyles.modalView]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, themeStyles.headerTitle]}>
              {currentStrings.editDeckName}
            </Text>
            <TouchableOpacity onPress={onDone}>
              <Text style={[styles.doneButton, themeStyles.doneButton]}>
                {currentStrings.done}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, themeStyles.input]}
            placeholder={placeholder}
            placeholderTextColor={themeStyles.placeholderTextColor}
            autoFocus={autoFocus}
            multiline
            value={value}
            onChangeText={onChangeText}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
});

const styles = StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    padding: 16,
    minHeight: 100,
    maxHeight: 350,
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  doneButton: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  input: {
    minHeight: 40,
    maxHeight: 200,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  headerTitle: {
    fontFamily: Fonts.title,
    fontSize: 24,
  },
}); 