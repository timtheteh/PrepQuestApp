import { db } from './index';

// Types for deck operations
export interface Deck {
  deckID?: number;
  deckName: string;
  dateAdded: string;
  lastModifiedDate?: string;
  isFavorited: number;
  deckType: 'study' | 'interview';
  creationMethod: 'manual' | 'genAIForm' | 'fileUpload' | 'youtubeLink' | 'AISuggested';
  lastStudiedDate?: string;
  lastQuizzedDate?: string;
  cardDesignIndex: number;
  isAIDeck: number;
  folderID?: number;
  // Study-specific fields
  studyEducationLevel?: string;
  studySubjects?: string; // JSON array
  studyTopicsSubtopics?: string; // JSON array
  studyExamQuiz?: string;
  // Interview-specific fields
  interviewJobRole?: string;
  interviewType?: string;
  interviewCompany?: string;
  interviewExperienceLevel?: string;
  interviewTopics?: string; // JSON array
  interviewCompanyIcon?: string;
}

export interface DeckWithFolder extends Deck {
  folderName?: string;
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
export const createDeck = async (deck: Deck): Promise<number> => {
  const sql = `
    INSERT INTO decks (
      deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
      lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderID,
      studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
      interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel,
      interviewTopics, interviewCompanyIcon
    ) VALUES (
      ${escapeSQL(deck.deckName)}, ${escapeSQL(deck.dateAdded)}, ${escapeSQL(deck.lastModifiedDate)}, 
      ${escapeSQL(deck.isFavorited)}, ${escapeSQL(deck.deckType)}, ${escapeSQL(deck.creationMethod)},
      ${escapeSQL(deck.lastStudiedDate)}, ${escapeSQL(deck.lastQuizzedDate)}, ${escapeSQL(deck.cardDesignIndex)}, 
      ${escapeSQL(deck.isAIDeck)}, ${escapeSQL(deck.folderID)}, ${escapeSQL(deck.studyEducationLevel)},
      ${escapeSQL(deck.studySubjects)}, ${escapeSQL(deck.studyTopicsSubtopics)}, ${escapeSQL(deck.studyExamQuiz)},
      ${escapeSQL(deck.interviewJobRole)}, ${escapeSQL(deck.interviewType)}, ${escapeSQL(deck.interviewCompany)},
      ${escapeSQL(deck.interviewExperienceLevel)}, ${escapeSQL(deck.interviewTopics)}, ${escapeSQL(deck.interviewCompanyIcon)}
    )
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Created deck: ${deck.deckName}`);
    // Note: SQLite doesn't return the inserted ID directly, you might need to query for it
    return 1; // Placeholder - implement proper ID retrieval if needed
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
};

// READ operations
export const getAllDecks = async (): Promise<Deck[]> => {
  const sql = `
    SELECT * FROM decks 
    ORDER BY dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching all decks:', error);
    throw error;
  }
};

export const getDeckById = async (deckID: number): Promise<DeckWithFolder | null> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    WHERE d.deckID = ${deckID}
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result as DeckWithFolder | null;
  } catch (error) {
    console.error('Error fetching deck by ID:', error);
    throw error;
  }
};

export const getDecksByType = async (deckType: 'study' | 'interview'): Promise<Deck[]> => {
  const sql = `
    SELECT *  
    FROM decks d 
    WHERE d.deckType = ${escapeSQL(deckType)}
    ORDER BY d.lastModifiedDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error fetching decks by type:', error);
    throw error;
  }
};

export const getDecksByFolder = async (folderID: number): Promise<DeckWithFolder[]> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    WHERE d.folderID = ${folderID}
    ORDER BY d.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error fetching decks by folder:', error);
    throw error;
  }
};

export const getFavoriteDecks = async (): Promise<DeckWithFolder[]> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    WHERE d.isFavorited = 1
    ORDER BY d.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error fetching favorite decks:', error);
    throw error;
  }
};

export const searchDecks = async (searchTerm: string): Promise<DeckWithFolder[]> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    WHERE d.deckName LIKE ${escapeSQL(`%${searchTerm}%`)}
    OR d.studySubjects LIKE ${escapeSQL(`%${searchTerm}%`)}
    OR d.studyTopicsSubtopics LIKE ${escapeSQL(`%${searchTerm}%`)}
    OR d.interviewTopics LIKE ${escapeSQL(`%${searchTerm}%`)}
    OR d.interviewCompany LIKE ${escapeSQL(`%${searchTerm}%`)}
    ORDER BY d.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error searching decks:', error);
    throw error;
  }
};

// UPDATE operations
export const updateDeck = async (deckID: number, updates: Partial<Deck>): Promise<void> => {
  const updateFields: string[] = [];
  const values: any[] = [];
  
  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'deckID') { // Don't update the primary key
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  const sql = `
    UPDATE decks 
    SET ${updateFields.join(', ')}, lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE deckID = ${deckID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated deck ID: ${deckID}`);
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
};

export const toggleFavorite = async (deckID: number): Promise<void> => {
  const sql = `
    UPDATE decks 
    SET isFavorited = CASE WHEN isFavorited = 1 THEN 0 ELSE 1 END,
        lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE deckID = ${deckID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Toggled favorite for deck ID: ${deckID}`);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const updateLastStudied = async (deckID: number): Promise<void> => {
  const sql = `
    UPDATE decks 
    SET lastStudiedDate = ${escapeSQL(new Date().toISOString())},
        lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE deckID = ${deckID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated last studied for deck ID: ${deckID}`);
  } catch (error) {
    console.error('Error updating last studied:', error);
    throw error;
  }
};

export const updateLastQuizzed = async (deckID: number): Promise<void> => {
  const sql = `
    UPDATE decks 
    SET lastQuizzedDate = ${escapeSQL(new Date().toISOString())},
        lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE deckID = ${deckID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated last quizzed for deck ID: ${deckID}`);
  } catch (error) {
    console.error('Error updating last quizzed:', error);
    throw error;
  }
};

// DELETE operations
export const deleteDeck = async (deckID: number): Promise<void> => {
  // First delete associated flashcards
  const deleteFlashcardsSql = `DELETE FROM flashcards WHERE deckID = ${deckID}`;
  const deleteDeckSql = `DELETE FROM decks WHERE deckID = ${deckID}`;
  
  try {
    await db.execAsync(deleteFlashcardsSql);
    await db.execAsync(deleteDeckSql);
    console.log(`Deleted deck ID: ${deckID} and its flashcards`);
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};

// Analytics and statistics
export const getDeckStats = async (): Promise<any> => {
  const sql = `
    SELECT 
      COUNT(*) as totalDecks,
      SUM(CASE WHEN deckType = 'study' THEN 1 ELSE 0 END) as studyDecks,
      SUM(CASE WHEN deckType = 'interview' THEN 1 ELSE 0 END) as interviewDecks,
      SUM(CASE WHEN isFavorited = 1 THEN 1 ELSE 0 END) as favoriteDecks,
      SUM(CASE WHEN folderID IS NULL THEN 1 ELSE 0 END) as uncategorizedDecks
    FROM decks
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result;
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    throw error;
  }
};

export const getRecentDecks = async (limit: number = 10): Promise<DeckWithFolder[]> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    ORDER BY d.lastModifiedDate DESC, d.dateAdded DESC
    LIMIT ${limit}
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error fetching recent decks:', error);
    throw error;
  }
};

export const getDecksByCompany = async (company: string): Promise<DeckWithFolder[]> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    WHERE d.interviewCompany = ${escapeSQL(company)}
    ORDER BY d.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error fetching decks by company:', error);
    throw error;
  }
};

export const getDecksByEducationLevel = async (educationLevel: string): Promise<DeckWithFolder[]> => {
  const sql = `
    SELECT d.*, f.folderName 
    FROM decks d 
    LEFT JOIN folders f ON d.folderID = f.folderID 
    WHERE d.studyEducationLevel = ${escapeSQL(educationLevel)}
    ORDER BY d.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as DeckWithFolder[];
  } catch (error) {
    console.error('Error fetching decks by education level:', error);
    throw error;
  }
}; 