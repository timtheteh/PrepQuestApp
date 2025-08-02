import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { AverageGradeThermometer } from '@/components/statsComponents/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/statsComponents/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/statsComponents/AverageSpeedTotal';
import DoubleChevron from '@/assets/icons/generalIcons/DoubleChevron.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

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

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

const ConfettiIcon = require('@/assets/icons/generalIcons/ConfettiIcon.png');
const FlagIcon = require('@/assets/icons/generalIcons/FlagIcon.png');

interface QuizStats {
  currentGrade: number;
  difficultyBreakdown: {
    Again: number;
    Hard: number;
    Good: number;
    Easy: number;
  };
  averageTimeSeconds: number;
  totalTimeSeconds: number;
  attemptedCount: number;
  totalCount: number;
}

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
    if (language === 'Chinese') {
      if (minutes > 0) {
        return `${minutes}分${remainingSeconds}秒`;
      } else {
        return `${remainingSeconds}秒`;
      }
    } else {
      if (minutes > 0) {
        return `${minutes}min ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
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

      const isAIDeckFromParams = isAIDeck === 'true';
      const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
      const deckId = parseInt(deckID as string);
      
      // Parse the attempted flashcard IDs
      const attemptedIds = JSON.parse(attemptedFlashcardIds as string) as number[];
      
      if (attemptedIds.length === 0) {
        setQuizStats({
          currentGrade: 0,
          difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
          averageTimeSeconds: 0,
          totalTimeSeconds: 0,
          attemptedCount: 0,
          totalCount: 0
        });
        return;
      }

      // Get attempted flashcards with their difficulty ratings and time taken
      const placeholders = attemptedIds.map(() => '?').join(',');
      const userID = await getCurrentUserID();
      const attemptedFlashcards = await db.getAllAsync(`
        SELECT 
          flashcardID,
          difficultyRating,
          timeTaken,
          lastStudiedDate,
          lastQuizzedDate,
          answerType,
          isMcqAnswerRight
        FROM ${tableName}
        WHERE flashcardID IN (${placeholders})
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND difficultyRating != 'None'
          AND userID = ?
      `, [...attemptedIds, userID]);

      // Get total flashcard count for the deck
      const totalResult = await db.getFirstAsync(`
        SELECT COUNT(*) as total
        FROM ${tableName}
        WHERE deckID = ? AND userID = ?
      `, [deckId, userID]);

      const totalCount = (totalResult as any)?.total || 0;
      const attemptedCount = attemptedFlashcards?.length || 0;

      if (attemptedCount === 0) {
        setQuizStats({
          currentGrade: 0,
          difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
          averageTimeSeconds: 0,
          totalTimeSeconds: 0,
          attemptedCount: 0,
          totalCount
        });
        return;
      }

      // Calculate difficulty breakdown
      const breakdown = { Again: 0, Hard: 0, Good: 0, Easy: 0 };
      let totalTimeSeconds = 0;
      let validTimeCount = 0;

      attemptedFlashcards.forEach((flashcard: any) => {
        const difficulty = flashcard.difficultyRating;
        if (difficulty in breakdown) {
          breakdown[difficulty as keyof typeof breakdown]++;
        }

        if (flashcard.timeTaken) {
          totalTimeSeconds += flashcard.timeTaken;
          validTimeCount++;
        }
      });

      // Calculate current grade using weighted scoring
      const weights = {
        'Again': 0,     // 0% - needs to learn
        'Hard': 0.4,    // 40% - partially learned
        'Good': 0.8,    // 80% - well learned
        'Easy': 1.0     // 100% - mastered
      };

      let totalWeight = 0;
      let validFlashcardCount = 0;

      attemptedFlashcards.forEach((flashcard: any) => {
        const difficulty = flashcard.difficultyRating;
        const answerType = flashcard.answerType;
        const isMcqAnswerRight = flashcard.isMcqAnswerRight;

        let weight = 0;

        if (answerType === 'mcq') {
          // For MCQ flashcards, use isMcqAnswerRight: 0 if wrong, 1 if correct
          weight = isMcqAnswerRight === 1 ? 1.0 : 0.0;
        } else {
          // For non-MCQ flashcards, use difficulty-based weights
          weight = weights[difficulty as keyof typeof weights] || 0;
        }

        totalWeight += weight;
        validFlashcardCount++;
      });

      const currentGrade = Math.round((totalWeight / validFlashcardCount) * 100);

      // Calculate average time
      const averageTimeSeconds = validTimeCount > 0 ? Math.round(totalTimeSeconds / validTimeCount) : 0;

      setQuizStats({
        currentGrade,
        difficultyBreakdown: breakdown,
        averageTimeSeconds,
        totalTimeSeconds,
        attemptedCount,
        totalCount
      });

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