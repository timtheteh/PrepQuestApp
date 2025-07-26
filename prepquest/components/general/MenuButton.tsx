import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface MenuButtonProps {
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export function MenuButton({ 
  onPress, 
  size = 30, 
  color = 'black',
  style 
}: MenuButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      activeOpacity={0.5}
      onPress={onPress}
    >
      <Feather name="menu" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 0,
  },
}); 