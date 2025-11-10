import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import NotificationService from '../utils/notifications';
import { useLanguage } from './LanguageContext';
import { strings } from '@/constants/strings';

// Progress key for background tasks
const BG_TASK_PROGRESS_KEY = 'genAIDeckCreationBgTaskProgress';

interface BackgroundTaskContextType {
  isBackgroundTaskRunning: boolean;
  backgroundTaskProgress: any | null;
  wasAutomaticallyCancelled: boolean;
  isNotificationDismissed: boolean;
  showBackgroundTaskNotification: boolean;
  setShowBackgroundTaskNotification: (show: boolean) => void;
  startBackgroundTaskMonitoring: () => void;
  stopBackgroundTaskMonitoring: () => void;
  clearBackgroundTaskProgress: () => Promise<void>;
  forceStopBackgroundTask: (preserveProgressForNotification?: boolean) => void;
  resetForceStoppedFlag: () => void;
  resetAutomaticallyCancelledFlag: () => void;
  cancelDeckCreationTaskDueToNetworkError: () => Promise<void>;
  cancelDeckCreationTaskDueToTranscriptError: (errorMessage: string) => Promise<void>;
  dismissNotification: () => void;
  resetNotificationDismissed: () => void;
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
  const [wasAutomaticallyCancelled, setWasAutomaticallyCancelled] = useState(false);
  const [isNotificationDismissed, setIsNotificationDismissed] = useState(false);
  const [showBackgroundTaskNotification, setShowBackgroundTaskNotification] = useState(false);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { language } = useLanguage();
  const notificationService = NotificationService.getInstance();
  const localeStrings = strings[language] ?? strings.English;
  const englishDeckNotifications = strings.English.notifications.deckCreation;
  const deckCreationNotifications = localeStrings.notifications?.deckCreation ?? englishDeckNotifications;
  const {
    backgroundWarningTitle = englishDeckNotifications.backgroundWarningTitle,
    backgroundWarningBody = englishDeckNotifications.backgroundWarningBody,
    preTerminationTitle = englishDeckNotifications.preTerminationTitle,
    preTerminationBody = englishDeckNotifications.preTerminationBody,
  } = deckCreationNotifications;
  
  // Use a ref to track the current state for immediate access
  const isBackgroundTaskRunningRef = useRef(false);
  
  // Flag to track if we've force stopped the task
  const forceStoppedRef = useRef(false);
  
  // Flag to track if progress is being cleared
  const isClearingProgressRef = useRef(false);
  
  // Ref to track the last progress data to prevent duplicate updates
  const lastProgressRef = useRef<string | null>(null);
  
  // Ref to track background warning notification timer
  const backgroundWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to track automatic termination timer (30 seconds after backgrounding)
  const backgroundTerminationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to track pre-termination notification timer (1 second before termination)
  const preTerminationNotificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
      setTimeout(() => {
        setBackgroundTaskProgress(null);
        setIsBackgroundTaskRunning(false);
      }, 0);
      
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
  const forceStopBackgroundTask = React.useCallback((preserveProgressForNotification = false) => {
    console.log('Force stopping background task...', { preserveProgressForNotification });
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
    setTimeout(() => {
      setIsBackgroundTaskRunning(false);
      
      // Only clear progress immediately if we're not preserving it for notification
      if (!preserveProgressForNotification) {
        setBackgroundTaskProgress(null);
      }
    }, 0);
    
    console.log('After force stop - isBackgroundTaskRunning should be false');
  }, []);

  // Helper to reset force stopped flag
  const resetForceStoppedFlag = React.useCallback(() => {
    console.log('Resetting force stopped flag...');
    forceStoppedRef.current = false;
  }, []);

  // Helper to reset automatically cancelled flag
  const resetAutomaticallyCancelledFlag = React.useCallback(() => {
    console.log('Resetting automatically cancelled flag...');
    setWasAutomaticallyCancelled(false);
  }, []);

  // Helper to automatically cancel deck creation task (replicates manual cancellation logic)
  const automaticallyCancelDeckCreationTask = React.useCallback(async () => {
    try {
      console.log('Automatically cancelling deck creation task after 30 seconds in background...');
      
      // Set the automatic cancellation flag FIRST
      setWasAutomaticallyCancelled(true);
      
      // Stop the actual background service
      try {
        if (BackgroundService.isRunning()) {
          await BackgroundService.stop();
          console.log('Background service stopped during automatic cancellation');
        }
      } catch (serviceError) {
        console.error('Error stopping background service during automatic cancellation:', serviceError);
      }
      
      // Update progress to indicate cancellation instead of clearing it immediately
      try {
        const currentProgress = await loadBackgroundTaskProgress();
        if (currentProgress) {
          const cancelledProgress = {
            ...currentProgress,
            inProgress: false,
            completed: false,
            cancelled: true,
            automaticallyCancelled: true,
            error: true, // Add this flag for in-app notification
            timestamp: Date.now()
          };
          
          // Save the cancelled progress so UI can detect it
          await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify(cancelledProgress));
          setBackgroundTaskProgress(cancelledProgress);
          console.log('Updated progress to indicate automatic cancellation');
        }
      } catch (progressError) {
        console.error('Error updating progress for automatic cancellation:', progressError);
      }
      
      // Force stop the background task but preserve progress for notification
      forceStopBackgroundTask(true);
      
      // Additional cleanup: manually remove other deck creation related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'deckCreationProgress',
          'deckCreationState'
        ]);
        console.log('Additional AsyncStorage cleanup completed (automatic cancellation)');
      } catch (cleanupError) {
        console.warn('Additional cleanup failed (automatic):', cleanupError);
      }
      
      // Delay the final progress cleanup to give UI components time to react and show notification
      setTimeout(async () => {
        try {
          console.log('Performing delayed cleanup after automatic cancellation...');
          await clearBackgroundTaskProgress();
        } catch (error) {
          console.error('Error in delayed cleanup after automatic cancellation:', error);
        }
      }, 2000); // 2 second delay to allow UI components to detect the cancellation
      
      console.log('Deck creation task automatically cancelled successfully');
      
    } catch (error) {
      console.error('Error automatically cancelling deck creation task:', error);
    }
  }, [forceStopBackgroundTask, clearBackgroundTaskProgress, loadBackgroundTaskProgress]);

  // Helper to cancel deck creation task due to network error (similar to automatic cancellation)
  const cancelDeckCreationTaskDueToNetworkError = React.useCallback(async () => {
    try {
      console.log('Cancelling deck creation task due to network error...');
      
      // Set the automatic cancellation flag FIRST (reuse the same flag for consistency)
      setWasAutomaticallyCancelled(true);
      
      // Stop the actual background service
      try {
        if (BackgroundService.isRunning()) {
          await BackgroundService.stop();
          console.log('Background service stopped during network error cancellation');
        }
      } catch (serviceError) {
        console.error('Error stopping background service during network error cancellation:', serviceError);
      }
      
      // Update progress to indicate network error cancellation instead of clearing it immediately
      try {
        const currentProgress = await loadBackgroundTaskProgress();
        if (currentProgress) {
          const cancelledProgress = {
            ...currentProgress,
            inProgress: false,
            completed: false,
            cancelled: true,
            networkErrorCancelled: true,
            networkError: true, // Add this flag for in-app notification
            error: true, // Add this flag for error state
            timestamp: Date.now()
          };
          
          // Save the cancelled progress so UI can detect it
          await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify(cancelledProgress));
          setBackgroundTaskProgress(cancelledProgress);
          console.log('Updated progress to indicate network error cancellation');
        }
      } catch (progressError) {
        console.error('Error updating progress for network error cancellation:', progressError);
      }
      
      // Force stop the background task but preserve progress for notification
      forceStopBackgroundTask(true);
      
      // Additional cleanup: manually remove other deck creation related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'deckCreationProgress',
          'deckCreationState'
        ]);
        console.log('Additional AsyncStorage cleanup completed (network error cancellation)');
      } catch (cleanupError) {
        console.warn('Additional cleanup failed (network error):', cleanupError);
      }
      
      // Delay the final progress cleanup to give UI components time to react and show notification
      setTimeout(async () => {
        try {
          console.log('Performing delayed cleanup after network error cancellation...');
          await clearBackgroundTaskProgress();
        } catch (error) {
          console.error('Error in delayed cleanup after network error cancellation:', error);
        }
      }, 2000); // 2 second delay to allow UI components to detect the cancellation and show notification
      
      console.log('Deck creation task cancelled due to network error successfully');
      
    } catch (error) {
      console.error('Error cancelling deck creation task due to network error:', error);
    }
  }, [forceStopBackgroundTask, clearBackgroundTaskProgress, loadBackgroundTaskProgress]);

  // Helper to cancel deck creation task due to transcript error (similar to network error cancellation)
  const cancelDeckCreationTaskDueToTranscriptError = React.useCallback(async (errorMessage: string) => {
    try {
      console.log('Cancelling deck creation task due to transcript error...');
      
      // Set the automatic cancellation flag FIRST (reuse the same flag for consistency)
      setWasAutomaticallyCancelled(true);
      
      // Stop the actual background service
      try {
        if (BackgroundService.isRunning()) {
          await BackgroundService.stop();
          console.log('Background service stopped during transcript error cancellation');
        }
      } catch (serviceError) {
        console.error('Error stopping background service during transcript error cancellation:', serviceError);
      }
      
      // Update progress to indicate transcript error cancellation instead of clearing it immediately
      try {
        const currentProgress = await loadBackgroundTaskProgress();
        if (currentProgress) {
          const cancelledProgress = {
            ...currentProgress,
            inProgress: false,
            completed: false,
            cancelled: true,
            transcriptErrorCancelled: true,
            transcriptError: true, // Add this flag for in-app notification
            error: true, // Add this flag for error state
            errorMessage: errorMessage, // Store the specific error message
            timestamp: Date.now()
          };
          
          // Save the cancelled progress so UI can detect it
          await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify(cancelledProgress));
          setBackgroundTaskProgress(cancelledProgress);
          console.log('Updated progress to indicate transcript error cancellation');
        }
      } catch (progressError) {
        console.error('Error updating progress for transcript error cancellation:', progressError);
      }
      
      // Force stop the background task but preserve progress for notification
      forceStopBackgroundTask(true);
      
      // Additional cleanup: manually remove other deck creation related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'deckCreationProgress',
          'deckCreationState'
        ]);
        console.log('Additional AsyncStorage cleanup completed (transcript error cancellation)');
      } catch (cleanupError) {
        console.warn('Additional cleanup failed (transcript error):', cleanupError);
      }
      
      // Delay the final progress cleanup to give UI components time to react and show notification
      setTimeout(async () => {
        try {
          console.log('Performing delayed cleanup after transcript error cancellation...');
          await clearBackgroundTaskProgress();
        } catch (error) {
          console.error('Error in delayed cleanup after transcript error cancellation:', error);
        }
      }, 2000); // 2 second delay to allow UI components to detect the cancellation and show notification
      
      console.log('Deck creation task cancelled due to transcript error successfully');
      
    } catch (error) {
      console.error('Error cancelling deck creation task due to transcript error:', error);
    }
  }, [forceStopBackgroundTask, clearBackgroundTaskProgress, loadBackgroundTaskProgress]);

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
    
    // Reset automatically cancelled flag when starting monitoring (for new tasks)
    setTimeout(() => {
      setWasAutomaticallyCancelled(false);
      
      // Clear any existing progress data to prevent interference from previous tasks
      console.log('🧹 BackgroundTaskContext - Clearing existing progress data before starting new task');
      setBackgroundTaskProgress(null);
    }, 0);
    
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
          // CRITICAL: Never mark as running if task is completed, cancelled, automatically cancelled, or has error
          if (progress.inProgress && !progress.completed && !progress.cancelled && !progress.automaticallyCancelled && !progress.error && !forceStoppedRef.current) {
            console.log('BackgroundTaskContext: Setting isBackgroundTaskRunning = TRUE (task in progress)');
            // Defer state updates to avoid insertion effect conflicts
            setTimeout(() => {
              setIsBackgroundTaskRunning(true);
              // Reset notification dismissed state when task starts
              setIsNotificationDismissed(false);
            }, 0);
          } else if (progress.completed || progress.cancelled || progress.automaticallyCancelled || progress.error || forceStoppedRef.current) {
            // Task completed, cancelled, automatically cancelled, failed, or force stopped
            console.log('BackgroundTaskContext: Setting isBackgroundTaskRunning = FALSE (task completed/cancelled/error)', {
              completed: progress.completed,
              cancelled: progress.cancelled,
              automaticallyCancelled: progress.automaticallyCancelled,
              error: progress.error,
              forceStoppedRef: forceStoppedRef.current
            });
            setTimeout(() => {
              setIsBackgroundTaskRunning(false);
            }, 0);
            
            // Clear any pending termination timer since task is no longer running
            if (backgroundTerminationTimerRef.current) {
              clearTimeout(backgroundTerminationTimerRef.current);
              backgroundTerminationTimerRef.current = null;
              console.log('Cleared background termination timer - task no longer running');
            }
            
            // Clear any pending pre-termination notification timer since task is no longer running
            if (preTerminationNotificationTimerRef.current) {
              clearTimeout(preTerminationNotificationTimerRef.current);
              preTerminationNotificationTimerRef.current = null;
              console.log('Cleared pre-termination notification timer - task no longer running');
            }
            
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
              // Do NOT clear progress here while app is in background.
              // Leave it so the status page can show completed statuses when user taps the notification.
            } else if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current && progress.notificationSent) {
              // Only clear after app is active so the status page can render completed states.
              if (appStateRef.current === 'active') {
                console.log('Task completed and notification already sent - clearing progress with delay for UI (app active)');
                setTimeout(async () => {
                  try {
                    await clearBackgroundTaskProgress();
                    console.log('Cleared background task progress after UI delay (notification already sent, app active)');
                  } catch (error) {
                    console.error('Error clearing background task progress:', error);
                  }
                }, 1000); // 2.5 second delay to allow status page to navigate
              } else {
                // App not active; keep progress until app becomes active
                console.log('Notification sent while app in background - deferring progress clear until app is active');
              }
            } else if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current && appStateRef.current === 'active') {
              console.log('Task completed while app is active - no notification needed');
              
              // Clear progress after a brief delay to allow UI components to react to completion
              setTimeout(async () => {
                try {
                  await clearBackgroundTaskProgress();
                  console.log('Cleared background task progress after UI delay (app is active)');
                } catch (error) {
                  console.error('Error clearing background task progress:', error);
                }
              }, 1000); // 2.5 second delay to allow status page to navigate
            } else if (progress.completed && !progress.error && !progress.cancelled && !forceStoppedRef.current) {
              // Fallback case - clear progress if completed but not handled above
              try {
                await clearBackgroundTaskProgress();
                console.log('Cleared background task progress immediately (fallback)');
              } catch (error) {
                console.error('Error clearing background task progress (fallback):', error);
              }
            }
          } else {
            // If progress exists but doesn't have inProgress flag, check if it's recent
            // This handles edge cases where progress might exist but not be properly marked
            // IMPORTANT: Never set running=true if task is completed, even if recent
            if (isRecent && !progress.completed && !progress.error && !progress.cancelled && !progress.automaticallyCancelled && !forceStoppedRef.current) {
              console.log('BackgroundTaskContext: Setting isBackgroundTaskRunning = TRUE (fallback - recent progress without inProgress flag)');
              setTimeout(() => {
                setIsBackgroundTaskRunning(true);
                // Reset notification dismissed state when task starts
                setIsNotificationDismissed(false);
              }, 0);
            } else {
              console.log('BackgroundTaskContext: Setting isBackgroundTaskRunning = FALSE (fallback - not recent or completed/cancelled/error)', {
                isRecent,
                completed: progress.completed,
                error: progress.error,
                cancelled: progress.cancelled,
                automaticallyCancelled: progress.automaticallyCancelled,
                forceStoppedRef: forceStoppedRef.current
              });
              setTimeout(() => {
                setIsBackgroundTaskRunning(false);
              }, 0);
            }
          }
        } else {
          setTimeout(() => {
            setIsBackgroundTaskRunning(false);
            setBackgroundTaskProgress(null);
          }, 0);
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
    // Ensure notifications are initialized (permissions, channels, handler)
    notificationService.initialize().catch(() => {});

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is foregrounded - check if there's a background task running
        const progress = await loadBackgroundTaskProgress();
        if (progress && progress.inProgress && !progress.completed) {
          // Resume monitoring
          startBackgroundTaskMonitoring();
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
        // App is going to background - check if deck creation task is running
        if (isBackgroundTaskRunningRef.current) {
          console.log('App backgrounded during deck creation task - scheduling warning notification');
          
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
              // Double-check deck creation task is still running before sending notification
              const progress = await loadBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                const title = backgroundWarningTitle;
                const body = backgroundWarningBody;
                
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title,
                    body,
                    data: { type: 'deck_creation_background_warning' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null, // Send immediately
                });
                
                console.log('Background warning notification sent successfully');
              } else {
                console.log('Deck creation task no longer running - skipping background warning notification');
              }
            } catch (error) {
              console.error('Error sending background warning notification:', error);
            }
          }, 1000); // 1 second delay
          
          // Schedule pre-termination notification for 29 seconds after backgrounding (1 second before termination)
          preTerminationNotificationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check deck creation task is still running before sending notification
              const progress = await loadBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                const title = preTerminationTitle;
                const body = preTerminationBody;
                
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title,
                    body,
                    data: { type: 'deck_creation_pre_termination' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null, // Send immediately
                });
                
                console.log('Pre-termination notification sent successfully');
              } else {
                console.log('Deck creation task no longer running - skipping pre-termination notification');
              }
            } catch (error) {
              console.error('Error sending pre-termination notification:', error);
            }
          }, 59000); // 29 second delay (1 second before 30-second termination)
          
          // Schedule automatic termination for 30 seconds after backgrounding
          backgroundTerminationTimerRef.current = setTimeout(async () => {
            try {
              // Double-check deck creation task is still running before terminating
              const progress = await loadBackgroundTaskProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                console.log('30 seconds elapsed in background - automatically terminating deck creation task');
                await automaticallyCancelDeckCreationTask();
              } else {
                console.log('Deck creation task no longer running - skipping automatic termination');
              }
            } catch (error) {
              console.error('Error during automatic deck creation task termination:', error);
            }
          }, 60000); // 30 second delay
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
  }, [startBackgroundTaskMonitoring, stopBackgroundTaskMonitoring]);

  // Function to dismiss notification globally
  const dismissNotification = React.useCallback(() => {
    console.log('Dismissing notification globally...');
    setTimeout(() => {
      setIsNotificationDismissed(true);
    }, 0);
  }, []);

  // Function to reset notification dismissed state
  const resetNotificationDismissed = React.useCallback(() => {
    console.log('Resetting notification dismissed state...');
    setTimeout(() => {
      setIsNotificationDismissed(false);
    }, 0);
  }, []);

  const value: BackgroundTaskContextType = {
    isBackgroundTaskRunning,
    backgroundTaskProgress,
    wasAutomaticallyCancelled,
    isNotificationDismissed,
    showBackgroundTaskNotification,
    setShowBackgroundTaskNotification,
    startBackgroundTaskMonitoring,
    stopBackgroundTaskMonitoring,
    clearBackgroundTaskProgress,
    forceStopBackgroundTask,
    resetForceStoppedFlag,
    resetAutomaticallyCancelledFlag,
    cancelDeckCreationTaskDueToNetworkError,
    cancelDeckCreationTaskDueToTranscriptError,
    dismissNotification,
    resetNotificationDismissed,
  };

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  );
}; 