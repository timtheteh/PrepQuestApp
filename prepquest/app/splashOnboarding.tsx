import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

const { height } = Dimensions.get('window');

interface SplashOnboardingProps {
  onComplete: () => void;
}

export default function SplashOnboarding({ onComplete }: SplashOnboardingProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => {
    // Show onboarding for 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Onboarding</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bodyMedium,
    color: Colors.light.text,
    textAlign: 'center',
  },
});
