import React, { useRef, useEffect, useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Animated, Text, ScrollView } from 'react-native';
import { ThemedView } from '@/components/general/ThemedView';
import { useIsFocused } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from '@/contexts/MenuContext';
import { ViewFlashcardsTopBar } from '@/components/viewFlashcards/ViewFlashcardsTopBar';
import { ActionButtonsRow } from '@/components/general/ActionButtonsRow';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteButton } from '@/components/general/FavoriteButton';
import { CircleSelectButtonGreen } from '@/components/general/CircleSelectButtonGreen';
import { FloatingActionButton } from '@/components/general/FloatingActionButton';
import Feather from '@expo/vector-icons/Feather';

import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContentTopHeight, useContentTopHeightNoRoundedToggle2, useHeaderIconsTopHeight, useTopBarTopHeight } from '@/hooks/heights';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { useCallback } from 'react';
import { 
  loadFlashcardsFromDatabase, 
  loadTopicsFromDatabase, 
  calculateQuestionTypeCounts, 
  toggleFlashcardFavorite, 
  deleteSelectedFlashcards as deleteSelectedFlashcardsFromDB,
  Flashcard,
} from '@/db/decks';

// Safe JSON parse helper
function safeParseJSON(val: any, fallback: any[] = []): any[] {
  if (!val || val === 'NULL') return fallback;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function ViewFlashcardsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const { deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, mode, sourcePage, folderTitle, folderId } = useLocalSearchParams();
  const { 
    navbarRef,
    setIsMenuOpen,
    setIsTrashModalOpenInDecksPage,
    setIsNoSelectionModalOpen,
    setDeleteModalText,
    setHandleDeletion,
    trashModalOpacity,
    noSelectionModalOpacity,
    menuOverlayOpacity,
    setCurrentDeckId,
    setCurrentDeckType,
  } = useContext(MenuContext);

  const { language } = useLanguage();
  // Localized labels
  const COLUMN_TITLES = {
    topics: strings[language].viewFlashcardsPage.topics,
    qnTypes: strings[language].viewFlashcardsPage.qnTypes,
    flashcards: strings[language].viewFlashcardsPage.flashcards,
    select: strings[language].viewFlashcardsPage.select,
    selectAll: strings[language].viewFlashcardsPage.selectAll,
  };
  const LOADING = {
    topics: strings[language].viewFlashcardsPage.loadingTopics,
    qnTypes: strings[language].viewFlashcardsPage.loadingQnTypes,
    flashcards: strings[language].viewFlashcardsPage.loadingFlashcards
  };
  const EMPTY = {
    topics: strings[language].viewFlashcardsPage.noTopicsSpecified,
    qnTypes: strings[language].viewFlashcardsPage.noQuestionTypesFound,
    flashcards: strings[language].viewFlashcardsPage.noFlashcardsFound,
  };
  const DIFFICULTY_LABELS: Record<string, string> = {
    Again: strings[language].viewFlashcardsPage.again,
    Hard: strings[language].viewFlashcardsPage.hard,
    Good: strings[language].viewFlashcardsPage.good,
    Easy: strings[language].viewFlashcardsPage.easy,
    None: strings[language].viewFlashcardsPage.none,
  };

  // Mapping for cognitiveQnType to Chinese/English
  const COGNITIVE_QN_TYPE_LABELS: Record<string, { en: string; zh: string }> = {
    'Recall': { en: 'Recall', zh: '回忆' },
    'Application': { en: 'Application', zh: '应用' },
    'Analysis': { en: 'Analysis', zh: '分析' },
    'Synthesis': { en: 'Synthesis', zh: '综合' },
    'Evaluation': { en: 'Evaluation', zh: '评估' },
    'Comprehension': { en: 'Comprehension', zh: '理解' },
    'Problem-Solving': { en: 'Problem-Solving', zh: '解决' },
    'None': { en: 'None', zh: '无' },
    // Add more as needed
  };

  // Helper to get localized cognitiveQnType label
  const getCognitiveQnTypeLabel = (type: string) => {
    const entry = COGNITIVE_QN_TYPE_LABELS[type];
    if (!entry) return type;
    return language === 'Chinese' ? entry.zh : entry.en;
  };

  // View state management - always start in "grid" state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCardIndexes, setSelectedCardIndexes] = useState<number[]>([]);
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const actionRowTranslateY = useRef(new Animated.Value(-20)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  
  // Ref to track if we're coming from flashcardView
  const comingFromFlashcardView = useRef(false);
  const previousViewMode = useRef<'grid' | 'list'>('grid');

  // State for flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(true);

  // State for topics
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  // State for question types
  const [questionTypes, setQuestionTypes] = useState<{ title: string; count: number }[]>([]);



  // Function to load flashcards
  const loadFlashcards = async () => {
    try {
      setIsLoadingFlashcards(true);
      const loadedFlashcards = await loadFlashcardsFromDatabase(deckId as string, isAIDeck as string);
      setFlashcards(loadedFlashcards);
      const questionTypeCounts = calculateQuestionTypeCounts(loadedFlashcards);
      setQuestionTypes(questionTypeCounts);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      setFlashcards([]);
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  // Function to load topics
  const loadTopics = async () => {
    try {
      setIsLoadingTopics(true);
      const loadedTopics = await loadTopicsFromDatabase(deckId as string, isAIDeck as string);
      setTopics(loadedTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Function to toggle favorite status
  const toggleFavorite = async (flashcardIdx: number) => {
    try {
      const result = await toggleFlashcardFavorite(flashcardIdx, flashcards, isAIDeck as string);
      if (result.success) {
        setFlashcards(result.updatedFlashcards);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  // Handle screen transitions
  useEffect(() => {
    if (isFocused) {
      // Reset navbar animation when screen comes into focus
      navbarRef?.current?.resetAnimation();
      
      // Only reset view mode to grid if we're not coming from flashcardView
      if (comingFromFlashcardView.current) {
        // Restore the previous view mode
        setViewMode(previousViewMode.current);
        comingFromFlashcardView.current = false;
      } else {
        // Reset to grid when coming from other pages
        setViewMode('grid');
      }
      
      // Load flashcards when screen comes into focus
      loadFlashcards();
      loadTopics();
      
      // Ensure opacity starts at 0 for a clean fade-in
      screenOpacity.setValue(0);
      
      // Add a small delay for smoother fade-in animation
      setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      screenOpacity.setValue(0);
    }
  }, [isFocused]);

  useEffect(() => {
    if (isSelectMode) {
      Animated.parallel([
        Animated.timing(actionRowOpacity, {
          toValue: 1,
          duration: ACTION_ROW_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(actionRowTranslateY, {
          toValue: 0,
          duration: ACTION_ROW_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: ACTION_ROW_HEIGHT,
          duration: ACTION_ROW_ANIMATION_DURATION,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(actionRowOpacity, {
          toValue: 0,
          duration: ACTION_ROW_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(actionRowTranslateY, {
          toValue: -20,
          duration: ACTION_ROW_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: ACTION_ROW_ANIMATION_DURATION,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSelectMode]);

  useEffect(() => {
    if (viewMode === 'grid') {
      setIsSelectMode(false);
      setSelectedCardIndexes([]);
    }
    else if (viewMode === 'list') {
        setIsSelectMode(false);
        setSelectedCardIndexes([]);
      }
  }, [viewMode]);

  // Clean up animation when component unmounts
  useEffect(() => {
    return () => {
      screenOpacity.setValue(0);
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      setHandleDeletion(() => deleteSelectedFlashcards);
    }
    return () => {
      if (!isFocused) {
        setHandleDeletion(null);
      }
    };
  }, [isFocused, selectedCardIndexes, flashcards, isAIDeck]);

  // Set the deckId and deckType in context when component mounts
  useEffect(() => {
    if (deckId) {
      setCurrentDeckId(deckId as string);
    }
    if (deckType) {
      setCurrentDeckType(deckType as string);
    }
  }, [deckId, deckType, setCurrentDeckId, setCurrentDeckType]);

  const handleBackPress = useCallback(() => {
    // Navigate back to deck details page with all preserved parameters
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
        mode: mode as string,
        sourcePage: sourcePage as string,
        folderTitle: folderTitle as string,
        folderId: folderId as string
      }
    });
  }, [router, deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, mode, sourcePage, folderTitle, folderId]);

  const handleStudyPress = useCallback(() => {
    // Navigate to flashcardView with the first flashcard for study mode
    router.push({
      pathname: '/flashcardView',
      params: {
        flashcardIdx: '0',
        totalNumberOfFlashcards: flashcards.length.toString(),
        isStudyMode: 'true',
        isAIDeck: isAIDeck as string,
        deckID: deckId as string,
      }
    });
  }, [router, flashcards.length, isAIDeck, deckId]);

  const handleQuizPress = useCallback(() => {
    // TODO: Implement quiz functionality
    router.push({
      pathname: '/flashcardView',
      params: {
        flashcardIdx: '0',
        totalNumberOfFlashcards: flashcards.length.toString(),
        isQuizMode: 'true',
        isAIDeck: isAIDeck as string,
        deckID: deckId as string,
      }
    });
  }, [router, flashcards.length, isAIDeck, deckId]);

  const handleGridPress = useCallback(() => {
    setViewMode('grid');
  }, [setViewMode]);

  const handleListPress = useCallback(() => {
    setViewMode('list');
  }, [setViewMode]);

  // Action row handlers
  const handleSelect = useCallback(() => setIsSelectMode(true), [setIsSelectMode]);
  const handleSelectAll = useCallback(() => {
    if (selectedCardIndexes.length === flashcards.length) {
      // If all are selected, deselect all
      setSelectedCardIndexes([]);
    } else {
      // Otherwise, select all
      setSelectedCardIndexes(flashcards.map((_, idx) => idx));
    }
  }, [selectedCardIndexes.length, flashcards.length, setSelectedCardIndexes]);
  const handleCancel = useCallback(() => {
    setIsSelectMode(false);
    setSelectedCardIndexes([]);
  }, [setIsSelectMode, setSelectedCardIndexes]);
  const handleActionIconPress = useCallback((index: number) => {
    if (selectedCardIndexes.length === 0) {
      // No selection - show no selection modal
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      Animated.timing(noSelectionModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Has selection - show delete confirmation modal
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setIsMenuOpen(true);
      setIsTrashModalOpenInDecksPage(true);
      setDeleteModalText(strings[language].viewFlashcardsPage.deleteFlashcardsConfirmation);
      Animated.timing(trashModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedCardIndexes.length, menuOverlayOpacity, setIsMenuOpen, setIsNoSelectionModalOpen, noSelectionModalOpacity, setIsTrashModalOpenInDecksPage, setDeleteModalText, language, trashModalOpacity]);

  // Function to delete selected flashcards
  const deleteSelectedFlashcards = async () => {
    try {
      if (selectedCardIndexes.length === 0) return;

      const result = await deleteSelectedFlashcardsFromDB(selectedCardIndexes, flashcards, deckId as string, isAIDeck as string);
      if (result.success) {
        setFlashcards(result.updatedFlashcards);
        
        // Recalculate question types after deletion
        const questionTypeCounts = calculateQuestionTypeCounts(result.updatedFlashcards);
        setQuestionTypes(questionTypeCounts);
        
        // Reset selection mode
        setSelectedCardIndexes([]);
        setIsSelectMode(false);
      }
    } catch (error) {
      console.error('Error deleting flashcards:', error);
    }
  };

  // Handler to navigate to flashcard view
  const handleNavigateToFlashcardView = useCallback((flashcardIdx: number) => {
    // Save current view mode and mark that we're going to flashcardView
    previousViewMode.current = viewMode;
    comingFromFlashcardView.current = true;
    router.push({
      pathname: '/flashcardView',
      params: {
        flashcardIdx: flashcardIdx.toString(),
        totalNumberOfFlashcards: flashcards.length.toString(),
        isAIDeck: isAIDeck as string,
        deckID: deckId as string,
      }
    });
  }, [router, viewMode, flashcards.length, isAIDeck, deckId]);

  // Handler to toggle card selection
  const handleCardPress = useCallback((cardIdx: number) => {
    if (!isSelectMode) return;
    setSelectedCardIndexes((prev) =>
      prev.includes(cardIdx)
        ? prev.filter((idx) => idx !== cardIdx)
        : [...prev, cardIdx]
    );
  }, [isSelectMode, setSelectedCardIndexes]);

  const chunkArray = useCallback(<T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  }, []);

  // Local TopicPill component
  const TopicPill = useCallback(({ text }: { text: string }) => {
    return (
      <View style={styles.topicPill}>
        <Text style={[styles.topicPillText, language === 'Chinese' && { 
          // fontFamily: 'NotoSansSC-Medium' 
          }]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    );
  }, [language]);

  // Local QuestionTypeCountRow component
  const QuestionTypeCountRow = useCallback(({ title, count }: { title: string; count: number }) => (
    <View style={styles.questionTypeCountRow}>
      <Text style={[styles.questionTypeCountText, language === 'Chinese' && {
        //  fontFamily: 'NotoSansSC-Medium' 
         }]}>{getCognitiveQnTypeLabel(title)}</Text>
      <Text style={[styles.questionTypeCountText, language === 'Chinese' && { 
        // fontFamily: 'NotoSansSC-Medium' 
        }]}>{count}</Text>
    </View>
  ), [language, getCognitiveQnTypeLabel]);

  const difficultyColors: Record<string, string> = {
    Again: '#F8696B',
    Hard: '#FA9473',
    Good: '#FFEB84',
    Easy: '#98CE7F',
  };

  const CardForFlashcard = ({
    flashcardDifficulty,
    flashcardQn,
    flashcardQnType,
    selected,
    isSelectMode,
    onPress,
    flashcardIdx,
    onNavigate,
    flashcards,
    isFavorited,
    onToggleFavorite
  }: {
    flashcardDifficulty: 'Again' | 'Hard' | 'Good' | 'Easy';
    flashcardQn: string;
    flashcardQnType: string;
    selected: boolean;
    isSelectMode: boolean;
    onPress: () => void;
    flashcardIdx: number;
    onNavigate: (flashcardIdx: number) => void;
    flashcards: Flashcard[];
    isFavorited: boolean;
    onToggleFavorite: () => void;
  }) => {
    const router = useRouter();
    const Container = isSelectMode ? TouchableOpacity : View;
    // Determine what text to display based on flashcardQnType
    const getDisplayText = () => {
      if (flashcardQnType === 'text') {
        return flashcardQn;
      } else if (flashcardQnType === 'image') {
        return strings[language].viewFlashcardsPage.imagePlaceholder;
      } else if (flashcardQnType === 'audio') {
        return strings[language].viewFlashcardsPage.audioPlaceholder;
      }
      return flashcardQn; // fallback
    };
    return (
      <Container
        style={[
          styles.cardForFlashcard,
          selected && styles.cardForFlashcardSelected,
        ]}
        onPress={isSelectMode ? onPress : undefined}
        activeOpacity={0.7}
        disabled={!isSelectMode}
      >
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <TouchableOpacity onPress={() => onNavigate(flashcardIdx)}>
            <Ionicons name="eye" size={20} color="#444" />
          </TouchableOpacity>
          <View style={[styles.difficultyPill, { borderColor: difficultyColors[flashcardDifficulty] }]}> 
            <Text style={[styles.difficultyPillText, language === 'Chinese' && { 
              // fontFamily: 'NotoSansSC-Medium' 
              }]}>{DIFFICULTY_LABELS[flashcardDifficulty]}</Text>
          </View>
          <FavoriteButton size={20} favorited={isFavorited} onPress={onToggleFavorite} />
        </View>
        {/* Centered question */}
        <View style={styles.cardQnContainer}>
          <Text
            style={[styles.cardQnText, language === 'Chinese' && { 
              // fontFamily: 'NotoSansSC-Medium' 
            }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getDisplayText()}
          </Text>
        </View>
        {/* Green tick if selected */}
        {selected && (
          <View style={styles.greenTickContainer}>
            <GreenTickIcon width={20} height={20} />
          </View>
        )}
        {/* CognitiveQnType pill at the bottom */}
        {typeof flashcardIdx === 'number' && flashcards[flashcardIdx]?.cognitiveQnType && flashcards[flashcardIdx].cognitiveQnType !== 'None' && (
          <View style={{
            alignSelf: 'center',
            marginBottom: -10,
            backgroundColor: '#fff',
            borderColor: '#4F41D8',
            borderWidth: 1,
            borderRadius: 12,
            minHeight: 24,
            paddingHorizontal: 12,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
            <Text style={{ fontSize: 12, color: '#222', textAlign: 'center', 
              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium' 
              }}>
              {getCognitiveQnTypeLabel(flashcards[flashcardIdx].cognitiveQnType)}
            </Text>
          </View>
        )}
      </Container>
    );
  };

  const SCREEN_TRANSITION_DURATION = 300;
  const ACTION_ROW_HEIGHT = 60;
  const ACTION_ROW_ANIMATION_DURATION = 300;

  const getContentTopHeight = useContentTopHeight();
  const getContentTopHeightNoRoundedToggle2 = useContentTopHeightNoRoundedToggle2();
  const getHeaderIconsTopHeight = useHeaderIconsTopHeight();
  const getTopBarTopHeight = useTopBarTopHeight();

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
      top: Platform.OS === 'android' ? 70 : 16,
      left: 16,
      zIndex: 1,
    },
    backButton: {
      paddingTop: 8,
    },
    headerIconsContainer: {
      position: 'absolute',
      top: Platform.OS === 'android' ? 70 : 16,
      right: 16,
      zIndex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      minHeight: 150,
      maxHeight: 250,
      width: '100%',
      borderBottomWidth: 3,
      // borderWidth: 1, 
      // borderColor: 'blue',
    },
    column: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    columnTitle: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 24,
      marginBottom: 8,
      textAlign: 'left',
    },
    componentContainer: {
      flex: 1,
      height: '100%',
    },
    placeholderText: {
      color: Colors[theme].unselectedText,
    },
    mainContainer: {
      flex: 1,
      marginHorizontal: 8,
      // marginBottom: 20,
      // borderWidth: 1,
      // borderColor: 'green',
    },
    flashcardsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 8,
    },
    flashcardsTitle: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 24,
      color: Colors[theme].text,
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
      color: Colors.light.brandColor1,
    },
  //   selectButtonAbsolute: {
  //     position: 'relative',
  //     right: 0,
  //     top: 0,
  //   },
    topicsScrollView: {
      flex: 1,
    },
    topicsScrollViewContent: {
      paddingVertical: 8,
    },
    topicsPillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    topicPill: {
      backgroundColor: Colors.light.brandColor1,
      borderRadius: 30,
      height: 30,
      minWidth: 50,
      maxWidth: 120,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
      marginBottom: 6,
    },
    topicPillText: {
      fontFamily: Fonts.bodyBold,
      fontWeight: '700',
      fontSize: 14,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    questionTypeCountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    questionTypeCountText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 16,
      color: Colors[theme].text,
    },
    qnTypesScrollView: {
      flex: 1,
    },
    qnTypesScrollViewContent: {
      paddingVertical: 8,
    },
    mainScrollView: {
      flex: 1,
      // borderWidth: 1,
      // borderColor: 'red',
      marginBottom: 10,
    },
    mainScrollViewContent: {
      flexGrow: 1,
      // alignItems: 'center',
      // borderWidth: 1,
      // borderColor: 'blue',
    },
    actionButtonsRow: {
      position: 'absolute',
      top: 18,
      right: 0,
      left: 0,
      zIndex: 1,
    },
    cardForFlashcard: {
      borderRadius: 10,
      height: 105,
      backgroundColor: Colors[theme].secondaryShade,
      width: '100%',
      marginVertical: 8,
      padding: 16,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      marginTop: -5
    },
    difficultyPill: {
      width: 41,
      height: 23,
      borderRadius: 21,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    difficultyPillText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 13,
    },
    cardQnContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardQnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 14,
      color: Colors[theme].text,
      textAlign: 'center',
    },
    flashcardsGridContainer: {
      marginTop: 0,
    },
    flashcardsGridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    flashcardCol: {
      flex: 1,
      marginHorizontal: 4,
    },
    cardForFlashcardSelected: {
      backgroundColor: Colors[theme].unselectedText,
    },
    greenTickContainer: {
      position: 'absolute',
      right: 5,
      bottom: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flashcardsListContainer: {
      marginTop: 8,
    },
    flashcardListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 60,
      width: '100%',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[theme].graphLineColor,
      backgroundColor: 'transparent',
    },
    flashcardListRowLeft: {
      width: 25,
      marginLeft: -15
    },
    flashcardListQn: {
      flex: 1,
      fontFamily: Fonts.bodyMedium,
      fontSize: 20,
      color: Colors[theme].text,
      marginHorizontal: 12,
    },
    flashcardListEyeIcon: {
      marginLeft: 8,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 16,
      color: Colors[theme].text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25,
    },
    emptyText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 16,
      color: Colors[theme].text,
    },
  });

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
        <View style={[styles.topBar, { top: getTopBarTopHeight()}]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.headerIconsContainer, { top: getHeaderIconsTopHeight()}]}>
            <ViewFlashcardsTopBar 
              onStudyPress={handleStudyPress}
              onQuizPress={handleQuizPress}
              onGridPress={handleGridPress}
              onListPress={handleListPress}
              viewMode={viewMode}
            />
          </View>

          <ScrollView
            style={[styles.mainScrollView, { marginTop: getContentTopHeight()}]}
            contentContainerStyle={[
              styles.mainScrollViewContent,
              isSelectMode && { paddingBottom: 60 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
            {/* First Column - Title */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>{COLUMN_TITLES.topics}</Text>
              <View style={styles.componentContainer}>
                <ScrollView 
                  style={styles.topicsScrollView}
                  contentContainerStyle={styles.topicsScrollViewContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {isLoadingTopics ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>{LOADING.topics}</Text>
                    </View>
                  ) : topics.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>{EMPTY.topics}</Text>
                    </View>
                  ) : (
                    <View style={styles.topicsPillsWrap}>
                      {topics.map((topic, index) => (
                        <TopicPill key={index} text={topic} />
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
            
            {/* Second Column - Question Types */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>{COLUMN_TITLES.qnTypes}</Text>
              <View style={styles.componentContainer}>
                <ScrollView 
                  style={styles.qnTypesScrollView}
                  contentContainerStyle={styles.qnTypesScrollViewContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {isLoadingFlashcards ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>{LOADING.qnTypes}</Text>
                    </View>
                  ) : questionTypes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>{EMPTY.qnTypes}</Text>
                    </View>
                  ) : (
                    questionTypes.map((item, idx) => (
                      <QuestionTypeCountRow key={idx} title={item.title} count={item.count} />
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
          
          <View style={styles.mainContainer}>
            {/* Animated ActionButtonsRow above the header row, absolutely positioned */}
            <Animated.View style={[
              styles.actionButtonsRow,
              {
                opacity: actionRowOpacity,
                transform: [{ translateY: actionRowTranslateY }],
                zIndex: 1,
              }
            ]}>
              <ActionButtonsRow
                iconNames={['trash']}
                onCancel={handleCancel}
                onIconPress={handleActionIconPress}
                iconColors={['#FF3B30']}
                style={{ opacity: isSelectMode ? 1 : 0, pointerEvents: isSelectMode ? 'auto' : 'none', marginRight: -15}}
              />
            </Animated.View>
            {/* Flashcards title row */}
            <Animated.View style={[styles.flashcardsHeaderRow, { transform: [{ translateY: headerTranslateY }] }]}> 
              <Text style={styles.flashcardsTitle}>{COLUMN_TITLES.flashcards}</Text>
              <TouchableOpacity 
                onPress={isSelectMode ? handleSelectAll : handleSelect}
                style={styles.selectButtonContainer}
              >
                <Animated.Text style={styles.selectButton}>
                  {isSelectMode ? COLUMN_TITLES.selectAll : COLUMN_TITLES.select}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>
            {/* Flashcards grid */}
            {viewMode === 'grid' && (
              <Animated.View style={[styles.flashcardsGridContainer, { transform: [{ translateY: headerTranslateY }] }]}> 
                {isLoadingFlashcards ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{LOADING.flashcards}</Text>
                  </View>
                ) : flashcards.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{EMPTY.flashcards}</Text>
                  </View>
                ) : (
                  chunkArray(flashcards, 2).map((row, rowIdx) => (
                    <View style={styles.flashcardsGridRow} key={rowIdx}>
                      {row.map((card, colIdx) => {
                        const flatIdx = rowIdx * 2 + colIdx;
                        return (
                          <View style={styles.flashcardCol} key={colIdx}>
                            <CardForFlashcard
                              flashcardDifficulty={card.difficultyRating as any}
                              flashcardQn={card.questionText || ''}
                              flashcardQnType={card.questionType}
                              selected={selectedCardIndexes.includes(flatIdx)}
                              isSelectMode={isSelectMode}
                              onPress={() => handleCardPress(flatIdx)}
                              flashcardIdx={flatIdx}
                              onNavigate={handleNavigateToFlashcardView}
                              flashcards={flashcards}
                              isFavorited={card.isFavorited === 1}
                              onToggleFavorite={() => toggleFavorite(flatIdx)}
                            />
                          </View>
                        );
                      })}
                      {row.length === 1 && <View style={styles.flashcardCol} />}
                    </View>
                  ))
                )}
              </Animated.View>
            )}
            {viewMode === 'list' && (
              <Animated.View style={[styles.flashcardsListContainer, { transform: [{ translateY: headerTranslateY }] }]}>
                {isLoadingFlashcards ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{LOADING.flashcards}</Text>
                  </View>
                ) : flashcards.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{EMPTY.flashcards}</Text>
                  </View>
                ) : (
                  flashcards.map((card, i) => {
                    // Determine what text to display based on flashcardQnType
                    const getDisplayText = () => {
                      if (card.questionType === 'text') {
                        return card.questionText || '';
                      } else if (card.questionType === 'image') {
                        return strings[language].viewFlashcardsPage.imagePlaceholder;
                      } else if (card.questionType === 'audio') {
                        return strings[language].viewFlashcardsPage.audioPlaceholder;
                      }
                      return card.questionText || ''; // fallback
                    };

                    return (
                      <View key={i} style={[styles.flashcardListRow, i === 0 && { borderTopWidth: 1, borderTopColor: '#ECECEC' }]}>
                        <View style={styles.flashcardListRowLeft}>  
                          <FavoriteButton size={25} favorited={card.isFavorited === 1} onPress={() => toggleFavorite(i)} />
                        </View>
                        <Text style={styles.flashcardListQn} numberOfLines={2} ellipsizeMode="tail">{getDisplayText()}</Text>
                        {isSelectMode ? (
                          <CircleSelectButtonGreen
                            selected={selectedCardIndexes.includes(i)}
                            onPress={() => handleCardPress(i)}
                          />
                        ) : (
                          <TouchableOpacity onPress={() => handleNavigateToFlashcardView(i)}>
                            <Ionicons name="eye" size={24} color="#444" style={styles.flashcardListEyeIcon} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </Animated.View>
            )}
          </View>
          </ScrollView>
          
          {!isSelectMode && (
            <FloatingActionButton
              style={styles.fab}
              backgroundColor="#44B88A"
            >
              <Feather name="plus" size={38} color="white" />
            </FloatingActionButton>
          )}    
        </ThemedView>
      </SafeAreaView>
    </Animated.View>
  );
}