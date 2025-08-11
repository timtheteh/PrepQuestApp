import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Text, Dimensions, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/formComponents/FormHeaderIcons';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { ActionButton } from '@/components/general/ActionButton';
import { SmallCircleSelectButton } from '@/components/general/SmallCircleSelectButton';
import HelpIconOutline from '@/assets/icons/generalIcons/helpIconOutline.svg';
import YoutubeIconSVG from '@/assets/images/YoutubeIconSVG.svg';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { GenericModal } from '@/components/modals/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import { TitleTextBar } from '@/components/general/TitleTextBar';
import { QuestionTextBar } from '@/components/formComponents/QuestionTextBar';
import { NumberOfQuestions } from '@/components/formComponents/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/formComponents/TypeOfInterviewQn';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { checkDeckNameExists, saveUserYouTubeLinkFormEntry, getMostRecentYouTubeLinkFormEntry, createDeckWithGenAIFlashcards, createGenAIFlashcardsForDeck } from '../db/decks';
import { Toast } from '../components/general/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopBarAccountHeight } from '@/hooks/heights';
import { getDeckNameById } from '../db/decks';
import { getUserQuestionSettings } from '@/db/users';
import { getDistributionOfFlashcardsForInterviewType, promptAndData, promptAndDataChinese } from '@/constants/promptEngineering';

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

// Add language mappings for all user-facing strings
const STRINGS = {
  mandatory: { English: 'Mandatory', Chinese: '必填' },
  youtubeLink: { English: 'YouTube Link', Chinese: 'YouTube链接' },
  deckName: { English: ' Deck Name', Chinese: '卡组名称' },
  study: { English: 'Study', Chinese: '学习' },
  interview: { English: 'Interview', Chinese: '面试' },
  typeHere: { English: 'Type here!', Chinese: '请在此输入！' },
  educationLevel: { English: '1. Education Level?', Chinese: '1. 教育程度？' },
  educationLevelPH: { English: 'e.g. Freshman, Sophomore, etc', Chinese: '例如：大一，大二等' },
  educationLevelHelper: { English: 'What education level is your preparation for?', Chinese: '你正在为哪个教育阶段做准备？' },
  subjects: { English: '2. Subject(s)?', Chinese: '2. 科目？' },
  subjectsPH: { English: 'e.g. Computer Science, Math, Physics, etc.', Chinese: '例如：计算机，数学，物理等' },
  subjectsHelper: { English: 'What subject(s) would this deck be for? Provide your answer in a comma separated list, e.g Inorganic Chemistry, Organic Chemistry, etc.', Chinese: '这个卡组是针对哪些科目？请用逗号分隔，例如：无机化学，有机化学等。' },
  jobRole: { English: '1. Job/Role?', Chinese: '1. 职位/角色？' },
  jobRolePH: { English: 'e.g. Frontend Developer, Private Equity Analyst, etc', Chinese: '例如：前端开发，私募分析师等' },
  jobRoleHelper: { English: 'What job or role are you preparing for?', Chinese: '你正在准备什么职位或角色？' },
  numQuestions: { English: '3. Number of questions:', Chinese: '3. 题目数量：' },
  pasteLinkHere: { English: 'Paste Link Here', Chinese: '在此粘贴链接' },
  pasteYoutubeLink: { English: 'Paste your YouTube Link here!', Chinese: '请在此粘贴您的YouTube链接！' },
  aiGenerate: { English: 'AI Generate new card content?', Chinese: 'AI生成新卡片内容？' },
  submit: { English: 'Submit', Chinese: '提交' },
  deckNameInUse: { English: 'Deckname already in use', Chinese: '卡组名称已被使用' },
  invalidSubjects: { English: "Invalid form input for 'Subject(s)'", Chinese: '“科目”输入无效' },
  fillAllAndPaste: { English: 'Fill up all mandatory fields and paste your Youtube Link!', Chinese: '请填写所有必填项并粘贴YouTube链接！' },
  pasteBeforeSubmit: { English: 'Paste your Youtube Link before submitting!', Chinese: '请先粘贴YouTube链接再提交！' },
  fillAll: { English: 'Fill up all mandatory fields!', Chinese: '请填写所有必填项！' },
  helpModal: { English: "Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more.", Chinese: '我们的团队基于布鲁姆认知分类法，归纳了7种主要认知题型，帮助你的学习。访问我们的网站了解更多。' },
  aiHelpModal: { English: 'Ticking this option will let AI generate new, suggested cards outside the content of your upload.', Chinese: '勾选此项将让AI生成与上传内容无关的新建议卡片。' },
  useRecent: { English: ['Use most recent', 'form entry?'], Chinese: ['使用最近的', '表单记录？'] },
  greatSubmit: { English: 'Great! 😊 Do you want to go ahead and submit?', Chinese: '太棒了！😊 是否确认提交？' },
  leaveConfirm: { English: ['Are you sure you want', 'to leave? All your', 'progress will be lost'], Chinese: ['确定要离开吗？', '所有进度将丢失'] },
};

const YoutubeLinkMainSection = ({ youtubeLink, setYoutubeLink, language }: { youtubeLink: string; setYoutubeLink: (text: string) => void; language: 'English' | 'Chinese' }) => {
  return (
    <View style={styles.youtubeLinkMainSection}>
      <View style={styles.youtubeImageContainer}>
        <YoutubeIconSVG 
          width={200}
          height={120}
        />
      </View>
      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          placeholder={STRINGS.pasteLinkHere[language]}
          placeholderTextColor="#D5D4DD"
          multiline={true}
          numberOfLines={4}
          submitBehavior='blurAndSubmit'
          value={youtubeLink}
          onChangeText={setYoutubeLink}
        />
      </View>
    </View>
  );
};

// Helper: fetch transcript text for a YouTube URL
async function fetchYouTubeTranscript(videoUrl: string): Promise<string | null> {
  try {
    const endpoint = process.env.EXPO_PUBLIC_YOUTUBE_TRANSCRIPT_API_ENDPOINT as string | undefined;
    if (!endpoint) {
      return null;
    }
    const url = `${endpoint}?video_url=${encodeURIComponent(videoUrl)}`;
    console.log('Fetching transcript from:', url);
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await resp.json();
      // Try common keys; fallback to stringified JSON if needed
      return (
        data?.transcript ||
        data?.text ||
        data?.caption ||
        (typeof data === 'string' ? data : JSON.stringify(data))
      );
    }
    // Fallback to raw text (read once)
    const text = await resp.text();
    console.log('Response:', text);
    return text;
  } catch (e) {
    return null;
  }
}

export default function YouTubeLinkPage() {
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
  const [isMandatory, setIsMandatory] = useState(true);  const [deckName, setDeckName] = useState('');
  const [deckTitle, setDeckTitle] = useState<string>('');
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
  const aiHelpOverlayOpacity = useRef(new Animated.Value(0)).current;
  const aiHelpModalOpacity = useRef(new Animated.Value(0)).current;
  const [isRecentFormModalOpen, setIsRecentFormModalOpen] = useState(false);
  const recentFormModalOpacity = useRef(new Animated.Value(0)).current;
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const errorModalOpacity = useRef(new Animated.Value(0)).current;
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const [errorMessage, setErrorMessage] = useState('');
  const [isBackConfirmationModalOpen, setIsBackConfirmationModalOpen] = useState(false);
  const backConfirmationModalOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { language } = useLanguage();
  const lang: 'English' | 'Chinese' = language === 'Chinese' ? 'Chinese' : 'English';
  const getTopBarAccountHeight = useTopBarAccountHeight();

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    30;
  // Fetch deck title when in view flashcards page
  useEffect(() => {
    const fetchDeckTitle = async () => {
      if (isInViewFlashcardsPage === 'true' && deckId) {
        try {
          const title = await getDeckNameById(Number(deckId));
          if (title) {
            setDeckTitle(title);
          }
        } catch (error) {
          console.error('Error fetching deck title:', error);
        }
      }
    };

    fetchDeckTitle();
  }, [isInViewFlashcardsPage, deckId]);

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
        Animated.timing(aiHelpOverlayOpacity, {
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
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

  const handleBackPress = () => {
    setIsBackConfirmationModalOpen(true);
  };

  const handleClearAllPress = () => {
    // Reset mandatory fields only
    setDeckName('');
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    setNumberOfQuestions(1);
    setYoutubeLink('');
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
      return (
        studyMandatoryQuestion1.trim() !== '' &&
        studyMandatoryQuestion2.trim() !== ''
      );
    }
    return (
      deckName.trim() !== '' &&
      studyMandatoryQuestion1.trim() !== '' &&
      studyMandatoryQuestion2.trim() !== ''
    );
  };

  const isInterviewMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      return (
        interviewMandatoryQuestion1.trim() !== '' &&
        interviewType !== ''
      );
    }
    return (
      deckName.trim() !== '' &&
      interviewMandatoryQuestion1.trim() !== '' &&
      interviewType !== ''
    );
  };

  const isSubmitDisabled = () => {
    return false; // Always enabled now
  };

  const validateFormSubmission = async () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const youtubeLinkFilled = youtubeLink.trim() !== '';

    // Check if deck name already exists
    // Check if deck name already exists (only when creating a new deck)
    if (isInViewFlashcardsPage !== 'true' && deckName.trim() !== '') {
      const deckNameExists = await checkDeckNameExists(deckName.trim());
      if (deckNameExists) {
        setShowToast(true);
        setToastMessage(STRINGS.deckNameInUse[lang]);
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
        setToastMessage(STRINGS.invalidSubjects[lang]);
        return false;
      }
    }

    // Error 1: mandatory fields not filled up and youtube link not filled up
    if (!mandatoryFieldsFilled && !youtubeLinkFilled) {
      setErrorMessage(STRINGS.fillAllAndPaste[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 2: mandatory fields filled up but youtube link not filled up
    if (mandatoryFieldsFilled && !youtubeLinkFilled) {
      setErrorMessage(STRINGS.pasteBeforeSubmit[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 3: mandatory fields not filled up but youtube link is filled up
    if (!mandatoryFieldsFilled && youtubeLinkFilled) {
      setErrorMessage(STRINGS.fillAll[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Success: all validations passed
    setIsSuccessModalOpen(true);
    return true;
  };

  const handleSubmit = async () => {
    await validateFormSubmission();
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
    // Animate out first, then proceed with generation
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

      // Save form submission first
      await saveUserYouTubeLinkFormEntry({
        deckName: isInViewFlashcardsPage === 'true' ? deckTitle : deckName,
        studyEducationLevel: studyMandatoryQuestion1,
        studySubjects: studyMandatoryQuestion2,
        numberOfQuestions,
        interviewJobRole: interviewMandatoryQuestion1,
        interviewType,
        youtubeLink
      });

      // 1) Fetch YouTube transcript
      const transcript = await fetchYouTubeTranscript(youtubeLink);
      if (!transcript || (typeof transcript === 'string' && transcript.trim() === '')) {
        Alert.alert('Error', lang === 'Chinese' ? '无法获取YouTube文字稿，请稍后再试。' : 'Failed to fetch YouTube transcript. Please try again.');
        return;
      }

      try {
        // 2) Build prompt using user inputs + transcript
        const { isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled } = await getUserQuestionSettings();
        const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
          isMcqEnabled,
          isClozeEnabled,
          isVoiceRecordedEnabled,
          interviewType,
          numberOfQuestions,
        );

        let prompt = '';
        if (mode === 'interview' && language === 'English') {
          prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`;
        }
        if (mode === 'interview' && language === 'Chinese') {
          prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n`;
        }
        if (mode === 'study' && language === 'English') {
          prompt += `I am studying for ${studyMandatoryQuestion2} and my education level is ${studyMandatoryQuestion1}.\n`;
        }
        if (mode === 'study' && language === 'Chinese') {
          prompt += `我正在准备${studyMandatoryQuestion2}考试，我的教育水平是${studyMandatoryQuestion1}。\n`;
        }

        if (language === 'English') {
          prompt += `Here is additional information and context from a YouTube video transcript for my preparation: ${transcript}\n`;
        } else {
          prompt += `这里有一些额外的信息和上下文，来自一个YouTube视频的文字稿，用于我的准备：${transcript}\n`;
        }

        if (distributionOfFlashcards) {
          if (language === 'English') {
            for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
              prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`;
              prompt += `${promptAndData[flashcardType as keyof typeof promptAndData].prompt}\n`;
            }
          } else {
            for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
              prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`;
              prompt += `${promptAndDataChinese[flashcardType as keyof typeof promptAndDataChinese].prompt}\n`;
            }
          }
        }

        if (language === 'English' && mode === 'interview' && isAIGenerate) {
          prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n';
          prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
        }
        if (language === 'English' && mode === 'interview' && !isAIGenerate) {
          prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\nHowever, it is EXTREMELY CRUCIAL THAT YOU DO NOT DEVIATE from the information and context I have provided from the YouTube video transcript. STICK ONLY TO CONTENT FROM THE TRANSCRIPT. ';
          prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
        }
        if (language === 'Chinese' && mode === 'interview' && isAIGenerate) {
          prompt += '确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n';
          prompt += '生成一个JSON数组，格式为：[{"flashcardType": <>, "question": <>, "answer": <>}], 其中每个 {"flashcardType": <>, "question": <>, "answer": <>} 代表一个闪卡。';
        }
        if (language === 'English' && mode === 'study' && isAIGenerate) {
          prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n';
          prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
        }
        if (language === 'Chinese' && mode === 'study' && isAIGenerate) {
          prompt += '确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n';
          prompt += '生成一个JSON数组，格式为：[{"flashcardType": <>, "question": <>, "answer": <>}], 其中每个 {"flashcardType": <>, "question": <>, "answer": <>} 代表一个闪卡。';
        }

        // 3) Generate flashcards via Supabase Edge function
        let response;
        try {
          response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/genAIFlashcardsGeneration`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ prompt }),
          });
        } catch (_) {
          Alert.alert('Error', lang === 'Chinese' ? '生成闪卡时发生网络错误。' : 'Network error while generating flashcards.');
          return;
        }

        if (!response.ok) {
          Alert.alert('Error', lang === 'Chinese' ? '生成闪卡失败，请稍后再试。' : 'Failed to generate flashcards. Please try again.');
          return;
        }

        const data = await response.json();
        let flashcards = data?.flashcards?.flashcards ?? data?.flashcards;
        if (flashcards && !Array.isArray(flashcards)) {
          flashcards = [flashcards];
        }

        if (!flashcards || flashcards.length === 0) {
          Alert.alert('Error', lang === 'Chinese' ? '未生成任何闪卡。' : 'No flashcards were generated.');
          return;
        }

        // 4) Save to DB (create deck or add to existing)
        if (isInViewFlashcardsPage === 'true') {
          await createGenAIFlashcardsForDeck({
            deckId: Number(deckId),
            flashcards,
          });
        } else {
          const params: any = {
            deckName,
            mode: mode === 'study' ? 'study' : 'interview',
            formFields: {
              studyEducationLevel: studyMandatoryQuestion1,
              studySubjects: studyMandatoryQuestion2,
              interviewJobRole: interviewMandatoryQuestion1,
              interviewType,
              numberOfQuestions,
            },
            flashcards,
          };
          if (isInFavoritesPage === 'true') params.isFavorited = 1;
          if (isInViewDecksInFolderPage === 'true' && folderId) params.folderIDs = `[${folderId}]`;
          await createDeckWithGenAIFlashcards(params);
        }

        // 5) Navigate back on success
        setTimeout(() => {
          router.back();
        }, 50);
      } catch (err) {
        Alert.alert('Error', lang === 'Chinese' ? '处理您的请求时出错。' : 'An error occurred while processing your request.');
      }
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
      Animated.timing(aiHelpOverlayOpacity, {
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

  const handleLoadMostRecentForm = async () => {
    const recent = await getMostRecentYouTubeLinkFormEntry((mode as 'study' | 'interview'));
    if (recent) {
      setDeckName(recent.deckName || '');
      setStudyMandatoryQuestion1(recent.studyEducationLevel || '');
      setStudyMandatoryQuestion2(recent.studySubjects || '');
      setNumberOfQuestions(recent.numberOfQuestions || 1);
      setInterviewMandatoryQuestion1(recent.interviewJobRole || '');
      setInterviewType(recent.interviewType || '');
      setYoutubeLink(recent.youtubeLink || '');
    }
    setIsRecentFormModalOpen(false);
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

  const youtubeLinkOpacity = fadeAnim.interpolate({
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

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight() }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color="black" />
        </TouchableOpacity>
      </View>
      
      <View
        style={[
          styles.headerIconsContainer,
          { display: 'flex', paddingTop: getTopBarAccountHeight() }
        ]}
      >
        <FormHeaderIcons 
          onClearAllPress={handleClearAllPress}
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
        />
      </View>

      <View style={styles.mainContainer}>
      <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel={STRINGS.mandatory[lang]}
            rightLabel={STRINGS.youtubeLink[lang]}
            onToggle={handleToggle}
          />
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
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex', 
            }
          ]}>
            {isMandatory && (
              <View style={[{gap: Dimensions.get('window').height * 0.025}]}>
                {!isInViewFlashcardsPage && (<TitleTextBar
                  title={STRINGS.deckName[lang]}
                  highlightedWord={mode === 'study' ? STRINGS.study[lang] : STRINGS.interview[lang]}
                  placeholder={STRINGS.typeHere[lang]}
                  value={deckName}
                  onChangeText={setDeckName}
                />)
                }
                {isInViewFlashcardsPage === 'true' && (
                  <TitleTextBar
                    title={STRINGS.deckName[lang]}
                    highlightedWord={mode === 'study' ? STRINGS.study[lang] : STRINGS.interview[lang]}
                    placeholder={deckTitle}
                    value={deckTitle}
                    onChangeText={() => {}} // Disabled - no-op function
                    disabled={true}
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
                  </>
                )}
                <NumberOfQuestions
                  title={STRINGS.numQuestions[lang]}
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
          </Animated.View>
        </ScrollView>
        )}
        
        <Animated.View style={[
         styles.youtubeLinkContent,
         { opacity: youtubeLinkOpacity, display: !isMandatory ? 'flex' : 'none' }
         ]}>
            <ScrollView 
              style={[
                { marginBottom: keyboardHeight > 0 ? keyboardHeight : 90 + bottomOffset }
              ]}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
              }}
              showsVerticalScrollIndicator={false}
              bounces={true}
              overScrollMode="always"
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={styles.youtubeLinkTitle}>
                  {STRINGS.pasteYoutubeLink[lang]}
                </Text>
                <YoutubeLinkMainSection youtubeLink={youtubeLink} setYoutubeLink={setYoutubeLink} language={lang} />
                <View style={styles.aiGenerateRow}>
                  <SmallCircleSelectButton
                    selected={isAIGenerate}
                    onPress={() => setIsAIGenerate(!isAIGenerate)}
                  />
                  <Text style={styles.aiGenerateText}>{STRINGS.aiGenerate[lang]}</Text>
                  <TouchableOpacity onPress={() => setIsAIHelpModalOpen(true)}>
                    <HelpIconOutline width={24} height={24} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
        </Animated.View>

        <View style={[
          styles.buttonContainer,
          { bottom: bottomOffset }
        ]}>
          <ActionButton
            text={STRINGS.submit[lang]}
            backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
            onPress={handleSubmit}
            disabled={isSubmitDisabled()}
            fullWidth
          />
        </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isAIHelpModalOpen || isRecentFormModalOpen || isErrorModalOpen || isSuccessModalOpen || isBackConfirmationModalOpen}
        opacity={isRecentFormModalOpen ? overlayOpacity : (isHelpModalOpen ? overlayOpacity : (isErrorModalOpen ? overlayOpacity : (isSuccessModalOpen ? overlayOpacity : (isBackConfirmationModalOpen ? overlayOpacity : aiHelpOverlayOpacity))))}
        onPress={isRecentFormModalOpen ? handleDismissRecentForm : (isHelpModalOpen ? handleDismissHelp : (isErrorModalOpen ? handleDismissErrorModal : (isSuccessModalOpen ? handleDismissSuccessModal : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : handleDismissAIHelp))))}
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
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={STRINGS.useRecent[lang]}
        buttons='double'
        onConfirm={handleLoadMostRecentForm}
        onCancel={handleDismissRecentForm}
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
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  youtubeLinkContent: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: '5%',
    justifyContent: 'center',
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
  bottomSpacingFilUpload: {
    height: 60,
  },
  youtubeLinkTitle: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    // marginTop: Platform.OS === 'ios' ? 10 : 40,
  },
  youtubeLinkMainSection: {
    height: Dimensions.get('window').height * 0.5,
    width: '95%',
    alignSelf: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#4F41D8',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  youtubeImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textAreaContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    width: '90%',
    height: Dimensions.get('window').height * 0.3,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    marginBottom: 20,
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
}); 