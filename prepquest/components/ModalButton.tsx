import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ModalButtonProps {
  text: string;
  onPress?: () => void;
  style?: ViewStyle;
  selected?: boolean;
}

export function ModalButton({ 
  text,
  onPress,
  style,
  selected = false
}: ModalButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        selected && styles.selectedButton,
        style
      ]} 
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        {text}
      </Text>
      {selected && (
        <View style={styles.checkContainer}>
          <Feather name="check" size={20} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 141,
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  selectedButton: {
    backgroundColor: '#4F41D8',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    
  },
  selectedText: {
    color: 'white',
  },
  checkContainer: {
    position: 'absolute',
    right: 15,
  },
}); 