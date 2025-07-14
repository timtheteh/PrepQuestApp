import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Text, Dimensions, TextInput, AppState, AppStateStatus } from 'react-native';
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
import React, { useState, useEffect, useRef } from 'react';
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
import { createManualDeck, createFlashcardsFromCache, checkDeckNameExists, getMostRecentManualFormEntry, getDeckNameById } from '../db/decks';
import { db } from '../db/index';
import { Toast } from '../components/Toast';
import DeckCreationLoadingPage from './DeckCreationLoadingPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
// import BackgroundService from 'react-native-background-actions';


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

// Add language mappings for all user-facing strings
const STRINGS = {
  mandatory: { English: 'Mandatory', Chinese: '必填' },
  manual: { English: 'Manual', Chinese: '手动添加' },
  deckName: { English: ' Deck Name', Chinese: '卡组名称' },
  study: { English: 'Study', Chinese: '学习' },
  interview: { English: 'Interview', Chinese: '面试' },
  typeHere: { English: 'Type here!', Chinese: '请在此输入！' },
  educationLevel: { English: '1. Education Level?', Chinese: '1. 教育程度？' },
  educationLevelPH: { English: 'e.g. Freshman, Sophomore, etc', Chinese: '例如：大一，大二等' },
  educationLevelHelper: { English: 'What education level is your preparation for?', Chinese: '你正在为哪个教育阶段做准备？' },
  subjects: { English: '2. Subject(s)?', Chinese: '2. 科目？' },
  subjectsPH: { English: 'e.g. Computer Science, Math, Physics, etc.', Chinese: '例如：计算机，数学，物理等' },
  subjectsHelper: { English: 'What subject(s) would this deck be for? Provide your answer in a comma separated list, e.g Inorganic Chemistry, Organic Chemistry, etc.', Chinese: '这个卡组适用于哪些科目？请用逗号分隔，例如：无机化学，有机化学等。' },
  exam: { English: '3. Exam/Quiz?', Chinese: '3. 考试/测验？' },
  examPH: { English: 'e.g. SAT, GRE, IB, A-Levels etc.', Chinese: '例如：SAT，GRE，IB，A-Levels等' },
  examHelper: { English: 'What exam or quiz would this deck be for?', Chinese: '这个卡组适用于哪些考试或测验？' },
  jobRole: { English: '1. Job/Role?', Chinese: '1. 职位/角色？' },
  jobRolePH: { English: 'e.g. Frontend Developer, Private Equity Analyst, etc', Chinese: '例如：前端开发，私募分析师等' },
  jobRoleHelper: { English: 'What job or role are you preparing for?', Chinese: '你正在准备什么职位或角色？' },
  experienceLevel: { English: '3. Experience Level?', Chinese: '3. 经验水平？' },
  experienceLevelPH: { English: 'e.g. Mid-Level, Senior, etc', Chinese: '例如：中级，高级等' },
  experienceLevelHelper: { English: 'What experience level is your interview for?', Chinese: '你的面试是针对什么经验水平？' },
  submitFormWithCards: { English: 'Submit Form With Cards?', Chinese: '提交表单和卡片？' },
  moveToNextCard: { English: 'Move To\nNext Card?', Chinese: '移动到\n下一张卡片？' },
  select: { English: 'Select', Chinese: '选择' },
  selectAll: { English: 'Select All', Chinese: '全选' },
  cancel: { English: 'Cancel', Chinese: '取消' },
  noFlashcards: { English: 'No flashcards added\nat the moment!', Chinese: '当前没有添加卡片！' },
  inProgress: { English: 'In Progress...', Chinese: '进行中...' },
  image: { English: '<Image>', Chinese: '<图片>' },
  voice: { English: '<Voice Recording>', Chinese: '<语音录音>' },
  drawing: { English: '<Drawing>', Chinese: '<绘图>' },
  deckNameInUse: { English: 'Deckname already in use', Chinese: '卡组名称已被使用' },
  invalidSubjects: { English: "Invalid form input for 'Subject(s)'", Chinese: '“科目"输入无效' },
  fillAllAndAdd: { English: 'Fill up all mandatory fields\nand add your cards before submitting!', Chinese: '请填写所有必填项并添加卡片后再提交！' },
  addBeforeSubmit: { English: 'Add your card(s)\nbefore submitting!', Chinese: '请先添加卡片再提交！' },
  fillAll: { English: 'Fill up all mandatory fields and all QA pairs for your cards!', Chinese: '请填写所有必填项和所有卡片的问答对！' },
  missingQA: { English: 'You have missing question/answer\ndata for card', Chinese: '第' },
  helpModal: { English: "Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more.", Chinese: '我们的团队基于布鲁姆认知分类法，归纳了7种主要认知题型，帮助你的学习。访问我们的网站了解更多。' },
  aiHelpModal: { English: 'Ticking this option will let AI generate new, suggested cards outside the content of your upload.', Chinese: '勾选此项将让AI生成与上传内容无关的新建议卡片。' },
  useRecent: { English: ['Use most recent', 'form entry?'], Chinese: ['使用最近的', '表单记录？'] },
  greatSubmit: { English: 'Great! 😊 Do you want to go ahead and submit?', Chinese: '太棒了！😊 是否确认提交？' },
  leaveConfirm: { English: ['Are you sure you want', 'to leave? All your', 'progress will be lost'], Chinese: ['确定要离开吗？', '所有进度将丢失'] },
  noSelection: { English: 'No selection made!', Chinese: '未选择任何卡片！' },
  selectAtLeastOne: { English: 'Select at least one flashcard to delete.', Chinese: '请至少选择一张卡片进行删除。' },
  delete: { English: 'delete', Chinese: '删除' },
  areYouSureDelete: { English: 'Are you sure you want to delete', Chinese: '确定要删除' },
  flashcard: { English: 'flashcard', Chinese: '张卡片' },
  flashcards: { English: 'flashcards', Chinese: '张卡片' },
};

export default function ManualAddDeckPage() {
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
  // Force manual state if isInViewFlashcardsPage is true
  const forceManual = isInViewFlashcardsPage === 'true';
  const [isMandatory, setIsMandatory] = useState(forceManual ? false : true);
  const [deckName, setDeckName] = useState('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [studyMandatoryQuestion3, setStudyMandatoryQuestion3] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [interviewMandatoryQuestion2, setInterviewMandatoryQuestion2] = useState('');
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
  const cardSlideAnim = useRef(new Animated.Value(0)).current;
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
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const errorModalOpacity = useRef(new Animated.Value(0)).current;
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const [errorMessage, setErrorMessage] = useState('');
  const [incompleteCardNumber, setIncompleteCardNumber] = useState<number>(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingCurrent, setLoadingCurrent] = React.useState(0);
  const [loadingTotal, setLoadingTotal] = React.useState(0);
  const [showLoadingPage, setShowLoadingPage] = React.useState(false);
  const { language } = useLanguage();
  const lang: 'English' | 'Chinese' = language === 'Chinese' ? 'Chinese' : 'English';

  // Cache for storing all created cards
  interface CachedCard {
    cardNumber: number;
    frontContent: {
      content: React.ReactNode;
      type: 'camera' | 'marker' | 'mic' | 'text' | 'none';
      audioUri?: string; // Optional audio URI for mic content
    } | null;
    backContent: {
      content: React.ReactNode;
      type: 'camera' | 'marker' | 'mic' | 'text' | 'none';
      audioUri?: string; // Optional audio URI for mic content
    } | null;
    submitted: boolean; // Track if card was submitted via "Fill up next flashcard"
  }
  
  const [cardCache, setCardCache] = useState<CachedCard[]>([]);
  const [lastEditedCardNumber, setLastEditedCardNumber] = useState<number>(1);

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    30;

  const cancelCreationRef = useRef(false);

  useEffect(() => {
    // Ensure the layout is ready after the first render
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Debug logging for received parameters
  useEffect(() => {
    console.log('🔍 manualAddDeck received parameters:', {
      mode,
      deckId,
      folderId,
      isInFavoritesPage,
      isInIndexPage,
      isInViewFlashcardsPage,
      isInViewDecksInFolderPage
    });
  }, [mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewFlashcardsPage, isInViewDecksInFolderPage]);

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
        // Always set to none for submitted cards (view mode)
        if (cachedCard.submitted) {
          setSelectedButtonType('none');
        }
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

  // Load drawing content when selectedButtonType changes to 'marker'
  useEffect(() => {
    if (selectedButtonType === 'marker' && !isMandatory && addViewState === 'add') {
      const cachedCard = cardCache.find(card => card.cardNumber === currentQuestionNumber);
      if (cachedCard) {
        // Load drawing content from the current side
        const isFlipped = flippableCardRef.current?.getIsFlipped() || false;
        const currentContent = isFlipped ? cachedCard.backContent : cachedCard.frontContent;
        if (currentContent?.type === 'marker') {
          flippableCardRef.current?.loadDrawingContent(currentContent);
        }
      }
    }
  }, [selectedButtonType, currentQuestionNumber, isMandatory, addViewState]);

  // Save card to cache when content changes
  useEffect(() => {
    if (!isMandatory && addViewState === 'add') {
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
    const hasDrawingContent = flippableCardRef.current?.hasDrawingContent();
    
    // Check for content type conflict (either regular content or drawing content)
    if ((currentContent && currentContent.type !== buttonType) || 
        (hasDrawingContent && buttonType !== 'marker')) {
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

  const handleToggle = async (isRightSide: boolean) => {
    console.log('handleToggle called - isRightSide:', isRightSide);
    console.log('Current state - isMandatory:', isMandatory, 'addViewState:', addViewState);
    
    // Save current card to cache before toggling
    if (!isMandatory && addViewState === 'add') {
      console.log('Toggling from manual to mandatory - saving drawing content');
      console.log('Current selectedButtonType:', selectedButtonType);
      console.log('Has drawing content:', flippableCardRef.current?.hasDrawingContent());
      
      // Save drawing content if it exists, then save to cache
      if (flippableCardRef.current?.saveDrawingAsContent) {
        await flippableCardRef.current.saveDrawingAsContent();
        console.log('Drawing content saved, now saving to cache');
        saveCurrentCardToCache();
      }
    } else {
      console.log('Not saving drawing content - condition not met');
    }
    
    setIsMandatory(!isRightSide);
    if (isRightSide) setAddViewState('add');
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const isStudyMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      // When adding flashcards to existing deck, only need the study questions
      return studyMandatoryQuestion1.trim() !== '' && 
             studyMandatoryQuestion2.trim() !== '' &&
             studyMandatoryQuestion3.trim() !== '';
    }
    // When creating new deck, need deck name and study questions
    return deckName.trim() !== '' && 
           studyMandatoryQuestion1.trim() !== '' && 
           studyMandatoryQuestion2.trim() !== '' &&
           studyMandatoryQuestion3.trim() !== '';
  };

  const isInterviewMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      // When adding flashcards to existing deck, only need the interview questions
      return interviewMandatoryQuestion1.trim() !== '' && 
             interviewType !== '' &&
             interviewMandatoryQuestion2.trim() !== '';
    }
    // When creating new deck, need deck name and interview questions
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '' &&
           interviewMandatoryQuestion2.trim() !== '';
  };

  const isSubmitDisabled = () => {
    return false; // Always enabled now
  };

  const validateFormSubmission = async () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const submittedCards = getSubmittedCards();
    const hasCards = submittedCards.length >= 1;

    // Check if all submitted cards have both front and back content
    const allCardsComplete = submittedCards.every(card => {
      // Check if both front and back content exist
      const hasFrontContent = card.frontContent && (
        card.frontContent.type === 'mic' ? card.frontContent.audioUri : card.frontContent.content
      );
      const hasBackContent = card.backContent && (
        card.backContent.type === 'mic' ? card.backContent.audioUri : card.backContent.content
      );
      return hasFrontContent && hasBackContent;
    });

    // Check if deck name already exists (only for new deck creation, not when adding to existing deck)
    if (!isInViewFlashcardsPage && deckName.trim() !== '') {
      const deckNameExists = await checkDeckNameExists(deckName.trim());
      if (deckNameExists) {
        setShowToast(true);
        setToastMessage(STRINGS.deckNameInUse[lang]);
        return false;
      }
    }

    if (!isInViewFlashcardsPage) {
      // Validate studyMandatoryQuestion2 format for study mode
      if (mode === 'study' && studyMandatoryQuestion2.trim() !== '') {
        // Split on any Unicode comma character
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
          setToastMessage(STRINGS.invalidSubjects[lang]);
          return false;
        }
      }

      // Error 1: mandatory fields not filled up and no cards
      if (!mandatoryFieldsFilled && !hasCards) {
        setErrorMessage(STRINGS.fillAllAndAdd[lang]);
        setIsErrorModalOpen(true);
        return false;
      }

      // Error 2: mandatory fields filled up but no cards
      if (mandatoryFieldsFilled && !hasCards) {
        setErrorMessage(STRINGS.addBeforeSubmit[lang]);
        setIsErrorModalOpen(true);
        return false;
      }

      // Error 3: mandatory fields not filled up but has cards
      if (!mandatoryFieldsFilled && hasCards) {
        setErrorMessage(STRINGS.fillAll[lang]);
        setIsErrorModalOpen(true);
        return false;
      }

      // Error 4: mandatory fields filled up and has cards BUT not all cards have content
      if (mandatoryFieldsFilled && hasCards && !allCardsComplete) {
        // Find the first incomplete card
        const incompleteCard = submittedCards.find(card => {
          // Check if both front and back content exist
          const hasFrontContent = card.frontContent && (
            card.frontContent.type === 'mic' ? card.frontContent.audioUri : card.frontContent.content
          );
          const hasBackContent = card.backContent && (
            card.backContent.type === 'mic' ? card.backContent.audioUri : card.backContent.content
          );
          return !hasFrontContent || !hasBackContent;
        });
        if (incompleteCard) {
          setIncompleteCardNumber(incompleteCard.cardNumber);
          setErrorMessage(`${STRINGS.missingQA[lang]}${incompleteCard.cardNumber}`);
          setIsErrorModalOpen(true);
          return false;
        }
      }
    }
    // Always check for cards and completeness first
    if (!hasCards) {
      setErrorMessage(STRINGS.addBeforeSubmit[lang]);
      setIsErrorModalOpen(true);
      return false;
    }
    if (!allCardsComplete) {
      // Find the first incomplete card
      const incompleteCard = submittedCards.find(card => {
        const hasFrontContent = card.frontContent && (
          card.frontContent.type === 'mic' ? card.frontContent.audioUri : card.frontContent.content
        );
        const hasBackContent = card.backContent && (
          card.backContent.type === 'mic' ? card.backContent.audioUri : card.backContent.content
        );
        return !hasFrontContent || !hasBackContent;
      });
      if (incompleteCard) {
        setIncompleteCardNumber(incompleteCard.cardNumber);
        setErrorMessage(`${STRINGS.missingQA[lang]}${incompleteCard.cardNumber}`);
        setIsErrorModalOpen(true);
        return false;
      }
    }

    // If in view flashcards mode, skip mandatory field checks
    if (isInViewFlashcardsPage === 'true') {
      // Success: all validations passed
      setIsSuccessModalOpen(true);
      return true;
    }

    // Success: all validations passed
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

  const handleNextFlashcard = async () => {
    // Save current card to cache before creating next card
    saveCurrentCardToCache();
    // Also save drawing content if it exists
    if (flippableCardRef.current?.saveDrawingAsContent) {
      await flippableCardRef.current.saveDrawingAsContent();
    }
    
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

  const handleCardFlip = async () => {
    // Save drawing content before flipping
    if (flippableCardRef.current?.saveDrawingAsContent) {
      await flippableCardRef.current.saveDrawingAsContent();
    }
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
    
    console.log('Saving to cache - frontContent:', frontContent);
    console.log('Saving to cache - backContent:', backContent);
    
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
        console.log('Updated existing card in cache:', updated[existingIndex]);
        return updated;
      } else {
        // Add new card with submitted: false
        const cachedCard: CachedCard = {
          cardNumber: currentQuestionNumber,
          frontContent: frontContent,
          backContent: backContent,
          submitted: false
        };
        console.log('Added new card to cache:', cachedCard);
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
      
      // Also load drawing content if it exists
      if (cachedCard.frontContent?.type === 'marker') {
        console.log('loading drawing content from cache');
        flippableCardRef.current.loadDrawingContent(cachedCard.frontContent);
      }
      if (cachedCard.backContent?.type === 'marker') {
        flippableCardRef.current.loadDrawingContent(cachedCard.backContent);
      }
      
      // Set the current question number
      setCurrentQuestionNumber(cardNumber);
      
      // Update content state
      const hasContent = !!(cachedCard.frontContent && cachedCard.backContent);
      setHasCardContent(hasContent);
      
      // Set the last edited card number
      setLastEditedCardNumber(cardNumber);
      
      // Reset to none state when loading existing content
      setSelectedButtonType('none');
    }
  };

  const loadCurrentCardFromCache = () => {
    const cachedCard = cardCache.find(card => card.cardNumber === currentQuestionNumber);
    console.log('Loading current card from cache:', cachedCard);
    
    if (cachedCard && flippableCardRef.current) {
      // Load the cached content
      flippableCardRef.current.loadCachedContent(cachedCard.frontContent, cachedCard.backContent);
      
      // Also load drawing content if it exists
      if (cachedCard.frontContent?.type === 'marker') {
        console.log('loading current card drawing content from cache');
        flippableCardRef.current.loadDrawingContent(cachedCard.frontContent);
      }
      if (cachedCard.backContent?.type === 'marker') {
        console.log('loading current card back drawing content from cache');
        flippableCardRef.current.loadDrawingContent(cachedCard.backContent);
      }
      
      // Update the content state
      const hasContent = !!(cachedCard.frontContent && cachedCard.backContent);
      setHasCardContent(hasContent);
      
      // Reset to none state when loading existing content
      setSelectedButtonType('none');
    } else {
      console.log('No cached card found for current question number:', currentQuestionNumber);
      // If no cached card found, reset to empty state
      if (flippableCardRef.current) {
        flippableCardRef.current.resetContent();
      }
      setHasCardContent(false);
      setSelectedButtonType('none');
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
      // Also save drawing content if it exists
      flippableCardRef.current?.saveDrawingAsContent();
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
          // Also load drawing content if it exists
          if (cachedCard.frontContent?.type === 'marker') {
            flippableCardRef.current.loadDrawingContent(cachedCard.frontContent);
          }
          if (cachedCard.backContent?.type === 'marker') {
            flippableCardRef.current.loadDrawingContent(cachedCard.backContent);
          }
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

  const navigateToPreviousCard = async () => {
    if (currentQuestionNumber > 1) {
      // Save drawing content before saving card to cache
      if (flippableCardRef.current?.saveDrawingAsContent) {
        await flippableCardRef.current.saveDrawingAsContent();
      }
      // Save current card to cache before navigating
      saveCurrentCardToCache();
      
      // Push-out animation (slide to right)
      Animated.timing(cardSlideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Navigate to previous card
        const previousCardNumber = currentQuestionNumber - 1;
        setCurrentQuestionNumber(previousCardNumber);
        
        // Load the previous card from cache
        loadCardFromCache(previousCardNumber);
        
        // Reset slide position and push-in animation (slide from left)
        cardSlideAnim.setValue(-1);
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const navigateToNextCard = async () => {
    const nextCardNumber = getNextCardNumber();
    if (currentQuestionNumber < nextCardNumber) {
      // Save drawing content before saving card to cache
      if (flippableCardRef.current?.saveDrawingAsContent) {
        await flippableCardRef.current.saveDrawingAsContent();
      }
      // Save current card to cache before navigating
      saveCurrentCardToCache();
      
      // Push-out animation (slide to left)
      Animated.timing(cardSlideAnim, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Navigate to next card
        const newCardNumber = currentQuestionNumber + 1;
        setCurrentQuestionNumber(newCardNumber);
        
        // Load the next card from cache if it exists, otherwise create new
        const cachedCard = cardCache.find(card => card.cardNumber === newCardNumber);
        if (cachedCard) {
          loadCardFromCache(newCardNumber);
        } else {
          // Create new empty card
          if (flippableCardRef.current) {
            flippableCardRef.current.resetToFront();
            flippableCardRef.current.resetContent();
          }
          setSelectedButtonType('none');
          setHasCardContent(false);
        }
        
        // Reset slide position and push-in animation (slide from right)
        cardSlideAnim.setValue(1);
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const isLeftChevronDisabled = () => {
    return currentQuestionNumber <= 1;
  };

  const isRightChevronDisabled = () => {
    const nextCardNumber = getNextCardNumber();
    return currentQuestionNumber >= nextCardNumber;
  };

  const getCardTitle = (card: CachedCard) => {
    // If the card has text content in the front, show the first 100 characters
    if (card.frontContent?.type === 'text' && card.frontContent?.content) {
      const textContent = extractTextFromContent(card.frontContent.content);
      if (textContent && textContent.length > 100) {
        return textContent.substring(0, 100) + '...';
      }
      return textContent || STRINGS.inProgress[lang];
    }

    if (card.frontContent?.type === 'camera' && card.frontContent?.content) {
      return STRINGS.image[lang]
    }
    if (card.frontContent?.type === 'mic' && card.frontContent?.audioUri) {
      return STRINGS.voice[lang]
    }
    if (card.frontContent?.type === 'marker' && card.frontContent?.content) {
      return STRINGS.drawing[lang]
    }
    
    // Default to "Card X" for other content types
    return STRINGS.inProgress[lang];
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

  const handleSuccessConfirm = async () => {
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
      setTimeout(async () => {        
        cancelCreationRef.current = false; // Reset cancel flag at start
        if (isInIndexPage === 'true') {
          const formData = {
            deckName,
            mode: mode as 'study' | 'interview',
            studyMandatoryQuestion1,
            studyMandatoryQuestion2,
            studyMandatoryQuestion3,
            interviewMandatoryQuestion1,
            interviewMandatoryQuestion2,
            interviewType
          };
          const submittedCards = getSubmittedCards();
          setLoadingTotal(submittedCards.length);
          setLoadingCurrent(0);
          setLoadingProgress(0);
          setShowLoadingPage(true);
          let createdDeckId = null;
          const deckResult = await createManualDeck(formData);
          if (deckResult.success && deckResult.deckId) {
            createdDeckId = deckResult.deckId;
            let createdCount = 0;
            for (let i = 0; i < submittedCards.length; i++) {
              if (cancelCreationRef.current) break;
              await createFlashcardsFromCache(deckResult.deckId, [submittedCards[i]]);
              createdCount++;
              setLoadingCurrent(createdCount);
              setLoadingProgress(createdCount / submittedCards.length);
            }
            // Cleanup if cancelled
            if (cancelCreationRef.current && createdDeckId) {
              await db.execAsync(`DELETE FROM flashcards WHERE deckID = ${createdDeckId}`);
              await db.execAsync(`DELETE FROM decks WHERE deckID = ${createdDeckId}`);
            }
            setTimeout(() => {
              setShowLoadingPage(false);
              if (!cancelCreationRef.current) {
                router.back();
              }
            }, 800);
            return;
          } else {
            console.error('Failed to create deck');
          }
        }
        if (isInFavoritesPage === 'true') {
          const formData = {
            deckName,
            mode: mode as 'study' | 'interview',
            studyMandatoryQuestion1,
            studyMandatoryQuestion2,
            studyMandatoryQuestion3,
            interviewMandatoryQuestion1,
            interviewMandatoryQuestion2,
            interviewType
          };
          const submittedCards = getSubmittedCards();
          setLoadingTotal(submittedCards.length);
          setLoadingCurrent(0);
          setLoadingProgress(0);
          setShowLoadingPage(true);
          let createdDeckId = null;
          const deckResult = await createManualDeck(formData);
          if (deckResult.success && deckResult.deckId) {
            createdDeckId = deckResult.deckId;
            // Update the deck to be favorited
            const userID = await getCurrentUserID();
            await db.execAsync(`
              UPDATE decks 
              SET isFavorited = 1
              WHERE deckID = ${deckResult.deckId} AND userID = '${userID}'
            `);
            let createdCount = 0;
            for (let i = 0; i < submittedCards.length; i++) {
              if (cancelCreationRef.current) break;
              await createFlashcardsFromCache(deckResult.deckId, [submittedCards[i]]);
              createdCount++;
              setLoadingCurrent(createdCount);
              setLoadingProgress(createdCount / submittedCards.length);
            }
            // Cleanup if cancelled
            if (cancelCreationRef.current && createdDeckId) {
              await db.execAsync(`DELETE FROM flashcards WHERE deckID = ${createdDeckId}`);
              await db.execAsync(`DELETE FROM decks WHERE deckID = ${createdDeckId}`);
            }
            setTimeout(() => {
              setShowLoadingPage(false);
              if (!cancelCreationRef.current) {
                router.back();
              }
            }, 800);
            return;
          } else {
            console.error('Failed to create deck');
          }
        }
        if (isInViewDecksInFolderPage === 'true') {
          const formData = {
            deckName,
            mode: mode as 'study' | 'interview',
            studyMandatoryQuestion1,
            studyMandatoryQuestion2,
            studyMandatoryQuestion3,
            interviewMandatoryQuestion1,
            interviewMandatoryQuestion2,
            interviewType
          };
          const submittedCards = getSubmittedCards();
          setLoadingTotal(submittedCards.length);
          setLoadingCurrent(0);
          setLoadingProgress(0);
          setShowLoadingPage(true);
          let createdDeckId = null;
          const deckResult = await createManualDeck(formData);
          if (deckResult.success && deckResult.deckId) {
            createdDeckId = deckResult.deckId;
            // Append the folderId to the deck's folderIDs field
            const currentFolderId = parseInt(folderId as string);
            if (currentFolderId) {
              // Get the current folderIDs for the deck
              const userID = await getCurrentUserID();
              const currentDeck = await db.getFirstAsync(`
                SELECT folderIDs FROM decks WHERE deckID = ${deckResult.deckId} AND userID = '${userID}'
              `);
              if (currentDeck) {
                const deckData = currentDeck as { folderIDs: string | null };
                let currentFolderIds: number[] = [];
                if (deckData.folderIDs) {
                  try {
                    currentFolderIds = JSON.parse(deckData.folderIDs);
                  } catch (error) {
                    console.error('Error parsing existing folderIDs:', error);
                    currentFolderIds = [];
                  }
                }
                const newFolderIds = [...new Set([...currentFolderIds, currentFolderId])];
                const newFolderIdsString = JSON.stringify(newFolderIds);
                await db.execAsync(`
                  UPDATE decks 
                  SET folderIDs = '${newFolderIdsString}'
                  WHERE deckID = ${deckResult.deckId} AND userID = '${userID}'
                `);
                console.log(`Successfully added deck ${deckResult.deckId} to folder: ${currentFolderId}`);
              }
            }
            let createdCount = 0;
            for (let i = 0; i < submittedCards.length; i++) {
              if (cancelCreationRef.current) break;
              await createFlashcardsFromCache(deckResult.deckId, [submittedCards[i]]);
              createdCount++;
              setLoadingCurrent(createdCount);
              setLoadingProgress(createdCount / submittedCards.length);
            }
            // Cleanup if cancelled
            if (cancelCreationRef.current && createdDeckId) {
              await db.execAsync(`DELETE FROM flashcards WHERE deckID = ${createdDeckId}`);
              await db.execAsync(`DELETE FROM decks WHERE deckID = ${createdDeckId}`);
            }
            setTimeout(() => {
              setShowLoadingPage(false);
              if (!cancelCreationRef.current) {
                router.back();
              }
            }, 800);
            return;
          } else {
            console.error('Failed to create deck');
          }
        }
        if (isInViewFlashcardsPage === 'true') {
          const submittedCards = getSubmittedCards();
          const currentDeckId = parseInt(deckId as string);
          if (currentDeckId) {
            setLoadingTotal(submittedCards.length);
            setLoadingCurrent(0);
            setLoadingProgress(0);
            setShowLoadingPage(true);
            const deckNameForEntry = await getDeckNameById(currentDeckId);
            let createdCount = 0;
            let newFlashcardIds: number[] = [];
            for (let i = 0; i < submittedCards.length; i++) {
              if (cancelCreationRef.current) break;
              const result = await createFlashcardsFromCache(currentDeckId, [submittedCards[i]]);
              if (result && result.flashcardIds && result.flashcardIds.length > 0) {
                newFlashcardIds.push(...result.flashcardIds);
              }
              createdCount++;
              setLoadingCurrent(createdCount);
              setLoadingProgress(createdCount / submittedCards.length);
            }
            // Cleanup if cancelled: only delete new flashcards, not all
            if (cancelCreationRef.current && newFlashcardIds.length > 0) {
              await db.execAsync(`DELETE FROM flashcards WHERE flashcardID IN (${newFlashcardIds.join(',')})`);
            }
            // if (!cancelCreationRef.current && deckNameForEntry) {
            //   const currentDate = new Date().toISOString();
            //   let studyEducationLevelForm = null;
            //   let studySubjectsForm = null;
            //   let studyExamForm = null;
            //   let interviewJobRoleForm = null;
            //   let interviewTypeForm = null;
            //   let interviewExperienceLevelForm = null;
            //   if (mode === 'study') {
            //     studyEducationLevelForm = studyMandatoryQuestion1 || null;
            //     studySubjectsForm = studyMandatoryQuestion2 || null;
            //     studyExamForm = studyMandatoryQuestion3 || null;
            //   } else {
            //     interviewJobRoleForm = interviewMandatoryQuestion1 || null;
            //     interviewTypeForm = interviewType || null;
            //     interviewExperienceLevelForm = interviewMandatoryQuestion2 || null;
            //   }
            //   const userID = await getCurrentUserID();
            //   await db.execAsync(`
            //     INSERT INTO userFormEntries (
            //       userID, formEntryType, formEntryMethod, formSubmissionDate, deckName, numberOfQuestions, kindsOfQuestions,
            //       youtubeLink, studyEducationLevel, studySubjects, studyTopics, studySubtopics, studyExam,
            //       interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics
            //     ) VALUES (
            //       '${userID}', '${mode}', 'manual', '${currentDate}', '${deckNameForEntry.replace(/'/g, "''")}', NULL, NULL,
            //       NULL, 
            //       ${studyEducationLevelForm ? `'${studyEducationLevelForm.replace(/'/g, "''")}'` : 'NULL'}, 
            //       ${studySubjectsForm ? `'${studySubjectsForm.replace(/'/g, "''")}'` : 'NULL'}, 
            //       NULL, NULL, 
            //       ${studyExamForm ? `'${studyExamForm.replace(/'/g, "''")}'` : 'NULL'},
            //       ${interviewJobRoleForm ? `'${interviewJobRoleForm.replace(/'/g, "''")}'` : 'NULL'}, 
            //       ${interviewTypeForm ? `'${interviewTypeForm.replace(/'/g, "''")}'` : 'NULL'}, 
            //       NULL, 
            //       ${interviewExperienceLevelForm ? `'${interviewExperienceLevelForm.replace(/'/g, "''")}'` : 'NULL'}, 
            //       NULL
            //     )
            //   `);
            //   console.log('User form entry created for adding flashcards to existing deck:', deckNameForEntry);
            // }
            setTimeout(() => {
              setShowLoadingPage(false);
              if (!cancelCreationRef.current) {
                router.back();
              }
            }, 800);
            return;
          } else {
            console.error('No valid deckId provided for view flashcards page');
          }
        }
        router.back();
      }, 50);
    });
  };

  // If isInViewFlashcardsPage is true, always set isMandatory to false
  useEffect(() => {
    if (forceManual && isMandatory) {
      setIsMandatory(false);
    }
  }, [forceManual]);

  //  // --- Background Task Logic for Deck/Flashcard Creation ---
  //  const BG_TASK_PROGRESS_KEY = 'deckCreationBgTaskProgress';

  //  // Helper to save progress
  //  async function saveDeckCreationProgress(progress: any) {
  //    try {
  //      await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
  //    } catch (e) { console.error('Failed to save deck creation progress', e); }
  //  }
 
  //  // Helper to load progress
  //  async function loadDeckCreationProgress(): Promise<any | null> {
  //    try {
  //      const data = await AsyncStorage.getItem(BG_TASK_PROGRESS_KEY);
  //      return data ? JSON.parse(data) : null;
  //    } catch (e) { return null; }
  //  }
 
  //  // Helper to clear progress
  //  async function clearDeckCreationProgress() {
  //    try { await AsyncStorage.removeItem(BG_TASK_PROGRESS_KEY); } catch (e) {}
  //  }
 
  //  // The background task function
  //  const deckCreationBackgroundTask = async (taskDataArguments: any) => {
  //    const { mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage, formData, submittedCards, startIndex } = taskDataArguments;
  //    let createdDeckId: number | null = null;
  //    let createdCount = startIndex || 0;
  //    let newFlashcardIds: number[] = [];
  //    let cancelled = false;
  //    try {
  //      // Deck creation (if needed)
  //      if (!deckId && (isInIndexPage || isInFavoritesPage || isInViewDecksInFolderPage)) {
  //        const deckResult = await createManualDeck(formData);
  //        if (deckResult.success && deckResult.deckId) {
  //          createdDeckId = deckResult.deckId as number;
  //          // If favorites, update deck as favorited
  //          if (isInFavoritesPage) {
  //            const userID = await getCurrentUserID();
  //            await db.execAsync(`UPDATE decks SET isFavorited = 1 WHERE deckID = ${deckResult.deckId} AND userID = '${userID}'`);
  //          }
  //          // If folder, update folderIDs
  //          if (isInViewDecksInFolderPage && folderId) {
  //            const currentFolderId = parseInt(folderId);
  //            if (currentFolderId) {
  //              const userID = await getCurrentUserID();
  //              const currentDeck = await db.getFirstAsync(`SELECT folderIDs FROM decks WHERE deckID = ${deckResult.deckId} AND userID = '${userID}'`);
  //              if (currentDeck) {
  //                let currentFolderIds: number[] = [];
  //                try {
  //                  const folderIDsRaw = (currentDeck as any).folderIDs;
  //                  currentFolderIds = folderIDsRaw ? JSON.parse(folderIDsRaw) : [];
  //                } catch (e) {}
  //                const newFolderIds = [...new Set([...currentFolderIds, currentFolderId])];
  //                await db.execAsync(`UPDATE decks SET folderIDs = '${JSON.stringify(newFolderIds)}' WHERE deckID = ${deckResult.deckId} AND userID = '${userID}'`);
  //              }
  //            }
  //          }
  //        } else {
  //          throw new Error('Failed to create deck');
  //        }
  //      } else if (deckId) {
  //        createdDeckId = parseInt(deckId);
  //      }
  //      // Flashcard creation
  //      for (let i = createdCount; i < submittedCards.length; i++) {
  //        if (BackgroundService.isRunning() === false) { cancelled = true; break; }
  //        let result = await createFlashcardsFromCache(createdDeckId as number, [submittedCards[i]]);
  //        if (result && result.flashcardIds && result.flashcardIds.length > 0) {
  //          newFlashcardIds.push(...result.flashcardIds);
  //        }
  //        createdCount++;
  //        // Save progress after each card
  //        await saveDeckCreationProgress({
  //          mode, deckId: createdDeckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
  //          formData, submittedCards, createdCount, newFlashcardIds, inProgress: true
  //        });
  //      }
  //      // Mark as complete
  //      await saveDeckCreationProgress({ inProgress: false });
  //    } catch (e: any) {
  //      // Save progress on error
  //      await saveDeckCreationProgress({
  //        mode, deckId: createdDeckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
  //        formData, submittedCards, createdCount, newFlashcardIds, inProgress: true, error: e.message
  //      });
  //      throw e;
  //    }
  //  };
 
  //  // AppState logic to resume deck/flashcard creation if needed
  //  React.useEffect(() => {
  //    let appState = AppState.currentState;
  //    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //      if (typeof appState === 'string' && appState.match(/inactive|background/) && nextAppState === 'active') {
  //        // App is foregrounded
  //        const progress = await loadDeckCreationProgress();
  //        if (progress && progress.inProgress) {
  //          // Resume background task
  //          const { mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage, formData, submittedCards, createdCount } = progress;
  //          await BackgroundService.start(deckCreationBackgroundTask, {
  //            taskName: 'DeckCreation',
  //            taskTitle: 'Creating Deck',
  //            taskDesc: 'Your deck is being created in the background.',
  //            taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  //            color: '#44B88A',
  //            parameters: {
  //              mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
  //              formData, submittedCards, startIndex: createdCount || 0
  //            },
  //          });
  //        }
  //      }
  //      appState = nextAppState;
  //    };
  //    const subscription = AppState.addEventListener('change', handleAppStateChange);
  //    return () => subscription.remove();
  //  }, []);
  //  // --- END Background Task Logic ---
 

  if (showLoadingPage) {
    return (
      <DeckCreationLoadingPage 
        progress={loadingProgress} 
        current={loadingCurrent} 
        total={loadingTotal} 
        isInViewFlashcardsPage={isInViewFlashcardsPage === 'true'}
        onCancel={() => {
          cancelCreationRef.current = true;
          setShowLoadingPage(false);
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
      {/* Only show FormHeaderIcons (mandatory header) if not in view flashcards and not in manual state */}
      <Animated.View
        style={[
          styles.headerIconsContainer,
          { opacity: mandatoryOpacity, display: (!forceManual && isMandatory) ? 'flex' : 'none' }
        ]}
      >
        <FormHeaderIcons 
          onClearAllPress={handleClearAllPress}
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
        />
      </Animated.View>
      {/* Always show TopBarManualHeader if in manual state or forceManual */}
      <Animated.View
        style={[
          styles.headerIconsContainer,
          { 
            opacity: manualAddDeckOpacity, 
            display: (!isMandatory || forceManual) && addViewState === 'add' ? 'flex' : 'none' 
          }
        ]}
      >
        <TopBarManualHeader 
          selectedButton={selectedButtonType}
          onButtonChange={handleButtonChange}
        />
      </Animated.View>
      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          {/* Only show RoundedContainer if not in view flashcards */}
          {!forceManual && (
            <RoundedContainer 
              leftLabel={STRINGS.mandatory[lang]}
              rightLabel={STRINGS.manual[lang]}
              onToggle={handleToggle}
            />
          )}
          {/* Always show AddViewToggle if in manual state or forceManual */}
          <Animated.View
            style={[
              styles.addViewToggle,
              { opacity: manualAddDeckOpacity, display: (!isMandatory || forceManual) ? 'flex' : 'none' }
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
        {/* Only show mandatory form if not in manual state and not forceManual */}
        {(!forceManual && isMandatory) && (
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
            { gap: getFormContentGap(isInViewFlashcardsPage === 'true') },
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex' }
          ]}>
              <View style={{ gap: getFormContentGap(isInViewFlashcardsPage === 'true') }}>
                {!isInViewFlashcardsPage && (
                  <TitleTextBar
                    title={STRINGS.deckName[lang]}
                    highlightedWord={mode === 'study' ? STRINGS.study[lang] : STRINGS.interview[lang]}
                    placeholder={STRINGS.typeHere[lang]}
                    value={deckName}
                    onChangeText={setDeckName}
                  />
                )}
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label={STRINGS.educationLevel[lang]}
                      placeholder={STRINGS.educationLevelPH[lang]}
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText={STRINGS.educationLevelHelper[lang]}
                    />
                    <QuestionTextBar
                      label={STRINGS.subjects[lang]}
                      placeholder={STRINGS.subjectsPH[lang]}
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText={STRINGS.subjectsHelper[lang]}
                    />
                    <QuestionTextBar
                      label={STRINGS.exam[lang]}
                      placeholder={STRINGS.examPH[lang]}
                      value={studyMandatoryQuestion3}
                      onChangeText={setStudyMandatoryQuestion3}
                      helperText={STRINGS.examHelper[lang]}
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                    <QuestionTextBar
                      label={STRINGS.jobRole[lang]}
                      placeholder={STRINGS.jobRolePH[lang]}
                      value={interviewMandatoryQuestion1}
                      onChangeText={setInterviewMandatoryQuestion1}
                      helperText={STRINGS.jobRoleHelper[lang]}
                    />
                    <TypeOfInterviewQn
                      value={interviewType}
                      onValueChange={setInterviewType}
                    />
                    <QuestionTextBar
                      label={STRINGS.experienceLevel[lang]}
                      placeholder={STRINGS.experienceLevelPH[lang]}
                      value={interviewMandatoryQuestion2}
                      onChangeText={setInterviewMandatoryQuestion2}
                      helperText={STRINGS.experienceLevelHelper[lang]}
                    />
                  </>
                )}
                {/* <NumberOfQuestions
                  title="3. Number of questions:"
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                /> */}
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

            <FlippableCard 
              ref={flippableCardRef}
              frontContentTitle={`Qn ${currentQuestionNumber}`} 
              backContentTitle={`Ans ${currentQuestionNumber}`}
              fadeOpacity={cardFadeAnim}
              slideOpacity={cardSlideAnim}
              cardType={selectedButtonType}
              onCardFlip={handleCardFlip}
              onContentChange={handleContentChange}
              onDrawingChange={saveCurrentCardToCache}
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
                <Text style={styles.selectAllText}>{STRINGS.selectAll[lang]}</Text>
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
                <Text style={styles.cancelText}>{STRINGS.cancel[lang]}</Text>
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
                ]}>{STRINGS.select[lang]}</Text>
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
              <Text style={styles.emptyStateText}>{STRINGS.noFlashcards[lang]}</Text>
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
              text={STRINGS.submitFormWithCards[lang]}
              backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
              onPress={handleSubmit}
              disabled={isSubmitDisabled()}
              fullWidth
            />
          ) : addViewState === 'add' ? (
            <View style={{ flexDirection: 'row', gap: 8, width: '100%', paddingHorizontal: 16}}>
              <ActionButton
                text={STRINGS.submitFormWithCards[lang]}
                backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
                onPress={handleSubmit}
                disabled={isSubmitDisabled()}
                style={{ flex: 1 }}
              />
              <ActionButton
                text={STRINGS.moveToNextCard[lang]}
                backgroundColor={hasCardContent ? "#44B88A" : "#D5D4DD"}
                style={{ flex: 1 }}
                onPress={handleNextFlashcard}
                disabled={!hasCardContent}
              />
            </View>
          ) : (
            <ActionButton
              text={STRINGS.submitFormWithCards[lang]}
              backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
              onPress={handleSubmit}
              disabled={isSubmitDisabled()}
              fullWidth
            />
          )}
        </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isAIHelpModalOpen || isDeleteModalOpen || isRecentFormModalOpen || isContentTypeChangeModalOpen || isBackConfirmationModalOpen || isNoSelectionModalOpen || isErrorModalOpen || isSuccessModalOpen}
        opacity={overlayOpacity}
        onPress={isDeleteModalOpen ? handleDismissDeleteModal : (isRecentFormModalOpen ? handleDismissRecentForm : (isContentTypeChangeModalOpen ? handleDismissContentTypeChange : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : (isNoSelectionModalOpen ? handleDismissNoSelection : (isErrorModalOpen ? handleDismissErrorModal : (isSuccessModalOpen ? handleDismissSuccessModal : (isHelpModalOpen ? handleDismissHelp : handleDismissAIHelp)))))))}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={STRINGS.helpModal[lang]}
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
        text={STRINGS.aiHelpModal[lang]}
        buttons='none'
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isDeleteModalOpen}
        opacity={deleteModalOpacity}
        Icon={DeleteModalIcon}
        text={`${STRINGS.areYouSureDelete[lang]} ${selectedFlashcards.length} ${STRINGS.flashcard[lang]}${selectedFlashcards.length === 1 ? '' : STRINGS.flashcards[lang]}?`}
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
        text={STRINGS.useRecent[lang]}
        buttons='double'
        onConfirm={async () => {
          try {
            // Fetch the most recent manual form entry for the current mode
            const mostRecentEntry = await getMostRecentManualFormEntry(mode as 'study' | 'interview');
            
            if (mostRecentEntry) {
              // Populate the form fields with the most recent entry
              setDeckName(mostRecentEntry.deckName || '');
              
              if (mode === 'study') {
                setStudyMandatoryQuestion1(mostRecentEntry.studyEducationLevel || '');
                // Convert JSON array back to comma-separated string
                if (mostRecentEntry.studySubjects) {
                  try {
                    const subjects = JSON.parse(mostRecentEntry.studySubjects);
                    setStudyMandatoryQuestion2(Array.isArray(subjects) ? subjects.join(', ') : mostRecentEntry.studySubjects);
                  } catch (error) {
                    // If parsing fails, use the raw string
                    setStudyMandatoryQuestion2(mostRecentEntry.studySubjects);
                  }
                } else {
                  setStudyMandatoryQuestion2('');
                }
                setStudyMandatoryQuestion3(mostRecentEntry.studyExam || '');
              } else if (mode === 'interview') {
                setInterviewMandatoryQuestion1(mostRecentEntry.interviewJobRole || '');
                setInterviewType(mostRecentEntry.interviewType || '');
                setInterviewMandatoryQuestion2(mostRecentEntry.interviewExperienceLevel || '');
              }
              
              console.log('Form populated with most recent manual entry:', mostRecentEntry);
            } else {
              console.log('No recent manual form entry found for mode:', mode);
            }
          } catch (error) {
            console.error('Error loading most recent form entry:', error);
          }
          
          handleDismissRecentForm();
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
            const hasDrawingContent = flippableCardRef.current.hasDrawingContent();
            
            // Check if we're on the front side by comparing content
            if (currentContent === frontContent) {
              flippableCardRef.current.clearFrontContent();
            } else {
              flippableCardRef.current.clearBackContent();
            }
            
            // Also clear drawing content if it exists
            if (hasDrawingContent) {
              flippableCardRef.current.clearDrawingContent();
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
        text={STRINGS.leaveConfirm[lang]}
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
        subtitle={STRINGS.selectAtLeastOne[lang]}
        text={STRINGS.noSelection[lang]}
        onConfirm={handleDismissNoSelection}
      />
      <GenericModal
        visible={isErrorModalOpen}
        opacity={errorModalOpacity}
        text={errorMessage}
        buttons="none"
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isSuccessModalOpen}
        opacity={successModalOpacity}
        text={STRINGS.greatSubmit[lang]}
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
  leftChevronButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1000,
    padding: 8,
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    // borderRadius: 20,
  },
  rightChevronButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1000,
    padding: 8,
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    // borderRadius: 20,
  },
});
