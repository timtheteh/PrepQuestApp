import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, SafeAreaView, Dimensions, Text, TouchableWithoutFeedback, Animated, Pressable, ScrollView, Image, Alert, AppState, AppStateStatus } from 'react-native';
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
import Svg, { Path, Rect } from 'react-native-svg';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    // text Qn -> text Ans
  { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'text', flashcardAnswer: 'A react hook is a function that allows you to use state and other react features in functional components.' },
  // text Qn (Cloze) -> text Ans
  { flashcardDifficulty: 'None', flashcardQnType: 'text', flashcardQn: 'A React Hook is a special function that allows functional components to <blank> into React features like state and lifecycle methods without using class components.', flashcardAnswerType: 'text', flashcardAnswer: 'A react hook is a function that allows you to use state and other react features in functional components.' },
  // image Qn (jpg) -> text Ans
  { flashcardDifficulty: 'Hard', flashcardQnType: 'image', flashcardQn: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg'), flashcardAnswerType: 'text', flashcardAnswer: 'UseEffect is a hook that allows you to perform side effects in functional components.' },
  // image Qn (HEIC) -> text Ans
//   { flashcardDifficulty: 'Easy', flashcardQnType: 'image', flashcardQn: require('@/assets/dummyPhotos/dummy_HEIC_photo.HEIC'), flashcardAnswerType: 'text', flashcardAnswer: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum." },
  // audio Qn (m4a) -> text Ans
  { flashcardDifficulty: 'Good', flashcardQnType: 'audio', flashcardQn: require('@/assets/dummyAudio/dummy_m4a_audio.m4a'), flashcardAnswerType: 'text', flashcardAnswer: 'State is a way to store data that can change over time.' },
//   // audio Qn (ogg) -> text Ans
//   { flashcardDifficulty: 'Good', flashcardQnType: 'audio', flashcardQn: require('@/assets/dummyAudio/dummy_ogg_audio.ogg'), flashcardAnswerType: 'text', flashcardAnswer: 'State is a way to store data that can change over time.' },
  
  // text Qn -> MCQ Ans
  { flashcardDifficulty: 'Again', flashcardQnType: 'text', flashcardQn: 'How do you use useState?', flashcardAnswerType: 'MCQ', flashcardAnswer: 
    [
    {   "choice": "This is the first choice",
        "ans": false
    }, 
    {   "choice": "This is the second choice",
        "ans": false
    }, 
    {   "choice": "This is the third choice",
        "ans": false
    }, 
    {   "choice": "This is the fourth choice",
        "ans": true
    },
    {   "choice": "This is the fifh choice",
        "ans": false
    }] 
    },
    // text Qn -> voice recorded
  { flashcardDifficulty: 'Good', flashcardQnType: 'text', flashcardQn: 'What is a component?', flashcardAnswerType: 'voice', flashcardAnswer: null },
  // text Qn -> audio Ans
  { flashcardDifficulty: 'Again', flashcardQnType: 'text', flashcardQn: 'What is a react hook?', flashcardAnswerType: 'audio', flashcardAnswer: require('@/assets/dummyAudio/dummy_m4a_audio.m4a') },
  // text Qn -> image Ans
  { flashcardDifficulty: 'Hard', flashcardQnType: 'text', flashcardQn: 'Explain useEffect.', flashcardAnswerType: 'image', flashcardAnswer: require('@/assets/dummyPhotos/dummy_JPEG_photo.jpg') },
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
const LoadingBar = ({ currentIdx, totalCards }: { currentIdx: number, totalCards: number }) => {
  // Create animated value for progress
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate target progress
  const targetProgress = totalCards > 0 ? (currentIdx + 1) / totalCards : 0; // +1 because we want to show progress including current card

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
      <View style={styles.loadingBarBg}>
        <Animated.View 
          style={[
            styles.loadingBarFg, 
            { 
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              })
            }
          ]} 
        />
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
const FlippableFlashcard = ({ currentIdx, setCurrentIdx, totalCards, setMcqModalVisible, setMcqModalCorrect, mcqModalOpacity, mcqOverlayOpacity, isFlipped, setIsFlipped, mcqOptionsWithLettersRef, stopSpeech, setIsSpeechPlaying, setIsSpeechPaused, isStudyMode, hasFlippedCard, setHasFlippedCard, showStudyValidationModal }: { currentIdx: number, setCurrentIdx: React.Dispatch<React.SetStateAction<number>>, totalCards: number, setMcqModalVisible: React.Dispatch<React.SetStateAction<boolean>>, setMcqModalCorrect: React.Dispatch<React.SetStateAction<boolean>>, mcqModalOpacity: Animated.Value, mcqOverlayOpacity: Animated.Value, isFlipped: boolean, setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>, mcqOptionsWithLettersRef: React.MutableRefObject<Array<{ choice: string; ans: boolean; letter: string }>>, stopSpeech: () => Promise<void>, setIsSpeechPlaying: React.Dispatch<React.SetStateAction<boolean>>, setIsSpeechPaused: React.Dispatch<React.SetStateAction<boolean>>, isStudyMode: boolean, hasFlippedCard: boolean, setHasFlippedCard: React.Dispatch<React.SetStateAction<boolean>>, showStudyValidationModal: (message: string) => void }) => {
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
      setSelectedMCQOption(null); // Reset selection when card changes
    } else {
      mcqOptionsWithLettersRef.current = [];
      setSelectedMCQOption(null);
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
        // Track if card has been flipped in study mode
        if (!isFlipped && isStudyMode) {
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
  const isRightChevronDisabled = () => currentIdx >= totalCards - 1;

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
    if (!isRightChevronDisabled()) {
      // Study mode validation
      if (isStudyMode) {
        const currentFlashcard = dummyFlashcards[currentIdx];
        const answerType = currentFlashcard?.flashcardAnswerType;
        const currentDifficulty = currentFlashcard?.flashcardDifficulty;
        
        // Check if answer type is text, audio, or image
        if (answerType === 'text' || answerType === 'audio' || answerType === 'image') {
          const hasDifficultySelected = currentDifficulty && currentDifficulty !== 'None';
          
          if (!hasFlippedCard) {
            if (!hasDifficultySelected) {
              showStudyValidationModal("Cannot move on until you have viewed answer and selected a difficulty!");
              return;
            } else {
              showStudyValidationModal("Please flip the card to view the answer before selecting a difficulty!");
              return;
            }
          }
        }
        // For MCQ and voice types, we'll handle validation later
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

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Left Chevron Button - hidden in study mode */}
      {!isStudyMode && (
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
            style={[
              styles.flippableCard,
              {
                backgroundColor: '#F8F8F8',
                transform: [{ rotateY: frontInterpolate }],
                zIndex: isFlipped ? 0 : 1,
                position: 'absolute',
                width: '100%',
                height: '100%',
              },
            ]}
          >
            {/* Front content here */}
            
            {/* Top container */}
            <Animated.View style={[styles.topContainer, { opacity: frontOpacity }]}>
              <View style={styles.topContainerContent}>
                <Text style={styles.flashcardIndexText}>
                  {`Qn ${displayNumber} of ${totalCards}`}
                </Text>
                <FavoriteButton size={30} />
              </View>
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
                  source={flashcardQn}
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
              {/* Bottom content will go here */}
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
                transform: [{ rotateY: backInterpolate }],
                zIndex: isFlipped ? 1 : 0,
                position: 'absolute',
                width: '100%',
                height: '100%',
              },
            ]}
          >
            {/* Back content here */}
            
            {/* Top container */}
            <Animated.View style={[styles.topContainer, { opacity: backOpacity }]}>
              <View style={styles.topContainerContent}>
                <Text style={styles.flashcardIndexText}>
                  {`Ans ${displayNumber} of ${totalCards}`}
                </Text>
                <FavoriteButton size={30} />
              </View>
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
const MCQFeedbackModal = ({ visible, opacity, isCorrect, onDismiss, lottieMarginTop = 80 }: {
  visible: boolean;
  opacity: Animated.Value;
  isCorrect: boolean;
  onDismiss: () => void;
  lottieMarginTop?: number;
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
  const { flashcardIdx, totalNumberOfFlashcards, isStudyMode: isStudyModeParam } = useLocalSearchParams();
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
  const [hasFlippedCard, setHasFlippedCard] = useState(false);
  const [studyValidationModalVisible, setStudyValidationModalVisible] = useState(false);
  const [studyValidationMessage, setStudyValidationMessage] = useState("");
  const studyValidationModalOpacity = useRef(new Animated.Value(0)).current;
  const studyValidationOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Set study mode from URL parameter
  useEffect(() => {
    setIsStudyMode(isStudyModeParam === 'true');
  }, [isStudyModeParam]);

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

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              await stopSpeech();
              router.back();
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
              showStudyValidationModal={showStudyValidationModal}
            />
          </View>
          <View style={styles.difficultyPillRowContainer}>
            <DifficultyPillRow currentIdx={currentIdx} onDifficultyChange={handleDifficultyChange} />
          </View>
          <View style={styles.loadingBarBottomContainer}>
            <LoadingBar currentIdx={currentIdx} totalCards={totalCards} />
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
    // borderWidth: 2,
    // borderColor: 'green',
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
    zIndex: 10,
  },
  rightChevronButton: {
    position: 'absolute',
    top: '50%',
    right: -20,
    zIndex: 10,
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
    borderWidth: 2,
    borderColor: 'red',
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