import { db } from '../index';
import { getCurrentUserID } from './users';

export async function createDeckWithGenAIFlashcards({
  deckName,
  mode,
  formFields,
  flashcards,
  isFavorited = 0,
  folderIDs = null,
}: {
  deckName: string;
  mode: 'study' | 'interview';
  formFields: {
    studyEducationLevel?: string;
    studySubjects?: string;
    studyTopics?: string;
    studySubtopics?: string;
    studyExam?: string;
    interviewJobRole?: string;
    interviewType?: string;
    interviewCompany?: string;
    interviewExperienceLevel?: string;
    interviewTopics?: string;
    numberOfQuestions?: number;
    kindsOfQuestions?: string;
  };
  flashcards: Array<{ flashcardType: string; question: string; answer: any }>;
  isFavorited?: number;
  folderIDs?: string | null;
}): Promise<{ success: boolean; deckId?: number }> {
  try {
    const userID = await getCurrentUserID();
    const currentDate = new Date().toISOString();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Insert deck
      const insertDeckQuery = `
        INSERT INTO decks (
          deckName, dateAdded, lastModifiedDate, isFavorited, deckType, 
          creationMethod, lastStudiedDate, lastQuizzedDate, cardDesignIndex, 
          isAIDeck, folderIDs, studyEducationLevel, studySubjects, 
          studyTopicsSubtopics, studyExamQuiz, interviewJobRole, 
          interviewType, interviewCompany, interviewExperienceLevel, 
          interviewTopics, interviewCompanyIcon, userID
        ) VALUES (?, ?, ?, ?, 'genai', NULL, NULL, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const deckResult = await db.runAsync(insertDeckQuery, [
        deckName,
        currentDate,
        currentDate,
        isFavorited,
        mode,
        folderIDs,
        formFields.studyEducationLevel || null,
        formFields.studySubjects || null,
        formFields.studyTopics || null,
        formFields.studySubtopics || null,
        formFields.studyExam || null,
        formFields.interviewJobRole || null,
        formFields.interviewType || null,
        formFields.interviewCompany || null,
        formFields.interviewExperienceLevel || null,
        formFields.interviewTopics || null,
        null, // interviewCompanyIcon
        userID
      ]);
      
      const deckId = deckResult.lastInsertRowId;
      
      if (!deckId) {
        throw new Error('Failed to insert deck');
      }
      
      // Insert flashcards
      for (const flashcard of flashcards) {
        const insertFlashcardQuery = `
          INSERT INTO flashcards (
            deckID, difficultyRating, cognitiveQnType, isFavorited, 
            questionType, questionText, questionBlob, answerType, 
            answerText, answerMCQ, answerBlob, timeTaken, 
            isMcqAnswerRight, lastStudiedDate, lastQuizzedDate, userID
          ) VALUES (?, 'Good', 'General', 0, ?, ?, NULL, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?)
        `;
        
        await db.runAsync(insertFlashcardQuery, [
          deckId,
          flashcard.flashcardType,
          flashcard.question,
          flashcard.flashcardType,
          flashcard.answer,
          userID
        ]);
      }
      
      // Update user stats
      await db.runAsync(
        'UPDATE users SET totalDecksCreated = totalDecksCreated + 1 WHERE userID = ?',
        [userID]
      );
      
      // Update deck count
      await db.runAsync(
        'UPDATE decks SET flashcardCount = ? WHERE deckID = ? AND userID = ?',
        [flashcards.length, deckId, userID]
      );
      
      await db.execAsync('COMMIT');
      
      return { success: true, deckId };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating deck with GenAI flashcards:', error);
    return { success: false };
  }
}

export async function createGenAIFlashcardsForDeck({
  deckId,
  flashcards
}: {
  deckId: number;
  flashcards: Array<{ flashcardType: string; question: string; answer: any }>;
}): Promise<{ success: boolean; flashcardCount?: number; flashcardIds?: number[] }> {
  try {
    const userID = await getCurrentUserID();
    const flashcardIds: number[] = [];
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const flashcard of flashcards) {
        const insertQuery = `
          INSERT INTO flashcards (
            deckID, difficultyRating, cognitiveQnType, isFavorited, 
            questionType, questionText, questionBlob, answerType, 
            answerText, answerMCQ, answerBlob, timeTaken, 
            isMcqAnswerRight, lastStudiedDate, lastQuizzedDate, userID
          ) VALUES (?, 'Good', 'General', 0, ?, ?, NULL, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?)
        `;
        
        const result = await db.runAsync(insertQuery, [
          deckId,
          flashcard.flashcardType,
          flashcard.question,
          flashcard.flashcardType,
          flashcard.answer,
          userID
        ]);
        
        if (result.lastInsertRowId) {
          flashcardIds.push(result.lastInsertRowId);
        }
      }
      
      // Update user stats
      await db.runAsync(
        'UPDATE users SET totalFlashcardsCreated = totalFlashcardsCreated + ? WHERE userID = ?',
        [flashcardIds.length, userID]
      );
      
      // Update deck count
      await db.runAsync(
        'UPDATE decks SET flashcardCount = flashcardCount + ? WHERE deckID = ? AND userID = ?',
        [flashcardIds.length, deckId, userID]
      );
      
      await db.execAsync('COMMIT');
      
      return { success: true, flashcardCount: flashcardIds.length, flashcardIds };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating GenAI flashcards for deck:', error);
    return { success: false };
  }
}
