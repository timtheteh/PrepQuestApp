import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import { arePushNotificationsEnabled } from '@/db/users';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';
import { strings } from '@/constants/strings';

// Progress key for backup background tasks
const BACKUP_BG_TASK_PROGRESS_KEY = 'backupDataBgTaskProgress';

interface BackupBackgroundTaskContextType {
  isBackupBackgroundTaskRunning: boolean;
  isBackupCleanupInProgress: boolean;
  isBackupStopping: boolean;
  backupBackgroundTaskProgress: any | null;
  wasAutomaticallyCancelled: boolean;
  startBackupBackgroundTaskMonitoring: () => void;
  stopBackupBackgroundTaskMonitoring: () => void;
  clearBackupBackgroundTaskProgress: () => Promise<void>;
  forceStopBackupBackgroundTask: () => void;
  resetBackupForceStoppedFlag: () => void;
  resetAutomaticallyCancelledFlag: () => void;
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
  const [isBackupCleanupInProgress, setIsBackupCleanupInProgress] = useState(false);
  const [isBackupStopping, setIsBackupStopping] = useState(false);
  const [backupBackgroundTaskProgress, setBackupBackgroundTaskProgress] = useState<any | null>(null);
  const [wasAutomaticallyCancelled, setWasAutomaticallyCancelled] = useState(false);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  const localeStrings = strings[language] ?? strings.English;
  const englishBackupNotifications = strings.English.notifications.backup;
  const backupNotifications = localeStrings.notifications?.backup ?? englishBackupNotifications;
  const {
    backgroundWarningTitle = englishBackupNotifications.backgroundWarningTitle,
    backgroundWarningBody = englishBackupNotifications.backgroundWarningBody,
    preTerminationTitle = englishBackupNotifications.preTerminationTitle,
    preTerminationBody = englishBackupNotifications.preTerminationBody,
  } = backupNotifications;
  
  // Use a ref to track the current state for immediate access
  const isBackupBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track cleanup state for immediate access
  const isBackupCleanupInProgressRef = useRef(false);
  
  // Ref to track stopping state for immediate access
  const isBackupStoppingRef = useRef(false);
  
  // Ref to track the last progress data to prevent duplicate updates
  const lastProgressRef = useRef<string | null>(null);
  
  // Ref to track background warning notification timer
  const backgroundWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to track automatic termination timer (30 seconds after backgrounding)
  const backgroundTerminationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to track pre-termination notification timer (1 second before termination)
  const preTerminationNotificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Update refs whenever state changes
  React.useEffect(() => {
    isBackupBackgroundTaskRunningRef.current = isBackupBackgroundTaskRunning;
  }, [isBackupBackgroundTaskRunning]);

  React.useEffect(() => {
    isBackupCleanupInProgressRef.current = isBackupCleanupInProgress;
  }, [isBackupCleanupInProgress]);

  React.useEffect(() => {
    isBackupStoppingRef.current = isBackupStopping;
  }, [isBackupStopping]);

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
      console.log('Starting backup progress cleanup...');
      
      // Set cleanup flags to prevent new operations and notifications
      setIsBackupCleanupInProgress(true);
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
      
      // Complete cleanup with proper sequencing
      await AsyncStorage.removeItem(BACKUP_BG_TASK_PROGRESS_KEY);
      setBackupBackgroundTaskProgress(null);
      setIsBackupBackgroundTaskRunning(false);
      
      // Reset last progress ref to allow future updates
      lastProgressRef.current = null;
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Backup progress cleanup completed');
      
      // Reset cleanup flags
      setTimeout(() => {
        isClearingProgressRef.current = false;
        setIsBackupCleanupInProgress(false);
        setIsBackupStopping(false);
        console.log('Backup cleanup state reset - ready for new backup');
      }, 100);
      
    } catch (e) {
      console.error('Failed to clear backup background task progress', e);
      // Reset cleanup flags on error
      isClearingProgressRef.current = false;
      setIsBackupCleanupInProgress(false);
      setIsBackupStopping(false);
    }
  };

  // Helper to force stop background task immediately
  const forceStopBackupBackgroundTask = React.useCallback(() => {
    console.log('Force stopping backup background task...');
    console.log('Before force stop - isBackupBackgroundTaskRunning:', isBackupBackgroundTaskRunningRef.current);
    
    // Set stopping state to prevent new backup attempts during shutdown
    setIsBackupStopping(true);
    
    // Set cleanup in progress to prevent new operations
    setIsBackupCleanupInProgress(true);
    
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
    
    console.log('After force stop - backup is now in stopping phase');
  }, []);

  // Helper to reset force stopped flag
  const resetBackupForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting backup force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Helper to reset automatically cancelled flag
  const resetAutomaticallyCancelledFlag = React.useCallback(() => {
    console.log('Resetting automatically cancelled flag...');
    setWasAutomaticallyCancelled(false);
  }, []);

  // Helper to automatically cancel backup (replicates manual cancellation logic)
  const automaticallyCancelBackup = React.useCallback(async () => {
    try {
      console.log('Automatically cancelling backup after 30 seconds in background...');
      
      // Set the automatic cancellation flag
      setWasAutomaticallyCancelled(true);
      
      // IMMEDIATELY set local stopping state to prevent new backup attempts
      // This provides instant UI feedback before context state updates
      setIsBackupStopping(true);
      console.log('Automatic cancellation - setting stopping state immediately');
      
      // Force stop the backup background task permanently
      forceStopBackupBackgroundTask();
      
      // Stop the actual background service
      try {
        const { stopBackupBackgroundTask } = await import('../utils/backupBackgroundTask');
        await stopBackupBackgroundTask();
      } catch (importError) {
        console.error('Error importing stopBackupBackgroundTask:', importError);
      }
      
      // Clear the backup progress data thoroughly
      await clearBackupBackgroundTaskProgress();
      
      // Additional cleanup: manually remove all backup-related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'backupDataBgTaskProgress',
          'backupProgress',
          'backupState'
        ]);
        console.log('Additional AsyncStorage cleanup completed (automatic cancellation)');
        
        // Verify cleanup worked
        const remainingProgress = await AsyncStorage.getItem('backupDataBgTaskProgress');
        if (remainingProgress) {
          console.warn('Warning: backup progress still exists after automatic cleanup:', remainingProgress);
        } else {
          console.log('Confirmed: backup progress completely cleared (automatic)');
        }
      } catch (cleanupError) {
        console.warn('Additional cleanup failed (automatic):', cleanupError);
      }
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Backup task automatically cancelled successfully');
      
    } catch (error) {
      console.error('Error automatically cancelling backup task:', error);
    }
  }, [forceStopBackupBackgroundTask, clearBackupBackgroundTaskProgress]);

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
          if (progress.inProgress && !progress.completed && !progress.error && !progress.networkError) {
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
            networkError: progress.networkError,
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
          
          if (progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError && !forceStoppedRef.current) {
            setIsBackupBackgroundTaskRunning(true);
          } else if (progress.completed || progress.cancelled || progress.error || progress.networkError || forceStoppedRef.current) {
            // Task completed, cancelled, failed, or force stopped
            setIsBackupBackgroundTaskRunning(false);
            
            // Clear stopping state when backup is no longer active
            if (isBackupStoppingRef.current) {
              console.log('Backup no longer running - clearing stopping state');
              setIsBackupStopping(false);
            }
            
            // Clear any pending termination timer since backup is no longer running
            if (backgroundTerminationTimerRef.current) {
              clearTimeout(backgroundTerminationTimerRef.current);
              backgroundTerminationTimerRef.current = null;
              console.log('Cleared background termination timer - backup no longer running');
            }
            
            // Clear any pending pre-termination notification timer since backup is no longer running
            if (preTerminationNotificationTimerRef.current) {
              clearTimeout(preTerminationNotificationTimerRef.current);
              preTerminationNotificationTimerRef.current = null;
              console.log('Cleared pre-termination notification timer - backup no longer running');
            }
            
            // Since notifications are now sent directly from the background task,
            // we only need to handle progress clearing here
            // For successful completions, we don't auto-clear to allow app settings page to show persistent success modal
            if (progress.completed && !progress.error && !progress.networkError && !progress.cancelled && !forceStoppedRef.current) {
              // Don't auto-clear successful backup progress - let app settings page handle it
              console.log('Backup completed successfully - keeping progress for app settings page');
            } else if (progress.cancelled || progress.error || progress.networkError) {
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
            if (isRecent && !progress.error && !progress.networkError && !progress.cancelled && !forceStoppedRef.current) {
              setIsBackupBackgroundTaskRunning(true);
            } else {
              setIsBackupBackgroundTaskRunning(false);
            }
          }
        } else {
          setIsBackupBackgroundTaskRunning(false);
          setBackupBackgroundTaskProgress(null);
          
          // Clear stopping state when no progress data exists
          if (isBackupStoppingRef.current) {
            console.log('No backup progress - clearing stopping state');
            setIsBackupStopping(false);
          }
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
        
        // Clear any pending background warning notification
        if (backgroundWarningTimerRef.current) {
          clearTimeout(backgroundWarningTimerRef.current);
          backgroundWarningTimerRef.current = null;
          console.log('Cleared background warning notification - app returned to foreground');
        }
        
        // Clear any pending background termination timer
        if (backgroundTerminationTimerRef.current) {
          clearTimeout(backgroundTerminationTimerRef.current);
          backgroundTerminationTimerRef.current = null;
          console.log('Cleared background termination timer - app returned to foreground');
        }
        
        // Clear any pending pre-termination notification timer
        if (preTerminationNotificationTimerRef.current) {
          clearTimeout(preTerminationNotificationTimerRef.current);
          preTerminationNotificationTimerRef.current = null;
          console.log('Cleared pre-termination notification timer - app returned to foreground');
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background - check if backup is running
        if (isBackupBackgroundTaskRunningRef.current) {
          console.log('App backgrounded during backup - scheduling warning notification');
          
          // Clear any existing timers
          if (backgroundWarningTimerRef.current) {
            clearTimeout(backgroundWarningTimerRef.current);
          }
          if (backgroundTerminationTimerRef.current) {
            clearTimeout(backgroundTerminationTimerRef.current);
          }
          if (preTerminationNotificationTimerRef.current) {
            clearTimeout(preTerminationNotificationTimerRef.current);
          }
          
          // Schedule warning notification for 1 second after backgrounding
          backgroundWarningTimerRef.current = setTimeout(async () => {
            try {
              // Double-check backup is still running before sending notification
              const progress = await loadBackupBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError) {
                const title = backgroundWarningTitle;
                const body = backgroundWarningBody;
                
                if (await arePushNotificationsEnabled()) {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title,
                      body,
                      data: { type: 'backup_background_warning' },
                      sound: true,
                      priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: null, // Send immediately
                  });
                  
                  console.log('Background warning notification sent successfully');
                } else {
                  console.log('Push notifications disabled; skipping backup background warning notification');
                }
              } else {
                console.log('Backup no longer running - skipping background warning notification');
              }
            } catch (error) {
              console.error('Error sending background warning notification:', error);
            }
          }, 1000); // 1 second delay
          
          // Schedule pre-termination notification for 9 seconds after backgrounding (1 second before termination)
          preTerminationNotificationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check backup is still running before sending notification
              const progress = await loadBackupBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError) {
                const title = preTerminationTitle;
                const body = preTerminationBody;
                
                if (await arePushNotificationsEnabled()) {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title,
                      body,
                      data: { type: 'backup_pre_termination' },
                      sound: true,
                      priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: null, // Send immediately
                  });
                  
                  console.log('Pre-termination notification sent successfully');
                } else {
                  console.log('Push notifications disabled; skipping backup pre-termination notification');
                }
              } else {
                console.log('Backup no longer running - skipping pre-termination notification');
              }
            } catch (error) {
              console.error('Error sending pre-termination notification:', error);
            }
          }, 29000); // 9 second delay (1 second before 10-second termination)
          
          // Schedule automatic termination for 10 seconds after backgrounding
          backgroundTerminationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check backup is still running before terminating
              const progress = await loadBackupBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError) {
                console.log('10 seconds elapsed in background - automatically terminating backup task');
                await automaticallyCancelBackup();
              } else {
                console.log('Backup no longer running - skipping automatic termination');
              }
            } catch (error) {
              console.error('Error during automatic backup termination:', error);
            }
          }, 30000); // 30 second delay
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
      
      // Clear background warning timer on cleanup
      if (backgroundWarningTimerRef.current) {
        clearTimeout(backgroundWarningTimerRef.current);
        backgroundWarningTimerRef.current = null;
      }
      
      // Clear background termination timer on cleanup
      if (backgroundTerminationTimerRef.current) {
        clearTimeout(backgroundTerminationTimerRef.current);
        backgroundTerminationTimerRef.current = null;
      }
      
      // Clear pre-termination notification timer on cleanup
      if (preTerminationNotificationTimerRef.current) {
        clearTimeout(preTerminationNotificationTimerRef.current);
        preTerminationNotificationTimerRef.current = null;
      }
    };
  }, [startBackupBackgroundTaskMonitoring, stopBackupBackgroundTaskMonitoring]);

  const value: BackupBackgroundTaskContextType = {
    isBackupBackgroundTaskRunning,
    isBackupCleanupInProgress,
    isBackupStopping,
    backupBackgroundTaskProgress,
    wasAutomaticallyCancelled,
    startBackupBackgroundTaskMonitoring,
    stopBackupBackgroundTaskMonitoring,
    clearBackupBackgroundTaskProgress,
    forceStopBackupBackgroundTask,
    resetBackupForceStoppedFlag,
    resetAutomaticallyCancelledFlag,
  };

  return (
    <BackupBackgroundTaskContext.Provider value={value}>
      {children}
    </BackupBackgroundTaskContext.Provider>
  );
};
