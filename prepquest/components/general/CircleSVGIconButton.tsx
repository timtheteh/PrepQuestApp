import React from 'react';
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
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.circleButton, 
        { backgroundColor: colors.secondaryShade },
        style
      ]}
      activeOpacity={1}
      onPress={handlePress}
    >
      <Icon width={size} height={size} color={color} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 