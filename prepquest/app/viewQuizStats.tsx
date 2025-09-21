import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { AverageGradeThermometer } from '@/components/statsComponents/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/statsComponents/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/statsComponents/AverageSpeedTotal';
import DoubleChevron from '@/assets/icons/generalIcons/DoubleChevron.svg';

import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { loadQuizStatsForView, type QuizStats } from '@/db/decks';
import { BackgroundTaskNotification } from '@/components/inAppNotifications/BackgroundTaskNotification';

// Memoized child components to prevent unnecessary re-renders
const MemoizedText = React.memo(({ style, children }: { style: any; children: React.ReactNode }) => (
  <Text style={style}>{children}</Text>
));

const MemoizedTouchableOpacity = React.memo(({ 
  style, 
  onPress, 
  children, 
  activeOpacity 
}: {
  style: any;
  onPress: () => void;
  children: React.ReactNode;
  activeOpacity?: number;
}) => (
  <TouchableOpacity style={style} onPress={onPress} activeOpacity={activeOpacity}>
    {children}
  </TouchableOpacity>
));

const MemoizedImage = React.memo(({ source, style, resizeMode }: {
  source: any;
  style: any;
  resizeMode: any;
}) => (
  <Image source={source} style={style} resizeMode={resizeMode} />
));

const ConfettiIcon = require('@/assets/icons/generalIcons/ConfettiIcon.png');
const FlagIcon = require('@/assets/icons/generalIcons/FlagIcon.png');

export default function ViewQuizStatsModal() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { halfwayCheckpoint, deckID, isAIDeck, attemptedFlashcardIds } = useLocalSearchParams();
  const isHalfwayCheckpoint = halfwayCheckpoint === 'true';
  
  const [quizStats, setQuizStats] = useState<QuizStats>({
    currentGrade: 0,
    difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
    averageTimeSeconds: 0,
    totalTimeSeconds: 0,
    attemptedCount: 0,
    totalCount: 0
  });

  // Format time from seconds to "Xmin Ys" format, localized
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return strings[language].flashcardViewPage.timeFormatMinutesSeconds
        .replace('{minutes}', minutes.toString())
        .replace('{seconds}', remainingSeconds.toString());
    } else {
      return strings[language].flashcardViewPage.timeFormatSeconds
        .replace('{seconds}', remainingSeconds.toString());
    }
  }, [language]);

  // Memoized style objects to prevent recreation on every render
  const containerStyle = useMemo(() => [
    styles.container, 
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  const closeButtonIconColor = useMemo(() => Colors[theme].text, [theme]);

  const wellDoneTitleStyle = useMemo(() => [
    styles.wellDoneTitle, 
    { color: Colors[theme].text, fontFamily: Fonts.title }
  ], [theme]);

  const progressIndicatorStyle = useMemo(() => [
    styles.progressIndicator, 
    { backgroundColor: Colors[theme].secondaryShade }
  ], [theme]);

  const progressTextStyle = useMemo(() => [
    styles.progressText, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  const totalTimeLabelStyle = useMemo(() => [
    styles.totalTimeLabel, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  const totalTimeValueStyle = useMemo(() => [
    styles.totalTimeValue, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyBold }
  ], [theme]);

  const fixedBottomButtonStyle = useMemo(() => [
    styles.fixedBottomButton, 
    { backgroundColor: Colors[theme].brandColor2 }
  ], [theme]);

  const buttonTextStyle = useMemo(() => [
    styles.buttonText, 
    { color: Colors[theme].background, fontFamily: Fonts.bodyBold }
  ], [theme]);

  // Memoized values
  const progressText = useMemo(() => 
    `${quizStats.attemptedCount} / ${quizStats.totalCount} ${strings[language].flashcardViewPage.flashcardsCompleted}`,
    [quizStats.attemptedCount, quizStats.totalCount, language]
  );

  const formattedTotalTime = useMemo(() => 
    formatTime(quizStats.totalTimeSeconds),
    [quizStats.totalTimeSeconds]
  );

  // Load quiz statistics from database
  const loadQuizStats = useCallback(async () => {
    try {
      if (!deckID || !attemptedFlashcardIds) return;

      const stats = await loadQuizStatsForView(
        deckID as string,
        isAIDeck as string,
        attemptedFlashcardIds as string
      );
      
      setQuizStats(stats);
    } catch (error) {
      console.error('Error loading quiz stats:', error);
    }
  }, [deckID, isAIDeck, attemptedFlashcardIds]);

  // Load stats when component mounts
  useEffect(() => {
    loadQuizStats();
  }, [loadQuizStats]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={containerStyle}>
      {/* Close button absolutely positioned at top right */}
      <MemoizedTouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
        <AntDesign name="close" size={28} color={closeButtonIconColor} />
      </MemoizedTouchableOpacity>
      <ScrollView
        style={[styles.scrollContainer, { marginBottom: isHalfwayCheckpoint ? 120 : 0 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row with confetti */}
        <View style={styles.titleRow}>
          {isHalfwayCheckpoint ? (
            <MemoizedImage source={FlagIcon} style={[styles.confettiIcon, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
          ) : (
            <MemoizedImage source={ConfettiIcon} style={[styles.confettiIcon, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
          )}
          {isHalfwayCheckpoint ? (
            <MemoizedText style={wellDoneTitleStyle}>{strings[language].flashcardViewPage.halfwayCheckpoint}</MemoizedText>
          ) : (
            <MemoizedText style={wellDoneTitleStyle}>{strings[language].flashcardViewPage.wellDone}</MemoizedText>
          )}
          {isHalfwayCheckpoint ? (
            <MemoizedImage source={FlagIcon} style={styles.confettiIcon} resizeMode="contain" />
          ) : (
            <MemoizedImage source={ConfettiIcon} style={styles.confettiIcon} resizeMode="contain" />
          )}
        </View>
        
        {/* Progress indicator for halfway checkpoint */}
        {isHalfwayCheckpoint && (
          <View style={progressIndicatorStyle}>
            <MemoizedText style={progressTextStyle}>
              {progressText}
            </MemoizedText>
          </View>
        )}

        {/* AverageGradeThermometer */}
        <View style={{ marginTop: 10 }}>
          <AverageGradeThermometer score={quizStats.currentGrade} />
        </View>
        
        {/* BreakdownByDifficultyPie */}
        <View style={{ marginTop: 10 }}>
          <BreakdownByDifficultyPie breakdown={quizStats.difficultyBreakdown} />
        </View>
        
        {/* AverageSpeedTotal */}
        <View style={{ marginTop: 10 }}>
          <AverageSpeedTotal averageTime={quizStats.averageTimeSeconds} />
        </View>
        
        {/* Total time spent */}
        <View style={styles.totalTimeWrap}>
          <MemoizedText style={totalTimeLabelStyle}>{strings[language].flashcardViewPage.totalTimeSpent}</MemoizedText>
          <MemoizedText style={totalTimeValueStyle}>{formattedTotalTime}</MemoizedText>
        </View>
      </ScrollView>
      
      {/* Halfway checkpoint button fixed at bottom */}
      {isHalfwayCheckpoint && (
        <View style={styles.fixedBottomButtonWrap} pointerEvents="box-none">
          <MemoizedTouchableOpacity style={fixedBottomButtonStyle} activeOpacity={0.85} onPress={handleBackPress}>
            <View style={styles.buttonContentRow}>
              <MemoizedText style={buttonTextStyle}>{strings[language].flashcardViewPage.continueWithQuiz}</MemoizedText>
              <DoubleChevron width={36} height={36} />
            </View>
          </MemoizedTouchableOpacity>
        </View>
      )}

      {/* In-app notifications */}
      <BackgroundTaskNotification />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 30 : 60,
    paddingHorizontal: 0,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 15 : 40,
    right: 12,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 0,
  },
  confettiIcon: {
    width: 44,
    height: 44,
    marginHorizontal: 2,
  },
  wellDoneTitle: {
    fontSize: 44,
    textAlign: 'center',
    marginHorizontal: 10,
    marginTop: 2,
  },
  avgTimeTitleWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgTimeTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 40,
    color: '#111',
    textAlign: 'center',
    lineHeight: 44,
  },
  avgTimeSubtitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 40,
    color: '#111',
    textAlign: 'center',
    lineHeight: 44,
    marginTop: -8,
  },
  totalTimeWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimeLabel: {
    fontSize: 32,
    textAlign: 'center',
    marginTop: 0,
  },
  totalTimeValue: {
    fontSize: 40,
    textAlign: 'center',
    marginTop: 0,
  },
  fixedBottomButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 30 : 24,
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  fixedBottomButton: {
    width: 350,
    height: 72,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 22,
    letterSpacing: 0.2,
  },
  progressIndicator: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 18,
  },
}); 