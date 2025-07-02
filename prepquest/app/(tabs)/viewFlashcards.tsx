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

// Function to load flashcards from database
const loadFlashcardsFromDatabase = async (deckId: string, isAIDeck: string): Promise<Flashcard[]> => {
  try {
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
      WHERE deckID = ?
      ORDER BY flashcardID ASC
    `, [parseInt(deckId)]);

    if (!result) {
      return [];
    }

    return result as Flashcard[];
  } catch (error) {
    console.error('Error loading flashcards from database:', error);
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

// Function to load topics from database
const loadTopicsFromDatabase = async (deckId: string, isAIDeck: string): Promise<string[]> => {
  try {
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
    
    const result = await db.getFirstAsync(`
      SELECT deckType, studyTopicsSubtopics, interviewTopics
      FROM ${tableName}
      WHERE deckID = ?
    `, [parseInt(deckId)]);

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
    
    // Parse the JSON string to get the topics array
    try {
      const topics = JSON.parse(topicsField);
      return Array.isArray(topics) ? topics : [];
    } catch (parseError) {
      console.error('Error parsing topics JSON:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error loading topics from database:', error);
    return [];
  }
};

const SCREEN_TRANSITION_DURATION = 300;
const ACTION_ROW_HEIGHT = 60;
const ACTION_ROW_ANIMATION_DURATION = 300;

// Local TopicPill component
const TopicPill = ({ text }: { text: string }) => {
  return (
    <View style={styles.topicPill}>
      <Text style={styles.topicPillText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

// Local QuestionTypeCountRow component
const QuestionTypeCountRow = ({ title, count }: { title: string; count: number }) => (
  <View style={styles.questionTypeCountRow}>
    <Text style={styles.questionTypeCountText}>{title}</Text>
    <Text style={styles.questionTypeCountText}>{count}</Text>
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
  flashcards
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
}) => {
  const router = useRouter();
  const Container = isSelectMode ? TouchableOpacity : View;
  
  // Determine what text to display based on flashcardQnType
  const getDisplayText = () => {
    if (flashcardQnType === 'text') {
      return flashcardQn;
    } else if (flashcardQnType === 'image') {
      return '<Image>';
    } else if (flashcardQnType === 'audio') {
      return '<Audio>';
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
          <Text style={[styles.difficultyPillText]}>{flashcardDifficulty}</Text>
        </View>
        <FavoriteButton size={20}/>
      </View>
      {/* Centered question */}
      <View style={styles.cardQnContainer}>
        <Text
          style={styles.cardQnText}
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
      {typeof flashcardIdx === 'number' && flashcards[flashcardIdx]?.cognitiveQnType && (
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
          <Text style={{ fontSize: 12, color: '#222', textAlign: 'center', fontFamily: 'Satoshi-Medium' }}>
            {flashcards[flashcardIdx].cognitiveQnType} Qn
          </Text>
        </View>
      )}
    </Container>
  );
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
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
  } = useContext(MenuContext);

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
      setHandleDeletion(() => () => {
        setSelectedCardIndexes([]);
        setIsSelectMode(false);
      });
    }
    return () => {
      if (!isFocused) {
        setHandleDeletion(null);
      }
    };
  }, [isFocused]);

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
  const handleSelectAll = () => {/* TODO: select all logic */};
  const handleCancel = () => {
    setIsSelectMode(false);
    setSelectedCardIndexes([]);
  };
  const handleActionIconPress = (index: number) => {
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.5,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (selectedCardIndexes.length === 0) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      Animated.timing(noSelectionModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
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
          >
            <View style={styles.headerRow}>
            {/* First Column - Title */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Topics</Text>
              <View style={styles.componentContainer}>
                <ScrollView 
                  style={styles.topicsScrollView}
                  contentContainerStyle={styles.topicsScrollViewContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {isLoadingTopics ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Loading topics...</Text>
                    </View>
                  ) : topics.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No topics specified</Text>
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
              <Text style={styles.columnTitle}>Qn Types</Text>
              <View style={styles.componentContainer}>
                <ScrollView 
                  style={styles.qnTypesScrollView}
                  contentContainerStyle={styles.qnTypesScrollViewContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {isLoadingFlashcards ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Loading question types...</Text>
                    </View>
                  ) : questionTypes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No question types found</Text>
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
              <Text style={styles.flashcardsTitle}>Flashcards</Text>
              <TouchableOpacity 
                onPress={isSelectMode ? handleSelectAll : handleSelect}
                style={styles.selectButtonContainer}
              >
                <Animated.Text style={styles.selectButton}>
                  {isSelectMode ? 'Select All' : 'Select'}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>
            {/* Flashcards grid */}
            {viewMode === 'grid' && (
              <Animated.View style={[styles.flashcardsGridContainer, { transform: [{ translateY: headerTranslateY }] }]}> 
                {isLoadingFlashcards ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading flashcards...</Text>
                  </View>
                ) : flashcards.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No flashcards found</Text>
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
                    <Text style={styles.loadingText}>Loading flashcards...</Text>
                  </View>
                ) : flashcards.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No flashcards found</Text>
                  </View>
                ) : (
                  flashcards.map((card, i) => {
                    // Determine what text to display based on flashcardQnType
                    const getDisplayText = () => {
                      if (card.questionType === 'text') {
                        return card.questionText || '';
                      } else if (card.questionType === 'image') {
                        return '<Image>';
                      } else if (card.questionType === 'audio') {
                        return '<Audio>';
                      }
                      return card.questionText || ''; // fallback
                    };

                    return (
                      <View key={i} style={[styles.flashcardListRow, i === 0 && { borderTopWidth: 1, borderTopColor: '#ECECEC' }]}>
                        <View style={styles.flashcardListRowLeft}>  
                          <FavoriteButton size={25} />
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
  },
  emptyText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#222',
  },
}); 