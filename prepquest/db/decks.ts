import { db } from './index';

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
  flashcardCount: number;
}

export async function getStudyDecks(): Promise<Deck[]> {
  try {
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckType = 'study'
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC
    `);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching study decks:', error);
    return [];
  }
}

export async function getInterviewDecks(): Promise<Deck[]> {
  try {
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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckType = 'interview'
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC
    `);
        
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching interview decks:', error);
    return [];
  }
}

export async function getDeckProgress(deckId: number): Promise<number> {
  try {
    // First, check if the deck itself has lastStudiedDate or lastQuizzedDate
    const deckResult = await db.getFirstAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM decks
      WHERE deckID = ?
    `, [deckId]);

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
      WHERE deckID = ?
    `, [deckId]);

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
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // First, delete all flashcards associated with this deck
    await db.execAsync(`
      DELETE FROM flashcards 
      WHERE deckID = ${deckId}
    `);
    
    // Then delete the deck itself
    const result = await db.execAsync(`
      DELETE FROM decks 
      WHERE deckID = ${deckId}
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
    
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // Create comma-separated list of deck IDs
    const deckIdsString = deckIds.join(',');
    
    // First, delete all flashcards associated with these decks
    await db.execAsync(`
      DELETE FROM flashcards 
      WHERE deckID IN (${deckIdsString})
    `);
    
    // Then delete the decks themselves
    await db.execAsync(`
      DELETE FROM decks 
      WHERE deckID IN (${deckIdsString})
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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.isFavorited = 1
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC
    `);
    
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
      WHERE f.isFavorited = 1
      GROUP BY f.folderID
      ORDER BY f.lastModifiedDate DESC, f.dateAdded DESC
    `);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching favorited folders:', error);
    return [];
  }
}

export async function getAllFolders(): Promise<Folder[]> {
  try {
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
      GROUP BY f.folderID
      ORDER BY f.lastModifiedDate DESC, f.dateAdded DESC
    `);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching all folders:', error);
    return [];
  }
}

export async function deleteFolder(folderId: number): Promise<boolean> {
  try {
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // First, update all decks that reference this folder to remove it from their folderIDs
    // Get all decks that have this folder in their folderIDs
    const decksWithFolder = await db.getAllAsync(`
      SELECT deckID, folderIDs 
      FROM decks 
      WHERE folderIDs IS NOT NULL AND folderIDs LIKE '%${folderId}%'
    `);
    
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
          WHERE deckID = ${deckData.deckID}
        `);
      } else {
        // Update with the remaining folder IDs
        const newFolderIdsString = JSON.stringify(updatedFolderIds);
        await db.execAsync(`
          UPDATE decks 
          SET folderIDs = '${newFolderIdsString}'
          WHERE deckID = ${deckData.deckID}
        `);
      }
    }
    
    // Then delete the folder itself
    const result = await db.execAsync(`
      DELETE FROM folders 
      WHERE folderID = ${folderId}
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
    
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // Process each folder
    for (const folderId of folderIds) {
      // Get all decks that have this folder in their folderIDs
      const decksWithFolder = await db.getAllAsync(`
        SELECT deckID, folderIDs 
        FROM decks 
        WHERE folderIDs IS NOT NULL AND folderIDs LIKE '%${folderId}%'
      `);
      
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
            WHERE deckID = ${deckData.deckID}
          `);
        } else {
          // Update with the remaining folder IDs
          const newFolderIdsString = JSON.stringify(updatedFolderIds);
          await db.execAsync(`
            UPDATE decks 
            SET folderIDs = '${newFolderIdsString}'
            WHERE deckID = ${deckData.deckID}
          `);
        }
      }
    }
    
    // Create comma-separated list of folder IDs
    const folderIdsString = folderIds.join(',');
    
    // Delete the folders themselves
    await db.execAsync(`
      DELETE FROM folders 
      WHERE folderID IN (${folderIdsString})
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

export async function getDecksInFolder(folderId: number): Promise<(Deck & { progress: number })[]> {
  try {
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
      GROUP BY d.deckID
      ORDER BY d.lastModifiedDate DESC, d.dateAdded DESC
    `);
    
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
    // First check if this is an AI deck
    const deckTypeResult = await db.getFirstAsync(`
      SELECT isAIDeck FROM decks WHERE deckID = ?
    `, [deckId]);

    if (!deckTypeResult) {
      return null;
    }

    const deckType = deckTypeResult as { isAIDeck: number };
    const isAIDeck = deckType.isAIDeck === 1;

    // Get attempted flashcards (those with lastStudiedDate or lastQuizzedDate not null)
    // and their difficulty ratings
    const tableName = isAIDeck ? 'AIFlashcards' : 'flashcards';
    const idColumn = isAIDeck ? 'AIDeckID' : 'deckID';

    const result = await db.getAllAsync(`
      SELECT 
        difficultyRating,
        lastStudiedDate,
        lastQuizzedDate
      FROM ${tableName}
      WHERE ${idColumn} = ?
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [deckId]);

    if (!result || result.length === 0) {
      // No attempted flashcards, return null
      return null;
    }

    const flashcards = result as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>;

    // Extract difficulty ratings from attempted flashcards
    const ratings = flashcards.map(flashcard => flashcard.difficultyRating);

    // Get total number of flashcards for this deck
    const totalResult = await db.getFirstAsync(`
      SELECT COUNT(*) as total
      FROM ${tableName}
      WHERE ${idColumn} = ?
    `, [deckId]);

    const totalFlashcards = (totalResult as { total: number }).total;

    // Calculate weighted score
    const grade = calculateWeightedScore(ratings);
    
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
    // First check if this is an AI deck
    const deckTypeResult = await db.getFirstAsync(`
      SELECT isAIDeck FROM decks WHERE deckID = ?
    `, [deckId]);

    if (!deckTypeResult) {
      return null;
    }

    const deckType = deckTypeResult as { isAIDeck: number };
    const isAIDeck = deckType.isAIDeck === 1;

    // Get attempted flashcards (those with lastStudiedDate or lastQuizzedDate not null)
    // and their timeTaken values
    const tableName = isAIDeck ? 'AIFlashcards' : 'flashcards';
    const idColumn = isAIDeck ? 'AIDeckID' : 'deckID';

    const result = await db.getFirstAsync(`
      SELECT 
        AVG(timeTaken) as averageTime,
        COUNT(*) as attemptedCount
      FROM ${tableName}
      WHERE ${idColumn} = ?
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND timeTaken IS NOT NULL
    `, [deckId]);

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