import React, { useContext, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Animated, ViewStyle, Text, TouchableOpacity, Dimensions, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { useState, useRef } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '@/app/(tabs)/_layout';

export type PageType = 'decks' | 'folders' | 'favorites';

interface HeaderIconButtonsProps {
  onAIPress?: () => void;
  onCalendarPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  pageType: PageType;
}

export interface HeaderIconButtonsRef {
  reset: () => void;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'dateAdded' | 'lastModified';

const FIELD_LABELS: Record<SortField, string> = {
  name: 'Name',
  dateAdded: 'Date Added',
  lastModified: 'Last Modified'
};

export const CALENDAR_TITLES: Record<PageType, string> = {
  decks: 'Filter Decks based on\ndate added',
  folders: 'Filter Folders based on\ndate added',
  favorites: 'Filter Favorites based on\ndate added'
};

const SEARCH_PLACEHOLDERS: Record<PageType, string> = {
  decks: 'Search for Decks',
  folders: 'Search for Folders',
  favorites: 'Search Favorites'
};

const DEFAULT_SORT_FIELD: SortField = 'lastModified';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';
const DEVICE_WIDTH = Dimensions.get('window').width;

export const HeaderIconButtons = forwardRef<HeaderIconButtonsRef, HeaderIconButtonsProps>(({
  onAIPress,
  onCalendarPress,
  onFilterPress,
  onSearchPress,
  pageType
}, ref) => {
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity,
    setIsAIPromptOpen,
    aiPromptOpacity,
    setIsCalendarOpen,
    calendarOpacity,
    setCalendarTitle
  } = useContext(MenuContext);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedField, setSelectedField] = useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortDirections, setSortDirections] = useState<Record<SortField, SortDirection>>({
    name: 'desc',
    dateAdded: 'desc',
    lastModified: DEFAULT_SORT_DIRECTION
  });
  const [searchText, setSearchText] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const searchFadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    reset: () => {
      // Reset all states to default
      setIsExpanded(false);
      setIsSearchMode(false);
      setSelectedField(DEFAULT_SORT_FIELD);
      setSortDirections({
        name: 'desc',
        dateAdded: 'desc',
        lastModified: DEFAULT_SORT_DIRECTION
      });
      setSearchText('');
      setIsSearchVisible(false);
      
      // Reset animations
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.timing(searchFadeAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ]).start();
    }
  }));

  const collapseFilter = () => {
    setIsExpanded(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleFilterPress = () => {
    if (isSearchMode) return;
    
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

  const handleSearchPress = () => {
    setIsSearchMode(true);
    setIsSearchVisible(true);
    if (isExpanded) {
      collapseFilter();
    }
    Animated.timing(searchFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    if (onSearchPress) {
      onSearchPress();
    }
  };

  const handleCloseSearch = () => {
    setSearchText('');
    setIsExpanded(false);
    Animated.parallel([
      Animated.timing(searchFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      })
    ]).start(() => {
      setIsSearchMode(false);
      setIsSearchVisible(false);
    });
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
      setSortDirections(prev => ({
        ...prev,
        [field]: prev[field] === 'desc' ? 'asc' : 'desc'
      }));
    } else {
      setSelectedField(field);
      setSortDirections(prev => ({
        ...prev,
        [field]: 'desc'
      }));
    }
    
    collapseFilter();
  };

  const handleAIPress = () => {
    if (isExpanded) {
      collapseFilter();
    }
    if (isSearchMode) {
      handleCloseSearch();
    }
    
    setIsMenuOpen(true);
    setIsAIPromptOpen(true);
    
    Animated.timing(aiPromptOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(menuOverlayOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (onAIPress) {
      onAIPress();
    }
  };

  const handleCalendarPress = () => {
    if (isExpanded) {
      collapseFilter();
    }
    if (isSearchMode) {
      handleCloseSearch();
    }
    
    setIsMenuOpen(true);
    setIsCalendarOpen(true);
    setCalendarTitle(CALENDAR_TITLES[pageType]);
    
    Animated.timing(calendarOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(menuOverlayOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (onCalendarPress) {
      onCalendarPress();
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

  if (isSearchVisible) {
    return (
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            opacity: searchFadeAnim,
            width: DEVICE_WIDTH * 0.8,
          }
        ]}
      >
        <View style={styles.searchInputRow}>
          <Feather 
            name="search" 
            size={24} 
            color="#D5D4DD" 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={SEARCH_PLACEHOLDERS[pageType]}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          <TouchableWithoutFeedback onPress={handleCloseSearch}>
            <View style={styles.closeButtonContainer}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'close-circle' : 'close-circle'}
                size={24}
                color="#D5D4DD"
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: searchFadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          })
        }
      ]}
    >
      <CircleIconButton 
        iconName="sparkles" 
        size={20} 
        onPress={handleAIPress}
      />
      <CircleIconButton 
        iconName="calendar" 
        onPress={handleCalendarPress}
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
        onPress={handleSearchPress}
      />
    </Animated.View>
  );
});

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
  searchContainer: {
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    justifyContent: 'center',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 3,
  },
  searchIcon: {
    paddingHorizontal: 3,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    paddingVertical: 0,
  },
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 