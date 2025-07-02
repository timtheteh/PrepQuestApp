import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ImageBackground, ScrollView, Image, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from '@/contexts/MenuContext';
import { DeckDetailsTopBar } from '@/components/DeckDetailsTopBar';
import { FavoriteButton } from '@/components/FavoriteButton';
import { AverageGradeThermometer } from '@/components/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/AverageSpeedTotal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTextInputModal } from '@/components/BottomTextInputModal';
import LottieView from 'lottie-react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { deckDetailsCardDesigns, deckDetailsAICardDesigns } from '@/constants/cardDesigns';
import { db } from '@/db/index';
import { deleteDeck, getDeckGrade, getDeckAverageTime, getDeckInfo, getDeckInfoWithProgress, DeckGrade, saveAIDeck, checkDeckNameExists } from '@/db/decks';
import { Toast } from '@/components/Toast';

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

// Helper function to format date
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return '--';
  }
};

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

// Local MetadataRow component
interface MetadataRowProps {
  label: string;
  value: string;
}

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <View style={metadataRowStyles.container}>
      <Text style={metadataRowStyles.label}>{label}</Text>
      <Text style={metadataRowStyles.value} numberOfLines={2}>
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
    fontFamily: 'Satoshi-Variable',
    fontSize: 16,
    color: '#111',
    flex: 0,
    marginRight: 16,
  },
  value: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#111',
    textAlign: 'right',
    flex: 1,
    flexWrap: 'wrap',
  },
});

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

  // State for favorite status
  const [favoriteStatus, setFavoriteStatus] = useState(isFavorited === '1');

  // State for deck grade
  const [deckGrade, setDeckGrade] = useState<DeckGrade | null>(null);
  const [isLoadingGrade, setIsLoadingGrade] = useState(true);

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

  // Get deck information from database
  const deckTitle = deckInfo?.deckName || '';
  const deckType = deckInfo?.deckType || '';
  const cardType = deckInfo?.deckType === 'interview' ? deckInfo?.interviewType : deckInfo?.deckType;
  const backgroundIndex = deckInfo?.AICardDesignIndex || deckInfo?.cardDesignIndex || 0;
  const cardDate = deckInfo?.dateAdded ? formatDate(deckInfo.dateAdded) : '';
  const cardFlashcardCount = deckInfo?.flashcardCount || 0;
  const cardPercent = deckInfo?.progress || 0;
  const AIDeck = isAIDeck as string === 'true'
  
  // Helper function to get company logo based on deck info
  const getCompanyLogo = () => {
    if (!deckInfo) {
      return require('@/assets/companyIcons/StudyCardIcon.png');
    }
    
    if (deckInfo.deckType === 'study') {
      return require('@/assets/companyIcons/StudyCardIcon.png');
    } else if (deckInfo.deckType === 'interview') {
      if (deckInfo.interviewCompanyIcon && typeof deckInfo.interviewCompanyIcon === 'string') {
        // Convert hex blob to image source
        try {
          if (/^[0-9A-Fa-f]+$/.test(deckInfo.interviewCompanyIcon)) {
            // Convert hex to base64
            const hexString = deckInfo.interviewCompanyIcon;
            const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
            const base64String = btoa(String.fromCharCode(...bytes));
            return { uri: `data:image/png;base64,${base64String}` };
          } else if (deckInfo.interviewCompanyIcon.startsWith('data:')) {
            // Already a data URI
            return { uri: deckInfo.interviewCompanyIcon };
          } else {
            // Try as file path or URL
            return { uri: deckInfo.interviewCompanyIcon };
          }
        } catch (error) {
          console.error('Error converting company icon:', error);
          return require('@/assets/companyIcons/companyDefaultIcon.png');
        }
      } else {
        // No company icon or invalid type, use default
        return require('@/assets/companyIcons/companyDefaultIcon.png');
      }
    }
    
    // Fallback to study icon
    return require('@/assets/companyIcons/StudyCardIcon.png');
  };
  
  const cardCompanyLogo = getCompanyLogo();

  // Ensure backgroundIndex is within bounds for AI card designs (which has 3 elements)
  const safeBackgroundIndex = AIDeck ? Math.min(backgroundIndex, deckDetailsAICardDesigns.length - 1) : backgroundIndex;

  // Function to handle favorite/unfavorite deck
  const handleFavoriteToggle = async () => {
    try {
      const newFavoritedValue = favoriteStatus ? 0 : 1;
      
      // Update database
      await db.execAsync(`
        UPDATE decks 
        SET isFavorited = ${newFavoritedValue}
        WHERE deckID = ${deckId}
      `);
      
      // Update local state immediately
      setFavoriteStatus(!favoriteStatus);
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

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
      setToastMessage('Deck name cannot be empty!');
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
      setToastMessage('Deck name already exists!');
      setShowToast(true);
      return;
    }
    
    // If validation passes, update the deck name
    try {
      await db.execAsync(`
        UPDATE decks 
        SET deckName = '${trimmedText}', lastModifiedDate = '${new Date().toISOString()}'
        WHERE deckID = ${parseInt(deckId as string)}
      `);
      
      console.log('Updated deck title to:', trimmedText);
      
      // Update local state to reflect the change immediately
      setEditText(trimmedText);
      setDeckInfo((prev: any) => prev ? { ...prev, deckName: trimmedText, lastModifiedDate: new Date().toISOString() } : prev);
      
      // Close the modal
      setShowEditModal(false);
      setEditNameSelected(false);
      
      // Force a re-render by updating the deck title in the route params
      // This will make the new name appear in the UI immediately
      router.setParams({ deckTitle: trimmedText });
      
    } catch (error) {
      console.error('Error updating deck name:', error);
      setToastMessage('Error updating deck name!');
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

    console.log('isAIDeck', isAIDeck);
  };

  // Function to handle deck deletion
  const handleDeckDeletion = async () => {
    try {
      // Delete the deck from database
      const success = await deleteDeck(parseInt(deckId as string));
      
      if (success) {
        console.log('Successfully deleted deck:', deckId);
        
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
        console.error('Failed to delete deck');
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      // You could show an error message to the user here
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
      
      // Test logging to verify the data
      if (deckGrade) {
        console.log('Deck Grade loaded:', {
          score: deckGrade.score,
          masteryLevel: deckGrade.masteryLevel,
          breakdown: deckGrade.breakdown,
          totalAttempted: deckGrade.totalAttempted,
          totalFlashcards: deckGrade.totalFlashcards
        });
      } else {
        console.log('No deck grade available - no attempted flashcards found');
      }
    } catch (error) {
      console.error('Error loading deck grade:', error);
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
      
      // Test logging to verify the data
      if (averageTime !== null) {
        console.log('Average time loaded:', averageTime, 'seconds');
      } else {
        console.log('No average time available - no attempted flashcards with time data found');
      }
    } catch (error) {
      console.error('Error loading average time:', error);
      setAverageTime(null);
    } finally {
      setIsLoadingAverageTime(false);
    }
  };

  // Function to get AI deck grade
  const getAIDeckGrade = async (deckId: number): Promise<DeckGrade | null> => {
    try {
      // Get attempted AI flashcards (those with lastStudiedDate or lastQuizzedDate not null)
      // and their difficulty ratings
      const result = await db.getAllAsync(`
        SELECT 
          difficultyRating,
          lastStudiedDate,
          lastQuizzedDate
        FROM AIFlashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND difficultyRating != 'None'
      `, [deckId]);

      if (!result || result.length === 0) {
        // No attempted flashcards, return null
        return null;
      }

      const flashcards = result as Array<{
        difficultyRating: string;
        lastStudiedDate: string | null;
        lastQuizzedDate: string | null;
      }>;

      // Extract difficulty ratings from attempted flashcards
      const ratings = flashcards.map(flashcard => flashcard.difficultyRating);

      // Get total number of AI flashcards for this deck
      const totalResult = await db.getFirstAsync(`
        SELECT COUNT(*) as total
        FROM AIFlashcards
        WHERE deckID = ?
      `, [deckId]);

      const totalFlashcards = (totalResult as { total: number }).total;

      // Calculate weighted score using the same logic as regular decks
      const weights = {
        'Again': 0,     // 0% - needs to learn
        'Hard': 0.4,    // 40% - partially learned
        'Good': 0.8,    // 80% - well learned
        'Easy': 1.0     // 100% - mastered
      };
      
      const totalWeight = ratings.reduce((sum, rating) => {
        return sum + (weights[rating as keyof typeof weights] || 0);
      }, 0);
      
      const score = (totalWeight / ratings.length) * 100;
      
      const getMasteryLevel = (score: number): string => {
        if (score >= 90) return 'Expert';
        if (score >= 75) return 'Proficient';
        if (score >= 60) return 'Developing';
        if (score >= 40) return 'Beginner';
        return 'Needs Practice';
      };

      const getBreakdown = (ratings: string[]) => {
        const counts = {
          'Again': 0, 'Hard': 0, 'Good': 0, 'Easy': 0
        };
        
        ratings.forEach(rating => {
          if (rating in counts) {
            counts[rating as keyof typeof counts]++;
          }
        });
        
        return counts;
      };

      const grade = {
        score: Math.round(score),
        masteryLevel: getMasteryLevel(score),
        breakdown: getBreakdown(ratings),
        totalAttempted: ratings.length,
        totalFlashcards: totalFlashcards
      };

      return grade;
    } catch (error) {
      console.error('Error calculating AI deck grade:', error);
      return null;
    }
  };

  // Function to get AI deck average time
  const getAIDeckAverageTime = async (deckId: number): Promise<number | null> => {
    try {
      // Get attempted AI flashcards (those with lastStudiedDate or lastQuizzedDate not null)
      // and their timeTaken values
      const result = await db.getFirstAsync(`
        SELECT 
          AVG(timeTaken) as averageTime,
          COUNT(*) as attemptedCount
        FROM AIFlashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND timeTaken IS NOT NULL
      `, [deckId]);

      if (!result) {
        return null;
      }

      const data = result as { averageTime: number | null; attemptedCount: number };
      
      // Return null if no attempted flashcards or no time data
      if (data.attemptedCount === 0 || data.averageTime === null) {
        return null;
      }

      // Return the average time rounded to the nearest integer
      return Math.round(data.averageTime);
    } catch (error) {
      console.error('Error calculating AI deck average time:', error);
      return null;
    }
  };

  // Function to check if any flashcards have been attempted
  const checkFlashcardAttemptStatus = async () => {
    try {
      setIsLoadingAttemptStatus(true);
      
      // Use the isAIDeck parameter instead of querying the database
      const isAIDeckFromParams = isAIDeck as string === 'true';

      // Check if any flashcards have been attempted
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const idColumn = isAIDeckFromParams ? 'deckID' : 'deckID';

      const result = await db.getFirstAsync(`
        SELECT COUNT(*) as attemptedCount
        FROM ${tableName}
        WHERE ${idColumn} = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
      `, [parseInt(deckId as string)]);

      if (!result) {
        setHasAttemptedFlashcards(false);
        return;
      }

      const data = result as { attemptedCount: number };
      setHasAttemptedFlashcards(data.attemptedCount > 0);
      
      console.log('Flashcard attempt status:', data.attemptedCount > 0 ? 'Has attempted flashcards' : 'No attempted flashcards');
    } catch (error) {
      console.error('Error checking flashcard attempt status:', error);
      setHasAttemptedFlashcards(false);
    } finally {
      setIsLoadingAttemptStatus(false);
    }
  };

  // Function to check if AI deck has been saved to regular decks table
  const checkAIDeckSavedStatus = async () => {
    try {
      setIsLoadingSavedStatus(true);
      
      // Only check if this is an AI deck
      const isAIDeckFromParams = isAIDeck as string === 'true';
      
      if (!isAIDeckFromParams) {
        setIsAIDeckSaved(false);
        return;
      }

      // Get the AI deck name
      const aiDeckResult = await db.getFirstAsync(`
        SELECT deckName
        FROM AIDecks
        WHERE deckID = ?
      `, [parseInt(deckId as string)]);

      if (!aiDeckResult) {
        setIsAIDeckSaved(false);
        return;
      }

      const aiDeck = aiDeckResult as { deckName: string };

      // Check if there's a matching deck in the regular decks table
      const savedDeckResult = await db.getFirstAsync(`
        SELECT deckID
        FROM decks
        WHERE deckName = ?
          AND isAIDeck = 1
      `, [aiDeck.deckName]);

      setIsAIDeckSaved(!!savedDeckResult);
      
      console.log('AI deck saved status:', savedDeckResult ? 'Saved to regular decks table' : 'Not saved yet');
    } catch (error) {
      console.error('Error checking AI deck saved status:', error);
      setIsAIDeckSaved(false);
    } finally {
      setIsLoadingSavedStatus(false);
    }
  };

  // Load deck grade when component mounts or screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadDeckGrade();
      loadAverageTime();
      loadDeckInfo();
      checkFlashcardAttemptStatus();
      checkAIDeckSavedStatus();
    }
  }, [isFocused, deckId]);

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

  const handleSavePress = async () => {
    setShowEditModal(false);
    
    try {
      // Call the saveAIDeck function
      const result = await saveAIDeck(parseInt(deckId as string));
      
      if (result.success && result.newDeckId) {
        console.log('Successfully saved AI deck to regular deck:', result.newDeckId);
        
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
        
        // Show the modal
        Animated.parallel([
          Animated.timing(menuOverlayOpacity, {
            toValue: 0.4,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(deckDetailsSaveModalOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
        
      } else {
        console.error('Failed to save AI deck');
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Error saving AI deck:', error);
      // You could show an error message to the user here
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
    
    if (!studyDate && !quizDate) return '--';
    if (!studyDate) return formatDate(deckInfo.lastQuizzedDate);
    if (!quizDate) return formatDate(deckInfo.lastStudiedDate);
    
    return formatDate(studyDate > quizDate ? deckInfo.lastStudiedDate : deckInfo.lastQuizzedDate);
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
        const result = await db.getFirstAsync(`
          SELECT 
            d.deckID,
            d.deckName,
            d.dateAdded,
            d.lastModifiedDate,
            d.isFavorited,
            d.deckType,
            d.creationMethod,
            d.lastStudiedDate,
            d.lastQuizzedDate,
            d.cardDesignIndex,
            d.isAIDeck,
            d.folderIDs,
            d.studyEducationLevel,
            d.studySubjects,
            d.studyTopicsSubtopics,
            d.studyExamQuiz,
            d.interviewJobRole,
            d.interviewType,
            d.interviewCompany,
            d.interviewExperienceLevel,
            d.interviewTopics,
            CASE 
              WHEN d.interviewCompanyIcon IS NOT NULL 
              THEN hex(d.interviewCompanyIcon) 
              ELSE NULL 
            END as interviewCompanyIcon,
            COUNT(f.flashcardID) as flashcardCount
          FROM AIDecks d
          LEFT JOIN AIFlashcards f ON d.deckID = f.deckID
          WHERE d.deckID = ?
          GROUP BY d.deckID
        `, [parseInt(deckId as string)]);

        if (!result) {
          setDeckInfo(null);
          return;
        }

        // Calculate progress for AI deck
        const progress = await getAIDeckProgress(parseInt(deckId as string));
        setDeckInfo({ ...result, progress, flashcardCount: (result as any).flashcardCount });
      } else {
        // Query regular decks table
        const info = await getDeckInfoWithProgress(parseInt(deckId as string));
        setDeckInfo(info);
      }
      
    } catch (error) {
      console.error('Error loading deck info:', error);
      setDeckInfo(null);
    } finally {
      setIsLoadingDeckInfo(false);
    }
  };

  // Function to get AI deck progress
  const getAIDeckProgress = async (deckId: number): Promise<number> => {
    try {
      // First, check if the AI deck itself has lastStudiedDate or lastQuizzedDate
      const deckResult = await db.getFirstAsync(`
        SELECT lastStudiedDate, lastQuizzedDate
        FROM AIDecks
        WHERE deckID = ?
      `, [deckId]);

      if (!deckResult) {
        return 0;
      }

      const deck = deckResult as { lastStudiedDate: string | null; lastQuizzedDate: string | null };
      
      // If either lastStudiedDate or lastQuizzedDate is not null, return 100%
      if (deck.lastStudiedDate !== null || deck.lastQuizzedDate !== null) {
        return 100;
      }

      // If both are null, calculate percentage based on AI flashcards
      const progressResult = await db.getFirstAsync(`
        SELECT 
          COUNT(*) as totalFlashcards,
          COUNT(CASE WHEN lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL THEN 1 END) as completedFlashcards
        FROM AIFlashcards
        WHERE deckID = ?
      `, [deckId]);

      if (!progressResult) {
        return 0;
      }

      const progress = progressResult as { totalFlashcards: number; completedFlashcards: number };
      
      if (progress.totalFlashcards === 0) {
        return 0;
      }

      return Math.round((progress.completedFlashcards / progress.totalFlashcards) * 100);
    } catch (error) {
      console.error('Error calculating AI deck progress:', error);
      return 0;
    }
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
          
          <View style={styles.mainContainer}>
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
              >
                <View style={styles.cardContentContainer}>
                  {AIDeck && !isAIDeckSaved ? (
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
                          <View style={[styles.aiDeckCardTypePill, { borderColor: getCardTypeColor(cardType as string) }]}>
                            <Text style={[styles.aiDeckCardTypeText, { color: '#000' }]}>{getCardTypeLabel(cardType as string)}</Text>
                          </View>
                        )}
                        {cardFlashcardCount !== undefined && (
                          <Text style={styles.aiDeckFlashcardCount}>{cardFlashcardCount} cards</Text>
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
                        <View style={[styles.cardTypePill, { borderColor: getCardTypeColor(cardType as string) }]}>
                          <Text style={[styles.cardTypeText, { color: '#000' }]}>{getCardTypeLabel(cardType as string)}</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {/* Progress bar */}
                  {cardPercent >= 0 && (!AIDeck || isAIDeckSaved) && (
                    <View style={styles.progressRow}> 
                      <View style={styles.loadingBarFlexWrapper}>
                        <LoadingBar percent={cardPercent} />
                      </View>
                      <Text style={styles.progressLabel}>{cardPercent}% progress</Text>
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

                <View style={[
                  styles.cardDetailsContainer,
                  { marginTop: hasAttemptedFlashcards === false ? -70 : -10 }
                ]}>
                  {hasAttemptedFlashcards === false ? (
                    // Empty state for all deck types when no flashcards have been attempted
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
                      {/* Stats message for all deck types */}
                      <Text style={styles.aiDeckStatsMessage}>
                      No stats yet! View, study or quiz yourself on this deck in the meantime!
                      </Text>
                    </View>
                  ) : (
                    // Stats for all deck types when flashcards have been attempted
                    <>
                      <AverageGradeThermometer score={deckGrade?.score}/>
                      <BreakdownByDifficultyPie breakdown={deckGrade?.breakdown}/>
                      <AverageSpeedTotal averageTime={averageTime}/>
                    </>
                  )}
                </View>

              </ScrollView>
            </ImageBackground>
          </View>

          <View style={[
            styles.fabContainer,
          ]}>
            {AIDeck && !isAIDeckSaved && (
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
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        duration={3000}
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
  metadataContainer: {
    backgroundColor: 'transparent',
  },
  metadataTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#111',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
}); 