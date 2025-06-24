import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CircleIconButtonProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  size?: number;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
  renderCustomIcon?: (color: string) => React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
}

export function CircleIconButton({ 
  iconName, 
  size = 24,
  onPress,
  color = 'black',
  style,
  renderCustomIcon,
  selected = false,
  disabled = false
}: CircleIconButtonProps) {
  const disabledColor = '#D5D4DD';
  const finalColor = disabled ? disabledColor : color;
  
  return (
    <TouchableOpacity 
      style={[
        styles.circleButton, 
        selected && styles.selected, 
        disabled && styles.disabled,
        style
      ]}
      activeOpacity={disabled ? 1 : 0.8}
      pressRetentionOffset={{ top: 0, left: 0, bottom: 0, right: 0 }}
      onPressIn={disabled || selected ? undefined : (e) => e.currentTarget.setNativeProps({ style: styles.circleButtonPressed })}
      onPressOut={disabled || selected ? undefined : (e) => e.currentTarget.setNativeProps({ style: styles.circleButton })}
      onPress={disabled ? undefined : onPress}
    >
      {renderCustomIcon ? renderCustomIcon(finalColor) : (
        iconName && <Ionicons name={iconName} size={size} color={finalColor} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonPressed: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D5D4DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#D5D4DD',
  },
  disabled: {
    backgroundColor: '#F0F0F0',
  },
}); 