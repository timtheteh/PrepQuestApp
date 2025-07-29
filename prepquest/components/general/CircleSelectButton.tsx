import React, { useMemo, useCallback } from 'react';
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
  const styles = createStyles(colors);
  
  const animatedViewStyle = useMemo(() => [
    styles.container,
    opacity !== undefined && { opacity },
    style
  ], [styles.container, opacity, style]);
  
  const circleStyle = useMemo(() => [
    styles.circle,
    selected && styles.selected
  ], [styles.circle, selected, styles.selected]);
  
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);
  
  return (
    <Animated.View style={animatedViewStyle}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={styles.button}
      >
        <View style={circleStyle}>
          {selected && (
            <Feather name="check" size={18} color={colors.background} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const createStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.brandColor2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.brandColor2,
  },
}); 