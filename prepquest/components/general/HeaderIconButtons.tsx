import React, { useContext, forwardRef, useImperativeHandle , useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Animated, ViewStyle, Text, TouchableOpacity, Dimensions, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '@/contexts/MenuContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export type PageType = 'decks' | 'folders' | 'favorites';

interface HeaderIconButtonsProps {
  onAIPress?: () => void;
  onCalendarPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  onSearchTextChange?: (text: string) => void;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
  initialSortField?: SortField;
  initialSortDirection?: SortDirection;
  pageType: PageType;
  disabled?: boolean;
}

export interface HeaderIconButtonsRef {
  reset: () => void;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'dateAdded' | 'lastModified';

function getSearchPlaceholder(pageType: PageType, language: string) {
  const searchPlaceholders = strings[language || 'English'].searchPlaceholders;
  switch (pageType) {
    case 'decks': return searchPlaceholders.decks;
    case 'folders': return searchPlaceholders.folders;
    case 'favorites': return searchPlaceholders.favorites;
    default: return searchPlaceholders.default;
  }
}

const DEFAULT_SORT_FIELD: SortField = 'lastModified';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';
const DEVICE_WIDTH = Dimensions.get('window').width;

export const HeaderIconButtons = forwardRef<HeaderIconButtonsRef, HeaderIconButtonsProps>(({
  onAIPress,
  onCalendarPress,
  onFilterPress,
  onSearchPress,
  onSearchTextChange,
  onSortChange,
  initialSortField,
  initialSortDirection,
  pageType,
  disabled
}, ref) => {
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity,
    setIsAIPromptOpen,
    aiPromptOpacity
  } = useContext(MenuContext);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedField, setSelectedField] = useState<SortField>(initialSortField || DEFAULT_SORT_FIELD);
  const [sortDirections, setSortDirections] = useState<Record<SortField, SortDirection>>({
    name: initialSortDirection || 'desc',
    dateAdded: initialSortDirection || 'desc',
    lastModified: initialSortDirection || DEFAULT_SORT_DIRECTION
  });
  const [searchText, setSearchText] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const searchFadeAnim = useRef(new Animated.Value(0)).current;

  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Memoize sort options to prevent recreation on every render
  const sortOptions = useMemo(() => [
    { label: strings[language || 'English'].sortOptions.name, value: 'name' },
    { label: strings[language || 'English'].sortOptions.dateAdded, value: 'dateAdded' },
    { label: strings[language || 'English'].sortOptions.lastModified, value: 'lastModified' },
  ], [language]);

  // Update sort state when initial props change
  useEffect(() => {
    if (initialSortField) {
      setSelectedField(initialSortField);
    }
    if (initialSortDirection) {
      setSortDirections(prev => ({
        name: initialSortDirection,
        dateAdded: initialSortDirection,
        lastModified: initialSortDirection
      }));
    }
  }, [initialSortField, initialSortDirection]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      // Reset all states to default
      setIsExpanded(false);
      setIsSearchMode(false);
      setSelectedField(initialSortField || DEFAULT_SORT_FIELD);
      setSortDirections({
        name: initialSortDirection || 'desc',
        dateAdded: initialSortDirection || 'desc',
        lastModified: initialSortDirection || DEFAULT_SORT_DIRECTION
      });
      setSearchText('');
      setIsSearchVisible(false);
      
      // Clear search in parent component
      if (onSearchTextChange) {
        onSearchTextChange('');
      }
      
      // Set default sort in parent component
      if (onSortChange) {
        onSortChange(initialSortField || DEFAULT_SORT_FIELD, initialSortDirection || DEFAULT_SORT_DIRECTION);
      }
      
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

  const collapseFilter = useCallback(() => {
    setIsExpanded(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expandAnim]);

  const handleFilterPress = useCallback(() => {
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
  }, [isExpanded, isSearchMode, expandAnim, onFilterPress]);

  const handleSearchPress = useCallback(() => {
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
  }, [isExpanded, collapseFilter, searchFadeAnim, onSearchPress]);

  const handleCloseSearch = useCallback(() => {
    setSearchText('');
    if (onSearchTextChange) {
      onSearchTextChange('');
    }
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
  }, [onSearchTextChange, searchFadeAnim, expandAnim]);

  const handleOtherButtonPress = useCallback((callback?: () => void) => {
    if (isExpanded) {
      collapseFilter();
    }
    if (callback) {
      callback();
    }
  }, [isExpanded, collapseFilter]);

  const handleSortPress = useCallback((field: SortField) => {
    let newDirection: SortDirection;
    
    if (selectedField === field) {
      newDirection = sortDirections[field] === 'desc' ? 'asc' : 'desc';
      setSortDirections(prev => ({
        ...prev,
        [field]: newDirection
      }));
    } else {
      newDirection = 'desc';
      setSelectedField(field);
      setSortDirections(prev => ({
        ...prev,
        [field]: newDirection
      }));
    }
    
    // Call the callback with the new sort configuration
    if (onSortChange) {
      onSortChange(field, newDirection);
    }
    
    collapseFilter();
  }, [selectedField, sortDirections, onSortChange, collapseFilter]);

  const handleAIPress = useCallback(() => {
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
  }, [isExpanded, isSearchMode, collapseFilter, handleCloseSearch, setIsMenuOpen, setIsAIPromptOpen, aiPromptOpacity, menuOverlayOpacity, onAIPress]);

  const handleCalendarPress = useCallback(() => {
    if (isExpanded) {
      collapseFilter();
    }
    if (isSearchMode) {
      handleCloseSearch();
    }
    
    if (onCalendarPress) {
      onCalendarPress();
    }
  }, [isExpanded, isSearchMode, collapseFilter, handleCloseSearch, onCalendarPress]);

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
            color={colors.unselectedText} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={getSearchPlaceholder(pageType, language)}
            placeholderTextColor={colors.unselectedText}
            selectionColor={colors.brandColor2} 
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              if (onSearchTextChange) {
                onSearchTextChange(text);
              }
            }}
            onSubmitEditing={() => {
              if (onSearchTextChange) {
                onSearchTextChange(searchText);
              }
            }}
            returnKeyType="search"
            autoFocus
          />
          <TouchableWithoutFeedback onPress={handleCloseSearch}>
            <View style={styles.closeButtonContainer}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'close-circle' : 'close-circle'}
                size={24}
                color={colors.unselectedText}
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
        disabled={disabled}
      />
      <CircleIconButton 
        iconName="calendar" 
        onPress={handleCalendarPress}
      />
      <Animated.View style={[
        styles.filterButton, 
        {
          width: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [46, 140]
          }),
          height: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [46, 184]
          }),
          backgroundColor: colors.secondaryShade,
          borderRadius: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [23, 12]
          }),
          overflow: 'hidden'
        }
      ]}>
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
            <Text style={[styles.rowText, {
              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
              }]}>{sortOptions.find(o => o.value === selectedField)?.label}</Text>
            <Feather 
              name={sortDirections[selectedField] === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color={colors.normalIconColor} 
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
            <Text style={[styles.rowText, {
              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
              }]}>{sortOptions[0].label}</Text>
            <Feather 
              name={sortDirections.name === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color={colors.normalIconColor} 
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
            <Text style={[styles.rowText, {
              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
              }]}>{sortOptions[1].label}</Text>
            <Feather 
              name={sortDirections.dateAdded === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color={colors.normalIconColor} 
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
            <Text style={[styles.rowText, {
              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
              }]}>{sortOptions[2].label}</Text>
            <Feather 
              name={sortDirections.lastModified === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color={colors.normalIconColor} 
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

// Add display name for HeaderIconButtons
HeaderIconButtons.displayName = 'HeaderIconButtons';

const createStyles = (colors: any) => StyleSheet.create({
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
    borderBottomColor: colors.unselectedText,
  },
  summaryRow: {
    backgroundColor: colors.secondaryShade,
  },
  selectedRow: {
    backgroundColor: colors.background,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: colors.text,
  },
  searchContainer: {
    height: 46,
    backgroundColor: colors.secondaryShade,
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
    fontFamily: Fonts.bodyMedium,
    color: colors.text,
    paddingVertical: 0,
  },
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 