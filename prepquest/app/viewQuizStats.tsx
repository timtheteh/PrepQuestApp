import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { AverageGradeThermometer } from '@/components/statsComponents/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/statsComponents/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/statsComponents/AverageSpeedTotal';
import DoubleChevron from '@/assets/icons/DoubleChevron.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';
import { useLanguage } from '@/contexts/LanguageContext';


// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    // console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

const ConfettiIcon = require('@/assets/icons/ConfettiIcon.png');
const FlagIcon = require('@/assets/icons/FlagIcon.png');

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

  // Load quiz statistics from database
  const loadQuizStats = async () => {
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
  };

  // Load stats when component mounts
  useEffect(() => {
    loadQuizStats();
  }, [deckID, isAIDeck, attemptedFlashcardIds]);

  // Format time from seconds to "Xmin Ys" format, localized
  const formatTime = (seconds: number): string => {
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
  };

  return (
    <View style={styles.container}>
      {/* Close button absolutely positioned at top right */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <AntDesign name="close" size={28} color="#222" />
      </TouchableOpacity>
      <ScrollView
        style={[styles.scrollContainer, { marginBottom: isHalfwayCheckpoint ? 120 : 0 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row with confetti */}
        <View style={styles.titleRow}>
          {isHalfwayCheckpoint ? (
            <Image source={FlagIcon} style={[styles.confettiIcon, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
          ) : (
            <Image source={ConfettiIcon} style={[styles.confettiIcon, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
          )}
          {isHalfwayCheckpoint ? (
            <Text style={styles.wellDoneTitle}>{language === 'Chinese' ? '中途\n检查点' : 'Halfway\nCheckpoint'}</Text>
          ) : (
            <Text style={styles.wellDoneTitle}>{language === 'Chinese' ? '干得漂亮!' : 'Well Done!'}</Text>
          )}
          {isHalfwayCheckpoint ? (
            <Image source={FlagIcon} style={styles.confettiIcon} resizeMode="contain" />
          ) : (
            <Image source={ConfettiIcon} style={styles.confettiIcon} resizeMode="contain" />
          )}
        </View>
        
        {/* Progress indicator for halfway checkpoint */}
        {isHalfwayCheckpoint && (
          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>
              {language === 'Chinese'
                ? `${quizStats.attemptedCount} / ${quizStats.totalCount} 张卡片已完成`
                : `${quizStats.attemptedCount} of ${quizStats.totalCount} flashcards completed`}
            </Text>
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
          <Text style={styles.totalTimeLabel}>{language === 'Chinese' ? '总用时:' : 'Total time spent:'}</Text>
          <Text style={styles.totalTimeValue}>{formatTime(quizStats.totalTimeSeconds)}</Text>
        </View>
      </ScrollView>
      
      {/* Halfway checkpoint button fixed at bottom */}
      {isHalfwayCheckpoint && (
        <View style={styles.fixedBottomButtonWrap} pointerEvents="box-none">
          <TouchableOpacity style={styles.fixedBottomButton} activeOpacity={0.85} onPress={() => router.back()}>
            <View style={styles.buttonContentRow}>
              <Text style={styles.buttonText}>{language === 'Chinese' ? '继续测验' : 'Continue with quiz'}</Text>
              <DoubleChevron width={36} height={36} />
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#fff',
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
    fontFamily: 'Neuton-Regular',
    fontSize: 44,
    color: '#222',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 32,
    color: '#111',
    textAlign: 'center',
    marginTop: 0,
  },
  totalTimeValue: {
    fontFamily: 'Satoshi-Variable',
    fontSize: 40,
    color: '#111',
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
    backgroundColor: '#4F41D8',
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
    color: '#fff',
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    letterSpacing: 0.2,
  },
  progressIndicator: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  progressText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 18,
    color: '#111',
  },
}); 