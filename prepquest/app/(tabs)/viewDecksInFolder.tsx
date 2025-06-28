import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/HeaderIconButtons';
import { Title } from '@/components/Title';
import { useState, useRef, useContext, useEffect } from 'react';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavBarRef } from '@/components/NavBar';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { FolderDetailsTopBar } from '@/components/FolderDetailsTopBar';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { Card } from '@/components/Card';

const SCREEN_TRANSITION_DURATION = 200;
const BOTTOM_SPACING = 20; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down


// Mock data for decks in a folder
const decksData = [
    {
      percent: 85,
      image: require('@/assets/companyIcons/GoogleIcon.png'),
      cardType: 'behavioral',
      title: 'Google Frontend Behavioral Prep',
      date: 'Dec 18, 2024',
      flashcardCount: 34,
      company: 'Google',
    },
    {
      percent: 60,
      image: require('@/assets/companyIcons/StudyCardIcon.png'),
      cardType: 'study',
      title: 'Advanced Mathematics Prep',
      date: 'Dec 16, 2024',
      flashcardCount: 78,
      company: 'study',
    },
    {
      percent: 100,
      image: require('@/assets/companyIcons/MetaIcon.png'),
      cardType: 'technical',
      title: 'Meta Backend Technical Prep',
      date: 'Dec 14, 2024',
      flashcardCount: 45,
      company: 'Meta',
    },
    {
      percent: 25,
      image: require('@/assets/companyIcons/StudyCardIcon.png'),
      cardType: 'study',
      title: 'Physics Advanced Prep',
      date: 'Dec 12, 2024',
      flashcardCount: 92,
      company: 'study',
    },
    {
      percent: 75,
      image: require('@/assets/companyIcons/JPMIcon.png'),
      cardType: 'case study',
      title: 'JPMorgan Case Study Prep',
      date: 'Dec 10, 2024',
      flashcardCount: 28,
      company: 'JPMorgan',
    },
    {
      percent: 40,
      image: require('@/assets/companyIcons/StudyCardIcon.png'),
      cardType: 'study',
      title: 'Chemistry Lab Prep',
      date: 'Dec 8, 2024',
      flashcardCount: 56,
      company: 'study',
    },
    {
      percent: 90,
      image: require('@/assets/companyIcons/GoogleIcon.png'),
      cardType: 'brainteasers',
      title: 'Google Brainteasers Prep',
      date: 'Dec 6, 2024',
      flashcardCount: 31,
      company: 'Google',
    },
    {
      percent: 15,
      image: require('@/assets/companyIcons/StudyCardIcon.png'),
      cardType: 'study',
      title: 'Biology Research Prep',
      date: 'Dec 4, 2024',
      flashcardCount: 67,
      company: 'study',
    },
  ];

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

export default function ViewDecksInFolderScreen() {
  const router = useRouter();
  const { folderTitle, folderId } = useLocalSearchParams();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const isFocused = useIsFocused();
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setShowSlidingMenu,
    navbarRef,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity,
    setSourcePageForFolders,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    setDeleteModalText,
    setHandleDeletion,
  } = useContext(MenuContext);

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(BOTTOM_SPACING)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [decksCount, setDecksCount] = useState(0);
  const [selectedDecks, setSelectedDecks] = useState<Set<number>>(new Set());
  const selectUnselectedDuration = 300;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;

  // Initialize opacity to 0 when component mounts
  useEffect(() => {
    screenOpacity.setValue(0);
  }, []);

  // Reset header icons state when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset header icons
      headerIconsRef.current?.reset();
      
      // Set the delete modal text for viewDecksInFolder
      setDeleteModalText('Are you sure you want to delete from this folder?');
      
      // Set up the deletion handler for viewDecksInFolder
      setHandleDeletion(() => handleCancel);
      
      // Reset selection state and animations
      setIsSelectMode(false);
      setSelectedDecks(new Set());
      
      // Reset all animations to their default values
      shiftAnim.setValue(0);
      marginAnim.setValue(BOTTOM_SPACING);
      actionRowOpacity.setValue(0);
      selectTextAnim.setValue(0);
      fabOpacity.setValue(1);
      cardWidthPercentage.setValue(100);
      circleButtonOpacity.setValue(0);
      
      // Add a small delay for smoother fade-in animation
      setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      // Reset opacity to 0 when screen loses focus
      screenOpacity.setValue(0);
      
      // Clean up the deletion handler
      setHandleDeletion(null);
    }
    
    // Cleanup function
    return () => {
      if (!isFocused) {
        setHandleDeletion(null);
      }
    };
  }, [isFocused, screenOpacity]);

  const handleBackPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // Navigate back to folders page
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

  const slidingMenuDuration = 300;

  const handleSelectAll = () => {
      const allDeckIndices = new Set(Array.from({ length: decksData.length }, (_, i) => i));
      setSelectedDecks(allDeckIndices);
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
      setSelectedDecks(new Set());
    });
  };

  const handleDeckSelection = (index: number, selected: boolean) => {
    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  };

  const handleActionIconPress = (index: number) => {
    const hasSelection = selectedDecks.size > 0;

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
        
        // Navigate to folders in MoveToFolders mode
        if (Platform.OS === 'ios') {
          navbarRef?.current?.resetAnimation();
          setTimeout(() => {
            router.push({
              pathname: '/(tabs)/folders',
              params: { 
                isMoveToFolders: 'true',
                selectedState: 'true',
                folderTitle: folderTitle as string,
                folderId: folderId as string
              }
            });
          }, 50);
        } else {
          router.push({
            pathname: '/(tabs)/folders',
            params: { 
              isMoveToFolders: 'true',
              selectedState: 'true',
              folderTitle: folderTitle as string,
              folderId: folderId as string
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

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderDecks = () => {
    const cards = decksData.map((data, index) => {
      const design = cardDesigns[index % 4];
      const style = index === 0 ? styles.firstCard : styles.card;
      return (
        <Card
          key={`deck-${index}`}
          style={style}
          backgroundImage={design.background}
          pressedBackgroundImage={design.pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedDecks.has(index)}
          onSelectPress={() => handleDeckSelection(index, !selectedDecks.has(index))}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.percent}
          showProgress={!isSelectMode}
          image={data.image}
          cardType={data.cardType}
          title={data.title}
          date={data.date}
          flashcardCount={data.flashcardCount}
          deckDetailsBackgroundIndex={index%4}
          company={data.company}
          folderTitle={folderTitle as string}
          folderId={folderId as string}
          sourcePage="viewDecksInFolder"
        />
      );
    });
    return cards;
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerIconsContainer}>
            <FolderDetailsTopBar />
          </View>

          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                
                <Text style={styles.title} numberOfLines={2}>
                  {folderTitle || 'Folder'}
                </Text>
              </View>

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
                  iconNames={['drive-file-move-rtl', 'trash']}
                  iconLibraries={['materialicons', 'ionicons']}
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
                      <Title style={[styles.titleAbsolute]}>
                          {`Decks (${decksData.length})`}
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
                    <Animated.View style={[
                        styles.scrollViewContainer,
                        { display: 'flex' }
                    ]}>
                        <ScrollView 
                            style={styles.scrollContainer}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            >
                            {renderDecks()}
                          </ScrollView>
                    </Animated.View>
                  </View>
                </Animated.View>
                </View>
            </Animated.View>
        </View>
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
    paddingTop: 10,
    paddingRight: 8,
  },
  mainContentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 108 : 56,
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
  title: {
    fontSize: 32,
    fontFamily: 'Neuton-Regular',
    color: '#000',
    lineHeight: 36,
  },
  decksContainer: {
    flex: 1,
    marginTop: 16,
  },
  decksCount: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    color: '#000',
    marginBottom: 16,
  },
  actionButtonsRow: {
    position: 'absolute',
    top: 50,
    right: 0,
    left: 0,
    zIndex: 1,
  },
  shiftableContent: {
    flex: 1,
    marginTop: 16,
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
});