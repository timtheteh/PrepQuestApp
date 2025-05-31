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

  const collapseFilter = () => {
    setIsExpanded(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

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

  const handleOtherButtonPress = (callback?: () => void) => {
    if (isExpanded) {
      collapseFilter();
    }
    if (callback) {
      callback();
    }
  };

  const filterStyle: Animated.WithAnimatedObject<ViewStyle> = {
    width: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [46, 140]
    }),
    height: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [46, 184]
    }),
    backgroundColor: '#F8F8F8',
    borderRadius: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [23, 12]
    }),
    overflow: 'hidden'
  };

  return (
    <View style={styles.container}>
      <CircleIconButton 
        iconName="sparkles" 
        size={20} 
        onPress={() => handleOtherButtonPress(onAIPress)} 
      />
      <CircleIconButton 
        iconName="calendar" 
        onPress={() => handleOtherButtonPress(onCalendarPress)} 
      />
      <Animated.View style={[styles.filterButton, filterStyle]}>
        {!isExpanded && (
          <CircleIconButton 
            iconName="filter" 
            onPress={handleFilterPress}
            style={{ backgroundColor: 'transparent' }}
          />
        )}
        <Animated.View 
          style={[
            styles.rowsContainer, 
            { 
              opacity: expandAnim,
              display: isExpanded ? 'flex' : 'none'
            }
          ]}
        >
          <View style={styles.row} />
          <View style={styles.row} />
          <View style={styles.row} />
          <View style={[styles.row, styles.lastRow]} />
        </Animated.View>
      </Animated.View>
      <CircleIconButton 
        iconName="search" 
        onPress={() => handleOtherButtonPress(onSearchPress)} 
      />
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
  rowsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  row: {
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: '#D5D4DD',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
}); 