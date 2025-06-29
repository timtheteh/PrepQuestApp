import { db } from './index';

// Types for folder operations
export interface Folder {
  folderID?: number;
  folderName: string;
  dateAdded: string;
  lastModifiedDate?: string;
  isFavorited: number;
}

export interface FolderWithDeckCount extends Folder {
  deckCount?: number;
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
export const createFolder = async (folder: Folder): Promise<number> => {
  const sql = `
    INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited)
    VALUES (
      ${escapeSQL(folder.folderName)}, ${escapeSQL(folder.dateAdded)}, 
      ${escapeSQL(folder.lastModifiedDate)}, ${escapeSQL(folder.isFavorited)}
    )
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Created folder: ${folder.folderName}`);
    return 1; // Placeholder - implement proper ID retrieval if needed
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// READ operations
export const getAllFolders = async (): Promise<Folder[]> => {
  const sql = `
    SELECT * FROM folders 
    ORDER BY dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching all folders:', error);
    throw error;
  }
};

export const getFolderById = async (folderID: number): Promise<Folder | null> => {
  const sql = `
    SELECT * FROM folders 
    WHERE folderID = ${folderID}
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result as Folder | null;
  } catch (error) {
    console.error('Error fetching folder by ID:', error);
    throw error;
  }
};

export const getFolderByName = async (folderName: string): Promise<Folder | null> => {
  const sql = `
    SELECT * FROM folders 
    WHERE folderName = ${escapeSQL(folderName)}
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result as Folder | null;
  } catch (error) {
    console.error('Error fetching folder by name:', error);
    throw error;
  }
};

export const getFavoriteFolders = async (): Promise<Folder[]> => {
  const sql = `
    SELECT * FROM folders 
    WHERE isFavorited = 1
    ORDER BY dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching favorite folders:', error);
    throw error;
  }
};

export const searchFolders = async (searchTerm: string): Promise<Folder[]> => {
  const sql = `
    SELECT * FROM folders 
    WHERE folderName LIKE ${escapeSQL(`%${searchTerm}%`)}
    ORDER BY dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error searching folders:', error);
    throw error;
  }
};

export const getRecentFolders = async (limit: number = 10): Promise<Folder[]> => {
  const sql = `
    SELECT * FROM folders 
    ORDER BY lastModifiedDate DESC, dateAdded DESC
    LIMIT ${limit}
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching recent folders:', error);
    throw error;
  }
};

export const getFoldersWithDeckCount = async (): Promise<FolderWithDeckCount[]> => {
  const sql = `
    SELECT f.*, COUNT(d.deckID) as deckCount
    FROM folders f 
    LEFT JOIN decks d ON f.folderID = d.folderID 
    GROUP BY f.folderID
    ORDER BY f.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FolderWithDeckCount[];
  } catch (error) {
    console.error('Error fetching folders with deck count:', error);
    throw error;
  }
};

export const getEmptyFolders = async (): Promise<Folder[]> => {
  const sql = `
    SELECT f.* 
    FROM folders f 
    LEFT JOIN decks d ON f.folderID = d.folderID 
    WHERE d.deckID IS NULL
    ORDER BY f.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching empty folders:', error);
    throw error;
  }
};

export const getFoldersByDateRange = async (startDate: string, endDate: string): Promise<Folder[]> => {
  const sql = `
    SELECT * FROM folders 
    WHERE dateAdded BETWEEN ${escapeSQL(startDate)} AND ${escapeSQL(endDate)}
    ORDER BY dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching folders by date range:', error);
    throw error;
  }
};

// UPDATE operations
export const updateFolder = async (folderID: number, updates: Partial<Folder>): Promise<void> => {
  const updateFields: string[] = [];
  const values: any[] = [];
  
  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'folderID') { // Don't update the primary key
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  const sql = `
    UPDATE folders 
    SET ${updateFields.join(', ')}, lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE folderID = ${folderID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated folder ID: ${folderID}`);
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

export const updateFolderName = async (folderID: number, newName: string): Promise<void> => {
  const sql = `
    UPDATE folders 
    SET folderName = ${escapeSQL(newName)}, lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE folderID = ${folderID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated folder name for ID: ${folderID}`);
  } catch (error) {
    console.error('Error updating folder name:', error);
    throw error;
  }
};

export const toggleFolderFavorite = async (folderID: number): Promise<void> => {
  const sql = `
    UPDATE folders 
    SET isFavorited = CASE WHEN isFavorited = 1 THEN 0 ELSE 1 END,
        lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE folderID = ${folderID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Toggled favorite for folder ID: ${folderID}`);
  } catch (error) {
    console.error('Error toggling folder favorite:', error);
    throw error;
  }
};

export const moveDeckToFolder = async (deckID: number, folderID: number): Promise<void> => {
  const sql = `
    UPDATE decks 
    SET folderID = ${folderID}, lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE deckID = ${deckID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Moved deck ${deckID} to folder ${folderID}`);
  } catch (error) {
    console.error('Error moving deck to folder:', error);
    throw error;
  }
};

export const removeDeckFromFolder = async (deckID: number): Promise<void> => {
  const sql = `
    UPDATE decks 
    SET folderID = NULL, lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE deckID = ${deckID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Removed deck ${deckID} from folder`);
  } catch (error) {
    console.error('Error removing deck from folder:', error);
    throw error;
  }
};

// DELETE operations
export const deleteFolder = async (folderID: number): Promise<void> => {
  // First remove all decks from this folder (set folderID to NULL)
  const updateDecksSql = `
    UPDATE decks 
    SET folderID = NULL, lastModifiedDate = ${escapeSQL(new Date().toISOString())}
    WHERE folderID = ${folderID}
  `;
  
  const deleteFolderSql = `DELETE FROM folders WHERE folderID = ${folderID}`;
  
  try {
    await db.execAsync(updateDecksSql);
    await db.execAsync(deleteFolderSql);
    console.log(`Deleted folder ID: ${folderID} and removed all decks from it`);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

export const deleteFolderAndDecks = async (folderID: number): Promise<void> => {
  // First delete all decks in this folder (and their flashcards)
  const deleteFlashcardsSql = `
    DELETE FROM flashcards 
    WHERE deckID IN (SELECT deckID FROM decks WHERE folderID = ${folderID})
  `;
  
  const deleteDecksSql = `DELETE FROM decks WHERE folderID = ${folderID}`;
  const deleteFolderSql = `DELETE FROM folders WHERE folderID = ${folderID}`;
  
  try {
    await db.execAsync(deleteFlashcardsSql);
    await db.execAsync(deleteDecksSql);
    await db.execAsync(deleteFolderSql);
    console.log(`Deleted folder ID: ${folderID} and all its decks and flashcards`);
  } catch (error) {
    console.error('Error deleting folder and decks:', error);
    throw error;
  }
};

// Analytics and statistics
export const getFolderStats = async (): Promise<any> => {
  const sql = `
    SELECT 
      COUNT(*) as totalFolders,
      SUM(CASE WHEN isFavorited = 1 THEN 1 ELSE 0 END) as favoriteFolders,
      SUM(CASE WHEN d.deckID IS NULL THEN 1 ELSE 0 END) as emptyFolders,
      AVG(deckCount) as avgDecksPerFolder,
      MAX(deckCount) as maxDecksInFolder
    FROM folders f
    LEFT JOIN (
      SELECT folderID, COUNT(*) as deckCount 
      FROM decks 
      GROUP BY folderID
    ) d ON f.folderID = d.folderID
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result;
  } catch (error) {
    console.error('Error fetching folder stats:', error);
    throw error;
  }
};

export const getFolderUsageStats = async (): Promise<any[]> => {
  const sql = `
    SELECT 
      f.folderName,
      f.folderID,
      COUNT(d.deckID) as deckCount,
      SUM(CASE WHEN d.deckType = 'study' THEN 1 ELSE 0 END) as studyDecks,
      SUM(CASE WHEN d.deckType = 'interview' THEN 1 ELSE 0 END) as interviewDecks,
      f.isFavorited,
      f.dateAdded,
      f.lastModifiedDate
    FROM folders f 
    LEFT JOIN decks d ON f.folderID = d.folderID 
    GROUP BY f.folderID
    ORDER BY deckCount DESC, f.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as any[];
  } catch (error) {
    console.error('Error fetching folder usage stats:', error);
    throw error;
  }
};

export const getMostUsedFolders = async (limit: number = 5): Promise<FolderWithDeckCount[]> => {
  const sql = `
    SELECT f.*, COUNT(d.deckID) as deckCount
    FROM folders f 
    LEFT JOIN decks d ON f.folderID = d.folderID 
    GROUP BY f.folderID
    ORDER BY deckCount DESC, f.dateAdded DESC
    LIMIT ${limit}
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FolderWithDeckCount[];
  } catch (error) {
    console.error('Error fetching most used folders:', error);
    throw error;
  }
};

export const getFoldersByDeckType = async (deckType: 'study' | 'interview'): Promise<FolderWithDeckCount[]> => {
  const sql = `
    SELECT f.*, COUNT(d.deckID) as deckCount
    FROM folders f 
    LEFT JOIN decks d ON f.folderID = d.folderID AND d.deckType = ${escapeSQL(deckType)}
    GROUP BY f.folderID
    HAVING deckCount > 0
    ORDER BY deckCount DESC, f.dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as FolderWithDeckCount[];
  } catch (error) {
    console.error('Error fetching folders by deck type:', error);
    throw error;
  }
};

export const getFoldersCreatedInPeriod = async (days: number): Promise<Folder[]> => {
  const sql = `
    SELECT * FROM folders 
    WHERE dateAdded >= datetime('now', '-${days} days')
    ORDER BY dateAdded DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching folders created in period:', error);
    throw error;
  }
}; 