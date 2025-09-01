import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';

// Progress key for clear data background tasks
const CLEAR_DATA_BG_TASK_PROGRESS_KEY = 'clearDataBgTaskProgress';

interface ClearDataBackgroundTaskContextType {
  isClearDataBackgroundTaskRunning: boolean;
  isClearDataCleanupInProgress: boolean;
  isClearDataStopping: boolean;
  clearDataBackgroundTaskProgress: any | null;
  wasAutomaticallyCancelled: boolean;
  startClearDataBackgroundTaskMonitoring: () => void;
  stopClearDataBackgroundTaskMonitoring: () => void;
  clearClearDataBackgroundTaskProgress: () => Promise<void>;
  forceStopClearDataBackgroundTask: () => void;
  resetClearDataForceStoppedFlag: () => void;
  resetAutomaticallyCancelledFlag: () => void;
}

const ClearDataBackgroundTaskContext = createContext<ClearDataBackgroundTaskContextType | undefined>(undefined);

export const useClearDataBackgroundTask = () => {
  const context = useContext(ClearDataBackgroundTaskContext);
  if (!context) {
    throw new Error('useClearDataBackgroundTask must be used within a ClearDataBackgroundTaskProvider');
  }
  return context;
};

interface ClearDataBackgroundTaskProviderProps {
  children: React.ReactNode;
}

export const ClearDataBackgroundTaskProvider: React.FC<ClearDataBackgroundTaskProviderProps> = ({ children }) => {
  const [isClearDataBackgroundTaskRunning, setIsClearDataBackgroundTaskRunning] = useState(false);
  const [isClearDataCleanupInProgress, setIsClearDataCleanupInProgress] = useState(false);
  const [isClearDataStopping, setIsClearDataStopping] = useState(false);
  const [clearDataBackgroundTaskProgress, setClearDataBackgroundTaskProgress] = useState<any | null>(null);
  const [wasAutomaticallyCancelled, setWasAutomaticallyCancelled] = useState(false);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  
  // Use a ref to track the current state for immediate access
  const isClearDataBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track cleanup state for immediate access
  const isClearDataCleanupInProgressRef = useRef(false);
  
  // Ref to track stopping state for immediate access
  const isClearDataStoppingRef = useRef(false);
  
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
    isClearDataBackgroundTaskRunningRef.current = isClearDataBackgroundTaskRunning;
  }, [isClearDataBackgroundTaskRunning]);

  React.useEffect(() => {
    isClearDataCleanupInProgressRef.current = isClearDataCleanupInProgress;
  }, [isClearDataCleanupInProgress]);

  React.useEffect(() => {
    isClearDataStoppingRef.current = isClearDataStopping;
  }, [isClearDataStopping]);

  // Helper to load progress from AsyncStorage
  const loadClearDataBackgroundTaskProgress = async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(CLEAR_DATA_BG_TASK_PROGRESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load clear data background task progress', e);
      return null;
    }
  };

  // Helper to clear progress
  const clearClearDataBackgroundTaskProgress = async () => {
    try {
      console.log('Starting clear data progress cleanup...');
      
      // Set cleanup flags to prevent new operations and notifications
      setIsClearDataCleanupInProgress(true);
      isClearingProgressRef.current = true;
      
      // Mark task as completed before clearing
      const currentProgress = await loadClearDataBackgroundTaskProgress();
      if (currentProgress && currentProgress.inProgress && !currentProgress.completed) {
        await AsyncStorage.setItem(CLEAR_DATA_BG_TASK_PROGRESS_KEY, JSON.stringify({
          ...currentProgress,
          inProgress: false,
          completed: true
        }));
      }
      
      // Complete cleanup with proper sequencing
      await AsyncStorage.removeItem(CLEAR_DATA_BG_TASK_PROGRESS_KEY);
      setClearDataBackgroundTaskProgress(null);
      setIsClearDataBackgroundTaskRunning(false);
      
      // Reset last progress ref to allow future updates
      lastProgressRef.current = null;
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Clear data progress cleanup completed');
      
      // Reset cleanup flags
      setTimeout(() => {
        isClearingProgressRef.current = false;
        setIsClearDataCleanupInProgress(false);
        setIsClearDataStopping(false);
        console.log('Clear data cleanup state reset - ready for new clear data');
      }, 100);
      
    } catch (e) {
      console.error('Failed to clear clear data background task progress', e);
      // Reset cleanup flags on error
      isClearingProgressRef.current = false;
      setIsClearDataCleanupInProgress(false);
      setIsClearDataStopping(false);
    }
  };

  // Helper to force stop background task immediately
  const forceStopClearDataBackgroundTask = React.useCallback(() => {
    console.log('Force stopping clear data background task...');
    console.log('Before force stop - isClearDataBackgroundTaskRunning:', isClearDataBackgroundTaskRunningRef.current);
    
    // Set stopping state to prevent new clear data attempts during shutdown
    setIsClearDataStopping(true);
    
    // Set cleanup in progress to prevent new operations
    setIsClearDataCleanupInProgress(true);
    
    // Set force stopped flag
    forceStoppedRef.current = true;
    
    // Stop monitoring completely to prevent interference
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Update ref immediately
    isClearDataBackgroundTaskRunningRef.current = false;
    
    // Force immediate state update
    setIsClearDataBackgroundTaskRunning(false);
    setClearDataBackgroundTaskProgress(null);
    
    console.log('After force stop - clear data is now in stopping phase');
  }, []);

  // Helper to reset force stopped flag
  const resetClearDataForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting clear data force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Helper to reset automatically cancelled flag
  const resetAutomaticallyCancelledFlag = React.useCallback(() => {
    console.log('Resetting automatically cancelled flag...');
    setWasAutomaticallyCancelled(false);
  }, []);

  // Helper to automatically cancel clear data (replicates manual cancellation logic)
  const automaticallyCancelClearData = React.useCallback(async () => {
    try {
      console.log('Automatically cancelling clear data after 30 seconds in background...');
      
      // Set the automatic cancellation flag
      setWasAutomaticallyCancelled(true);
      
      // IMMEDIATELY set local stopping state to prevent new clear data attempts
      // This provides instant UI feedback before context state updates
      setIsClearDataStopping(true);
      console.log('Automatic cancellation - setting stopping state immediately');
      
      // Force stop the clear data background task permanently
      forceStopClearDataBackgroundTask();
      
      // Stop the actual background service
      try {
        const { stopClearDataBackgroundTask } = await import('../utils/clearDataBackgroundTask');
        await stopClearDataBackgroundTask();
      } catch (importError) {
        console.error('Error importing stopClearDataBackgroundTask:', importError);
      }
      
      // Attempt to restore data from backup if available
      try {
        const backupDataString = await AsyncStorage.getItem('clearDataBackupData');
        if (backupDataString) {
          console.log('Found backup data, attempting to restore...');
          const backupData = JSON.parse(backupDataString);
          
          // Import the restore function
          const { restoreDataFromBackup } = await import('../db/clearData');
          
          // Attempt to restore the data
          const restoreSuccess = await restoreDataFromBackup(backupData, (progress: any) => {
            console.log('Restore progress:', progress);
          }, () => false); // No cancellation during automatic restore
          
          if (restoreSuccess) {
            console.log('Data successfully restored from backup after automatic cancellation');
          } else {
            console.error('Failed to restore data from backup after automatic cancellation');
          }
        } else {
          console.log('No backup data found for restoration');
        }
      } catch (restoreError) {
        console.error('Error during data restoration after automatic cancellation:', restoreError);
      }
      
      // Clear the clear data progress data thoroughly
      await clearClearDataBackgroundTaskProgress();
      
      // Additional cleanup: manually remove all clear data-related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'clearDataBgTaskProgress',
          'clearDataProgress',
          'clearDataState',
          'clearDataBackupData' // Also remove the backup data after restoration attempt
        ]);
        console.log('Additional AsyncStorage cleanup completed (automatic cancellation)');
        
        // Verify cleanup worked
        const remainingProgress = await AsyncStorage.getItem('clearDataBgTaskProgress');
        if (remainingProgress) {
          console.warn('Warning: clear data progress still exists after automatic cleanup:', remainingProgress);
        } else {
          console.log('Confirmed: clear data progress completely cleared (automatic)');
        }
      } catch (cleanupError) {
        console.warn('Additional cleanup failed (automatic):', cleanupError);
      }
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Clear data task automatically cancelled successfully');
      
    } catch (error) {
      console.error('Error automatically cancelling clear data task:', error);
    }
  }, [forceStopClearDataBackgroundTask, clearClearDataBackgroundTaskProgress]);

  // Start monitoring background task progress
  const startClearDataBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Starting clear data background task monitoring...');
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
        const progress = await loadClearDataBackgroundTaskProgress();
        
        if (progress) {
          console.log('ClearDataBackgroundTaskContext - Progress update:', {
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
              console.log('Clearing stale clear data background task progress data (older than 10 minutes)');
              await clearClearDataBackgroundTaskProgress();
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
            console.log('ClearDataBackgroundTaskContext - Setting new progress data');
            lastProgressRef.current = progressId;
            setClearDataBackgroundTaskProgress(progress);
          } else {
            console.log('ClearDataBackgroundTaskContext - Skipping duplicate progress update');
          }
          
          // Check if task is running
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const timeDiff = now - progressTime;
          const isRecent = timeDiff < 30 * 1000; // 30 seconds
          
          if (progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !forceStoppedRef.current) {
            setIsClearDataBackgroundTaskRunning(true);
          } else if (progress.completed || progress.cancelled || progress.error || forceStoppedRef.current) {
            // Task completed, cancelled, failed, or force stopped
            setIsClearDataBackgroundTaskRunning(false);
            
            // Clear stopping state when clear data is no longer active
            if (isClearDataStoppingRef.current) {
              console.log('Clear data no longer running - clearing stopping state');
              setIsClearDataStopping(false);
            }
            
            // Clear any pending termination timer since clear data is no longer running
            if (backgroundTerminationTimerRef.current) {
              clearTimeout(backgroundTerminationTimerRef.current);
              backgroundTerminationTimerRef.current = null;
              console.log('Cleared background termination timer - clear data no longer running');
            }
            
            // Clear any pending pre-termination notification timer since clear data is no longer running
            if (preTerminationNotificationTimerRef.current) {
              clearTimeout(preTerminationNotificationTimerRef.current);
              preTerminationNotificationTimerRef.current = null;
              console.log('Cleared pre-termination notification timer - clear data no longer running');
            }
            
            // Since notifications are now sent directly from the background task,
            // we only need to handle progress clearing here
            // For successful completions, we don't auto-clear to allow app settings page to show persistent success modal
            if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              // Don't auto-clear successful clear data progress - let app settings page handle it
              console.log('Clear data completed successfully - keeping progress for app settings page');
            } else if (progress.cancelled || progress.error) {
              // Only clear progress for cancelled or failed clear data
              setTimeout(async () => {
                try {
                  await clearClearDataBackgroundTaskProgress();
                  console.log('Cleared clear data background task progress after UI delay (cancelled/error)');
                } catch (error) {
                  console.error('Error clearing clear data background task progress:', error);
                }
              }, 3000); // 3 second delay to allow UI to show completion
            }
          } else {
            // If progress exists but doesn't have inProgress flag, check if it's recent
            if (isRecent && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              setIsClearDataBackgroundTaskRunning(true);
            } else {
              setIsClearDataBackgroundTaskRunning(false);
            }
          }
        } else {
          setIsClearDataBackgroundTaskRunning(false);
          setClearDataBackgroundTaskProgress(null);
          
          // Clear stopping state when no progress data exists
          if (isClearDataStoppingRef.current) {
            console.log('No clear data progress - clearing stopping state');
            setIsClearDataStopping(false);
          }
        }
      } catch (error) {
        console.error('Error checking clear data background task progress:', error);
      }
    };

    // Check immediately
    checkProgress();
    
    // Set up interval to check every 1 second
    monitoringIntervalRef.current = setInterval(checkProgress, 1000);
  }, []);

  // Stop monitoring
  const stopClearDataBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Stopping clear data background task monitoring...');
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
        // App is foregrounded - check if there's a clear data background task running
        const progress = await loadClearDataBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          // Resume monitoring
          startClearDataBackgroundTaskMonitoring();
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
        // App is going to background - check if clear data is running
        if (isClearDataBackgroundTaskRunningRef.current) {
          console.log('App backgrounded during clear data - scheduling warning notification');
          
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
              // Double-check clear data is still running before sending notification
              const progress = await loadClearDataBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                const title = language === 'Chinese' ? '清除任务警告' : 'Come back soon!';
                const body = language === 'Chinese' 
                  ? '清除任务将在大约30秒内提前结束。请尽快回来！' 
                  : 'Clear data task automatically ends in approximately 30 seconds!';
                
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title,
                    body,
                    data: { type: 'clear_data_background_warning' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null, // Send immediately
                });
                
                console.log('Background warning notification sent successfully');
              } else {
                console.log('Clear data no longer running - skipping background warning notification');
              }
            } catch (error) {
              console.error('Error sending background warning notification:', error);
            }
          }, 1000); // 1 second delay
          
          // Schedule pre-termination notification for 29 seconds after backgrounding (1 second before termination)
          preTerminationNotificationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check clear data is still running before sending notification
              const progress = await loadClearDataBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                const title = 'Clear data task cancelled!';
                const body = 'Oops you were away for too long!';
                
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title,
                    body,
                    data: { type: 'clear_data_pre_termination' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null, // Send immediately
                });
                
                console.log('Pre-termination notification sent successfully');
              } else {
                console.log('Clear data no longer running - skipping pre-termination notification');
              }
            } catch (error) {
              console.error('Error sending pre-termination notification:', error);
            }
          }, 29000); // 29 second delay (1 second before 30-second termination)
          
          // Schedule automatic termination for 30 seconds after backgrounding
          backgroundTerminationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check clear data is still running before terminating
              const progress = await loadClearDataBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                console.log('30 seconds elapsed in background - automatically terminating clear data task');
                await automaticallyCancelClearData();
              } else {
                console.log('Clear data no longer running - skipping automatic termination');
              }
            } catch (error) {
              console.error('Error during automatic clear data termination:', error);
            }
          }, 30000); // 30 second delay
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clear any stale clear data background task data on app start
    const clearStaleData = async () => {
      try {
        const progress = await loadClearDataBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          console.log('Clearing stale clear data background task data on app start');
          await clearClearDataBackgroundTaskProgress();
        }
      } catch (error) {
        console.error('Error clearing stale clear data background task data:', error);
      }
    };
    
    // Clear stale data first, then start monitoring
    clearStaleData().then(() => {
      startClearDataBackgroundTaskMonitoring();
    });

    return () => {
      subscription.remove();
      stopClearDataBackgroundTaskMonitoring();
      
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
  }, [startClearDataBackgroundTaskMonitoring, stopClearDataBackgroundTaskMonitoring]);

  const value: ClearDataBackgroundTaskContextType = {
    isClearDataBackgroundTaskRunning,
    isClearDataCleanupInProgress,
    isClearDataStopping,
    clearDataBackgroundTaskProgress,
    wasAutomaticallyCancelled,
    startClearDataBackgroundTaskMonitoring,
    stopClearDataBackgroundTaskMonitoring,
    clearClearDataBackgroundTaskProgress,
    forceStopClearDataBackgroundTask,
    resetClearDataForceStoppedFlag,
    resetAutomaticallyCancelledFlag,
  };

  return (
    <ClearDataBackgroundTaskContext.Provider value={value}>
      {children}
    </ClearDataBackgroundTaskContext.Provider>
  );
};
