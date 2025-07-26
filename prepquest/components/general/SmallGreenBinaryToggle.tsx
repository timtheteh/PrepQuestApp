import { StyleSheet, View, ViewProps, Text, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle } from 'react-native';
import { useState, useRef } from 'react';

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
    outputRange: ['#FFFFFF', '#FFFFFF', '#D5D4DD', '#D5D4DD']
  });

  const rightTextColor = colorAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: ['#D5D4DD', '#D5D4DD', '#FFFFFF', '#FFFFFF']
  });

  return (
    <TouchableWithoutFeedback onPress={togglePosition}>
      <View style={[styles.container, style]} {...props}>
        <View style={styles.innerContainer}>
          <Animated.View 
            style={[
              styles.toggleBackground,
              { transform: [{ translateX }] }
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
    backgroundColor: '#F8F8F8',
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
    backgroundColor: '#44B88A',
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
    fontFamily: 'Satoshi-Medium',
  },
}); 