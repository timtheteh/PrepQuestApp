import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
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
    
    console.log(`Successfully deleted deck ${deckId} and its flashcards`);
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
    
    console.log(`Successfully deleted ${deckIds.length} decks and their flashcards`);
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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
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
    
    console.log(`Successfully deleted folder ${folderId} and updated related decks`);
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
    
    console.log(`Successfully deleted ${folderIds.length} folders and updated related decks`);
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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
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
      // For MCQ flashcards, use isMcqAnswerRight: 0 if wrong, 1 if correct
      weight = isMcqAnswerRight === 1 ? 1.0 : 0.0;
      // For breakdown, treat correct MCQs as 'Easy' and incorrect as 'Again'
      ratings.push(isMcqAnswerRight === 1 ? 'Easy' : 'Again');
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
    // Get attempted flashcards from both regular and AI flashcards tables
    const result = await db.getAllAsync(`
      SELECT 
        difficultyRating,
        lastStudiedDate,
        lastQuizzedDate,
        answerType,
        isMcqAnswerRight
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
    }>;

    // Calculate weighted score with MCQ handling
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
  console.log('Testing grade calculation...');
  
  // Test case 1: All Easy cards
  const allEasy = ['Easy', 'Easy', 'Easy', 'Easy', 'Easy'];
  const grade1 = calculateWeightedScore(allEasy);
  console.log('All Easy cards:', grade1);
  // Expected: score: 100, masteryLevel: 'Expert'
  
  // Test case 2: Mixed ratings
  const mixed = ['Easy', 'Good', 'Hard', 'Again', 'Easy'];
  const grade2 = calculateWeightedScore(mixed);
  console.log('Mixed ratings:', grade2);
  // Expected: (1.0 + 0.8 + 0.4 + 0.0 + 1.0) / 5 * 100 = 64, masteryLevel: 'Developing'
  
  // Test case 3: All Again cards
  const allAgain = ['Again', 'Again', 'Again'];
  const grade3 = calculateWeightedScore(allAgain);
  console.log('All Again cards:', grade3);
  // Expected: score: 0, masteryLevel: 'Needs Practice'
  
  // Test case 4: Good and Easy mix
  const goodEasy = ['Good', 'Easy', 'Good', 'Easy'];
  const grade4 = calculateWeightedScore(goodEasy);
  console.log('Good and Easy mix:', grade4);
  // Expected: (0.8 + 1.0 + 0.8 + 1.0) / 4 * 100 = 90, masteryLevel: 'Expert'
}

export async function getDeckAverageTime(deckId: number): Promise<number | null> {
  try {
    const userID = await getCurrentUserID();
    // Get attempted flashcards from both regular and AI flashcards tables
    const result = await db.getFirstAsync(`
      SELECT 
        AVG(timeTaken) as averageTime,
        COUNT(*) as attemptedCount
      FROM (
        SELECT timeTaken
        FROM flashcards
        WHERE deckID = ?
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND timeTaken IS NOT NULL
          AND userID = ?
        UNION ALL
        SELECT timeTaken
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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
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
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM AIDecks d
      LEFT JOIN AIFlashcards f ON d.deckID = f.deckID
      WHERE d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
      LIMIT 3
    `, [userID]);
    
    return result as AIDeck[];
  } catch (error) {
    console.error('Error fetching AI decks:', error);
    return [];
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
      const companyIconBlob = aiDeck.interviewCompanyIcon ? `X'${Array.from(aiDeck.interviewCompanyIcon as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
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
          ${aiDeck.interviewJobRole ? `'${aiDeck.interviewJobRole}'` : 'NULL'}, ${aiDeck.interviewType ? `'${aiDeck.interviewType}'` : 'NULL'}, ${aiDeck.interviewCompany ? `'${aiDeck.interviewCompany}'` : 'NULL'}, ${aiDeck.interviewExperienceLevel ? `'${aiDeck.interviewExperienceLevel}'` : 'NULL'}, ${aiDeck.interviewTopics ? `'${aiDeck.interviewTopics}'` : 'NULL'}, ${companyIconBlob},
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
        
        console.log('Question blob hex length:', questionBlobHex !== 'NULL' ? questionBlobHex.length - 3 : 0);
        console.log('Answer blob hex length:', answerBlobHex !== 'NULL' ? answerBlobHex.length - 3 : 0);
        
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
        
        console.log(`Inserted flashcard with questionType: ${aiFlashcard.questionType}, answerType: ${aiFlashcard.answerType}`);
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
      
      console.log(`Successfully saved AI deck ${aiDeckId} to regular deck ${newDeckId}`);
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
      
      console.log(`Successfully created manual deck ${newDeckId} with name: ${formData.deckName}`);
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

export async function createFlashcardsFromCache(deckId: number, cardCache: any[]): Promise<{ success: boolean; flashcardCount?: number }> {
  try {
    const userID = await getCurrentUserID();
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      let flashcardCount = 0;
      
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
            console.log('frontContent.content', frontContent.content);
            questionType = 'image';
            // Convert image URI to blob
            questionBlob = await uriToBlob(frontContent.content.props.source.uri);
          } else if (frontContent.type === 'mic' && frontContent.audioUri) {
            questionType = 'audio';
            // Convert audio URI to blob
            questionBlob = await uriToBlob(frontContent.audioUri);
          } else if (frontContent.type === 'marker' && frontContent.content) {
            console.log('Processing front drawing content:', frontContent.content);
            questionType = 'image';
            // Convert drawing data to image, then to blob
            const drawingRenderer = frontContent.content as React.ReactElement<{ drawingData: { path: string; strokeWidth: number }[] }>;
            console.log('Drawing renderer props:', drawingRenderer.props);
            if (drawingRenderer.props.drawingData) {
              console.log('Drawing data found:', drawingRenderer.props.drawingData);
              // Convert drawing data to SVG string
              const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
                ${drawingRenderer.props.drawingData.map(pathData => 
                  `<path d="${pathData.path}" stroke="black" stroke-width="${pathData.strokeWidth}" fill="none"/>`
                ).join('')}
              </svg>`;
              
              console.log('Generated SVG string:', svgString);
              
              // Convert SVG to base64 data URI
              const base64Svg = btoa(svgString);
              const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
              
              console.log('Generated data URI:', dataUri);
              
              // Convert data URI to blob
              questionBlob = await uriToBlob(dataUri);
              console.log('Generated question blob:', questionBlob ? questionBlob.length : 'null');
            } else {
              console.log('No drawing data found in front content');
            }
          }
          
          // Process back content (answer)
          if (backContent.type === 'text' && backContent.content) {
            answerType = 'text';
            answerText = extractTextFromContent(backContent.content);
          } else if (backContent.type === 'camera' && backContent.content) {
            console.log('backContent.content', backContent.content);
            answerType = 'image';
            // Convert image URI to blob
            answerBlob = await uriToBlob(backContent.content.props.source.uri);
          } else if (backContent.type === 'mic' && backContent.audioUri) {
            answerType = 'audio';
            // Convert audio URI to blob
            answerBlob = await uriToBlob(backContent.audioUri);
          } else if (backContent.type === 'marker' && backContent.content) {
            console.log('Processing back drawing content:', backContent.content);
            answerType = 'image';
            // Convert drawing data to image, then to blob
            const drawingRenderer = backContent.content as React.ReactElement<{ drawingData: { path: string; strokeWidth: number }[] }>;
            console.log('Back drawing renderer props:', drawingRenderer.props);
            if (drawingRenderer.props.drawingData) {
              console.log('Back drawing data found:', drawingRenderer.props.drawingData);
              // Convert drawing data to SVG string
              const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
                ${drawingRenderer.props.drawingData.map(pathData => 
                  `<path d="${pathData.path}" stroke="black" stroke-width="${pathData.strokeWidth}" fill="none"/>`
                ).join('')}
              </svg>`;
              
              console.log('Generated back SVG string:', svgString);
              
              // Convert SVG to base64 data URI
              const base64Svg = btoa(svgString);
              const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
              
              console.log('Generated back data URI:', dataUri);
              
              // Convert data URI to blob
              answerBlob = await uriToBlob(dataUri);
              console.log('Generated answer blob:', answerBlob ? answerBlob.length : 'null');
            } else {
              console.log('No drawing data found in back content');
            }
          }
          
          // Convert blobs to hex format for SQLite
          const questionBlobHex = questionBlob ? `X'${Array.from(questionBlob).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
          const answerBlobHex = answerBlob ? `X'${Array.from(answerBlob).map((b: number) => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
          
          console.log('Question blob hex length:', questionBlobHex !== 'NULL' ? questionBlobHex.length - 3 : 0);
          console.log('Answer blob hex length:', answerBlobHex !== 'NULL' ? answerBlobHex.length - 3 : 0);
          
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
          
          console.log(`Inserted flashcard with questionType: ${questionType}, answerType: ${answerType}`);
          
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
      }
      
      // Commit the transaction
      await db.execAsync('COMMIT');
      
      console.log(`Successfully created ${flashcardCount} flashcards for deck ${deckId}`);
      return { success: true, flashcardCount };
      
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