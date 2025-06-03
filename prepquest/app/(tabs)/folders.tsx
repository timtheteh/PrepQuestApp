import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/HeaderIconButtons';
import { Title } from '@/components/Title';
import { FolderCard } from '@/components/FolderCard';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { Feather } from '@expo/vector-icons';
import { useState, useRef, useContext, useEffect } from 'react';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavBarRef } from '@/components/NavBar';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { FloatingActionButton } from '@/components/FloatingActionButton';

const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
const BOTTOM_SPACING = 20; // Required spacing from navbar
const SHIFT_DISTANCE = 48; // Distance to shift content down
const selectUnselectedDuration = 300;

export default function FoldersScreen() {
  const router = useRouter();
  const { isAddToFolders, previousMode, selectedState } = useLocalSearchParams();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isAddToFoldersMode, setIsAddToFoldersMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<number>>(new Set());
  const isFocused = useIsFocused();
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setShowSlidingMenu,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity,
    navbarRef,
    setHandleDeletion,
    setDeleteModalText,
    setIsAddToFoldersModalOpen,
    addToFoldersModalOpacity
  } = useContext(MenuContext);

  // Animation values
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(BOTTOM_SPACING)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;

  // Reset header icons state and selection mode when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset header icons
      headerIconsRef.current?.reset();

      // Set the delete modal text for folders
      setDeleteModalText('Are you sure you want to delete these folder(s)?');

      // Check if we should enter AddToFolders mode
      if (isAddToFolders === 'true') {
        setIsSelectMode(true);
        setIsAddToFoldersMode(true);
        
        // Set animation values directly without animation
        shiftAnim.setValue(SHIFT_DISTANCE);
        marginAnim.setValue(BOTTOM_SPACING + SHIFT_DISTANCE);
        actionRowOpacity.setValue(1);
        selectTextAnim.setValue(1);
        fabOpacity.setValue(0);
        cardWidthPercentage.setValue(85);
        circleButtonOpacity.setValue(1);

        // Reset navbar animation to -2
        navbarRef?.current?.resetAnimation();
      } else {
        // Reset selection mode and related states
        setIsSelectMode(false);
        setIsAddToFoldersMode(false);
        setSelectedFolders(new Set());

        // Reset all animations to their default values
        shiftAnim.setValue(0);
        marginAnim.setValue(BOTTOM_SPACING);
        actionRowOpacity.setValue(0);
        selectTextAnim.setValue(0);
        fabOpacity.setValue(1);
        cardWidthPercentage.setValue(100);
        circleButtonOpacity.setValue(0);
      }
    }
  }, [isFocused]);

  // Set up the deletion handler when the component mounts
  useEffect(() => {
    setHandleDeletion(() => handleCancel);
    return () => setHandleDeletion(null);
  }, []);

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
      setSelectedFolders(new Set());
    });
  };

  const handleActionIconPress = (index: number) => {
    const hasSelection = selectedFolders.size > 0;

    if (!hasSelection) {
      setIsMenuOpen(true);
      setIsNoSelectionModalOpen(true);
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      return;
    }

    // Only trash button exists now
    setIsMenuOpen(true);
    setIsTrashModalOpenInDecksPage(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(trashModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleFabPress = () => {
    console.log("Folders FAB clicked!");
  };

  const handleMenuPress = () => {
    setIsMenuOpen(true);
    setShowSlidingMenu(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleSparklesPress = () => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCalendarPress = () => {
    setIsMenuOpen(true);
    Animated.timing(menuOverlayOpacity, {
      toValue: 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleSelectAll = () => {
    // Create a set of indices from 0 to 7 (for 8 folder cards)
    const allFolderIndices = new Set(Array.from({ length: 8 }, (_, i) => i));
    setSelectedFolders(allFolderIndices);
  };

  const handleDone = () => {
    const hasSelection = selectedFolders.size > 0;

    if (!hasSelection) {
      // Reset header icons state
      headerIconsRef.current?.reset();
      
      // Navigate back to decks page without selected state
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
      return;
    }

    // Show confirmation modal when there is a selection
    setIsMenuOpen(true);
    setIsAddToFoldersModalOpen(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(addToFoldersModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleBackPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // First trigger the navbar animation
    if (Platform.OS === 'ios') {
      navbarRef?.current?.setDecksTab();
      setTimeout(() => {
        router.push('/(tabs)');
      }, 50);
    } else {
      // On Android, we do it in reverse order due to the timing animation
      router.push('/(tabs)');
      setTimeout(() => {
        navbarRef?.current?.setDecksTab();
      }, 50);
    }
  };

  const renderFolderCards = () => {
    const cards = Array(8).fill(null).map((_, index) => {
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <FolderCard
          key={`folder-${index}`}
          style={style}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedFolders.has(index)}
          onSelectPress={() => {
            const newSelectedFolders = new Set(selectedFolders);
            if (selectedFolders.has(index)) {
              newSelectedFolders.delete(index);
            } else {
              newSelectedFolders.add(index);
            }
            setSelectedFolders(newSelectedFolders);
          }}
          circleButtonOpacity={circleButtonOpacity}
        />
      );
    });
    return cards;
  };

  return (
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
          <HeaderIconButtons 
            ref={headerIconsRef}
            onAIPress={handleSparklesPress}
            onCalendarPress={handleCalendarPress}
            pageType="folders"
          />
        </View>
        
        <Animated.View style={[
          styles.mainContentWrapper,
          { marginBottom: marginAnim }
        ]}>
          <View style={styles.content}>
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
              {isAddToFoldersMode ? (
                <View style={styles.doneButtonContainer}>
                  <TouchableOpacity onPress={handleDone}>
                    <Text style={styles.doneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ActionButtonsRow
                  iconNames={['trash']}
                  onCancel={handleCancel}
                  onIconPress={handleActionIconPress}
                  iconColors={['#FF3B30']}
                />
              )}
            </Animated.View>

            <Animated.View 
              style={[
                styles.shiftableContent,
                { transform: [{ translateY: shiftAnim }] }
              ]}
            >
              <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                  <Title>
                    {isAddToFoldersMode ? 'Add to Folder(s)' : 'Folders'}
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
                <ScrollView 
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {renderFolderCards()}
                </ScrollView>
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
            disableOverlay={true}
            onPress={handleFabPress}
          >
            <Feather name="plus" size={38} color="white" />
          </FloatingActionButton>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  shiftableContent: {
    flex: 1,
    marginTop: 16,
  },
  actionButtonsRow: {
    position: 'absolute',
    top: 18,
    right: 0,
    left: 0,
    zIndex: 1,
  },
  firstCard: {
    marginTop: 5,
  },
  card: {
    marginTop: 26,
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
  doneButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    height: 48,
  },
  doneButton: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
  },
}); 