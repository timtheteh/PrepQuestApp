import { StyleSheet, View, ViewProps, Animated, TouchableWithoutFeedback, Easing, StyleProp, TextStyle } from 'react-native';
import { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface SmallGreenBinaryToggleProps extends ViewProps {
  leftLabel: string;
  leftLabelStyle?: StyleProp<TextStyle>;
  rightLabel: string;
  onToggle?: (isRightSide: boolean) => void;
  initialPosition?: 'left' | 'right';
}

export function SmallGreenBinaryToggle({ 
  style, 
  leftLabel,
  leftLabelStyle,
  rightLabel,
  onToggle,
  initialPosition = 'left',
  ...props 
}: SmallGreenBinaryToggleProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [isRightSide, setIsRightSide] = useState(initialPosition === 'right');
  const positionAnim = useRef(new Animated.Value(initialPosition === 'right' ? 1 : 0)).current;
  const colorAnim = useRef(new Animated.Value(initialPosition === 'right' ? 1 : 0)).current;
  const containerWidth = 180;
  const slideDistance = containerWidth / 2;

  const togglePosition = () => {
    const toValue = isRightSide ? 0 : 1;
    setIsRightSide(!isRightSide);

    const animationConfig = {
      toValue,
      duration: 200,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    };
    
    Animated.parallel([
      Animated.timing(positionAnim, {
        ...animationConfig,
        useNativeDriver: true,
      }),
      Animated.timing(colorAnim, {
        ...animationConfig,
        useNativeDriver: false,
      })
    ]).start(() => {
      onToggle?.(!isRightSide);
    });
  };

  const translateX = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slideDistance],
  });

  const leftTextColor = colorAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [colors.contrastText, colors.contrastText, colors.unselectedText, colors.unselectedText]
  });

  const rightTextColor = colorAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [colors.unselectedText, colors.unselectedText, colors.contrastText, colors.contrastText]
  });

  return (
    <TouchableWithoutFeedback onPress={togglePosition}>
      <View style={[styles.container, { backgroundColor: colors.secondaryShade }, style]} {...props}>
        <View style={styles.innerContainer}>
          <Animated.View 
            style={[
              styles.toggleBackground,
              { backgroundColor: colors.brandColor1, transform: [{ translateX }] }
            ]} 
          />
          <View style={styles.labelContainer}>
            <View style={[styles.labelSection, styles.leftSection]}>
              <Animated.Text style={[leftLabelStyle ? leftLabelStyle : styles.label, { color: leftTextColor }]}> 
                {leftLabel}
              </Animated.Text>
            </View>
            <View style={[styles.labelSection, styles.rightSection]}>
              <Animated.Text style={[styles.label, { color: rightTextColor }]}> 
                {rightLabel}
              </Animated.Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 26,
    borderRadius: 10,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
  },
  toggleBackground: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    borderRadius: 10,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
  },
  labelSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftSection: {
    paddingRight: 8,
  },
  rightSection: {
    paddingLeft: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
}); 