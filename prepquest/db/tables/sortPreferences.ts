import { db } from '../index';
import { getCurrentUserID } from './users';

// Sort preferences functions
export async function saveSortPreferences(field: 'name' | 'dateAdded' | 'lastModified', direction: 'asc' | 'desc'): Promise<void> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      INSERT OR REPLACE INTO sortPreferences (userID, sortField, sortDirection) 
      VALUES (?, ?, ?)
    `;
    
    await db.runAsync(query, [userID, field, direction]);
  } catch (error) {
    console.error('Error saving sort preferences:', error);
  }
}

export async function loadSortPreferences(): Promise<{ field: 'name' | 'dateAdded' | 'lastModified'; direction: 'asc' | 'desc' } | null> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT sortField, sortDirection FROM sortPreferences WHERE userID = ?';
    const result = await db.getFirstAsync(query, [userID]) as { sortField: string; sortDirection: string } | null;
    
    if (!result) return null;
    
    return {
      field: result.sortField as 'name' | 'dateAdded' | 'lastModified',
      direction: result.sortDirection as 'asc' | 'desc'
    };
  } catch (error) {
    console.error('Error loading sort preferences:', error);
    return null;
  }
}
