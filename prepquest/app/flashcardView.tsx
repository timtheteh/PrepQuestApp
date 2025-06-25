import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, SafeAreaView, Dimensions, Text, TouchableWithoutFeedback, Animated, Pressable, ScrollView, Image } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        playThroughEarpieceAndroid: false,
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
const FlippableFlashcard = ({ currentIdx, setCurrentIdx, totalCards }: { currentIdx: number, setCurrentIdx: React.Dispatch<React.SetStateAction<number>>, totalCards: number }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const frontOpacity = useRef(new Animated.Value(1)).current;
  const backOpacity = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const displayNumber = currentIdx + 1;

  // MCQ selection state
  const [selectedMCQOption, setSelectedMCQOption] = useState<string | null>(null);
  // Store randomized MCQ options in a ref so they persist across renders
  const mcqOptionsWithLettersRef = useRef<Array<{ choice: string; ans: boolean; letter: string }>>([]);
  console.log(mcqOptionsWithLettersRef.current);

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
        console.log(`Selected option ${selectedMCQOption} is ${isCorrect ? 'correct' : 'incorrect'}`);
        // TODO: Handle correct/incorrect answer feedback
      }
    }
  };

  // Chevron navigation logic
  const isLeftChevronDisabled = () => currentIdx <= 0;
  const isRightChevronDisabled = () => currentIdx >= totalCards - 1;

  const navigateToPreviousCard = () => {
    if (!isLeftChevronDisabled()) {
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
      // Slide out to left
      Animated.timing(cardSlideAnim, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIdx(idx => {
          // Always reset to front side
          setIsFlipped(false);
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
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (!isAudioPlaying) {
        // Play or resume
        if (audioSoundRef.current) {
          await audioSoundRef.current.playAsync();
        } else {
          const { sound } = await Audio.Sound.createAsync(uri, { positionMillis: audioPosition });
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

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Left Chevron Button */}
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

export default function FlashcardViewPage() {
  const router = useRouter();
  const { flashcardIdx, totalNumberOfFlashcards } = useLocalSearchParams();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Lift currentIdx state up here
  const [currentIdx, setCurrentIdx] = useState(parseInt(flashcardIdx as string) || 0);
  const totalCards = parseInt(totalNumberOfFlashcards as string) || dummyFlashcards.length;
  
  // Add a separate state to force re-renders when difficulty changes
  const [difficultyUpdateTrigger, setDifficultyUpdateTrigger] = useState(0);

  // Function to update the difficulty of the current flashcard
  const handleDifficultyChange = (difficulty: string) => {
    if (dummyFlashcards[currentIdx]) {
      dummyFlashcards[currentIdx].flashcardDifficulty = difficulty;
      // Force a re-render by incrementing the trigger
      setDifficultyUpdateTrigger(prev => prev + 1);
    }
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

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={32} color="black" />
          </TouchableOpacity>
          <View style={styles.headerIconsContainer}>
            <FlashcardViewTopBar onTrashPress={handleTrashPress} />
          </View>
          <View style={styles.middleContentContainer}>
            <FlippableFlashcard currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} totalCards={totalCards} />
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
    borderWidth: 2,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderColor: 'blue',
    zIndex: 10,
  },
  middleContainer: {
    position: 'absolute',
    top: 60,
    bottom: 60,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'red',
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
    borderWidth: 2,
    borderColor: 'green',
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
}); 