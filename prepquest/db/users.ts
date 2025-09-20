import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import cached userID function from decks.ts to avoid duplication
import { getCurrentUserID } from './decks';

export interface UserStats {
  accumulatedDecksCreated: number;
  accumulatedFlashcardsCreated: number;
  accumulatedStudyDecksCreated: number;
  accumulatedInterviewDecksCreated: number;
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
        ?, ?, 0, 0, 0, 0, ?, 1, 1, 1, 1, 1, 120, 1, 20, 60, 45, 30, 15, 'English', 'Free', 0, 0, 0, 0
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
    
    // Optimized single query to get all statistics at once using indexes
    const statsResult = await db.getFirstAsync(`
      WITH deck_stats AS (
        SELECT 
          COUNT(*) as total_decks,
          SUM(CASE WHEN lastQuizzedDate IS NOT NULL THEN 1 ELSE 0 END) as quizzed_decks,
          SUM(CASE WHEN deckType = 'study' THEN 1 ELSE 0 END) as study_total,
          SUM(CASE WHEN deckType = 'study' AND lastQuizzedDate IS NOT NULL THEN 1 ELSE 0 END) as study_quizzed,
          SUM(CASE WHEN deckType = 'interview' THEN 1 ELSE 0 END) as interview_total,
          SUM(CASE WHEN deckType = 'interview' AND lastQuizzedDate IS NOT NULL THEN 1 ELSE 0 END) as interview_quizzed
        FROM (
          SELECT deckID, lastQuizzedDate, deckType FROM decks WHERE userID = ?
          UNION ALL
          SELECT deckID, lastQuizzedDate, deckType FROM AIDecks WHERE userID = ?
        )
      ),
      flashcard_stats AS (
        SELECT 
          COUNT(*) as total_flashcards,
          SUM(CASE WHEN lastQuizzedDate IS NOT NULL THEN 1 ELSE 0 END) as quizzed_flashcards
        FROM (
          SELECT flashcardID, lastQuizzedDate FROM flashcards WHERE userID = ?
          UNION ALL
          SELECT flashcardID, lastQuizzedDate FROM AIFlashcards WHERE userID = ?
        )
      )
      SELECT 
        ds.total_decks,
        ds.quizzed_decks,
        ds.study_total,
        ds.study_quizzed,
        ds.interview_total,
        ds.interview_quizzed,
        fs.total_flashcards,
        fs.quizzed_flashcards
      FROM deck_stats ds
      CROSS JOIN flashcard_stats fs
    `, [userID, userID, userID, userID]);

    const stats = statsResult as any;

    return {
      accumulatedDecks: userStats?.accumulatedDecksCreated || 0,
      localStorageDecks: stats?.total_decks || 0,
      totalQuizzedDecks: stats?.quizzed_decks || 0,
      accumulatedFlashcards: userStats?.accumulatedFlashcardsCreated || 0,
      localStorageFlashcards: stats?.total_flashcards || 0,
      totalQuizzedFlashcards: stats?.quizzed_flashcards || 0,
      studyDecks: userStats?.accumulatedStudyDecksCreated || 0,
      studyLocalStorage: stats?.study_total || 0,
      studyQuizzed: stats?.study_quizzed || 0,
      interviewDecks: userStats?.accumulatedInterviewDecksCreated || 0,
      interviewLocalStorage: stats?.interview_total || 0,
      interviewQuizzed: stats?.interview_quizzed || 0,
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
export async function fetchReviewData(): Promise<{ dayData: DayData[], monthData: MonthData[] }> {
  try {
    const userID = await getCurrentUserID();
    
    // Single optimized query with SQL aggregation - fixed to handle ISO date format
    const result = await db.getAllAsync(`
      WITH all_dates AS (
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'deck' as type
        FROM decks 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'deck' as type
        FROM decks 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'deck' as type
        FROM AIDecks 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'deck' as type
        FROM AIDecks 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'flashcard' as type
        FROM flashcards 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'flashcard' as type
        FROM flashcards 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'flashcard' as type
        FROM AIFlashcards 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'flashcard' as type
        FROM AIFlashcards 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
      )
      SELECT 
        activity_date,
        SUM(CASE WHEN type = 'deck' THEN 1 ELSE 0 END) as deck_count,
        SUM(CASE WHEN type = 'flashcard' THEN 1 ELSE 0 END) as flashcard_count
      FROM all_dates
      WHERE activity_date IS NOT NULL
      GROUP BY activity_date
      ORDER BY activity_date
    `, [userID, userID, userID, userID, userID, userID, userID, userID]);

    // Create maps for quick lookup
    const dateCountMap = new Map<string, { decks: number; flashcards: number }>();
    
    result.forEach((row: any) => {
      dateCountMap.set(row.activity_date, {
        decks: isNaN(row.deck_count) ? 0 : (row.deck_count || 0),
        flashcards: isNaN(row.flashcard_count) ? 0 : (row.flashcard_count || 0)
      });
    });

    // Pre-calculate today and date ranges
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    
    // Generate day data for the last 30 days
    const dayData: DayData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
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

    // Aggregate data by month using the existing dateCountMap
    for (const [dateKey, counts] of dateCountMap) {
      const date = new Date(dateKey);
      const monthKey = formatMonth(date);
      const current = monthCountMap.get(monthKey) || { flashcards: 0, decks: 0 };
      current.decks += counts.decks;
      current.flashcards += counts.flashcards;
      monthCountMap.set(monthKey, current);
    }

    // Generate month data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const monthKey = formatMonth(date);
      const monthCount = monthCountMap.get(monthKey) || { flashcards: 0, decks: 0 };
      
      monthData.push({
        month: monthKey,
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