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

export async function getDeckProgress(deckId: number): Promise<number> {
  try {
    // First, check if the deck itself has lastStudiedDate or lastQuizzedDate
    const deckResult = await db.getFirstAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM decks
      WHERE deckID = ?
    `, [deckId]);

    if (!deckResult) {
      return 0;
    }

    const deck = deckResult as { lastStudiedDate: string | null; lastQuizzedDate: string | null };
    
    // If either lastStudiedDate or lastQuizzedDate is not null, return 100%
    if (deck.lastStudiedDate !== null || deck.lastQuizzedDate !== null) {
      return 100;
    }

    // If both are null, calculate percentage based on flashcards
    const progressResult = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as totalFlashcards,
        COUNT(CASE WHEN lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL THEN 1 END) as completedFlashcards
      FROM flashcards
      WHERE deckID = ?
    `, [deckId]);

    if (!progressResult) {
      return 0;
    }

    const progress = progressResult as { totalFlashcards: number; completedFlashcards: number };
    
    if (progress.totalFlashcards === 0) {
      return 0;
    }

    return Math.round((progress.completedFlashcards / progress.totalFlashcards) * 100);
  } catch (error) {
    console.error('Error calculating deck progress:', error);
    return 0;
  }
}

export async function getStudyDecksWithProgress(): Promise<(Deck & { progress: number })[]> {
  try {
    const decks = await getStudyDecks();
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        const progress = await getDeckProgress(deck.deckID);
        return { ...deck, progress };
      })
    );
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching study decks with progress:', error);
    return [];
  }
}

export async function getInterviewDecksWithProgress(): Promise<(Deck & { progress: number })[]> {
  try {
    const decks = await getInterviewDecks();
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        const progress = await getDeckProgress(deck.deckID);
        return { ...deck, progress };
      })
    );
    return decksWithProgress;
  } catch (error) {
    console.error('Error fetching interview decks with progress:', error);
    return [];
  }
}