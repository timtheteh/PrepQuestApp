import { db } from './index';
import { createAuthenticatedSupabaseClient } from '../supabase/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserID } from './decks';

// Network error detection helper
function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check for service errors (which should be treated as network errors)
  if (error.isServiceError) {
    return true;
  }
  
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
    'etimedout',
    'authentication',
    'token',
    'auth'
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

// Using cached getCurrentUserID from decks.ts

// Helper function to convert Supabase blob data back to Uint8Array
function convertSupabaseBlobToUint8Array(blob: any): Uint8Array | null {
  try {
    if (!blob) return null;
    
    if (blob instanceof Uint8Array) {
      // Already a Uint8Array
      return blob;
    }
    
    if (Array.isArray(blob)) {
      // Regular array - convert to Uint8Array
      return new Uint8Array(blob);
    }
    
    if (typeof blob === 'string') {
      // Handle PostgreSQL bytea hex format (e.g., \x7b2230223a3235352c...)
      if (blob.startsWith('\\x')) {
        // Remove \x prefix and get the hex string
        const hexString = blob.substring(2);
        
        // Convert hex pairs to bytes
        const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
        
        // The hex string might be a JSON representation of the original Uint8Array
        // Try to decode it as UTF-8 and parse as JSON
        try {
          const jsonString = new TextDecoder().decode(bytes);
          console.log('Decoded JSON string preview:', jsonString.substring(0, 100) + '...');
          
          const parsed = JSON.parse(jsonString);
          if (typeof parsed === 'object' && parsed !== null) {
            // Convert object with numeric keys back to array
            const keys = Object.keys(parsed).map(k => parseInt(k)).sort((a, b) => a - b);
            const values = keys.map(k => parsed[k.toString()]);
            return new Uint8Array(values);
          }
        } catch (jsonError) {
          console.log('Not a JSON string, treating as raw hex data');
          // If it's not JSON, return the raw hex bytes
          return bytes;
        }
        
        return bytes;
      }
      
      // Handle regular hex string without \x prefix
      if (/^[0-9A-Fa-f]+$/.test(blob)) {
        const bytes = new Uint8Array(blob.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
        return bytes;
      }
      
      // Handle JSON string representation
      if (blob.includes('"0":') || blob.includes('"1":')) {
        try {
          const parsed = JSON.parse(blob);
          if (typeof parsed === 'object' && parsed !== null) {
            // Convert object with numeric keys back to array
            const keys = Object.keys(parsed).map(k => parseInt(k)).sort((a, b) => a - b);
            const values = keys.map(k => parsed[k.toString()]);
            return new Uint8Array(values);
          }
        } catch (parseError) {
          console.warn('Failed to parse blob as JSON:', parseError);
        }
      }
    }
    
    if (typeof blob === 'object' && blob !== null) {
      // Object with numeric keys (like {"0": 255, "1": 216, ...})
      const keys = Object.keys(blob).map(k => parseInt(k)).sort((a, b) => a - b);
      const values = keys.map(k => blob[k.toString()]);
      return new Uint8Array(values);
    }
    
    console.warn('Unknown blob format:', typeof blob, blob);
    return null;
  } catch (error) {
    console.error('Error converting Supabase blob to Uint8Array:', error);
    return null;
  }
}

// Interface definitions for imported data (same as backup interfaces)
export interface ImportedFolder {
  folderID: number;
  userID: string;
  folderName: string;
  dateAdded: string;
  lastModifiedDate?: string;
  isFavorited: number;
}

export interface ImportedDeck {
  deckID: number;
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

export interface ImportedFlashcard {
  flashcardID: number;
  userID: string;
  deckID: number;
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

export interface ImportedUserFormEntry {
  formEntryID: number;
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

export interface ImportedUser {
  userID: string;
  dateJoined?: string | null;
  accumulatedDecksCreated: number;
  accumulatedFlashcardsCreated: number;
  accumulatedStudyDecksCreated: number;
  accumulatedInterviewDecksCreated: number;
  accumulatedDecksQuizzed: number;
  accumulatedFlashcardsQuizzed: number;
  accumulatedStudyDecksQuizzed: number;
  accumulatedInterviewDecksQuizzed: number;
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

export interface ImportedStreakBadgeAssignment {
  userID: string;
  badgeName: string;
  badgeSubtext: string;
  dayStreakRequirement: number;
  badgeImageName: string;
}

export interface ImportedWelcomeBadgeAssignment {
  userID: string;
  badgeName: string;
  badgeSubtext: string;
  badgeImageName: string;
  badgeOrder: number;
}

export interface ImportedLifetimeBadgeAssignment {
  userID: string;
  badgeName: string;
  badgeSubtext: string;
  badgeImageName: string;
  badgeOrder: number;
}

export interface ImportedCustomBadge {
  userID: string;
  badgeSubtext?: string | null;
  badgeImageName?: string | null;
  achieved: number;
  numberOfDecksPledged?: number | null;
  numberOfConsecutiveDays?: number | null;
  dateCreated?: string | null;
  expiryDate?: string | null;
  boundForRemoval: number;
  dateToBeRemoved?: string | null;
}

// Progress tracking interface
export interface ImportProgress {
  stage: string;
  completed: number;
  total: number;
  message: string;
  rowsImported?: number;
  totalRows?: number;
  percentage?: number;
}

// Progress reporting function type
type ProgressReporter = (stage: string, message: string, rowsJustProcessed: number) => void;

// Token getter function type
type TokenGetter = () => Promise<string | null>;

// Supabase data fetching functions

/**
 * Get total count of rows for the user across all tables
 */
export async function getTotalRowCount(token: string): Promise<{
  folders: number;
  decks: number;
  flashcards: number;
  userFormEntries: number;
  streakBadges: number;
  welcomeBadges: number;
  lifetimeBadges: number;
  customBadges: number;
  users: number;
  total: number;
} | null> {
  try {
    const userID = await getCurrentUserID();
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // Get counts for each table
    const [
      foldersResult,
      decksResult,
      flashcardsResult,
      userFormEntriesResult,
      streakBadgesResult,
      welcomeBadgesResult,
      lifetimeBadgesResult,
      customBadgesResult,
      usersResult
    ] = await Promise.all([
      authenticatedSupabase
        .from('folders')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('decks')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('userFormEntries')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('streakBadgesTable')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('welcomeBadgesTable')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('lifetimeBadgesTable')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('customBadgesTable')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID),
      authenticatedSupabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('userID', userID)
    ]);

    if (
      foldersResult.error ||
      decksResult.error ||
      flashcardsResult.error ||
      userFormEntriesResult.error ||
      streakBadgesResult.error ||
      welcomeBadgesResult.error ||
      lifetimeBadgesResult.error ||
      customBadgesResult.error ||
      usersResult.error
    ) {
      console.error('Error getting row counts:', {
        folders: foldersResult.error,
        decks: decksResult.error,
        flashcards: flashcardsResult.error,
        userFormEntries: userFormEntriesResult.error,
        streakBadges: streakBadgesResult.error,
        welcomeBadges: welcomeBadgesResult.error,
        lifetimeBadges: lifetimeBadgesResult.error,
        customBadges: customBadgesResult.error,
        users: usersResult.error
      });
      
      // Check if any of the errors are network errors and throw them
      const errors = [
        foldersResult.error,
        decksResult.error,
        flashcardsResult.error,
        userFormEntriesResult.error,
        streakBadgesResult.error,
        welcomeBadgesResult.error,
        lifetimeBadgesResult.error,
        customBadgesResult.error,
        usersResult.error
      ].filter(Boolean);
      for (const error of errors) {
        if (isNetworkError(error)) {
          throw error; // Re-throw network errors so they can be detected
        }
      }
      
      // If we have errors but they're not network errors, treat them as service errors
      // which should be treated as network errors for the purpose of showing the modal
      const hasAnyError =
        foldersResult.error ||
        decksResult.error ||
        flashcardsResult.error ||
        userFormEntriesResult.error ||
        streakBadgesResult.error ||
        welcomeBadgesResult.error ||
        lifetimeBadgesResult.error ||
        customBadgesResult.error ||
        usersResult.error;
      if (hasAnyError) {
        // Create a service error that will be detected as a network error
        const serviceError = new Error('Import service temporarily unavailable. Please try again in a few minutes.');
        (serviceError as any).isServiceError = true;
        throw serviceError;
      }
      
      return null;
    }

    const counts = {
      folders: foldersResult.count || 0,
      decks: decksResult.count || 0,
      flashcards: flashcardsResult.count || 0,
      userFormEntries: userFormEntriesResult.count || 0,
      streakBadges: streakBadgesResult.count || 0,
      welcomeBadges: welcomeBadgesResult.count || 0,
      lifetimeBadges: lifetimeBadgesResult.count || 0,
      customBadges: customBadgesResult.count || 0,
      users: usersResult.count || 0,
      total:
        (foldersResult.count || 0) +
        (decksResult.count || 0) +
        (flashcardsResult.count || 0) +
        (userFormEntriesResult.count || 0) +
        (streakBadgesResult.count || 0) +
        (welcomeBadgesResult.count || 0) +
        (lifetimeBadgesResult.count || 0) +
        (customBadgesResult.count || 0) +
        (usersResult.count || 0)
    };

    console.log('Row counts from Supabase:', counts);
    return counts;
  } catch (error) {
    console.error('Error in getTotalRowCount:', error);
    
    // Re-throw network errors so they can be detected by the main import function
    if (isNetworkError(error)) {
      throw error;
    }
    
    return null;
  }
}

/**
 * Import folders from Supabase with retry logic
 */
export async function importFoldersFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedFolder[] | null> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('Folder import cancelled by user');
      return null;
    }

    // Retry logic for folder import
    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing folders');
          // Throw an error so it can be detected as a network error
          throw new Error('Unable to get authentication token for importing folders');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

        // Fetch all folders for the user
        const { data, error } = await authenticatedSupabase
          .from('folders')
          .select('*')
          .eq('userID', userID)
          .order('dateAdded', { ascending: true });

        if (error) {
          throw error;
        }

        const folders = data as ImportedFolder[];
        reportProgress('importing', 'Imported folders from cloud...', folders.length);
        console.log(`Successfully imported ${folders.length} folders from Supabase`);
        return folders;
      } catch (error) {
        retries++;
        console.log(`Folder import failed, retry ${retries}/${maxRetries}:`, error);
        
        if (retries >= maxRetries) {
          console.error('Error importing folders from Supabase after retries:', error);
          // Re-throw network errors so they can be detected by the main import function
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }
        
        // Exponential backoff
        const waitTime = 1000 * Math.pow(2, retries);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null; // Should never reach here
  } catch (error) {
    console.error('Error in importFoldersFromSupabase:', error);
    // Re-throw network errors so they can be detected by the main import function
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

/**
 * Import decks from Supabase with retry logic
 */
export async function importDecksFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedDeck[] | null> {
  try {
    const userID = await getCurrentUserID();
    
    if (isCancelled?.()) {
      console.log('Deck import cancelled by user');
      return null;
    }

    // Retry logic for deck import
    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing decks');
          // Throw an error so it can be detected as a network error
          throw new Error('Unable to get authentication token for importing decks');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

        // Fetch all decks for the user
        const { data, error } = await authenticatedSupabase
          .from('decks')
          .select('*')
          .eq('userID', userID)
          .order('dateAdded', { ascending: true });

        if (error) {
          throw error;
        }

        const decks = data as ImportedDeck[];
        reportProgress('importing', 'Imported decks from cloud...', decks.length);
        console.log(`Successfully imported ${decks.length} decks from Supabase`);
        return decks;
      } catch (error) {
        retries++;
        console.log(`Deck import failed, retry ${retries}/${maxRetries}:`, error);
        
        if (retries >= maxRetries) {
          console.error('Error importing decks from Supabase after retries:', error);
          // Re-throw network errors so they can be detected by the main import function
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }
        
        // Exponential backoff
        const waitTime = 1000 * Math.pow(2, retries);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null; // Should never reach here
  } catch (error) {
    console.error('Error in importDecksFromSupabase:', error);
    // Re-throw network errors so they can be detected by the main import function
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

/**
 * Import flashcards from Supabase in batches to avoid timeouts
 */
export async function importFlashcardsFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedFlashcard[] | null> {
  try {
    const userID = await getCurrentUserID();
    const token = await getToken();
    if (!token) {
      console.error('Unable to get authentication token for importing flashcards');
      // Throw an error so it can be detected as a network error
      throw new Error('Unable to get authentication token for importing flashcards');
    }

    if (isCancelled?.()) {
      console.log('Flashcard import cancelled by user');
      return null;
    }

    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // First, get the total count to determine batch size
    const { count, error: countError } = await authenticatedSupabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('userID', userID);

    if (countError) {
      console.error('Error getting flashcard count from Supabase:', countError);
      return null;
    }

    const totalFlashcards = count || 0;
    if (totalFlashcards === 0) {
      console.log('No flashcards to import');
      return [];
    }

    // Import in smaller batches to avoid server timeouts
    const batchSize = 10; // Reduced batch size
    const allFlashcards: ImportedFlashcard[] = [];
    let importedCount = 0;

    for (let offset = 0; offset < totalFlashcards; offset += batchSize) {
      if (isCancelled?.()) {
        console.log('Flashcard import cancelled by user');
        return null;
      }

      console.log(`Importing flashcards batch: ${offset + 1}-${Math.min(offset + batchSize, totalFlashcards)} of ${totalFlashcards}`);

      // Get fresh token for each batch
      const batchToken = await getToken();
      if (!batchToken) {
        console.error('Unable to get authentication token for flashcard batch');
        // Throw an error so it can be detected as a network error
        throw new Error('Unable to get authentication token for flashcard batch');
      }

      const batchSupabase = await createAuthenticatedSupabaseClient(batchToken);

      // Retry logic for batch import
      let retries = 0;
      const maxRetries = 2;
      let batchFlashcards: ImportedFlashcard[] = [];

      while (retries < maxRetries) {
        try {
          const { data, error } = await batchSupabase
            .from('flashcards')
            .select('*')
            .eq('userID', userID)
            .order('flashcardID', { ascending: true })
            .range(offset, offset + batchSize - 1);

          if (error) {
            throw error;
          }

          batchFlashcards = data as ImportedFlashcard[];
          break; // Success - exit retry loop
        } catch (error) {
          retries++;
          console.log(`Flashcard batch ${offset}-${offset + batchSize} failed, retry ${retries}/${maxRetries}:`, error);
          
          if (retries >= maxRetries) {
            console.error(`Error importing flashcard batch ${offset}-${offset + batchSize} after ${maxRetries} retries:`, error);
            // Re-throw network errors so they can be detected by the main import function
            if (isNetworkError(error)) {
              throw error;
            }
            return null;
          }
          
          // Exponential backoff: wait longer between retries
          const waitTime = 1000 * Math.pow(2, retries); // 2s, 4s, 8s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      // Debug: Check the first flashcard with blob data in this batch
      if (offset === 0) { // Only log for first batch to avoid spam
        const firstFlashcardWithBlob = batchFlashcards.find(f => f.questionBlob || f.answerBlob);
        if (firstFlashcardWithBlob) {
          console.log('Sample flashcard blob data from Supabase:');
          if (firstFlashcardWithBlob.questionBlob) {
            console.log('questionBlob type:', typeof firstFlashcardWithBlob.questionBlob);
            console.log('questionBlob isUint8Array:', firstFlashcardWithBlob.questionBlob instanceof Uint8Array);
            console.log('questionBlob isArray:', Array.isArray(firstFlashcardWithBlob.questionBlob));
            console.log('questionBlob length:', firstFlashcardWithBlob.questionBlob?.length);
            if (typeof firstFlashcardWithBlob.questionBlob === 'string') {
              console.log('questionBlob string preview:', (firstFlashcardWithBlob.questionBlob as string).substring(0, 100) + '...');
              console.log('questionBlob starts with \\x:', (firstFlashcardWithBlob.questionBlob as string).startsWith('\\x'));
            }
          }
          if (firstFlashcardWithBlob.answerBlob) {
            console.log('answerBlob type:', typeof firstFlashcardWithBlob.answerBlob);
            console.log('answerBlob isUint8Array:', firstFlashcardWithBlob.answerBlob instanceof Uint8Array);
            console.log('answerBlob isArray:', Array.isArray(firstFlashcardWithBlob.answerBlob));
            console.log('answerBlob length:', firstFlashcardWithBlob.answerBlob?.length);
            if (typeof firstFlashcardWithBlob.answerBlob === 'string') {
              console.log('answerBlob string preview:', (firstFlashcardWithBlob.answerBlob as string).substring(0, 100) + '...');
              console.log('answerBlob starts with \\x:', (firstFlashcardWithBlob.answerBlob as string).startsWith('\\x'));
            }
          }
        }
      }

      allFlashcards.push(...batchFlashcards);
      importedCount += batchFlashcards.length;

      // Report progress after each batch
      reportProgress('importing', `Imported ${importedCount}/${totalFlashcards} flashcards from cloud...`, batchFlashcards.length);

      // Small delay between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully imported ${allFlashcards.length} flashcards from Supabase`);
    return allFlashcards;
  } catch (error) {
    console.error('Error in importFlashcardsFromSupabase:', error);
    // Re-throw network errors so they can be detected by the main import function
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

// Local database replacement functions

/**
 * Replace local folders with imported data
 */
async function replaceFoldersInLocalDatabase(
  folders: ImportedFolder[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Local folder replacement cancelled by user');
      return false;
    }

    // Start transaction for atomic operation
    await db.runAsync('BEGIN TRANSACTION');

    try {
      // Delete existing folders for the user
      await db.runAsync('DELETE FROM folders WHERE userID = ?', [userID]);

    if (folders.length === 0) {
      console.log('No folders to insert into local database');
      await db.runAsync('COMMIT');
      return true;
    }

    // Insert imported folders in chunks
    const chunkSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < folders.length; i += chunkSize) {
      if (isCancelled?.()) {
        console.log('Local folder insertion cancelled by user - rolling back transaction');
        await db.runAsync('ROLLBACK');
        return false;
      }

      const chunk = folders.slice(i, i + chunkSize);
      
      for (const folder of chunk) {
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

      insertedCount += chunk.length;
      reportProgress('inserting', 'Inserting folders into local database...', chunk.length);
    }

      // Commit transaction if successful
      await db.runAsync('COMMIT');
      console.log(`Successfully inserted ${insertedCount} folders into local database`);
      return true;
    } catch (transactionError) {
      // Rollback on any error within transaction
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing folders in local database:', error);
    return false;
  }
}

/**
 * Import custom badges from Supabase with retry logic
 */
export async function importUserFormEntriesFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedUserFormEntry[] | null> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('User form entry import cancelled by user');
      return null;
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing user form entries');
          throw new Error('Unable to get authentication token for importing user form entries');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

        const { data, error } = await authenticatedSupabase
          .from('userFormEntries')
          .select('*')
          .eq('userID', userID)
          .order('formSubmissionDate', { ascending: false });

        if (error) {
          throw error;
        }

        const entries = (data as (ImportedUserFormEntry & { id?: string })[]).map(
          ({ id: _supabasePrimaryKey, ...rest }) => rest as ImportedUserFormEntry
        );
        reportProgress('importing', 'Imported user form entries from cloud...', entries.length);
        console.log(`Successfully imported ${entries.length} user form entries from Supabase`);
        return entries;
      } catch (error) {
        retries++;
        console.log(`User form entry import failed, retry ${retries}/${maxRetries}:`, error);

        if (retries >= maxRetries) {
          console.error('Error importing user form entries from Supabase after retries:', error);
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }

        const waitTime = 1000 * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null;
  } catch (error) {
    console.error('Error in importUserFormEntriesFromSupabase:', error);
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

export async function importUserFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedUser | null> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('User import cancelled by user');
      return null;
    }

    const token = await getToken();
    if (!token) {
      console.error('Unable to get authentication token for importing user');
      return null;
    }

    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
    const { data, error } = await authenticatedSupabase
      .from('users')
      .select('*')
      .eq('userID', userID)
      .maybeSingle();

    if (error) {
      console.error('Error importing user from Supabase:', error);
      if (isNetworkError(error)) {
        throw error;
      }
      return null;
    }

    if (!data) {
      console.warn('No user data returned from Supabase');
      return null;
    }

    const { id: _supabasePrimaryKey, ...rest } = data as ImportedUser & { id?: string };

    reportProgress('importing', 'Imported user data from cloud...', 1);
    console.log('Successfully imported user data from Supabase');
    return rest as ImportedUser;
  } catch (error) {
    console.error('Error in importUserFromSupabase:', error);
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

export async function importStreakBadgeAssignmentsFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedStreakBadgeAssignment[] | null> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Streak badge import cancelled by user');
      return null;
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing streak badges');
          throw new Error('Unable to get authentication token for importing streak badges');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
        const { data, error } = await authenticatedSupabase
          .from('streakBadgesTable')
          .select('*')
          .eq('userID', userID);

        if (error) {
          throw error;
        }

        const streakBadges = data as ImportedStreakBadgeAssignment[];
        reportProgress('importing', 'Imported streak badge progress from cloud...', streakBadges.length);
        console.log(`Successfully imported ${streakBadges.length} streak badge assignments from Supabase`);
        return streakBadges;
      } catch (error) {
        retries++;
        console.log(`Streak badge import failed, retry ${retries}/${maxRetries}:`, error);

        if (retries >= maxRetries) {
          console.error('Error importing streak badges from Supabase after retries:', error);
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }

        const waitTime = 1000 * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null;
  } catch (error) {
    console.error('Error in importStreakBadgeAssignmentsFromSupabase:', error);
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

export async function importWelcomeBadgeAssignmentsFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedWelcomeBadgeAssignment[] | null> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Welcome badge import cancelled by user');
      return null;
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing welcome badges');
          throw new Error('Unable to get authentication token for importing welcome badges');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
        const { data, error } = await authenticatedSupabase
          .from('welcomeBadgesTable')
          .select('*')
          .eq('userID', userID);

        if (error) {
          throw error;
        }

        const welcomeBadges = data as ImportedWelcomeBadgeAssignment[];
        reportProgress('importing', 'Imported welcome badge progress from cloud...', welcomeBadges.length);
        console.log(`Successfully imported ${welcomeBadges.length} welcome badge assignments from Supabase`);
        return welcomeBadges;
      } catch (error) {
        retries++;
        console.log(`Welcome badge import failed, retry ${retries}/${maxRetries}:`, error);

        if (retries >= maxRetries) {
          console.error('Error importing welcome badges from Supabase after retries:', error);
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }

        const waitTime = 1000 * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null;
  } catch (error) {
    console.error('Error in importWelcomeBadgeAssignmentsFromSupabase:', error);
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

export async function importLifetimeBadgeAssignmentsFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedLifetimeBadgeAssignment[] | null> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Lifetime badge import cancelled by user');
      return null;
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing lifetime badges');
          throw new Error('Unable to get authentication token for importing lifetime badges');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
        const { data, error } = await authenticatedSupabase
          .from('lifetimeBadgesTable')
          .select('*')
          .eq('userID', userID);

        if (error) {
          throw error;
        }

        const lifetimeBadges = data as ImportedLifetimeBadgeAssignment[];
        reportProgress('importing', 'Imported lifetime badge progress from cloud...', lifetimeBadges.length);
        console.log(`Successfully imported ${lifetimeBadges.length} lifetime badge assignments from Supabase`);
        return lifetimeBadges;
      } catch (error) {
        retries++;
        console.log(`Lifetime badge import failed, retry ${retries}/${maxRetries}:`, error);

        if (retries >= maxRetries) {
          console.error('Error importing lifetime badges from Supabase after retries:', error);
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }

        const waitTime = 1000 * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null;
  } catch (error) {
    console.error('Error in importLifetimeBadgeAssignmentsFromSupabase:', error);
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

export async function importCustomBadgesFromSupabase(
  getToken: TokenGetter,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<ImportedCustomBadge[] | null> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Custom badge import cancelled by user');
      return null;
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing custom badges');
          throw new Error('Unable to get authentication token for importing custom badges');
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);
        const { data, error } = await authenticatedSupabase
          .from('customBadgesTable')
          .select('*')
          .eq('userID', userID);

        if (error) {
          throw error;
        }

        const customBadges = data as ImportedCustomBadge[];
        reportProgress('importing', 'Imported custom badges from cloud...', customBadges.length);
        console.log(`Successfully imported ${customBadges.length} custom badges from Supabase`);
        return customBadges;
      } catch (error) {
        retries++;
        console.log(`Custom badge import failed, retry ${retries}/${maxRetries}:`, error);

        if (retries >= maxRetries) {
          console.error('Error importing custom badges from Supabase after retries:', error);
          if (isNetworkError(error)) {
            throw error;
          }
          return null;
        }

        const waitTime = 1000 * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return null;
  } catch (error) {
    console.error('Error in importCustomBadgesFromSupabase:', error);
    if (isNetworkError(error)) {
      throw error;
    }
    return null;
  }
}

/**
 * Replace local decks with imported data
 */
async function replaceDecksInLocalDatabase(
  decks: ImportedDeck[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Local deck replacement cancelled by user');
      return false;
    }

    // Start transaction for atomic operation
    await db.runAsync('BEGIN TRANSACTION');

    try {
      // Delete existing decks for the user
      await db.runAsync('DELETE FROM decks WHERE userID = ?', [userID]);

    if (decks.length === 0) {
      console.log('No decks to insert into local database');
      await db.runAsync('COMMIT');
      return true;
    }

    // Insert imported decks in chunks
    const chunkSize = 50;
    let insertedCount = 0;

      for (let i = 0; i < decks.length; i += chunkSize) {
        if (isCancelled?.()) {
          console.log('Local deck insertion cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

      const chunk = decks.slice(i, i + chunkSize);
      
      for (const deck of chunk) {
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

      insertedCount += chunk.length;
      reportProgress('inserting', 'Inserting decks into local database...', chunk.length);
    }

      // Commit transaction if successful
      await db.runAsync('COMMIT');
      console.log(`Successfully inserted ${insertedCount} decks into local database`);
      return true;
    } catch (transactionError) {
      // Rollback on any error within transaction
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing decks in local database:', error);
    return false;
  }
}

/**
 * Replace local flashcards with imported data
 */
async function replaceFlashcardsInLocalDatabase(
  flashcards: ImportedFlashcard[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Local flashcard replacement cancelled by user');
      return false;
    }

    // Start transaction for atomic operation
    await db.runAsync('BEGIN TRANSACTION');

    try {
      // Delete existing flashcards for the user
      await db.runAsync('DELETE FROM flashcards WHERE userID = ?', [userID]);

    if (flashcards.length === 0) {
      console.log('No flashcards to insert into local database');
      await db.runAsync('COMMIT');
      return true;
    }

    // Insert imported flashcards in chunks
    const chunkSize = 25; // Smaller chunks for flashcards
    let insertedCount = 0;

      for (let i = 0; i < flashcards.length; i += chunkSize) {
        if (isCancelled?.()) {
          console.log('Local flashcard insertion cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

      const chunk = flashcards.slice(i, i + chunkSize);
      
      for (const flashcard of chunk) {
        // Handle blob data conversion for SQLite insertion
        let questionBlobValue = null;
        let answerBlobValue = null;

        if (flashcard.questionBlob) {
          console.log('Converting questionBlob - type:', typeof flashcard.questionBlob, 'isUint8Array:', flashcard.questionBlob instanceof Uint8Array);
          if (typeof flashcard.questionBlob === 'string') {
            console.log('questionBlob string length:', (flashcard.questionBlob as string).length);
            console.log('questionBlob starts with \\x:', (flashcard.questionBlob as string).startsWith('\\x'));
          }
          questionBlobValue = convertSupabaseBlobToUint8Array(flashcard.questionBlob);
          if (questionBlobValue) {
            console.log('Successfully converted questionBlob to Uint8Array, length:', questionBlobValue.length);
            // Log first few bytes to verify conversion
            console.log('First 10 bytes:', Array.from(questionBlobValue.slice(0, 10)));
          } else {
            console.warn('Failed to convert questionBlob');
          }
        }

        if (flashcard.answerBlob) {
          console.log('Converting answerBlob - type:', typeof flashcard.answerBlob, 'isUint8Array:', flashcard.answerBlob instanceof Uint8Array);
          if (typeof flashcard.answerBlob === 'string') {
            console.log('answerBlob string length:', (flashcard.answerBlob as string).length);
            console.log('answerBlob starts with \\x:', (flashcard.answerBlob as string).startsWith('\\x'));
          }
          answerBlobValue = convertSupabaseBlobToUint8Array(flashcard.answerBlob);
          if (answerBlobValue) {
            console.log('Successfully converted answerBlob to Uint8Array, length:', answerBlobValue.length);
            // Log first few bytes to verify conversion
            console.log('First 10 bytes:', Array.from(answerBlobValue.slice(0, 10)));
          } else {
            console.warn('Failed to convert answerBlob');
          }
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
          questionBlobValue,
          flashcard.answerType,
          flashcard.answerText || null,
          flashcard.answerMCQ || null,
          answerBlobValue,
          flashcard.timeTaken || null,
          flashcard.isMcqAnswerRight,
          flashcard.lastStudiedDate || null,
          flashcard.lastQuizzedDate || null
        ]);
      }

      insertedCount += chunk.length;
      reportProgress('inserting', 'Inserting flashcards into local database...', chunk.length);
      
      // Small delay between chunks to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

      // Commit transaction if successful
      await db.runAsync('COMMIT');
      console.log(`Successfully inserted ${insertedCount} flashcards into local database`);
      return true;
    } catch (transactionError) {
      // Rollback on any error within transaction
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing flashcards in local database:', error);
    return false;
  }
}

/**
 * Replace local user form entries with imported data
 */
async function replaceUserFormEntriesInLocalDatabase(
  userFormEntries: ImportedUserFormEntry[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Local user form entry replacement cancelled by user');
      return false;
    }

    await db.runAsync('BEGIN TRANSACTION');

    try {
      await db.runAsync('DELETE FROM userFormEntries WHERE userID = ?', [userID]);

      if (userFormEntries.length === 0) {
        await db.runAsync('COMMIT');
        return true;
      }

      const chunkSize = 25;
      let insertedCount = 0;

      for (let i = 0; i < userFormEntries.length; i += chunkSize) {
        if (isCancelled?.()) {
          console.log('Local user form entry insertion cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

        const chunk = userFormEntries.slice(i, i + chunkSize);
        for (const entry of chunk) {
          await db.runAsync(`
            INSERT INTO userFormEntries (
              formEntryID, userID, formEntryType, formEntryMethod, formSubmissionDate,
              deckName, numberOfQuestions, kindsOfQuestions, youtubeLink, studyEducationLevel,
              studySubjects, studyTopics, studySubtopics, studyExam, interviewJobRole,
              interviewType, interviewCompany, interviewExperienceLevel, interviewTopics
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            entry.formEntryID,
            entry.userID,
            entry.formEntryType || null,
            entry.formEntryMethod || null,
            entry.formSubmissionDate,
            entry.deckName,
            entry.numberOfQuestions ?? null,
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

        insertedCount += chunk.length;
        reportProgress('inserting', 'Inserting user form entries into local database...', chunk.length);
      }

      await db.runAsync('COMMIT');
      console.log(`Successfully inserted ${insertedCount} user form entries into local database`);
      return true;
    } catch (transactionError) {
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing user form entries in local database:', error);
    return false;
  }
}

/**
 * Replace local user data with imported data
 */
async function replaceUserInLocalDatabase(
  user: ImportedUser | null,
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    if (!user) {
      console.warn('No user data provided for local replacement');
      return true;
    }

    if (isCancelled?.()) {
      console.log('User replacement cancelled by user');
      return false;
    }

    await db.runAsync(
      `
      INSERT INTO users (
        userID, dateJoined, accumulatedDecksCreated, accumulatedFlashcardsCreated,
        accumulatedStudyDecksCreated, accumulatedInterviewDecksCreated,
        accumulatedDecksQuizzed, accumulatedFlashcardsQuizzed, accumulatedStudyDecksQuizzed, accumulatedInterviewDecksQuizzed,
        lastUpdated, notificationsEnabled, autoDecksEnabled, clozeQuestionsEnabled,
        mcqQuestionsEnabled, voiceRecordedQuestionsEnabled, voiceRecordedTimer,
        halfwayCheckpoint, defaultTimer, againTimer, hardTimer, goodTimer, easyTimer,
        language, currentPlan, fileUploadRequests, genAIFormRequests,
        youtubeLinkRequests, chatWithAIRequests
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userID) DO UPDATE SET
        dateJoined = excluded.dateJoined,
        accumulatedDecksCreated = excluded.accumulatedDecksCreated,
        accumulatedFlashcardsCreated = excluded.accumulatedFlashcardsCreated,
        accumulatedStudyDecksCreated = excluded.accumulatedStudyDecksCreated,
        accumulatedInterviewDecksCreated = excluded.accumulatedInterviewDecksCreated,
        accumulatedDecksQuizzed = excluded.accumulatedDecksQuizzed,
        accumulatedFlashcardsQuizzed = excluded.accumulatedFlashcardsQuizzed,
        accumulatedStudyDecksQuizzed = excluded.accumulatedStudyDecksQuizzed,
        accumulatedInterviewDecksQuizzed = excluded.accumulatedInterviewDecksQuizzed,
        lastUpdated = excluded.lastUpdated,
        notificationsEnabled = excluded.notificationsEnabled,
        autoDecksEnabled = excluded.autoDecksEnabled,
        clozeQuestionsEnabled = excluded.clozeQuestionsEnabled,
        mcqQuestionsEnabled = excluded.mcqQuestionsEnabled,
        voiceRecordedQuestionsEnabled = excluded.voiceRecordedQuestionsEnabled,
        voiceRecordedTimer = excluded.voiceRecordedTimer,
        halfwayCheckpoint = excluded.halfwayCheckpoint,
        defaultTimer = excluded.defaultTimer,
        againTimer = excluded.againTimer,
        hardTimer = excluded.hardTimer,
        goodTimer = excluded.goodTimer,
        easyTimer = excluded.easyTimer,
        language = excluded.language,
        currentPlan = excluded.currentPlan,
        fileUploadRequests = excluded.fileUploadRequests,
        genAIFormRequests = excluded.genAIFormRequests,
        youtubeLinkRequests = excluded.youtubeLinkRequests,
        chatWithAIRequests = excluded.chatWithAIRequests
    `,
      [
        user.userID,
        user.dateJoined || null,
        user.accumulatedDecksCreated,
        user.accumulatedFlashcardsCreated,
        user.accumulatedStudyDecksCreated,
        user.accumulatedInterviewDecksCreated,
        user.accumulatedDecksQuizzed,
        user.accumulatedFlashcardsQuizzed,
        user.accumulatedStudyDecksQuizzed,
        user.accumulatedInterviewDecksQuizzed,
        user.lastUpdated,
        user.notificationsEnabled,
        user.autoDecksEnabled,
        user.clozeQuestionsEnabled,
        user.mcqQuestionsEnabled,
        user.voiceRecordedQuestionsEnabled,
        user.voiceRecordedTimer,
        user.halfwayCheckpoint,
        user.defaultTimer,
        user.againTimer,
        user.hardTimer,
        user.goodTimer,
        user.easyTimer,
        user.language,
        user.currentPlan,
        user.fileUploadRequests,
        user.genAIFormRequests,
        user.youtubeLinkRequests,
        user.chatWithAIRequests
      ]
    );

    reportProgress('inserting', 'Updating user data...', 1);
    return true;
  } catch (error) {
    console.error('Error replacing user in local database:', error);
    return false;
  }
}

function groupBadgeAssignments<T extends { userID: string }>(
  assignments: T[],
  keyResolver: (assignment: T) => string
): Map<string, { assignment: T; userIDs: Set<string> }> {
  const grouped = new Map<string, { assignment: T; userIDs: Set<string> }>();
  assignments.forEach(assignment => {
    const key = keyResolver(assignment);
    if (!grouped.has(key)) {
      grouped.set(key, { assignment, userIDs: new Set<string>() });
    }
    grouped.get(key)!.userIDs.add(assignment.userID);
  });
  return grouped;
}

/**
 * Replace local streak badge progress with imported data
 */
async function replaceStreakBadgesInLocalDatabase(
  streakBadges: ImportedStreakBadgeAssignment[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    await db.runAsync('BEGIN TRANSACTION');

    try {
      await db.runAsync('UPDATE streakBadgesTable SET userIDs = ?', [JSON.stringify([])]);

      const grouped = groupBadgeAssignments(streakBadges, assignment => `${assignment.badgeName}::${assignment.dayStreakRequirement}`);

      for (const { assignment, userIDs } of grouped.values()) {
        if (isCancelled?.()) {
          console.log('Streak badge update cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

        const userIDsJson = JSON.stringify(Array.from(userIDs));
        const existing = await db.getFirstAsync(
          'SELECT badgeName FROM streakBadgesTable WHERE badgeName = ? AND dayStreakRequirement = ?',
          [assignment.badgeName, assignment.dayStreakRequirement]
        );

        if (existing) {
          await db.runAsync(
            'UPDATE streakBadgesTable SET userIDs = ? WHERE badgeName = ? AND dayStreakRequirement = ?',
            [userIDsJson, assignment.badgeName, assignment.dayStreakRequirement]
          );
        } else {
          await db.runAsync(
            `
              INSERT INTO streakBadgesTable (badgeName, badgeSubtext, dayStreakRequirement, badgeImageName, userIDs)
              VALUES (?, ?, ?, ?, ?)
            `,
            [assignment.badgeName, assignment.badgeSubtext, assignment.dayStreakRequirement, assignment.badgeImageName, userIDsJson]
          );
        }

        reportProgress('inserting', 'Updating streak badge progress...', 1);
      }

      await db.runAsync('COMMIT');
      return true;
    } catch (transactionError) {
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing streak badges in local database:', error);
    return false;
  }
}

/**
 * Replace local welcome badge progress with imported data
 */
async function replaceWelcomeBadgesInLocalDatabase(
  welcomeBadges: ImportedWelcomeBadgeAssignment[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    await db.runAsync('BEGIN TRANSACTION');

    try {
      await db.runAsync('UPDATE welcomeBadgesTable SET userIDs = ?', [JSON.stringify([])]);

      const grouped = groupBadgeAssignments(welcomeBadges, assignment => assignment.badgeName);

      for (const { assignment, userIDs } of grouped.values()) {
        if (isCancelled?.()) {
          console.log('Welcome badge update cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

        const userIDsJson = JSON.stringify(Array.from(userIDs));
        const existing = await db.getFirstAsync(
          'SELECT badgeName FROM welcomeBadgesTable WHERE badgeName = ?',
          [assignment.badgeName]
        );

        if (existing) {
          await db.runAsync(
            'UPDATE welcomeBadgesTable SET userIDs = ?, badgeOrder = ?, badgeSubtext = ?, badgeImageName = ? WHERE badgeName = ?',
            [userIDsJson, assignment.badgeOrder, assignment.badgeSubtext, assignment.badgeImageName, assignment.badgeName]
          );
        } else {
          await db.runAsync(
            `
              INSERT INTO welcomeBadgesTable (badgeName, badgeSubtext, badgeImageName, userIDs, badgeOrder)
              VALUES (?, ?, ?, ?, ?)
            `,
            [assignment.badgeName, assignment.badgeSubtext, assignment.badgeImageName, userIDsJson, assignment.badgeOrder]
          );
        }

        reportProgress('inserting', 'Updating welcome badge progress...', 1);
      }

      await db.runAsync('COMMIT');
      return true;
    } catch (transactionError) {
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing welcome badges in local database:', error);
    return false;
  }
}

/**
 * Replace local lifetime badge progress with imported data
 */
async function replaceLifetimeBadgesInLocalDatabase(
  lifetimeBadges: ImportedLifetimeBadgeAssignment[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    await db.runAsync('BEGIN TRANSACTION');

    try {
      await db.runAsync('UPDATE lifetimeBadgesTable SET userIDs = ?', [JSON.stringify([])]);

      const grouped = groupBadgeAssignments(lifetimeBadges, assignment => assignment.badgeName);

      for (const { assignment, userIDs } of grouped.values()) {
        if (isCancelled?.()) {
          console.log('Lifetime badge update cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

        const userIDsJson = JSON.stringify(Array.from(userIDs));
        const existing = await db.getFirstAsync(
          'SELECT badgeName FROM lifetimeBadgesTable WHERE badgeName = ?',
          [assignment.badgeName]
        );

        if (existing) {
          await db.runAsync(
            'UPDATE lifetimeBadgesTable SET userIDs = ?, badgeOrder = ?, badgeSubtext = ?, badgeImageName = ? WHERE badgeName = ?',
            [userIDsJson, assignment.badgeOrder, assignment.badgeSubtext, assignment.badgeImageName, assignment.badgeName]
          );
        } else {
          await db.runAsync(
            `
              INSERT INTO lifetimeBadgesTable (badgeName, badgeSubtext, badgeImageName, userIDs, badgeOrder)
              VALUES (?, ?, ?, ?, ?)
            `,
            [assignment.badgeName, assignment.badgeSubtext, assignment.badgeImageName, userIDsJson, assignment.badgeOrder]
          );
        }

        reportProgress('inserting', 'Updating lifetime badge progress...', 1);
      }

      await db.runAsync('COMMIT');
      return true;
    } catch (transactionError) {
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing lifetime badges in local database:', error);
    return false;
  }
}

/**
 * Replace local custom badges with imported data
 */
async function replaceCustomBadgesInLocalDatabase(
  customBadges: ImportedCustomBadge[],
  reportProgress: ProgressReporter,
  isCancelled?: () => boolean
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();

    if (isCancelled?.()) {
      console.log('Custom badge replacement cancelled by user');
      return false;
    }

    await db.runAsync('BEGIN TRANSACTION');

    try {
      await db.runAsync('DELETE FROM customBadgesTable WHERE userID = ?', [userID]);

      if (customBadges.length === 0) {
        await db.runAsync('COMMIT');
        return true;
      }

      const chunkSize = 25;
      let insertedCount = 0;

      for (let i = 0; i < customBadges.length; i += chunkSize) {
        if (isCancelled?.()) {
          console.log('Custom badge insertion cancelled by user - rolling back transaction');
          await db.runAsync('ROLLBACK');
          return false;
        }

        const chunk = customBadges.slice(i, i + chunkSize);
        for (const badge of chunk) {
          await db.runAsync(`
            INSERT INTO customBadgesTable (
              userID, badgeSubtext, badgeImageName, achieved, numberOfDecksPledged,
              numberOfConsecutiveDays, dateCreated, expiryDate, boundForRemoval, dateToBeRemoved
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            badge.userID,
            badge.badgeSubtext || null,
            badge.badgeImageName || null,
            badge.achieved,
            badge.numberOfDecksPledged ?? null,
            badge.numberOfConsecutiveDays ?? null,
            badge.dateCreated || null,
            badge.expiryDate || null,
            badge.boundForRemoval,
            badge.dateToBeRemoved || null
          ]);
        }

        insertedCount += chunk.length;
        reportProgress('inserting', 'Inserting custom badges into local database...', chunk.length);
      }

      await db.runAsync('COMMIT');
      console.log(`Successfully inserted ${insertedCount} custom badges into local database`);
      return true;
    } catch (transactionError) {
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error replacing custom badges in local database:', error);
    return false;
  }
}

/**
 * Main import function that orchestrates the entire import process
 */
export async function importDataFromCloud(
  getToken: TokenGetter,
  onProgress?: (progress: ImportProgress) => void,
  isCancelled?: () => boolean
): Promise<{ success: boolean; message: string; cancelled?: boolean; isNetworkError?: boolean }> {
  try {
    console.log('Starting import process...');

    // Get authentication token
    const token = await getToken();
    if (!token) {
      return { success: false, message: 'Unable to authenticate with cloud service' };
    }

    // Stage 1: Get total row counts
    onProgress?.({ stage: 'counting', completed: 0, total: 1, message: 'Checking data in cloud...' });
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };
    
    const rowCounts = await getTotalRowCount(token);
    if (!rowCounts) {
      return { success: false, message: 'Failed to get data counts from cloud' };
    }

    if (rowCounts.total === 0) {
      return { success: false, message: 'NO_DATA_TO_IMPORT' };
    }

    // Progress tracking state for import phase
    const importProgressState = {
      totalRows: rowCounts.total,
      importedRows: 0
    };

    // Progress reporting function for import phase
    const reportImportProgress = (stage: string, message: string, rowsJustImported: number = 0) => {
      importProgressState.importedRows += rowsJustImported;
      const percentage = Math.round((importProgressState.importedRows / rowCounts.total) * 100);
      
      onProgress?.({
        stage,
        completed: importProgressState.importedRows,
        total: rowCounts.total,
        message,
        rowsImported: importProgressState.importedRows,
        totalRows: rowCounts.total,
        percentage
      });
    };

    // Stage 2: Import data from Supabase
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const folders = await importFoldersFromSupabase(getToken, reportImportProgress, isCancelled);
    if (folders === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import folders from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const decks = await importDecksFromSupabase(getToken, reportImportProgress, isCancelled);
    if (decks === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import decks from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const flashcards = await importFlashcardsFromSupabase(getToken, reportImportProgress, isCancelled);
    if (flashcards === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import flashcards from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const userFormEntries = await importUserFormEntriesFromSupabase(getToken, reportImportProgress, isCancelled);
    if (userFormEntries === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import user form entries from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const importedUser = await importUserFromSupabase(getToken, reportImportProgress, isCancelled);
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const streakBadges = await importStreakBadgeAssignmentsFromSupabase(getToken, reportImportProgress, isCancelled);
    if (streakBadges === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import streak badge progress from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const welcomeBadges = await importWelcomeBadgeAssignmentsFromSupabase(getToken, reportImportProgress, isCancelled);
    if (welcomeBadges === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import welcome badge progress from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const lifetimeBadges = await importLifetimeBadgeAssignmentsFromSupabase(getToken, reportImportProgress, isCancelled);
    if (lifetimeBadges === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import lifetime badge progress from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const customBadges = await importCustomBadgesFromSupabase(getToken, reportImportProgress, isCancelled);
    if (customBadges === null) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to import custom badges from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    // Stage 3: Replace local database data
    const totalLocalRows =
      folders.length +
      decks.length +
      flashcards.length +
      userFormEntries.length +
      streakBadges.length +
      welcomeBadges.length +
      lifetimeBadges.length +
      customBadges.length +
      (importedUser ? 1 : 0);
    const localProgressState = {
      totalRows: totalLocalRows,
      insertedRows: 0
    };

    // Progress reporting function for local insertion phase
    const reportLocalProgress = (stage: string, message: string, rowsJustInserted: number = 0) => {
      localProgressState.insertedRows += rowsJustInserted;
      const percentage = Math.round((localProgressState.insertedRows / totalLocalRows) * 100);
      
      onProgress?.({
        stage: 'inserting', // Always use 'inserting' stage for local database operations
        completed: localProgressState.insertedRows,
        total: totalLocalRows,
        message,
        rowsImported: localProgressState.insertedRows,
        totalRows: totalLocalRows,
        percentage
      });
    };

    reportLocalProgress('inserting', 'Starting local database update...', 0);
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const foldersSuccess = await replaceFoldersInLocalDatabase(folders, reportLocalProgress, isCancelled);
    if (!foldersSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update local folders' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const decksSuccess = await replaceDecksInLocalDatabase(decks, reportLocalProgress, isCancelled);
    if (!decksSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update local decks' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const flashcardsSuccess = await replaceFlashcardsInLocalDatabase(flashcards, reportLocalProgress, isCancelled);
    if (!flashcardsSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update local flashcards' };
    }

    const userFormEntriesSuccess = await replaceUserFormEntriesInLocalDatabase(userFormEntries, reportLocalProgress, isCancelled);
    if (!userFormEntriesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update local user form entries' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const streakBadgesSuccess = await replaceStreakBadgesInLocalDatabase(streakBadges, reportLocalProgress, isCancelled);
    if (!streakBadgesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update streak badge progress' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const welcomeBadgesSuccess = await replaceWelcomeBadgesInLocalDatabase(welcomeBadges, reportLocalProgress, isCancelled);
    if (!welcomeBadgesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update welcome badge progress' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const lifetimeBadgesSuccess = await replaceLifetimeBadgesInLocalDatabase(lifetimeBadges, reportLocalProgress, isCancelled);
    if (!lifetimeBadgesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update lifetime badge progress' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const customBadgesSuccess = await replaceCustomBadgesInLocalDatabase(customBadges, reportLocalProgress, isCancelled);
    if (!customBadgesSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update custom badges' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user', cancelled: true };

    const userSuccess = await replaceUserInLocalDatabase(importedUser, reportLocalProgress, isCancelled);
    if (!userSuccess) {
      if (isCancelled?.()) {
        return { success: false, message: 'Import cancelled by user', cancelled: true };
      }
      return { success: false, message: 'Failed to update local user data' };
    }

    reportLocalProgress('inserting', 'Import complete!', 0);

    const totalItems =
      folders.length +
      decks.length +
      flashcards.length +
      userFormEntries.length +
      streakBadges.length +
      welcomeBadges.length +
      lifetimeBadges.length +
      customBadges.length +
      (importedUser ? 1 : 0);
    console.log(`Import completed successfully! Imported ${totalItems} total items from cloud.`);

    return {
      success: true,
      message: `Import completed!`
    };
  } catch (error) {
    console.error('Error during import process:', error);
    
    // Check if this is a network error (including service errors)
    if (isNetworkError(error)) {
      console.log('Network error detected during import');
      
      // Check if this is a service error and provide a more specific message
      if (error && typeof error === 'object' && (error as any).isServiceError) {
        return { 
          success: false, 
          message: 'Import service temporarily unavailable. Please try again in a few minutes.',
          isNetworkError: true
        };
      }
      
      return { 
        success: false, 
        message: 'Import cancelled due to network error! Check your network.',
        isNetworkError: true
      };
    }
    
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

