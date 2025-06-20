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
const BOTTOM_SPACING = 20; // Required spacing from navbar
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

const favCardData = [
  {
    percent: 85,
    image: require('@/assets/companyIcons/GoogleIcon.png'),
    cardType: 'behavioral',
    title: 'Google Frontend Behavioral Prep',
    date: 'Dec 18, 2024',
    flashcardCount: 34,
  },
  {
    percent: 60,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    title: 'Advanced Mathematics Prep',
    date: 'Dec 16, 2024',
    flashcardCount: 78,
  },
  {
    percent: 100,
    image: require('@/assets/companyIcons/MetaIcon.png'),
    cardType: 'technical',
    title: 'Meta Backend Technical Prep',
    date: 'Dec 14, 2024',
    flashcardCount: 45,
  },
  {
    percent: 25,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    title: 'Physics Advanced Prep',
    date: 'Dec 12, 2024',
    flashcardCount: 92,
  },
  {
    percent: 75,
    image: require('@/assets/companyIcons/JPMIcon.png'),
    cardType: 'case study',
    title: 'JPMorgan Case Study Prep',
    date: 'Dec 10, 2024',
    flashcardCount: 28,
  },
  {
    percent: 40,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    title: 'Chemistry Lab Prep',
    date: 'Dec 8, 2024',
    flashcardCount: 56,
  },
  {
    percent: 90,
    image: require('@/assets/companyIcons/GoogleIcon.png'),
    cardType: 'brainteasers',
    title: 'Google Brainteasers Prep',
    date: 'Dec 6, 2024',
    flashcardCount: 31,
  },
  {
    percent: 15,
    image: require('@/assets/companyIcons/StudyCardIcon.png'),
    cardType: 'study',
    title: 'Biology Research Prep',
    date: 'Dec 4, 2024',
    flashcardCount: 67,
  },
];

const favFolderData = [
  { title: 'Favorite Study Materials', dateCreated: 'Dec 17, 2024', deckCount: 14 },
  { title: 'Top Interview Prep', dateCreated: 'Dec 15, 2024', deckCount: 10 },
  { title: 'Best Technical Qs', dateCreated: 'Dec 13, 2024', deckCount: 18 },
  { title: 'Key Behavioral Prep', dateCreated: 'Dec 11, 2024', deckCount: 7 },
  { title: 'Important Case Studies', dateCreated: 'Dec 9, 2024', deckCount: 12 },
  { title: 'Essential Math Problems', dateCreated: 'Dec 7, 2024', deckCount: 16 },
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
    addDeckOpacity,
    setNoSelectionModalSubtitle,
    setSourcePageForFolders,
    setDeleteModalText,
    setIsUnfavoriteModalOpen,
    unfavoriteModalOpacity,
    setUnfavoriteModalText,
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
  const { mode, selected } = useLocalSearchParams();

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

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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

  // Handle screen transitions and set previous mode
  useEffect(() => {
    if (isFocused) {
      // Reset header icons state when screen comes into focus
      headerIconsRef.current?.reset();
      
      if (selected === 'true') {
        // Enter selection mode with animations
        setIsSelectMode(true);
        
        // Reset selections
        setSelectedFavDeckCards(new Set());
        setSelectedFavFolderCards(new Set());
        
        // Set animation values directly without animation
        shiftAnim.setValue(SHIFT_DISTANCE);
        marginAnim.setValue(BOTTOM_SPACING + SHIFT_DISTANCE);
        actionRowOpacity.setValue(1);
        selectTextAnim.setValue(1);
        fabOpacity.setValue(0);
        cardWidthPercentage.setValue(85);
        circleButtonOpacity.setValue(1);
      } else {
        // Reset to decks state and unselected state
        setIsSelectMode(false);
        setSelectedFavDeckCards(new Set());
        setSelectedFavFolderCards(new Set());

        // Reset all animations to their default values
        shiftAnim.setValue(0);
        marginAnim.setValue(BOTTOM_SPACING);
        actionRowOpacity.setValue(0);
        selectTextAnim.setValue(0);
        fabOpacity.setValue(1);
        cardWidthPercentage.setValue(100);
        circleButtonOpacity.setValue(0);
      }
      
      // Set source page to favorites
      setSourcePageForFolders('favorites');
      
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
  }, [isFocused]);

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
      setSelectedFavDeckCards(new Set());
      setSelectedFavFolderCards(new Set());
    });
  };

  const handleSelectAll = () => {
    if (isFavFoldersMode) {
      const allFolderIndices = new Set(Array.from({ length: favFolderCardsCount }, (_, i) => i));
      setSelectedFavFolderCards(allFolderIndices);
    } else {
      const allDeckIndices = new Set(Array.from({ length: favDeckCardsCount }, (_, i) => i));
      setSelectedFavDeckCards(allDeckIndices);
    }
  };

  const handleActionIconPress = (index: number) => {
    const hasSelection = isFavFoldersMode 
      ? selectedFavFolderCards.size > 0 
      : selectedFavDeckCards.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle(
        isFavFoldersMode
          ? "Please choose at least one folder if you want to delete or unfavorite."
          : "Please choose at least one deck if you want to delete, add to folder or unfavorite."
      );
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    // In folders mode, we only have trash button
    // In decks mode, we have folder and trash buttons
    if (isFavFoldersMode) {
      // In folders mode, index 0 is trash
      if (index === 0) {
        setIsMenuOpen(true);
        setIsTrashModalOpenInDecksPage(true);
        setDeleteModalText('Are you sure you want to delete these folder(s)?');
        Animated.parallel([
          Animated.timing(menuOverlayOpacity, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(trashModalOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start();
      }
    } else {
      // In decks mode
      switch (index) {
        case 0: // Folder
          // Reset header icons state
          headerIconsRef.current?.reset();
          
          // Set source page to favorites
          setSourcePageForFolders('favorites');
          
          // Navigate to folders in AddToFolders mode
          if (Platform.OS === 'ios') {
            navbarRef?.current?.resetAnimation();
            setTimeout(() => {
              router.push({
                pathname: '/(tabs)/folders',
                params: { 
                  isAddToFolders: 'true',
                  previousMode: isFavFoldersMode ? 'interview' : 'study',
                  selectedState: 'true'
                }
              });
            }, 50);
          } else {
            router.push({
              pathname: '/(tabs)/folders',
              params: { 
                isAddToFolders: 'true',
                previousMode: isFavFoldersMode ? 'interview' : 'study',
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
          setDeleteModalText('Are you sure you want to delete these deck(s)?');
          Animated.parallel([
            Animated.timing(menuOverlayOpacity, {
              toValue: 0.4,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(trashModalOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            })
          ]).start();
          break;
      }
    }
  };

  const handleUnfavoritePress = () => {
    const hasSelection = isFavFoldersMode 
      ? selectedFavFolderCards.size > 0 
      : selectedFavDeckCards.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      setNoSelectionModalSubtitle(
        isFavFoldersMode
          ? "Please choose at least one folder if you want to delete or unfavorite."
          : "Please choose at least one deck if you want to delete, add to folder or unfavorite."
      );
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    // Show unfavorite modal with appropriate text
    setIsMenuOpen(true);
    setIsUnfavoriteModalOpen(true);
    setUnfavoriteModalText(
      isFavFoldersMode
        ? 'Are you sure you want to unfavorite these folder(s)?'
        : 'Are you sure you want to unfavorite these deck(s)?'
    );
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(unfavoriteModalOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Update card counts
  useEffect(() => {
    setFavDeckCardsCount(8); // Current number of favorite deck cards
    setFavFolderCardsCount(6); // Current number of favorite folder cards
  }, []);

  const renderFavDeckCards = () => {
    const cards = favCardData.map((data, index) => {
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

  const renderFavFolderCards = () => {
    const cards = favFolderData.map((data, index) => {
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
          title={data.title}
          dateCreated={data.dateCreated}
          deckCount={data.deckCount}
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
                  iconNames={isFavFoldersMode ? ['trash'] : ['folder', 'trash']}
                  onCancel={handleCancel}
                  onIconPress={handleActionIconPress}
                  iconColors={isFavFoldersMode ? ['#FF3B30'] : ['black', '#FF3B30']}
                  showUnfavoriteButton={true}
                  onUnfavoritePress={handleUnfavoritePress}
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
                      Favorite Decks
                    </Title>
                    <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                      Favorite Folders
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
  actionButtonsRow: {
    position: 'absolute',
    top: 62,
    right: 0,
    left: 0,
    zIndex: 1,
  },
});