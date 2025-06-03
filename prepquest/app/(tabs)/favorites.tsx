import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons, HeaderIconButtonsRef, CALENDAR_TITLES } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';
import { FolderCard } from '@/components/FolderCard';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { useState, useRef, useEffect, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';

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

export default function FavoritesScreen() {
  const [isFavFoldersMode, setIsFavFoldersMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFavDeckCards, setSelectedFavDeckCards] = useState<Set<number>>(new Set());
  const [selectedFavFolderCards, setSelectedFavFolderCards] = useState<Set<number>>(new Set());
  const [favDeckCardsCount, setFavDeckCardsCount] = useState(0);
  const [favFolderCardsCount, setFavFolderCardsCount] = useState(0);
  const [previousMode, setPreviousMode] = useState<'study' | 'interview'>('study');
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
    navbarRef,
    setIsAIPromptOpen,
    setIsCalendarOpen,
    setCalendarTitle,
    setIsAddDeckOpen,
    addDeckOpacity
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
  const { mode } = useLocalSearchParams();

  const selectUnselectedDuration = 300;

  // Define opacity interpolations
  const studyOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const interviewOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Handle screen transitions and set previous mode
  useEffect(() => {
    if (isFocused) {
      // Reset header icons state when screen comes into focus
      headerIconsRef.current?.reset();
      
      // Set the previous mode from route params
      if (mode === 'study' || mode === 'interview') {
        setPreviousMode(mode);
      }
      
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: SCREEN_TRANSITION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      screenOpacity.setValue(0);
    }
  }, [isFocused, mode]);

  const handleBackPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // Navigate back to decks page in previous mode
    if (Platform.OS === 'ios') {
      navbarRef?.current?.setDecksTab();
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)',
          params: {
            mode: previousMode
          }
        });
      }, 50);
    } else {
      router.push({
        pathname: '/(tabs)',
        params: {
          mode: previousMode
        }
      });
      setTimeout(() => {
        navbarRef?.current?.setDecksTab();
      }, 50);
    }
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsFavFoldersMode(isRightSide);
    setCurrentMode(isRightSide ? 'interview' : 'study');
    
    // Clear the selection state for the mode we're leaving
    if (isRightSide) {
      setSelectedFavDeckCards(new Set());
    } else {
      setSelectedFavFolderCards(new Set());
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

  const handleFabPress = () => {
    if (isFavFoldersMode) {
      console.log("Favorite Folders FAB clicked!");
    } else {
      setIsMenuOpen(true);
      setIsAddDeckOpen(true);
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(addDeckOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  // Update card counts
  useEffect(() => {
    setFavDeckCardsCount(8); // Current number of favorite deck cards
    setFavFolderCardsCount(6); // Current number of favorite folder cards
  }, []);

  const renderFavDeckCards = () => {
    const cards = Array(8).fill(null).map((_, index) => {
      const design = cardDesigns[index % 4];
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <Card
          key={`favDeck-${index}`}
          style={style}
          backgroundImage={design.background}
          pressedBackgroundImage={design.pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedFavDeckCards.has(index)}
          onSelectPress={() => {
            setSelectedFavDeckCards(prev => {
              const newSet = new Set(prev);
              if (prev.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              return newSet;
            });
          }}
          circleButtonOpacity={circleButtonOpacity}
        />
      );
    });
    return cards;
  };

  const renderFavFolderCards = () => {
    const cards = Array(6).fill(null).map((_, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <FolderCard
          key={`favFolder-${index}`}
          style={style}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedFavFolderCards.has(index)}
          onSelectPress={() => {
            setSelectedFavFolderCards(prev => {
              const newSet = new Set(prev);
              if (prev.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              return newSet;
            });
          }}
          circleButtonOpacity={circleButtonOpacity}
        />
      );
    });
    return cards;
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
            <HeaderIconButtons 
              ref={headerIconsRef}
              pageType="favorites"
              onAIPress={() => {
                setIsMenuOpen(true);
                setIsAIPromptOpen(true);
                Animated.timing(menuOverlayOpacity, {
                  toValue: 0.4,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
              }}
              onCalendarPress={() => {
                setIsMenuOpen(true);
                setIsCalendarOpen(true);
                setCalendarTitle(CALENDAR_TITLES['favorites']);
                Animated.timing(menuOverlayOpacity, {
                  toValue: 0.4,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
              }}
            />
          </View>
          
          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={styles.content}>
              <RoundedContainer 
                leftLabel="Decks"
                rightLabel="Folders"
                onToggle={handleToggle}
              />

              <Animated.View 
                style={[
                  styles.shiftableContent,
                  { transform: [{ translateY: shiftAnim }] }
                ]}
              >
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <Title style={[styles.titleAbsolute]} animatedOpacity={studyOpacity}>
                      Favorite Decks
                    </Title>
                    <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                      Favorite Folders
                    </Title>
                  </View>
                </View>
                
                <View style={styles.scrollWrapper}>
                  {/* Favorite Decks ScrollView */}
                  <Animated.View style={[
                    styles.scrollViewContainer,
                    { opacity: studyOpacity, display: isFavFoldersMode ? 'none' : 'flex' }
                  ]}>
                    <ScrollView 
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {renderFavDeckCards()}
                    </ScrollView>
                  </Animated.View>

                  {/* Favorite Folders ScrollView */}
                  <Animated.View style={[
                    styles.scrollViewContainer,
                    { opacity: interviewOpacity, display: isFavFoldersMode ? 'flex' : 'none' }
                  ]}>
                    <ScrollView 
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {renderFavFolderCards()}
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
              disableOverlay={isFavFoldersMode}
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
  backButton: {
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
    height: 100,
    zIndex: 1,
  },
});