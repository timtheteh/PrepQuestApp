import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/general/ThemedView';

import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/general/HeaderIconButtons';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { FloatingActionButton } from '@/components/general/FloatingActionButton';
import { Title } from '@/components/general/Title';
import { Card } from '@/components/general/Card';
import { ActionButtonsRow } from '@/components/general/ActionButtonsRow';
import { MenuButton } from '@/components/general/MenuButton';
import { CalendarModal } from '@/components/modals/CalendarModal';
import { DeckSkeletonCard } from '@/components/general/DeckSkeletonCard';
import { useState, useRef, useEffect, useContext, useCallback, useMemo } from 'react';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { MenuContext } from '@/contexts/MenuContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getDeckCardDesign } from '@/constants/cardDesigns';
import { getStudyDecksWithProgress, getInterviewDecksWithProgress, Deck, deleteMultipleDecks, getCompanyIconImageSource, updateDeckFavoriteStatus, saveSortPreferences, loadSortPreferences, checkDatabaseReady, getFlashcardCount } from '@/db/decks';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopBarTopHeight, useHeaderIconsTopHeight, useContentTopHeight, useBottomContentSpacing } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedScreenTransition } from '@/utils/performanceOptimizations';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { useBackgroundTaskRefresh } from '@/hooks/useBackgroundTaskRefresh';
import { formatDate as formatDateUtil } from '@/utils/dateFormat';


type SortField = 'name' | 'dateAdded' | 'lastModified';
type SortDirection = 'asc' | 'desc';



const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
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
  const [calendarFilter, setCalendarFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom' | null>('all');
  const [calendarCustomDate, setCalendarCustomDate] = useState<string | null>(null);
  const [shouldShowStudyAnimation, setShouldShowStudyAnimation] = useState(true);
  const [shouldShowInterviewAnimation, setShouldShowInterviewAnimation] = useState(true);
  const [imageSources, setImageSources] = useState<Map<number, { uri: string } | undefined>>(new Map());
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const router = useRouter();
  const navbarRef = useRef<any>(null);
  const { mode, selected } = useLocalSearchParams();
  const { language, reloadLanguage } = useLanguage();
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
  const { theme } = useTheme();

  const selectUnselectedDuration = 150; // Reduced from 300ms for better performance on low-end devices

  // Create dynamic styles based on theme
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
    menuButton: {
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
    selectButtonDisabled: {
      fontSize: 20,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].unselectedText,
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
    firstCard: {
      marginTop: 5,
    },
    card: {
      marginTop: '6%',
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
  });

  useFocusEffect(
    useCallback(() => {
      reloadLanguage();
    }, [])
  );

  // Helper function to format date using utility
  const formatDate = useCallback((dateString: string): string => {
    return formatDateUtil(dateString, language);
  }, [language]);

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async (deckId: number, currentFavorited: boolean, isStudyDeck: boolean) => {
    try {
      const newFavoritedValue = !currentFavorited;
      
      // Update database
      const success = await updateDeckFavoriteStatus(deckId, newFavoritedValue);
      
      if (success) {
        // Update local state immediately
        if (isStudyDeck) {
          setStudyDecks(prev => 
            prev.map(deck => 
              deck.deckID === deckId 
                ? { ...deck, isFavorited: newFavoritedValue ? 1 : 0 }
                : deck
            )
          );
          setFilteredStudyDecks(prev => 
            prev.map(deck => 
              deck.deckID === deckId 
                ? { ...deck, isFavorited: newFavoritedValue ? 1 : 0 }
                : deck
            )
          );
        } else {
          setInterviewDecks(prev => 
            prev.map(deck => 
              deck.deckID === deckId 
                ? { ...deck, isFavorited: newFavoritedValue ? 1 : 0 }
                : deck
            )
          );
          setFilteredInterviewDecks(prev => 
            prev.map(deck => 
              deck.deckID === deckId 
                ? { ...deck, isFavorited: newFavoritedValue ? 1 : 0 }
                : deck
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  // Check if database is ready
  useEffect(() => {
    const checkDBReady = async () => {
      try {
        const isReady = await checkDatabaseReady();
        if (isReady) {
          setIsDatabaseReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkDBReady, 500);
        }
      } catch (error) {
        console.error('Database not ready yet, waiting...', error);
        // Retry after a short delay
        setTimeout(checkDBReady, 500);
      }
    };
    
    checkDBReady();
  }, []);

  // Load deck data function (reusable for both initial load and refresh)
  const loadDeckData = useCallback(async (showLoadingState = true) => {
    if (!isDatabaseReady) {
      return;
    }
    
    if (showLoadingState) {
      setIsLoadingDecks(true);
    }
    
    try {
      // Load deck data directly from database
      const [studyData, interviewData] = await Promise.all([
        getStudyDecksWithProgress(),
        getInterviewDecksWithProgress()
      ]);

      // Preload flashcard counts for all decks to ensure flashcards are accessible
      const allDecks = [...studyData, ...interviewData];
      await Promise.all(
        allDecks.map(async (deck) => {
          try {
            // Verify flashcard count is accessible (this ensures the deck's flashcards are ready)
            await getFlashcardCount(deck.deckID.toString(), deck.isAIDeck === 1 ? 'true' : 'false');
          } catch (error) {
            console.error(`Error loading flashcard count for deck ${deck.deckID}:`, error);
          }
        })
      );

      setStudyDecks(studyData);
      setInterviewDecks(interviewData);
      setFilteredStudyDecks(studyData);
      setFilteredInterviewDecks(interviewData);
      setStudyCardsCount(studyData.length);
      setInterviewCardsCount(interviewData.length);
      
      // Load image sources for all decks
      const sources = new Map<number, { uri: string } | undefined>();
      for (const deck of allDecks) {
        const imageSource = await getCompanyIconImageSource(deck.interviewCompanyIcon);
        sources.set(deck.deckID, imageSource);
      }
      setImageSources(sources);
      
      if (showLoadingState) {
        setIsLoadingDecks(false);
      }
    } catch (error) {
      console.error('Error loading deck data:', error);
      if (showLoadingState) {
        setIsLoadingDecks(false);
      }
    }
  }, [isDatabaseReady]);

  // Load deck data from database
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
        () => loadDeckData(true)
      );
    }
  }, [isFocused, isDatabaseReady, loadDeckData]);

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
        marginAnim.setValue(bottomSpacing + SHIFT_DISTANCE);
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

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDeckData(false);
    } catch (error) {
      console.error('Error refreshing deck data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDeckData]);

  // Background task refresh hook
  const { shouldRefresh, backgroundTaskProgress } = useBackgroundTaskRefresh({
    onTaskComplete: () => {
      console.log('Background task completed - refreshing deck data');
      // Refresh deck data when background task completes
      if (isDatabaseReady) {
        loadDeckData(true);
      }
    }
  });

  // Fallback refresh mechanism - watch for background task completion or deck creation
  useEffect(() => {
    const shouldRefresh = (backgroundTaskProgress?.completed === true || 
                          backgroundTaskProgress?.status === 'deckAndFlashcardsCreated') && 
                          isDatabaseReady;
    
    if (shouldRefresh) {
      console.log('Fallback: Background task completed or deck created - refreshing deck data');
      loadDeckData(true);
    }
  }, [backgroundTaskProgress?.completed, backgroundTaskProgress?.status, isDatabaseReady, loadDeckData]);

  // Reset selection mode when leaving the tab
  useEffect(() => {
    if (!isFocused) {
      setIsSelectMode(false);
      setSelectedStudyCards(new Set());
      setSelectedInterviewCards(new Set());
      shiftAnim.setValue(0);
      marginAnim.setValue(bottomSpacing);
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
    loadSortPreferencesLocal();
  }, []);

  // Apply sort preferences when decks are loaded and preferences are available
  useEffect(() => {
    if (studyDecks.length > 0 || interviewDecks.length > 0) {
      const sortedStudyDecks = sortDecks(studyDecks);
      const sortedInterviewDecks = sortDecks(interviewDecks);
      setFilteredStudyDecks(sortedStudyDecks);
      setFilteredInterviewDecks(sortedInterviewDecks);
    } else {
      // When all decks are deleted, clear the filtered arrays
      setFilteredStudyDecks([]);
      setFilteredInterviewDecks([]);
    }
  }, [studyDecks, interviewDecks, sortField, sortDirection]);

  // Filter decks by dateAdded according to calendarFilter
  const filterDecksByDate = useCallback((decks: (Deck & { progress: number })[]): (Deck & { progress: number })[] => {
    if (calendarFilter === 'all' || !calendarFilter) return decks;
    const now = new Date();
    return decks.filter((deck: Deck & { progress: number }) => {
      const deckDate = new Date(deck.dateAdded);
      if (calendarFilter === 'today') {
        return (
          deckDate.getFullYear() === now.getFullYear() &&
          deckDate.getMonth() === now.getMonth() &&
          deckDate.getDate() === now.getDate()
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
        return deckDate >= startOfWeek && deckDate <= endOfWeek;
      }
      if (calendarFilter === 'month') {
        return (
          deckDate.getFullYear() === now.getFullYear() &&
          deckDate.getMonth() === now.getMonth()
        );
      }
      if (calendarFilter === 'custom' && calendarCustomDate) {
        // calendarCustomDate is in 'YYYY-MM-DD' format
        const [year, month, day] = calendarCustomDate.split('-').map(Number);
        return (
          deckDate.getFullYear() === year &&
          deckDate.getMonth() + 1 === month && // JS months are 0-based
          deckDate.getDate() === day
        );
      }
      return true;
    });
  }, [calendarFilter, calendarCustomDate]);

  // Calculate filtered decks for counts and rendering
  const filteredStudyDecksByDate = useMemo(() => filterDecksByDate(studyDecks), [filterDecksByDate, studyDecks]);
  const filteredInterviewDecksByDate = useMemo(() => filterDecksByDate(interviewDecks), [filterDecksByDate, interviewDecks]);

  // Calculate search results (search always searches all decks, ignoring calendar filter)
  const searchedStudyDecks = useMemo(() => 
    studyDecks.filter(deck =>
      deck.deckName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [studyDecks, searchQuery]
  );
  const searchedInterviewDecks = useMemo(() => 
    interviewDecks.filter(deck =>
      deck.deckName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [interviewDecks, searchQuery]
  );

  // Manage animation states and ensure FAB button visibility
  useEffect(() => {
    // Determine which decks to check based on whether we're searching or not
    const studyDecksToCheck = isSearching ? searchedStudyDecks : filteredStudyDecksByDate;
    const interviewDecksToCheck = isSearching ? searchedInterviewDecks : filteredInterviewDecksByDate;
    
    const studyDecksEmpty = studyDecksToCheck.length === 0;
    const interviewDecksEmpty = interviewDecksToCheck.length === 0;
    
    // Only show animations when the current mode has no decks
    setShouldShowStudyAnimation(!isInterviewMode && studyDecksEmpty);
    setShouldShowInterviewAnimation(isInterviewMode && interviewDecksEmpty);
    
    // Ensure FAB button is always visible when not in select mode
    // Use requestAnimationFrame to avoid setting values during render
    if (!isSelectMode) {
      requestAnimationFrame(() => {
        fabOpacity.setValue(1);
      });
    }
  }, [isInterviewMode, filteredStudyDecksByDate.length, filteredInterviewDecksByDate.length, searchedStudyDecks.length, searchedInterviewDecks.length, isSearching, isSelectMode]);

  const handleToggle = (isRightSide: boolean) => {
    // If in select mode, cancel it before switching
    if (isSelectMode) {
      handleCancel();
    }
    setIsInterviewMode(isRightSide);
    setCurrentMode(isRightSide ? 'interview' : 'study');
    // Clear the selection state for the mode we're leaving
    if (isRightSide) {
      setSelectedStudyCards(new Set());
    } else {
      setSelectedInterviewCards(new Set());
    }
    
    // For low-end devices: Instant mode toggle
    if (animationConfig.instantMode) {
      fadeAnim.setValue(isRightSide ? 1 : 0);
      return;
    }
    
    // Animate mode toggle for other devices
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: animationConfig.duration,
      useNativeDriver: true,
    }).start();
  };

  const handleSelect = () => {
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
  };

  const handleCancel = () => {
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
      setSelectedStudyCards(new Set());
      setSelectedInterviewCards(new Set());
      
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
        setSelectedStudyCards(new Set());
        setSelectedInterviewCards(new Set());
      });
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
          duration: 250, // Optimized for Android
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 250, // Optimized for Android
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
            duration: 250, // Optimized for Android
            useNativeDriver: true,
          }),
          Animated.timing(trashModalOpacity, {
            toValue: 1,
            duration: 250, // Optimized for Android
            useNativeDriver: true,
          })
        ]).start();
        break;
    }
  };

  // Optimize interpolations for low-end devices
  const animationConfig = getAnimationConfig();
  
  const studyOpacity = animationConfig.instantMode ? 
    new Animated.Value(isInterviewMode ? 0 : 1) : 
    fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

  const interviewOpacity = animationConfig.instantMode ? 
    new Animated.Value(isInterviewMode ? 1 : 0) : 
    fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

  const selectOpacity = animationConfig.instantMode ? 
    new Animated.Value(isSelectMode ? 0 : 1) : 
    selectTextAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

  const selectAllOpacity = animationConfig.instantMode ? 
    new Animated.Value(isSelectMode ? 1 : 0) : 
    selectTextAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

  const handleStudyCardSelection = useCallback((index: number, selected: boolean) => {
    // Always use immediate state update for best responsiveness
    setSelectedStudyCards(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  const handleInterviewCardSelection = useCallback((index: number, selected: boolean) => {
    // Always use immediate state update for best responsiveness  
    setSelectedInterviewCards(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = () => {
    if (isInterviewMode) {
      // Use the same arrays that are being rendered in the UI
      const decksToUse = isSearching ? searchedInterviewDecks : filteredInterviewDecksByDate;
      const allInterviewIndices = new Set(Array.from({ length: decksToUse.length }, (_, i) => i));
      setSelectedInterviewCards(allInterviewIndices);
    } else {
      // Use the same arrays that are being rendered in the UI
      const decksToUse = isSearching ? searchedStudyDecks : filteredStudyDecksByDate;
      const allStudyIndices = new Set(Array.from({ length: decksToUse.length }, (_, i) => i));
      setSelectedStudyCards(allStudyIndices);
    }
  };

  const handleDeleteSelectedDecks = async () => {
    try {
      // Get the selected deck IDs based on current mode
      let selectedDeckIds: number[] = [];
      
      if (isInterviewMode) {
        // Use the same arrays that are being rendered in the UI
        const decksToUse = isSearching ? searchedInterviewDecks : filteredInterviewDecksByDate;
        selectedDeckIds = Array.from(selectedInterviewCards).map(index => decksToUse[index].deckID);
      } else {
        // Use the same arrays that are being rendered in the UI
        const decksToUse = isSearching ? searchedStudyDecks : filteredStudyDecksByDate;
        selectedDeckIds = Array.from(selectedStudyCards).map(index => decksToUse[index].deckID);
      }

      if (selectedDeckIds.length === 0) {
        return;
      }

      // Delete the decks from database
      const success = await deleteMultipleDecks(selectedDeckIds);
      
      if (success) {
        // Batch state updates to prevent rapid re-renders
        const updateState = () => {
          if (isInterviewMode) {
            // Remove deleted decks from both original and filtered arrays
            const remainingOriginalDecks = interviewDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
            const remainingFilteredDecks = filteredInterviewDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
            
            setInterviewDecks(remainingOriginalDecks);
            setFilteredInterviewDecks(remainingFilteredDecks);
            setSelectedInterviewCards(new Set());
          } else {
            // Remove deleted decks from both original and filtered arrays
            const remainingOriginalDecks = studyDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
            const remainingFilteredDecks = filteredStudyDecks.filter(deck => !selectedDeckIds.includes(deck.deckID));
            
            setStudyDecks(remainingOriginalDecks);
            setFilteredStudyDecks(remainingFilteredDecks);
            setSelectedStudyCards(new Set());
          }
        };

        // Use requestAnimationFrame to batch state updates
        requestAnimationFrame(() => {
          updateState();
          // Exit selection mode after state updates with a small delay to ensure state is updated
          setTimeout(() => {
            handleCancel();
          }, 0);
        });
        
      } else {
        console.error('Failed to delete decks');
      }
    } catch (error) {
      console.error('Error deleting decks:', error);
    }
  };

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

  const renderStudyCards = useMemo(() => {
    // Show shimmer skeleton while loading
    if (isLoadingDecks) {
      return Array.from({ length: 6 }).map((_, index) => (
        <DeckSkeletonCard
          key={`study-skeleton-${index}`}
          style={index === 0 ? styles.firstCard : styles.card}
        />
      ));
    }
    
    let decksToRender;
    if (isSearching) {
      decksToRender = searchedStudyDecks;
    } else {
      decksToRender = filteredStudyDecksByDate;
    }
    
    // If no decks to render, show empty state
    if (decksToRender.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          {shouldShowStudyAnimation && (
          <LottieView
            key="study-empty-state"
            source={require('@/assets/animations/EmptyState2.json')}
            autoPlay
            loop
            style={styles.emptyStateAnimation}
          />
          )}
          <Text style={styles.emptyStateText}>
            {strings[language].index.whereHaveAllTheDecksGone}
          </Text>
        </View>
      );
    }
    
    const sortedDecks = sortDecks(decksToRender);
    const cards = sortedDecks.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      const isSelected = selectedStudyCards.has(index);
      const cardDesign = getDeckCardDesign(data.cardDesignIndex, data.isAIDeck === 1, data.AICardDesignIndex);
      return (
        <Card
          key={`study-${data.deckID}`}
          style={style}
          backgroundImage={cardDesign.background}
          pressedBackgroundImage={cardDesign.pressed}
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
  }, [isLoadingDecks, isSearching, searchedStudyDecks, filteredStudyDecksByDate, shouldShowStudyAnimation, sortDecks, selectedStudyCards, isSelectMode, cardWidthPercentage, circleButtonOpacity, formatDate, handleFavoriteToggle, handleStudyCardSelection, language]);

  const renderInterviewCards = useMemo(() => {
    // Show shimmer skeleton while loading
    if (isLoadingDecks) {
      return Array.from({ length: 6 }).map((_, index) => (
        <DeckSkeletonCard
          key={`interview-skeleton-${index}`}
          style={index === 0 ? styles.firstCard : styles.card}
        />
      ));
    }
    
    let decksToRender;
    if (isSearching) {
      decksToRender = searchedInterviewDecks;
    } else {
      decksToRender = filteredInterviewDecksByDate;
    }

    // If no decks to render, show empty state
    if (decksToRender.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          {shouldShowInterviewAnimation && (
          <LottieView
            key="interview-empty-state"
            source={require('@/assets/animations/EmptyState2.json')}
            autoPlay
            loop
            style={styles.emptyStateAnimation}
          />
          )}
          <Text style={styles.emptyStateText}>
            {strings[language].index.whereHaveAllTheDecksGone}
          </Text>
        </View>
      );
    }
    
    const sortedDecks = sortDecks(decksToRender);
    const cards = sortedDecks.map((data, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      const isSelected = selectedInterviewCards.has(index);
      const cardDesign = getDeckCardDesign(data.cardDesignIndex, data.isAIDeck === 1, data.AICardDesignIndex);
      const imageSource = imageSources.get(data.deckID);
      return (
        <Card
          key={`interview-${data.deckID}`}
          style={style}
          backgroundImage={cardDesign.background}
          pressedBackgroundImage={cardDesign.pressed}
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
  }, [isLoadingDecks, isSearching, searchedInterviewDecks, filteredInterviewDecksByDate, shouldShowInterviewAnimation, sortDecks, selectedInterviewCards, isSelectMode, cardWidthPercentage, circleButtonOpacity, imageSources, formatDate, handleFavoriteToggle, handleInterviewCardSelection, language]);

  // For counts in UI:
  const studyDeckCount = useMemo(() => 
    isSearching ? searchedStudyDecks.length : filteredStudyDecksByDate.length, 
    [isSearching, searchedStudyDecks.length, filteredStudyDecksByDate.length]
  );
  const interviewDeckCount = useMemo(() => 
    isSearching ? searchedInterviewDecks.length : filteredInterviewDecksByDate.length, 
    [isSearching, searchedInterviewDecks.length, filteredInterviewDecksByDate.length]
  );

  const handleMenuPress = () => {
    setIsMenuOpen(true);
    setShowSlidingMenu(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 250, // Optimized for Android
        useNativeDriver: true,
      }),
      Animated.timing(menuTranslateX, {
        toValue: 0,
        duration: 250, // Optimized for Android
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleSparklesPress = () => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: 250, // Optimized for Android
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

  const handleSearch = useCallback((query: string) => {
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
  }, [studyDecks, interviewDecks]);

  const handleClearSearch = useCallback(() => {
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
  }, [studyDecks, interviewDecks]);

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    saveSortPreferencesLocal(field, direction);
  };

  // Save sort preferences to AsyncStorage with userID
  const saveSortPreferencesLocal = async (field: SortField, direction: SortDirection) => {
    try {
      await saveSortPreferences(field, direction);
    } catch (error) {
      console.error('Error saving sort preferences:', error);
    }
  };

  // Load sort preferences from AsyncStorage with userID
  const loadSortPreferencesLocal = async () => {
    try {
      const preferences = await loadSortPreferences();
      if (preferences) {
        setSortField(preferences.field);
        setSortDirection(preferences.direction);
      }
    } catch (error) {
      console.error('Error loading sort preferences:', error);
    }
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={[styles.topBar, { paddingTop: getTopBarTopHeight()}]}>
            <MenuButton 
              style={styles.menuButton}
              onPress={handleMenuPress}
            />
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
              pageType="decks"
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={[styles.content, { marginTop: getContentTopHeight()}]}>
              <RoundedContainer 
                leftLabel={`${strings[language].study} (${studyDeckCount})`}
                rightLabel={`${strings[language].interview} (${interviewDeckCount})`}
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
                  iconColors={[Colors[theme].normalIconColor, '#FF3B30']}
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
                    <Title style={[styles.titleAbsolute, {
                      // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular', 
                      fontSize: language === 'Chinese' ? 20 : 24}]} animatedOpacity={studyOpacity}>
                      {`${strings[language].index.myStudyDecks} (${studyDeckCount})`}
                    </Title>
                    <Title style={[styles.titleAbsolute, {
                      // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular', 
                      fontSize: language === 'Chinese' ? 20 : 24}]} animatedOpacity={interviewOpacity}>
                      {`${strings[language].index.myInterviewDecks} (${interviewDeckCount})`}
                    </Title>
                  </View>
                  <TouchableOpacity 
                    onPress={isSelectMode ? handleSelectAll : handleSelect}
                    style={styles.selectButtonContainer}
                    disabled={isSelectMode ? false : (isInterviewMode ? interviewDeckCount === 0 : studyDeckCount === 0)}
                  >
                    <Animated.Text style={[
                      isSelectMode ? styles.selectButton : (isInterviewMode ? (interviewDeckCount === 0 ? styles.selectButtonDisabled : styles.selectButton) : (studyDeckCount === 0 ? styles.selectButtonDisabled : styles.selectButton)),
                      styles.selectButtonAbsolute,
                      { opacity: selectOpacity }
                    ]}>
                      {strings[language].index.select}
                    </Animated.Text>
                    <Animated.Text style={[
                      styles.selectButton,
                      styles.selectButtonAbsolute,
                      { opacity: selectAllOpacity }
                    ]}>
                      {strings[language].index.selectAll}
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
                      refreshControl={
                        <RefreshControl
                          refreshing={isRefreshing}
                          onRefresh={handleRefresh}
                          tintColor={Colors[theme].brandColor2}
                          colors={[Colors[theme].brandColor2]}
                        />
                      }
                    >
                      {renderStudyCards}
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
                      refreshControl={
                        <RefreshControl
                          refreshing={isRefreshing}
                          onRefresh={handleRefresh}
                          tintColor={Colors[theme].brandColor2}
                          colors={[Colors[theme].brandColor2]}
                        />
                      }
                    >
                      {renderInterviewCards}
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
              onPress={() => {}}
              disabled={isSelectMode}
            />
          </Animated.View>
        </ThemedView>
      </SafeAreaView>

      <CalendarModal
        visible={isCalendarOpen}
        title={strings[language].index.filterDecksBasedOnDateAdded}
        onDone={(selectedFilter, customDate) => {
          setCalendarFilter(selectedFilter);
          setCalendarCustomDate(customDate || null);
          handleCalendarDismiss();
        }}
        onDismiss={handleCalendarDismiss}
      />
    </Animated.View>
  );
}
