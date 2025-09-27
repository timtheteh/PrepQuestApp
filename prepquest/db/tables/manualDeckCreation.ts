import { db } from '../index';
import { getCurrentUserID } from './users';

// Helper function to convert URI to blob
async function uriToBlob(uri: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error converting URI to blob:', error);
    return null;
  }
}

export async function createManualDeck(formData: {
  deckName: string;
  mode: 'study' | 'interview';
  studyMandatoryQuestion1?: string;
  studyMandatoryQuestion2?: string;
  studyMandatoryQuestion3?: string;
  interviewMandatoryQuestion1?: string;
  interviewMandatoryQuestion2?: string;
  interviewMandatoryQuestion3?: string;
  interviewType?: string;
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
        ) VALUES (?, ?, ?, 0, ?, 'manual', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL, NULL, ?)
      `;
      
      const deckResult = await db.runAsync(insertDeckQuery, [
        formData.deckName,
        currentDate,
        currentDate,
        formData.mode,
        formData.interviewType || null,
        userID
      ]);
      
      const deckId = deckResult.lastInsertRowId;
      
      if (!deckId) {
        throw new Error('Failed to insert deck');
      }
      
      // Create flashcards based on mode
      const flashcards = [];
      
      if (formData.mode === 'study') {
        if (formData.studyMandatoryQuestion1) {
          flashcards.push({
            question: formData.studyMandatoryQuestion1,
            answer: '',
            questionType: 'text',
            answerType: 'text'
          });
        }
        if (formData.studyMandatoryQuestion2) {
          flashcards.push({
            question: formData.studyMandatoryQuestion2,
            answer: '',
            questionType: 'text',
            answerType: 'text'
          });
        }
        if (formData.studyMandatoryQuestion3) {
          flashcards.push({
            question: formData.studyMandatoryQuestion3,
            answer: '',
            questionType: 'text',
            answerType: 'text'
          });
        }
      } else {
        if (formData.interviewMandatoryQuestion1) {
          flashcards.push({
            question: formData.interviewMandatoryQuestion1,
            answer: '',
            questionType: 'text',
            answerType: 'text'
          });
        }
        if (formData.interviewMandatoryQuestion2) {
          flashcards.push({
            question: formData.interviewMandatoryQuestion2,
            answer: '',
            questionType: 'text',
            answerType: 'text'
          });
        }
        if (formData.interviewMandatoryQuestion3) {
          flashcards.push({
            question: formData.interviewMandatoryQuestion3,
            answer: '',
            questionType: 'text',
            answerType: 'text'
          });
        }
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
          flashcard.questionType,
          flashcard.question,
          flashcard.answerType,
          flashcard.answer,
          userID
        ]);
      }
      
      // Save form entry
      const insertFormEntryQuery = `
        INSERT INTO userFormEntries (
          deckName, formEntryType, formEntryMethod, formSubmissionDate,
          numberOfQuestions, kindsOfQuestions, studyEducationLevel, studySubjects,
          studyTopics, studySubtopics, studyExam, interviewJobRole, interviewType,
          interviewCompany, interviewExperienceLevel, interviewTopics, userID
        ) VALUES (?, 'manual', 'manual', ?, ?, 'text', NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL, ?)
      `;
      
      await db.runAsync(insertFormEntryQuery, [
        formData.deckName,
        currentDate,
        flashcards.length,
        formData.interviewType || null,
        userID
      ]);
      
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
    console.error('Error creating manual deck:', error);
    return { success: false };
  }
}

// Helper function to extract text from React content
function extractTextFromContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content.map(extractTextFromContent).join(' ');
  }
  
  if (content && typeof content === 'object') {
    if (content.props && content.props.children) {
      return extractTextFromContent(content.props.children);
    }
    
    if (content.children) {
      return extractTextFromContent(content.children);
    }
    
    if (content.text) {
      return content.text;
    }
  }
  
  return '';
}

export async function createFlashcardsFromCache(deckId: number, cardCache: any[]): Promise<{ success: boolean; flashcardCount?: number; flashcardIds?: number[] }> {
  try {
    const userID = await getCurrentUserID();
    const flashcardIds: number[] = [];
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const card of cardCache) {
        let questionText = '';
        let questionBlob: Uint8Array | null = null;
        let answerText = '';
        let answerBlob: Uint8Array | null = null;
        let answerMCQ: string | null = null;
        
        // Process question
        if (card.questionType === 'text') {
          questionText = extractTextFromContent(card.question);
        } else if (card.questionType === 'image' && card.question) {
          if (typeof card.question === 'string' && card.question.startsWith('file://')) {
            questionBlob = await uriToBlob(card.question);
          } else if (card.question.uri) {
            questionBlob = await uriToBlob(card.question.uri);
          }
        } else if (card.questionType === 'audio' && card.question) {
          if (typeof card.question === 'string' && card.question.startsWith('file://')) {
            questionBlob = await uriToBlob(card.question);
          } else if (card.question.uri) {
            questionBlob = await uriToBlob(card.question.uri);
          }
        }
        
        // Process answer
        if (card.answerType === 'text') {
          answerText = extractTextFromContent(card.answer);
        } else if (card.answerType === 'mcq' && Array.isArray(card.answer)) {
          answerMCQ = JSON.stringify(card.answer);
        } else if (card.answerType === 'image' && card.answer) {
          if (typeof card.answer === 'string' && card.answer.startsWith('file://')) {
            answerBlob = await uriToBlob(card.answer);
          } else if (card.answer.uri) {
            answerBlob = await uriToBlob(card.answer.uri);
          }
        } else if (card.answerType === 'audio' && card.answer) {
          if (typeof card.answer === 'string' && card.answer.startsWith('file://')) {
            answerBlob = await uriToBlob(card.answer);
          } else if (card.answer.uri) {
            answerBlob = await uriToBlob(card.answer.uri);
          }
        }
        
        const insertQuery = `
          INSERT INTO flashcards (
            deckID, difficultyRating, cognitiveQnType, isFavorited, 
            questionType, questionText, questionBlob, answerType, 
            answerText, answerMCQ, answerBlob, timeTaken, 
            isMcqAnswerRight, lastStudiedDate, lastQuizzedDate, userID
          ) VALUES (?, 'Good', 'General', 0, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?)
        `;
        
        const result = await db.runAsync(insertQuery, [
          deckId,
          card.questionType,
          questionText,
          questionBlob,
          card.answerType,
          answerText,
          answerMCQ,
          answerBlob,
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
    console.error('Error creating flashcards from cache:', error);
    return { success: false };
  }
}
