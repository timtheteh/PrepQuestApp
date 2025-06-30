import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons, HeaderIconButtonsRef, CALENDAR_TITLES } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';
import { FolderCard } from '@/components/FolderCard';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { useState, useRef, useEffect, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getFavoritedDecks, getFavoritedFolders, Deck, Folder, deleteMultipleDecks, deleteMultipleFolders } from '@/db/decks';
import { db } from '@/db/index';
import { cardDesigns } from '@/constants/cardDesigns';

const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
const BOTTOM_SPACING = 20; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down
const SCREEN_TRANSITION_DURATION = 200; // Match navbar animation duration

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
    setIsCalendarOpen,
    setCalendarTitle,
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(BOTTOM_SPACING)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const router = useRouter();
  const { mode, selected } = useLocalSearchParams();

  const selectUnselectedDuration = 300;

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
        marginAnim.setValue(BOTTOM_SPACING + SHIFT_DISTANCE);
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
        marginAnim.setValue(BOTTOM_SPACING);
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

  const handleBackPress = () => {
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
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsFavFoldersMode(isRightSide);
    setCurrentMode(isRightSide ? 'interview' : 'study');
    
    // Clear the selection state for the mode we're leaving
    if (isRightSide) {
      setSelectedFavDeckCards(new Set());
    } else {
      setSelectedFavFolderCards(new Set());
    }
    
    // If in select mode, reset it first
    if (isSelectMode) {
      setIsSelectMode(false);
      
      Animated.parallel([
        // Mode toggle animation
        Animated.timing(fadeAnim, {
          toValue: isRightSide ? 1 : 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        // Cancel animations
        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(marginAnim, {
          toValue: BOTTOM_SPACING,
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
      ]).start();
      
      // Separate animation for circle button
      Animated.timing(circleButtonOpacity, {
        toValue: 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }).start();
    } else {
      // Just toggle mode
      Animated.timing(fadeAnim, {
        toValue: isRightSide ? 1 : 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleFabPress = () => {
    if (isFavFoldersMode) {
      console.log("Favorite Folders FAB clicked!");
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

  const handleSelect = () => {
    setIsSelectMode(true);
    
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: SHIFT_DISTANCE,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }),
      Animated.timing(marginAnim, {
        toValue: BOTTOM_SPACING + SHIFT_DISTANCE,
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
  };

  const handleCancel = () => {
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }),
      Animated.timing(marginAnim, {
        toValue: BOTTOM_SPACING,
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
      setSelectedFavDeckCards(new Set());
      setSelectedFavFolderCards(new Set());
    });
  };

  const handleSelectAll = () => {
    if (isFavFoldersMode) {
      const foldersToUse = isSearching ? filteredFavoritedFolders : favoritedFolders;
      const allFolderIndices = new Set(Array.from({ length: foldersToUse.length }, (_, i) => i));
      setSelectedFavFolderCards(allFolderIndices);
    } else {
      const decksToUse = isSearching ? filteredFavoritedDecks : favoritedDecks;
      const allDeckIndices = new Set(Array.from({ length: decksToUse.length }, (_, i) => i));
      setSelectedFavDeckCards(allDeckIndices);
    }
  };

  const handleActionIconPress = (index: number) => {
    const hasSelection = isFavFoldersMode 
      ? selectedFavFolderCards.size > 0 
      : selectedFavDeckCards.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle(
        isFavFoldersMode
          ? "Please choose at least one folder if you want to delete or unfavorite."
          : "Please choose at least one deck if you want to delete, add to folder or unfavorite."
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
        setDeleteModalText('Are you sure you want to delete these folder(s)?');
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
                  sourcePage: 'favorites'
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
                sourcePage: 'favorites'
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
          setDeleteModalText('Are you sure you want to delete these deck(s)?');
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
          ? "Please choose at least one folder if you want to delete or unfavorite."
          : "Please choose at least one deck if you want to delete, add to folder or unfavorite."
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
        ? 'Are you sure you want to unfavorite these folder(s)?'
        : 'Are you sure you want to unfavorite these deck(s)?'
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
      // Get the selected deck IDs
      const decksToUse = isSearching ? filteredFavoritedDecks : favoritedDecks;
      const selectedDeckIds = Array.from(selectedFavDeckCards).map(index => decksToUse[index].deckID);

      if (selectedDeckIds.length === 0) {
        console.log('No decks selected for unfavoriting');
        return;
      }

      // Update database to unfavorite the selected decks
      const deckIdsString = selectedDeckIds.join(',');
      await db.execAsync(`
        UPDATE decks 
        SET isFavorited = 0
        WHERE deckID IN (${deckIdsString})
      `);

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
      
      console.log(`Successfully unfavorited ${selectedDeckIds.length} deck(s)`);
    } catch (error) {
      console.error('Error unfavoriting decks:', error);
    }
  };

  const handleUnfavoriteSelectedFolders = async () => {
    try {
      // Get the selected folder IDs
      const foldersToUse = isSearching ? filteredFavoritedFolders : favoritedFolders;
      const selectedFolderIds = Array.from(selectedFavFolderCards).map(index => foldersToUse[index].folderID);

      if (selectedFolderIds.length === 0) {
        console.log('No folders selected for unfavoriting');
        return;
      }

      // Update database to unfavorite the selected folders
      const folderIdsString = selectedFolderIds.join(',');
      await db.execAsync(`
        UPDATE folders 
        SET isFavorited = 0
        WHERE folderID IN (${folderIdsString})
      `);

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
      
      console.log(`Successfully unfavorited ${selectedFolderIds.length} folder(s)`);
    } catch (error) {
      console.error('Error unfavoriting folders:', error);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
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
  };

  // Helper function to get image source for interview decks
  const getImageSource = (deck: Deck & { progress: number }) => {
    if (deck.interviewCompanyIcon) {
      try {
        // Handle hex string from SQLite BLOB
        if (typeof deck.interviewCompanyIcon === 'string') {
          // Check if it's a hex string (from SQLite hex() function)
          if (/^[0-9A-Fa-f]+$/.test(deck.interviewCompanyIcon)) {
            // Convert hex to base64
            const hexString = deck.interviewCompanyIcon;
            const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
            const base64String = btoa(String.fromCharCode(...bytes));
            return { uri: `data:image/png;base64,${base64String}` };
          } else if (deck.interviewCompanyIcon.startsWith('data:')) {
            // Already a data URI
            return { uri: deck.interviewCompanyIcon };
          } else {
            // Try as file path or URL
            return { uri: deck.interviewCompanyIcon };
          }
        }
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  };

  // Helper function to convert null to undefined
  const nullToUndefined = (value: string | null): string | undefined => {
    return value === null ? undefined : value;
  };

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async (deckId: number, currentFavorited: boolean) => {
    try {
      const newFavoritedValue = currentFavorited ? 0 : 1;
      
      // Update database
      await db.execAsync(`
        UPDATE decks 
        SET isFavorited = ${newFavoritedValue}
        WHERE deckID = ${deckId}
      `);
      
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
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  // Function to handle favorite/unfavorite folder
  const handleFolderFavoriteToggle = async (folderId: number, currentFavorited: boolean) => {
    try {
      const newFavoritedValue = currentFavorited ? 0 : 1;
      
      // Update database
      await db.execAsync(`
        UPDATE folders 
        SET isFavorited = ${newFavoritedValue}
        WHERE folderID = ${folderId}
      `);
      
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
    } catch (error) {
      console.error('Error updating folder favorite status:', error);
    }
  };

  // Check if database is ready
  useEffect(() => {
    const checkDatabaseReady = async () => {
      try {
        console.log('Checking if database is ready...');
        // Try a simple query to check if database is ready
        const result = await db.getAllAsync('SELECT COUNT(*) as count FROM decks');
        console.log('Database is ready, decks count:', (result[0] as any)?.count);
        setIsDatabaseReady(true);
      } catch (error) {
        console.log('Database not ready yet, waiting...', error);
        // Retry after a short delay
        setTimeout(checkDatabaseReady, 500);
      }
    };
    
    checkDatabaseReady();
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
        const [decksData, foldersData] = await Promise.all([
          getFavoritedDecks(),
          getFavoritedFolders()
        ]);
        console.log('Favorited decks loaded:', decksData.length);
        console.log('Favorited folders loaded:', foldersData.length);
        setFavoritedDecks(decksData);
        setFavoritedFolders(foldersData);
        setFilteredFavoritedDecks(decksData);
        setFilteredFavoritedFolders(foldersData);
        setFavDeckCardsCount(decksData.length);
        setFavFolderCardsCount(foldersData.length);
      } catch (error) {
        console.error('Error loading favorited data:', error);
      }
    };

    if (isFocused) {
      loadFavoritedData();
    }
  }, [isFocused, isDatabaseReady]);

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

  const handleSearchPress = () => {
    // This will be called when the search button is pressed
    // The actual search logic will be handled by the HeaderIconButtons component
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    
    if (query.length === 0) {
      // If search is empty, show all favorited items
      setFilteredFavoritedDecks(favoritedDecks);
      setFilteredFavoritedFolders(favoritedFolders);
    } else {
      // Filter items by name (case-insensitive)
      const lowerQuery = query.toLowerCase();
      
      const filteredDecks = favoritedDecks.filter(deck => 
        deck.deckName.toLowerCase().includes(lowerQuery)
      );
      
      const filteredFolders = favoritedFolders.filter(folder => 
        folder.folderName.toLowerCase().includes(lowerQuery)
      );
      
      setFilteredFavoritedDecks(filteredDecks);
      setFilteredFavoritedFolders(filteredFolders);
    }
  };

  const handleClearSearch = () => {
    // Clear selections first to prevent render issues
    setSelectedFavDeckCards(new Set());
    setSelectedFavFolderCards(new Set());
    
    // Reset search state
    setSearchQuery('');
    setIsSearching(false);
    
    // Reset filtered data
    setFilteredFavoritedDecks(favoritedDecks);
    setFilteredFavoritedFolders(favoritedFolders);
  };

  const handleDeleteSelectedFavoritedDecks = async () => {
    try {
      // Get the selected deck IDs
      const decksToUse = isSearching ? filteredFavoritedDecks : favoritedDecks;
      const selectedDeckIds = Array.from(selectedFavDeckCards).map(index => decksToUse[index].deckID);

      if (selectedDeckIds.length === 0) {
        console.log('No decks selected for deletion');
        return;
      }

      // Delete the decks from database
      const success = await deleteMultipleDecks(selectedDeckIds);
      
      if (success) {
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

        // Exit selection mode after state updates
        setTimeout(() => {
          handleCancel();
        }, 0);
        
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
      // Get the selected folder IDs
      const foldersToUse = isSearching ? filteredFavoritedFolders : favoritedFolders;
      const selectedFolderIds = Array.from(selectedFavFolderCards).map(index => foldersToUse[index].folderID);

      if (selectedFolderIds.length === 0) {
        console.log('No folders selected for deletion');
        return;
      }

      // Delete the folders from database
      const success = await deleteMultipleFolders(selectedFolderIds);
      
      if (success) {
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

        // Exit selection mode after state updates
        setTimeout(() => {
          handleCancel();
        }, 0);
        
        console.log(`Successfully deleted ${selectedFolderIds.length} favorited folder(s)`);
      } else {
        console.error('Failed to delete favorited folders');
      }
    } catch (error) {
      console.error('Error deleting favorited folders:', error);
    }
  };

  const renderFavDeckCards = () => {
    const decksToRender = isSearching ? filteredFavoritedDecks : favoritedDecks;
    
    // Safety check to prevent rendering issues
    if (!decksToRender || decksToRender.length === 0) {
      return null;
    }
    
    const cards = decksToRender.map((data, index) => {
      const design = cardDesigns[data.cardDesignIndex];
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <Card
          key={`favDeck-${data.deckID}`}
          style={style}
          backgroundImage={design.background}
          pressedBackgroundImage={design.pressed}
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
          image={data.interviewCompanyIcon ? getImageSource(data) : undefined}
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
        />
      );
    });
    return cards;
  };

  const renderFavFolderCards = () => {
    const foldersToRender = isSearching ? filteredFavoritedFolders : favoritedFolders;
    
    // Safety check to prevent rendering issues
    if (!foldersToRender || foldersToRender.length === 0) {
      return null;
    }
    
    const cards = foldersToRender.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      
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
    return cards;
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerIconsContainer}>
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
              onCalendarPress={() => {
                setIsMenuOpen(true);
                setIsCalendarOpen(true);
                setCalendarTitle(CALENDAR_TITLES['favorites']);
                Animated.timing(menuOverlayOpacity, {
                  toValue: 0.4,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
              }}
              onSearchPress={handleSearchPress}
              onSearchTextChange={handleSearch}
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={styles.content}>
              <RoundedContainer 
                leftLabel={`Fav Decks (${favDeckCardsCount})`}
                rightLabel={`Fav Folders (${favFolderCardsCount})`}
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
                  iconColors={isFavFoldersMode ? ['#FF3B30'] : ['black', '#FF3B30']}
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
                    <Title style={[styles.titleAbsolute]} animatedOpacity={studyOpacity}>
                      {`Favorite Decks (${favDeckCardsCount})`}
                    </Title>
                    <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                      {`Favorite Folders (${favFolderCardsCount})`}
                    </Title>
                  </View>
                  <TouchableOpacity 
                    onPress={isSelectMode ? handleSelectAll : handleSelect}
                    style={styles.selectButtonContainer}
                  >
                    <Animated.Text style={[
                      styles.selectButton,
                      styles.selectButtonAbsolute,
                      { opacity: selectOpacity }
                    ]}>
                      Select
                    </Animated.Text>
                    <Animated.Text style={[
                      styles.selectButton,
                      styles.selectButtonAbsolute,
                      { opacity: selectAllOpacity }
                    ]}>
                      Select All
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
            >
              <Feather name="plus" size={38} color="white" />
            </FloatingActionButton>
          </Animated.View>
        </ThemedView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    left: 16,
    zIndex: 1,
  },
  headerIconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
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
    marginTop: Platform.OS === 'android' ? 132 : 78,
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
    paddingBottom: BOTTOM_SPACING,
  },
  firstCard: {
    marginTop: 5,
  },
  card: {
    marginTop: 26,
  },
  shiftableContent: {
    flex: 1,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
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
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
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
});