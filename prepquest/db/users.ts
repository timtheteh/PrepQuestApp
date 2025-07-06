import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface Users {
  id: number;
  accumulatedDecksCreated: number;
  accumulatedFlashcardsCreated: number;
  accumulatedStudyDecksCreated: number;
  accumulatedInterviewDecksCreated: number;
  lastUpdated: string;
}

// Get current user statistics
export async function getUserStatistics(): Promise<Users | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT * FROM users WHERE userID = ?
    `, [userID]);
    
    return result as Users | null;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return null;
  }
}

// Increment accumulated decks counter
export async function incrementAccumulatedDecks(deckType?: 'study' | 'interview'): Promise<void> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    // Increment general decks counter
    await db.runAsync(`
      UPDATE users 
      SET accumulatedDecksCreated = accumulatedDecksCreated + 1,
          lastUpdated = ?
      WHERE userID = ?
    `, [currentDate, userID]);

    // Increment specific deck type counter if provided
    if (deckType) {
      const columnName = deckType === 'study' ? 'accumulatedStudyDecksCreated' : 'accumulatedInterviewDecksCreated';
      await db.runAsync(`
        UPDATE users 
        SET ${columnName} = ${columnName} + 1,
            lastUpdated = ?
        WHERE userID = ?
      `, [currentDate, userID]);
    }
  } catch (error) {
    console.error('Error incrementing accumulated decks:', error);
  }
}

// Increment accumulated flashcards counter
export async function incrementAccumulatedFlashcards(): Promise<void> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    await db.runAsync(`
      UPDATE users 
      SET accumulatedFlashcardsCreated = accumulatedFlashcardsCreated + 1,
          lastUpdated = ?
      WHERE userID = ?
    `, [currentDate, userID]);
  } catch (error) {
    console.error('Error incrementing accumulated flashcards:', error);
  }
}

// Initialize user statistics if they don't exist
export async function initializeUserStatistics(): Promise<void> {
  try {
    const userID = await getCurrentUserID();
    const existing = await getUserStatistics();
    if (!existing) {
      await db.runAsync(`
        INSERT INTO users (userID, accumulatedDecksCreated, accumulatedFlashcardsCreated, accumulatedStudyDecksCreated, accumulatedInterviewDecksCreated, lastUpdated)
        VALUES (?, 0, 0, 0, 0, ?)
      `, [userID, new Date().toISOString()]);
    }
  } catch (error) {
    console.error('Error initializing user statistics:', error);
  }
}

// Fetch question type settings for the current user
export async function getUserQuestionSettings(): Promise<{
  isMcqEnabled: boolean,
  isClozeEnabled: boolean,
  isVoiceRecordedEnabled: boolean
}> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(
      `SELECT mcqQuestionsEnabled, clozeQuestionsEnabled, voiceRecordedQuestionsEnabled FROM users WHERE userID = ?`,
      [userID]
    ) as { mcqQuestionsEnabled?: number, clozeQuestionsEnabled?: number, voiceRecordedQuestionsEnabled?: number } | null;
    if (!result) throw new Error('User not found');
    return {
      isMcqEnabled: !!result.mcqQuestionsEnabled,
      isClozeEnabled: !!result.clozeQuestionsEnabled,
      isVoiceRecordedEnabled: !!result.voiceRecordedQuestionsEnabled,
    };
  } catch (error) {
    console.error('Error fetching user question settings:', error);
    // Default to all enabled if error
    return {
      isMcqEnabled: true,
      isClozeEnabled: true,
      isVoiceRecordedEnabled: true,
    };
  }
} 