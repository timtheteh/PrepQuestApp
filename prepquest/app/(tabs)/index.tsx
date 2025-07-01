import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { MenuButton } from '@/components/MenuButton';
import { CalendarModal } from '@/components/CalendarModal';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { useState, useRef, useEffect, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cardDesigns } from '@/constants/cardDesigns';
import { getStudyDecksWithProgress, getInterviewDecksWithProgress, Deck, deleteMultipleDecks } from '@/db/decks';
import { db } from '@/db/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SortField = 'name' | 'dateAdded' | 'lastModified';
type SortDirection = 'asc' | 'desc';

const SORT_FIELD_KEY = 'decks_sort_field';
const SORT_DIRECTION_KEY = 'decks_sort_direction';

const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
const BOTTOM_SPACING = 40; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down
const SCREEN_TRANSITION_DURATION = 200; // Match navbar animation duration

export default function DecksScreen() {
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedStudyCards, setSelectedStudyCards] = useState<Set<number>>(new Set());
  const [selectedInterviewCards, setSelectedInterviewCards] = useState<Set<number>>(new Set());
  const [studyCardsCount, setStudyCardsCount] = useState(0);
  const [interviewCardsCount, setInterviewCardsCount] = useState(0);
  const [studyDecks, setStudyDecks] = useState<(Deck & { progress: number })[]>([]);
  const [interviewDecks, setInterviewDecks] = useState<(Deck & { progress: number })[]>([]);
  const [filteredStudyDecks, setFilteredStudyDecks] = useState<(Deck & { progress: number })[]>([]);
  const [filteredInterviewDecks, setFilteredInterviewDecks] = useState<(Deck & { progress: number })[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
    setSourcePageForFolders
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
  const navbarRef = useRef<any>(null);
  const { mode, selected } = useLocalSearchParams();
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const calendarMenuOverlayOpacity = useRef(new Animated.Value(0)).current;

  const selectUnselectedDuration = 300;

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

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async (deckId: number, currentFavorited: boolean, isStudyDeck: boolean) => {
    try {
      const newFavoritedValue = currentFavorited ? 0 : 1;
      
      // Update database
      await db.execAsync(`
        UPDATE decks 
        SET isFavorited = ${newFavoritedValue}
        WHERE deckID = ${deckId}
      `);
      
      // Update local state immediately
      if (isStudyDeck) {
        setStudyDecks(prev => 
          prev.map(deck => 
            deck.deckID === deckId 
              ? { ...deck, isFavorited: newFavoritedValue }
              : deck
          )
        );
        setFilteredStudyDecks(prev => 
          prev.map(deck => 
            deck.deckID === deckId 
              ? { ...deck, isFavorited: newFavoritedValue }
              : deck
          )
        );
      } else {
        setInterviewDecks(prev => 
          prev.map(deck => 
            deck.deckID === deckId 
              ? { ...deck, isFavorited: newFavoritedValue }
              : deck
          )
        );
        setFilteredInterviewDecks(prev => 
          prev.map(deck => 
            deck.deckID === deckId 
              ? { ...deck, isFavorited: newFavoritedValue }
              : deck
          )
        );
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
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

  // Load deck data from database
  useEffect(() => {
    const loadDeckData = async () => {
      if (!isDatabaseReady) {
        console.log('Database not ready, skipping data load');
        return;
      }
      
      console.log('Loading deck data from database...');
      try {
        const [studyData, interviewData] = await Promise.all([
          getStudyDecksWithProgress(),
          getInterviewDecksWithProgress()
        ]);
        console.log('Study decks loaded:', studyData.length);
        console.log('Interview decks loaded:', interviewData.length);
        setStudyDecks(studyData);
        setInterviewDecks(interviewData);
        setFilteredStudyDecks(studyData);
        setFilteredInterviewDecks(interviewData);
        setStudyCardsCount(studyData.length);
        setInterviewCardsCount(interviewData.length);
      } catch (error) {
        console.error('Error loading deck data:', error);
      }
    };

    if (isFocused) {
      loadDeckData();
    }
  }, [isFocused, isDatabaseReady]);

  // Update card counts
  useEffect(() => {
    if (isSearching) {
      setStudyCardsCount(filteredStudyDecks.length);
      setInterviewCardsCount(filteredInterviewDecks.length);
    } else {
      setStudyCardsCount(studyDecks.length);
      setInterviewCardsCount(interviewDecks.length);
    }
  }, [studyDecks, interviewDecks, filteredStudyDecks, filteredInterviewDecks, isSearching]);

  // Handle returning from folders page
  useEffect(() => {
    if (isFocused) {
      // Reset header icons state when screen comes into focus
      headerIconsRef.current?.reset();
      
      // Check if we're returning from folders page
      if (mode && selected === 'true') {
        // Set the correct mode
        setIsInterviewMode(mode === 'interview');
        setCurrentMode(mode as 'study' | 'interview');
        
        // Enter selection mode
        setIsSelectMode(true);
        
        // Set animation values directly to their final positions without animation
        shiftAnim.setValue(SHIFT_DISTANCE);
        marginAnim.setValue(BOTTOM_SPACING + SHIFT_DISTANCE);
        actionRowOpacity.setValue(1);
        selectTextAnim.setValue(1);
        fabOpacity.setValue(0);
        cardWidthPercentage.setValue(85);
        circleButtonOpacity.setValue(1);
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

  // Reset selection mode when leaving the tab
  useEffect(() => {
    if (!isFocused) {
      setIsSelectMode(false);
      setSelectedStudyCards(new Set());
      setSelectedInterviewCards(new Set());
      shiftAnim.setValue(0);
      marginAnim.setValue(BOTTOM_SPACING);
      actionRowOpacity.setValue(0);
      selectTextAnim.setValue(0);
      fabOpacity.setValue(1);
      cardWidthPercentage.setValue(100);
      circleButtonOpacity.setValue(0);
    }
  }, [isFocused]);

  // Set initial mode animation when component mounts
  useEffect(() => {
    fadeAnim.setValue(isInterviewMode ? 1 : 0);
  }, []);

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

  // Load sort preferences when component mounts
  useEffect(() => {
    loadSortPreferences();
  }, []);

  // Apply sort preferences when decks are loaded and preferences are available
  useEffect(() => {
    if (studyDecks.length > 0 || interviewDecks.length > 0) {
      const sortedStudyDecks = sortDecks(studyDecks);
      const sortedInterviewDecks = sortDecks(interviewDecks);
      setFilteredStudyDecks(sortedStudyDecks);
      setFilteredInterviewDecks(sortedInterviewDecks);
    }
  }, [studyDecks, interviewDecks, sortField, sortDirection]);

  const handleToggle = (isRightSide: boolean) => {
    setIsInterviewMode(isRightSide);
    setCurrentMode(isRightSide ? 'interview' : 'study');
    
    // Clear the selection state for the mode we're leaving
    if (isRightSide) {
      setSelectedStudyCards(new Set());
    } else {
      setSelectedInterviewCards(new Set());
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
      setSelectedStudyCards(new Set());
      setSelectedInterviewCards(new Set());
    });
  };

  const handleActionIconPress = (index: number) => {
    const hasSelection = isInterviewMode 
      ? selectedInterviewCards.size > 0 
      : selectedStudyCards.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    switch (index) {
      case 0: // Folder
        // Reset header icons state
        headerIconsRef.current?.reset();
        
        // Set source page to index
        setSourcePageForFolders('index');
        
        // Get the selected deck IDs
        let selectedDeckIds: number[] = [];
        if (isInterviewMode) {
          const decksToUse = isSearching ? filteredInterviewDecks : interviewDecks;
          selectedDeckIds = Array.from(selectedInterviewCards).map(index => decksToUse[index].deckID);
        } else {
          const decksToUse = isSearching ? filteredStudyDecks : studyDecks;
          selectedDeckIds = Array.from(selectedStudyCards).map(index => decksToUse[index].deckID);
        }
        
        // Navigate to folders in AddToFolders mode
        if (Platform.OS === 'ios') {
          navbarRef?.current?.resetAnimation();
          setTimeout(() => {
            router.push({
              pathname: '/(tabs)/folders',
              params: { 
                isAddToFolders: 'true',
                previousMode: isInterviewMode ? 'interview' : 'study',
                selectedState: 'true',
                selectedDeckIds: JSON.stringify(selectedDeckIds)
              }
            });
          }, 50);
        } else {
          router.push({
            pathname: '/(tabs)/folders',
            params: { 
              isAddToFolders: 'true',
              previousMode: isInterviewMode ? 'interview' : 'study',
              selectedState: 'true',
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
        setHandleDeletion(() => handleDeleteSelectedDecks);
        Animated.parallel([
          Animated.timing(menuOverlayOpacity, {
            toValue: 0.4,
            duration: slidingMenuDuration,
            useNativeDriver: true,
          }),
          Animated.timing(trashModalOpacity, {
            toValue: 1,
            duration: slidingMenuDuration,
            useNativeDriver: true,
          })
        ]).start();
        break;
    }
  };

  const handleFabPress = () => {
    if (isInterviewMode) {
      console.log("Interview state FAB clicked!");
    } else {
      console.log("Study state FAB clicked!");
    }
  };

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

  const handleStudyCardSelection = (index: number, selected: boolean) => {
    setSelectedStudyCards(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  };

  const handleInterviewCardSelection = (index: number, selected: boolean) => {
    setSelectedInterviewCards(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (isInterviewMode) {
      const decksToUse = isSearching ? filteredInterviewDecks : interviewDecks;
      const allInterviewIndices = new Set(Array.from({ length: decksToUse.length }, (_, i) => i));
      setSelectedInterviewCards(allInterviewIndices);
    } else {
      const decksToUse = isSearching ? filteredStudyDecks : studyDecks;
      const allStudyIndices = new Set(Array.from({ length: decksToUse.length }, (_, i) => i));
      setSelectedStudyCards(allStudyIndices);
    }
  };

  const handleDeleteSelectedDecks = async () => {
    try {
      // Get the selected deck IDs based on current mode
      let selectedDeckIds: number[] = [];
      
      if (isInterviewMode) {
        const decksToUse = isSearching ? filteredInterviewDecks : interviewDecks;
        selectedDeckIds = Array.from(selectedInterviewCards).map(index => decksToUse[index].deckID);
      } else {
        const decksToUse = isSearching ? filteredStudyDecks : studyDecks;
        selectedDeckIds = Array.from(selectedStudyCards).map(index => decksToUse[index].deckID);
      }

      if (selectedDeckIds.length === 0) {
        console.log('No decks selected for deletion');
        return;
      }

      // Delete the decks from database
      const success = await deleteMultipleDecks(selectedDeckIds);
      
      if (success) {
        // Update local state by removing the deleted decks
        if (isInterviewMode) {
          const decksToUse = isSearching ? filteredInterviewDecks : interviewDecks;
          const remainingDecks = decksToUse.filter((_, index) => !selectedInterviewCards.has(index));
          
          if (isSearching) {
            setFilteredInterviewDecks(remainingDecks);
          } else {
            setInterviewDecks(remainingDecks);
          }
          setSelectedInterviewCards(new Set());
        } else {
          const decksToUse = isSearching ? filteredStudyDecks : studyDecks;
          const remainingDecks = decksToUse.filter((_, index) => !selectedStudyCards.has(index));
          
          if (isSearching) {
            setFilteredStudyDecks(remainingDecks);
          } else {
            setStudyDecks(remainingDecks);
          }
          setSelectedStudyCards(new Set());
        }

        // Exit selection mode
        handleCancel();
        
        console.log(`Successfully deleted ${selectedDeckIds.length} deck(s)`);
      } else {
        console.error('Failed to delete decks');
      }
    } catch (error) {
      console.error('Error deleting decks:', error);
    }
  };

  const renderStudyCards = () => {
    const decksToRender = isSearching ? filteredStudyDecks : studyDecks;
    const sortedDecks = sortDecks(decksToRender);
    const cards = sortedDecks.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      const isSelected = selectedStudyCards.has(index);
      return (
        <Card
          key={`study-${data.deckID}`}
          style={style}
          backgroundImage={cardDesigns[data.cardDesignIndex].background}
          pressedBackgroundImage={cardDesigns[data.cardDesignIndex].pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={isSelected}
          onSelectPress={() => handleStudyCardSelection(index, !isSelected)}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.progress}
          showProgress={!isSelectMode}
          cardType={data.deckType}
          title={data.deckName}
          date={formatDate(data.dateAdded)}
          flashcardCount={data.flashcardCount}
          deckDetailsBackgroundIndex={data.cardDesignIndex}
          sourcePage="index"
          isStudy={true}
          isFavorited={data.isFavorited === 1}
          onFavoriteToggle={() => handleFavoriteToggle(data.deckID, data.isFavorited === 1, true)}
          deckID={data.deckID}
        />
      );
    });
    return cards;
  };

  const renderInterviewCards = () => {
    const decksToRender = isSearching ? filteredInterviewDecks : interviewDecks;
    const sortedDecks = sortDecks(decksToRender);
    const cards = sortedDecks.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      const isSelected = selectedInterviewCards.has(index);
      
      // Convert interviewCompanyIcon BLOB to ImageSourcePropType if it exists
      let imageSource: any = undefined;
      if (data.interviewCompanyIcon) {
        try {
          // Handle hex string from SQLite BLOB
          if (typeof data.interviewCompanyIcon === 'string') {
            // Check if it's a hex string (from SQLite hex() function)
            if (/^[0-9A-Fa-f]+$/.test(data.interviewCompanyIcon)) {
              // Convert hex to base64
              const hexString = data.interviewCompanyIcon;
              const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
              const base64String = btoa(String.fromCharCode(...bytes));
              imageSource = { uri: `data:image/png;base64,${base64String}` };
            } else if (data.interviewCompanyIcon.startsWith('data:')) {
              // Already a data URI
              imageSource = { uri: data.interviewCompanyIcon };
            } else {
              // Try as file path or URL
              imageSource = { uri: data.interviewCompanyIcon };
            }
          }
        } catch (error) {
          imageSource = undefined;
        }
      }
      
      return (
        <Card
          key={`interview-${data.deckID}`}
          style={style}
          backgroundImage={cardDesigns[data.cardDesignIndex].background}
          pressedBackgroundImage={cardDesigns[data.cardDesignIndex].pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={isSelected}
          onSelectPress={() => handleInterviewCardSelection(index, !isSelected)}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.progress}
          showProgress={!isSelectMode}
          image={imageSource}
          cardType={data.interviewType || undefined}
          title={data.deckName}
          date={formatDate(data.dateAdded)}
          flashcardCount={data.flashcardCount}
          deckDetailsBackgroundIndex={data.cardDesignIndex}
          company={data.interviewCompany || undefined}
          sourcePage="index"
          isFavorited={data.isFavorited === 1}
          onFavoriteToggle={() => handleFavoriteToggle(data.deckID, data.isFavorited === 1, false)}
          deckID={data.deckID}
        />
      );
    });
    return cards;
  };

  const slidingMenuDuration = 300;

  const handleMenuPress = () => {
    setIsMenuOpen(true);
    setShowSlidingMenu(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: slidingMenuDuration,
        useNativeDriver: true,
      }),
      Animated.timing(menuTranslateX, {
        toValue: 0,
        duration: slidingMenuDuration,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleSparklesPress = () => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: slidingMenuDuration,
      useNativeDriver: true,
    }).start();
  };

  const handleCalendarPress = () => {
    setIsCalendarOpen(true);
  };

  const handleCalendarDismiss = () => {
      setIsCalendarOpen(false);
  };

  const handleFolderPress = () => {
    router.push('/folders');
  };

  const handleSearchPress = () => {
    // This will be called when the search button is pressed
    // The actual search logic will be handled by the HeaderIconButtons component
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    
    if (query.length === 0) {
      // If search is empty, show all decks sorted according to current preferences
      const sortedStudyDecks = sortDecks(studyDecks);
      const sortedInterviewDecks = sortDecks(interviewDecks);
      setFilteredStudyDecks(sortedStudyDecks);
      setFilteredInterviewDecks(sortedInterviewDecks);
    } else {
      // Filter decks by name (case-insensitive) and then sort them
      const lowerQuery = query.toLowerCase();
      
      const filteredStudy = studyDecks.filter(deck => 
        deck.deckName.toLowerCase().includes(lowerQuery)
      );
      
      const filteredInterview = interviewDecks.filter(deck => 
        deck.deckName.toLowerCase().includes(lowerQuery)
      );
      
      // Sort the filtered results according to current preferences
      const sortedFilteredStudy = sortDecks(filteredStudy);
      const sortedFilteredInterview = sortDecks(filteredInterview);
      
      setFilteredStudyDecks(sortedFilteredStudy);
      setFilteredInterviewDecks(sortedFilteredInterview);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    // Re-sort the original decks according to current sort preferences
    const sortedStudyDecks = sortDecks(studyDecks);
    const sortedInterviewDecks = sortDecks(interviewDecks);
    setFilteredStudyDecks(sortedStudyDecks);
    setFilteredInterviewDecks(sortedInterviewDecks);
    // Clear selected cards when clearing search
    setSelectedStudyCards(new Set());
    setSelectedInterviewCards(new Set());
  };

  const sortDecks = (decks: (Deck & { progress: number })[]) => {
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
        [SORT_FIELD_KEY, field],
        [SORT_DIRECTION_KEY, direction]
      ]);
    } catch (error) {
      console.error('Error saving sort preferences:', error);
    }
  };

  // Load sort preferences from AsyncStorage
  const loadSortPreferences = async () => {
    try {
      const [savedField, savedDirection] = await AsyncStorage.multiGet([
        SORT_FIELD_KEY,
        SORT_DIRECTION_KEY
      ]);
      
      if (savedField[1]) {
        setSortField(savedField[1] as SortField);
      }
      if (savedDirection[1]) {
        setSortDirection(savedDirection[1] as SortDirection);
      }
    } catch (error) {
      console.error('Error loading sort preferences:', error);
    }
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.topBar}>
            <MenuButton 
              style={styles.menuButton}
              onPress={handleMenuPress}
            />
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
              pageType="decks"
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={styles.content}>
              <RoundedContainer 
                leftLabel={`Study (${studyCardsCount})`}
                rightLabel={`Interview (${interviewCardsCount})`}
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
                  iconNames={['folder', 'trash']}
                  onCancel={handleCancel}
                  onIconPress={handleActionIconPress}
                  iconColors={['black', '#FF3B30']}
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
                      {`My Study Decks (${studyCardsCount})`}
                    </Title>
                    <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                      {`My Interview Decks (${interviewCardsCount})`}
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
                  {/* Study Mode ScrollView */}
                  <Animated.View style={[
                    styles.scrollViewContainer,
                    { opacity: studyOpacity, display: isInterviewMode ? 'none' : 'flex' }
                  ]}>
                    <ScrollView 
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {renderStudyCards()}
                    </ScrollView>
                  </Animated.View>

                  {/* Interview Mode ScrollView */}
                  <Animated.View style={[
                    styles.scrollViewContainer,
                    { opacity: interviewOpacity, display: isInterviewMode ? 'flex' : 'none' }
                  ]}>
                    <ScrollView 
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {renderInterviewCards()}
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
            >
              <Feather name="plus" size={38} color="white" />
            </FloatingActionButton>
          </Animated.View>
        </ThemedView>
      </SafeAreaView>

      <CalendarModal
        visible={isCalendarOpen}
        title={"Filter decks based on\ndate added"}
        onDone={(selectedFilter, customDate) => {
          // Handle the calendar filter selection here
          console.log('Calendar filter selected:', selectedFilter, customDate);
          handleCalendarDismiss();
        }}
        onDismiss={handleCalendarDismiss}
      />
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
  menuButton: {
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
    height: 100, // Make sure this is tall enough to contain the FAB
    zIndex: 1,
  },
  actionButtonsRow: {
    position: 'absolute',
    top: 62,
    right: 0,
    left: 0,
    zIndex: 1,
  },
});
