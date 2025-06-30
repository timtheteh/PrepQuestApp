import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/HeaderIconButtons';
import { Title } from '@/components/Title';
import { FolderCard } from '@/components/FolderCard';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { Feather } from '@expo/vector-icons';
import { useState, useRef, useContext, useEffect } from 'react';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavBarRef } from '@/components/NavBar';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { getAllFolders, Folder, deleteMultipleFolders } from '@/db/decks';
import { db } from '@/db/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SortField = 'name' | 'dateAdded' | 'lastModified';
type SortDirection = 'asc' | 'desc';

const FOLDERS_SORT_FIELD_KEY = 'folders_sort_field';
const FOLDERS_SORT_DIRECTION_KEY = 'folders_sort_direction';

const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
const BOTTOM_SPACING = 20; // Required spacing from navbar
const SHIFT_DISTANCE = 48; // Distance to shift content down
const selectUnselectedDuration = 300;
const SCREEN_TRANSITION_DURATION = 200; // Match navbar animation duration

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
    decksAlreadyInFoldersModalOpacity
  } = useContext(MenuContext);

  // Animation values
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(BOTTOM_SPACING)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;

  // Reset header icons state and selection mode when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset header icons
      headerIconsRef.current?.reset();

      // Set the delete modal text for folders
      setDeleteModalText('Are you sure you want to delete these folder(s)?');

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
        marginAnim.setValue(BOTTOM_SPACING + SHIFT_DISTANCE);
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
        marginAnim.setValue(BOTTOM_SPACING + SHIFT_DISTANCE);
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
        marginAnim.setValue(BOTTOM_SPACING);
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
        console.log('Checking if database is ready...');
        // Try a simple query to check if database is ready
        const result = await db.getAllAsync('SELECT COUNT(*) as count FROM folders');
        console.log('Database is ready, folders count:', (result[0] as any)?.count);
        setIsDatabaseReady(true);
        setFoldersCount((result[0] as any)?.count);
      } catch (error) {
        console.log('Database not ready yet, waiting...', error);
        // Retry after a short delay
        setTimeout(checkDatabaseReady, 500);
      }
    };
    
    checkDatabaseReady();
  }, []);

  // Load folders data from database
  useEffect(() => {
    const loadFoldersData = async () => {
      if (!isDatabaseReady) {
        console.log('Database not ready, skipping data load');
        return;
      }
      
      console.log('Loading folders data from database...');
      try {
        const foldersData = await getAllFolders();
        console.log('Folders loaded:', foldersData.length);
        setFolders(foldersData);
        setFilteredFolders(foldersData);
        setFoldersCount(foldersData.length);
      } catch (error) {
        console.error('Error loading folders data:', error);
      }
    };

    if (isFocused) {
      loadFoldersData();
    }
  }, [isFocused, isDatabaseReady]);

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

  // Sort function for folders
  const sortFolders = (folders: Folder[]) => {
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
  };

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    saveSortPreferences(field, direction);
  };

  // Save sort preferences to AsyncStorage
  const saveSortPreferences = async (field: SortField, direction: SortDirection) => {
    try {
      await AsyncStorage.multiSet([
        [FOLDERS_SORT_FIELD_KEY, field],
        [FOLDERS_SORT_DIRECTION_KEY, direction]
      ]);
    } catch (error) {
      console.error('Error saving folders sort preferences:', error);
    }
  };

  // Load sort preferences from AsyncStorage
  const loadSortPreferences = async () => {
    try {
      const [savedField, savedDirection] = await AsyncStorage.multiGet([
        FOLDERS_SORT_FIELD_KEY,
        FOLDERS_SORT_DIRECTION_KEY
      ]);
      
      if (savedField[1]) {
        setSortField(savedField[1] as SortField);
      }
      if (savedDirection[1]) {
        setSortDirection(savedDirection[1] as SortDirection);
      }
    } catch (error) {
      console.error('Error loading folders sort preferences:', error);
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
      setSelectedFolders(new Set());
    });
  };

  const handleActionIconPress = (index: number) => {
    const hasSelection = selectedFolders.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle('Please choose at least one folder if you want to delete.');
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
      setDeleteModalText('Are you sure you want to delete these folder(s)?');
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
  };

  const handleFabPress = () => {
    console.log("Folders FAB clicked!");
  };

  const handleMenuPress = () => {
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
  };

  const handleSparklesPress = () => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCalendarPress = () => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchPress = () => {
    // This will be called when the search button is pressed
    // The actual search logic will be handled by the HeaderIconButtons component
  };

  const handleSearch = (query: string) => {
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
  };

  const handleClearSearch = () => {
    // Clear selections first to prevent render issues
    setSelectedFolders(new Set());
    
    // Reset search state
    setSearchQuery('');
    setIsSearching(false);
    
    // Reset filtered data with sorting applied
    const sortedFolders = sortFolders(folders);
    setFilteredFolders(sortedFolders);
  };

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleSelectAll = () => {
    const foldersToUse = isSearching ? filteredFolders : folders;
    const allFolderIndices = new Set(Array.from({ length: foldersToUse.length }, (_, i) => i));
    setSelectedFolders(allFolderIndices);
  };

  const handleDone = async () => {
    // Handle the done action for AddToFolders or MoveToFolders mode
    if (isAddToFoldersMode) {
      try {
        // Get the selected folder IDs
        const foldersToUse = isSearching ? filteredFolders : folders;
        const selectedFolderIds = Array.from(selectedFolders).map(index => foldersToUse[index].folderID);

        if (selectedFolderIds.length === 0) {
          console.log('No folders selected for adding deck');
          return;
        }

        // Get the deck IDs from the route params
        let targetDeckIds: number[] = [];
        
        // Check if we have selectedDeckIds (from index page) or deckId (from deckDetails page)
        if (selectedDeckIds) {
          try {
            targetDeckIds = JSON.parse(selectedDeckIds as string);
          } catch (error) {
            console.error('Error parsing selectedDeckIds:', error);
            return;
          }
        } else if (deckId) {
          targetDeckIds = [parseInt(deckId as string)];
        } else {
          console.error('No deck IDs provided for adding to folders');
          return;
        }

        if (targetDeckIds.length === 0) {
          console.error('No valid deck IDs found');
          return;
        }

        // Check if any decks are already in the selected folders
        let hasExistingDecks = false;
        
        for (const targetDeckId of targetDeckIds) {
          // Get the current folderIDs for the deck
          const currentDeck = await db.getFirstAsync(`
            SELECT folderIDs FROM decks WHERE deckID = ${targetDeckId}
          `);

          if (!currentDeck) {
            console.error(`Deck ${targetDeckId} not found`);
            continue;
          }

          const deckData = currentDeck as { folderIDs: string | null };
          let currentFolderIds: number[] = [];

          // Parse existing folderIDs if they exist
          if (deckData.folderIDs) {
            try {
              currentFolderIds = JSON.parse(deckData.folderIDs);
            } catch (error) {
              console.error('Error parsing existing folderIDs:', error);
              currentFolderIds = [];
            }
          }

          // Check if any of the selected folders are already in the deck's folders
          const hasOverlap = selectedFolderIds.some(folderId => currentFolderIds.includes(folderId));
          
          if (hasOverlap) {
            hasExistingDecks = true;
            break;
          }
        }

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
        for (const targetDeckId of targetDeckIds) {
          // Get the current folderIDs for the deck
          const currentDeck = await db.getFirstAsync(`
            SELECT folderIDs FROM decks WHERE deckID = ${targetDeckId}
          `);

          if (!currentDeck) {
            console.error(`Deck ${targetDeckId} not found`);
            continue;
          }

          const deckData = currentDeck as { folderIDs: string | null };
          let currentFolderIds: number[] = [];

          // Parse existing folderIDs if they exist
          if (deckData.folderIDs) {
            try {
              currentFolderIds = JSON.parse(deckData.folderIDs);
            } catch (error) {
              console.error('Error parsing existing folderIDs:', error);
              currentFolderIds = [];
            }
          }

          // Add new folder IDs (avoid duplicates)
          const newFolderIds = [...new Set([...currentFolderIds, ...selectedFolderIds])];

          // Update the deck's folderIDs in the database
          const newFolderIdsString = JSON.stringify(newFolderIds);
          await db.execAsync(`
            UPDATE decks 
            SET folderIDs = '${newFolderIdsString}', lastModifiedDate = datetime('now')
            WHERE deckID = ${targetDeckId}
          `);

          console.log(`Successfully added deck ${targetDeckId} to folders: ${selectedFolderIds.join(', ')}`);
        }
        
        // Reload folder data to update deck counts
        const updatedFoldersData = await getAllFolders();
        setFolders(updatedFoldersData);
        setFilteredFolders(updatedFoldersData);
        
        // Show success modal
        setIsMenuOpen(true);
        setIsDeckDetailsSaveModalOpen(true);
        
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
      } catch (error) {
        console.error('Error adding deck to folders:', error);
      }
    } else if (isMoveToFoldersMode) {
      // TODO: Implement move to folders logic
      console.log('Move to folders logic will be implemented here');
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
        console.log('No folders selected for deletion');
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
        
        console.log(`Successfully deleted ${selectedFolderIds.length} folder(s)`);
      } else {
        console.error('Failed to delete folders');
      }
    } catch (error) {
      console.error('Error deleting folders:', error);
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
      
      // Update local state immediately
      setFolders(prev => 
        prev.map(folder => 
          folder.folderID === folderId 
            ? { ...folder, isFavorited: newFavoritedValue }
            : folder
        )
      );
      
      // Update filtered folders if searching
      if (isSearching) {
        setFilteredFolders(prev => 
          prev.map(folder => 
            folder.folderID === folderId 
              ? { ...folder, isFavorited: newFavoritedValue }
              : folder
          )
        );
      }
    } catch (error) {
      console.error('Error updating folder favorite status:', error);
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

  const renderFolderCards = () => {
    const foldersToRender = isSearching ? filteredFolders : folders;
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
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
            <View style={styles.content}>
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
                      <Text style={styles.doneButton}>Done</Text>
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
                    <Title>
                      {isAddToFoldersMode ? 'Add to Folder(s)' : isMoveToFoldersMode ? 'Move to Folder(s)' : `Folders (${foldersCount})`}
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
                  <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
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
            >
              <Feather name="plus" size={38} color="white" />
            </FloatingActionButton>
          </Animated.View>
        </View>
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
    paddingTop: 10,
    paddingRight: 8,
  },
  mainContentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 108 : 56,
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
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
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
    paddingBottom: BOTTOM_SPACING,
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
    marginTop: 26,
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
  doneButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    height: 48,
  },
  doneButton: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
  },
}); 