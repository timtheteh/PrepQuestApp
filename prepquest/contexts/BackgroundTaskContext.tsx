import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';

// Progress key for background tasks
const BG_TASK_PROGRESS_KEY = 'genAIDeckCreationBgTaskProgress';

interface BackgroundTaskContextType {
  isBackgroundTaskRunning: boolean;
  backgroundTaskProgress: any | null;
  startBackgroundTaskMonitoring: () => void;
  stopBackgroundTaskMonitoring: () => void;
  clearBackgroundTaskProgress: () => Promise<void>;
  forceStopBackgroundTask: () => void;
  resetForceStoppedFlag: () => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType | undefined>(undefined);

export const useBackgroundTask = () => {
  const context = useContext(BackgroundTaskContext);
  if (!context) {
    throw new Error('useBackgroundTask must be used within a BackgroundTaskProvider');
  }
  return context;
};

interface BackgroundTaskProviderProps {
  children: React.ReactNode;
}

export const BackgroundTaskProvider: React.FC<BackgroundTaskProviderProps> = ({ children }) => {
  const [isBackgroundTaskRunning, setIsBackgroundTaskRunning] = useState(false);
  const [backgroundTaskProgress, setBackgroundTaskProgress] = useState<any | null>(null);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  
  // Use a ref to track the current state for immediate access
  const isBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track the last progress data to prevent duplicate updates
  const lastProgressRef = useRef<string | null>(null);
  
  // Update ref whenever state changes
  React.useEffect(() => {
    isBackgroundTaskRunningRef.current = isBackgroundTaskRunning;
  }, [isBackgroundTaskRunning]);

  // Helper to load progress from AsyncStorage
  const loadBackgroundTaskProgress = async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(BG_TASK_PROGRESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load background task progress', e);
      return null;
    }
  };

  // Helper to clear progress
  const clearBackgroundTaskProgress = async () => {
    try {
      // Set clearing flag to prevent notifications during clearing
      isClearingProgressRef.current = true;
      
      // Mark task as completed before clearing
      const currentProgress = await loadBackgroundTaskProgress();
      if (currentProgress && currentProgress.inProgress && !currentProgress.completed) {
        await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify({
          ...currentProgress,
          inProgress: false,
          completed: true
        }));
      }
      
      await AsyncStorage.removeItem(BG_TASK_PROGRESS_KEY);
      setBackgroundTaskProgress(null);
      setIsBackgroundTaskRunning(false);
      
      // Reset clearing flag after a short delay
      setTimeout(() => {
        isClearingProgressRef.current = false;
      }, 1000);
      
      // Reset last progress ref to allow future updates
      lastProgressRef.current = null;
    } catch (e) {
      console.error('Failed to clear background task progress', e);
      // Reset clearing flag on error
      isClearingProgressRef.current = false;
    }
  };

  // Helper to force stop background task immediately
  const forceStopBackgroundTask = React.useCallback(() => {
    console.log('Force stopping background task...');
    console.log('Before force stop - isBackgroundTaskRunning:', isBackgroundTaskRunningRef.current);
    
    // Set force stopped flag
    forceStoppedRef.current = true;
    
    // Stop monitoring completely to prevent interference
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Update ref immediately
    isBackgroundTaskRunningRef.current = false;
    
    // Force immediate state update
    setIsBackgroundTaskRunning(false);
    setBackgroundTaskProgress(null);
    
    console.log('After force stop - isBackgroundTaskRunning should be false');
  }, []);

  // Helper to reset force stopped flag
  const resetForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Helper to send completion notification
  const sendCompletionNotification = React.useCallback(async (progress: any) => {
    try {
      const { formData, createdDeckId, createdFlashcardIds, flashcards } = progress;
      
      if (!formData?.deckName) return;

      const deckName = formData.deckName;
      const flashcardCount = flashcards?.length || createdFlashcardIds?.length || 0;
      
      // Check if we're adding flashcards to existing deck or creating new deck
      if (progress.isInViewFlashcardsPage && createdFlashcardIds?.length > 0) {
        // Adding flashcards to existing deck
        await notificationService.sendFlashcardsCreatedNotification(
          flashcardCount,
          deckName,
          createdDeckId || 0,
          language
        );
      } else if (createdDeckId) {
        // Creating new deck with flashcards
        if (flashcardCount > 0) {
          await notificationService.sendDeckAndFlashcardsCreatedNotification(
            deckName,
            createdDeckId,
            flashcardCount,
            language
          );
        } else {
          await notificationService.sendDeckCreatedNotification(
            deckName,
            createdDeckId,
            language
          );
        }
      }
    } catch (error) {
      console.error('Error sending completion notification:', error);
    }
  }, [language, notificationService]);

  // Start monitoring background task progress
  const startBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Starting background task monitoring...');
    console.log('Current monitoring interval:', monitoringIntervalRef.current);
    
    // Stop any existing monitoring to prevent multiple intervals
    if (monitoringIntervalRef.current) {
      console.log('Stopping existing monitoring interval before starting new one');
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Reset force stopped flag when starting monitoring
    forceStoppedRef.current = false;
    
    const checkProgress = async () => {
      try {
        const progress = await loadBackgroundTaskProgress();
        
        if (progress) {
          console.log('BackgroundTaskContext - Progress update:', {
            inProgress: progress.inProgress,
            completed: progress.completed,
            status: progress.status,
            hasError: !!progress.error,
            timestamp: progress.timestamp,
            deckName: progress.formData?.deckName || progress.deckName
          });
          
          // Clear stale progress data that might be causing issues
          // If we have progress data that's marked as in progress but not completed and no error,
          // and it's been more than a reasonable time, clear it
          if (progress.inProgress && !progress.completed && !progress.error) {
            const now = Date.now();
            const progressTime = progress.timestamp || 0;
            const timeDiff = now - progressTime;
            
            // If the progress is older than 5 minutes, consider it stale
            if (timeDiff > 5 * 60 * 1000) {
              console.log('Clearing stale background task progress data (older than 5 minutes)');
              await clearBackgroundTaskProgress();
              return;
            }
          }
          
          // Create a unique identifier for this progress data
          const progressId = JSON.stringify({
            completed: progress.completed,
            error: progress.error,
            status: progress.status,
            timestamp: progress.timestamp,
            deckId: progress.createdDeckId,
            flashcardIds: progress.createdFlashcardIds
          });
          
          // Only update progress if it's different from the last one
          if (lastProgressRef.current !== progressId) {
            console.log('BackgroundTaskContext - Setting new progress data');
            lastProgressRef.current = progressId;
            setBackgroundTaskProgress(progress);
          } else {
            console.log('BackgroundTaskContext - Skipping duplicate progress update');
          }
          
          // Check if task is running
          // Consider task as running if it's not completed and either:
          // 1. Progress is marked as in progress, OR
          // 2. Progress has a recent timestamp (within 30 seconds) and no error
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const timeDiff = now - progressTime;
          const isRecent = timeDiff < 30 * 1000; // 30 seconds
          
          // More robust logic: if progress exists and is marked as in progress, consider it running
          // Only mark as not running if explicitly completed, cancelled, or has an error
          if (progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !forceStoppedRef.current) {
            setIsBackgroundTaskRunning(true);
          } else if (progress.completed || progress.cancelled || progress.error || forceStoppedRef.current) {
            // Task completed, cancelled, failed, or force stopped
            setIsBackgroundTaskRunning(false);
            
            // Send notification if task completed successfully and app is in background
            // Only send if app is not active (background/closed) and notification hasn't been sent
            if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current && appStateRef.current !== 'active' && !progress.notificationSent) {
              console.log('Sending notification for completed background task');
              await sendCompletionNotification(progress);
              // Mark as notification sent to avoid duplicate notifications
              await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify({
                ...progress,
                notificationSent: true
              }));
            } else if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current && appStateRef.current === 'active') {
              console.log('Task completed while app is active - no notification needed');
            }
            
            // Clear progress after a delay to allow notifications to be shown
            // This prevents duplicate notifications while ensuring the progress is eventually cleared
            if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              setTimeout(async () => {
                try {
                  await clearBackgroundTaskProgress();
                  console.log('Cleared background task progress after completion delay');
                } catch (error) {
                  console.error('Error clearing background task progress:', error);
                }
              }, 10000); // 10 second delay to ensure notifications are shown
            }
          } else {
            // If progress exists but doesn't have inProgress flag, check if it's recent
            // This handles edge cases where progress might exist but not be properly marked
            if (isRecent && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              setIsBackgroundTaskRunning(true);
            } else {
              setIsBackgroundTaskRunning(false);
            }
          }
        } else {
          setIsBackgroundTaskRunning(false);
          setBackgroundTaskProgress(null);
        }
      } catch (error) {
        console.error('Error checking background task progress:', error);
      }
    };

    // Check immediately
    checkProgress();
    
    // Set up interval to check every 1 second
    monitoringIntervalRef.current = setInterval(checkProgress, 1000);
  }, [sendCompletionNotification]);

  // Stop monitoring
  const stopBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Stopping background task monitoring...');
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, []);

  // App state change handler to resume monitoring when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is foregrounded - check if there's a background task running
        const progress = await loadBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          // Resume monitoring
          startBackgroundTaskMonitoring();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clear any stale background task data on app start
    const clearStaleData = async () => {
      try {
        const progress = await loadBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          console.log('Clearing stale background task data on app start');
          await clearBackgroundTaskProgress();
        }
      } catch (error) {
        console.error('Error clearing stale background task data:', error);
      }
    };
    
    // Clear stale data first, then start monitoring
    clearStaleData().then(() => {
      startBackgroundTaskMonitoring();
    });

    return () => {
      subscription.remove();
      stopBackgroundTaskMonitoring();
    };
  }, [startBackgroundTaskMonitoring, stopBackgroundTaskMonitoring]);

  const value: BackgroundTaskContextType = {
    isBackgroundTaskRunning,
    backgroundTaskProgress,
    startBackgroundTaskMonitoring,
    stopBackgroundTaskMonitoring,
    clearBackgroundTaskProgress,
    forceStopBackgroundTask,
    resetForceStoppedFlag,
  };

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  );
}; 