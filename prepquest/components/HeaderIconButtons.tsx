import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { useState, useRef } from 'react';

interface HeaderIconButtonsProps {
  onAIPress?: () => void;
  onCalendarPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
}

export function HeaderIconButtons({
  onAIPress,
  onCalendarPress,
  onFilterPress,
  onSearchPress
}: HeaderIconButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const handleFilterPress = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    if (onFilterPress) {
      onFilterPress();
    }
  };

  const filterStyle: Animated.WithAnimatedObject<ViewStyle> = {
    width: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 140]
    }),
    height: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 160]
    }),
    backgroundColor: '#F8F8F8',
    borderRadius: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 12]
    }),
  };

  return (
    <View style={styles.container}>
      <CircleIconButton iconName="sparkles" size={20} onPress={onAIPress} />
      <CircleIconButton iconName="calendar" onPress={onCalendarPress} />
      <Animated.View style={[styles.filterButton, filterStyle]}>
        <CircleIconButton 
          iconName="filter" 
          onPress={handleFilterPress}
          style={{
            backgroundColor: 'transparent',
            opacity: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            })
          }}
        />
      </Animated.View>
      <CircleIconButton iconName="search" onPress={onSearchPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
    
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 