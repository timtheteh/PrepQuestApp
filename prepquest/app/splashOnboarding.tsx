import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ImageBackground, Animated, Platform, TextInput, ScrollView } from 'react-native';
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
  const [currentSection, setCurrentSection] = useState<'logoAnimation' | 'languageSelection' | 'onboardingPage1' | 'onboardingPage2' | 'onboardingPage3' | 'onboardingPage4'>('logoAnimation');
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


  // Animation state for transitions
  const [showLanguageSelector, setShowLanguageSelector] = useState(true); // Pre-render to prevent glitch
  const logoFadeAnim = useRef(new Animated.Value(1)).current;
  const languageSelectorFadeAnim = useRef(new Animated.Value(0)).current;
  const pngBackgroundFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage1ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage2ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage3ContentFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingPage4ContentFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize animation values to prevent glitch
  useEffect(() => {
    logoFadeAnim.setValue(1);
    languageSelectorFadeAnim.setValue(0);
    pngBackgroundFadeAnim.setValue(0);
    onboardingPage1ContentFadeAnim.setValue(0);
    onboardingPage2ContentFadeAnim.setValue(0);
    onboardingPage3ContentFadeAnim.setValue(0);
    onboardingPage4ContentFadeAnim.setValue(0);
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
          <Animated.View style={[styles.onboardingPage2Container, { top: insets.top + 30, bottom: insets.bottom + 5, opacity: onboardingPage2ContentFadeAnim, borderWidth: 2, borderColor: 'red'}]}>
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
                  </>
                )}
              </ScrollView>
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
    borderWidth: 2,
    borderColor: 'red',
  },
  onboardingPage4Content: {
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
});
