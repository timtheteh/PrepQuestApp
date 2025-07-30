import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    // console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

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
    console.log('🔍 Creating new user in database:', userID);
    
    // First check if user already exists
    const existingUser = await db.getFirstAsync(`
      SELECT userID FROM users WHERE userID = ?
    `, [userID]);
    
    if (existingUser) {
      console.log('✅ User already exists in database:', userID);
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
    
    console.log('✅ User created successfully in database');
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
    
    // Get total decks quizzed (have lastQuizzedDate)
    const quizzedDecksResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM (
        SELECT deckID FROM decks WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT deckID FROM AIDecks WHERE lastQuizzedDate IS NOT NULL AND userID = ?
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
    
    // Get total flashcards quizzed
    const quizzedFlashcardsResult = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM (
        SELECT flashcardID FROM flashcards WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT flashcardID FROM AIFlashcards WHERE lastQuizzedDate IS NOT NULL AND userID = ?
      )
    `, [userID, userID]);
    
    // Get study deck statistics
    const studyStatsResult = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN lastQuizzedDate IS NOT NULL THEN 1 ELSE 0 END) as quizzed
      FROM (
        SELECT deckID, lastQuizzedDate FROM decks WHERE deckType = 'study' AND userID = ?
        UNION ALL
        SELECT deckID, lastQuizzedDate FROM AIDecks WHERE deckType = 'study' AND userID = ?
      )
    `, [userID, userID]);
    
    // Get interview deck statistics
    const interviewStatsResult = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN lastQuizzedDate IS NOT NULL THEN 1 ELSE 0 END) as quizzed
      FROM (
        SELECT deckID, lastQuizzedDate FROM decks WHERE deckType = 'interview' AND userID = ?
        UNION ALL
        SELECT deckID, lastQuizzedDate FROM AIDecks WHERE deckType = 'interview' AND userID = ?
      )
    `, [userID, userID]);

    return {
      accumulatedDecks: userStats?.accumulatedDecksCreated || 0,
      localStorageDecks: (localStorageDecksResult as any)?.count || 0,
      totalQuizzedDecks: (quizzedDecksResult as any)?.count || 0,
      accumulatedFlashcards: userStats?.accumulatedFlashcardsCreated || 0,
      localStorageFlashcards: (localStorageFlashcardsResult as any)?.count || 0,
      totalQuizzedFlashcards: (quizzedFlashcardsResult as any)?.count || 0,
      studyDecks: userStats?.accumulatedStudyDecksCreated || 0,
      studyLocalStorage: (studyStatsResult as any)?.total || 0,
      studyQuizzed: (studyStatsResult as any)?.quizzed || 0,
      interviewDecks: userStats?.accumulatedInterviewDecksCreated || 0,
      interviewLocalStorage: (interviewStatsResult as any)?.total || 0,
      interviewQuizzed: (interviewStatsResult as any)?.quizzed || 0,
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