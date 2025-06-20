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
import { useState, useRef, useEffect, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';

const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
const BOTTOM_SPACING = 40; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down
const SCREEN_TRANSITION_DURATION = 200; // Match navbar animation duration

const cardDesigns = [
  {
    background: require('@/assets/images/deckCover1.png'),
    pressed: require('@/assets/images/deckCover1Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover2.png'),
    pressed: require('@/assets/images/deckCover2Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover3.png'),
    pressed: require('@/assets/images/deckCover3Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover4.png'),
    pressed: require('@/assets/images/deckCover4Pressed.png'),
  },
];

const studySubjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Literature'
];
const studyCardData = [
  {
    percent: 10,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Mathematics Study Prep',
    date: 'Dec 15, 2024',
    flashcardCount: 45,
  },
  {
    percent: 25,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Physics Study Prep',
    date: 'Dec 12, 2024',
    flashcardCount: 32,
  },
  {
    percent: 50,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Chemistry A Level Prep',
    date: 'Dec 10, 2024',
    flashcardCount: 67,
  },
  {
    percent: 75,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Biology SAT Prep',
    date: 'Dec 8, 2024',
    flashcardCount: 89,
  },
  {
    percent: 100,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'History SAT Prep',
    date: 'Dec 5, 2024',
    flashcardCount: 123,
  },
  {
    percent: 0,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Geography Study Prep',
    date: 'Dec 3, 2024',
    flashcardCount: 56,
  },
  {
    percent: 60,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Economics A Level Prep',
    date: 'Dec 1, 2024',
    flashcardCount: 78,
  },
  {
    percent: 90,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    isSelectMode: false,
    title: 'Literature Exam Prep',
    date: 'Nov 28, 2024',
    flashcardCount: 94,
  },
];

const interviewRoles = [
  'Frontend Developer', 'Backend Developer', 'Data Scientist', 'DevOps Engineer', 'Mobile Engineer', 'QA Engineer'
];
const interviewTypeLabels = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  'case study': 'Case Study',
  brainteasers: 'Brainteasers',
  others: 'Others',
};
const interviewCardData = [
  {
    percent: 15,
    image: require('@/assets/companyIcons/GoogleIcon.png'),
    cardType: 'behavioral',
    isSelectMode: false,
    title: 'Frontend Developer Behavioral Prep',
    date: 'Dec 14, 2024',
    flashcardCount: 28,
  },
  {
    percent: 40,
    image: require('@/assets/companyIcons/MetaIcon.png'),
    cardType: 'technical',
    isSelectMode: false,
    title: 'Backend Developer Technical Prep',
    date: 'Dec 11, 2024',
    flashcardCount: 52,
  },
  {
    percent: 100,
    image: require('@/assets/companyIcons/JPMIcon.png'),
    cardType: 'case study',
    isSelectMode: false,
    title: 'Data Scientist Case Study Prep',
    date: 'Dec 9, 2024',
    flashcardCount: 41,
  },
  {
    percent: 80,
    image: require('@/assets/companyIcons/GoogleIcon.png'),
    cardType: 'brainteasers',
    isSelectMode: false,
    title: 'DevOps Engineer Brainteasers Prep',
    date: 'Dec 7, 2024',
    flashcardCount: 35,
  },
  {
    percent: 55,
    image: require('@/assets/companyIcons/MetaIcon.png'),
    cardType: 'others',
    isSelectMode: false,
    title: 'Mobile Engineer Others Prep',
    date: 'Dec 4, 2024',
    flashcardCount: 63,
  },
  {
    percent: 0,
    image: require('@/assets/companyIcons/JPMIcon.png'),
    cardType: 'technical',
    isSelectMode: false,
    title: 'QA Engineer Technical Prep',
    date: 'Dec 2, 2024',
    flashcardCount: 47,
  },
];

export default function DecksScreen() {
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedStudyCards, setSelectedStudyCards] = useState<Set<number>>(new Set());
  const [selectedInterviewCards, setSelectedInterviewCards] = useState<Set<number>>(new Set());
  const [studyCardsCount, setStudyCardsCount] = useState(0);
  const [interviewCardsCount, setInterviewCardsCount] = useState(0);
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

  const selectUnselectedDuration = 300;

  // Update card counts
  useEffect(() => {
    setStudyCardsCount(8); // Current number of study cards
    setInterviewCardsCount(6); // Current number of interview cards
  }, []); // Empty dependency array as these are constant in the current implementation

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
        
        // Trigger selection mode animations
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
        
        // Navigate to folders in AddToFolders mode
        if (Platform.OS === 'ios') {
          navbarRef?.current?.resetAnimation();
          setTimeout(() => {
            router.push({
              pathname: '/(tabs)/folders',
              params: { 
                isAddToFolders: 'true',
                previousMode: isInterviewMode ? 'interview' : 'study',
                selectedState: 'true'
              }
            });
          }, 50);
        } else {
          router.push({
            pathname: '/(tabs)/folders',
            params: { 
              isAddToFolders: 'true',
              previousMode: isInterviewMode ? 'interview' : 'study',
              selectedState: 'true'
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
      const allInterviewIndices = new Set(Array.from({ length: interviewCardsCount }, (_, i) => i));
      setSelectedInterviewCards(allInterviewIndices);
    } else {
      const allStudyIndices = new Set(Array.from({ length: studyCardsCount }, (_, i) => i));
      setSelectedStudyCards(allStudyIndices);
    }
  };

  const renderStudyCards = () => {
    const cards = studyCardData.map((data, index) => {
      const design = cardDesigns[index % 4];
      const style = index === 0 ? styles.firstCard : styles.card;
      return (
        <Card
          key={`study-${index}`}
          style={style}
          backgroundImage={design.background}
          pressedBackgroundImage={design.pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedStudyCards.has(index)}
          onSelectPress={() => handleStudyCardSelection(index, !selectedStudyCards.has(index))}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.percent}
          showProgress={!isSelectMode}
          image={data.image}
          cardType={data.cardType}
          title={data.title}
          date={data.date}
          flashcardCount={data.flashcardCount}
        />
      );
    });
    return cards;
  };

  const renderInterviewCards = () => {
    const cards = interviewCardData.map((data, index) => {
      const design = cardDesigns[(index + 2) % 4];
      const style = index === 0 ? styles.firstCard : styles.card;
      return (
        <Card
          key={`interview-${index}`}
          style={style}
          backgroundImage={design.background}
          pressedBackgroundImage={design.pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedInterviewCards.has(index)}
          onSelectPress={() => handleInterviewCardSelection(index, !selectedInterviewCards.has(index))}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.percent}
          showProgress={!isSelectMode}
          image={data.image}
          cardType={data.cardType}
          title={data.title}
          date={data.date}
          flashcardCount={data.flashcardCount}
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
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: slidingMenuDuration,
      useNativeDriver: true,
    }).start();
  };

  const handleFolderPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // Navigate to folders
    if (Platform.OS === 'ios') {
      navbarRef?.current?.resetAnimation();
      setTimeout(() => {
        router.push('/(tabs)/folders');
      }, 50);
    } else {
      router.push('/(tabs)/folders');
      setTimeout(() => {
        navbarRef?.current?.resetAnimation();
      }, 50);
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
              pageType="decks"
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={styles.content}>
              <RoundedContainer 
                leftLabel="Study"
                rightLabel="Interview"
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
                      My Study Decks
                    </Title>
                    <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                      My Interview Decks
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
    marginTop: Dimensions.get('window').height < 670 ? 0 : 26,
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
