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
      await AsyncStorage.removeItem(BG_TASK_PROGRESS_KEY);
      setBackgroundTaskProgress(null);
      setIsBackgroundTaskRunning(false);
    } catch (e) {
      console.error('Failed to clear background task progress', e);
    }
  };

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
    
    const checkProgress = async () => {
      try {
        const progress = await loadBackgroundTaskProgress();
        
        if (progress) {
          console.log('BackgroundTaskContext - Progress update:', {
            inProgress: progress.inProgress,
            completed: progress.completed,
            status: progress.status,
            hasError: !!progress.error
          });
          
          setBackgroundTaskProgress(progress);
          
          // Check if task is running
          if (progress.inProgress && !progress.completed) {
            setIsBackgroundTaskRunning(true);
          } else {
            // Task completed or failed
            setIsBackgroundTaskRunning(false);
            
            // If task has created deck/flashcards but not marked as completed,
            // treat it as completed for UI purposes
            if (progress.status === 'deckAndFlashcardsCreated' && !progress.completed) {
              console.log('Task has created deck/flashcards, treating as completed for UI');
              setBackgroundTaskProgress({
                ...progress,
                completed: true
              });
            }
            
            // Send notification if task completed successfully and app is in background
            // Only send if app is not active (background/closed) and notification hasn't been sent
            if (progress.completed && !progress.error && appStateRef.current !== 'active' && !progress.notificationSent) {
              console.log('Sending notification for completed background task');
              await sendCompletionNotification(progress);
              // Mark as notification sent to avoid duplicate notifications
              await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify({
                ...progress,
                notificationSent: true
              }));
            } else if (progress.completed && !progress.error && appStateRef.current === 'active') {
              console.log('Task completed while app is active - no notification needed');
            }
            
            // Don't clear progress immediately - let the UI handle it
            // Progress will be cleared when user dismisses notification or navigates
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
    
    // Set up interval to check every 2 seconds
    monitoringIntervalRef.current = setInterval(checkProgress, 2000);
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
    
    // Start monitoring on mount
    startBackgroundTaskMonitoring();

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
  };

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  );
}; 