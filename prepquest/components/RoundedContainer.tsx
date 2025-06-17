import { StyleSheet, View, ViewProps, Text, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle } from 'react-native';
import { useState, useRef, useEffect } from 'react';

interface RoundedContainerProps extends ViewProps {
  leftLabel: string;
  leftLabelStyle?: StyleProp<TextStyle>;
  rightLabel: string;
  onToggle?: (isRightSide: boolean) => void;
  initialPosition?: 'left' | 'right';
  position?: 'left' | 'right';
  disableAnimation?: boolean;
}

export function RoundedContainer({ 
  style, 
  leftLabel,
  leftLabelStyle,
  rightLabel,
  onToggle,
  initialPosition = 'left',
  position,
  disableAnimation = false,
  ...props 
}: RoundedContainerProps) {
  const isControlled = position !== undefined;
  const [isRightSide, setIsRightSide] = useState(initialPosition === 'right');
  const positionAnim = useRef(new Animated.Value(initialPosition === 'right' ? 1 : 0)).current;
  const colorAnim = useRef(new Animated.Value(initialPosition === 'right' ? 1 : 0)).current;
  const { width } = useWindowDimensions();
  const containerWidth = width - 32; // Accounting for parent padding
  const slideDistance = containerWidth / 2;

  // Animate when position prop changes (controlled)
  useEffect(() => {
    if (isControlled) {
      const toValue = position === 'right' ? 1 : 0;
      setIsRightSide(position === 'right');
      if (disableAnimation) {
        positionAnim.setValue(toValue);
        colorAnim.setValue(toValue);
      } else {
        const animationConfig = {
          toValue,
          duration: 300,
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
        ]).start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, disableAnimation]);

  const togglePosition = () => {
    if (isControlled) {
      onToggle?.(!(position === 'right'));
      return;
    }
    const toValue = isRightSide ? 0 : 1;
    setIsRightSide(!isRightSide);
    const animationConfig = {
      toValue,
      duration: 300,
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
    width: '100%',
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
  },
  toggleBackground: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#4F41D8',
    borderRadius: 30,
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
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
  },
}); 