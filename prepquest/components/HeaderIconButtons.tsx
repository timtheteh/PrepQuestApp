import React from 'react';
import { StyleSheet, View, Animated, ViewStyle, Text, TouchableOpacity } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { useState, useRef } from 'react';
import Feather from '@expo/vector-icons/Feather';

interface HeaderIconButtonsProps {
  onAIPress?: () => void;
  onCalendarPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'dateAdded' | 'lastModified';

const FIELD_LABELS: Record<SortField, string> = {
  name: 'Name',
  dateAdded: 'Date Added',
  lastModified: 'Last Modified'
};

const DEFAULT_SORT_FIELD: SortField = 'lastModified';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

export function HeaderIconButtons({
  onAIPress,
  onCalendarPress,
  onFilterPress,
  onSearchPress
}: HeaderIconButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedField, setSelectedField] = useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortDirections, setSortDirections] = useState<Record<SortField, SortDirection>>({
    name: 'desc',
    dateAdded: 'desc',
    lastModified: DEFAULT_SORT_DIRECTION
  });
  const expandAnim = useRef(new Animated.Value(0)).current;

  const collapseFilter = () => {
    setIsExpanded(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleFilterPress = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
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

  const handleSortPress = (field: SortField) => {
    if (selectedField === field) {
      // If same field is selected, just toggle direction
      setSortDirections(prev => ({
        ...prev,
        [field]: prev[field] === 'desc' ? 'asc' : 'desc'
      }));
    } else {
      // If different field is selected, update selection and set direction to desc
      setSelectedField(field);
      setSortDirections(prev => ({
        ...prev,
        [field]: 'desc'
      }));
    }
    
    // Collapse the filter button after selection
    collapseFilter();
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
          <TouchableOpacity 
            style={[
              styles.row, 
              styles.summaryRow,
              { borderBottomWidth: 3 }
            ]}
            onPress={collapseFilter}
          >
            <Text style={styles.rowText}>{FIELD_LABELS[selectedField]}</Text>
            <Feather 
              name={sortDirections[selectedField] === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color="black" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.row,
              { borderBottomWidth: 1 },
              selectedField === 'name' && styles.selectedRow
            ]} 
            onPress={() => handleSortPress('name')}
          >
            <Text style={styles.rowText}>Name</Text>
            <Feather 
              name={sortDirections.name === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color="black" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.row,
              { borderBottomWidth: 1 },
              selectedField === 'dateAdded' && styles.selectedRow
            ]}
            onPress={() => handleSortPress('dateAdded')}
          >
            <Text style={styles.rowText}>Date Added</Text>
            <Feather 
              name={sortDirections.dateAdded === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color="black" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.row,
              styles.lastRow,
              selectedField === 'lastModified' && styles.selectedRow
            ]}
            onPress={() => handleSortPress('lastModified')}
          >
            <Text style={styles.rowText}>Last Modified</Text>
            <Feather 
              name={sortDirections.lastModified === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color="black" 
            />
          </TouchableOpacity>
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
    flexDirection: 'row',
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#D5D4DD',
  },
  summaryRow: {
    backgroundColor: '#F8F8F8',
  },
  selectedRow: {
    backgroundColor: 'white',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  },
}); 