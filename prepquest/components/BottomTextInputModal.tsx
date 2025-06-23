import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

interface BottomTextInputModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onDone: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const BottomTextInputModal: React.FC<BottomTextInputModalProps> = ({
  visible,
  value,
  onChangeText,
  onDone,
  placeholder = 'Type your text here...',
  autoFocus = true,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.absoluteFill} pointerEvents="box-none">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onDone}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            autoFocus={autoFocus}
            multiline
            value={value}
            onChangeText={onChangeText}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

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
    backgroundColor: "white",
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
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  doneButton: {
    color: '#44B88A',
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    minHeight: 40,
    maxHeight: 200,
    fontSize: 18,
    textAlignVertical: 'top',
  },
}); 