import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ImageBackground, ScrollView, Image, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from './_layout';
import { DeckDetailsTopBar } from '@/components/DeckDetailsTopBar';
import { FavoriteButton } from '@/components/FavoriteButton';
import { AverageGradeThermometer } from '@/components/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/AverageSpeedTotal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTextInputModal } from '@/components/BottomTextInputModal';
import LottieView from 'lottie-react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Dummy flashcard data
const dummyFlashcards = [
  //     // text Qn -> text Ans
  //   { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'text', flashcardAnswer: 'A react hook is a function that allows you to use state and other react features in functional components.' },
  //   // text Qn (Cloze) -> text Ans
  //   { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'A React Hook is a special function that allows functional components to <blank> into React features like state and lifecycle methods without using class components.', flashcardAnswerType: 'text', flashcardAnswer: 'A react hook is a function that allows you to use state and other react features in functional components.' },
  //   // image Qn (jpg) -> text Ans
  //   { flashcardDifficulty: 'Hard', flashcardQnType: 'image', flashcardQn: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg'), flashcardAnswerType: 'text', flashcardAnswer: 'UseEffect is a hook that allows you to perform side effects in functional components.' },
  //   // image Qn (HEIC) -> text Ans
  // //   { flashcardDifficulty: 'Easy', flashcardQnType: 'image', flashcardQn: require('@/assets/dummyPhotos/dummy_HEIC_photo.HEIC'), flashcardAnswerType: 'text', flashcardAnswer: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum." },
  //   // audio Qn (m4a) -> text Ans
  //   { flashcardDifficulty: 'Good', flashcardQnType: 'audio', flashcardQn: require('@/assets/dummyAudio/dummy_m4a_audio.m4a'), flashcardAnswerType: 'text', flashcardAnswer: 'State is a way to store data that can change over time.' },
  // //   // audio Qn (ogg) -> text Ans
  // //   { flashcardDifficulty: 'Good', flashcardQnType: 'audio', flashcardQn: require('@/assets/dummyAudio/dummy_ogg_audio.ogg'), flashcardAnswerType: 'text', flashcardAnswer: 'State is a way to store data that can change over time.' },
    
  //   // text Qn -> MCQ Ans
  //   { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'How do you use useState?', flashcardAnswerType: 'MCQ', flashcardAnswer: 
  //     [
  //     {   "Qn": "Lorem Ipsum is simply dummy text of the printi",
  //         "Ans": false
  //     }, 
  //     {   "Qn": "has been the industry's standard dummy text ever since the 1500s, when an unknown p",
  //         "Ans": false
  //     }, 
  //     {   "Qn": "s, but also the leap into electronic typesetting, remaining essentially unchanged",
  //         "Ans": false
  //     }, 
  //     {   "Qn": "lishing software like Aldus PageMaker including versions of",
  //         "Ans": true
  //     }] 
  // },
  //     // text Qn -> voice recorded
  //   { flashcardDifficulty: 'Good', flashcardQnType: 'text', flashcardQn: 'What is a component?', flashcardAnswerType: 'voice', flashcardAnswer: null },
  //   // text Qn -> audio Ans
  //   { flashcardDifficulty: 'Again', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'audio', flashcardAnswer: require('@/assets/dummyAudio/dummy_m4a_audio.m4a') },
  //   // text Qn -> image Ans
    { flashcardDifficulty: 'Hard', flashcardQnType: 'text', flashcardQn: 'Explain useEffect.', flashcardAnswerType: 'image', flashcardAnswer: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg') },
  ];

const getEmptyStateContainerMarginTop = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone se
    if (Platform.OS === 'ios' && height <= 670) {
      return '0%';
    }
  
     /// iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return '25%';
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return '24%';
    }
     // Pixel 9 Pro, Pixel 9 Pro XL 
     if (Platform.OS === 'android' && height >= 935) {
      return '30%';
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return '23%';
    }
    
    // iphone 16, iphone 16 pro, Pixel 7 Pro, 
    return Platform.OS === 'ios' ? '18%' : '22%';
  };

const SCREEN_TRANSITION_DURATION = 300;

const cardDesigns = [
    require('@/assets/images/DeckDetailsBg1.png'),
    require('@/assets/images/DeckDetailsBg2.png'),
    require('@/assets/images/DeckDetailsBg3.png'),
    require('@/assets/images/DeckDetailsBg4.png'),
]

const AICardDesigns = [
    require('@/assets/images/AIDeckDetailsBg1.png'),
    require('@/assets/images/AIDeckDetailsBg2.png'),
    require('@/assets/images/AIDeckDetailsBg3.png'),
]

const companyLogos = {
    'study': require('@/assets/companyIcons/StudyCardIcon.png'),
    'Google': require('@/assets/companyIcons/GoogleIcon.png'),
    'Meta': require('@/assets/companyIcons/MetaIcon.png'),
    'JPMorgan': require('@/assets/companyIcons/JPMIcon.png'),
} as const;

type CompanyKey = keyof typeof companyLogos;

// Card type color and label logic
const cardTypeMap: Record<string, { color: string; label: string }> = {
  behavioral: { color: '#FDAE61', label: 'Behavioral' },
  technical: { color: '#D7191C', label: 'Technical' },
  brainteasers: { color: '#357AF6', label: 'Brainteasers' },
  'case study': { color: '#C3EB79', label: 'Case Study' },
  others: { color: '#FDAE61', label: 'Others' },
  study: { color: '#5CC8BE', label: 'Study' },
};

const getCardTypeColor = (cardType: string) => {
  return cardTypeMap[cardType]?.color || '#FDAE61';
};

const getCardTypeLabel = (cardType: string) => {
  return cardTypeMap[cardType]?.label || 'Others';
};

export default function DeckDetailsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const { deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, sourcePage, folderTitle, folderId } = useLocalSearchParams();
  const { 
    navbarRef,
    setIsMenuOpen,
    setIsDeckDetailsDeleteModalOpen,
    menuOverlayOpacity,
    deckDetailsDeleteModalOpacity,
    setHandleDeckDetailsDeletion,
    setOnDeckDetailsDeleteModalDismiss,
    currentMode,
    setIsDeckDetailsSaveModalOpen,
    setOnDeckDetailsSaveModalDismiss,
    deckDetailsSaveModalOpacity,
  } = useContext(MenuContext);

  // Convert deckDetailsBackgroundIndex to number and provide fallback
  const backgroundIndex = parseInt(deckDetailsBackgroundIndex as string) || 0;
  
  // Convert other parameters to appropriate types
  const cardCompany = (company as string || 'study') as CompanyKey;
  const cardCompanyLogo = companyLogos[cardCompany] || companyLogos['study'];
  const cardDate = date as string || '';
  const cardFlashcardCount = parseInt(flashcardCount as string) || 0;
  const cardPercent = parseInt(percent as string) || 0;
  const AIDeck = isAIDeck as string === 'true';
  
  // Ensure backgroundIndex is within bounds for AI card designs (which has 3 elements)
  const safeBackgroundIndex = AIDeck ? Math.min(backgroundIndex, AICardDesigns.length - 1) : backgroundIndex;

  // Handle screen transitions
  useEffect(() => {
    if (isFocused) {
      // Reset navbar animation when screen comes into focus
      navbarRef?.current?.resetAnimation();
      
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
    // Check if we should navigate back to viewDecksInFolder
    // This happens when we have folder information (folderTitle and folderId)
    if (folderTitle && folderId) {
      // Navigate back to viewDecksInFolder with folder information
      if (Platform.OS === 'ios') {
        navbarRef?.current?.resetAnimation();
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/viewDecksInFolder',
            params: {
              folderTitle: folderTitle as string,
              folderId: folderId as string,
              sourcePage: sourcePage as string
            }
          });
        }, 50);
      } else {
        router.push({
          pathname: '/(tabs)/viewDecksInFolder',
          params: {
            folderTitle: folderTitle as string,
            folderId: folderId as string,
            sourcePage: sourcePage as string
          }
        });
        setTimeout(() => {
          navbarRef?.current?.resetAnimation();
        }, 50);
      }
      return;
    }
    
    // Check if we should navigate back to favorites page
    if (sourcePage === 'favorites') {
      // Navigate back to favorites page
      if (Platform.OS === 'ios') {
        navbarRef?.current?.resetAnimation();
        setTimeout(() => {
          router.push('/(tabs)/favorites');
        }, 50);
      } else {
        router.push('/(tabs)/favorites');
        setTimeout(() => {
          navbarRef?.current?.resetAnimation();
        }, 50);
      }
      return;
    }
    
    // Check if we should navigate back to index page
    if (sourcePage === 'index') {
      // Navigate back to index page
      navbarRef?.current?.setDecksTab();
      
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)',
            params: {
              mode: currentMode
            }
          });
        }, 50);
      } else {
        router.push({
          pathname: '/(tabs)',
          params: {
            mode: currentMode
          }
        });
        setTimeout(() => {
          navbarRef?.current?.setDecksTab();
        }, 50);
      }
      return;
    }
    
    // Default navigation back to index page (fallback)
    navbarRef?.current?.setDecksTab();
    
    // Navigate back to the index page in the correct state
    if (Platform.OS === 'ios') {
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)',
          params: {
            mode: currentMode
          }
        });
      }, 50);
    } else {
      router.push({
        pathname: '/(tabs)',
        params: {
          mode: currentMode
        }
      });
      setTimeout(() => {
        navbarRef?.current?.setDecksTab();
      }, 50);
    }
  };

  const handleFabPress = () => {
    // Navigate to viewFlashcards page
    router.push({
      pathname: '/(tabs)/viewFlashcards',
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
        mode: currentMode,
        sourcePage: sourcePage as string,
        folderTitle: folderTitle as string,
        folderId: folderId as string
      }
    });
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(deckTitle as string || '');
  const [editNameSelected, setEditNameSelected] = useState(false);

  const handleEditNamePress = () => {
    if (editNameSelected) return;
    setEditText(deckTitle as string || '');
    setShowEditModal(true);
    setEditNameSelected(true);
  };

  const handleDoneEdit = () => {
    setShowEditModal(false);
    setEditNameSelected(false);
    // Optionally update deck title here
  };

  const handleOtherButtonPress = () => {
    setShowEditModal(false);
    setEditNameSelected(false);
  };

  const handleStudyPress = () => {
    setShowEditModal(false);
    // ...your study logic
    // Navigate to flashcardView with the first flashcard for study mode
    router.push({
      pathname: '/flashcardView',
      params: {
        flashcardIdx: '0',
        totalNumberOfFlashcards: dummyFlashcards.length.toString(),
        isStudyMode: 'true',
      }
    });
  };
  const handleQuizPress = () => {
    setShowEditModal(false);
    // ...your quiz logic
    router.push({
      pathname: '/flashcardView',
      params: {
        flashcardIdx: '0',
        totalNumberOfFlashcards: dummyFlashcards.length.toString(),
        isQuizMode: 'true',
      }
    });
  };
  const handleFolderPress = () => {
    setShowEditModal(false);
    setEditNameSelected(false);
    
    // Navigate to folders page in AddToFolders mode
    router.push({
      pathname: '/(tabs)/folders',
      params: {
        isAddToFolders: 'true',
        previousMode: currentMode,
        selectedState: 'false',
        sourcePage: 'deckDetails',
        // Pass all deckDetails parameters to preserve them when navigating back
        deckId: deckId as string,
        deckTitle: deckTitle as string,
        deckType: deckType as string,
        deckDetailsBackgroundIndex: deckDetailsBackgroundIndex as string,
        date: date as string,
        flashcardCount: flashcardCount as string,
        percent: percent as string,
        company: company as string,
        isAIDeck: isAIDeck as string,
        // Pass the original navigation context
        originalSourcePage: sourcePage as string,
        originalFolderTitle: folderTitle as string,
        originalFolderId: folderId as string
      }
    });

    console.log('isAIDeck', isAIDeck);
  };
  const handleDeletePress = () => {
    setShowEditModal(false);
    // Show delete confirmation modal
    setIsMenuOpen(true);
    setIsDeckDetailsDeleteModalOpen(true);
    setHandleDeckDetailsDeletion(() => () => {
      // TODO: Implement actual deletion logic here
      console.log('Deleting deck:', deckId);
      // Navigate back after deletion
      router.back();
    });
    
    // Set up dismiss callback to unselect edit name button
    setOnDeckDetailsDeleteModalDismiss(() => () => {
      setEditNameSelected(false);
    });
    
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deckDetailsDeleteModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleSavePress = () => {
    setShowEditModal(false);
    // Show save confirmation modal
    setIsMenuOpen(true);
    setIsDeckDetailsSaveModalOpen(true);
    
    // Set up dismiss callback to unselect edit name button
    setOnDeckDetailsSaveModalDismiss(() => () => {
      setEditNameSelected(false);
    });
    
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deckDetailsSaveModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      setShowEditModal(false);
      setEditNameSelected(false);
    }, [])
  );

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
            <DeckDetailsTopBar 
              onStudyPress={handleStudyPress}
              onQuizPress={handleQuizPress}
              onFolderPress={handleFolderPress}
              onDeletePress={handleDeletePress}
              onEditNamePress={handleEditNamePress}
              editNameSelected={editNameSelected}
            />
          </View>
          
          <View style={styles.mainContainer}>
            <ImageBackground 
              source={AIDeck ? AICardDesigns[safeBackgroundIndex] : cardDesigns[safeBackgroundIndex]}
              style={styles.backgroundImage}
              imageStyle={styles.backgroundImageStyle}
            >
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.cardContentContainer}>
                  {AIDeck ? (
                    // AI Deck Layout - 3 columns
                    <View style={styles.aiDeckLayout}>
                      {/* Column 1: Company Logo */}
                      <View style={styles.aiDeckColumn1}>
                        {cardCompanyLogo && (
                          <Image source={cardCompanyLogo} style={styles.aiDeckCompanyLogo} />
                        )}
                      </View>
                      
                      {/* Column 2: Title */}
                      <View style={styles.aiDeckColumn2}>
                        {deckTitle && (
                          <Text 
                            style={styles.aiDeckTitle}
                            numberOfLines={2}
                          >
                            {deckTitle}
                          </Text>
                        )}
                      </View>
                      
                      {/* Column 3: Card Type Pill and Flashcard Count */}
                      <View style={styles.aiDeckColumn3}>
                        {deckType && (
                          <View style={[styles.aiDeckCardTypePill, { borderColor: getCardTypeColor(deckType as string) }]}>
                            <Text style={[styles.aiDeckCardTypeText, { color: '#000' }]}>{getCardTypeLabel(deckType as string)}</Text>
                          </View>
                        )}
                        {cardFlashcardCount !== undefined && (
                          <Text style={styles.aiDeckFlashcardCount}>{cardFlashcardCount} cards</Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    // Regular Deck Layout - Original positioning
                    <>
                      {/* Company logo at top left */}
                      {cardCompanyLogo && (
                        <Image source={cardCompanyLogo} style={styles.cardIconImage} />
                      )}

                      <View 
                        style={[
                          styles.favoriteButtonContainer,
                        ]}
                      >
                        <FavoriteButton isSelectMode={false} />
                      </View>
                      
                      {/* Title */}
                      {deckTitle && (
                        <Text 
                          style={styles.cardTitle}
                          numberOfLines={2}
                        >
                          {deckTitle}
                        </Text>
                      )}
                      
                      {/* Date and Flashcard Count Row */}
                      {(cardDate || cardFlashcardCount !== undefined) && (
                        <View 
                          style={[
                            styles.dateFlashcardRow,
                          ]}
                        >
                          {cardDate && (
                            <Text style={styles.dateText}>{cardDate}</Text>
                          )}
                          {cardFlashcardCount !== undefined && (
                            <Text style={styles.flashcardCountText}>{cardFlashcardCount} cards</Text>
                          )}
                        </View>
                      )}
                      
                      {/* Card type pill */}
                      {deckType && (
                        <View style={[styles.cardTypePill, { borderColor: getCardTypeColor(deckType as string) }]}>
                          <Text style={[styles.cardTypeText, { color: '#000' }]}>{getCardTypeLabel(deckType as string)}</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {/* Progress bar */}
                  {cardPercent > 0 && (
                    <View style={styles.progressRow}> 
                      <View style={styles.loadingBarFlexWrapper}>
                        <LoadingBar percent={cardPercent} />
                      </View>
                      <Text style={styles.progressLabel}>{cardPercent}% progress</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.cardDetailsContainer, { marginTop: AIDeck ? 0 : 120 }]}>
                  {AIDeck ? (
                    // AI Deck - Three stacked EmptyState animations
                    <View style={[styles.emptyStateContainer, { marginTop: getEmptyStateContainerMarginTop() }]}>
                    <View style={styles.emptyStateAnimationsContainer}>
                      {/* First animation - normal size, rotated 20° right */}
                      <View style={styles.aiDeckAnimation1}>
                        <LottieView
                          source={require('@/assets/animations/EmptyState1.json')}
                          autoPlay
                          loop
                          style={styles.aiDeckAnimation}
                        />
                      </View>
                      
                      {/* Second animation - 80% smaller, positioned top-left, rotated 30° left */}
                      <View style={styles.aiDeckAnimation2}>
                        <LottieView
                          source={require('@/assets/animations/EmptyState1.json')}
                          autoPlay
                          loop
                          style={[styles.aiDeckAnimation,]}
                        />
                      </View>
                      
                      {/* Third animation - 60% smaller, positioned top-right, rotated 10° right */}
                      <View style={styles.aiDeckAnimation3}>
                        <LottieView
                          source={require('@/assets/animations/EmptyState1.json')}
                          autoPlay
                          loop
                          style={[styles.aiDeckAnimation]}
                        />
                      </View>
                    </View>
                    {/* AI Deck stats message */}
                    <Text style={styles.aiDeckStatsMessage}>
                    No stats yet! View, study or quiz yourself on this deck in the meantime!
                    </Text>
                    </View>
                  ) : (
                    // Regular deck - Original components
                    <>
                      <AverageGradeThermometer/>
                      <BreakdownByDifficultyPie/>
                      <AverageSpeedTotal/>
                    </>
                  )}
                </View>
                
              </ScrollView>
            </ImageBackground>
          </View>

          <View style={[
            styles.fabContainer,
          ]}>
            {AIDeck && (
              <TouchableOpacity
                style={[styles.fab, { bottom: (Platform.OS === 'ios' ? 100 : 95) }]}
                onPress={handleSavePress}
                activeOpacity={0.8}
              >
                <MaterialIcons name="save-alt" size={30} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.fab]}
              onPress={handleFabPress}
              activeOpacity={0.8}
            >
              <Ionicons name="eye" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
      <BottomTextInputModal
        visible={showEditModal}
        value={editText}
        onChangeText={setEditText}
        onDone={handleDoneEdit}
        placeholder="Edit deck name..."
      />
    </Animated.View>
  );
}

function LoadingBar({ percent }: { percent: number }) {
    const isComplete = percent === 100;
    return (
      <View style={styles.loadingBarBg}>
        <View style={[styles.loadingBarFg, { width: `${percent}%`, backgroundColor: isComplete ? '#44B88A' : '#4F41D8' }]} />
        {isComplete && (
          <View style={styles.loadingBarTextContainer}>
            <Text style={styles.loadingBarCompleteText}>Completed!</Text>
          </View>
        )}
      </View>
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
  mainContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 132 : 78,
    marginBottom: 20, // Space for navbar
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    borderRadius: 20,
    resizeMode: 'stretch',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Satoshi-Bold',
    color: '#000000',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Medium',
    color: '#666666',
  },
  scrollView: {
    flex: 1,
    marginVertical: 20,
    marginHorizontal: 15,
    // borderWidth: 2,
    // borderColor: 'blue', // Visible border to see the ScrollView
    // borderStyle: 'solid',
  },
  scrollViewContent: {
    padding: 0,
  },
  cardContentContainer: {
    flex: 1,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  loadingBarFlexWrapper: {
    flex: 1,
    marginRight: 12,
    marginLeft: 8,
  },
  loadingBarBg: {
    height: 11,
    borderRadius: 13,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    width: '100%',
  },
  loadingBarFg: {
    height: 11,
    borderRadius: 13,
    backgroundColor: '#4F41D8',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  progressLabel: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 12,
    color: '#222',
    textAlign: 'right',
    minWidth: 70,
    marginRight: 8,
  },
  loadingBarTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -2.5,
    bottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loadingBarCompleteText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  cardIconImage: {
    position: 'absolute',
    top: 15,
    left: 7,
    width: 54,
    height: 54,
    resizeMode: 'contain',
    zIndex: 2,
  },
  cardTypePill: {
    position: 'absolute',
    width: 84,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    top: 42,
    right: 2,
    height: 38,
    borderRadius: 21,
  },
  cardTypeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 5,
    right: 2,
    zIndex: 3,
  },
  cardTitle: {
    position: 'absolute',
    top: 5,
    right: 90,
    left: 75,
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    color: '#000',
    zIndex: 2,
    lineHeight: Platform.OS === 'ios' ? 24 : 28,
  },
  dateFlashcardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 65,
    right: 100,
    left: 80,
    zIndex: 2,
  },
  dateText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
  },
  flashcardCountText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
  },
  cardDetailsContainer: {
    flex: 1,
    marginTop: 120,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
    right: 16,
    width: 67,
    height: 67,
    borderRadius: 67 / 2,
    backgroundColor: '#4F41D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8, // for Android shadow
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
  aiDeckLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  aiDeckColumn1: {
    flex: 0.7,
    alignItems: 'flex-start',
  },
  aiDeckColumn2: {
    flex: 2,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  aiDeckColumn3: {
    flex: 1,
    alignItems: 'center',
  },
  aiDeckCompanyLogo: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
    marginTop: 8,
  },
  aiDeckTitle: {
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    color: '#000',
    lineHeight: Platform.OS === 'ios' ? 24 : 28,
    textAlign: 'left',
  },
  aiDeckCardTypePill: {
    width: 84,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 21,
    marginBottom: 8,
  },
  aiDeckCardTypeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  aiDeckFlashcardCount: {
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateAnimationsContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  aiDeckAnimation1: {
    position: 'absolute',
    top: "25%",
    left: '-5%',
    width: 280,
    height: 280,
    transform: [{ rotate: '2deg' }],
  },
  aiDeckAnimation2: {
    position: 'absolute',
    top: '2%',
    left: '7%',
    width: 180,
    height: 180,
    transform: [{ rotate: '-25deg' }],
  },
  aiDeckAnimation3: {
    position: 'absolute',
    top: '10%',
    right: "-5%",
    width: 240,
    height: 240,
    transform: [{ rotate: '15deg' }],
  },
  aiDeckAnimation: {
    width: '100%',
    height: '100%',
    // borderWidth: 1,
    // borderColor: 'blue',
  },
  aiDeckStatsMessage: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 20,
    color: '#222',
    textAlign: 'center',
    marginTop: 10,
  },
}); 