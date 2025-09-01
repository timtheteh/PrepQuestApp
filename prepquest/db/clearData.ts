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

// Interface for backup data before clearing
export interface BackupData {
  folders: any[];
  decks: any[];
  flashcards: any[];
  userFormEntries: any[];
}

// Progress tracking interface
export interface ClearDataProgress {
  stage: string;
  completed: number;
  total: number;
  message: string;
  rowsProcessed?: number;
  totalRows?: number;
  percentage?: number;
}

// Progress reporting function type
type ProgressReporter = (stage: string, message: string, rowsJustProcessed: number) => void;

// Cancellation checker function type
type CancellationChecker = () => boolean;

/**
 * Backup current data before clearing (for rollback capability)
 */
export async function backupCurrentData(
  reportProgress: ProgressReporter,
  isCancelled?: CancellationChecker
): Promise<BackupData | null> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('Data backup cancelled by user');
      return null;
    }

    reportProgress('backing_up', 'Backing up current data...', 0);
    
    // Backup folders
    const folders = await db.getAllAsync(`
      SELECT * FROM folders WHERE userID = ?
      ORDER BY dateAdded ASC
    `, [userID]);
    
    if (isCancelled?.()) return null;
    reportProgress('backing_up', 'Backing up folders...', folders.length);
    
    // Backup decks
    const decks = await db.getAllAsync(`
      SELECT * FROM decks WHERE userID = ?
      ORDER BY dateAdded ASC
    `, [userID]);
    
    if (isCancelled?.()) return null;
    reportProgress('backing_up', 'Backing up decks...', decks.length);
    
    // Backup flashcards
    const flashcards = await db.getAllAsync(`
      SELECT * FROM flashcards WHERE userID = ?
      ORDER BY flashcardID ASC
    `, [userID]);
    
    if (isCancelled?.()) return null;
    reportProgress('backing_up', 'Backing up flashcards...', flashcards.length);
    
    // Backup user form entries (keep 5 most recent for each type)
    const formMethods = ['genAIForm', 'fileUpload', 'manual', 'youtubeLink'];
    const allUserFormEntries: any[] = [];
    
    for (const method of formMethods) {
      if (isCancelled?.()) return null;
      
      const result = await db.getAllAsync(`
        SELECT * FROM userFormEntries 
        WHERE userID = ? AND formEntryMethod = ?
        ORDER BY formSubmissionDate DESC
        LIMIT 5
      `, [userID, method]);
      
      allUserFormEntries.push(...result);
      reportProgress('backing_up', `Backing up ${method} form entries...`, result.length);
    }
    
    const backupData: BackupData = {
      folders,
      decks,
      flashcards,
      userFormEntries: allUserFormEntries
    };
    
    console.log(`Backup completed: ${folders.length} folders, ${decks.length} decks, ${flashcards.length} flashcards, ${allUserFormEntries.length} form entries`);
    return backupData;
  } catch (error) {
    console.error('Error backing up current data:', error);
    return null;
  }
}

/**
 * Clear folders data
 */
async function clearFoldersData(
  reportProgress: ProgressReporter,
  isCancelled?: CancellationChecker
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('Folder clearing cancelled by user');
      return false;
    }

    // Get count for progress tracking
    const countResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM folders WHERE userID = ?
    `, [userID]);
    const totalFolders = (countResult as any).count || 0;
    
    if (totalFolders === 0) {
      console.log('No folders to clear');
      return true;
    }

    // Delete folders in chunks for progress tracking
    const chunkSize = 50;
    let deletedCount = 0;
    
    while (deletedCount < totalFolders) {
      if (isCancelled?.()) {
        console.log('Folder clearing cancelled during chunk processing');
        return false;
      }
      
      const chunk = await db.getAllAsync(`
        SELECT folderID FROM folders WHERE userID = ? 
        ORDER BY dateAdded ASC 
        LIMIT ? OFFSET ?
      `, [userID, chunkSize, deletedCount]);
      
      if (chunk.length === 0) break;
      
      const folderIds = chunk.map((f: any) => f.folderID);
      const folderIdsString = folderIds.join(',');
      
      await db.runAsync(`
        DELETE FROM folders WHERE folderID IN (${folderIdsString}) AND userID = ?
      `, [userID]);
      
      deletedCount += chunk.length;
      reportProgress('clearing', `Clearing folders... (${deletedCount}/${totalFolders})`, chunk.length);
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Successfully cleared ${deletedCount} folders`);
    return true;
  } catch (error) {
    console.error('Error clearing folders data:', error);
    return false;
  }
}

/**
 * Clear decks data
 */
async function clearDecksData(
  reportProgress: ProgressReporter,
  isCancelled?: CancellationChecker
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('Deck clearing cancelled by user');
      return false;
    }

    // Get count for progress tracking
    const countResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM decks WHERE userID = ?
    `, [userID]);
    const totalDecks = (countResult as any).count || 0;
    
    if (totalDecks === 0) {
      console.log('No decks to clear');
      return true;
    }

    // Delete decks in chunks for progress tracking
    const chunkSize = 50;
    let deletedCount = 0;
    
    while (deletedCount < totalDecks) {
      if (isCancelled?.()) {
        console.log('Deck clearing cancelled during chunk processing');
        return false;
      }
      
      const chunk = await db.getAllAsync(`
        SELECT deckID FROM decks WHERE userID = ? 
        ORDER BY dateAdded ASC 
        LIMIT ? OFFSET ?
      `, [userID, chunkSize, deletedCount]);
      
      if (chunk.length === 0) break;
      
      const deckIds = chunk.map((d: any) => d.deckID);
      const deckIdsString = deckIds.join(',');
      
      await db.runAsync(`
        DELETE FROM decks WHERE deckID IN (${deckIdsString}) AND userID = ?
      `, [userID]);
      
      deletedCount += chunk.length;
      reportProgress('clearing', `Clearing decks... (${deletedCount}/${totalDecks})`, chunk.length);
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Successfully cleared ${deletedCount} decks`);
    return true;
  } catch (error) {
    console.error('Error clearing decks data:', error);
    return false;
  }
}

/**
 * Clear flashcards data
 */
async function clearFlashcardsData(
  reportProgress: ProgressReporter,
  isCancelled?: CancellationChecker
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('Flashcard clearing cancelled by user');
      return false;
    }

    // Get count for progress tracking
    const countResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM flashcards WHERE userID = ?
    `, [userID]);
    const totalFlashcards = (countResult as any).count || 0;
    
    if (totalFlashcards === 0) {
      console.log('No flashcards to clear');
      return true;
    }

    // Delete flashcards in chunks for progress tracking
    const chunkSize = 100; // Larger chunks for flashcards
    let deletedCount = 0;
    
    while (deletedCount < totalFlashcards) {
      if (isCancelled?.()) {
        console.log('Flashcard clearing cancelled during chunk processing');
        return false;
      }
      
      const chunk = await db.getAllAsync(`
        SELECT flashcardID FROM flashcards WHERE userID = ? 
        ORDER BY flashcardID ASC 
        LIMIT ? OFFSET ?
      `, [userID, chunkSize, deletedCount]);
      
      if (chunk.length === 0) break;
      
      const flashcardIds = chunk.map((f: any) => f.flashcardID);
      const flashcardIdsString = flashcardIds.join(',');
      
      await db.runAsync(`
        DELETE FROM flashcards WHERE flashcardID IN (${flashcardIdsString}) AND userID = ?
      `, [userID]);
      
      deletedCount += chunk.length;
      reportProgress('clearing', `Clearing flashcards... (${deletedCount}/${totalFlashcards})`, chunk.length);
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Successfully cleared ${deletedCount} flashcards`);
    return true;
  } catch (error) {
    console.error('Error clearing flashcards data:', error);
    return false;
  }
}

/**
 * Clear user form entries data (keeping 5 most recent for each type)
 */
async function clearUserFormEntriesData(
  reportProgress: ProgressReporter,
  isCancelled?: CancellationChecker
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('User form entries clearing cancelled by user');
      return false;
    }

    // Get count for progress tracking
    const countResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM userFormEntries WHERE userID = ?
    `, [userID]);
    const totalFormEntries = (countResult as any).count || 0;
    
    if (totalFormEntries === 0) {
      console.log('No user form entries to clear');
      return true;
    }

    // For each form method, keep only the 5 most recent entries
    const formMethods = ['genAIForm', 'fileUpload', 'manual', 'youtubeLink'];
    let totalDeleted = 0;
    
    for (const method of formMethods) {
      if (isCancelled?.()) {
        console.log('User form entries clearing cancelled during method processing');
        return false;
      }
      
      // Get all entries for this method except the 5 most recent
      const entriesToDelete = await db.getAllAsync(`
        SELECT formEntryID FROM userFormEntries 
        WHERE userID = ? AND formEntryMethod = ?
        ORDER BY formSubmissionDate DESC
        LIMIT -1 OFFSET 5
      `, [userID, method]);
      
      if (entriesToDelete.length > 0) {
        const entryIds = entriesToDelete.map((e: any) => e.formEntryID);
        const entryIdsString = entryIds.join(',');
        
        await db.runAsync(`
          DELETE FROM userFormEntries WHERE formEntryID IN (${entryIdsString}) AND userID = ?
        `, [userID]);
        
        totalDeleted += entriesToDelete.length;
        reportProgress('clearing', `Clearing ${method} form entries...`, entriesToDelete.length);
      }
      
      // Small delay between methods
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Successfully cleared ${totalDeleted} user form entries (kept 5 most recent for each type)`);
    return true;
  } catch (error) {
    console.error('Error clearing user form entries data:', error);
    return false;
  }
}

/**
 * Restore data from backup (rollback functionality)
 */
export async function restoreDataFromBackup(
  backupData: BackupData,
  reportProgress: ProgressReporter,
  isCancelled?: CancellationChecker
): Promise<boolean> {
  try {
    if (isCancelled?.()) {
      console.log('Data restoration cancelled by user');
      return false;
    }

    reportProgress('restoring', 'Restoring data from backup...', 0);
    
    // Start transaction for atomic restoration
    await db.runAsync('BEGIN TRANSACTION');
    
    try {
      // Restore folders
      if (backupData.folders.length > 0) {
        for (const folder of backupData.folders) {
          if (isCancelled?.()) {
            await db.runAsync('ROLLBACK');
            return false;
          }
          
          await db.runAsync(`
            INSERT INTO folders (
              folderID, userID, folderName, dateAdded, lastModifiedDate, isFavorited
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            folder.folderID,
            folder.userID,
            folder.folderName,
            folder.dateAdded,
            folder.lastModifiedDate || null,
            folder.isFavorited
          ]);
        }
        reportProgress('restoring', 'Restoring folders...', backupData.folders.length);
      }
      
      // Restore decks
      if (backupData.decks.length > 0) {
        for (const deck of backupData.decks) {
          if (isCancelled?.()) {
            await db.runAsync('ROLLBACK');
            return false;
          }
          
          await db.runAsync(`
            INSERT INTO decks (
              deckID, userID, deckName, dateAdded, lastModifiedDate, isFavorited,
              deckType, creationMethod, lastStudiedDate, lastQuizzedDate, cardDesignIndex,
              isAIDeck, folderIDs, studyEducationLevel, studySubjects, studyTopicsSubtopics,
              studyExamQuiz, interviewJobRole, interviewType, interviewCompany,
              interviewExperienceLevel, interviewTopics, interviewCompanyIcon, AICardDesignIndex
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            deck.deckID,
            deck.userID,
            deck.deckName,
            deck.dateAdded,
            deck.lastModifiedDate || null,
            deck.isFavorited,
            deck.deckType,
            deck.creationMethod,
            deck.lastStudiedDate || null,
            deck.lastQuizzedDate || null,
            deck.cardDesignIndex,
            deck.isAIDeck,
            deck.folderIDs || null,
            deck.studyEducationLevel || null,
            deck.studySubjects || null,
            deck.studyTopicsSubtopics || null,
            deck.studyExamQuiz || null,
            deck.interviewJobRole || null,
            deck.interviewType || null,
            deck.interviewCompany || null,
            deck.interviewExperienceLevel || null,
            deck.interviewTopics || null,
            deck.interviewCompanyIcon || null,
            deck.AICardDesignIndex || null
          ]);
        }
        reportProgress('restoring', 'Restoring decks...', backupData.decks.length);
      }
      
      // Restore flashcards
      if (backupData.flashcards.length > 0) {
        for (const flashcard of backupData.flashcards) {
          if (isCancelled?.()) {
            await db.runAsync('ROLLBACK');
            return false;
          }
          
          await db.runAsync(`
            INSERT INTO flashcards (
              flashcardID, userID, deckID, difficultyRating, cognitiveQnType, isFavorited,
              questionType, questionText, questionBlob, answerType, answerText, answerMCQ,
              answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            flashcard.flashcardID,
            flashcard.userID,
            flashcard.deckID,
            flashcard.difficultyRating,
            flashcard.cognitiveQnType,
            flashcard.isFavorited,
            flashcard.questionType,
            flashcard.questionText || null,
            flashcard.questionBlob || null,
            flashcard.answerType,
            flashcard.answerText || null,
            flashcard.answerMCQ || null,
            flashcard.answerBlob || null,
            flashcard.timeTaken || null,
            flashcard.isMcqAnswerRight,
            flashcard.lastStudiedDate || null,
            flashcard.lastQuizzedDate || null
          ]);
        }
        reportProgress('restoring', 'Restoring flashcards...', backupData.flashcards.length);
      }
      
      // Restore user form entries
      if (backupData.userFormEntries.length > 0) {
        for (const entry of backupData.userFormEntries) {
          if (isCancelled?.()) {
            await db.runAsync('ROLLBACK');
            return false;
          }
          
          await db.runAsync(`
            INSERT INTO userFormEntries (
              formEntryID, userID, formEntryType, formEntryMethod, formSubmissionDate, deckName,
              numberOfQuestions, kindsOfQuestions, youtubeLink, studyEducationLevel, studySubjects,
              studyTopics, studySubtopics, studyExam, interviewJobRole, interviewType, interviewCompany,
              interviewExperienceLevel, interviewTopics
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            entry.formEntryID,
            entry.userID,
            entry.formEntryType || null,
            entry.formEntryMethod || null,
            entry.formSubmissionDate,
            entry.deckName,
            entry.numberOfQuestions || null,
            entry.kindsOfQuestions || null,
            entry.youtubeLink || null,
            entry.studyEducationLevel || null,
            entry.studySubjects || null,
            entry.studyTopics || null,
            entry.studySubtopics || null,
            entry.studyExam || null,
            entry.interviewJobRole || null,
            entry.interviewType || null,
            entry.interviewCompany || null,
            entry.interviewExperienceLevel || null,
            entry.interviewTopics || null
          ]);
        }
        reportProgress('restoring', 'Restoring user form entries...', backupData.userFormEntries.length);
      }
      
      // Commit transaction
      await db.runAsync('COMMIT');
      console.log('Data restoration completed successfully');
      return true;
    } catch (transactionError) {
      // Rollback on any error within transaction
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error restoring data from backup:', error);
    return false;
  }
}

/**
 * Main clear data function that orchestrates the entire clearing process
 */
export async function clearLocalStorageData(
  onProgress?: (progress: ClearDataProgress) => void,
  isCancelled?: CancellationChecker
): Promise<{ success: boolean; message: string; cancelled?: boolean; backupData?: BackupData }> {
  let backupData: BackupData | null = null;
  
  try {
    console.log('Starting clear local storage data process...');
    
    // Calculate total rows for progress tracking (only deletion, not backup)
    const userID = await getCurrentUserID();
    
    const [foldersCount, decksCount, flashcardsCount, formEntriesCount] = await Promise.all([
      db.getFirstAsync('SELECT COUNT(*) as count FROM folders WHERE userID = ?', [userID]),
      db.getFirstAsync('SELECT COUNT(*) as count FROM decks WHERE userID = ?', [userID]),
      db.getFirstAsync('SELECT COUNT(*) as count FROM flashcards WHERE userID = ?', [userID]),
      db.getFirstAsync('SELECT COUNT(*) as count FROM userFormEntries WHERE userID = ?', [userID])
    ]);
    
    const totalRowsToDelete = (foldersCount as any).count + (decksCount as any).count + (flashcardsCount as any).count + (formEntriesCount as any).count;
    
    if (totalRowsToDelete === 0) {
      return { success: false, message: 'NO_DATA_TO_CLEAR' };
    }
    
    // Progress tracking state - separate for backup and deletion
    const progressState = {
      totalRowsToDelete,
      backupRowsProcessed: 0,
      deletionRowsProcessed: 0
    };
    
    // Progress reporting function for backup phase (doesn't count toward deletion percentage)
    const reportBackupProgress: ProgressReporter = (stage: string, message: string, rowsJustProcessed: number = 0) => {
      progressState.backupRowsProcessed += rowsJustProcessed;
      // During backup, show 0-50% progress
      const percentage = Math.min(50, Math.round((progressState.backupRowsProcessed / (progressState.backupRowsProcessed + totalRowsToDelete)) * 50));
      
      onProgress?.({
        stage: 'backing_up',
        completed: progressState.backupRowsProcessed,
        total: totalRowsToDelete,
        message,
        rowsProcessed: progressState.backupRowsProcessed,
        totalRows: totalRowsToDelete,
        percentage
      });
    };
    
    // Progress reporting function for deletion phase (counts toward deletion percentage)
    const reportDeletionProgress: ProgressReporter = (stage: string, message: string, rowsJustProcessed: number = 0) => {
      progressState.deletionRowsProcessed += rowsJustProcessed;
      // During deletion, show 50-100% progress
      const percentage = Math.min(100, 50 + Math.round((progressState.deletionRowsProcessed / totalRowsToDelete) * 50));
      
      onProgress?.({
        stage: 'clearing',
        completed: progressState.deletionRowsProcessed,
        total: totalRowsToDelete,
        message,
        rowsProcessed: progressState.deletionRowsProcessed,
        totalRows: totalRowsToDelete,
        percentage
      });
    };
    
    // Stage 1: Backup current data
    reportBackupProgress('backing_up', 'Backing up current data...', 0);
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    backupData = await backupCurrentData(reportBackupProgress, isCancelled);
    if (!backupData) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to backup current data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    // Stage 2: Clear data
    reportDeletionProgress('clearing', 'Starting data clearing...', 0);
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const foldersSuccess = await clearFoldersData(reportDeletionProgress, isCancelled);
    if (!foldersSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear folders data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const decksSuccess = await clearDecksData(reportDeletionProgress, isCancelled);
    if (!decksSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear decks data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const flashcardsSuccess = await clearFlashcardsData(reportDeletionProgress, isCancelled);
    if (!flashcardsSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear flashcards data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const formEntriesSuccess = await clearUserFormEntriesData(reportDeletionProgress, isCancelled);
    if (!formEntriesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear user form entries data' };
    }
    
    reportDeletionProgress('clearing', 'Clear data complete!', 0);
    
    console.log(`Clear data completed successfully! Cleared ${totalRowsToDelete} total items.`);
    
    return {
      success: true,
      message: `Clear data completed!`,
      backupData
    };
  } catch (error) {
    console.error('Error during clear data process:', error);
    
    return {
      success: false,
      message: `Clear data failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      backupData: backupData || undefined
    };
  }
}
