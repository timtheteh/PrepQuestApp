import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface SmallCircleSelectButtonProps {
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function SmallCircleSelectButton({ 
  selected,
  onPress,
  disabled = false
}: SmallCircleSelectButtonProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[
        styles.outerCircle,
        { borderColor: colors.unselectedText },
        disabled && { borderColor: colors.secondaryShade, opacity: 0.5 }
      ]}>
        {selected && <View style={[styles.innerCircle, { backgroundColor: colors.unselectedText }]} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
}); 