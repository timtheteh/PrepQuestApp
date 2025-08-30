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
export async function getTotalRowCount(token: string): Promise<{ folders: number; decks: number; flashcards: number; total: number } | null> {
  try {
    const userID = await getCurrentUserID();
    const authenticatedSupabase = await createAuthenticatedSupabaseClient(token);

    // Get counts for each table
    const [foldersResult, decksResult, flashcardsResult] = await Promise.all([
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
        .eq('userID', userID)
    ]);

    if (foldersResult.error || decksResult.error || flashcardsResult.error) {
      console.error('Error getting row counts:', {
        folders: foldersResult.error,
        decks: decksResult.error,
        flashcards: flashcardsResult.error
      });
      return null;
    }

    const counts = {
      folders: foldersResult.count || 0,
      decks: decksResult.count || 0,
      flashcards: flashcardsResult.count || 0,
      total: (foldersResult.count || 0) + (decksResult.count || 0) + (flashcardsResult.count || 0)
    };

    console.log('Row counts from Supabase:', counts);
    return counts;
  } catch (error) {
    console.error('Error in getTotalRowCount:', error);
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
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing folders');
          return null;
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
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const token = await getToken();
        if (!token) {
          console.error('Unable to get authentication token for importing decks');
          return null;
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
      return null;
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
        return null;
      }

      const batchSupabase = await createAuthenticatedSupabaseClient(batchToken);

      // Retry logic for batch import
      let retries = 0;
      const maxRetries = 3;
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
 * Main import function that orchestrates the entire import process
 */
export async function importDataFromCloud(
  getToken: TokenGetter,
  onProgress?: (progress: ImportProgress) => void,
  isCancelled?: () => boolean
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Starting import process...');

    // Get authentication token
    const token = await getToken();
    if (!token) {
      return { success: false, message: 'Unable to authenticate with cloud service' };
    }

    // Stage 1: Get total row counts
    onProgress?.({ stage: 'counting', completed: 0, total: 1, message: 'Checking data in cloud...' });
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };
    
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
    reportImportProgress('importing', 'Starting import from cloud...', 0);
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    const folders = await importFoldersFromSupabase(getToken, reportImportProgress, isCancelled);
    if (folders === null) {
      return { success: false, message: 'Failed to import folders from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    const decks = await importDecksFromSupabase(getToken, reportImportProgress, isCancelled);
    if (decks === null) {
      return { success: false, message: 'Failed to import decks from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    const flashcards = await importFlashcardsFromSupabase(getToken, reportImportProgress, isCancelled);
    if (flashcards === null) {
      return { success: false, message: 'Failed to import flashcards from cloud' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    // Stage 3: Replace local database data
    const totalLocalRows = folders.length + decks.length + flashcards.length;
    const localProgressState = {
      totalRows: totalLocalRows,
      insertedRows: 0
    };

    // Progress reporting function for local insertion phase
    const reportLocalProgress = (stage: string, message: string, rowsJustInserted: number = 0) => {
      localProgressState.insertedRows += rowsJustInserted;
      const percentage = Math.round((localProgressState.insertedRows / totalLocalRows) * 100);
      
      onProgress?.({
        stage,
        completed: localProgressState.insertedRows,
        total: totalLocalRows,
        message,
        rowsImported: localProgressState.insertedRows,
        totalRows: totalLocalRows,
        percentage
      });
    };

    reportLocalProgress('inserting', 'Starting local database update...', 0);
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    const foldersSuccess = await replaceFoldersInLocalDatabase(folders, reportLocalProgress, isCancelled);
    if (!foldersSuccess) {
      return { success: false, message: 'Failed to update local folders' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    const decksSuccess = await replaceDecksInLocalDatabase(decks, reportLocalProgress, isCancelled);
    if (!decksSuccess) {
      return { success: false, message: 'Failed to update local decks' };
    }
    if (isCancelled?.()) return { success: false, message: 'Import cancelled by user' };

    const flashcardsSuccess = await replaceFlashcardsInLocalDatabase(flashcards, reportLocalProgress, isCancelled);
    if (!flashcardsSuccess) {
      return { success: false, message: 'Failed to update local flashcards' };
    }

    reportLocalProgress('inserting', 'Import complete!', 0);

    const totalItems = folders.length + decks.length + flashcards.length;
    console.log(`Import completed successfully! Imported ${totalItems} total items from cloud.`);

    return {
      success: true,
      message: `Import completed!`
    };
  } catch (error) {
    console.error('Error during import process:', error);
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

