import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CircleIconButtonProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  size?: number;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
  renderCustomIcon?: (color: string) => React.ReactNode;
}

export function CircleIconButton({ 
  iconName, 
  size = 24,
  onPress,
  color = 'black',
  style,
  renderCustomIcon
}: CircleIconButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.circleButton, style]}
      activeOpacity={1}
      pressRetentionOffset={{ top: 0, left: 0, bottom: 0, right: 0 }}
      onPressIn={(e) => e.currentTarget.setNativeProps({ style: styles.circleButtonPressed })}
      onPressOut={(e) => e.currentTarget.setNativeProps({ style: styles.circleButton })}
      onPress={onPress}
    >
      {renderCustomIcon ? renderCustomIcon(color) : (
        iconName && <Ionicons name={iconName} size={size} color={color} />
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
}); 