import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ImageBackground, Animated, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import LanguageSelector from '@/components/onboarding/LanguageSelector';

const { height } = Dimensions.get('window');


interface SplashOnboardingProps {
  onComplete: () => void;
}


export default function SplashOnboarding({ onComplete }: SplashOnboardingProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // State for background transition
  const [showSvgBackground, setShowSvgBackground] = useState(false);
  const [hideLogoAnimation, setHideLogoAnimation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');


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


  // Animation state for transitions
  const [showLanguageSelector, setShowLanguageSelector] = useState(true); // Pre-render to prevent glitch
  const logoFadeAnim = useRef(new Animated.Value(1)).current;
  const languageSelectorFadeAnim = useRef(new Animated.Value(0)).current;

  // Start animations on mount and set timer for background transition
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
    if (logoAnimationRef.current) {
      logoAnimationRef.current.play();
    }

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
      if (animationRef.current) {
        animationRef.current.pause();
      }
      if (logoAnimationRef.current) {
        logoAnimationRef.current.pause();
      }
      clearTimeout(logoTimer);
    };
  }, [logoFadeAnim, languageSelectorFadeAnim]);

  const handleSkipPress = () => {
    onComplete();
  };

  const handleNextPress = () => {
    // Show PNG background when Next is clicked
    setShowSvgBackground(true);
  };

  const handleLanguageChange = (languageKey: string) => {
    setSelectedLanguage(languageKey as any);
  };

  return (
    <View style={styles.container}>
      {!showSvgBackground ? (
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
          
          {/* Logo animation centered with fade animation */}
          {!hideLogoAnimation && (
            <Animated.View style={[styles.logoContainer, { opacity: logoFadeAnim }]}>
              <LottieView
                ref={logoAnimationRef}
                source={logoAnimationSource}
                autoPlay
                loop={false}
                style={styles.logoAnimation}
                speed={1}
                cacheComposition={true}
                renderMode="HARDWARE"
                onAnimationFailure={(error) => {
                  console.error('Logo animation failed to load:', error);
                }}
              />
            </Animated.View>
          )}

          {/* Language selection with fade animation */}
          {showLanguageSelector && (
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
              />
            </Animated.View>
          )}
        </>
      ) : (
        /* PNG background that covers the whole screen */
        <ImageBackground
          source={require('../assets/onboarding/onboardingBackground.png')}
          style={styles.imageBackground}
          resizeMode="cover"
        />
      )}

      {/* Top button row with Skip and Next - always visible */}
      <View style={[styles.topButtonRow, { top: insets.top }]}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
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
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoContainer: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10, // Ensure buttons are above animations
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
  },
  nextButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    color: 'black',
    textAlign: 'center',
  },
});
