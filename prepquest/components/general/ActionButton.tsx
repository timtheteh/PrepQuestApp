import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface ActionButtonProps {
  text: string;
  backgroundColor: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const ActionButton = React.memo(({ 
  text,
  backgroundColor,
  onPress,
  style,
  disabled = false,
  fullWidth = false
}: ActionButtonProps) => {
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
});

ActionButton.displayName = 'ActionButton';

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
    fontFamily: Fonts.bodyBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  textLine: {
    marginTop: 0,
  },
}); 