import { db } from '../index';
import { getCurrentUserID } from './users';

export interface DeckGrade {
  score: number;
  masteryLevel: string;
  breakdown: {
    Again: number;
    Hard: number;
    Good: number;
    Easy: number;
  };
  totalAttempted: number;
  totalFlashcards: number;
}

const calculateWeightedScore = (ratings: string[]): DeckGrade => {
  const weights = { 'Again': 0, 'Hard': 0.3, 'Good': 0.7, 'Easy': 1.0 };
  let totalWeight = 0;
  let totalAttempts = 0;
  
  ratings.forEach(rating => {
    totalAttempts++;
    totalWeight += weights[rating as keyof typeof weights] || 0;
  });
  
  const score = totalAttempts > 0 ? (totalWeight / totalAttempts) * 100 : 0;
  
  const getMasteryLevel = (score: number): string => {
    if (score >= 90) return 'Expert';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Beginner';
    return 'Novice';
  };
  
  const getBreakdown = (ratings: string[]) => {
    const breakdown = { Again: 0, Hard: 0, Good: 0, Easy: 0 };
    ratings.forEach(rating => {
      if (rating in breakdown) {
        breakdown[rating as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  };
  
  return {
    score: Math.round(score),
    masteryLevel: getMasteryLevel(score),
    breakdown: getBreakdown(ratings),
    totalAttempted: totalAttempts,
    totalFlashcards: ratings.length
  };
};

const calculateWeightedScoreWithMCQ = (flashcards: Array<{
  difficultyRating: string;
  answerType: string;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}>): DeckGrade => {
  const weights = { 'Again': 0, 'Hard': 0.3, 'Good': 0.7, 'Easy': 1.0 };
  let totalWeight = 0;
  let totalAttempts = 0;
  
  flashcards.forEach(flashcard => {
    if (flashcard.lastStudiedDate || flashcard.lastQuizzedDate) {
      totalAttempts++;
      const baseWeight = weights[flashcard.difficultyRating as keyof typeof weights] || 0;
      
      if (flashcard.answerType === 'mcq' && flashcard.isMcqAnswerRight !== null) {
        // For MCQ, factor in correctness
        const correctnessWeight = flashcard.isMcqAnswerRight === 1 ? 1 : 0;
        totalWeight += (baseWeight + correctnessWeight) / 2;
      } else {
        totalWeight += baseWeight;
      }
    }
  });
  
  const score = totalAttempts > 0 ? (totalWeight / totalAttempts) * 100 : 0;
  
  const getMasteryLevel = (score: number): string => {
    if (score >= 90) return 'Expert';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Beginner';
    return 'Novice';
  };
  
  const getBreakdown = (ratings: string[]) => {
    const breakdown = { Again: 0, Hard: 0, Good: 0, Easy: 0 };
    ratings.forEach(rating => {
      if (rating in breakdown) {
        breakdown[rating as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  };
  
  return {
    score: Math.round(score),
    masteryLevel: getMasteryLevel(score),
    breakdown: getBreakdown(flashcards.map(f => f.difficultyRating)),
    totalAttempted: totalAttempts,
    totalFlashcards: flashcards.length
  };
};

export async function getDeckGrade(deckId: number): Promise<DeckGrade | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        difficultyRating, 
        lastStudiedDate, 
        lastQuizzedDate, 
        answerType, 
        isMcqAnswerRight
      FROM flashcards 
      WHERE deckID = ? AND userID = ?
    `;
    
    const flashcards = await db.getAllAsync(query, [deckId, userID]) as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      answerType: string;
      isMcqAnswerRight: number | null;
    }>;
    
    if (flashcards.length === 0) return null;
    
    return calculateWeightedScoreWithMCQ(flashcards);
  } catch (error) {
    console.error('Error getting deck grade:', error);
    return null;
  }
}

export async function getDeckGrades(deckIds: number[]): Promise<Map<number, DeckGrade | null>> {
  const gradesMap = new Map<number, DeckGrade | null>();
  
  try {
    await Promise.all(
      deckIds.map(async (deckId) => {
        const grade = await getDeckGrade(deckId);
        gradesMap.set(deckId, grade);
      })
    );
  } catch (error) {
    console.error('Error getting deck grades:', error);
  }
  
  return gradesMap;
}

// Test function to verify grade calculation logic
export function testGradeCalculation() {
  const testRatings = ['Again', 'Hard', 'Good', 'Easy', 'Good', 'Easy'];
  const result = calculateWeightedScore(testRatings);
  console.log('Test grade calculation:', result);
  return result;
}

export async function getDeckAverageTime(deckId: number): Promise<number | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT AVG(timeTaken) as averageTime
      FROM flashcards 
      WHERE deckID = ? AND userID = ? AND timeTaken IS NOT NULL
    `;
    
    const result = await db.getFirstAsync(query, [deckId, userID]) as { averageTime: number | null } | null;
    return result?.averageTime || null;
  } catch (error) {
    console.error('Error getting deck average time:', error);
    return null;
  }
}
