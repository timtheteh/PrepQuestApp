import { db } from './index';

// Types for flashcard operations
export interface Flashcard {
  flashcardID?: number;
  deckID: number;
  difficultyRating: 'Easy' | 'Good' | 'Hard' | 'Again' | 'None';
  cognitiveQnType: 'Recall' | 'Comprehension' | 'Application' | 'Analysis' | 'Synthesis' | 'Evaluation' | 'Problem-Solving';
  isFavorited: number;
  questionType: 'text' | 'image' | 'audio';
  questionText?: string;
  questionBlob?: any; // BLOB data
  answerType: 'text' | 'mcq' | 'image' | 'audio' | 'voice';
  answerText?: string;
  answerBlob?: any; // BLOB data
  timeTaken?: number;
  isMcqAnswerRight?: number;
  lastStudiedDate?: string;
  lastQuizzedDate?: string;
}

export interface FlashcardWithDeck extends Flashcard {
  deckName?: string;
  deckType?: string;
}

// Helper function to safely escape SQL strings
const escapeSQL = (value: any): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return String(value);
};

// CREATE operations
export const createFlashcard = async (flashcard: Flashcard): Promise<number> => {
  const sql = `
    INSERT INTO flashcards (
      deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
      answerType, answerText, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
    ) VALUES (
      ${escapeSQL(flashcard.deckID)}, ${escapeSQL(flashcard.difficultyRating)}, ${escapeSQL(flashcard.cognitiveQnType)},
      ${escapeSQL(flashcard.isFavorited)}, ${escapeSQL(flashcard.questionType)}, ${escapeSQL(flashcard.questionText)},
      ${escapeSQL(flashcard.questionBlob)}, ${escapeSQL(flashcard.answerType)}, ${escapeSQL(flashcard.answerText)},
      ${escapeSQL(flashcard.answerBlob)}, ${escapeSQL(flashcard.timeTaken)}, ${escapeSQL(flashcard.isMcqAnswerRight)},
      ${escapeSQL(flashcard.lastStudiedDate)}, ${escapeSQL(flashcard.lastQuizzedDate)}
    )
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Created flashcard for deck ID: ${flashcard.deckID}`);
    return 1; // Placeholder - implement proper ID retrieval if needed
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
};

// READ operations
export const getAllFlashcards = async (): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    ORDER BY f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching all flashcards:', error);
    throw error;
  }
};

export const getFlashcardById = async (flashcardID: number): Promise<FlashcardWithDeck | null> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.flashcardID = ${flashcardID}
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result as FlashcardWithDeck | null;
  } catch (error) {
    console.error('Error fetching flashcard by ID:', error);
    throw error;
  }
};

export const getFlashcardsByDeck = async (deckID: number): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.deckID = ${deckID}
    ORDER BY f.flashcardID ASC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by deck:', error);
    throw error;
  }
};

export const getFlashcardsByDifficulty = async (difficulty: 'Easy' | 'Good' | 'Hard' | 'Again' | 'None'): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.difficultyRating = ${escapeSQL(difficulty)}
    ORDER BY f.lastStudiedDate DESC, f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by difficulty:', error);
    throw error;
  }
};

export const getFlashcardsByQuestionType = async (questionType: 'text' | 'image' | 'audio'): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.questionType = ${escapeSQL(questionType)}
    ORDER BY f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by question type:', error);
    throw error;
  }
};

export const getFlashcardsByAnswerType = async (answerType: 'text' | 'mcq' | 'image' | 'audio' | 'voice'): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.answerType = ${escapeSQL(answerType)}
    ORDER BY f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by answer type:', error);
    throw error;
  }
};

export const getFavoriteFlashcards = async (): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.isFavorited = 1
    ORDER BY f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching favorite flashcards:', error);
    throw error;
  }
};

export const getFlashcardsByCognitiveType = async (cognitiveType: 'Recall' | 'Comprehension' | 'Application' | 'Analysis' | 'Synthesis' | 'Evaluation' | 'Problem-Solving'): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.cognitiveQnType = ${escapeSQL(cognitiveType)}
    ORDER BY f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by cognitive type:', error);
    throw error;
  }
};

export const getFlashcardsNeedingReview = async (): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.difficultyRating IN ('Hard', 'Again')
    ORDER BY f.lastStudiedDate ASC, f.flashcardID ASC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards needing review:', error);
    throw error;
  }
};

export const getFlashcardsByTimeRange = async (minTime: number, maxTime: number): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE f.timeTaken BETWEEN ${minTime} AND ${maxTime}
    ORDER BY f.timeTaken DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by time range:', error);
    throw error;
  }
};

// UPDATE operations
export const updateFlashcard = async (flashcardID: number, updates: Partial<Flashcard>): Promise<void> => {
  const updateFields: string[] = [];
  const values: any[] = [];
  
  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'flashcardID') { // Don't update the primary key
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  const sql = `
    UPDATE flashcards 
    SET ${updateFields.join(', ')}
    WHERE flashcardID = ${flashcardID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
};

export const updateFlashcardDifficulty = async (flashcardID: number, difficulty: 'Easy' | 'Good' | 'Hard' | 'Again' | 'None'): Promise<void> => {
  const sql = `
    UPDATE flashcards 
    SET difficultyRating = ${escapeSQL(difficulty)}
    WHERE flashcardID = ${flashcardID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated difficulty for flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error updating flashcard difficulty:', error);
    throw error;
  }
};

export const toggleFlashcardFavorite = async (flashcardID: number): Promise<void> => {
  const sql = `
    UPDATE flashcards 
    SET isFavorited = CASE WHEN isFavorited = 1 THEN 0 ELSE 1 END
    WHERE flashcardID = ${flashcardID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Toggled favorite for flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error toggling flashcard favorite:', error);
    throw error;
  }
};

export const updateLastStudied = async (flashcardID: number): Promise<void> => {
  const sql = `
    UPDATE flashcards 
    SET lastStudiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE flashcardID = ${flashcardID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated last studied for flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error updating last studied:', error);
    throw error;
  }
};

export const updateLastQuizzed = async (flashcardID: number): Promise<void> => {
  const sql = `
    UPDATE flashcards 
    SET lastQuizzedDate = ${escapeSQL(new Date().toISOString())}
    WHERE flashcardID = ${flashcardID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated last quizzed for flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error updating last quizzed:', error);
    throw error;
  }
};

export const updateTimeTaken = async (flashcardID: number, timeTaken: number): Promise<void> => {
  const sql = `
    UPDATE flashcards 
    SET timeTaken = ${timeTaken}
    WHERE flashcardID = ${flashcardID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated time taken for flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error updating time taken:', error);
    throw error;
  }
};

// DELETE operations
export const deleteFlashcard = async (flashcardID: number): Promise<void> => {
  const sql = `DELETE FROM flashcards WHERE flashcardID = ${flashcardID}`;
  
  try {
    await db.execAsync(sql);
    console.log(`Deleted flashcard ID: ${flashcardID}`);
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
};

export const deleteFlashcardsByDeck = async (deckID: number): Promise<void> => {
  const sql = `DELETE FROM flashcards WHERE deckID = ${deckID}`;
  
  try {
    await db.execAsync(sql);
    console.log(`Deleted all flashcards for deck ID: ${deckID}`);
  } catch (error) {
    console.error('Error deleting flashcards by deck:', error);
    throw error;
  }
};

// Analytics and statistics
export const getFlashcardStats = async (): Promise<any> => {
  const sql = `
    SELECT 
      COUNT(*) as totalFlashcards,
      SUM(CASE WHEN difficultyRating = 'Easy' THEN 1 ELSE 0 END) as easyCards,
      SUM(CASE WHEN difficultyRating = 'Good' THEN 1 ELSE 0 END) as goodCards,
      SUM(CASE WHEN difficultyRating = 'Hard' THEN 1 ELSE 0 END) as hardCards,
      SUM(CASE WHEN difficultyRating = 'Again' THEN 1 ELSE 0 END) as againCards,
      SUM(CASE WHEN isFavorited = 1 THEN 1 ELSE 0 END) as favoriteCards,
      AVG(timeTaken) as avgTimeTaken,
      SUM(CASE WHEN isMcqAnswerRight = 1 THEN 1 ELSE 0 END) as correctMcqAnswers
    FROM flashcards
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result;
  } catch (error) {
    console.error('Error fetching flashcard stats:', error);
    throw error;
  }
};

export const getDeckFlashcardStats = async (deckID: number): Promise<any> => {
  const sql = `
    SELECT 
      COUNT(*) as totalFlashcards,
      SUM(CASE WHEN difficultyRating = 'Easy' THEN 1 ELSE 0 END) as easyCards,
      SUM(CASE WHEN difficultyRating = 'Good' THEN 1 ELSE 0 END) as goodCards,
      SUM(CASE WHEN difficultyRating = 'Hard' THEN 1 ELSE 0 END) as hardCards,
      SUM(CASE WHEN difficultyRating = 'Again' THEN 1 ELSE 0 END) as againCards,
      SUM(CASE WHEN isFavorited = 1 THEN 1 ELSE 0 END) as favoriteCards,
      AVG(timeTaken) as avgTimeTaken,
      SUM(CASE WHEN isMcqAnswerRight = 1 THEN 1 ELSE 0 END) as correctMcqAnswers
    FROM flashcards
    WHERE deckID = ${deckID}
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result;
  } catch (error) {
    console.error('Error fetching deck flashcard stats:', error);
    throw error;
  }
};

export const getRecentFlashcards = async (limit: number = 10): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    ORDER BY f.lastStudiedDate DESC, f.lastQuizzedDate DESC
    LIMIT ${limit}
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching recent flashcards:', error);
    throw error;
  }
};

export const getFlashcardsByDeckType = async (deckType: 'study' | 'interview'): Promise<FlashcardWithDeck[]> => {
  const sql = `
    SELECT f.*, d.deckName, d.deckType 
    FROM flashcards f 
    LEFT JOIN decks d ON f.deckID = d.deckID 
    WHERE d.deckType = ${escapeSQL(deckType)}
    ORDER BY f.flashcardID DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FlashcardWithDeck[];
  } catch (error) {
    console.error('Error fetching flashcards by deck type:', error);
    throw error;
  }
}; 