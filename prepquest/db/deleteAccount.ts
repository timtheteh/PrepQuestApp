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
    
    // Start a transaction to ensure data consistency
    await db.execAsync('BEGIN TRANSACTION');
    
    // Delete from all user-related tables in the correct order (respecting foreign key constraints)
    
    // 1. Delete flashcards first (they reference decks)
    await db.runAsync(`DELETE FROM flashcards WHERE userID = ?`, [userID]);
    console.log(`Deleted flashcards for user ${userID}`);
    
    // 2. Delete AI flashcards (they reference AI decks)
    await db.runAsync(`DELETE FROM AIFlashcards WHERE userID = ?`, [userID]);
    console.log(`Deleted AI flashcards for user ${userID}`);
    
    // 3. Delete decks
    await db.runAsync(`DELETE FROM decks WHERE userID = ?`, [userID]);
    console.log(`Deleted decks for user ${userID}`);
    
    // 4. Delete AI decks
    await db.runAsync(`DELETE FROM AIDecks WHERE userID = ?`, [userID]);
    console.log(`Deleted AI decks for user ${userID}`);
    
    // 5. Delete folders
    await db.runAsync(`DELETE FROM folders WHERE userID = ?`, [userID]);
    console.log(`Deleted folders for user ${userID}`);
    
    // 6. Delete user form entries
    await db.runAsync(`DELETE FROM userFormEntries WHERE userID = ?`, [userID]);
    console.log(`Deleted user form entries for user ${userID}`);
    
    // 7. Delete user record
    await db.runAsync(`DELETE FROM users WHERE userID = ?`, [userID]);
    console.log(`Deleted user record for user ${userID}`);
    
    // Commit the transaction
    await db.execAsync('COMMIT');
    
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
