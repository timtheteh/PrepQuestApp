import { db } from './index';

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
    const result = await db.getFirstAsync(`
      SELECT * FROM users WHERE id = 1
    `);
    
    return result as Users | null;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return null;
  }
}

// Increment accumulated decks counter
export async function incrementAccumulatedDecks(deckType?: 'study' | 'interview'): Promise<void> {
  try {
    const currentDate = new Date().toISOString();
    
    // Increment general decks counter
    await db.runAsync(`
      UPDATE users 
      SET accumulatedDecksCreated = accumulatedDecksCreated + 1,
          lastUpdated = ?
      WHERE id = 1
    `, [currentDate]);

    // Increment specific deck type counter if provided
    if (deckType) {
      const columnName = deckType === 'study' ? 'accumulatedStudyDecksCreated' : 'accumulatedInterviewDecksCreated';
      await db.runAsync(`
        UPDATE users 
        SET ${columnName} = ${columnName} + 1,
            lastUpdated = ?
        WHERE id = 1
      `, [currentDate]);
    }
  } catch (error) {
    console.error('Error incrementing accumulated decks:', error);
  }
}

// Increment accumulated flashcards counter
export async function incrementAccumulatedFlashcards(): Promise<void> {
  try {
    const currentDate = new Date().toISOString();
    
    await db.runAsync(`
      UPDATE users 
      SET accumulatedFlashcardsCreated = accumulatedFlashcardsCreated + 1,
          lastUpdated = ?
      WHERE id = 1
    `, [currentDate]);
  } catch (error) {
    console.error('Error incrementing accumulated flashcards:', error);
  }
}

// Initialize user statistics if they don't exist
export async function initializeUserStatistics(): Promise<void> {
  try {
    const existing = await getUserStatistics();
    if (!existing) {
      await db.runAsync(`
        INSERT INTO users (id, accumulatedDecksCreated, accumulatedFlashcardsCreated, accumulatedStudyDecksCreated, accumulatedInterviewDecksCreated)
        VALUES (1, 0, 0, 0, 0)
      `);
    }
  } catch (error) {
    console.error('Error initializing user statistics:', error);
  }
} 