import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserID } from './decks';
import { getLocalDateKey } from '@/utils/dateFormat';

export interface UserStats {
  accumulatedDecksCreated: number;
  accumulatedFlashcardsCreated: number;
  accumulatedStudyDecksCreated: number;
  accumulatedInterviewDecksCreated: number;
  accumulatedDecksQuizzed: number;
  accumulatedFlashcardsQuizzed: number;
  accumulatedStudyDecksQuizzed: number;
  accumulatedInterviewDecksQuizzed: number;
  lastUpdated: string;
}

// Get current user statistics
export async function getUserStatistics(): Promise<UserStats | null> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(`
      SELECT * FROM users WHERE userID = ?
    `, [userID]);
    
    return result as UserStats | null;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return null;
  }
}

// Fetch question type settings for the current user
export async function getUserQuestionSettings(): Promise<{
  isMcqEnabled: boolean,
  isClozeEnabled: boolean,
  isVoiceRecordedEnabled: boolean
}> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(
      `SELECT mcqQuestionsEnabled, clozeQuestionsEnabled, voiceRecordedQuestionsEnabled FROM users WHERE userID = ?`,
      [userID]
    ) as { mcqQuestionsEnabled?: number, clozeQuestionsEnabled?: number, voiceRecordedQuestionsEnabled?: number } | null;
    if (!result) throw new Error('User not found');
    return {
      isMcqEnabled: !!result.mcqQuestionsEnabled,
      isClozeEnabled: !!result.clozeQuestionsEnabled,
      isVoiceRecordedEnabled: !!result.voiceRecordedQuestionsEnabled,
    };
  } catch (error) {
    console.error('Error fetching user question settings:', error);
    // Default to all enabled if error
    return {
      isMcqEnabled: true,
      isClozeEnabled: true,
      isVoiceRecordedEnabled: true,
    };
  }
}

// Fetch user's voice recording language for speech-to-text
// NOTE: This is ONLY for speech-to-text language detection, NOT for app UI language
// The app UI language is managed separately by LanguageContext
export async function getUserVoiceLanguage(): Promise<string> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(
      `SELECT language FROM users WHERE userID = ?`,
      [userID]
    ) as { language?: string } | null;
    return result?.language || 'English';
  } catch (error) {
    console.error('Error fetching user voice language:', error);
    return 'English';
  }
}

// Get current subscription plan for the user
export async function getCurrentPlan(): Promise<string> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(
      `SELECT currentPlan FROM users WHERE userID = ?`,
      [userID]
    ) as { currentPlan?: string } | null;
    return result?.currentPlan || 'Free Plan';
  } catch (error) {
    console.error('Error fetching current plan:', error);
    return 'Free Plan';
  }
}

// Get request counts for the user
export interface RequestCounts {
  fileUploadRequests: number;
  genAIFormRequests: number;
  youtubeLinkRequests: number;
  chatWithAIRequests: number;
}

export async function getRequestCounts(): Promise<RequestCounts> {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getFirstAsync(
      `SELECT fileUploadRequests, genAIFormRequests, youtubeLinkRequests, chatWithAIRequests FROM users WHERE userID = ?`,
      [userID]
    ) as RequestCounts | null;
    return result || {
      fileUploadRequests: 0,
      genAIFormRequests: 0,
      youtubeLinkRequests: 0,
      chatWithAIRequests: 0,
    };
  } catch (error) {
    console.error('Error fetching request counts:', error);
    return {
      fileUploadRequests: 0,
      genAIFormRequests: 0,
      youtubeLinkRequests: 0,
      chatWithAIRequests: 0,
    };
  }
}

// Update user's voice recording language for speech-to-text
// NOTE: This is ONLY for speech-to-text language detection, NOT for app UI language
// The app UI language is managed separately by LanguageContext
export async function updateUserVoiceLanguage(language: string): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.runAsync(
      `UPDATE users SET language = ? WHERE userID = ?`,
      [language, userID]
    );
    return true;
  } catch (error) {
    console.error('Error updating user voice language:', error);
    return false;
  }
}

// Increment genAIFormRequests by the number of flashcards created
export async function incrementGenAIFormRequests(flashcardCount: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.runAsync(
      `UPDATE users SET genAIFormRequests = genAIFormRequests + ? WHERE userID = ?`,
      [flashcardCount, userID]
    );
    console.log(`Incremented genAIFormRequests by ${flashcardCount} for user ${userID}`);
    return true;
  } catch (error) {
    console.error('Error incrementing genAIFormRequests:', error);
    return false;
  }
}

// Increment fileUploadRequests by the number of flashcards created
export async function incrementFileUploadRequests(flashcardCount: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.runAsync(
      `UPDATE users SET fileUploadRequests = fileUploadRequests + ? WHERE userID = ?`,
      [flashcardCount, userID]
    );
    console.log(`Incremented fileUploadRequests by ${flashcardCount} for user ${userID}`);
    return true;
  } catch (error) {
    console.error('Error incrementing fileUploadRequests:', error);
    return false;
  }
}

// Increment youtubeLinkRequests by the number of flashcards created
export async function incrementYoutubeLinkRequests(flashcardCount: number): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.runAsync(
      `UPDATE users SET youtubeLinkRequests = youtubeLinkRequests + ? WHERE userID = ?`,
      [flashcardCount, userID]
    );
    console.log(`Incremented youtubeLinkRequests by ${flashcardCount} for user ${userID}`);
    return true;
  } catch (error) {
    console.error('Error incrementing youtubeLinkRequests:', error);
    return false;
  }
}

// Increment chatWithAIRequests by 1 for each successful AI chat request
export async function incrementChatWithAIRequests(): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    await db.runAsync(
      `UPDATE users SET chatWithAIRequests = chatWithAIRequests + 1 WHERE userID = ?`,
      [userID]
    );
    console.log(`Incremented chatWithAIRequests for user ${userID}`);
    return true;
  } catch (error) {
    console.error('Error incrementing chatWithAIRequests:', error);
    return false;
  }
}

// Increment quiz counters after a quiz session completes
// This should be called when a deck is quizzed (not studied)
export async function incrementQuizCounters(
  deckId: number,
  isAIDeck: boolean,
  deckType: 'study' | 'interview',
  flashcardCount: number,
  isFirstTimeQuizzingDeck: boolean
): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    
    // Start a transaction to ensure atomic updates
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Always increment total flashcards quizzed
      await db.runAsync(
        `UPDATE users SET accumulatedFlashcardsQuizzed = accumulatedFlashcardsQuizzed + ? WHERE userID = ?`,
        [flashcardCount, userID]
      );
      
      // Increment total decks quizzed only if this is the first time quizzing this deck
      if (isFirstTimeQuizzingDeck) {
        await db.runAsync(
          `UPDATE users SET accumulatedDecksQuizzed = accumulatedDecksQuizzed + 1 WHERE userID = ?`,
          [userID]
        );
        
        // Increment study or interview deck counter based on deck type
        if (deckType === 'study') {
          await db.runAsync(
            `UPDATE users SET accumulatedStudyDecksQuizzed = accumulatedStudyDecksQuizzed + 1 WHERE userID = ?`,
            [userID]
          );
        } else if (deckType === 'interview') {
          await db.runAsync(
            `UPDATE users SET accumulatedInterviewDecksQuizzed = accumulatedInterviewDecksQuizzed + 1 WHERE userID = ?`,
            [userID]
          );
        }
      }
      
      await db.execAsync('COMMIT');
      console.log(`✅ Incremented quiz counters: deck=${isFirstTimeQuizzingDeck ? 1 : 0}, flashcards=${flashcardCount}, type=${deckType}`);
      return true;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error incrementing quiz counters:', error);
    return false;
  }
} 

// Create a new user in the database
export async function createUser(userID: string): Promise<boolean> {
  try {
    
    // First check if user already exists
    const existingUser = await db.getFirstAsync(`
      SELECT userID FROM users WHERE userID = ?
    `, [userID]);
    
    if (existingUser) {
      return true;
    }
    
    const currentDate = new Date().toISOString();
    
    // Insert new user with default values
    await db.runAsync(`
      INSERT INTO users (
        userID, 
        dateJoined, 
        accumulatedDecksCreated, 
        accumulatedFlashcardsCreated, 
        accumulatedStudyDecksCreated, 
        accumulatedInterviewDecksCreated, 
        accumulatedDecksQuizzed, 
        accumulatedFlashcardsQuizzed, 
        accumulatedStudyDecksQuizzed, 
        accumulatedInterviewDecksQuizzed, 
        lastUpdated, 
        notificationsEnabled, 
        autoDecksEnabled, 
        clozeQuestionsEnabled, 
        mcqQuestionsEnabled, 
        voiceRecordedQuestionsEnabled, 
        voiceRecordedTimer, 
        halfwayCheckpoint, 
        defaultTimer, 
        againTimer, 
        hardTimer, 
        goodTimer, 
        easyTimer, 
        language, 
        currentPlan, 
        fileUploadRequests, 
        genAIFormRequests, 
        youtubeLinkRequests, 
        chatWithAIRequests
      ) VALUES (
        ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?, 1, 1, 1, 1, 1, 120, 1, 20, 60, 45, 30, 15, 'English', 'Free', 0, 0, 0, 0
      )
    `, [userID, currentDate, currentDate]);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating user in database:', error);
    return false;
  }
}

export interface StatsData {
  accumulatedDecks: number;
  localStorageDecks: number;
  totalQuizzedDecks: number;
  accumulatedFlashcards: number;
  localStorageFlashcards: number;
  totalQuizzedFlashcards: number;
  studyDecks: number;
  studyLocalStorage: number;
  studyQuizzed: number;
  interviewDecks: number;
  interviewLocalStorage: number;
  interviewQuizzed: number;
}

// Function to fetch real statistics from database
export async function fetchStatsData(): Promise<StatsData> {
  try {
    const userID = await getCurrentUserID();
    
    // Get accumulated statistics from userStatistics table (lifetime counters that never decrease)
    const userStats = await getUserStatistics();
    
    // Get current decks in local storage
    const localStorageDecksResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM (
        SELECT deckID FROM decks WHERE userID = ?
        UNION ALL
        SELECT deckID FROM AIDecks WHERE userID = ?
      )
    `, [userID, userID]);
    
    // Get current flashcards in local storage
    const localStorageFlashcardsResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM (
        SELECT flashcardID FROM flashcards WHERE userID = ?
        UNION ALL
        SELECT flashcardID FROM AIFlashcards WHERE userID = ?
      )
    `, [userID, userID]);
    
    // Get study deck statistics (local storage count)
    const studyStatsResult = await db.getFirstAsync(`
      SELECT COUNT(*) as total
      FROM (
        SELECT deckID FROM decks WHERE deckType = 'study' AND userID = ?
        UNION ALL
        SELECT deckID FROM AIDecks WHERE deckType = 'study' AND userID = ?
      )
    `, [userID, userID]);
    
    // Get interview deck statistics (local storage count)
    const interviewStatsResult = await db.getFirstAsync(`
      SELECT COUNT(*) as total
      FROM (
        SELECT deckID FROM decks WHERE deckType = 'interview' AND userID = ?
        UNION ALL
        SELECT deckID FROM AIDecks WHERE deckType = 'interview' AND userID = ?
      )
    `, [userID, userID]);

    return {
      accumulatedDecks: userStats?.accumulatedDecksCreated || 0,
      localStorageDecks: (localStorageDecksResult as any)?.count || 0,
      totalQuizzedDecks: userStats?.accumulatedDecksQuizzed || 0,
      accumulatedFlashcards: userStats?.accumulatedFlashcardsCreated || 0,
      localStorageFlashcards: (localStorageFlashcardsResult as any)?.count || 0,
      totalQuizzedFlashcards: userStats?.accumulatedFlashcardsQuizzed || 0,
      studyDecks: userStats?.accumulatedStudyDecksCreated || 0,
      studyLocalStorage: (studyStatsResult as any)?.total || 0,
      studyQuizzed: userStats?.accumulatedStudyDecksQuizzed || 0,
      interviewDecks: userStats?.accumulatedInterviewDecksCreated || 0,
      interviewLocalStorage: (interviewStatsResult as any)?.total || 0,
      interviewQuizzed: userStats?.accumulatedInterviewDecksQuizzed || 0,
    };
  } catch (error) {
    console.error('Error fetching stats data:', error);
    return {
      accumulatedDecks: 0,
      localStorageDecks: 0,
      totalQuizzedDecks: 0,
      accumulatedFlashcards: 0,
      localStorageFlashcards: 0,
      totalQuizzedFlashcards: 0,
      studyDecks: 0,
      studyLocalStorage: 0,
      studyQuizzed: 0,
      interviewDecks: 0,
      interviewLocalStorage: 0,
      interviewQuizzed: 0,
    };
  }
} 

// Interface for the review data structure
export interface DayData {
  day: string;
  date: string;
  flashcards: number;
  decks: number;
}

export interface MonthData {
  month: string;
  flashcards: number;
  decks: number;
}

// Function to get day name from date
const getDayName = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Function to format date as "DD MMM YYYY"
const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Function to format month as "MMM YYYY"
const formatMonth = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

// Function to fetch real review data from database
const parseLocalDateKey = (key: string): Date => {
  const [yearStr, monthStr, dayStr] = key.split('-');
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
};

export async function fetchReviewData(): Promise<{ dayData: DayData[], monthData: MonthData[] }> {
  try {
    const userID = await getCurrentUserID();

    const addEvent = (
      isoString: string | null | undefined,
      type: 'deck' | 'flashcard',
      map: Map<string, { decks: number; flashcards: number }>
    ) => {
      if (!isoString) return;
      const key = getLocalDateKey(isoString);
      if (!key) return;
      const current = map.get(key) || { decks: 0, flashcards: 0 };
      if (type === 'deck') {
        current.decks += 1;
      } else {
        current.flashcards += 1;
      }
      map.set(key, current);
    };

    const dateCountMap = new Map<string, { decks: number; flashcards: number }>();

    const deckRows = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM decks
      WHERE userID = ?
    `, [userID]);

    deckRows.forEach((row: any) => {
      addEvent(row.lastStudiedDate, 'deck', dateCountMap);
      addEvent(row.lastQuizzedDate, 'deck', dateCountMap);
    });

    const aiDeckRows = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM AIDecks
      WHERE userID = ?
    `, [userID]);

    aiDeckRows.forEach((row: any) => {
      addEvent(row.lastStudiedDate, 'deck', dateCountMap);
      addEvent(row.lastQuizzedDate, 'deck', dateCountMap);
    });

    const flashcardRows = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM flashcards
      WHERE userID = ?
    `, [userID]);

    flashcardRows.forEach((row: any) => {
      addEvent(row.lastStudiedDate, 'flashcard', dateCountMap);
      addEvent(row.lastQuizzedDate, 'flashcard', dateCountMap);
    });

    const aiFlashcardRows = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM AIFlashcards
      WHERE userID = ?
    `, [userID]);

    aiFlashcardRows.forEach((row: any) => {
      addEvent(row.lastStudiedDate, 'flashcard', dateCountMap);
      addEvent(row.lastQuizzedDate, 'flashcard', dateCountMap);
    });

    // Pre-calculate today and date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate day data for the last 30 days
    const dayData: DayData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = getLocalDateKey(date);
      const counts = dateCountMap.get(dateKey) || { decks: 0, flashcards: 0 };
      
      dayData.push({
        day: getDayName(date),
        date: formatDate(date),
        flashcards: isNaN(counts.flashcards) ? 0 : counts.flashcards,
        decks: isNaN(counts.decks) ? 0 : counts.decks,
      });
    }

    // Generate month data for the last 12 months
    const monthData: MonthData[] = [];
    const monthCountMap = new Map<string, { flashcards: number; decks: number }>();

    const getMonthKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    for (const [dateKey, counts] of dateCountMap) {
      const date = parseLocalDateKey(dateKey);
      const monthKey = getMonthKey(date);
      const current = monthCountMap.get(monthKey) || { flashcards: 0, decks: 0 };
      current.decks += counts.decks;
      current.flashcards += counts.flashcards;
      monthCountMap.set(monthKey, current);
    }

    // Generate month data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(1);
      date.setMonth(today.getMonth() - i);
      const monthKey = getMonthKey(date);
      const monthLabel = formatMonth(date);
      const monthCount = monthCountMap.get(monthKey) || { flashcards: 0, decks: 0 };
      
      monthData.push({
        month: monthLabel,
        flashcards: isNaN(monthCount.flashcards) ? 0 : monthCount.flashcards,
        decks: isNaN(monthCount.decks) ? 0 : monthCount.decks,
      });
    }

    return { dayData, monthData };
  } catch (error) {
    console.error('Error fetching review data:', error);
    // Return empty data if there's an error
    return { dayData: [], monthData: [] };
  }
} 
