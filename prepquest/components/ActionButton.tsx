import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';

interface ActionButtonProps {
  text: string;
  backgroundColor: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function ActionButton({ 
  text,
  backgroundColor,
  onPress,
  style,
  disabled = false
}: ActionButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.button,
        { backgroundColor },
        style
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      <Text style={styles.text}>{text}</Text>
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
  },
}); 