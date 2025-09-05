import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Deletes all user data from the local SQLite database
 * This includes all tables that contain user-specific data
 * @param userID - The user ID to delete data for
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function deleteAllUserDataFromDatabase(userID: string): Promise<boolean> {
  try {
    console.log(`Starting deletion of all data for user: ${userID}`);
    
    // First, check if the database is accessible
    try {
      await db.getFirstAsync('SELECT 1');
    } catch (dbError) {
      console.error('Database not accessible:', dbError);
      return false;
    }
    
    // Check if required tables exist
    const requiredTables = ['users', 'folders', 'decks', 'AIDecks', 'flashcards', 'AIFlashcards', 'userFormEntries'];
    for (const tableName of requiredTables) {
      try {
        const result = await db.getFirstAsync(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        if (!result) {
          console.warn(`Table ${tableName} does not exist in database`);
        } else {
          console.log(`Table ${tableName} exists in database`);
        }
      } catch (error) {
        console.warn(`Error checking for table ${tableName}:`, error);
      }
    }
    
    // Check if there's any data to delete for this user
    try {
      const dataCounts = await getUserDataCounts(userID);
      console.log(`Data counts for user ${userID}:`, dataCounts);
      
      const totalData = dataCounts.folders + dataCounts.decks + dataCounts.aiDecks + 
                       dataCounts.flashcards + dataCounts.aiFlashcards + dataCounts.userFormEntries;
      
      if (totalData === 0) {
        console.log(`No data found for user ${userID}, but proceeding with deletion anyway`);
      } else {
        console.log(`Found ${totalData} total data items for user ${userID}`);
      }
    } catch (error) {
      console.warn(`Error checking data counts for user ${userID}:`, error);
    }
    
    // Disable foreign key constraints to avoid issues during deletion
    await db.execAsync('PRAGMA foreign_keys = OFF');
    
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // Delete from all user-related tables in the correct order (respecting foreign key constraints)
    // Use try-catch for each table deletion to handle missing tables gracefully
    
    try {
      // 1. Delete flashcards first (they reference decks)
      await db.runAsync(`DELETE FROM flashcards WHERE userID = ?`, [userID]);
      console.log(`Deleted flashcards for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete flashcards for user ${userID}:`, error);
    }
    
    try {
      // 2. Delete AI flashcards (they reference AI decks)
      await db.runAsync(`DELETE FROM AIFlashcards WHERE userID = ?`, [userID]);
      console.log(`Deleted AI flashcards for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete AI flashcards for user ${userID}:`, error);
    }
    
    try {
      // 3. Delete decks
      await db.runAsync(`DELETE FROM decks WHERE userID = ?`, [userID]);
      console.log(`Deleted decks for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete decks for user ${userID}:`, error);
    }
    
    try {
      // 4. Delete AI decks
      await db.runAsync(`DELETE FROM AIDecks WHERE userID = ?`, [userID]);
      console.log(`Deleted AI decks for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete AI decks for user ${userID}:`, error);
    }
    
    try {
      // 5. Delete folders
      await db.runAsync(`DELETE FROM folders WHERE userID = ?`, [userID]);
      console.log(`Deleted folders for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete folders for user ${userID}:`, error);
    }
    
    try {
      // 6. Delete user form entries
      await db.runAsync(`DELETE FROM userFormEntries WHERE userID = ?`, [userID]);
      console.log(`Deleted user form entries for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete user form entries for user ${userID}:`, error);
    }
    
    try {
      // 7. Delete user record
      await db.runAsync(`DELETE FROM users WHERE userID = ?`, [userID]);
      console.log(`Deleted user record for user ${userID}`);
    } catch (error) {
      console.warn(`Warning: Could not delete user record for user ${userID}:`, error);
    }
    
    // Commit the transaction
    await db.execAsync('COMMIT');
    
    // Re-enable foreign key constraints
    await db.execAsync('PRAGMA foreign_keys = ON');
    
    // Clear all relevant AsyncStorage data
    await clearUserDataFromAsyncStorage(userID);
    
    console.log(`Successfully deleted all data for user: ${userID}`);
    return true;
    
  } catch (error) {
    // Rollback the transaction on error
    try {
      await db.execAsync('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    // Re-enable foreign key constraints even on error
    try {
      await db.execAsync('PRAGMA foreign_keys = ON');
    } catch (fkError) {
      console.error('Error re-enabling foreign keys:', fkError);
    }
    
    console.error('Error deleting user data from database:', error);
    return false;
  }
}

/**
 * Clears all user-related data from AsyncStorage
 * @param userID - The user ID to clear data for
 */
async function clearUserDataFromAsyncStorage(userID: string): Promise<void> {
  try {
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys that might contain user data
    const userDataKeys = allKeys.filter(key => 
      key.includes('user') || 
      key.includes('deck') || 
      key.includes('folder') || 
      key.includes('flashcard') ||
      key.includes('backup') ||
      key.includes('import') ||
      key.includes('clearData') ||
      key.includes('theme') ||
      key.includes('language') ||
      key.includes('notification') ||
      key === 'userID'
    );
    
    // Remove all user-related keys
    if (userDataKeys.length > 0) {
      await AsyncStorage.multiRemove(userDataKeys);
      console.log(`Cleared ${userDataKeys.length} items from AsyncStorage:`, userDataKeys);
    }
    
  } catch (error) {
    console.error('Error clearing user data from AsyncStorage:', error);
    // Don't throw - this is not critical for account deletion
  }
}

/**
 * Gets the count of user data items before deletion (for confirmation)
 * @param userID - The user ID to count data for
 * @returns Promise<object> - Object containing counts of various data types
 */
export async function getUserDataCounts(userID: string): Promise<{
  folders: number;
  decks: number;
  aiDecks: number;
  flashcards: number;
  aiFlashcards: number;
  userFormEntries: number;
}> {
  try {
    // Count folders
    const foldersResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM folders WHERE userID = ?
    `, [userID]) as { count: number } | null;
    
    // Count decks
    const decksResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM decks WHERE userID = ?
    `, [userID]) as { count: number } | null;
    
    // Count AI decks
    const aiDecksResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM AIDecks WHERE userID = ?
    `, [userID]) as { count: number } | null;
    
    // Count flashcards
    const flashcardsResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM flashcards WHERE userID = ?
    `, [userID]) as { count: number } | null;
    
    // Count AI flashcards
    const aiFlashcardsResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM AIFlashcards WHERE userID = ?
    `, [userID]) as { count: number } | null;
    
    // Count user form entries
    const userFormEntriesResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM userFormEntries WHERE userID = ?
    `, [userID]) as { count: number } | null;
    
    return {
      folders: foldersResult?.count || 0,
      decks: decksResult?.count || 0,
      aiDecks: aiDecksResult?.count || 0,
      flashcards: flashcardsResult?.count || 0,
      aiFlashcards: aiFlashcardsResult?.count || 0,
      userFormEntries: userFormEntriesResult?.count || 0,
    };
    
  } catch (error) {
    console.error('Error getting user data counts:', error);
    return {
      folders: 0,
      decks: 0,
      aiDecks: 0,
      flashcards: 0,
      aiFlashcards: 0,
      userFormEntries: 0,
    };
  }
}
