import { StyleSheet, View, ViewProps, Text, Animated, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { useState, useRef } from 'react';

interface RoundedContainerProps extends ViewProps {
  children?: React.ReactNode;
}

export function RoundedContainer({ style, ...props }: RoundedContainerProps) {
  const [isRightSide, setIsRightSide] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const containerWidth = width - 32; // Accounting for parent padding
  const slideDistance = containerWidth / 2;

  const togglePosition = () => {
    const toValue = isRightSide ? 0 : 1;
    setIsRightSide(!isRightSide);
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slideDistance],
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
            <View style={styles.labelSection}>
              <Text style={styles.label}>Study</Text>
            </View>
            <View style={styles.labelSection}>
              <Text style={styles.label}>Interview</Text>
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
  label: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#D5D4DD'
  },
}); 