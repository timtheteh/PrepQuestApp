import { db } from '../index';
import { getCurrentUserID } from './users';

export interface Folder {
  folderID: number;
  folderName: string;
  dateAdded: string;
  lastModifiedDate: string | null;
  isFavorited: number;
  deckCount: number;
}

export async function getFavoritedFolders(): Promise<Folder[]> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        f.folderID,
        f.folderName,
        f.dateAdded,
        f.lastModifiedDate,
        f.isFavorited,
        COUNT(d.deckID) as deckCount
      FROM folders f
      LEFT JOIN decks d ON (
        d.userID = f.userID AND 
        d.folderIDs IS NOT NULL AND 
        json_extract(d.folderIDs, '$') IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM json_each(d.folderIDs) 
          WHERE CAST(json_extract(value, '$') AS INTEGER) = f.folderID
        )
      )
      WHERE f.isFavorited = 1 AND f.userID = ?
      GROUP BY f.folderID
      ORDER BY f.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID]);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching favorited folders:', error);
    return [];
  }
}

export async function getAllFolders(): Promise<Folder[]> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        f.folderID,
        f.folderName,
        f.dateAdded,
        f.lastModifiedDate,
        f.isFavorited,
        COUNT(d.deckID) as deckCount
      FROM folders f
      LEFT JOIN decks d ON (
        d.userID = f.userID AND 
        d.folderIDs IS NOT NULL AND 
        json_extract(d.folderIDs, '$') IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM json_each(d.folderIDs) 
          WHERE CAST(json_extract(value, '$') AS INTEGER) = f.folderID
        )
      )
      WHERE f.userID = ?
      GROUP BY f.folderID
      ORDER BY f.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID]);
    return result as Folder[];
  } catch (error) {
    console.error('Error fetching all folders:', error);
    return [];
  }
}

export async function deleteFolder(folderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Get all decks in this folder
      const decksQuery = `
        SELECT deckID, folderIDs 
        FROM decks 
        WHERE userID = ? AND folderIDs IS NOT NULL
      `;
      
      const decks = await db.getAllAsync(decksQuery, [userID]) as Array<{ deckID: number; folderIDs: string | null }>;
      
      // Remove this folder from all decks
      for (const deck of decks) {
        if (deck.folderIDs) {
          try {
            const folderIds = JSON.parse(deck.folderIDs);
            if (Array.isArray(folderIds)) {
              const updatedFolderIds = folderIds.filter(id => id !== folderId);
              const updatedFolderIdsJson = JSON.stringify(updatedFolderIds);
              
              await db.runAsync(
                'UPDATE decks SET folderIDs = ?, lastModifiedDate = ? WHERE deckID = ? AND userID = ?',
                [updatedFolderIdsJson, new Date().toISOString(), deck.deckID, userID]
              );
            }
          } catch (error) {
            console.error('Error parsing folder IDs:', error);
          }
        }
      }
      
      // Delete the folder
      await db.runAsync(
        'DELETE FROM folders WHERE folderID = ? AND userID = ?',
        [folderId, userID]
      );
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
}

export async function deleteMultipleFolders(folderIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (folderIds.length === 0) return true;
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Get all decks that might be in these folders
      const decksQuery = `
        SELECT deckID, folderIDs 
        FROM decks 
        WHERE userID = ? AND folderIDs IS NOT NULL
      `;
      
      const decks = await db.getAllAsync(decksQuery, [userID]) as Array<{ deckID: number; folderIDs: string | null }>;
      
      // Remove these folders from all decks
      for (const deck of decks) {
        if (deck.folderIDs) {
          try {
            const folderIds = JSON.parse(deck.folderIDs);
            if (Array.isArray(folderIds)) {
              const updatedFolderIds = folderIds.filter(id => !folderIds.includes(id));
              const updatedFolderIdsJson = JSON.stringify(updatedFolderIds);
              
              await db.runAsync(
                'UPDATE decks SET folderIDs = ?, lastModifiedDate = ? WHERE deckID = ? AND userID = ?',
                [updatedFolderIdsJson, new Date().toISOString(), deck.deckID, userID]
              );
            }
          } catch (error) {
            console.error('Error parsing folder IDs:', error);
          }
        }
      }
      
      // Delete the folders
      const placeholders = folderIds.map(() => '?').join(',');
      await db.runAsync(
        `DELETE FROM folders WHERE folderID IN (${placeholders}) AND userID = ?`,
        [...folderIds, userID]
      );
      
      await db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting multiple folders:', error);
    return false;
  }
}

export async function checkFolderNameExists(folderName: string, excludeFolderId?: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    let query: string;
    let params: any[];
    
    if (excludeFolderId) {
      // Check if folder name exists, excluding the current folder being edited
      query = `
        SELECT COUNT(*) as count 
        FROM folders 
        WHERE folderName = ? AND folderID != ? AND userID = ?
      `;
      params = [folderName, excludeFolderId, userID];
    } else {
      // Check if folder name exists (for new folders)
      query = `
        SELECT COUNT(*) as count 
        FROM folders 
        WHERE folderName = ? AND userID = ?
      `;
      params = [folderName, userID];
    }
    
    const result = await db.getFirstAsync(query, params);
    const count = (result as { count: number }).count;
    
    return count > 0;
  } catch (error) {
    console.error('Error checking if folder name exists:', error);
    return false;
  }
}

export async function createNewFavoritedFolder(): Promise<{ success: boolean; newFolder?: Folder }> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    // Generate a unique folder name
    let folderName = 'New Folder';
    let counter = 1;
    
    while (await checkFolderNameExists(folderName)) {
      folderName = `New Folder ${counter}`;
      counter++;
    }
    
    const query = `
      INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited, userID)
      VALUES (?, ?, ?, 1, ?)
    `;
    
    const result = await db.runAsync(query, [folderName, currentDate, currentDate, userID]);
    
    if (result.lastInsertRowId) {
      const newFolderQuery = 'SELECT * FROM folders WHERE folderID = ? AND userID = ?';
      const newFolder = await db.getFirstAsync(newFolderQuery, [result.lastInsertRowId, userID]) as Folder;
      
      return {
        success: true,
        newFolder: {
          ...newFolder,
          deckCount: 0
        }
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error creating new favorited folder:', error);
    return { success: false };
  }
}

export async function unfavoriteMultipleFolders(folderIds: number[]): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    if (folderIds.length === 0) return true;
    
    const placeholders = folderIds.map(() => '?').join(',');
    const query = `UPDATE folders SET isFavorited = 0, lastModifiedDate = ? WHERE folderID IN (${placeholders}) AND userID = ?`;
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [currentDate, ...folderIds, userID]);
    return true;
  } catch (error) {
    console.error('Error unfavoriting multiple folders:', error);
    return false;
  }
}

export async function updateFolderFavoriteStatus(folderId: number, isFavorited: boolean): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'UPDATE folders SET isFavorited = ?, lastModifiedDate = ? WHERE folderID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [isFavorited ? 1 : 0, currentDate, folderId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating folder favorite status:', error);
    return false;
  }
}

export async function checkFoldersDatabaseReady(): Promise<{ isReady: boolean; foldersCount: number }> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync('SELECT COUNT(*) as count FROM folders WHERE userID = ?', [userID]) as Array<{ count: number }>;
    const foldersCount = result[0]?.count || 0;
    return { isReady: true, foldersCount };
  } catch (error) {
    console.error('Error checking folders database ready:', error);
    return { isReady: false, foldersCount: 0 };
  }
}

export async function createNewFolder(): Promise<{ success: boolean; newFolder?: Folder }> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    // Generate a unique folder name
    let folderName = 'New Folder';
    let counter = 1;
    
    while (await checkFolderNameExists(folderName)) {
      folderName = `New Folder ${counter}`;
      counter++;
    }
    
    const query = `
      INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited, userID)
      VALUES (?, ?, ?, 0, ?)
    `;
    
    const result = await db.runAsync(query, [folderName, currentDate, currentDate, userID]);
    
    if (result.lastInsertRowId) {
      const newFolderQuery = 'SELECT * FROM folders WHERE folderID = ? AND userID = ?';
      const newFolder = await db.getFirstAsync(newFolderQuery, [result.lastInsertRowId, userID]) as Folder;
      
      return {
        success: true,
        newFolder: {
          ...newFolder,
          deckCount: 0
        }
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error creating new folder:', error);
    return { success: false };
  }
}

export async function updateFolderLastModifiedDate(folderId: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'UPDATE folders SET lastModifiedDate = ? WHERE folderID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [currentDate, folderId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating folder last modified date:', error);
    return false;
  }
}

export async function getFolderById(folderId: number): Promise<{ folderName: string } | null> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT folderName FROM folders WHERE folderID = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [folderId, userID]) as { folderName: string } | null;
    return result;
  } catch (error) {
    console.error('Error getting folder by ID:', error);
    return null;
  }
}

export async function updateFolderName(folderId: number, newFolderName: string): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'UPDATE folders SET folderName = ?, lastModifiedDate = ? WHERE folderID = ? AND userID = ?';
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [newFolderName, currentDate, folderId, userID]);
    return true;
  } catch (error) {
    console.error('Error updating folder name:', error);
    return false;
  }
}
