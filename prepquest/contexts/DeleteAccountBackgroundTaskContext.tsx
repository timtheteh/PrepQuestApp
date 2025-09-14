import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';

// Progress key for delete account background tasks
const DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY = 'deleteAccountBgTaskProgress';

interface DeleteAccountBackgroundTaskContextType {
  isDeleteAccountBackgroundTaskRunning: boolean;
  isDeleteAccountCleanupInProgress: boolean;
  isDeleteAccountStopping: boolean;
  deleteAccountBackgroundTaskProgress: any | null;
  setDeleteAccountBackgroundTaskProgress: (progress: any | null) => void;
  wasAutomaticallyCancelled: boolean;
  startDeleteAccountBackgroundTaskMonitoring: () => void;
  stopDeleteAccountBackgroundTaskMonitoring: () => void;
  clearDeleteAccountBackgroundTaskProgress: () => Promise<void>;
  forceStopDeleteAccountBackgroundTask: () => void;
  resetDeleteAccountForceStoppedFlag: () => void;
  resetAutomaticallyCancelledFlag: () => void;
}

const DeleteAccountBackgroundTaskContext = createContext<DeleteAccountBackgroundTaskContextType | undefined>(undefined);

export const useDeleteAccountBackgroundTask = () => {
  const context = useContext(DeleteAccountBackgroundTaskContext);
  if (!context) {
    throw new Error('useDeleteAccountBackgroundTask must be used within a DeleteAccountBackgroundTaskProvider');
  }
  return context;
};

interface DeleteAccountBackgroundTaskProviderProps {
  children: React.ReactNode;
}

export const DeleteAccountBackgroundTaskProvider: React.FC<DeleteAccountBackgroundTaskProviderProps> = ({ children }) => {
  const [isDeleteAccountBackgroundTaskRunning, setIsDeleteAccountBackgroundTaskRunning] = useState(false);
  const [isDeleteAccountCleanupInProgress, setIsDeleteAccountCleanupInProgress] = useState(false);
  const [isDeleteAccountStopping, setIsDeleteAccountStopping] = useState(false);
  const [deleteAccountBackgroundTaskProgress, setDeleteAccountBackgroundTaskProgress] = useState<any | null>(null);
  const [wasAutomaticallyCancelled, setWasAutomaticallyCancelled] = useState(false);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  
  // Use a ref to track the current state for immediate access
  const isDeleteAccountBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track cleanup state for immediate access
  const isDeleteAccountCleanupInProgressRef = useRef(false);
  
  // Ref to track stopping state for immediate access
  const isDeleteAccountStoppingRef = useRef(false);
  
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
    isDeleteAccountBackgroundTaskRunningRef.current = isDeleteAccountBackgroundTaskRunning;
  }, [isDeleteAccountBackgroundTaskRunning]);

  React.useEffect(() => {
    isDeleteAccountCleanupInProgressRef.current = isDeleteAccountCleanupInProgress;
  }, [isDeleteAccountCleanupInProgress]);

  React.useEffect(() => {
    isDeleteAccountStoppingRef.current = isDeleteAccountStopping;
  }, [isDeleteAccountStopping]);

  // Helper to load progress from AsyncStorage
  const loadDeleteAccountBackgroundTaskProgress = async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load delete account background task progress', e);
      return null;
    }
  };

  // Helper to clear progress
  const clearDeleteAccountBackgroundTaskProgress = async () => {
    try {
      console.log('Starting delete account progress cleanup...');
      
      // Set cleanup flags to prevent new operations and notifications
      setTimeout(() => {
        setIsDeleteAccountCleanupInProgress(true);
      }, 0);
      isClearingProgressRef.current = true;
      
      // Mark task as completed before clearing
      const currentProgress = await loadDeleteAccountBackgroundTaskProgress();
      if (currentProgress && currentProgress.inProgress && !currentProgress.completed) {
        await AsyncStorage.setItem(DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY, JSON.stringify({
          ...currentProgress,
          inProgress: false,
          completed: true
        }));
      }
      
      // Complete cleanup with proper sequencing
      await AsyncStorage.removeItem(DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY);
      setTimeout(() => {
        setDeleteAccountBackgroundTaskProgress(null);
        setIsDeleteAccountBackgroundTaskRunning(false);
      }, 0);
      
      // Reset last progress ref to allow future updates
      lastProgressRef.current = null;
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Delete account progress cleanup completed');
      
      // Reset cleanup flags
      setTimeout(() => {
        isClearingProgressRef.current = false;
        setTimeout(() => {
          setIsDeleteAccountCleanupInProgress(false);
          setIsDeleteAccountStopping(false);
        }, 0);
        console.log('Delete account cleanup state reset - ready for new delete account');
      }, 100);
      
    } catch (e) {
      console.error('Failed to clear delete account background task progress', e);
      // Reset cleanup flags on error
      isClearingProgressRef.current = false;
      setTimeout(() => {
        setIsDeleteAccountCleanupInProgress(false);
        setIsDeleteAccountStopping(false);
      }, 0);
    }
  };

  // Helper to force stop background task immediately
  const forceStopDeleteAccountBackgroundTask = React.useCallback(() => {
    console.log('Force stopping delete account background task...');
    console.log('Before force stop - isDeleteAccountBackgroundTaskRunning:', isDeleteAccountBackgroundTaskRunningRef.current);
    
    // Set stopping state to prevent new delete account attempts during shutdown
    setTimeout(() => {
      setIsDeleteAccountStopping(true);
      
      // Set cleanup in progress to prevent new operations
      setIsDeleteAccountCleanupInProgress(true);
    }, 0);
    
    // Set force stopped flag
    forceStoppedRef.current = true;
    
    // Stop monitoring completely to prevent interference
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Update ref immediately
    isDeleteAccountBackgroundTaskRunningRef.current = false;
    
    // Force immediate state update
    setTimeout(() => {
      setIsDeleteAccountBackgroundTaskRunning(false);
      setDeleteAccountBackgroundTaskProgress(null);
    }, 0);
    
    console.log('After force stop - delete account is now in stopping phase');
  }, []);

  // Helper to reset force stopped flag
  const resetDeleteAccountForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting delete account force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Helper to reset automatically cancelled flag
  const resetAutomaticallyCancelledFlag = React.useCallback(() => {
    console.log('Resetting automatically cancelled flag...');
    setWasAutomaticallyCancelled(false);
  }, []);

  // Start monitoring background task progress
  const startDeleteAccountBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Starting delete account background task monitoring...');
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
        const progress = await loadDeleteAccountBackgroundTaskProgress();
        
        if (progress) {
          console.log('DeleteAccountBackgroundTaskContext - Progress update:', {
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
              console.log('Clearing stale delete account background task progress data (older than 10 minutes)');
              await clearDeleteAccountBackgroundTaskProgress();
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
            console.log('DeleteAccountBackgroundTaskContext - Setting new progress data');
            lastProgressRef.current = progressId;
            setDeleteAccountBackgroundTaskProgress(progress);
          } else {
            console.log('DeleteAccountBackgroundTaskContext - Skipping duplicate progress update');
          }
          
          // Check if task is running
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const timeDiff = now - progressTime;
          const isRecent = timeDiff < 30 * 1000; // 30 seconds
          
          if (progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !forceStoppedRef.current) {
            setTimeout(() => {
              setIsDeleteAccountBackgroundTaskRunning(true);
            }, 0);
          } else if (progress.completed || progress.cancelled || progress.error || forceStoppedRef.current) {
            // Task completed, cancelled, failed, or force stopped
            setTimeout(() => {
              setIsDeleteAccountBackgroundTaskRunning(false);
              
              // Clear stopping state when delete account is no longer active
              if (isDeleteAccountStoppingRef.current) {
                console.log('Delete account no longer running - clearing stopping state');
                setIsDeleteAccountStopping(false);
              }
            }, 0);
            
            // Clear any pending termination timer since delete account is no longer running
            if (backgroundTerminationTimerRef.current) {
              clearTimeout(backgroundTerminationTimerRef.current);
              backgroundTerminationTimerRef.current = null;
              console.log('Cleared background termination timer - delete account no longer running');
            }
            
            // Clear any pending pre-termination notification timer since delete account is no longer running
            if (preTerminationNotificationTimerRef.current) {
              clearTimeout(preTerminationNotificationTimerRef.current);
              preTerminationNotificationTimerRef.current = null;
              console.log('Cleared pre-termination notification timer - delete account no longer running');
            }
            
            // Since notifications are now sent directly from the background task,
            // we only need to handle progress clearing here
            // For successful completions, we don't auto-clear to allow app settings page to show persistent success modal
            if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              // Don't auto-clear successful delete account progress - let app settings page handle it
              console.log('Delete account completed successfully - keeping progress for app settings page');
            } else if (progress.cancelled || progress.error) {
              // Only clear progress for cancelled or failed delete account
              setTimeout(async () => {
                try {
                  await clearDeleteAccountBackgroundTaskProgress();
                  console.log('Cleared delete account background task progress after UI delay (cancelled/error)');
                } catch (error) {
                  console.error('Error clearing delete account background task progress:', error);
                }
              }, 3000); // 3 second delay to allow UI to show completion
            }
          } else {
            // If progress exists but doesn't have inProgress flag, check if it's recent
            if (isRecent && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              setTimeout(() => {
                setIsDeleteAccountBackgroundTaskRunning(true);
              }, 0);
            } else {
              setTimeout(() => {
                setIsDeleteAccountBackgroundTaskRunning(false);
              }, 0);
            }
          }
        } else {
          setTimeout(() => {
            setIsDeleteAccountBackgroundTaskRunning(false);
            setDeleteAccountBackgroundTaskProgress(null);
            
            // Clear stopping state when no progress data exists
            if (isDeleteAccountStoppingRef.current) {
              console.log('No delete account progress - clearing stopping state');
              setIsDeleteAccountStopping(false);
            }
          }, 0);
        }
      } catch (error) {
        console.error('Error checking delete account background task progress:', error);
      }
    };

    // Check immediately
    checkProgress();
    
    // Set up interval to check every 1 second
    monitoringIntervalRef.current = setInterval(checkProgress, 1000);
  }, []);

  // Stop monitoring
  const stopDeleteAccountBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Stopping delete account background task monitoring...');
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
        // App is foregrounded - check if there's a delete account background task running
        const progress = await loadDeleteAccountBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          // Resume monitoring
          startDeleteAccountBackgroundTaskMonitoring();
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
        // App is going to background - check if delete account is running
        if (isDeleteAccountBackgroundTaskRunningRef.current) {
          console.log('App backgrounded during delete account - task will continue in background');
          
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
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clear any stale delete account background task data on app start
    const clearStaleData = async () => {
      try {
        const progress = await loadDeleteAccountBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          console.log('Clearing stale delete account background task data on app start');
          await clearDeleteAccountBackgroundTaskProgress();
        }
      } catch (error) {
        console.error('Error clearing stale delete account background task data:', error);
      }
    };
    
    // Clear stale data first, then start monitoring
    clearStaleData().then(() => {
      startDeleteAccountBackgroundTaskMonitoring();
    });

    return () => {
      subscription.remove();
      stopDeleteAccountBackgroundTaskMonitoring();
      
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
  }, [startDeleteAccountBackgroundTaskMonitoring, stopDeleteAccountBackgroundTaskMonitoring]);

  const value: DeleteAccountBackgroundTaskContextType = {
    isDeleteAccountBackgroundTaskRunning,
    isDeleteAccountCleanupInProgress,
    isDeleteAccountStopping,
    deleteAccountBackgroundTaskProgress,
    setDeleteAccountBackgroundTaskProgress,
    wasAutomaticallyCancelled,
    startDeleteAccountBackgroundTaskMonitoring,
    stopDeleteAccountBackgroundTaskMonitoring,
    clearDeleteAccountBackgroundTaskProgress,
    forceStopDeleteAccountBackgroundTask,
    resetDeleteAccountForceStoppedFlag,
    resetAutomaticallyCancelledFlag,
  };

  return (
    <DeleteAccountBackgroundTaskContext.Provider value={value}>
      {children}
    </DeleteAccountBackgroundTaskContext.Provider>
  );
};
