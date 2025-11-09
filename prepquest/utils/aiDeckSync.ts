import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';
import { getCurrentUserID } from '@/db/decks';
import { createAuthenticatedSupabaseClient } from '@/supabase/supabase';

type GetTokenFn = () => Promise<string | null>;

const FETCHED_FLAG_KEY_PREFIX = 'fetchedAIDecksThisWeek';
const LAST_RESET_KEY_PREFIX = 'fetchedAIDecksLastReset';

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface SupabaseAIDeck {
  deckID: number;
  userID: string;
  deckName: string;
  dateAdded?: string | null;
  lastModifiedDate?: string | null;
  isFavorited?: number | boolean | null;
  deckType: string;
  creationMethod: string;
  lastStudiedDate?: string | null;
  lastQuizzedDate?: string | null;
  cardDesignIndex?: number | null;
  isAIDeck?: number | boolean | null;
  folderIDs?: string | null;
  studyEducationLevel?: string | null;
  studySubjects?: string | null;
  studyTopicsSubtopics?: string | null;
  studyExamQuiz?: string | null;
  interviewJobRole?: string | null;
  interviewType?: string | null;
  interviewCompany?: string | null;
  interviewExperienceLevel?: string | null;
  interviewTopics?: string | null;
  interviewCompanyIcon?: string | null;
}

interface SupabaseAIFlashcard {
  flashcardID: number;
  userID: string;
  deckID: number;
  difficultyRating?: string | null;
  cognitiveQnType?: string | null;
  isFavorited?: number | boolean | null;
  questionType?: string | null;
  questionText?: string | null;
  questionBlob?: Uint8Array | null;
  answerType?: string | null;
  answerText?: string | null;
  answerMCQ?: string | null;
  answerBlob?: Uint8Array | null;
  timeTaken?: number | null;
  isMcqAnswerRight?: number | boolean | null;
  lastStudiedDate?: string | null;
  lastQuizzedDate?: string | null;
}

async function maybeResetWeeklyFlag(userID: string) {
  const today = new Date();
  const todayString = getLocalDateString(today);
  if (today.getDay() !== 2) {
    return;
  }

  const lastResetKey = `${LAST_RESET_KEY_PREFIX}_${userID}`;
  const fetchedFlagKey = `${FETCHED_FLAG_KEY_PREFIX}_${userID}`;

  try {
    const lastResetDate = await AsyncStorage.getItem(lastResetKey);
    if (lastResetDate !== todayString) {
      await AsyncStorage.multiSet([
        [fetchedFlagKey, 'false'],
        [lastResetKey, todayString],
      ]);
      console.log('🔄 Reset fetchedAIDecksThisWeek flag for user on Tuesday', { userID, todayString });
    }
  } catch (error) {
    console.error('Error resetting weekly AI decks flag:', error);
  }
}

async function replaceLocalAIDecks(
  userID: string,
  decks: SupabaseAIDeck[],
  flashcards: SupabaseAIFlashcard[]
) {
  await db.runAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync('DELETE FROM AIFlashcards WHERE userID = ?', [userID]);
    await db.runAsync('DELETE FROM AIDecks WHERE userID = ?', [userID]);

    for (const deck of decks) {
      await db.runAsync(
        `
          INSERT OR REPLACE INTO AIDecks (
            deckID, userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
            lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
            studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
            interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          deck.deckID,
          deck.userID,
          deck.deckName,
          deck.dateAdded ?? null,
          deck.lastModifiedDate ?? null,
          deck.isFavorited ? 1 : 0,
          deck.deckType,
          deck.creationMethod,
          deck.lastStudiedDate ?? null,
          deck.lastQuizzedDate ?? null,
          deck.cardDesignIndex ?? 0,
          deck.isAIDeck !== undefined ? (deck.isAIDeck ? 1 : 0) : 1,
          deck.folderIDs ?? null,
          deck.studyEducationLevel ?? null,
          deck.studySubjects ?? null,
          deck.studyTopicsSubtopics ?? null,
          deck.studyExamQuiz ?? null,
          deck.interviewJobRole ?? null,
          deck.interviewType ?? null,
          deck.interviewCompany ?? null,
          deck.interviewExperienceLevel ?? null,
          deck.interviewTopics ?? null,
          deck.interviewCompanyIcon ?? null,
        ]
      );
    }

    for (const flashcard of flashcards) {
      await db.runAsync(
        `
          INSERT OR REPLACE INTO AIFlashcards (
            flashcardID, userID, deckID, difficultyRating, cognitiveQnType, isFavorited,
            questionType, questionText, questionBlob, answerType, answerText, answerMCQ,
            answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          flashcard.flashcardID,
          flashcard.userID,
          flashcard.deckID,
          flashcard.difficultyRating ?? 'None',
          flashcard.cognitiveQnType ?? 'Recall',
          flashcard.isFavorited ? 1 : 0,
          flashcard.questionType ?? 'text',
          flashcard.questionText ?? null,
          flashcard.questionBlob ?? null,
          flashcard.answerType ?? 'text',
          flashcard.answerText ?? null,
          flashcard.answerMCQ ?? null,
          flashcard.answerBlob ?? null,
          flashcard.timeTaken ?? null,
          flashcard.isMcqAnswerRight ? 1 : 0,
          flashcard.lastStudiedDate ?? null,
          flashcard.lastQuizzedDate ?? null,
        ]
      );
    }

    await db.runAsync('COMMIT');
  } catch (error) {
    await db.runAsync('ROLLBACK');
    throw error;
  }
}

export async function syncAIDecksFromSupabaseIfNeeded(getToken: GetTokenFn) {
  try {
    const userID = await getCurrentUserID();
    if (!userID) {
      console.log('⚠️ No user ID found while attempting AI deck sync');
      return;
    }

    const userRow = await db.getFirstAsync<{ autoDecksEnabled?: number }>(
      'SELECT autoDecksEnabled FROM users WHERE userID = ?',
      [userID]
    );

    if (!userRow || userRow.autoDecksEnabled !== 1) {
      console.log('ℹ️ Auto decks disabled for user - skipping AI deck sync');
      return;
    }

    await maybeResetWeeklyFlag(userID);

    const fetchedFlagKey = `${FETCHED_FLAG_KEY_PREFIX}_${userID}`;
    let fetchedFlag = await AsyncStorage.getItem(fetchedFlagKey);

    if (fetchedFlag === null) {
      await AsyncStorage.setItem(fetchedFlagKey, 'false');
      fetchedFlag = 'false';
    }

    if (fetchedFlag === 'true') {
      console.log('ℹ️ AI decks already fetched this week - skipping sync');
      return;
    }

    const token = await getToken();
    if (!token) {
      console.warn('⚠️ Unable to obtain authentication token for AI deck sync');
      return;
    }

    const supabaseClient = await createAuthenticatedSupabaseClient(token);

    const { data: deckData, error: deckError } = await supabaseClient
      .from('AIDecks')
      .select('*')
      .eq('userID', userID);

    if (deckError) {
      throw deckError;
    }

    const { data: flashcardData, error: flashcardError } = await supabaseClient
      .from('AIFlashcards')
      .select('*')
      .eq('userID', userID);

    if (flashcardError) {
      throw flashcardError;
    }

    const decks = (deckData ?? []) as SupabaseAIDeck[];
    const flashcards = (flashcardData ?? []) as SupabaseAIFlashcard[];

    await replaceLocalAIDecks(userID, decks, flashcards);

    await AsyncStorage.setItem(fetchedFlagKey, 'true');
    console.log('✅ Synced AI decks and flashcards from Supabase for user', { userID, deckCount: decks.length, flashcardCount: flashcards.length });
  } catch (error) {
    console.error('Error syncing AI decks from Supabase:', error);
  }
}

