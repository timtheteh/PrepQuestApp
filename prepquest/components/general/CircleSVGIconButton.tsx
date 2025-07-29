import React, { useMemo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface CircleSVGIconButtonProps {
  Icon: React.FC<SvgProps>;
  size?: number;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export const CircleSVGIconButton = React.memo(({ 
  Icon, 
  size = 24,
  onPress,
  color = 'black',
  style
}: CircleSVGIconButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  
  const buttonStyle = useMemo(() => [
    styles.circleButton, 
    style
  ], [styles.circleButton, style]);
  
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);
  
  return (
    <TouchableOpacity 
      style={buttonStyle}
      activeOpacity={1}
      onPress={handlePress}
    >
      <Icon width={size} height={size} color={color} />
    </TouchableOpacity>
  );
});

const createStyles = (colors: any) => StyleSheet.create({
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.secondaryShade,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 