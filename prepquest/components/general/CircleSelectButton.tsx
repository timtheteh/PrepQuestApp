import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface CircleSelectButtonProps {
  style?: ViewStyle;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  opacity?: Animated.Value;
}

export const CircleSelectButton = React.memo(({ 
  style,
  selected = false,
  onPress,
  disabled = false,
  opacity
}: CircleSelectButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <Animated.View style={[
      styles.container,
      opacity !== undefined && { opacity },
      style
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={styles.button}
      >
        <View style={[
          styles.circle,
          selected && styles.selected
        ]}>
          {selected && (
            <Feather name="check" size={18} color={colors.background} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
  },
  button: {
    width: '100%',
    height: '100%',
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#4F41D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#4F41D8',
  },
}); 