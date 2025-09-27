import { db } from '../index';
import { getCurrentUserID } from './users';

export interface AIDeck {
  deckID: number;
  deckName: string;
  dateAdded: string;
  lastModifiedDate: string;
  isFavorited: number;
  deckType: 'study' | 'interview';
  creationMethod: string;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
  cardDesignIndex: number;
  isAIDeck: number;
  folderIDs: string | null;
  studyEducationLevel: string | null;
  studySubjects: string | null;
  studyTopicsSubtopics: string | null;
  studyExamQuiz: string | null;
  interviewJobRole: string | null;
  interviewType: string | null;
  interviewCompany: string | null;
  interviewExperienceLevel: string | null;
  interviewTopics: string | null;
  interviewCompanyIcon: string | null;
  flashcardCount?: number;
}

export async function getAIDecks(): Promise<AIDeck[]> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        d.deckID,
        d.deckName,
        d.dateAdded,
        d.lastModifiedDate,
        d.isFavorited,
        d.deckType,
        d.creationMethod,
        d.lastStudiedDate,
        d.lastQuizzedDate,
        d.cardDesignIndex,
        d.isAIDeck,
        d.folderIDs,
        d.studyEducationLevel,
        d.studySubjects,
        d.studyTopicsSubtopics,
        d.studyExamQuiz,
        d.interviewJobRole,
        d.interviewType,
        d.interviewCompany,
        d.interviewExperienceLevel,
        d.interviewTopics,
        d.interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM AIDecks d
      LEFT JOIN AIFlashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID]);
    return result as AIDeck[];
  } catch (error) {
    console.error('Error fetching AI decks:', error);
    return [];
  }
}

export async function saveAIDeck(aiDeckId: number): Promise<{ success: boolean; newDeckId?: number }> {
  try {
    const userID = await getCurrentUserID();
    
    // Get AI deck data
    const aiDeckQuery = 'SELECT * FROM AIDecks WHERE deckID = ? AND userID = ?';
    const aiDeck = await db.getFirstAsync(aiDeckQuery, [aiDeckId, userID]) as AIDeck | null;
    
    if (!aiDeck) {
      return { success: false };
    }
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Insert into regular decks table
      const insertDeckQuery = `
        INSERT INTO decks (
          deckName, dateAdded, lastModifiedDate, isFavorited, deckType, 
          creationMethod, lastStudiedDate, lastQuizzedDate, cardDesignIndex, 
          isAIDeck, folderIDs, studyEducationLevel, studySubjects, 
          studyTopicsSubtopics, studyExamQuiz, interviewJobRole, 
          interviewType, interviewCompany, interviewExperienceLevel, 
          interviewTopics, interviewCompanyIcon, userID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const deckResult = await db.runAsync(insertDeckQuery, [
        aiDeck.deckName,
        aiDeck.dateAdded,
        aiDeck.lastModifiedDate,
        aiDeck.isFavorited,
        aiDeck.deckType,
        aiDeck.creationMethod,
        aiDeck.lastStudiedDate,
        aiDeck.lastQuizzedDate,
        aiDeck.cardDesignIndex,
        1, // isAIDeck = 1 for saved AI decks
        aiDeck.folderIDs,
        aiDeck.studyEducationLevel,
        aiDeck.studySubjects,
        aiDeck.studyTopicsSubtopics,
        aiDeck.studyExamQuiz,
        aiDeck.interviewJobRole,
        aiDeck.interviewType,
        aiDeck.interviewCompany,
        aiDeck.interviewExperienceLevel,
        aiDeck.interviewTopics,
        aiDeck.interviewCompanyIcon,
        userID
      ]);
      
      const newDeckId = deckResult.lastInsertRowId;
      
      if (!newDeckId) {
        throw new Error('Failed to insert deck');
      }
      
      // Get AI flashcards and insert into regular flashcards table
      const aiFlashcardsQuery = 'SELECT * FROM AIFlashcards WHERE deckID = ? AND userID = ?';
      const aiFlashcards = await db.getAllAsync(aiFlashcardsQuery, [aiDeckId, userID]) as any[];
      
      for (const flashcard of aiFlashcards) {
        const insertFlashcardQuery = `
          INSERT INTO flashcards (
            deckID, difficultyRating, cognitiveQnType, isFavorited, 
            questionType, questionText, questionBlob, answerType, 
            answerText, answerMCQ, answerBlob, timeTaken, 
            isMcqAnswerRight, lastStudiedDate, lastQuizzedDate, userID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.runAsync(insertFlashcardQuery, [
          newDeckId,
          flashcard.difficultyRating,
          flashcard.cognitiveQnType,
          flashcard.isFavorited,
          flashcard.questionType,
          flashcard.questionText,
          flashcard.questionBlob,
          flashcard.answerType,
          flashcard.answerText,
          flashcard.answerMCQ,
          flashcard.answerBlob,
          flashcard.timeTaken,
          flashcard.isMcqAnswerRight,
          flashcard.lastStudiedDate,
          flashcard.lastQuizzedDate,
          userID
        ]);
      }
      
      // Delete AI flashcards
      await db.runAsync('DELETE FROM AIFlashcards WHERE deckID = ? AND userID = ?', [aiDeckId, userID]);
      
      // Delete AI deck
      await db.runAsync('DELETE FROM AIDecks WHERE deckID = ? AND userID = ?', [aiDeckId, userID]);
      
      await db.execAsync('COMMIT');
      
      return { success: true, newDeckId };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving AI deck:', error);
    return { success: false };
  }
}

export async function getAIDeckInfo(deckId: number): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        d.*,
        COUNT(f.flashcardID) as flashcardCount
      FROM AIDecks d
      LEFT JOIN AIFlashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.deckID = ? AND d.userID = ?
      GROUP BY d.deckID
    `;
    
    const result = await db.getFirstAsync(query, [deckId, userID]);
    return result;
  } catch (error) {
    console.error('Error getting AI deck info:', error);
    return null;
  }
}

export async function getAIDeckProgress(deckId: number): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        d.lastStudiedDate, 
        d.lastQuizzedDate,
        COUNT(f.flashcardID) as totalFlashcards,
        COUNT(CASE WHEN f.lastStudiedDate IS NOT NULL THEN 1 END) as studiedFlashcards,
        COUNT(CASE WHEN f.lastQuizzedDate IS NOT NULL THEN 1 END) as quizzedFlashcards
      FROM AIDecks d
      LEFT JOIN AIFlashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.deckID = ? AND d.userID = ?
      GROUP BY d.deckID
    `;
    
    const result = await db.getFirstAsync(query, [deckId, userID]) as {
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      totalFlashcards: number;
      studiedFlashcards: number;
      quizzedFlashcards: number;
    } | null;
    
    if (!result) return 0;
    
    // If both deck dates exist, return 100 (completed)
    if (result.lastStudiedDate && result.lastQuizzedDate) {
      return 100;
    }
    
    // If only studied, return 50 (half completed)
    if (result.lastStudiedDate) {
      return 50;
    }
    
    // If neither, return 0 (not started)
    return 0;
  } catch (error) {
    console.error('Error getting AI deck progress:', error);
    return 0;
  }
}

export async function getAIDeckGrade(deckId: number): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        difficultyRating, 
        lastStudiedDate, 
        lastQuizzedDate, 
        answerType, 
        isMcqAnswerRight
      FROM AIFlashcards 
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
    
    // Calculate weighted score
    const calculateWeightedScoreWithMCQ = (flashcards: Array<{
      difficultyRating: string;
      answerType: string;
      isMcqAnswerRight: number | null;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>) => {
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
    
    return calculateWeightedScoreWithMCQ(flashcards);
  } catch (error) {
    console.error('Error getting AI deck grade:', error);
    return null;
  }
}

export async function getAIDeckAverageTime(deckId: number): Promise<number | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT AVG(timeTaken) as averageTime
      FROM AIFlashcards 
      WHERE deckID = ? AND userID = ? AND timeTaken IS NOT NULL
    `;
    
    const result = await db.getFirstAsync(query, [deckId, userID]) as { averageTime: number | null } | null;
    return result?.averageTime || null;
  } catch (error) {
    console.error('Error getting AI deck average time:', error);
    return null;
  }
}

export async function checkAIDeckSavedStatus(deckId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT 1 FROM AIDecks WHERE deckID = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [deckId, userID]);
    return result !== null;
  } catch (error) {
    console.error('Error checking AI deck saved status:', error);
    return false;
  }
}
