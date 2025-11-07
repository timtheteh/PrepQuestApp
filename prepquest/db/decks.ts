import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { promptAndData } from '../constants/promptEngineering';

// Helper function to safely parse JSON
function safeParseJSON(val: any, fallback: any[] = []): any[] {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

export interface Deck {
  deckID: number;
  deckName: string;
  dateAdded: string;
  lastModifiedDate: string | null;
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
  AICardDesignIndex: number | null;
  flashcardCount: number;
}

export interface Flashcard {
  flashcardID: number;
  deckID: number;
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText: string | null;
  questionBlob: Uint8Array | null;
  answerType: string;
  answerText: string | null;
  answerMCQ: string | null;
  answerBlob: Uint8Array | null;
  timeTaken: number | null;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}

// Helper function to get current userID from AsyncStorage
export async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

export async function getStudyDecks(): Promise<Deck[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckType = 'study' AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC
    `, [userID]);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching study decks:', error);
    return [];
  }
}

export async function getInterviewDecks(): Promise<Deck[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
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
        d.AICardDesignIndex,
        d.interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckType = 'interview' AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC
    `, [userID]);
        
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching interview decks:', error);
    return [];
  }
}

export async function getDeckProgress(deckId: number): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    // First, check if the deck itself has lastStudiedDate or lastQuizzedDate
    const deckResult = await db.getFirstAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM decks
      WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!deckResult) {
      return 0;
    }

    const deck = deckResult as { lastStudiedDate: string | null; lastQuizzedDate: string | null };
    
    // If either lastStudiedDate or lastQuizzedDate is not null, return 100%
    if (deck.lastStudiedDate !== null || deck.lastQuizzedDate !== null) {
      return 100;
    }

    // If both are null, calculate percentage based on flashcards
    const progressResult = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as totalFlashcards,
        COUNT(CASE WHEN lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL THEN 1 END) as completedFlashcards
      FROM flashcards
      WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!progressResult) {
      return 0;
    }

    const progress = progressResult as { totalFlashcards: number; completedFlashcards: number };
    
    if (progress.totalFlashcards === 0) {
      return 0;
    }

    return Math.round((progress.completedFlashcards / progress.totalFlashcards) * 100);
  } catch (error) {
    console.error('Error calculating deck progress:', error);
    return 0;
  }
}

export async function getStudyDecksWithProgress(): Promise<(Deck & { progress: number })[]> {
  try {
    const decks = await getStudyDecks();
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        const progress = await getDeckProgress(deck.deckID);
        return { ...deck, progress };
      })
    );
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching study decks with progress:', error);
    return [];
  }
}

export async function getInterviewDecksWithProgress(): Promise<(Deck & { progress: number })[]> {
  try {
    const decks = await getInterviewDecks();
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        const progress = await getDeckProgress(deck.deckID);
        return { ...deck, progress };
      })
    );
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching interview decks with progress:', error);
    return [];
  }
}

export async function deleteDeck(deckId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // First, delete all flashcards associated with this deck
    await db.execAsync(`
      DELETE FROM flashcards 
      WHERE deckID = ${deckId} AND userID = '${userID}'
    `);
    
    // Then delete the deck itself
    const result = await db.execAsync(`
      DELETE FROM decks 
      WHERE deckID = ${deckId} AND userID = '${userID}'
    `);
    
    // Commit the transaction
    await db.execAsync('COMMIT');
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await db.execAsync('ROLLBACK');
    console.error('Error deleting deck:', error);
    return false;
  }
}

export async function deleteMultipleDecks(deckIds: number[]): Promise<boolean> {
  try {
    if (deckIds.length === 0) {
      return true;
    }
    
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // Create comma-separated list of deck IDs
    const deckIdsString = deckIds.join(',');
    
    // First, delete all flashcards associated with these decks
    await db.execAsync(`
      DELETE FROM flashcards 
      WHERE deckID IN (${deckIdsString}) AND userID = '${userID}'
    `);
    
    // Then delete the decks themselves
    await db.execAsync(`
      DELETE FROM decks 
      WHERE deckID IN (${deckIdsString}) AND userID = '${userID}'
    `);
    
    // Commit the transaction
    await db.execAsync('COMMIT');
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await db.execAsync('ROLLBACK');
    console.error('Error deleting multiple decks:', error);
    return false;
  }
}

export async function getFavoritedDecks(): Promise<(Deck & { progress: number })[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
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
        d.AICardDesignIndex,
        d.interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.isFavorited = 1 AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC
    `, [userID]);
    
    const decks = result as Deck[];
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        const progress = await getDeckProgress(deck.deckID);
        return { ...deck, progress };
      })
    );
    
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching favorited decks:', error);
    return [];
  }
}

export interface Folder {
  folderID: number;
  folderName: string;
  dateAdded: string;
  lastModifiedDate: string | null;
  isFavorited: number;
  deckCount: number;
}

export async function getFavoritedFolders(): Promise<Folder[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT 
        f.*,
        COUNT(d.deckID) as deckCount
      FROM folders f
      LEFT JOIN decks d ON d.folderIDs IS NOT NULL 
        AND d.folderIDs != '' 
        AND f.folderID IN (
          SELECT CAST(json_extract(value, '$') AS INTEGER)
          FROM json_each(d.folderIDs)
        )
        AND d.userID = ?
      WHERE f.isFavorited = 1 AND f.userID = ?
      GROUP BY f.folderID
      ORDER BY f.lastModifiedDate DESC, f.dateAdded DESC
    `, [userID, userID]);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching favorited folders:', error);
    return [];
  }
}

export async function getAllFolders(): Promise<Folder[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT 
        f.*,
        COUNT(d.deckID) as deckCount
      FROM folders f
      LEFT JOIN decks d ON d.folderIDs IS NOT NULL 
        AND d.folderIDs != '' 
        AND f.folderID IN (
          SELECT CAST(json_extract(value, '$') AS INTEGER)
          FROM json_each(d.folderIDs)
        )
        AND d.userID = ?
      WHERE f.userID = ?
      GROUP BY f.folderID
      ORDER BY f.lastModifiedDate DESC, f.dateAdded DESC
    `, [userID, userID]);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching all folders:', error);
    return [];
  }
}

export async function deleteFolder(folderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // First, update all decks that reference this folder to remove it from their folderIDs
    // Get all decks that have this folder in their folderIDs
    const decksWithFolder = await db.getAllAsync(`
      SELECT deckID, folderIDs 
      FROM decks 
      WHERE folderIDs IS NOT NULL AND folderIDs LIKE '%${folderId}%' AND userID = ?
    `, [userID]);
    
    // Update each deck to remove this folder from their folderIDs
    for (const deck of decksWithFolder) {
      const deckData = deck as { deckID: number; folderIDs: string };
      let folderIdsArray: number[];
      
      try {
        folderIdsArray = JSON.parse(deckData.folderIDs);
      } catch (error) {
        console.error('Error parsing folderIDs for deck:', deckData.deckID, error);
        continue;
      }
      
      // Remove the folder ID from the array
      const updatedFolderIds = folderIdsArray.filter(id => id !== folderId);
      
      // Update the deck with the new folderIDs
      if (updatedFolderIds.length === 0) {
        // If no folders left, set to NULL
        await db.execAsync(`
          UPDATE decks 
          SET folderIDs = NULL 
          WHERE deckID = ${deckData.deckID} AND userID = '${userID}'
        `);
      } else {
        // Update with the remaining folder IDs
        const newFolderIdsString = JSON.stringify(updatedFolderIds);
        await db.execAsync(`
          UPDATE decks 
          SET folderIDs = '${newFolderIdsString}'
          WHERE deckID = ${deckData.deckID} AND userID = '${userID}'
        `);
      }
    }
    
    // Then delete the folder itself
    const result = await db.execAsync(`
      DELETE FROM folders 
      WHERE folderID = ${folderId} AND userID = '${userID}'
    `);
    
    // Commit the transaction
    await db.execAsync('COMMIT');
    
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await db.execAsync('ROLLBACK');
    console.error('Error deleting folder:', error);
    return false;
  }
}

export async function deleteMultipleFolders(folderIds: number[]): Promise<boolean> {
  try {
    if (folderIds.length === 0) {
      return true;
    }
    
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // Process each folder
    for (const folderId of folderIds) {
      // Get all decks that have this folder in their folderIDs
      const decksWithFolder = await db.getAllAsync(`
        SELECT deckID, folderIDs 
        FROM decks 
        WHERE folderIDs IS NOT NULL AND folderIDs LIKE '%${folderId}%' AND userID = ?
      `, [userID]);
      
      // Update each deck to remove this folder from their folderIDs
      for (const deck of decksWithFolder) {
        const deckData = deck as { deckID: number; folderIDs: string };
        let folderIdsArray: number[];
        
        try {
          folderIdsArray = JSON.parse(deckData.folderIDs);
        } catch (error) {
          console.error('Error parsing folderIDs for deck:', deckData.deckID, error);
          continue;
        }
        
        // Remove the folder ID from the array
        const updatedFolderIds = folderIdsArray.filter(id => id !== folderId);
        
        // Update the deck with the new folderIDs
        if (updatedFolderIds.length === 0) {
          // If no folders left, set to NULL
          await db.execAsync(`
            UPDATE decks 
            SET folderIDs = NULL 
            WHERE deckID = ${deckData.deckID} AND userID = '${userID}'
          `);
        } else {
          // Update with the remaining folder IDs
          const newFolderIdsString = JSON.stringify(updatedFolderIds);
          await db.execAsync(`
            UPDATE decks 
            SET folderIDs = '${newFolderIdsString}'
            WHERE deckID = ${deckData.deckID} AND userID = '${userID}'
          `);
        }
      }
    }
    
    // Create comma-separated list of folder IDs
    const folderIdsString = folderIds.join(',');
    
    // Delete the folders themselves
    await db.execAsync(`
      DELETE FROM folders 
      WHERE folderID IN (${folderIdsString}) AND userID = '${userID}'
    `);
    
    // Commit the transaction
    await db.execAsync('COMMIT');
    
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await db.execAsync('ROLLBACK');
    console.error('Error deleting multiple folders:', error);
    return false;
  }
}

export async function checkFolderNameExists(folderName: string, excludeFolderId?: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    let params: any[];
    
    if (excludeFolderId) {
      // Check if folder name exists, excluding the current folder being edited
      query = `
        SELECT COUNT(*) as count 
        FROM folders 
        WHERE folderName = ? AND folderID != ? AND userID = ?
      `;
      params = [folderName, excludeFolderId, userID];
    } else {
      // Check if folder name exists (for new folders)
      query = `
        SELECT COUNT(*) as count 
        FROM folders 
        WHERE folderName = ? AND userID = ?
      `;
      params = [folderName, userID];
    }
    
    const result = await db.getFirstAsync(query, params);
    const count = (result as { count: number }).count;
    
    return count > 0;
  } catch (error) {
    console.error('Error checking if folder name exists:', error);
    return false;
  }
}

export async function checkDeckNameExists(deckName: string, excludeDeckId?: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    let params: any[];
    
    if (excludeDeckId) {
      // Check if deck name exists, excluding the current deck being edited
      query = `
        SELECT COUNT(*) as count 
        FROM decks 
        WHERE LOWER(deckName) = LOWER(?) AND deckID != ? AND userID = ?
      `;
      params = [deckName, excludeDeckId, userID];
    } else {
      // Check if deck name exists (for new decks)
      query = `
        SELECT COUNT(*) as count 
        FROM decks 
        WHERE LOWER(deckName) = LOWER(?) AND userID = ?
      `;
      params = [deckName, userID];
    }
    
    const result = await db.getFirstAsync(query, params);
    const count = (result as { count: number }).count;
    
    return count > 0;
  } catch (error) {
    console.error('Error checking if deck name exists:', error);
    return false;
  }
}

export async function getDecksInFolder(folderId: number): Promise<(Deck & { progress: number })[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
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
        d.AICardDesignIndex,
        d.interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.folderIDs IS NOT NULL 
        AND d.folderIDs != '' 
        AND ${folderId} IN (
          SELECT CAST(json_extract(value, '$') AS INTEGER)
          FROM json_each(d.folderIDs)
        )
        AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC, d.dateAdded DESC
    `, [userID]);
    
    const decks = result as Deck[];
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        const progress = await getDeckProgress(deck.deckID);
        return { ...deck, progress };
      })
    );
    
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching decks in folder:', error);
    return [];
  }
}

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
  const weights = {
    'Again': 0,     // 0% - needs to learn
    'Hard': 0.4,    // 40% - partially learned
    'Good': 0.8,    // 80% - well learned
    'Easy': 1.0     // 100% - mastered
  };
  
  const totalWeight = ratings.reduce((sum, rating) => {
    return sum + (weights[rating as keyof typeof weights] || 0);
  }, 0);
  
  const score = (totalWeight / ratings.length) * 100;
  
  return {
    score: Math.round(score),
    masteryLevel: getMasteryLevel(score),
    breakdown: getBreakdown(ratings),
    totalAttempted: ratings.length,
    totalFlashcards: ratings.length
  };
};

const calculateWeightedScoreWithMCQ = (flashcards: Array<{
  difficultyRating: string;
  answerType: string;
  isMcqAnswerRight: number | null;
}>): DeckGrade => {
  const weights = {
    'Again': 0,     // 0% - needs to learn
    'Hard': 0.4,    // 40% - partially learned
    'Good': 0.8,    // 80% - well learned
    'Easy': 1.0     // 100% - mastered
  };

  let totalWeight = 0;
  const ratings: string[] = [];

  flashcards.forEach((flashcard) => {
    const difficulty = flashcard.difficultyRating;
    const answerType = flashcard.answerType;
    const isMcqAnswerRight = flashcard.isMcqAnswerRight;

    let weight = 0;

    if (answerType === 'mcq') {
      // For MCQ flashcards, prioritize isMcqAnswerRight if available
      // If isMcqAnswerRight is null (e.g., studied but not quizzed), fall back to difficulty rating
      if (isMcqAnswerRight !== null) {
        // Use isMcqAnswerRight: 0 if wrong, 1 if correct
        weight = isMcqAnswerRight === 1 ? 1.0 : 0.0;
        // For breakdown, treat correct MCQs as 'Easy' and incorrect as 'Again'
        ratings.push(isMcqAnswerRight === 1 ? 'Easy' : 'Again');
      } else {
        // Fall back to difficulty rating if isMcqAnswerRight is null
        // This handles cases where MCQ was studied but not quizzed, or difficulty was manually set
        weight = weights[difficulty as keyof typeof weights] || 0;
        ratings.push(difficulty);
      }
    } else {
      // For non-MCQ flashcards, use difficulty-based weights
      weight = weights[difficulty as keyof typeof weights] || 0;
      ratings.push(difficulty);
    }

    totalWeight += weight;
  });

  const score = (totalWeight / flashcards.length) * 100;

  return {
    score: Math.round(score),
    masteryLevel: getMasteryLevel(score),
    breakdown: getBreakdown(ratings),
    totalAttempted: flashcards.length,
    totalFlashcards: flashcards.length
  };
};

const getMasteryLevel = (score: number): string => {
  if (score >= 90) return 'Expert';
  if (score >= 75) return 'Proficient';
  if (score >= 60) return 'Developing';
  if (score >= 40) return 'Beginner';
  return 'Needs Practice';
};

const getBreakdown = (ratings: string[]) => {
  const counts = {
    'Again': 0, 'Hard': 0, 'Good': 0, 'Easy': 0
  };
  
  ratings.forEach(rating => {
    if (rating in counts) {
      counts[rating as keyof typeof counts]++;
    }
  });
  
  return counts;
};

export async function getDeckGrade(deckId: number): Promise<DeckGrade | null> {
  try {
    const userID = await getCurrentUserID();
    // Get all attempted flashcards from both regular and AI flashcards tables
    // Includes all flashcards that have been studied OR quizzed at least once (based on latest attempt date)
    // Uses each flashcard's current difficultyRating which reflects the latest attempt's difficulty
    const result = await db.getAllAsync(`
      SELECT 
        difficultyRating,
        lastStudiedDate,
        lastQuizzedDate,
        answerType,
        isMcqAnswerRight,
        CASE 
          WHEN lastStudiedDate IS NULL THEN lastQuizzedDate
          WHEN lastQuizzedDate IS NULL THEN lastStudiedDate
          WHEN lastStudiedDate > lastQuizzedDate THEN lastStudiedDate
          ELSE lastQuizzedDate
        END as latestAttemptDate
      FROM (
        SELECT difficultyRating, lastStudiedDate, lastQuizzedDate, answerType, isMcqAnswerRight
        FROM flashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND difficultyRating != 'None'
          AND userID = ?
        UNION ALL
        SELECT difficultyRating, lastStudiedDate, lastQuizzedDate, answerType, isMcqAnswerRight
        FROM AIFlashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND difficultyRating != 'None'
          AND userID = ?
      )
    `, [deckId, userID, deckId, userID]);

    if (!result || result.length === 0) {
      // No attempted flashcards, return null
      return null;
    }

    const flashcards = result as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      answerType: string;
      isMcqAnswerRight: number | null;
      latestAttemptDate: string | null;
    }>;

    // Calculate weighted score with MCQ handling
    // Each flashcard's current difficultyRating is used, which reflects the state after the most recent attempt
    // (whether that was a study or quiz session, whichever date is more recent)
    const grade = calculateWeightedScoreWithMCQ(flashcards);

    // Get total number of flashcards for this deck from both tables
    const totalResult = await db.getFirstAsync(`
      SELECT 
        (SELECT COUNT(*) FROM flashcards WHERE deckID = ? AND userID = ?) +
        (SELECT COUNT(*) FROM AIFlashcards WHERE deckID = ? AND userID = ?) as total
    `, [deckId, userID, deckId, userID]);

    const totalFlashcards = (totalResult as { total: number }).total;
    
    // Update totalFlashcards in the result
    grade.totalFlashcards = totalFlashcards;

    return grade;
  } catch (error) {
    console.error('Error calculating deck grade:', error);
    return null;
  }
}

export async function getDeckGrades(deckIds: number[]): Promise<Map<number, DeckGrade | null>> {
  try {
    if (deckIds.length === 0) {
      return new Map();
    }

    const grades = new Map<number, DeckGrade | null>();

    // Get grades for each deck
    await Promise.all(
      deckIds.map(async (deckId) => {
        const grade = await getDeckGrade(deckId);
        grades.set(deckId, grade);
      })
    );

    return grades;
  } catch (error) {
    console.error('Error calculating deck grades:', error);
    return new Map();
  }
}

// Test function to verify grade calculation logic
export function testGradeCalculation() {
  
  // Test case 1: All Easy cards
  const allEasy = ['Easy', 'Easy', 'Easy', 'Easy', 'Easy'];
  const grade1 = calculateWeightedScore(allEasy);
  // Expected: score: 100, masteryLevel: 'Expert'
  
  // Test case 2: Mixed ratings
  const mixed = ['Easy', 'Good', 'Hard', 'Again', 'Easy'];
  const grade2 = calculateWeightedScore(mixed);
  // Expected: (1.0 + 0.8 + 0.4 + 0.0 + 1.0) / 5 * 100 = 64, masteryLevel: 'Developing'
  
  // Test case 3: All Again cards
  const allAgain = ['Again', 'Again', 'Again'];
  const grade3 = calculateWeightedScore(allAgain);
  // Expected: score: 0, masteryLevel: 'Needs Practice'
  
  // Test case 4: Good and Easy mix
  const goodEasy = ['Good', 'Easy', 'Good', 'Easy'];
  const grade4 = calculateWeightedScore(goodEasy);
  // Expected: (0.8 + 1.0 + 0.8 + 1.0) / 4 * 100 = 90, masteryLevel: 'Expert'
}

export async function getDeckAverageTime(deckId: number): Promise<number | null> {
  try {
    const userID = await getCurrentUserID();
    // Get all attempted flashcards from both regular and AI flashcards tables
    // Includes all flashcards that have been studied OR quizzed at least once (based on latest attempt date)
    // Uses each flashcard's current timeTaken which reflects the time from the most recent attempt
    // (whether that was a study or quiz session, whichever date is more recent)
    const result = await db.getFirstAsync(`
      SELECT 
        AVG(timeTaken) as averageTime,
        COUNT(*) as attemptedCount
      FROM (
        SELECT 
          timeTaken,
          CASE 
            WHEN lastStudiedDate IS NULL THEN lastQuizzedDate
            WHEN lastQuizzedDate IS NULL THEN lastStudiedDate
            WHEN lastStudiedDate > lastQuizzedDate THEN lastStudiedDate
            ELSE lastQuizzedDate
          END as latestAttemptDate
        FROM flashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND timeTaken IS NOT NULL
          AND userID = ?
        UNION ALL
        SELECT 
          timeTaken,
          CASE 
            WHEN lastStudiedDate IS NULL THEN lastQuizzedDate
            WHEN lastQuizzedDate IS NULL THEN lastStudiedDate
            WHEN lastStudiedDate > lastQuizzedDate THEN lastStudiedDate
            ELSE lastQuizzedDate
          END as latestAttemptDate
        FROM AIFlashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND timeTaken IS NOT NULL
          AND userID = ?
      )
    `, [deckId, userID, deckId, userID]);

    if (!result) {
      return null;
    }

    const data = result as { averageTime: number | null; attemptedCount: number };
    
    // Return null if no attempted flashcards or no time data
    if (data.attemptedCount === 0 || data.averageTime === null) {
      return null;
    }

    // Return the average time rounded to the nearest integer
    return Math.round(data.averageTime);
  } catch (error) {
    console.error('Error calculating deck average time:', error);
    return null;
  }
}

export async function getDeckInfo(deckId: number): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    // Get deck information
    const deckResult = await db.getFirstAsync(`
      SELECT * FROM decks WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!deckResult) {
      return null;
    }

    return deckResult;
  } catch (error) {
    console.error('Error getting deck info:', error);
    return null;
  }
}

export async function getDeckInfoWithProgress(deckId: number): Promise<(any & { progress: number; flashcardCount: number }) | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
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
        d.AICardDesignIndex,
        d.interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckID = ? AND d.userID = ?
      GROUP BY d.deckID
    `, [deckId, userID]);

    if (!result) {
      return null;
    }

    const progress = await getDeckProgress(deckId);
    return { ...result, progress, flashcardCount: (result as any).flashcardCount };
  } catch (error) {
    console.error('Error fetching deck info with progress:', error);
    return null;
  }
}

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
    console.log('🔍 Fetching AI decks for userID:', userID);
    
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        d.interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM AIDecks d
      LEFT JOIN AIFlashcards f ON d.deckID = f.deckID
      WHERE d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
      LIMIT 3
    `, [userID]);
    
    console.log('📊 AI decks query result:', result);
    console.log('📊 Number of AI decks found:', result?.length || 0);
    
    // Debug each deck's interviewType
    if (result && result.length > 0) {
      result.forEach((deck: any, index: number) => {
        console.log(`🎯 AI Deck ${index + 1} (ID: ${deck.deckID}): interviewType = "${deck.interviewType}"`);
      });
    }
    
    return result as AIDeck[];
  } catch (error) {
    console.error('Error fetching AI decks:', error);
    return [];
  }
}


export async function saveAIDeck(aiDeckId: number): Promise<{ success: boolean; newDeckId?: number }> {
  try {
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // 1. Get the AI deck data
      const aiDeckResult = await db.getFirstAsync(`
        SELECT *
        FROM AIDecks
        WHERE deckID = ${aiDeckId} AND userID = '${userID}'
      `);
      
      if (!aiDeckResult) {
        throw new Error('AI deck not found');
      }
      
      const aiDeck = aiDeckResult as any;
      
      // 2. Insert the AI deck into the regular decks table
      // Convert the cardDesignIndex to AICardDesignIndex and set cardDesignIndex to 0
      // Update lastModifiedDate to current date
      const currentDate = new Date().toISOString();
      
      await db.execAsync(`
        INSERT INTO decks (
          userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon,
          AICardDesignIndex
        ) VALUES (
          '${userID}', '${aiDeck.deckName}', '${currentDate}', '${currentDate}', ${aiDeck.isFavorited}, '${aiDeck.deckType}', '${aiDeck.creationMethod}',
          ${aiDeck.lastStudiedDate ? `'${aiDeck.lastStudiedDate}'` : 'NULL'}, ${aiDeck.lastQuizzedDate ? `'${aiDeck.lastQuizzedDate}'` : 'NULL'}, 0, 1, ${aiDeck.folderIDs ? `'${aiDeck.folderIDs}'` : 'NULL'},
          ${aiDeck.studyEducationLevel ? `'${aiDeck.studyEducationLevel}'` : 'NULL'}, ${aiDeck.studySubjects ? `'${aiDeck.studySubjects}'` : 'NULL'}, ${aiDeck.studyTopicsSubtopics ? `'${aiDeck.studyTopicsSubtopics}'` : 'NULL'}, ${aiDeck.studyExamQuiz ? `'${aiDeck.studyExamQuiz}'` : 'NULL'},
          ${aiDeck.interviewJobRole ? `'${aiDeck.interviewJobRole}'` : 'NULL'}, ${aiDeck.interviewType ? `'${aiDeck.interviewType}'` : 'NULL'}, ${aiDeck.interviewCompany ? `'${aiDeck.interviewCompany}'` : 'NULL'}, ${aiDeck.interviewExperienceLevel ? `'${aiDeck.interviewExperienceLevel}'` : 'NULL'}, ${aiDeck.interviewTopics ? `'${aiDeck.interviewTopics}'` : 'NULL'}, ${aiDeck.interviewCompanyIcon ? `'${aiDeck.interviewCompanyIcon}'` : 'NULL'},
          ${aiDeck.cardDesignIndex}
        )
      `);
      
      // 3. Get the new deck ID
      const newDeckIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as newDeckId');
      const newDeckId = (newDeckIdResult as any).newDeckId;
      
      // 4. Get all AI flashcards for this deck
      const aiFlashcardsResult = await db.getAllAsync(`
        SELECT *
        FROM AIFlashcards
        WHERE deckID = ${aiDeckId} AND userID = '${userID}'
      `);
      
      const aiFlashcards = aiFlashcardsResult as any[];
      
      // 5. Insert all AI flashcards into the regular flashcards table
      for (const aiFlashcard of aiFlashcards) {
        const questionBlobHex = aiFlashcard.questionBlob ? `X'${Array.from(aiFlashcard.questionBlob as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        const answerBlobHex = aiFlashcard.answerBlob ? `X'${Array.from(aiFlashcard.answerBlob as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        
        // Insert the flashcard
        await db.execAsync(`
          INSERT INTO flashcards (
            userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            '${userID}', ${newDeckId}, '${aiFlashcard.difficultyRating}', '${aiFlashcard.cognitiveQnType}', ${aiFlashcard.isFavorited}, '${aiFlashcard.questionType}', 
            ${aiFlashcard.questionText ? `'${aiFlashcard.questionText}'` : 'NULL'}, ${questionBlobHex},
            '${aiFlashcard.answerType}', ${aiFlashcard.answerText ? `'${aiFlashcard.answerText}'` : 'NULL'}, 
            ${aiFlashcard.answerMCQ ? `'${aiFlashcard.answerMCQ}'` : 'NULL'}, ${answerBlobHex},
            ${aiFlashcard.timeTaken || 'NULL'}, ${aiFlashcard.isMcqAnswerRight !== null ? aiFlashcard.isMcqAnswerRight : 'NULL'}, 
            ${aiFlashcard.lastStudiedDate ? `'${aiFlashcard.lastStudiedDate}'` : 'NULL'}, 
            ${aiFlashcard.lastQuizzedDate ? `'${aiFlashcard.lastQuizzedDate}'` : 'NULL'}
          )
        `);
        
      }
      
      // 6. Delete all AI flashcards from AIFlashcards table
      await db.execAsync(`
        DELETE FROM AIFlashcards
        WHERE deckID = ${aiDeckId} AND userID = '${userID}'
      `);
      
      // 7. Delete the AI deck from AIDecks table
      await db.execAsync(`
        DELETE FROM AIDecks
        WHERE deckID = ${aiDeckId} AND userID = '${userID}'
      `);
      
      // Commit the transaction
      await db.execAsync('COMMIT');
      
      return { success: true, newDeckId };
      
    } catch (error) {
      // Rollback the transaction on error
      await db.execAsync('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error saving AI deck:', error);
    return { success: false };
  }
}

export async function createManualDeck(formData: {
  deckName: string;
  mode: 'study' | 'interview';
  studyMandatoryQuestion1?: string;
  studyMandatoryQuestion2?: string;
  studyMandatoryQuestion3?: string;
  interviewMandatoryQuestion1?: string;
  interviewMandatoryQuestion2?: string;
  interviewType?: string;
}): Promise<{ success: boolean; deckId?: number }> {
  try {
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Generate current date
      const currentDate = new Date().toISOString();
      
      // Generate random card design index (0, 1, 2, 3)
      const cardDesignIndex = Math.floor(Math.random() * 4);
      
      // Prepare study-specific fields
      let studyEducationLevel = null;
      let studySubjects = null;
      let studyExamQuiz = null;
      
      if (formData.mode === 'study') {
        studyEducationLevel = formData.studyMandatoryQuestion1 || null;
        // Convert comma-separated string to JSON array
        if (formData.studyMandatoryQuestion2) {
          const subjects = formData.studyMandatoryQuestion2.split(',').map(s => s.trim());
          studySubjects = JSON.stringify(subjects);
        }
        studyExamQuiz = formData.studyMandatoryQuestion3 || null;
      }
      
      // Prepare interview-specific fields
      let interviewJobRole = null;
      let interviewType = null;
      let interviewExperienceLevel = null;
      
      if (formData.mode === 'interview') {
        interviewJobRole = formData.interviewMandatoryQuestion1 || null;
        // Convert interview type to lowercase
        if (formData.interviewType) {
          interviewType = formData.interviewType.toLowerCase();
        }
        interviewExperienceLevel = formData.interviewMandatoryQuestion2 || null;
      }
      
      // Insert the new deck
      await db.execAsync(`
        INSERT INTO decks (
          userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
        ) VALUES (
          '${userID}', '${formData.deckName.replace(/'/g, "''")}', '${currentDate}', '${currentDate}', 0, '${formData.mode}', 'Manual',
          NULL, NULL, ${cardDesignIndex}, 0, NULL,
          ${studyEducationLevel ? `'${studyEducationLevel.replace(/'/g, "''")}'` : 'NULL'}, 
          ${studySubjects ? `'${studySubjects.replace(/'/g, "''")}'` : 'NULL'}, 
          NULL, 
          ${studyExamQuiz ? `'${studyExamQuiz.replace(/'/g, "''")}'` : 'NULL'},
          ${interviewJobRole ? `'${interviewJobRole.replace(/'/g, "''")}'` : 'NULL'}, 
          ${interviewType ? `'${interviewType.replace(/'/g, "''")}'` : 'NULL'}, 
          NULL, 
          ${interviewExperienceLevel ? `'${interviewExperienceLevel.replace(/'/g, "''")}'` : 'NULL'}, 
          NULL, 
          NULL
        )
      `);
      
      // Get the new deck ID
      const newDeckIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as newDeckId');
      const newDeckId = (newDeckIdResult as any).newDeckId;
      
      // Insert into userFormEntries table
      let studyEducationLevelForm = null;
      let studySubjectsForm = null;
      let studyExamForm = null;
      let interviewJobRoleForm = null;
      let interviewTypeForm = null;
      let interviewExperienceLevelForm = null;
      
      if (formData.mode === 'study') {
        studyEducationLevelForm = formData.studyMandatoryQuestion1 || null;
        // Convert comma-separated string to JSON array for form entry
        if (formData.studyMandatoryQuestion2) {
          const subjects = formData.studyMandatoryQuestion2.split(',').map(s => s.trim());
          studySubjectsForm = JSON.stringify(subjects);
        }
        studyExamForm = formData.studyMandatoryQuestion3 || null;
      } else if (formData.mode === 'interview') {
        interviewJobRoleForm = formData.interviewMandatoryQuestion1 || null;
        interviewTypeForm = formData.interviewType || null;
        interviewExperienceLevelForm = formData.interviewMandatoryQuestion2 || null;
      }
      
      await db.execAsync(`
        INSERT INTO userFormEntries (
          userID, formEntryType, formEntryMethod, formSubmissionDate, deckName, numberOfQuestions, kindsOfQuestions,
          youtubeLink, studyEducationLevel, studySubjects, studyTopics, studySubtopics, studyExam,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics
        ) VALUES (
          '${userID}', '${formData.mode}', 'manual', '${currentDate}', '${formData.deckName.replace(/'/g, "''")}', NULL, NULL,
          NULL, 
          ${studyEducationLevelForm ? `'${studyEducationLevelForm.replace(/'/g, "''")}'` : 'NULL'}, 
          ${studySubjectsForm ? `'${studySubjectsForm.replace(/'/g, "''")}'` : 'NULL'}, 
          NULL, NULL, 
          ${studyExamForm ? `'${studyExamForm.replace(/'/g, "''")}'` : 'NULL'},
          ${interviewJobRoleForm ? `'${interviewJobRoleForm.replace(/'/g, "''")}'` : 'NULL'}, 
          ${interviewTypeForm ? `'${interviewTypeForm.replace(/'/g, "''")}'` : 'NULL'}, 
          NULL, 
          ${interviewExperienceLevelForm ? `'${interviewExperienceLevelForm.replace(/'/g, "''")}'` : 'NULL'}, 
          NULL
        )
      `);
      
      // Update user statistics
      await db.execAsync(`
        UPDATE users 
        SET 
          accumulatedDecksCreated = accumulatedDecksCreated + 1,
          ${formData.mode === 'study' ? 'accumulatedStudyDecksCreated = accumulatedStudyDecksCreated + 1' : 'accumulatedInterviewDecksCreated = accumulatedInterviewDecksCreated + 1'},
          lastUpdated = '${currentDate}'
        WHERE userID = '${userID}'
      `);
      
      // Commit the transaction
      await db.execAsync('COMMIT');
      
      return { success: true, deckId: newDeckId };
      
    } catch (error) {
      // Rollback the transaction on error
      await db.execAsync('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating manual deck:', error);
    return { success: false };
  }
}

// Helper function to convert URI to blob
async function uriToBlob(uri: string): Promise<Uint8Array | null> {
  try {
    // Handle data URIs (like SVG data URIs)
    if (uri.startsWith('data:')) {
      // Extract base64 data from data URI
      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        console.error('Invalid data URI format');
        return null;
      }
      
      // Convert base64 to Uint8Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    
    // Handle file URIs
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Convert base64 to Uint8Array
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error converting URI to blob:', error);
    return null;
  }
}

export async function createFlashcardsFromCache(deckId: number, cardCache: any[]): Promise<{ success: boolean; flashcardCount?: number; flashcardIds?: number[] }> {
  try {
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      let flashcardCount = 0;
      let flashcardIds: number[] = [];
      // Process each submitted card in the cache
      for (const card of cardCache) {
        if (card.submitted && card.frontContent && card.backContent) {
          // Extract content from the cached card
          const frontContent = card.frontContent;
          const backContent = card.backContent;
          
          // Determine question and answer types and content
          let questionType = 'text';
          let questionText = null;
          let questionBlob = null;
          
          let answerType = 'text';
          let answerText = null;
          let answerMCQ = null;
          let answerBlob = null;
          
          // Process front content (question)
          if (frontContent.type === 'text' && frontContent.content) {
            questionType = 'text';
            questionText = extractTextFromContent(frontContent.content);
          } else if (frontContent.type === 'camera' && frontContent.content) {
            questionType = 'image';
            // Convert image URI to blob
            questionBlob = await uriToBlob(frontContent.content.props.source.uri);
          } else if (frontContent.type === 'mic' && frontContent.audioUri) {
            questionType = 'audio';
            // Convert audio URI to blob
            questionBlob = await uriToBlob(frontContent.audioUri);
          } else if (frontContent.type === 'marker' && frontContent.content) {
            questionType = 'image';
            // Convert drawing data to image, then to blob
            const drawingRenderer = frontContent.content as React.ReactElement<{ drawingData: { path: string; strokeWidth: number }[] }>;
            if (drawingRenderer.props.drawingData) {
              // Convert drawing data to SVG string
              const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
                ${drawingRenderer.props.drawingData.map(pathData => 
                  `<path d="${pathData.path}" stroke="black" stroke-width="${pathData.strokeWidth}" fill="none"/>`
                ).join('')}
              </svg>`;
              
              
              // Convert SVG to base64 data URI
              const base64Svg = btoa(svgString);
              const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
              
              
              // Convert data URI to blob
              questionBlob = await uriToBlob(dataUri);
            } else {
              console.log('No drawing data found in front content');
            }
          }
          
          // Process back content (answer)
          if (backContent.type === 'text' && backContent.content) {
            answerType = 'text';
            answerText = extractTextFromContent(backContent.content);
          } else if (backContent.type === 'camera' && backContent.content) {
            answerType = 'image';
            // Convert image URI to blob
            answerBlob = await uriToBlob(backContent.content.props.source.uri);
          } else if (backContent.type === 'mic' && backContent.audioUri) {
            answerType = 'audio';
            // Convert audio URI to blob
            answerBlob = await uriToBlob(backContent.audioUri);
          } else if (backContent.type === 'marker' && backContent.content) {
            answerType = 'image';
            // Convert drawing data to image, then to blob
            const drawingRenderer = backContent.content as React.ReactElement<{ drawingData: { path: string; strokeWidth: number }[] }>;
            if (drawingRenderer.props.drawingData) {
              // Convert drawing data to SVG string
              const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
                ${drawingRenderer.props.drawingData.map(pathData => 
                  `<path d="${pathData.path}" stroke="black" stroke-width="${pathData.strokeWidth}" fill="none"/>`
                ).join('')}
              </svg>`;
              
              
              // Convert SVG to base64 data URI
              const base64Svg = btoa(svgString);
              const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
              
              
              // Convert data URI to blob
              answerBlob = await uriToBlob(dataUri);
            } else {
              console.log('No drawing data found in back content');
            }
          }
          
          // Convert blobs to hex format for SQLite
          const questionBlobHex = questionBlob ? `X'${Array.from(questionBlob).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
          const answerBlobHex = answerBlob ? `X'${Array.from(answerBlob).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
          
          
          // Insert the flashcard
          await db.execAsync(`
            INSERT INTO flashcards (
              userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
              answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
            ) VALUES (
              '${userID}', ${deckId}, 'None', 'None', 0, '${questionType}', 
              ${questionText ? `'${(questionText as string).replace(/'/g, "''")}'` : 'NULL'}, ${questionBlobHex},
              '${answerType}', ${answerText ? `'${(answerText as string).replace(/'/g, "''")}'` : 'NULL'}, 
              ${answerMCQ ? `'${(answerMCQ as string).replace(/'/g, "''")}'` : 'NULL'}, ${answerBlobHex},
              NULL, NULL, NULL, NULL
            )
          `);
          // Get the last inserted flashcardID
          const lastIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as id') as { id?: number };
          if (lastIdResult && typeof lastIdResult.id !== 'undefined') {
            flashcardIds.push(lastIdResult.id);
          }
          
          
          flashcardCount++;
        }
      }
      
      // Update user statistics for flashcards created
      if (flashcardCount > 0) {
        const currentDate = new Date().toISOString();
        await db.execAsync(`
          UPDATE users 
          SET 
            accumulatedFlashcardsCreated = accumulatedFlashcardsCreated + ${flashcardCount},
            lastUpdated = '${currentDate}'
          WHERE userID = '${userID}'
        `);
        // Also update the deck's lastModifiedDate since new flashcards were created
        await db.execAsync(`
          UPDATE decks
          SET lastModifiedDate = '${currentDate}'
          WHERE deckID = ${deckId}
        `);
      }
      
      // Commit the transaction
      await db.execAsync('COMMIT');
      
      return { success: true, flashcardCount, flashcardIds };
      
    } catch (error) {
      // Rollback the transaction on error
      await db.execAsync('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating flashcards from cache:', error);
    return { success: false };
  }
}

// Helper function to extract text from React content
function extractTextFromContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (typeof content === 'number') {
    return content.toString();
  }
  
  if (content === null || content === undefined) {
    return '';
  }
  
  // If it's a React element, try to extract text from props
  if (typeof content === 'object' && content !== null) {
    // Check if it has children prop
    if ('props' in content && content.props) {
      const props = content.props as { children?: any };
      if (props.children) {
        if (typeof props.children === 'string') {
          return props.children;
        }
        if (Array.isArray(props.children)) {
          return props.children.map((child: any) => extractTextFromContent(child)).join('');
        }
        return extractTextFromContent(props.children);
      }
    }
  }
  
  return '';
}

export async function getMostRecentManualFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT *
      FROM userFormEntries
      WHERE formEntryType = ? 
        AND formEntryMethod = 'manual'
        AND userID = ?
      ORDER BY formSubmissionDate DESC
      LIMIT 1
    `, [mode, userID]);

    if (!result) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error fetching most recent manual form entry:', error);
    return null;
  }
}

export async function getDeckNameById(deckId: number): Promise<string | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT deckName FROM decks WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!result) {
      return null;
    }

    return (result as { deckName: string }).deckName;
  } catch (error) {
    console.error('Error getting deck name by ID:', error);
    return null;
  }
}

// Helper function to convert hex string to image source
export function convertHexToImageSource(hexString: string | null): { uri: string } | undefined {
  if (!hexString) return undefined;
  
  try {
    // Check if it's a hex string
    if (/^[0-9A-Fa-f]+$/.test(hexString)) {
      // Convert hex to base64
      const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      const base64String = btoa(String.fromCharCode(...bytes));
      return { uri: `data:image/png;base64,${base64String}` };
    } else if (hexString.startsWith('data:')) {
      // Already a data URI
      return { uri: hexString };
    } else {
      // Try as file path or URL
      return { uri: hexString };
    }
  } catch (error) {
    console.error('Error converting hex to image source:', error);
    return undefined;
  }
}

// Helper function to get company icon from interviewCompanyIcons table
export async function getCompanyIconImageSource(companyName: string | null): Promise<{ uri: string } | undefined> {
  if (!companyName) return undefined;
  
  try {
    const userID = await getCurrentUserID();
    
    // First try exact match
    let result = await db.getFirstAsync(`
      SELECT hex(icon) as iconHex
      FROM interviewCompanyIcons
      WHERE name = ?
    `, [companyName]);

    // If no exact match, try case-insensitive match
    if (!result) {
      result = await db.getFirstAsync(`
        SELECT hex(icon) as iconHex
        FROM interviewCompanyIcons
        WHERE LOWER(name) = LOWER(?)
      `, [companyName]);
    }

    if (!result) {
      console.log(`🔍 No company icon found for: "${companyName}"`);
      return undefined;
    }

    const iconHex = (result as { iconHex: string }).iconHex;
    console.log(`✅ Found company icon for: "${companyName}"`);
    return convertHexToImageSource(iconHex);
  } catch (error) {
    console.error('Error fetching company icon:', error);
    return undefined;
  }
}

// Helper function to get all company names from interviewCompanyIcons table
export async function getAllCompanyNames(): Promise<string[]> {
  try {
    const result = await db.getAllAsync(`
      SELECT name
      FROM interviewCompanyIcons
      ORDER BY name ASC
    `);

    return result.map((row: any) => row.name);
  } catch (error) {
    console.error('Error fetching company names:', error);
    return [];
  }
}

// Helper function to get company icon image source by name
export async function getCompanyIconByName(companyName: string): Promise<{ uri: string } | undefined> {
  try {
    // First try exact match
    let result = await db.getFirstAsync(`
      SELECT hex(icon) as iconHex
      FROM interviewCompanyIcons
      WHERE name = ?
    `, [companyName]);

    // If no exact match, try case-insensitive match
    if (!result) {
      result = await db.getFirstAsync(`
        SELECT hex(icon) as iconHex
        FROM interviewCompanyIcons
        WHERE LOWER(name) = LOWER(?)
      `, [companyName]);
    }

    if (!result) {
      console.log(`🔍 No company icon found for: "${companyName}"`);
      return undefined;
    }

    const iconHex = (result as { iconHex: string }).iconHex;
    console.log(`✅ Found company icon for: "${companyName}"`);
    return convertHexToImageSource(iconHex);
  } catch (error) {
    console.error('Error fetching company icon:', error);
    return undefined;
  }
}

export async function saveUserGenAIFormEntry({
  deckName,
  formEntryType,
  formEntryMethod,
  formSubmissionDate,
  numberOfQuestions,
  kindsOfQuestions,
  studyEducationLevel,
  studySubjects,
  studyTopics,
  studySubtopics,
  studyExam,
  interviewJobRole,
  interviewType,
  interviewCompany,
  interviewExperienceLevel,
  interviewTopics
}: {
  deckName: string;
  formEntryType: string;
  formEntryMethod: string;
  formSubmissionDate: string;
  numberOfQuestions: number;
  kindsOfQuestions: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  studyTopics?: string;
  studySubtopics?: string;
  studyExam?: string;
  interviewJobRole?: string;
  interviewType?: string;
  interviewCompany?: string;
  interviewExperienceLevel?: string;
  interviewTopics?: string;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    await db.execAsync(`
      INSERT INTO userFormEntries (
        userID, formEntryType, formEntryMethod, formSubmissionDate, deckName, numberOfQuestions, kindsOfQuestions,
        youtubeLink, studyEducationLevel, studySubjects, studyTopics, studySubtopics, studyExam,
        interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics
      ) VALUES (
        '${userID}', '${formEntryType}', '${formEntryMethod}', '${formSubmissionDate}', '${deckName.replace(/'/g, "''")}',
        ${typeof numberOfQuestions === 'number' ? numberOfQuestions : 'NULL'},
        ${kindsOfQuestions ? `'${kindsOfQuestions}'` : 'NULL'},
        NULL,
        ${studyEducationLevel ? `'${studyEducationLevel.replace(/'/g, "''")}'` : 'NULL'},
        ${studySubjects ? `'${studySubjects.replace(/'/g, "''")}'` : 'NULL'},
        ${studyTopics ? `'${studyTopics.replace(/'/g, "''")}'` : 'NULL'},
        ${studySubtopics ? `'${studySubtopics.replace(/'/g, "''")}'` : 'NULL'},
        ${studyExam ? `'${studyExam.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewJobRole ? `'${interviewJobRole.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewType ? `'${interviewType.toLowerCase().replace(/'/g, "''")}'` : 'NULL'},
        ${interviewCompany ? `'${interviewCompany.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewExperienceLevel ? `'${interviewExperienceLevel.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewTopics ? `'${interviewTopics.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    return { success: true };
  } catch (error) {
    console.error('Error saving user form entry:', error);
    return { success: false };
  }
}

export async function getMostRecentGenAIFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT *
      FROM userFormEntries
      WHERE formEntryMethod = 'genAIForm'
        AND formEntryType = ?
        AND userID = ?
      ORDER BY formSubmissionDate DESC
      LIMIT 1
    `, [mode, userID]);
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    console.error('Error fetching most recent genaiform entry:', error);
    return null;
  }
}

export async function createDeckWithGenAIFlashcards({
  deckName,
  mode,
  formFields,
  flashcards,
  isFavorited = 0,
  folderIDs = null,
}: {
  deckName: string;
  mode: 'study' | 'interview';
  formFields: {
    studyEducationLevel?: string;
    studySubjects?: string;
    studyTopics?: string;
    studySubtopics?: string;
    studyExam?: string;
    interviewJobRole?: string;
    interviewType?: string;
    interviewCompany?: string;
    interviewExperienceLevel?: string;
    interviewTopics?: string;
    numberOfQuestions?: number;
    kindsOfQuestions?: string;
  };
  flashcards: Array<{ flashcardType: string; question: string; answer: any }>;
  isFavorited?: number;
  folderIDs?: string | null;
}): Promise<{ success: boolean; deckId?: number }> {
  try {
    const userID = await getCurrentUserID();
    await db.execAsync('BEGIN TRANSACTION');
    try {
      const currentDate = new Date().toISOString();
      const cardDesignIndex = Math.floor(Math.random() * 4);
      const creationMethod = 'Gen AI Form';
      const interviewCompanyIcon = formFields.interviewCompany || null;
      // Insert deck
      await db.execAsync(`
        INSERT INTO decks (
          userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
        ) VALUES (
          '${userID}', '${deckName.replace(/'/g, "''")}', '${currentDate}', '${currentDate}', ${isFavorited}, '${mode}', '${creationMethod}',
          NULL, NULL, ${cardDesignIndex}, 0, ${folderIDs ? `'${folderIDs}'` : 'NULL'},
          ${formFields.studyEducationLevel ? `'${formFields.studyEducationLevel.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.studySubjects ? `'${formFields.studySubjects.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.studyTopics || formFields.studySubtopics ? `'${[formFields.studyTopics, formFields.studySubtopics].filter(Boolean).join(', ').replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.studyExam ? `'${formFields.studyExam.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewJobRole ? `'${formFields.interviewJobRole.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewType ? `'${formFields.interviewType.toLowerCase().replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewCompany ? `'${formFields.interviewCompany.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewExperienceLevel ? `'${formFields.interviewExperienceLevel.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewTopics ? `'${formFields.interviewTopics.replace(/'/g, "''")}'` : 'NULL'},
          ${interviewCompanyIcon ? `'${interviewCompanyIcon.replace(/'/g, "''")}'` : 'NULL'}
        )
      `);
      // Get new deckId
      const newDeckIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as newDeckId');
      const newDeckId = (newDeckIdResult as any).newDeckId;
      // Insert flashcards
      let flashcardCount = 0;
      for (const card of flashcards) {
        const mapping = (promptAndData as Record<string, any>)[card.flashcardType];
        if (!mapping) continue;
        const questionType = mapping.questionType;
        const answerType = mapping.answerType;
        const cognitiveQnType = mapping.cognitiveQnType;
        let answerText = null;
        let answerMCQ = null;
        if (answerType === 'mcq') {
          answerMCQ = JSON.stringify(card.answer);
        } else {
          answerText = typeof card.answer === 'string' ? card.answer : JSON.stringify(card.answer);
        }
        await db.execAsync(`
          INSERT INTO flashcards (
            userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            '${userID}', ${newDeckId}, 'None', '${cognitiveQnType}', ${isFavorited}, '${questionType}',
            ${card.question ? `'${card.question.replace(/'/g, "''")}'` : 'NULL'}, NULL,
            '${answerType}', ${answerText ? `'${answerText.replace(/'/g, "''")}'` : 'NULL'},
            ${answerMCQ ? `'${answerMCQ.replace(/'/g, "''")}'` : 'NULL'}, NULL,
            NULL, NULL, NULL, NULL
          )
        `);
        flashcardCount++;
      }
      // Update user statistics
      if (flashcardCount > 0) {
        await db.execAsync(`
          UPDATE users 
          SET 
            accumulatedDecksCreated = accumulatedDecksCreated + 1,
            accumulatedFlashcardsCreated = accumulatedFlashcardsCreated + ${flashcardCount},
            ${mode === 'study' ? 'accumulatedStudyDecksCreated = accumulatedStudyDecksCreated + 1' : 'accumulatedInterviewDecksCreated = accumulatedInterviewDecksCreated + 1'},
            lastUpdated = '${currentDate}'
          WHERE userID = '${userID}'
        `);
      }
      await db.execAsync('COMMIT');
      return { success: true, deckId: newDeckId };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating GenAI deck:', error);
    return { success: false };
  }
}

export async function createGenAIFlashcardsForDeck({
  deckId,
  flashcards
}: {
  deckId: number;
  flashcards: Array<{ flashcardType: string; question: string; answer: any }>;
}): Promise<{ success: boolean; flashcardCount?: number; flashcardIds?: number[] }> {
  try {
    const userID = await getCurrentUserID();
    await db.execAsync('BEGIN TRANSACTION');
    try {
      let flashcardCount = 0;
      let flashcardIds: number[] = [];
      for (const card of flashcards) {
        const mapping = (promptAndData as Record<string, any>)[card.flashcardType];
        if (!mapping) continue;
        const questionType = mapping.questionType;
        const answerType = mapping.answerType;
        const cognitiveQnType = mapping.cognitiveQnType;
        let answerText = null;
        let answerMCQ = null;
        if (answerType === 'mcq') {
          answerMCQ = JSON.stringify(card.answer);
        } else {
          answerText = typeof card.answer === 'string' ? card.answer : JSON.stringify(card.answer);
        }
        await db.execAsync(`
          INSERT INTO flashcards (
            userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            '${userID}', ${deckId}, 'None', '${cognitiveQnType}', 0, '${questionType}',
            ${card.question ? `'${card.question.replace(/'/g, "''")}'` : 'NULL'}, NULL,
            '${answerType}', ${answerText ? `'${answerText.replace(/'/g, "''")}'` : 'NULL'},
            ${answerMCQ ? `'${answerMCQ.replace(/'/g, "''")}'` : 'NULL'}, NULL,
            NULL, NULL, NULL, NULL
          )
        `);
        // Get the last inserted flashcardID
        const lastIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as id') as { id?: number };
        if (lastIdResult && typeof lastIdResult.id !== 'undefined') {
          flashcardIds.push(lastIdResult.id);
        }
        flashcardCount++;
      }
      // Update user statistics
      if (flashcardCount > 0) {
        const currentDate = new Date().toISOString();
        await db.execAsync(`
          UPDATE users 
          SET 
            accumulatedFlashcardsCreated = accumulatedFlashcardsCreated + ${flashcardCount},
            lastUpdated = '${currentDate}'
          WHERE userID = '${userID}'
        `);
        // Also update the deck's lastModifiedDate since new flashcards were created
        await db.execAsync(`
          UPDATE decks
          SET lastModifiedDate = '${currentDate}'
          WHERE deckID = ${deckId}
        `);
      }
      await db.execAsync('COMMIT');
      return { success: true, flashcardCount, flashcardIds };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating GenAI flashcards for deck:', error);
    return { success: false };
  }
}

export async function createAIDeckWithFlashcards({
  deckName,
  mode,
  formFields,
  flashcards,
  isFavorited = 0,
  folderIDs = null,
  tempUserID = null,
}: {
  deckName: string;
  mode: 'study' | 'interview';
  formFields: {
    studyEducationLevel?: string;
    studySubjects?: string;
    studyTopics?: string;
    studySubtopics?: string;
    studyExam?: string;
    interviewJobRole?: string;
    interviewType?: string;
    interviewCompany?: string;
    interviewExperienceLevel?: string;
    interviewTopics?: string;
    numberOfQuestions?: number;
    kindsOfQuestions?: string;
  };
  flashcards: Array<{ flashcardType: string; question: string; answer: any }>;
  isFavorited?: number;
  folderIDs?: string | null;
  tempUserID?: string | null;
}): Promise<{ success: boolean; deckId?: number }> {
  try {
    const userID = tempUserID || await getCurrentUserID();
    console.log('🔧 Creating AI deck with userID:', userID, tempUserID ? '(temporary)' : '(current user)');
    
    await db.execAsync('BEGIN TRANSACTION');
    try {
      const currentDate = new Date().toISOString();
      const cardDesignIndex = Math.floor(Math.random() * 3); // 0, 1, or 2 for AI decks
      const creationMethod = 'AI Suggested';
      const interviewCompanyIcon = formFields.interviewCompany || null;
      
      // Insert AI deck
      console.log(`💾 Storing AI deck with interviewType: "${formFields.interviewType}" for deck: ${deckName}`);
      await db.execAsync(`
        INSERT INTO AIDecks (
          userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
        ) VALUES (
          '${userID}', '${deckName.replace(/'/g, "''")}', '${currentDate}', '${currentDate}', ${isFavorited}, '${mode}', '${creationMethod}',
          NULL, NULL, ${cardDesignIndex}, 1, ${folderIDs ? `'${folderIDs}'` : 'NULL'},
          ${formFields.studyEducationLevel ? `'${formFields.studyEducationLevel.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.studySubjects ? `'${formFields.studySubjects.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.studyTopics || formFields.studySubtopics ? `'${[formFields.studyTopics, formFields.studySubtopics].filter(Boolean).join(', ').replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.studyExam ? `'${formFields.studyExam.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewJobRole ? `'${formFields.interviewJobRole.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewType ? `'${formFields.interviewType.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewCompany ? `'${formFields.interviewCompany.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewExperienceLevel ? `'${formFields.interviewExperienceLevel.replace(/'/g, "''")}'` : 'NULL'},
          ${formFields.interviewTopics ? `'${formFields.interviewTopics.replace(/'/g, "''")}'` : 'NULL'},
          ${interviewCompanyIcon ? `'${interviewCompanyIcon.replace(/'/g, "''")}'` : 'NULL'}
        )
      `);
      
      // Get the new AI deck ID
      const newDeckIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as newDeckId');
      const newDeckId = (newDeckIdResult as any).newDeckId;
      
      // Create AI flashcards for this deck
      const flashcardResult = await createAIFlashcardsForDeck({
        deckId: newDeckId,
        flashcards,
        isWithinTransaction: true
      });
      
      if (!flashcardResult.success) {
        throw new Error('Failed to create AI flashcards');
      }
      
      await db.execAsync('COMMIT');
      return { success: true, deckId: newDeckId };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating AI deck:', error);
    return { success: false };
  }
}

export async function updateAIDeckUserID(deckId: number, newUserID: string): Promise<{ success: boolean }> {
  try {
    console.log(`🔄 Updating AI deck ${deckId} userID to: ${newUserID}`);
    
    await db.execAsync('BEGIN TRANSACTION');
    try {
      // Update the AI deck userID
      await db.execAsync(`
        UPDATE AIDecks 
        SET userID = '${newUserID}'
        WHERE deckID = ${deckId}
      `);
      
      // Update all AI flashcards for this deck
      await db.execAsync(`
        UPDATE AIFlashcards 
        SET userID = '${newUserID}'
        WHERE deckID = ${deckId}
      `);
      
      await db.execAsync('COMMIT');
      console.log(`✅ Successfully updated AI deck ${deckId} userID to: ${newUserID}`);
      return { success: true };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating AI deck userID:', error);
    return { success: false };
  }
}

export async function createAIFlashcardsForDeck({
  deckId,
  flashcards,
  isWithinTransaction = false
}: {
  deckId: number;
  flashcards: Array<{ flashcardType: string; question: string; answer: any }>;
  isWithinTransaction?: boolean;
}): Promise<{ success: boolean; flashcardCount?: number; flashcardIds?: number[] }> {
  try {
    const userID = await getCurrentUserID();
    
    // Only start a transaction if we're not already within one
    if (!isWithinTransaction) {
      await db.execAsync('BEGIN TRANSACTION');
    }
    
    try {
      let flashcardCount = 0;
      let flashcardIds: number[] = [];
      for (const card of flashcards) {
        const mapping = (promptAndData as Record<string, any>)[card.flashcardType];
        if (!mapping) continue;
        const questionType = mapping.questionType;
        const answerType = mapping.answerType;
        const cognitiveQnType = mapping.cognitiveQnType;
        let answerText = null;
        let answerMCQ = null;
        if (answerType === 'mcq') {
          answerMCQ = JSON.stringify(card.answer);
        } else {
          answerText = typeof card.answer === 'string' ? card.answer : JSON.stringify(card.answer);
        }
        await db.execAsync(`
          INSERT INTO AIFlashcards (
            userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            '${userID}', ${deckId}, 'None', '${cognitiveQnType}', 0, '${questionType}',
            ${card.question ? `'${card.question.replace(/'/g, "''")}'` : 'NULL'}, NULL,
            '${answerType}', ${answerText ? `'${answerText.replace(/'/g, "''")}'` : 'NULL'},
            ${answerMCQ ? `'${answerMCQ.replace(/'/g, "''")}'` : 'NULL'}, NULL,
            NULL, NULL, NULL, NULL
          )
        `);
        // Get the last inserted flashcardID
        const lastIdResult = await db.getFirstAsync('SELECT last_insert_rowid() as id') as { id?: number };
        if (lastIdResult && typeof lastIdResult.id !== 'undefined') {
          flashcardIds.push(lastIdResult.id);
        }
        flashcardCount++;
      }
      // Update user statistics
      if (flashcardCount > 0) {
        const currentDate = new Date().toISOString();
        await db.execAsync(`
          UPDATE users 
          SET 
            accumulatedFlashcardsCreated = accumulatedFlashcardsCreated + ${flashcardCount},
            lastUpdated = '${currentDate}'
          WHERE userID = '${userID}'
        `);
        // Also update the AI deck's lastModifiedDate since new flashcards were created
        await db.execAsync(`
          UPDATE AIDecks
          SET lastModifiedDate = '${currentDate}'
          WHERE deckID = ${deckId}
        `);
      }
      
      // Only commit if we started the transaction
      if (!isWithinTransaction) {
        await db.execAsync('COMMIT');
      }
      
      return { success: true, flashcardCount, flashcardIds };
    } catch (error) {
      // Only rollback if we started the transaction
      if (!isWithinTransaction) {
        await db.execAsync('ROLLBACK');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating AI flashcards for deck:', error);
    return { success: false };
  }
}

export async function saveUserFileUploadFormEntry({
  deckName,
  studyEducationLevel,
  studySubjects,
  numberOfQuestions,
  interviewJobRole,
  interviewType
}: {
  deckName: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  numberOfQuestions: number;
  interviewJobRole?: string;
  interviewType?: string;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    const formSubmissionDate = new Date().toISOString();
    await db.execAsync(`
      INSERT INTO userFormEntries (
        userID, formEntryType, formEntryMethod, formSubmissionDate, deckName, numberOfQuestions,
        studyEducationLevel, studySubjects, interviewJobRole, interviewType
      ) VALUES (
        '${userID}',
        ${interviewJobRole || interviewType ? `'interview'` : `'study'`},
        'fileUpload',
        '${formSubmissionDate}',
        '${deckName.replace(/'/g, "''")}',
        ${typeof numberOfQuestions === 'number' ? numberOfQuestions : 'NULL'},
        ${studyEducationLevel ? `'${studyEducationLevel.replace(/'/g, "''")}'` : 'NULL'},
        ${studySubjects ? `'${studySubjects.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewJobRole ? `'${interviewJobRole.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewType ? `'${interviewType.toLowerCase().replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    return { success: true };
  } catch (error) {
    console.error('Error saving user file upload form entry:', error);
    return { success: false };
  }
}

export async function saveUserYouTubeLinkFormEntry({
  deckName,
  studyEducationLevel,
  studySubjects,
  numberOfQuestions,
  interviewJobRole,
  interviewType,
  youtubeLink
}: {
  deckName: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  numberOfQuestions: number;
  interviewJobRole?: string;
  interviewType?: string;
  youtubeLink: string;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    const formSubmissionDate = new Date().toISOString();
    await db.execAsync(`
      INSERT INTO userFormEntries (
        userID, formEntryType, formEntryMethod, formSubmissionDate, deckName, numberOfQuestions,
        youtubeLink, studyEducationLevel, studySubjects, interviewJobRole, interviewType
      ) VALUES (
        '${userID}',
        ${interviewJobRole || interviewType ? `'interview'` : `'study'`},
        'youtubeLink',
        '${formSubmissionDate}',
        '${deckName.replace(/'/g, "''")}',
        ${typeof numberOfQuestions === 'number' ? numberOfQuestions : 'NULL'},
        ${youtubeLink ? `'${youtubeLink.replace(/'/g, "''")}'` : 'NULL'},
        ${studyEducationLevel ? `'${studyEducationLevel.replace(/'/g, "''")}'` : 'NULL'},
        ${studySubjects ? `'${studySubjects.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewJobRole ? `'${interviewJobRole.replace(/'/g, "''")}'` : 'NULL'},
        ${interviewType ? `'${interviewType.toLowerCase().replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    return { success: true };
  } catch (error) {
    console.error('Error saving user YouTube link form entry:', error);
    return { success: false };
  }
}

export async function getMostRecentFileUploadFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT *
      FROM userFormEntries
      WHERE formEntryMethod = 'fileUpload'
        AND formEntryType = ?
        AND userID = ?
      ORDER BY formSubmissionDate DESC
      LIMIT 1
    `, [mode, userID]);
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    console.error('Error fetching most recent file upload form entry:', error);
    return null;
  }
}

export async function getMostRecentYouTubeLinkFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT *
      FROM userFormEntries
      WHERE formEntryMethod = 'youtubeLink'
        AND formEntryType = ?
        AND userID = ?
      ORDER BY formSubmissionDate DESC
      LIMIT 1
    `, [mode, userID]);
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    console.error('Error fetching most recent YouTube link form entry:', error);
    return null;
  }
}

export async function deleteFlashcardsByIds(flashcardIds: number[]): Promise<boolean> {
  if (!flashcardIds.length) return true;
  try {
    const userID = await getCurrentUserID();
    await db.execAsync('BEGIN TRANSACTION');
    const idsString = flashcardIds.join(',');
    await db.execAsync(`
      DELETE FROM flashcards
      WHERE flashcardID IN (${idsString}) AND userID = '${userID}'
    `);
    await db.execAsync('COMMIT');
    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('Error deleting flashcards by IDs:', error);
    return false;
  }
}

export interface BreakdownDatum {
  label: string;
  value: number;
  percent: number;
  color: string;
}

// Defensive helper: check if a table exists in the current SQLite database
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const row = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    );
    return !!row;
  } catch {
    return false;
  }
}

export async function getBreakdownData(): Promise<{ decksData: BreakdownDatum[], flashcardsData: BreakdownDatum[] }> {
  try {
    const userID = await getCurrentUserID();
    const hasAIDecks = await tableExists('AIDecks');
    // Single optimized query with JOINs to get both deck counts and flashcard counts
    const sql = `
      WITH deck_categories AS (
        SELECT 
          CASE 
            WHEN deckType = 'interview' THEN interviewType 
            ELSE deckType 
          END as categoryType,
          deckID 
        FROM decks 
        WHERE deckType IS NOT NULL AND userID = ?
        ${hasAIDecks ? `UNION ALL
        SELECT 
          CASE 
            WHEN deckType = 'interview' THEN interviewType 
            ELSE deckType 
          END as categoryType,
          deckID 
        FROM AIDecks 
        WHERE deckType IS NOT NULL AND userID = ?` : ''}
      ),
      category_counts AS (
        SELECT 
          categoryType,
          COUNT(*) as deck_count,
          GROUP_CONCAT(deckID) as deck_ids
        FROM deck_categories
        GROUP BY categoryType
      ),
      flashcard_counts AS (
        SELECT 
          cc.categoryType,
          cc.deck_count,
          COALESCE(SUM(COALESCE(fc.flashcard_count, 0)), 0) as total_flashcards
        FROM category_counts cc
        LEFT JOIN (
          -- Count flashcards from regular decks (only from flashcards table)
          SELECT 
            dc.categoryType,
            COUNT(f.flashcardID) as flashcard_count
          FROM deck_categories dc
          INNER JOIN decks d ON dc.deckID = d.deckID AND d.userID = ?
          LEFT JOIN flashcards f ON dc.deckID = f.deckID AND f.userID = ?
          GROUP BY dc.categoryType
          UNION ALL
          -- Count flashcards from AI decks (only from AIFlashcards table)
          SELECT 
            dc.categoryType,
            COUNT(af.flashcardID) as flashcard_count
          FROM deck_categories dc
          INNER JOIN AIDecks ad ON dc.deckID = ad.deckID AND ad.userID = ?
          LEFT JOIN AIFlashcards af ON dc.deckID = af.deckID AND af.userID = ?
          GROUP BY dc.categoryType
        ) fc ON cc.categoryType = fc.categoryType
        GROUP BY cc.categoryType
      )
      SELECT 
        categoryType,
        deck_count,
        total_flashcards
      FROM flashcard_counts
      ORDER BY deck_count DESC
    `;
    // Parameters: [userID for decks in deck_categories, userID for AIDecks in deck_categories (if hasAIDecks),
    //              userID for decks in flashcard_counts, userID for flashcards, 
    //              userID for AIDecks in flashcard_counts, userID for AIFlashcards]
    const params = hasAIDecks 
      ? [userID, userID, userID, userID, userID, userID] 
      : [userID, userID, userID];
    const result = await db.getAllAsync(sql, params);

    // Define colors for each type
    const typeColors = {
      'study': '#5CC8BE',
      'technical': '#D7191C',
      'case study': '#C3EB79',
      'behavioral': '#FDAE61',
      'brainteasers': '#357AF6',
      'others': '#AF52DE'
    };

    // Calculate totals
    const totalDecks = result.reduce((sum: number, row: any) => sum + row.deck_count, 0);
    const totalFlashcards = result.reduce((sum: number, row: any) => sum + row.total_flashcards, 0);

    // Create decks data
    const decksData: BreakdownDatum[] = result.map((row: any) => ({
      label: row.categoryType.charAt(0).toUpperCase() + row.categoryType.slice(1),
      value: row.deck_count,
      percent: totalDecks > 0 ? Math.round((row.deck_count / totalDecks) * 100) : 0,
      color: typeColors[row.categoryType as keyof typeof typeColors] || '#98CE7F'
    }));

    // Create flashcards data
    const flashcardsData: BreakdownDatum[] = result.map((row: any) => ({
      label: row.categoryType.charAt(0).toUpperCase() + row.categoryType.slice(1),
      value: row.total_flashcards,
      percent: totalFlashcards > 0 ? Math.round((row.total_flashcards / totalFlashcards) * 100) : 0,
      color: typeColors[row.categoryType as keyof typeof typeColors] || '#98CE7F'
    }));

    return { decksData, flashcardsData };
  } catch (error) {
    console.error('Error fetching breakdown data:', error);
    // Return empty data if there's an error
    return { decksData: [], flashcardsData: [] };
  }
}

export async function updateDeckName(deckId: number, newDeckName: string): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.execAsync(`
      UPDATE decks 
      SET deckName = '${newDeckName.replace(/'/g, "''")}', lastModifiedDate = '${new Date().toISOString()}'
      WHERE deckID = ${deckId} AND userID = '${userID}'
    `);
    return true;
  } catch (error) {
    console.error('Error updating deck name:', error);
    return false;
  }
}

export async function updateDeckFavoriteStatus(deckId: number, isFavorited: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const newFavoritedValue = isFavorited ? 1 : 0;
    
    await db.execAsync(`
      UPDATE decks 
      SET isFavorited = ${newFavoritedValue}
      WHERE deckID = ${deckId} AND userID = '${userID}'
    `);
    return true;
  } catch (error) {
    console.error('Error updating deck favorite status:', error);
    return false;
  }
}

export async function getAIDeckInfo(deckId: number): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
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
      WHERE d.deckID = ? AND d.userID = ?
      GROUP BY d.deckID
    `, [deckId, userID]);

    if (!result) {
      return null;
    }

    // Calculate progress for AI deck
    const progress = await getAIDeckProgress(deckId);
    return { ...result, progress, flashcardCount: (result as any).flashcardCount };
  } catch (error) {
    console.error('Error fetching AI deck info:', error);
    return null;
  }
}

export async function getAIDeckProgress(deckId: number): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    // First, check if the AI deck itself has lastStudiedDate or lastQuizzedDate
    const deckResult = await db.getFirstAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM AIDecks
      WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!deckResult) {
      return 0;
    }

    const deck = deckResult as { lastStudiedDate: string | null; lastQuizzedDate: string | null };
    
    // If either lastStudiedDate or lastQuizzedDate is not null, return 100%
    if (deck.lastStudiedDate !== null || deck.lastQuizzedDate !== null) {
      return 100;
    }

    // If both are null, calculate percentage based on AI flashcards
    const progressResult = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as totalFlashcards,
        COUNT(CASE WHEN lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL THEN 1 END) as completedFlashcards
      FROM AIFlashcards
      WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!progressResult) {
      return 0;
    }

    const progress = progressResult as { totalFlashcards: number; completedFlashcards: number };
    
    if (progress.totalFlashcards === 0) {
      return 0;
    }

    return Math.round((progress.completedFlashcards / progress.totalFlashcards) * 100);
  } catch (error) {
    console.error('Error calculating AI deck progress:', error);
    return 0;
  }
}

export async function getAIDeckGrade(deckId: number): Promise<DeckGrade | null> {
  try {
    const userID = await getCurrentUserID();
    // Get all attempted AI flashcards (those with lastStudiedDate or lastQuizzedDate not null)
    // Includes all flashcards that have been studied OR quizzed at least once (based on latest attempt date)
    // Uses each flashcard's current difficultyRating which reflects the latest attempt's difficulty
    const result = await db.getAllAsync(`
      SELECT 
        difficultyRating,
        lastStudiedDate,
        lastQuizzedDate,
        CASE 
          WHEN lastStudiedDate IS NULL THEN lastQuizzedDate
          WHEN lastQuizzedDate IS NULL THEN lastStudiedDate
          WHEN lastStudiedDate > lastQuizzedDate THEN lastStudiedDate
          ELSE lastQuizzedDate
        END as latestAttemptDate
      FROM AIFlashcards
      WHERE deckID = ?
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
        AND userID = ?
    `, [deckId, userID]);

    if (!result || result.length === 0) {
      // No attempted flashcards, return null
      return null;
    }

    const flashcards = result as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      latestAttemptDate: string | null;
    }>;

    // Extract difficulty ratings from all attempted flashcards
    // Each flashcard's current difficultyRating is used, which reflects the state after the most recent attempt
    // (whether that was a study or quiz session, whichever date is more recent)
    const ratings = flashcards.map(flashcard => flashcard.difficultyRating);

    // Get total number of AI flashcards for this deck
    const totalResult = await db.getFirstAsync(`
      SELECT COUNT(*) as total
      FROM AIFlashcards
      WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    const totalFlashcards = (totalResult as { total: number }).total;

    // Calculate weighted score using the same logic as regular decks
    const weights = {
      'Again': 0,     // 0% - needs to learn
      'Hard': 0.4,    // 40% - partially learned
      'Good': 0.8,    // 80% - well learned
      'Easy': 1.0     // 100% - mastered
    };
    
    const totalWeight = ratings.reduce((sum, rating) => {
      return sum + (weights[rating as keyof typeof weights] || 0);
    }, 0);
    
    const score = (totalWeight / ratings.length) * 100;
    
    const getMasteryLevel = (score: number): string => {
      if (score >= 90) return 'Expert';
      if (score >= 75) return 'Proficient';
      if (score >= 60) return 'Developing';
      if (score >= 40) return 'Beginner';
      return 'Needs Practice';
    };

    const getBreakdown = (ratings: string[]) => {
      const counts = {
        'Again': 0, 'Hard': 0, 'Good': 0, 'Easy': 0
      };
      
      ratings.forEach(rating => {
        if (rating in counts) {
          counts[rating as keyof typeof counts]++;
        }
      });
      
      return counts;
    };

    const grade = {
      score: Math.round(score),
      masteryLevel: getMasteryLevel(score),
      breakdown: getBreakdown(ratings),
      totalAttempted: ratings.length,
      totalFlashcards: totalFlashcards
    };

    return grade;
  } catch (error) {
    console.error('Error calculating AI deck grade:', error);
    return null;
  }
}

// Function to get current difficulty breakdown directly from flashcards (always reflects current state)
export async function getDeckBreakdown(deckId: number, isAIDeck: boolean): Promise<{
  Again: number;
  Hard: number;
  Good: number;
  Easy: number;
} | null> {
  try {
    const userID = await getCurrentUserID();
    let ratings: string[] = [];
    
    if (isAIDeck) {
      // Get current difficulty ratings from AI flashcards
      const result = await db.getAllAsync(`
        SELECT difficultyRating
        FROM AIFlashcards
        WHERE deckID = ?
          AND difficultyRating != 'None'
          AND userID = ?
      `, [deckId, userID]);

      if (!result || result.length === 0) {
        return null;
      }

      const flashcards = result as Array<{ difficultyRating: string }>;
      ratings = flashcards.map(flashcard => flashcard.difficultyRating);
    } else {
      // Get current difficulty ratings from regular flashcards (including AI flashcards if deck contains them)
      const result = await db.getAllAsync(`
        SELECT 
          difficultyRating,
          answerType,
          isMcqAnswerRight
        FROM (
          SELECT difficultyRating, answerType, isMcqAnswerRight
          FROM flashcards
          WHERE deckID = ?
            AND difficultyRating != 'None'
            AND userID = ?
          UNION ALL
          SELECT difficultyRating, answerType, isMcqAnswerRight
          FROM AIFlashcards
          WHERE deckID = ?
            AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
            AND difficultyRating != 'None'
            AND userID = ?
        )
      `, [deckId, userID, deckId, userID]);

      if (!result || result.length === 0) {
        return null;
      }

      const flashcards = result as Array<{
        difficultyRating: string;
        answerType: string;
        isMcqAnswerRight: number | null;
      }>;

      // For MCQ flashcards, use their current difficultyRating (not recalculating based on isMcqAnswerRight)
      // This ensures we always reflect the current updated difficulty state
      ratings = flashcards.map(flashcard => flashcard.difficultyRating);
    }

    // Calculate breakdown from current difficulty ratings
    const breakdown = {
      Again: 0,
      Hard: 0,
      Good: 0,
      Easy: 0
    };

    ratings.forEach(rating => {
      if (rating in breakdown) {
        breakdown[rating as keyof typeof breakdown]++;
      }
    });

    return breakdown;
  } catch (error) {
    console.error('Error getting deck breakdown:', error);
    return null;
  }
}

export async function getAIDeckAverageTime(deckId: number): Promise<number | null> {
  try {
    const userID = await getCurrentUserID();
    // Get all attempted AI flashcards (those with lastStudiedDate or lastQuizzedDate not null)
    // Includes all flashcards that have been studied OR quizzed at least once (based on latest attempt date)
    // Uses each flashcard's current timeTaken which reflects the time from the most recent attempt
    // (whether that was a study or quiz session, whichever date is more recent)
    const result = await db.getFirstAsync(`
      SELECT 
        AVG(timeTaken) as averageTime,
        COUNT(*) as attemptedCount
      FROM (
        SELECT 
          timeTaken,
          CASE 
            WHEN lastStudiedDate IS NULL THEN lastQuizzedDate
            WHEN lastQuizzedDate IS NULL THEN lastStudiedDate
            WHEN lastStudiedDate > lastQuizzedDate THEN lastStudiedDate
            ELSE lastQuizzedDate
          END as latestAttemptDate
        FROM AIFlashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND timeTaken IS NOT NULL
          AND userID = ?
      )
    `, [deckId, userID]);

    if (!result) {
      return null;
    }

    const data = result as { averageTime: number | null; attemptedCount: number };
    
    // Return null if no attempted flashcards or no time data
    if (data.attemptedCount === 0 || data.averageTime === null) {
      return null;
    }

    // Return the average time rounded to the nearest integer
    return Math.round(data.averageTime);
  } catch (error) {
    console.error('Error calculating AI deck average time:', error);
    return null;
  }
}

export async function checkFlashcardAttemptStatus(deckId: number, isAIDeck: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    // Check if any flashcards have been attempted
    const tableName = isAIDeck ? 'AIFlashcards' : 'flashcards';
    const idColumn = isAIDeck ? 'deckID' : 'deckID';

    const result = await db.getFirstAsync(`
      SELECT COUNT(*) as attemptedCount
      FROM ${tableName}
      WHERE ${idColumn} = ?
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND userID = ?
    `, [deckId, userID]);

    if (!result) {
      return false;
    }

    const data = result as { attemptedCount: number };
    return data.attemptedCount > 0;
  } catch (error) {
    console.error('Error checking flashcard attempt status:', error);
    return false;
  }
}

export async function checkAIDeckSavedStatus(deckId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    // Get the AI deck name
    const aiDeckResult = await db.getFirstAsync(`
      SELECT deckName
      FROM AIDecks
      WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!aiDeckResult) {
      return false;
    }

    const aiDeck = aiDeckResult as { deckName: string };

    // Check if there's a matching deck in the regular decks table
    const savedDeckResult = await db.getFirstAsync(`
      SELECT deckID
      FROM decks
      WHERE deckName = ?
        AND isAIDeck = 1
        AND userID = ?
    `, [aiDeck.deckName, userID]);

    return !!savedDeckResult;
  } catch (error) {
    console.error('Error checking AI deck saved status:', error);
    return false;
  }
}

export async function createNewFavoritedFolder(): Promise<{ success: boolean; newFolder?: Folder }> {
  try {
    const userID = await getCurrentUserID();
    
    // Check for existing folders that start with "New Folder"
    const existingNewFoldersResult = await db.getAllAsync(`
      SELECT folderName
      FROM folders
      WHERE folderName LIKE 'New Folder%' AND userID = ?
      ORDER BY folderName
    `, [userID]);
    
    const existingNewFolders = existingNewFoldersResult as Array<{ folderName: string }>;
    
    let newFolderName: string;
    
    if (existingNewFolders.length === 0) {
      // No existing "New Folder" folders, use just "New Folder"
      newFolderName = 'New Folder';
    } else {
      // Find the highest number used in existing "New Folder" names
      const numbers = existingNewFolders.map(folder => {
        const match = folder.folderName.match(/New Folder(?: (\d+))?$/);
        if (match) {
          // If there's a number, use it; otherwise, it's "New Folder" (no number)
          return match[1] ? parseInt(match[1]) : 0;
        }
        return 0;
      });
      
      const maxNumber = Math.max(...numbers);
      const nextNumber = maxNumber + 1;
      newFolderName = `New Folder ${nextNumber}`;
    }
    
    // Insert the new folder into the database with isFavorited = 1
    await db.execAsync(`
      INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited, userID)
      VALUES ('${newFolderName}', '${new Date().toISOString()}', '${new Date().toISOString()}', 1, '${userID}')
    `);
    
    // Get the ID of the newly inserted folder
    const newFolderResult = await db.getFirstAsync(`
      SELECT folderID, folderName, dateAdded, lastModifiedDate, isFavorited
      FROM folders 
      WHERE folderName = '${newFolderName}' AND userID = ?
      ORDER BY folderID DESC
      LIMIT 1
    `, [userID]);
    
    if (newFolderResult) {
      const newFolder = newFolderResult as {
        folderID: number;
        folderName: string;
        dateAdded: string;
        lastModifiedDate: string;
        isFavorited: number;
      };
      
      // Create the new folder object with deckCount set to 0
      const newFolderObject: Folder = {
        ...newFolder,
        deckCount: 0
      };
      
      return { success: true, newFolder: newFolderObject };
    } else {
      console.error('Failed to retrieve the newly created folder');
      return { success: false };
    }
  } catch (error) {
    console.error('Error creating new favorited folder:', error);
    return { success: false };
  }
}

export async function unfavoriteMultipleDecks(deckIds: number[]): Promise<boolean> {
  try {
    if (deckIds.length === 0) {
      return true;
    }
    
    const userID = await getCurrentUserID();
    const deckIdsString = deckIds.join(',');
    
    await db.execAsync(`
      UPDATE decks 
      SET isFavorited = 0
      WHERE deckID IN (${deckIdsString}) AND userID = '${userID}'
    `);
    
    return true;
  } catch (error) {
    console.error('Error unfavoriting decks:', error);
    return false;
  }
}

export async function unfavoriteMultipleFolders(folderIds: number[]): Promise<boolean> {
  try {
    if (folderIds.length === 0) {
      return true;
    }
    
    const userID = await getCurrentUserID();
    const folderIdsString = folderIds.join(',');
    
    await db.execAsync(`
      UPDATE folders 
      SET isFavorited = 0
      WHERE folderID IN (${folderIdsString}) AND userID = '${userID}'
    `);
    
    return true;
  } catch (error) {
    console.error('Error unfavoriting folders:', error);
    return false;
  }
}

export async function updateFolderFavoriteStatus(folderId: number, isFavorited: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const newFavoritedValue = isFavorited ? 1 : 0;
    
    await db.execAsync(`
      UPDATE folders 
      SET isFavorited = ${newFavoritedValue}
      WHERE folderID = ${folderId} AND userID = '${userID}'
    `);
    return true;
  } catch (error) {
    console.error('Error updating folder favorite status:', error);
    return false;
  }
}

export async function checkDatabaseReady(): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    // Try a simple query to check if database is ready
    const result = await db.getAllAsync('SELECT COUNT(*) as count FROM decks WHERE userID = ?', [userID]);
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkFoldersDatabaseReady(): Promise<{ isReady: boolean; foldersCount: number }> {
  try {
    const userID = await getCurrentUserID();
    // Try a simple query to check if database is ready
    const result = await db.getAllAsync('SELECT COUNT(*) as count FROM folders WHERE userID = ?', [userID]);
    const foldersCount = (result[0] as any)?.count || 0;
    return { isReady: true, foldersCount };
  } catch (error) {
    return { isReady: false, foldersCount: 0 };
  }
}

export async function createNewFolder(): Promise<{ success: boolean; newFolder?: Folder }> {
  try {
    const userID = await getCurrentUserID();
    
    // Check for existing folders that start with "New Folder"
    const existingNewFoldersResult = await db.getAllAsync(`
      SELECT folderName
      FROM folders
      WHERE folderName LIKE 'New Folder%' AND userID = ?
      ORDER BY folderName
    `, [userID]);
    
    const existingNewFolders = existingNewFoldersResult as Array<{ folderName: string }>;
    
    let newFolderName: string;
    
    if (existingNewFolders.length === 0) {
      // No existing "New Folder" folders, use just "New Folder"
      newFolderName = 'New Folder';
    } else {
      // Find the highest number used in existing "New Folder" names
      const numbers = existingNewFolders.map(folder => {
        const match = folder.folderName.match(/New Folder(?: (\d+))?$/);
        if (match) {
          // If there's a number, use it; otherwise, it's "New Folder" (no number)
          return match[1] ? parseInt(match[1]) : 0;
        }
        return 0;
      });
      
      const maxNumber = Math.max(...numbers);
      const nextNumber = maxNumber + 1;
      newFolderName = `New Folder ${nextNumber}`;
    }
    
    // Insert the new folder into the database
    await db.execAsync(`
      INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited, userID)
      VALUES ('${newFolderName}', '${new Date().toISOString()}', '${new Date().toISOString()}', 0, '${userID}')
    `);
    
    // Get the ID of the newly inserted folder
    const newFolderResult = await db.getFirstAsync(`
      SELECT folderID, folderName, dateAdded, lastModifiedDate, isFavorited
      FROM folders 
      WHERE folderName = '${newFolderName}' AND userID = ?
      ORDER BY folderID DESC
      LIMIT 1
    `, [userID]);
    
    if (newFolderResult) {
      const newFolder = newFolderResult as {
        folderID: number;
        folderName: string;
        dateAdded: string;
        lastModifiedDate: string;
        isFavorited: number;
      };
      
      // Create the new folder object with deckCount set to 0
      const newFolderObject: Folder = {
        ...newFolder,
        deckCount: 0
      };
      
      return { success: true, newFolder: newFolderObject };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false };
  }
}

export async function getDeckFolderIds(deckId: number): Promise<number[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT folderIDs FROM decks WHERE deckID = ? AND userID = ?
    `, [deckId, userID]);

    if (!result) {
      return [];
    }

    const deckData = result as { folderIDs: string | null };
    
    if (!deckData.folderIDs) {
      return [];
    }

    try {
      return JSON.parse(deckData.folderIDs);
    } catch (error) {
      console.error('Error parsing folderIDs:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting deck folder IDs:', error);
    return [];
  }
}

export async function updateDeckFolderIds(deckId: number, folderIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const folderIdsString = JSON.stringify(folderIds);
    
    await db.execAsync(`
      UPDATE decks 
      SET folderIDs = '${folderIdsString}'
      WHERE deckID = ${deckId} AND userID = '${userID}'
    `);
    
    return true;
  } catch (error) {
    console.error('Error updating deck folder IDs:', error);
    return false;
  }
}

export async function updateFolderLastModifiedDate(folderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    await db.execAsync(`
      UPDATE folders 
      SET lastModifiedDate = '${currentDate}'
      WHERE folderID = ${folderId} AND userID = '${userID}'
    `);
    
    return true;
  } catch (error) {
    console.error('Error updating folder last modified date:', error);
    return false;
  }
}

export async function checkDecksAlreadyInFolders(deckIds: number[], folderIds: number[]): Promise<boolean> {
  try {
    for (const deckId of deckIds) {
      const currentFolderIds = await getDeckFolderIds(deckId);
      const hasOverlap = folderIds.some(folderId => currentFolderIds.includes(folderId));
      if (hasOverlap) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking if decks are already in folders:', error);
    return false;
  }
}

export async function addDecksToFolders(deckIds: number[], folderIds: number[]): Promise<boolean> {
  try {
    for (const deckId of deckIds) {
      const currentFolderIds = await getDeckFolderIds(deckId);
      const newFolderIds = [...new Set([...currentFolderIds, ...folderIds])];
      const success = await updateDeckFolderIds(deckId, newFolderIds);
      if (!success) {
        return false;
      }
    }
    
    // Update lastModifiedDate for folders that received new decks
    for (const folderId of folderIds) {
      await updateFolderLastModifiedDate(folderId);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding decks to folders:', error);
    return false;
  }
}

export async function moveDecksToFolders(deckIds: number[], targetFolderIds: number[], sourceFolderId: number): Promise<boolean> {
  try {
    for (const deckId of deckIds) {
      const currentFolderIds = await getDeckFolderIds(deckId);
      
      // Remove the source folder ID from the deck's folders
      const filteredFolderIds = currentFolderIds.filter(id => id !== sourceFolderId);
      
      // Add the target folder IDs (avoid duplicates)
      const newFolderIds = [...new Set([...filteredFolderIds, ...targetFolderIds])];
      
      const success = await updateDeckFolderIds(deckId, newFolderIds);
      if (!success) {
        return false;
      }
    }
    
    // Update lastModifiedDate for folders that received moved decks
    for (const folderId of targetFolderIds) {
      await updateFolderLastModifiedDate(folderId);
    }
    
    return true;
  } catch (error) {
    console.error('Error moving decks to folders:', error);
    return false;
  }
}

// Sort preferences functions
export async function saveSortPreferences(field: 'name' | 'dateAdded' | 'lastModified', direction: 'asc' | 'desc'): Promise<void> {
  try {
    const userID = await getCurrentUserID();
    const userSpecificFieldKey = `decks_sort_field_${userID}`;
    const userSpecificDirectionKey = `decks_sort_direction_${userID}`;
    
    await AsyncStorage.multiSet([
      [userSpecificFieldKey, field],
      [userSpecificDirectionKey, direction]
    ]);
  } catch (error) {
    console.error('Error saving sort preferences:', error);
  }
}

export async function loadSortPreferences(): Promise<{ field: 'name' | 'dateAdded' | 'lastModified'; direction: 'asc' | 'desc' } | null> {
  try {
    const userID = await getCurrentUserID();
    const userSpecificFieldKey = `decks_sort_field_${userID}`;
    const userSpecificDirectionKey = `decks_sort_direction_${userID}`;
    
    const [savedField, savedDirection] = await AsyncStorage.multiGet([
      userSpecificFieldKey,
      userSpecificDirectionKey
    ]);
    
    if (savedField[1] && savedDirection[1]) {
      return {
        field: savedField[1] as 'name' | 'dateAdded' | 'lastModified',
        direction: savedDirection[1] as 'asc' | 'desc'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error loading sort preferences:', error);
    return null;
  }
}

// Function to update folder name
export async function getFolderById(folderId: number): Promise<{ folderName: string } | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT folderName
      FROM folders 
      WHERE folderID = ? AND userID = ?
    `, [folderId, userID]);
    
    return result as { folderName: string } | null;
  } catch (error) {
    console.error('Error fetching folder by ID:', error);
    return null;
  }
}

export async function updateFolderName(folderId: number, newFolderName: string): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.execAsync(`
      UPDATE folders 
      SET folderName = '${newFolderName}', lastModifiedDate = '${new Date().toISOString()}'
      WHERE folderID = ${folderId} AND userID = '${userID}'
    `);
    return true;
  } catch (error) {
    console.error('Error updating folder name:', error);
    return false;
  }
}

// Function to remove decks from folder
export async function removeDecksFromFolder(deckIds: number[], folderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    for (const deckId of deckIds) {
      // Get the current deck's folderIDs
      const deckResult = await db.getFirstAsync(`
        SELECT folderIDs FROM decks WHERE deckID = ? AND userID = ?
      `, [deckId, userID]);
      
      if (deckResult) {
        const deck = deckResult as { folderIDs: string | null };
        let folderIds: number[] = [];
        
        // Parse existing folderIDs if they exist
        if (deck.folderIDs) {
          try {
            folderIds = JSON.parse(deck.folderIDs);
          } catch (error) {
            console.error('Error parsing folderIDs for deck', deckId, error);
            folderIds = [];
          }
        }
        
        // Remove the current folderID from the array
        const updatedFolderIds = folderIds.filter(id => id !== folderId);
        
        // Update the deck with the new folderIDs
        await db.runAsync(`
          UPDATE decks 
          SET folderIDs = ?, lastModifiedDate = '${new Date().toISOString()}'
          WHERE deckID = ? AND userID = ?
        `, [JSON.stringify(updatedFolderIds), deckId, userID]);
      }
    }
    
    // Update the folder's lastModifiedDate since decks were removed
    await db.execAsync(`
      UPDATE folders 
      SET lastModifiedDate = '${new Date().toISOString()}'
      WHERE folderID = ${folderId} AND userID = '${userID}'
    `);
    
    return true;
  } catch (error) {
    console.error('Error removing decks from folder:', error);
    return false;
  }
}

// Function to update deck favorite status
export async function updateDeckFavoriteStatusInFolder(deckId: number, isFavorited: boolean): Promise<boolean> {
  try {
    const newFavoritedValue = isFavorited ? 1 : 0;
    const userID = await getCurrentUserID();
    
    // Update database
    await db.execAsync(`
      UPDATE decks 
      SET isFavorited = ${newFavoritedValue}
      WHERE deckID = ${deckId} AND userID = '${userID}'
    `);
    
    return true;
  } catch (error) {
    console.error('Error updating favorite status:', error);
    return false;
  }
}

// Function to load flashcards from database
export async function loadFlashcardsFromDatabase(deckId: string, isAIDeck: string): Promise<Flashcard[]> {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    const result = await db.getAllAsync(`
      SELECT 
        flashcardID,
        deckID,
        difficultyRating,
        cognitiveQnType,
        isFavorited,
        questionType,
        questionText,
        questionBlob,
        answerType,
        answerText,
        answerMCQ,
        answerBlob,
        timeTaken,
        isMcqAnswerRight,
        lastStudiedDate,
        lastQuizzedDate
      FROM ${tableName}
      WHERE deckID = ? AND userID = ?
      ORDER BY 
        CASE difficultyRating
          WHEN 'None' THEN 1
          WHEN 'Easy' THEN 2
          WHEN 'Good' THEN 3
          WHEN 'Hard' THEN 4
          WHEN 'Again' THEN 5
          ELSE 6
        END,
        flashcardID ASC
    `, [parseInt(deckId), userID]);

    if (!result) {
      return [];
    }

    return result as Flashcard[];
  } catch (error) {
    console.error('Error loading flashcards from database:', error);
    return [];
  }
}

// Function to load topics from database
export async function loadTopicsFromDatabase(deckId: string, isAIDeck: string): Promise<string[]> {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
    
    const result = await db.getFirstAsync(`
      SELECT deckType, studyTopicsSubtopics, interviewTopics
      FROM ${tableName}
      WHERE deckID = ? AND userID = ?
    `, [parseInt(deckId), userID]);

    if (!result) {
      return [];
    }

    const deck = result as { deckType: string; studyTopicsSubtopics: string | null; interviewTopics: string | null };
    
    let topicsField: string | null = null;
    
    if (deck.deckType === 'study') {
      topicsField = deck.studyTopicsSubtopics;
    } else if (deck.deckType === 'interview') {
      topicsField = deck.interviewTopics;
    }
    
    if (!topicsField) {
      return [];
    }
    
    console.log('🔍 Topics field value:', topicsField);
    console.log('🔍 Topics field type:', typeof topicsField);
    console.log('🔍 First character:', topicsField.charAt(0));
    
    // Check if it's already a JSON array or a comma-separated string
    if (topicsField.startsWith('[') && topicsField.endsWith(']')) {
      // It's a JSON array, parse it
      return safeParseJSON(topicsField, []);
    } else {
      // It's a comma-separated string, split it
      console.log('📝 Treating as comma-separated string');
      return topicsField.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    }
  } catch (error) {
    console.error('Error loading topics from database:', error);
    return [];
  }
}

// Function to calculate question type counts from flashcards data
export function calculateQuestionTypeCounts(flashcards: Flashcard[]): { title: string; count: number }[] {
  const counts: { [key: string]: number } = {};
  
  flashcards.forEach(flashcard => {
    const cognitiveQnType = flashcard.cognitiveQnType;
    counts[cognitiveQnType] = (counts[cognitiveQnType] || 0) + 1;
  });
  
  // Convert to array and sort by count (descending)
  return Object.entries(counts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);
}

// Function to toggle favorite status of a flashcard
export async function toggleFlashcardFavorite(flashcardIdx: number, flashcards: Flashcard[], isAIDeck: string): Promise<{ success: boolean; updatedFlashcards: Flashcard[] }> {
  try {
    const flashcard = flashcards[flashcardIdx];
    if (!flashcard) {
      return { success: false, updatedFlashcards: flashcards };
    }

    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    const newFavoriteStatus = flashcard.isFavorited === 1 ? 0 : 1;

    // Update database
    await db.runAsync(`
      UPDATE ${tableName}
      SET isFavorited = ?
      WHERE flashcardID = ? AND userID = ?
    `, [newFavoriteStatus, flashcard.flashcardID, userID]);

    // Update local state
    const updatedFlashcards = flashcards.map((card, idx) => 
      idx === flashcardIdx 
        ? { ...card, isFavorited: newFavoriteStatus }
        : card
    );

    return { success: true, updatedFlashcards };
  } catch (error) {
    console.error('Error toggling flashcard favorite status:', error);
    return { success: false, updatedFlashcards: flashcards };
  }
}

// Function to delete selected flashcards
export async function deleteSelectedFlashcards(selectedCardIndexes: number[], flashcards: Flashcard[], deckId: string, isAIDeck: string): Promise<{ success: boolean; updatedFlashcards: Flashcard[] }> {
  try {
    if (selectedCardIndexes.length === 0) {
      return { success: true, updatedFlashcards: flashcards };
    }

    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
    
    // Get the flashcard IDs to delete
    const flashcardIdsToDelete = selectedCardIndexes.map(idx => flashcards[idx].flashcardID);
    
    // Delete from database
    const placeholders = flashcardIdsToDelete.map(() => '?').join(',');
    await db.runAsync(`
      DELETE FROM ${tableName}
      WHERE flashcardID IN (${placeholders}) AND userID = ?
    `, [...flashcardIdsToDelete, userID]);

    // Update the deck's lastModifiedDate since flashcards were deleted
    await db.runAsync(`
      UPDATE ${deckTableName}
      SET lastModifiedDate = '${new Date().toISOString()}'
      WHERE deckID = ? AND userID = ?
    `, [parseInt(deckId), userID]);

    // Update local state by removing deleted flashcards
    const updatedFlashcards = flashcards.filter((_, idx) => !selectedCardIndexes.includes(idx));

    
    return { success: true, updatedFlashcards };
  } catch (error) {
    console.error('Error deleting flashcards:', error);
    return { success: false, updatedFlashcards: flashcards };
  }
}

// Deck Settings Interfaces
export interface DeckSettings {
  autoDecksEnabled: boolean;
  clozeQuestionsEnabled: boolean;
  mcqQuestionsEnabled: boolean;
  voiceRecordedAnswersEnabled: boolean;
  voiceRecordedTimerEnabled: boolean;
  voiceRecordedTimer: { min: number; sec: number };
  halfwayCheckpointEnabled: boolean;
  difficultyTimes: Array<{ min: number; sec: number }>;
}

export interface DeckSettingsData {
  autoDecksEnabled: number;
  clozeQuestionsEnabled: number;
  mcqQuestionsEnabled: number;
  voiceRecordedQuestionsEnabled: number;
  voiceRecordedTimer: number;
  halfwayCheckpoint: number;
  defaultTimer: number;
  againTimer: number;
  hardTimer: number;
  goodTimer: number;
  easyTimer: number;
}

// Helper function to convert seconds to time format
function convertSecondsToTime(seconds: number): { min: number; sec: number } {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return { min, sec };
}

// Helper function to convert time format to seconds
function convertTimeToSeconds(time: { min: number; sec: number }): number {
  return time.min * 60 + time.sec;
}

// Load deck settings from database
export async function loadDeckSettings(): Promise<DeckSettings> {
  try {
    const userID = await getCurrentUserID();
    if (!userID) {
      throw new Error('No user ID found');
    }

    const result = await db.getFirstAsync(`
      SELECT 
        autoDecksEnabled,
        clozeQuestionsEnabled,
        mcqQuestionsEnabled,
        voiceRecordedQuestionsEnabled,
        voiceRecordedTimer,
        halfwayCheckpoint,
        defaultTimer,
        againTimer,
        hardTimer,
        goodTimer,
        easyTimer
      FROM users WHERE userID = ?
    `, [userID]);
    
    if (result) {
      const userData = result as DeckSettingsData;

      // Convert timer values from seconds to {min, sec} format
      const loadedDefaultTimer = convertSecondsToTime(userData.defaultTimer);
      const loadedAgainTimer = convertSecondsToTime(userData.againTimer);
      const loadedHardTimer = convertSecondsToTime(userData.hardTimer);
      const loadedGoodTimer = convertSecondsToTime(userData.goodTimer);
      const loadedEasyTimer = convertSecondsToTime(userData.easyTimer);
      const loadedVoiceRecordedTimer = convertSecondsToTime(userData.voiceRecordedTimer);

      return {
        autoDecksEnabled: userData.autoDecksEnabled === 1,
        clozeQuestionsEnabled: userData.clozeQuestionsEnabled === 1,
        mcqQuestionsEnabled: userData.mcqQuestionsEnabled === 1,
        voiceRecordedAnswersEnabled: userData.voiceRecordedQuestionsEnabled === 1,
        voiceRecordedTimerEnabled: userData.voiceRecordedQuestionsEnabled === 1,
        voiceRecordedTimer: loadedVoiceRecordedTimer,
        halfwayCheckpointEnabled: userData.halfwayCheckpoint === 1,
        difficultyTimes: [
          loadedDefaultTimer,
          loadedAgainTimer,
          loadedHardTimer,
          loadedGoodTimer,
          loadedEasyTimer,
        ],
      };
    }

    // Return default settings if no data found
    return {
      autoDecksEnabled: true,
      clozeQuestionsEnabled: true,
      mcqQuestionsEnabled: true,
      voiceRecordedAnswersEnabled: true,
      voiceRecordedTimerEnabled: true,
      voiceRecordedTimer: { min: 2, sec: 0 },
      halfwayCheckpointEnabled: true,
      difficultyTimes: [
        { min: 0, sec: 20 },
        { min: 1, sec: 0 },
        { min: 0, sec: 45 },
        { min: 0, sec: 30 },
        { min: 0, sec: 15 },
      ],
    };
  } catch (error) {
    console.error('Error loading deck settings:', error);
    // Return default settings if loading fails
    return {
      autoDecksEnabled: true,
      clozeQuestionsEnabled: true,
      mcqQuestionsEnabled: true,
      voiceRecordedAnswersEnabled: true,
      voiceRecordedTimerEnabled: true,
      voiceRecordedTimer: { min: 2, sec: 0 },
      halfwayCheckpointEnabled: true,
      difficultyTimes: [
        { min: 0, sec: 20 },
        { min: 1, sec: 0 },
        { min: 0, sec: 45 },
        { min: 0, sec: 30 },
        { min: 0, sec: 15 },
      ],
    };
  }
}

// Save deck settings to database
export async function saveDeckSettings(settings: DeckSettings): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    if (!userID) {
      throw new Error('No user ID found');
    }

    await db.runAsync(`
      UPDATE users 
      SET 
        autoDecksEnabled = ?,
        clozeQuestionsEnabled = ?,
        mcqQuestionsEnabled = ?,
        voiceRecordedQuestionsEnabled = ?,
        voiceRecordedTimer = ?,
        halfwayCheckpoint = ?,
        defaultTimer = ?,
        againTimer = ?,
        hardTimer = ?,
        goodTimer = ?,
        easyTimer = ?
      WHERE userID = ?
    `, [
      settings.autoDecksEnabled ? 1 : 0,
      settings.clozeQuestionsEnabled ? 1 : 0,
      settings.mcqQuestionsEnabled ? 1 : 0,
      settings.voiceRecordedAnswersEnabled ? 1 : 0,
      convertTimeToSeconds(settings.voiceRecordedTimer),
      settings.halfwayCheckpointEnabled ? 1 : 0,
      convertTimeToSeconds(settings.difficultyTimes[0]),
      convertTimeToSeconds(settings.difficultyTimes[1]),
      convertTimeToSeconds(settings.difficultyTimes[2]),
      convertTimeToSeconds(settings.difficultyTimes[3]),
      convertTimeToSeconds(settings.difficultyTimes[4]),
      userID
    ]);
    
    return true;
  } catch (error) {
    console.error('Error saving deck settings:', error);
    return false;
  }
}

// Reset deck settings to defaults
export async function resetDeckSettingsToDefaults(): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    if (!userID) {
      throw new Error('No user ID found');
    }

    const defaultDifficultyTimes = [
      { min: 0, sec: 20 },
      { min: 1, sec: 0 },
      { min: 0, sec: 45 },
      { min: 0, sec: 30 },
      { min: 0, sec: 15 },
    ];

    await db.runAsync(`
      UPDATE users 
      SET 
        autoDecksEnabled = 1,
        clozeQuestionsEnabled = 1,
        mcqQuestionsEnabled = 1,
        voiceRecordedQuestionsEnabled = 1,
        voiceRecordedTimer = ?,
        halfwayCheckpoint = 1,
        defaultTimer = ?,
        againTimer = ?,
        hardTimer = ?,
        goodTimer = ?,
        easyTimer = ?
      WHERE userID = ?
    `, [
      convertTimeToSeconds({ min: 2, sec: 0 }),
      convertTimeToSeconds(defaultDifficultyTimes[0]),
      convertTimeToSeconds(defaultDifficultyTimes[1]),
      convertTimeToSeconds(defaultDifficultyTimes[2]),
      convertTimeToSeconds(defaultDifficultyTimes[3]),
      convertTimeToSeconds(defaultDifficultyTimes[4]),
      userID
    ]);
    
    return true;
  } catch (error) {
    console.error('Error resetting deck settings:', error);
    return false;
  }
}

// Flashcard View Database Functions
// =================================

// Interface for database flashcard
export interface DatabaseFlashcard {
  flashcardID: number;
  deckID: number;
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText: string | null;
  questionBlob: string | null; // hex string from SQLite
  answerType: string;
  answerText: string | null;
  answerMCQ: string | null;
  answerBlob: string | null; // hex string from SQLite
  timeTaken: number | null;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}

// Interface for transformed flashcard (matching dummy data format)
export interface TransformedFlashcard {
  flashcardID: number;
  flashcardDifficulty: string;
  flashcardQnType: string;
  flashcardQn: string | any; // string for text, require() for image/audio
  flashcardAnswerType: string;
  flashcardAnswer: string | any[] | any; // string for text, array for MCQ, require() for image/audio
  timeLimit: number;
  cognitiveQnType: string;
  isFavorited: boolean;
  isMcqAnswerRight: number | null; // Add this field to track MCQ correctness
}

// Function to get time limit based on difficulty rating
export const getTimeLimit = async (difficultyRating: string, answerType?: string): Promise<number> => {
  try {
    const userID = await getCurrentUserID();
    
    // Load timer settings from database
    const result = await db.getFirstAsync(`
      SELECT 
        defaultTimer,
        againTimer,
        hardTimer,
        goodTimer,
        easyTimer,
        voiceRecordedTimer
      FROM users WHERE userID = ?
    `, [userID]);

    if (result) {
      const userData = result as {
        defaultTimer: number;
        againTimer: number;
        hardTimer: number;
        goodTimer: number;
        easyTimer: number;
        voiceRecordedTimer: number;
      };
      // For voice answer types, always use the voice recorded timer regardless of difficulty
      if (answerType === 'voice') {
        return userData.voiceRecordedTimer;
      }

      // Return appropriate timer based on difficulty rating for non-voice answer types
      switch (difficultyRating) {
        case 'Again': return userData.againTimer;
        case 'Hard': return userData.hardTimer;
        case 'Good': return userData.goodTimer;
        case 'Easy': return userData.easyTimer;
        case 'None': return userData.defaultTimer;
        default: return userData.defaultTimer;
      }
    } else {
      // Fallback to default values if no user data found
      const defaultValues = {
        defaultTimer: 30,
        againTimer: 30,
        hardTimer: 45,
        goodTimer: 60,
        easyTimer: 90,
        voiceRecordedTimer: 60
      };

      if (answerType === 'voice') {
        return defaultValues.voiceRecordedTimer;
      }

      switch (difficultyRating) {
        case 'Again': return defaultValues.againTimer;
        case 'Hard': return defaultValues.hardTimer;
        case 'Good': return defaultValues.goodTimer;
        case 'Easy': return defaultValues.easyTimer;
        case 'None': return defaultValues.defaultTimer;
        default: return defaultValues.defaultTimer;
      }
    }
  } catch (error) {
    console.error('Error getting time limit:', error);
    // Return default values on error
    return 30;
  }
};

// Helper functions for blob processing
const extractSVGFromBlob = (blob: string | Uint8Array): { paths: Array<{ d: string; stroke: string; strokeWidth: string; fill: string }>; viewBox: string } | null => {
  try {
    if (typeof blob === 'string') {
      // If it's already a hex string, convert to Uint8Array
      const bytes = new Uint8Array(blob.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      blob = bytes;
    }

    const decoder = new TextDecoder();
    const svgString = decoder.decode(blob as Uint8Array);
    
    // Extract viewBox
    const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 100";
    
    // Extract path elements
    const pathMatches = svgString.match(/<path[^>]*>/g);
    if (!pathMatches) return null;
    
    const paths = pathMatches.map(path => {
      const dMatch = path.match(/d="([^"]+)"/);
      const strokeMatch = path.match(/stroke="([^"]+)"/);
      const strokeWidthMatch = path.match(/stroke-width="([^"]+)"/);
      const fillMatch = path.match(/fill="([^"]+)"/);
      
      return {
        d: dMatch ? dMatch[1] : '',
        stroke: strokeMatch ? strokeMatch[1] : 'black',
        strokeWidth: strokeWidthMatch ? strokeWidthMatch[1] : '1',
        fill: fillMatch ? fillMatch[1] : 'none'
      };
    });
    
    return { paths, viewBox };
  } catch (error) {
    console.error('Error extracting SVG from blob:', error);
    return null;
  }
};

const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Cache for blob conversions
const blobCache = new Map<string, any>();

const clearBlobCache = () => {
  blobCache.clear();
};

const addToCache = (key: string, value: any) => {
  blobCache.set(key, value);
};

const blobToImageSource = (blob: Uint8Array | string): any => {
  try {
    let hexString: string;

    if (typeof blob === 'string') {
      hexString = blob;
    } else {
      // Convert Uint8Array to hex string
      hexString = Array.from(blob)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Check cache first
    if (blobCache.has(hexString)) {
      return blobCache.get(hexString);
    }

    // Convert hex to base64
    const binaryString = hexString
      .match(/.{1,2}/g)
      ?.map(byte => String.fromCharCode(parseInt(byte, 16)))
      .join('') || '';
    const base64 = btoa(binaryString);

    // Peek decoded content to detect SVG vs bitmap
    let mime = 'image/png';
    try {
      const decoded = atob(base64);
      if (decoded.includes('<svg') || decoded.includes('<?xml')) {
        mime = 'image/svg+xml';
      }
    } catch {}

    // Create data URI with correct MIME
    const dataUri = `data:${mime};base64,${base64}`;

    // Cache the result
    addToCache(hexString, { uri: dataUri });

    return { uri: dataUri };
  } catch (error) {
    console.error('Error converting blob to image source:', error);
    return undefined;
  }
};

const blobToAudioSource = (blob: Uint8Array | string): any => {
  try {
    let hexString: string;
    
    if (typeof blob === 'string') {
      hexString = blob;
    } else {
      // Convert Uint8Array to hex string
      hexString = Array.from(blob)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Check cache first
    if (blobCache.has(hexString)) {
      return blobCache.get(hexString);
    }
    
    // Convert hex to base64
    const binaryString = hexString.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
    const base64 = btoa(binaryString);
    
    // Create data URI (assuming audio/m4a format)
    const dataUri = `data:audio/m4a;base64,${base64}`;
    
    // Cache the result
    addToCache(hexString, { uri: dataUri });
    
    return { uri: dataUri };
  } catch (error) {
    console.error('Error converting blob to audio source:', error);
    return undefined;
  }
};

// Function to load flashcards from database for flashcard view
export const loadFlashcardsFromDatabaseForView = async (deckId: string, isAIDeck: string, retryDifficult?: boolean): Promise<TransformedFlashcard[]> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    let query = `
      SELECT 
        flashcardID,
        deckID,
        difficultyRating,
        cognitiveQnType,
        isFavorited,
        questionType,
        questionText,
        CASE 
          WHEN questionBlob IS NOT NULL 
          THEN hex(questionBlob) 
          ELSE NULL 
        END as questionBlob,
        answerType,
        answerText,
        answerMCQ,
        CASE 
          WHEN answerBlob IS NOT NULL 
          THEN hex(answerBlob) 
          ELSE NULL 
        END as answerBlob,
        timeTaken,
        isMcqAnswerRight,
        lastStudiedDate,
        lastQuizzedDate
      FROM ${tableName}
      WHERE deckID = ? AND userID = ?
    `;

    const params: any[] = [parseInt(deckId), userID];

    if (retryDifficult) {
      // Filter for difficult flashcards: Again, Hard, or MCQ with wrong answers
      query += `
        AND (
          difficultyRating IN ('Again', 'Hard') 
          OR (answerType = 'mcq' AND isMcqAnswerRight = 0)
        )
      `;
    }

    query += `
      ORDER BY 
        CASE difficultyRating
          WHEN 'None' THEN 1
          WHEN 'Easy' THEN 2
          WHEN 'Good' THEN 3
          WHEN 'Hard' THEN 4
          WHEN 'Again' THEN 5
          ELSE 6
        END,
        flashcardID ASC
    `;

    const result = await db.getAllAsync(query, params);

    if (!result) {
      return [];
    }

    const flashcards = result as DatabaseFlashcard[];
    
    // Transform database flashcards to match dummy data format
    const transformedFlashcards: TransformedFlashcard[] = [];
    
    for (const flashcard of flashcards) {
      // Transform question
      let transformedQuestion: string | any;
      if (flashcard.questionType === 'text') {
        transformedQuestion = flashcard.questionText || '';
      } else if (flashcard.questionType === 'image' && flashcard.questionBlob) {
        transformedQuestion = blobToImageSource(flashcard.questionBlob);
      } else if (flashcard.questionType === 'audio' && flashcard.questionBlob) {
        transformedQuestion = blobToAudioSource(flashcard.questionBlob);
      } else {
        transformedQuestion = '';
      }

      // Transform answer
      let transformedAnswer: string | any[] | any;
      if (flashcard.answerType === 'text') {
        transformedAnswer = flashcard.answerText || '';
      } else if (flashcard.answerType === 'mcq' && flashcard.answerMCQ) {
        try {
          const mcqData = JSON.parse(flashcard.answerMCQ);
          transformedAnswer = mcqData.map((item: any) => ({
            choice: item.option || item.choice,
            ans: item.ans || false
          }));
        } catch (error) {
          console.error('Error parsing MCQ data:', error);
          transformedAnswer = [];
        }
      } else if (flashcard.answerType === 'image' && flashcard.answerBlob) {
        transformedAnswer = blobToImageSource(flashcard.answerBlob);
      } else if (flashcard.answerType === 'audio' && flashcard.answerBlob) {
        transformedAnswer = blobToAudioSource(flashcard.answerBlob);
      } else {
        transformedAnswer = '';
      }

      // Get time limit for this flashcard
      const timeLimit = await getTimeLimit(flashcard.difficultyRating, flashcard.answerType);

      // Create transformed flashcard
      const transformedFlashcard: TransformedFlashcard = {
        flashcardID: flashcard.flashcardID,
        flashcardDifficulty: flashcard.difficultyRating,
        flashcardQnType: flashcard.questionType,
        flashcardQn: transformedQuestion,
        flashcardAnswerType: flashcard.answerType,
        flashcardAnswer: transformedAnswer,
        timeLimit: timeLimit,
        cognitiveQnType: flashcard.cognitiveQnType,
        isFavorited: flashcard.isFavorited === 1,
        isMcqAnswerRight: flashcard.isMcqAnswerRight
      };

      transformedFlashcards.push(transformedFlashcard);
    }

    return transformedFlashcards;
  } catch (error) {
    console.error('Error loading flashcards from database:', error);
    return [];
  }
};

// Function to update flashcard study/quiz date
export const updateFlashcardDate = async (
  flashcardId: number, 
  isStudyMode: boolean, 
  deckId: string, 
  isAIDeck: string,
  timeTaken?: number, 
  isMcqCorrect?: boolean
): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
    const currentDate = new Date().toISOString(); // Full ISO format: '2025-01-27T09:15:00.000Z'
    
    const fieldToUpdate = isStudyMode ? 'lastStudiedDate' : 'lastQuizzedDate';
    
    // Update the flashcard's study/quiz date, time taken, and MCQ answer correctness
    await db.runAsync(`
      UPDATE ${tableName}
      SET ${fieldToUpdate} = ?, timeTaken = ?, isMcqAnswerRight = ?
      WHERE flashcardID = ? AND userID = ?
    `, [currentDate, timeTaken || null, isMcqCorrect !== undefined ? (isMcqCorrect ? 1 : 0) : null, flashcardId, userID]);

    // Update the deck's lastModifiedDate since it was actively used
    await db.runAsync(`
      UPDATE ${deckTableName}
      SET lastModifiedDate = ?
      WHERE deckID = ? AND userID = ?
    `, [currentDate, parseInt(deckId), userID]);

  } catch (error) {
    console.error(`Error updating ${isStudyMode ? 'study' : 'quiz'} date:`, error);
  }
};

// Function to update deck's completion date when entire deck is finished
export const updateDeckCompletionDate = async (
  isStudyMode: boolean, 
  deckId: string, 
  isAIDeck: string
): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
    const flashcardTableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    const currentDate = new Date().toISOString(); // Full ISO format: '2025-01-27T09:15:00.000Z'
    
    const fieldToUpdate = isStudyMode ? 'lastStudiedDate' : 'lastQuizzedDate';
    
    // For quiz sessions, check if this is the first time quizzing and get deck info before updating
    let isFirstTimeQuizzingDeck = false;
    let deckType: 'study' | 'interview' | null = null;
    let previousQuizDate: string | null = null;
    
    if (!isStudyMode) {
      // Get deck info before updating to check if this is the first quiz and get previous quiz date
      const deckResult = await db.getFirstAsync(`
        SELECT deckType, lastQuizzedDate FROM ${deckTableName}
        WHERE deckID = ? AND userID = ?
      `, [parseInt(deckId), userID]);
      
      if (deckResult) {
        deckType = (deckResult as any).deckType;
        previousQuizDate = (deckResult as any).lastQuizzedDate;
        isFirstTimeQuizzingDeck = previousQuizDate === null;
      }
    }
    
    // Update the deck's completion date
    await db.runAsync(`
      UPDATE ${deckTableName}
      SET ${fieldToUpdate} = ?
      WHERE deckID = ? AND userID = ?
    `, [currentDate, parseInt(deckId), userID]);

    // For quiz sessions, increment quiz counters
    if (!isStudyMode && deckType) {
      // Count flashcards that were quizzed in this session
      // If first time quizzing, count all flashcards with lastQuizzedDate set
      // If not first time, count flashcards with lastQuizzedDate > previousQuizDate (quizzed since last deck quiz)
      let flashcardCountResult;
      
      if (isFirstTimeQuizzingDeck) {
        // First time quizzing: count all flashcards with lastQuizzedDate set
        flashcardCountResult = await db.getFirstAsync(`
          SELECT COUNT(*) as count
          FROM ${flashcardTableName}
          WHERE deckID = ? 
            AND userID = ?
            AND lastQuizzedDate IS NOT NULL
        `, [parseInt(deckId), userID]);
      } else {
        // Not first time: count flashcards quizzed since the previous deck quiz
        // Use a small buffer (1 second before previousQuizDate) to ensure we catch all flashcards from this session
        const previousQuizDateMinusBuffer = previousQuizDate 
          ? new Date(new Date(previousQuizDate).getTime() - 1000).toISOString()
          : null;
        
        if (previousQuizDateMinusBuffer) {
          flashcardCountResult = await db.getFirstAsync(`
            SELECT COUNT(*) as count
            FROM ${flashcardTableName}
            WHERE deckID = ? 
              AND userID = ?
              AND lastQuizzedDate IS NOT NULL
              AND lastQuizzedDate > ?
          `, [parseInt(deckId), userID, previousQuizDateMinusBuffer]);
        } else {
          // Fallback: count all flashcards with lastQuizzedDate set
          flashcardCountResult = await db.getFirstAsync(`
            SELECT COUNT(*) as count
            FROM ${flashcardTableName}
            WHERE deckID = ? 
              AND userID = ?
              AND lastQuizzedDate IS NOT NULL
          `, [parseInt(deckId), userID]);
        }
      }
      
      const flashcardCount = flashcardCountResult ? ((flashcardCountResult as any).count || 0) : 0;
      
      // Import and call incrementQuizCounters
      const { incrementQuizCounters } = await import('./users');
      await incrementQuizCounters(
        parseInt(deckId),
        isAIDeckFromParams,
        deckType,
        flashcardCount,
        isFirstTimeQuizzingDeck
      );
    }

  } catch (error) {
    console.error(`Error updating deck completion date:`, error);
  }
};

// Function to update the difficulty of a flashcard
export const updateFlashcardDifficulty = async (
  flashcardId: number, 
  difficulty: string, 
  isAIDeck: string
): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    // Update the database
    await db.runAsync(`
      UPDATE ${tableName}
      SET difficultyRating = ?
      WHERE flashcardID = ? AND userID = ?
    `, [difficulty, flashcardId, userID]);

  } catch (error) {
    console.error('Error updating flashcard difficulty:', error);
  }
};

// Function to toggle flashcard favorite status for flashcard view
export const toggleFlashcardFavoriteForView = async (
  flashcardId: number, 
  isAIDeck: string
): Promise<boolean> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    // Get current favorite status
    const result = await db.getFirstAsync(`
      SELECT isFavorited FROM ${tableName}
      WHERE flashcardID = ? AND userID = ?
    `, [flashcardId, userID]);

    if (result) {
      const currentStatus = (result as any).isFavorited;
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      // Update the database
      await db.runAsync(`
        UPDATE ${tableName}
        SET isFavorited = ?
        WHERE flashcardID = ? AND userID = ?
      `, [newStatus, flashcardId, userID]);

      return newStatus === 1;
    }
    
    return false;
  } catch (error) {
    console.error('Error toggling flashcard favorite status:', error);
    return false;
  }
};

// Function to track attempted flashcard for halfway checkpoint
export const trackAttemptedFlashcard = async (flashcardId: number): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    
    // Check if this flashcard is already tracked
    const existing = await db.getFirstAsync(`
      SELECT 1 FROM attemptedFlashcards 
      WHERE flashcardID = ? AND userID = ?
    `, [flashcardId, userID]);

    if (!existing) {
      // Add to attempted flashcards table
      await db.runAsync(`
        INSERT INTO attemptedFlashcards (flashcardID, userID, attemptDate)
        VALUES (?, ?, ?)
      `, [flashcardId, userID, new Date().toISOString()]);

    }
  } catch (error) {
    console.error('Error tracking attempted flashcard:', error);
  }
};

// Function to load halfway checkpoint setting
export const loadHalfwayCheckpointSetting = async (): Promise<boolean> => {
  try {
    const userID = await getCurrentUserID();
    
    const result = await db.getFirstAsync(`
      SELECT halfwayCheckpoint FROM users WHERE userID = ?
    `, [userID]);

    if (result) {
      return (result as any).halfwayCheckpoint === 1;
    }
    
    return false; // Default to false if not found
  } catch (error) {
    console.error('Error loading halfway checkpoint setting:', error);
    return false;
  }
};

// Function to get flashcard count for loading progress
export const getFlashcardCount = async (deckId: string, isAIDeck: string): Promise<number> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    const countQuery = `
      SELECT COUNT(*) as count FROM ${tableName}
      WHERE deckID = ? AND userID = ?
    `;
    
    const countParams: any[] = [parseInt(deckId), userID];
    
    const countResult = await db.getFirstAsync(countQuery, countParams);
    const actualCount = (countResult as any)?.count || 0;
    
    return actualCount;
  } catch (error) {
    console.error('Error getting flashcard count:', error);
    return 0;
  }
};

// Function to delete a flashcard from database
export const deleteFlashcard = async (flashcardId: number, isAIDeck: string): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    
    // Delete from database
    await db.runAsync(`
      DELETE FROM ${tableName}
      WHERE flashcardID = ? AND userID = ?
    `, [flashcardId, userID]);

  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
};

// Function to update deck's lastModifiedDate after flashcard deletion
export const updateDeckLastModifiedAfterFlashcardDeletion = async (deckId: string, isAIDeck: string): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const isAIDeckFromParams = isAIDeck === 'true';
    const deckTableName = isAIDeckFromParams ? 'AIDecks' : 'decks';
    
    // Update the deck's lastModifiedDate since a flashcard was deleted
    await db.runAsync(`
      UPDATE ${deckTableName}
      SET lastModifiedDate = ?
      WHERE deckID = ? AND userID = ?
    `, [new Date().toISOString(), parseInt(deckId), userID]);
    
  } catch (error) {
    console.error('Error updating deck lastModifiedDate after flashcard deletion:', error);
    throw error;
  }
};

// Quiz stats interface for viewQuizStats
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
    if (!deckID || !attemptedFlashcardIds) {
      return {
        currentGrade: 0,
        difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
        averageTimeSeconds: 0,
        totalTimeSeconds: 0,
        attemptedCount: 0,
        totalCount: 0
      };
    }

    const isAIDeckFromParams = isAIDeck === 'true';
    const tableName = isAIDeckFromParams ? 'AIFlashcards' : 'flashcards';
    const deckId = parseInt(deckID);
    
    // Parse the attempted flashcard IDs
    const attemptedIds = JSON.parse(attemptedFlashcardIds) as number[];
    
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
      return {
        currentGrade: 0,
        difficultyBreakdown: { Again: 0, Hard: 0, Good: 0, Easy: 0 },
        averageTimeSeconds: 0,
        totalTimeSeconds: 0,
        attemptedCount: 0,
        totalCount
      };
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

    return {
      currentGrade,
      difficultyBreakdown: breakdown,
      averageTimeSeconds,
      totalTimeSeconds,
      attemptedCount,
      totalCount
    };

  } catch (error) {
    console.error('Error loading quiz stats:', error);
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

// Function to create a custom badge from a custom goal submission
export async function createCustomBadge({
  numberOfDecksPledged,
  numberOfConsecutiveDays
}: {
  numberOfDecksPledged: number;
  numberOfConsecutiveDays: number;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    
    // Randomly select a badge image name from the available options
    const badgeImageNames = [
      'dontWishJustWorkForIt',
      'doYourBest',
      'goForIt',
      'hungryForSuccess',
      'keepFighting',
      'keepUpGoodWork',
      'makeAComeback',
      'neverGiveUp',
      'skysTheLimit',
      'stayStrong',
      'thereYouGo',
      'youveGotThis'
    ];
    const randomBadgeImageName = badgeImageNames[Math.floor(Math.random() * badgeImageNames.length)];
    
    // Create badge subtext
    const badgeSubtext = `${numberOfDecksPledged} decks x ${numberOfConsecutiveDays} days`;
    
    // Calculate dates
    const dateCreated = new Date().toISOString();
    const expiryDate = new Date(new Date(dateCreated).getTime() + numberOfConsecutiveDays * 24 * 60 * 60 * 1000).toISOString();
    const dateToBeRemoved = new Date(new Date(expiryDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    
    // Insert into customBadgesTable
    await db.execAsync(`
      INSERT INTO customBadgesTable (
        userID, badgeSubtext, badgeImageName, achieved, numberOfDecksPledged, numberOfConsecutiveDays, dateCreated, expiryDate, boundForRemoval, dateToBeRemoved
      ) VALUES (
        '${userID}', '${badgeSubtext.replace(/'/g, "''")}', '${randomBadgeImageName}', 0, ${numberOfDecksPledged}, ${numberOfConsecutiveDays}, '${dateCreated}', '${expiryDate}', 0, '${dateToBeRemoved}'
      )
    `);
    
    console.log(`✅ Custom badge created: ${badgeSubtext} with image ${randomBadgeImageName}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating custom badge:', error);
    return { success: false };
  }
}

// Interface for custom badge data
export interface CustomBadgeData {
  badgeSubtext: string;
  badgeImageName: string;
  achieved: number;
  expired: boolean;
  numberOfDecksPledged: number;
  numberOfConsecutiveDays: number;
  dateCreated: string;
  expiryDate: string;
  boundForRemoval: number;
  dateToBeRemoved: string;
}

// Interface for custom badge award
export interface CustomBadgeAward {
  badgeSubtext: string;
  badgeImageName: string;
  dateCreated: string;
  expiryDate: string;
  isNewAchievement: boolean;
}

// Helper function to check if user completed required decks on consecutive days
async function checkConsecutiveDaysCompletion(
  userID: string,
  dateCreated: string,
  numberOfConsecutiveDays: number,
  numberOfDecksPledged: number
): Promise<boolean> {
  try {
    const startDate = new Date(dateCreated);
    startDate.setHours(0, 0, 0, 0); // Start of day
    
    console.log(`🎯 checkConsecutiveDaysCompletion: userID=${userID}, dateCreated=${dateCreated}, numberOfConsecutiveDays=${numberOfConsecutiveDays}, numberOfDecksPledged=${numberOfDecksPledged}, startDate=${startDate.toISOString()}`);
    
    // Build an efficient query that counts distinct decks per day
    // For each day in the range, check if user completed enough decks
    for (let dayOffset = 0; dayOffset < numberOfConsecutiveDays; dayOffset++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + dayOffset);
      
      // Use local date formatting to avoid timezone issues
      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dayStart = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
      
      const nextDay = new Date(currentDay);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextYear = nextDay.getFullYear();
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nextDayNum = String(nextDay.getDate()).padStart(2, '0');
      const dayEnd = `${nextYear}-${nextMonth}-${nextDayNum}`; // YYYY-MM-DD in local time
      
      console.log(`🎯 Checking day ${dayOffset}: dayStart=${dayStart}, dayEnd=${dayEnd}, required=${numberOfDecksPledged} decks`);
      
      // Count distinct decks that were studied or quizzed on this day
      const result = await db.getFirstAsync(`
        SELECT COUNT(DISTINCT deckID) as count
        FROM (
          SELECT deckID
          FROM decks
          WHERE userID = ?
            AND (
              (lastStudiedDate >= ? AND lastStudiedDate < ?)
              OR (lastQuizzedDate >= ? AND lastQuizzedDate < ?)
            )
          UNION
          SELECT deckID
          FROM AIDecks
          WHERE userID = ?
            AND (
              (lastStudiedDate >= ? AND lastStudiedDate < ?)
              OR (lastQuizzedDate >= ? AND lastQuizzedDate < ?)
            )
        )
      `, [userID, dayStart, dayEnd, dayStart, dayEnd, userID, dayStart, dayEnd, dayStart, dayEnd]);
      
      const deckCount = (result as any)?.count || 0;
      
      console.log(`🎯 Day ${dayOffset} deck count: ${deckCount}`);
      
      // If any day doesn't meet the requirement, return false
      if (deckCount < numberOfDecksPledged) {
        console.log(`🎯 Day ${dayOffset} requirement not met: ${deckCount} < ${numberOfDecksPledged}`);
        return false;
      }
    }
    
    // All days met the requirement
    console.log(`🎯 All days met requirement`);
    return true;
  } catch (error) {
    console.error('Error checking consecutive days completion:', error);
    return false;
  }
}

// Function to fetch and evaluate custom badges for the current user
export async function fetchCustomBadges(): Promise<CustomBadgeData[]> {
  try {
    const userID = await getCurrentUserID();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch all custom badges for this user
    const result = await db.getAllAsync(`
      SELECT 
        badgeSubtext,
        badgeImageName,
        achieved,
        numberOfDecksPledged,
        numberOfConsecutiveDays,
        dateCreated,
        expiryDate,
        boundForRemoval,
        dateToBeRemoved
      FROM customBadgesTable
      WHERE userID = ?
      ORDER BY dateCreated DESC
    `, [userID]);
    
    const badges: CustomBadgeData[] = [];
    
    for (const badge of result as any[]) {
      const expiryDate = new Date(badge.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      const dateToBeRemoved = new Date(badge.dateToBeRemoved);
      dateToBeRemoved.setHours(0, 0, 0, 0);
      
      // Check if badge should be removed entirely
      if (badge.boundForRemoval === 1 && today > dateToBeRemoved) {
        continue; // Skip this badge entirely
      }
      
      let achieved = badge.achieved;
      let expired = false;
      let boundForRemoval = badge.boundForRemoval;
      
      // Only check completion if not already achieved
      if (achieved === 0) {
        // Check if user completed the goal
        const isCompleted = await checkConsecutiveDaysCompletion(
          userID,
          badge.dateCreated,
          badge.numberOfConsecutiveDays,
          badge.numberOfDecksPledged
        );
        
        if (isCompleted) {
          // Update achieved status in database
          achieved = 1;
          await db.runAsync(`
            UPDATE customBadgesTable
            SET achieved = 1
            WHERE userID = ? 
              AND badgeSubtext = ?
              AND dateCreated = ?
          `, [userID, badge.badgeSubtext, badge.dateCreated]);
        } else if (today > expiryDate) {
          // Badge has expired without being achieved
          expired = true;
          boundForRemoval = 1;
          await db.runAsync(`
            UPDATE customBadgesTable
            SET boundForRemoval = 1
            WHERE userID = ? 
              AND badgeSubtext = ?
              AND dateCreated = ?
          `, [userID, badge.badgeSubtext, badge.dateCreated]);
        }
      }
      
      badges.push({
        badgeSubtext: badge.badgeSubtext,
        badgeImageName: badge.badgeImageName,
        achieved,
        expired,
        numberOfDecksPledged: badge.numberOfDecksPledged,
        numberOfConsecutiveDays: badge.numberOfConsecutiveDays,
        dateCreated: badge.dateCreated,
        expiryDate: badge.expiryDate,
        boundForRemoval,
        dateToBeRemoved: badge.dateToBeRemoved
      });
    }
    
    return badges;
  } catch (error) {
    console.error('Error fetching custom badges:', error);
    return [];
  }
}

// Check and award custom badges after deck completion
export async function checkAndAwardCustomBadges(): Promise<CustomBadgeAward | null> {
  try {
    const userID = await getCurrentUserID();
    
    // Add a small delay to ensure database writes are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fetch all custom badges for this user
    const result = await db.getAllAsync(`
      SELECT 
        badgeSubtext,
        badgeImageName,
        achieved,
        numberOfDecksPledged,
        numberOfConsecutiveDays,
        dateCreated,
        expiryDate,
        boundForRemoval,
        dateToBeRemoved
      FROM customBadgesTable
      WHERE userID = ? AND achieved = 0
      ORDER BY dateCreated DESC
    `, [userID]);
    
    if (!result || result.length === 0) {
      console.log('🎯 No unachieved custom badges found for custom badge check');
      return null;
    }
    
    console.log(`🎯 Found ${result.length} unachieved custom badges to check`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check each unachieved badge to see if it was just completed
    for (const badge of result as any[]) {
      console.log(`🎯 Checking badge: ${badge.badgeSubtext}, dateCreated: ${badge.dateCreated}, numberOfDecksPledged: ${badge.numberOfDecksPledged}, numberOfConsecutiveDays: ${badge.numberOfConsecutiveDays}`);
      const expiryDate = new Date(badge.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      const dateToBeRemoved = new Date(badge.dateToBeRemoved);
      dateToBeRemoved.setHours(0, 0, 0, 0);
      
      // Skip badges that should be removed or expired
      if (badge.boundForRemoval === 1 || today > expiryDate) {
        continue;
      }
      
      // Check if user completed the goal
      const isCompleted = await checkConsecutiveDaysCompletion(
        userID,
        badge.dateCreated,
        badge.numberOfConsecutiveDays,
        badge.numberOfDecksPledged
      );
      
      console.log(`🎯 Badge ${badge.badgeSubtext} completion check result: ${isCompleted}`);
      
      if (isCompleted) {
        console.log(`🎯 Custom badge completed: ${badge.badgeSubtext}`);
        
        // Update achieved status in database
        await db.runAsync(`
          UPDATE customBadgesTable
          SET achieved = 1
          WHERE userID = ? 
            AND badgeSubtext = ?
            AND dateCreated = ?
        `, [userID, badge.badgeSubtext, badge.dateCreated]);
        
        console.log(`🎯 Custom badge awarded successfully!`);
        
        return {
          badgeSubtext: badge.badgeSubtext,
          badgeImageName: badge.badgeImageName,
          dateCreated: badge.dateCreated,
          expiryDate: badge.expiryDate,
          isNewAchievement: true
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking and awarding custom badges:', error);
    return null;
  }
}