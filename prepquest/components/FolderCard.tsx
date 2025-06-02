import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Platform, Pressable, Animated } from 'react-native';
import { CircleSelectButton } from './CircleSelectButton';

interface FolderCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
  containerWidthPercentage?: Animated.Value;
  isSelectMode?: boolean;
  selected?: boolean;
  onSelectPress?: () => void;
  circleButtonOpacity?: Animated.Value;
}

export function FolderCard({ 
  style, 
  children, 
  onPress, 
  containerWidthPercentage = new Animated.Value(100),
  isSelectMode = false,
  selected = false,
  onSelectPress,
  circleButtonOpacity
}: FolderCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const containerStyle = {
    width: containerWidthPercentage.interpolate({
      inputRange: [85, 100],
      outputRange: ['85%', '100%']
    })
  };

  const handlePressIn = () => {
    if (!isSelectMode) {
      setIsPressed(true);
    }
  };

  const handlePressOut = () => {
    if (!isSelectMode) {
      setIsPressed(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.shadowContainer,
        isPressed && styles.shadowContainerPressed
      ]}>
        <Pressable 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[
            styles.container, 
            containerStyle, 
            style,
            isPressed && styles.containerPressed
          ]}>
            {children}
          </Animated.View>
        </Pressable>
      </View>
      {isSelectMode && (
        <CircleSelectButton
          style={{
            ...styles.circleSelectButton,
            ...(style?.marginTop === 5 ? styles.firstCardCircleButton : {})
          }}
          selected={selected}
          onPress={onSelectPress}
          opacity={circleButtonOpacity}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  shadowContainer: {
    width: '97%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      
    }),
  },
  shadowContainerPressed: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
    }),
  },
  container: {
    height: 96,
    backgroundColor: Platform.OS === 'android' ? '#EFEFEF' : '#F8F8F8',
    borderRadius: 20,
  },
  containerPressed: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: -4, // Negative elevation for inner shadow effect
      },
      android: {
        elevation: 2,
        shadowColor: 'rgba(0, 0, 0, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
        borderWidth: 4,
        borderColor: 'transparent', // Transparent border to create space for shadow
      },
    }),
  },
  circleSelectButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    zIndex: 1,
  },
  firstCardCircleButton: {
    transform: [{ translateY: -15 }],
  },
}); 