import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';

interface ActionButtonProps {
  text: string;
  backgroundColor: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function ActionButton({ 
  text,
  backgroundColor,
  onPress,
  style,
  disabled = false,
  fullWidth = false
}: ActionButtonProps) {
  // Split text by newlines to handle line breaks
  const textLines = text.split('\n');

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        { backgroundColor },
        fullWidth && styles.fullWidth,
        style
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      {textLines.map((line, index) => (
        <Text key={index} style={[styles.text, index > 0 && styles.textLine]}>
          {line}
        </Text>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 350,
    height: 72,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '90%',
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
  },
  textLine: {
    marginTop: 0,
  },
}); 