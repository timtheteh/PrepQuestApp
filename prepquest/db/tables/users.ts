import { db } from '../index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get current userID from AsyncStorage
export async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    if (!userID) {
      throw new Error('User ID not found in AsyncStorage');
    }
    return userID;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    throw error;
  }
}

export interface DeckSettings {
  autoDecksEnabled: boolean;
  clozeQuestionsEnabled: boolean;
  mcqQuestionsEnabled: boolean;
  voiceRecordedAnswersEnabled: boolean;
  voiceRecordedTimerEnabled: boolean;
  voiceRecordedTimer: { min: number; sec: number };
  halfwayCheckpointEnabled: boolean;
  difficultyTimes: Array<{ min: number; sec: number }>;
}

export interface DeckSettingsData {
  autoDecksEnabled: number;
  clozeQuestionsEnabled: number;
  mcqQuestionsEnabled: number;
  voiceRecordedQuestionsEnabled: number;
  voiceRecordedTimer: number;
  halfwayCheckpoint: number;
  defaultTimer: number;
  againTimer: number;
  hardTimer: number;
  goodTimer: number;
  easyTimer: number;
}

// Helper function to convert seconds to time format
function convertSecondsToTime(seconds: number): { min: number; sec: number } {
  return {
    min: Math.floor(seconds / 60),
    sec: seconds % 60
  };
}

// Helper function to convert time format to seconds
function convertTimeToSeconds(time: { min: number; sec: number }): number {
  return time.min * 60 + time.sec;
}

export async function loadDeckSettings(): Promise<DeckSettings> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT 
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
        easyTimer
      FROM users 
      WHERE userID = ?
    `;
    
    const result = await db.getFirstAsync(query, [userID]) as DeckSettingsData | null;
    
    if (!result) {
      // Return default settings if user not found
      return {
        autoDecksEnabled: true,
        clozeQuestionsEnabled: true,
        mcqQuestionsEnabled: true,
        voiceRecordedAnswersEnabled: true,
        voiceRecordedTimerEnabled: true,
        voiceRecordedTimer: { min: 2, sec: 0 },
        halfwayCheckpointEnabled: true,
        difficultyTimes: [
          { min: 0, sec: 30 }, // Again
          { min: 1, sec: 0 },  // Hard
          { min: 2, sec: 0 },  // Good
          { min: 5, sec: 0 }   // Easy
        ]
      };
    }
    
    return {
      autoDecksEnabled: result.autoDecksEnabled === 1,
      clozeQuestionsEnabled: result.clozeQuestionsEnabled === 1,
      mcqQuestionsEnabled: result.mcqQuestionsEnabled === 1,
      voiceRecordedAnswersEnabled: result.voiceRecordedQuestionsEnabled === 1,
      voiceRecordedTimerEnabled: result.voiceRecordedTimer > 0,
      voiceRecordedTimer: convertSecondsToTime(result.voiceRecordedTimer),
      halfwayCheckpointEnabled: result.halfwayCheckpoint === 1,
      difficultyTimes: [
        convertSecondsToTime(result.againTimer),
        convertSecondsToTime(result.hardTimer),
        convertSecondsToTime(result.goodTimer),
        convertSecondsToTime(result.easyTimer)
      ]
    };
  } catch (error) {
    console.error('Error loading deck settings:', error);
    // Return default settings on error
    return {
      autoDecksEnabled: true,
      clozeQuestionsEnabled: true,
      mcqQuestionsEnabled: true,
      voiceRecordedAnswersEnabled: true,
      voiceRecordedTimerEnabled: true,
      voiceRecordedTimer: { min: 2, sec: 0 },
      halfwayCheckpointEnabled: true,
      difficultyTimes: [
        { min: 0, sec: 30 }, // Again
        { min: 1, sec: 0 },  // Hard
        { min: 2, sec: 0 },  // Good
        { min: 5, sec: 0 }   // Easy
      ]
    };
  }
}

export async function saveDeckSettings(settings: DeckSettings): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      UPDATE users SET 
        autoDecksEnabled = ?,
        clozeQuestionsEnabled = ?,
        mcqQuestionsEnabled = ?,
        voiceRecordedQuestionsEnabled = ?,
        voiceRecordedTimer = ?,
        halfwayCheckpoint = ?,
        defaultTimer = ?,
        againTimer = ?,
        hardTimer = ?,
        goodTimer = ?,
        easyTimer = ?
      WHERE userID = ?
    `;
    
    const params = [
      settings.autoDecksEnabled ? 1 : 0,
      settings.clozeQuestionsEnabled ? 1 : 0,
      settings.mcqQuestionsEnabled ? 1 : 0,
      settings.voiceRecordedAnswersEnabled ? 1 : 0,
      convertTimeToSeconds(settings.voiceRecordedTimer),
      settings.halfwayCheckpointEnabled ? 1 : 0,
      convertTimeToSeconds(settings.difficultyTimes[2]), // Good as default
      convertTimeToSeconds(settings.difficultyTimes[0]), // Again
      convertTimeToSeconds(settings.difficultyTimes[1]), // Hard
      convertTimeToSeconds(settings.difficultyTimes[2]), // Good
      convertTimeToSeconds(settings.difficultyTimes[3]), // Easy
      userID
    ];
    
    await db.runAsync(query, params);
    return true;
  } catch (error) {
    console.error('Error saving deck settings:', error);
    return false;
  }
}

export async function resetDeckSettingsToDefaults(): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      UPDATE users SET 
        autoDecksEnabled = 1,
        clozeQuestionsEnabled = 1,
        mcqQuestionsEnabled = 1,
        voiceRecordedQuestionsEnabled = 1,
        voiceRecordedTimer = 120,
        halfwayCheckpoint = 1,
        defaultTimer = 120,
        againTimer = 30,
        hardTimer = 60,
        goodTimer = 120,
        easyTimer = 300
      WHERE userID = ?
    `;
    
    await db.runAsync(query, [userID]);
    return true;
  } catch (error) {
    console.error('Error resetting deck settings to defaults:', error);
    return false;
  }
}

export async function loadHalfwayCheckpointSetting(): Promise<boolean> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT halfwayCheckpoint FROM users WHERE userID = ?';
    const result = await db.getFirstAsync(query, [userID]) as { halfwayCheckpoint: number } | null;
    return result?.halfwayCheckpoint === 1;
  } catch (error) {
    console.error('Error loading halfway checkpoint setting:', error);
    return true; // Default to enabled
  }
}
