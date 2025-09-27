import { db } from '../index';
import { getCurrentUserID } from './users';

export interface Flashcard {
  flashcardID: number;
  deckID: number;
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText: string | null;
  questionBlob: Uint8Array | null;
  answerType: string;
  answerText: string | null;
  answerMCQ: string | null;
  answerBlob: Uint8Array | null;
  timeTaken: number | null;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}

export interface DatabaseFlashcard {
  flashcardID: number;
  deckID: number;
  difficultyRating: string;
  cognitiveQnType: string;
  isFavorited: number;
  questionType: string;
  questionText: string | null;
  questionBlob: string | null; // hex string from SQLite
  answerType: string;
  answerText: string | null;
  answerMCQ: string | null;
  answerBlob: string | null; // hex string from SQLite
  timeTaken: number | null;
  isMcqAnswerRight: number | null;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
}

// Interface for transformed flashcard (matching dummy data format)
export interface TransformedFlashcard {
  flashcardID: number;
  flashcardDifficulty: string;
  flashcardQnType: string;
  flashcardQn: string | any; // string for text, require() for image/audio
  flashcardAnswerType: string;
  flashcardAnswer: string | any[] | any; // string for text, array for MCQ, require() for image/audio
  timeLimit: number;
  cognitiveQnType: string;
  isFavorited: boolean;
  isMcqAnswerRight: number | null; // Add this field to track MCQ correctness
}

export async function deleteFlashcardsByIds(flashcardIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (flashcardIds.length === 0) return true;
    
    const placeholders = flashcardIds.map(() => '?').join(',');
    const query = `DELETE FROM flashcards WHERE flashcardID IN (${placeholders}) AND userID = ?`;
    
    await db.runAsync(query, [...flashcardIds, userID]);
    return true;
  } catch (error) {
    console.error('Error deleting flashcards by IDs:', error);
    return false;
  }
}

export async function loadFlashcardsFromDatabase(deckId: string, isAIDeck: string): Promise<Flashcard[]> {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    
    if (isAIDeck === 'true') {
      query = `
        SELECT 
          flashcardID,
          deckID,
          difficultyRating,
          cognitiveQnType,
          isFavorited,
          questionType,
          questionText,
          questionBlob,
          answerType,
          answerText,
          answerMCQ,
          answerBlob,
          timeTaken,
          isMcqAnswerRight,
          lastStudiedDate,
          lastQuizzedDate
        FROM AIFlashcards 
        WHERE deckID = ? AND userID = ?
        ORDER BY flashcardID ASC
      `;
    } else {
      query = `
        SELECT 
          flashcardID,
          deckID,
          difficultyRating,
          cognitiveQnType,
          isFavorited,
          questionType,
          questionText,
          questionBlob,
          answerType,
          answerText,
          answerMCQ,
          answerBlob,
          timeTaken,
          isMcqAnswerRight,
          lastStudiedDate,
          lastQuizzedDate
        FROM flashcards 
        WHERE deckID = ? AND userID = ?
        ORDER BY flashcardID ASC
      `;
    }
    
    const result = await db.getAllAsync(query, [deckId, userID]);
    return result as Flashcard[];
  } catch (error) {
    console.error('Error loading flashcards from database:', error);
    return [];
  }
}

export async function loadTopicsFromDatabase(deckId: string, isAIDeck: string): Promise<string[]> {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    
    if (isAIDeck === 'true') {
      query = `
        SELECT DISTINCT cognitiveQnType
        FROM AIFlashcards 
        WHERE deckID = ? AND userID = ? AND cognitiveQnType IS NOT NULL
        ORDER BY cognitiveQnType ASC
      `;
    } else {
      query = `
        SELECT DISTINCT cognitiveQnType
        FROM flashcards 
        WHERE deckID = ? AND userID = ? AND cognitiveQnType IS NOT NULL
        ORDER BY cognitiveQnType ASC
      `;
    }
    
    const result = await db.getAllAsync(query, [deckId, userID]) as Array<{ cognitiveQnType: string }>;
    return result.map(row => row.cognitiveQnType);
  } catch (error) {
    console.error('Error loading topics from database:', error);
    return [];
  }
}

export function calculateQuestionTypeCounts(flashcards: Flashcard[]): { title: string; count: number }[] {
  const counts: { [key: string]: number } = {};
  
  flashcards.forEach(flashcard => {
    const type = flashcard.cognitiveQnType || 'Unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  
  return Object.entries(counts).map(([title, count]) => ({ title, count }));
}

export async function toggleFlashcardFavorite(flashcardIdx: number, flashcards: Flashcard[], isAIDeck: string): Promise<{ success: boolean; updatedFlashcards: Flashcard[] }> {
  try {
    const userID = await getCurrentUserID();
    const flashcard = flashcards[flashcardIdx];
    
    if (!flashcard) {
      return { success: false, updatedFlashcards: flashcards };
    }
    
    const newFavoriteStatus = flashcard.isFavorited === 1 ? 0 : 1;
    let query: string;
    
    if (isAIDeck === 'true') {
      query = 'UPDATE AIFlashcards SET isFavorited = ? WHERE flashcardID = ? AND userID = ?';
    } else {
      query = 'UPDATE flashcards SET isFavorited = ? WHERE flashcardID = ? AND userID = ?';
    }
    
    await db.runAsync(query, [newFavoriteStatus, flashcard.flashcardID, userID]);
    
    // Update the local array
    const updatedFlashcards = [...flashcards];
    updatedFlashcards[flashcardIdx] = { ...flashcard, isFavorited: newFavoriteStatus };
    
    return { success: true, updatedFlashcards };
  } catch (error) {
    console.error('Error toggling flashcard favorite:', error);
    return { success: false, updatedFlashcards: flashcards };
  }
}

export async function deleteSelectedFlashcards(selectedCardIndexes: number[], flashcards: Flashcard[], deckId: string, isAIDeck: string): Promise<{ success: boolean; updatedFlashcards: Flashcard[] }> {
  try {
    const userID = await getCurrentUserID();
    const flashcardIdsToDelete = selectedCardIndexes.map(idx => flashcards[idx].flashcardID);
    
    if (flashcardIdsToDelete.length === 0) {
      return { success: true, updatedFlashcards: flashcards };
    }
    
    let query: string;
    if (isAIDeck === 'true') {
      const placeholders = flashcardIdsToDelete.map(() => '?').join(',');
      query = `DELETE FROM AIFlashcards WHERE flashcardID IN (${placeholders}) AND userID = ?`;
    } else {
      const placeholders = flashcardIdsToDelete.map(() => '?').join(',');
      query = `DELETE FROM flashcards WHERE flashcardID IN (${placeholders}) AND userID = ?`;
    }
    
    await db.runAsync(query, [...flashcardIdsToDelete, userID]);
    
    // Remove deleted flashcards from the local array
    const updatedFlashcards = flashcards.filter((_, index) => !selectedCardIndexes.includes(index));
    
    return { success: true, updatedFlashcards };
  } catch (error) {
    console.error('Error deleting selected flashcards:', error);
    return { success: false, updatedFlashcards: flashcards };
  }
}

// Function to get time limit based on difficulty rating
export const getTimeLimit = async (difficultyRating: string, answerType?: string): Promise<number> => {
  try {
    const userID = await getCurrentUserID();
    
    // Get timer settings from users table
    const query = `
      SELECT 
        defaultTimer,
        againTimer,
        hardTimer,
        goodTimer,
        easyTimer
      FROM users 
      WHERE userID = ?
    `;
    
    const result = await db.getFirstAsync(query, [userID]) as {
      defaultTimer: number;
      againTimer: number;
      hardTimer: number;
      goodTimer: number;
      easyTimer: number;
    } | null;
    
    if (!result) {
      // Default timers if user settings not found
      const defaultTimers = {
        'Again': 30,
        'Hard': 60,
        'Good': 120,
        'Easy': 300
      };
      return defaultTimers[difficultyRating as keyof typeof defaultTimers] || 120;
    }
    
    // Return appropriate timer based on difficulty rating
    switch (difficultyRating) {
      case 'Again':
        return result.againTimer;
      case 'Hard':
        return result.hardTimer;
      case 'Good':
        return result.goodTimer;
      case 'Easy':
        return result.easyTimer;
      default:
        return result.defaultTimer;
    }
  } catch (error) {
    console.error('Error getting time limit:', error);
    // Return default timer on error
    return 120;
  }
};

// Helper functions for blob processing
const extractSVGFromBlob = (blob: string | Uint8Array): { paths: Array<{ d: string; stroke: string; strokeWidth: string; fill: string }>; viewBox: string } | null => {
  try {
    let blobString: string;
    
    if (typeof blob === 'string') {
      blobString = blob;
    } else {
      // Convert Uint8Array to hex string
      blobString = Array.from(blob)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Convert hex to text
    const text = blobString.match(/.{1,2}/g)
      ?.map(hex => String.fromCharCode(parseInt(hex, 16)))
      .join('') || '';
    
    // Extract SVG content
    const svgMatch = text.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (!svgMatch) return null;
    
    const svgContent = svgMatch[0];
    const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/);
    const pathMatches = svgContent.match(/<path[^>]*>/g) || [];
    
    const paths = pathMatches.map(pathTag => {
      const dMatch = pathTag.match(/d="([^"]*)"/);
      const strokeMatch = pathTag.match(/stroke="([^"]*)"/);
      const strokeWidthMatch = pathTag.match(/stroke-width="([^"]*)"/);
      const fillMatch = pathTag.match(/fill="([^"]*)"/);
      
      return {
        d: dMatch ? dMatch[1] : '',
        stroke: strokeMatch ? strokeMatch[1] : 'black',
        strokeWidth: strokeWidthMatch ? strokeWidthMatch[1] : '1',
        fill: fillMatch ? fillMatch[1] : 'none'
      };
    });
    
    return {
      paths,
      viewBox: viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100'
    };
  } catch (error) {
    console.error('Error extracting SVG from blob:', error);
    return null;
  }
};

const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Cache for blob processing
const blobCache = new Map<string, any>();

const clearBlobCache = () => {
  blobCache.clear();
};

const addToCache = (key: string, value: any) => {
  blobCache.set(key, value);
};

const blobToImageSource = (blob: Uint8Array | string): any => {
  try {
    if (typeof blob === 'string') {
      // Hex string
      const cacheKey = `img_${blob.substring(0, 20)}`;
      if (blobCache.has(cacheKey)) {
        return blobCache.get(cacheKey);
      }
      
      // Convert hex to base64
      const base64 = blob.match(/.{1,2}/g)
        ?.map(hex => String.fromCharCode(parseInt(hex, 16)))
        .join('') || '';
      
      const dataUri = `data:image/png;base64,${btoa(base64)}`;
      addToCache(cacheKey, { uri: dataUri });
      return { uri: dataUri };
    } else {
      // Uint8Array
      const cacheKey = `img_${blob.length}_${blob[0]}_${blob[1]}`;
      if (blobCache.has(cacheKey)) {
        return blobCache.get(cacheKey);
      }
      
      const base64 = arrayBufferToBase64(blob.buffer);
      const dataUri = `data:image/png;base64,${base64}`;
      addToCache(cacheKey, { uri: dataUri });
      return { uri: dataUri };
    }
  } catch (error) {
    console.error('Error converting blob to image source:', error);
    return undefined;
  }
};

const blobToAudioSource = (blob: Uint8Array | string): any => {
  try {
    if (typeof blob === 'string') {
      // Hex string
      const cacheKey = `audio_${blob.substring(0, 20)}`;
      if (blobCache.has(cacheKey)) {
        return blobCache.get(cacheKey);
      }
      
      // Convert hex to base64
      const base64 = blob.match(/.{1,2}/g)
        ?.map(hex => String.fromCharCode(parseInt(hex, 16)))
        .join('') || '';
      
      const dataUri = `data:audio/m4a;base64,${btoa(base64)}`;
      addToCache(cacheKey, { uri: dataUri });
      return { uri: dataUri };
    } else {
      // Uint8Array
      const cacheKey = `audio_${blob.length}_${blob[0]}_${blob[1]}`;
      if (blobCache.has(cacheKey)) {
        return blobCache.get(cacheKey);
      }
      
      const base64 = arrayBufferToBase64(blob.buffer);
      const dataUri = `data:audio/m4a;base64,${base64}`;
      addToCache(cacheKey, { uri: dataUri });
      return { uri: dataUri };
    }
  } catch (error) {
    console.error('Error converting blob to audio source:', error);
    return undefined;
  }
};

export const loadFlashcardsFromDatabaseForView = async (deckId: string, isAIDeck: string, retryDifficult?: boolean): Promise<TransformedFlashcard[]> => {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    
    if (isAIDeck === 'true') {
      query = `
        SELECT 
          flashcardID,
          difficultyRating,
          cognitiveQnType,
          isFavorited,
          questionType,
          questionText,
          questionBlob,
          answerType,
          answerText,
          answerMCQ,
          answerBlob,
          timeTaken,
          isMcqAnswerRight
        FROM AIFlashcards 
        WHERE deckID = ? AND userID = ?
        ORDER BY flashcardID ASC
      `;
    } else {
      query = `
        SELECT 
          flashcardID,
          difficultyRating,
          cognitiveQnType,
          isFavorited,
          questionType,
          questionText,
          questionBlob,
          answerType,
          answerText,
          answerMCQ,
          answerBlob,
          timeTaken,
          isMcqAnswerRight
        FROM flashcards 
        WHERE deckID = ? AND userID = ?
        ORDER BY flashcardID ASC
      `;
    }
    
    const result = await db.getAllAsync(query, [deckId, userID]) as DatabaseFlashcard[];
    
    const transformedFlashcards: TransformedFlashcard[] = [];
    
    for (const flashcard of result) {
      const timeLimit = await getTimeLimit(flashcard.difficultyRating, flashcard.answerType);
      
      let transformedQuestion: string | any;
      let transformedAnswer: string | any[] | any;
      
      // Transform question
      if (flashcard.questionType === 'text') {
        transformedQuestion = flashcard.questionText || '';
      } else if (flashcard.questionType === 'image') {
        transformedQuestion = flashcard.questionBlob ? blobToImageSource(flashcard.questionBlob) : '';
      } else if (flashcard.questionType === 'audio') {
        transformedQuestion = flashcard.questionBlob ? blobToAudioSource(flashcard.questionBlob) : '';
      } else if (flashcard.questionType === 'svg') {
        const svgData = flashcard.questionBlob ? extractSVGFromBlob(flashcard.questionBlob) : null;
        transformedQuestion = svgData || '';
      } else {
        transformedQuestion = flashcard.questionText || '';
      }
      
      // Transform answer
      if (flashcard.answerType === 'text') {
        transformedAnswer = flashcard.answerText || '';
      } else if (flashcard.answerType === 'mcq') {
        try {
          transformedAnswer = flashcard.answerMCQ ? JSON.parse(flashcard.answerMCQ) : [];
        } catch (error) {
          console.error('Error parsing MCQ answer:', error);
          transformedAnswer = [];
        }
      } else if (flashcard.answerType === 'image') {
        transformedAnswer = flashcard.answerBlob ? blobToImageSource(flashcard.answerBlob) : '';
      } else if (flashcard.answerType === 'audio') {
        transformedAnswer = flashcard.answerBlob ? blobToAudioSource(flashcard.answerBlob) : '';
      } else if (flashcard.answerType === 'svg') {
        const svgData = flashcard.answerBlob ? extractSVGFromBlob(flashcard.answerBlob) : null;
        transformedAnswer = svgData || '';
      } else {
        transformedAnswer = flashcard.answerText || '';
      }
      
      transformedFlashcards.push({
        flashcardID: flashcard.flashcardID,
        flashcardDifficulty: flashcard.difficultyRating,
        flashcardQnType: flashcard.questionType,
        flashcardQn: transformedQuestion,
        flashcardAnswerType: flashcard.answerType,
        flashcardAnswer: transformedAnswer,
        timeLimit,
        cognitiveQnType: flashcard.cognitiveQnType,
        isFavorited: flashcard.isFavorited === 1,
        isMcqAnswerRight: flashcard.isMcqAnswerRight
      });
    }
    
    return transformedFlashcards;
  } catch (error) {
    console.error('Error loading flashcards from database for view:', error);
    return [];
  }
};

export const updateFlashcardDate = async (
  flashcardId: number, 
  isStudyMode: boolean, 
  deckId: string, 
  isAIDeck: string,
  timeTaken?: number, 
  isMcqCorrect?: boolean
): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    let query: string;
    let params: any[];
    
    if (isAIDeck === 'true') {
      if (isStudyMode) {
        query = 'UPDATE AIFlashcards SET lastStudiedDate = ?, timeTaken = ? WHERE flashcardID = ? AND userID = ?';
        params = [currentDate, timeTaken || null, flashcardId, userID];
      } else {
        query = 'UPDATE AIFlashcards SET lastQuizzedDate = ?, timeTaken = ?, isMcqAnswerRight = ? WHERE flashcardID = ? AND userID = ?';
        params = [currentDate, timeTaken || null, isMcqCorrect !== undefined ? (isMcqCorrect ? 1 : 0) : null, flashcardId, userID];
      }
    } else {
      if (isStudyMode) {
        query = 'UPDATE flashcards SET lastStudiedDate = ?, timeTaken = ? WHERE flashcardID = ? AND userID = ?';
        params = [currentDate, timeTaken || null, flashcardId, userID];
      } else {
        query = 'UPDATE flashcards SET lastQuizzedDate = ?, timeTaken = ?, isMcqAnswerRight = ? WHERE flashcardID = ? AND userID = ?';
        params = [currentDate, timeTaken || null, isMcqCorrect !== undefined ? (isMcqCorrect ? 1 : 0) : null, flashcardId, userID];
      }
    }
    
    await db.runAsync(query, params);
  } catch (error) {
    console.error('Error updating flashcard date:', error);
  }
};

export const updateFlashcardDifficulty = async (
  flashcardId: number, 
  difficulty: string, 
  isAIDeck: string
): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    
    let query: string;
    if (isAIDeck === 'true') {
      query = 'UPDATE AIFlashcards SET difficultyRating = ? WHERE flashcardID = ? AND userID = ?';
    } else {
      query = 'UPDATE flashcards SET difficultyRating = ? WHERE flashcardID = ? AND userID = ?';
    }
    
    await db.runAsync(query, [difficulty, flashcardId, userID]);
  } catch (error) {
    console.error('Error updating flashcard difficulty:', error);
  }
};

export const toggleFlashcardFavoriteForView = async (
  flashcardId: number, 
  isAIDeck: string
): Promise<boolean> => {
  try {
    const userID = await getCurrentUserID();
    
    // First get current favorite status
    let selectQuery: string;
    if (isAIDeck === 'true') {
      selectQuery = 'SELECT isFavorited FROM AIFlashcards WHERE flashcardID = ? AND userID = ?';
    } else {
      selectQuery = 'SELECT isFavorited FROM flashcards WHERE flashcardID = ? AND userID = ?';
    }
    
    const result = await db.getFirstAsync(selectQuery, [flashcardId, userID]) as { isFavorited: number } | null;
    
    if (!result) return false;
    
    const newFavoriteStatus = result.isFavorited === 1 ? 0 : 1;
    
    // Update favorite status
    let updateQuery: string;
    if (isAIDeck === 'true') {
      updateQuery = 'UPDATE AIFlashcards SET isFavorited = ? WHERE flashcardID = ? AND userID = ?';
    } else {
      updateQuery = 'UPDATE flashcards SET isFavorited = ? WHERE flashcardID = ? AND userID = ?';
    }
    
    await db.runAsync(updateQuery, [newFavoriteStatus, flashcardId, userID]);
    return true;
  } catch (error) {
    console.error('Error toggling flashcard favorite for view:', error);
    return false;
  }
};

export const getFlashcardCount = async (deckId: string, isAIDeck: string): Promise<number> => {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    
    if (isAIDeck === 'true') {
      query = 'SELECT COUNT(*) as count FROM AIFlashcards WHERE deckID = ? AND userID = ?';
    } else {
      query = 'SELECT COUNT(*) as count FROM flashcards WHERE deckID = ? AND userID = ?';
    }
    
    const result = await db.getFirstAsync(query, [deckId, userID]) as { count: number } | null;
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting flashcard count:', error);
    return 0;
  }
};

export const deleteFlashcard = async (flashcardId: number, isAIDeck: string): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    
    let query: string;
    if (isAIDeck === 'true') {
      query = 'DELETE FROM AIFlashcards WHERE flashcardID = ? AND userID = ?';
    } else {
      query = 'DELETE FROM flashcards WHERE flashcardID = ? AND userID = ?';
    }
    
    await db.runAsync(query, [flashcardId, userID]);
  } catch (error) {
    console.error('Error deleting flashcard:', error);
  }
};
