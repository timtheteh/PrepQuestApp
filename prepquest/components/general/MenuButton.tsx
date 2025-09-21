import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface MenuButtonProps {
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export function MenuButton({ 
  onPress, 
  size = 30, 
  color,
  style 
}: MenuButtonProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const iconColor = color || colors.normalIconColor;
  
  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      activeOpacity={0.5}
      onPress={onPress}
    >
      <Feather name="menu" size={size} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 0,
  },
}); 