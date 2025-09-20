import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserID } from './decks';

// Using cached getCurrentUserID from decks.ts

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
type ProgressReporter = (stage: string, message: string) => void;

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

    reportProgress('backing_up', 'Backing up current data...');
    
    // Backup all data
    const [folders, decks, flashcards] = await Promise.all([
      db.getAllAsync(`SELECT * FROM folders WHERE userID = ? ORDER BY dateAdded ASC`, [userID]),
      db.getAllAsync(`SELECT * FROM decks WHERE userID = ? ORDER BY dateAdded ASC`, [userID]),
      db.getAllAsync(`SELECT * FROM flashcards WHERE userID = ? ORDER BY flashcardID ASC`, [userID])
    ]);
    
    if (isCancelled?.()) return null;
    
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

    // Delete all folders for the user
    const result = await db.runAsync(`
      DELETE FROM folders WHERE userID = ?
    `, [userID]);
    
    console.log(`Successfully cleared folders`);
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

    // Delete all decks for the user
    const result = await db.runAsync(`
      DELETE FROM decks WHERE userID = ?
    `, [userID]);
    
    console.log(`Successfully cleared decks`);
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

    // Delete all flashcards for the user
    const result = await db.runAsync(`
      DELETE FROM flashcards WHERE userID = ?
    `, [userID]);
    
    console.log(`Successfully cleared flashcards`);
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
      }
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

    reportProgress('restoring', 'Restoring data from backup...');
    
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
        reportProgress('restoring', 'Restoring folders...');
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
        reportProgress('restoring', 'Restoring decks...');
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
        reportProgress('restoring', 'Restoring flashcards...');
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
        reportProgress('restoring', 'Restoring user form entries...');
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
    
    // Check if there's any data to clear
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
    
    // Simple progress reporter
    const reportProgress = (stage: string, message: string) => {
      onProgress?.({
        stage,
        completed: 0,
        total: 0,
        message,
        rowsProcessed: 0,
        totalRows: 0,
        percentage: 0
      });
    };
    
    // Stage 1: Backup current data
    reportProgress('backing_up', 'Backing up current data...');
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    backupData = await backupCurrentData(reportProgress, isCancelled);
    if (!backupData) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to backup current data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    // Stage 2: Clear data
    reportProgress('clearing', 'Clearing local data...');
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const foldersSuccess = await clearFoldersData(reportProgress, isCancelled);
    if (!foldersSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear folders data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const decksSuccess = await clearDecksData(reportProgress, isCancelled);
    if (!decksSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear decks data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const flashcardsSuccess = await clearFlashcardsData(reportProgress, isCancelled);
    if (!flashcardsSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear flashcards data' };
    }
    if (isCancelled?.()) return { success: false, message: 'Clear data cancelled by user', cancelled: true };
    
    const formEntriesSuccess = await clearUserFormEntriesData(reportProgress, isCancelled);
    if (!formEntriesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Clear data cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to clear user form entries data' };
    }
    
    reportProgress('clearing', 'Clear data complete!');
    
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
