import { db } from './index';

export interface Deck {
  deckID: number;
  deckName: string;
  dateAdded: string;
  lastModifiedDate: string | null;
  isFavorited: number;
  deckType: 'study' | 'interview';
  creationMethod: string;
  lastStudiedDate: string | null;
  lastQuizzedDate: string | null;
  cardDesignIndex: number;
  isAIDeck: number;
  folderIDs: string | null;
  studyEducationLevel: string | null;
  studySubjects: string | null;
  studyTopicsSubtopics: string | null;
  studyExamQuiz: string | null;
  interviewJobRole: string | null;
  interviewType: string | null;
  interviewCompany: string | null;
  interviewExperienceLevel: string | null;
  interviewTopics: string | null;
  interviewCompanyIcon: string | null;
  flashcardCount: number;
}

export async function getStudyDecks(): Promise<Deck[]> {
  try {
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckType = 'study'
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching study decks:', error);
    return [];
  }
}

export async function getInterviewDecks(): Promise<Deck[]> {
  try {
    const result = await db.getAllAsync(`
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
        CASE 
          WHEN d.interviewCompanyIcon IS NOT NULL 
          THEN hex(d.interviewCompanyIcon) 
          ELSE NULL 
        END as interviewCompanyIcon,
        COUNT(f.flashcardID) as flashcardCount
      FROM decks d
      LEFT JOIN flashcards f ON d.deckID = f.deckID
      WHERE d.deckType = 'interview'
      GROUP BY d.deckID
      ORDER BY d.dateAdded DESC
    `);
    
    console.log('Raw interview decks result:', result);
    console.log('First interview deck:', result[0]);
    
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching interview decks:', error);
    return [];
  }
}

// Alternative queries without flashcards table (if you don't need flashcard counts):
/*
export async function getStudyDecks(): Promise<Deck[]> {
  try {
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        0 as flashcardCount
      FROM decks d
      WHERE d.deckType = 'study'
      ORDER BY d.dateAdded DESC
    `);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching study decks:', error);
    return [];
  }
}

export async function getInterviewDecks(): Promise<Deck[]> {
  try {
    const result = await db.getAllAsync(`
      SELECT 
        d.*,
        0 as flashcardCount
      FROM decks d
      WHERE d.deckType = 'interview'
      ORDER BY d.dateAdded DESC
    `);
    return result as Deck[];
  } catch (error) {
    console.error('Error fetching interview decks:', error);
    return [];
  }
}
*/ 