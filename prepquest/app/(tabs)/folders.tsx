import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView, RefreshControl } from 'react-native';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/general/HeaderIconButtons';
import { Title } from '@/components/general/Title';
import { FolderCard } from '@/components/folderComponents/FolderCard';
import { ActionButtonsRow } from '@/components/general/ActionButtonsRow';

import { useState, useRef, useContext, useEffect, useCallback, useMemo } from 'react';
import { MenuContext } from '@/contexts/MenuContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { FloatingActionButton } from '@/components/general/FloatingActionButton';
import { getAllFolders, Folder, deleteMultipleFolders, checkFoldersDatabaseReady, updateFolderFavoriteStatus, createNewFolder, checkDecksAlreadyInFolders, addDecksToFolders, moveDecksToFolders } from '@/db/decks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { CalendarModal } from '@/components/modals/CalendarModal';
import LottieView from 'lottie-react-native';
import { DeckSkeletonCard } from '@/components/general/DeckSkeletonCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarTopHeight, useHeaderIconsTopHeight, useContentTopHeightNoRoundedToggle, useBottomContentSpacing } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedScreenTransition } from '@/utils/performanceOptimizations';
import { formatDate as formatDateUtil } from '@/utils/dateFormat';


type SortField = 'name' | 'dateAdded' | 'lastModified';
type SortDirection = 'asc' | 'desc';

const FOLDERS_SORT_FIELD_KEY = 'folders_sort_field';
const FOLDERS_SORT_DIRECTION_KEY = 'folders_sort_direction';

const SHIFT_DISTANCE = 48; // Distance to shift content down
const selectUnselectedDuration = 150; // Reduced from 300ms for better performance on low-end devices
const SCREEN_TRANSITION_DURATION = 200; // Match navbar animation duration

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    return '1'; // Default to '1' on error
  }
}

export default function FoldersScreen() {
  const router = useRouter();
  const { isAddToFolders, isMoveToFolders, previousMode, selectedState, sourcePage, deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, folderTitle, folderId, originalSourcePage, originalFolderTitle, originalFolderId, selectedDeckIds } = useLocalSearchParams();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isAddToFoldersMode, setIsAddToFoldersMode] = useState(false);
  const [isMoveToFoldersMode, setIsMoveToFoldersMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [foldersCount, setFoldersCount] = useState(0);
  const [shouldShowAnimation, setShouldShowAnimation] = useState(true);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setShowSlidingMenu,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity,
    navbarRef,
    setHandleDeletion,
    setDeleteModalText,
    setIsAddToFoldersModalOpen,
    addToFoldersModalOpacity,
    setIsMoveToFoldersModalOpen,
    moveToFoldersModalOpacity,
    setNoSelectionModalSubtitle,
    sourcePageForFolders,
    setSourcePageForFolders,
    setIsDeckDetailsSaveModalOpen,
    deckDetailsSaveModalOpacity,
    setIsDecksAlreadyInFoldersModalOpen,
    decksAlreadyInFoldersModalOpacity,
    setDeckDetailsSaveModalType
  } = useContext(MenuContext);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom' | null>('all');
  const [calendarCustomDate, setCalendarCustomDate] = useState<string | null>(null);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const getTopBarTopHeight = useTopBarTopHeight();
  const getHeaderIconsTopHeight = useHeaderIconsTopHeight();
  const getContentTopHeightNoRoundedToggle = useContentTopHeightNoRoundedToggle();
  const getBottomContentSpacing = useBottomContentSpacing();
  const bottomSpacing = getBottomContentSpacing();

  // Animation values
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(bottomSpacing)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;

  const styles = StyleSheet.create({
    animatedContainer: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    topBar: {
      position: 'absolute',
      left: 16,
      zIndex: 1,
    },
    headerIconsContainer: {
      position: 'absolute',
      right: 16,
      zIndex: 1,
    },
    backButton: {
      paddingTop: 10,
      paddingRight: 8,
    },
    mainContentWrapper: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    titleContainer: {
      position: 'relative',
      height: Platform.OS === 'android' ? 32 : 24,
    },
    selectButtonContainer: {
      position: 'relative',
      width: 85,
      height: 24,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    selectButton: {
      fontSize: 20,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].brandColor1,
    },
    selectButtonAbsolute: {
      position: 'absolute',
    },
    scrollWrapper: {
      flex: 1,
      marginTop: 10,
    },
    scrollViewContainer: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      paddingBottom: bottomSpacing,
    },
    shiftableContent: {
      flex: 1,
      marginTop: 16,
    },
    actionButtonsRow: {
      position: 'absolute',
      top: 18,
      right: 0,
      left: 0,
      zIndex: 1,
    },
    firstCard: {
      marginTop: 5,
    },
    card: {
      marginTop: '8%',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 16,
    },
    fabContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
      zIndex: 1,
    },
    doneButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingRight: 16,
      height: 48,
    },
    doneButton: {
      fontSize: 20,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].brandColor1,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40, // Add some top padding to center it better in the scrollview
    },
    emptyStateAnimation: {
      width: 200,
      height: 200,
    },
    emptyStateText: {
      fontSize: 18,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].text,
      textAlign: 'center',
      marginTop: 0,
      lineHeight: 20,
    },
    selectButtonDisabled: {
      fontSize: 20,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].unselectedText,
    },
  });

  // Reset header icons state and selection mode when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset header icons
      headerIconsRef.current?.reset();

      // Set the delete modal text for folders
      setDeleteModalText(strings[language].folders.areYouSureYouWantToDeleteTheseFolders);

      // Check if we should enter AddToFolders mode
      if (isAddToFolders === 'true') {
        // Set the source page for folders in context
        setSourcePageForFolders(sourcePage as string || '');
        
        // First reset any selected folders before showing circle buttons
        setSelectedFolders(new Set());
        
        // Then set up the selection mode
        setIsSelectMode(true);
        setIsAddToFoldersMode(true);
        setIsMoveToFoldersMode(false);
        
        // Set animation values directly without animation
        shiftAnim.setValue(SHIFT_DISTANCE);
        marginAnim.setValue(bottomSpacing + SHIFT_DISTANCE);
        actionRowOpacity.setValue(1);
        selectTextAnim.setValue(1);
        fabOpacity.setValue(0);
        cardWidthPercentage.setValue(85);
        
        // Show circle buttons last, after selection state is reset
        circleButtonOpacity.setValue(1);

        // Reset navbar animation to -2
        navbarRef?.current?.resetAnimation();

        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      } else if (isMoveToFolders === 'true') {
        // Set the source page for folders in context
        setSourcePageForFolders(sourcePage as string || '');
        
        // First reset any selected folders before showing circle buttons
        setSelectedFolders(new Set());
        
        // Then set up the selection mode
        setIsSelectMode(true);
        setIsMoveToFoldersMode(true);
        setIsAddToFoldersMode(false);
        
        // Set animation values directly without animation
        shiftAnim.setValue(SHIFT_DISTANCE);
        marginAnim.setValue(bottomSpacing + SHIFT_DISTANCE);
        actionRowOpacity.setValue(1);
        selectTextAnim.setValue(1);
        fabOpacity.setValue(0);
        cardWidthPercentage.setValue(85);
        
        // Show circle buttons last, after selection state is reset
        circleButtonOpacity.setValue(1);

        // Reset navbar animation to -2
        navbarRef?.current?.resetAnimation();

        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      } else {
        // Reset selection mode and related states
        setIsSelectMode(false);
        setIsAddToFoldersMode(false);
        setIsMoveToFoldersMode(false);
        setSelectedFolders(new Set());

        // Reset all animations to their default values
        shiftAnim.setValue(0);
        marginAnim.setValue(bottomSpacing);
        actionRowOpacity.setValue(0);
        selectTextAnim.setValue(0);
        fabOpacity.setValue(1);
        cardWidthPercentage.setValue(100);
        circleButtonOpacity.setValue(0);

        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      }
    } else {
      screenOpacity.setValue(0);
    }
  }, [isFocused]);

  // Set up the deletion handler when the component mounts
  useEffect(() => {
    if (isFocused) {
    setHandleDeletion(() => handleCancel);
    }
    return () => {
      if (!isFocused) {
        setHandleDeletion(null);
      }
    };
  }, [isFocused]);

  // Check if database is ready
  useEffect(() => {
    const checkDatabaseReady = async () => {
      try {
        const { isReady, foldersCount } = await checkFoldersDatabaseReady();
        if (isReady) {
          setIsDatabaseReady(true);
          setFoldersCount(foldersCount);
        } else {
          // Retry after a short delay
          setTimeout(checkDatabaseReady, 500);
        }
      } catch (error) {
        // Retry after a short delay
        setTimeout(checkDatabaseReady, 500);
      }
    };
    
    checkDatabaseReady();
  }, []);

  // Load folders data function (reusable for both initial load and refresh)
  const loadFoldersData = useCallback(async (showLoadingState = true) => {
    if (!isDatabaseReady) {
      return;
    }
    
    if (showLoadingState) {
      setIsLoadingFolders(true);
    }
    
    try {
      // Load folders data directly from database
      const foldersData = await getAllFolders();

      setFolders(foldersData);
      setFilteredFolders(foldersData);
      setFoldersCount(foldersData.length);
      
      if (showLoadingState) {
        setIsLoadingFolders(false);
      }
    } catch (error) {
      console.error('Error loading folders data:', error);
      if (showLoadingState) {
        setIsLoadingFolders(false);
      }
    }
  }, [isDatabaseReady]);

  // Load folders data from database
  useEffect(() => {
    if (isFocused) {
      // Use optimized screen transition
      optimizedScreenTransition.transitionWithDataPreload(
        () => {
          // Start screen fade-in animation
          Animated.timing(screenOpacity, {
            toValue: 1,
            duration: optimizedScreenTransition.getTransitionDuration(),
            useNativeDriver: true,
          }).start();
        },
        () => loadFoldersData(true)
      );
    }
  }, [isFocused, isDatabaseReady, loadFoldersData]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadFoldersData(false);
    } catch (error) {
      console.error('Error refreshing folders data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadFoldersData]);

  // Load sort preferences when component mounts
  useEffect(() => {
    loadSortPreferences();
  }, []);

  // Apply sort preferences when folders are loaded and preferences are available
  useEffect(() => {
    if (folders.length > 0) {
      const sortedFolders = sortFolders(folders);
      setFilteredFolders(sortedFolders);
    }
  }, [folders, sortField, sortDirection]);

  // Cleanup effect to reset selections when search state changes
  useEffect(() => {
    // Reset selections when search state changes to prevent index mismatches
    if (isSelectMode) {
      setSelectedFolders(new Set());
    }
  }, [isSearching, isSelectMode]);

  // Helper function to format date using utility
  const formatDate = useCallback((dateString: string): string => {
    return formatDateUtil(dateString, language);
  }, [language]);

  // Sort function for folders
  const sortFolders = useCallback((folders: Folder[]) => {
    return [...folders].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.folderName.toLowerCase();
          bValue = b.folderName.toLowerCase();
          break;
        case 'dateAdded':
          aValue = new Date(a.dateAdded);
          bValue = new Date(b.dateAdded);
          break;
        case 'lastModified':
          aValue = new Date(a.lastModifiedDate || a.dateAdded);
          bValue = new Date(b.lastModifiedDate || b.dateAdded);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [sortField, sortDirection]);

  const handleSortChange = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    saveSortPreferences(field, direction);
  }, []);

  // Save sort preferences to AsyncStorage with userID
  const saveSortPreferences = useCallback(async (field: SortField, direction: SortDirection) => {
    try {
      const userID = await getCurrentUserID();
      const userSpecificFieldKey = `${FOLDERS_SORT_FIELD_KEY}_${userID}`;
      const userSpecificDirectionKey = `${FOLDERS_SORT_DIRECTION_KEY}_${userID}`;
      
      await AsyncStorage.multiSet([
        [userSpecificFieldKey, field],
        [userSpecificDirectionKey, direction]
      ]);
    } catch (error) {
    }
  }, []);

  // Load sort preferences from AsyncStorage with userID
  const loadSortPreferences = useCallback(async () => {
    try {
      const userID = await getCurrentUserID();
      const userSpecificFieldKey = `${FOLDERS_SORT_FIELD_KEY}_${userID}`;
      const userSpecificDirectionKey = `${FOLDERS_SORT_DIRECTION_KEY}_${userID}`;
      
      const [savedField, savedDirection] = await AsyncStorage.multiGet([
        userSpecificFieldKey,
        userSpecificDirectionKey
      ]);
      
      if (savedField[1]) {
        setSortField(savedField[1] as SortField);
      }
      if (savedDirection[1]) {
        setSortDirection(savedDirection[1] as SortDirection);
      }
    } catch (error) {
    }
  }, []);

  const handleSelect = useCallback(() => {
    setIsSelectMode(true);
    
    const animationConfig = getAnimationConfig();
    
    // For low-end devices: Instant mode - no animations at all
    if (animationConfig.instantMode) {
      // Set all values directly for instant response
      shiftAnim.setValue(SHIFT_DISTANCE);
      marginAnim.setValue(bottomSpacing + SHIFT_DISTANCE);
      actionRowOpacity.setValue(1);
      selectTextAnim.setValue(1);
      fabOpacity.setValue(0);
      circleButtonOpacity.setValue(1);
      cardWidthPercentage.setValue(85);
      
      return;
    }
    
    const duration = animationConfig.duration;
    
    // For all non-instant devices: Instant shift to prevent overlap
    if (!animationConfig.instantMode) {
      // INSTANT content shift to make space - no animation delay
      shiftAnim.setValue(SHIFT_DISTANCE);
      
      // Then animate other elements with proper spacing
      Animated.parallel([
        Animated.timing(actionRowOpacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(selectTextAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(marginAnim, {
          toValue: bottomSpacing + SHIFT_DISTANCE,
          duration: duration,
          useNativeDriver: false,
        }),
        Animated.timing(circleButtonOpacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(fabOpacity, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(cardWidthPercentage, {
          toValue: 85,
          duration: duration,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Use all parallel animations for high-end devices
      Animated.parallel([
        Animated.timing(shiftAnim, {
          toValue: SHIFT_DISTANCE,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(marginAnim, {
          toValue: bottomSpacing + SHIFT_DISTANCE,
          duration: selectUnselectedDuration,
          useNativeDriver: false,
        }),
        Animated.timing(actionRowOpacity, {
          toValue: 1,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(selectTextAnim, {
          toValue: 1,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(fabOpacity, {
          toValue: 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(cardWidthPercentage, {
          toValue: 85,
          duration: selectUnselectedDuration,
          useNativeDriver: false,
        }),
        Animated.timing(circleButtonOpacity, {
          toValue: 1,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, []);

  const handleCancel = useCallback(() => {
    const animationConfig = getAnimationConfig();
    
    // For low-end devices: Instant mode - no animations at all
    if (animationConfig.instantMode) {
      // Set all values directly for instant response
      shiftAnim.setValue(0);
      marginAnim.setValue(bottomSpacing);
      actionRowOpacity.setValue(0);
      selectTextAnim.setValue(0);
      fabOpacity.setValue(1);
      circleButtonOpacity.setValue(0);
      cardWidthPercentage.setValue(100);
      
      // Update state immediately
      setIsSelectMode(false);
      setSelectedFolders(new Set());
      
      return;
    }
    
    const duration = animationConfig.duration;
    
    // For mid-range and high-end devices: Use animations
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(marginAnim, {
        toValue: bottomSpacing,
        duration: selectUnselectedDuration,
        useNativeDriver: false,
      }),
      Animated.timing(actionRowOpacity, {
        toValue: 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }),
      Animated.timing(selectTextAnim, {
        toValue: 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }),
      Animated.timing(fabOpacity, {
        toValue: 1,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }),
      Animated.timing(cardWidthPercentage, {
        toValue: 100,
        duration: selectUnselectedDuration,
        useNativeDriver: false,
      }),
      Animated.timing(circleButtonOpacity, {
        toValue: 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSelectMode(false);
      setSelectedFolders(new Set());
    });
  }, []);

  const handleActionIconPress = useCallback((index: number) => {
    const hasSelection = selectedFolders.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle(strings[language].folders.pleaseChooseAtLeastOneFolder);
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    // In folders mode, we only have trash button
    if (index === 0) {
      setIsMenuOpen(true);
      setIsTrashModalOpenInDecksPage(true);
      setDeleteModalText(strings[language].folders.areYouSureYouWantToDeleteTheseFolders);
      setHandleDeletion(() => handleDeleteSelectedFolders);
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(trashModalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [selectedFolders.size, strings, language]);

  const handleFabPress = useCallback(async () => {
    try {
      
      const { success, newFolder } = await createNewFolder();
      
      if (success && newFolder) {
        // Add the new folder to the local state
        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        
        // Update filtered folders if not searching
        if (!isSearching) {
          const sortedUpdatedFolders = sortFolders(updatedFolders);
          setFilteredFolders(sortedUpdatedFolders);
        }
        
        // Update the folders count
        setFoldersCount(updatedFolders.length);
        
      } else {
      }
    } catch (error) {
    }
  }, [folders, isSearching, sortFolders]);

  const handleMenuPress = useCallback(() => {
    setIsMenuOpen(true);
    setShowSlidingMenu(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSparklesPress = useCallback(() => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCalendarPress = useCallback(() => {
    setIsCalendarOpen(true);
  }, []);

  const handleCalendarDismiss = useCallback(() => {
    setIsCalendarOpen(false);
  }, []);

  const handleSearchPress = useCallback(() => {
    // This will be called when the search button is pressed
    // The actual search logic will be handled by the HeaderIconButtons component
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    
    if (query.length === 0) {
      // If search is empty, show all folders sorted according to current preferences
      const sortedFolders = sortFolders(folders);
      setFilteredFolders(sortedFolders);
    } else {
      // Filter folders by name (case-insensitive) and then sort them
      const lowerQuery = query.toLowerCase();
      
      const filtered = folders.filter(folder => 
        folder.folderName.toLowerCase().includes(lowerQuery)
      );
      
      // Sort the filtered results according to current preferences
      const sortedFilteredFolders = sortFolders(filtered);
      setFilteredFolders(sortedFilteredFolders);
    }
  }, [folders, sortFolders]);

  const handleClearSearch = useCallback(() => {
    // Clear selections first to prevent render issues
    setSelectedFolders(new Set());
    
    // Reset search state
    setSearchQuery('');
    setIsSearching(false);
    
    // Reset filtered data with sorting applied
    const sortedFolders = sortFolders(folders);
    setFilteredFolders(sortedFolders);
  }, [folders, sortFolders]);

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleSelectAll = useCallback(() => {
    const foldersToUse = isSearching ? filteredFolders : folders;
    const allFolderIndices = new Set(Array.from({ length: foldersToUse.length }, (_, i) => i));
    setSelectedFolders(allFolderIndices);
  }, [isSearching, filteredFolders, folders]);

  const handleDone = async () => {
    // Handle the done action for AddToFolders or MoveToFolders mode
    if (isAddToFoldersMode) {
      try {
        // Get the selected folder IDs
        const foldersToUse = isSearching ? filteredFolders : folders;
        const selectedFolderIds = Array.from(selectedFolders).map(index => foldersToUse[index].folderID);

        if (selectedFolderIds.length === 0) {
          // Navigate back to source page when no folders are selected
          handleBackPress();
          return;
        }

        // Get the deck IDs from the route params
        let targetDeckIds: number[] = [];
        
        // Check if we have selectedDeckIds (from index page) or deckId (from deckDetails page)
        if (selectedDeckIds) {
          try {
            targetDeckIds = JSON.parse(selectedDeckIds as string);
          } catch (error) {
            return;
          }
        } else if (deckId) {
          targetDeckIds = [parseInt(deckId as string)];
        } else {
          return;
        }

        if (targetDeckIds.length === 0) {
          return;
        }

        // Check if any decks are already in the selected folders
        const hasExistingDecks = await checkDecksAlreadyInFolders(targetDeckIds, selectedFolderIds);

        // If any decks are already in the selected folders, show warning modal
        if (hasExistingDecks) {
          setIsMenuOpen(true);
          setIsDecksAlreadyInFoldersModalOpen(true);
          
          Animated.parallel([
            Animated.timing(menuOverlayOpacity, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(decksAlreadyInFoldersModalOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
          return;
        }

        // Process each deck (only if no existing decks found)
        const success = await addDecksToFolders(targetDeckIds, selectedFolderIds);
        
        if (!success) {
          return;
        }
        
        // Reload folder data to update deck counts
        const updatedFoldersData = await getAllFolders();
        setFolders(updatedFoldersData);
        setFilteredFolders(updatedFoldersData);
        
        // Show success modal
        setIsMenuOpen(true);
        setIsDeckDetailsSaveModalOpen(true);
        setDeckDetailsSaveModalType('add');
        
        Animated.parallel([
          Animated.timing(menuOverlayOpacity, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(deckDetailsSaveModalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
        
        // Navigate back to source page immediately while success modal is visible
        setTimeout(() => {
          handleBackPress();
        }, 100); // Short delay to ensure modal is visible before navigation
      } catch (error) {
      }
    } else if (isMoveToFoldersMode) {
      try {
        // Get the selected folder IDs
        const foldersToUse = isSearching ? filteredFolders : folders;
        const selectedFolderIds = Array.from(selectedFolders).map(index => foldersToUse[index].folderID);

        if (selectedFolderIds.length === 0) {
          // Navigate back to source page when no folders are selected
          handleBackPress();
          return;
        }

        // Get the deck IDs from the route params
        let targetDeckIds: number[] = [];
        
        if (selectedDeckIds) {
          try {
            targetDeckIds = JSON.parse(selectedDeckIds as string);
          } catch (error) {
            return;
          }
        } else {
          return;
        }

        if (targetDeckIds.length === 0) {
          return;
        }

        // Get the current folder ID (the folder we're moving from)
        const currentFolderId = parseInt(folderId as string);
        if (!currentFolderId) {
          return;
        }

        // Check if any decks are already in the selected folders
        const hasExistingDecks = await checkDecksAlreadyInFolders(targetDeckIds, selectedFolderIds);

        // If any decks are already in the selected folders, show warning modal
        if (hasExistingDecks) {
          setIsMenuOpen(true);
          setIsDecksAlreadyInFoldersModalOpen(true);
          
          Animated.parallel([
            Animated.timing(menuOverlayOpacity, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(decksAlreadyInFoldersModalOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
          return;
        }

        // Process each deck (only if no existing decks found)
        const success = await moveDecksToFolders(targetDeckIds, selectedFolderIds, currentFolderId);
        
        if (!success) {
          return;
        }
        
        // Reload folder data to update deck counts
        const updatedFoldersData = await getAllFolders();
        setFolders(updatedFoldersData);
        setFilteredFolders(updatedFoldersData);
        
        // Show success modal
        setIsMenuOpen(true);
        setIsDeckDetailsSaveModalOpen(true);
        setDeckDetailsSaveModalType('move');
        
        Animated.parallel([
          Animated.timing(menuOverlayOpacity, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(deckDetailsSaveModalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
        
        // Navigate back to source page immediately while success modal is visible
        setTimeout(() => {
          handleBackPress();
        }, 0); // Short delay to ensure modal is visible before navigation
      } catch (error) {
      }
    }
    
    // Exit selection mode
    handleCancel();
  };

  const handleDeleteSelectedFolders = async () => {
    try {
      // Get the selected folder IDs
      const foldersToUse = isSearching ? filteredFolders : folders;
      const selectedFolderIds = Array.from(selectedFolders).map(index => foldersToUse[index].folderID);

      if (selectedFolderIds.length === 0) {
        return;
      }

      // Delete the folders from database
      const success = await deleteMultipleFolders(selectedFolderIds);
      
      if (success) {
        // Clear selections first to prevent render issues
        setSelectedFolders(new Set());
        
        // Update local state by removing the deleted folders
        const remainingFolders = folders.filter(folder => !selectedFolderIds.includes(folder.folderID));
        setFolders(remainingFolders);
        
        // Update folders count immediately
        setFoldersCount(remainingFolders.length);
        
        // Update filtered folders if searching
        if (isSearching) {
          const remainingFilteredFolders = filteredFolders.filter(folder => !selectedFolderIds.includes(folder.folderID));
          setFilteredFolders(remainingFilteredFolders);
        }

        // Exit selection mode after state updates
        setTimeout(() => {
          handleCancel();
        }, 0);
        
      } else {
      }
    } catch (error) {
    }
  };

  // Function to handle favorite/unfavorite folder
  const handleFolderFavoriteToggle = async (folderId: number, currentFavorited: boolean) => {
    try {
      const newFavoritedValue = !currentFavorited;
      
      // Update database
      const success = await updateFolderFavoriteStatus(folderId, newFavoritedValue);
      
      if (success) {
        // Update local state immediately
        setFolders(prev => 
          prev.map(folder => 
            folder.folderID === folderId 
              ? { ...folder, isFavorited: newFavoritedValue ? 1 : 0 }
              : folder
          )
        );
        
        // Update filtered folders if searching
        if (isSearching) {
          setFilteredFolders(prev => 
            prev.map(folder => 
              folder.folderID === folderId 
                ? { ...folder, isFavorited: newFavoritedValue ? 1 : 0 }
                : folder
            )
          );
        }
      }
    } catch (error) {
    }
  };

  const handleBackPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // If in AddToFolders mode, navigate back to source page in selected state
    if (isAddToFolders === 'true') {
      if (Platform.OS === 'ios') {
        if (sourcePageForFolders === 'favorites') {
          navbarRef?.current?.resetAnimation();
        } else if (sourcePageForFolders === 'deckDetails') {
          navbarRef?.current?.resetAnimation();
        } else {
          navbarRef?.current?.setDecksTab();
        }
        setTimeout(() => {
          if (sourcePageForFolders === 'favorites') {
            router.push({
              pathname: '/(tabs)/favorites',
              params: {
                mode: previousMode,
                selected: 'false'
              }
            });
          } else if (sourcePageForFolders === 'deckDetails') {
            // Navigate back to deckDetails page with all original parameters
            router.push({
              pathname: '/(tabs)/deckDetails',
              params: {
                deckId: deckId as string,
                deckTitle: deckTitle as string,
                deckType: deckType as string,
                deckDetailsBackgroundIndex: deckDetailsBackgroundIndex as string,
                date: date as string,
                flashcardCount: flashcardCount as string,
                percent: percent as string,
                company: company as string,
                isAIDeck: isAIDeck as string,
                mode: previousMode,
                sourcePage: originalSourcePage as string,
                folderTitle: originalFolderTitle as string,
                folderId: originalFolderId as string
              }
            });
          } else {
            router.push({
              pathname: '/(tabs)',
              params: {
                mode: previousMode,
                selected: 'false'
              }
            });
          }
        }, 50);
      } else {
        if (sourcePageForFolders === 'favorites') {
          router.push({
            pathname: '/(tabs)/favorites',
            params: {
              mode: previousMode,
              selected: 'true'
            }
          });
        } else if (sourcePageForFolders === 'deckDetails') {
          // Navigate back to deckDetails page with all original parameters
          router.push({
            pathname: '/(tabs)/deckDetails',
            params: {
              deckId: deckId as string,
              deckTitle: deckTitle as string,
              deckType: deckType as string,
              deckDetailsBackgroundIndex: deckDetailsBackgroundIndex as string,
              date: date as string,
              flashcardCount: flashcardCount as string,
              percent: percent as string,
              company: company as string,
              isAIDeck: isAIDeck as string,
              mode: previousMode,
              sourcePage: originalSourcePage as string,
              folderTitle: originalFolderTitle as string,
              folderId: originalFolderId as string
            }
          });
        } else {
          router.push({
            pathname: '/(tabs)',
            params: {
              mode: previousMode,
              selected: 'false'
            }
          });
        }
        setTimeout(() => {
          if (sourcePageForFolders === 'favorites') {
            navbarRef?.current?.resetAnimation();
          } else if (sourcePageForFolders === 'deckDetails') {
            navbarRef?.current?.resetAnimation();
          } else {
            navbarRef?.current?.setDecksTab();
          }
        }, 50);
      }
      return;
    } else if (isMoveToFolders === 'true') {
      // Navigate back to viewDecksInFolder page in selected state
      if (Platform.OS === 'ios') {
        navbarRef?.current?.resetAnimation();
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/viewDecksInFolder',
            params: {
              folderTitle: folderTitle as string,
              folderId: folderId as string,
              selectedState: 'true',
              sourcePage: sourcePage as string
            }
          });
        }, 50);
      } else {
        router.push({
          pathname: '/(tabs)/viewDecksInFolder',
          params: {
            folderTitle: folderTitle as string,
            folderId: folderId as string,
            selectedState: 'true',
            sourcePage: sourcePage as string
          }
        });
        setTimeout(() => {
          navbarRef?.current?.resetAnimation();
        }, 50);
      }
      return;
    }
    
    // Regular back navigation for non-AddToFolders mode
    if (Platform.OS === 'ios') {
      navbarRef?.current?.setDecksTab();
      setTimeout(() => {
        router.push('/(tabs)');
      }, 50);
    } else {
      router.push('/(tabs)');
      setTimeout(() => {
        navbarRef?.current?.setDecksTab();
      }, 50);
    }
  };

  // Filter folders by dateAdded according to calendarFilter
  const filterFoldersByDate = useCallback((folders: Folder[]): Folder[] => {
    if (calendarFilter === 'all' || !calendarFilter) return folders;
    const now = new Date();
    return folders.filter((folder: Folder) => {
      const folderDate = new Date(folder.dateAdded);
      if (calendarFilter === 'today') {
        return (
          folderDate.getFullYear() === now.getFullYear() &&
          folderDate.getMonth() === now.getMonth() &&
          folderDate.getDate() === now.getDate()
        );
      }
      if (calendarFilter === 'week') {
        // Start of week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        // End of week (Saturday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return folderDate >= startOfWeek && folderDate <= endOfWeek;
      }
      if (calendarFilter === 'month') {
        return (
          folderDate.getFullYear() === now.getFullYear() &&
          folderDate.getMonth() === now.getMonth()
        );
      }
      if (calendarFilter === 'custom' && calendarCustomDate) {
        // calendarCustomDate is in 'YYYY-MM-DD' format
        const [year, month, day] = calendarCustomDate.split('-').map(Number);
        return (
          folderDate.getFullYear() === year &&
          folderDate.getMonth() + 1 === month && // JS months are 0-based
          folderDate.getDate() === day
        );
      }
      return true;
    });
  }, [calendarFilter, calendarCustomDate]);

  // Calculate filtered folders for counts and rendering
  const filteredFoldersByDate = useMemo(() => filterFoldersByDate(folders), [folders, filterFoldersByDate]);
  
  // Calculate search results (search always searches all folders, ignoring calendar filter)
  const searchedFolders = useMemo(() => 
    folders.filter(folder =>
      folder.folderName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [folders, searchQuery]
  );
  
  // For counts in UI:
  const foldersCountToShow = useMemo(() => 
    isSearching ? searchedFolders.length : filteredFoldersByDate.length, 
    [isSearching, searchedFolders.length, filteredFoldersByDate.length]
  );

  // Manage animation states and ensure FAB button visibility
  useEffect(() => {
    // Determine which folders to check based on whether we're searching or not
    const foldersToCheck = isSearching ? searchedFolders : filteredFoldersByDate;
    
    const foldersEmpty = foldersToCheck.length === 0;
    
    // Only show animations when there are no folders
    setShouldShowAnimation(foldersEmpty);
    
    // Ensure FAB button is always visible when not in select mode
    // Use requestAnimationFrame to avoid setting values during render
    if (!isSelectMode) {
      requestAnimationFrame(() => {
        fabOpacity.setValue(1);
      });
    }
  }, [filteredFoldersByDate.length, searchedFolders.length, isSearching, isSelectMode]);

  const renderFolderCards = useCallback(() => {
    // Show shimmer skeleton while loading
    if (isLoadingFolders) {
      return Array.from({ length: 3 }).map((_, index) => (
        <DeckSkeletonCard
          key={`folder-skeleton-${index}`}
          style={index === 0 ? styles.firstCard : styles.card}
        />
      ));
    }
    
    const foldersToRender = isSearching ? searchedFolders : filteredFoldersByDate;
    
    // If no folders to render, show empty state
    if (!foldersToRender || foldersToRender.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          {shouldShowAnimation && (
            <LottieView
              key="folders-empty-state"
              source={require('@/assets/animations/EmptyState2.json')}
              autoPlay
              loop
              style={styles.emptyStateAnimation}
            />
          )}
          <Text style={styles.emptyStateText}>
            {strings[language].folders.whereHaveAllTheFoldersGone}
          </Text>
        </View>
      );
    }
    
    const sortedFolders = sortFolders(foldersToRender);
    
    // Safety check to prevent rendering issues
    if (!sortedFolders || sortedFolders.length === 0) {
      return null;
    }
    
    const cards = sortedFolders.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <FolderCard
          key={`folder-${data.folderID}`}
          style={style}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedFolders.has(index)}
          onPress={() => {
            // Only navigate if not in select mode
            if (!isSelectMode) {
              router.push({
                pathname: '/(tabs)/viewDecksInFolder',
                params: {
                  folderTitle: data.folderName,
                  folderId: data.folderID.toString(),
                  sourcePage: 'folders'
                }
              });
            }
          }}
          onSelectPress={() => {
            const newSelectedFolders = new Set(selectedFolders);
            if (selectedFolders.has(index)) {
              newSelectedFolders.delete(index);
            } else {
              newSelectedFolders.add(index);
            }
            setSelectedFolders(newSelectedFolders);
          }}
          circleButtonOpacity={circleButtonOpacity}
          title={data.folderName}
          dateCreated={formatDate(data.dateAdded)}
          deckCount={data.deckCount}
          isFavorited={data.isFavorited === 1}
          onFavoriteToggle={() => handleFolderFavoriteToggle(data.folderID, data.isFavorited === 1)}
        />
      );
    });
    return cards;
  }, [isLoadingFolders, isSearching, searchedFolders, filteredFoldersByDate, shouldShowAnimation, strings, language, sortFolders, isSelectMode, selectedFolders, cardWidthPercentage, circleButtonOpacity, formatDate, handleFolderFavoriteToggle, router]);

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: getTopBarTopHeight()}]}>
        <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color={Colors[theme].normalIconColor} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.headerIconsContainer, { paddingTop: getHeaderIconsTopHeight()}]}>
            <HeaderIconButtons 
              ref={headerIconsRef}
              onAIPress={handleSparklesPress}
              onCalendarPress={handleCalendarPress}
              onSearchPress={handleSearchPress}
              onSearchTextChange={handleSearch}
              onSortChange={handleSortChange}
              initialSortField={sortField}
              initialSortDirection={sortDirection}
              pageType="folders"
              disabled={isAddToFoldersMode || isMoveToFoldersMode}
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={[styles.content, { marginTop: getContentTopHeightNoRoundedToggle()}]}>
            <Animated.View style={[
                styles.actionButtonsRow,
                {
                  opacity: actionRowOpacity,
                  transform: [{
                    translateY: actionRowOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })
                  }]
                }
              ]}>
                {(isAddToFoldersMode || isMoveToFoldersMode) ? (
                  <View style={styles.doneButtonContainer}>
                    <TouchableOpacity onPress={handleDone}>
                      <Text style={styles.doneButton}>{strings[language].folders.done}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ActionButtonsRow
                    iconNames={['trash']}
                    onCancel={handleCancel}
                    onIconPress={handleActionIconPress}
                    iconColors={['#FF3B30']}
                  />
                )}
              </Animated.View>

              <Animated.View 
                style={[
                  styles.shiftableContent,
                  { transform: [{ translateY: shiftAnim }] }
                ]}
              >
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <Title style={{fontSize: language === 'Chinese' ? 20 : 24, 
                      // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular'
                      }}>
                      {isAddToFoldersMode
                        ? strings[language].folders.addToFolders
                        : isMoveToFoldersMode
                          ? strings[language].folders.moveToFolders
                          : `${strings[language].folders.foldersCount} (${foldersCountToShow})`}
                    </Title>
                  </View>
                  <TouchableOpacity 
                    onPress={isSelectMode ? handleSelectAll : handleSelect}
                    style={styles.selectButtonContainer}
                    disabled={isSelectMode ? false : foldersCountToShow === 0}
                  >
                    <Animated.Text style={[
                      isSelectMode ? styles.selectButton : (foldersCountToShow === 0 ? styles.selectButtonDisabled : styles.selectButton),
                      styles.selectButtonAbsolute,
                      { opacity: selectOpacity }
                    ]}>
                      {strings[language].folders.select}
                    </Animated.Text>
                    <Animated.Text style={[
                      styles.selectButton,
                      styles.selectButtonAbsolute,
                      { opacity: selectAllOpacity }
                    ]}>
                      {strings[language].folders.selectAll}
                    </Animated.Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.scrollWrapper}>
                  <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors[theme].brandColor2}
                        colors={[Colors[theme].brandColor2]}
                      />
                    }
                  >
                    {renderFolderCards()}
                  </ScrollView>
                </View>
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View style={[
            styles.fabContainer,
            { opacity: fabOpacity }
          ]}>
            <FloatingActionButton
              style={styles.fab}
              disableOverlay={true}
              onPress={handleFabPress}
              isFoldersPage={true}
              disabled={isSelectMode}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
      <CalendarModal
        visible={isCalendarOpen}
        onDismiss={handleCalendarDismiss}
        title={strings[language].folders.filterFoldersBasedOnDateAdded}
        onDone={(selectedFilter, customDate) => {
          setCalendarFilter(selectedFilter);
          setCalendarCustomDate(customDate || null);
          handleCalendarDismiss();
        }}
            />
    </Animated.View>
  );
}