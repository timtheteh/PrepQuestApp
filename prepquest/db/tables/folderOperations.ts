import { db } from '../index';
import { getCurrentUserID } from './users';

export async function getDecksInFolder(folderId: number): Promise<any[]> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
        d.deckID,
        d.deckName,
        d.dateAdded,
        d.lastModifiedDate,
        d.isFavorited,
        d.deckType,
        d.creationMethod,
        d.lastStudiedDate,
        d.lastQuizzedDate,
        d.cardDesignIndex,
        d.isAIDeck,
        d.folderIDs,
        d.studyEducationLevel,
        d.studySubjects,
        d.studyTopicsSubtopics,
        d.studyExamQuiz,
        d.interviewJobRole,
        d.interviewType,
        d.interviewCompany,
        d.interviewExperienceLevel,
        d.interviewTopics,
        d.interviewCompanyIcon,
        d.AICardDesignIndex,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID AND f.userID = d.userID
      WHERE d.userID = ? AND d.folderIDs IS NOT NULL AND 
        EXISTS (
          SELECT 1 FROM json_each(d.folderIDs) 
          WHERE CAST(json_extract(value, '$') AS INTEGER) = ?
        )
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `;
    
    const result = await db.getAllAsync(query, [userID, folderId]);
    return result as any[];
  } catch (error) {
    console.error('Error fetching decks in folder:', error);
    return [];
  }
}
