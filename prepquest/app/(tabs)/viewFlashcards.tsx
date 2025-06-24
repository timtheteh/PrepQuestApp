import React, { useRef, useEffect, useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Animated, Text, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useIsFocused } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from './_layout';
import { ViewFlashcardsTopBar } from '@/components/ViewFlashcardsTopBar';

const SCREEN_TRANSITION_DURATION = 300;

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

export default function ViewFlashcardsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const { deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, mode } = useLocalSearchParams();
  const { 
    navbarRef,
    currentMode
  } = useContext(MenuContext);

  // View state management - always start in "grid" state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Clean up animation when component unmounts
  useEffect(() => {
    return () => {
      screenOpacity.setValue(0);
    };
  }, []);

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
            contentContainerStyle={styles.mainScrollViewContent}    
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
                >
                  {dummyQuestionTypes.map((item, idx) => (
                    <QuestionTypeCountRow key={idx} title={item.title} count={item.count} />
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
          
          <View style={styles.mainContainer}>
            {/* Flashcards title row */}
            <View style={styles.flashcardsHeaderRow}>
              <Text style={styles.flashcardsTitle}>Flashcards</Text>
                <TouchableOpacity 
                    // onPress={isSelectMode ? handleSelectAll : handleSelect}
                    style={styles.selectButtonContainer}
                    >
                    <Animated.Text style={[
                        styles.selectButton,
                        // styles.selectButtonAbsolute,
                        // { opacity: selectOpacity }
                        ]}>
                        Select
                    </Animated.Text>
                </TouchableOpacity>
            </View>
            {/* Content will go here - will be affected by viewMode state */}
            {/* TODO: Add grid/list view content based on viewMode */}
          </View>
          </ScrollView>
          
          
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
    borderWidth: 1,
    borderColor: 'green',
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
    borderWidth: 1,
    borderColor: 'blue',
  },
}); 