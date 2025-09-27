import { db } from '../index';
import { getCurrentUserID } from './users';

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

export async function getStudyDecks(): Promise<Deck[]> {
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
        d.AICardDesignIndex,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.deckType = 'study' AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID]);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching study decks:', error);
    return [];
  }
}

export async function getInterviewDecks(): Promise<Deck[]> {
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
        d.AICardDesignIndex,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.deckType = 'interview' AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID]);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching interview decks:', error);
    return [];
  }
}

export async function getDeckProgress(deckId: number): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT lastStudiedDate, lastQuizzedDate
      FROM decks
      WHERE deckID = ? AND userID = ?
    `;
    
    const result = await db.getFirstAsync(query, [deckId, userID]) as { lastStudiedDate: string | null; lastQuizzedDate: string | null } | null;
    
    if (!result) return 0;
    
    // If both dates exist, return 100 (completed)
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
    console.error('Error getting deck progress:', error);
    return 0;
  }
}

export async function getStudyDecksWithProgress(): Promise<(Deck & { progress: number })[]> {
  try {
    const decks = await getStudyDecks();
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => ({
        ...deck,
        progress: await getDeckProgress(deck.deckID)
      }))
    );
    return decksWithProgress;
  } catch (error) {
    console.error('Error getting study decks with progress:', error);
    return [];
  }
}

export async function getInterviewDecksWithProgress(): Promise<(Deck & { progress: number })[]> {
  try {
    const decks = await getInterviewDecks();
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => ({
        ...deck,
        progress: await getDeckProgress(deck.deckID)
      }))
    );
    return decksWithProgress;
  } catch (error) {
    console.error('Error getting interview decks with progress:', error);
    return [];
  }
}

export async function deleteDeck(deckId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Delete flashcards first
      await db.runAsync(
        'DELETE FROM flashcards WHERE deckID = ? AND userID = ?',
        [deckId, userID]
      );
      
      // Delete the deck
      await db.runAsync(
        'DELETE FROM decks WHERE deckID = ? AND userID = ?',
        [deckId, userID]
      );
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting deck:', error);
    return false;
  }
}

export async function deleteMultipleDecks(deckIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (deckIds.length === 0) return true;
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Delete flashcards first
      const placeholders = deckIds.map(() => '?').join(',');
      await db.runAsync(
        `DELETE FROM flashcards WHERE deckID IN (${placeholders}) AND userID = ?`,
        [...deckIds, userID]
      );
      
      // Delete the decks
      await db.runAsync(
        `DELETE FROM decks WHERE deckID IN (${placeholders}) AND userID = ?`,
        [...deckIds, userID]
      );
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting multiple decks:', error);
    return false;
  }
}

export async function getFavoritedDecks(): Promise<(Deck & { progress: number })[]> {
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
        d.AICardDesignIndex,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.isFavorited = 1 AND d.userID = ?
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID]) as Deck[];
    
    const decksWithProgress = await Promise.all(
      result.map(async (deck) => ({
        ...deck,
        progress: await getDeckProgress(deck.deckID)
      }))
    );
    
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching favorited decks:', error);
    return [];
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

export async function getDeckInfo(deckId: number): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT * FROM decks WHERE deckID = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [deckId, userID]);
    return result;
  } catch (error) {
    console.error('Error getting deck info:', error);
    return null;
  }
}

export async function getDeckInfoWithProgress(deckId: number): Promise<(any & { progress: number; flashcardCount: number }) | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        d.*,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.deckID = ? AND d.userID = ?
      GROUP BY d.deckID
    `;
    
    const result = await db.getFirstAsync(query, [deckId, userID]) as any;
    
    if (!result) return null;
    
    const progress = await getDeckProgress(deckId);
    
    return {
      ...result,
      progress,
      flashcardCount: result.flashcardCount || 0
    };
  } catch (error) {
    console.error('Error getting deck info with progress:', error);
    return null;
  }
}

export async function getDeckNameById(deckId: number): Promise<string | null> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT deckName FROM decks WHERE deckID = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [deckId, userID]) as { deckName: string } | null;
    return result?.deckName || null;
  } catch (error) {
    console.error('Error getting deck name by ID:', error);
    return null;
  }
}

export async function updateDeckName(deckId: number, newDeckName: string): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'UPDATE decks SET deckName = ?, lastModifiedDate = ? WHERE deckID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [newDeckName, currentDate, deckId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating deck name:', error);
    return false;
  }
}

export async function updateDeckFavoriteStatus(deckId: number, isFavorited: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'UPDATE decks SET isFavorited = ?, lastModifiedDate = ? WHERE deckID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [isFavorited ? 1 : 0, currentDate, deckId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating deck favorite status:', error);
    return false;
  }
}

export async function updateDeckFavoriteStatusInFolder(deckId: number, isFavorited: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'UPDATE decks SET isFavorited = ?, lastModifiedDate = ? WHERE deckID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [isFavorited ? 1 : 0, currentDate, deckId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating deck favorite status in folder:', error);
    return false;
  }
}

export async function unfavoriteMultipleDecks(deckIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (deckIds.length === 0) return true;
    
    const placeholders = deckIds.map(() => '?').join(',');
    const query = `UPDATE decks SET isFavorited = 0, lastModifiedDate = ? WHERE deckID IN (${placeholders}) AND userID = ?`;
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [currentDate, ...deckIds, userID]);
    return true;
  } catch (error) {
    console.error('Error unfavoriting multiple decks:', error);
    return false;
  }
}

export async function getDeckFolderIds(deckId: number): Promise<number[]> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT folderIDs FROM decks WHERE deckID = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [deckId, userID]) as { folderIDs: string | null } | null;
    
    if (!result || !result.folderIDs) {
      return [];
    }
    
    try {
      const folderIds = JSON.parse(result.folderIDs);
      return Array.isArray(folderIds) ? folderIds : [];
    } catch (error) {
      console.error('Error parsing folder IDs:', error);
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
    const query = 'UPDATE decks SET folderIDs = ?, lastModifiedDate = ? WHERE deckID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    const folderIdsJson = JSON.stringify(folderIds);
    
    await db.runAsync(query, [folderIdsJson, currentDate, deckId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating deck folder IDs:', error);
    return false;
  }
}

export async function checkDecksAlreadyInFolders(deckIds: number[], folderIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const placeholders = deckIds.map(() => '?').join(',');
    const query = `SELECT deckID, folderIDs FROM decks WHERE deckID IN (${placeholders}) AND userID = ?`;
    
    const results = await db.getAllAsync(query, [...deckIds, userID]) as Array<{ deckID: number; folderIDs: string | null }>;
    
    for (const result of results) {
      if (result.folderIDs) {
        try {
          const existingFolderIds = JSON.parse(result.folderIDs);
          if (Array.isArray(existingFolderIds)) {
            const hasOverlap = folderIds.some(folderId => existingFolderIds.includes(folderId));
            if (hasOverlap) return true;
          }
        } catch (error) {
          console.error('Error parsing existing folder IDs:', error);
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if decks already in folders:', error);
    return false;
  }
}

export async function addDecksToFolders(deckIds: number[], folderIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const deckId of deckIds) {
        const currentFolderIds = await getDeckFolderIds(deckId);
        const newFolderIds = [...new Set([...currentFolderIds, ...folderIds])];
        await updateDeckFolderIds(deckId, newFolderIds);
      }
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding decks to folders:', error);
    return false;
  }
}

export async function moveDecksToFolders(deckIds: number[], targetFolderIds: number[], sourceFolderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const deckId of deckIds) {
        const currentFolderIds = await getDeckFolderIds(deckId);
        const filteredFolderIds = currentFolderIds.filter(id => id !== sourceFolderId);
        const newFolderIds = [...new Set([...filteredFolderIds, ...targetFolderIds])];
        await updateDeckFolderIds(deckId, newFolderIds);
      }
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error moving decks to folders:', error);
    return false;
  }
}

export async function removeDecksFromFolder(deckIds: number[], folderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const deckId of deckIds) {
        const currentFolderIds = await getDeckFolderIds(deckId);
        const newFolderIds = currentFolderIds.filter(id => id !== folderId);
        await updateDeckFolderIds(deckId, newFolderIds);
      }
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error removing decks from folder:', error);
    return false;
  }
}

export async function checkDatabaseReady(): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync('SELECT COUNT(*) as count FROM decks WHERE userID = ?', [userID]);
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Error checking database ready:', error);
    return false;
  }
}
