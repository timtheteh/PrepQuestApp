import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';
import { strings } from '@/constants/strings';

// Progress key for import background tasks
const IMPORT_BG_TASK_PROGRESS_KEY = 'importDataBgTaskProgress';

interface ImportBackgroundTaskContextType {
  isImportBackgroundTaskRunning: boolean;
  isImportCleanupInProgress: boolean;
  isImportStopping: boolean;
  importBackgroundTaskProgress: any | null;
  wasAutomaticallyCancelled: boolean;
  startImportBackgroundTaskMonitoring: () => void;
  stopImportBackgroundTaskMonitoring: () => void;
  clearImportBackgroundTaskProgress: () => Promise<void>;
  forceStopImportBackgroundTask: () => void;
  resetImportForceStoppedFlag: () => void;
  resetAutomaticallyCancelledFlag: () => void;
}

const ImportBackgroundTaskContext = createContext<ImportBackgroundTaskContextType | undefined>(undefined);

export const useImportBackgroundTask = () => {
  const context = useContext(ImportBackgroundTaskContext);
  if (!context) {
    throw new Error('useImportBackgroundTask must be used within a ImportBackgroundTaskProvider');
  }
  return context;
};

interface ImportBackgroundTaskProviderProps {
  children: React.ReactNode;
}

export const ImportBackgroundTaskProvider: React.FC<ImportBackgroundTaskProviderProps> = ({ children }) => {
  const [isImportBackgroundTaskRunning, setIsImportBackgroundTaskRunning] = useState(false);
  const [isImportCleanupInProgress, setIsImportCleanupInProgress] = useState(false);
  const [isImportStopping, setIsImportStopping] = useState(false);
  const [importBackgroundTaskProgress, setImportBackgroundTaskProgress] = useState<any | null>(null);
  const [wasAutomaticallyCancelled, setWasAutomaticallyCancelled] = useState(false);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  const localeStrings = strings[language] ?? strings.English;
  const englishImportNotifications = strings.English.notifications.import;
  const importNotifications = localeStrings.notifications?.import ?? englishImportNotifications;
  const {
    backgroundWarningTitle = englishImportNotifications.backgroundWarningTitle,
    backgroundWarningBody = englishImportNotifications.backgroundWarningBody,
    preTerminationTitle = englishImportNotifications.preTerminationTitle,
    preTerminationBody = englishImportNotifications.preTerminationBody,
  } = importNotifications;
  
  // Use a ref to track the current state for immediate access
  const isImportBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track cleanup state for immediate access
  const isImportCleanupInProgressRef = useRef(false);
  
  // Ref to track stopping state for immediate access
  const isImportStoppingRef = useRef(false);
  
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
    isImportBackgroundTaskRunningRef.current = isImportBackgroundTaskRunning;
  }, [isImportBackgroundTaskRunning]);

  React.useEffect(() => {
    isImportCleanupInProgressRef.current = isImportCleanupInProgress;
  }, [isImportCleanupInProgress]);

  React.useEffect(() => {
    isImportStoppingRef.current = isImportStopping;
  }, [isImportStopping]);

  // Helper to load progress from AsyncStorage
  const loadImportBackgroundTaskProgress = async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(IMPORT_BG_TASK_PROGRESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load import background task progress', e);
      return null;
    }
  };

  // Helper to clear progress
  const clearImportBackgroundTaskProgress = async () => {
    try {
      console.log('Starting import progress cleanup...');
      
      // Set cleanup flags to prevent new operations and notifications
      setIsImportCleanupInProgress(true);
      isClearingProgressRef.current = true;
      
      // Mark task as completed before clearing
      const currentProgress = await loadImportBackgroundTaskProgress();
      if (currentProgress && currentProgress.inProgress && !currentProgress.completed) {
        await AsyncStorage.setItem(IMPORT_BG_TASK_PROGRESS_KEY, JSON.stringify({
          ...currentProgress,
          inProgress: false,
          completed: true
        }));
      }
      
      // Complete cleanup with proper sequencing
      await AsyncStorage.removeItem(IMPORT_BG_TASK_PROGRESS_KEY);
      setImportBackgroundTaskProgress(null);
      setIsImportBackgroundTaskRunning(false);
      
      // Reset last progress ref to allow future updates
      lastProgressRef.current = null;
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Import progress cleanup completed');
      
      // Reset cleanup flags
      setTimeout(() => {
        isClearingProgressRef.current = false;
        setIsImportCleanupInProgress(false);
        setIsImportStopping(false);
        console.log('Import cleanup state reset - ready for new import');
      }, 100);
      
    } catch (e) {
      console.error('Failed to clear import background task progress', e);
      // Reset cleanup flags on error
      isClearingProgressRef.current = false;
      setIsImportCleanupInProgress(false);
      setIsImportStopping(false);
    }
  };

  // Helper to force stop background task immediately
  const forceStopImportBackgroundTask = React.useCallback(() => {
    console.log('Force stopping import background task...');
    console.log('Before force stop - isImportBackgroundTaskRunning:', isImportBackgroundTaskRunningRef.current);
    
    // Set stopping state to prevent new import attempts during shutdown
    setIsImportStopping(true);
    
    // Set cleanup in progress to prevent new operations
    setIsImportCleanupInProgress(true);
    
    // Set force stopped flag
    forceStoppedRef.current = true;
    
    // Stop monitoring completely to prevent interference
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Update ref immediately
    isImportBackgroundTaskRunningRef.current = false;
    
    // Force immediate state update
    setIsImportBackgroundTaskRunning(false);
    setImportBackgroundTaskProgress(null);
    
    console.log('After force stop - import is now in stopping phase');
  }, []);

  // Helper to reset force stopped flag
  const resetImportForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting import force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Helper to reset automatically cancelled flag
  const resetAutomaticallyCancelledFlag = React.useCallback(() => {
    console.log('Resetting automatically cancelled flag...');
    setWasAutomaticallyCancelled(false);
  }, []);

  // Helper to automatically cancel import (replicates manual cancellation logic)
  const automaticallyCancelImport = React.useCallback(async () => {
    try {
      console.log('Automatically cancelling import after 30 seconds in background...');
      
      // Set the automatic cancellation flag
      setWasAutomaticallyCancelled(true);
      
      // IMMEDIATELY set local stopping state to prevent new import attempts
      // This provides instant UI feedback before context state updates
      setIsImportStopping(true);
      console.log('Automatic cancellation - setting stopping state immediately');
      
      // Force stop the import background task permanently
      forceStopImportBackgroundTask();
      
      // Stop the actual background service
      try {
        const { stopImportBackgroundTask } = await import('../utils/importBackgroundTask');
        await stopImportBackgroundTask();
      } catch (importError) {
        console.error('Error importing stopImportBackgroundTask:', importError);
      }
      
      // Clear the import progress data thoroughly
      await clearImportBackgroundTaskProgress();
      
      // Additional cleanup: manually remove all import-related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'importDataBgTaskProgress',
          'importProgress',
          'importState'
        ]);
        console.log('Additional AsyncStorage cleanup completed (automatic cancellation)');
        
        // Verify cleanup worked
        const remainingProgress = await AsyncStorage.getItem('importDataBgTaskProgress');
        if (remainingProgress) {
          console.warn('Warning: import progress still exists after automatic cleanup:', remainingProgress);
        } else {
          console.log('Confirmed: import progress completely cleared (automatic)');
        }
      } catch (cleanupError) {
        console.warn('Additional cleanup failed (automatic):', cleanupError);
      }
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Import task automatically cancelled successfully');
      
    } catch (error) {
      console.error('Error automatically cancelling import task:', error);
    }
  }, [forceStopImportBackgroundTask, clearImportBackgroundTaskProgress]);

  // Start monitoring background task progress
  const startImportBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Starting import background task monitoring...');
    console.log('Current monitoring interval:', monitoringIntervalRef.current);
    
    // Stop any existing monitoring to prevent multiple intervals
    if (monitoringIntervalRef.current) {
      console.log('Stopping existing monitoring interval before starting new one');
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    // Reset force stopped flag when starting monitoring
    forceStoppedRef.current = false;
    
    // Immediately check for existing progress when monitoring starts
    console.log('ImportBackgroundTaskContext - Checking for existing progress immediately...');
    
    const checkProgress = async () => {
      try {
        const progress = await loadImportBackgroundTaskProgress();
        
        if (progress) {
          console.log('ImportBackgroundTaskContext - Progress update:', {
            inProgress: progress.inProgress,
            completed: progress.completed,
            status: progress.status,
            hasError: !!progress.error,
            networkError: !!progress.networkError,
            isCloudImportPhase: progress.isCloudImportPhase,
            timestamp: progress.timestamp,
            percentage: progress.percentage
          });
          
          // Clear stale progress data that might be causing issues
          if ((progress.inProgress || progress.stage === 'counting') && !progress.completed && !progress.error && !progress.networkError) {
            const now = Date.now();
            const progressTime = progress.timestamp || 0;
            const timeDiff = now - progressTime;
            
            // If the progress is older than 10 minutes, consider it stale
            if (timeDiff > 10 * 60 * 1000) {
              console.log('Clearing stale import background task progress data (older than 10 minutes)');
              await clearImportBackgroundTaskProgress();
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
            console.log('ImportBackgroundTaskContext - Setting new progress data');
            lastProgressRef.current = progressId;
            setImportBackgroundTaskProgress(progress);
          } else {
            console.log('ImportBackgroundTaskContext - Skipping duplicate progress update');
          }
          
          // Check if task is running
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const timeDiff = now - progressTime;
          const isRecent = timeDiff < 30 * 1000; // 30 seconds
          
          // Check if task is running - include counting stage as running
          const isTaskRunning = progress.inProgress && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError && !forceStoppedRef.current;
          const isCountingStage = progress.stage === 'counting' && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError;
          
          console.log('ImportBackgroundTaskContext - Task running check:', {
            isTaskRunning,
            isCountingStage,
            stage: progress.stage,
            inProgress: progress.inProgress,
            completed: progress.completed,
            cancelled: progress.cancelled,
            error: progress.error,
            networkError: progress.networkError
          });
          
          if (isTaskRunning || isCountingStage) {
            console.log('ImportBackgroundTaskContext - Setting import as running');
            if (!isImportBackgroundTaskRunningRef.current) {
              console.log('ImportBackgroundTaskContext - Import state changed from NOT running to RUNNING');
            }
            setIsImportBackgroundTaskRunning(true);
          } else if (progress.completed || progress.cancelled || progress.error || progress.networkError || forceStoppedRef.current) {
            // Task completed, cancelled, failed, or force stopped
            setIsImportBackgroundTaskRunning(false);
            
            // Clear stopping state when import is no longer active
            if (isImportStoppingRef.current) {
              console.log('Import no longer running - clearing stopping state');
              setIsImportStopping(false);
            }
            
            // Clear any pending termination timer since import is no longer running
            if (backgroundTerminationTimerRef.current) {
              clearTimeout(backgroundTerminationTimerRef.current);
              backgroundTerminationTimerRef.current = null;
              console.log('Cleared background termination timer - import no longer running');
            }
            
            // Clear any pending pre-termination notification timer since import is no longer running
            if (preTerminationNotificationTimerRef.current) {
              clearTimeout(preTerminationNotificationTimerRef.current);
              preTerminationNotificationTimerRef.current = null;
              console.log('Cleared pre-termination notification timer - import no longer running');
            }
            
            // Since notifications are now sent directly from the background task,
            // we only need to handle progress clearing here
            // For successful completions, we don't auto-clear to allow app settings page to show persistent success modal
            if (progress.completed && !progress.error && !progress.networkError && !progress.cancelled && !forceStoppedRef.current) {
              // Don't auto-clear successful import progress - let app settings page handle it
              console.log('Import completed successfully - keeping progress for app settings page');
            } else if (progress.cancelled || progress.error || progress.networkError) {
              // Only clear progress for cancelled or failed imports
              console.log('Scheduling import progress cleanup in 3 seconds for:', {
                cancelled: progress.cancelled,
                error: progress.error,
                networkError: progress.networkError,
                isCloudImportPhase: progress.isCloudImportPhase
              });
              setTimeout(async () => {
                try {
                  await clearImportBackgroundTaskProgress();
                  console.log('Cleared import background task progress after UI delay (cancelled/error)');
                } catch (error) {
                  console.error('Error clearing import background task progress:', error);
                }
              }, 3000); // 3 second delay to allow UI to show completion
            }
          } else {
            // If progress exists but doesn't have inProgress flag, check if it's recent
            if (isRecent && !progress.error && !progress.networkError && !progress.cancelled && !forceStoppedRef.current) {
              setIsImportBackgroundTaskRunning(true);
            } else {
              setIsImportBackgroundTaskRunning(false);
            }
          }
        } else {
          setIsImportBackgroundTaskRunning(false);
          setImportBackgroundTaskProgress(null);
          
          // Clear stopping state when no progress data exists
          if (isImportStoppingRef.current) {
            console.log('No import progress - clearing stopping state');
            setIsImportStopping(false);
          }
        }
      } catch (error) {
        console.error('Error checking import background task progress:', error);
      }
    };

    // Check immediately and then repeatedly
    checkProgress();
    
    // Set up interval to check every 1 second
    monitoringIntervalRef.current = setInterval(checkProgress, 1000);
    
    // Also check again after a short delay to catch any progress that was just saved
    setTimeout(() => {
      checkProgress();
    }, 100);
  }, []);

  // Stop monitoring
  const stopImportBackgroundTaskMonitoring = React.useCallback(() => {
    console.log('Stopping import background task monitoring...');
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
        // App is foregrounded - check if there's an import background task running
        const progress = await loadImportBackgroundTaskProgress();
        const isImportRunning = progress && (progress.inProgress || progress.stage === 'counting') && !progress.completed;
        if (isImportRunning) {
          // Resume monitoring
          startImportBackgroundTaskMonitoring();
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
        // App is going to background - check if import is running
        console.log('App backgrounded - checking if import is running:', isImportBackgroundTaskRunningRef.current);
        
        // Check progress directly instead of relying on the ref which might not be updated yet
        const currentProgress = await loadImportBackgroundTaskProgress();
        const isImportActuallyRunning = currentProgress && (currentProgress.inProgress || currentProgress.stage === 'counting') && !currentProgress.completed && !currentProgress.cancelled && !currentProgress.error && !currentProgress.networkError;
        
        console.log('App backgrounded - direct progress check:', {
          refValue: isImportBackgroundTaskRunningRef.current,
          directCheck: isImportActuallyRunning,
          progress: currentProgress ? { stage: currentProgress.stage, inProgress: currentProgress.inProgress, completed: currentProgress.completed } : null
        });
        
        if (isImportBackgroundTaskRunningRef.current || isImportActuallyRunning) {
          console.log('App backgrounded during import - scheduling warning notification');
          
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
              console.log('Background warning notification timer fired - checking import status');
              // Double-check import is still running before sending notification
              const progress = await loadImportBackgroundTaskProgress();
              const isImportRunning = progress && (progress.inProgress || progress.stage === 'counting') && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError;
              console.log('Background warning notification check:', {
                progress: progress ? { 
                  stage: progress.stage, 
                  inProgress: progress.inProgress, 
                  completed: progress.completed,
                  status: progress.status,
                  timestamp: progress.timestamp
                } : null,
                isImportRunning,
                currentTime: Date.now()
              });
              if (isImportRunning) {
                console.log('Background warning notification: Import is running, sending notification...');
                
                // Check notification permissions first
                try {
                  const { status: permissionStatus } = await Notifications.getPermissionsAsync();
                  console.log('Background warning notification: Permission status:', permissionStatus);
                  
                  if (permissionStatus === 'granted') {
                    const title = backgroundWarningTitle;
                    const body = backgroundWarningBody;
                    
                    try {
                      const notificationId = await Notifications.scheduleNotificationAsync({
                        content: {
                          title,
                          body,
                          data: { type: 'import_background_warning' },
                          sound: true,
                          priority: Notifications.AndroidNotificationPriority.HIGH,
                        },
                        trigger: null, // Send immediately
                      });
                      
                      console.log('Background warning notification sent successfully with ID:', notificationId);
                    } catch (notificationError) {
                      console.error('Background warning notification: Failed to send notification:', notificationError);
                    }
                  } else {
                    console.log('Background warning notification: Permission not granted, cannot send notification');
                  }
                } catch (permissionError) {
                  console.error('Background warning notification: Error checking permissions:', permissionError);
                }
              } else {
                console.log('Import no longer running - skipping background warning notification');
              }
            } catch (error) {
              console.error('Error sending background warning notification:', error);
            }
          }, 1000); // 1 second delay
          
          // Schedule pre-termination notification for 9 seconds after backgrounding (1 second before termination)
          preTerminationNotificationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check import is still running before sending notification
              const progress = await loadImportBackgroundTaskProgress();
              const isImportRunning = progress && (progress.inProgress || progress.stage === 'counting') && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError;
              if (isImportRunning) {
                const title = preTerminationTitle;
                const body = preTerminationBody;
                
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title,
                    body,
                    data: { type: 'import_pre_termination' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null, // Send immediately
                });
                
                console.log('Pre-termination notification sent successfully');
              } else {
                console.log('Import no longer running - skipping pre-termination notification');
              }
            } catch (error) {
              console.error('Error sending pre-termination notification:', error);
            }
          }, 29000); // 29 second delay (1 second before 30-second termination)
          
          // Schedule automatic termination for 30 seconds after backgrounding
          backgroundTerminationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check import is still running before terminating
              const progress = await loadImportBackgroundTaskProgress();
              const isImportRunning = progress && (progress.inProgress || progress.stage === 'counting') && !progress.completed && !progress.cancelled && !progress.error && !progress.networkError;
              if (isImportRunning) {
                console.log('30 seconds elapsed in background - automatically terminating import task');
                await automaticallyCancelImport();
              } else {
                console.log('Import no longer running - skipping automatic termination');
              }
            } catch (error) {
              console.error('Error during automatic import termination:', error);
            }
          }, 30000); // 30 second delay
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clear any stale import background task data on app start
    const clearStaleData = async () => {
      try {
        const progress = await loadImportBackgroundTaskProgress();
        const isImportRunning = progress && (progress.inProgress || progress.stage === 'counting') && !progress.completed;
        if (isImportRunning) {
          console.log('Clearing stale import background task data on app start');
          await clearImportBackgroundTaskProgress();
        }
      } catch (error) {
        console.error('Error clearing stale import background task data:', error);
      }
    };
    
    // Clear stale data first, then start monitoring
    clearStaleData().then(() => {
      startImportBackgroundTaskMonitoring();
    });

    return () => {
      subscription.remove();
      stopImportBackgroundTaskMonitoring();
      
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
  }, [startImportBackgroundTaskMonitoring, stopImportBackgroundTaskMonitoring]);

  const value: ImportBackgroundTaskContextType = {
    isImportBackgroundTaskRunning,
    isImportCleanupInProgress,
    isImportStopping,
    importBackgroundTaskProgress,
    wasAutomaticallyCancelled,
    startImportBackgroundTaskMonitoring,
    stopImportBackgroundTaskMonitoring,
    clearImportBackgroundTaskProgress,
    forceStopImportBackgroundTask,
    resetImportForceStoppedFlag,
    resetAutomaticallyCancelledFlag,
  };

  return (
    <ImportBackgroundTaskContext.Provider value={value}>
      {children}
    </ImportBackgroundTaskContext.Provider>
  );
};
