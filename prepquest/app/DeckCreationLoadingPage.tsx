import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useContentTopHeightNoRoundedToggle2, useTopBarAccountHeight } from '@/hooks/heights';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

const { width } = Dimensions.get('window');

interface DeckCreationLoadingPageProps {
  progress: number; // 0 to 1
  current: number;
  total: number;
  isInViewFlashcardsPage: boolean;
  onCancel?: () => void;
  onMinimize?: () => void;
}




export default function DeckCreationLoadingPage({
  progress = 0,
  current = 0,
  total = 1,
  isInViewFlashcardsPage = false,
  onCancel,
  onMinimize,
}: DeckCreationLoadingPageProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { backgroundTaskProgress } = useBackgroundTask();
  const router = useRouter();
  // Derive progress from background task if available (manual add)
  const bgTotal = Number(backgroundTaskProgress?.totalCount || 0);
  const bgCurrent = Number(backgroundTaskProgress?.createdCount || 0);
  const useBg = backgroundTaskProgress && backgroundTaskProgress.taskType === 'manualAdd' && bgTotal > 0;
  const effectiveTotal = useBg ? bgTotal : total;
  const effectiveCurrent = useBg ? bgCurrent : current;
  const effectiveProgress = useBg ? (bgTotal > 0 ? bgCurrent / bgTotal : 0) : progress;
  const percent = Math.round(effectiveProgress * 100);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const getContentTopHeightNoRoundedToggle2 = useContentTopHeightNoRoundedToggle2();
  const getTopBarAccountHeight = useTopBarAccountHeight();

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress, progressAnim]);

  const animatedWidth = useCallback(() => {
    return progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
  }, [progressAnim]);

  return (
    <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background}}>
      {/* Top row with Minimize (left) and Cancel (right) to match status page */}
      {onMinimize && (
        <TouchableOpacity
          style={{ position: 'absolute', top: insets.top + 10, left: 16, zIndex: 10, padding: 8 }}
          onPress={() => {
            if (onMinimize) {
              onMinimize();
            } else {
              // Default: navigate back to previous screen
              router.back();
            }
          }}
        >
          <Text style={{ fontSize: 20, color: Colors[theme].brandColor1, fontFamily: Fonts.bodyMedium }}>{strings[language].minimize}</Text>
        </TouchableOpacity>
      )}
      {/* Cancel button at top right */}
      {onCancel && (
        <TouchableOpacity
          style={{ position: 'absolute', top: insets.top + 10, right: 16, zIndex: 10, padding: 8 }}
          onPress={onCancel}
        >
          <Text style={{ fontSize: 20, color: Colors[theme].alertColor, fontFamily: Fonts.bodyMedium }}>{strings[language].cancel}</Text>
        </TouchableOpacity>
      )}
      {/* Wrapper for all content to keep it centered as a unit */}
      <View style={{ width: '100%', alignItems: 'center', marginTop: 20}}>
        {/* Stacked image + Lottie animation */}
        <View style={{ aspectRatio: 1.1, width: '100%', marginBottom: 0, position: 'relative', alignItems: 'center', justifyContent: 'center',}}>
          {theme !== 'dark' && (
            <Image
              source={require('@/assets/images/loadingBackground.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24 }}
              resizeMode="contain"
              fadeDuration={0}
            />
          )}
          <LottieView
            source={require('@/assets/animations/LoadingAnimation1.json')}
            autoPlay
            loop
            style={{ position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%' }}
            cacheComposition={true}
          />
        </View>
        {/* Text and progress below */}
        <View style={{ width: '100%', paddingHorizontal: 32, alignItems: 'center' }}>
          <Text style={[styles.title, { color: Colors[theme].text, fontFamily: Fonts.bodyBold }]}>
            {isInViewFlashcardsPage ? strings[language].deckCreationLoadingPage.flashcardsOnWay : strings[language].deckCreationLoadingPage.deckOnWay}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: Colors[theme].secondaryShade }]}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: animatedWidth(),
                    backgroundColor: percent === 100 ? Colors[theme].brandColor1 : Colors[theme].brandColor2,
                  }
                ]} 
              />
            </View>
          </View>
          <Text style={[styles.percentText, { color: Colors[theme].brandColor2, fontFamily: Fonts.bodyBold }]}>{percent}%</Text>
          <Text style={[styles.countText, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
            {strings[language].deckCreationLoadingPage.flashcardsGenerated.replace('{current}', String(effectiveCurrent)).replace('{total}', String(effectiveTotal))}
          </Text>
        </View>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  percentText: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  countText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
}); 