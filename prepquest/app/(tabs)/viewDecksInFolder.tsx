import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { HeaderIconButtonsRef } from '@/components/general/HeaderIconButtons';
import { Title } from '@/components/general/Title';
import { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { MenuContext } from '@/contexts/MenuContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { FolderDetailsTopBar } from '@/components/folderComponents/FolderDetailsTopBar';
import { ActionButtonsRow } from '@/components/general/ActionButtonsRow';
import { Card } from '@/components/general/Card';
import { FloatingActionButton } from '@/components/general/FloatingActionButton';

import { BottomTextInputModal } from '@/components/general/BottomTextInputModal';
import { 
  getDecksInFolder, 
  Deck, 
  deleteFolder, 
  checkFolderNameExists, 
  getCompanyIconImageSource,
  updateFolderName,
  removeDecksFromFolder,
  updateDeckFavoriteStatusInFolder,
  checkDatabaseReady,
  getFolderById
} from '@/db/decks';
import { getDeckCardDesign } from '@/constants/cardDesigns';
import { Toast } from '@/components/general/Toast';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopBarTopHeight, useHeaderIconsTopHeight, useContentTopHeightNoRoundedToggle2 } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { useBackgroundTaskRefresh } from '@/hooks/useBackgroundTaskRefresh';

const SCREEN_TRANSITION_DURATION = 200;
const BOTTOM_SPACING = 20; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down



export default function ViewDecksInFolderScreen() {
  const router = useRouter();
  const { folderTitle, folderId, sourcePage } = useLocalSearchParams();
  const { theme } = useTheme();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const isFocused = useIsFocused();
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    navbarRef,
    setIsNoSelectionModalOpen,
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
  const getTopBarTopHeight = useTopBarTopHeight();
  const getHeaderIconsTopHeight = useHeaderIconsTopHeight();
  const getContentTopHeightNoRoundedToggle2 = useContentTopHeightNoRoundedToggle2();

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
  const [folderTitleFromDb, setFolderTitleFromDb] = useState<string>('');
  const selectUnselectedDuration = 150; // Reduced from 300ms for better performance on low-end devices
  const selectTextAnim = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const cardWidthPercentage = useRef(new Animated.Value(100)).current;
  const circleButtonOpacity = useRef(new Animated.Value(0)).current;

  // Edit name modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState((folderTitle || folderTitleFromDb) as string || '');
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
    const checkDatabaseReadyLocal = async () => {
      try {
        const isReady = await checkDatabaseReady();
        setIsDatabaseReady(isReady);
      } catch (error) {
        console.error('Database not ready yet, waiting...', error);
        // Retry after a short delay
        setTimeout(checkDatabaseReadyLocal, 500);
      }
    };
    
    checkDatabaseReadyLocal();
  }, []);

  // Fetch folder title from database if not provided in params
  useEffect(() => {
    const fetchFolderTitle = async () => {
      if (!isDatabaseReady || !folderId || folderTitle) {
        return;
      }
      
      try {
        const folderData = await getFolderById(parseInt(folderId as string));
        if (folderData) {
          setFolderTitleFromDb(folderData.folderName);
        }
      } catch (error) {
        console.error('Error fetching folder title:', error);
      }
    };

    fetchFolderTitle();
  }, [isDatabaseReady, folderId, folderTitle]);

  // Load decks data from database
  useEffect(() => {
    const loadDecksData = async () => {
      if (!isDatabaseReady || !folderId) {
        return;
      }
      
      try {
        const decksData = await getDecksInFolder(parseInt(folderId as string));
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

  // Background task refresh hook
  const { shouldRefresh, backgroundTaskProgress } = useBackgroundTaskRefresh({
    onTaskComplete: () => {
      console.log('Background task completed - refreshing folder decks data');
      // Refresh folder decks data when background task completes
      if (isDatabaseReady && folderId) {
        const loadDecksData = async () => {
          try {
            const decksData = await getDecksInFolder(parseInt(folderId as string));
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
            console.error('Error refreshing folder decks data:', error);
          }
        };
        loadDecksData();
      }
    }
  });

  // Fallback refresh mechanism - watch for background task completion
  useEffect(() => {
    if (backgroundTaskProgress?.completed === true && isDatabaseReady && folderId) {
      console.log('Fallback: Background task completed - refreshing folder decks data');
      const loadDecksData = async () => {
        try {
          const decksData = await getDecksInFolder(parseInt(folderId as string));
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
          console.error('Error refreshing folder decks data (fallback):', error);
        }
      };
      loadDecksData();
    }
  }, [backgroundTaskProgress?.completed, isDatabaseReady, folderId]);

  // Reset header icons state when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset header icons
      headerIconsRef.current?.reset();
      
      // Set the delete modal text for viewDecksInFolder
      setDeleteModalText(strings[language].viewDecksInFolder.deleteFromFolderConfirmation);
      
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
    }
    if (folderTitle || folderTitleFromDb) {
      setCurrentFolderTitle((folderTitle || folderTitleFromDb) as string);
    }
    if (sourcePage) {
      setCurrentSourcePage(sourcePage as string);
    }
  }, [folderId, folderTitle, folderTitleFromDb, sourcePage, setCurrentFolderId, setCurrentFolderTitle, setCurrentSourcePage]);

  // Helper function to format date
  const formatDate = useCallback((dateString: string): string => {
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
  }, []);


  const handleBackPress = useCallback(() => {
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
  }, [sourcePage, router, navbarRef]);

  const slidingMenuDuration = 250; // Optimized for Android

  const handleSelectAll = useCallback(() => {
      const allDeckIndices = new Set(Array.from({ length: decks.length }, (_, i) => i));
      setSelectedDecks(allDeckIndices);
  }, [decks.length]);

  const handleSelect = useCallback(() => {
    setIsSelectMode(true);
    
    const animationConfig = getAnimationConfig();
    
    // Use staggered animations for low-end devices to reduce load
    if (animationConfig.maxParallelAnimations < 7) {
      // Stagger animations in groups for low-end devices
      const group1 = [
        Animated.timing(shiftAnim, {
          toValue: SHIFT_DISTANCE,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
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
      ];
      
      const group2 = [
        Animated.timing(marginAnim, {
          toValue: BOTTOM_SPACING + SHIFT_DISTANCE,
          duration: selectUnselectedDuration,
          useNativeDriver: false,
        }),
        Animated.timing(fabOpacity, {
          toValue: 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(circleButtonOpacity, {
          toValue: 1,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
      ];
      
      const group3 = [
        Animated.timing(cardWidthPercentage, {
          toValue: 85,
          duration: selectUnselectedDuration,
          useNativeDriver: false,
        }),
      ];
      
      // Run groups with slight stagger
      Animated.parallel(group1).start(() => {
        setTimeout(() => {
          Animated.parallel(group2).start(() => {
            setTimeout(() => {
              Animated.parallel(group3).start();
            }, animationConfig.staggerDelay);
          });
        }, animationConfig.staggerDelay);
      });
    } else {
      // Use all parallel animations for high-end devices
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
  }, [shiftAnim, marginAnim, actionRowOpacity, selectTextAnim, fabOpacity, cardWidthPercentage, circleButtonOpacity]);

  const handleCancel = useCallback(() => {
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
  }, [shiftAnim, marginAnim, actionRowOpacity, selectTextAnim, fabOpacity, cardWidthPercentage, circleButtonOpacity]);

  const handleEditNamePress = useCallback(() => {
    if (editNameSelected) return;
    setEditText((folderTitle || folderTitleFromDb) as string || '');
    setShowEditModal(true);
    setEditNameSelected(true);
  }, [editNameSelected, folderTitle, folderTitleFromDb]);

  const handleDoneEdit = async () => {
    const trimmedText = editText.trim();
    
    // Check if the text is empty
    if (!trimmedText) {
      setToastMessage(strings[language].viewDecksInFolder.folderNameEmpty);
      setShowToast(true);
      return;
    }
    
    // Check if the folder name has actually changed (ignoring whitespace)
    const currentFolderName = ((folderTitle || folderTitleFromDb) as string || '').trim();
    if (trimmedText === currentFolderName) {
      // No change, just close the modal
      setShowEditModal(false);
      setEditNameSelected(false);
      return;
    }
    
    // Check if the folder name already exists (excluding current folder)
    const folderExists = await checkFolderNameExists(trimmedText, parseInt(folderId as string));
    
    if (folderExists) {
      setToastMessage(strings[language].viewDecksInFolder.folderNameExists);
      setShowToast(true);
      return;
    }
    
        // If validation passes, update the folder name
    try {
      const success = await updateFolderName(parseInt(folderId as string), trimmedText);
      
      if (success) {
        // Update local state to reflect the change immediately
        setEditText(trimmedText);
        
        // Close the modal
        setShowEditModal(false);
        setEditNameSelected(false);
        
        // Force a re-render by updating the folder title in the route params
        // This will make the new name appear in the UI immediately
        router.setParams({ folderTitle: trimmedText });
      } else {
        setToastMessage(strings[language].viewDecksInFolder.errorUpdatingFolderName);
        setShowToast(true);
      }
      
    } catch (error) {
      console.error('Error updating folder name:', error);
      setToastMessage(strings[language].viewDecksInFolder.errorUpdatingFolderName);
      setShowToast(true);
    }
  };

  const handleDeleteFolder = useCallback(() => {
    // Show delete folder confirmation modal
    setIsMenuOpen(true);
    setIsDeleteFolderModalOpen(true);
    setHandleDeleteFolder(() => async () => {
      try {
        // Delete the folder from database
        const success = await deleteFolder(parseInt(folderId as string));
        
        if (success) {          
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
  }, [folderId, folderTitle, folderTitleFromDb, sourcePage, router, menuOverlayOpacity, deleteFolderModalOpacity]);

  const handleDeckSelection = useCallback((index: number, selected: boolean) => {
    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = useCallback(async (deckId: number, currentFavorited: boolean) => {
    try {
      const success = await updateDeckFavoriteStatusInFolder(deckId, !currentFavorited);
      
      if (success) {
        // Update local state immediately
        const newFavoritedValue = currentFavorited ? 0 : 1;
        setDecks(prev => 
          prev.map(deck => 
            deck.deckID === deckId 
              ? { ...deck, isFavorited: newFavoritedValue }
              : deck
          )
        );
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  }, []);

  const handleDeleteSelectedDecks = async () => {
    try {
      // Get the selected deck IDs
      const selectedDeckIds = Array.from(selectedDecks).map(index => decks[index].deckID);

      if (selectedDeckIds.length === 0) {
        return;
      }

      // Remove the folderID from each selected deck's folderIDs field
      const currentFolderId = parseInt(folderId as string);
      
      const success = await removeDecksFromFolder(selectedDeckIds, currentFolderId);
      
      if (success) {
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
      }
    } catch (error) {
      console.error('Error removing decks from folder:', error);
    }
  };

  const handleActionIconPress = useCallback((index: number) => {
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
                folderTitle: (folderTitle || folderTitleFromDb) as string,
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
              folderTitle: (folderTitle || folderTitleFromDb) as string,
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
        setDeleteModalText(strings[language].viewDecksInFolder.deleteFromFolderConfirmation);
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
  }, [selectedDecks, decks, sourcePage, folderTitle, folderTitleFromDb, folderId, language, router, navbarRef, menuOverlayOpacity, noSelectionModalOpacity, trashModalOpacity, slidingMenuDuration]);

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const styles = StyleSheet.create({
    animatedContainer: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
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
      fontFamily: Fonts.title,
      color: Colors[theme].text,
      lineHeight: 36,
    },
    decksContainer: {
      flex: 1,
      marginTop: 16,
    },
    decksCount: {
      fontSize: 24,
      fontFamily: Fonts.title,
      color: Colors[theme].text,
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
      fontFamily: Fonts.bodyMedium,
      color: Colors.light.brandColor1,
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
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].text,
      textAlign: 'center',
      marginTop: 20,
    },
    selectButtonDisabled: {
      fontSize: 20,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].unselectedText,
    },
  });

  const renderDecks = () => {
    // Show empty state if no decks
    if (!decks || decks.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <LottieView
            key="folder-empty-state"
            source={require('@/assets/animations/EmptyState2.json')}
            autoPlay
            loop
            style={styles.emptyStateAnimation}
          />
          <Text style={[styles.emptyStateText, 
            // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
            ]}>
            {strings[language].viewDecksInFolder.noDecksInFolder}
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
          folderTitle={(folderTitle || folderTitleFromDb) as string}
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
                  {folderTitle || folderTitleFromDb}
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
                          {`${strings[language].viewDecksInFolder.decksCount} (${decksCount})`}
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
                            {strings[language].viewDecksInFolder.select}
                        </Animated.Text>
                        <Animated.Text style={[
                            styles.selectButton,
                            styles.selectButtonAbsolute,
                            { opacity: selectAllOpacity },
                            // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
                        ]}>
                            {strings[language].viewDecksInFolder.selectAll}
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
              onPress={() => {}}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
      <BottomTextInputModal
        visible={showEditModal}
        value={editText}
        onChangeText={setEditText}
        onDone={handleDoneEdit}
        placeholder={strings[language].viewDecksInFolder.editFolderNamePlaceholder}
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