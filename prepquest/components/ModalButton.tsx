import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';

interface ModalButtonProps {
  text: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ModalButton({ 
  text,
  onPress,
  style
}: ModalButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
    >
      <Text style={styles.text}>{text}</Text>
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
  },
  text: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    paddingLeft: 15,
  },
}); 