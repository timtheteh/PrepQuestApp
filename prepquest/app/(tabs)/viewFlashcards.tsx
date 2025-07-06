import React, { useRef, useEffect, useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Animated, Text, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from '@/contexts/MenuContext';
import { ViewFlashcardsTopBar } from '@/components/ViewFlashcardsTopBar';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import GreenTickIcon from '@/assets/icons/GreenTickIcon.svg';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteButton } from '@/components/FavoriteButton';
import { CircleSelectButtonGreen } from '@/components/CircleSelectButtonGreen';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import Feather from '@expo/vector-icons/Feather';
import { db } from '@/db/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

// Interface for flashcard data
interface Flashcard {
  flashcardID: number;
  deckID: number;
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText: string | null;
  questionBlob: Uint8Array | null;
  answerType: string;
  answerText: string | null;
  answerMCQ: string | null;
  answerBlob: Uint8Array | null;
  timeTaken: number | null;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}

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
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const { deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, mode, sourcePage, folderTitle, folderId } = useLocalSearchParams();
  const { 
    navbarRef,
    currentMode,
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
  console.log('Current language in viewFlashcards:', language);

  // Localized labels
  const COLUMN_TITLES = {
    topics: language === 'Chinese' ? '主题' : 'Topics',
    qnTypes: language === 'Chinese' ? '题型' : 'Qn Types',
    flashcards: language === 'Chinese' ? '卡片' : 'Flashcards',
    select: language === 'Chinese' ? '选择' : 'Select',
    selectAll: language === 'Chinese' ? '全选' : 'Select All',
  };
  const LOADING = {
    topics: language === 'Chinese' ? '正在加载主题...' : 'Loading topics...',
    qnTypes: language === 'Chinese' ? '正在加载题型...' : 'Loading question types...',
    flashcards: language === 'Chinese' ? '正在加载卡片...' : 'Loading flashcards...'
  };
  const EMPTY = {
    topics: language === 'Chinese' ? '未指定主题' : 'No topics specified',
    qnTypes: language === 'Chinese' ? '未找到题型' : 'No question types found',
    flashcards: language === 'Chinese' ? '未找到卡片' : 'No flashcards found',
  };
  const DIFFICULTY_LABELS: Record<string, string> = {
    Again: language === 'Chinese' ? '重来' : 'Again',
    Hard: language === 'Chinese' ? '困难' : 'Hard',
    Good: language === 'Chinese' ? '良好' : 'Good',
    Easy: language === 'Chinese' ? '简单' : 'Easy',
    None: language === 'Chinese' ? '无' : 'None',
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

  // Helper function to get current userID from AsyncStorage
  async function getCurrentUserID(): Promise<string> {
    try {
      const userID = await AsyncStorage.getItem('userID');
      return userID || '1'; // Default to '1' if not found
    } catch (error) {
      console.error('Error getting userID from AsyncStorage:', error);
      return '1'; // Default to '1' on error
    }
  }

  // Function to load flashcards from database
  const loadFlashcardsFromDatabase = async (deckId: string, isAIDeck: string): Promise<Flashcard[]> => {
    try {
      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeck === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      
      const result = await db.getAllAsync(`
        SELECT 
          flashcardID,
          deckID,
          difficultyRating,
          cognitiveQnType,
          isFavorited,
          questionType,
          questionText,
          questionBlob,
          answerType,
          answerText,
          answerMCQ,
          answerBlob,
          timeTaken,
          isMcqAnswerRight,
          lastStudiedDate,
          lastQuizzedDate
        FROM ${tableName}
        WHERE deckID = ? AND userID = ?
        ORDER BY 
          CASE difficultyRating
            WHEN 'None' THEN 1
            WHEN 'Easy' THEN 2
            WHEN 'Good' THEN 3
            WHEN 'Hard' THEN 4
            WHEN 'Again' THEN 5
            ELSE 6
          END,
          flashcardID ASC
      `, [parseInt(deckId), userID]);
  
      if (!result) {
        return [];
      }
  
      return result as Flashcard[];
    } catch (error) {
      console.error('Error loading flashcards from database:', error);
      return [];
    }
  };

  // Function to load topics from database
  const loadTopicsFromDatabase = async (deckId: string, isAIDeck: string): Promise<string[]> => {
    try {
      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeck === 'true';
      const tableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
      
      const result = await db.getFirstAsync(`
        SELECT deckType, studyTopicsSubtopics, interviewTopics
        FROM ${tableName}
        WHERE deckID = ? AND userID = ?
      `, [parseInt(deckId), userID]);
  
      if (!result) {
        return [];
      }
  
      const deck = result as { deckType: string; studyTopicsSubtopics: string | null; interviewTopics: string | null };
      
      let topicsField: string | null = null;
      
      if (deck.deckType === 'study') {
        topicsField = deck.studyTopicsSubtopics;
      } else if (deck.deckType === 'interview') {
        topicsField = deck.interviewTopics;
      }
      
      if (!topicsField) {
        return [];
      }
      
      // Parse the JSON string to get the topics array safely
      return safeParseJSON(topicsField, []);
    } catch (error) {
      console.error('Error loading topics from database:', error);
      return [];
    }
  };

  // Function to calculate question type counts from flashcards data
  const calculateQuestionTypeCounts = (flashcards: Flashcard[]): { title: string; count: number }[] => {
    const counts: { [key: string]: number } = {};
    
    flashcards.forEach(flashcard => {
      const cognitiveQnType = flashcard.cognitiveQnType;
      counts[cognitiveQnType] = (counts[cognitiveQnType] || 0) + 1;
    });
    
    // Convert to array and sort by count (descending)
    return Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Function to load flashcards
  const loadFlashcards = async () => {
    try {
      setIsLoadingFlashcards(true);
      const loadedFlashcards = await loadFlashcardsFromDatabase(deckId as string, isAIDeck as string);
      setFlashcards(loadedFlashcards);
      console.log('Loaded flashcards:', loadedFlashcards.length);
      const questionTypeCounts = calculateQuestionTypeCounts(loadedFlashcards);
      setQuestionTypes(questionTypeCounts);
      console.log('Loaded question types:', questionTypeCounts);
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
      console.log('Loaded topics:', loadedTopics);
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
      const flashcard = flashcards[flashcardIdx];
      if (!flashcard) return;

      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeck === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const newFavoriteStatus = flashcard.isFavorited === 1 ? 0 : 1;

      // Update database
      await db.runAsync(`
        UPDATE ${tableName}
        SET isFavorited = ?
        WHERE flashcardID = ? AND userID = ?
      `, [newFavoriteStatus, flashcard.flashcardID, userID]);

      // Update local state
      setFlashcards(prev => prev.map((card, idx) => 
        idx === flashcardIdx 
          ? { ...card, isFavorited: newFavoriteStatus }
          : card
      ));

      console.log(`Flashcard ${flashcard.flashcardID} favorite status updated to ${newFavoriteStatus}`);
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
      console.log('✅ viewFlashcards: Setting deckId in context:', deckId);
    }
    if (deckType) {
      setCurrentDeckType(deckType as string);
      console.log('✅ viewFlashcards: Setting deckType in context:', deckType);
    }
  }, [deckId, deckType, setCurrentDeckId, setCurrentDeckType]);

  const handleBackPress = () => {
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
  };

  const handleStudyPress = () => {
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
  };

  const handleQuizPress = () => {
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
  };

  const handleGridPress = () => {
    setViewMode('grid');
    console.log('Grid view activated');
  };

  const handleListPress = () => {
    setViewMode('list');
    console.log('List view activated');
  };

  // Action row handlers
  const handleSelect = () => setIsSelectMode(true);
  const handleSelectAll = () => {
    if (selectedCardIndexes.length === flashcards.length) {
      // If all are selected, deselect all
      setSelectedCardIndexes([]);
    } else {
      // Otherwise, select all
      setSelectedCardIndexes(flashcards.map((_, idx) => idx));
    }
  };
  const handleCancel = () => {
    setIsSelectMode(false);
    setSelectedCardIndexes([]);
  };
  const handleActionIconPress = (index: number) => {
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
      setDeleteModalText('Are you sure you want to delete these flashcard(s)?');
      Animated.timing(trashModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Function to delete selected flashcards
  const deleteSelectedFlashcards = async () => {
    try {
      if (selectedCardIndexes.length === 0) return;

      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeck === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
      
      // Get the flashcard IDs to delete
      const flashcardIdsToDelete = selectedCardIndexes.map(idx => flashcards[idx].flashcardID);
      
      // Delete from database
      const placeholders = flashcardIdsToDelete.map(() => '?').join(',');
      await db.runAsync(`
        DELETE FROM ${tableName}
        WHERE flashcardID IN (${placeholders}) AND userID = ?
      `, [...flashcardIdsToDelete, userID]);

      // Update the deck's lastModifiedDate since flashcards were deleted
      await db.runAsync(`
        UPDATE ${deckTableName}
        SET lastModifiedDate = '${new Date().toISOString()}'
        WHERE deckID = ? AND userID = ?
      `, [parseInt(deckId as string), userID]);
      console.log(`Updated lastModifiedDate for deck ${deckId} after flashcard deletion`);

      // Update local state by removing deleted flashcards
      setFlashcards(prev => prev.filter((_, idx) => !selectedCardIndexes.includes(idx)));
      
      // Recalculate question types after deletion
      const updatedFlashcards = flashcards.filter((_, idx) => !selectedCardIndexes.includes(idx));
      const questionTypeCounts = calculateQuestionTypeCounts(updatedFlashcards);
      setQuestionTypes(questionTypeCounts);

      console.log(`Deleted ${selectedCardIndexes.length} flashcards from ${tableName}`);
      
      // Reset selection mode
      setSelectedCardIndexes([]);
      setIsSelectMode(false);
    } catch (error) {
      console.error('Error deleting flashcards:', error);
    }
  };

  // Handler to navigate to flashcard view
  const handleNavigateToFlashcardView = (flashcardIdx: number) => {
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
  };

  // Handler to toggle card selection
  const handleCardPress = (cardIdx: number) => {
    if (!isSelectMode) return;
    setSelectedCardIndexes((prev) =>
      prev.includes(cardIdx)
        ? prev.filter((idx) => idx !== cardIdx)
        : [...prev, cardIdx]
    );
  };

  function chunkArray<T>(arr: T[], size: number): T[][] {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  }

  // Local TopicPill component
  const TopicPill = ({ text }: { text: string }) => {
    return (
      <View style={styles.topicPill}>
        <Text style={[styles.topicPillText, language === 'Chinese' && { 
          // fontFamily: 'NotoSansSC-Medium' 
          }]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    );
  };

  // Local QuestionTypeCountRow component
  const QuestionTypeCountRow = ({ title, count }: { title: string; count: number }) => (
    <View style={styles.questionTypeCountRow}>
      <Text style={[styles.questionTypeCountText, language === 'Chinese' && {
        //  fontFamily: 'NotoSansSC-Medium' 
         }]}>{getCognitiveQnTypeLabel(title)}</Text>
      <Text style={[styles.questionTypeCountText, language === 'Chinese' && { 
        // fontFamily: 'NotoSansSC-Medium' 
        }]}>{count}</Text>
    </View>
  );

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
        return language === 'Chinese' ? '<图片>' : '<Image>';
      } else if (flashcardQnType === 'audio') {
        return language === 'Chinese' ? '<音频>' : '<Audio>';
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
            numberOfLines={2}
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
              {getCognitiveQnTypeLabel(flashcards[flashcardIdx].cognitiveQnType)} {language === 'Chinese' ? '题' : 'Qn'}
            </Text>
          </View>
        )}
      </Container>
    );
  };

  const SCREEN_TRANSITION_DURATION = 300;
  const ACTION_ROW_HEIGHT = 60;
  const ACTION_ROW_ANIMATION_DURATION = 300;

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
            <ViewFlashcardsTopBar 
              onStudyPress={handleStudyPress}
              onQuizPress={handleQuizPress}
              onGridPress={handleGridPress}
              onListPress={handleListPress}
              viewMode={viewMode}
            />
          </View>

          <ScrollView
            style={styles.mainScrollView}
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
                        return language === 'Chinese' ? '<图片>' : '<Image>';
                      } else if (card.questionType === 'audio') {
                        return language === 'Chinese' ? '<音频>' : '<Audio>';
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'left',
  },
  componentContainer: {
    flex: 1,
    height: '100%',
  },
  placeholderText: {
    color: '#808080',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    color: '#222',
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
    backgroundColor: '#44B88A',
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
    fontFamily: 'Satoshi-Variable',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#222',
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
    marginTop: Platform.OS === 'android' ? 132 : 78,
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
    backgroundColor: '#F8F8F8',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
  },
  cardQnContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardQnText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#111',
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
    backgroundColor: '#D5D4DD',
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
    borderBottomColor: '#ECECEC',
    backgroundColor: 'transparent',
  },
  flashcardListRowLeft: {
    width: 25,
    marginLeft: -15
  },
  flashcardListQn: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#222',
    marginHorizontal: 12,
  },
  flashcardListEyeIcon: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
    right: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#222',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  emptyText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#222',
  },
});