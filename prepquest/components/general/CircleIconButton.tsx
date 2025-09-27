import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface CircleIconButtonProps {
  iconName?: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap;
  iconLibrary?: 'ionicons' | 'materialicons';
  size?: number;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
  renderCustomIcon?: (color: string) => React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
}

export const CircleIconButton = React.memo(({ 
  iconName, 
  iconLibrary = 'ionicons',
  size = 24,
  onPress,
  color,
  style,
  renderCustomIcon,
  selected = false,
  disabled = false
}: CircleIconButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const defaultIconColor = color || colors.normalIconColor;
  
  // Icon color logic based on theme and state
  const getIconColor = () => {
    if (disabled) {
      return theme === 'dark' ? colors.contrastIconColor : colors.unselectedText;
    }
    return defaultIconColor;
  };
  
  const finalColor = getIconColor();
  
  // Platform-specific background colors
  const getBackgroundColor = () => {
    if (disabled) {
      return theme === 'dark' ? colors.disabledIconBackgroundColor : colors.secondaryShade;
    }
    if (selected) return colors.unselectedText;
    return colors.secondaryShade;
  };
  
  const getPressedBackgroundColor = () => {
    return colors.unselectedText;
  };
  
  const renderIcon = () => {
    if (renderCustomIcon) {
      return renderCustomIcon(finalColor);
    }
    
    if (!iconName) return null;
    
    if (iconLibrary === 'materialicons') {
      return <MaterialIcons name={iconName as keyof typeof MaterialIcons.glyphMap} size={size} color={finalColor} />;
    }
    
    return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={finalColor} />;
  };
  
  const handlePressIn = (e: any) => {
    if (!disabled && !selected) {
      e.currentTarget.setNativeProps({ 
        style: {
          ...styles.circleButton,
          backgroundColor: getPressedBackgroundColor()
        }
      });
    }
  };
  
  const handlePressOut = (e: any) => {
    if (!disabled && !selected) {
      e.currentTarget.setNativeProps({ 
        style: {
          ...styles.circleButton,
          backgroundColor: getBackgroundColor()
        }
      });
    }
  };
  
  const pressRetentionOffset = { top: 0, left: 0, bottom: 0, right: 0 };
  
  return (
    <TouchableOpacity 
      style={[
        styles.circleButton, 
        { backgroundColor: getBackgroundColor() },
        style
      ]}
      activeOpacity={disabled ? 1 : 0.8}
      pressRetentionOffset={pressRetentionOffset}
      onPressIn={disabled || selected ? undefined : handlePressIn}
      onPressOut={disabled || selected ? undefined : handlePressOut}
      onPress={disabled ? undefined : onPress}
    >
      {renderIcon()}
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
  },
}); 