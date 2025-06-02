import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface GenericModalButtonProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
}

export function GenericModalButton({ 
  text, 
  backgroundColor, 
  textColor, 
  onPress 
}: GenericModalButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 92,
    height: 52,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    textAlign: 'center',
  },
}); 