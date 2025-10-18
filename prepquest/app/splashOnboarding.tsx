import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ImageBackground, Animated, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import LanguageSelector from '@/components/onboarding/LanguageSelector';
import StudyOnboardingImage from '@/assets/onboarding/studyOnboardingImage.svg';
import InterviewOnboardingImage from '@/assets/onboarding/interviewOnboardingImage.svg';
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
  const [currentSection, setCurrentSection] = useState<'logoAnimation' | 'languageSelection' | 'onboardingPage1' | 'onboardingPage2'>('logoAnimation');
  const [hideLogoAnimation, setHideLogoAnimation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedCard, setSelectedCard] = useState<'study' | 'interview' | null>(null);

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
  
  // Initialize animation values to prevent glitch
  useEffect(() => {
    logoFadeAnim.setValue(1);
    languageSelectorFadeAnim.setValue(0);
    pngBackgroundFadeAnim.setValue(0);
    onboardingPage1ContentFadeAnim.setValue(0);
    onboardingPage2ContentFadeAnim.setValue(0);
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
                    onPress={() => setSelectedCard('study')}
                  >
                    <View style={styles.imageContainer}>
                      <StudyOnboardingImage width="100%" height="100%" />
                    </View>
                    <Text 
                      style={[
                        styles.cardText,
                        getTranslatedText(selectedLanguage, 'studyPrep').length > 8 && styles.cardTextSmall
                      ]}
                    >
                      {getTranslatedText(selectedLanguage, 'studyPrep')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.card, selectedCard === 'interview' && styles.selectedCard]} 
                    onPress={() => setSelectedCard('interview')}
                  >
                    <View style={styles.imageContainer}>
                      <InterviewOnboardingImage width="100%" height="100%" />
                    </View>
                    <Text 
                      style={[
                        styles.cardText,
                        getTranslatedText(selectedLanguage, 'interviewPrep').length > 8 && styles.cardTextSmall
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
          <Animated.View style={[styles.onboardingPage2Container, { top: insets.top + 60, opacity: onboardingPage2ContentFadeAnim }]}>
            <View style={styles.onboardingPage2Content}>
              {/* First row: Great! */}
              <Text style={styles.greatText}>{getTranslatedText(selectedLanguage, 'great')}</Text>
              
              {/* Second row: Just a few more questions... */}
              <Text style={styles.questionsText}>{getTranslatedText(selectedLanguage, 'justAFewMoreQuestions')}</Text>
              
              {/* Third row: 1/3 */}
              <Text style={styles.progressText}>{getTranslatedText(selectedLanguage, 'progress')}</Text>
              
              {/* Fourth row: Which subject(s)... */}
              <Text style={styles.subjectQuestionText}>{getTranslatedText(selectedLanguage, 'whichSubjects')}</Text>
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
    marginTop: 20,
  },
  subjectQuestionText: {
    fontSize: 20,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
    marginTop: 12,
  },
});
