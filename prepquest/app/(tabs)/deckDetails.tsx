import React, { useState, useRef, useEffect, useContext, useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ImageBackground, ScrollView, Image, Dimensions, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/general/ThemedView';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from '@/contexts/MenuContext';
import { DeckDetailsTopBar } from '@/components/deckDetails/DeckDetailsTopBar';
import { FavoriteButton } from '@/components/general/FavoriteButton';
import { AverageGradeThermometer } from '@/components/statsComponents/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/statsComponents/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/statsComponents/AverageSpeedTotal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTextInputModal } from '@/components/general/BottomTextInputModal';
import LottieView from 'lottie-react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { deckDetailsCardDesigns, deckDetailsAICardDesigns } from '@/constants/cardDesigns';

import { 
  deleteDeck, 
  getDeckGrade, 
  getDeckAverageTime, 
  getDeckInfoWithProgress, 
  DeckGrade, 
  saveAIDeck, 
  checkDeckNameExists, 
  getCompanyIconImageSource,
  updateDeckName,
  updateDeckFavoriteStatus,
  getAIDeckInfo,
  getAIDeckGrade,
  getAIDeckAverageTime,
  checkFlashcardAttemptStatus,
  checkAIDeckSavedStatus,
  getAIDeckProgress,
  getDeckBreakdown
} from '@/db/decks';
import { Toast } from '@/components/general/Toast';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTopBarTopHeight, useHeaderIconsTopHeight, useContentTopHeight } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedScreenTransition } from '@/utils/performanceOptimizations';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDate as formatDateDisplay } from '@/utils/dateFormat';



// Removed SCREEN_TRANSITION_DURATION - now using animationConfig.screenTransitionDuration

export default function DeckDetailsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const { deckId, isAIDeck, sourcePage, folderTitle, folderId, isFavorited} = useLocalSearchParams();
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
    setDeckDetailsSaveModalType,
  } = useContext(MenuContext);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const getTopBarTopHeight = useTopBarTopHeight();
  const getHeaderIconsTopHeight = useHeaderIconsTopHeight();
  const getContentTopHeight = useContentTopHeight();
  const animationConfig = useMemo(() => getAnimationConfig(), []);

  // Card type color and label logic
  const cardTypeMap: Record<string, { color: string; label: string }> = useMemo(() => ({
    behavioral: { color: Colors[theme].brandColor1, label: strings[language].cardTypes.behavioral },
    technical: { color: Colors[theme].alertColor, label: strings[language].cardTypes.technical },
    brainteasers: { color: Colors[theme].brandColor2, label: strings[language].cardTypes.brainteasers },
    'case study': { color: Colors[theme].brandColor1, label: strings[language].cardTypes['case study'] },
    others: { color: Colors[theme].brandColor1, label: strings[language].cardTypes.others },
    study: { color: Colors[theme].brandColor1, label: strings[language].cardTypes.study },
  }), [theme, language]);

  // State for favorite status
  const [favoriteStatus, setFavoriteStatus] = useState(isFavorited === '1');

  // State for deck grade
  const [deckGrade, setDeckGrade] = useState<DeckGrade | null>(null);
  const [isLoadingGrade, setIsLoadingGrade] = useState(true);

  // State for difficulty breakdown (separate from grade to always reflect current flashcard difficulties)
  const [breakdown, setBreakdown] = useState<{
    Again: number;
    Hard: number;
    Good: number;
    Easy: number;
  } | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(true);

  // State for average time
  const [averageTime, setAverageTime] = useState<number | null>(null);
  const [isLoadingAverageTime, setIsLoadingAverageTime] = useState(true);

  // State for deck information
  const [deckInfo, setDeckInfo] = useState<any | null>(null);
  const [isLoadingDeckInfo, setIsLoadingDeckInfo] = useState(true);

  // State for flashcard attempt status
  const [hasAttemptedFlashcards, setHasAttemptedFlashcards] = useState<boolean | null>(null);
  const [isLoadingAttemptStatus, setIsLoadingAttemptStatus] = useState(true);

  // State to track if AI deck has been saved to regular decks table
  const [isAIDeckSaved, setIsAIDeckSaved] = useState<boolean | null>(null);
  const [isLoadingSavedStatus, setIsLoadingSavedStatus] = useState(true);

  // State for company logo image source
  const [companyLogoImageSource, setCompanyLogoImageSource] = useState<any>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // State to track if initial data is loaded to prevent showing default values
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Get deck information from database
  const deckTitle = useMemo(() => deckInfo?.deckName || '', [deckInfo?.deckName]);
  const deckType = useMemo(() => deckInfo?.deckType || '', [deckInfo?.deckType]);
  const cardType = useMemo(() => deckInfo?.deckType === 'interview' ? deckInfo?.interviewType : deckInfo?.deckType, [deckInfo?.deckType, deckInfo?.interviewType]);
  const backgroundIndex = useMemo(() => deckInfo?.AICardDesignIndex || deckInfo?.cardDesignIndex || 0, [deckInfo?.AICardDesignIndex, deckInfo?.cardDesignIndex]);
  const cardDate = useMemo(
    () => (deckInfo?.dateAdded ? formatDateDisplay(deckInfo.dateAdded, language) : ''),
    [deckInfo?.dateAdded, language]
  );
  const cardFlashcardCount = useMemo(() => deckInfo?.flashcardCount || 0, [deckInfo?.flashcardCount]);
  const cardPercent = useMemo(() => deckInfo?.progress || 0, [deckInfo?.progress]);
  const AIDeck = useMemo(() => isAIDeck as string === 'true', [isAIDeck]);
  
  // Helper function to get company logo based on deck info
  const getCompanyLogo = useCallback(() => {
    if (!deckInfo) {
      return require('@/assets/companyIcons/StudyCardIcon.png');
    }
    
    if (deckInfo.deckType === 'study') {
      return require('@/assets/companyIcons/StudyCardIcon.png');
    } else if (deckInfo.deckType === 'interview') {
      // Only show company logo if interviewCompanyIcon is not null and we have a valid image source
      if (deckInfo.interviewCompanyIcon && companyLogoImageSource) {
        return companyLogoImageSource;
      } else {
        // If no company icon or null, use study icon instead of default company icon
        return require('@/assets/companyIcons/companyDefaultIcon.png');
      }
    }
    
    // Fallback to study icon
    return require('@/assets/companyIcons/StudyCardIcon.png');
  }, [deckInfo, companyLogoImageSource]);
  
  const cardCompanyLogo = useMemo(() => getCompanyLogo(), [getCompanyLogo]);

  // Ensure backgroundIndex is within bounds for AI card designs (which has 3 elements)
  const safeBackgroundIndex = useMemo(() => AIDeck ? Math.min(backgroundIndex, deckDetailsAICardDesigns.length - 1) : backgroundIndex, [AIDeck, backgroundIndex]);

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async () => {
    try {
      const success = await updateDeckFavoriteStatus(parseInt(deckId as string), !favoriteStatus);
      
      if (success) {
        // Update local state immediately
        setFavoriteStatus(!favoriteStatus);
      }
    } catch (error) {
      // Handle error silently
      console.error('Error updating deck favorite status:', error);
    }
  };

  // Clear previous deck data immediately when deckId changes
  useEffect(() => {
    // Clear all previous deck data to prevent showing stale data
    setDeckInfo(null);
    setDeckGrade(null);
    setBreakdown(null);
    setAverageTime(null);
    setHasAttemptedFlashcards(null);
    setIsAIDeckSaved(null);
    setCompanyLogoImageSource(null);
    setIsInitialDataLoaded(false); // Prevent rendering until new data loads
    
    // Reset loading states
    setIsLoadingDeckInfo(true);
    setIsLoadingGrade(true);
    setIsLoadingBreakdown(true);
    setIsLoadingAverageTime(true);
    setIsLoadingAttemptStatus(true);
    setIsLoadingSavedStatus(true);
  }, [deckId]);

  // Handle screen transitions with performance optimization
  useEffect(() => {
    if (isFocused) {
      // Reset navbar animation when screen comes into focus
      navbarRef?.current?.resetAnimation();
      
      // Use optimized screen transition
      optimizedScreenTransition.transitionWithDataPreload(
        () => {
          // Ensure opacity starts at 0 for a clean fade-in
          screenOpacity.setValue(0);
          
          // Add device-optimized delay for smoother fade-in animation
          setTimeout(() => {
            Animated.timing(screenOpacity, {
              toValue: 1,
              duration: animationConfig.screenTransitionDuration,
              useNativeDriver: true,
            }).start();
          }, animationConfig.isLowEndDevice ? 100 : 50);
        },
        // Pre-load all deck data
        () => loadAllDeckData()
      );
    } else {
      screenOpacity.setValue(0);
    }
  }, [isFocused, animationConfig]);

  // Clean up animation when component unmounts
  useEffect(() => {
    return () => {
      screenOpacity.setValue(0);
    };
  }, []);

  // Update favorite status when isFavorited prop changes
  useEffect(() => {
    setFavoriteStatus(isFavorited === 'true');
  }, [isFavorited]);

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
    
    // Check if we should navigate back to folders page
    if (sourcePage === 'folders') {
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
        deckTitle: deckTitle,
        deckType: deckType,
        deckDetailsBackgroundIndex: backgroundIndex.toString(),
        date: cardDate,
        flashcardCount: cardFlashcardCount.toString(),
        percent: cardPercent.toString(),
        company: deckInfo?.interviewCompany || '',
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

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleEditNamePress = () => {
    if (editNameSelected) return;
    setEditText(deckTitle as string || '');
    setShowEditModal(true);
    setEditNameSelected(true);
  };

  const handleDoneEdit = async () => {
    const trimmedText = editText.trim();
    
    // Check if the text is empty
    if (!trimmedText) {
      setToastMessage(strings[language].deckDetails.deckNameCannotBeEmpty);
      setShowToast(true);
      return;
    }
    
    // Check if the deck name has actually changed (ignoring whitespace)
    const currentDeckName = (deckTitle as string || '').trim();
    if (trimmedText === currentDeckName) {
      // No change, just close the modal
      setShowEditModal(false);
      setEditNameSelected(false);
      return;
    }
    
    // Check if the deck name already exists (excluding current deck)
    const deckExists = await checkDeckNameExists(trimmedText, parseInt(deckId as string));
    
    if (deckExists) {
      setToastMessage(strings[language].deckDetails.deckNameAlreadyExists);
      setShowToast(true);
      return;
    }
    
    // If validation passes, update the deck name
    try {
      const success = await updateDeckName(parseInt(deckId as string), trimmedText);
      
      if (success) {
        // Update local state to reflect the change immediately
        setEditText(trimmedText);
        setDeckInfo((prev: any) => prev ? { ...prev, deckName: trimmedText, lastModifiedDate: new Date().toISOString() } : prev);
        
        // Close the modal
        setShowEditModal(false);
        setEditNameSelected(false);
        
        // Force a re-render by updating the deck title in the route params
        // This will make the new name appear in the UI immediately
        router.setParams({ deckTitle: trimmedText });
      } else {
        setToastMessage(strings[language].deckDetails.errorUpdatingDeckName);
        setShowToast(true);
      }
      
    } catch (error) {
      setToastMessage(strings[language].deckDetails.errorUpdatingDeckName);
      setShowToast(true);
    }
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
        totalNumberOfFlashcards: cardFlashcardCount.toString(),
        isStudyMode: 'true',
        isAIDeck: isAIDeck as string,
        deckID: deckId as string,
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
        totalNumberOfFlashcards: cardFlashcardCount.toString(),
        isQuizMode: 'true',
        isAIDeck: isAIDeck as string,
        deckID: deckId as string,
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
        deckTitle: deckTitle,
        deckType: deckType,
        deckDetailsBackgroundIndex: backgroundIndex.toString(),
        date: cardDate,
        flashcardCount: cardFlashcardCount.toString(),
        percent: cardPercent.toString(),
        company: deckInfo?.interviewCompany || '',
        isAIDeck: isAIDeck as string,
        // Pass the original navigation context
        originalSourcePage: sourcePage as string,
        originalFolderTitle: folderTitle as string,
        originalFolderId: folderId as string
      }
    });

  };

  // Function to handle deck deletion
  const handleDeckDeletion = async () => {
    try {
      // Delete the deck from database
      const success = await deleteDeck(parseInt(deckId as string));
      
      if (success) {
        
        // Navigate back based on source page
        if (folderTitle && folderId) {
          // Navigate back to viewDecksInFolder
          router.push({
            pathname: '/(tabs)/viewDecksInFolder',
            params: {
              folderTitle: folderTitle as string,
              folderId: folderId as string,
              sourcePage: sourcePage as string
            }
          });
        } else if (sourcePage === 'favorites') {
          // Navigate back to favorites page
          router.push('/(tabs)/favorites');
        } else {
          // Navigate back to index page
          navbarRef?.current?.setDecksTab();
          router.push({
            pathname: '/(tabs)',
            params: {
              mode: currentMode
            }
          });
        }
      } else {
        console.error('Error deleting deck');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  // Function to load deck grade
  const loadDeckGrade = async () => {
    try {
      setIsLoadingGrade(true);
      
      // Use the isAIDeck parameter instead of querying the database
      const isAIDeckFromParams = isAIDeck as string === 'true';
      
      if (isAIDeckFromParams) {
        // Get AI deck grade
        const grade = await getAIDeckGrade(parseInt(deckId as string));
        setDeckGrade(grade);
      } else {
        // Get regular deck grade
        const grade = await getDeckGrade(parseInt(deckId as string));
        setDeckGrade(grade);
      }
      
    } catch (error) {
      setDeckGrade(null);
    } finally {
      setIsLoadingGrade(false);
    }
  };

  // Function to load average time
  const loadAverageTime = async () => {
    try {
      setIsLoadingAverageTime(true);
      
      // Use the isAIDeck parameter instead of querying the database
      const isAIDeckFromParams = isAIDeck as string === 'true';
      
      if (isAIDeckFromParams) {
        // Get AI deck average time
        const time = await getAIDeckAverageTime(parseInt(deckId as string));
        setAverageTime(time);
      } else {
        // Get regular deck average time
        const time = await getDeckAverageTime(parseInt(deckId as string));
        setAverageTime(time);
      }
      
    } catch (error) {
      setAverageTime(null);
    } finally {
      setIsLoadingAverageTime(false);
    }
  };





  // Function to check if any flashcards have been attempted
  const loadFlashcardAttemptStatus = async () => {
    try {
      setIsLoadingAttemptStatus(true);
      
      // Use the isAIDeck parameter instead of querying the database
      const isAIDeckFromParams = isAIDeck as string === 'true';
      
      const hasAttempted = await checkFlashcardAttemptStatus(parseInt(deckId as string), isAIDeckFromParams);
      setHasAttemptedFlashcards(hasAttempted);
      
    } catch (error) {
      setHasAttemptedFlashcards(false);
    } finally {
      setIsLoadingAttemptStatus(false);
    }
  };

  // Function to check if AI deck has been saved to regular decks table
  const loadAIDeckSavedStatus = async () => {
    try {
      setIsLoadingSavedStatus(true);
      
      // Only check if this is an AI deck
      const isAIDeckFromParams = isAIDeck as string === 'true';
      
      if (!isAIDeckFromParams) {
        setIsAIDeckSaved(false);
        return;
      }

      const isSaved = await checkAIDeckSavedStatus(parseInt(deckId as string));
      setIsAIDeckSaved(isSaved);
      
    } catch (error) {
      setIsAIDeckSaved(false);
    } finally {
      setIsLoadingSavedStatus(false);
    }
  };

  // Consolidated data loading function
  const loadAllDeckData = useCallback(async () => {
    const isAIDeckFromParams = isAIDeck as string === 'true';
    const deckIdNum = parseInt(deckId as string);
    
    try {
      // Load all deck data directly from database
      const [deckInfoData, deckGradeData, breakdownData, averageTimeData, attemptStatusData, savedStatusData] = await Promise.all([
        isAIDeckFromParams ? getAIDeckInfo(deckIdNum) : getDeckInfoWithProgress(deckIdNum),
        isAIDeckFromParams ? getAIDeckGrade(deckIdNum) : getDeckGrade(deckIdNum),
        getDeckBreakdown(deckIdNum, isAIDeckFromParams),
        isAIDeckFromParams ? getAIDeckAverageTime(deckIdNum) : getDeckAverageTime(deckIdNum),
        checkFlashcardAttemptStatus(deckIdNum, isAIDeckFromParams),
        isAIDeckFromParams ? checkAIDeckSavedStatus(deckIdNum) : Promise.resolve(false),
      ]);

      // Update all state at once
      setDeckInfo(deckInfoData);
      setDeckGrade(deckGradeData);
      setBreakdown(breakdownData);
      setAverageTime(averageTimeData);
      setHasAttemptedFlashcards(attemptStatusData);
      setIsAIDeckSaved(savedStatusData);

      // Load company logo if needed
      if (deckInfoData?.deckType === 'interview' && deckInfoData?.interviewCompanyIcon) {
        const imageSource = await getCompanyIconImageSource(deckInfoData.interviewCompanyIcon);
        setCompanyLogoImageSource(imageSource);
      }
      
      // Mark initial data as loaded
      setIsInitialDataLoaded(true);
    } catch (error) {
      console.error('Error loading deck data:', error);
      // Set default values on error
      setDeckInfo(null);
      setDeckGrade(null);
      setBreakdown(null);
      setAverageTime(null);
      setHasAttemptedFlashcards(false);
      setIsAIDeckSaved(false);
      setIsInitialDataLoaded(true); // Still mark as loaded to show error state
    } finally {
      // Update loading states
      setIsLoadingDeckInfo(false);
      setIsLoadingGrade(false);
      setIsLoadingBreakdown(false);
      setIsLoadingAverageTime(false);
      setIsLoadingAttemptStatus(false);
      setIsLoadingSavedStatus(false);
    }
  }, [deckId, isAIDeck]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadAllDeckData();
    } catch (error) {
      console.error('Error refreshing deck data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAllDeckData]);

  const handleDeletePress = () => {
    setShowEditModal(false);
    // Show delete confirmation modal
    setIsMenuOpen(true);
    setIsDeckDetailsDeleteModalOpen(true);
    setHandleDeckDetailsDeletion(() => handleDeckDeletion);
    
    // Set up dismiss callback to unselect edit name button
    setOnDeckDetailsDeleteModalDismiss(() => () => {
      setEditNameSelected(false);
    });
    
    if (animationConfig.isLowEndDevice) {
      // Instant modal for low-end devices
      menuOverlayOpacity.setValue(0.5);
      deckDetailsDeleteModalOpacity.setValue(1);
    } else {
      // Animated modal for high-end devices
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0.5,
          duration: animationConfig.duration,
          useNativeDriver: true,
        }),
        Animated.timing(deckDetailsDeleteModalOpacity, {
          toValue: 1,
          duration: animationConfig.duration,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const handleSavePress = async () => {
    setShowEditModal(false);
    
    try {
      // Call the saveAIDeck function
      const result = await saveAIDeck(parseInt(deckId as string));
      
      if (result.success && result.newDeckId) {
        
        // Show save confirmation modal first
        setIsMenuOpen(true);
        setIsDeckDetailsSaveModalOpen(true);
        setDeckDetailsSaveModalType('ai');
        
        // Set up dismiss callback to navigate to the new deck details page
        setOnDeckDetailsSaveModalDismiss(() => () => {
          setEditNameSelected(false);
          
          // Navigate to the new regular deck details page after modal is dismissed
          if (Platform.OS === 'ios') {
            navbarRef?.current?.resetAnimation();
            setTimeout(() => {
              router.push({
                pathname: '/(tabs)/deckDetails',
                params: {
                  deckId: result.newDeckId!.toString(),
                  isAIDeck: 'false', // Treat as regular deck
                  sourcePage: sourcePage as string,
                  folderTitle: deckTitle as string,
                  folderId: folderId as string,
                  isFavorited: favoriteStatus ? '1' : '0'
                }
              });
            }, 50);
          } else {
            router.push({
              pathname: '/(tabs)/deckDetails',
              params: {
                deckId: result.newDeckId!.toString(),
                isAIDeck: 'false', // Treat as regular deck
                sourcePage: sourcePage as string,
                folderTitle: deckTitle as string,
                folderId: folderId as string,
                isFavorited: favoriteStatus ? '1' : '0'
              }
            });
            setTimeout(() => {
              navbarRef?.current?.resetAnimation();
            }, 50);
          }
        });
        
        // Show the modal with performance optimization
        if (animationConfig.isLowEndDevice) {
          // Instant modal for low-end devices
          menuOverlayOpacity.setValue(0.4);
          deckDetailsSaveModalOpacity.setValue(1);
        } else {
          // Animated modal for high-end devices
          Animated.parallel([
            Animated.timing(menuOverlayOpacity, {
              toValue: 0.4,
              duration: animationConfig.duration * 2,
              useNativeDriver: true,
            }),
            Animated.timing(deckDetailsSaveModalOpacity, {
              toValue: 1,
              duration: animationConfig.duration * 2,
              useNativeDriver: true,
            })
          ]).start();
        }
        
      } else {
        // You could show an error message to the user here
        console.error('Error saving AI deck');
      }
    } catch (error) {
      // You could show an error message to the user here
      console.error('Error saving AI deck:', error);
    } 
  };

  useFocusEffect(
    useCallback(() => {
      setShowEditModal(false);
      setEditNameSelected(false);
      
      // Scroll to top when screen comes into focus
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }, [])
  );

  // Helper function to get last reviewed date
  const getLastReviewedDate = (): string => {
    if (!deckInfo) return '--';
    
    const studyDate = deckInfo.lastStudiedDate ? new Date(deckInfo.lastStudiedDate) : null;
    const quizDate = deckInfo.lastQuizzedDate ? new Date(deckInfo.lastQuizzedDate) : null;

    const formatOrDash = (value: string | null | undefined) =>
      value ? formatDateDisplay(value, language) : '--';
    
    if (!studyDate && !quizDate) return '--';
    if (!studyDate) return formatOrDash(deckInfo.lastQuizzedDate);
    if (!quizDate) return formatOrDash(deckInfo.lastStudiedDate);
    
    return formatOrDash(studyDate > quizDate ? deckInfo.lastStudiedDate : deckInfo.lastQuizzedDate);
  };

  // Helper function to format list items
  const formatList = (jsonString: string | null): string => {
    if (!jsonString) return '--';
    try {
      const items = JSON.parse(jsonString);
      return Array.isArray(items) ? items.join(', ') : jsonString;
    } catch (error) {
      return jsonString || '--';
    }
  };

  // Helper function to get safe value
  const getSafeValue = (value: any): string => {
    return value && value !== '' ? value : '--';
  };

  // Function to render metadata rows based on deck type
  const renderMetadataRows = () => {
    if (!deckInfo) return null;

    const deckType = deckInfo.deckType;
    
    if (deckType === 'study') {
      return (
        <>
          <MetadataRow label="Created via" value={getSafeValue(deckInfo.creationMethod)} />
          <MetadataRow label="Subject(s)" value={formatList(deckInfo.studySubjects)} />
          <MetadataRow label="Topics/Subtopics" value={formatList(deckInfo.studyTopicsSubtopics)} />
          <MetadataRow label="Education Level" value={getSafeValue(deckInfo.studyEducationLevel)} />
          <MetadataRow label="Exam/Quiz" value={getSafeValue(deckInfo.studyExamQuiz)} />
          <MetadataRow label="Last Reviewed date" value={getLastReviewedDate()} />
        </>
      );
    } else if (deckType === 'interview') {
      return (
        <>
          <MetadataRow label="Created via" value={getSafeValue(deckInfo.creationMethod)} />
          <MetadataRow label="Job/Role" value={getSafeValue(deckInfo.interviewJobRole)} />
          <MetadataRow label="Company" value={getSafeValue(deckInfo.interviewCompany)} />
          <MetadataRow label="Topics" value={formatList(deckInfo.interviewTopics)} />
          <MetadataRow label="Experience Level" value={getSafeValue(deckInfo.interviewExperienceLevel)} />
          <MetadataRow label="Last Reviewed date" value={getLastReviewedDate()} />
        </>
      );
    }
    
    return null;
  };

  // Function to load deck information
  const loadDeckInfo = async () => {
    try {
      setIsLoadingDeckInfo(true);
      
      // Check if this is an AI deck
      const isAIDeckFromParams = isAIDeck as string === 'true';
      
      if (isAIDeckFromParams) {
        // Query AIDecks table for AI deck info
        const deckData = await getAIDeckInfo(parseInt(deckId as string));
        
        if (!deckData) {
          setDeckInfo(null);
          return;
        }

        setDeckInfo(deckData);

        // Load company logo image source if it's an interview deck
        if (deckData.deckType === 'interview' && deckData.interviewCompanyIcon) {
          const imageSource = await getCompanyIconImageSource(deckData.interviewCompanyIcon);
          setCompanyLogoImageSource(imageSource);
        }
      } else {
        // Query regular decks table
        const info = await getDeckInfoWithProgress(parseInt(deckId as string));
        setDeckInfo(info);

        // Load company logo image source if it's an interview deck
        if (info?.deckType === 'interview' && info?.interviewCompanyIcon) {
          const imageSource = await getCompanyIconImageSource(info.interviewCompanyIcon);
          setCompanyLogoImageSource(imageSource);
        }
      }
      
    } catch (error) {
      setDeckInfo(null);
    } finally {
      setIsLoadingDeckInfo(false);
    }
  };



  // Local MetadataRow component
  interface MetadataRowProps {
    label: string;
    value: string;
  }
  function MetadataRow({ label, value }: MetadataRowProps) {
    // Map English label to Chinese if needed
    const labelMap: Record<string, string> = {
      'Created via': strings[language].deckDetails.createdVia,
      'Subject(s)': strings[language].deckDetails.subjects,
      'Topics/Subtopics': strings[language].deckDetails.topicsSubtopics,
      'Education Level': strings[language].deckDetails.educationLevel,
      'Exam/Quiz': strings[language].deckDetails.examQuiz,
      'Last Reviewed date': strings[language].deckDetails.lastReviewedDate,
      'Job/Role': strings[language].deckDetails.jobRole,
      'Company': strings[language].deckDetails.company,
      'Topics': strings[language].deckDetails.topics,
      'Experience Level': strings[language].deckDetails.experienceLevel,
    };
    const localizedLabel = language === 'Chinese' && labelMap[label] ? labelMap[label] : label;
    return (
      <View style={metadataRowStyles.container}>
        <Text style={[metadataRowStyles.label, {
          // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
          }]}>{localizedLabel}</Text>
        <Text style={[metadataRowStyles.value, {
          // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
          }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    );
  }
  const metadataRowStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    label: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      color: Colors[theme].text,
      flex: 0,
      marginRight: 16,
    },
    value: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 16,
      color: Colors[theme].text,
      textAlign: 'right',
      flex: 1,
      flexWrap: 'wrap',
    },
  });

  const getCardTypeColor = useCallback((cardType: string) => {
    return cardTypeMap[cardType]?.color || '#FDAE61';
  }, [cardTypeMap]);
  const getCardTypeLabel = useCallback((cardType: string) => {
    return cardTypeMap[cardType]?.label || strings[language].cardTypes.others;
  }, [cardTypeMap, language]);

  function LoadingBar({ percent }: { percent: number }) {
    const { language } = useLanguage();
    const { theme } = useTheme();
    const isComplete = percent === 100;
    return (
      <View style={styles.loadingBarBg}>
        <View style={[styles.loadingBarFg, { width: `${percent}%`, backgroundColor: isComplete ? Colors[theme].brandColor1 : Colors[theme].brandColor2 }]} />
        {isComplete && (
          <View style={styles.loadingBarTextContainer}>
            <Text style={styles.loadingBarCompleteText}>{strings[language].completed}</Text>
          </View>
        )}
      </View>
    );
  }

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
      left: 16,
      zIndex: 1,
    },
    backButton: {
      paddingTop: 8,
    },
    headerIconsContainer: {
      position: 'absolute',
      right: 16,
      zIndex: 1,
    },
    mainContainer: {
      flex: 1,
      marginHorizontal: 16,
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
      fontFamily: Fonts.bodyBold,
      color: Colors[theme].text,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      fontFamily: Fonts.bodyMedium,
      color: Colors[theme].unselectedText,
    },
    scrollView: {
      flex: 1,
      marginVertical: 20,
      marginHorizontal: 15,
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
      backgroundColor: Colors[theme].loadingBarBgColor,
      overflow: 'hidden',
      justifyContent: 'center',
      width: '100%',
    },
    loadingBarFg: {
      height: 11,
      borderRadius: 13,
      backgroundColor: Colors[theme].brandColor2,
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
    },
    progressLabel: {
      fontFamily: Fonts.bodyItalic,
      fontSize: 12,
      color: Colors[theme].text,
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
      fontFamily: Fonts.bodyItalic,
      fontSize: 12,
      color: Colors[theme].background,
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
      backgroundColor: Colors[theme].background,
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
      fontFamily: Fonts.bodyMedium,
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
      fontFamily: Fonts.title,
      fontSize: 24,
      color: Colors[theme].text,
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
      fontFamily: Fonts.bodyItalic,
      fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
      color: Colors[theme].text,
    },
    flashcardCountText: {
      fontFamily: Fonts.bodyItalic,
      fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
      color: Colors[theme].text,
    },
    cardDetailsContainer: {
      flex: 1,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 16,
      width: 67,
      height: 67,
      borderRadius: 67 / 2,
      backgroundColor: Colors[theme].brandColor2,
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
      marginLeft: 10
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
      fontFamily: Fonts.title,
      fontSize: 24,
      color: Colors[theme].text,
      lineHeight: Platform.OS === 'ios' ? 24 : 28,
      textAlign: 'left',
    },
    aiDeckCardTypePill: {
      width: 84,
      backgroundColor: Colors[theme].background,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      height: 38,
      borderRadius: 21,
      marginBottom: 8,
      marginRight: 5
    },
    aiDeckCardTypeText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 14,
      textAlign: 'center',
    },
    aiDeckFlashcardCount: {
      fontFamily: Fonts.bodyItalic,
      fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
      color: Colors[theme].text,
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
    },
    aiDeckStatsMessage: {
      fontFamily: Fonts.bodyItalic,
      fontSize: 20,
      color: Colors[theme].text,
      textAlign: 'center',
      marginTop: 10,
    },
    metadataContainer: {
      backgroundColor: 'transparent',
    },
    metadataTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 18,
      color: Colors[theme].text,
      marginBottom: 16,
      paddingHorizontal: 16,
    },
  });

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
        <View style={[styles.topBar, { top: getTopBarTopHeight()}]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color={Colors[theme].normalIconColor} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.headerIconsContainer, { top: getHeaderIconsTopHeight()}]}>
            <DeckDetailsTopBar 
              onStudyPress={handleStudyPress}
              onQuizPress={handleQuizPress}
              onFolderPress={handleFolderPress}
              onDeletePress={handleDeletePress}
              onEditNamePress={handleEditNamePress}
              editNameSelected={editNameSelected}
              isFolderDisabled={AIDeck && !isAIDeckSaved}
              isDeleteDisabled={AIDeck && !isAIDeckSaved}
              isEditNameDisabled={AIDeck && !isAIDeckSaved}
            />
          </View>
          
          <View style={[styles.mainContainer, { marginTop: getContentTopHeight()}]}>
          {!isInitialDataLoaded ? (
            // Loading state - show generic background until data loads
            <View style={[styles.backgroundImage, { backgroundColor: Colors[theme].secondaryShade, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={[{
                fontFamily: Fonts.bodyMedium,
                fontSize: 18,
                color: Colors[theme].unselectedText,
                textAlign: 'center'
              }]}>
                {strings[language].loading}
              </Text>
            </View>
          ) : (
            isDark ? (
              <View style={[
                styles.backgroundImage,
                {
                  backgroundColor: Colors[theme].secondaryShade,
                  borderRadius: 30
                }
              ]}>
                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={false}
                  ref={scrollViewRef}
                  removeClippedSubviews={animationConfig.isLowEndDevice}
                  scrollEventThrottle={animationConfig.isLowEndDevice ? 100 : 16}
                  decelerationRate={animationConfig.isLowEndDevice ? "fast" : "normal"}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={handleRefresh}
                      tintColor={Colors[theme].brandColor2}
                      colors={[Colors[theme].brandColor2]}
                    />
                  }
                >
                  <View style={styles.cardContentContainer}>
                    {/* Only render content when we have valid deck data */}
                    {deckInfo && (AIDeck && !isAIDeckSaved ? (
                      // AI Deck Layout - 3 columns (only for unsaved AI decks)
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
                              style={[styles.aiDeckTitle,
                                /[\u4e00-\u9fff]/.test(deckTitle) && { paddingTop: 10 },
                              ]}
                              numberOfLines={2}
                            >
                              {deckTitle}
                            </Text>
                          )}
                        </View>
                        
                        {/* Column 3: Card Type Pill and Flashcard Count */}
                        <View style={styles.aiDeckColumn3}>
                          {deckType && (
                            <View style={[styles.aiDeckCardTypePill, { 
                                borderColor: isDark ? 'transparent' : getCardTypeColor(cardType as string),
                                borderWidth: isDark ? 0 : 2,
                                backgroundColor: isDark ? colors.cardTypePillBgColor : colors.background
                              }]}>
                              <Text style={[styles.aiDeckCardTypeText, { color: isDark ? colors.text : '#000' }]}>{getCardTypeLabel(cardType as string)}</Text>
                            </View>
                          )}
                          {cardFlashcardCount !== undefined && (
                            <Text style={[styles.aiDeckFlashcardCount, {
                              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
                            }]}>{cardFlashcardCount} {strings[language].cards}</Text>
                          )}
                        </View>
                      </View>
                    ) : (
                      // Regular Deck Layout - Original positioning (for regular decks and saved AI decks)
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
                          <FavoriteButton 
                            isSelectMode={false} 
                            favorited={favoriteStatus}
                            onPress={handleFavoriteToggle}
                          />
                        </View>
                        
                        {/* Title */}
                        {deckTitle && (
                          <Text 
                            style={[styles.cardTitle,
                              /[\u4e00-\u9fff]/.test(deckTitle) && { paddingTop: 10 },
                            ]}
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
                              <Text style={styles.flashcardCountText}>{cardFlashcardCount} {strings[language].cards}</Text>
                            )}
                          </View>
                        )}
                        
                        {/* Card type pill */}
                        {deckType && (
                          <View style={[styles.cardTypePill, { 
                                borderColor: isDark ? 'transparent' : getCardTypeColor(cardType as string),
                                borderWidth: isDark ? 0 : 2,
                                backgroundColor: isDark ? colors.cardTypePillBgColor : colors.background
                              }]}>
                            <Text style={[styles.cardTypeText, { color: isDark ? colors.text : '#000' }]}>{getCardTypeLabel(cardType as string)}</Text>
                          </View>
                        )}
                      </>
                    ))}
                    
                    {/* Progress bar */}
                    {deckInfo && cardPercent >= 0 && (!AIDeck || isAIDeckSaved) && (
                      <View style={styles.progressRow}> 
                        <View style={styles.loadingBarFlexWrapper}>
                          <LoadingBar percent={cardPercent} />
                        </View>
                        <Text style={styles.progressLabel}>{cardPercent}% {strings[language].progress}</Text>
                      </View>
                    )}
                  </View>

                    {/* Metadata Section */}
                    {deckInfo && (
                    <View style={[
                      styles.metadataContainer,
                      { marginTop: AIDeck && !isAIDeckSaved ? 20 : 130 }
                    ]}>
                      {renderMetadataRows()}
                    </View>
                    )}

                    {/* Empty State or Stats Section (stacked below metadata) */}
                    {hasAttemptedFlashcards === false ? (
                      <View style={[styles.emptyStateContainer]}>
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
                        {/* Stats message for all deck types */}
                        <Text style={styles.aiDeckStatsMessage}>
                          {strings[language].deckDetails.noStatsYet}
                        </Text>
                      </View>
                    ) : (
                      // Stats for all deck types when flashcards have been attempted
                      <View style={styles.cardDetailsContainer}>
                        <AverageGradeThermometer 
                          score={deckGrade?.score}
                          title={strings[language].deckDetails.averageGrade}
                        />
                        <BreakdownByDifficultyPie breakdown={breakdown || undefined}/>
                        <AverageSpeedTotal 
                          averageTime={averageTime}
                          title={strings[language].deckDetails.averageTimePerFlashcard}
                        />
                      </View>
                    )}

                </ScrollView>
              </View>
            ) : (
              <ImageBackground 
                source={AIDeck || deckInfo?.isAIDeck === 1 ? deckDetailsAICardDesigns[safeBackgroundIndex] : deckDetailsCardDesigns[safeBackgroundIndex]}
                style={styles.backgroundImage}
                imageStyle={styles.backgroundImageStyle}
              >
                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={false}
                  ref={scrollViewRef}
                  removeClippedSubviews={animationConfig.isLowEndDevice}
                  scrollEventThrottle={animationConfig.isLowEndDevice ? 100 : 16}
                  decelerationRate={animationConfig.isLowEndDevice ? "fast" : "normal"}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={handleRefresh}
                      tintColor={Colors[theme].brandColor2}
                      colors={[Colors[theme].brandColor2]}
                    />
                  }
                >
                  <View style={styles.cardContentContainer}>
                    {/* Only render content when we have valid deck data */}
                    {deckInfo && (AIDeck && !isAIDeckSaved ? (
                      // AI Deck Layout - 3 columns (only for unsaved AI decks)
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
                              style={[styles.aiDeckTitle,
                                /[\u4e00-\u9fff]/.test(deckTitle) && { paddingTop: 10 },
                              ]}
                              numberOfLines={2}
                            >
                              {deckTitle}
                            </Text>
                          )}
                        </View>
                        
                        {/* Column 3: Card Type Pill and Flashcard Count */}
                        <View style={styles.aiDeckColumn3}>
                          {deckType && (
                            <View style={[styles.aiDeckCardTypePill, { 
                                borderColor: isDark ? 'transparent' : getCardTypeColor(cardType as string),
                                borderWidth: isDark ? 0 : 2,
                                backgroundColor: isDark ? colors.cardTypePillBgColor : colors.background
                              }]}>
                              <Text style={[styles.aiDeckCardTypeText, { color: isDark ? colors.text : '#000' }]}>{getCardTypeLabel(cardType as string)}</Text>
                            </View>
                          )}
                          {cardFlashcardCount !== undefined && (
                            <Text style={[styles.aiDeckFlashcardCount, {
                              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
                            }]}>{cardFlashcardCount} {strings[language].cards}</Text>
                          )}
                        </View>
                      </View>
                    ) : (
                      // Regular Deck Layout - Original positioning (for regular decks and saved AI decks)
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
                          <FavoriteButton 
                            isSelectMode={false} 
                            favorited={favoriteStatus}
                            onPress={handleFavoriteToggle}
                          />
                        </View>
                        
                        {/* Title */}
                        {deckTitle && (
                          <Text 
                            style={[styles.cardTitle,
                              /[\u4e00-\u9fff]/.test(deckTitle) && { paddingTop: 10 },
                            ]}
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
                              <Text style={styles.flashcardCountText}>{cardFlashcardCount} {strings[language].cards}</Text>
                            )}
                          </View>
                        )}
                        
                        {/* Card type pill */}
                        {deckType && (
                          <View style={[styles.cardTypePill, { 
                                borderColor: isDark ? 'transparent' : getCardTypeColor(cardType as string),
                                borderWidth: isDark ? 0 : 2,
                                backgroundColor: isDark ? colors.cardTypePillBgColor : colors.background
                              }]}>
                            <Text style={[styles.cardTypeText, { color: isDark ? colors.text : '#000' }]}>{getCardTypeLabel(cardType as string)}</Text>
                          </View>
                        )}
                      </>
                    ))}
                    
                    {/* Progress bar */}
                    {deckInfo && cardPercent >= 0 && (!AIDeck || isAIDeckSaved) && (
                      <View style={styles.progressRow}> 
                        <View style={styles.loadingBarFlexWrapper}>
                          <LoadingBar percent={cardPercent} />
                        </View>
                        <Text style={styles.progressLabel}>{cardPercent}% {strings[language].progress}</Text>
                      </View>
                    )}
                  </View>

                    {/* Metadata Section */}
                    {deckInfo && (
                    <View style={[
                      styles.metadataContainer,
                      { marginTop: AIDeck && !isAIDeckSaved ? 20 : 130 }
                    ]}>
                      {renderMetadataRows()}
                    </View>
                    )}

                    {/* Empty State or Stats Section (stacked below metadata) */}
                    {hasAttemptedFlashcards === false ? (
                      <View style={[styles.emptyStateContainer]}>
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
                        {/* Stats message for all deck types */}
                        <Text style={styles.aiDeckStatsMessage}>
                          {strings[language].deckDetails.noStatsYet}
                        </Text>
                      </View>
                    ) : (
                      // Stats for all deck types when flashcards have been attempted
                      <View style={styles.cardDetailsContainer}>
                        <AverageGradeThermometer 
                          score={deckGrade?.score}
                          title={strings[language].deckDetails.averageGrade}
                        />
                        <BreakdownByDifficultyPie breakdown={breakdown || undefined}/>
                        <AverageSpeedTotal 
                          averageTime={averageTime}
                          title={strings[language].deckDetails.averageTimePerFlashcard}
                        />
                      </View>
                    )}

                </ScrollView>
              </ImageBackground>
            )
          )}
          </View>

          {isInitialDataLoaded && (
            <View style={[
              styles.fabContainer,
            ]}>
              {AIDeck && !isAIDeckSaved && (
                <TouchableOpacity
                  style={[styles.fab, { bottom: (Platform.OS === 'ios' ? 100 : 95) }]}
                  onPress={handleSavePress}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="save-alt" size={30} color={Colors[theme].contrastIconColor} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.fab]}
                onPress={handleFabPress}
                activeOpacity={0.8}
              >
                <Ionicons name="eye" size={30} color={Colors[theme].contrastIconColor} />
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>
      </SafeAreaView>
      <BottomTextInputModal
        visible={showEditModal}
        value={editText}
        onChangeText={setEditText}
        onDone={handleDoneEdit}
        placeholder={strings[language].editDeckNamePlaceholder}
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



 