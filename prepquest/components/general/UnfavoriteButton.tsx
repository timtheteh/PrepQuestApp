import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface UnfavoriteButtonProps {
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function UnfavoriteButton({ 
  size = 28,
  onPress,
  style
}: UnfavoriteButtonProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <TouchableOpacity 
      style={[styles.circleButton, { backgroundColor: colors.secondaryShade }, style]}
      activeOpacity={1}
      pressRetentionOffset={{ top: 0, left: 0, bottom: 0, right: 0 }}
      onPressIn={(e) => e.currentTarget.setNativeProps({ style: [styles.circleButtonPressed, { backgroundColor: colors.unselectedText }] })}
      onPressOut={(e) => e.currentTarget.setNativeProps({ style: [styles.circleButton, { backgroundColor: colors.secondaryShade }] })}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="star-outline" size={size} color={colors.unselectedText} />
        <View style={styles.lineContainer}>
          <Svg height="46" width="46" style={styles.svg}>
            <Line
              x1="40"
              y1="8"
              x2="8"
              y2="40"
              stroke={colors.alertColor}
              strokeWidth="2"
            />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonPressed: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 46,
    height: 46,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 46,
    height: 46,
  },
  svg: {
    position: 'absolute',
  }
}); 