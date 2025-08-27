import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';

// Progress key for backup background tasks
const BACKUP_BG_TASK_PROGRESS_KEY = 'backupDataBgTaskProgress';

interface BackupBackgroundTaskContextType {
  isBackupBackgroundTaskRunning: boolean;
  backupBackgroundTaskProgress: any | null;
  startBackupBackgroundTaskMonitoring: () => void;
  stopBackupBackgroundTaskMonitoring: () => void;
  clearBackupBackgroundTaskProgress: () => Promise<void>;
  forceStopBackupBackgroundTask: () => void;
  resetBackupForceStoppedFlag: () => void;
}

const BackupBackgroundTaskContext = createContext<BackupBackgroundTaskContextType | undefined>(undefined);

export const useBackupBackgroundTask = () => {
  const context = useContext(BackupBackgroundTaskContext);
  if (!context) {
    throw new Error('useBackupBackgroundTask must be used within a BackupBackgroundTaskProvider');
  }
  return context;
};

interface BackupBackgroundTaskProviderProps {
  children: React.ReactNode;
}

export const BackupBackgroundTaskProvider: React.FC<BackupBackgroundTaskProviderProps> = ({ children }) => {
  const [isBackupBackgroundTaskRunning, setIsBackupBackgroundTaskRunning] = useState(false);
  const [backupBackgroundTaskProgress, setBackupBackgroundTaskProgress] = useState<any | null>(null);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  
  // Use a ref to track the current state for immediate access
  const isBackupBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track the last progress data to prevent duplicate updates
  const lastProgressRef = useRef<string | null>(null);
  
  // Update ref whenever state changes
  React.useEffect(() => {
    isBackupBackgroundTaskRunningRef.current = isBackupBackgroundTaskRunning;
  }, [isBackupBackgroundTaskRunning]);

  // Helper to load progress from AsyncStorage
  const loadBackupBackgroundTaskProgress = async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(BACKUP_BG_TASK_PROGRESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load backup background task progress', e);
      return null;
    }
  };

  // Helper to clear progress
  const clearBackupBackgroundTaskProgress = async () => {
    try {
      // Set clearing flag to prevent notifications during clearing
      isClearingProgressRef.current = true;
      
      // Mark task as completed before clearing
      const currentProgress = await loadBackupBackgroundTaskProgress();
      if (currentProgress && currentProgress.inProgress && !currentProgress.completed) {
        await AsyncStorage.setItem(BACKUP_BG_TASK_PROGRESS_KEY, JSON.stringify({
          ...currentProgress,
          inProgress: false,
          completed: true
        }));
      }
      
      await AsyncStorage.removeItem(BACKUP_BG_TASK_PROGRESS_KEY);
      setBackupBackgroundTaskProgress(null);
      setIsBackupBackgroundTaskRunning(false);
      
      // Reset clearing flag after a short delay
      setTimeout(() => {
        isClearingProgressRef.current = false;
      }, 1000);
      
      // Reset last progress ref to allow future updates
      lastProgressRef.current = null;
    } catch (e) {
      console.error('Failed to clear backup background task progress', e);
      // Reset clearing flag on error
      isClearingProgressRef.current = false;
    }
  };

  // Helper to force stop background task immediately
  const forceStopBackupBackgroundTask = React.useCallback(() => {
    console.log('Force stopping backup background task...');
    console.log('Before force stop - isBackupBackgroundTaskRunning:', isBackupBackgroundTaskRunningRef.current);
    
    // Set force stopped flag
    forceStoppedRef.current = true;
    
    // Stop monitoring completely to prevent interference
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Update ref immediately
    isBackupBackgroundTaskRunningRef.current = false;
    
    // Force immediate state update
    setIsBackupBackgroundTaskRunning(false);
    setBackupBackgroundTaskProgress(null);
    
    console.log('After force stop - isBackupBackgroundTaskRunning should be false');
  }, []);

  // Helper to reset force stopped flag
  const resetBackupForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting backup force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Start monitoring background task progress
  const startBackupBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Starting backup background task monitoring...');
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
        const progress = await loadBackupBackgroundTaskProgress();
        
        if (progress) {
          console.log('BackupBackgroundTaskContext - Progress update:', {
            inProgress: progress.inProgress,
            completed: progress.completed,
            status: progress.status,
            hasError: !!progress.error,
            timestamp: progress.timestamp,
            percentage: progress.percentage
          });
          
          // Clear stale progress data that might be causing issues
          if (progress.inProgress && !progress.completed && !progress.error) {
            const now = Date.now();
            const progressTime = progress.timestamp || 0;
            const timeDiff = now - progressTime;
            
            // If the progress is older than 10 minutes, consider it stale
            if (timeDiff > 10 * 60 * 1000) {
              console.log('Clearing stale backup background task progress data (older than 10 minutes)');
              await clearBackupBackgroundTaskProgress();
              return;
            }
          }
          
          // Create a unique identifier for this progress data
          const progressId = JSON.stringify({
            completed: progress.completed,
            error: progress.error,
            status: progress.status,
            timestamp: progress.timestamp,
            percentage: progress.percentage
          });
          
          // Only update progress if it's different from the last one
          if (lastProgressRef.current !== progressId) {
            console.log('BackupBackgroundTaskContext - Setting new progress data');
            lastProgressRef.current = progressId;
            setBackupBackgroundTaskProgress(progress);
          } else {
            console.log('BackupBackgroundTaskContext - Skipping duplicate progress update');
          }
          
          // Check if task is running
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const timeDiff = now - progressTime;
          const isRecent = timeDiff < 30 * 1000; // 30 seconds
          
          if (progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !forceStoppedRef.current) {
            setIsBackupBackgroundTaskRunning(true);
          } else if (progress.completed || progress.cancelled || progress.error || forceStoppedRef.current) {
            // Task completed, cancelled, failed, or force stopped
            setIsBackupBackgroundTaskRunning(false);
            
            // Since notifications are now sent directly from the background task,
            // we only need to handle progress clearing here
            // For successful completions, we don't auto-clear to allow app settings page to show persistent success modal
            if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              // Don't auto-clear successful backup progress - let app settings page handle it
              console.log('Backup completed successfully - keeping progress for app settings page');
            } else if (progress.cancelled || progress.error) {
              // Only clear progress for cancelled or failed backups
              setTimeout(async () => {
                try {
                  await clearBackupBackgroundTaskProgress();
                  console.log('Cleared backup background task progress after UI delay (cancelled/error)');
                } catch (error) {
                  console.error('Error clearing backup background task progress:', error);
                }
              }, 3000); // 3 second delay to allow UI to show completion
            }
          } else {
            // If progress exists but doesn't have inProgress flag, check if it's recent
            if (isRecent && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              setIsBackupBackgroundTaskRunning(true);
            } else {
              setIsBackupBackgroundTaskRunning(false);
            }
          }
        } else {
          setIsBackupBackgroundTaskRunning(false);
          setBackupBackgroundTaskProgress(null);
        }
      } catch (error) {
        console.error('Error checking backup background task progress:', error);
      }
    };

    // Check immediately
    checkProgress();
    
    // Set up interval to check every 1 second
    monitoringIntervalRef.current = setInterval(checkProgress, 1000);
  }, []);

  // Stop monitoring
  const stopBackupBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Stopping backup background task monitoring...');
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, []);

  // App state change handler to resume monitoring when app comes to foreground
  useEffect(() => {
    // Ensure notifications are initialized (permissions, channels, handler)
    notificationService.initialize().catch(() => {});

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is foregrounded - check if there's a backup background task running
        const progress = await loadBackupBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          // Resume monitoring
          startBackupBackgroundTaskMonitoring();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clear any stale backup background task data on app start
    const clearStaleData = async () => {
      try {
        const progress = await loadBackupBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          console.log('Clearing stale backup background task data on app start');
          await clearBackupBackgroundTaskProgress();
        }
      } catch (error) {
        console.error('Error clearing stale backup background task data:', error);
      }
    };
    
    // Clear stale data first, then start monitoring
    clearStaleData().then(() => {
      startBackupBackgroundTaskMonitoring();
    });

    return () => {
      subscription.remove();
      stopBackupBackgroundTaskMonitoring();
    };
  }, [startBackupBackgroundTaskMonitoring, stopBackupBackgroundTaskMonitoring]);

  const value: BackupBackgroundTaskContextType = {
    isBackupBackgroundTaskRunning,
    backupBackgroundTaskProgress,
    startBackupBackgroundTaskMonitoring,
    stopBackupBackgroundTaskMonitoring,
    clearBackupBackgroundTaskProgress,
    forceStopBackupBackgroundTask,
    resetBackupForceStoppedFlag,
  };

  return (
    <BackupBackgroundTaskContext.Provider value={value}>
      {children}
    </BackupBackgroundTaskContext.Provider>
  );
};
