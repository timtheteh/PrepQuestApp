import React, { useMemo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
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
  color = 'black',
  style,
  renderCustomIcon,
  selected = false,
  disabled = false
}: CircleIconButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const disabledColor = useMemo(() => colors.unselectedText, [colors.unselectedText]);
  const finalColor = useMemo(() => disabled ? disabledColor : color, [disabled, disabledColor, color]);
  
  const renderIcon = useCallback(() => {
    if (renderCustomIcon) {
      return renderCustomIcon(finalColor);
    }
    
    if (!iconName) return null;
    
    if (iconLibrary === 'materialicons') {
      return <MaterialIcons name={iconName as keyof typeof MaterialIcons.glyphMap} size={size} color={finalColor} />;
    }
    
    return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={finalColor} />;
  }, [renderCustomIcon, finalColor, iconName, iconLibrary, size]);
  
  const styles = createStyles(colors);
  
  const handlePressIn = useCallback((e: any) => {
    if (!disabled && !selected) {
      e.currentTarget.setNativeProps({ style: styles.circleButtonPressed });
    }
  }, [disabled, selected, styles.circleButtonPressed]);
  
  const handlePressOut = useCallback((e: any) => {
    if (!disabled && !selected) {
      e.currentTarget.setNativeProps({ style: styles.circleButton });
    }
  }, [disabled, selected, styles.circleButton]);
  
  const pressRetentionOffset = useMemo(() => ({ top: 0, left: 0, bottom: 0, right: 0 }), []);
  
  const buttonStyle = useMemo(() => [
    styles.circleButton, 
    selected && styles.selected, 
    disabled && styles.disabled,
    style
  ], [styles.circleButton, selected, styles.selected, disabled, styles.disabled, style]);
  
  return (
    <TouchableOpacity 
      style={buttonStyle}
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

const createStyles = (colors: any) => StyleSheet.create({
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.secondaryShade,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonPressed: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.unselectedText,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.unselectedText,
  },
  disabled: {
    backgroundColor: colors.androidSecondaryShade,
  },
}); 