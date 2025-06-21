import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Text, Dimensions, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/FormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { SmallCircleSelectButton } from '@/components/SmallCircleSelectButton';
import HelpIconOutline from '@/assets/icons/helpIconOutline.svg';
import { PrimaryButton } from '@/components/PrimaryButton';
import YoutubeIconSVG from '@/assets/images/YoutubeIconSVG.svg';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { GenericModal } from '@/components/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import { TitleTextBar } from '@/components/TitleTextBar';
import { QuestionTextBar } from '@/components/QuestionTextBar';
import { NumberOfQuestions } from '@/components/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/TypeOfInterviewQn';
import { TopBarManualHeader } from '@/components/TopBarManualHeader';
import { AddViewToggle } from '@/components/AddViewToggle';
import { FlippableCard, FlippableCardRef } from '../components/FlippableCard';
import { CircleIconButton } from '@/components/CircleIconButton';
import EyeIcon from '@/assets/icons/eyeIcon.svg';
import { CircleSelectButtonGreen } from '../components/CircleSelectButtonGreen';
import DeleteModalIcon from '@/assets/icons/deleteModalIcon.svg';
import LottieView from 'lottie-react-native';

const HelpIconFilled: React.FC<SvgProps> = (props) => (
  <Svg 
    width={props.width || 31} 
    height={props.height || 31} 
    viewBox="0 0 31 31" 
    fill="none" 
    {...props}
  >
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM13.9019 18.4478C13.9019 18.5539 13.9879 18.6399 14.094 18.6399H16.1124C16.2185 18.6399 16.3045 18.5539 16.3045 18.4478C16.3093 17.9257 16.3694 17.4874 16.4848 17.1327C16.6051 16.7732 16.7879 16.4604 17.0332 16.1945C17.2833 15.9285 17.6031 15.6724 17.9927 15.4261C18.4353 15.1552 18.8176 14.8474 19.1399 14.5026C19.4622 14.1578 19.7099 13.7638 19.883 13.3205C20.061 12.8773 20.15 12.3749 20.15 11.8134C20.15 10.981 19.9528 10.2619 19.5584 9.6561C19.1688 9.04536 18.6228 8.57499 17.9206 8.245C17.2232 7.915 16.4151 7.75 15.4964 7.75C14.6547 7.75 13.8851 7.90761 13.1876 8.22283C12.495 8.53805 11.937 9.01088 11.5138 9.64132C11.3094 9.94918 11.1521 10.2934 11.0418 10.6741C10.8383 11.3764 11.4529 11.9907 12.1841 11.9907H12.2122C12.8883 11.9907 13.3794 11.4108 13.7504 10.8456C13.9524 10.5402 14.2049 10.3136 14.508 10.1659C14.8158 10.0132 15.1405 9.93684 15.482 9.93684C15.8523 9.93684 16.1866 10.0156 16.4848 10.1733C16.7879 10.3309 17.0284 10.5525 17.2063 10.8382C17.3843 11.1238 17.4733 11.4612 17.4733 11.8503C17.4733 12.1951 17.4059 12.5079 17.2713 12.7886C17.1366 13.0644 16.9514 13.3156 16.7157 13.5422C16.4848 13.7638 16.2227 13.9682 15.9293 14.1554C15.5012 14.4263 15.1381 14.7243 14.8398 15.0493C14.5416 15.3695 14.3107 15.7931 14.1472 16.3201C13.9885 16.8471 13.9067 17.5563 13.9019 18.4478ZM14.039 22.7772C14.3516 23.0924 14.7244 23.25 15.1573 23.25C15.4459 23.25 15.708 23.1786 15.9437 23.0357C16.1842 22.888 16.3766 22.691 16.5209 22.4447C16.67 22.1984 16.7446 21.9251 16.7446 21.6246C16.7446 21.1814 16.5858 20.8021 16.2684 20.4869C15.9557 20.1717 15.5854 20.0141 15.1573 20.0141C14.7244 20.0141 14.3516 20.1717 14.039 20.4869C13.7263 20.8021 13.57 21.1814 13.57 21.6246C13.57 22.0778 13.7263 22.4619 14.039 22.7772Z" 
      fill="#363538"
    />
  </Svg>
);

const ManualAddDeckMainSection = () => {
  return (
    <View style={styles.manualAddDeckMainSection}>
      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          placeholder="Type your content here"
          placeholderTextColor="#D5D4DD"
          multiline={true}
          numberOfLines={4}
        />
      </View>
    </View>
  );
};

const getFormContentGap = () => {
  const { width, height } = Dimensions.get('window');

  // iphone 16 pro max
  if (Platform.OS === 'ios' && height >= 940) {
    return 25;
  }
  
  // iphone 16 plus
  if (Platform.OS === 'ios' && height >= 920) {
    return 20;
  }

   // Pixel 9 Pro, Pixel 9 Pro XL 
  if (Platform.OS === 'android' && height >= 935) {
    return 35;
  }
  
  // Pixel 7, Pixel 8, Pixel 9
  if (Platform.OS === 'android' && height >= 900) {
    return 20;
  }
  
  // iphone 16, iphone 16 plus, iphone SE, Pixel 7 Pro, 
  return Platform.OS === 'ios' ? 0 : 16;
};


export default function ManualAddDeckPage() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAIGenerate, setIsAIGenerate] = useState(false);
  const [isAIHelpModalOpen, setIsAIHelpModalOpen] = useState(false);
  const aiHelpModalOpacity = useRef(new Animated.Value(0)).current;
  const [addViewState, setAddViewState] = useState<'add' | 'view'>('add');
  const [selectExpanded, setSelectExpanded] = useState(false);
  const selectFadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedFlashcards, setSelectedFlashcards] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalOpacity = useRef(new Animated.Value(0)).current;
  const [isRecentFormModalOpen, setIsRecentFormModalOpen] = useState(false);
  const recentFormModalOpacity = useRef(new Animated.Value(0)).current;
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const cardFadeAnim = useRef(new Animated.Value(1)).current;
  const flippableCardRef = useRef<FlippableCardRef>(null);
  const [selectedButtonType, setSelectedButtonType] = useState<'camera' | 'marker' | 'mic' | 'text' | 'none'>('none');
  const [hasCardContent, setHasCardContent] = useState(false);
  const [isContentTypeChangeModalOpen, setIsContentTypeChangeModalOpen] = useState(false);
  const contentTypeChangeModalOpacity = useRef(new Animated.Value(0)).current;
  const [pendingButtonType, setPendingButtonType] = useState<'camera' | 'marker' | 'mic' | 'text' | 'none' | null>(null);
  const [isBackConfirmationModalOpen, setIsBackConfirmationModalOpen] = useState(false);
  const backConfirmationModalOpacity = useRef(new Animated.Value(0)).current;
  const [isNoSelectionModalOpen, setIsNoSelectionModalOpen] = useState(false);
  const noSelectionModalOpacity = useRef(new Animated.Value(0)).current;

  // Cache for storing all created cards
  interface CachedCard {
    cardNumber: number;
    frontContent: {
      content: React.ReactNode;
      type: 'camera' | 'marker' | 'mic' | 'text' | 'none';
    } | null;
    backContent: {
      content: React.ReactNode;
      type: 'camera' | 'marker' | 'mic' | 'text' | 'none';
    } | null;
    submitted: boolean; // Track if card was submitted via "Fill up next flashcard"
  }
  
  const [cardCache, setCardCache] = useState<CachedCard[]>([]);
  const [lastEditedCardNumber, setLastEditedCardNumber] = useState<number>(1);

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    30;

  useEffect(() => {
    // Ensure the layout is ready after the first render
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isHelpModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isHelpModalOpen]);

  useEffect(() => {
    if (isAIHelpModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(aiHelpModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isAIHelpModalOpen]);

  useEffect(() => {
    if (isContentTypeChangeModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentTypeChangeModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isContentTypeChangeModalOpen]);

  useEffect(() => {
    if (isBackConfirmationModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backConfirmationModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isBackConfirmationModalOpen]);

  useEffect(() => {
    if (isNoSelectionModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isNoSelectionModalOpen]);

  useEffect(() => {
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

  useEffect(() => {
    Animated.timing(selectFadeAnim, {
      toValue: selectExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [selectExpanded]);

  // Check card content when button type changes (indicates content might have been added)
  useEffect(() => {
    setTimeout(checkCardContent, 100);
  }, [selectedButtonType]);

  // Check card content when component regains focus (e.g., after modal closes)
  useFocusEffect(
    React.useCallback(() => {
      setTimeout(checkCardContent, 100);
    }, [])
  );

  // Load current card from cache when switching to add state
  useEffect(() => {
    if (!isMandatory && addViewState === 'add') {
      // Check if the current question number exists in cache
      const cachedCard = cardCache.find(card => card.cardNumber === currentQuestionNumber);
      if (cachedCard) {
        // Load the existing card
        loadCurrentCardFromCache();
      } else {
        // If no card exists for current number, it means we need to set the next available card number
        const nextCardNumber = getNextCardNumber();
        setCurrentQuestionNumber(nextCardNumber);
        
        // Reset card to empty state
        if (flippableCardRef.current) {
          flippableCardRef.current.resetToFront();
          flippableCardRef.current.resetContent();
        }
        
        // Reset to none state
        setSelectedButtonType('none');
        
        // Update content state
        setHasCardContent(false);
      }
    }
  }, [isMandatory, addViewState, currentQuestionNumber]);

  // Save card to cache when content changes
  useEffect(() => {
    if (!isMandatory && addViewState === 'add' && hasCardContent) {
      // Debounce the save to avoid too frequent updates
      const timeoutId = setTimeout(() => {
        saveCurrentCardToCache();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasCardContent, currentQuestionNumber]);

  const handleContentChange = (hasContent: boolean) => {
    setHasCardContent(hasContent);
  };

  const handleButtonChange = (buttonType: 'camera' | 'marker' | 'mic' | 'text' | 'none' | null) => {
    if (!buttonType || buttonType === 'none') {
      setSelectedButtonType(buttonType || 'none');
      return;
    }

    // Check if there's content on the current side with a different type
    const currentContent = flippableCardRef.current?.getCurrentContent();
    if (currentContent && currentContent.type !== buttonType) {
      // Show modal to warn about content type change
      setIsContentTypeChangeModalOpen(true);
      setPendingButtonType(buttonType);
      return;
    }

    // If no conflict, proceed with the change
    setSelectedButtonType(buttonType);
  };

  const handleBackPress = () => {
    setIsBackConfirmationModalOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backConfirmationModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleClearAllPress = () => {
    // Reset mandatory fields only
    setDeckName('');
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    setNumberOfQuestions(1);
  };

  const handleToggle = (isRightSide: boolean) => {
    // Save current card to cache before toggling
    if (!isMandatory && addViewState === 'add') {
      saveCurrentCardToCache();
    }
    
    setIsMandatory(!isRightSide);
    if (isRightSide) setAddViewState('add');
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const isStudyMandatoryFieldsFilled = () => {
    return deckName.trim() !== '' && 
           studyMandatoryQuestion1.trim() !== '' && 
           studyMandatoryQuestion2.trim() !== '';
  };

  const isInterviewMandatoryFieldsFilled = () => {
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '';
  };

  const isSubmitDisabled = () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const currentQuestionNumberIsMoreThanOne = currentQuestionNumber > 1 ? true : false;
    return !mandatoryFieldsFilled || !currentQuestionNumberIsMoreThanOne;
  };

  const handleSubmit = () => {
    router.back();
  };

  const handleDismissHelp = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsHelpModalOpen(false);
    });
  };

  const handleDismissAIHelp = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(aiHelpModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAIHelpModalOpen(false);
    });
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
      })
    ]).start(() => {
      setIsDeleteModalOpen(false);
    });
  };

  const handleDeletePress = () => {
    if (selectedFlashcards.length === 0) {
      // Show "No selection made" modal if no flashcards are selected
      setIsNoSelectionModalOpen(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Show delete confirmation modal if flashcards are selected
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
        })
      ]).start();
    }
  };

  const handleDismissRecentForm = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(recentFormModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRecentFormModalOpen(false);
    });
  };

  const handleDismissContentTypeChange = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentTypeChangeModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsContentTypeChangeModalOpen(false);
      setPendingButtonType(null);
    });
  };

  const handleDismissBackConfirmation = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backConfirmationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackConfirmationModalOpen(false);
    });
  };

  const handleDismissNoSelection = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noSelectionModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNoSelectionModalOpen(false);
    });
  };

  const handleNextFlashcard = () => {
    // Save current card to cache before creating next card
    saveCurrentCardToCache();
    
    // Mark the current card as submitted
    setCardCache(prev => {
      const existingIndex = prev.findIndex(card => card.cardNumber === currentQuestionNumber);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          submitted: true
        };
        return updated;
      }
      return prev;
    });
    
    // Fade out animation
    Animated.timing(cardFadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Increment question number
      setCurrentQuestionNumber(prev => prev + 1);
      
      // Reset card to front view
      flippableCardRef.current?.resetToFront();
      
      // Reset content to null
      flippableCardRef.current?.resetContent();
      
      // Reset to none state (default)
      setSelectedButtonType('none');
      
      // Fade in animation
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCardFlip = () => {
    // Reset to none state when card is flipped
    setSelectedButtonType('none');
  };

  const checkCardContent = () => {
    const hasContent = flippableCardRef.current?.hasContent() || false;
    handleContentChange(hasContent);
  };

  const handleUseMostRecentFormPress = () => {
    setIsRecentFormModalOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(recentFormModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const mandatoryOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const manualAddDeckOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const getScrollContentPaddingTop = () => {
    if (isMandatory) return 16; // default padding for Mandatory state

    const height = Dimensions.get('window').height;
    if (Platform.OS === 'ios') {
      if (height > 900) return 55;
      if (height >= 800) return 23;
      return 16;
    } else {
      if (height > 930) return 35;
      if (height > 900) return 20;
      return 10;
    }
  };

  // Cache management functions
  const saveCurrentCardToCache = () => {
    if (!flippableCardRef.current) return;
    
    const frontContent = flippableCardRef.current.getFrontContent();
    const backContent = flippableCardRef.current.getBackContent();
    
    setCardCache(prev => {
      const existingIndex = prev.findIndex(card => card.cardNumber === currentQuestionNumber);
      if (existingIndex >= 0) {
        // Update existing card, preserve submitted status
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          frontContent: frontContent,
          backContent: backContent
        };
        return updated;
      } else {
        // Add new card with submitted: false
        const cachedCard: CachedCard = {
          cardNumber: currentQuestionNumber,
          frontContent: frontContent,
          backContent: backContent,
          submitted: false
        };
        return [...prev, cachedCard];
      }
    });
  };

  const loadCardFromCache = (cardNumber: number) => {
    const cachedCard = cardCache.find(card => card.cardNumber === cardNumber);
    if (cachedCard && flippableCardRef.current) {
      // Reset card to front view
      flippableCardRef.current.resetToFront();
      
      // Load the cached content
      flippableCardRef.current.loadCachedContent(cachedCard.frontContent, cachedCard.backContent);
      
      // Set the current question number
      setCurrentQuestionNumber(cardNumber);
      
      // Update content state
      const hasContent = !!(cachedCard.frontContent && cachedCard.backContent);
      setHasCardContent(hasContent);
      
      // Set the last edited card number
      setLastEditedCardNumber(cardNumber);
    }
  };

  const loadCurrentCardFromCache = () => {
    const cachedCard = cardCache.find(card => card.cardNumber === currentQuestionNumber);
    if (cachedCard && flippableCardRef.current) {
      // Load the cached content
      flippableCardRef.current.loadCachedContent(cachedCard.frontContent, cachedCard.backContent);
      
      // Update the content state
      const hasContent = !!(cachedCard.frontContent && cachedCard.backContent);
      setHasCardContent(hasContent);
    } else {
      // If no cached card found, reset to empty state
      if (flippableCardRef.current) {
        flippableCardRef.current.resetContent();
      }
      setHasCardContent(false);
    }
  };

  const getSubmittedCards = () => {
    return cardCache.filter(card => card.submitted === true);
  };

  const handleViewCard = (cardNumber: number) => {
    // Switch to add state and load the specific card
    setAddViewState('add');
    setCurrentQuestionNumber(cardNumber);
    loadCardFromCache(cardNumber);
  };

  const handleAddViewToggle = (newState: 'add' | 'view') => {
    // Save current card to cache when switching from add to view
    if (addViewState === 'add' && newState === 'view') {
      saveCurrentCardToCache();
    }
    
    setAddViewState(newState);
    
    // Load the current card when switching back to add state
    if (newState === 'add') {
      // Check if current card exists in cache
      const cachedCard = cardCache.find(card => card.cardNumber === currentQuestionNumber);
      if (cachedCard) {
        // Load the existing card content
        if (flippableCardRef.current) {
          flippableCardRef.current.loadCachedContent(cachedCard.frontContent, cachedCard.backContent);
        }
        // Update content state
        const hasContent = !!(cachedCard.frontContent && cachedCard.backContent);
        setHasCardContent(hasContent);
      } else {
        // If no card exists for current number, it means we need to set the next available card number
        const nextCardNumber = getNextCardNumber();
        setCurrentQuestionNumber(nextCardNumber);
        
        // Reset card to empty state
        if (flippableCardRef.current) {
          flippableCardRef.current.resetToFront();
          flippableCardRef.current.resetContent();
        }
        
        // Reset to none state
        setSelectedButtonType('none');
        
        // Update content state
        setHasCardContent(false);
      }
    }
  };

  const getNextCardNumber = () => {
    const submittedCards = getSubmittedCards();
    if (submittedCards.length === 0) {
      return 1;
    }
    return Math.max(...submittedCards.map(card => card.cardNumber)) + 1;
  };

  const getCardTitle = (card: CachedCard) => {
    // If the card has text content in the front, show the first 100 characters
    if (card.frontContent?.type === 'text' && card.frontContent?.content) {
      const textContent = extractTextFromContent(card.frontContent.content);
      if (textContent && textContent.length > 100) {
        return textContent.substring(0, 100) + '...';
      }
      return textContent || 'In Progress...';
    }
    
    // Default to "Card X" for other content types
    return 'In Progress...';
  };

  const extractTextFromContent = (content: React.ReactNode): string => {
    if (typeof content === 'string') {
      return content;
    }
    
    if (typeof content === 'number') {
      return content.toString();
    }
    
    if (content === null || content === undefined) {
      return '';
    }
    
    // If it's a React element, try to extract text from props
    if (typeof content === 'object' && content !== null) {
      // Check if it has children prop
      if ('props' in content && content.props) {
        const props = content.props as { children?: React.ReactNode };
        if (props.children) {
          if (typeof props.children === 'string') {
            return props.children;
          }
          if (Array.isArray(props.children)) {
            return props.children.map(child => extractTextFromContent(child)).join('');
          }
          return extractTextFromContent(props.children);
        }
      }
    }
    
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color="black" />
        </TouchableOpacity>
        
      </View>
      
      <Animated.View
        style={[
          styles.headerIconsContainer,
          { opacity: mandatoryOpacity, display: isMandatory ? 'flex' : 'none' }
        ]}
      >
        <FormHeaderIcons 
          onClearAllPress={handleClearAllPress}
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.headerIconsContainer,
          { 
            opacity: manualAddDeckOpacity, 
            display: !isMandatory && addViewState === 'add' ? 'flex' : 'none' 
          }
        ]}
      >
        <TopBarManualHeader 
          selectedButton={selectedButtonType}
          onButtonChange={handleButtonChange}
        />
      </Animated.View>

      {/* {!isMandatory && (
        <View style={styles.headerIconsContainer}>
          <TopBarManualHeader />
        </View>
      )} */}

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel="Mandatory"
            rightLabel="Manual"
            onToggle={handleToggle}
          />

          <Animated.View
            style={[
              styles.addViewToggle,
              { opacity: manualAddDeckOpacity, display: !isMandatory ? 'flex' : 'none' }
            ]}
          >
            <AddViewToggle
              key={isMandatory ? 'mandatory' : 'manual'}
              onToggle={handleAddViewToggle}
              initialState="add"
              selected={addViewState}
            />
          </Animated.View>
        </View>
        {isMandatory && (
          <ScrollView 
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: getScrollContentPaddingTop() }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            styles.formContent,
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex' }
          ]}>
              <View style={styles.formContent}>
                <TitleTextBar
                  title=" Deck Name"
                  highlightedWord={mode === 'study' ? 'Study' : 'Interview'}
                  placeholder="Type here!"
                  value={deckName}
                  onChangeText={setDeckName}
                />
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label="1. Education Level?"
                      placeholder="e.g. Freshman, Sophomore, etc"
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText="What education level is your preparation for?"
                    />
                    <QuestionTextBar
                      label="2. Subject(s)?"
                      placeholder="e.g. Computer Science, Math, Physics, etc."
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText="What subject(s) would this deck be for?"
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                    <QuestionTextBar
                      label="1. Job/Role?"
                      placeholder="e.g. Frontend Developer, Private Equity Analyst, etc"
                      value={interviewMandatoryQuestion1}
                      onChangeText={setInterviewMandatoryQuestion1}
                      helperText="What job or role are you preparing for?"
                    />
                    <TypeOfInterviewQn
                      value={interviewType}
                      onValueChange={setInterviewType}
                    />
                  </>
                )}
                <NumberOfQuestions
                  title="3. Number of questions:"
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                />
                <View style={styles.bottomSpacing} />
              </View>
          </Animated.View>
        </ScrollView>
        )}

        {/* FlippableCard only in Manual state and Add flashcard(s) state */}
        {!isMandatory && addViewState === 'add' && (
          <View 
            style={[
              styles.flippableCardContainer,
              { paddingBottom: bottomOffset * 2 + 72}
            ]}
          >
            <FlippableCard 
              ref={flippableCardRef}
              frontContentTitle={`Qn ${currentQuestionNumber}`} 
              backContentTitle={`Ans ${currentQuestionNumber}`}
              fadeOpacity={cardFadeAnim}
              cardType={selectedButtonType}
              onCardFlip={handleCardFlip}
              onContentChange={handleContentChange}
            />
          </View>
        )}

        {!isMandatory && addViewState === 'view' && (
          selectExpanded ? (
            <Animated.View style={[styles.selectRow, { opacity: selectFadeAnim }]}> 
              <TouchableOpacity onPress={() => {
                const submittedCards = getSubmittedCards();
                setSelectedFlashcards(submittedCards.map(card => card.cardNumber));
              }}>
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
              <CircleIconButton
                iconName="trash"
                color="#FF3B30"
                onPress={handleDeletePress}
              />
              <TouchableOpacity onPress={() => {
                setSelectExpanded(false);
                setSelectedFlashcards([]);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View style={{ opacity: selectFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
              <TouchableOpacity 
                style={styles.selectTextButton} 
                onPress={() => setSelectExpanded(true)}
                disabled={getSubmittedCards().length === 0}
              >
                <Text style={[
                  styles.selectText,
                  getSubmittedCards().length === 0 && styles.selectTextDisabled
                ]}>Select</Text>
              </TouchableOpacity>
            </Animated.View>
          )
        )}

        {!isMandatory && addViewState === 'view' && !selectExpanded && (
          getSubmittedCards().length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <LottieView
                source={require('../assets/animations/EmptyState1.json')}
                autoPlay
                loop
                style={styles.emptyStateAnimation}
              />
              <Text style={styles.emptyStateText}>No flashcards added{'\n'}at the moment!</Text>
            </View>
          ) : (
            <ScrollView 
              style={[styles.flashcardList, {marginBottom: Dimensions.get('window').height < 670 ? bottomOffset * 2 + 70 : bottomOffset * 2 + 48}]} 
              contentContainerStyle={{ flexGrow: 1}}
              showsVerticalScrollIndicator={false}
              bounces={true}
              overScrollMode="always"
            >
              {getSubmittedCards().map((card, i) => (
                <View key={card.cardNumber} style={[
                  styles.flashcardRow,
                  i === 0 && { borderTopWidth: 1, borderTopColor: '#ECECEC' }
                ]}>
                  <Text style={styles.flashcardNumber}>{card.cardNumber}.</Text>
                  <Text style={styles.flashcardTitle}>{getCardTitle(card)}</Text>
                  <TouchableOpacity onPress={() => handleViewCard(card.cardNumber)}>
                    <EyeIcon width={24} height={24} style={styles.flashcardEyeIcon} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )
        )}

        {!isMandatory && addViewState === 'view' && selectExpanded && (
          <ScrollView 
            style={[styles.flashcardList, {marginBottom: Dimensions.get('window').height < 670 ? bottomOffset * 2 + 70 : bottomOffset * 2 + 48}]} 
            contentContainerStyle={{ flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always"
          >
            {getSubmittedCards().map((card, i) => (
              <View key={card.cardNumber} style={[
                styles.flashcardRow,
                i === 0 && { borderTopWidth: 1, borderTopColor: '#ECECEC' }
              ]}>
                <Text style={styles.flashcardNumber}>{card.cardNumber}.</Text>
                <Text style={styles.flashcardTitle}>{getCardTitle(card)}</Text>
                <CircleSelectButtonGreen 
                  selected={selectedFlashcards.includes(card.cardNumber)}
                  onPress={() => {
                    setSelectedFlashcards(prev =>
                      prev.includes(card.cardNumber)
                        ? prev.filter(idx => idx !== card.cardNumber)
                        : [...prev, card.cardNumber]
                    );
                  }}
                />
              </View>
            ))}
          </ScrollView>
        )}
        
        <View style={[
          styles.buttonContainer,
          { bottom: bottomOffset, paddingTop: isMandatory ? Dimensions.get('window').height < 670 ? 10 : 20 : 0,}
        ]}>
          {isMandatory ? (
            <ActionButton
              text="Submit Form With Cards?"
              backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
              onPress={handleSubmit}
              disabled={isSubmitDisabled()}
              fullWidth
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, width: '100%', paddingHorizontal: 16}}>
              <ActionButton
                text="Submit Form 
With Cards?"
                backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
                onPress={handleSubmit}
                disabled={isSubmitDisabled()}
                style={{ flex: 1 }}
              />
              <ActionButton
                text="Fill Up
Next Card?"
                backgroundColor={hasCardContent ? "#44B88A" : "#D5D4DD"}
                style={{ flex: 1 }}
                onPress={handleNextFlashcard}
                disabled={!hasCardContent}
              />
            </View>
          )}
        </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isAIHelpModalOpen || isDeleteModalOpen || isRecentFormModalOpen || isContentTypeChangeModalOpen || isBackConfirmationModalOpen || isNoSelectionModalOpen}
        opacity={overlayOpacity}
        onPress={isDeleteModalOpen ? handleDismissDeleteModal : (isRecentFormModalOpen ? handleDismissRecentForm : (isContentTypeChangeModalOpen ? handleDismissContentTypeChange : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : (isNoSelectionModalOpen ? handleDismissNoSelection : (isHelpModalOpen ? handleDismissHelp : handleDismissAIHelp)))))}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text="Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more."
        buttons='none'
        textStyle={{
          highlightWord: "our website",
          highlightColor: "#44B88A"
        }}
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isAIHelpModalOpen}
        opacity={aiHelpModalOpacity}
        text="Ticking this option will let AI generate new, suggested cards outside the content of your upload."
        buttons='none'
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isDeleteModalOpen}
        opacity={deleteModalOpacity}
        Icon={DeleteModalIcon}
        text={`Are you sure you want to delete ${selectedFlashcards.length} flashcard${selectedFlashcards.length === 1 ? '' : 's'}?`}
        textStyle={{
          highlightWord: "delete",
          highlightColor: "#D7191C"
        }}
        buttons="double"
        onCancel={handleDismissDeleteModal}
        onConfirm={() => {
          // Remove selected cards from cache and reorder immediately
          setCardCache(prev => {
            const filtered = prev.filter(card => !selectedFlashcards.includes(card.cardNumber));
            const sortedCards = filtered.sort((a, b) => a.cardNumber - b.cardNumber);
            return sortedCards.map((card, index) => ({
              ...card,
              cardNumber: index + 1
            }));
          });
          
          setSelectedFlashcards([]);
          setSelectExpanded(false);
          handleDismissDeleteModal();
        }}
      />
      <GenericModal
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={['Use most recent', 'form entry?']}
        buttons='double'
        onConfirm={() => {
          handleDismissRecentForm();
          // TODO: Implement loading most recent form
          console.log('Load most recent form');
        }}
        onCancel={handleDismissRecentForm}
      />
      <GenericModal
        visible={isContentTypeChangeModalOpen}
        opacity={contentTypeChangeModalOpacity}
        text="Changing the content type will clear the current content on this side. Are you sure you want to continue?"
        buttons="double"
        onCancel={handleDismissContentTypeChange}
        onConfirm={() => {
          // Clear the current side content and proceed with the change
          if (flippableCardRef.current) {
            const currentContent = flippableCardRef.current.getCurrentContent();
            const frontContent = flippableCardRef.current.getFrontContent();
            
            // Check if we're on the front side by comparing content
            if (currentContent === frontContent) {
              flippableCardRef.current.clearFrontContent();
            } else {
              flippableCardRef.current.clearBackContent();
            }
          }
          
          // Set the selected button type to the pending type
          if (pendingButtonType) {
            setSelectedButtonType(pendingButtonType);
          }
          
          handleDismissContentTypeChange();
          setPendingButtonType(null);
        }}
      />
      <GenericModal
        visible={isBackConfirmationModalOpen}
        opacity={backConfirmationModalOpacity}
        text={['Are you sure you want', 'to leave? All your', 'progress will be lost']}
        buttons="double"
        onCancel={handleDismissBackConfirmation}
        onConfirm={() => {
          // Animate out first, then navigate
          Animated.parallel([
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backConfirmationModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            setIsBackConfirmationModalOpen(false);
            // Navigate after animation completes
            setTimeout(() => {
              router.back();
            }, 50);
          });
        }}
        textMarginBottom={40}
        contentMarginTop={-10}
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isNoSelectionModalOpen}
        opacity={noSelectionModalOpacity}
        subtitle="Select at least one flashcard to delete."
        text="No selection made!"
        onConfirm={handleDismissNoSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  addViewToggle:{
    marginTop: "2%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: Dimensions.get('window').height < 670 ? 30 : 60,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height < 670 ? 30 : 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  formContent: {
    gap: getFormContentGap(),
  },
  manualAddDeckContent: {
    marginTop: Platform.OS === 'android' && Dimensions.get('window').height > 960 ? 20 : 0,
    gap: Platform.OS === 'ios' ? 0 : 16,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomSpacingManualAddDeck: {
    height: 50,
  },
  manualAddDeckTitle: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'left',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 10 : 40,
  },
  manualAddDeckMainSection: {
    height: 370,
    width: '95%',
    alignSelf: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#4F41D8',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAreaContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    width: '90%',
    height: 192,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 16,
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  aiGenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 20 : 5,
    gap: 5,
  },
  aiGenerateText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#000000',
  },
  flippableCardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Dimensions.get('window').height < 670 ? 8 : 32,
  },
  selectTextButton: {
    position: 'relative',
    right: 16,
    top: 16,
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  selectText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#44B88A',
  },
  selectAllText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#44B88A',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
    marginRight: 16,
  },
  cancelText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14.5,
    color: '#000000',
  },
  flashcardList: {
    flex: 1,
    width: '100%',
    marginTop: 8,
  },
  flashcardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    width: '100%',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    backgroundColor: 'transparent',
  },
  flashcardNumber: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#000',
    width: 32,
    textAlign: 'left',
  },
  flashcardTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#000',
    flex: 1,
    textAlign: 'left',
    marginLeft: -5,
  },
  flashcardEyeIcon: {
    marginLeft: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '50%'
  },
  emptyStateAnimation: {
    width: 200,
    height: 200,
  },
  emptyStateText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  selectTextDisabled: {
    color: '#D5D4DD',
  },
});
