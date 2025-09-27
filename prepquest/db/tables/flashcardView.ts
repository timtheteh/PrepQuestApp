import { db } from '../index';
import { getCurrentUserID } from './users';

export const updateDeckCompletionDate = async (
  isStudyMode: boolean, 
  deckId: string, 
  isAIDeck: string
): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    let query: string;
    if (isAIDeck === 'true') {
      if (isStudyMode) {
        query = 'UPDATE AIDecks SET lastStudiedDate = ? WHERE deckID = ? AND userID = ?';
      } else {
        query = 'UPDATE AIDecks SET lastQuizzedDate = ? WHERE deckID = ? AND userID = ?';
      }
    } else {
      if (isStudyMode) {
        query = 'UPDATE decks SET lastStudiedDate = ? WHERE deckID = ? AND userID = ?';
      } else {
        query = 'UPDATE decks SET lastQuizzedDate = ? WHERE deckID = ? AND userID = ?';
      }
    }
    
    await db.runAsync(query, [currentDate, deckId, userID]);
  } catch (error) {
    console.error('Error updating deck completion date:', error);
  }
};

export const updateDeckLastModifiedAfterFlashcardDeletion = async (deckId: string, isAIDeck: string): Promise<void> => {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    let query: string;
    if (isAIDeck === 'true') {
      query = 'UPDATE AIDecks SET lastModifiedDate = ? WHERE deckID = ? AND userID = ?';
    } else {
      query = 'UPDATE decks SET lastModifiedDate = ? WHERE deckID = ? AND userID = ?';
    }
    
    await db.runAsync(query, [currentDate, deckId, userID]);
  } catch (error) {
    console.error('Error updating deck last modified after flashcard deletion:', error);
  }
};
