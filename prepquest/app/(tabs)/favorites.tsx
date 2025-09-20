import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { ThemedView } from '@/components/general/ThemedView';

import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/general/HeaderIconButtons';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { FloatingActionButton } from '@/components/general/FloatingActionButton';
import { Title } from '@/components/general/Title';
import { Card } from '@/components/general/Card';
import { FolderCard } from '@/components/folderComponents/FolderCard';
import { ActionButtonsRow } from '@/components/general/ActionButtonsRow';
import { useState, useRef, useEffect, useContext, useCallback, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { MenuContext } from '@/contexts/MenuContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getFavoritedDecks, getFavoritedFolders, Deck, Folder, deleteMultipleDecks, deleteMultipleFolders, getCompanyIconImageSource, createNewFavoritedFolder, unfavoriteMultipleDecks, unfavoriteMultipleFolders, updateFolderFavoriteStatus, updateDeckFavoriteStatus, checkDatabaseReady } from '@/db/decks';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/db/index';
import { getDeckCardDesign } from '@/constants/cardDesigns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarModal } from '@/components/modals/CalendarModal';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarTopHeight, useHeaderIconsTopHeight, useContentTopHeight, useBottomContentSpacing } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedDataLoader, optimizedScreenTransition } from '@/utils/performanceOptimizations';
import { useBackgroundTaskRefresh } from '@/hooks/useBackgroundTaskRefresh';

type SortField = 'name' | 'dateAdded' | 'lastModified';
type SortDirection = 'asc' | 'desc';

const FAVORITES_SORT_FIELD_KEY = 'favorites_sort_field';
const FAVORITES_SORT_DIRECTION_KEY = 'favorites_sort_direction';

const SHIFT_DISTANCE = 40; // Distance to shift content down
const SCREEN_TRANSITION_DURATION = 200; // Match navbar animation duration

// Helper function to get current userID from AsyncStorage for sort preferences
async function getCurrentUserIDForPreferences(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    return '1'; // Default to '1' on error
  }
}


export default function FavoritesScreen() {
  const [isFavFoldersMode, setIsFavFoldersMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFavDeckCards, setSelectedFavDeckCards] = useState<Set<number>>(new Set());
  const [selectedFavFolderCards, setSelectedFavFolderCards] = useState<Set<number>>(new Set());
  const [favDeckCardsCount, setFavDeckCardsCount] = useState(0);
  const [favFolderCardsCount, setFavFolderCardsCount] = useState(0);
  const [previousMode, setPreviousMode] = useState<'study' | 'interview'>('study');
  const [favoritedDecks, setFavoritedDecks] = useState<(Deck & { progress: number })[]>([]);
  const [favoritedFolders, setFavoritedFolders] = useState<Folder[]>([]);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [filteredFavoritedDecks, setFilteredFavoritedDecks] = useState<(Deck & { progress: number })[]>([]);
  const [filteredFavoritedFolders, setFilteredFavoritedFolders] = useState<Folder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [calendarFilter, setCalendarFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom' | null>('all');
  const [calendarCustomDate, setCalendarCustomDate] = useState<string | null>(null);
  const [shouldShowDeckAnimation, setShouldShowDeckAnimation] = useState(true);
  const [shouldShowFolderAnimation, setShouldShowFolderAnimation] = useState(true);
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setShowSlidingMenu,
    setCurrentMode,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity,
    setHandleDeletion,
    setHandleUnfavorite,
    navbarRef,
    setIsAIPromptOpen,
    setIsAddDeckOpen,
    addDeckOpacity,
    setNoSelectionModalSubtitle,
    setSourcePageForFolders,
    setDeleteModalText,
    setIsUnfavoriteModalOpen,
    unfavoriteModalOpacity,
    setUnfavoriteModalText,
  } = useContext(MenuContext);
  const isFocused = useIsFocused();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const router = useRouter();
  const { mode, selected } = useLocalSearchParams();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [imageSources, setImageSources] = useState<Map<number, { uri: string } | undefined>>(new Map());
  const { language } = useLanguage();
  const { theme } = useTheme();
  const getTopBarTopHeight = useTopBarTopHeight();
  const getHeaderIconsTopHeight = useHeaderIconsTopHeight();
  const getContentTopHeight = useContentTopHeight();
  const getBottomContentSpacing = useBottomContentSpacing();
  const bottomSpacing = getBottomContentSpacing();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(bottomSpacing)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;

  const selectUnselectedDuration = 150; // Reduced from 300ms for better performance on low-end devices

  // Define opacity interpolations
  const studyOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const interviewOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Set up the deletion handler when the component mounts
  useEffect(() => {
    if (isFocused) {
      setHandleDeletion(() => handleCancel);
      setHandleUnfavorite(null);
    }
    return () => {
      if (!isFocused) {
        setHandleDeletion(null);
        setHandleUnfavorite(null);
      }
    };
  }, [isFocused]);

  // Handle screen transitions and set previous mode
  useEffect(() => {
    if (isFocused) {
      // Reset header icons state when screen comes into focus
      headerIconsRef.current?.reset();
      
      if (selected === 'true') {
        // Enter selection mode with animations
        setIsSelectMode(true);
        
        // Reset selections
        setSelectedFavDeckCards(new Set());
        setSelectedFavFolderCards(new Set());
        
        // Set animation values directly without animation
        shiftAnim.setValue(SHIFT_DISTANCE);
        marginAnim.setValue(bottomSpacing + SHIFT_DISTANCE);
        actionRowOpacity.setValue(1);
        selectTextAnim.setValue(1);
        fabOpacity.setValue(0);
        cardWidthPercentage.setValue(85);
        circleButtonOpacity.setValue(1);
      } else {
        // Reset to decks state and unselected state
        setIsSelectMode(false);
        setSelectedFavDeckCards(new Set());
        setSelectedFavFolderCards(new Set());

        // Reset all animations to their default values
        shiftAnim.setValue(0);
        marginAnim.setValue(bottomSpacing);
        actionRowOpacity.setValue(0);
        selectTextAnim.setValue(0);
        fabOpacity.setValue(1);
        cardWidthPercentage.setValue(100);
        circleButtonOpacity.setValue(0);
      }
      
      // Set source page to favorites
      setSourcePageForFolders('favorites');
      
      // Set the previous mode from route params
      if (mode === 'study' || mode === 'interview') {
        setPreviousMode(mode);
      }
      
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: SCREEN_TRANSITION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      screenOpacity.setValue(0);
    }
  }, [isFocused]);

  const handleBackPress = useCallback(() => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // Navigate back to decks page in previous mode
    if (Platform.OS === 'ios') {
      navbarRef?.current?.setDecksTab();
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)',
          params: {
            mode: previousMode
          }
        });
      }, 50);
    } else {
      router.push({
        pathname: '/(tabs)',
        params: {
          mode: previousMode
        }
      });
      setTimeout(() => {
        navbarRef?.current?.setDecksTab();
      }, 50);
    }
  }, [headerIconsRef, navbarRef, router, previousMode]);

  const handleToggle = useCallback((isRightSide: boolean) => {
    // If in select mode, cancel it before switching
    if (isSelectMode) {
      handleCancel();
    }
    setIsFavFoldersMode(isRightSide);
    setCurrentMode(isRightSide ? 'interview' : 'study');
    // Clear the selection state for the mode we're leaving
    if (isRightSide) {
      setSelectedFavDeckCards(new Set());
    } else {
      setSelectedFavFolderCards(new Set());
    }
    // Animate mode toggle
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: selectUnselectedDuration,
      useNativeDriver: true,
    }).start();
  }, [isSelectMode, setIsFavFoldersMode, setCurrentMode, setSelectedFavDeckCards, setSelectedFavFolderCards, fadeAnim, selectUnselectedDuration]);

  const handleFabPress = async () => {
    if (isFavFoldersMode) {
      try {
        console.log("Favorite Folders FAB clicked!");
        
        const result = await createNewFavoritedFolder();
        
        if (result.success && result.newFolder) {
          // Add the new folder to the local state
          const updatedFolders = [...favoritedFolders, result.newFolder];
          setFavoritedFolders(updatedFolders);
          
          // Update filtered folders if not searching
          if (!isSearching) {
            const sortedUpdatedFolders = sortFolders(updatedFolders);
            setFilteredFavoritedFolders(sortedUpdatedFolders);
          }
          
          console.log('Successfully created new favorited folder:', result.newFolder.folderName);
        } else {
          console.error('Failed to create new favorited folder');
        }
      } catch (error) {
        console.error('Error creating new favorited folder:', error);
      }
    } else {
      setIsMenuOpen(true);
      setIsAddDeckOpen(true);
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(addDeckOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

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
      // For high-end devices: Full parallel animations
      Animated.parallel([
        Animated.timing(shiftAnim, {
          toValue: SHIFT_DISTANCE,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(marginAnim, {
          toValue: bottomSpacing + SHIFT_DISTANCE,
          duration: duration,
          useNativeDriver: false,
        }),
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
        Animated.timing(circleButtonOpacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [setIsSelectMode, shiftAnim, marginAnim, actionRowOpacity, selectTextAnim, fabOpacity, cardWidthPercentage, circleButtonOpacity]);

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
      setSelectedFavDeckCards(new Set());
      setSelectedFavFolderCards(new Set());
      
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
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(actionRowOpacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(selectTextAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(fabOpacity, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(cardWidthPercentage, {
        toValue: 100,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(circleButtonOpacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      })
    ]).start(() => {
      requestAnimationFrame(() => {
        setIsSelectMode(false);
        setSelectedFavDeckCards(new Set());
        setSelectedFavFolderCards(new Set());
      });
    });
  }, [shiftAnim, marginAnim, actionRowOpacity, selectTextAnim, fabOpacity, cardWidthPercentage, circleButtonOpacity, setIsSelectMode, setSelectedFavDeckCards, setSelectedFavFolderCards]);

  const handleSelectAll = useCallback(() => {
    if (isFavFoldersMode) {
      // Use the same arrays that are being rendered in the UI
      const foldersToUse = isSearching ? searchedFavoritedFolders : filteredFavoritedFoldersByDate;
      const allFolderIndices = new Set(Array.from({ length: foldersToUse.length }, (_, i) => i));
      setSelectedFavFolderCards(allFolderIndices);
    } else {
      // Use the same arrays that are being rendered in the UI
      const decksToUse = isSearching ? searchedFavoritedDecks : filteredFavoritedDecksByDate;
      const allDeckIndices = new Set(Array.from({ length: decksToUse.length }, (_, i) => i));
      setSelectedFavDeckCards(allDeckIndices);
    }
  }, [isFavFoldersMode, isSearching, setSelectedFavFolderCards, setSelectedFavDeckCards]);

  const handleActionIconPress = (index: number) => {
    const hasSelection = isFavFoldersMode 
      ? selectedFavFolderCards.size > 0 
      : selectedFavDeckCards.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle(
        isFavFoldersMode
          ? strings[language].favorites.pleaseChooseAtLeastOneFolder
          : strings[language].favorites.pleaseChooseAtLeastOneDeck
      );
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    // In folders mode, we only have trash button
    // In decks mode, we have folder and trash buttons
    if (isFavFoldersMode) {
      // In folders mode, index 0 is trash
      if (index === 0) {
        setIsMenuOpen(true);
        setIsTrashModalOpenInDecksPage(true);
        setDeleteModalText(strings[language].favorites.areYouSureYouWantToDeleteTheseFolders);
        setHandleDeletion(() => handleDeleteSelectedFavoritedFolders);
        Animated.parallel([
          Animated.timing(menuOverlayOpacity, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(trashModalOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start();
      }
    } else {
      // In decks mode
      switch (index) {
        case 0: // Folder
          // Reset header icons state
          headerIconsRef.current?.reset();
          
          // Set source page to favorites
          setSourcePageForFolders('favorites');
          
          // Get the selected deck IDs
          const decksToUse = isSearching ? filteredFavoritedDecks : favoritedDecks;
          const selectedDeckIds = Array.from(selectedFavDeckCards).map(index => decksToUse[index].deckID);
          
          // Navigate to folders in AddToFolders mode
          if (Platform.OS === 'ios') {
            navbarRef?.current?.resetAnimation();
            setTimeout(() => {
              router.push({
                pathname: '/(tabs)/folders',
                params: { 
                  isAddToFolders: 'true',
                  previousMode: isFavFoldersMode ? 'interview' : 'study',
                  selectedState: 'true',
                  sourcePage: 'favorites',
                  selectedDeckIds: JSON.stringify(selectedDeckIds)
                }
              });
            }, 50);
          } else {
            router.push({
              pathname: '/(tabs)/folders',
              params: { 
                isAddToFolders: 'true',
                previousMode: isFavFoldersMode ? 'interview' : 'study',
                selectedState: 'true',
                sourcePage: 'favorites',
                selectedDeckIds: JSON.stringify(selectedDeckIds)
              }
            });
            setTimeout(() => {
              navbarRef?.current?.resetAnimation();
            }, 50);
          }
          break;
        case 1: // Trash
          setIsMenuOpen(true);
          setIsTrashModalOpenInDecksPage(true);
          setDeleteModalText(strings[language].favorites.areYouSureYouWantToDeleteTheseDecks);
          setHandleDeletion(() => handleDeleteSelectedFavoritedDecks);
          Animated.parallel([
            Animated.timing(menuOverlayOpacity, {
              toValue: 0.4,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(trashModalOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            })
          ]).start();
          break;
      }
    }
  };

  const handleUnfavoritePress = () => {
    const hasSelection = isFavFoldersMode 
      ? selectedFavFolderCards.size > 0 
      : selectedFavDeckCards.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle(
        isFavFoldersMode
          ? strings[language].favorites.pleaseChooseAtLeastOneFolder
          : strings[language].favorites.pleaseChooseAtLeastOneDeck
      );
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    // Set the appropriate unfavorite handler based on current mode
    if (isFavFoldersMode) {
      setHandleUnfavorite(() => handleUnfavoriteSelectedFolders);
    } else {
      setHandleUnfavorite(() => handleUnfavoriteSelectedDecks);
    }

    // Show unfavorite modal with appropriate text
    setIsMenuOpen(true);
    setIsUnfavoriteModalOpen(true);
    setUnfavoriteModalText(
      isFavFoldersMode
        ? strings[language].favorites.areYouSureYouWantToUnfavoriteTheseFolders
        : strings[language].favorites.areYouSureYouWantToUnfavoriteTheseDecks
    );
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(unfavoriteModalOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleUnfavoriteSelectedDecks = async () => {
    try {
      // Get the selected deck IDs using the same arrays as handleSelectAll
      const decksToUse = isSearching ? searchedFavoritedDecks : filteredFavoritedDecksByDate;
      const selectedDeckIds = Array.from(selectedFavDeckCards).map(index => decksToUse[index].deckID);

      if (selectedDeckIds.length === 0) {
        console.log('No decks selected for unfavoriting');
        return;
      }

      // Update database to unfavorite the selected decks
      const success = await unfavoriteMultipleDecks(selectedDeckIds);

      if (success) {
        // Remove from local state
        const remainingDecks = favoritedDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
        setFavoritedDecks(remainingDecks);
        
        // Update filtered decks if searching
        if (isSearching) {
          const remainingFilteredDecks = filteredFavoritedDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
          setFilteredFavoritedDecks(remainingFilteredDecks);
        }
        
        // Clear selections
        setSelectedFavDeckCards(new Set());

        // Exit selection mode
        setTimeout(() => {
          handleCancel();
        }, 0);
      }
    } catch (error) {
      console.error('Error unfavoriting decks:', error);
    }
  };

  const handleUnfavoriteSelectedFolders = async () => {
    try {
      // Get the selected folder IDs using the same arrays as handleSelectAll
      const foldersToUse = isSearching ? searchedFavoritedFolders : filteredFavoritedFoldersByDate;
      const selectedFolderIds = Array.from(selectedFavFolderCards).map(index => foldersToUse[index].folderID);

      if (selectedFolderIds.length === 0) {
        console.log('No folders selected for unfavoriting');
        return;
      }

      // Update database to unfavorite the selected folders
      const success = await unfavoriteMultipleFolders(selectedFolderIds);

      if (success) {
        // Remove from local state
        const remainingFolders = favoritedFolders.filter(folder => !selectedFolderIds.includes(folder.folderID));
        setFavoritedFolders(remainingFolders);
        
        // Update filtered folders if searching
        if (isSearching) {
          const remainingFilteredFolders = filteredFavoritedFolders.filter(folder => !selectedFolderIds.includes(folder.folderID));
          setFilteredFavoritedFolders(remainingFilteredFolders);
        }
        
        // Clear selections
        setSelectedFavFolderCards(new Set());

        // Exit selection mode
        setTimeout(() => {
          handleCancel();
        }, 0);
      }
    } catch (error) {
      console.error('Error unfavoriting folders:', error);
    }
  };

  // Helper function to format date
  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if parsing fails
    }
  }, []);

  // Helper function to convert null to undefined
  const nullToUndefined = useCallback((value: string | null): string | undefined => {
    return value === null ? undefined : value;
  }, []);

  // Sort function for decks
  const sortDecks = useCallback((decks: (Deck & { progress: number })[]) => {
    return [...decks].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.deckName.toLowerCase();
          bValue = b.deckName.toLowerCase();
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
  const saveSortPreferences = async (field: SortField, direction: SortDirection) => {
    try {
      const userID = await getCurrentUserIDForPreferences();
      const userSpecificFieldKey = `${FAVORITES_SORT_FIELD_KEY}_${userID}`;
      const userSpecificDirectionKey = `${FAVORITES_SORT_DIRECTION_KEY}_${userID}`;
      
      await AsyncStorage.multiSet([
        [userSpecificFieldKey, field],
        [userSpecificDirectionKey, direction]
      ]);
    } catch (error) {
      console.error('Error saving favorites sort preferences:', error);
    }
  };

  // Load sort preferences from AsyncStorage with userID
  const loadSortPreferences = async () => {
    try {
      const userID = await getCurrentUserIDForPreferences();
      const userSpecificFieldKey = `${FAVORITES_SORT_FIELD_KEY}_${userID}`;
      const userSpecificDirectionKey = `${FAVORITES_SORT_DIRECTION_KEY}_${userID}`;
      
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
      console.error('Error loading favorites sort preferences:', error);
    }
  };

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async (deckId: number, currentFavorited: boolean) => {
    try {
      const success = await updateDeckFavoriteStatus(deckId, !currentFavorited);
      
      if (success) {
        const newFavoritedValue = currentFavorited ? 0 : 1;
        
        // If unfavoriting, remove from local state
        if (newFavoritedValue === 0) {
          // Remove from favorited decks
          const remainingDecks = favoritedDecks.filter(deck => deck.deckID !== deckId);
          setFavoritedDecks(remainingDecks);
          
          // Remove from filtered decks if searching
          if (isSearching) {
            const remainingFilteredDecks = filteredFavoritedDecks.filter(deck => deck.deckID !== deckId);
            setFilteredFavoritedDecks(remainingFilteredDecks);
          }
          
          // Clear selection if this deck was selected
          setSelectedFavDeckCards(prev => {
            const newSet = new Set(prev);
            // Find the index of the deck being unfavorited
            const decksToUse = isSearching ? filteredFavoritedDecks : favoritedDecks;
            const deckIndex = decksToUse.findIndex(deck => deck.deckID === deckId);
            if (deckIndex !== -1) {
              newSet.delete(deckIndex);
            }
            return newSet;
          });
        } else {
          // If favoriting, update the isFavorited value in local state
          setFavoritedDecks(prev => 
            prev.map(deck => 
              deck.deckID === deckId 
                ? { ...deck, isFavorited: newFavoritedValue }
                : deck
            )
          );
          if (isSearching) {
            setFilteredFavoritedDecks(prev => 
              prev.map(deck => 
                deck.deckID === deckId 
                  ? { ...deck, isFavorited: newFavoritedValue }
                  : deck
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  // Function to handle favorite/unfavorite folder
  const handleFolderFavoriteToggle = async (folderId: number, currentFavorited: boolean) => {
    try {
      const success = await updateFolderFavoriteStatus(folderId, !currentFavorited);
      
      if (success) {
        const newFavoritedValue = currentFavorited ? 0 : 1;
        
        // If unfavoriting, remove from local state
        if (newFavoritedValue === 0) {
          // Remove from favorited folders
          const remainingFolders = favoritedFolders.filter(folder => folder.folderID !== folderId);
          setFavoritedFolders(remainingFolders);
          
          // Remove from filtered folders if searching
          if (isSearching) {
            const remainingFilteredFolders = filteredFavoritedFolders.filter(folder => folder.folderID !== folderId);
            setFilteredFavoritedFolders(remainingFilteredFolders);
          }
          
          // Clear selection if this folder was selected
          setSelectedFavFolderCards(prev => {
            const newSet = new Set(prev);
            // Find the index of the folder being unfavorited
            const foldersToUse = isSearching ? filteredFavoritedFolders : favoritedFolders;
            const folderIndex = foldersToUse.findIndex(folder => folder.folderID === folderId);
            if (folderIndex !== -1) {
              newSet.delete(folderIndex);
            }
            return newSet;
          });
        } else {
          // If favoriting, update the isFavorited value in local state
          setFavoritedFolders(prev => 
            prev.map(folder => 
              folder.folderID === folderId 
                ? { ...folder, isFavorited: newFavoritedValue }
                : folder
            )
          );
          if (isSearching) {
            setFilteredFavoritedFolders(prev => 
              prev.map(folder => 
                folder.folderID === folderId 
                  ? { ...folder, isFavorited: newFavoritedValue }
                  : folder
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating folder favorite status:', error);
    }
  };

  // Check if database is ready
  useEffect(() => {
    const checkDatabaseReadyStatus = async () => {
      try {
        console.log('Checking if database is ready...');
        const isReady = await checkDatabaseReady();
        if (isReady) {
          setIsDatabaseReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkDatabaseReadyStatus, 500);
        }
      } catch (error) {
        console.log('Database not ready yet, waiting...', error);
        // Retry after a short delay
        setTimeout(checkDatabaseReadyStatus, 500);
      }
    };
    
    checkDatabaseReadyStatus();
  }, []);

  // Load favorited data from database
  useEffect(() => {
    const loadFavoritedData = async () => {
      if (!isDatabaseReady) {
        console.log('Database not ready, skipping data load');
        return;
      }
      
      console.log('Loading favorited data from database...');
      try {
        // Use optimized screen data loader with caching
        const screenData = await optimizedDataLoader.loadScreenData('favorites', {
          decksData: getFavoritedDecks,
          foldersData: getFavoritedFolders,
        });

        console.log('Favorited decks loaded:', screenData.decksData.length);
        console.log('Favorited folders loaded:', screenData.foldersData.length);
        setFavoritedDecks(screenData.decksData);
        setFavoritedFolders(screenData.foldersData);
        setFilteredFavoritedDecks(screenData.decksData);
        setFilteredFavoritedFolders(screenData.foldersData);
        setFavDeckCardsCount(screenData.decksData.length);
        setFavFolderCardsCount(screenData.foldersData.length);

        // Load image sources with optimized batching
        const imageLoaders = screenData.decksData.map((deck: any) => 
          () => getCompanyIconImageSource(deck.interviewCompanyIcon)
        );
        
        const imageResults = await optimizedDataLoader.loadImages(imageLoaders);
        
        // Map results back to deck IDs
        const sources = new Map<number, { uri: string } | undefined>();
        screenData.decksData.forEach((deck: any, index: number) => {
          sources.set(deck.deckID, imageResults[index]);
        });
        setImageSources(sources);
      } catch (error) {
        console.error('Error loading favorited data:', error);
      }
    };

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
        loadFavoritedData
      );
    }
  }, [isFocused, isDatabaseReady]);

  // Background task refresh hook
  const { shouldRefresh, backgroundTaskProgress } = useBackgroundTaskRefresh({
    onTaskComplete: () => {
      console.log('Background task completed - refreshing favorited data');
      // Refresh favorited data when background task completes
      if (isDatabaseReady) {
        const loadFavoritedData = async () => {
          try {
            const [decksData, foldersData] = await Promise.all([
              getFavoritedDecks(),
              getFavoritedFolders()
            ]);
            setFavoritedDecks(decksData);
            setFavoritedFolders(foldersData);
            setFavDeckCardsCount(decksData.length);
            setFavFolderCardsCount(foldersData.length);
          } catch (error) {
            console.error('Error refreshing favorited data:', error);
          }
        };
        loadFavoritedData();
      }
    }
  });

  // Fallback refresh mechanism - watch for background task completion
  useEffect(() => {
    if (backgroundTaskProgress?.completed === true && isDatabaseReady) {
      console.log('Fallback: Background task completed - refreshing favorited data');
      const loadFavoritedData = async () => {
        try {
          const [decksData, foldersData] = await Promise.all([
            getFavoritedDecks(),
            getFavoritedFolders()
          ]);
          setFavoritedDecks(decksData);
          setFavoritedFolders(foldersData);
          setFavDeckCardsCount(decksData.length);
          setFavFolderCardsCount(foldersData.length);
        } catch (error) {
          console.error('Error refreshing favorited data (fallback):', error);
        }
      };
      loadFavoritedData();
    }
  }, [backgroundTaskProgress?.completed, isDatabaseReady]);

  // Load sort preferences when component mounts
  useEffect(() => {
    loadSortPreferences();
  }, []);

  // Apply sort preferences when favorited data is loaded and preferences are available
  useEffect(() => {
    if (favoritedDecks.length > 0 || favoritedFolders.length > 0) {
      const sortedFavoritedDecks = sortDecks(favoritedDecks);
      const sortedFavoritedFolders = sortFolders(favoritedFolders);
      setFilteredFavoritedDecks(sortedFavoritedDecks);
      setFilteredFavoritedFolders(sortedFavoritedFolders);
    } else {
      // When all items are deleted, clear the filtered arrays
      setFilteredFavoritedDecks([]);
      setFilteredFavoritedFolders([]);
    }
  }, [favoritedDecks, favoritedFolders, sortDecks, sortFolders]);

  // Filter by dateAdded according to calendarFilter
  const filterByDate = useCallback(<T extends { dateAdded: string }>(items: T[]): T[] => {
    if (calendarFilter === 'all' || !calendarFilter) return items;
    const now = new Date();
    return items.filter(item => {
      const itemDate = new Date(item.dateAdded);
      if (calendarFilter === 'today') {
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getDate() === now.getDate()
        );
      }
      if (calendarFilter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      }
      if (calendarFilter === 'month') {
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );
      }
      if (calendarFilter === 'custom' && calendarCustomDate) {
        const [year, month, day] = calendarCustomDate.split('-').map(Number);
        return (
          itemDate.getFullYear() === year &&
          itemDate.getMonth() + 1 === month &&
          itemDate.getDate() === day
        );
      }
      return true;
    });
  }, [calendarFilter, calendarCustomDate]);

  // Filtered arrays for calendar filter
  const filteredFavoritedDecksByDate = useMemo(() => filterByDate(favoritedDecks), [filterByDate, favoritedDecks]);
  const filteredFavoritedFoldersByDate = useMemo(() => filterByDate(favoritedFolders), [filterByDate, favoritedFolders]);

  // Search results (search always searches all, not just filtered)
  const searchedFavoritedDecks = useMemo(() => 
    favoritedDecks.filter(deck =>
      deck.deckName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [favoritedDecks, searchQuery]
  );
  const searchedFavoritedFolders = useMemo(() => 
    favoritedFolders.filter(folder =>
      folder.folderName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [favoritedFolders, searchQuery]
  );

  // For counts in UI:
  const favDeckCount = useMemo(() => 
    isSearching ? searchedFavoritedDecks.length : filteredFavoritedDecksByDate.length, 
    [isSearching, searchedFavoritedDecks.length, filteredFavoritedDecksByDate.length]
  );
  const favFolderCount = useMemo(() => 
    isSearching ? searchedFavoritedFolders.length : filteredFavoritedFoldersByDate.length, 
    [isSearching, searchedFavoritedFolders.length, filteredFavoritedFoldersByDate.length]
  );

  // Manage animation states and ensure FAB button visibility
  useEffect(() => {
    // Determine which items to check based on whether we're searching or not
    const decksToCheck = isSearching ? searchedFavoritedDecks : filteredFavoritedDecksByDate;
    const foldersToCheck = isSearching ? searchedFavoritedFolders : filteredFavoritedFoldersByDate;
    
    const decksEmpty = decksToCheck.length === 0;
    const foldersEmpty = foldersToCheck.length === 0;
    
    // Only show animations when the current mode has no items
    setShouldShowDeckAnimation(!isFavFoldersMode && decksEmpty);
    setShouldShowFolderAnimation(isFavFoldersMode && foldersEmpty);
    
    // Ensure FAB button is always visible when not in select mode
    // Use requestAnimationFrame to avoid setting values during render
    if (!isSelectMode) {
      requestAnimationFrame(() => {
        fabOpacity.setValue(1);
      });
    }
  }, [isFavFoldersMode, filteredFavoritedDecksByDate.length, filteredFavoritedFoldersByDate.length, searchedFavoritedDecks.length, searchedFavoritedFolders.length, isSearching, isSelectMode]);

  // Update card counts based on search state
  useEffect(() => {
    if (isSearching) {
      setFavDeckCardsCount(filteredFavoritedDecks.length);
      setFavFolderCardsCount(filteredFavoritedFolders.length);
    } else {
      setFavDeckCardsCount(favoritedDecks.length);
      setFavFolderCardsCount(favoritedFolders.length);
    }
  }, [favoritedDecks, favoritedFolders, filteredFavoritedDecks, filteredFavoritedFolders, isSearching]);

  // Cleanup effect to reset selections when search state changes
  useEffect(() => {
    // Reset selections when search state changes to prevent index mismatches
    if (isSelectMode) {
      setSelectedFavDeckCards(new Set());
      setSelectedFavFolderCards(new Set());
    }
  }, [isSearching, isSelectMode]);

  const handleSearchPress = useCallback(() => {
    // This will be called when the search button is pressed
    // The actual search logic will be handled by the HeaderIconButtons component
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    
    if (query.length === 0) {
      // If search is empty, show all favorited items sorted according to current preferences
      const sortedFavoritedDecks = sortDecks(favoritedDecks);
      const sortedFavoritedFolders = sortFolders(favoritedFolders);
      setFilteredFavoritedDecks(sortedFavoritedDecks);
      setFilteredFavoritedFolders(sortedFavoritedFolders);
    } else {
      // Filter items by name (case-insensitive) and then sort them
      const lowerQuery = query.toLowerCase();
      
      const filteredDecks = favoritedDecks.filter(deck => 
        deck.deckName.toLowerCase().includes(lowerQuery)
      );
      
      const filteredFolders = favoritedFolders.filter(folder => 
        folder.folderName.toLowerCase().includes(lowerQuery)
      );
      
      // Sort the filtered results according to current preferences
      const sortedFilteredDecks = sortDecks(filteredDecks);
      const sortedFilteredFolders = sortFolders(filteredFolders);
      
      setFilteredFavoritedDecks(sortedFilteredDecks);
      setFilteredFavoritedFolders(sortedFilteredFolders);
    }
  };

  const handleClearSearch = () => {
    // Clear selections first to prevent render issues
    setSelectedFavDeckCards(new Set());
    setSelectedFavFolderCards(new Set());
    
    // Reset search state
    setSearchQuery('');
    setIsSearching(false);
    
    // Reset filtered data with sorting applied
    const sortedFavoritedDecks = sortDecks(favoritedDecks);
    const sortedFavoritedFolders = sortFolders(favoritedFolders);
    setFilteredFavoritedDecks(sortedFavoritedDecks);
    setFilteredFavoritedFolders(sortedFavoritedFolders);
  };

  const handleDeleteSelectedFavoritedDecks = async () => {
    try {
      // Get the selected deck IDs using the same arrays as handleSelectAll
      const decksToUse = isSearching ? searchedFavoritedDecks : filteredFavoritedDecksByDate;
      const selectedDeckIds = Array.from(selectedFavDeckCards).map(index => decksToUse[index].deckID);

      if (selectedDeckIds.length === 0) {
        console.log('No decks selected for deletion');
        return;
      }

      // Delete the decks from database
      const success = await deleteMultipleDecks(selectedDeckIds);
      
      if (success) {
        // Batch state updates to prevent rapid re-renders
        const updateState = () => {
          // Clear selections first to prevent render issues
          setSelectedFavDeckCards(new Set());
          
          // Update local state by removing the deleted decks
          const remainingDecks = favoritedDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
          setFavoritedDecks(remainingDecks);
          
          // Update filtered decks if searching
          if (isSearching) {
            const remainingFilteredDecks = filteredFavoritedDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
            setFilteredFavoritedDecks(remainingFilteredDecks);
          }
        };

        // Use requestAnimationFrame to batch state updates
        requestAnimationFrame(() => {
          updateState();
          // Exit selection mode after state updates
          setTimeout(() => {
            handleCancel();
          }, 0);
        });
        
        console.log(`Successfully deleted ${selectedDeckIds.length} favorited deck(s)`);
      } else {
        console.error('Failed to delete favorited decks');
      }
    } catch (error) {
      console.error('Error deleting favorited decks:', error);
    }
  };

  const handleDeleteSelectedFavoritedFolders = async () => {
    try {
      // Get the selected folder IDs using the same arrays as handleSelectAll
      const foldersToUse = isSearching ? searchedFavoritedFolders : filteredFavoritedFoldersByDate;
      const selectedFolderIds = Array.from(selectedFavFolderCards).map(index => foldersToUse[index].folderID);

      if (selectedFolderIds.length === 0) {
        console.log('No folders selected for deletion');
        return;
      }

      // Delete the folders from database
      const success = await deleteMultipleFolders(selectedFolderIds);
      
      if (success) {
        // Batch state updates to prevent rapid re-renders
        const updateState = () => {
          // Clear selections first to prevent render issues
          setSelectedFavFolderCards(new Set());
          
          // Update local state by removing the deleted folders
          const remainingFolders = favoritedFolders.filter(folder => !selectedFolderIds.includes(folder.folderID));
          setFavoritedFolders(remainingFolders);
          
          // Update filtered folders if searching
          if (isSearching) {
            const remainingFilteredFolders = filteredFavoritedFolders.filter(folder => !selectedFolderIds.includes(folder.folderID));
            setFilteredFavoritedFolders(remainingFilteredFolders);
          }
        };

        // Use requestAnimationFrame to batch state updates
        requestAnimationFrame(() => {
          updateState();
          // Exit selection mode after state updates
          setTimeout(() => {
            handleCancel();
          }, 0);
        });
        
        console.log(`Successfully deleted ${selectedFolderIds.length} favorited folder(s)`);
      } else {
        console.error('Failed to delete favorited folders');
      }
    } catch (error) {
      console.error('Error deleting favorited folders:', error);
    }
  };

  // Update render functions to use filtered arrays
  const renderFavDeckCards = useCallback(() => {
    let decksToRender;
    if (isSearching) {
      decksToRender = searchedFavoritedDecks;
    } else {
      decksToRender = filteredFavoritedDecksByDate;
    }
    
    // If no decks to render, show empty state
    if (!decksToRender || decksToRender.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          {shouldShowDeckAnimation && (
            <LottieView
              key="fav-deck-empty-state"
              source={require('@/assets/animations/EmptyState2.json')}
              autoPlay
              loop
              style={styles.emptyStateAnimation}
            />
          )}
          <Text style={styles.emptyStateText}>
            {strings[language].favorites.whoopsWhereDidAllYourFavoriteDecksGo}
          </Text>
        </View>
      );
    }
    
    const sortedDecks = sortDecks(decksToRender);
    return sortedDecks.map((data, index) => {
      const cardDesign = getDeckCardDesign(data.cardDesignIndex, data.isAIDeck === 1, data.AICardDesignIndex);
      const style = index === 0 ? styles.firstCard : styles.card;
      return (
        <Card
          key={`favDeck-${data.deckID}`}
          style={style}
          backgroundImage={cardDesign.background}
          pressedBackgroundImage={cardDesign.pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedFavDeckCards.has(index)}
          onSelectPress={() => {
            setSelectedFavDeckCards(prev => {
              const newSet = new Set(prev);
              if (prev.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              return newSet;
            });
          }}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.progress}
          showProgress={!isSelectMode}
          image={imageSources.get(data.deckID)}
          cardType={data.deckType === 'interview' && data.interviewType ? data.interviewType : data.deckType}
          title={data.deckName}
          date={formatDate(data.dateAdded)}
          flashcardCount={data.flashcardCount}
          deckDetailsBackgroundIndex={data.cardDesignIndex}
          sourcePage="favorites"
          company={data.deckType === 'interview' && data.interviewCompany ? data.interviewCompany : undefined}
          isFavorited={data.isFavorited === 1}
          isStudy={data.deckType === 'study'}
          onFavoriteToggle={() => handleFavoriteToggle(data.deckID, data.isFavorited === 1)}
          deckID={data.deckID}
        />
      );
    });
  }, [isSearching, searchedFavoritedDecks, filteredFavoritedDecksByDate, shouldShowDeckAnimation, sortDecks, isSelectMode, selectedFavDeckCards, cardWidthPercentage, circleButtonOpacity, imageSources, formatDate, handleFavoriteToggle, language]);

  const renderFavFolderCards = useCallback(() => {
    let foldersToRender;
    if (isSearching) {
      foldersToRender = searchedFavoritedFolders;
    } else {
      foldersToRender = filteredFavoritedFoldersByDate;
    }
    
    // If no folders to render, show empty state
    if (!foldersToRender || foldersToRender.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          {shouldShowFolderAnimation && (
            <LottieView
              key="fav-folder-empty-state"
              source={require('@/assets/animations/EmptyState2.json')}
              autoPlay
              loop
              style={styles.emptyStateAnimation}
            />
          )}
          <Text style={styles.emptyStateText}>
            {strings[language].favorites.whoopsWhereDidAllYourFavoriteFoldersGo}
          </Text>
        </View>
      );
    }
    
    const sortedFolders = sortFolders(foldersToRender);
    return sortedFolders.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.favFolderCard;
      return (
        <FolderCard
          key={`favFolder-${data.folderID}`}
          style={style}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedFavFolderCards.has(index)}
          onSelectPress={() => {
            setSelectedFavFolderCards(prev => {
              const newSet = new Set(prev);
              if (prev.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              return newSet;
            });
          }}
          circleButtonOpacity={circleButtonOpacity}
          title={data.folderName}
          dateCreated={formatDate(data.dateAdded)}
          deckCount={data.deckCount}
          sourcePage="favorites"
          folderId={data.folderID.toString()}
          isFavorited={data.isFavorited === 1}
          onFavoriteToggle={() => handleFolderFavoriteToggle(data.folderID, data.isFavorited === 1)}
        />
      );
    });
  }, [isSearching, searchedFavoritedFolders, filteredFavoritedFoldersByDate, shouldShowFolderAnimation, sortFolders, isSelectMode, selectedFavFolderCards, cardWidthPercentage, circleButtonOpacity, formatDate, handleFolderFavoriteToggle, language]);

  const handleCalendarPress = useCallback(() => {
    setIsCalendarOpen(true);
  }, []);

  const handleCalendarDismiss = useCallback(() => {
    setIsCalendarOpen(false);
  }, []);

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
      paddingTop: 8,
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
    titleAbsolute: {
      position: 'absolute',
      left: 0,
      top: 0,
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
    firstCard: {
      marginTop: 5,
    },
    card: {
      marginTop: '6%',
    },
    favFolderCard: {
      marginTop: '8%',
    },
    shiftableContent: {
      flex: 1,
      marginTop: 16,
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
    actionButtonsRow: {
      position: 'absolute',
      top: 62,
      right: 0,
      left: 0,
      zIndex: 1,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      marginTop: 20,
    },
    selectButtonDisabled: {
      fontSize: 20,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].unselectedText,
    },
  });

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
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
              pageType="favorites"
              onAIPress={() => {
                setIsMenuOpen(true);
                setIsAIPromptOpen(true);
                Animated.timing(menuOverlayOpacity, {
                  toValue: 0.4,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
              }}
              onCalendarPress={handleCalendarPress}
              onSearchPress={handleSearchPress}
              onSearchTextChange={handleSearch}
              onSortChange={handleSortChange}
              initialSortField={sortField}
              initialSortDirection={sortDirection}
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={[styles.content, { marginTop: getContentTopHeight()}]}>
            <RoundedContainer 
                leftLabel={`${strings[language].favorites.favDecks} (${favDeckCount})`}
                rightLabel={`${strings[language].favorites.favFolders} (${favFolderCount})`}
                onToggle={handleToggle}
              />

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
                <ActionButtonsRow
                  iconNames={isFavFoldersMode ? ['trash'] : ['folder', 'trash']}
                  onCancel={handleCancel}
                  onIconPress={handleActionIconPress}
                  iconColors={isFavFoldersMode ? [Colors[theme].alertColor] : [Colors[theme].normalIconColor, Colors[theme].alertColor]}
                  showUnfavoriteButton={true}
                  onUnfavoritePress={handleUnfavoritePress}
                />
              </Animated.View>

              <Animated.View 
                style={[
                  styles.shiftableContent,
                  { transform: [{ translateY: shiftAnim }] }
                ]}
              >
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <Title style={[styles.titleAbsolute, {fontSize: language === 'Chinese' ? 20 : 24, 
                      // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular'
                      }]} animatedOpacity={studyOpacity}>
                      {`${strings[language].favorites.favoriteDecks} (${favDeckCount})`}
                    </Title>
                    <Title style={[styles.titleAbsolute, {fontSize: language === 'Chinese' ? 20 : 24, 
                      // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular'
                      }]} animatedOpacity={interviewOpacity}>
                      {`${strings[language].favorites.favoriteFolders} (${favFolderCount})`}
                    </Title>
                  </View>
                  <TouchableOpacity 
                    onPress={isSelectMode ? handleSelectAll : handleSelect}
                    style={styles.selectButtonContainer}
                    disabled={isSelectMode ? false : (isFavFoldersMode ? favFolderCount === 0 : favDeckCount === 0)}
                  >
                    <Animated.Text style={[
                      isSelectMode ? styles.selectButton : (isFavFoldersMode ? (favFolderCount === 0 ? styles.selectButtonDisabled : styles.selectButton) : (favDeckCount === 0 ? styles.selectButtonDisabled : styles.selectButton)),
                      styles.selectButtonAbsolute,
                      { opacity: selectOpacity }
                    ]}>
                      {strings[language].favorites.select}
                    </Animated.Text>
                    <Animated.Text style={[
                      styles.selectButton,
                      styles.selectButtonAbsolute,
                      { opacity: selectAllOpacity }
                    ]}>
                      {strings[language].favorites.selectAll}
                    </Animated.Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.scrollWrapper}>
                  {/* Favorite Decks ScrollView */}
                  <Animated.View style={[
                    styles.scrollViewContainer,
                    { opacity: studyOpacity, display: isFavFoldersMode ? 'none' : 'flex' }
                  ]}>
                    <ScrollView 
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {renderFavDeckCards()}
                    </ScrollView>
                  </Animated.View>

                  {/* Favorite Folders ScrollView */}
                  <Animated.View style={[
                    styles.scrollViewContainer,
                    { opacity: interviewOpacity, display: isFavFoldersMode ? 'flex' : 'none' }
                  ]}>
                    <ScrollView 
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {renderFavFolderCards()}
                    </ScrollView>
                  </Animated.View>
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
              onPress={handleFabPress}
              disableOverlay={isFavFoldersMode}
              isFavoritesPageFavFolders={isFavFoldersMode}
              disabled={isSelectMode}
            />
          </Animated.View>
        </ThemedView>
      </SafeAreaView>
      <CalendarModal
        visible={isCalendarOpen}
        onDismiss={handleCalendarDismiss}
        title={strings[language].favorites.filterFavoritesBasedOnDateAdded}
        onDone={(selectedFilter, customDate) => {
          setCalendarFilter(selectedFilter);
          setCalendarCustomDate(customDate || null);
          handleCalendarDismiss();
        }}
      />
    </Animated.View>
  );
}

