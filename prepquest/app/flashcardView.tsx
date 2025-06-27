import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, SafeAreaView, Dimensions, Text, TouchableWithoutFeedback, Animated, Pressable, ScrollView, Image, Alert, AppState, AppStateStatus, ImageSourcePropType } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { FlashcardViewTopBar } from '@/components/FlashcardViewTopBar';
import FlippableCardFrontFlipArrow from '@/assets/icons/flippableCardFrontFlipArrow.svg';
import FlippableCardBackFlipArrow from '@/assets/icons/flippableCardBackFlipArrow.svg';
import { FavoriteButton } from '@/components/FavoriteButton';
import { GenericModal } from '@/components/GenericModal';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import DeleteModalIcon from '@/assets/icons/deleteModalIcon.svg';
import { Audio } from 'expo-av';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { SmallCircleSelectButton } from '@/components/SmallCircleSelectButton';
import GreenTickIcon from '@/assets/icons/GreenTickIcon.svg';
import LottieView from 'lottie-react-native';
import MicIcon from '@/assets/icons/micIcon.svg';
import AIChatIcon from '@/assets/icons/AIChatIcon.svg';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Speech from 'expo-speech';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Easing } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Helper function to copy asset images to clipboard
const copyAssetToClipboard = async (imageSource: any) => {
  try {
    let localUri: string;
    
    // Check if it's a require() statement (returns a number)
    if (typeof imageSource === 'number') {
      // For require() statements, we need to get the asset module
      const assetModule = Asset.fromModule(imageSource);
      await assetModule.downloadAsync();
      localUri = assetModule.localUri || assetModule.uri;
    } else if (typeof imageSource === 'string') {
      // For string URIs, use Asset.fromURI
      const asset = Asset.fromURI(imageSource);
      await asset.downloadAsync();
      localUri = asset.localUri || asset.uri;
    } else {
      throw new Error('Unsupported image source type');
    }
    
    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Copy base64 image to clipboard
    await Clipboard.setImageAsync(base64Image);
    console.log('Asset image copied to clipboard!');
    return true;
  } catch (error) {
    console.error('Failed to copy asset:', error);
    return false;
  }
};

const DIFFICULTY_TYPES = [
  { type: 'Again', color: '#F8696B' },
  { type: 'Hard', color: '#FA9473' },
  { type: 'Good', color: '#FFEB84' },
  { type: 'Easy', color: '#98CE7F' },
];

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
//     {   "choice": "This is the first choice",
//         "ans": false
//     }, 
//     {   "choice": "This is the second choice",
//         "ans": false
//     }, 
//     {   "choice": "This is the third choice",
//         "ans": false
//     }, 
//     {   "choice": "This is the fourth choice",
//         "ans": true
//     },
//     {   "choice": "This is the fifh choice",
//         "ans": false
//     }] 
//     },
//     // text Qn -> voice recorded
//   { flashcardDifficulty: 'Good', flashcardQnType: 'text', flashcardQn: 'What is a component?', flashcardAnswerType: 'voice', flashcardAnswer: null },
  // text Qn -> audio Ans
  { flashcardDifficulty: 'Again', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'audio', flashcardAnswer: require('@/assets/dummyAudio/dummy_m4a_audio.m4a'), timeLimit: 10, cognitiveQnType: 'Problem-Solving'},
  // text Qn -> image Ans
  { flashcardDifficulty: 'Hard', flashcardQnType: 'text', flashcardQn: 'Explain useEffect.', flashcardAnswerType: 'image', flashcardAnswer: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg'), timeLimit: 30, cognitiveQnType: 'Comprehension'},
];

// Updated DifficultyPillRow to accept currentIdx and totalCards as props
const DifficultyPillRow = ({ currentIdx, onDifficultyChange }: { currentIdx: number, onDifficultyChange: (difficulty: string) => void }) => {
  // Get the current flashcard's difficulty
  const currentFlashcard = dummyFlashcards[currentIdx];
  const currentDifficulty = currentFlashcard?.flashcardDifficulty;

  return (
    <View style={styles.difficultyPillRow}>
      {DIFFICULTY_TYPES.map(({ type, color }) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.difficultyPillButton,
            { backgroundColor: color },
            currentDifficulty === type && { borderColor: '#4F41D8', borderWidth: 3 },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            onDifficultyChange(type);
          }}
        >
          <Text style={styles.difficultyPillButtonText}>{type}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Updated LoadingBar to accept currentIdx and totalCards as props with smooth animations
const LoadingBar = ({ currentIdx, totalCards, isStudyMode, hasFlippedCard, hasSubmittedMCQ, flashcardAnswerType, isQuizMode }: { 
  currentIdx: number, 
  totalCards: number, 
  isStudyMode: boolean,
  hasFlippedCard: boolean,
  hasSubmittedMCQ: boolean,
  flashcardAnswerType: string,
  isQuizMode: boolean
}) => {
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
    (flashcardAnswerType === 'MCQ' && hasSubmittedMCQ)
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
        isCompleted && { backgroundColor: '#44B88A' }
      ]}>
        <Animated.View 
          style={[
            styles.loadingBarFg, 
            { 
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: isCompleted ? '#44B88A' : '#4F41D8'
            }
          ]} 
        />
        {isCompleted && (
          <View style={styles.loadingBarTextContainer}>
            <Text style={styles.loadingBarCompleteText}>Completed!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Helper to render text with <blank> replaced by underline
function renderQuestionWithBlanks(text: string) {
  const parts = text.split(/<blank>/g);
  const elements: React.ReactNode[] = [];
  parts.forEach((part, idx) => {
    elements.push(
      <Text key={`text-${idx}`} style={styles.questionText}>
        {part}
      </Text>
    );
    if (idx < parts.length - 1) {
      elements.push(
        <View
          key={`blank-${idx}`}
          style={styles.blankUnderlineView}
        />
      );
    }
  });
  return (
    <Text style={styles.questionText}>
      {elements}
    </Text>
  );
}

// Helper to render MCQ answers with randomly assigned option letters
function renderMCQAnswers(mcqData: Array<{ choice: string; ans: boolean }>) {
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
          <Text style={styles.mcqOptionText}>
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

// FlippableFlashcard now receives currentIdx, setCurrentIdx, and totalCards as props
const FlippableFlashcard = (
  { currentIdx, 
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
    isQuizMode
  }: { 
      currentIdx: number, 
      setCurrentIdx: React.Dispatch<React.SetStateAction<number>>, 
      totalCards: number, 
      setMcqModalVisible: React.Dispatch<React.SetStateAction<boolean>>, 
      setMcqModalCorrect: React.Dispatch<React.SetStateAction<boolean>>, 
      mcqModalOpacity: Animated.Value, 
      mcqOverlayOpacity: Animated.Value, 
      isFlipped: boolean, 
      setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>, 
      mcqOptionsWithLettersRef: React.MutableRefObject<Array<{ choice: string; ans: boolean; letter: string }>>, 
      stopSpeech: () => Promise<void>, 
      setIsSpeechPlaying: React.Dispatch<React.SetStateAction<boolean>>, 
      setIsSpeechPaused: React.Dispatch<React.SetStateAction<boolean>>, 
      isStudyMode: boolean, 
      hasFlippedCard: boolean, 
      setHasFlippedCard: React.Dispatch<React.SetStateAction<boolean>>, 
      hasSubmittedMCQ: boolean, 
      setHasSubmittedMCQ: React.Dispatch<React.SetStateAction<boolean>>, 
      showStudyValidationModal: (message: string) => void, 
      setIsSuccessMode: React.Dispatch<React.SetStateAction<boolean>>, 
      isSuccessMode: boolean,
      isQuizMode: boolean
    }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const frontOpacity = useRef(new Animated.Value(1)).current;
  const backOpacity = useRef(new Animated.Value(0)).current;
  const displayNumber = currentIdx + 1;

  // MCQ selection state
  const [selectedMCQOption, setSelectedMCQOption] = useState<string | null>(null);

  // Animation for horizontal slide
  const cardSlideAnim = useRef(new Animated.Value(0)).current; // 0 = center, -1 = left, 1 = right

  // Get current flashcard data
  const currentFlashcard = dummyFlashcards[currentIdx];
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
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Generate MCQ options with letters ONCE per card
  const previousCardIndexRef = useRef<number>(currentIdx);
  
  React.useEffect(() => {
    if (flashcardAnswerType === 'MCQ' && Array.isArray(flashcardAnswer)) {
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
    setSelectedMCQOption(selectedMCQOption === letter ? null : letter);
  };

  // Handle MCQ submit
  const handleMCQSubmit = () => {
    if (selectedMCQOption) {
      const selectedOption = mcqOptionsWithLettersRef.current.find(option => option.letter === selectedMCQOption);
      if (selectedOption) {
        const isCorrect = selectedOption.ans;
        setMcqModalCorrect(isCorrect);
        setMcqModalVisible(true);
        // Mark that MCQ has been submitted
        setHasSubmittedMCQ(true);
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
      const currentFlashcard = dummyFlashcards[currentIdx];
      const answerType = currentFlashcard?.flashcardAnswerType;
      const currentDifficulty = currentFlashcard?.flashcardDifficulty;
      if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        return !(hasFlippedCard && hasDifficultySelected);
      }
      if (answerType === 'MCQ') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        return !(hasFlippedCard && hasSubmittedMCQ && hasDifficultySelected);
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
        setCurrentIdx(idx => {
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

  const navigateToNextCard = () => {
    // If in study mode and at last card, and validation is passed, go to success mode
    if ((isQuizMode || isStudyMode) && currentIdx === totalCards - 1) {
      // Repeat the validation logic for the last card
      const currentFlashcard = dummyFlashcards[currentIdx];
      const answerType = currentFlashcard?.flashcardAnswerType;
      const currentDifficulty = currentFlashcard?.flashcardDifficulty;
      if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        if (!hasFlippedCard) {
          if (!hasDifficultySelected) {
            showStudyValidationModal("Cannot move on until you have viewed answer and selected a difficulty!");
            return;
          } else {
            showStudyValidationModal("Please flip the card to view the answer before moving on to the next flashcard!");
            return;
          }
        } else {
          if (!hasDifficultySelected) {
            showStudyValidationModal("Give this flashcard a difficulty rating before moving onto the next flashcard!");
            return;
          }
        }
      }
      if (answerType === 'MCQ') {
        const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
        if (!hasFlippedCard) {
          if (!hasDifficultySelected) {
            showStudyValidationModal("Cannot move on until you have viewed the back, answered the MCQ, and selected a difficulty!");
            return;
          } else {
            showStudyValidationModal("Please flip the card to view and answer the MCQ before moving onto the next flashcard!");
            return;
          }
        } else {
          if (!hasDifficultySelected) {
            if (!hasSubmittedMCQ) {
              showStudyValidationModal("Cannot move on until you have answered the MCQ and selected a difficulty!");
              return;
            } else {
              showStudyValidationModal("Give this flashcard a difficulty rating before moving onto the next flashcard!");
              return;
            }
          } else {
            if (!hasSubmittedMCQ) {
              showStudyValidationModal("Cannot move on until you have answered the MCQ!");
              return;
            }
          }
        }
      }
      // If all validation is passed, set success mode and return
      setIsSuccessMode(true);
      return;
    }

    if (!isRightChevronDisabled()) {
      // Study mode validation (for non-last cards)
      if (isQuizMode || isStudyMode) {
        const currentFlashcard = dummyFlashcards[currentIdx];
        const answerType = currentFlashcard?.flashcardAnswerType;
        const currentDifficulty = currentFlashcard?.flashcardDifficulty;
        if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
          const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
          if (!hasFlippedCard) {
            if (!hasDifficultySelected) {
              showStudyValidationModal("Cannot move on until you have viewed answer and selected a difficulty!");
              return;
            } else {
              showStudyValidationModal("Please flip the card to view the answer before moving on to the next flashcard!");
              return;
            }
          } else {
            if (!hasDifficultySelected) {
              showStudyValidationModal("Give this flashcard a difficulty rating before moving onto the next flashcard!");
              return;
            }
          }
        }
        if (answerType === 'MCQ') {
          const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
          if (!hasFlippedCard) {
            if (!hasDifficultySelected) {
              showStudyValidationModal("Cannot move on until you have viewed the back, answered the MCQ, and selected a difficulty!");
              return;
            } else {
              showStudyValidationModal("Please flip the card to view and answer the MCQ before moving onto the next flashcard!");
              return;
            }
          } else {
            if (!hasDifficultySelected) {
              if (!hasSubmittedMCQ) {
                showStudyValidationModal("Cannot move on until you have answered the MCQ and selected a difficulty!");
                return;
              } else {
                showStudyValidationModal("Give this flashcard a difficulty rating before moving onto the next flashcard!");
                return;
              }
            } else {
              if (!hasSubmittedMCQ) {
                showStudyValidationModal("Cannot move on until you have answered the MCQ!");
                return;
              }
            }
          }
        }
      }
      stopSpeech();
      // Slide out to left
      Animated.timing(cardSlideAnim, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIdx(idx => {
          // Always reset to front side
          setIsFlipped(false);
          setHasFlippedCard(false); // Reset flipped state for new card
          setHasSubmittedMCQ(false); // Reset MCQ submission state for new card
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
      console.error('Failed to start recording', err);
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
    if (isQuizMode) {
      borderAnim.setValue(0);
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: ((currentFlashcard?.timeLimit)  || 30) * 1000,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start();
    }
    // eslint-disable-next-line
  }, [currentIdx, isQuizMode]);

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
    if (!isQuizMode || cardSize.width === 0 || cardSize.height === 0) return;
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
  }, [isQuizMode, cardSize.width, cardSize.height, borderAnim]);

  // Track card's absolute position for correct circle placement
  const [cardLayout, setCardLayout] = React.useState({ left: 0, top: 0 });

  // At the top of FlippableFlashcard, after other hooks:
  const [countdown, setCountdown] = React.useState(0);
  const countdownIntervalRef = useRef<any>(null);

  // Start/reset countdown in quiz mode when card changes
  useEffect(() => {
    if (isQuizMode && currentFlashcard?.timeLimit) {
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
    // eslint-disable-next-line
  }, [isQuizMode, currentIdx]);

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
    if (countdown === 0 && isQuizMode) {
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
  }, [countdown, isQuizMode]);

  // Define the border/circle color based on countdown
  const borderColor = countdown === 0 ? '#F8696B' : '#44B88A';

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Left Chevron Button - hidden in study mode */}
      {!isStudyMode && !isQuizMode && (
        <TouchableOpacity
          style={styles.leftChevronButton}
          onPress={navigateToPreviousCard}
          disabled={isLeftChevronDisabled()}
        >
          <AntDesign
            name="left"
            size={30}
            color={isLeftChevronDisabled() ? "#D5D4DD" : "#000000"}
          />
        </TouchableOpacity>
      )}
      {/* Right Chevron Button */}
      <TouchableOpacity
        style={styles.rightChevronButton}
        onPress={navigateToNextCard}
        disabled={isRightChevronDisabled()}
      >
        <AntDesign
          name="right"
          size={30}
          color={isRightChevronDisabled() ? "#D5D4DD" : "#000000"}
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
                backgroundColor: '#F8F8F8',
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
            {isQuizMode && cardSize.width > 0 && cardSize.height > 0 && (() => {
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
                <Text style={styles.flashcardIndexText}>
                  {`Qn ${displayNumber} of ${totalCards}`}
                </Text>
                <FavoriteButton size={30} />
              </View>
              {isQuizMode && (
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {countdown === 0 ? (
                    <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 24, color: '#F8696B', textAlign: 'center' }}>Time's Up!</Text>
                  ) : (
                    <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 24, color: '#44B88A', textAlign: 'center' }}>{countdown}s</Text>
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
                  {renderQuestionWithBlanks(flashcardQn)}
                </ScrollView>
              )}
              {flashcardQnType === 'image' && !!flashcardQn && (
                <Image
                  source={flashcardQn as ImageSourcePropType}
                  style={styles.middleImage}
                  resizeMode="contain"
                />
              )}
              {flashcardQnType === 'audio' && !!flashcardQn && (
                <View style={styles.audioContainer}>
                  <Text style={styles.audioLabel}>Question:</Text>
                  <Pressable
                    style={({ pressed }) => [styles.replayButton, pressed && styles.buttonPressed]}
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
              {currentFlashcard?.cognitiveQnType && (
                <View style={{
                  width: '50%',
                  height: '60%',
                  borderRadius: 30,
                  backgroundColor: '#fff',
                  borderColor: '#4F41D8',
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                  left: 10, 
                }}>
                  <Text style={{ fontSize: 14, color: '#222', textAlign: 'center', fontFamily: 'Satoshi-Medium' }}>
                    {currentFlashcard.cognitiveQnType} Qn
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
                backgroundColor: '#F8F8F8',
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
            {isQuizMode && cardSize.width > 0 && cardSize.height > 0 && (() => {
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
                <Text style={styles.flashcardIndexText}>
                  {`Ans ${displayNumber} of ${totalCards}`}
                </Text>
                <FavoriteButton size={30} />
              </View>
              {isQuizMode && (
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {countdown === 0 ? (
                    <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 24, color: '#F8696B', textAlign: 'center' }}>Time's Up!</Text>
                  ) : (
                    <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 24, color: '#44B88A', textAlign: 'center' }}>{countdown}s</Text>
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
                      {renderQuestionWithBlanks(flashcardAnswer)}
                  </ScrollView>
                  )}
              {flashcardAnswerType === 'MCQ' && Array.isArray(flashcardAnswer) && (
                <ScrollView 
                  style={styles.questionScrollView}
                  contentContainerStyle={styles.mcqChoicesContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {mcqOptionsWithLettersRef.current.map((option, idx) => (
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
                      <Text style={styles.voiceAnswerText}>
                        {recordedAudioUri ? "Great answer! Replay your audio or get feedback by AI!" : "Record your answer and get feedback by AI!"}
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
                      pressed && styles.buttonPressed,
                      isRecording && styles.recordingButton
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
                          fill={recordedAudioUri ? "black" : "#D5D4DD"}
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
                      pressed && styles.buttonPressed
                    ]}
                    onPress={() => {
                      // TODO: Implement AI chat functionality
                      console.log('AI Chat button pressed');
                    }}
                    disabled={!recordedAudioUri}
                  >
                    <AIChatIcon width={36} height={36} />
                  </Pressable>
                </View>
              )}
              {flashcardAnswerType === 'image' && !!flashcardAnswer && (
                <Image
                  source={flashcardAnswer}
                  style={styles.middleImage}
                  resizeMode="contain"
                />
              )}
              {flashcardAnswerType === 'audio' && !!flashcardAnswer && (
                <View style={styles.audioContainer}>
                  <Text style={styles.audioLabel}>Answer:</Text>
                  <Pressable
                    style={({ pressed }) => [styles.replayButton, pressed && styles.buttonPressed]}
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
              {flashcardAnswerType === 'MCQ' && mcqOptionsWithLettersRef.current.length > 0 && (
                <View style={styles.mcqBottomContainer}>
                  {mcqOptionsWithLettersRef.current.map((option) => (
                    <MCQOption
                      key={option.letter}
                      text={option.letter}
                      selected={selectedMCQOption === option.letter}
                      onPress={() => handleMCQOptionSelect(option.letter)}
                    />
                  ))}
                  <SubmitButton
                    enabled={selectedMCQOption !== null}
                    onPress={handleMCQSubmit}
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
const MCQOption = ({ text, selected, onPress }: { text: string; selected: boolean; onPress: () => void }) => {
  return (
    <View style={styles.mcqOptionContainer}>
      <SmallCircleSelectButton selected={selected} onPress={onPress} />
      <Text style={styles.mcqOptionLabelText}>{text}</Text>
    </View>
  );
};

// Local Submit Button component
const SubmitButton = ({ enabled, onPress }: { enabled: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={[
        styles.submitButton,
        { backgroundColor: enabled ? '#4F41D8' : '#D5D4DD' }
      ]}
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.8}
    >
      <Text style={styles.submitButtonText}>Submit</Text>
    </TouchableOpacity>
  );
};

// Local MCQ Feedback Modal component
const MCQFeedbackModal = ({ visible, opacity, isCorrect, onDismiss, lottieMarginTop = 80, isStudyMode, isQuizMode }: {
  visible: boolean;
  opacity: Animated.Value;
  isCorrect: boolean;
  onDismiss: () => void;
  lottieMarginTop?: number;
  isStudyMode: boolean;
  isQuizMode: boolean;
}) => {
  if (!visible) return null;
  return (
    <Animated.View style={[styles.mcqModalOverlay, { opacity, zIndex: 9999 }]}> 
      {/* Icon at top left */}
      <View style={styles.mcqModalIconAbsolute}>
        {isCorrect ? <GreenTickIcon width={24} height={24} /> : <DeleteModalIcon width={24} height={24} />}
      </View>
      {/* Centered text */}
      <View style={styles.mcqModalTextCenterWrap}>
        <Text style={[styles.mcqModalText]}>
          {isCorrect ? "That's correct! Good job!" : "Oops that's incorrect! Try again next time!"}
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
      <TouchableOpacity style={styles.mcqModalButtonAbsolute} onPress={onDismiss} activeOpacity={0.8}>
        <Text style={styles.mcqModalButtonText}>OK</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FlashcardViewPage() {
  const router = useRouter();
  const { flashcardIdx, totalNumberOfFlashcards, isStudyMode: isStudyModeParam, isQuizMode: isQuizModeParam } = useLocalSearchParams();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Lift currentIdx state up here
  const [currentIdx, setCurrentIdx] = useState(parseInt(flashcardIdx as string) || 0);
  const totalCards = parseInt(totalNumberOfFlashcards as string) || dummyFlashcards.length;
  
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

  // Set study mode from URL parameter
  useEffect(() => {
    setIsStudyMode(isStudyModeParam === 'true');
    setIsQuizMode(isQuizModeParam === 'true');
  }, [isStudyModeParam, isQuizModeParam]);

  // Function to update the difficulty of the current flashcard
  const handleDifficultyChange = (difficulty: string) => {
    if (dummyFlashcards[currentIdx]) {
      dummyFlashcards[currentIdx].flashcardDifficulty = difficulty;
      // Force a re-render by incrementing the trigger
      setDifficultyUpdateTrigger(prev => prev + 1);
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

  const handleConfirmDelete = () => {
    handleDismissDeleteModal();
    // TODO: Implement actual delete functionality
    console.log('Delete flashcard confirmed');
  };

  // Handle copy functionality
  const handleCopyPress = async () => {
    const currentFlashcard = dummyFlashcards[currentIdx];
    
    try {
      if (isFlipped) {
        // Back side copy logic
        const answerType = currentFlashcard?.flashcardAnswerType;
        const answer = currentFlashcard?.flashcardAnswer;
        
        if (answerType === 'text' && typeof answer === 'string') {
          await Clipboard.setStringAsync(answer);
          Alert.alert('Copied text to clipboard!');
        } else if (answerType === 'MCQ' && Array.isArray(answer)) {
          // Use the displayed MCQ order and labels
          if (mcqOptionsWithLettersRef.current && mcqOptionsWithLettersRef.current.length > 0) {
            const mcqText = mcqOptionsWithLettersRef.current.map(option => {
              return `${option.letter}) ${option.choice}`;
            }).join('\n');
            await Clipboard.setStringAsync(mcqText);
            Alert.alert('Copied MCQ text to clipboard!');
          } else {
            // fallback to original order if ref is empty
            const mcqText = answer.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              return `${letter}) ${option.choice}`;
            }).join('\n');
            await Clipboard.setStringAsync(mcqText);
            Alert.alert('Copied MCQ text to clipboard!');
          }
        } else if (answerType === 'image' && answer) {
          const success = await copyAssetToClipboard(answer);
          if (success) {
            Alert.alert('Copied image to clipboard!');
          } else {
            Alert.alert('Error', 'Failed to copy image to clipboard');
          }
        }
      } else {
        // Front side copy logic
        const questionType = currentFlashcard?.flashcardQnType;
        const question = currentFlashcard?.flashcardQn;
        
        if (questionType === 'text' && typeof question === 'string') {
          await Clipboard.setStringAsync(question);
          Alert.alert('Copied text to clipboard!');
        } else if (questionType === 'image' && question) {
          const success = await copyAssetToClipboard(question);
          if (success) {
            Alert.alert('Copied image to clipboard!');
          } else {
            Alert.alert('Error', 'Failed to copy image to clipboard');
          }
        }
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
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
    const currentFlashcard = dummyFlashcards[currentIdx];
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
        } else if (answerType === 'MCQ' && Array.isArray(answer)) {
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
    const currentFlashcard = dummyFlashcards[currentIdx];
    if (isFlipped) {
      // Back side
      const answerType = currentFlashcard?.flashcardAnswerType;
      return answerType === 'text' || answerType === 'MCQ' || answerType === 'image';
    } else {
      // Front side
      const questionType = currentFlashcard?.flashcardQnType;
      return questionType === 'text' || questionType === 'image';
    }
  };

  // Function to determine if audio button should be enabled
  const isAudioButtonEnabled = (isFlipped: boolean) => {
    const currentFlashcard = dummyFlashcards[currentIdx];
    if (isFlipped) {
      // Back side
      const answerType = currentFlashcard?.flashcardAnswerType;
      return answerType === 'text' || answerType === 'MCQ';
    } else {
      // Front side
      const questionType = currentFlashcard?.flashcardQnType;
      return questionType === 'text';
    }
  };

  const mcqOptionsWithLettersRef = useRef<Array<{ choice: string; ans: boolean; letter: string }>>([]);

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
  const currentFlashcard = dummyFlashcards[currentIdx];
  const flashcardAnswerType = currentFlashcard?.flashcardAnswerType;
  const isCompleted = (isQuizMode || isStudyMode) && isAtLastCard && (
    (['text', 'audio', 'image'].includes(flashcardAnswerType) && hasFlippedCard) ||
    (flashcardAnswerType === 'MCQ' && hasSubmittedMCQ)
  );

  // At the top of FlashcardViewPage, add state for the end quiz modal
  const [showEndQuizModal, setShowEndQuizModal] = useState(false);
  const endQuizModalOpacity = useRef(new Animated.Value(0)).current;
  const endQuizOverlayOpacity = useRef(new Animated.Value(0)).current;

  // 4. In FlashcardViewPage render, show Success UI if isSuccessMode is true
  if (isSuccessMode) {
    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          opacity: successFadeAnim,
        }}
      >
        <LottieView
          source={require('@/assets/animations/SuccessAnimation2_Circle.json')}
          autoPlay
          loop={true}
          style={{ width: 220, height: 220, marginBottom: 32 }}
        />
        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 40, color: '#222', textAlign: 'center', marginBottom: 48 }}>
          Nice studying!
        </Text>
        <TouchableOpacity
          style={{
            width: 318,
            height: 72,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#4F41D8',
            marginBottom: 20,
          }}
          onPress={() => router.replace('/')}
        >
          <Text style={{ color: '#fff', fontFamily: 'Satoshi-Variable', fontWeight: '400', fontSize: 20 }}>
            Back to Home (Decks Page)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: 318,
            height: 72,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#44B88A',
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontFamily: 'Satoshi-Variable', fontWeight: '400', fontSize: 20 }}>
            Back to Deck
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
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
          <View style={styles.headerIconsContainer}>
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
          <View style={styles.middleContentContainer}>
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
            />
          </View>
          <View style={styles.difficultyPillRowContainer}>
            <DifficultyPillRow currentIdx={currentIdx} onDifficultyChange={handleDifficultyChange} />
          </View>
          <View style={styles.loadingBarBottomContainer}>
            <LoadingBar currentIdx={currentIdx} totalCards={totalCards} isStudyMode={isStudyMode} isQuizMode={isQuizMode} hasFlippedCard={hasFlippedCard} hasSubmittedMCQ={hasSubmittedMCQ} flashcardAnswerType={dummyFlashcards[currentIdx]?.flashcardAnswerType || ''} />
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
        text="Are you sure you want to delete this flashcard?"
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
        text="End study session?"
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
        text="End quiz session?"
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    left: 16,
    zIndex: 1,
    paddingTop: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    right: 16,
    zIndex: 1,
  },
  middleContentContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 132 : 78, // headerIconsContainer top + height
    left: 16,
    right: 16,
    bottom: 108, // height of difficultyPillRowContainer + loading bar
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
    backgroundColor: '#F8F8F8',
    borderRadius: 21,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  loadingBarFg: {
    height: 21,
    backgroundColor: '#4F41D8',
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
    fontFamily: 'Satoshi-Italic',
    fontSize: 14,
    color: '#FFFFFF',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#222',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    color: '#222',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 32,
    color: '#222',
    textAlign: 'center',
  },
  blankUnderlineView: {
    borderBottomWidth: 2,
    borderColor: '#222',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 36,
    marginBottom: 16,
  },
  replayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: '#ECECEC',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 28,
    color: '#222',
    textAlign: 'left',
    lineHeight: 28,
  },
  mcqOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  mcqOptionLabelText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#222',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 10,
    borderColor: '#4F41D8',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 18,
    textAlign: 'center',
    color: '#222',
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
    backgroundColor: '#4F41D8',
    borderRadius: 16,
  },
  mcqModalButtonText: {
    color: '#fff',
    fontFamily: 'Satoshi-Medium',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 28,
    color: '#D5D4DD',
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
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});  