import { StyleSheet, View, ViewProps, Text, Animated, TouchableWithoutFeedback, useWindowDimensions, Easing, StyleProp, TextStyle } from 'react-native';
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface RoundedContainerProps extends ViewProps {
  leftLabel: string;
  leftLabelStyle?: StyleProp<TextStyle>;
  rightLabel: string;
  onToggle?: (isRightSide: boolean) => void;
  initialPosition?: 'left' | 'right';
  position?: 'left' | 'right';
  disableAnimation?: boolean;
}

export const RoundedContainer = memo(({ 
  style, 
  leftLabel,
  leftLabelStyle,
  rightLabel,
  onToggle,
  initialPosition = 'left',
  position,
  disableAnimation = false,
  ...props 
}: RoundedContainerProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const isControlled = position !== undefined;
  const [isRightSide, setIsRightSide] = useState(initialPosition === 'right');
  const positionAnim = useRef(new Animated.Value(initialPosition === 'right' ? 1 : 0)).current;
  const colorAnim = useRef(new Animated.Value(initialPosition === 'right' ? 1 : 0)).current;
  const { width } = useWindowDimensions();
  
  // Memoize expensive calculations
  const containerWidth = useMemo(() => width - 32, [width]);
  const slideDistance = useMemo(() => containerWidth / 2, [containerWidth]);

  // Memoize animation config to prevent recreation on every render
  const animationConfig = useMemo(() => ({
    duration: 300,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  }), []);

  // Animate when position prop changes (controlled)
  useEffect(() => {
    if (isControlled) {
      const toValue = position === 'right' ? 1 : 0;
      setIsRightSide(position === 'right');
      if (disableAnimation) {
        positionAnim.setValue(toValue);
        colorAnim.setValue(toValue);
      } else {
        Animated.parallel([
          Animated.timing(positionAnim, {
            ...animationConfig,
            toValue,
            useNativeDriver: true,
          }),
          Animated.timing(colorAnim, {
            ...animationConfig,
            toValue,
            useNativeDriver: false,
          })
        ]).start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, disableAnimation, animationConfig]);

  // Memoize the toggle function to prevent unnecessary re-renders
  const togglePosition = useCallback(() => {
    if (isControlled) {
      onToggle?.(!(position === 'right'));
      return;
    }
    const toValue = isRightSide ? 0 : 1;
    setIsRightSide(!isRightSide);
    Animated.parallel([
      Animated.timing(positionAnim, {
        ...animationConfig,
        toValue,
        useNativeDriver: true,
      }),
      Animated.timing(colorAnim, {
        ...animationConfig,
        toValue,
        useNativeDriver: false,
      })
    ]).start(() => {
      onToggle?.(!isRightSide);
    });
  }, [isControlled, position, onToggle, isRightSide, positionAnim, colorAnim, animationConfig]);

  // Memoize interpolated values to prevent recalculation on every render
  const translateX = useMemo(() => positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slideDistance],
  }), [positionAnim, slideDistance]);

  const leftTextColor = useMemo(() => colorAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [colors.background, colors.background, colors.unselectedText, colors.unselectedText]
  }), [colorAnim, colors.background, colors.unselectedText]);

  const rightTextColor = useMemo(() => colorAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [colors.unselectedText, colors.unselectedText, colors.background, colors.background]
  }), [colorAnim, colors.unselectedText, colors.background]);

  // Memoize styles to prevent recreation on every render
  const containerStyle = useMemo(() => [
    styles.container, 
    { backgroundColor: colors.secondaryShade }, 
    style
  ], [colors.secondaryShade, style]);

  const toggleBackgroundStyle = useMemo(() => [
    styles.toggleBackground,
    { backgroundColor: colors.brandColor2, transform: [{ translateX }] }
  ], [colors.brandColor2, translateX]);

  const leftTextStyle = useMemo(() => [
    leftLabelStyle ? leftLabelStyle : styles.label, 
    { color: leftTextColor }
  ], [leftLabelStyle, leftTextColor]);

  const rightTextStyle = useMemo(() => [
    styles.label, 
    { color: rightTextColor }
  ], [rightTextColor]);

  return (
    <TouchableWithoutFeedback onPress={togglePosition}>
      <View style={containerStyle} {...props}>
        <View style={styles.innerContainer}>
          <Animated.View style={toggleBackgroundStyle} />
          <View style={styles.labelContainer}>
            <View style={[styles.labelSection, styles.leftSection]}>
              <Animated.Text style={leftTextStyle}>
                {leftLabel}
              </Animated.Text>
            </View>
            <View style={[styles.labelSection, styles.rightSection]}>
              <Animated.Text style={rightTextStyle}>
                {rightLabel}
              </Animated.Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
});

RoundedContainer.displayName = 'RoundedContainer';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 46,
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
    fontFamily: Fonts.bodyMedium,
  },
}); 