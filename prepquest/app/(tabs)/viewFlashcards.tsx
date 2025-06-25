import React, { useRef, useEffect, useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Animated, Text, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useIsFocused } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from './_layout';
import { ViewFlashcardsTopBar } from '@/components/ViewFlashcardsTopBar';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import GreenTickIcon from '@/assets/icons/GreenTickIcon.svg';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteButton } from '@/components/FavoriteButton';
import { CircleSelectButtonGreen } from '@/components/CircleSelectButtonGreen';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import Feather from '@expo/vector-icons/Feather';

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
  flashcardIdx
}: {
  flashcardDifficulty: 'Again' | 'Hard' | 'Good' | 'Easy';
  flashcardQn: string;
  flashcardQnType: string;
  selected: boolean;
  isSelectMode: boolean;
  onPress: () => void;
  flashcardIdx: number;
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
        <TouchableOpacity onPress={() => router.push({
            pathname: '/flashcardView',
            params: {
                flashcardIdx: flashcardIdx.toString(),
            }
        })}>
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
    </Container>
  );
};

// Dummy flashcard data
const dummyFlashcards = [
    // text Qn -> text Ans
  { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'text', flashcardAnswer: 'A react hook is a function that allows you to use state and other react features in functional components.' },
  // text Qn (Cloze) -> text Ans
  { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'A React Hook is a special function that allows functional components to <blank> into React features like state and lifecycle methods without using class components.', flashcardAnswerType: 'text', flashcardAnswer: 'A react hook is a function that allows you to use state and other react features in functional components.' },
  // image Qn (jpg) -> text Ans
  { flashcardDifficulty: 'Hard', flashcardQnType: 'image', flashcardQn: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg'), flashcardAnswerType: 'text', flashcardAnswer: 'UseEffect is a hook that allows you to perform side effects in functional components.' },
  // image Qn (HEIC) -> text Ans
//   { flashcardDifficulty: 'Easy', flashcardQnType: 'image', flashcardQn: require('@/assets/dummyPhotos/dummy_HEIC_photo.HEIC'), flashcardAnswerType: 'text', flashcardAnswer: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum." },
  // audio Qn (m4a) -> text Ans
  { flashcardDifficulty: 'Good', flashcardQnType: 'audio', flashcardQn: require('@/assets/dummyAudio/dummy_m4a_audio.m4a'), flashcardAnswerType: 'text', flashcardAnswer: 'State is a way to store data that can change over time.' },
//   // audio Qn (ogg) -> text Ans
//   { flashcardDifficulty: 'Good', flashcardQnType: 'audio', flashcardQn: require('@/assets/dummyAudio/dummy_ogg_audio.ogg'), flashcardAnswerType: 'text', flashcardAnswer: 'State is a way to store data that can change over time.' },
  
  // text Qn -> MCQ Ans
  { flashcardDifficulty: 'Again', flashcardQnType: 'text', flashcardQn: 'How do you use useState?', flashcardAnswerType: 'MCQ', flashcardAnswer: 
    [
    {   "Qn": "Lorem Ipsum is simply dummy text of the printi",
        "Ans": false
    }, 
    {   "Qn": "has been the industry's standard dummy text ever since the 1500s, when an unknown p",
        "Ans": false
    }, 
    {   "Qn": "s, but also the leap into electronic typesetting, remaining essentially unchanged",
        "Ans": false
    }, 
    {   "Qn": "lishing software like Aldus PageMaker including versions of",
        "Ans": true
    }] 
},
    // text Qn -> voice recorded
  { flashcardDifficulty: 'Good', flashcardQnType: 'text', flashcardQn: 'What is a component?', flashcardAnswerType: 'voice', flashcardAnswer: null },
  // text Qn -> audio Ans
  { flashcardDifficulty: 'Again', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'audio', flashcardAnswer: require('@/assets/dummyAudio/dummy_m4a_audio.m4a') },
  // text Qn -> image Ans
  { flashcardDifficulty: 'Hard', flashcardQnType: 'text', flashcardQn: 'Explain useEffect.', flashcardAnswerType: 'image', flashcardAnswer: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg') },
];

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
  const { deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, mode } = useLocalSearchParams();
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

  // Dummy topic data
  const dummyTopics = [
    'React',
    'CSS',
    'TypeScript',
    'Mobile Development',
    'UI/UX Design',
    'API Integration',
    'State Management',
    'Navigation',
    'Performance Optimization',
    'Testing',
    'Deployment',
    'Debugging'
  ];

  // Dummy question type data
  const dummyQuestionTypes = [
    { title: 'Multiple Choice', count: 5 },
    { title: 'Short Answer', count: 3 },
    { title: 'Coding', count: 2 },
    { title: 'Essay', count: 1 },
    { title: 'True/False', count: 4 },
  ];

  // Handle screen transitions
  useEffect(() => {
    if (isFocused) {
      // Reset navbar animation when screen comes into focus
      navbarRef?.current?.resetAnimation();
      
      // Reset view mode to grid when screen comes into focus
      setViewMode('grid');
      
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
        mode: mode as string
      }
    });
  };

  const handleStudyPress = () => {
    // TODO: Implement study functionality
    console.log('Study pressed');
  };

  const handleQuizPress = () => {
    // TODO: Implement quiz functionality
    console.log('Quiz pressed');
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
                  <View style={styles.topicsPillsWrap}>
                    {dummyTopics.map((topic, index) => (
                      <TopicPill key={index} text={topic} />
                    ))}
                  </View>
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
                  {dummyQuestionTypes.map((item, idx) => (
                    <QuestionTypeCountRow key={idx} title={item.title} count={item.count} />
                  ))}
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
                {chunkArray(dummyFlashcards, 2).map((row, rowIdx) => (
                  <View style={styles.flashcardsGridRow} key={rowIdx}>
                    {row.map((card, colIdx) => {
                      const flatIdx = rowIdx * 2 + colIdx;
                      return (
                        <View style={styles.flashcardCol} key={colIdx}>
                          <CardForFlashcard
                            flashcardDifficulty={card.flashcardDifficulty as any}
                            flashcardQn={card.flashcardQn}
                            flashcardQnType={card.flashcardQnType}
                            selected={selectedCardIndexes.includes(flatIdx)}
                            isSelectMode={isSelectMode}
                            onPress={() => handleCardPress(flatIdx)}
                            flashcardIdx={flatIdx}
                          />
                        </View>
                      );
                    })}
                    {row.length === 1 && <View style={styles.flashcardCol} />}
                  </View>
                ))}
              </Animated.View>
            )}
            {viewMode === 'list' && (
              <Animated.View style={[styles.flashcardsListContainer, { transform: [{ translateY: headerTranslateY }] }]}>
                {dummyFlashcards.map((card, i) => {
                  // Determine what text to display based on flashcardQnType
                  const getDisplayText = () => {
                    if (card.flashcardQnType === 'text') {
                      return card.flashcardQn;
                    } else if (card.flashcardQnType === 'image') {
                      return '<Image>';
                    } else if (card.flashcardQnType === 'audio') {
                      return '<Audio>';
                    }
                    return card.flashcardQn; // fallback
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
                        <TouchableOpacity>
                          <Ionicons name="eye" size={24} color="#444" style={styles.flashcardListEyeIcon} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
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
}); 