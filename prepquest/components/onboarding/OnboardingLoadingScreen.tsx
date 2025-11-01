import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface OnboardingLoadingScreenProps {
  authProgress: {
    loggingIn: boolean;
    loggedIn: boolean;
  };
  databaseProgress: {
    initializing: boolean;
    initialized: boolean;
  };
  deckCreationProgress: {
    currentDeck: number; // 0 = not started, 1-3 = current deck, 4 = all complete
    totalDecks: number;
  };
}

export default function OnboardingLoadingScreen({
  authProgress,
  databaseProgress,
  deckCreationProgress,
}: OnboardingLoadingScreenProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Build status rows based on progress
  const statusRows: { done: boolean; label: string }[] = [];

  // Auth progress
  statusRows.push({
    done: authProgress.loggedIn,
    label: authProgress.loggedIn
      ? strings[language].onboardingLoadingScreen.loggedInSuccessfully
      : strings[language].onboardingLoadingScreen.loggingYouIn,
  });

  // Database initialization
  statusRows.push({
    done: databaseProgress.initialized,
    label: databaseProgress.initialized
      ? strings[language].onboardingLoadingScreen.databaseInitialized
      : strings[language].onboardingLoadingScreen.initializingDatabase,
  });

  // Free deck creation progress - show single line with progress counter
  if (deckCreationProgress.currentDeck > 0) {
    const totalStr = deckCreationProgress.totalDecks.toString();
    const isComplete = deckCreationProgress.currentDeck > deckCreationProgress.totalDecks;
    const currentStr = isComplete ? deckCreationProgress.totalDecks.toString() : deckCreationProgress.currentDeck.toString();
    
    statusRows.push({
      done: isComplete,
      label: isComplete
        ? strings[language].onboardingLoadingScreen.successfullyCreatedFreeDecks
        : strings[language].onboardingLoadingScreen.creatingFreeDecks.replace('{n}', currentStr).replace('{total}', totalStr),
    });
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background, zIndex: 2000 }}>
      <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
        {/* Title above animation */}
        <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.title, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
            {strings[language].onboardingLoadingScreen.settingUpYourAccount}
          </Text>
        </View>
        
        {/* Stacked image + Lottie animation */}
        <View style={{ aspectRatio: 1.2, width: '100%', marginBottom: 0, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {theme !== 'dark' && (
            <Image
              source={require('@/assets/images/loadingBackground.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ rotate: '90deg' }] }}
              resizeMode="contain"
              fadeDuration={0}
            />
          )}
          <LottieView
            source={theme === 'dark' ? require('@/assets/animations/LoadingAnimation1DarkMode.json') : require('@/assets/animations/LoadingAnimation1.json')}
            autoPlay
            loop
            style={{ position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%' }}
            cacheComposition={true}
          />
        </View>
        
        {/* Status rows below animation */}
        <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center', marginTop: 8 }}>
          <View style={{ width: '80%', marginTop: 8, marginLeft: 48 }}>
            {statusRows.map((row, idx) => (
              <View key={`${row.label}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                {row.done ? (
                  <GreenTickIcon width={28} height={28} style={{ marginRight: 12, marginTop: 5 }} />
                ) : (
                  <DeleteModalIcon width={28} height={28} style={{ marginRight: 12 }} />
                )}
                <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 18, color: Colors[theme].text }}>{row.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
});

