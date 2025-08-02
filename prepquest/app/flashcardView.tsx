import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, SafeAreaView, Dimensions, Text, TouchableWithoutFeedback, Animated, Pressable, ScrollView, Image, Alert, AppState, AppStateStatus, ImageSourcePropType , Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { FlashcardViewTopBar } from '@/components/flashcardView/FlashcardViewTopBar';
import FlippableCardFrontFlipArrow from '@/assets/icons/flippableCard/flippableCardFrontFlipArrow.svg';
import FlippableCardBackFlipArrow from '@/assets/icons/flippableCard/flippableCardBackFlipArrow.svg';
import { FavoriteButton } from '@/components/general/FavoriteButton';
import { GenericModal } from '@/components/modals/GenericModal';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { Audio } from 'expo-av';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { SmallCircleSelectButton } from '@/components/general/SmallCircleSelectButton';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import LottieView from 'lottie-react-native';
import MicIcon from '@/assets/icons/flippableCard/micIcon.svg';
import AIChatIcon from '@/assets/icons/flashcardView/AIChatIcon.svg';
import AIChatIconGrey from '@/assets/icons/flashcardView/AIChatIconGrey.svg';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Speech from 'expo-speech';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '@/db/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useContentTopHeight, useHeaderIconsTopHeight, useTopBarAccountHeight } from '@/hooks/heights';

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Interface for database flashcard
interface DatabaseFlashcard {
  flashcardID: number;
  deckID: number;
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText: string | null;
  questionBlob: string | null; // hex string from SQLite
  answerType: string;
  answerText: string | null;
  answerMCQ: string | null;
  answerBlob: string | null; // hex string from SQLite
  timeTaken: number | null;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}

// Interface for transformed flashcard (matching dummy data format)
interface TransformedFlashcard {
  flashcardID: number;
  flashcardDifficulty: string;
  flashcardQnType: string;
  flashcardQn: string | any; // string for text, require() for image/audio
  flashcardAnswerType: string;
  flashcardAnswer: string | any[] | any; // string for text, array for MCQ, require() for image/audio
  timeLimit: number;
  cognitiveQnType: string;
  isFavorited: boolean;
  isMcqAnswerRight: number | null; // Add this field to track MCQ correctness
}

// Function to get time limit based on difficulty rating
const getTimeLimit = async (difficultyRating: string, answerType?: string): Promise<number> => {
  try {
    const userID = await getCurrentUserID();
    
    // Load timer settings from database
    const result = await db.getFirstAsync(`
      SELECT 
        defaultTimer,
        againTimer,
        hardTimer,
        goodTimer,
        easyTimer,
        voiceRecordedTimer
      FROM users WHERE userID = ?
    `, [userID]);

    if (result) {
      const userData = result as {
        defaultTimer: number;
        againTimer: number;
        hardTimer: number;
        goodTimer: number;
        easyTimer: number;
        voiceRecordedTimer: number;
      };

      console.log('defaultTimer', userData.defaultTimer);
      console.log('againTimer', userData.againTimer);
      console.log('hardTimer', userData.hardTimer);
      console.log('goodTimer', userData.goodTimer);
      console.log('easyTimer', userData.easyTimer);
      console.log('voiceRecordedTimer', userData.voiceRecordedTimer);

      // For voice answer types, always use the voice recorded timer regardless of difficulty
      if (answerType === 'voice') {
        return userData.voiceRecordedTimer;
      }

      // Return appropriate timer based on difficulty rating for non-voice answer types
      switch (difficultyRating) {
        case 'Again': return userData.againTimer;
        case 'Hard': return userData.hardTimer;
        case 'Good': return userData.goodTimer;
        case 'Easy': return userData.easyTimer;
        case 'None': return userData.defaultTimer;
        default: return userData.defaultTimer;
      }
    } else {
      // Fallback to default values if no user data found
      if (answerType === 'voice') {
        return 120; // 2 minutes default for voice recordings
      }
      switch (difficultyRating) {
        case 'Again': return 60;
        case 'Hard': return 45;
        case 'Good': return 30;
        case 'Easy': return 15;
        case 'None': return 20;
        default: return 20;
      }
    }
  } catch (error) {
    console.error('Error loading timer settings from database:', error);
    // Fallback to default values if loading fails
    if (answerType === 'voice') {
      return 120; // 2 minutes default for voice recordings
    }
    switch (difficultyRating) {
      case 'Again': return 60;
      case 'Hard': return 45;
      case 'Good': return 30;
      case 'Easy': return 15;
      case 'None': return 20;
      default: return 20;
    }
  }
};

// Helper function to extract SVG paths from blob data
const extractSVGFromBlob = (blob: string | Uint8Array): { paths: Array<{ d: string; stroke: string; strokeWidth: string; fill: string }>; viewBox: string } | null => {
  try {
    let base64String: string;
    
    if (typeof blob === 'string') {
      // Handle hex string from SQLite
      if (/^[0-9A-Fa-f]+$/.test(blob)) {
        const bytes = new Uint8Array(blob.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        base64String = arrayBufferToBase64(bytes.buffer);
      } else if (blob.startsWith('data:')) {
        // Already a data URI, extract base64
        const base64Match = blob.match(/data:image\/svg\+xml;base64,(.+)/);
        if (base64Match) {
          base64String = base64Match[1];
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (blob instanceof Uint8Array) {
      base64String = arrayBufferToBase64(blob.buffer);
    } else {
      return null;
    }

    // Decode base64 to get SVG string
    const decodedString = atob(base64String);
    
    // Check if it's actually SVG content
    if (decodedString.includes('<svg') || decodedString.includes('<?xml')) {
      // Extract viewBox
      const viewBoxMatch = decodedString.match(/viewBox="([^"]+)"/);
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 400 300';

      // Extract paths using regex
      const pathRegex = /<path[^>]*d="([^"]*)"[^>]*stroke="([^"]*)"[^>]*stroke-width="([^"]*)"[^>]*fill="([^"]*)"[^>]*\/>/g;
      const paths: Array<{ d: string; stroke: string; strokeWidth: string; fill: string }> = [];
      let match;

      while ((match = pathRegex.exec(decodedString)) !== null) {
        paths.push({
          d: match[1] || '',
          stroke: match[2] || 'black',
          strokeWidth: match[3] || '1',
          fill: match[4] || 'none'
        });
      }

      return { paths, viewBox };
    }
  } catch (error) {
    console.error('Error extracting SVG from blob:', error);
  }
  return null;
};

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Cache for blob conversions to avoid expensive reprocessing
const blobCache = new Map<string, any>();
const MAX_CACHE_SIZE = 50; // Limit cache to 50 entries

// Function to clear blob cache to manage memory
const clearBlobCache = () => {
  blobCache.clear();
  console.log('Blob cache cleared');
};

// Function to add to cache with size limit
const addToCache = (key: string, value: any) => {
  // If cache is full, remove oldest entries
  if (blobCache.size >= MAX_CACHE_SIZE) {
    const firstKey = blobCache.keys().next().value;
    if (firstKey) {
      blobCache.delete(firstKey);
    }
  }
  blobCache.set(key, value);
};

// Function to convert blob to image source with caching
const blobToImageSource = (blob: Uint8Array | string): any => {
  try {
    // Create a cache key from the blob
    const cacheKey = typeof blob === 'string' ? blob : Array.from(blob).join(',');
    
    // Check if we have this blob cached
    if (blobCache.has(cacheKey)) {
      return blobCache.get(cacheKey);
    }

    let result: any = null;

    // Handle hex string from SQLite BLOB (like in favorites page)
    if (typeof blob === 'string') {
      // Check if it's a hex string (from SQLite hex() function)
      if (/^[0-9A-Fa-f]+$/.test(blob)) {
        // Convert hex to base64 using a proper approach for binary data
        const hexString = blob;
        const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        
        // Convert to base64 using a proper binary-to-base64 conversion
        const base64String = arrayBufferToBase64(bytes.buffer);
        
        // Check if the blob contains SVG data by looking for SVG markers
        const decodedString = atob(base64String);
        if (decodedString.includes('<svg') || decodedString.includes('<?xml')) {
          // It's SVG data, preserve SVG MIME type
          result = { uri: `data:image/svg+xml;base64,${base64String}` };
        } else {
          // It's regular image data, use PNG MIME type
          result = { uri: `data:image/png;base64,${base64String}` };
        }
      } else if (blob.startsWith('data:')) {
        // Already a data URI
        result = { uri: blob };
      } else {
        // Try as file path or URL
        result = { uri: blob };
      }
    } else if (blob instanceof Uint8Array) {
      // Handle Uint8Array blob using proper binary-to-base64 conversion
      const base64String = arrayBufferToBase64(blob.buffer);
      
      // Check if the blob contains SVG data
      const decodedString = atob(base64String);
      if (decodedString.includes('<svg') || decodedString.includes('<?xml')) {
        // It's SVG data, preserve SVG MIME type
        result = { uri: `data:image/svg+xml;base64,${base64String}` };
      } else {
        // It's regular image data, use PNG MIME type
        result = { uri: `data:image/png;base64,${base64String}` };
      }
    }

    // Cache the result if we have one
    if (result) {
      addToCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('Error converting blob to image source:', error);
    return null;
  }
};

// Function to convert blob to audio source
const blobToAudioSource = (blob: Uint8Array | string): any => {
  try {
    // Create a cache key from the blob
    const cacheKey = `audio_${typeof blob === 'string' ? blob : Array.from(blob).join(',')}`;
    
    // Check if we have this blob cached
    if (blobCache.has(cacheKey)) {
      return blobCache.get(cacheKey);
    }

    let result: any = null;

    // Handle hex string from SQLite BLOB (like in favorites page)
    if (typeof blob === 'string') {
      // Check if it's a hex string (from SQLite hex() function)
      if (/^[0-9A-Fa-f]+$/.test(blob)) {
        // Convert hex to base64 using a proper approach for binary data
        const hexString = blob;
        const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        
        // Convert to base64 using a proper binary-to-base64 conversion
        const base64String = arrayBufferToBase64(bytes.buffer);
        
        result = { uri: `data:audio/mp4;base64,${base64String}` };
      } else if (blob.startsWith('data:')) {
        // Already a data URI
        result = { uri: blob };
      } else {
        // Try as file path or URL
        result = { uri: blob };
      }
    } else if (blob instanceof Uint8Array) {
      // Handle Uint8Array blob using proper binary-to-base64 conversion
      const base64String = arrayBufferToBase64(blob.buffer);
      result = { uri: `data:audio/mp4;base64,${base64String}` };
    }

    // Cache the result if we have one
    if (result) {
      addToCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('Error converting blob to audio source:', error);
    return null;
  }
};

// Function to load flashcards from database
const loadFlashcardsFromDatabase = async (deckId: string, isAIDeck: string, retryDifficult?: boolean): Promise<TransformedFlashcard[]> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    let query = `
      SELECT 
        flashcardID,
        deckID,
        difficultyRating,
        cognitiveQnType,
        isFavorited,
        questionType,
        questionText,
        CASE 
          WHEN questionBlob IS NOT NULL 
          THEN hex(questionBlob) 
          ELSE NULL 
        END as questionBlob,
        answerType,
        answerText,
        answerMCQ,
        CASE 
          WHEN answerBlob IS NOT NULL 
          THEN hex(answerBlob) 
          ELSE NULL 
        END as answerBlob,
        timeTaken,
        isMcqAnswerRight,
        lastStudiedDate,
        lastQuizzedDate
      FROM ${tableName}
      WHERE deckID = ? AND userID = ?
    `;

    const params: any[] = [parseInt(deckId), userID];

    if (retryDifficult) {
      // Filter for difficult flashcards: Again, Hard, or MCQ with wrong answers
      query += `
        AND (
          difficultyRating IN ('Again', 'Hard') 
          OR (answerType = 'mcq' AND isMcqAnswerRight = 0)
        )
      `;
    }

    query += `
      ORDER BY 
        CASE difficultyRating
          WHEN 'None' THEN 1
          WHEN 'Easy' THEN 2
          WHEN 'Good' THEN 3
          WHEN 'Hard' THEN 4
          WHEN 'Again' THEN 5
          ELSE 6
        END,
        flashcardID ASC
    `;

    const result = await db.getAllAsync(query, params);

    if (!result) {
      return [];
    }

    const flashcards = result as DatabaseFlashcard[];
    
    // Transform database flashcards to match dummy data format
    const transformedFlashcards: TransformedFlashcard[] = [];
    
    for (const flashcard of flashcards) {
      // Transform question
      let transformedQuestion: string | any;
      if (flashcard.questionType === 'text') {
        transformedQuestion = flashcard.questionText || '';
      } else if (flashcard.questionType === 'image' && flashcard.questionBlob) {
        transformedQuestion = blobToImageSource(flashcard.questionBlob);
      } else if (flashcard.questionType === 'audio' && flashcard.questionBlob) {
        transformedQuestion = blobToAudioSource(flashcard.questionBlob);
      } else {
        transformedQuestion = '';
      }

      // Transform answer
      let transformedAnswer: string | any[] | any;
      if (flashcard.answerType === 'text') {
        transformedAnswer = flashcard.answerText || '';
      } else if (flashcard.answerType === 'mcq' && flashcard.answerMCQ) {
        try {
          const mcqData = JSON.parse(flashcard.answerMCQ);
          console.log(mcqData);
          transformedAnswer = mcqData.map((item: any) => ({
            choice: item.option || item.choice,
            ans: item.ans || false
          }));
        } catch (error) {
          console.error('Error parsing MCQ data:', error);
          transformedAnswer = [];
        }
      } else if ((flashcard.answerType === 'image' || flashcard.answerType === 'audio') && flashcard.answerBlob) {
        if (flashcard.answerType === 'image') {
          transformedAnswer = blobToImageSource(flashcard.answerBlob);
        } else {
          transformedAnswer = blobToAudioSource(flashcard.answerBlob);
        }
      } else if (flashcard.answerType === 'voice') {
        transformedAnswer = null;
      } else {
        transformedAnswer = '';
      }

      // Get time limit asynchronously
      const timeLimit = await getTimeLimit(flashcard.difficultyRating, flashcard.answerType);
      console.log("timlimit: ", timeLimit);

      transformedFlashcards.push({
        flashcardID: flashcard.flashcardID,
        flashcardDifficulty: flashcard.difficultyRating,
        flashcardQnType: flashcard.questionType,
        flashcardQn: transformedQuestion,
        flashcardAnswerType: flashcard.answerType,
        flashcardAnswer: transformedAnswer,
        timeLimit: timeLimit,
        cognitiveQnType: flashcard.cognitiveQnType,
        isFavorited: flashcard.isFavorited === 1,
        isMcqAnswerRight: flashcard.isMcqAnswerRight
      });
    }
    
    return transformedFlashcards;
  } catch (error) {
    console.error('Error loading flashcards from database:', error);
    return [];
  }
};

// Helper function to copy asset images to clipboard
const copyAssetToClipboard = async (imageSource: any) => {
  try {
    let base64Data: string;
    
    // Handle different image source types
    if (typeof imageSource === 'number') {
      // For require() statements (returns a number)
      const assetModule = Asset.fromModule(imageSource);
      await assetModule.downloadAsync();
      const localUri = assetModule.localUri || assetModule.uri;
      
      // Convert image to base64
      base64Data = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else if (typeof imageSource === 'string') {
      // For string URIs
      if (imageSource.startsWith('data:image')) {
        // Already a data URI, extract the base64 part
        const base64Match = imageSource.match(/data:image\/[^;]+;base64,(.+)/);
        if (base64Match) {
          base64Data = base64Match[1];
        } else {
          throw new Error('Invalid data URI format');
        }
      } else {
        // For file paths or URLs, use Asset.fromURI
      const asset = Asset.fromURI(imageSource);
      await asset.downloadAsync();
        const localUri = asset.localUri || asset.uri;
        
        // Convert image to base64
        base64Data = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } else if (imageSource && typeof imageSource === 'object' && imageSource.uri) {
      // For image source objects with uri property
      if (imageSource.uri.startsWith('data:image')) {
        // Already a data URI, extract the base64 part
        const base64Match = imageSource.uri.match(/data:image\/[^;]+;base64,(.+)/);
        if (base64Match) {
          base64Data = base64Match[1];
    } else {
          throw new Error('Invalid data URI format');
    }
      } else {
        // For file paths or URLs
        const asset = Asset.fromURI(imageSource.uri);
        await asset.downloadAsync();
        const localUri = asset.localUri || asset.uri;
    
    // Convert image to base64
        base64Data = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
      }
    } else {
      throw new Error('Unsupported image source type');
    }
    
    // Copy base64 image to clipboard
    await Clipboard.setImageAsync(base64Data);
    console.log('Image copied to clipboard successfully!');
    return true;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
};

const DIFFICULTY_TYPES = [
  { type: 'Again', color: '#F8696B' },
  { type: 'Hard', color: '#FA9473' },
  { type: 'Good', color: '#FFEB84' },
  { type: 'Easy', color: '#98CE7F' },
];

// Updated DifficultyPillRow to accept currentIdx and totalCards as props
interface DifficultyPillRowProps {
  currentIdx: number;
  onDifficultyChange: (difficulty: string) => void;
  flashcards: TransformedFlashcard[];
  language: string;
}

const DifficultyPillRow = ({ currentIdx, onDifficultyChange, flashcards, language }: DifficultyPillRowProps) => {
  const { theme } = useTheme();
  // Get the current flashcard's difficulty
  const currentFlashcard = flashcards[currentIdx];
  const currentDifficulty = currentFlashcard?.flashcardDifficulty;

  const DIFFICULTY_LABELS: { [key: string]: string } = {
    Again: strings[language].flashcardViewPage.again,
    Hard: strings[language].flashcardViewPage.hard,
    Good: strings[language].flashcardViewPage.good,
    Easy: strings[language].flashcardViewPage.easy,
  };

  return (
    <View style={styles.difficultyPillRow}>
      {DIFFICULTY_TYPES.map(({ type, color }) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.difficultyPillButton,
            { backgroundColor: color },
            currentDifficulty === type && { borderColor: Colors[theme].brandColor2, borderWidth: 3 },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            onDifficultyChange(type);
          }}
        >
          <Text style={[styles.difficultyPillButtonText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>{DIFFICULTY_LABELS[type]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Updated LoadingBar to accept currentIdx and totalCards as props with smooth animations
interface LoadingBarProps {
  currentIdx: number;
  totalCards: number;
  isStudyMode: boolean;
  hasFlippedCard: boolean;
  hasSubmittedMCQ: boolean;
  flashcardAnswerType: string;
  isQuizMode: boolean;
  recordedAudioUri: string | null;
  language: string;
}

const LoadingBar = ({ currentIdx, totalCards, isStudyMode, hasFlippedCard, hasSubmittedMCQ, flashcardAnswerType, isQuizMode, recordedAudioUri, language }: LoadingBarProps) => {
  const { theme } = useTheme();
  // Create animated value for progress
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate target progress
  const targetProgress = totalCards > 0 ? (currentIdx + 1) / totalCards : 0; // +1 because we want to show progress including current card

  // Check if completed (in study mode, at last card, and properly completed based on answer type)
  const isAtLastCard = currentIdx === totalCards - 1;
  const isCompleted = (isQuizMode || isStudyMode) && isAtLastCard && (
    // For text, audio, or image answer types - user must have flipped to answer side
    (['text', 'audio', 'image'].includes(flashcardAnswerType) && hasFlippedCard) ||
    // For MCQ answer type - user must have submitted the MCQ
    (flashcardAnswerType === 'mcq' && hasSubmittedMCQ) ||
    // For voice answer type - user must have recorded a voice answer
    (flashcardAnswerType === 'voice' && recordedAudioUri !== null)
  );

  // Animate progress when currentIdx changes
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 300, // Match the card slide animation duration
      useNativeDriver: false, // width animation requires useNativeDriver: false
    }).start();
  }, [currentIdx, totalCards, targetProgress]);

  return (
    <View style={styles.loadingBarContainer}>
      <View style={[
        styles.loadingBarBg,
        { backgroundColor: Colors[theme].secondaryShade },
        isCompleted && { backgroundColor: Colors[theme].brandColor1 }
      ]}>
        <Animated.View 
          style={[
            styles.loadingBarFg, 
            { 
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: isCompleted ? Colors[theme].brandColor1 : Colors[theme].brandColor2
            }
          ]} 
        />
        {isCompleted && (
          <View style={styles.loadingBarTextContainer}>
            <Text style={[styles.loadingBarCompleteText, { color: Colors[theme].background, fontFamily: Fonts.bodyItalic }]}>
              {strings[language].flashcardViewPage.completed}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Helper to render text with <blank> replaced by underline
function renderQuestionWithBlanks(text: string, theme: 'light' | 'dark') {
  const parts = text.split(/<blank>/g);
  const elements: React.ReactNode[] = [];
  parts.forEach((part, idx) => {
    elements.push(
      <Text key={`text-${idx}`} style={[styles.questionText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
        {part}
      </Text>
    );
    if (idx < parts.length - 1) {
      elements.push(
        <View
          key={`blank-${idx}`}
          style={[styles.blankUnderlineView, { borderColor: Colors[theme].text }]}
        />
      );
    }
  });
  return (
    <Text style={[styles.questionText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
      {elements}
    </Text>
  );
}

// Helper to render MCQ answers with randomly assigned option letters
function renderMCQAnswers(mcqData: { choice: string; ans: boolean }[], theme: 'light' | 'dark') {
  // Create array of option letters (A, B, C, D, etc.)
  const optionLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Create array of indices to shuffle
  const indices = Array.from({ length: mcqData.length }, (_, i) => i);
  
  // Fisher-Yates shuffle algorithm to randomly assign letters
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Create array of options with assigned letters
  const optionsWithLetters = mcqData.map((item, originalIndex) => {
    const assignedIndex = indices.indexOf(originalIndex);
    return {
      ...item,
      letter: optionLetters[assignedIndex]
    };
  });
  
  // Sort alphabetically by assigned letter
  optionsWithLetters.sort((a, b) => a.letter.localeCompare(b.letter));
  
  return (
    <View style={styles.mcqContainer}>
      {optionsWithLetters.map((option, index) => (
        <View key={index} style={styles.mcqOptionRow}>
          <Text style={[styles.mcqOptionText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
            {option.letter}) {option.choice}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Helper for audio playback
async function playAudio(uri: any) {
  try {
    // await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // const { sound } = await Audio.Sound.createAsync(uri);
    // await sound.playAsync();
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: true,
      });
      
      const { sound } = await Audio.Sound.createAsync({ uri });
      console.log('Playing Sound');
      await sound.setVolumeAsync(1.0); // Set volume to maximum (1.0)
      await sound.playAsync();
      
      // Set volume again after playing starts to ensure it takes effect
      setTimeout(async () => {
        await sound.setVolumeAsync(1.0);
      }, 100);
  } catch (e) {
    console.log('Audio playback error:', e);
  }
}

// Move this above FlippableFlashcard:
interface FlippableFlashcardProps {
  currentIdx: number;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  totalCards: number;
  setMcqModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMcqModalCorrect: React.Dispatch<React.SetStateAction<boolean>>;
  mcqModalOpacity: Animated.Value;
  mcqOverlayOpacity: Animated.Value;
  isFlipped: boolean;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  mcqOptionsWithLettersRef: React.MutableRefObject<{ choice: string; ans: boolean; letter: string }[]>;
  stopSpeech: () => Promise<void>;
  setIsSpeechPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSpeechPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isStudyMode: boolean;
  hasFlippedCard: boolean;
  setHasFlippedCard: React.Dispatch<React.SetStateAction<boolean>>;
  hasSubmittedMCQ: boolean;
  setHasSubmittedMCQ: React.Dispatch<React.SetStateAction<boolean>>;
  showStudyValidationModal: (message: string) => void;
  setIsSuccessMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSuccessMode: boolean;
  isQuizMode: boolean;
  pauseNextTimer: boolean;
  setPauseNextTimer: React.Dispatch<React.SetStateAction<boolean>>;
  favorited: boolean;
  onToggleFavorite: () => void;
  showQuizCountdown: boolean;
  flashcards: TransformedFlashcard[];
  recordedAudioUri: string | null;
  setRecordedAudioUri: React.Dispatch<React.SetStateAction<string | null>>;
  updateFlashcardDate: (flashcardId: number, isStudyMode: boolean, timeTaken?: number, isMcqCorrect?: boolean) => Promise<void>;
  updateDeckCompletionDate: (isStudyMode: boolean) => Promise<void>;
  startFlashcardTimer: (flashcardId: number) => void;
  retryDifficultParam?: string;
  language: string;
}

// FlippableFlashcard now receives currentIdx, setCurrentIdx, and totalCards as props
const FlippableFlashcard = (props: FlippableFlashcardProps) => {
  const { theme } = useTheme();
  const {
    currentIdx,
    setCurrentIdx,
    totalCards,
    setMcqModalVisible,
    setMcqModalCorrect,
    mcqModalOpacity,
    mcqOverlayOpacity,
    isFlipped,
    setIsFlipped,
    mcqOptionsWithLettersRef,
    stopSpeech,
    setIsSpeechPlaying,
    setIsSpeechPaused,
    isStudyMode,
    hasFlippedCard,
    setHasFlippedCard,
    hasSubmittedMCQ,
    setHasSubmittedMCQ,
    showStudyValidationModal,
    setIsSuccessMode,
    isSuccessMode,
    isQuizMode,
    pauseNextTimer,
    setPauseNextTimer,
    favorited,
    onToggleFavorite,
    showQuizCountdown,
    flashcards,
    recordedAudioUri,
    setRecordedAudioUri,
    updateFlashcardDate,
    updateDeckCompletionDate,
    startFlashcardTimer,
    retryDifficultParam,
    language
  } = props;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const frontOpacity = useRef(new Animated.Value(1)).current;
  const backOpacity = useRef(new Animated.Value(0)).current;
  const displayNumber = currentIdx + 1;

  // MCQ selection state
  const [selectedMCQOption, setSelectedMCQOption] = useState<string | null>(null);

  // Animation for horizontal slide
  const cardSlideAnim = useRef(new Animated.Value(0)).current; // 0 = center, -1 = left, 1 = right

  // Get current flashcard data
  const currentFlashcard = flashcards[currentIdx];
  const flashcardQnType = currentFlashcard?.flashcardQnType;
  const flashcardQn = currentFlashcard?.flashcardQn;
  const flashcardAnswerType = currentFlashcard?.flashcardAnswerType;
  const flashcardAnswer = currentFlashcard?.flashcardAnswer;

  // Audio playback state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const audioSoundRef = useRef<Audio.Sound | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Generate MCQ options with letters ONCE per card
  const previousCardIndexRef = useRef<number>(currentIdx);
  
  React.useEffect(() => {
    if (flashcardAnswerType === 'mcq' && Array.isArray(flashcardAnswer)) {
      const optionLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const indices = Array.from({ length: flashcardAnswer.length }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      // Shuffle the options
      const shuffled = indices.map(i => flashcardAnswer[i]);
      // Assign letters in order
      const optionsWithLetters = shuffled.map((item, idx) => ({
        ...item,
        letter: optionLetters[idx]
      }));
      mcqOptionsWithLettersRef.current = optionsWithLetters;
      
      // Only reset selection when moving to a different card, not when flipping
      if (previousCardIndexRef.current !== currentIdx) {
        setSelectedMCQOption(null); // Reset selection when card changes
        setHasSubmittedMCQ(false); // Reset MCQ submission state when card changes
        previousCardIndexRef.current = currentIdx;
      }
    } else {
      mcqOptionsWithLettersRef.current = [];
      // Only reset selection when moving to a different card, not when flipping
      if (previousCardIndexRef.current !== currentIdx) {
        setSelectedMCQOption(null);
        setHasSubmittedMCQ(false); // Reset MCQ submission state when card changes
        previousCardIndexRef.current = currentIdx;
      }
    }
  }, [currentIdx, flashcardAnswerType, flashcardAnswer]);

  // Flipping logic (unchanged)
  const handlePress = () => {
    stopSpeech();
    const toValue = isFlipped ? 0 : 1;
    Animated.timing(isFlipped ? backOpacity : frontOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(flipAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsFlipped(!isFlipped);
        // Track if card has been flipped in study mode / quiz mode
        if (!isFlipped && (isStudyMode || isQuizMode)) {
          setHasFlippedCard(true);
        }
        Animated.timing(!isFlipped ? backOpacity : frontOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  // Handle MCQ option selection
  const handleMCQOptionSelect = (letter: string) => {
    // In quiz mode, don't allow changing answer after submission
    if (isQuizMode && hasSubmittedMCQ) {
      return;
    }
    setSelectedMCQOption(selectedMCQOption === letter ? null : letter);
  };

  // Handle MCQ submit
  const handleMCQSubmit = () => {
    if (selectedMCQOption) {
      const selectedOption = mcqOptionsWithLettersRef.current.find((option: any) => option.letter === selectedMCQOption);
      if (selectedOption) {
        const isCorrect = selectedOption.ans;
        setMcqModalCorrect(isCorrect);
        setMcqModalVisible(true);
        // Mark that MCQ has been submitted
        setHasSubmittedMCQ(true);
        
        // Update flashcard with MCQ correctness in quiz mode or study mode
        if ((isQuizMode || isStudyMode) && currentFlashcard) {
          updateFlashcardDate(currentFlashcard.flashcardID, isStudyMode, undefined, isCorrect);
        }
        
        Animated.parallel([
          Animated.timing(mcqOverlayOpacity, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(mcqModalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  // Chevron navigation logic
  const isLeftChevronDisabled = () => currentIdx <= 0;
  const isRightChevronDisabled = () => {
    if (isSuccessMode) return true; // Hide/disable chevron in success mode
    const isAtLastCard = currentIdx >= totalCards - 1;
    if ((isQuizMode || isStudyMode) && isAtLastCard) {
      // Validation for last card
      const currentFlashcard = flashcards[currentIdx];
      const answerType = currentFlashcard?.flashcardAnswerType;
      const currentDifficulty = currentFlashcard?.flashcardDifficulty;
      if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        return !(hasFlippedCard && hasDifficultySelected);
      }
      if (answerType === 'mcq') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        return !(hasFlippedCard && hasSubmittedMCQ && hasDifficultySelected);
      }
      if (answerType === 'voice') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        return !(hasFlippedCard && recordedAudioUri !== null && hasDifficultySelected);
      }
      // fallback: disable if not validated
      return true;
    }
    // Default: disable if not last card
    return currentIdx >= totalCards - 1;
  };

  const navigateToPreviousCard = () => {
    if (!isLeftChevronDisabled()) {
      stopSpeech();
      // Slide out to right
      Animated.timing(cardSlideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIdx((idx: number) => {
          // Always reset to front side
          setIsFlipped(false);
          flipAnim.setValue(0);
          frontOpacity.setValue(1);
          backOpacity.setValue(0);
          return idx - 1;
        });
        cardSlideAnim.setValue(-1); // Start new card from left
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const navigateToNextCard = async () => {
    // If in study mode and at last card, and validation is passed, go to success mode
    if ((isQuizMode || isStudyMode) && currentIdx === totalCards - 1) {
      // Repeat the validation logic for the last card
      const currentFlashcard = flashcards[currentIdx];
      const answerType = currentFlashcard?.flashcardAnswerType;
      const currentDifficulty = currentFlashcard?.flashcardDifficulty;
      if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        if (!hasFlippedCard) {
          if (!hasDifficultySelected) {
            showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutAnswer);
            return;
          } else {
            showStudyValidationModal(strings[language].flashcardViewPage.pleaseFlipCardToViewAnswer);
            return;
          }
        } else {
          if (!hasDifficultySelected) {
            showStudyValidationModal(strings[language].flashcardViewPage.pleaseSelectDifficulty);
            return;
          }
        }
      }
      if (answerType === 'mcq') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        if (!hasFlippedCard) {
          if (!hasDifficultySelected) {
            showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutMCQ);
            return;
          } else {
            showStudyValidationModal(strings[language].flashcardViewPage.pleaseFlipCardToAnswerMCQ);
            return;
          }
        } else {
          if (!hasDifficultySelected) {
            if (!hasSubmittedMCQ) {
              showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutMCQAnswer);
              return;
            } else {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseSelectDifficulty);
              return;
            }
          } else {
            if (!hasSubmittedMCQ) {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseAnswerMCQ);
              return;
            }
          }
        }
      }
      if (answerType === 'voice') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        if (!hasFlippedCard) {
          if (!hasDifficultySelected) {
            showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutVoiceAnswer);
            return;
          } else {
            showStudyValidationModal(strings[language].flashcardViewPage.pleaseFlipCardToRecordVoice);
            return;
          }
        } else {
          if (!hasDifficultySelected) {
            if (!recordedAudioUri) {
              showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutVoiceRecording);
              return;
            } else {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseSelectDifficulty);
              return;
            }
          } else {
            if (!recordedAudioUri) {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseRecordVoiceAnswer);
              return;
            }
          }
        }
      }
      
      // Update the date for the last card before going to success mode
      if (currentFlashcard) {
        updateFlashcardDate(currentFlashcard.flashcardID, isStudyMode);
      }
      
      // Update the deck's completion date when entire deck is finished
      await updateDeckCompletionDate(isStudyMode);
      
      // If all validation is passed, set success mode and return
      setIsSuccessMode(true);
      return;
    }

    if (!isRightChevronDisabled()) {
      // Study mode validation (for non-last cards)
      if (isQuizMode || isStudyMode) {
        const currentFlashcard = flashcards[currentIdx];
        const answerType = currentFlashcard?.flashcardAnswerType;
        const currentDifficulty = currentFlashcard?.flashcardDifficulty;
        if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
          const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
          if (!hasFlippedCard) {
            if (!hasDifficultySelected) {
              showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutAnswer);
              return;
            } else {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseFlipCardToViewAnswer);
              return;
            }
          } else {
            if (!hasDifficultySelected) {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseSelectDifficulty);
              return;
            }
          }
        }
        if (answerType === 'mcq') {
          const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
          if (!hasFlippedCard) {
            if (!hasDifficultySelected) {
              showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutMCQ);
              return;
            } else {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseFlipCardToAnswerMCQ);
              return;
            }
          } else {
            if (!hasDifficultySelected) {
              if (!hasSubmittedMCQ) {
                showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutMCQAnswer);
                return;
              } else {
                showStudyValidationModal(strings[language].flashcardViewPage.pleaseSelectDifficulty);
                return;
              }
            } else {
              if (!hasSubmittedMCQ) {
                showStudyValidationModal(strings[language].flashcardViewPage.pleaseAnswerMCQ);
                return;
              }
            }
          }
        }
        if (answerType === 'voice') {
          const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
          if (!hasFlippedCard) {
            if (!hasDifficultySelected) {
              showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutVoiceAnswer);
              return;
            } else {
              showStudyValidationModal(strings[language].flashcardViewPage.pleaseFlipCardToRecordVoice);
              return;
            }
          } else {
            if (!hasDifficultySelected) {
              if (!recordedAudioUri) {
                showStudyValidationModal(strings[language].flashcardViewPage.cannotMoveOnWithoutVoiceRecording);
                return;
              } else {
                showStudyValidationModal(strings[language].flashcardViewPage.pleaseSelectDifficulty);
                return;
              }
            } else {
              if (!recordedAudioUri) {
                showStudyValidationModal(strings[language].flashcardViewPage.pleaseRecordVoiceAnswer);
                return;
              }
            }
          }
        }
        
        // Update the date for the current card before moving to the next
        if (currentFlashcard) {
          updateFlashcardDate(currentFlashcard.flashcardID, isStudyMode);
        }
      }
      stopSpeech();
      // Slide out to left
      Animated.timing(cardSlideAnim, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIdx((idx: number) => {
          // Always reset to front side
          setIsFlipped(false);
          setHasFlippedCard(false); // Reset flipped state for new card
          setHasSubmittedMCQ(false); // Reset MCQ submission state for new card
          setRecordedAudioUri(null); // Reset voice recording for new card
          flipAnim.setValue(0);
          frontOpacity.setValue(1);
          backOpacity.setValue(0);
          return idx + 1;
        });
        cardSlideAnim.setValue(1); // Start new card from right
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Slide animation style
  const slideStyle = {
    transform: [
      {
        translateX: cardSlideAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        }),
      },
    ],
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // Play or pause audio logic
  async function handleAudioButtonPress(uri: any) {
    try {
      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: true,
      });
      if (!isAudioPlaying) {
        // Play or resume
        if (audioSoundRef.current) {
          await audioSoundRef.current.playAsync();
        } else {
          // Handle both string URIs (recorded audio) and object sources (existing audio)
          const source = typeof uri === 'string' ? { uri } : uri;
          const { sound } = await Audio.Sound.createAsync(source, { positionMillis: audioPosition });
          audioSoundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsAudioPlaying(false);
              setAudioPosition(0);
              audioSoundRef.current = null;
            }
          });
          await sound.playAsync();
        }
        setIsAudioPlaying(true);
      } else {
        // Pause
        if (audioSoundRef.current) {
          const status = await audioSoundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis || 0);
            await audioSoundRef.current.pauseAsync();
          }
        }
        setIsAudioPlaying(false);
      }
    } catch (e) {
      setIsAudioPlaying(false);
      console.log('Audio playback error:', e);
    }
  }

  // Clean up audio on unmount or card change
  React.useEffect(() => {
    return () => {
      if (audioSoundRef.current) {
        audioSoundRef.current.unloadAsync();
        audioSoundRef.current = null;
      }
    };
  }, [currentIdx]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      // console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      
      if (uri) {
        setRecordedAudioUri(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  // At the top of the file, add:
  const borderAnim = useRef(new Animated.Value(0)).current;
  const cardRef = useRef(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isQuizMode && !showQuizCountdown) {
      if (pauseNextTimer) return; // PAUSE BORDER ANIMATION IF TIMER IS PAUSED
      borderAnim.setValue(0);
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: ((currentFlashcard?.timeLimit)  || 30) * 1000,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start();
    }
    // eslint-disable-next-line
  }, [currentIdx, isQuizMode, pauseNextTimer, showQuizCountdown]);

  // At the top of FlippableFlashcard, after other hooks:
  const [circlePos, setCirclePos] = React.useState({ x: 0, y: 0 });
  const HEADSTART = 0.005; // 2% headstart for the circle

  // Helper to get (x, y) at a given progress (0-1) along the path
  function getPointAtLength(progress: number, w: number, h: number, r: number, halfStroke: number) {
    const straight = 2 * (w + h - 2 * r);
    const arc = 2 * Math.PI * r;
    const perimeter = straight + arc;
    const d = progress * perimeter;
    // Path segments (in order):
    const seg1 = w/2 - r; // top edge center to right
    const seg2 = Math.PI * r / 2; // top-right arc
    const seg3 = h - 2*r; // right edge
    const seg4 = Math.PI * r / 2; // bottom-right arc
    const seg5 = w - 2*r; // bottom edge
    const seg6 = Math.PI * r / 2; // bottom-left arc
    const seg7 = h - 2*r; // left edge
    const seg8 = Math.PI * r / 2; // top-left arc
    const seg9 = w/2 - r; // top edge left to center
    let remain = d;
    // 1. Top edge (center to right)
    if (remain <= seg1) {
      return { x: w/2 + remain, y: halfStroke };
    }
    remain -= seg1;
    // 2. Top-right arc (quarter circle, center at (w-r-halfStroke, r+halfStroke), from angle -90deg to 0deg)
    if (remain <= seg2) {
      const angle = (-Math.PI/2) + (remain / seg2) * (Math.PI/2); // -90deg to 0deg
      return {
        x: w - r - halfStroke + r * Math.cos(angle),
        y: r + halfStroke + r * Math.sin(angle)
      };
    }
    remain -= seg2;
    // 3. Right edge (down)
    if (remain <= seg3) {
      return { x: w - halfStroke, y: r + halfStroke + remain };
    }
    remain -= seg3;
    // 4. Bottom-right arc (center at (w-r-halfStroke, h-r-halfStroke), from angle 0deg to 90deg)
    if (remain <= seg4) {
      const angle = 0 + (remain / seg4) * (Math.PI/2); // 0deg to 90deg
      return {
        x: w - r - halfStroke + r * Math.cos(angle),
        y: h - r - halfStroke + r * Math.sin(angle)
      };
    }
    remain -= seg4;
    // 5. Bottom edge (right to left)
    if (remain <= seg5) {
      return { x: w - r - halfStroke - remain, y: h - halfStroke };
    }
    remain -= seg5;
    // 6. Bottom-left arc (center at (r+halfStroke, h-r-halfStroke), from angle 90deg to 180deg)
    if (remain <= seg6) {
      const angle = Math.PI/2 + (remain / seg6) * (Math.PI/2); // 90deg to 180deg
      return {
        x: r + halfStroke + r * Math.cos(angle),
        y: h - r - halfStroke + r * Math.sin(angle)
      };
    }
    remain -= seg6;
    // 7. Left edge (up)
    if (remain <= seg7) {
      return { x: halfStroke, y: h - r - halfStroke - remain };
    }
    remain -= seg7;
    // 8. Top-left arc (center at (r+halfStroke, r+halfStroke), from angle 180deg to 270deg)
    if (remain <= seg8) {
      const angle = Math.PI + (remain / seg8) * (Math.PI/2); // 180deg to 270deg
      return {
        x: r + halfStroke + r * Math.cos(angle),
        y: r + halfStroke + r * Math.sin(angle)
      };
    }
    remain -= seg8;
    // 9. Top edge (left to center)
    if (remain <= seg9) {
      return { x: r + halfStroke + remain, y: halfStroke };
    }
    return { x: w/2, y: halfStroke };
  }

  // Update circlePos when borderAnim, cardSize, or isQuizMode changes
  React.useEffect(() => {
    if (!isQuizMode || showQuizCountdown || cardSize.width === 0 || cardSize.height === 0) return;
    const w = cardSize.width;
    const h = cardSize.height;
    const r = 30;
    const halfStroke = 2.5;
    const update = (value: number) => {
      const progress = Math.min(value + HEADSTART, 1);
      setCirclePos(getPointAtLength(progress, w, h, r, halfStroke));
    };
    const id = borderAnim.addListener(({ value }) => {
      update(value);
    });
    // Set initial
    update((borderAnim as any)._value ?? 0);
    return () => borderAnim.removeListener(id);
  }, [isQuizMode, showQuizCountdown, cardSize.width, cardSize.height, borderAnim]);

  // Track card's absolute position for correct circle placement
  const [cardLayout, setCardLayout] = React.useState({ left: 0, top: 0 });

  // At the top of FlippableFlashcard, after other hooks:
  const [countdown, setCountdown] = React.useState(0);
  const countdownIntervalRef = useRef<any>(null);

  // Start/reset countdown in quiz mode when card changes
  useEffect(() => {
    if (isQuizMode && currentFlashcard?.timeLimit && !showQuizCountdown) {
      if (pauseNextTimer) return; // DO NOT START TIMER IF PAUSED
      setCountdown(currentFlashcard.timeLimit);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev > 0) return prev - 1;
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        });
      }, 1000);
      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    } else {
      setCountdown(0);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
     
  }, [isQuizMode, currentIdx, pauseNextTimer, currentFlashcard?.timeLimit, showQuizCountdown]);

  // Add shiver animation state at the top of FlippableFlashcard
  const shiverAnim = useRef(new Animated.Value(0)).current;
  const shiverIntervalRef = useRef<any>(null);

  // Shiver animation function
  const triggerShiver = () => {
    shiverAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shiverAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shiverAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shiverAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shiverAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Effect to start/stop shiver when countdown is zero
  useEffect(() => {
    if (countdown === 0 && isQuizMode && !showQuizCountdown) {
      triggerShiver();
      if (shiverIntervalRef.current) clearInterval(shiverIntervalRef.current);
      shiverIntervalRef.current = setInterval(() => {
        triggerShiver();
      }, 2000);
    } else {
      if (shiverIntervalRef.current) clearInterval(shiverIntervalRef.current);
      shiverAnim.setValue(0);
    }
    return () => {
      if (shiverIntervalRef.current) clearInterval(shiverIntervalRef.current);
    };
  }, [countdown, isQuizMode, showQuizCountdown]);

  // Define the border/circle color based on countdown
  const borderColor = countdown === 0 ? Colors[theme].alertColor : Colors[theme].brandColor1;

  // Start timing when current flashcard changes
  React.useEffect(() => {
    const currentFlashcard = flashcards[currentIdx];
    if (currentFlashcard && (isStudyMode || isQuizMode)) {
      startFlashcardTimer(currentFlashcard.flashcardID);
    }
  }, [currentIdx, isStudyMode, isQuizMode, flashcards]);

  // Helper to get localized cognitiveQnType label
  const getCognitiveQnTypeLabel = (type: string, language: string) => {
    const cognitiveQnTypes = strings[language].viewFlashcardsPage.cognitiveQnTypes;
    
    // Map the type to the corresponding key in strings
    const typeMapping: Record<string, keyof typeof cognitiveQnTypes> = {
      'Recall': 'recall',
      'Application': 'application',
      'Analysis': 'analysis',
      'Synthesis': 'synthesis',
      'Evaluation': 'evaluation',
      'Comprehension': 'comprehension',
      'Problem-Solving': 'problemSolving',
      'None': 'none',
    };
    
    const key = typeMapping[type];
    return key ? cognitiveQnTypes[key] : type;
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Left Chevron Button - hidden in study mode, but visible in retry difficult mode */}
      {(!isStudyMode && !isQuizMode) || (isStudyMode && retryDifficultParam === 'true') ? (
        <TouchableOpacity
          style={styles.leftChevronButton}
          onPress={navigateToPreviousCard}
          disabled={isLeftChevronDisabled()}
        >
          <AntDesign
            name="left"
            size={30}
                            color={isLeftChevronDisabled() ? Colors[theme].unselectedText : Colors[theme].text}
          />
        </TouchableOpacity>
      ) : null}
      {/* Right Chevron Button */}
      <TouchableOpacity
        style={styles.rightChevronButton}
        onPress={navigateToNextCard}
        disabled={isRightChevronDisabled()}
      >
        <AntDesign
          name="right"
          size={30}
                          color={isRightChevronDisabled() ? Colors[theme].unselectedText : Colors[theme].text}
        />
      </TouchableOpacity>
      <Animated.View style={[{ flex: 1 }, slideStyle]}>
        <View style={{ flex: 1 }}>
          <Animated.View
            ref={cardRef}
            onLayout={e => {
              const { width, height, x, y } = e.nativeEvent.layout;
              setCardSize({ width, height });
              setCardLayout({ left: x, top: y });
            }}
            style={[
              styles.flippableCard,
              {
                backgroundColor: Colors[theme].secondaryShade,
                transform: [
                  { rotateY: frontInterpolate },
                  { translateX: shiverAnim },
                ],
                zIndex: isFlipped ? 0 : 1,
                position: 'absolute',
                width: '100%',
                height: '100%',
              },
            ]}
          >
            {/* Animated border overlay for quiz mode */}
            {isQuizMode && !showQuizCountdown && cardSize.width > 0 && cardSize.height > 0 && (() => {
              const w = cardSize.width;
              const h = cardSize.height;
              const stroke = 5;
              const r = 30; // border radius, match your card's borderRadius
              const halfStroke = stroke / 2;
              const straight = 2 * (w + h - 2 * r);
              const arc = 2 * Math.PI * r;
              const perimeter = straight + arc;
              const path = [
                `M ${w / 2} ${halfStroke}`,
                `L ${w - r - halfStroke} ${halfStroke}`,
                `A ${r} ${r} 0 0 1 ${w - halfStroke} ${r + halfStroke}`,
                `L ${w - halfStroke} ${h - r - halfStroke}`,
                `A ${r} ${r} 0 0 1 ${w - r - halfStroke} ${h - halfStroke}`,
                `L ${r + halfStroke} ${h - halfStroke}`,
                `A ${r} ${r} 0 0 1 ${halfStroke} ${h - r - halfStroke}`,
                `L ${halfStroke} ${r + halfStroke}`,
                `A ${r} ${r} 0 0 1 ${r + halfStroke} ${halfStroke}`,
                `L ${w / 2} ${halfStroke}`
              ].join(' ');

              return (
                <View style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  zIndex: 100,
                  pointerEvents: 'none',
                }}>
                  <Svg width={w} height={h}>
                    <AnimatedPath
                      d={path}
                      stroke={borderColor}
                      strokeWidth={stroke}
                      fill="none"
                      strokeDasharray={perimeter}
                      strokeDashoffset={borderAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [perimeter, 0],
                      })}
                    />
                  </Svg>
                  {/* Animated circle following the path */}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: borderColor,
                      left: circlePos.x - 16,
                      top: circlePos.y - 16,
                    }}
                  />
                </View>
              );
            })()}
            {/* Front content here */}
            
            {/* Top container */}
            <Animated.View style={[styles.topContainer, { opacity: frontOpacity }]}>
              <View style={styles.topContainerContent}>
                <Text style={[styles.flashcardIndexText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
                  {`${strings[language].flashcardViewPage.questionLabel} ${displayNumber} ${strings[language].flashcardViewPage.ofLabel} ${totalCards}`}
                </Text>
                <FavoriteButton size={30} favorited={favorited} onPress={onToggleFavorite} />
              </View>
              {isQuizMode && !showQuizCountdown && (
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {countdown === 0 ? (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 24, color: Colors[theme].alertColor, textAlign: 'center' }}>{strings[language].flashcardViewPage.timesUp}</Text>
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 24, color: Colors[theme].brandColor1, textAlign: 'center' }}>{`${countdown}${strings[language].flashcardViewPage.seconds}`}</Text>
                  )}
                </View>
              )}
            </Animated.View>
            
            {/* Middle container */}
            <Animated.View style={[styles.middleContainer, { opacity: frontOpacity }]}>
              {flashcardQnType === 'text' && (
                <ScrollView 
                  style={styles.questionScrollView}
                  contentContainerStyle={styles.questionScrollViewContent}
                  showsVerticalScrollIndicator={false}
                >
                  {renderQuestionWithBlanks(flashcardQn, theme)}
                </ScrollView>
              )}
              {flashcardQnType === 'image' && !!flashcardQn && (
                (() => {
                  // Check if this is SVG content by examining the source
                  const source = flashcardQn as any;
                  if (source && source.uri && source.uri.startsWith('data:image/svg+xml')) {
                    // It's SVG content, extract and render
                    const svgData = extractSVGFromBlob(source.uri);
                    if (svgData && svgData.paths.length > 0) {
                      return (
                        <View style={styles.middleImage}>
                          <Svg width="100%" height="100%" viewBox={svgData.viewBox}>
                            {svgData.paths.map((path, index) => (
                              <Path
                                key={index}
                                d={path.d}
                                stroke={path.stroke}
                                strokeWidth={path.strokeWidth}
                                fill={path.fill}
                              />
                            ))}
                          </Svg>
                        </View>
                      );
                    } else {
                      return null;
                    }
                  } else {
                    // It's regular image content, use Image component
                    return (
                <Image
                  source={flashcardQn as ImageSourcePropType}
                  style={styles.middleImage}
                  resizeMode="contain"
                />
                    );
                  }
                })()
              )}
              {flashcardQnType === 'audio' && !!flashcardQn && (
                <View style={styles.audioContainer}>
                  <Text style={[styles.audioLabel, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>{strings[language].flashcardViewPage.question}:</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.replayButton, 
                      { backgroundColor: Colors[theme].secondaryShade, shadowColor: Colors[theme].text },
                      pressed && [styles.buttonPressed, { backgroundColor: Colors[theme].unselectedText }]
                    ]}
                    onPress={() => handleAudioButtonPress(flashcardQn)}
                  >
                    {!isAudioPlaying ? (
                      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                        <Path
                          d="M18 12v24l22-12z"
                          fill="black"
                          transform="rotate(0 24 24)"
                        />
                      </Svg>
                    ) : (
                      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                        <Rect x={16} y={12} width={6} height={24} rx={2} fill="black" />
                        <Rect x={26} y={12} width={6} height={24} rx={2} fill="black" />
                      </Svg>
                    )}
                  </Pressable>
                </View>
              )}
            </Animated.View>
            
            {/* Bottom container */}
            <Animated.View style={[styles.bottomContainer, { opacity: frontOpacity }]}>
              {currentFlashcard?.cognitiveQnType && currentFlashcard.cognitiveQnType !== 'None' && (
                <View style={{
                  width: '50%',
                  height: '60%',
                  borderRadius: 30,
                  backgroundColor: Colors[theme].background,
                  borderColor: Colors[theme].brandColor2,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                  left: 10, 
                }}>
                  <Text style={{ fontSize: 14, color: Colors[theme].text, textAlign: 'center', fontFamily: Fonts.bodyMedium }}>
                    {getCognitiveQnTypeLabel(currentFlashcard.cognitiveQnType, language)} {strings[language].flashcardViewPage.questionLabel}
                  </Text>
                </View>
              )}
            </Animated.View>
            
            {/* Front flip arrow - positioned at bottom right */}
            <Animated.View style={[styles.flipArrowContainer, { opacity: frontOpacity }]}>
              <FlippableCardFrontFlipArrow width={30} height={30} />
            </Animated.View>
          </Animated.View>
          <Animated.View
            style={[
              styles.flippableCard,
              {
                backgroundColor: Colors[theme].secondaryShade,
                transform: [
                  { rotateY: backInterpolate },
                  { translateX: shiverAnim },
                ],
                zIndex: isFlipped ? 1 : 0,
                position: 'absolute',
                width: '100%',
                height: '100%',
              },
            ]}
          >
            {/* Animated border overlay for quiz mode (BACK SIDE) */}
            {isQuizMode && !showQuizCountdown && cardSize.width > 0 && cardSize.height > 0 && (() => {
              const w = cardSize.width;
              const h = cardSize.height;
              const stroke = 5;
              const r = 30; // border radius, match your card's borderRadius
              const halfStroke = stroke / 2;
              const straight = 2 * (w + h - 2 * r);
              const arc = 2 * Math.PI * r;
              const perimeter = straight + arc;
              const path = [
                `M ${w / 2} ${halfStroke}`,
                `L ${w - r - halfStroke} ${halfStroke}`,
                `A ${r} ${r} 0 0 1 ${w - halfStroke} ${r + halfStroke}`,
                `L ${w - halfStroke} ${h - r - halfStroke}`,
                `A ${r} ${r} 0 0 1 ${w - r - halfStroke} ${h - halfStroke}`,
                `L ${r + halfStroke} ${h - halfStroke}`,
                `A ${r} ${r} 0 0 1 ${halfStroke} ${h - r - halfStroke}`,
                `L ${halfStroke} ${r + halfStroke}`,
                `A ${r} ${r} 0 0 1 ${r + halfStroke} ${halfStroke}`,
                `L ${w / 2} ${halfStroke}`
              ].join(' ');
              return (
                <View style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  zIndex: 100,
                  pointerEvents: 'none',
                }}>
                  <Svg width={w} height={h}>
                    <AnimatedPath
                      d={path}
                      stroke={borderColor}
                      strokeWidth={stroke}
                      fill="none"
                      strokeDasharray={perimeter}
                      strokeDashoffset={borderAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [perimeter, 0],
                      })}
                    />
                  </Svg>
                </View>
              );
            })()}
            {/* Back content here */}
            
            {/* Top container */}
            <Animated.View style={[styles.topContainer, { opacity: backOpacity }]}>
              <View style={styles.topContainerContent}>
                <Text style={[styles.flashcardIndexText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
                  {`${strings[language].flashcardViewPage.answerLabel} ${displayNumber} ${strings[language].flashcardViewPage.ofLabel} ${totalCards}`}
                </Text>
                <FavoriteButton size={30} favorited={favorited} onPress={onToggleFavorite} />
              </View>
              {isQuizMode && !showQuizCountdown && (
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {countdown === 0 ? (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 24, color: Colors[theme].alertColor, textAlign: 'center' }}>{strings[language].flashcardViewPage.timesUp}</Text>
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 24, color: Colors[theme].brandColor1, textAlign: 'center' }}>{`${countdown}${strings[language].flashcardViewPage.seconds}`}</Text>
                  )}
                </View>
              )}
            </Animated.View>
            
            {/* Middle container */}
            <Animated.View style={[styles.middleContainer, { opacity: backOpacity }]}>
              {flashcardAnswerType === 'text' && (
                  <ScrollView 
                      style={styles.questionScrollView}
                      contentContainerStyle={styles.questionScrollViewContent}
                      showsVerticalScrollIndicator={false}
                  >
                      {renderQuestionWithBlanks(flashcardAnswer, theme)}
                  </ScrollView>
                  )}
              {flashcardAnswerType === 'mcq' && Array.isArray(flashcardAnswer) && (
                <ScrollView 
                  style={styles.questionScrollView}
                  contentContainerStyle={styles.mcqChoicesContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {mcqOptionsWithLettersRef.current.map((option: any, idx: number) => (
                    <View key={idx} style={styles.mcqOptionRow}>
                        <Text style={styles.mcqOptionText}>
                            {option.letter}) {option.choice}
                        </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              {flashcardAnswerType === 'voice' && (
                <View style={styles.voiceAnswerContainer}>
                  {!isRecording ? (
                    <>
                      <Text style={[styles.voiceAnswerText, { color: Colors[theme].unselectedText, fontFamily: Fonts.bodyMedium }]}>
                        {recordedAudioUri ? 
                        strings[language].flashcardViewPage.greatAnswerReplayOrFeedback : 
                        strings[language].flashcardViewPage.recordAnswerGetFeedback}
                      </Text>
                      <LottieView
                        source={require('@/assets/animations/DownArrowAnimation.json')}
                        autoPlay
                        loop
                        style={styles.voiceAnswerAnimation}
                      />
                    </>
                  ) : (
                    <LottieView
                      source={require('@/assets/animations/SoundWaveLoadingAnimation.json')}
                      autoPlay
                      loop
                      style={styles.soundWaveAnimation}
                    />
                  )}
                </View>
              )}
              {flashcardAnswerType === 'voice' && (
                <View style={styles.micButtonsContainer}>
                  <Pressable 
                    style={({ pressed }) => [
                      styles.micButton,
                      { backgroundColor: Colors[theme].secondaryShade, shadowColor: Colors[theme].text },
                      pressed && [styles.buttonPressed, { backgroundColor: Colors[theme].unselectedText }],
                      isRecording && [styles.recordingButton, { backgroundColor: Colors[theme].alertColor }]
                    ]}
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                  >
                    <MicIcon width={36} height={36} />
                  </Pressable>
                  <Pressable 
                    style={({ pressed }) => [
                      styles.replayButton,
                      pressed && styles.buttonPressed
                    ]}
                    onPress={() => {
                      if (recordedAudioUri) {
                        handleAudioButtonPress(recordedAudioUri);
                      }
                    }}
                    disabled={!recordedAudioUri}
                  >
                    {!isAudioPlaying ? (
                      <Svg width={45} height={45} viewBox="0 0 24 24" fill="none">
                        <Path 
                          d="M8 5v14l11-7z" 
                          fill={recordedAudioUri ? Colors[theme].text : Colors[theme].unselectedText}
                          transform="rotate(0 12 12)"
                        />
                      </Svg>
                    ) : (
                      <Svg width={45} height={45} viewBox="0 0 24 24" fill="none">
                        <Rect x={7} y={5} width={4} height={14} rx={1.5} fill="black" />
                        <Rect x={13} y={5} width={4} height={14} rx={1.5} fill="black" />
                      </Svg>
                    )}
                  </Pressable>
                  <Pressable 
                    style={({ pressed }) => [
                      styles.aiChatButton,
                      { backgroundColor: Colors[theme].secondaryShade, shadowColor: Colors[theme].text },
                      pressed && [styles.buttonPressed, { backgroundColor: Colors[theme].unselectedText }]
                    ]}
                    onPress={() => {
                      // TODO: Implement AI chat functionality
                      console.log('AI Chat button pressed');
                    }}
                    disabled={!recordedAudioUri}
                  >
                    {recordedAudioUri ? <AIChatIcon width={36} height={36}/> : <AIChatIconGrey width={36} height={36} />}
                  </Pressable>
                </View>
              )}
              {flashcardAnswerType === 'image' && !!flashcardAnswer && (
                (() => {
                  // Check if this is SVG content by examining the source
                  const source = flashcardAnswer as any;
                  if (source && source.uri && source.uri.startsWith('data:image/svg+xml')) {
                    // It's SVG content, extract and render
                    const svgData = extractSVGFromBlob(source.uri);
                    if (svgData && svgData.paths.length > 0) {
                      return (
                        <View style={styles.middleImage}>
                          <Svg width="100%" height="100%" viewBox={svgData.viewBox}>
                            {svgData.paths.map((path, index) => (
                              <Path
                                key={index}
                                d={path.d}
                                stroke={path.stroke}
                                strokeWidth={path.strokeWidth}
                                fill={path.fill}
                              />
                            ))}
                          </Svg>
                        </View>
                      );
                    } else {
                      return null;
                    }
                  } else {
                    // It's regular image content, use Image component
                    return (
                <Image
                  source={flashcardAnswer}
                  style={styles.middleImage}
                  resizeMode="contain"
                />
                    );
                  }
                })()
              )}
              {flashcardAnswerType === 'audio' && !!flashcardAnswer && (
                <View style={styles.audioContainer}>
                  <Text style={[styles.audioLabel, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>{strings[language].flashcardViewPage.answer}:</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.replayButton, 
                      { backgroundColor: Colors[theme].secondaryShade, shadowColor: Colors[theme].text },
                      pressed && [styles.buttonPressed, { backgroundColor: Colors[theme].unselectedText }]
                    ]}
                    onPress={() => handleAudioButtonPress(flashcardAnswer)}
                  >
                    {!isAudioPlaying ? (
                      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                        <Path
                          d="M18 12v24l22-12z"
                          fill="black"
                          transform="rotate(0 24 24)"
                        />
                      </Svg>
                    ) : (
                      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                        <Rect x={16} y={12} width={6} height={24} rx={2} fill="black" />
                        <Rect x={26} y={12} width={6} height={24} rx={2} fill="black" />
                      </Svg>
                    )}
                  </Pressable>
                </View>
              )}
            </Animated.View>
            
            {/* Bottom container */}
            <Animated.View style={[styles.bottomContainer, { opacity: backOpacity }]}>
              {flashcardAnswerType === 'mcq' && mcqOptionsWithLettersRef.current.length > 0 && (
                <View style={styles.mcqBottomContainer}>
                  {mcqOptionsWithLettersRef.current.map((option: any) => (
                    <MCQOption
                      key={option.letter}
                      text={option.letter}
                      selected={selectedMCQOption === option.letter}
                      onPress={() => handleMCQOptionSelect(option.letter)}
                      disabled={isQuizMode && hasSubmittedMCQ}
                    />
                  ))}
                  <SubmitButton
                    enabled={selectedMCQOption !== null}
                    onPress={handleMCQSubmit}
                    disabled={isQuizMode && hasSubmittedMCQ}
                    language={language}
                  />
                </View>
              )}
            </Animated.View>
            
            {/* Back flip arrow - positioned at bottom right */}
            <Animated.View style={[styles.flipArrowContainer, { opacity: backOpacity }]}>
              <FlippableCardBackFlipArrow width={30} height={30} />
            </Animated.View>
          </Animated.View>
        </View>
        
        {/* Separate Pressable for flip arrow area only */}
        <Pressable 
          onPress={handlePress} 
          style={styles.flipArrowPressable}
        />
      </Animated.View>
      {isQuizMode && cardSize.width > 0 && cardSize.height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: cardLayout.left + circlePos.x - 16,
            top: cardLayout.top + circlePos.y - 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: borderColor,
            zIndex: 200,
            elevation: 200,
            transform: [{ translateX: shiverAnim }],
          }}
        />
      )}
    </View>
  );
};

// Local MCQ Option component
const MCQOption = ({ text, selected, onPress, disabled }: { text: string; selected: boolean; onPress: () => void; disabled?: boolean }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.mcqOptionContainer}>
      <SmallCircleSelectButton selected={selected} onPress={onPress} disabled={disabled} />
                      <Text style={[styles.mcqOptionLabelText, disabled && { color: Colors[theme].unselectedText }]}>{text}</Text>
    </View>
  );
};

// Local Submit Button component
const SubmitButton = ({ enabled, onPress, disabled, language }: { enabled: boolean; onPress: () => void; disabled?: boolean; language: string }) => {
  const { theme } = useTheme();
  const isDisabled = disabled || !enabled;
  return (
    <TouchableOpacity
      style={[
        styles.submitButton,
        { backgroundColor: isDisabled ? Colors[theme].unselectedText : Colors[theme].brandColor2 }
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
              <Text style={styles.submitButtonText}>{strings[language].flashcardViewPage.submit}</Text>
    </TouchableOpacity>
  );
};

// Local MCQ Feedback Modal component
const MCQFeedbackModal = ({ visible, opacity, isCorrect, onDismiss, lottieMarginTop = 80, isStudyMode, isQuizMode, language }: {
  visible: boolean;
  opacity: Animated.Value;
  isCorrect: boolean;
  onDismiss: () => void;
  lottieMarginTop?: number;
  isStudyMode: boolean;
  isQuizMode: boolean;
  language: string;
}) => {
  const { theme } = useTheme();
  return (
    visible ? (
    <Animated.View style={[
      styles.mcqModalOverlay, 
      { 
        opacity, 
        zIndex: 9999,
        backgroundColor: Colors[theme].background,
        borderColor: Colors[theme].brandColor2
      }
    ]}> 
      {/* Icon at top left */}
      <View style={styles.mcqModalIconAbsolute}>
        {isCorrect ? <GreenTickIcon width={24} height={24} /> : <DeleteModalIcon width={24} height={24} />}
      </View>
      {/* Centered text */}
      <View style={styles.mcqModalTextCenterWrap}>
        <Text style={[styles.mcqModalText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
          {isCorrect ? strings[language].flashcardViewPage.correctAnswerGoodJob : strings[language].flashcardViewPage.incorrectAnswerTryAgain}
        </Text>
      </View>
      {/* Lottie animation absolutely positioned */}
      <LottieView
        source={isCorrect ? require('@/assets/animations/CorrectAnswer.json') : require('@/assets/animations/WrongAnswer.json')}
        autoPlay
        loop
        style={[styles.mcqModalLottie, { width: isCorrect ? 375 : 225, height: isCorrect ? 375 : 225, left: isCorrect ? -34 : 30, top: isCorrect ? -40 : 45}]}
      />
      {/* Button absolutely at bottom center */}
              <TouchableOpacity style={[styles.mcqModalButtonAbsolute, { backgroundColor: Colors[theme].brandColor2 }]} onPress={onDismiss} activeOpacity={0.8}>
        <Text style={[styles.mcqModalButtonText, { color: Colors[theme].background, fontFamily: Fonts.bodyMedium }]}>{strings[language].flashcardViewPage.ok}</Text>
      </TouchableOpacity>
    </Animated.View>
  ) : null
  );
};

// Loading Screen Component to avoid hooks in conditional render
const LoadingScreen = ({ progress, current, total, language }: { progress: number; current: number; total: number; language: string }) => {
  const { theme } = useTheme();
  const percent = Math.round(progress * 100);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress, progressAnim]);

  const animatedWidth = useCallback(() => {
    return progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
  }, [progressAnim]);

  return (
    <View style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}>
        <View style={{
          flex: 1,
          backgroundColor: Colors[theme].background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Stacked image + Lottie animation */}
          <View style={{ width: '100%', aspectRatio: 1.1, marginTop: '15%', marginBottom: 0, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('@/assets/images/loadingBackground.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24 }}
              resizeMode="contain"
              fadeDuration={0}
            />
            <LottieView
              source={require('@/assets/animations/LoadingAnimation2.json')}
              autoPlay
              loop
              style={{ position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%' }}
              cacheComposition={true}
            />
          </View>
          {/* Text and progress below */}
          <View style={{ width: '100%', paddingHorizontal: 32, alignItems: 'center' }}>
            <Text style={{
              fontFamily: Fonts.bodyBold,
              fontWeight: '700',
              fontSize: 24,
              color: Colors[theme].text,
              textAlign: 'center',
              marginTop: 24,
              marginBottom: 16,
            }}>
              {strings[language].flashcardViewPage.loading}
            </Text>
            <View style={{
              width: '100%',
              marginTop: 8,
              marginBottom: 8,
              alignItems: 'center',
            }}>
              <View style={{
                width: '100%',
                height: 16,
                backgroundColor: Colors[theme].unselectedText,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                <Animated.View 
                  style={{
                    height: '100%',
                    backgroundColor: percent === 100 ? Colors[theme].brandColor1 : Colors[theme].brandColor2,
                    borderRadius: 8,
                    width: animatedWidth(),
                  }} 
                />
              </View>
            </View>
            <Text style={{
              fontFamily: Fonts.bodyBold,
              fontWeight: '700',
              fontSize: 24,
              color: Colors[theme].brandColor2,
              textAlign: 'center',
              marginTop: 4,
              marginBottom: 4,
            }}>
              {percent}%
            </Text>
            <Text style={{
              fontFamily: Fonts.bodyMedium,
              fontSize: 14,
              color: Colors[theme].text,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {`${current} ${strings[language].flashcardViewPage.outOf} ${total} ${strings[language].flashcardViewPage.flashcardsLoaded}`}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default function FlashcardViewPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { deckID, flashcardIdx, totalNumberOfFlashcards, isStudyMode: isStudyModeParam, isQuizMode: isQuizModeParam, isAIDeck: isAIDeckParam, retryDifficult: retryDifficultParam } = useLocalSearchParams();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // State for loaded flashcards from database
  const [flashcards, setFlashcards] = useState<TransformedFlashcard[]>([]);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingCurrent, setLoadingCurrent] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(1);

  // Lift currentIdx state up here
  const [currentIdx, setCurrentIdx] = useState(parseInt(flashcardIdx as string) || 0);
  const totalCards = flashcards.length > 0 ? flashcards.length : parseInt(totalNumberOfFlashcards as string) || 0;
  
  // Add isFlipped state to track card side
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Add a separate state to force re-renders when difficulty changes
  const [difficultyUpdateTrigger, setDifficultyUpdateTrigger] = useState(0);

  // Study mode state management
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [hasFlippedCard, setHasFlippedCard] = useState(false);
  const [hasSubmittedMCQ, setHasSubmittedMCQ] = useState(false);
  const [studyValidationModalVisible, setStudyValidationModalVisible] = useState(false);
  const [studyValidationMessage, setStudyValidationMessage] = useState("");
  const studyValidationModalOpacity = useRef(new Animated.Value(0)).current;
  const studyValidationOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Add favorited state for each flashcard (using index as key for dummy data) - MOVED HERE
  const [favoritedMap, setFavoritedMap] = useState<{ [idx: number]: boolean }>({});

  // Add quiz countdown state
  const [showQuizCountdown, setShowQuizCountdown] = useState(false);

  // Add voice recording state (lifted from FlippableFlashcard)
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  // Load flashcards from database when component mounts
  useEffect(() => {
    const loadFlashcards = async () => {
      if (deckID && isAIDeckParam) {
        setIsLoadingFlashcards(true);
        setLoadingProgress(0);
        setLoadingCurrent(0);
        
        try {
          const retryDifficult = retryDifficultParam === 'true';
          
          // First, get the actual count of flashcards to load
          const userID = await getCurrentUserID();
          const isAIDeckFromParams = isAIDeckParam === 'true';
          const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
          
          let countQuery = `
            SELECT COUNT(*) as count
            FROM ${tableName}
            WHERE deckID = ? AND userID = ?
          `;
          
          const countParams: any[] = [parseInt(deckID as string), userID];
          
          const countResult = await db.getFirstAsync(countQuery, countParams);
          const actualCount = (countResult as any)?.count || 0;
          
          // Set the actual total
          setLoadingTotal(actualCount);
          
          // Load flashcards with progress tracking
          const loadedFlashcards = await loadFlashcardsFromDatabase(deckID as string, isAIDeckParam as string, retryDifficult);
          
          // Update progress as each flashcard is processed
          let processedCount = 0;
          for (const flashcard of loadedFlashcards) {
            // Simulate processing time for each flashcard
            await new Promise(resolve => setTimeout(resolve, 50));
            processedCount++;
            setLoadingCurrent(processedCount);
            setLoadingProgress(processedCount / loadedFlashcards.length);
          }
          
          setFlashcards(loadedFlashcards);
          console.log('Loaded flashcards from database:', loadedFlashcards.length);
        } catch (error) {
          console.error('Error loading flashcards:', error);
          setFlashcards([]);
        } finally {
          setIsLoadingFlashcards(false);
        }
      }
    };

    loadFlashcards();
  }, [deckID, isAIDeckParam, retryDifficultParam]);

  // Handler to toggle favorite for current card - UPDATED TO WORK WITH DATABASE
  const handleToggleFavorite = async () => {
    try {
      const currentFlashcard = flashcards[currentIdx];
      if (!currentFlashcard) return;

      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeckParam === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const newFavoriteStatus = currentFlashcard.isFavorited ? 0 : 1;

      // Update database
      await db.runAsync(`
        UPDATE ${tableName}
        SET isFavorited = ?
        WHERE flashcardID = ? AND userID = ?
      `, [newFavoriteStatus, currentFlashcard.flashcardID, userID]);

      // Update local state
      setFlashcards(prev => prev.map((card, idx) => 
        idx === currentIdx 
          ? { ...card, isFavorited: !card.isFavorited }
          : card
      ));

      console.log(`Flashcard ${currentFlashcard.flashcardID} favorite status updated to ${newFavoriteStatus}`);
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  // Add time tracking state
  const [flashcardStartTimes, setFlashcardStartTimes] = useState<{ [flashcardId: number]: number }>({});

  // Function to start timing a flashcard
  const startFlashcardTimer = (flashcardId: number) => {
    setFlashcardStartTimes(prev => ({
      ...prev,
      [flashcardId]: Date.now()
    }));
  };

  // Function to calculate time taken for a flashcard
  const calculateTimeTaken = (flashcardId: number): number | null => {
    const startTime = flashcardStartTimes[flashcardId];
    if (!startTime) return null;
    
    const endTime = Date.now();
    const timeTakenSeconds = Math.round((endTime - startTime) / 1000);
    return timeTakenSeconds;
  };

  // Function to update last studied/quizzed date
  const updateFlashcardDate = async (flashcardId: number, isStudyMode: boolean, timeTaken?: number, isMcqCorrect?: boolean) => {
    try {
      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeckParam === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
      const currentDate = new Date().toISOString(); // Full ISO format: '2025-01-27T09:15:00.000Z'
      
      const fieldToUpdate = isStudyMode ? 'lastStudiedDate' : 'lastQuizzedDate';
      
      // Calculate time taken if not provided
      const finalTimeTaken = timeTaken !== undefined ? timeTaken : calculateTimeTaken(flashcardId);
      
      // Update the flashcard's study/quiz date, time taken, and MCQ answer correctness
      await db.runAsync(`
        UPDATE ${tableName}
        SET ${fieldToUpdate} = ?, timeTaken = ?, isMcqAnswerRight = ?
        WHERE flashcardID = ? AND userID = ?
      `, [currentDate, finalTimeTaken, isMcqCorrect !== undefined ? (isMcqCorrect ? 1 : 0) : null, flashcardId, userID]);

      // Update the deck's lastModifiedDate since it was actively used
      await db.runAsync(`
        UPDATE ${deckTableName}
        SET lastModifiedDate = ?
        WHERE deckID = ? AND userID = ?
      `, [currentDate, parseInt(deckID as string), userID]);

      // Track this flashcard as attempted for halfway checkpoint
      trackAttemptedFlashcard(flashcardId);

      console.log(`Updated ${fieldToUpdate} for flashcard ${flashcardId} to ${currentDate}`);
      console.log(`Updated timeTaken for flashcard ${flashcardId} to ${finalTimeTaken || 'null'}`);
      console.log(`Updated isMcqAnswerRight for flashcard ${flashcardId} to ${isMcqCorrect !== undefined ? (isMcqCorrect ? 1 : 0) : 'null'}`);
      console.log(`Updated lastModifiedDate for deck ${deckID} to ${currentDate}`);
    } catch (error) {
      console.error(`Error updating ${isStudyMode ? 'study' : 'quiz'} date:`, error);
    }
  };

  // Function to update deck's completion date when entire deck is finished
  const updateDeckCompletionDate = async (isStudyMode: boolean) => {
    try {
      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeckParam === 'true';
      const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
      const currentDate = new Date().toISOString(); // Full ISO format: '2025-01-27T09:15:00.000Z'
      
      const fieldToUpdate = isStudyMode ? 'lastStudiedDate' : 'lastQuizzedDate';
      
      // Update the deck's completion date
      await db.runAsync(`
        UPDATE ${deckTableName}
        SET ${fieldToUpdate} = ?
        WHERE deckID = ? AND userID = ?
      `, [currentDate, parseInt(deckID as string), userID]);

      console.log(`Updated deck ${deckID} ${fieldToUpdate} to ${currentDate} (deck completed)`);
    } catch (error) {
      console.error(`Error updating deck completion date:`, error);
    }
  };

  // Set study mode from URL parameter
  useEffect(() => {
    setIsStudyMode(isStudyModeParam === 'true');
    setIsQuizMode(isQuizModeParam === 'true');
  }, [isStudyModeParam, isQuizModeParam]);

  // Show countdown screen for quiz mode AFTER flashcards are loaded
  useEffect(() => {
    if (isQuizMode && !isLoadingFlashcards && flashcards.length > 0) {
      setShowQuizCountdown(true);
      // Hide countdown after 3 seconds
      const timer = setTimeout(() => {
        setShowQuizCountdown(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isQuizMode, isLoadingFlashcards, flashcards.length]);

  // Function to update the difficulty of the current flashcard
  const handleDifficultyChange = async (difficulty: string) => {
    try {
      const currentFlashcard = flashcards[currentIdx];
      if (!currentFlashcard) return;

      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeckParam === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      
      // Update the database
      await db.runAsync(`
        UPDATE ${tableName}
        SET difficultyRating = ?
        WHERE flashcardID = ? AND userID = ?
      `, [difficulty, currentFlashcard.flashcardID, userID]);

      // Update local state
      const updatedFlashcards = [...flashcards];
      updatedFlashcards[currentIdx].flashcardDifficulty = difficulty;
      setFlashcards(updatedFlashcards);
      
      // Force a re-render by incrementing the trigger
      setDifficultyUpdateTrigger(prev => prev + 1);
      
      console.log(`Updated difficulty rating for flashcard ${currentFlashcard.flashcardID} to ${difficulty}`);
    } catch (error) {
      console.error('Error updating difficulty rating:', error);
    }
  };

  // Study validation modal handlers
  const showStudyValidationModal = (message: string) => {
    setStudyValidationMessage(message);
    setStudyValidationModalVisible(true);
    Animated.parallel([
      Animated.timing(studyValidationOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(studyValidationModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDismissStudyValidationModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(studyValidationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStudyValidationModalVisible(false);
    });
  };

  const handleTrashPress = () => {
    setIsDeleteModalOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDismissDeleteModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDeleteModalOpen(false);
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const currentFlashcard = flashcards[currentIdx];
      if (!currentFlashcard) return;

      const userID = await getCurrentUserID();
      const isAIDeckFromParams = isAIDeckParam === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
      
      // Delete from database
      await db.runAsync(`
        DELETE FROM ${tableName}
        WHERE flashcardID = ? AND userID = ?
      `, [currentFlashcard.flashcardID, userID]);

      // Update the deck's lastModifiedDate since a flashcard was deleted
      await db.runAsync(`
        UPDATE ${deckTableName}
        SET lastModifiedDate = '${new Date().toISOString()}'
        WHERE deckID = ? AND userID = ?
      `, [parseInt(deckID as string), userID]);
      console.log(`Updated lastModifiedDate for deck ${deckID} after flashcard deletion`);

      // Update local state by removing the deleted flashcard
      setFlashcards(prev => prev.filter((_, idx) => idx !== currentIdx));
      
      console.log(`Deleted flashcard ${currentFlashcard.flashcardID} from ${tableName}`);

      // Navigate to next card or previous card if at the end
      const newTotalCards = flashcards.length - 1;
      if (newTotalCards === 0) {
        // No cards left, go back to previous screen
        router.back();
        return;
      }

      // Determine which card to navigate to
      let newCurrentIdx = currentIdx;
      if (currentIdx >= newTotalCards) {
        // If we're at the last card and it gets deleted, go to the previous card
        newCurrentIdx = newTotalCards - 1;
      }
      // If we're not at the last card, stay at the same index (next card will slide in)

      // Update current index
      setCurrentIdx(newCurrentIdx);
      
      // Reset card states for the new card
      setIsFlipped(false);
      setHasFlippedCard(false);
      setHasSubmittedMCQ(false);
      setRecordedAudioUri(null);

      // Close the delete modal
    handleDismissDeleteModal();
      
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      handleDismissDeleteModal();
    }
  };

  // Handle copy functionality
  const handleCopyPress = async () => {
    const currentFlashcard = flashcards[currentIdx];
    
    try {
      if (isFlipped) {
        // Back side copy logic
        const answerType = currentFlashcard?.flashcardAnswerType;
        const answer = currentFlashcard?.flashcardAnswer;
        
              if (answerType === 'text' && typeof answer === 'string') {
        await Clipboard.setStringAsync(answer);
        Alert.alert(strings[language].flashcardViewPage.copiedTextToClipboard);
      } else if (answerType === 'mcq' && Array.isArray(answer)) {
          // Use the displayed MCQ order and labels
          if (mcqOptionsWithLettersRef.current && mcqOptionsWithLettersRef.current.length > 0) {
            const mcqText = mcqOptionsWithLettersRef.current.map(option => {
              return `${option.letter}) ${option.choice}`;
            }).join('\n');
            await Clipboard.setStringAsync(mcqText);
            Alert.alert(strings[language].flashcardViewPage.copiedMCQTextToClipboard);
          } else {
            // fallback to original order if ref is empty
            const mcqText = answer.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              return `${letter}) ${option.choice}`;
            }).join('\n');
            await Clipboard.setStringAsync(mcqText);
            Alert.alert(strings[language].flashcardViewPage.copiedMCQTextToClipboard);
          }
        } else if (answerType === 'image' && answer) {
          const success = await copyAssetToClipboard(answer);
          if (success) {
            Alert.alert(strings[language].flashcardViewPage.copiedImageToClipboard);
          } else {
            Alert.alert(strings[language].flashcardViewPage.failedToCopyImage);
          }
        }
      } else {
        // Front side copy logic
        const questionType = currentFlashcard?.flashcardQnType;
        const question = currentFlashcard?.flashcardQn;
        
        if (questionType === 'text' && typeof question === 'string') {
          await Clipboard.setStringAsync(question);
          Alert.alert(strings[language].flashcardViewPage.copiedTextToClipboard);
        } else if (questionType === 'image' && question) {
          const success = await copyAssetToClipboard(question);
          if (success) {
            Alert.alert(strings[language].flashcardViewPage.copiedImageToClipboard);
          } else {
            Alert.alert(strings[language].flashcardViewPage.failedToCopyImage);
          }
        }
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert(strings[language].flashcardViewPage.failedToCopy);
    }
  };

  // Handle audio button press in top bar
  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const handleAudioToggle = async () => {
    if (isSpeechPlaying && !isSpeechPaused) {
      await Speech.pause();
      setIsSpeechPaused(true);
      setIsSpeechPlaying(true);
    } else if (isSpeechPlaying && isSpeechPaused) {
      await Speech.resume();
      setIsSpeechPaused(false);
      setIsSpeechPlaying(true);
    }
  };

  const handleAudioPressTopBar = async () => {
    const currentFlashcard = flashcards[currentIdx];
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: true,
      });
      await Speech.stop();
      if (isFlipped) {
        const answerType = currentFlashcard?.flashcardAnswerType;
        const answer = currentFlashcard?.flashcardAnswer;
        if (answerType === 'text' && typeof answer === 'string') {
          await Speech.speak(answer, {
            language: 'en-US',
            pitch: 1.1,
            rate: 0.6,
            voice: 'com.apple.ttsbundle.Samantha-compact',
            onStart: () => {
              setIsSpeechPlaying(true);
              setIsSpeechPaused(false);
            },
            onDone: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
            onStopped: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
            onError: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
          });
        } else if (answerType === 'mcq' && Array.isArray(answer)) {
          let mcqText = '';
          if (mcqOptionsWithLettersRef.current && mcqOptionsWithLettersRef.current.length > 0) {
            mcqText = mcqOptionsWithLettersRef.current.map(option => {
              return `Option ${option.letter}: ${option.choice}`;
            }).join('. ');
          } else {
            mcqText = answer.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              return `Option ${letter}: ${option.choice}`;
            }).join('. ');
          }
          await Speech.speak(mcqText, {
            language: 'en-US',
            pitch: 1.1,
            rate: 0.6,
            voice: 'com.apple.ttsbundle.Samantha-compact',
            onStart: () => {
              setIsSpeechPlaying(true);
              setIsSpeechPaused(false);
            },
            onDone: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
            onStopped: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
            onError: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
          });
        }
      } else {
        const questionType = currentFlashcard?.flashcardQnType;
        const question = currentFlashcard?.flashcardQn;
        if (questionType === 'text' && typeof question === 'string') {
          await Speech.speak(question, {
            language: 'en-US',
            pitch: 1.1,
            rate: 0.6,
            voice: 'com.apple.ttsbundle.Samantha-compact',
            onStart: () => {
              setIsSpeechPlaying(true);
              setIsSpeechPaused(false);
            },
            onDone: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
            onStopped: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
            onError: () => {
              setIsSpeechPlaying(false);
              setIsSpeechPaused(false);
            },
          });
        }
      }
    } catch (error) {
      setIsSpeechPlaying(false);
      setIsSpeechPaused(false);
      console.error('Error in handleAudioPressTopBar:', error);
    }
  };

  // MCQ feedback modal state (lifted to page level for overlay)
  const [mcqModalVisible, setMcqModalVisible] = useState(false);
  const [mcqModalCorrect, setMcqModalCorrect] = useState(false);
  const mcqModalOpacity = useRef(new Animated.Value(0)).current;
  const mcqOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Function to determine if copy button should be enabled
  const isCopyButtonEnabled = (isFlipped: boolean) => {
    const currentFlashcard = flashcards[currentIdx];
    if (isFlipped) {
      // Back side
      const answerType = currentFlashcard?.flashcardAnswerType;
      if (answerType === 'image') {
        // Check if it's SVG content
        const answer = currentFlashcard?.flashcardAnswer as any;
        if (answer && answer.uri && answer.uri.startsWith('data:image/svg+xml')) {
          return false; // Disable copy for SVG images
        }
      }
      return answerType === 'text' || answerType === 'mcq' || answerType === 'image';
    } else {
      // Front side
      const questionType = currentFlashcard?.flashcardQnType;
      if (questionType === 'image') {
        // Check if it's SVG content
        const question = currentFlashcard?.flashcardQn as any;
        if (question && question.uri && question.uri.startsWith('data:image/svg+xml')) {
          return false; // Disable copy for SVG images
        }
      }
      return questionType === 'text' || questionType === 'image';
    }
  };

  // Function to determine if audio button should be enabled
  const isAudioButtonEnabled = (isFlipped: boolean) => {
    const currentFlashcard = flashcards[currentIdx];
    if (isFlipped) {
      // Back side
      const answerType = currentFlashcard?.flashcardAnswerType;
      return answerType === 'text' || answerType === 'mcq';
    } else {
      // Front side
      const questionType = currentFlashcard?.flashcardQnType;
      return questionType === 'text';
    }
  };

  const mcqOptionsWithLettersRef = useRef<{ choice: string; ans: boolean; letter: string }[]>([]);

  const stopSpeech = async () => {
    await Speech.stop();
    setIsSpeechPlaying(false);
    setIsSpeechPaused(false);
  };

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active|foreground/) && nextAppState === 'background') {
        await stopSpeech();
        clearBlobCache(); // Clear blob cache when app goes to background
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // 1. Add isSuccessMode state to FlashcardViewPage
  const [isSuccessMode, setIsSuccessMode] = useState(false);

  // At the top of FlashcardViewPage, after useRouter:
  const { deckId } = useLocalSearchParams();

  // Add this in FlashcardViewPage:
  const [successFadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isSuccessMode) {
      Animated.timing(successFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      successFadeAnim.setValue(0);
    }
  }, [isSuccessMode]);

  // At the top of FlashcardViewPage, add state for the end study modal
  const [showEndStudyModal, setShowEndStudyModal] = useState(false);
  const endStudyModalOpacity = useRef(new Animated.Value(0)).current;
  const endStudyOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Move isCompleted logic to the top of FlashcardViewPage
  const isAtLastCard = currentIdx === totalCards - 1;
  const currentFlashcard = flashcards[currentIdx];
  const flashcardAnswerType = currentFlashcard?.flashcardAnswerType;
  const isCompleted = (isQuizMode || isStudyMode) && isAtLastCard && (
    (['text', 'audio', 'image'].includes(flashcardAnswerType) && hasFlippedCard) ||
    (flashcardAnswerType === 'mcq' && hasSubmittedMCQ) ||
    (flashcardAnswerType === 'voice' && recordedAudioUri !== null)
  );

  // At the top of FlashcardViewPage, add state for the end quiz modal
  const [showEndQuizModal, setShowEndQuizModal] = useState(false);
  const endQuizModalOpacity = useRef(new Animated.Value(0)).current;
  const endQuizOverlayOpacity = useRef(new Animated.Value(0)).current;

  // --- Halfway checkpoint logic ---
  const [hasShownHalfway, setHasShownHalfway] = useState(false);
  const [pauseNextTimer, setPauseNextTimer] = useState(false);
  const [attemptedFlashcardIds, setAttemptedFlashcardIds] = useState<number[]>([]);
  const [halfwayCheckpointEnabled, setHalfwayCheckpointEnabled] = useState(true); // Default to true

  // Load halfway checkpoint setting from database
  const loadHalfwayCheckpointSetting = async () => {
    try {
      const userID = await getCurrentUserID();
      const result = await db.getFirstAsync(`
        SELECT halfwayCheckpoint FROM users WHERE userID = ?
      `, [userID]);
      
      if (result) {
        const userData = result as { halfwayCheckpoint: number };
        setHalfwayCheckpointEnabled(userData.halfwayCheckpoint === 1);
      } else {
        // Default to true if no user data found
        setHalfwayCheckpointEnabled(true);
      }
    } catch (error) {
      console.error('Error loading halfway checkpoint setting from database:', error);
      setHalfwayCheckpointEnabled(true); // Default to true if loading fails
    }
  };

  // Load setting when component mounts
  useEffect(() => {
    loadHalfwayCheckpointSetting();
  }, []);

  // Track attempted flashcard IDs when flashcards are completed
  const trackAttemptedFlashcard = (flashcardId: number) => {
    setAttemptedFlashcardIds(prev => {
      if (!prev.includes(flashcardId)) {
        return [...prev, flashcardId];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (!isQuizMode || showQuizCountdown || !halfwayCheckpointEnabled) return;
    const total = totalCards;
    if (total <= 1) return;
    const halfway = Math.floor(total / 2);
    if (
      currentIdx === halfway &&
      !hasShownHalfway
    ) {
      setHasShownHalfway(true);
      setPauseNextTimer(true); // PAUSE TIMER
      router.push({
        pathname: '/viewQuizStats',
        params: { 
          halfwayCheckpoint: 'true',
          deckID: deckID as string,
          isAIDeck: isAIDeckParam as string,
          attemptedFlashcardIds: JSON.stringify(attemptedFlashcardIds)
        },
      });
    }
  }, [isQuizMode, currentIdx, totalCards, hasShownHalfway, router, showQuizCountdown, attemptedFlashcardIds, halfwayCheckpointEnabled]);

  // Resume timer when returning from halfway checkpoint
  useFocusEffect(
    React.useCallback(() => {
      if (pauseNextTimer) {
        setPauseNextTimer(false);
      }
    }, [pauseNextTimer])
  );

  // Function to check if there are any difficult flashcards to retry
  const hasDifficultFlashcards = () => {
    return flashcards.some(flashcard => {
      // Check for difficult difficulty ratings
      if (flashcard.flashcardDifficulty === 'Again' || flashcard.flashcardDifficulty === 'Hard') {
        return true;
      }
      // Check for MCQ flashcards that were answered wrongly
      if (flashcard.flashcardAnswerType === 'mcq' && flashcard.isMcqAnswerRight === 0) {
        return true;
      }
      return false;
    });
  };

  const getContentTopHeight = useContentTopHeight();
  const getHeaderIconsTopHeight = useHeaderIconsTopHeight();
  const getTopBarAccountHeight = useTopBarAccountHeight();

  return (
    isSuccessMode ? (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: Colors[theme].background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          opacity: successFadeAnim,
        }}
      >
        {/* Home icon button at top left */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: getTopBarAccountHeight(),
            right: 16,
            zIndex: 10,
            padding: 8,
          }}
          onPress={() => router.replace('/')}
        >
          <MaterialIcons name="home" size={32} color={Colors[theme].text} />
        </TouchableOpacity>

        {isQuizMode ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
            <LottieView
              source={require('@/assets/animations/SuccessAnimation3_Confetti.json')}
              autoPlay
              loop
              style={{ width: 120, height: 120, marginRight: 10, transform: [{ scaleX: -1 }] }}
            />
            <View style={{ width: 20 }} />
            <LottieView
              source={require('@/assets/animations/SuccessAnimation3_Confetti.json')}
              autoPlay
              loop
              style={{ width: 120, height: 120, marginLeft: 10 }}
            />
          </View>
        ) : (
          <LottieView
            source={require('@/assets/animations/SuccessAnimation2_Circle.json')}
            autoPlay
            loop={true}
            style={{ width: 220, height: 220, marginBottom: 32 }}
          />
        )}
                    <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 40, color: Colors[theme].text, textAlign: 'center', marginBottom: 48 }}>
          {isQuizMode ? strings[language].flashcardViewPage.nicelyDone : strings[language].flashcardViewPage.niceStudying}
        </Text>
        {isQuizMode && (
          <>
          <TouchableOpacity
          style={{
            width: 318,
            height: 72,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
                backgroundColor: hasDifficultFlashcards() ? Colors[theme].brandColor2 : Colors[theme].unselectedText,
            marginBottom: 20,
          }}
              onPress={() => {
                if (hasDifficultFlashcards()) {
                  router.replace({
                    pathname: '/flashcardView',
                    params: { 
                      deckID: deckID as string,
                      flashcardIdx: '0',
                      totalNumberOfFlashcards: totalCards.toString(),
                      isStudyMode: 'true',
                      isQuizMode: 'false',
                      isAIDeck: isAIDeckParam as string,
                      retryDifficult: 'true'
                    },
                  });
                }
              }}
              disabled={!hasDifficultFlashcards()}
              activeOpacity={hasDifficultFlashcards() ? 0.8 : 1}
        >
          <Text style={{ 
            color: Colors[theme].background, 
            fontFamily: Fonts.bodyBold, 
            fontWeight: '400', 
            fontSize: 20 
          }}>
                {hasDifficultFlashcards() ? strings[language].flashcardViewPage.retryDifficultFlashcards : strings[language].flashcardViewPage.noDifficultFlashcardsToRetry}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: 318,
            height: 72,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors[theme].brandColor1,
            marginBottom: 20,
          }}
          onPress={() => router.push({
            pathname: '/viewQuizStats',
            params: { 
              halfwayCheckpoint: 'false',
              deckID: deckID as string,
              isAIDeck: isAIDeckParam as string,
              attemptedFlashcardIds: JSON.stringify(attemptedFlashcardIds)
            }},
          )}
        >
          <Text style={{ color: Colors[theme].background, fontFamily: Fonts.bodyBold, fontWeight: '400', fontSize: 20 }}>
            {strings[language].flashcardViewPage.viewQuizStats}
          </Text>
        </TouchableOpacity>
        </>
        )}
        <TouchableOpacity
          style={{
            width: 318,
            height: 72,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors[theme].brandColor1,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: Colors[theme].background, fontFamily: Fonts.bodyBold, fontWeight: '400', fontSize: 20 }}>
            {strings[language].flashcardViewPage.backToDeck}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    ) : showQuizCountdown ? (
      <View style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}>
          <View style={{
            flex: 1,
            backgroundColor: Colors[theme].background,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Back button at top left */}
            <TouchableOpacity
              style={[styles.backButton, { top: getHeaderIconsTopHeight()}]}
              onPress={() => router.back()}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
            {/* Quiz starting text */}
            <Text style={{
              fontFamily: Fonts.bodyMedium,
              fontSize: 28,
              color: Colors[theme].text,
              marginBottom: 24,
              textAlign: 'center',
            }}>
              {strings[language].flashcardViewPage.quizStartingIn}
            </Text>
            <LottieView
              source={require('@/assets/animations/CountdownAnimation.json')}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
          </View>
        </SafeAreaView>
      </View>
    ) : isLoadingFlashcards ? (
      <LoadingScreen progress={loadingProgress} current={loadingCurrent} total={loadingTotal} language={language} />
    ) : (
    <View style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}>
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity
          style={[styles.backButton, { top: getHeaderIconsTopHeight()}]}
            onPress={async () => {
              await stopSpeech();
              if (isStudyMode && !isCompleted) {
                // Show confirmation modal
                setShowEndStudyModal(true);
                Animated.parallel([
                  Animated.timing(endStudyOverlayOpacity, {
                    toValue: 0.5,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                  Animated.timing(endStudyModalOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                ]).start();
              } else if (isQuizMode && !isCompleted) {
                setShowEndQuizModal(true);
                Animated.parallel([
                  Animated.timing(endQuizOverlayOpacity, {
                    toValue: 0.5,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                  Animated.timing(endQuizModalOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                ]).start();
              } else {
                router.back();
              }
            }}
          >
            <AntDesign name="arrowleft" size={32} color="black" />
          </TouchableOpacity>
          <View style={[styles.headerIconsContainer, { top: getHeaderIconsTopHeight()}]}>
            <FlashcardViewTopBar 
              onTrashPress={handleTrashPress} 
              onCopyPress={handleCopyPress}
              onAudioPress={isSpeechPlaying ? handleAudioToggle : handleAudioPressTopBar}
              isCopyButtonEnabled={isCopyButtonEnabled(isFlipped)} 
              isAudioButtonEnabled={isAudioButtonEnabled(isFlipped)} 
              isSpeechPlaying={isSpeechPlaying}
              isSpeechPaused={isSpeechPaused}
            />
          </View>
          <View style={[styles.middleContentContainer, { top: getContentTopHeight()}]}>
            <FlippableFlashcard 
              currentIdx={currentIdx} 
              setCurrentIdx={setCurrentIdx} 
              totalCards={totalCards}
              setMcqModalVisible={setMcqModalVisible}
              setMcqModalCorrect={setMcqModalCorrect}
              mcqModalOpacity={mcqModalOpacity}
              mcqOverlayOpacity={mcqOverlayOpacity}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              mcqOptionsWithLettersRef={mcqOptionsWithLettersRef}
              stopSpeech={stopSpeech}
              setIsSpeechPlaying={setIsSpeechPlaying}
              setIsSpeechPaused={setIsSpeechPaused}
              isStudyMode={isStudyMode}
              hasFlippedCard={hasFlippedCard}
              setHasFlippedCard={setHasFlippedCard}
              hasSubmittedMCQ={hasSubmittedMCQ}
              setHasSubmittedMCQ={setHasSubmittedMCQ}
              showStudyValidationModal={showStudyValidationModal}
              setIsSuccessMode={setIsSuccessMode}
              isSuccessMode={isSuccessMode}
              isQuizMode={isQuizMode}
              pauseNextTimer={pauseNextTimer}
              setPauseNextTimer={setPauseNextTimer}
              favorited={flashcards[currentIdx]?.isFavorited || false}
              onToggleFavorite={handleToggleFavorite}
              showQuizCountdown={showQuizCountdown}
              flashcards={flashcards}
              recordedAudioUri={recordedAudioUri}
              setRecordedAudioUri={setRecordedAudioUri}
              updateFlashcardDate={updateFlashcardDate}
              updateDeckCompletionDate={updateDeckCompletionDate}
              startFlashcardTimer={startFlashcardTimer}
              retryDifficultParam={retryDifficultParam as string}
              language={language}
            />
          </View>
          <View style={styles.difficultyPillRowContainer}>
            <DifficultyPillRow currentIdx={currentIdx} onDifficultyChange={handleDifficultyChange} flashcards={flashcards} language={language} />
          </View>
          <View style={styles.loadingBarBottomContainer}>
            <LoadingBar currentIdx={currentIdx} totalCards={totalCards} isStudyMode={isStudyMode} isQuizMode={isQuizMode} hasFlippedCard={hasFlippedCard} hasSubmittedMCQ={hasSubmittedMCQ} flashcardAnswerType={flashcards[currentIdx]?.flashcardAnswerType || ''} recordedAudioUri={recordedAudioUri} language={language} />
          </View>
        </View>
      </SafeAreaView>

      {/* Delete confirmation modal and overlay - outside SafeAreaView to cover full screen */}
      <GreyOverlayBackground 
        visible={isDeleteModalOpen}
        opacity={overlayOpacity}
        onPress={handleDismissDeleteModal}
      />
      <GenericModal
        visible={isDeleteModalOpen}
        opacity={deleteModalOpacity}
        Icon={DeleteModalIcon}
        text={strings[language].flashcardViewPage.deleteFlashcardConfirmation}
        buttons="double"
        onConfirm={handleConfirmDelete}
        onCancel={handleDismissDeleteModal}
      />

      {/* MCQ Feedback Modal and Overlay - root level, above all other UI */}
      <GreyOverlayBackground 
        visible={mcqModalVisible}
        opacity={mcqOverlayOpacity}
      />
      <MCQFeedbackModal
        visible={mcqModalVisible}
        opacity={mcqModalOpacity}
        isCorrect={mcqModalCorrect}
        onDismiss={() => {
          Animated.parallel([
            Animated.timing(mcqOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(mcqModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setMcqModalVisible(false);
          });
        }}
        lottieMarginTop={80}
        isStudyMode={isStudyMode}
        isQuizMode={isQuizMode}
        language={language}
      />

      {/* Study Validation Modal and Overlay - root level, above all other UI */}
      <GreyOverlayBackground 
        visible={studyValidationModalVisible}
        opacity={studyValidationOverlayOpacity}
        onPress={handleDismissStudyValidationModal}
      />
      <GenericModal
        visible={studyValidationModalVisible}
        opacity={studyValidationModalOpacity}
        Icon={DeleteModalIcon}
        text={studyValidationMessage}
      />

      {/* End study confirmation modal and overlay */}
      <GreyOverlayBackground
        visible={showEndStudyModal}
        opacity={endStudyOverlayOpacity}
        onPress={() => {
          Animated.parallel([
            Animated.timing(endStudyOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(endStudyModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => setShowEndStudyModal(false));
        }}
      />
      <GenericModal
        visible={showEndStudyModal}
        opacity={endStudyModalOpacity}
        Icon={DeleteModalIcon}
        text={strings[language].flashcardViewPage.endStudySessionMidway}
        buttons="double"
        onConfirm={() => {
          Animated.parallel([
            Animated.timing(endStudyOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(endStudyModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowEndStudyModal(false);
            router.back();
          });
        }}
        onCancel={() => {
          Animated.parallel([
            Animated.timing(endStudyOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(endStudyModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => setShowEndStudyModal(false));
        }}
      />

      {/* Quiz end confirmation modal and overlay */}
      <GreyOverlayBackground
        visible={showEndQuizModal}
        opacity={endQuizOverlayOpacity}
        onPress={() => {
          Animated.parallel([
            Animated.timing(endQuizOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(endQuizModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => setShowEndQuizModal(false));
        }}
      />
      <GenericModal
        visible={showEndQuizModal}
        opacity={endQuizModalOpacity}
        Icon={DeleteModalIcon}
        text={strings[language].flashcardViewPage.endQuizSessionMidway}
        buttons="double"
        onConfirm={() => {
          Animated.parallel([
            Animated.timing(endQuizOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(endQuizModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowEndQuizModal(false);
            router.back();
          });
        }}
        onCancel={() => {
          Animated.parallel([
            Animated.timing(endQuizOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(endQuizModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => setShowEndQuizModal(false));
        }}
      />
    </View>
  )
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    paddingTop: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  middleContentContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 104, // height of difficultyPillRowContainer + loading bar
    zIndex: 0,
  },
  loadingBarBottomContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBarContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBarBg: {
    width: '100%',
    height: 21,
    borderRadius: 21,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  loadingBarFg: {
    height: 21,
    borderRadius: 21,
  },
  loadingBarTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingBarCompleteText: {
    fontSize: 14,
    textAlign: 'center',
  },
  difficultyPillRowContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  difficultyPillButton: {
    flex: 1,
    height: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  difficultyPillButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  flippableCard: {
    flex: 1,
    borderRadius: 30,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    // borderWidth: 2,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // borderColor: 'blue',
    zIndex: 10,
  },
  middleContainer: {
    position: 'absolute',
    top: 60,
    bottom: 60,
    left: 0,
    right: 0,
    // borderWidth: 2,
    // borderColor: 'red',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    width: '85%',
    borderBottomLeftRadius: 30,
    zIndex: 10,
    justifyContent: 'center',
  },
  flipArrowContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
  topContainerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  flashcardIndexText: {
    fontSize: 24,
  },
  flipArrowPressable: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 60,
    height: 60,
    zIndex: 20,
  },
  questionScrollView: {
    flex: 1,
  },
  questionScrollViewContent: {
    flexGrow: 1,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  mcqChoicesContainer: {
    flexGrow: 1,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  questionText: {
    fontSize: 32,
    textAlign: 'center',
  },
  blankUnderlineView: {
    borderBottomWidth: 2,
    width: 100,
    marginHorizontal: 2,
    alignSelf: 'center',
    marginBottom: 2,
  },
  leftChevronButton: {
    position: 'absolute',
    top: '50%',
    left: -20,
    zIndex: 500,
  },
  rightChevronButton: {
    position: 'absolute',
    top: '50%',
    right: -20,
    zIndex: 500,
  },
  middleImage: {
    width: '90%',
    height: '90%',
    alignSelf: 'center',
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioLabel: {
    fontSize: 36,
    marginBottom: 16,
  },
  replayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
  },
  mcqContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  mcqOptionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  mcqOptionText: {
    fontSize: 28,
    textAlign: 'left',
    lineHeight: 28,
  },
  mcqOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  mcqOptionLabelText: {
    fontSize: 14,
    textAlign: 'left',
  },
  submitButton: {
    height: 30,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  submitButtonText: {
    fontSize: 14,
  },
  mcqBottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  mcqModalOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 305,
    height: 300,
    marginLeft: -152.5, // Half of width
    marginTop: -150, // Half of height
    borderRadius: 30,
    borderWidth: 10,
    zIndex: 1001,
    overflow: 'hidden',
  },
  mcqModalIconAbsolute: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 2,
  },
  mcqModalTextCenterWrap: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  mcqModalText: {
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  mcqModalButtonAbsolute: {
    position: 'absolute',
    bottom: 18,
    left: '50%',
    width: 100,
    height: 30,
    marginLeft: -50, // Half of width to center
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderRadius: 16,
  },
  mcqModalButtonText: {
    fontSize: 16,
  },
  mcqModalLottie: {
    position: 'absolute',
    width: 225,
    height: 225,
    left: 30,
    top: 45,
    zIndex: 1,
    pointerEvents: 'none',
  },
  voiceAnswerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  voiceAnswerText: {
    fontSize: 28,
    marginBottom: 10,
    textAlign: 'center',
  },
  voiceAnswerAnimation: {
    width: 50,
    height: 50,
  },
  micButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    // borderWidth: 2,
    // borderColor: 'red',
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recordingButton: {
  },
  soundWaveAnimation: {
    width: 250,
    height: 250,
    alignSelf: 'center',
  },
  aiChatButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});  