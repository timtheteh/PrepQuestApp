import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ImageBackground, Animated, Platform, TextInput, ScrollView } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import LanguageSelector from '@/components/onboarding/LanguageSelector';
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
import { Svg, Polygon } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTranslatedText } from '@/constants/stringsOnboarding';

const { height } = Dimensions.get('window');


interface SplashOnboardingProps {
  onComplete: () => void;
}


export default function SplashOnboarding({ onComplete }: SplashOnboardingProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // State for section navigation
  const [currentSection, setCurrentSection] = useState<'logoAnimation' | 'languageSelection' | 'onboardingPage1' | 'onboardingPage2' | 'onboardingPage3' | 'onboardingPage4' | 'onboardingPage5'>('logoAnimation');
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

  // Carousel data - create extended array with duplicates for circular navigation
  const originalCarouselPages = [
    {
      id: 1,
      title: '1/7',
      subtitle: 'Recall-based Questions',
      bodyText: 'E.g. What are 3 examples of fruits?',
    },
    {
      id: 2,
      title: '2/7',
      subtitle: 'Application Questions',
      bodyText: 'E.g. How would you apply Newton\'s laws to explain a car crash?',
    },
    {
      id: 3,
      title: '3/7',
      subtitle: 'Analysis Questions',
      bodyText: 'E.g. Compare and contrast the advantages of renewable vs non-renewable energy sources.',
    },
    {
      id: 4,
      title: '4/7',
      subtitle: 'Synthesis Questions',
      bodyText: 'E.g. Design a solution that combines AI and sustainability to address climate change.',
    },
    {
      id: 5,
      title: '5/7',
      subtitle: 'Evaluation Questions',
      bodyText: 'E.g. Evaluate the effectiveness of remote work policies in improving productivity.',
    },
    {
      id: 6,
      title: '6/7',
      subtitle: 'Creative Questions',
      bodyText: 'E.g. Invent a new product that solves a problem you\'ve never seen solved before.',
    },
    {
      id: 7,
      title: '7/7',
      subtitle: 'Critical Thinking Questions',
      bodyText: 'E.g. Analyze the potential risks and benefits of implementing universal basic income.',
    },
  ];

  // Create extended carousel with duplicates for circular navigation
  // Add last page at the beginning and first page at the end
  const carouselPages = [
    { ...originalCarouselPages[6], id: 0 }, // Duplicate last page at start
    ...originalCarouselPages,
    { ...originalCarouselPages[0], id: 8 }, // Duplicate first page at end
  ];

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

  // Reset carousel when entering onboardingPage5
  useEffect(() => {
    if (currentSection === 'onboardingPage5') {
      const initialPage = 1; // Start at the first real page (not the duplicate)
      setCurrentCarouselPage(initialPage);
      carouselTranslateX.setValue(-initialPage * containerWidth.current);
      isAnimating.current = false;
    }
  }, [currentSection]);

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
    onComplete();
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
        
        // Then fade in onboardingPage5 content
        Animated.timing(onboardingPage5ContentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
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
    }
  };

  const handleLanguageChange = async (languageKey: string) => {
    setSelectedLanguage(languageKey as any);
    try {
      await AsyncStorage.setItem('languagePreferenceOnboarding', languageKey);
    } catch (error) {
      console.error('Error saving language preference:', error);
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
      tension: 120,
      friction: 8,
    }).start(() => {
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
      const threshold = containerWidth.current * 0.25;
      const velocityThreshold = 300;
      
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
        tension: 100,
        friction: 10,
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
                        onPress={() => handleEducationSuggestionPress('PhD')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <AdultLearnerImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'phd')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cardRow}>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('Professional') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Professional')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <MiddleSchoolImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'professional')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.suggestionCard, studySelectedEducationSuggestions.has('Certification') && styles.selectedSuggestionCard]}
                        onPress={() => handleEducationSuggestionPress('Certification')}
                      >
                        <View style={styles.suggestionCardImageContainer}>
                          <ElementarySchoolImage width="100%" height="100%" />
                        </View>
                        <Text style={styles.suggestionCardText}>
                          {getTranslatedText(selectedLanguage, 'certification')}
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

      {/* onboardingPage5 - Final page */}
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
              
              {/* Second paragraph
              <Text style={styles.paragraphText}>
                {getTranslatedText(selectedLanguage, 'tailorFlashcardsParagraph')}
              </Text> */}
              
              {/* Carousel container */}
              <View style={styles.rectangleContainer}>
                <GestureHandlerRootView style={styles.gestureContainer}>
                  <PanGestureHandler 
                    onHandlerStateChange={handlePanGesture}
                    activeOffsetX={[-10, 10]}
                    failOffsetY={[-50, 50]}
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
                              key={page.id} 
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
                              
                              {/* Placeholder for SVG image */}
                              <View style={styles.carouselImagePlaceholder}>
                                {/* SVG will be added here later */}
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

      {/* Top button row with conditional buttons */}
      <View style={[styles.topButtonRow, { top: insets.top }]}>
        {currentSection === 'languageSelection' ? (
          <>
            {/* Skip button positioned absolutely in center */}
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
                <Text style={styles.skipButtonText}>{getTranslatedText(selectedLanguage, 'skip')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Next button stays on the right */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
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
            
            {/* Next button still on the right - disabled for now */}
            <TouchableOpacity 
              style={[styles.nextButton, styles.disabledButton]} 
              onPress={undefined}
              disabled={true}
            >
              <View style={styles.buttonWithIcon}>
                <Text style={[styles.nextButtonText, styles.disabledButtonText]}>{getTranslatedText(selectedLanguage, 'next')}</Text>
                <Svg width="12" height="12" viewBox="0 0 12 12">
                  <Polygon
                    points="12,6 0,0 0,12"
                    fill={Colors.light.text}
                    opacity={0.8}
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
  carouselNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 4,
  },
  carouselDotActive: {
    backgroundColor: '#4F41D8',
  },
});
