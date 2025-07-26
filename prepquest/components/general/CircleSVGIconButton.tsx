import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface CircleSVGIconButtonProps {
  Icon: React.FC<SvgProps>;
  size?: number;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export function CircleSVGIconButton({ 
  Icon, 
  size = 24,
  onPress,
  color = 'black',
  style
}: CircleSVGIconButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.circleButton, style]}
      activeOpacity={1}
      onPress={onPress}
    >
      <Icon width={size} height={size} color={color} />
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
  }
}); 