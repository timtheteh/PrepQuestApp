import { db } from '../index';
import { getCurrentUserID } from './users';

export async function checkFlashcardAttemptStatus(deckId: number, isAIDeck: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT 1 FROM attemptedFlashcards WHERE flashcardID IN (SELECT flashcardID FROM flashcards WHERE deckID = ? AND userID = ?) AND userID = ? LIMIT 1';
    const result = await db.getFirstAsync(query, [deckId, userID, userID]);
    return result !== null;
  } catch (error) {
    console.error('Error checking flashcard attempt status:', error);
    return false;
  }
}

export async function trackAttemptedFlashcard(flashcardId: number): Promise<void> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    // Check if already tracked
    const existingQuery = 'SELECT 1 FROM attemptedFlashcards WHERE flashcardID = ? AND userID = ?';
    const existing = await db.getFirstAsync(existingQuery, [flashcardId, userID]);
    
    if (!existing) {
      // Insert new attempt
      const insertQuery = 'INSERT INTO attemptedFlashcards (flashcardID, userID, attemptDate) VALUES (?, ?, ?)';
      await db.runAsync(insertQuery, [flashcardId, userID, currentDate]);
    }
  } catch (error) {
    console.error('Error tracking attempted flashcard:', error);
  }
}

export interface QuizStats {
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

// Load quiz statistics from database for viewQuizStats
export const loadQuizStatsForView = async (
  deckID: string,
  isAIDeck: string,
  attemptedFlashcardIds: string
): Promise<QuizStats> => {
  try {
    const userID = await getCurrentUserID();
    
    // Parse attempted flashcard IDs
    const attemptedIds = attemptedFlashcardIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (attemptedIds.length === 0) {
      return {
        currentGrade: 0,
        difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
        averageTimeSeconds: 0,
        totalTimeSeconds: 0,
        attemptedCount: 0,
        totalCount: 0
      };
    }
    
    let query: string;
    if (isAIDeck === 'true') {
      query = `
        SELECT 
          difficultyRating,
          timeTaken,
          isMcqAnswerRight
        FROM AIFlashcards 
        WHERE flashcardID IN (${attemptedIds.map(() => '?').join(',')}) AND userID = ?
      `;
    } else {
      query = `
        SELECT 
          difficultyRating,
          timeTaken,
          isMcqAnswerRight
        FROM flashcards 
        WHERE flashcardID IN (${attemptedIds.map(() => '?').join(',')}) AND userID = ?
      `;
    }
    
    const attemptedFlashcards = await db.getAllAsync(query, [...attemptedIds, userID]) as Array<{
      difficultyRating: string;
      timeTaken: number | null;
      isMcqAnswerRight: number | null;
    }>;
    
    // Calculate statistics
    const totalCount = attemptedFlashcards.length;
    const attemptedCount = attemptedFlashcards.filter(f => f.timeTaken !== null).length;
    
    // Calculate difficulty breakdown
    const difficultyBreakdown = { Again: 0, Hard: 0, Good: 0, Easy: 0 };
    attemptedFlashcards.forEach(flashcard => {
      if (flashcard.difficultyRating in difficultyBreakdown) {
        difficultyBreakdown[flashcard.difficultyRating as keyof typeof difficultyBreakdown]++;
      }
    });
    
    // Calculate time statistics
    const timeValues = attemptedFlashcards
      .map(f => f.timeTaken)
      .filter(time => time !== null) as number[];
    
    const totalTimeSeconds = timeValues.reduce((sum, time) => sum + time, 0);
    const averageTimeSeconds = timeValues.length > 0 ? totalTimeSeconds / timeValues.length : 0;
    
    // Calculate grade based on difficulty ratings
    const weights = { 'Again': 0, 'Hard': 0.3, 'Good': 0.7, 'Easy': 1.0 };
    let totalWeight = 0;
    
    attemptedFlashcards.forEach(flashcard => {
      const baseWeight = weights[flashcard.difficultyRating as keyof typeof weights] || 0;
      
      // For MCQ, factor in correctness
      if (flashcard.isMcqAnswerRight !== null) {
        const correctnessWeight = flashcard.isMcqAnswerRight === 1 ? 1 : 0;
        totalWeight += (baseWeight + correctnessWeight) / 2;
      } else {
        totalWeight += baseWeight;
      }
    });
    
    const currentGrade = totalCount > 0 ? Math.round((totalWeight / totalCount) * 100) : 0;
    
    return {
      currentGrade,
      difficultyBreakdown,
      averageTimeSeconds: Math.round(averageTimeSeconds),
      totalTimeSeconds,
      attemptedCount,
      totalCount
    };
  } catch (error) {
    console.error('Error loading quiz stats for view:', error);
    return {
      currentGrade: 0,
      difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
      averageTimeSeconds: 0,
      totalTimeSeconds: 0,
      attemptedCount: 0,
      totalCount: 0
    };
  }
};
