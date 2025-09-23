import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface CircleSelectButtonGreenProps {
  style?: ViewStyle;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  opacity?: Animated.Value;
}

export const CircleSelectButtonGreen = React.memo(({ 
  style,
  selected = false,
  onPress,
  disabled = false,
  opacity
}: CircleSelectButtonGreenProps) => {
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
          { 
            backgroundColor: selected ? colors.brandColor1 : colors.background,
            borderColor: colors.brandColor1
          }
        ]}>
          {selected && (
            <Feather name="check" size={18} color={colors.contrastText} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
  },
  button: {
    width: '100%',
    height: '100%',
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 