import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/HeaderIconButtons';
import { Title } from '@/components/Title';
import { useState, useRef, useContext, useEffect } from 'react';
import { MenuContext } from '@/contexts/MenuContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavBarRef } from '@/components/NavBar';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { FolderDetailsTopBar } from '@/components/FolderDetailsTopBar';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { Card } from '@/components/Card';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Feather } from '@expo/vector-icons';
import { BottomTextInputModal } from '@/components/BottomTextInputModal';
import { getDecksInFolder, Deck, deleteMultipleDecks, deleteFolder, checkFolderNameExists, getCompanyIconImageSource } from '@/db/decks';
import { db } from '@/db/index';
import { cardDesigns, getDeckCardDesign } from '@/constants/cardDesigns';
import { Toast } from '@/components/Toast';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopBarTopHeight, getHeaderIconsTopHeight, getContentTopHeightNoRoundedToggle2 } from '@/constants/heights';

const SCREEN_TRANSITION_DURATION = 200;
const BOTTOM_SPACING = 20; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    // console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

export default function ViewDecksInFolderScreen() {
  const router = useRouter();
  const { folderTitle, folderId, sourcePage } = useLocalSearchParams();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const isFocused = useIsFocused();
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setShowSlidingMenu,
    navbarRef,
    setIsNoSelectionModalOpen,
    noSelectionModalSubtitle,
    noSelectionModalOpacity,
    setSourcePageForFolders,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    setDeleteModalText,
    setHandleDeletion,
    setIsDeleteFolderModalOpen,
    deleteFolderModalOpacity,
    setHandleDeleteFolder,
    setCurrentFolderId,
    setCurrentFolderTitle,
    setCurrentSourcePage,
  } = useContext(MenuContext);
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(BOTTOM_SPACING)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [decksCount, setDecksCount] = useState(0);
  const [selectedDecks, setSelectedDecks] = useState<Set<number>>(new Set());
  const [decks, setDecks] = useState<(Deck & { progress: number })[]>([]);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [imageSources, setImageSources] = useState<Map<number, { uri: string } | undefined>>(new Map());
  const selectUnselectedDuration = 300;
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;

  // Edit name modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(folderTitle as string || '');
  const [editNameSelected, setEditNameSelected] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initialize opacity to 0 when component mounts
  useEffect(() => {
    screenOpacity.setValue(0);
  }, []);

  // Check if database is ready
  useEffect(() => {
    const checkDatabaseReady = async () => {
      try {
        console.log('Checking if database is ready...');
        const userID = await getCurrentUserID();
        // Try a simple query to check if database is ready
        const result = await db.getAllAsync('SELECT COUNT(*) as count FROM decks WHERE userID = ?', [userID]);
        console.log('Database is ready, decks count:', (result[0] as any)?.count);
        setIsDatabaseReady(true);
      } catch (error) {
        console.log('Database not ready yet, waiting...', error);
        // Retry after a short delay
        setTimeout(checkDatabaseReady, 500);
      }
    };
    
    checkDatabaseReady();
  }, []);

  // Load decks data from database
  useEffect(() => {
    const loadDecksData = async () => {
      if (!isDatabaseReady || !folderId) {
        console.log('Database not ready or no folderId, skipping data load');
        return;
      }
      
      console.log('Loading decks data for folder:', folderId);
      try {
        const decksData = await getDecksInFolder(parseInt(folderId as string));
        console.log('Decks loaded for folder:', decksData.length);
        setDecks(decksData);
        setDecksCount(decksData.length);
        
        // Load image sources for each deck
        const sources = new Map<number, { uri: string } | undefined>();
        for (const deck of decksData) {
          const imageSource = await getCompanyIconImageSource(deck.interviewCompanyIcon);
          sources.set(deck.deckID, imageSource);
        }
        setImageSources(sources);
      } catch (error) {
        console.error('Error loading decks data for folder:', error);
      }
    };

    if (isFocused) {
      loadDecksData();
    }
  }, [isFocused, isDatabaseReady, folderId]);

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

  // Reset edit modal state when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      setShowEditModal(false);
      setEditNameSelected(false);
    }
  }, [isFocused]);

  // Set the folder parameters in context when component mounts
  useEffect(() => {
    if (folderId) {
      setCurrentFolderId(folderId as string);
      console.log('✅ viewDecksInFolder: Setting folderId in context:', folderId);
    }
    if (folderTitle) {
      setCurrentFolderTitle(folderTitle as string);
      console.log('✅ viewDecksInFolder: Setting folderTitle in context:', folderTitle);
    }
    if (sourcePage) {
      setCurrentSourcePage(sourcePage as string);
      console.log('✅ viewDecksInFolder: Setting sourcePage in context:', sourcePage);
    }
  }, [folderId, folderTitle, sourcePage, setCurrentFolderId, setCurrentFolderTitle, setCurrentSourcePage]);

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if parsing fails
    }
  };


  const handleBackPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // Navigate back based on source page
    if (sourcePage === 'favorites') {
      // Navigate back to favorites page in folders state
      if (Platform.OS === 'ios') {
        navbarRef?.current?.resetAnimation();
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/favorites',
            params: {
              mode: 'interview'
            }
          });
        }, 50);
      } else {
        router.push({
          pathname: '/(tabs)/favorites',
          params: {
            mode: 'interview'
          }
        });
        setTimeout(() => {
          navbarRef?.current?.resetAnimation();
        }, 50);
      }
    } else {
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
    }
  };

  const slidingMenuDuration = 300;

  const handleSelectAll = () => {
      const allDeckIndices = new Set(Array.from({ length: decks.length }, (_, i) => i));
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

  const handleFabPress = () => {
    console.log("FAB clicked!");
  };

  const handleEditNamePress = () => {
    if (editNameSelected) return;
    setEditText(folderTitle as string || '');
    setShowEditModal(true);
    setEditNameSelected(true);
  };

  const handleDoneEdit = async () => {
    const trimmedText = editText.trim();
    
    // Check if the text is empty
    if (!trimmedText) {
      setToastMessage('Folder name cannot be empty!');
      setShowToast(true);
      return;
    }
    
    // Check if the folder name has actually changed (ignoring whitespace)
    const currentFolderName = (folderTitle as string || '').trim();
    if (trimmedText === currentFolderName) {
      // No change, just close the modal
      setShowEditModal(false);
      setEditNameSelected(false);
      return;
    }
    
    // Check if the folder name already exists (excluding current folder)
    const folderExists = await checkFolderNameExists(trimmedText, parseInt(folderId as string));
    
    if (folderExists) {
      setToastMessage('Folder name already exists!');
      setShowToast(true);
      return;
    }
    
    // If validation passes, update the folder name
    try {
      const userID = await getCurrentUserID();
      await db.execAsync(`
        UPDATE folders 
        SET folderName = '${trimmedText}', lastModifiedDate = '${new Date().toISOString()}'
        WHERE folderID = ${parseInt(folderId as string)} AND userID = '${userID}'
      `);
      
      console.log('Updated folder title to:', trimmedText);
      
      // Update local state to reflect the change immediately
      setEditText(trimmedText);
      
      // Close the modal
      setShowEditModal(false);
      setEditNameSelected(false);
      
      // Force a re-render by updating the folder title in the route params
      // This will make the new name appear in the UI immediately
      router.setParams({ folderTitle: trimmedText });
      
    } catch (error) {
      console.error('Error updating folder name:', error);
      setToastMessage('Error updating folder name!');
      setShowToast(true);
    }
  };

  const handleOtherButtonPress = () => {
    setShowEditModal(false);
    setEditNameSelected(false);
  };

  const handleDeleteFolder = () => {
    // Show delete folder confirmation modal
    setIsMenuOpen(true);
    setIsDeleteFolderModalOpen(true);
    setHandleDeleteFolder(() => async () => {
      try {
        // Delete the folder from database
        const success = await deleteFolder(parseInt(folderId as string));
        
        if (success) {
          console.log('Successfully deleted folder:', folderTitle);
          
          // Navigate back based on source page
          if (sourcePage === 'favorites') {
            // Navigate back to favorites page in folders state
            router.push({
              pathname: '/(tabs)/favorites',
              params: {
                mode: 'interview'
              }
            });
          } else {
            // Navigate back to folders page after deletion
            router.push('/(tabs)/folders');
          }
        } else {
          console.error('Failed to delete folder');
          // You could show an error message to the user here
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        // You could show an error message to the user here
      }
    });
    
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteFolderModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
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

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async (deckId: number, currentFavorited: boolean) => {
    try {
      const newFavoritedValue = currentFavorited ? 0 : 1;
      const userID = await getCurrentUserID();
      
      // Update database
      await db.execAsync(`
        UPDATE decks 
        SET isFavorited = ${newFavoritedValue}
        WHERE deckID = ${deckId} AND userID = '${userID}'
      `);
      
      // Update local state immediately
      setDecks(prev => 
        prev.map(deck => 
          deck.deckID === deckId 
            ? { ...deck, isFavorited: newFavoritedValue }
            : deck
        )
      );
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleDeleteSelectedDecks = async () => {
    try {
      // Get the selected deck IDs
      const selectedDeckIds = Array.from(selectedDecks).map(index => decks[index].deckID);

      if (selectedDeckIds.length === 0) {
        console.log('No decks selected for deletion');
        return;
      }

      // Remove the folderID from each selected deck's folderIDs field
      const currentFolderId = parseInt(folderId as string);
      
      for (const deckId of selectedDeckIds) {
        // Get the current deck's folderIDs
        const userID = await getCurrentUserID();
        const deckResult = await db.getFirstAsync(`
          SELECT folderIDs FROM decks WHERE deckID = ? AND userID = ?
        `, [deckId, userID]);
        
        if (deckResult) {
          const deck = deckResult as { folderIDs: string | null };
          let folderIds: number[] = [];
          
          // Parse existing folderIDs if they exist
          if (deck.folderIDs) {
            try {
              folderIds = JSON.parse(deck.folderIDs);
            } catch (error) {
              console.error('Error parsing folderIDs for deck', deckId, error);
              folderIds = [];
            }
          }
          
          // Remove the current folderID from the array
          const updatedFolderIds = folderIds.filter(id => id !== currentFolderId);
          
          // Update the deck with the new folderIDs
          await db.runAsync(`
            UPDATE decks 
            SET folderIDs = ?, lastModifiedDate = '${new Date().toISOString()}'
            WHERE deckID = ? AND userID = ?
          `, [JSON.stringify(updatedFolderIds), deckId, userID]);
          
          console.log(`Removed folder ${currentFolderId} from deck ${deckId}`);
        }
      }
      
      // Update the folder's lastModifiedDate since decks were removed
      const folderUserID = await getCurrentUserID();
      await db.execAsync(`
        UPDATE folders 
        SET lastModifiedDate = '${new Date().toISOString()}'
        WHERE folderID = ${currentFolderId} AND userID = '${folderUserID}'
      `);
      console.log(`Updated lastModifiedDate for folder ${currentFolderId} after deck removal`);
      
      // Clear selections first to prevent render issues
      setSelectedDecks(new Set());
      
      // Update local state by removing the decks from the current folder view
      const remainingDecks = decks.filter(deck => !selectedDeckIds.includes(deck.deckID));
      setDecks(remainingDecks);
      setDecksCount(remainingDecks.length);

      // Exit selection mode after state updates
      setTimeout(() => {
        handleCancel();
      }, 0);
      
      console.log(`Successfully removed ${selectedDeckIds.length} deck(s) from folder ${currentFolderId}`);
    } catch (error) {
      console.error('Error removing decks from folder:', error);
    }
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
        
        // Set source page based on current sourcePage
        setSourcePageForFolders(sourcePage as string || 'index');
        
        // Get the selected deck IDs
        const selectedDeckIds = Array.from(selectedDecks).map(index => decks[index].deckID);
        
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
                folderId: folderId as string,
                sourcePage: sourcePage as string,
                selectedDeckIds: JSON.stringify(selectedDeckIds)
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
              folderId: folderId as string,
              sourcePage: sourcePage as string,
              selectedDeckIds: JSON.stringify(selectedDeckIds)
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
        setDeleteModalText('Are you sure you want to delete from this folder?');
        setHandleDeletion(() => handleDeleteSelectedDecks);
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
    // Show empty state if no decks
    if (!decks || decks.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <LottieView
            key="folder-empty-state"
            source={require('@/assets/animations/EmptyState3.json')}
            autoPlay
            loop
            style={styles.emptyStateAnimation}
          />
          <Text style={[styles.emptyStateText, 
            // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
            ]}>
            {language === 'Chinese' ? '此文件夹中没有卡组' : "Whoops! No more\ndecks in this folder"}
          </Text>
        </View>
      );
    }
    
    const cards = decks.map((data, index) => {
      const cardDesign = getDeckCardDesign(data.cardDesignIndex, data.isAIDeck === 1, data.AICardDesignIndex);
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <Card
          key={`deck-${data.deckID}`}
          style={style}
          backgroundImage={cardDesign.background}
          pressedBackgroundImage={cardDesign.pressed}
          containerWidthPercentage={cardWidthPercentage}
          isSelectMode={isSelectMode}
          selected={selectedDecks.has(index)}
          onSelectPress={() => handleDeckSelection(index, !selectedDecks.has(index))}
          circleButtonOpacity={circleButtonOpacity}
          percent={data.progress}
          showProgress={!isSelectMode}
          image={imageSources.get(data.deckID)}
          cardType={data.deckType === 'interview' && data.interviewType ? data.interviewType : data.deckType}
          title={data.deckName}
          date={formatDate(data.dateAdded)}
          flashcardCount={data.flashcardCount}
          deckDetailsBackgroundIndex={data.cardDesignIndex}
          company={data.deckType === 'interview' && data.interviewCompany ? data.interviewCompany : undefined}
          folderTitle={folderTitle as string}
          folderId={folderId as string}
          sourcePage={sourcePage as string}
          isStudy={data.deckType === 'study'}
          isFavorited={data.isFavorited === 1}
          onFavoriteToggle={() => handleFavoriteToggle(data.deckID, data.isFavorited === 1)}
          deckID={data.deckID}
        />
      );
    });
    return cards;
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <View style={[styles.topBar, { top: getTopBarTopHeight()}]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
          </View>
          
            <View style={[styles.headerIconsContainer, { top: getHeaderIconsTopHeight()}]}>
              <FolderDetailsTopBar 
              onEditNamePress={handleEditNamePress}
              editNameSelected={editNameSelected}
              onDeletePress={handleDeleteFolder}
            />
          </View>

          <Animated.View style={[
            styles.mainContentWrapper,
            { marginBottom: marginAnim }
          ]}>
            <View style={[styles.content, { marginTop: getContentTopHeightNoRoundedToggle2()}]}>
              <View style={styles.titleRow}>
                <Text style={[
                  styles.title,
                ]} numberOfLines={2}>
                  {folderTitle}
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
                      <Title style={[
                        styles.titleAbsolute,
                        // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium', fontSize: 20 }
                      ]}>
                          {language === 'Chinese' ? `卡组 (${decksCount})` : `Decks (${decksCount})`}
                      </Title>
                    </View>
                        
                    <TouchableOpacity 
                        onPress={isSelectMode ? handleSelectAll : handleSelect}
                        style={styles.selectButtonContainer}
                        disabled={isSelectMode ? false : decks.length === 0}
                    >
                        <Animated.Text style={[
                            isSelectMode ? styles.selectButton : (decks.length === 0 ? styles.selectButtonDisabled : styles.selectButton),
                            styles.selectButtonAbsolute,
                            { opacity: selectOpacity },
                            // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
                        ]}>
                            {language === 'Chinese' ? '选择' : 'Select'}
                        </Animated.Text>
                        <Animated.Text style={[
                            styles.selectButton,
                            styles.selectButtonAbsolute,
                            { opacity: selectAllOpacity },
                            // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
                        ]}>
                            {language === 'Chinese' ? '全选' : 'Select All'}
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
        </View>
      </SafeAreaView>
      <BottomTextInputModal
        visible={showEditModal}
        value={editText}
        onChangeText={setEditText}
        onDone={handleDoneEdit}
        placeholder={language === 'Chinese' ? '编辑文件夹名称...' : 'Edit folder name...'}
      />
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
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
    top: 55,
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
  fab: {
    position: 'absolute',
    bottom: 20,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateAnimation: {
    width: 200,
    height: 200,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Satoshi-Medium',
    color: '#333333',
    textAlign: 'center',
    marginTop: 20,
  },
  selectButtonDisabled: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#CCCCCC',
  },
});