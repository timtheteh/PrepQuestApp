import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

interface CircleSelectButtonProps {
  style?: ViewStyle;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function CircleSelectButton({ 
  style,
  selected = false,
  onPress,
  disabled = false
}: CircleSelectButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        style
      ]}
    >
      <View style={[
        styles.circle,
        selected && styles.selected
      ]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 30,
    height: 30,
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#4F41D8',
  },
  selected: {
    backgroundColor: '#4F41D8',
  },
}); 