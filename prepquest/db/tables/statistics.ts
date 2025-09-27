import { db } from '../index';
import { getCurrentUserID } from './users';

export interface BreakdownDatum {
  label: string;
  value: number;
  percent: number;
  color: string;
}

// Defensive helper: check if a table exists in the current SQLite database
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    );
    return result !== null;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

export async function getBreakdownData(): Promise<{ decksData: BreakdownDatum[], flashcardsData: BreakdownDatum[] }> {
  try {
    const userID = await getCurrentUserID();
    
    // Check if AIDecks table exists
    const hasAIDecks = await tableExists('AIDecks');
    
    let decksQuery: string;
    let flashcardsQuery: string;
    
    if (hasAIDecks) {
      decksQuery = `
        WITH deck_categories AS (
          SELECT 
            CASE 
              WHEN d.deckType = 'study' THEN 'Study Decks'
              WHEN d.deckType = 'interview' THEN 'Interview Decks'
              ELSE 'Other'
            END as category,
            COUNT(*) as count
          FROM decks d
          WHERE d.userID = ?
          GROUP BY d.deckType
          
          UNION ALL
          
          SELECT 
            'AI Decks' as category,
            COUNT(*) as count
          FROM AIDecks d
          WHERE d.userID = ?
        ),
        category_counts AS (
          SELECT category, SUM(count) as total_count
          FROM deck_categories
          GROUP BY category
        )
        SELECT 
          cc.category as label,
          cc.total_count as value,
          ROUND((cc.total_count * 100.0) / (SELECT SUM(total_count) FROM category_counts), 1) as percent
        FROM category_counts cc
        ORDER BY cc.total_count DESC
      `;
      
      flashcardsQuery = `
        WITH flashcard_counts AS (
          SELECT 
            'Regular Flashcards' as category,
            COUNT(*) as count
          FROM flashcards f
          WHERE f.userID = ?
          
          UNION ALL
          
          SELECT 
            'AI Flashcards' as category,
            COUNT(*) as count
          FROM AIFlashcards f
          WHERE f.userID = ?
        )
        SELECT 
          fc.category as label,
          fc.count as value,
          ROUND((fc.count * 100.0) / (SELECT SUM(count) FROM flashcard_counts), 1) as percent
        FROM flashcard_counts fc
        ORDER BY fc.count DESC
      `;
    } else {
      decksQuery = `
        SELECT 
          CASE 
            WHEN deckType = 'study' THEN 'Study Decks'
            WHEN deckType = 'interview' THEN 'Interview Decks'
            ELSE 'Other'
          END as label,
          COUNT(*) as value,
          ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM decks WHERE userID = ?), 1) as percent
        FROM decks 
        WHERE userID = ?
        GROUP BY deckType
        ORDER BY value DESC
      `;
      
      flashcardsQuery = `
        SELECT 
          'Regular Flashcards' as label,
          COUNT(*) as value,
          100.0 as percent
        FROM flashcards 
        WHERE userID = ?
      `;
    }
    
    const decksResult = await db.getAllAsync(decksQuery, hasAIDecks ? [userID, userID] : [userID, userID]);
    const flashcardsResult = await db.getAllAsync(flashcardsQuery, hasAIDecks ? [userID, userID] : [userID]);
    
    // Define colors for different categories
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const decksData: BreakdownDatum[] = (decksResult as Array<{ label: string; value: number; percent: number }>).map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));
    
    const flashcardsData: BreakdownDatum[] = (flashcardsResult as Array<{ label: string; value: number; percent: number }>).map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));
    
    return { decksData, flashcardsData };
  } catch (error) {
    console.error('Error getting breakdown data:', error);
    return { decksData: [], flashcardsData: [] };
  }
}
