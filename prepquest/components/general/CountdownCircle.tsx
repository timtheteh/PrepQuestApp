import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CountdownCircleProps {
  duration?: number;
  size?: number;
  strokeWidth?: number;
  onComplete?: () => void;
  onTick?: (timeLeft: number) => void;
}

const CountdownCircle: React.FC<CountdownCircleProps> = ({ 
  duration = 3, 
  size = 200, 
  strokeWidth = 20,
  onComplete = () => {},
  onTick = () => {}
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isComplete, setIsComplete] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    if (isComplete) return;
    
    // Start the countdown animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration * 1000, // Convert to milliseconds
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setIsComplete(true);
        onComplete();
      }
    });
    
    // Update time left every second
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        onTick(newTime);
        
        if (newTime <= 0) {
          clearInterval(interval);
          setIsComplete(true);
          onComplete();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [duration, isComplete]);
  
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Always use brandColor1 for progress
  const getProgressColor = () => {
    return Colors[theme].brandColor1;
  };
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors[theme].secondaryShade}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Time text in center */}
      <View style={{ 
        position: 'absolute', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Text style={{ 
          fontSize: 64, 
          fontWeight: 'bold', 
          color: Colors[theme].text,
          fontFamily: 'Satoshi-Medium'
        }}>
          {timeLeft}
        </Text>
      </View>
    </View>
  );
};

export default CountdownCircle;
