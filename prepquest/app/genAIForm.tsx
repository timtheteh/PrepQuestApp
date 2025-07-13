import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/FormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { TitleTextBar } from '@/components/TitleTextBar';
import { QuestionTextBar } from '@/components/QuestionTextBar';
import { QuestionTextBarWithDropdown } from '@/components/QuestionTextBarWithDropdown';
import { NumberOfQuestions } from '@/components/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/TypeOfInterviewQn';
import { KindsOfQuestions } from '@/components/KindsOfQuestions';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { GenericModal } from '@/components/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import DeleteModalIcon from '@/assets/icons/deleteModalIcon.svg';
import { checkDeckNameExists, saveUserGenAIFormEntry, getMostRecentGenAIFormEntry, createDeckWithGenAIFlashcards, createGenAIFlashcardsForDeck } from '../db/decks';
import { Toast } from '../components/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDistributionOfFlashcardsForInterviewType, promptAndData, promptAndDataChinese } from '@/constants/promptEngineering';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserQuestionSettings } from '../db/users';
import { DeckCreationStatusPage } from './DeckCreationLoadingPage';

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

const getFormContentGap = (isInViewFlashcardsPage?: boolean) => {
  const { width, height } = Dimensions.get('window');

  // If we're in view flashcards page, use smaller gaps since we don't have the deck name field
  if (isInViewFlashcardsPage) {
    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return 35;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return 32;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return 50;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return 32;
    }
    
    // Default smaller gap for view flashcards page
    return Platform.OS === 'ios' ? 28 : 30;
  }

  // Original gap values for other pages (index, favorites, view decks in folder)
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

// Error messages for network/API errors
const ERROR_MESSAGES = {
  network: {
    English: 'Network error. Please check your connection and try again.',
    Chinese: '网络错误。请检查您的连接并重试。'
  },
  400: {
    English: 'Something went wrong. Please try again.',
    Chinese: '出现错误，请重试。'
  },
  401: {
    English: "You're not logged in. Please sign in to continue.",
    Chinese: '您尚未登录。请先登录。'
  },
  403: {
    English: "You don't have permission to perform this action.",
    Chinese: '您没有权限执行此操作。'
  },
  404: {
    English: 'The requested resource was not found.',
    Chinese: '未找到请求的资源。'
  },
  500: {
    English: 'Server error. Please try again later.',
    Chinese: '服务器错误，请稍后再试。'
  },
  502: {
    English: 'Service temporarily unavailable. Please try again shortly.',
    Chinese: '服务暂时不可用，请稍后再试。'
  },
  503: {
    English: 'Service temporarily unavailable. Please try again shortly.',
    Chinese: '服务暂时不可用，请稍后再试。'
  },
  default: {
    English: 'Something went wrong. Please try again.',
    Chinese: '出现错误，请重试。'
  }
};

// Toast messages for form validation
const TOAST_MESSAGES = {
  deckNameInUse: {
    English: 'Deckname already in use',
    Chinese: '卡组名称已被使用'
  },
  invalidSubjects: {
    English: "Invalid form input for 'Subject(s)'",
    Chinese: '“科目”输入无效'
  },
  invalidTopics: {
    English: "Invalid form input for 'Topic(s)'",
    Chinese: '“主题”输入无效'
  },
  invalidSubtopics: {
    English: "Invalid form input for 'Subtopic(s)'",
    Chinese: '“子主题”输入无效'
  },
  insufficientQuestions: {
    English: 'Number of questions insufficient to cover all kinds of questions chosen!',
    Chinese: '题目数量不足以覆盖所选题型！'
  }
};

export default function GenAIFormPage() {
  const { 
    mode, 
    deckId, 
    folderId, 
    isInFavoritesPage, 
    isInIndexPage,
    isInViewFlashcardsPage,
    isInViewDecksInFolderPage
  } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [studyOptionalQuestion1, setStudyOptionalQuestion1] = useState('');
  const [studyOptionalQuestion2, setStudyOptionalQuestion2] = useState('');
  const [studyOptionalQuestion3, setStudyOptionalQuestion3] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [interviewOptionalQuestion1, setInterviewOptionalQuestion1] = useState('');
  const [interviewOptionalQuestion2, setInterviewOptionalQuestion2] = useState('');
  const [interviewOptionalQuestion3, setInterviewOptionalQuestion3] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [questionType, setQuestionType] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isRecentFormModalOpen, setIsRecentFormModalOpen] = useState(false);
  const [isBackConfirmationModalOpen, setIsBackConfirmationModalOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const recentFormModalOpacity = useRef(new Animated.Value(0)).current;
  const backConfirmationModalOpacity = useRef(new Animated.Value(0)).current;
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const errorModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const [errorMessage, setErrorMessage] = useState('');
  const [isOptionalFieldsWarningModalOpen, setIsOptionalFieldsWarningModalOpen] = useState(false);
  const optionalFieldsWarningModalOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { language } = useLanguage();
  // Status page state for GenAI deck creation
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [statusRequestReceived, setStatusRequestReceived] = useState(false);
  const [statusGeneratingFlashcards, setStatusGeneratingFlashcards] = useState(false);
  const [statusAddingDeckAndFlashcards, setStatusAddingDeckAndFlashcards] = useState(false);
  const cancelCreationRef = useRef(false);
  const [createdDeckId, setCreatedDeckId] = useState<number | null>(null);
  const [createdFlashcardIds, setCreatedFlashcardIds] = useState<number[]>([]);

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
    if (isRecentFormModalOpen) {
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
    }
  }, [isRecentFormModalOpen]);

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
    if (isErrorModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isErrorModalOpen]);

  useEffect(() => {
    if (isSuccessModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSuccessModalOpen]);

  useEffect(() => {
    if (isOptionalFieldsWarningModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(optionalFieldsWarningModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isOptionalFieldsWarningModalOpen]);

  useEffect(() => {
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

  const handleBackPress = () => {
    setIsBackConfirmationModalOpen(true);
  };

  const handleUseMostRecentFormPress = () => {
    setIsRecentFormModalOpen(true);
  };

  const handleClearAllPress = () => {
    // Reset all form fields to initial values
    setDeckName('');
    // Study mandatory fields
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    // Study optional fields
    setStudyOptionalQuestion1('');
    setStudyOptionalQuestion2('');
    setStudyOptionalQuestion3('');
    // Interview mandatory fields
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    // Interview optional fields
    setInterviewOptionalQuestion1('');
    setInterviewOptionalQuestion2('');
    setInterviewOptionalQuestion3('');
    // Common fields
    setNumberOfQuestions(1);
    setQuestionType([]);
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsMandatory(!isRightSide);
    
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const isStudyMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      // When adding flashcards to existing deck, only need the study questions
      return studyMandatoryQuestion1.trim() !== '' && 
             studyMandatoryQuestion2.trim() !== '';
    }
    // When creating new deck, need deck name and study questions
    return deckName.trim() !== '' && 
           studyMandatoryQuestion1.trim() !== '' && 
           studyMandatoryQuestion2.trim() !== '';
  };

  const isInterviewMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {  
      // When adding flashcards to existing deck, only need the interview questions
      return interviewMandatoryQuestion1.trim() !== '' && 
             interviewType !== '' 
    }
    // When creating new deck, need deck name and interview questions
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '' 
  };

  const isStudyOptionalFieldsFilled = () => {
    return studyOptionalQuestion1.trim() !== '' && 
           studyOptionalQuestion2.trim() !== '' && 
           studyOptionalQuestion3.trim() !== '' && 
           questionType.length > 0;
  };

  const isInterviewOptionalFieldsFilled = () => {
    return interviewOptionalQuestion1.trim() !== '' && 
           interviewOptionalQuestion2.trim() !== '' && 
           interviewOptionalQuestion3.trim() !== '' && 
           questionType.length > 0;
  };

  const isSubmitDisabled = () => {
    return false; // Always enabled now
  };

  const validateFormSubmission = async () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const optionalFieldsFilled = mode === 'study' ? isStudyOptionalFieldsFilled() : isInterviewOptionalFieldsFilled();

    // Check if deck name already exists (only for new deck creation, not when adding to existing deck)
    if (!isInViewFlashcardsPage && deckName.trim() !== '') {
      const deckNameExists = await checkDeckNameExists(deckName.trim());
      if (deckNameExists) {
        setShowToast(true);
        setToastMessage(TOAST_MESSAGES.deckNameInUse[language] || TOAST_MESSAGES.deckNameInUse.English);
        return false;
      }
    }

    // Validate studyMandatoryQuestion2 format for study mode
    if (mode === 'study' && studyMandatoryQuestion2.trim() !== '') {
      const subjects = studyMandatoryQuestion2.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty subjects after splitting and trimming
      const hasEmptySubjects = subjects.some(subject => subject === '');
      
      // Check if there are any subjects that are just whitespace or special characters
      const hasInvalidSubjects = subjects.some(subject => 
        subject === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(subject) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptySubjects || hasInvalidSubjects) {
        setShowToast(true);
        setToastMessage(TOAST_MESSAGES.invalidSubjects[language] || TOAST_MESSAGES.invalidSubjects.English);
        return false;
      }
    }

    // Validate studyOptionalQuestion1 (topics) format for study mode
    if (mode === 'study' && studyOptionalQuestion1.trim() !== '') {
      const topics = studyOptionalQuestion1.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty topics after splitting and trimming
      const hasEmptyTopics = topics.some(topic => topic === '');
      
      // Check if there are any topics that are just whitespace or special characters
      // Check if there are any subjects that are just whitespace or special characters
      const hasInvalidTopics = topics.some(topic => 
        topic === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(topic) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptyTopics || hasInvalidTopics) {
        setShowToast(true);
        setToastMessage(TOAST_MESSAGES.invalidTopics[language] || TOAST_MESSAGES.invalidTopics.English);
        return false;
      }
    }

    // Validate studyOptionalQuestion2 (subtopics) format for study mode
    if (mode === 'study' && studyOptionalQuestion2.trim() !== '') {
      const subtopics = studyOptionalQuestion2.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty subtopics after splitting and trimming
      const hasEmptySubtopics = subtopics.some(subtopic => subtopic === '');
      
      // Check if there are any subtopics that are just whitespace or special characters
      const hasInvalidSubtopics = subtopics.some(subtopic => 
        subtopic === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(subtopic) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptySubtopics || hasInvalidSubtopics) {
        setShowToast(true);
        setToastMessage(TOAST_MESSAGES.invalidSubtopics[language] || TOAST_MESSAGES.invalidSubtopics.English);
        return false;
      }
    }

    // Validate interviewOptionalQuestion3 (topics) format for interview mode
    if (mode === 'interview' && interviewOptionalQuestion3.trim() !== '') {
      const topics = interviewOptionalQuestion3.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty topics after splitting and trimming
      const hasEmptyTopics = topics.some(topic => topic === '');
      
      // Check if there are any topics that are just whitespace or special characters
      const hasInvalidTopics = topics.some(topic => 
        topic === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(topic) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptyTopics || hasInvalidTopics) {
        setShowToast(true);
        setToastMessage(TOAST_MESSAGES.invalidTopics[language] || TOAST_MESSAGES.invalidTopics.English);
        return false;
      }
    }

    // Validate that the number of question types does not exceed the number of questions
    if (questionType.length > numberOfQuestions) {
      setShowToast(true);
      setToastMessage(TOAST_MESSAGES.insufficientQuestions[language] || TOAST_MESSAGES.insufficientQuestions.English);
      return false;
    }

    // Case 1: Mandatory fields and optional fields not filled up
    if (!mandatoryFieldsFilled) {
      setErrorMessage("All mandatory fields must be filled up!");
      setIsErrorModalOpen(true);
      return false;
    }

    // Case 2: Mandatory fields filled up but optional fields not filled up
    if (mandatoryFieldsFilled && !optionalFieldsFilled) {
      setIsOptionalFieldsWarningModalOpen(true);
      return false;
    }

    // Case 3: Mandatory fields and optional fields both filled up
    setIsSuccessModalOpen(true);
    return true;
  };

  const handleSubmit = async () => {
    await validateFormSubmission();
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

  const handleDismissErrorModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(errorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsErrorModalOpen(false);
    });
  };

  const handleDismissSuccessModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSuccessModalOpen(false);
    });
  };

  const callGenAIFlashcardsGeneration = async () => {
    const formData = {
      mode,
      deckName,
      studyMandatoryQuestion1, // education level
      studyMandatoryQuestion2, // subjects
      studyOptionalQuestion1, // topics
      studyOptionalQuestion2, // subtopics
      studyOptionalQuestion3, // exam
      interviewMandatoryQuestion1, // role
      interviewOptionalQuestion1, // company
      interviewOptionalQuestion2, // experience level
      interviewOptionalQuestion3, // topics
      numberOfQuestions,
      interviewType,
      questionType, // cognitive qn types
    };
    try {
      const { isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled } = await getUserQuestionSettings();
      const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
        isMcqEnabled,
        isClozeEnabled,
        isVoiceRecordedEnabled,
        interviewType,
        numberOfQuestions,
        questionType // this is the allowed cognitive types
      );

      var prompt = ""
      if (mode === 'interview' && language === 'English') {
        prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`
        if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
          prompt += `The company I am preparing my interview for is ${interviewOptionalQuestion1}.\n`
        }
        if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
          prompt += `The experience level for this position is ${interviewOptionalQuestion2}.\n`
        }
        if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
          prompt += `The topics I would like to focus on are ${interviewOptionalQuestion3}.\n`
        }
      }
      if (mode === 'interview' && language === 'Chinese') {
        prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n `
        if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
          prompt += `我准备面试的公司是${interviewOptionalQuestion1}。\n`
        }
        if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
          prompt += `这个职位的经验水平是${interviewOptionalQuestion2}。\n`
        }
        if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
          prompt += `我想要聚焦的领域是${interviewOptionalQuestion3}。\n`
        }
      }
      if (mode === 'study' && language === 'English') {
        prompt += `I am studying for ${studyMandatoryQuestion2} and my education level is ${studyMandatoryQuestion1}.\n`
        if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
          prompt += `The topics I would like to study are ${studyOptionalQuestion1}.\n`
        }
        if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
          prompt += `The subtopics I would like to focus on are ${studyOptionalQuestion2}.\n`
        }
        if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
          prompt += `The exam I am preparing for is ${studyOptionalQuestion3}.\n`
        }
      }
      if (mode === 'study' && language === 'Chinese') { 
        prompt += `我正在准备${studyMandatoryQuestion2}考试，我的教育水平是${studyMandatoryQuestion1}。\n`
        if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
          prompt += `我想要学习的领域是${studyOptionalQuestion1}。\n`
        }
        if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
          prompt += `我想要聚焦的子领域是${studyOptionalQuestion2}。\n`
        }
        if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
          prompt += `我正在准备${studyOptionalQuestion3}考试。\n`
        }
      }
      if (distributionOfFlashcards) {   
        if (language === 'English') {
          for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
            prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`
            prompt += `${promptAndData[flashcardType as keyof typeof promptAndData].prompt}\n`
          }
        } 
        if (language === 'Chinese') {
          for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
            prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`
            prompt += `${promptAndDataChinese[flashcardType as keyof typeof promptAndDataChinese].prompt}\n`
          }
        }
      }
      if (language === 'English' && mode === 'interview') { 
        prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n"
        prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
      }
      if (language === 'Chinese' && mode === 'interview') { 
        prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n"
        prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
      }
      if (language === 'English' && mode === 'study') { 
        prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n"
        prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
      }
      if (language === 'Chinese' && mode === 'study') { 
        prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n"
        prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
      }
      console.log("prompt >>>> \n", prompt);
      let response;
      try {
        response = await fetch('https://esbkgdyjvysatwdlkegc.functions.supabase.co/genAIFlashcardsGeneration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYmtnZHlqdnlzYXR3ZGxrZWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MTUyNjEsImV4cCI6MjA2NzE5MTI2MX0.nBYgPc1DnmUSmLVGtAlfS84bxgp5k_ETLS0c4vl2mWc',
          },
          body: JSON.stringify({prompt}),
        });
      } catch (networkError) {
        Alert.alert('Error', ERROR_MESSAGES.network[language] || ERROR_MESSAGES.network.English);
        return null;
      }
      console.log("fetch complete, status:", response.status);
      if (!response.ok) {
        let message = '';
        switch (response.status) {
          case 400:
            message = ERROR_MESSAGES[400][language] || ERROR_MESSAGES[400].English;
            break;
          case 401:
            message = ERROR_MESSAGES[401][language] || ERROR_MESSAGES[401].English;
            break;
          case 403:
            message = ERROR_MESSAGES[403][language] || ERROR_MESSAGES[403].English;
            break;
          case 404:
            message = ERROR_MESSAGES[404][language] || ERROR_MESSAGES[404].English;
            break;
          case 500:
            message = ERROR_MESSAGES[500][language] || ERROR_MESSAGES[500].English;
            break;
          case 502:
            message = ERROR_MESSAGES[502][language] || ERROR_MESSAGES[502].English;
            break;
          case 503:
            message = ERROR_MESSAGES[503][language] || ERROR_MESSAGES[503].English;
            break;
          default:
            message = ERROR_MESSAGES.default[language] || ERROR_MESSAGES.default.English;
        }
        Alert.alert('Error', message);
        return null;
      }
      const data = await response.json();
      console.log("DATA >>>>>>>>>>>>>>>>> ", data);
      let flashcards = data.flashcards?.flashcards ?? data.flashcards;

      // If it's a single object, wrap in array
      if (flashcards && !Array.isArray(flashcards)) {
        flashcards = [flashcards];
      }

      console.log("FLASHCARDS >>>>>>>>>>>>>>>>> \n", flashcards);
      return flashcards;
    } catch (error: any) {
      Alert.alert('Error', (error.message && typeof error.message === 'string') ? error.message : (ERROR_MESSAGES.default[language] || ERROR_MESSAGES.default.English));
    }
  };

  const handleSuccessConfirm = async () => {
    cancelCreationRef.current = false;
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsSuccessModalOpen(false);
      setShowStatusPage(true);
      setStatusGeneratingFlashcards(false);
      setStatusAddingDeckAndFlashcards(false);
      const now = new Date().toISOString();
      await saveUserGenAIFormEntry({
        deckName,
        formEntryType: mode === 'study' ? 'study' : 'interview',
        formEntryMethod: 'genAIForm',
        formSubmissionDate: now,
        numberOfQuestions,
        kindsOfQuestions: JSON.stringify(questionType),
        studyEducationLevel: studyMandatoryQuestion1,
        studySubjects: studyMandatoryQuestion2,
        studyTopics: studyOptionalQuestion1,
        studySubtopics: studyOptionalQuestion2,
        studyExam: studyOptionalQuestion3,
        interviewJobRole: interviewMandatoryQuestion1,
        interviewType,
        interviewCompany: interviewOptionalQuestion1,
        interviewExperienceLevel: interviewOptionalQuestion2,
        interviewTopics: interviewOptionalQuestion3
      });
      setTimeout(async () => {
        if (cancelCreationRef.current) return;
        const flashcards = await callGenAIFlashcardsGeneration();
        if (cancelCreationRef.current) return;
        setStatusRequestReceived(true);
        if (cancelCreationRef.current) return;
        if (flashcards && Array.isArray(flashcards) && flashcards.length > 0) {
          setTimeout(async () => {
            if (cancelCreationRef.current) return;
            setStatusGeneratingFlashcards(true);
            let newDeckId: number | null = null;
            if (isInIndexPage) {
              const result = await createDeckWithGenAIFlashcards({
                deckName,
                mode: mode === 'study' ? 'study' : 'interview',
                formFields: {
                  studyEducationLevel: studyMandatoryQuestion1,
                  studySubjects: studyMandatoryQuestion2,
                  studyTopics: studyOptionalQuestion1,
                  studySubtopics: studyOptionalQuestion2,
                  studyExam: studyOptionalQuestion3,
                  interviewJobRole: interviewMandatoryQuestion1,
                  interviewType,
                  interviewCompany: interviewOptionalQuestion1,
                  interviewExperienceLevel: interviewOptionalQuestion2,
                  interviewTopics: interviewOptionalQuestion3,
                  numberOfQuestions,
                  kindsOfQuestions: JSON.stringify(questionType)
                },
                flashcards
              });
              newDeckId = result.deckId || null;
            }
            if (isInFavoritesPage) {
              const result = await createDeckWithGenAIFlashcards({
                deckName,
                mode: mode === 'study' ? 'study' : 'interview',
                formFields: {
                  studyEducationLevel: studyMandatoryQuestion1,
                  studySubjects: studyMandatoryQuestion2,
                  studyTopics: studyOptionalQuestion1,
                  studySubtopics: studyOptionalQuestion2,
                  studyExam: studyOptionalQuestion3,
                  interviewJobRole: interviewMandatoryQuestion1,
                  interviewType,
                  interviewCompany: interviewOptionalQuestion1,
                  interviewExperienceLevel: interviewOptionalQuestion2,
                  interviewTopics: interviewOptionalQuestion3,
                  numberOfQuestions,
                  kindsOfQuestions: JSON.stringify(questionType)
                },
                flashcards,
                isFavorited: 1
              });
              newDeckId = result.deckId || null;
            }
            if (isInViewDecksInFolderPage) {
              const result = await createDeckWithGenAIFlashcards({
                deckName,
                mode: mode === 'study' ? 'study' : 'interview',
                formFields: {
                  studyEducationLevel: studyMandatoryQuestion1,
                  studySubjects: studyMandatoryQuestion2,
                  studyTopics: studyOptionalQuestion1,
                  studySubtopics: studyOptionalQuestion2,
                  studyExam: studyOptionalQuestion3,
                  interviewJobRole: interviewMandatoryQuestion1,
                  interviewType,
                  interviewCompany: interviewOptionalQuestion1,
                  interviewExperienceLevel: interviewOptionalQuestion2,
                  interviewTopics: interviewOptionalQuestion3,
                  numberOfQuestions,
                  kindsOfQuestions: JSON.stringify(questionType)
                },
                flashcards,
                folderIDs: `[${folderId}]`
              });
              newDeckId = result.deckId || null;
            }
            if (newDeckId) setCreatedDeckId(newDeckId);
            if (isInViewFlashcardsPage) {
              const result = await createGenAIFlashcardsForDeck({
                deckId: Number(deckId),
                flashcards
              });
              // Get the IDs of the newly created flashcards
              if (result && result.flashcardIds) setCreatedFlashcardIds(result.flashcardIds);
            }
            if (cancelCreationRef.current) return;
            setStatusAddingDeckAndFlashcards(true);
            setTimeout(() => {
              setShowStatusPage(false);
              if (!cancelCreationRef.current) {
                router.back();
              }
            }, 1200);
          }, 900);
        } else {
          setShowStatusPage(false);
          // router.back();
        }
      }, 900);
    });
  };

  const handleOptionalFieldsWarningConfirm = async () => {
    cancelCreationRef.current = false;
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(optionalFieldsWarningModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsOptionalFieldsWarningModalOpen(false);
      setShowStatusPage(true);
      setStatusGeneratingFlashcards(false);
      setStatusAddingDeckAndFlashcards(false);
      const now = new Date().toISOString();
      await saveUserGenAIFormEntry({
        deckName,
        formEntryType: mode === 'study' ? 'study' : 'interview',
        formEntryMethod: 'genAIForm',
        formSubmissionDate: now,
        numberOfQuestions,
        kindsOfQuestions: JSON.stringify(questionType),
        studyEducationLevel: studyMandatoryQuestion1,
        studySubjects: studyMandatoryQuestion2,
        studyTopics: studyOptionalQuestion1,
        studySubtopics: studyOptionalQuestion2,
        studyExam: studyOptionalQuestion3,
        interviewJobRole: interviewMandatoryQuestion1,
        interviewType,
        interviewCompany: interviewOptionalQuestion1,
        interviewExperienceLevel: interviewOptionalQuestion2,
        interviewTopics: interviewOptionalQuestion3
      });
      setTimeout(async () => {
        if (cancelCreationRef.current) return;
        setStatusRequestReceived(true);
        const flashcards = await callGenAIFlashcardsGeneration();
        if (cancelCreationRef.current) return;
        if (flashcards && Array.isArray(flashcards) && flashcards.length > 0) {
          setTimeout(async () => {
            if (cancelCreationRef.current) return;
            setStatusGeneratingFlashcards(true);
            let newDeckId: number | null = null;
            if (isInIndexPage) {
              const result = await createDeckWithGenAIFlashcards({
                deckName,
                mode: mode === 'study' ? 'study' : 'interview',
                formFields: {
                  studyEducationLevel: studyMandatoryQuestion1,
                  studySubjects: studyMandatoryQuestion2,
                  studyTopics: studyOptionalQuestion1,
                  studySubtopics: studyOptionalQuestion2,
                  studyExam: studyOptionalQuestion3,
                  interviewJobRole: interviewMandatoryQuestion1,
                  interviewType,
                  interviewCompany: interviewOptionalQuestion1,
                  interviewExperienceLevel: interviewOptionalQuestion2,
                  interviewTopics: interviewOptionalQuestion3,
                  numberOfQuestions,
                  kindsOfQuestions: JSON.stringify(questionType)
                },
                flashcards
              });
              newDeckId = result.deckId || null;
            }
            if (isInFavoritesPage) {
              const result = await createDeckWithGenAIFlashcards({
                deckName,
                mode: mode === 'study' ? 'study' : 'interview',
                formFields: {
                  studyEducationLevel: studyMandatoryQuestion1,
                  studySubjects: studyMandatoryQuestion2,
                  studyTopics: studyOptionalQuestion1,
                  studySubtopics: studyOptionalQuestion2,
                  studyExam: studyOptionalQuestion3,
                  interviewJobRole: interviewMandatoryQuestion1,
                  interviewType,
                  interviewCompany: interviewOptionalQuestion1,
                  interviewExperienceLevel: interviewOptionalQuestion2,
                  interviewTopics: interviewOptionalQuestion3,
                  numberOfQuestions,
                  kindsOfQuestions: JSON.stringify(questionType)
                },
                flashcards,
                isFavorited: 1
              });
              newDeckId = result.deckId || null;
            }
            if (isInViewDecksInFolderPage) {
              const result = await createDeckWithGenAIFlashcards({
                deckName,
                mode: mode === 'study' ? 'study' : 'interview',
                formFields: {
                  studyEducationLevel: studyMandatoryQuestion1,
                  studySubjects: studyMandatoryQuestion2,
                  studyTopics: studyOptionalQuestion1,
                  studySubtopics: studyOptionalQuestion2,
                  studyExam: studyOptionalQuestion3,
                  interviewJobRole: interviewMandatoryQuestion1,
                  interviewType,
                  interviewCompany: interviewOptionalQuestion1,
                  interviewExperienceLevel: interviewOptionalQuestion2,
                  interviewTopics: interviewOptionalQuestion3,
                  numberOfQuestions,
                  kindsOfQuestions: JSON.stringify(questionType)
                },
                flashcards,
                folderIDs: `[${folderId}]`
              });
              newDeckId = result.deckId || null;
            }
            if (newDeckId) setCreatedDeckId(newDeckId);
            if (isInViewFlashcardsPage) {
              const result = await createGenAIFlashcardsForDeck({
                deckId: Number(deckId),
                flashcards
              });
              // Get the IDs of the newly created flashcards
              if (result && result.flashcardIds) setCreatedFlashcardIds(result.flashcardIds);
            }
            if (cancelCreationRef.current) return;
            setStatusAddingDeckAndFlashcards(true);
            setTimeout(() => {
              setShowStatusPage(false);
              if (!cancelCreationRef.current) {
                router.back();
              }
            }, 1200);
          }, 900);
        } else {
          setShowStatusPage(false);
          // router.back();
        }
      }, 900);
    });
  };

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    30;

  const mandatoryOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const optionalOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (showStatusPage) {
    return (
      <DeckCreationStatusPage
        statusRows={[
          { done: statusRequestReceived, label: language === 'Chinese' ? '请求已收到' : 'Request received' },
          { done: statusGeneratingFlashcards, label: statusGeneratingFlashcards ? (language === 'Chinese' ? '成功生成闪卡' : 'Successfully generated flashcards') : (language === 'Chinese' ? '正在生成闪卡' : 'Generating flashcards') },
          { done: statusAddingDeckAndFlashcards, label: statusAddingDeckAndFlashcards
              ? (isInViewFlashcardsPage
                  ? (language === 'Chinese' ? '已添加闪卡到卡组' : 'Successfully Added\nflashcards to deck')
                  : (language === 'Chinese' ? '成功添加闪卡和卡组' : 'Successfully added\nflashcards and deck'))
              : (isInViewFlashcardsPage
                  ? (language === 'Chinese' ? '正在添加闪卡到卡组' : 'Adding flashcards to deck')
                  : (language === 'Chinese' ? '正在添加闪卡和卡组' : 'Adding flashcards\nand deck')) }
        ]}
        isInViewFlashcardsPage={isInViewFlashcardsPage === 'true'}
        onCancel={async () => {
          cancelCreationRef.current = true;
          setShowStatusPage(false);
          if (createdDeckId && !isInViewFlashcardsPage) {
            await import('../db/decks').then(db => db.deleteDeck(createdDeckId));
          }
          if (isInViewFlashcardsPage && createdFlashcardIds.length > 0) {
            await import('../db/decks').then(db => db.deleteFlashcardsByIds(createdFlashcardIds));
          }
        }}
      />
    );
  }

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
      
      <View style={styles.headerIconsContainer}>
        <FormHeaderIcons 
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
          onClearAllPress={handleClearAllPress}
        />
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel={language === 'Chinese' ? '必填' : 'Mandatory'}
            rightLabel={language === 'Chinese' ? '选填' : 'Optional'}
            onToggle={handleToggle}
          />
        </View>
        <ScrollView 
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex', gap: getFormContentGap(isInViewFlashcardsPage === 'true')}
          ]}>
            {isMandatory && (
              <View style={[{gap: getFormContentGap(isInViewFlashcardsPage === 'true')}]}>
                {!isInViewFlashcardsPage && (                
                  <TitleTextBar
                  title={language === 'Chinese' ? '卡组名称' : ' Deck Name'}
                  highlightedWord={mode === 'study' ? (language === 'Chinese' ? '学习' : 'Study') : (language === 'Chinese' ? '面试' : 'Interview')}
                  placeholder={language === 'Chinese' ? '请输入！' : 'Type here!'}
                  value={deckName}
                  onChangeText={setDeckName}
                />)}
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label={language === 'Chinese' ? '1. 教育水平？' : '1. Education Level?'}
                      placeholder={language === 'Chinese' ? '例如：大一，大二等' : 'e.g. Freshman, Sophomore, etc'}
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText={language === 'Chinese' ? '你的准备是针对哪个教育水平？' : 'What education level is your preparation for?'}
                    />
                    <QuestionTextBar
                      label={language === 'Chinese' ? '2. 科目？' : '2. Subject(s)?'}
                      placeholder={language === 'Chinese' ? '例如：计算机科学，数学，物理等' : 'e.g. Computer Science, Math, Physics, etc.'}
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText={language === 'Chinese' ? '这个卡组是针对哪些科目？请用逗号分隔，例如：无机化学，有机化学等。' : 'What subject(s) would this deck be for? Provide your answer in a comma separated list, e.g Inorganic Chemistry, Organic Chemistry, etc.'}
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                  <QuestionTextBar
                    label={language === 'Chinese' ? '1. 职位/角色？' : '1. Job/Role?'}
                    placeholder={language === 'Chinese' ? '例如：前端开发，私募股权分析师等' : 'e.g. Frontend Developer, Private Equity Analyst, etc'}
                    value={interviewMandatoryQuestion1}
                    onChangeText={setInterviewMandatoryQuestion1}
                    helperText={language === 'Chinese' ? '你正在准备什么职位或角色？' : 'What job or role are you preparing for?'}
                    />
                  <TypeOfInterviewQn
                    value={interviewType}
                    onValueChange={setInterviewType}
                  />
                  </>
                  
                )}
                <NumberOfQuestions
                  title={language === 'Chinese' ? '3. 题目数量：' : '3. Number of questions:'}
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
          </Animated.View>

          <Animated.View style={[
            { opacity: optionalOpacity, display: !isMandatory ? 'flex' : 'none', gap: getFormContentGap(isInViewFlashcardsPage === 'true')}
          ]}>
            {!isMandatory && mode === 'study' && (
              <View style={[{gap: getFormContentGap(isInViewFlashcardsPage === 'true')}]}>
                <QuestionTextBar
                  label={language === 'Chinese' ? '1. 主题？' : '1. Topic(s)?'}
                  placeholder={language === 'Chinese' ? '例如：微观经济学，电磁学等' : 'e.g. Microeconomics, Electromagnetism, etc'}
                  value={studyOptionalQuestion1}
                  onChangeText={setStudyOptionalQuestion1}
                  helperText={language === 'Chinese' ? '你想学习哪些主题？请用逗号分隔，例如：微观经济学，电磁学等。' : 'Which topics would you like to study? Provide your answer in a comma separated list, e.g Microeconomics, Electromagnetism, etc'}
                />
                <QuestionTextBar
                  label={language === 'Chinese' ? '2. 子主题？' : '2. Subtopic(s)?'}
                  placeholder={language === 'Chinese' ? '例如：供需关系等' : 'e.g. Demand and Supply, etc'}
                  value={studyOptionalQuestion2}
                  onChangeText={setStudyOptionalQuestion2}
                  helperText={language === 'Chinese' ? '你想专注于哪些子主题？请用逗号分隔，例如：供需关系等。' : 'Which subtopics would you like to focus on? Provide your answer in a comma separated list, e.g Demand and Supply, etc'}
                />
                <QuestionTextBar
                  label={language === 'Chinese' ? '3. 考试/测验？' : '3. Exam/Quiz?'}
                  placeholder={language === 'Chinese' ? '例如：SAT，ACT，GRE等' : 'e.g. SAT, ACT, GRE, etc'}
                  value={studyOptionalQuestion3}
                  onChangeText={setStudyOptionalQuestion3}
                  helperText={language === 'Chinese' ? '你想为哪些考试或测验学习？' : 'What exam or quiz would you like to study for?'}
                />
                <KindsOfQuestions
                    value={questionType}
                    onValueChange={(value) => setQuestionType(value)}
                    onHelpPress={() => setIsHelpModalOpen(true)}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
            {!isMandatory && mode === 'interview' && (
              <View style={[{gap: getFormContentGap(isInViewFlashcardsPage === 'true')}]}>
                <QuestionTextBarWithDropdown
                  label={language === 'Chinese' ? '1. 公司？' : '1. Company?'}
                  placeholder={language === 'Chinese' ? '例如：谷歌，Meta，微软等' : 'e.g. Google, Meta, Microsoft, etc'}
                  value={interviewOptionalQuestion1}
                  onChangeText={setInterviewOptionalQuestion1}
                  helperText={language === 'Chinese' ? '你正在准备面试哪家公司？' : 'Which company are you preparing to interview with?'}
                  showDropdown={true}
                />
                <QuestionTextBar
                  label={language === 'Chinese' ? '2. 经验水平？' : '2. Experience Level?'}
                  placeholder={language === 'Chinese' ? '例如：初级开发者，高级开发者等' : 'e.g. Junior Developer, Senior Developer, etc'}
                  value={interviewOptionalQuestion2}
                  onChangeText={setInterviewOptionalQuestion2}
                  helperText={language === 'Chinese' ? '你的面试是针对哪个经验水平？' : 'Which experience level is your interview for?'}
                />
                <QuestionTextBar
                  label={language === 'Chinese' ? '3. 主题？' : '3. Topic(s)?'}
                  placeholder={language === 'Chinese' ? '例如：React，Java，操作系统等' : 'e.g. React, Java, Operating Systems, etc'}
                  value={interviewOptionalQuestion3}
                  onChangeText={setInterviewOptionalQuestion3}
                  helperText={language === 'Chinese' ? '你想专注于哪些主题？' : 'Which topics would you like to focus on?'}
                />
                <KindsOfQuestions
                    value={questionType}
                    onValueChange={(value) => setQuestionType(value)}
                    onHelpPress={() => setIsHelpModalOpen(true)}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[
          styles.buttonContainer,
          { bottom: bottomOffset }
        ]}>
          <ActionButton
            text={language === 'Chinese' ? '提交' : 'Submit'}
            backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
            onPress={handleSubmit}
            disabled={isSubmitDisabled()}
            fullWidth
          />
        </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isRecentFormModalOpen || isBackConfirmationModalOpen || isErrorModalOpen || isSuccessModalOpen || isOptionalFieldsWarningModalOpen}
        opacity={overlayOpacity}
        onPress={isRecentFormModalOpen ? handleDismissRecentForm : (isHelpModalOpen ? handleDismissHelp : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : (isErrorModalOpen ? handleDismissErrorModal : (isSuccessModalOpen ? handleDismissSuccessModal : handleOptionalFieldsWarningConfirm))))}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={language === 'Chinese' ? '我们的团队根据布鲁姆的认知分类法确定了7种主要的认知问题类型，以帮助您的学习。请访问我们的网站了解更多信息。' : 'Our team has identified 7 main types of cognitive questions based on Bloom\'s taxonomy to help with your learning. Visit our website to learn more.'}
        buttons='none'
        textStyle={{
          highlightWord: language === 'Chinese' ? '网站' : 'our website',
          highlightColor: "#44B88A"
        }}
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={language === 'Chinese' ? ['使用最近的', '表单条目?'] : ['Use most recent', 'form entry?']}
        buttons='double'
        onConfirm={async () => {
          const entry = await getMostRecentGenAIFormEntry(mode as 'study' | 'interview');
          console.log("entry", entry);
          if (entry) {
            setDeckName(entry.deckName || '');
            setNumberOfQuestions(entry.numberOfQuestions || 1);
            setQuestionType(entry.kindsOfQuestions ? JSON.parse(entry.kindsOfQuestions) : []);
            setStudyMandatoryQuestion1(entry.studyEducationLevel || '');
            setStudyMandatoryQuestion2(entry.studySubjects || '');
            setStudyOptionalQuestion1(entry.studyTopics || '');
            setStudyOptionalQuestion2(entry.studySubtopics || '');
            setStudyOptionalQuestion3(entry.studyExam || '');
            setInterviewMandatoryQuestion1(entry.interviewJobRole || '');
            setInterviewType(entry.interviewType || '');
            setInterviewOptionalQuestion1(entry.interviewCompany || '');
            setInterviewOptionalQuestion2(entry.interviewExperienceLevel || '');
            setInterviewOptionalQuestion3(entry.interviewTopics || '');
          }
          handleDismissRecentForm();
        }}
        onCancel={handleDismissRecentForm}
      />
      <GenericModal
        visible={isBackConfirmationModalOpen}
        opacity={backConfirmationModalOpacity}
        text={language === 'Chinese' ? ['你确定要离开吗？', '所有进度将丢失'] : ['Are you sure you want', 'to leave? All your', 'progress will be lost']}
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
        visible={isErrorModalOpen}
        opacity={errorModalOpacity}
        text={language === 'Chinese' ? '所有必填项都必须填写！' : errorMessage}
        buttons="none"
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isOptionalFieldsWarningModalOpen}
        opacity={optionalFieldsWarningModalOpacity}
        text={language === 'Chinese' ? '未填写所有可选项就提交表单？' : 'Submit form without filling up all optional fields?'}
        buttons="double"
        onCancel={handleOptionalFieldsWarningConfirm}
        onConfirm={handleOptionalFieldsWarningConfirm}
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isSuccessModalOpen}
        opacity={successModalOpacity}
        text={language === 'Chinese' ? '太棒了！😊 要继续提交吗？' : 'Great! 😊 Do you want to go ahead and submit?'}
        buttons="double"
        onCancel={handleDismissSuccessModal}
        onConfirm={handleSuccessConfirm}
      />
      
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        duration={3000}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20, // button height (72) + padding top (20)
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  buttonContainer: {
    position: 'absolute',
    paddingTop: Dimensions.get('window').height < 670 ? 10 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
}); 