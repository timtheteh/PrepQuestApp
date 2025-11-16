import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ImageBackground, Animated, Platform, TextInput, ScrollView, Image, Modal } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignUp, useSignIn } from '@clerk/clerk-expo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Toast } from '@/components/general/Toast';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { createUser } from '@/db/users';
import { GenericModal } from '@/components/modals/GenericModal';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { strings } from '@/constants/strings';
import BackgroundService from 'react-native-background-actions';
import LanguageSelector from '@/components/onboarding/LanguageSelector';
import OnboardingLoadingScreen from '@/components/onboarding/OnboardingLoadingScreen';
import PrepQuestLogo from '@/assets/icons/loginIcons/PrepQuestLogo.svg';
import GoogleLoginIcon from '@/assets/icons/loginIcons/GoogleLoginIcon.svg';
import AppleLoginIcon from '@/assets/icons/loginIcons/AppleLoginIcon.svg';
import FacebookLoginIcon from '@/assets/icons/loginIcons/FacebookLoginIcon.svg';
import StudyOnboardingImage from '@/assets/onboarding/studyOnboardingImage.svg';
import InterviewOnboardingImage from '@/assets/onboarding/interviewOnboardingImage.svg';
import HistoryImage from '@/assets/onboarding/history.svg';
import PhysicsImage from '@/assets/onboarding/physics.svg';
import ChemistryImage from '@/assets/onboarding/chemistry.svg';
import BiologyImage from '@/assets/onboarding/biology.svg';
import GeographyImage from '@/assets/onboarding/geography.svg';
import MathImage from '@/assets/onboarding/math.svg';
import MedicineImage from '@/assets/onboarding/medicine.svg';
import LawImage from '@/assets/onboarding/law.svg';
import FinanceImage from '@/assets/onboarding/finance.svg';
import ComputingImage from '@/assets/onboarding/computing.svg';
import SoftwareEngineeringImage from '@/assets/onboarding/softwareEngineering.svg';
import InvestmentBankingImage from '@/assets/onboarding/investmentBanking.svg';
import MedicalResidencyImage from '@/assets/onboarding/medicalResidency.svg';
import QuantitativeResearcherImage from '@/assets/onboarding/quant.svg';
import ManagementConsultingImage from '@/assets/onboarding/managementConsulting.svg';
import CriminalLawyerImage from '@/assets/onboarding/criminalLawyer.svg';
import ElectricalEngineerImage from '@/assets/onboarding/electricalEngineer.svg';
import ProductManagerImage from '@/assets/onboarding/productManager.svg';
import HighSchoolImage from '@/assets/onboarding/highSchool.svg';
import CollegeImage from '@/assets/onboarding/college.svg';
import GraduateImage from '@/assets/onboarding/graduate.svg';
import AdultLearnerImage from '@/assets/onboarding/adultLearner.svg';
import MiddleSchoolImage from '@/assets/onboarding/middleSchool.svg';
import ElementarySchoolImage from '@/assets/onboarding/elementarySchool.svg';
import TechnicalImage from '@/assets/onboarding/technical.svg';
import BehavioralImage from '@/assets/onboarding/behavioral.svg';
import CaseStudyImage from '@/assets/onboarding/caseStudy.svg';
import BrainteasersImage from '@/assets/onboarding/brainteasers.svg';
import CarouselPage1Image from '@/assets/onboarding/carouselPage1Image.svg';
import CarouselPage2Image1 from '@/assets/onboarding/carouselPage2Image1.svg';
import CarouselPage2Image2 from '@/assets/onboarding/carouselPage2Image2.svg';
import CarouselPage3Image from '@/assets/onboarding/carouselPage3Image.svg';
import CarouselPage4Image1 from '@/assets/onboarding/carouselPage4Image1.svg';
import CarouselPage4Image2 from '@/assets/onboarding/carouselPage4Image2.svg';
import CarouselPage5Image1 from '@/assets/onboarding/carouselPage5Image1.svg';
import CarouselPage5Image2 from '@/assets/onboarding/carouselPage5Image2.svg';
import CarouselPage6Image1 from '@/assets/onboarding/carouselPage6Image1.svg';
import CarouselPage6Image2 from '@/assets/onboarding/carouselPage6Image2.svg';
import CarouselPage6Image3 from '@/assets/onboarding/carouselPage6Image3.svg';
import CarouselPage7Image1 from '@/assets/onboarding/CarouselPage7Image1.svg';
import CarouselPage7Image2 from '@/assets/onboarding/CarouselPage7Image2.svg';
import CarouselPage7Image3 from '@/assets/onboarding/CarouselPage7Image3.svg';
import CarouselPage7Image4 from '@/assets/onboarding/CarouselPage7Image4.svg';
import { Svg, Polygon } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stringsOnboarding, getTranslatedText } from '@/constants/stringsOnboarding';
import { generateOnboardingPromptsWithFormFields, OnboardingResponses } from '@/utils/onboardingPromptGeneration';

const { height } = Dimensions.get('window');


interface SplashOnboardingProps {
  onComplete: () => void;
  onAuthComplete?: () => void;
  onHideLoadingOverlay?: (callback: () => void) => void;
}


export default function SplashOnboarding({ onComplete, onAuthComplete, onHideLoadingOverlay }: SplashOnboardingProps) {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Authentication hooks and context
  const { 
    isAuthenticated, 
    user, 
    isLoading,
    signInWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signOut
  } = useHybridAuth();
  
  const { signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();
  
  // Track splash screen start time
  const splashStartTime = useRef(Date.now());
  const [isFreshAuth, setIsFreshAuth] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const isSkippedRef = useRef(false);

  // State for section navigation
  const [currentSection, setCurrentSection] = useState<'logoAnimation' | 'languageSelection' | 'onboardingPage1' | 'onboardingPage2' | 'onboardingPage3' | 'onboardingPage4' | 'onboardingPage5' | 'onboardingPage6' | 'signupPage'>('logoAnimation');
  const [hideLogoAnimation, setHideLogoAnimation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedCard, setSelectedCard] = useState<'study' | 'interview' | null>(null);
  const [studySubjectInput, setStudySubjectInput] = useState<string>('');
  const [studySelectedSuggestions, setStudySelectedSuggestions] = useState<Set<string>>(new Set());
  const [interviewSubjectInput, setInterviewSubjectInput] = useState<string>('');
  const [interviewSelectedSuggestions, setInterviewSelectedSuggestions] = useState<Set<string>>(new Set());
  const [studyEducationInput, setStudyEducationInput] = useState<string>('');
  const [studySelectedEducationSuggestions, setStudySelectedEducationSuggestions] = useState<Set<string>>(new Set());
  const [interviewEducationInput, setInterviewEducationInput] = useState<string>('');
  const [interviewSelectedEducationSuggestions, setInterviewSelectedEducationSuggestions] = useState<Set<string>>(new Set());
  const [experienceLevelInput, setExperienceLevelInput] = useState<string>('');
  const [companyInput, setCompanyInput] = useState<string>('');
  const [topicsInput, setTopicsInput] = useState<string>('');
  const [examInput, setExamInput] = useState<string>('');
  const [studyTopicsInput, setStudyTopicsInput] = useState<string>('');
  const [currentCarouselPage, setCurrentCarouselPage] = useState<number>(0);
  const carouselTranslateX = useRef(new Animated.Value(0)).current;
  const containerWidth = useRef(0);
  const isAnimating = useRef(false);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Authentication state
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastBackgroundColor, setToastBackgroundColor] = useState<string | undefined>(undefined);
  
  // Forgot password modal state
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [passwordResetCode, setPasswordResetCode] = useState(['', '', '', '', '', '']);
  const [isVerifyingResetCode, setIsVerifyingResetCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pendingPasswordReset, setPendingPasswordReset] = useState<any>(null);
  const passwordResetInputRefs = useRef<(TextInput | null)[]>([]);
  const passwordResetFadeAnim = useRef(new Animated.Value(1)).current;
  const [hasPasswordResetError, setHasPasswordResetError] = useState(false);
  
  // Email verification modal state
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [pendingSignUpAttempt, setPendingSignUpAttempt] = useState<any>(null);
  const [hasVerificationError, setHasVerificationError] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(15);
  const [canResendCode, setCanResendCode] = useState(false);
  const verificationInputRefs = useRef<(TextInput | null)[]>([]);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Loading overlay state
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const loadingOverlayRef = useRef<LottieView>(null);

  // Network error modal state
  const [isNetworkErrorModalOpen, setIsNetworkErrorModalOpen] = useState(false);
  const networkErrorOverlayOpacity = useRef(new Animated.Value(0)).current;
  const networkErrorModalOpacity = useRef(new Animated.Value(0)).current;
  
  // Onboarding loading screen progress state
  const [authProgress, setAuthProgress] = useState({
    loggingIn: false,
    loggedIn: false,
  });
  const [databaseProgress, setDatabaseProgress] = useState({
    initializing: false,
    initialized: false,
  });
  const [deckCreationProgress, setDeckCreationProgress] = useState({
    currentDeck: 0, // 0 = not started, 1-3 = current deck, 4 = all complete
    totalDecks: 3,
  });
  
  const queueAIDecksCoachmark = useCallback(async () => {
    try {
      await AsyncStorage.setItem('shouldShowAIDecksCoachmark', 'true');
    } catch (error) {
      console.error('Error scheduling AI decks coachmark:', error);
    }
  }, []);

  // Function to hide loading overlay (exposed to parent)
  const hideLoadingOverlay = useCallback(() => {
    setShowLoadingOverlay(false);
  }, []);
  
  // Expose hideLoadingOverlay to parent component
  useEffect(() => {
    if (onHideLoadingOverlay) {
      onHideLoadingOverlay(hideLoadingOverlay);
    }
  }, [onHideLoadingOverlay, hideLoadingOverlay]);

  // Carousel data - create extended array with duplicates for circular navigation
  const originalCarouselPages = useMemo(() => [
    {
      id: 1,
      title: '1/7',
      subtitle: getTranslatedText(language, 'recallBasedQuestions'),
      bodyText: getTranslatedText(language, 'recallBasedExample'),
      image: CarouselPage1Image,
    },
    {
      id: 2,
      title: '2/7',
      subtitle: getTranslatedText(language, 'comprehensionQuestions'),
      bodyText: getTranslatedText(language, 'comprehensionExample'),
      images: [CarouselPage2Image1, CarouselPage2Image2],
    },
    {
      id: 3,
      title: '3/7',
      subtitle: getTranslatedText(language, 'applicationQuestions'),
      bodyText: getTranslatedText(language, 'applicationExample'),
      image: CarouselPage3Image,
    },
    {
      id: 4,
      title: '4/7',
      subtitle: getTranslatedText(language, 'analysisQuestions'),
      bodyText: getTranslatedText(language, 'analysisExample'),
      images: [CarouselPage4Image1, CarouselPage4Image2],
    },
    {
      id: 5,
      title: '5/7',
      subtitle: getTranslatedText(language, 'evaluationQuestions'),
      bodyText: getTranslatedText(language, 'evaluationExample'),
      images: [CarouselPage5Image1, CarouselPage5Image2],
    },
    {
      id: 6,
      title: '6/7',
      subtitle: getTranslatedText(language, 'problemSolvingQuestions'),
      bodyText: getTranslatedText(language, 'problemSolvingExample'),
      images: [CarouselPage6Image1, CarouselPage6Image2, CarouselPage6Image3],
    },
    {
      id: 7,
      title: '7/7',
      subtitle: getTranslatedText(language, 'criticalThinkingQuestions'),
      bodyText: getTranslatedText(language, 'criticalThinkingExample'),
      images: [CarouselPage7Image1, CarouselPage7Image2, CarouselPage7Image3, CarouselPage7Image4],
    },
  ], [language]);

  // Create extended carousel with duplicates for circular navigation
  // Add last page at the beginning and first page at the end
  const carouselPages = useMemo(() => [
    { ...originalCarouselPages[6], duplicateId: 0 }, // Duplicate last page at start (keep original id: 7)
    ...originalCarouselPages,
    { ...originalCarouselPages[0], duplicateId: 8 }, // Duplicate first page at end (keep original id: 1)
  ], [originalCarouselPages]);


  // Load language preference from AsyncStorage
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('languagePreferenceOnboarding');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguagePreference();
  }, []);

  // Initialize carousel position - start at index 1 (first real page)
  useEffect(() => {
    const initialPage = 1; // Start at the first real page (not the duplicate)
    carouselTranslateX.setValue(-initialPage * containerWidth.current);
    setCurrentCarouselPage(initialPage);
    isAnimating.current = false;
  }, []);

  // Reset carousel when entering onboardingPage5 or onboardingPage6
  useEffect(() => {
    if (currentSection === 'onboardingPage5' || currentSection === 'onboardingPage6') {
      // Stop any existing autoplay and reset state
      stopAutoplay();
      isAnimating.current = false;
      
      // Always reset to first real page, regardless of container width
      const initialPage = 1; // Start at the first real page (not the duplicate)
      setCurrentCarouselPage(initialPage);
      
      // Reset position with multiple attempts to ensure it sticks
      const resetPosition = () => {
        if (containerWidth.current > 0) {
          carouselTranslateX.setValue(-initialPage * containerWidth.current);
          console.log(`🔄 Carousel reset to page ${initialPage} at position ${-initialPage * containerWidth.current}`);
        }
      };
      
      // Try immediately
      resetPosition();
      
      // Try again after a short delay to ensure container is measured
      setTimeout(() => {
        resetPosition();
      }, 100);
      
      // Try one more time after a longer delay to catch any late measurements
      setTimeout(() => {
        resetPosition();
      }, 300);
    }
  }, [currentSection]);

  // Autoplay functionality
  const startAutoplay = () => {
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
    }
    
    autoplayTimer.current = setTimeout(() => {
      if (!isAnimating.current && 
          currentSection === 'onboardingPage5' && 
          containerWidth.current > 0 &&
          currentCarouselPage >= 1 && 
          currentCarouselPage <= 7) {
        handleCarouselSwipe('right'); // Move to next page
        // Don't call startAutoplay() here - let the useEffect handle it
      } else if (!isAnimating.current && 
          currentSection === 'onboardingPage6' && 
          containerWidth.current > 0 &&
          currentCarouselPage >= 1 && 
          currentCarouselPage <= 6) {
        handleCarouselSwipe('right'); // Move to next page
        // Don't call startAutoplay() here - let the useEffect handle it
      }
    }, 10000); // 10 seconds
  };

  const stopAutoplay = () => {
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  };

  // Start autoplay when entering onboardingPage5 or onboardingPage6
  useEffect(() => {
    if (currentSection === 'onboardingPage5' || currentSection === 'onboardingPage6') {
      // Wait for carousel to be fully initialized and positioned
      setTimeout(() => {
        // Double-check that we're at the correct starting page before starting autoplay
        if (containerWidth.current > 0 && currentCarouselPage === 1) {
          // Ensure position is correct before starting autoplay
          carouselTranslateX.setValue(-1 * containerWidth.current);
          console.log(`🎯 Starting autoplay from page 1 at position ${-1 * containerWidth.current}`);
          startAutoplay();
        } else {
          console.log(`⚠️ Autoplay not started - containerWidth: ${containerWidth.current}, currentPage: ${currentCarouselPage}`);
        }
      }, 1000); // Increased delay to ensure carousel is properly positioned
    } else {
      stopAutoplay();
    }

    // Cleanup on unmount or section change
    return () => {
      stopAutoplay();
    };
  }, [currentSection]);

  // Simple autoplay restart on every page change
  useEffect(() => {
    if (currentSection === 'onboardingPage5' || currentSection === 'onboardingPage6') {
      // Always restart autoplay when page changes, regardless of how we got there
      startAutoplay();
    }
  }, [currentCarouselPage, currentSection]);

  // Reset carousel when language changes
  useEffect(() => {
    if (currentSection === 'onboardingPage5' || currentSection === 'onboardingPage6') {
      // Reset to first page when language changes
      setCurrentCarouselPage(1);
      if (containerWidth.current > 0) {
      carouselTranslateX.setValue(-containerWidth.current);
      }
    }
  }, [language]);

  // Animation refs
  const animationRef = useRef<LottieView>(null);
  const logoAnimationRef = useRef<LottieView>(null);

  // Memoized animation sources to prevent unnecessary re-renders
  const backgroundAnimationSource = useMemo(() => 
    require('../assets/animations/SplashScreenAnimation.json'), 
    []
  );

  const logoAnimationSource = useMemo(() => 
    require('../assets/animations/splashScreenLogoAnimation.json'), 
    []
  );

  const loadingAnimation1Source = useMemo(() => 
    require('../assets/animations/LoadingAnimation1.json'), 
    []
  );

  const onboardingPage4InterviewQn1AnimationSource = useMemo(() => 
    require('../assets/onboarding/onboardingPage4InterviewQn1Animation.json'), 
    []
  );

  const onboardingPage4InterviewQn2AnimationSource = useMemo(() => 
    require('../assets/onboarding/onboardingPage4InterviewQn2Animation.json'), 
    []
  );

  const bookFlippingAnimationSource = useMemo(() => 
    require('../assets/onboarding/bookFlippingAnimation.json'), 
    []
  );

  const onboardingPage4StudyQn1AnimationSource = useMemo(() => 
    require('../assets/onboarding/onboardingPage4StudyQn1Animation.json'), 
    []
  );

  const downArrowAnimationSource = useMemo(() => 
    require('../assets/animations/DownArrowAnimation.json'), 
    []
  );

  const rubiksCubeAnimationSource = useMemo(() => 
    require('../assets/onboarding/rubiksCube.json'), 
    []
  );

  const aiAssistanceAnimationSource = useMemo(() => 
    require('../assets/onboarding/AIAssistance.json'), 
    []
  );

  const customizeStudyExperienceAnimationSource = useMemo(() => 
    require('../assets/onboarding/customizeStudyExperience.json'), 
    []
  );

  const trackProgressAnimationSource = useMemo(() => 
    require('../assets/onboarding/trackProgress.json'), 
    []
  );

  const aceInterviewAnimationSource = useMemo(() =>   
    require('../assets/onboarding/aceInterview.json'), 
    []
  );

  const booksAnimationSource = useMemo(() => 
    require('../assets/onboarding/books.json'), 
    []
  );


  // Carousel data for onboardingPage6 - different content structure
  const onboardingPage6CarouselPages = useMemo(() => [
    {
      id: 1,
      title: getTranslatedText(language, 'organizeDecksFlashcards'),
      animation: booksAnimationSource,
    },
    {
      id: 2,
      title: getTranslatedText(language, 'leverageAI'),
      animation: aiAssistanceAnimationSource,
    },
    {
      id: 3,
      title: getTranslatedText(language, 'addDecksAnyMethod'),
      image: require('../assets/onboarding/addDecksFromAnyMethod.png'),
    },
    {
      id: 4,
      title: getTranslatedText(language, 'customizeStudyExperience'),
      animation: customizeStudyExperienceAnimationSource,
    },
    {
      id: 5,
      title: getTranslatedText(language, 'instantFeedbackTrack'),
      animation: trackProgressAnimationSource,
    },
    {
      id: 6,
      title: getTranslatedText(language, 'quizChallengeYourself'),
      animation: aceInterviewAnimationSource,
    },
  ], [language, booksAnimationSource, aiAssistanceAnimationSource, customizeStudyExperienceAnimationSource, trackProgressAnimationSource, aceInterviewAnimationSource]);

  // Create extended carousel for onboardingPage6 with duplicates for circular navigation
  const onboardingPage6ExtendedCarousel = useMemo(() => [
    { ...onboardingPage6CarouselPages[5], duplicateId: 0 }, // Duplicate last page at start (index 5)
    ...onboardingPage6CarouselPages,
    { ...onboardingPage6CarouselPages[0], duplicateId: 7 }, // Duplicate first page at end (index 7)
  ], [onboardingPage6CarouselPages]);

  // Animation state for transitions
  const [showLanguageSelector, setShowLanguageSelector] = useState(true); // Pre-render to prevent glitch
  const logoFadeAnim = useRef(new Animated.Value(1)).current;
  const languageSelectorFadeAnim = useRef(new Animated.Value(0)).current;
  const pngBackgroundFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage1ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage2ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage3ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage4ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage5ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage6ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const signupPageFadeAnim = useRef(new Animated.Value(0)).current;
  const signupToggleFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Initialize animation values to prevent glitch
  useEffect(() => {
    logoFadeAnim.setValue(1);
    languageSelectorFadeAnim.setValue(0);
    pngBackgroundFadeAnim.setValue(0);
    onboardingPage1ContentFadeAnim.setValue(0);
    onboardingPage2ContentFadeAnim.setValue(0);
    onboardingPage3ContentFadeAnim.setValue(0);
    onboardingPage4ContentFadeAnim.setValue(0);
    onboardingPage5ContentFadeAnim.setValue(0);
    onboardingPage6ContentFadeAnim.setValue(0);
    signupPageFadeAnim.setValue(0);
    signupToggleFadeAnim.setValue(1);
  }, []);

  // Start animations on mount and set timer for background transition
  useEffect(() => {
    // Staggered animation startup for smoother performance
    const backgroundDelay = setTimeout(() => {
      if (animationRef.current) {
        animationRef.current.play();
      }
    }, Platform.OS === 'android' ? 80 : 30); // Start background first
    
    const logoDelay = setTimeout(() => {
      if (logoAnimationRef.current) {
        logoAnimationRef.current.play();
      }
    }, Platform.OS === 'android' ? 120 : 60); // Start logo slightly later

    // Set timer to start transition after 5 seconds
    const logoTimer = setTimeout(() => {
      // Start fade out animation for logo
      Animated.timing(logoFadeAnim, {
        toValue: 0,
        duration: Platform.OS === 'android' ? 300 : 500, // Faster on Android
        useNativeDriver: true,
      }).start(() => {
        // Hide logo animation and show language selector
        setHideLogoAnimation(true);
        
        // Small delay before starting fade in to prevent glitch
        setTimeout(() => {
          // Transition to language selection section
          setCurrentSection('languageSelection');
          // Start fade in animation for language selector
          Animated.timing(languageSelectorFadeAnim, {
            toValue: 1,
            duration: Platform.OS === 'android' ? 600 : 500, // Longer fade in on Android
            useNativeDriver: true,
          }).start();
        }, Platform.OS === 'android' ? 50 : 0); // Small delay on Android
      });
    }, 5000); // Extended to 5 seconds

    // Cleanup function to stop animations and clear timer when component unmounts
    return () => {
      clearTimeout(backgroundDelay);
      clearTimeout(logoDelay);
      if (animationRef.current) {
        animationRef.current.pause();
      }
      if (logoAnimationRef.current) {
        logoAnimationRef.current.pause();
      }
      clearTimeout(logoTimer);
    };
  }, [logoFadeAnim, languageSelectorFadeAnim]);

  // Ensure background animation is playing when in language selection section
  useEffect(() => {
    if (currentSection === 'languageSelection' && animationRef.current) {
      // Small delay to ensure smooth transition on Android
      const animationDelay = setTimeout(() => {
        if (animationRef.current) {
          if (Platform.OS === 'android') {
            animationRef.current.reset();
            setTimeout(() => {
              if (animationRef.current) {
                animationRef.current.play();
              }
            }, 100);
          } else {
            animationRef.current.play();
          }
        }
      }, Platform.OS === 'android' ? 200 : 50);

      return () => clearTimeout(animationDelay);
    }
  }, [currentSection]);

  // Handle content fade-in when transitioning to onboardingPage1
  useEffect(() => {
    if (currentSection === 'onboardingPage1') {
      // Small delay to ensure smooth transition
      const fadeDelay = setTimeout(() => {
        Animated.timing(onboardingPage1ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 100);

      return () => clearTimeout(fadeDelay);
    }
  }, [currentSection, onboardingPage1ContentFadeAnim]);

  const handleSkipPress = () => {
    // Mark that user skipped onboarding - no free decks will be created
    setIsSkipped(true);
    isSkippedRef.current = true;
    // Reset deck creation progress to ensure it doesn't show in loading screen
    setDeckCreationProgress({ currentDeck: 0, totalDecks: 3 });
    
    // Navigate to signup page within splashOnboarding instead of going to regular splash
    console.log(`🔄 Skip button pressed from ${currentSection} - transitioning to signup page`);
    
    if (currentSection === 'onboardingPage6') {
      // Fade out onboardingPage6 content first
      Animated.timing(onboardingPage6ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Ensure signup page starts hidden, then fade in
          signupPageFadeAnim.setValue(0);
          
          // Small delay to ensure section change is processed
          setTimeout(() => {
            Animated.timing(signupPageFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              console.log('✅ Transition to signup page complete');
            });
          }, 50);
        });
      });
    } else if (currentSection === 'onboardingPage5') {
      // Fade out onboardingPage5 content first
      Animated.timing(onboardingPage5ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Ensure signup page starts hidden, then fade in
          signupPageFadeAnim.setValue(0);
          
          // Small delay to ensure section change is processed
          setTimeout(() => {
            Animated.timing(signupPageFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              console.log('✅ Transition to signup page complete');
            });
          }, 50);
        });
      });
    } else if (currentSection === 'onboardingPage4') {
      // Fade out onboardingPage4 content first
      Animated.timing(onboardingPage4ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Ensure signup page starts hidden, then fade in
          signupPageFadeAnim.setValue(0);
          
          // Small delay to ensure section change is processed
          setTimeout(() => {
            Animated.timing(signupPageFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              console.log('✅ Transition to signup page complete');
            });
          }, 50);
        });
      });
    } else if (currentSection === 'onboardingPage3') {
      // Fade out onboardingPage3 content first
      Animated.timing(onboardingPage3ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Ensure signup page starts hidden, then fade in
          signupPageFadeAnim.setValue(0);
          
          // Small delay to ensure section change is processed
          setTimeout(() => {
            Animated.timing(signupPageFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              console.log('✅ Transition to signup page complete');
            });
          }, 50);
        });
      });
    } else if (currentSection === 'onboardingPage2') {
      // Fade out onboardingPage2 content first
      Animated.timing(onboardingPage2ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Ensure signup page starts hidden, then fade in
          signupPageFadeAnim.setValue(0);
          
          // Small delay to ensure section change is processed
          setTimeout(() => {
            Animated.timing(signupPageFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              console.log('✅ Transition to signup page complete');
            });
          }, 50);
        });
      });
    } else if (currentSection === 'onboardingPage1') {
      // Fade out onboardingPage1 content first
      Animated.timing(onboardingPage1ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Ensure signup page starts hidden, then fade in
          signupPageFadeAnim.setValue(0);
          
          // Small delay to ensure section change is processed
          setTimeout(() => {
            Animated.timing(signupPageFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              console.log('✅ Transition to signup page complete');
            });
          }, 50);
        });
      });
    } else {
      // For language selection or other pages, go directly to signup page
      setCurrentSection('signupPage');
      
      // Ensure signup page starts hidden, then fade in
      signupPageFadeAnim.setValue(0);
      
      // Small delay to ensure section change is processed
      setTimeout(() => {
        Animated.timing(signupPageFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          console.log('✅ Transition to signup page complete');
        });
      }, 50);
    }
  };

  const handleNextPress = () => {
    if (currentSection === 'languageSelection') {
      // Start fade-out of language selector first
      Animated.timing(languageSelectorFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After language selector fades out, transition to onboardingPage1
        setCurrentSection('onboardingPage1');
        
        // Then fade in the PNG background smoothly
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage1') {
      // Fade out onboardingPage1 content first
      Animated.timing(onboardingPage1ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition to onboardingPage2
        setCurrentSection('onboardingPage2');
        
        // Then fade in onboardingPage2 content
        Animated.timing(onboardingPage2ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage2') {
      // Fade out onboardingPage2 content first
      Animated.timing(onboardingPage2ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition to onboardingPage3
        setCurrentSection('onboardingPage3');
        
        // Then fade in onboardingPage3 content
        Animated.timing(onboardingPage3ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage3') {
      // Fade out onboardingPage3 content first
      Animated.timing(onboardingPage3ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition to onboardingPage4
        setCurrentSection('onboardingPage4');
        
        // Then fade in onboardingPage4 content
        Animated.timing(onboardingPage4ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage4') {
      // Fade out onboardingPage4 content first
      Animated.timing(onboardingPage4ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition to onboardingPage5
        setCurrentSection('onboardingPage5');
        
        // Ensure carousel is properly positioned before showing content
        setTimeout(() => {
        // Then fade in onboardingPage5 content
        Animated.timing(onboardingPage5ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        }, 50); // Small delay to ensure carousel is positioned
      });
    } else if (currentSection === 'onboardingPage5') {
      // Fade out onboardingPage5 content first
      Animated.timing(onboardingPage5ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition to onboardingPage6
        setCurrentSection('onboardingPage6');
        
        // Then fade in onboardingPage6 content
        Animated.timing(onboardingPage6ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage6') {
      // Fade out onboardingPage6 content first
      Animated.timing(onboardingPage6ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, fade out PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition to signup page
          setCurrentSection('signupPage');
          
          // Then fade in signup page content
          Animated.timing(signupPageFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      });
    }
  };

  const handleBackPress = () => {
    if (currentSection === 'onboardingPage1') {
      // Start smooth fade-out of PNG background first
      Animated.timing(pngBackgroundFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // After PNG fades out, transition to language selection
        setCurrentSection('languageSelection');
        setShowLanguageSelector(true);
        
        // Ensure background animation is playing with Android-specific handling
        if (animationRef.current) {
          // For Android, we need to restart the animation more explicitly
          if (Platform.OS === 'android') {
            animationRef.current.reset();
            setTimeout(() => {
              if (animationRef.current) {
                animationRef.current.play();
              }
            }, 50);
          } else {
            animationRef.current.play();
          }
        }
        
        // Then fade in the language selector smoothly
        Animated.timing(languageSelectorFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage2') {
      // Fade out onboardingPage2 content first
      Animated.timing(onboardingPage2ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition back to onboardingPage1
        setCurrentSection('onboardingPage1');
        
        // Then fade in onboardingPage1 content
        Animated.timing(onboardingPage1ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage3') {
      // Fade out onboardingPage3 content first
      Animated.timing(onboardingPage3ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition back to onboardingPage2
        setCurrentSection('onboardingPage2');
        
        // Then fade in onboardingPage2 content
        Animated.timing(onboardingPage2ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage4') {
      // Fade out onboardingPage4 content first
      Animated.timing(onboardingPage4ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition back to onboardingPage3
        setCurrentSection('onboardingPage3');
        
        // Then fade in onboardingPage3 content
        Animated.timing(onboardingPage3ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage5') {
      // Fade out onboardingPage5 content first
      Animated.timing(onboardingPage5ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition back to onboardingPage4
        setCurrentSection('onboardingPage4');
        
        // Then fade in onboardingPage4 content
        Animated.timing(onboardingPage4ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (currentSection === 'onboardingPage6') {
      // Fade out onboardingPage6 content first
      Animated.timing(onboardingPage6ContentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After content fades out, transition back to onboardingPage5
        setCurrentSection('onboardingPage5');
        
        // Ensure carousel is properly positioned before showing content
        setTimeout(() => {
        // Then fade in onboardingPage5 content
        Animated.timing(onboardingPage5ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        }, 50); // Small delay to ensure carousel is positioned
      });
    } else if (currentSection === 'signupPage') {
      // Fade out signup page content first
      Animated.timing(signupPageFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Then fade in PNG background
        Animated.timing(pngBackgroundFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Transition back to onboardingPage6
          setCurrentSection('onboardingPage6');
          
          // Then fade in onboardingPage6 content
          Animated.timing(onboardingPage6ContentFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      });
    }
  };

  const handleLanguageChange = async (languageKey: string) => {
    // Reflect the user's choice in UI
    setSelectedLanguage(languageKey as any);
    // Only persist and set context for English/Chinese; otherwise show error toast
    if (languageKey === 'English' || languageKey === 'Chinese') {
      setLanguage(languageKey as any);
      try {
        await AsyncStorage.setItem('languagePreferenceOnboarding', languageKey);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    } else {
      const msg = strings[language]?.appSettingsPage?.languageNotAvailableYet 
        || strings.English.appSettingsPage.languageNotAvailableYet;
      showErrorToast(msg);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (selectedCard === 'study') {
      setStudySelectedSuggestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(suggestion)) {
          newSet.delete(suggestion);
        } else {
          newSet.add(suggestion);
        }
        return newSet;
      });
    } else if (selectedCard === 'interview') {
      setInterviewSelectedSuggestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(suggestion)) {
          newSet.delete(suggestion);
        } else {
          newSet.add(suggestion);
        }
        return newSet;
      });
    }
  };

  const handleEducationSuggestionPress = (suggestion: string) => {
    if (selectedCard === 'study') {
      setStudySelectedEducationSuggestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(suggestion)) {
          newSet.delete(suggestion);
        } else {
          newSet.add(suggestion);
        }
        return newSet;
      });
    } else if (selectedCard === 'interview') {
      setInterviewSelectedEducationSuggestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(suggestion)) {
          newSet.delete(suggestion);
        } else {
          newSet.add(suggestion);
        }
        return newSet;
      });
    }
  };

  const handleCarouselSwipe = (direction: 'left' | 'right') => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    let newPage;
    
    if (direction === 'right') {
      // Swipe right - go to next page (wrap around to first page if on last page)
      newPage = (currentCarouselPage + 1) % carouselPages.length;
    } else {
      // Swipe left - go to previous page (wrap around to last page if on first page)
      newPage = currentCarouselPage === 0 ? carouselPages.length - 1 : currentCarouselPage - 1;
    }
    
    setCurrentCarouselPage(newPage);
    
    Animated.spring(carouselTranslateX, {
      toValue: -newPage * containerWidth.current,
      useNativeDriver: true,
      tension: 140,
      friction: 12,
    }).start(() => {
      // Handle wrap-around transitions
      if (newPage === 0) {
        // If we're at the duplicate last page, jump to the real last page
        const realLastPage = 7; // Index of real last page
        setCurrentCarouselPage(realLastPage);
        carouselTranslateX.setValue(-realLastPage * containerWidth.current);
      } else if (newPage === 8) {
        // If we're at the duplicate first page, jump to the real first page
        const realFirstPage = 1; // Index of real first page
        setCurrentCarouselPage(realFirstPage);
        carouselTranslateX.setValue(-realFirstPage * containerWidth.current);
      }
      isAnimating.current = false;
    });
  };

  const handlePanGesture = (event: any) => {
    const { translationX, velocityX, state } = event.nativeEvent;
    
    if (containerWidth.current === 0) return;
    
    if (state === State.BEGAN) {
      carouselTranslateX.stopAnimation();
      isAnimating.current = false;
    } else if (state === State.ACTIVE) {
      // Keep content in place during swipe - don't move with finger
      // Content should stay put until swipe is complete
      const baseOffset = -currentCarouselPage * containerWidth.current;
      carouselTranslateX.setValue(baseOffset);
    } else if (state === State.END) {
      const threshold = containerWidth.current * 0.2;
      const velocityThreshold = 250;
      
      let targetPage = currentCarouselPage;
      
      if (translationX < -threshold || velocityX < -velocityThreshold) {
        // Swipe left - go to next page
        targetPage = currentCarouselPage + 1;
      } else if (translationX > threshold || velocityX > velocityThreshold) {
        // Swipe right - go to previous page
        targetPage = currentCarouselPage - 1;
      }
      
      setCurrentCarouselPage(targetPage);
      isAnimating.current = true;
      
      // Use spring animation for all transitions to maintain consistent feel
      Animated.spring(carouselTranslateX, {
        toValue: -targetPage * containerWidth.current,
        useNativeDriver: true,
        tension: 140,
        friction: 12,
      }).start(() => {
        // Handle wrap-around transitions
        if (targetPage === 0) {
          // If we're at the duplicate last page, jump to the real last page
          const realLastPage = 7; // Index of real last page
          setCurrentCarouselPage(realLastPage);
          carouselTranslateX.setValue(-realLastPage * containerWidth.current);
        } else if (targetPage === 8) {
          // If we're at the duplicate first page, jump to the real first page
          const realFirstPage = 1; // Index of real first page
          setCurrentCarouselPage(realFirstPage);
          carouselTranslateX.setValue(-realFirstPage * containerWidth.current);
        }
        isAnimating.current = false;
      });
    }
  };

  // Network connectivity check function
  const checkNetworkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Network connectivity check failed:', error);
      return false;
    }
  }, []);

  // Network error modal handlers
  const handleShowNetworkErrorModal = useCallback(() => {
    setIsNetworkErrorModalOpen(true);
    Animated.parallel([
      Animated.timing(networkErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(networkErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [networkErrorOverlayOpacity, networkErrorModalOpacity]);

  const handleDismissNetworkErrorModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(networkErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(networkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNetworkErrorModalOpen(false);
    });
  }, [networkErrorOverlayOpacity, networkErrorModalOpacity]);

  // Authentication handlers
  const handleHideToast = useCallback(() => {
    setToastVisible(false);
    setToastBackgroundColor(undefined);
  }, []);

  const showSuccessToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastBackgroundColor('#44B88A');
    setToastVisible(true);
  }, []);

  const showErrorToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastBackgroundColor(undefined);
    setToastVisible(true);
  }, []);

  const startResendCountdown = useCallback(() => {
    setCanResendCode(false);
    setResendCountdown(5);
  }, []);

  const transitionPasswordResetStep = useCallback((newStep: 'email' | 'code' | 'newPassword') => {
    Animated.timing(passwordResetFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setPasswordResetStep(newStep);
      Animated.timing(passwordResetFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [passwordResetFadeAnim]);

  const validateSignUp = useCallback(() => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showErrorToast(getTranslatedText(language, 'fillUpBothEmailAndPassword'));
      return false;
    }
    if (password !== confirmPassword) {
      showErrorToast(getTranslatedText(language, 'passwordsDontMatch'));
      return false;
    }
    return true;
  }, [email, password, confirmPassword, language, showErrorToast]);

  const handleSignUp = useCallback(async () => {
    if (validateSignUp()) {
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        handleShowNetworkErrorModal();
        return;
      }

      try {
        if (!signUp) {
          setToastMessage(getTranslatedText(language, 'signUpFailed'));
          setToastVisible(true);
          return;
        }

        const result = await signUp.create({
          emailAddress: email.trim(),
          password,
        });

        if (result.status === 'complete') {
          if (setActive) {
            await setActive({ session: result.createdSessionId });
          }
          setIsFreshAuth(true);
          setShowLoadingOverlay(true);
          setAuthProgress({ loggingIn: true, loggedIn: false });
          // Initialize deck creation progress to show immediately (only if user didn't skip)
          if (!isSkippedRef.current) {
            setDeckCreationProgress({ currentDeck: 1, totalDecks: 3 });
          }
          showSuccessToast(getTranslatedText(language, 'accountCreatedSuccessfully'));
        } else if (result.status === 'missing_requirements') {
          await result.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPendingSignUpAttempt(result);
          setHasVerificationError(false);
          startResendCountdown();
          setVerificationModalVisible(true);
          showSuccessToast(getTranslatedText(language, 'verificationCodeSent'));
        } else {
          showErrorToast(getTranslatedText(language, 'signUpFailed'));
        }
      } catch (error: any) {
        // Check if it's a network error - check multiple patterns
        const errorString = JSON.stringify(error).toLowerCase();
        const errorMessageLower = error?.message?.toLowerCase() || '';
        const isNetworkError = errorMessageLower.includes('network') || 
                              errorMessageLower.includes('request failed') ||
                              error?.message?.toLowerCase().includes('network') ||
                              error?.message?.toLowerCase().includes('request failed') ||
                              error?.errors?.[0]?.message?.toLowerCase().includes('network') ||
                              error?.errors?.[0]?.message?.toLowerCase().includes('request failed') ||
                              errorString.includes('network request failed') ||
                              errorString.includes('network error') ||
                              errorString.includes('request failed') ||
                              error?.code === 'network_error' ||
                              error?.status === 'network_error' ||
                              error?.name === 'TypeError' && errorMessageLower.includes('failed');
        
        if (isNetworkError) {
          handleShowNetworkErrorModal();
        } else {
          showErrorToast(getTranslatedText(language, 'signUpFailed'));
        }
      }
    }
  }, [validateSignUp, email, password, signUp, setActive, language, showSuccessToast, showErrorToast, startResendCountdown, checkNetworkConnectivity, handleShowNetworkErrorModal]);

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      showErrorToast(getTranslatedText(language, 'fillUpBothEmailAndPassword'));
      return;
    }
    
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      handleShowNetworkErrorModal();
      return;
    }
    
    try {
      const result = await signInWithEmail(email.trim(), password);

      if (result.success) {
        setIsFreshAuth(true);
        setShowLoadingOverlay(true);
        setAuthProgress({ loggingIn: true, loggedIn: false });
        // Initialize deck creation progress to show immediately (only if user didn't skip)
        if (!isSkippedRef.current) {
          setDeckCreationProgress({ currentDeck: 1, totalDecks: 3 });
        }
      } else {
        // Check if it's a network error - check multiple patterns
        const errorString = JSON.stringify(result).toLowerCase();
        const isNetworkError = result.error?.toLowerCase().includes('network') || 
                              result.error?.toLowerCase().includes('request failed') ||
                              errorString.includes('network request failed') ||
                              errorString.includes('network error') ||
                              errorString.includes('request failed');
        
        if (isNetworkError) {
          handleShowNetworkErrorModal();
          return;
        }
        
        showErrorToast(getTranslatedText(language, 'signInFailed'));
      }
    } catch (error: any) {
      // Check if it's a network error - check multiple patterns
      const errorString = JSON.stringify(error).toLowerCase();
      const errorMessageLower = error?.message?.toLowerCase() || '';
      const isNetworkError = errorMessageLower.includes('network') || 
                            errorMessageLower.includes('request failed') ||
                            error?.message?.toLowerCase().includes('network') ||
                            error?.message?.toLowerCase().includes('request failed') ||
                            errorString.includes('network request failed') ||
                            errorString.includes('network error') ||
                            errorString.includes('request failed') ||
                            error?.code === 'network_error' ||
                            error?.status === 'network_error' ||
                            error?.name === 'TypeError' && errorMessageLower.includes('failed');
      
      if (isNetworkError) {
        handleShowNetworkErrorModal();
      } else {
        showErrorToast(getTranslatedText(language, 'signInFailed'));
      }
    }
  }, [email, password, signInWithEmail, language, showErrorToast, checkNetworkConnectivity, handleShowNetworkErrorModal]);

  const handleSocialLogin = useCallback(async (provider: 'google' | 'facebook' | 'apple') => {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      handleShowNetworkErrorModal();
      return;
    }

    try {
      let oauthFunction;
      switch (provider) {
        case 'google':
          oauthFunction = signInWithGoogle;
          break;
        case 'facebook':
          oauthFunction = signInWithFacebook;
          break;
        case 'apple':
          oauthFunction = signInWithApple;
          break;
        default:
          showErrorToast(getTranslatedText(language, 'providerNotSupported'));
          return;
      }
    
      await oauthFunction();
      
      setIsFreshAuth(true);
      setShowLoadingOverlay(true);
      setAuthProgress({ loggingIn: true, loggedIn: false });
      // Initialize deck creation progress to show immediately (only if user didn't skip)
      if (!isSkippedRef.current) {
        setDeckCreationProgress({ currentDeck: 1, totalDecks: 3 });
      }
    } catch (error: any) {
      setShowLoadingOverlay(false);
      setIsFreshAuth(false);
      
      if (error?.code === 'oauth_canceled') {
        return;
      }
      
      let fallbackMessage;
      switch (provider) {
        case 'google':
          fallbackMessage = getTranslatedText(language, 'googleSignInFailed');
          break;
        case 'facebook':
          fallbackMessage = getTranslatedText(language, 'facebookSignInFailed');
          break;
        case 'apple':
          fallbackMessage = getTranslatedText(language, 'appleSignInFailed');
          break;
        default:
          fallbackMessage = getTranslatedText(language, 'signInFailed');
      }
      
      // Check if it's a network error - check multiple patterns
      const errorString = JSON.stringify(error).toLowerCase();
      const errorMessageLower = error?.message?.toLowerCase() || '';
      const isNetworkError = errorMessageLower.includes('network') || 
                            errorMessageLower.includes('request failed') ||
                            error?.message?.toLowerCase().includes('network') ||
                            error?.message?.toLowerCase().includes('request failed') ||
                            errorString.includes('network request failed') ||
                            errorString.includes('network error') ||
                            errorString.includes('request failed') ||
                            error?.code === 'network_error' ||
                            error?.status === 'network_error' ||
                            error?.name === 'TypeError' && errorMessageLower.includes('failed');
      
      if (isNetworkError) {
        handleShowNetworkErrorModal();
      } else {
        showErrorToast(fallbackMessage);
      }
    }
  }, [signInWithGoogle, signInWithFacebook, signInWithApple, language, showErrorToast, checkNetworkConnectivity, handleShowNetworkErrorModal]);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
  }, []);

  const handleForgotPassword = useCallback(() => {
    setForgotPasswordModalVisible(true);
    setForgotPasswordEmail(email.trim());
  }, [email]);

  const handlePasswordReset = useCallback(async () => {
    if (!forgotPasswordEmail.trim()) {
      showErrorToast(getTranslatedText(language, 'pleaseEnterYourEmailAddress'));
      return;
    }

    setIsResettingPassword(true);

    try {
      if (!signIn) {
        showErrorToast(getTranslatedText(language, 'signInNotAvailable'));
        setIsResettingPassword(false);
        return;
      }

      const result = await signIn.create({
        identifier: forgotPasswordEmail.trim(),
      });

      const resetPasswordFactor = result.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'reset_password_email_code'
      );

      if (!resetPasswordFactor) {
        showErrorToast(getTranslatedText(language, 'passwordResetNotAvailable'));
        setIsResettingPassword(false);
        return;
      }

      await result.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: (resetPasswordFactor as any).emailAddressId,
      });

      setPendingPasswordReset(result);
      setHasPasswordResetError(false);
      transitionPasswordResetStep('code');
      showSuccessToast(getTranslatedText(language, 'passwordResetEmailSent'));
    } catch (error: any) {
      showErrorToast(getTranslatedText(language, 'failedToSendResetEmail'));
    }

    setIsResettingPassword(false);
  }, [forgotPasswordEmail, signIn, language, showSuccessToast, showErrorToast, transitionPasswordResetStep]);

  const handleCloseModal = useCallback(() => {
    setForgotPasswordModalVisible(false);
    setPasswordResetStep('email');
    setPasswordResetCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
    setPendingPasswordReset(null);
    setForgotPasswordEmail('');
    setHasPasswordResetError(false);
    passwordResetFadeAnim.setValue(1);
  }, [passwordResetFadeAnim]);

  const handleVerifyResetCode = useCallback(async () => {
    const code = passwordResetCode.join('');
    if (code.length !== 6) {
      setHasPasswordResetError(true);
      return;
    }

    if (!pendingPasswordReset) {
      showErrorToast(getTranslatedText(language, 'passwordResetSessionExpired'));
      return;
    }

    setIsVerifyingResetCode(true);

    try {
      const result = await pendingPasswordReset.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        transitionPasswordResetStep('newPassword');
        setPasswordResetCode(['', '', '', '', '', '']);
        setHasPasswordResetError(false);
      } else {
        setHasPasswordResetError(true);
      }
    } catch (error: any) {
      setHasPasswordResetError(true);
    }

    setIsVerifyingResetCode(false);
  }, [passwordResetCode, pendingPasswordReset, showErrorToast, transitionPasswordResetStep, language]);

  const handleSetNewPassword = useCallback(async () => {
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      showErrorToast(getTranslatedText(language, 'pleaseFillBothPasswordFields'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showErrorToast(getTranslatedText(language, 'passwordsDoNotMatch'));
      return;
    }

    if (!pendingPasswordReset) {
      showErrorToast(getTranslatedText(language, 'passwordResetSessionExpired'));
      return;
    }

    try {
      await pendingPasswordReset.resetPassword({
        password: newPassword,
      });

      try {
        await signOut();
      } catch {
        console.log('No session to clear after password reset');
      }

      setForgotPasswordModalVisible(false);
      showSuccessToast(getTranslatedText(language, 'passwordResetSuccess'));
      
      setPasswordResetStep('email');
      setPasswordResetCode(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
      setPendingPasswordReset(null);
      setForgotPasswordEmail('');
      setHasPasswordResetError(false);
      
      passwordResetFadeAnim.setValue(1);
      
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      showErrorToast(getTranslatedText(language, 'failedToResetPassword'));
    }
  }, [newPassword, confirmNewPassword, pendingPasswordReset, showErrorToast, showSuccessToast, language, signOut, passwordResetFadeAnim]);

  const handlePasswordResetCodeChange = useCallback((text: string, index: number) => {
    if (hasPasswordResetError) {
      setHasPasswordResetError(false);
    }

    if (text.length > 1) {
      const chars = text.slice(0, 6).split('');
      const newCode = [...passwordResetCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setPasswordResetCode(newCode);
      return;
    }

    const newCode = [...passwordResetCode];
    newCode[index] = text;
    setPasswordResetCode(newCode);

    if (text && index < 5) {
      const nextInput = passwordResetInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  }, [passwordResetCode, hasPasswordResetError]);

  const handlePasswordResetCodeKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !passwordResetCode[index] && index > 0) {
      const prevInput = passwordResetInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  }, [passwordResetCode]);

  const handleVerificationCodeChange = useCallback((text: string, index: number) => {
    if (hasVerificationError) {
      setHasVerificationError(false);
    }

    if (text.length > 1) {
      const chars = text.slice(0, 6).split('');
      const newCode = [...verificationCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setVerificationCode(newCode);
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    if (text && index < 5) {
      const nextInput = verificationInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  }, [verificationCode, hasVerificationError]);

  const handleVerificationCodeKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = verificationInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  }, [verificationCode]);

  const handleVerifyCode = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      showErrorToast(getTranslatedText(language, 'pleaseEnterAllDigits'));
      return;
    }

    if (!pendingSignUpAttempt) {
      showErrorToast(getTranslatedText(language, 'verificationFailed'));
      return;
    }

    setIsVerifying(true);

    try {
      const result = await pendingSignUpAttempt.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        setVerificationModalVisible(false);
        setVerificationCode(['', '', '', '', '', '']);
        setPendingSignUpAttempt(null);
        setHasVerificationError(false);
        setIsFreshAuth(true);
        setShowLoadingOverlay(true);
        setAuthProgress({ loggingIn: true, loggedIn: false });
        // Initialize deck creation progress to show immediately (only if user didn't skip)
        if (!isSkippedRef.current) {
          setDeckCreationProgress({ currentDeck: 1, totalDecks: 3 });
        }
        showSuccessToast(getTranslatedText(language, 'accountCreatedSuccessfully'));
      } else {
        setHasVerificationError(true);
      }
    } catch (error: any) {
      setHasVerificationError(true);
    }

    setIsVerifying(false);
  }, [verificationCode, pendingSignUpAttempt, setActive, language, showSuccessToast, showErrorToast]);

  const handleResendCode = useCallback(async () => {
    if (!pendingSignUpAttempt) {
      return;
    }

    setIsResendingCode(true);

    try {
      await pendingSignUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });
      showSuccessToast(getTranslatedText(language, 'verificationCodeSent'));
      startResendCountdown();
    } catch (error: any) {
      showErrorToast(getTranslatedText(language, 'verificationFailed'));
    }

    setIsResendingCode(false);
  }, [pendingSignUpAttempt, language, showSuccessToast, showErrorToast, startResendCountdown]);

  const handleCloseVerificationModal = useCallback(() => {
    setVerificationModalVisible(false);
    setVerificationCode(['', '', '', '', '', '']);
    setPendingSignUpAttempt(null);
    setHasVerificationError(false);
    setCanResendCode(false);
    setResendCountdown(5);
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  }, []);

  const handleSignInPress = useCallback(() => {
    if (isSignIn) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  }, [isSignIn, handleSignIn, handleSignUp]);

  const handleGoogleLogin = useCallback(() => {
    handleSocialLogin('google');
  }, [handleSocialLogin]);

  const handleAppleLogin = useCallback(() => {
    handleSocialLogin('apple');
  }, [handleSocialLogin]);

  const handleFacebookLogin = useCallback(() => {
    handleSocialLogin('facebook');
  }, [handleSocialLogin]);

  const handleToggleSignIn = useCallback(() => {
    if (!isSignIn) {
      Animated.timing(signupToggleFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsSignIn(true);
        Animated.timing(signupToggleFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isSignIn, signupToggleFadeAnim]);

  const handleToggleSignUp = useCallback(() => {
    if (isSignIn) {
      Animated.timing(signupToggleFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsSignIn(false);
        Animated.timing(signupToggleFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isSignIn, signupToggleFadeAnim]);

  const handleForgotPasswordEmailChange = useCallback((text: string) => {
    setForgotPasswordEmail(text);
  }, []);

  const handleNewPasswordChange = useCallback((text: string) => {
    setNewPassword(text);
  }, []);

  const handleConfirmNewPasswordChange = useCallback((text: string) => {
    setConfirmNewPassword(text);
  }, []);

  // Handle database initialization directly in splashOnboarding
  // This ensures loading animation stays visible throughout the entire process
  const handleDatabaseInitialization = async () => {
    try {
      console.log('🚀 Starting database initialization from splashOnboarding...');
      
      // Import the necessary functions
      const { setupDatabase } = await import('@/db/index');
      const NotificationService = (await import('@/utils/notifications')).default;
        
        // Stop all background tasks first
        const stopAllBackgroundTasks = async () => {
          try {
            console.log('🛑 Stopping all background tasks on app startup...');
            
            // Stop backup background task
            if (BackgroundService.isRunning()) {
              await BackgroundService.stop();
              console.log('✅ Backup background task stopped');
            }
            
            // Stop any other background tasks if they exist
            // Add more background task stops here as needed
            
            console.log('✅ All background tasks stopped successfully');
          } catch (error) {
            console.error('❌ Error stopping background tasks:', error);
          }
        };
        
        await stopAllBackgroundTasks();
        
        // Database initialization already completed before AI deck creation
        console.log('✅ Database already initialized before AI deck creation');
        
        // Initialize notifications
        console.log('🔔 Initializing notifications...');
        await NotificationService.getInstance().initialize();
        console.log('✅ Notifications initialized successfully');
        
        // Signal that database is ready before calling onAuthComplete
        // This ensures the main app will show instead of splash screen
        console.log('✅ Database ready - transitioning to main app');
        
        // Call onAuthComplete first to trigger navigation
        onAuthComplete?.();
        
        // Hide loading overlay AFTER navigation is triggered (small delay to ensure state updates propagate)
        // This prevents showing the signup screen briefly before navigation completes
        setTimeout(() => {
          setShowLoadingOverlay(false);
          setIsFreshAuth(false);
          
          // Reset progress states
          setAuthProgress({ loggingIn: false, loggedIn: false });
          setDatabaseProgress({ initializing: false, initialized: false });
          setDeckCreationProgress({ currentDeck: 0, totalDecks: 3 });
        }, 100);
        
      } catch (error) {
        console.error('❌ Error during database initialization:', error);
        
        // Call onAuthComplete first to trigger navigation
        onAuthComplete?.();
        
        // Hide loading overlay AFTER navigation is triggered (small delay to ensure state updates propagate)
        setTimeout(() => {
          setShowLoadingOverlay(false);
          setIsFreshAuth(false);
        }, 100);
      }
    };

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const handleAuthComplete = async () => {
        try {
          if (user?.id) {
            // Set auth progress - logged in successfully
            setAuthProgress({ loggingIn: true, loggedIn: true });
            
            // Store userID in AsyncStorage for compatibility with existing database operations
            await AsyncStorage.setItem('userID', user.id);
            
            // Check if user exists in local database, if not create them
            // This handles both new Clerk signups and social login users
            const dbSuccess = await createUser(user.id);
            if (!dbSuccess) {
              console.warn('Failed to create user in local database, but Clerk auth succeeded');
            }

            // Initialize database BEFORE creating AI decks to avoid wiping them out
            console.log('🚀 Initializing database before AI deck creation...');
            setDatabaseProgress({ initializing: true, initialized: false });
            const { setupDatabase } = await import('@/db/index');
            const startTime = Date.now();
            await setupDatabase();
            const endTime = Date.now();
            console.log(`✅ Database initialization completed in ${endTime - startTime}ms`);
            setDatabaseProgress({ initializing: true, initialized: true });

            // Generate 3 free decks for new signups only (not sign-ins and not if user skipped)
            if (isFreshAuth && !isSkippedRef.current) {
              // Deck creation progress already initialized when loading overlay was shown
              try {
                console.log('🎁 Generating 3 free decks for new user...');
                
                // Collect onboarding responses
                const onboardingResponses: OnboardingResponses = {
                  selectedCard,
                  studySubjectInput,
                  studySelectedSuggestions,
                  interviewSubjectInput,
                  interviewSelectedSuggestions,
                  studyEducationInput,
                  studySelectedEducationSuggestions,
                  interviewEducationInput,
                  interviewSelectedEducationSuggestions,
                  experienceLevelInput,
                  companyInput,
                  topicsInput,
                  examInput,
                  studyTopicsInput,
                  interviewType: Array.from(interviewSelectedEducationSuggestions).join(', ') || 'technical', // Use selected interview types
                  language: selectedLanguage
                };

                // Generate 3 prompts with their corresponding form fields for free deck creation
                const { prompts, formFields } = await generateOnboardingPromptsWithFormFields({
                  responses: onboardingResponses,
                  isMcqEnabled: true,
                  isClozeEnabled: true,
                  isVoiceRecordedEnabled: true,
                  numberOfQuestions: 5,
                  questionType: []
                });

                console.log('✅ Generated 3 prompts for free decks:', prompts.length);
                console.log('✅ Generated 3 form fields for free decks:', formFields.length);
                
                // Call backend function for each prompt and create AI decks
                const { createAIDeckWithFlashcards } = await import('@/db/decks');
                const createdDeckIds: number[] = [];
                
                console.log('📝 Prompts ready for Supabase edge function:');
                prompts.forEach((prompt, index) => {
                  console.log(`\n${'='.repeat(80)}`);
                  console.log(`🎯 PROMPT ${index + 1}/3`);
                  console.log(`${'='.repeat(80)}`);
                  console.log(prompt);
                  console.log(`${'='.repeat(80)}\n`);
                });

                for (let i = 0; i < prompts.length; i++) {
                  try {
                    console.log(`🚀 Calling backend for prompt ${i + 1}/3...`);
                    
                    // Call the Supabase Edge Function
                    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/genAIFlashcardsGeneration`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                      },
                      body: JSON.stringify({ prompt: prompts[i] }),
                    });

                    if (!response.ok) {
                      throw new Error(`API request failed with status: ${response.status}`);
                    }

                    const data = await response.json();
                    let flashcards = data.flashcards?.flashcards ?? data.flashcards;
                    
                    // Handle case where API returns flashcards as raw string
                    if (typeof flashcards === 'string') {
                      try {
                        let cleanedString = flashcards.trim();
                        if (cleanedString.endsWith(']')) {
                          cleanedString = cleanedString.slice(0, -1);
                        }
                        if (cleanedString.startsWith('[')) {
                          cleanedString = cleanedString.slice(1);
                        }
                        cleanedString = cleanedString.trim();
                        
                        if (!cleanedString.startsWith('{')) {
                          throw new Error('Invalid flashcard format');
                        }
                        
                        const parsedFlashcards = JSON.parse(cleanedString);
                        flashcards = [parsedFlashcards];
                      } catch (parseError) {
                        console.error('Failed to parse flashcards string:', parseError);
                        throw new Error('Invalid flashcards format from API');
                      }
                    }
                    
                    if (flashcards && !Array.isArray(flashcards)) {
                      flashcards = [flashcards];
                    }
                    
                    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
                      throw new Error('No flashcards generated');
                    }

                    console.log(`✅ Generated ${flashcards.length} flashcards for prompt ${i + 1}`);

                    // Create AI deck with flashcards using temporary user ID
                    const deckName = `Free Deck ${i + 1} - ${selectedCard === 'study' ? 'Study' : 'Interview'}`;
                    const mode = selectedCard === 'study' ? 'study' : 'interview';
                    
                    // Use the distributed form fields for this specific prompt
                    const distributedFormFields = {
                      ...formFields[i],
                      numberOfQuestions: 5,
                      kindsOfQuestions: ''
                    };
                    
                    console.log(`🎯 Creating AI deck ${i + 1} with interviewType: "${distributedFormFields.interviewType}"`);

                    // Create deck directly with the authenticated user ID
                    const result = await createAIDeckWithFlashcards({
                      deckName,
                      mode,
                      formFields: distributedFormFields,
                      flashcards,
                      // Omit tempUserID - will use getCurrentUserID() which returns the authenticated user's ID
                    });

                    if (result.success && result.deckId) {
                      createdDeckIds.push(result.deckId);
                      console.log(`✅ Created AI deck ${i + 1} with ID: ${result.deckId}`);
                      
                      // Update progress to show next deck (i+2 since i is 0-indexed)
                      // After deck 1 (i=0): show (2/3)
                      // After deck 2 (i=1): show (3/3)
                      if (i < prompts.length - 1) {
                        setDeckCreationProgress({ currentDeck: i + 2, totalDecks: 3 });
                      }
                    } else {
                      console.error(`❌ Failed to create AI deck ${i + 1}`);
                    }
                  } catch (error) {
                    console.error(`❌ Error processing prompt ${i + 1}:`, error);
                    // Continue with other prompts even if one fails
                  }
                }

                console.log(`🎉 Successfully created ${createdDeckIds.length}/3 free AI decks for new user!`);
                console.log('📊 Created deck IDs:', createdDeckIds);

                if (createdDeckIds.length > 0) {
                  await queueAIDecksCoachmark();
                }
                
                // Mark all decks as complete (show tick)
                setDeckCreationProgress({ currentDeck: 4, totalDecks: 3 });
                
                // Wait 2 seconds before proceeding
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Store the completion status for the auth flow
                (window as any).aiDeckCreationComplete = true;
                (window as any).createdDeckIds = createdDeckIds;
                
              } catch (error) {
                console.error('❌ Error generating free deck prompts:', error);
                // Don't block the auth flow if prompt generation fails
                (window as any).aiDeckCreationComplete = true;
                (window as any).createdDeckIds = [];
              }
            } else {
              // For existing users or users who skipped, hide deck creation progress since they don't get free decks
              setDeckCreationProgress({ currentDeck: 0, totalDecks: 3 });
              // For existing users or users who skipped, mark as complete immediately
              (window as any).aiDeckCreationComplete = true;
              (window as any).createdDeckIds = [];
            }
          }
        } catch (error) {
          console.error('Error handling user creation:', error);
        }
      };
      
      // Handle user creation if there's a user object (new auth), otherwise just proceed (existing auth)
      if (user) {
        handleAuthComplete();
      }
      
      // Complete auth after ensuring minimum splash duration and AI deck creation
      const elapsedTime = Date.now() - splashStartTime.current;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      console.log(`🕐 Splash (auth complete): elapsed: ${elapsedTime}ms, remaining: ${remainingTime}ms, isFreshAuth: ${isFreshAuth}`);
      
      // Wait for both minimum splash duration and AI deck creation completion
      const waitForCompletion = async () => {
        // Wait for minimum splash duration
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Wait for AI deck creation to complete (if it's a new user)
        if (isFreshAuth) {
          console.log('⏳ Waiting for AI deck creation to complete...');
          while (!(window as any).aiDeckCreationComplete) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          console.log('✅ AI deck creation completed, proceeding with auth flow');
        }
        
        // Proceed with database initialization
        handleDatabaseInitialization();
      };
      
      waitForCompletion();
    }
  }, [isLoading, isAuthenticated, user, onAuthComplete]);

  // Clear any existing session when component mounts
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Ensure AsyncStorage is cleared when not signed in
      AsyncStorage.removeItem('userID');
      // Reset fresh auth state when not authenticated
      setIsFreshAuth(false);
      setShowLoadingOverlay(false);
    }
  }, [isLoading, isAuthenticated]);

  // Handle resend code countdown
  useEffect(() => {
    if (!canResendCode && resendCountdown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResendCode(true);
            if (resendTimerRef.current) {
              clearInterval(resendTimerRef.current);
              resendTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (resendTimerRef.current) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
        }
      };
    }
  }, [canResendCode, resendCountdown]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      signupToggleFadeAnim.stopAnimation();
      passwordResetFadeAnim.stopAnimation();
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [signupToggleFadeAnim, passwordResetFadeAnim]);

  return (
    <View style={styles.container}>
      {currentSection === 'logoAnimation' || currentSection === 'languageSelection' ? (
        <>
          {/* Background animation that fills the screen */}
          <LottieView
            ref={animationRef}
            source={backgroundAnimationSource}
            autoPlay={false}
            loop={true}
            style={styles.animation}
            resizeMode="cover"
            speed={1}
            cacheComposition={true}
            renderMode="HARDWARE"
            colorFilters={[]}
            onAnimationFailure={(error) => {
              console.error('Background animation failed to load:', error);
            }}
          />
          
          {/* Logo animation centered with fade animation */}
          {!hideLogoAnimation && (
            <Animated.View style={[styles.logoAnimationContainer, { opacity: logoFadeAnim }]}>
              <LottieView
                ref={logoAnimationRef}
                source={logoAnimationSource}
                autoPlay={false}
                loop={false}
                style={styles.logoAnimation}
                speed={1}
                cacheComposition={true}
                renderMode="HARDWARE"
                colorFilters={[]}
                onAnimationFailure={(error) => {
                  console.error('Logo animation failed to load:', error);
                }}
              />
            </Animated.View>
          )}

          {/* Language selection with fade animation */}
          {currentSection === 'languageSelection' && showLanguageSelector && (
            <Animated.View style={{ 
              opacity: languageSelectorFadeAnim,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 5
            }}>
              <LanguageSelector
                initialLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                title={getTranslatedText(selectedLanguage, 'selectLanguage')}
              />
            </Animated.View>
          )}
        </>
      ) : (
        /* PNG background that covers the whole screen with fade animation */
        <Animated.View style={[styles.imageBackgroundContainer, { opacity: pngBackgroundFadeAnim }]}>
          <ImageBackground
            source={require('../assets/onboarding/onboardingBackground.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          
          {/* Centered container for onboardingPage1 content */}
          <Animated.View style={[styles.onboardingContainer, { paddingBottom: Platform.OS === 'android' ? insets.bottom : 0, opacity: onboardingPage1ContentFadeAnim }]}>
            <View style={styles.onboardingContent}>
              {/* Welcome text section */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>{getTranslatedText(selectedLanguage, 'welcomeTo')}</Text>
                <Text style={styles.appTitle}>{getTranslatedText(selectedLanguage, 'prepQuest')}</Text>
              </View>
              
              {/* Animation section */}
              <View style={styles.animationSection}>
                <LottieView
                  source={loadingAnimation1Source}
                  autoPlay
                  loop={true}
                  style={styles.loadingAnimation}
                  resizeMode="contain"
                  speed={1}
                  cacheComposition={true}
                  renderMode="HARDWARE"
                />
              </View>
              
              {/* Second row: Question and cards */}
              <View style={styles.secondRow}>
                {/* Question text */}
                <Text style={styles.questionText}>{getTranslatedText(selectedLanguage, 'whatAreYouPreppingFor')}</Text>
                
                {/* Two column cards */}
                <View style={styles.cardsContainer}>
                  <TouchableOpacity 
                    style={[styles.card, selectedCard === 'study' && styles.selectedCard]} 
                    onPress={() => {
                      setSelectedCard('study');
                      // Auto-navigate to onboardingPage2 after selection
                      setTimeout(() => {
                        Animated.timing(onboardingPage1ContentFadeAnim, {
                          toValue: 0,
                          duration: 300,
                          useNativeDriver: true,
                        }).start(() => {
                          setCurrentSection('onboardingPage2');
                          Animated.timing(onboardingPage2ContentFadeAnim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                          }).start();
                        });
                      }, 500); // Small delay to show selection feedback
                    }}
                  >
                    <View style={styles.imageContainer}>
                      <StudyOnboardingImage width="100%" height="100%" />
                    </View>
                    <Text 
                      style={[
                        styles.cardText,
                        getTranslatedText(selectedLanguage, 'studyPrep').length >= 15 && styles.cardTextSmall
                      ]}
                    >
                      {getTranslatedText(selectedLanguage, 'studyPrep')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.card, selectedCard === 'interview' && styles.selectedCard]} 
                    onPress={() => {
                      setSelectedCard('interview');
                      // Auto-navigate to onboardingPage2 after selection
                      setTimeout(() => {
                        Animated.timing(onboardingPage1ContentFadeAnim, {
                          toValue: 0,
                          duration: 300,
                          useNativeDriver: true,
                        }).start(() => {
                          setCurrentSection('onboardingPage2');
                          Animated.timing(onboardingPage2ContentFadeAnim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                          }).start();
                        });
                      }, 500); // Small delay to show selection feedback
                    }}
                  >
                    <View style={styles.imageContainer}>
                      <InterviewOnboardingImage width="100%" height="100%" />
                    </View>
                    <Text 
                      style={[
                        styles.cardText,
                        getTranslatedText(selectedLanguage, 'interviewPrep').length >= 15 && styles.cardTextSmall
                      ]}
                    >
                      {getTranslatedText(selectedLanguage, 'interviewPrep')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* onboardingPage2 - Empty page with same background */}
      {currentSection === 'onboardingPage2' && (
        <Animated.View style={[styles.imageBackgroundContainer, { opacity: pngBackgroundFadeAnim }]}>
          <ImageBackground
            source={require('../assets/onboarding/onboardingBackground.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          
          {/* Content container */}
          <Animated.View style={[styles.onboardingPage2Container, { top: insets.top + 30, bottom: insets.bottom + 5, opacity: onboardingPage2ContentFadeAnim}]}>
            <View style={styles.onboardingPage2Content}>
              {/* First row: Great! */}
              <Text style={styles.greatText}>{getTranslatedText(selectedLanguage, 'great')}</Text>
              
              {/* Second row: Just a few more questions... */}
              <Text style={styles.questionsText}>{getTranslatedText(selectedLanguage, 'justAFewMoreQuestions')}</Text>
              
              {/* Third row: 1/3 */}
              <Text style={styles.progressText}>{getTranslatedText(selectedLanguage, 'progress')}</Text>
              
              {/* Fourth row: Which subject(s)... */}
              <Text style={styles.subjectQuestionText}>
                {selectedCard === 'study' 
                  ? getTranslatedText(selectedLanguage, 'whichSubjects')
                  : getTranslatedText(selectedLanguage, 'whichJob')
                }
              </Text>
              
              {/* Text input field with cancel icon inside */}
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.subjectTextInput}
                  placeholder="Type here!"
                  placeholderTextColor={Colors.light.unselectedText}
                  value={selectedCard === 'study' ? studySubjectInput : interviewSubjectInput}
                  onChangeText={selectedCard === 'study' ? setStudySubjectInput : setInterviewSubjectInput}
                />
                {(selectedCard === 'study' ? studySubjectInput : interviewSubjectInput).length > 0 && (
                  <TouchableOpacity 
                    style={styles.cancelIconButton}
                    onPress={() => selectedCard === 'study' ? setStudySubjectInput('') : setInterviewSubjectInput('')}
                  >
                    <MaterialIcons 
                      name="cancel" 
                      size={20} 
                      color={Colors.light.unselectedText} 
                    />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Suggestions text */}
              <Text style={styles.suggestionsText}>{getTranslatedText(selectedLanguage, 'suggestions')}</Text>
              
              {/* ScrollView with suggestion cards */}
              <ScrollView 
                style={styles.suggestionsScrollView}
                showsVerticalScrollIndicator={false}
              >
                {selectedCard === 'study' && (
                  <View style={styles.suggestionsContainer}>
                      {/* Row 1 */}
                      <View style={styles.cardRow}>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, studySelectedSuggestions.has('History') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('History')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <HistoryImage width="100%" height="100%" />
                          </View>
                          <Text style={styles.suggestionCardText}>
                            {getTranslatedText(selectedLanguage, 'history')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, studySelectedSuggestions.has('Physics') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Physics')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <PhysicsImage width="100%" height="100%" />
                          </View>
                          <Text style={styles.suggestionCardText}>
                            {getTranslatedText(selectedLanguage, 'physics')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    
                    {/* Row 2 */}
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Chemistry') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Chemistry')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <ChemistryImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'chemistry')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Biology') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Biology')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <BiologyImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'biology')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Row 3 */}
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Geography') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Geography')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <GeographyImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'geography')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Math') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Math')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <MathImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'math')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Row 4 */}
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Medicine') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Medicine')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <MedicineImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'medicine')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Law') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Law')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <LawImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'law')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Row 5 */}
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Finance') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Finance')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <FinanceImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'finance')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedSuggestions.has('Computing') && styles.selectedSuggestionCard]}
                        onPress={() => handleSuggestionPress('Computing')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <ComputingImage width="100%" height="100%" />
                        </View>
                        <Text 
                            style={styles.suggestionCardText}
                        >
                          {getTranslatedText(selectedLanguage, 'computing')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {selectedCard === 'interview' && (
                  <View style={styles.suggestionsContainer}>
                      {/* Row 1 */}
                      <View style={styles.cardRow}>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Software Engineering') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Software Engineering')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <SoftwareEngineeringImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'softwareEngineering')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Investment Banking') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Investment Banking')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <InvestmentBankingImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'investmentBanking')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    
                      {/* Row 2 */}
                      <View style={styles.cardRow}>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Medical Residency') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Medical Residency')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <MedicalResidencyImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'medicalResidency')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Quantitative Researcher') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Quantitative Researcher')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <QuantitativeResearcherImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'quantitativeResearcher')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    
                      {/* Row 3 */}
                      <View style={styles.cardRow}>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Management Consulting') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Management Consulting')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <ManagementConsultingImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'managementConsulting')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Criminal Lawyer') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Criminal Lawyer')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <CriminalLawyerImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'criminalLawyer')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    
                      {/* Row 4 */}
                      <View style={styles.cardRow}>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Electrical Engineer') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Electrical Engineer')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <ElectricalEngineerImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'electricalEngineer')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.suggestionCard, interviewSelectedSuggestions.has('Product Manager') && styles.selectedSuggestionCard]}
                          onPress={() => handleSuggestionPress('Product Manager')}
                        >
                          <View style={styles.suggestionCardImageContainer}>
                            <ProductManagerImage width="100%" height="100%" />
                          </View>
                          <Text 
                            style={styles.suggestionCardText}
                          >
                            {getTranslatedText(selectedLanguage, 'productManager')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* onboardingPage3 - Education/Interview Level Selection */}
      {currentSection === 'onboardingPage3' && (
        <Animated.View style={[styles.imageBackgroundContainer, { opacity: pngBackgroundFadeAnim }]}>
          <ImageBackground
            source={require('../assets/onboarding/onboardingBackground.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          
          {/* Content container */}
          <Animated.View style={[
            styles.onboardingPage3Container, 
            selectedCard === 'interview' 
              ? { 
                  ...styles.onboardingPage3ContainerInterview,
                  top: insets.top,
                  bottom: insets.bottom
                }
              : { top: insets.top + 30, bottom: insets.bottom + 5 },
            { opacity: onboardingPage3ContentFadeAnim }
          ]}>
            <View style={[
              styles.onboardingPage3Content,
              selectedCard === 'interview' && styles.onboardingPage3ContentInterview
            ]}>
              {/* Progress text: 2/3 */}
              <Text style={styles.progressText}>{getTranslatedText(selectedLanguage, 'progress2')}</Text>
              
              {/* Question text */}
              <Text style={styles.educationQuestionText}>
                {selectedCard === 'study' 
                  ? getTranslatedText(selectedLanguage, 'educationLevelQuestion')
                  : getTranslatedText(selectedLanguage, 'interviewTypeQuestion')
                }
              </Text>
              
              {/* Text input field with cancel icon inside - only show for study mode */}
              {selectedCard === 'study' && (
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.educationTextInput}
                    placeholder="Type here!"
                    placeholderTextColor={Colors.light.unselectedText}
                    value={studyEducationInput}
                    onChangeText={setStudyEducationInput}
                  />
                  {studyEducationInput.length > 0 && (
                    <TouchableOpacity 
                      style={styles.cancelIconButton}
                      onPress={() => setStudyEducationInput('')}
                    >
                      <MaterialIcons 
                        name="cancel" 
                        size={20} 
                        color={Colors.light.unselectedText} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Suggestions text */}
              <Text style={[
                styles.suggestionsText,
                selectedCard === 'interview' && styles.suggestionsTextInterview
              ]}>
                {selectedCard === 'interview' 
                  ? getTranslatedText(selectedLanguage, 'pickAny')
                  : getTranslatedText(selectedLanguage, 'suggestions')
                }
              </Text>
              
              {/* Cards container - ScrollView for study mode, regular View for interview mode */}
              {selectedCard === 'study' ? (
                <ScrollView 
                  style={styles.suggestionsScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.suggestionsContainer}>
                    {/* Study Education Levels - 6 cards */}
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('High School') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('High School')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <HighSchoolImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'highSchool')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('Undergraduate') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Undergraduate')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <CollegeImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'undergraduate')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('Graduate') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Graduate')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <GraduateImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'graduate')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('PhD') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Adult Learner')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <AdultLearnerImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'adultLearner')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('Professional') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Middle School')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <MiddleSchoolImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'middleSchool')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('Certification') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Elementary School')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <ElementarySchoolImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'elementarySchool')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <View style={[styles.suggestionsContainer, {paddingTop: 10}]}>
                  {/* Interview Types - 4 cards */}
                  <View style={styles.cardRow}>
                    <TouchableOpacity 
                      style={[styles.suggestionCard, interviewSelectedEducationSuggestions.has('Technical') && styles.selectedSuggestionCard]}
                      onPress={() => handleEducationSuggestionPress('Technical')}
                    >
                      <View style={styles.suggestionCardImageContainer}>
                        <TechnicalImage width="100%" height="100%" />
                      </View>
                      <Text style={styles.suggestionCardText}>
                        {getTranslatedText(selectedLanguage, 'technical')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.suggestionCard, interviewSelectedEducationSuggestions.has('Behavioral') && styles.selectedSuggestionCard]}
                      onPress={() => handleEducationSuggestionPress('Behavioral')}
                    >
                      <View style={styles.suggestionCardImageContainer}>
                        <BehavioralImage width="100%" height="100%" />
                      </View>
                      <Text style={styles.suggestionCardText}>
                        {getTranslatedText(selectedLanguage, 'behavioral')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <TouchableOpacity 
                      style={[styles.suggestionCard, interviewSelectedEducationSuggestions.has('Case Study') && styles.selectedSuggestionCard]}
                      onPress={() => handleEducationSuggestionPress('Case Study')}
                    >
                      <View style={styles.suggestionCardImageContainer}>
                        <CaseStudyImage width="100%" height="100%" />
                      </View>
                      <Text style={styles.suggestionCardText}>
                        {getTranslatedText(selectedLanguage, 'caseStudy')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.suggestionCard, interviewSelectedEducationSuggestions.has('Brainteasers') && styles.selectedSuggestionCard]}
                      onPress={() => handleEducationSuggestionPress('Brainteasers')}
                    >
                      <View style={styles.suggestionCardImageContainer}>
                        <BrainteasersImage width="100%" height="100%" />
                      </View>
                      <Text style={styles.suggestionCardText}>
                        {getTranslatedText(selectedLanguage, 'brainteasers')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* onboardingPage4 - Final page */}
      {currentSection === 'onboardingPage4' && (
        <Animated.View style={[styles.imageBackgroundContainer, { opacity: pngBackgroundFadeAnim }]}>
          <ImageBackground
            source={require('../assets/onboarding/onboardingBackground.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          
          {/* Content container */}
          <Animated.View style={[
            styles.onboardingPage4Container,
            { top: insets.top + 30, bottom: insets.bottom + 5, opacity: onboardingPage4ContentFadeAnim }
          ]}>
            <View style={styles.onboardingPage4Content}>
              {/* Progress text: 3/3 */}
              <Text style={styles.progressText}>3/3</Text>
              
              {/* Optional Questions */}
              <Text style={styles.optionalQuestionsText}>
                {getTranslatedText(selectedLanguage, 'optionalQuestions')}
              </Text>
              
              {/* ScrollView for questions only */}
              <ScrollView 
                style={styles.onboardingPage4ScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.onboardingPage4ScrollContent}
              >
                {selectedCard === 'study' ? (
                  <>
                    {/* Exam Question - Study Mode Only */}
                    <Text style={styles.questionTextLeft}>
                      {getTranslatedText(selectedLanguage, 'examQuestion')}
                    </Text>
                    
                    {/* Exam Text Input */}
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.subjectTextInput}
                        placeholder="Type here!"
                        placeholderTextColor={Colors.light.unselectedText}
                        value={examInput}
                        onChangeText={setExamInput}
                      />
                      {examInput.length > 0 && (
                        <TouchableOpacity 
                          style={styles.cancelIconButton}
                          onPress={() => setExamInput('')}
                        >
                          <MaterialIcons 
                            name="cancel" 
                            size={20} 
                            color={Colors.light.unselectedText} 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Exam Helper Text */}
                    <Text style={styles.helperText}>
                      {getTranslatedText(selectedLanguage, 'examHelper')}
                    </Text>
                    
                    {/* Exam Animation */}
                    <View style={styles.animationContainer}>
                      <LottieView
                        source={onboardingPage4StudyQn1AnimationSource}
                        autoPlay
                        loop={true}
                        style={styles.questionAnimation}
                        resizeMode="contain"
                        speed={1}
                        cacheComposition={true}
                        renderMode="HARDWARE"
                      />
                    </View>
                    
                    {/* Study Topics Question */}
                    <Text style={styles.questionTextLeft}>
                      {getTranslatedText(selectedLanguage, 'studyTopicsQuestion')}
                    </Text>
                    
                    {/* Study Topics Text Input */}
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.subjectTextInput}
                        placeholder="Type here!"
                        placeholderTextColor={Colors.light.unselectedText}
                        value={studyTopicsInput}
                        onChangeText={setStudyTopicsInput}
                      />
                      {studyTopicsInput.length > 0 && (
                        <TouchableOpacity 
                          style={styles.cancelIconButton}
                          onPress={() => setStudyTopicsInput('')}
                        >
                          <MaterialIcons 
                            name="cancel" 
                            size={20} 
                            color={Colors.light.unselectedText} 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Study Topics Helper Text */}
                    <Text style={styles.helperText}>
                      {getTranslatedText(selectedLanguage, 'studyTopicsHelper')}
                    </Text>
                    
                    {/* Study Topics Animation */}
                    <View style={styles.animationContainer}>
                      <LottieView
                        source={bookFlippingAnimationSource}
                        autoPlay
                        loop={true}
                        style={styles.questionAnimation}
                        resizeMode="contain"
                        speed={1}
                        cacheComposition={true}
                        renderMode="HARDWARE"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    {/* Experience Level Question - Interview Mode Only */}
                    <Text style={styles.questionTextLeft}>
                      {getTranslatedText(selectedLanguage, 'experienceLevelQuestion')}
                    </Text>
                    
                    {/* Experience Level Text Input */}
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.subjectTextInput}
                        placeholder="Type here!"
                        placeholderTextColor={Colors.light.unselectedText}
                        value={experienceLevelInput}
                        onChangeText={setExperienceLevelInput}
                      />
                      {experienceLevelInput.length > 0 && (
                        <TouchableOpacity 
                          style={styles.cancelIconButton}
                          onPress={() => setExperienceLevelInput('')}
                        >
                          <MaterialIcons 
                            name="cancel" 
                            size={20} 
                            color={Colors.light.unselectedText} 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Experience Level Helper Text */}
                    <Text style={styles.helperText}>
                      {getTranslatedText(selectedLanguage, 'experienceLevelHelper')}
                    </Text>
                    
                    {/* Experience Level Animation */}
                    <View style={styles.animationContainer}>
                      <LottieView
                        source={onboardingPage4InterviewQn1AnimationSource}
                        autoPlay
                        loop={true}
                        style={styles.questionAnimation}
                        resizeMode="contain"
                        speed={1}
                        cacheComposition={true}
                        renderMode="HARDWARE"
                      />
                    </View>
                    
                    {/* Company Question */}
                    <Text style={styles.questionTextLeft}>
                      {getTranslatedText(selectedLanguage, 'companyQuestion')}
                    </Text>
                    
                    {/* Company Text Input */}
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.subjectTextInput}
                        placeholder="Type here!"
                        placeholderTextColor={Colors.light.unselectedText}
                        value={companyInput}
                        onChangeText={setCompanyInput}
                      />
                      {companyInput.length > 0 && (
                        <TouchableOpacity 
                          style={styles.cancelIconButton}
                          onPress={() => setCompanyInput('')}
                        >
                          <MaterialIcons 
                            name="cancel" 
                            size={20} 
                            color={Colors.light.unselectedText} 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Company Helper Text */}
                    <Text style={styles.helperText}>
                      {getTranslatedText(selectedLanguage, 'companyHelper')}
                    </Text>
                    
                    {/* Company Animation */}
                    <View style={styles.animationContainer}>
                      <LottieView
                        source={onboardingPage4InterviewQn2AnimationSource}
                        autoPlay
                        loop={true}
                        style={styles.questionAnimation}
                        resizeMode="contain"
                        speed={1}
                        cacheComposition={true}
                        renderMode="HARDWARE"
                      />
                    </View>
                    
                    {/* Topics Question */}
                    <Text style={styles.questionTextLeft}>
                      {getTranslatedText(selectedLanguage, 'topicsQuestion')}
                    </Text>
                    
                    {/* Topics Text Input */}
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.subjectTextInput}
                        placeholder="Type here!"
                        placeholderTextColor={Colors.light.unselectedText}
                        value={topicsInput}
                        onChangeText={setTopicsInput}
                      />
                      {topicsInput.length > 0 && (
                        <TouchableOpacity 
                          style={styles.cancelIconButton}
                          onPress={() => setTopicsInput('')}
                        >
                          <MaterialIcons 
                            name="cancel" 
                            size={20} 
                            color={Colors.light.unselectedText} 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Topics Helper Text */}
                    <Text style={styles.helperText}>
                      {getTranslatedText(selectedLanguage, 'topicsHelper')}
                    </Text>
                    
                    {/* Topics Animation */}
                    <View style={styles.animationContainer}>
                      <LottieView
                        source={bookFlippingAnimationSource}
                        autoPlay
                        loop={true}
                        style={styles.questionAnimation}
                        resizeMode="contain"
                        speed={1}
                        cacheComposition={true}
                        renderMode="HARDWARE"
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* onboardingPage5 - Carousel page */}
      {currentSection === 'onboardingPage5' && (
        <Animated.View style={[styles.imageBackgroundContainer, { opacity: pngBackgroundFadeAnim }]}>
          <ImageBackground
            source={require('../assets/onboarding/onboardingBackground.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          
          {/* Content container */}
          <Animated.View style={[
            styles.onboardingPage5Container,
            { top: insets.top + 30, bottom: insets.bottom + 5, opacity: onboardingPage5ContentFadeAnim }
          ]}>
            <View style={styles.onboardingPage5Content}>
              {/* One last thing! */}
              <Text style={styles.progressText}>
                {getTranslatedText(selectedLanguage, 'oneLastThing')}
              </Text>
              
              {/* First paragraph */}
              <Text style={styles.paragraphText}>
                {getTranslatedText(selectedLanguage, 'cognitiveQuestionsParagraph')}
              </Text>
              
              {/* Second paragraph - only show on devices with large height */}
              {Dimensions.get('window').height > 700 && (
                <Text style={styles.paragraphText}>
                  {getTranslatedText(selectedLanguage, 'tailorFlashcardsParagraph')}
                </Text>
              )}
              
              {/* Carousel container */}
              <View style={styles.rectangleContainer}>
                <GestureHandlerRootView style={styles.gestureContainer}>
                  <PanGestureHandler 
                    onHandlerStateChange={handlePanGesture}
                    activeOffsetX={[-5, 5]}
                    activeOffsetY={[-30, 30]}
                  >
                    <View style={styles.carouselPage}>
                      <View 
                        style={styles.carouselContainer}
                        onLayout={(event) => {
                          containerWidth.current = event.nativeEvent.layout.width;
                        }}
                      >
                        <Animated.View 
                          style={[
                            styles.carouselPageContent,
                            {
                              transform: [{ translateX: carouselTranslateX }]
                            }
                          ]}
                        >
                          {carouselPages.map((page, index) => (
                            <View 
                              key={`page-${index}`} 
                              style={styles.carouselSinglePage}
                            >
                              <Text style={styles.carouselTitle}>
                                {page.title}
                              </Text>
                              
                              <Text style={styles.carouselSubtitle}>
                                {page.subtitle}
                              </Text>
                              
                              <Text style={styles.carouselBodyText}>
                                {page.bodyText}
                              </Text>
                              
                              {/* SVG image(s) */}
                              <View style={styles.carouselImagePlaceholder}>
                                {page.image && (
                                  <page.image width="100%" height="100%" />
                                )}
                                {page.images && (
                                  page.id === 6 ? (
                                    <View style={styles.carouselThreeImagesContainer}>
                                      <View style={styles.carouselLeftImage}>
                                        {React.createElement(page.images[0], { width: "100%", height: "100%" })}
                                      </View>
                                      <View style={styles.carouselRightImages}>
                                        <View style={styles.carouselTopRightImage}>
                                          {React.createElement(page.images[1], { width: "100%", height: "100%" })}
                                        </View>
                                        <View style={styles.carouselBottomRightImage}>
                                          {React.createElement(page.images[2], { width: "100%", height: "100%" })}
                                        </View>
                                      </View>
                                    </View>
                                  ) : page.id === 7 ? (
                                    <View style={styles.carouselFourImagesContainer}>
                                      <View style={styles.carouselTopRow}>
                                        <View style={styles.carouselTopRowImage}>
                                          {React.createElement(page.images[0], { width: "100%", height: "100%" })}
                                        </View>
                                        <View style={styles.carouselTopRowImage}>
                                          {React.createElement(page.images[1], { width: "100%", height: "100%" })}
                                        </View>
                                        <View style={styles.carouselTopRowImage}>
                                          {React.createElement(page.images[2], { width: "100%", height: "100%" })}
                                        </View>
                                      </View>
                                      <View style={styles.carouselBottomRow}>
                                        <View style={styles.carouselBottomRowImage}>
                                          {React.createElement(page.images[3], { width: "100%", height: "100%" })}
                                        </View>
                                      </View>
                                    </View>
                                  ) : (
                                    <View style={[
                                      styles.carouselMultipleImagesContainer,
                                      (page.id === 4 || page.id === 5) && styles.carouselMultipleImagesContainerLargeGap
                                    ]}>
                                      {page.images.map((ImageComponent, index) => (
                                        <View key={index} style={styles.carouselMultipleImageItem}>
                                          <ImageComponent width="100%" height="100%" />
                                        </View>
                                      ))}
                                      {(page.id === 4 || page.id === 5) && (
                                        <Text style={styles.carouselVsText}>vs</Text>
                                      )}
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          ))}
                        </Animated.View>
                      </View>
                      
                      {/* Navigation indicators - only show 7 dots for real pages */}
                      <View style={styles.carouselNavigation}>
                        {originalCarouselPages.map((_, index) => {
                          // Map current page to the correct dot (0-6 for real pages)
                          const realPageIndex = currentCarouselPage === 0 ? 6 : // Duplicate last page maps to real last page
                                            currentCarouselPage === 8 ? 0 : // Duplicate first page maps to real first page
                                            currentCarouselPage - 1; // Real pages (1-7) map to dots (0-6)
                          
                          return (
                            <View
                              key={index}
                              style={[
                                styles.carouselDot,
                                index === realPageIndex && styles.carouselDotActive
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  </PanGestureHandler>
                </GestureHandlerRootView>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* onboardingPage6 - New page with different background */}
      {currentSection === 'onboardingPage6' && (
        <Animated.View style={[styles.imageBackgroundContainer, { opacity: pngBackgroundFadeAnim }]}>
          <ImageBackground
            source={require('../assets/onboarding/onboardingPage6Background.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          
          {/* Content container */}
          <Animated.View style={[
            styles.onboardingPage6Container,
            { top: insets.top + 30, bottom: insets.bottom + 5, opacity: onboardingPage6ContentFadeAnim }
          ]}>
            <View style={styles.onboardingPage6Content}>
              {/* Top section with awesome text */}
              <View style={styles.onboardingPage6TopSection}>
                <Text style={styles.awesomeText}>
                  {getTranslatedText(language, 'awesomeYoureAllSet')}
                </Text>
              </View>
              
              {/* Middle section with carousel */}
              <View style={styles.onboardingPage6MiddleSection}>
                <View style={styles.onboardingPage6CarouselContainer}>
                  <GestureHandlerRootView style={styles.gestureContainer}>
                    <PanGestureHandler 
                      onHandlerStateChange={handlePanGesture}
                      activeOffsetX={[-5, 5]}
                      activeOffsetY={[-30, 30]}
                    >
                      <View style={styles.onboardingPage6CarouselPage}>
                        <View 
                          style={styles.carouselContainer}
                          onLayout={(event) => {
                            containerWidth.current = event.nativeEvent.layout.width;
                          }}
                        >
                          <Animated.View 
                            style={[
                              styles.carouselPageContent,
                              {
                                transform: [{ translateX: carouselTranslateX }]
                              }
                            ]}
                          >
                            {onboardingPage6ExtendedCarousel.map((page, index) => (
                              <View 
                                key={`page-${index}`} 
                                style={styles.carouselSinglePage}
                              >
                                <Text style={styles.carouselTitle}>
                                  {page.title}
                                </Text>
                                
                                {/* Animation/Image container with proper margins */}
                                <View style={styles.onboardingPage6AnimationContainer}>
                                  {page.animation && (
                                    <LottieView
                                      source={page.animation}
                                      autoPlay
                                      loop={true}
                                      style={styles.onboardingPage6Animation}
                                      resizeMode="contain"
                                      speed={1}
                                      cacheComposition={true}
                                      renderMode="HARDWARE"
                                    />
                                  )}
                                  {page.image && (
                                    <Image
                                      source={page.image}
                                      style={[styles.onboardingPage6Animation, { width: '70%' }]}
                                      resizeMode="contain"
                                    />
                                  )}
                                </View>
                              </View>
                            ))}
                          </Animated.View>
                        </View>
                        
                        {/* Navigation indicators - only show 6 dots for real pages */}
                        <View style={styles.carouselNavigation}>
                          {onboardingPage6CarouselPages.map((_, index) => {
                            // Map current page to the correct dot (0-5 for real pages)
                            const realPageIndex = currentCarouselPage === 0 ? 5 : // Duplicate last page maps to real last page
                                              currentCarouselPage === 7 ? 0 : // Duplicate first page maps to real first page
                                              currentCarouselPage - 1; // Real pages (1-6) map to dots (0-5)
                            
                            return (
                              <View
                                key={index}
                                style={[
                                  styles.carouselDot,
                                  index === realPageIndex && styles.carouselDotActive
                                ]}
                              />
                            );
                          })}
                        </View>
                      </View>
                    </PanGestureHandler>
                  </GestureHandlerRootView>
                </View>
              </View>
              
              {/* Bottom section with signup text, arrow, and button */}
              <View style={styles.onboardingPage6BottomSection}>
                <Text style={styles.signUpText}>
                  {getTranslatedText(language, 'signUpWithUsToContinue')}
                </Text>
                <View style={styles.onboardingPage6ArrowContainer}>
                  <LottieView
                    source={downArrowAnimationSource}
                    autoPlay
                    loop={true}
                    style={styles.downArrowAnimation}
                    resizeMode="contain"
                    speed={1}
                    cacheComposition={true}
                    renderMode="HARDWARE"
                  />
                </View>
                <TouchableOpacity
                  style={styles.onboardingPage6Button}
                  onPress={handleNextPress}
                >
                  <Text style={styles.onboardingPage6ButtonText}>
                    {getTranslatedText(selectedLanguage, 'signUp')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* signupPage - Sign in/Sign up page with onboarding animation */}
      {currentSection === 'signupPage' && (
        <>
          {/* Background animation that fills the screen */}
          <LottieView
            ref={animationRef}
            source={backgroundAnimationSource}
            autoPlay
            loop={true}
            style={styles.animation}
            resizeMode="cover"
            speed={1}
            cacheComposition={true}
            renderMode="HARDWARE"
            onAnimationFailure={(error) => {
              console.error('Background animation failed to load:', error);
            }}
          />
          
          <Animated.View style={[
            styles.signInContainer, 
            { 
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              opacity: signupPageFadeAnim 
            }
          ]}>
            <View style={styles.whiteContainer}>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Logo row at the top */}
                <View style={styles.logoRow}>
                  <PrepQuestLogo 
                    width={height * 0.25}
                    height={height * 0.125}
                  />
                </View>
                
                {/* Sign In / Sign Up Toggle */}
                <View style={styles.toggleContainer}>
                  <TouchableOpacity 
                    style={styles.toggleOption}
                    onPress={handleToggleSignIn}
                  >
                    <Text style={[
                      styles.toggleText,
                      { 
                        color: isSignIn ? Colors.light.text : Colors.light.unselectedText,
                        fontFamily: Fonts.bodyMedium
                      }
                    ]}>
                      {getTranslatedText(language, 'signIn')}
                    </Text>
                    {isSignIn && <View style={[styles.underline, { backgroundColor: Colors.light.brandColor2 }]} />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.toggleOption}
                    onPress={handleToggleSignUp}
                  >
                    <Text style={[
                      styles.toggleText,
                      { 
                        color: !isSignIn ? Colors.light.text : Colors.light.unselectedText,
                        fontFamily: Fonts.bodyMedium
                      }
                    ]}>
                      {getTranslatedText(language, 'signUp')}
                    </Text>
                    {!isSignIn && <View style={[styles.underline, { backgroundColor: Colors.light.brandColor2 }]} />}
                  </TouchableOpacity>
                </View>
                
                {/* Animated content that changes between sign in and sign up */}
                <Animated.View style={{ opacity: signupToggleFadeAnim, width: '100%' }}>
                  {/* Welcome text for sign in/sign up state */}
                  {isSignIn ? (
                    <View style={styles.welcomeContainer}>
                      <Text style={[styles.welcomeText, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                        {getTranslatedText(language, 'welcomeBack')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.welcomeContainer}>
                      <Text style={[styles.welcomeText, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                        {getTranslatedText(language, 'welcomeAboard')}
                      </Text>
                    </View>
                  )}
                  
                  {/* Input fields */}
                  <View style={styles.inputContainer}>
                    {/* Email/Username input */}
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[
                          styles.textInput, 
                          { 
                            borderColor: Colors.light.unselectedText,
                            color: Colors.light.text,
                            fontFamily: Fonts.bodyBold
                          }
                        ]}
                        placeholder={getTranslatedText(language, 'email')}
                        placeholderTextColor={Colors.light.unselectedText}
                        value={email}
                        onChangeText={handleEmailChange}
                      />
                    </View>
                    
                    {/* Password input */}
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[
                          styles.textInput, 
                          { 
                            borderColor: Colors.light.unselectedText,
                            color: Colors.light.text,
                            fontFamily: Fonts.bodyBold
                          }
                        ]}
                        placeholder={getTranslatedText(language, 'password')}
                        placeholderTextColor={Colors.light.unselectedText}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={handlePasswordChange}
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={handleTogglePassword}
                      >
                        <Feather 
                          name={showPassword ? 'eye' : 'eye-off'} 
                          size={20} 
                          color={Colors.light.normalIconColor}
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Confirm Password input - only in sign up state */}
                    {!isSignIn && (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[
                            styles.textInput, 
                            { 
                              borderColor: Colors.light.unselectedText,
                              color: Colors.light.text,
                              fontFamily: Fonts.bodyBold
                            }
                          ]}
                          placeholder={getTranslatedText(language, 'confirmPassword')}
                          placeholderTextColor={Colors.light.unselectedText}
                          secureTextEntry={!showPassword}
                          value={confirmPassword}
                          onChangeText={handleConfirmPasswordChange}
                        />
                        <TouchableOpacity 
                          style={styles.passwordToggle}
                          onPress={handleTogglePassword}
                        >
                          <Feather 
                            name={showPassword ? 'eye' : 'eye-off'} 
                            size={20} 
                            color={Colors.light.normalIconColor}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  {/* Sign In/Sign Up button */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={[styles.signInButton, { backgroundColor: Colors.light.brandColor2 }]}
                      onPress={handleSignInPress}
                    >
                      <Text style={[styles.signInButtonText, { color: Colors.light.background, fontFamily: Fonts.bodyBold }]}>
                        {isSignIn ? getTranslatedText(language, 'signIn') : getTranslatedText(language, 'signUp')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Forgot Password text - visible in sign in state */}
                  {isSignIn && (
                    <View style={styles.forgotPasswordContainer}>
                      <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={[styles.forgotPasswordText, { color: Colors.light.text, fontFamily: Fonts.bodyBold }]}>
                          {getTranslatedText(language, 'forgotPassword')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
                
                {/* Social login section */}
                <View style={styles.forgotPasswordContainer}>
                  <Text style={[styles.signInWithText, { color: Colors.light.text, fontFamily: Fonts.bodyBold }]}>
                    {isSignIn ? getTranslatedText(language, 'orSignInWith') : getTranslatedText(language, 'orSignUpWith')}
                  </Text>
                  
                  {/* Social login buttons */}
                  <View style={styles.socialLoginContainer}>
                    {/* Google login */}
                    <TouchableOpacity 
                      style={[styles.socialLoginButton, { borderColor: Colors.light.unselectedText }]}
                      onPress={handleGoogleLogin}
                    >
                      <View style={styles.iconContainer}>
                        <GoogleLoginIcon width={24} height={24} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={[styles.socialLoginText, { color: Colors.light.text, fontFamily: Fonts.bodyBold }]}>
                          {getTranslatedText(language, 'continueWithGoogle')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Apple login - only on iOS */}
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity 
                        style={[styles.socialLoginButton, { borderColor: Colors.light.unselectedText }]}
                        onPress={handleAppleLogin}
                      >
                        <View style={styles.iconContainer}>
                          <AppleLoginIcon width={24} height={24} />
                        </View>
                        <View style={styles.textContainer}>
                          <Text style={[styles.socialLoginText, { color: Colors.light.text, fontFamily: Fonts.bodyBold }]}>
                            {getTranslatedText(language, 'continueWithApple')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    
                    {/* Facebook login */}
                    <TouchableOpacity 
                      style={[styles.socialLoginButton, { borderColor: Colors.light.unselectedText }]}
                      onPress={handleFacebookLogin}
                    >
                      <View style={styles.iconContainer}>
                        <FacebookLoginIcon width={24} height={24} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={[styles.socialLoginText, { color: Colors.light.text, fontFamily: Fonts.bodyBold }]}>
                          {getTranslatedText(language, 'continueWithFacebook')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}

      {/* Toast component */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={handleHideToast}
        duration={3000}
        backgroundColor={toastBackgroundColor}
      />

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.light.background }]}>
            <Animated.View style={{ opacity: passwordResetFadeAnim, width: '100%' }}>
              {passwordResetStep === 'email' && (
              <>
                <Text style={[styles.modalTitle, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'resetPassword')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: Colors.light.unselectedText, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'resetPasswordSubtitle')}
                </Text>
                
                <TextInput
                  style={[
                    styles.modalInput, 
                    { 
                      borderColor: Colors.light.unselectedText,
                      color: Colors.light.text,
                      fontFamily: Fonts.bodyBold
                    }
                  ]}
                  placeholder={getTranslatedText(language, 'enterYourEmail')}
                  placeholderTextColor={Colors.light.unselectedText}
                  value={forgotPasswordEmail}
                  onChangeText={handleForgotPasswordEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.modalCancelButton, { borderColor: Colors.light.unselectedText }]}
                    onPress={handleCloseModal}
                  >
                    <Text style={[styles.modalCancelButtonText, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                      {getTranslatedText(language, 'cancel')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modalConfirmButton, 
                      { backgroundColor: Colors.light.brandColor2 },
                      isResettingPassword && { backgroundColor: Colors.light.unselectedText, opacity: 0.6 }
                    ]}
                    onPress={handlePasswordReset}
                    disabled={isResettingPassword}
                  >
                    <Text style={[styles.modalConfirmButtonText, { color: Colors.light.background, fontFamily: Fonts.bodyMedium }]}>
                      {isResettingPassword ? getTranslatedText(language, 'sending') : getTranslatedText(language, 'sendEmail')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {passwordResetStep === 'code' && (
              <>
                <Text style={[styles.modalTitle, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'verifyYourEmail')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: Colors.light.unselectedText, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'firstKeyInCodeToVerify')}
                </Text>
                
                {/* Password Reset Code Input Grid */}
                <View style={styles.verificationCodeContainer}>
                  {passwordResetCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        passwordResetInputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.verificationCodeInput,
                        {
                          borderColor: hasPasswordResetError ? '#FF4444' : Colors.light.unselectedText,
                          color: Colors.light.text,
                          backgroundColor: Colors.light.background,
                          fontFamily: Fonts.bodyBold
                        }
                      ]}
                      value={digit}
                      onChangeText={(text) => handlePasswordResetCodeChange(text, index)}
                      onKeyPress={({ nativeEvent }) => handlePasswordResetCodeKeyPress(nativeEvent.key, index)}
                      keyboardType="numeric"
                      maxLength={6}
                      textAlign="center"
                      selectTextOnFocus={true}
                      autoFocus={index === 0}
                    />
                  ))}
                </View>
                
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.modalCancelButton, { borderColor: Colors.light.unselectedText }]}
                    onPress={handleCloseModal}
                  >
                    <Text style={[styles.modalCancelButtonText, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                      {getTranslatedText(language, 'cancel')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modalConfirmButton, 
                      { backgroundColor: Colors.light.brandColor2 },
                      isVerifyingResetCode && { backgroundColor: Colors.light.unselectedText, opacity: 0.6 }
                    ]}
                    onPress={handleVerifyResetCode}
                    disabled={isVerifyingResetCode}
                  >
                    <Text style={[styles.modalConfirmButtonText, { color: Colors.light.background, fontFamily: Fonts.bodyMedium }]}>
                      {isVerifyingResetCode ? getTranslatedText(language, 'verifying') : getTranslatedText(language, 'verify')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {passwordResetStep === 'newPassword' && (
              <>
                <Text style={[styles.modalTitle, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'setNewPassword')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: Colors.light.unselectedText, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'enterYourNewPassword')}
                </Text>
                
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.modalInput, 
                      { 
                        borderColor: Colors.light.unselectedText,
                        color: Colors.light.text,
                        fontFamily: Fonts.bodyBold
                      }
                    ]}
                    placeholder={getTranslatedText(language, 'newPassword')}
                    placeholderTextColor={Colors.light.unselectedText}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={handleTogglePassword}
                  >
                    <Feather 
                      name={showPassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color={Colors.light.normalIconColor}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.modalInput, 
                      { 
                        borderColor: Colors.light.unselectedText,
                        color: Colors.light.text,
                        fontFamily: Fonts.bodyBold
                      }
                    ]}
                    placeholder={getTranslatedText(language, 'confirmNewPassword')}
                    placeholderTextColor={Colors.light.unselectedText}
                    secureTextEntry={!showPassword}
                    value={confirmNewPassword}
                    onChangeText={handleConfirmNewPasswordChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={handleTogglePassword}
                  >
                    <Feather 
                      name={showPassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color={Colors.light.normalIconColor}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.modalCancelButton, { borderColor: Colors.light.unselectedText }]}
                    onPress={handleCloseModal}
                  >
                    <Text style={[styles.modalCancelButtonText, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                      {getTranslatedText(language, 'cancel')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalConfirmButton, { backgroundColor: Colors.light.brandColor2 }]}
                    onPress={handleSetNewPassword}
                  >
                    <Text style={[styles.modalConfirmButtonText, { color: Colors.light.background, fontFamily: Fonts.bodyMedium }]}>
                      {getTranslatedText(language, 'done')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            </Animated.View>
          </View>
        </View>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        visible={verificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseVerificationModal}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.light.background }]}>
            <Text style={[styles.modalTitle, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
              {getTranslatedText(language, 'verifyEmail')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: Colors.light.unselectedText, fontFamily: Fonts.bodyMedium }]}>
              {getTranslatedText(language, 'verifyEmailSubtitle')}
            </Text>
            
            {/* Verification Code Input Grid */}
            <View style={styles.verificationCodeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    verificationInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.verificationCodeInput,
                    {
                      borderColor: hasVerificationError ? '#FF4444' : Colors.light.unselectedText,
                      color: Colors.light.text,
                      backgroundColor: Colors.light.background,
                      fontFamily: Fonts.bodyBold
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleVerificationCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleVerificationCodeKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  selectTextOnFocus={true}
                  autoFocus={index === 0}
                />
              ))}
            </View>
            
            {/* Resend Code Button */}
            <TouchableOpacity 
              style={[
                styles.resendButton,
                { 
                  borderColor: canResendCode ? Colors.light.brandColor2 : Colors.light.unselectedText,
                  opacity: canResendCode ? 1 : 0.5
                }
              ]}
              onPress={handleResendCode}
              disabled={!canResendCode || isResendingCode}
            >
              <Text style={[
                styles.resendButtonText,
                { 
                  color: canResendCode ? Colors.light.brandColor2 : Colors.light.unselectedText, 
                  fontFamily: Fonts.bodyMedium 
                }
              ]}>
                {isResendingCode 
                  ? getTranslatedText(language, 'resendingCode')
                  : canResendCode 
                    ? getTranslatedText(language, 'resendCode')
                    : `${getTranslatedText(language, 'resendCode')} (${resendCountdown}s)`
                }
              </Text>
            </TouchableOpacity>
            
            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, { borderColor: Colors.light.unselectedText }]}
                onPress={handleCloseVerificationModal}
              >
                <Text style={[styles.modalCancelButtonText, { color: Colors.light.text, fontFamily: Fonts.bodyMedium }]}>
                  {getTranslatedText(language, 'cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton, 
                  { backgroundColor: Colors.light.brandColor2 },
                  isVerifying && { backgroundColor: Colors.light.unselectedText, opacity: 0.6 }
                ]}
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                <Text style={[styles.modalConfirmButtonText, { color: Colors.light.background, fontFamily: Fonts.bodyMedium }]}>
                  {isVerifying ? getTranslatedText(language, 'verifying') : getTranslatedText(language, 'verify')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Network Error Modal */}
      <GreyOverlayBackground 
        visible={isNetworkErrorModalOpen}
        opacity={networkErrorOverlayOpacity}
        onPress={handleDismissNetworkErrorModal}
      />
      <GenericModal
        visible={isNetworkErrorModalOpen}
        opacity={networkErrorModalOpacity}
        text={strings[language]?.youtubeLinkPage?.networkError || strings.English.youtubeLinkPage.networkError}
        Icon={DeleteModalIcon}
        buttons="single"
        onConfirm={handleDismissNetworkErrorModal}
      />

      {/* Onboarding Loading Screen */}
      {showLoadingOverlay && (
        <OnboardingLoadingScreen
          authProgress={authProgress}
          databaseProgress={databaseProgress}
          deckCreationProgress={deckCreationProgress}
        />
      )}

      {/* Top button row with conditional buttons */}
      <View style={[styles.topButtonRow, { top: insets.top }]}>
        {currentSection === 'languageSelection' ? (
          <>
            {/* Next button only for language selection */}
            <TouchableOpacity 
              style={[styles.nextButton, !(['English', 'Chinese'].includes(selectedLanguage)) && styles.disabledButton]} 
              onPress={(['English', 'Chinese'].includes(selectedLanguage)) ? handleNextPress : undefined}
              disabled={!(['English', 'Chinese'].includes(selectedLanguage))}
            >
              <View style={styles.buttonWithIcon}>
                <Text style={[styles.nextButtonText, !(['English', 'Chinese'].includes(selectedLanguage)) && styles.disabledButtonText]}>
                  {getTranslatedText(selectedLanguage, 'next')}
                </Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                    opacity={!(['English', 'Chinese'].includes(selectedLanguage)) ? 0.8 : 1}
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : currentSection === 'onboardingPage1' ? (
          <>
            {/* Back button on the left when on PNG background */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <View style={styles.buttonWithIcon}>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="0,6 12,0 12,12"
                    fill={Colors.light.text}
                  />
                </Svg>
                <Text style={styles.backButtonText}>{getTranslatedText(selectedLanguage, 'back')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Skip button still centered */}
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
                <Text style={styles.skipButtonText}>{getTranslatedText(selectedLanguage, 'skip')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Next button still on the right */}
            <TouchableOpacity 
              style={[styles.nextButton, !selectedCard && styles.disabledButton]} 
              onPress={selectedCard ? handleNextPress : undefined}
              disabled={!selectedCard}
            >
              <View style={styles.buttonWithIcon}>
                <Text style={[styles.nextButtonText, !selectedCard && styles.disabledButtonText]}>{getTranslatedText(selectedLanguage, 'next')}</Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                    opacity={!selectedCard ? 0.8 : 1}
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : currentSection === 'onboardingPage2' ? (
          <>
            {/* Back button on the left when on onboardingPage2 */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <View style={styles.buttonWithIcon}>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="0,6 12,0 12,12"
                    fill={Colors.light.text}
                  />
                </Svg>
                <Text style={styles.backButtonText}>{getTranslatedText(selectedLanguage, 'back')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Skip button still centered */}
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
                <Text style={styles.skipButtonText}>{getTranslatedText(selectedLanguage, 'skip')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Next button still on the right */}
            <TouchableOpacity 
              style={[
                styles.nextButton, 
                ((selectedCard === 'study' && (!studySubjectInput.trim() && studySelectedSuggestions.size === 0)) ||
                 (selectedCard === 'interview' && (!interviewSubjectInput.trim() && interviewSelectedSuggestions.size === 0))) && styles.disabledButton
              ]} 
              onPress={
                ((selectedCard === 'study' && (!studySubjectInput.trim() && studySelectedSuggestions.size === 0)) ||
                 (selectedCard === 'interview' && (!interviewSubjectInput.trim() && interviewSelectedSuggestions.size === 0))) 
                  ? undefined : handleNextPress
              }
              disabled={
                (selectedCard === 'study' && (!studySubjectInput.trim() && studySelectedSuggestions.size === 0)) ||
                (selectedCard === 'interview' && (!interviewSubjectInput.trim() && interviewSelectedSuggestions.size === 0))
              }
            >
              <View style={styles.buttonWithIcon}>
                <Text style={[
                  styles.nextButtonText, 
                  ((selectedCard === 'study' && (!studySubjectInput.trim() && studySelectedSuggestions.size === 0)) ||
                   (selectedCard === 'interview' && (!interviewSubjectInput.trim() && interviewSelectedSuggestions.size === 0))) && styles.disabledButtonText
                ]}>
                  {getTranslatedText(selectedLanguage, 'next')}
                </Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                    opacity={
                      ((selectedCard === 'study' && (!studySubjectInput.trim() && studySelectedSuggestions.size === 0)) ||
                       (selectedCard === 'interview' && (!interviewSubjectInput.trim() && interviewSelectedSuggestions.size === 0))) ? 0.8 : 1
                    }
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : currentSection === 'onboardingPage3' ? (
          <>
            {/* Back button on the left when on onboardingPage3 */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <View style={styles.buttonWithIcon}>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="0,6 12,0 12,12"
                    fill={Colors.light.text}
                  />
                </Svg>
                <Text style={styles.backButtonText}>{getTranslatedText(selectedLanguage, 'back')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Skip button still centered */}
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
                <Text style={styles.skipButtonText}>{getTranslatedText(selectedLanguage, 'skip')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Next button still on the right */}
            <TouchableOpacity 
              style={[
                styles.nextButton, 
                ((selectedCard === 'study' && (!studyEducationInput.trim() && studySelectedEducationSuggestions.size === 0)) ||
                 (selectedCard === 'interview' && interviewSelectedEducationSuggestions.size === 0)) && styles.disabledButton
              ]} 
              onPress={
                ((selectedCard === 'study' && (!studyEducationInput.trim() && studySelectedEducationSuggestions.size === 0)) ||
                 (selectedCard === 'interview' && interviewSelectedEducationSuggestions.size === 0)) 
                  ? undefined : handleNextPress
              }
              disabled={
                (selectedCard === 'study' && (!studyEducationInput.trim() && studySelectedEducationSuggestions.size === 0)) ||
                (selectedCard === 'interview' && interviewSelectedEducationSuggestions.size === 0)
              }
            >
              <View style={styles.buttonWithIcon}>
                <Text style={[
                  styles.nextButtonText, 
                  ((selectedCard === 'study' && (!studyEducationInput.trim() && studySelectedEducationSuggestions.size === 0)) ||
                   (selectedCard === 'interview' && interviewSelectedEducationSuggestions.size === 0)) && styles.disabledButtonText
                ]}>
                  {getTranslatedText(selectedLanguage, 'next')}
                </Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                    opacity={
                      ((selectedCard === 'study' && (!studyEducationInput.trim() && studySelectedEducationSuggestions.size === 0)) ||
                       (selectedCard === 'interview' && interviewSelectedEducationSuggestions.size === 0)) ? 0.8 : 1
                    }
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : currentSection === 'onboardingPage4' ? (
          <>
            {/* Back button on the left when on onboardingPage4 */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <View style={styles.buttonWithIcon}>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="0,6 12,0 12,12"
                    fill={Colors.light.text}
                  />
                </Svg>
                <Text style={styles.backButtonText}>{getTranslatedText(selectedLanguage, 'back')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Skip button still centered */}
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
                <Text style={styles.skipButtonText}>{getTranslatedText(selectedLanguage, 'skip')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Next button still on the right */}
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNextPress}
            >
              <View style={styles.buttonWithIcon}>
                <Text style={styles.nextButtonText}>{getTranslatedText(selectedLanguage, 'next')}</Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : currentSection === 'onboardingPage5' ? (
          <>
            {/* Back button on the left when on onboardingPage5 */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <View style={styles.buttonWithIcon}>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="0,6 12,0 12,12"
                    fill={Colors.light.text}
                  />
                </Svg>
                <Text style={styles.backButtonText}>{getTranslatedText(selectedLanguage, 'back')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Skip button still centered */}
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
                <Text style={styles.skipButtonText}>{getTranslatedText(selectedLanguage, 'skip')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Next button still on the right */}
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNextPress}
            >
              <View style={styles.buttonWithIcon}>
                <Text style={styles.nextButtonText}>{getTranslatedText(selectedLanguage, 'next')}</Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : currentSection === 'onboardingPage6' ? (
          <>
            {/* Back button on the left when on onboardingPage6 */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <View style={styles.buttonWithIcon}>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="0,6 12,0 12,12"
                    fill={Colors.light.text}
                  />
                </Svg>
                <Text style={styles.backButtonText}>{getTranslatedText(selectedLanguage, 'back')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Next button on the right */}
            <TouchableOpacity 
              style={styles.nextButton} 
            >
              <View style={[styles.buttonWithIcon, { opacity: 0 }]}>
                <Text style={[styles.nextButtonText]}>{getTranslatedText(selectedLanguage, 'next')}</Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  animation: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageBackgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoAnimation: {
    width: 200, // Adjust size as needed
    height: 200, // Adjust size as needed
  },
  topButtonRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align content to the right
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10, // Ensure buttons are above animations
  },
  skipButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
  },
  nextButton: {
    paddingHorizontal: 0,
    paddingVertical: 5,
    minWidth: 60,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    paddingHorizontal: 0,
    paddingVertical: 5,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
  },
  onboardingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  onboardingContent: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.77, // 80% of screen height
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    padding: 10,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    marginBottom: 0,
  },
  appTitle: {
    fontSize: 48,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
  },
  animationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 0,
    padding: 10,
  },
  loadingAnimation: {
    width: Dimensions.get('window').height * 0.8, // 15% of device height
    height: Dimensions.get('window').height * 0.3, // 15% of device height
  },
  loadingAnimationAfterSignIn:{
    width: 96, // Same size as the original splash screen
    height: 96,
  },
  secondRow: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 12,
    flex: 1, // Expand to fill available space
    justifyContent: 'flex-start',
  },
  questionText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 12,
    flex: 1, // Expand to fill remaining space in secondRow
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#4F41D8',
    marginHorizontal: 8,
    position: 'relative',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 26, // 4 (text bottom) + 24 (text height) + 4 (margin) = 32
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
  },
  cardTextSmall: {
    fontSize: 12,
  },
  selectedCard: {
    backgroundColor: '#D5D4DD',
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#000000',
    opacity: 0.8,
  },
  onboardingPage2Container: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingHorizontal: 12,
  },
  onboardingPage2Content: {
    width: '100%',
    flex: 1,
  },
  onboardingPage3Container: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingHorizontal: 12,
  },
  onboardingPage3ContainerInterview: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingPage3Content: {
    width: '100%',
    flex: 1,
  },
  onboardingPage3ContentInterview: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  onboardingPage4Container: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  onboardingPage4Content: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 12,
  },
  onboardingPage5Container: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  onboardingPage5Content: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 12,
  },
  onboardingPage6Container: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  onboardingPage6Content: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  onboardingPage6TopSection: {
    alignItems: 'center',
  },
  onboardingPage6MiddleSection: {
    flex: 1,
    alignItems: 'stretch',
    paddingVertical: 12,
    minHeight: 0,
  },
  onboardingPage6CarouselContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      },
    }),
  },
  onboardingPage6BottomSection: {
    alignItems: 'center',
  },
  onboardingPage6ArrowContainer: {
    // marginBottom: 12,
  },
  onboardingPage6Button: {
    backgroundColor: '#4F41D8',
    borderRadius: 100,
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').height * 0.07,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingPage6ButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    color: 'white',
    textAlign: 'center',
  },
  awesomeText: {
    fontSize: 32,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
  },
  onboardingPage6RectangleContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    // marginHorizontal: 12,
    ...Platform.select({
      android: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      },
    }),
  },
  onboardingPage6RectangleText: {
    fontSize: 20,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    lineHeight: 28,
  },
  signUpText: {
    fontSize: 28,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    // marginBottom: 12,
  },
  downArrowAnimation: {
    width: 40,
    height: 40,
  },
  onboardingPage4ScrollView: {
    flex: 1,
  },
  onboardingPage4ScrollContent: {
    paddingBottom: 20,
  },
  optionalQuestionsText: {
    fontSize: 28,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    marginTop: 12,
  },
  questionTextLeft: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'left',
    marginTop: 12,
  },
  helperText: {
    fontSize: 20,
    fontFamily: Fonts.bodyItalicLight,
    color: 'black',
    textAlign: 'left',
    marginTop: 4,
  },
  greatText: {
    fontSize: 28,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
  },
  questionsText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'left',
    marginTop: 12,
  },
  progressText: {
    fontSize: 28,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    marginTop: 12,
  },
  subjectQuestionText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    marginTop: 12,
  },
  educationQuestionText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    marginTop: 20,
  },
  textInputContainer: {
    position: 'relative',
    marginTop: 12,
  },
  subjectTextInput: {
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.light.unselectedText,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50, // Make space for the cancel icon
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'left',
    width: '100%',
  },
  educationTextInput: {
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.light.unselectedText,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50, // Make space for the cancel icon
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'left',
    width: '100%',
  },
  cancelIconButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  suggestionsText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'left',
    marginTop: 12,
  },
  suggestionsTextInterview: {
    textAlign: 'left',
  },
  suggestionsScrollView: {
    flex: 1,
    marginTop: 12,
  },
  suggestionsScrollViewInterview: {
    flex: 0,
    marginTop: 12,
  },
  suggestionsContainer: {
    paddingBottom: 0,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  suggestionCard: {
    width: '48%',
    height: Dimensions.get('window').height * 0.2,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#4F41D8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  suggestionCardText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
  },
  selectedSuggestionCard: {
    backgroundColor: '#D5D4DD',
  },
  suggestionCardTextSmall: {
    fontSize: 12,
  },
  suggestionCardImageContainer: {
    position: 'absolute',
    top: 16,
    left: 8,
    right: 8,
    bottom: 48, // 16 (margin) + 24 (text height) = 40
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  questionAnimation: {
    width: 200,
    height: 120,
  },
  paragraphText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    marginTop: 20,
  },
  rectangleContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 30,
    marginTop: 20,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      },
    }),
  },
  gestureContainer: {
    flex: 1,
  },
  carouselPage: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onboardingPage6CarouselPage: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  carouselPageContent: {
    flexDirection: 'row',
    height: '100%',
    width: '900%', // 9 pages * 100% (7 real + 2 duplicates)
  },
  carouselSinglePage: {
    width: '11.1111%', // 100% / 9 pages
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselTitle: {
    fontSize: 24,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
  },
  carouselSubtitle: {
    fontSize: 20,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    marginTop: 4,
  },
  carouselBodyText: {
    fontSize: 18,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  carouselImagePlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  carouselMultipleImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  carouselMultipleImagesContainerLargeGap: {
    gap: 48,
  },
  carouselMultipleImageItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselVsText: {
    position: 'absolute',
    fontSize: 24,
    fontFamily: Fonts.bodyBold,
    color: 'black',
    textAlign: 'center',
    alignSelf: 'center',
    zIndex: 1,
  },
  carouselThreeImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    gap: 4,
  },
  carouselLeftImage: {
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  carouselRightImages: {
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 12,
  },
  carouselTopRightImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '70%',
  },
  carouselBottomRightImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '70%',
  },
  carouselFourImagesContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    gap: 20,
  },
  carouselTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 16,
    flex: 1,
  },
  carouselTopRowImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    maxHeight: 120,
  },
  carouselBottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  carouselBottomRowImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    maxHeight: 120,
  },
  carouselNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 8,
  },
  carouselDotActive: {
    backgroundColor: '#4F41D8',
  },
  onboardingPage6AnimationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    width: '100%',
  },
  onboardingPage6Animation: {
    width: '100%',
    height: '100%',
  },
  // Signup page styles
  signInContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  whiteContainer: {
    width: '90%',
    height: height * 0.85,
    opacity: 0.95,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  toggleOption: {
    marginHorizontal: 20,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 20,
    paddingVertical: 8,
  },
  underline: {
    height: 3,
    width: '200%',
    marginTop: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  signInButton: {
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  signInButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
  },
  signInWithText: {
    fontSize: 16,
    marginBottom: 16,
  },
  socialLoginContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  socialLoginButton: {
    width: '90%',
    height: 50,
    borderWidth: 2,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialLoginText: {
    fontSize: 16,
  },
  iconContainer: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
  },
  // Verification code modal styles
  verificationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  verificationCodeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendButton: {
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingAnimationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
