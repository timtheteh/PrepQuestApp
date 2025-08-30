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

// Network error detection helper
function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check for common network error patterns
  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  // Common network error indicators
  const networkErrorPatterns = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'unreachable',
    'offline',
    'no internet',
    'dns',
    'enotfound',
    'econnrefused',
    'econnreset',
    'etimedout'
  ];
  
  // Check error message and name for network patterns
  const hasNetworkPattern = networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorName.includes(pattern)
  );
  
  // Check for specific error types
  const isNetworkErrorType = error instanceof TypeError && errorMessage.includes('failed to fetch');
  const isAbortError = error.name === 'AbortError';
  
  // Check for common HTTP status codes that indicate network issues
  const networkStatusCodes = [0, 502, 503, 504];
  const hasNetworkStatusCode = error.status && networkStatusCodes.includes(error.status);
  
  return hasNetworkPattern || isNetworkErrorType || hasNetworkStatusCode || isAbortError;
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
      const maxRetries = 2;

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
  rowsUploaded?: number;
  totalRows?: number;
  percentage?: number;
}

// Progress reporting function type
type ProgressReporter = (stage: string, message: string, rowsJustUploaded: number) => void;

// Token getter function type
type TokenGetter = () => Promise<string | null>;

// Chunked upload functions with progress tracking

/**
 * Upload folders to Supabase with chunked progress tracking
 */
async function uploadFoldersToSupabaseWithProgress(
  folders: BackupFolder[], 
  getToken: TokenGetter, 
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    if (folders.length === 0) {
      console.log('No folders to upload');
      return true;
    }

    // Upload in chunks with progress reporting every 3 seconds
    const chunkSize = 10;
    let lastReportTime = Date.now();
    
    for (let i = 0; i < folders.length; i += chunkSize) {
      // Check for cancellation before processing each chunk
      if (isCancelled?.()) {
        console.log('Folder upload cancelled by user');
        return false;
      }
      
      const chunk = folders.slice(i, i + chunkSize);
      
      // Get fresh token for each chunk to handle expiration
      const token = await getToken();
      if (!token) {
        console.error('Unable to get authentication token for folders');
        return false;
      }
      
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
      
      const { error } = await authenticatedSupabase
        .from('folders')
        .upsert(chunk, { 
          onConflict: 'userID,folderID',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error uploading folder chunk to Supabase:', error);
        if (isNetworkError(error)) {
          throw error; // Propagate network errors up to main backup function
        }
        return false;
      }

      // Report progress every 3 seconds or on last chunk
      const now = Date.now();
      if (now - lastReportTime >= 3000 || i + chunkSize >= folders.length) {
        reportProgress('uploading', 'Uploading folders...', chunk.length);
        lastReportTime = now;
      } else {
        // Still count the rows but don't report yet
        reportProgress('uploading', 'Uploading folders...', chunk.length);
      }

      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully uploaded ${folders.length} folders to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadFoldersToSupabaseWithProgress:', error);
    if (isNetworkError(error)) {
      throw error; // Propagate network errors up to main backup function
    }
    return false;
  }
}

/**
 * Upload decks to Supabase with chunked progress tracking
 */
async function uploadDecksToSupabaseWithProgress(
  decks: BackupDeck[], 
  getToken: TokenGetter, 
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    if (decks.length === 0) {
      console.log('No decks to upload');
      return true;
    }

    const chunkSize = 10;
    let lastReportTime = Date.now();
    
    for (let i = 0; i < decks.length; i += chunkSize) {
      // Check for cancellation before processing each chunk
      if (isCancelled?.()) {
        console.log('Deck upload cancelled by user');
        return false;
      }
      
      const chunk = decks.slice(i, i + chunkSize);
      
      // Get fresh token for each chunk to handle expiration
      const token = await getToken();
      if (!token) {
        console.error('Unable to get authentication token for decks');
        return false;
      }
      
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
      
      const { error } = await authenticatedSupabase
        .from('decks')
        .upsert(chunk, { 
          onConflict: 'userID,deckID',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error uploading deck chunk to Supabase:', error);
        if (isNetworkError(error)) {
          throw error; // Propagate network errors up to main backup function
        }
        return false;
      }

      const now = Date.now();
      if (now - lastReportTime >= 3000 || i + chunkSize >= decks.length) {
        reportProgress('uploading', 'Uploading decks...', chunk.length);
        lastReportTime = now;
      } else {
        reportProgress('uploading', 'Uploading decks...', chunk.length);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully uploaded ${decks.length} decks to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadDecksToSupabaseWithProgress:', error);
    if (isNetworkError(error)) {
      throw error; // Propagate network errors up to main backup function
    }
    return false;
  }
}

/**
 * Upload flashcards to Supabase with chunked progress tracking
 */
async function uploadFlashcardsToSupabaseWithProgress(
  flashcards: BackupFlashcard[], 
  getToken: TokenGetter, 
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    if (flashcards.length === 0) {
      console.log('No flashcards to upload');
      return true;
    }

    const chunkSize = 25; // Smaller chunks for flashcards
    let lastReportTime = Date.now();
    
    for (let i = 0; i < flashcards.length; i += chunkSize) {
      // Check for cancellation before processing each chunk
      if (isCancelled?.()) {
        console.log('Flashcard upload cancelled by user');
        return false;
      }
      
      const chunk = flashcards.slice(i, i + chunkSize);
      let retries = 0;
      const maxRetries = 2;

      while (retries < maxRetries) {
        try {
          // Check for cancellation before each retry
          if (isCancelled?.()) {
            console.log('Flashcard upload cancelled during retry');
            return false;
          }
          
          // Get fresh token for each chunk to handle expiration
          const token = await getToken();
          if (!token) {
            console.error('Unable to get authentication token for flashcards');
            return false;
          }
          
          const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
          
          const { error } = await authenticatedSupabase
            .from('flashcards')
            .upsert(chunk, { 
              onConflict: 'userID,flashcardID',
              ignoreDuplicates: false 
            });

          if (error) {
            throw error;
          }
          break;
        } catch (error) {
          retries++;
          
          // If this is a network error and we've exhausted retries, throw it up
          if (retries >= maxRetries) {
            console.error('Error uploading flashcard chunk after retries:', error);
            if (isNetworkError(error)) {
              throw error; // Propagate network errors up to main backup function
            }
            return false;
          }
          
          // Check for cancellation before waiting for retry
          if (isCancelled?.()) {
            console.log('Flashcard upload cancelled during retry wait');
            return false;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      const now = Date.now();
      if (now - lastReportTime >= 3000 || i + chunkSize >= flashcards.length) {
        reportProgress('uploading', 'Uploading flashcards...', chunk.length);
        lastReportTime = now;
      } else {
        reportProgress('uploading', 'Uploading flashcards...', chunk.length);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Successfully uploaded ${flashcards.length} flashcards to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadFlashcardsToSupabaseWithProgress:', error);
    if (isNetworkError(error)) {
      throw error; // Propagate network errors up to main backup function
    }
    return false;
  }
}

/**
 * Upload user form entries to Supabase with progress tracking
 */
async function uploadUserFormEntriesToSupabaseWithProgress(
  userFormEntries: BackupUserFormEntry[], 
  getToken: TokenGetter, 
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    if (userFormEntries.length === 0) {
      console.log('No user form entries to upload');
      return true;
    }

    // Check for cancellation before starting
    if (isCancelled?.()) {
      console.log('User form entries upload cancelled by user');
      return false;
    }
    
    // Get fresh token
    const token = await getToken();
    if (!token) {
      console.error('Unable to get authentication token for user form entries');
      return false;
    }
    
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
    
    const { error } = await authenticatedSupabase
      .from('userFormEntries')
      .upsert(userFormEntries, { 
        onConflict: 'userID,formEntryID',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error uploading user form entries to Supabase:', error);
      if (isNetworkError(error)) {
        throw error; // Propagate network errors up to main backup function
      }
      return false;
    }

    reportProgress('uploading', 'Uploading user form entries...', userFormEntries.length);
    console.log(`Successfully uploaded ${userFormEntries.length} user form entries to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in uploadUserFormEntriesToSupabaseWithProgress:', error);
    if (isNetworkError(error)) {
      throw error; // Propagate network errors up to main backup function
    }
    return false;
  }
}

/**
 * Upload user data to Supabase with progress tracking
 */
async function uploadUserToSupabaseWithProgress(
  user: BackupUser, 
  getToken: TokenGetter, 
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    // Check for cancellation before starting
    if (isCancelled?.()) {
      console.log('User upload cancelled by user');
      return false;
    }
    
    // Get fresh token
    const token = await getToken();
    if (!token) {
      console.error('Unable to get authentication token for user');
      return false;
    }
    
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    const { error } = await authenticatedSupabase
      .from('users')
      .upsert([user], { 
        onConflict: 'userID',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error uploading user to Supabase:', error);
      if (isNetworkError(error)) {
        throw error; // Propagate network errors up to main backup function
      }
      return false;
    }

    reportProgress('uploading', 'Uploading user data...', 1);
    console.log('Successfully uploaded user data to Supabase');
    return true;
  } catch (error) {
    console.error('Error in uploadUserToSupabaseWithProgress:', error);
    if (isNetworkError(error)) {
      throw error; // Propagate network errors up to main backup function
    }
    return false;
  }
}

/**
 * Main backup function that orchestrates the entire backup process
 */
export async function backupDataToCloud(
  getToken: TokenGetter,
  onProgress?: (progress: BackupProgress) => void,
  isCancelled?: () => boolean
): Promise<{ success: boolean; message: string; isNetworkError?: boolean }> {
  try {
    console.log('Starting backup process...');
    
    // Stage 1: Extract data from SQLite
    onProgress?.({ stage: 'extracting', completed: 0, total: 5, message: 'Extracting folders...' });
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    const folders = await extractFoldersFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 1, total: 5, message: 'Extracting decks...' });
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    const decks = await extractDecksFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 2, total: 5, message: 'Extracting flashcards...' });
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    const flashcards = await extractFlashcardsFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 3, total: 5, message: 'Extracting user form entries...' });
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    const userFormEntries = await extractRecentUserFormEntriesFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 4, total: 5, message: 'Extracting user data...' });
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    const user = await extractUserFromSQLite();
    
    onProgress?.({ stage: 'extracting', completed: 5, total: 5, message: 'Data extraction complete' });
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };

    if (!user) {
      return { success: false, message: 'User data not found in local database' };
    }

    // Calculate total rows for progress tracking
    const totalRows = folders.length + decks.length + flashcards.length + userFormEntries.length + 1;
    let uploadedRows = 0;

    // Progress tracking state
    const progressState = {
      totalRows,
      uploadedRows: 0,
      lastReportTime: Date.now()
    };

    // Progress reporting function
    const reportProgress = (stage: string, message: string, rowsJustUploaded: number = 0) => {
      progressState.uploadedRows += rowsJustUploaded;
      const percentage = Math.round((progressState.uploadedRows / totalRows) * 100);
      
      onProgress?.({
        stage,
        completed: progressState.uploadedRows,
        total: totalRows,
        message,
        rowsUploaded: progressState.uploadedRows,
        totalRows,
        percentage
      });
    };

    // Stage 2: Upload to Supabase with chunked progress
    reportProgress('uploading', 'Starting upload...', 0);
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    
    const foldersSuccess = await uploadFoldersToSupabaseWithProgress(folders, getToken, reportProgress, isCancelled);
    if (!foldersSuccess) {
      return { success: false, message: 'Failed to upload folders to cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    
    const decksSuccess = await uploadDecksToSupabaseWithProgress(decks, getToken, reportProgress, isCancelled);
    if (!decksSuccess) {
      return { success: false, message: 'Failed to upload decks to cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    
    const flashcardsSuccess = await uploadFlashcardsToSupabaseWithProgress(flashcards, getToken, reportProgress, isCancelled);
    if (!flashcardsSuccess) {
      return { success: false, message: 'Failed to upload flashcards to cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    
    const userFormEntriesSuccess = await uploadUserFormEntriesToSupabaseWithProgress(userFormEntries, getToken, reportProgress, isCancelled);
    if (!userFormEntriesSuccess) {
      return { success: false, message: 'Failed to upload user form entries to cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Backup cancelled by user' };
    
    const userSuccess = await uploadUserToSupabaseWithProgress(user, getToken, reportProgress, isCancelled);
    if (!userSuccess) {
      return { success: false, message: 'Failed to upload user data to cloud' };
    }
    
    reportProgress('uploading', 'Backup complete!', 0);

    const totalItems = folders.length + decks.length + flashcards.length + userFormEntries.length + 1;
    console.log(`Backup completed successfully! Uploaded ${totalItems} total items to cloud.`);
    
    return { 
      success: true, 
      message: `Backup completed!` 
    };
  } catch (error) {
    console.error('Error during backup process:', error);
    
    // Check if this is a network error
    if (isNetworkError(error)) {
      console.log('Network error detected during backup');
      return { 
        success: false, 
        message: 'Backup cancelled due to network error! Check your network.',
        isNetworkError: true
      };
    }
    
    return { 
      success: false, 
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
