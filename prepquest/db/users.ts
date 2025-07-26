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