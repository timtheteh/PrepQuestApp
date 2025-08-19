import { db } from './index';
import { createAuthenticatedSupabaseClient } from '../supabase/supabase';
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

// Interface definitions for backup data
export interface BackupFolder {
  folderID: number; // Original SQLite ID - preserved in Supabase
  userID: string;
  folderName: string;
  dateAdded: string;
  lastModifiedDate?: string;
  isFavorited: number;
}

export interface BackupDeck {
  deckID: number; // Original SQLite ID - preserved in Supabase
  userID: string;
  deckName: string;
  dateAdded: string;
  lastModifiedDate?: string;
  isFavorited: number;
  deckType: string;
  creationMethod: string;
  lastStudiedDate?: string;
  lastQuizzedDate?: string;
  cardDesignIndex: number;
  isAIDeck: number;
  folderIDs?: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  studyTopicsSubtopics?: string;
  studyExamQuiz?: string;
  interviewJobRole?: string;
  interviewType?: string;
  interviewCompany?: string;
  interviewExperienceLevel?: string;
  interviewTopics?: string;
  interviewCompanyIcon?: string;
  AICardDesignIndex?: number;
}

export interface BackupFlashcard {
  flashcardID: number; // Original SQLite ID - preserved in Supabase
  userID: string;
  deckID: number; // References the original SQLite deckID
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText?: string;
  questionBlob?: Uint8Array;
  answerType: string;
  answerText?: string;
  answerMCQ?: string;
  answerBlob?: Uint8Array;
  timeTaken?: number;
  isMcqAnswerRight: number;
  lastStudiedDate?: string;
  lastQuizzedDate?: string;
}

export interface BackupUserFormEntry {
  formEntryID: number; // Original SQLite ID - preserved in Supabase
  userID: string;
  formEntryType?: string;
  formEntryMethod?: string;
  formSubmissionDate: string;
  deckName: string;
  numberOfQuestions?: number;
  kindsOfQuestions?: string;
  youtubeLink?: string;
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
}

export interface BackupUser {
  userID: string;
  dateJoined?: string;
  accumulatedDecksCreated: number;
  accumulatedFlashcardsCreated: number;
  accumulatedStudyDecksCreated: number;
  accumulatedInterviewDecksCreated: number;
  lastUpdated: string;
  notificationsEnabled: number;
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
  language: string;
  currentPlan: string;
  fileUploadRequests: number;
  genAIFormRequests: number;
  youtubeLinkRequests: number;
  chatWithAIRequests: number;
}

// Utility functions to extract data from SQLite database

/**
 * Extract all folders for the current user from SQLite
 */
export async function extractFoldersFromSQLite(): Promise<BackupFolder[]> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT * FROM folders WHERE userID = ?
      ORDER BY dateAdded ASC
    `, [userID]);
    
    return result as BackupFolder[];
  } catch (error) {
    console.error('Error extracting folders from SQLite:', error);
    throw error;
  }
}

/**
 * Extract all regular decks (excluding AI decks) for the current user from SQLite
 */
export async function extractDecksFromSQLite(): Promise<BackupDeck[]> {
  try {
    const userID = await getCurrentUserID();
    
    // Get only regular decks (exclude AI decks)
    const regularDecks = await db.getAllAsync(`
      SELECT * FROM decks WHERE userID = ?
      ORDER BY dateAdded ASC
    `, [userID]);
    
    return regularDecks as BackupDeck[];
  } catch (error) {
    console.error('Error extracting decks from SQLite:', error);
    throw error;
  }
}

/**
 * Extract all regular flashcards (excluding AI flashcards) for the current user from SQLite
 */
export async function extractFlashcardsFromSQLite(): Promise<BackupFlashcard[]> {
  try {
    const userID = await getCurrentUserID();
    
    // Get only regular flashcards (exclude AI flashcards)
    const regularFlashcards = await db.getAllAsync(`
      SELECT * FROM flashcards WHERE userID = ?
      ORDER BY flashcardID ASC
    `, [userID]);
    
    return regularFlashcards as BackupFlashcard[];
  } catch (error) {
    console.error('Error extracting flashcards from SQLite:', error);
    throw error;
  }
}

/**
 * Extract the 5 most recent user form entries for each form method from SQLite
 */
export async function extractRecentUserFormEntriesFromSQLite(): Promise<BackupUserFormEntry[]> {
  try {
    const userID = await getCurrentUserID();
    
    // Get top 5 entries for each form method
    const formMethods = ['genAIForm', 'fileUpload', 'manual', 'youtubeLink'];
    const allEntries: BackupUserFormEntry[] = [];
    
    for (const method of formMethods) {
      const result = await db.getAllAsync(`
        SELECT * FROM userFormEntries 
        WHERE userID = ? AND formEntryMethod = ?
        ORDER BY formSubmissionDate DESC
        LIMIT 5
      `, [userID, method]);
      
      allEntries.push(...(result as BackupUserFormEntry[]));
    }
    
    // Sort all entries by submission date (most recent first)
    allEntries.sort((a, b) => new Date(b.formSubmissionDate).getTime() - new Date(a.formSubmissionDate).getTime());
    
    return allEntries;
  } catch (error) {
    console.error('Error extracting user form entries from SQLite:', error);
    throw error;
  }
}

/**
 * Extract the user data for the current user from SQLite
 */
export async function extractUserFromSQLite(): Promise<BackupUser | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT * FROM users WHERE userID = ?
    `, [userID]);
    
    return result as BackupUser | null;
  } catch (error) {
    console.error('Error extracting user from SQLite:', error);
    throw error;
  }
}

// Supabase upload functions

/**
 * Upload folders to Supabase
 */
export async function uploadFoldersToSupabase(folders: BackupFolder[], token: string): Promise<boolean> {
  try {
    if (folders.length === 0) {
      console.log('No folders to upload');
      return true;
    }

    // Create authenticated Supabase client
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // Keep the original folderID as a field in Supabase (Supabase will generate its own 'id' field)
    const { error } = await authenticatedSupabase
      .from('folders')
      .upsert(folders, { 
        onConflict: 'userID,folderID',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error uploading folders to Supabase:', error);
      return false;
    }

    console.log(`Successfully uploaded ${folders.length} folders to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadFoldersToSupabase:', error);
    return false;
  }
}

/**
 * Upload decks to Supabase
 */
export async function uploadDecksToSupabase(decks: BackupDeck[], token: string): Promise<boolean> {
  try {
    if (decks.length === 0) {
      console.log('No decks to upload');
      return true;
    }

    // Create authenticated Supabase client
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // Keep the original deckID as a field in Supabase (Supabase will generate its own 'id' field)
    const { error } = await authenticatedSupabase
      .from('decks')
      .upsert(decks, { 
        onConflict: 'userID,deckID',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error uploading decks to Supabase:', error);
      return false;
    }

    console.log(`Successfully uploaded ${decks.length} decks to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadDecksToSupabase:', error);
    return false;
  }
}

/**
 * Upload flashcards to Supabase
 */
export async function uploadFlashcardsToSupabase(flashcards: BackupFlashcard[], token: string): Promise<boolean> {
  try {
    if (flashcards.length === 0) {
      console.log('No flashcards to upload');
      return true;
    }

    // Create authenticated Supabase client
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // Process flashcards in smaller batches to avoid timeout
    const batchSize = 25; // Reduced from 100 to 25
    const batches = [];
    
    for (let i = 0; i < flashcards.length; i += batchSize) {
      batches.push(flashcards.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          // Keep the original flashcardID as a field in Supabase (Supabase will generate its own 'id' field)
          const { error } = await authenticatedSupabase
            .from('flashcards')
            .upsert(batch, { 
              onConflict: 'userID,flashcardID',
              ignoreDuplicates: false 
            });

          if (error) {
            throw error;
          }

          // Success - break out of retry loop
          break;
        } catch (error) {
          retries++;
          console.log(`Batch ${i + 1}/${batches.length} failed, retry ${retries}/${maxRetries}:`, error);
          
          if (retries >= maxRetries) {
            console.error('Error uploading flashcard batch to Supabase after retries:', error);
            return false;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Successfully uploaded ${flashcards.length} flashcards to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadFlashcardsToSupabase:', error);
    return false;
  }
}

/**
 * Upload user form entries to Supabase
 */
export async function uploadUserFormEntriesToSupabase(userFormEntries: BackupUserFormEntry[], token: string): Promise<boolean> {
  try {
    if (userFormEntries.length === 0) {
      console.log('No user form entries to upload');
      return true;
    }

    // Create authenticated Supabase client
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // Keep the original formEntryID as a field in Supabase (Supabase will generate its own 'id' field)
    const { error } = await authenticatedSupabase
      .from('userFormEntries')
      .upsert(userFormEntries, { 
        onConflict: 'userID,formEntryID',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error uploading user form entries to Supabase:', error);
      return false;
    }

    console.log(`Successfully uploaded ${userFormEntries.length} user form entries to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadUserFormEntriesToSupabase:', error);
    return false;
  }
}

/**
 * Upload user data to Supabase
 */
export async function uploadUserToSupabase(user: BackupUser, token: string): Promise<boolean> {
  try {
    // Create authenticated Supabase client
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    const { error } = await authenticatedSupabase
      .from('users')
      .upsert([user], { 
        onConflict: 'userID',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error uploading user to Supabase:', error);
      return false;
    }

    console.log('Successfully uploaded user data to Supabase');
    return true;
  } catch (error) {
    console.error('Error in uploadUserToSupabase:', error);
    return false;
  }
}

// Progress tracking interface
export interface BackupProgress {
  stage: string;
  completed: number;
  total: number;
  message: string;
}

/**
 * Main backup function that orchestrates the entire backup process
 */
export async function backupDataToCloud(
  token: string,
  onProgress?: (progress: BackupProgress) => void
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Starting backup process...');
    
    // Stage 1: Extract data from SQLite
    onProgress?.({ stage: 'extracting', completed: 0, total: 5, message: 'Extracting folders...' });
    const folders = await extractFoldersFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 1, total: 5, message: 'Extracting decks...' });
    const decks = await extractDecksFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 2, total: 5, message: 'Extracting flashcards...' });
    const flashcards = await extractFlashcardsFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 3, total: 5, message: 'Extracting user form entries...' });
    const userFormEntries = await extractRecentUserFormEntriesFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 4, total: 5, message: 'Extracting user data...' });
    const user = await extractUserFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 5, total: 5, message: 'Data extraction complete' });

    if (!user) {
      return { success: false, message: 'User data not found in local database' };
    }

    // Stage 2: Upload to Supabase
    onProgress?.({ stage: 'uploading', completed: 0, total: 5, message: 'Uploading folders...' });
    const foldersSuccess = await uploadFoldersToSupabase(folders, token);
    if (!foldersSuccess) {
      return { success: false, message: 'Failed to upload folders to cloud' };
    }
    
    onProgress?.({ stage: 'uploading', completed: 1, total: 5, message: 'Uploading decks...' });
    const decksSuccess = await uploadDecksToSupabase(decks, token);
    if (!decksSuccess) {
      return { success: false, message: 'Failed to upload decks to cloud' };
    }
    
    onProgress?.({ stage: 'uploading', completed: 2, total: 5, message: 'Uploading flashcards...' });
    const flashcardsSuccess = await uploadFlashcardsToSupabase(flashcards, token);
    if (!flashcardsSuccess) {
      return { success: false, message: 'Failed to upload flashcards to cloud' };
    }
    
    onProgress?.({ stage: 'uploading', completed: 3, total: 5, message: 'Uploading user form entries...' });
    const userFormEntriesSuccess = await uploadUserFormEntriesToSupabase(userFormEntries, token);
    if (!userFormEntriesSuccess) {
      return { success: false, message: 'Failed to upload user form entries to cloud' };
    }
    
    onProgress?.({ stage: 'uploading', completed: 4, total: 5, message: 'Uploading user data...' });
    const userSuccess = await uploadUserToSupabase(user, token);
    if (!userSuccess) {
      return { success: false, message: 'Failed to upload user data to cloud' };
    }
    
    onProgress?.({ stage: 'uploading', completed: 5, total: 5, message: 'Backup complete!' });

    const totalItems = folders.length + decks.length + flashcards.length + userFormEntries.length + 1;
    console.log(`Backup completed successfully! Uploaded ${totalItems} total items to cloud.`);
    
    return { 
      success: true, 
      message: `Backup completed successfully! Uploaded ${totalItems} items to cloud.` 
    };
  } catch (error) {
    console.error('Error during backup process:', error);
    return { 
      success: false, 
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
