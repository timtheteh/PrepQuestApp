import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { MenuButton } from '@/components/MenuButton';
import { useState, useRef, useEffect, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { MenuContext } from './_layout';

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
    setShowSlidingMenu 
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

  const selectUnselectedDuration = 300;

  // Update card counts
  useEffect(() => {
    setStudyCardsCount(8); // Current number of study cards
    setInterviewCardsCount(6); // Current number of interview cards
  }, []); // Empty dependency array as these are constant in the current implementation

  // Handle screen transitions
  useEffect(() => {
    if (isFocused) {
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

  const handleToggle = (isRightSide: boolean) => {
    setIsInterviewMode(isRightSide);
    
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
    switch (index) {
      case 0: // Share
        console.log('Folder pressed');
        break;
      case 1: // Trash
        console.log('Trash pressed');
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
    const cards = Array(8).fill(null).map((_, index) => {
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
        />
      );
    });
    return cards;
  };

  const renderInterviewCards = () => {
    const cards = Array(6).fill(null).map((_, index) => {
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

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.navBar}>
            <MenuButton 
              style={styles.menuButton}
              onPress={handleMenuPress}
            />
            
            <HeaderIconButtons 
              onAIPress={handleSparklesPress}
              onCalendarPress={handleCalendarPress}
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 70 : 16,
  },
  mainContentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  menuButton: {
    padding: 0,
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
