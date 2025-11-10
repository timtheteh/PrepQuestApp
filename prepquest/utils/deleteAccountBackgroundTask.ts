import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { deleteAllUserDataFromDatabase } from '../db/deleteAccount';
import { strings } from '@/constants/strings';
import NotificationService from './notifications';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { arePushNotificationsEnabled } from '@/db/users';

// Progress key for delete account background task
const DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY = 'deleteAccountBgTaskProgress';

// Helper to save progress
async function saveDeleteAccountProgress(progress: any) {
  try {
    await AsyncStorage.setItem(DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) { 
    console.error('Failed to save delete account progress', e); 
  }
}

// Helper to load progress
async function loadDeleteAccountProgress(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    console.error('Failed to load delete account progress', e);
    return null; 
  }
}

// Helper to clear progress
async function clearDeleteAccountProgress() {
  try { 
    await AsyncStorage.removeItem(DELETE_ACCOUNT_BG_TASK_PROGRESS_KEY); 
  } catch (e) {
    console.error('Failed to clear delete account progress', e);
  }
}

// Helper to determine if push notification should be sent
async function shouldSendPushNotification(): Promise<boolean> {
  const currentAppState = AppState.currentState;
  const isAppInBackground = currentAppState === 'background' || currentAppState === 'inactive';
  
  // Only send push notification if app is in background/inactive state
  // Don't send if app is active (user is inside the app)
  const shouldSend = isAppInBackground || currentAppState === 'unknown';
  
  console.log('Delete account push notification check:', {
    currentAppState,
    isAppInBackground,
    shouldSend
  });
  
  // Send notification if:
  // 1. App is in background/inactive state (user left the app)
  // 2. App state is unknown (fallback for reliability)
  // Do NOT send if app is active (user is inside the app)
  if (!shouldSend) {
    return false;
  }

  try {
    const enabled = await arePushNotificationsEnabled();
    if (!enabled) {
      console.log('Push notifications disabled by user preference; skipping delete account notification');
    }
    return enabled;
  } catch (error) {
    console.error('Error checking push notification preference for delete account task:', error);
    return false;
  }
}

// Helper to update progress periodically during long operations
async function updateDeleteAccountProgressPeriodically(progressData: any, intervalMs: number = 1000) {
  const interval = setInterval(async () => {
    try {
      // Load current progress to preserve the most recent status
      const currentProgress = await loadDeleteAccountProgress();
      if (currentProgress) {
        // Update only the timestamp while preserving the current status
        await saveDeleteAccountProgress({
          ...currentProgress,
          timestamp: Date.now()
        });
      } else {
        // Fallback to the provided progress data if no current progress exists
        await saveDeleteAccountProgress({
          ...progressData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating delete account progress periodically:', error);
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}

// The background task function for delete account
const deleteAccountBackgroundTask = async (taskDataArguments: any) => {
  const { language, userID } = taskDataArguments;
  const localeStrings = strings[language] ?? strings.English;
  const englishDeleteAccountNotifications = strings.English.notifications.deleteAccount;
  const deleteAccountNotifications = localeStrings.notifications?.deleteAccount ?? englishDeleteAccountNotifications;
  const {
    completedTitle = englishDeleteAccountNotifications.completedTitle,
    completedBody = englishDeleteAccountNotifications.completedBody,
  } = deleteAccountNotifications;
  
  console.log('Delete account background task started for user:', userID);
  
  // Validate userID
  if (!userID || typeof userID !== 'string' || userID.trim() === '') {
    console.error('Invalid userID provided to delete account background task:', userID);
    await saveDeleteAccountProgress({
      status: 'error',
      inProgress: false,
      completed: false,
      error: true,
      errorMessage: 'Invalid user ID provided',
      timestamp: Date.now()
    });
    return;
  }
  
  try {
    // Check if background service is still running
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped, cancelling delete account task');
      return; 
    }
    
    // Record start time to ensure minimum 1 second duration
    const startTime = Date.now();
    
    // Save initial progress - delete account starting immediately
    await saveDeleteAccountProgress({
      status: 'deleteAccountStarted',
      inProgress: true,
      completed: false,
      timestamp: Date.now(),
      percentage: 0,
      message: 'Starting account deletion...'
    });
    
    // Start more frequent progress updates to keep the task alive and update progress in background
    const stopKeepAlive = await updateDeleteAccountProgressPeriodically({ inProgress: true }, 1000);
    
    // Create a cancellation checker function
    const isCancelled = () => {
      const isServiceRunning = BackgroundService.isRunning();
      if (!isServiceRunning) {
        console.log('Delete account cancelled: BackgroundService is no longer running');
      }
      return !isServiceRunning;
    };

    // Update progress - deleting local data
    await saveDeleteAccountProgress({
      status: 'deletingLocalData',
      inProgress: true,
      completed: false,
      timestamp: Date.now(),
      percentage: 25,
      message: 'Deleting local data...'
    });

    // First, delete all user data from local database
    console.log('Starting local data deletion for user:', userID);
    const databaseCleanupSuccess = await deleteAllUserDataFromDatabase(userID);
    
    if (!databaseCleanupSuccess) {
      console.error('Failed to delete local user data for user:', userID);
      await saveDeleteAccountProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        errorMessage: 'Failed to delete local user data',
        timestamp: Date.now()
      });
      return;
    }
    
    console.log('Successfully deleted local user data for user:', userID);

    // Check if cancelled after local data deletion
    if (isCancelled()) {
      console.log('Delete account cancelled after local data deletion');
      await saveDeleteAccountProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now(),
        message: 'Account deletion cancelled'
      });
      return;
    }

    // Update progress - deleting account from Clerk
    await saveDeleteAccountProgress({
      status: 'deletingAccount',
      inProgress: true,
      completed: false,
      timestamp: Date.now(),
      percentage: 75,
      message: 'Deleting account from server...'
    });

    // Note: Clerk account deletion will be handled by the auth context
    // This background task only handles local data deletion
    // The actual Clerk deletion happens in the main thread to ensure proper auth state management
    
    // Ensure minimum 1 second duration before completing
    const elapsedTime = Date.now() - startTime;
    const minimumDuration = 1000; // 1 second
    
    if (elapsedTime < minimumDuration) {
      const remainingTime = minimumDuration - elapsedTime;
      console.log(`Delete account completed in ${elapsedTime}ms, waiting additional ${remainingTime}ms to meet minimum duration`);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    stopKeepAlive();
    
    // Check if the delete account was cancelled or if background service was stopped
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped during delete account, cancelling task');
      await saveDeleteAccountProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now()
      });
      return; 
    }
    
    // Save final progress - local data deletion completed
    await saveDeleteAccountProgress({
      status: 'localDataDeleted',
      inProgress: false,
      completed: true,
      timestamp: Date.now(),
      percentage: 100,
      message: 'Local data deleted successfully. Account deletion will complete shortly.',
      success: true
    });
    
    // Check if we should send a push notification
    if (await shouldSendPushNotification()) {
      try {
        // Check notification permissions first
        const { status: permissionStatus } = await Notifications.getPermissionsAsync();
        
          if (permissionStatus === 'granted') {
            console.log('Sending delete account completion notification (app in background)');
            const title = completedTitle;
            const body = completedBody;
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { type: 'delete_account_completed' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              autoDismiss: false,
            },
            trigger: null, // Send immediately
          });
          
          console.log('Delete account completion notification sent successfully with ID:', notificationId);
          
          // Mark that notification was sent to prevent duplicate in-app notifications
          await saveDeleteAccountProgress({
            status: 'localDataDeleted',
            inProgress: false,
            completed: true,
            notificationSent: true,
            timestamp: Date.now(),
            percentage: 100,
            message: 'Local data deleted successfully. Account deletion will complete shortly.',
            success: true
          });
        } else {
          console.log('Notification permissions not granted, cannot send push notification');
        }
      } catch (notificationError) {
        console.error('Error sending delete account completion notification:', notificationError);
        
        // Fallback: try to send notification even if initial check failed
        try {
          console.log('Attempting fallback delete account completion notification...');
          const title = completedTitle;
          const body = completedBody;
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { type: 'delete_account_completed' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              autoDismiss: false,
            },
            trigger: null, // Send immediately
          });
          
          console.log('Fallback delete account completion notification sent successfully with ID:', notificationId);
        } catch (fallbackError) {
          console.error('Fallback notification also failed:', fallbackError);
        }
      }
    } else {
      console.log('App is active, skipping notification - user will see in-app success modal');
    }
    
  } catch (error) {
    console.error('Error in delete account background task:', error);
    await saveDeleteAccountProgress({
      status: 'error',
      inProgress: false,
      completed: false,
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
};

// Function to start the delete account background task
export const startDeleteAccountBackgroundTask = async (language: string, userID: string) => {
  try {
    // Check if background service is already running to prevent duplicates
    if (BackgroundService.isRunning()) {
      console.log('Background service is already running, skipping delete account start');
      return false;
    }
    
    // Ensure clean state by completely clearing any previous delete account progress
    console.log('Clearing any previous delete account progress before starting fresh delete account');
    await clearDeleteAccountProgress();
    
    // Additional cleanup: remove all delete account-related keys
    try {
      await AsyncStorage.multiRemove([
        'deleteAccountBgTaskProgress',
        'deleteAccountProgress', 
        'deleteAccountState'
      ]);
      console.log('Additional cleanup completed before starting delete account');
    } catch (cleanupError) {
      console.warn('Additional cleanup failed:', cleanupError);
    }
    
    // Add a small delay to ensure AsyncStorage operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await BackgroundService.start(deleteAccountBackgroundTask, {
      taskName: 'DeleteAccount',
      taskTitle: language === 'Chinese' ? '删除账户' : 'Deleting Account',
      taskDesc: language === 'Chinese' ? '正在后台删除您的账户' : 'Your account is being deleted in the background.',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#CC0000',
      parameters: {
        language,
        userID
      },
    });

    // Save initial progress immediately with explicit 0% and fresh state
    await saveDeleteAccountProgress({
      status: 'deleteAccountStarted',
      inProgress: true,
      completed: false,
      cancelled: false,
      error: false,
      timestamp: Date.now(),
      percentage: 0,
      message: 'Starting account deletion...'
    });

    console.log('Fresh delete account task started successfully');
    return true;
  } catch (error) {
    console.error('Failed to start delete account background task:', error);
    return false;
  }
};

// Function to stop the delete account background task
export const stopDeleteAccountBackgroundTask = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
    await clearDeleteAccountProgress();
  } catch (error) {
    console.error('Error stopping delete account background task:', error);
  }
};

// Export the progress management functions
export { saveDeleteAccountProgress, loadDeleteAccountProgress, clearDeleteAccountProgress };
