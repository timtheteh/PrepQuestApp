import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { clearLocalStorageData, ClearDataProgress, restoreDataFromBackup } from '../db/clearData';
import NotificationService from './notifications';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

// Progress key for clear data background task
const CLEAR_DATA_BG_TASK_PROGRESS_KEY = 'clearDataBgTaskProgress';

// Helper to save progress
async function saveClearDataProgress(progress: any) {
  try {
    await AsyncStorage.setItem(CLEAR_DATA_BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) { 
    console.error('Failed to save clear data progress', e); 
  }
}

// Helper to load progress
async function loadClearDataProgress(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(CLEAR_DATA_BG_TASK_PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    console.error('Failed to load clear data progress', e);
    return null; 
  }
}

// Helper to clear progress
async function clearClearDataProgress() {
  try { 
    await AsyncStorage.removeItem(CLEAR_DATA_BG_TASK_PROGRESS_KEY); 
  } catch (e) {
    console.error('Failed to clear clear data progress', e);
  }
}

// Helper to determine if push notification should be sent
function shouldSendPushNotification(): boolean {
  const currentAppState = AppState.currentState;
  const isAppInBackground = currentAppState === 'background' || currentAppState === 'inactive';
  
  // Only send push notification if app is in background/inactive state
  // Don't send if app is active (user is inside the app)
  const shouldSend = isAppInBackground || currentAppState === 'unknown';
  
  console.log('Clear data push notification check:', {
    currentAppState,
    isAppInBackground,
    shouldSend
  });
  
  // Send notification if:
  // 1. App is in background/inactive state (user left the app)
  // 2. App state is unknown (fallback for reliability)
  // Do NOT send if app is active (user is inside the app)
  return shouldSend;
}

// Helper to update progress periodically during long operations
async function updateClearDataProgressPeriodically(progressData: any, intervalMs: number = 5000) {
  const interval = setInterval(async () => {
    try {
      // Load current progress to preserve the most recent status
      const currentProgress = await loadClearDataProgress();
      if (currentProgress) {
        // Update only the timestamp while preserving the current status
        await saveClearDataProgress({
          ...currentProgress,
          timestamp: Date.now()
        });
      } else {
        // Fallback to the provided progress data if no current progress exists
        await saveClearDataProgress({
          ...progressData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating clear data progress periodically:', error);
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}

// The background task function for clear data
const clearDataBackgroundTask = async (taskDataArguments: any) => {
  const { language } = taskDataArguments;
  
  console.log('Clear data background task started');
  
  try {
    // Check if background service is still running
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped, cancelling clear data task');
      return; 
    }
    
    // Save initial progress - clear data started
    await saveClearDataProgress({
      status: 'clearDataStarted',
      inProgress: true,
      completed: false,
      timestamp: Date.now(),
      percentage: 0,
      message: 'Starting clear data...'
    });
    
    const stopKeepAlive = await updateClearDataProgressPeriodically({ inProgress: true });
    
    // Create a cancellation checker function
    const isCancelled = () => {
      const isServiceRunning = BackgroundService.isRunning();
      if (!isServiceRunning) {
        console.log('Clear data cancelled: BackgroundService is no longer running');
      }
      return !isServiceRunning;
    };

    // Start the clear data process with progress tracking and cancellation support
    const result = await clearLocalStorageData((progress: ClearDataProgress) => {
      // Save progress updates
      saveClearDataProgress({
        status: progress.stage,
        inProgress: true,
        completed: false,
        timestamp: Date.now(),
        percentage: progress.percentage || 0,
        message: progress.message,
        rowsProcessed: progress.rowsProcessed,
        totalRows: progress.totalRows
      });
    }, isCancelled);
    
    // Store backup data for potential rollback
    if (result.backupData) {
      try {
        await AsyncStorage.setItem('clearDataBackupData', JSON.stringify(result.backupData));
        console.log('Backup data stored for potential rollback');
      } catch (error) {
        console.error('Failed to store backup data for rollback:', error);
      }
    }
    
    stopKeepAlive();
    
    // Check if the clear data was cancelled or if background service was stopped
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped during clear data, cancelling task');
      await saveClearDataProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now()
      });
      return; 
    }
    
    // Check if the clear data result indicates cancellation
    if (!result.success && result.message === 'Clear data cancelled by user') {
      console.log('Clear data cancelled by user request');
      await saveClearDataProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now(),
        message: result.message
      });
      return;
    }
    
    // Check if there's no data to clear
    if (!result.success && result.message === 'NO_DATA_TO_CLEAR') {
      console.log('No data to clear from local storage');
      await saveClearDataProgress({
        status: 'noData',
        inProgress: false,
        completed: false,
        noData: true,
        timestamp: Date.now(),
        message: result.message,
        errorMessage: result.message
      });
      return;
    }
    
    // Save final progress
    if (result.success) {
      // Remove backup data since clear data completed successfully
      try {
        await AsyncStorage.removeItem('clearDataBackupData');
        console.log('Removed backup data after successful clear data completion');
      } catch (error) {
        console.error('Failed to remove backup data after successful completion:', error);
      }
      
      await saveClearDataProgress({
        status: 'completed',
        inProgress: false,
        completed: true,
        timestamp: Date.now(),
        percentage: 100,
        message: result.message,
        success: true
      });
      
      // Check if we should send a push notification
      if (shouldSendPushNotification()) {
        try {
          // Check notification permissions first
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          
          if (permissionStatus === 'granted') {
            console.log('Sending clear data completion notification (app in background)');
            const title = language === 'Chinese' ? '清除完成！' : 'Clear Data Completed!';
            const body = language === 'Chinese' 
              ? '您的本地存储数据已成功清除' 
              : 'Your local storage data has been successfully cleared';
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'clear_data_completed' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Clear data completion notification sent successfully with ID:', notificationId);
            
            // Mark that notification was sent to prevent duplicate in-app notifications
            await saveClearDataProgress({
              status: 'completed',
              inProgress: false,
              completed: true,
              notificationSent: true,
              timestamp: Date.now(),
              percentage: 100,
              message: result.message,
              success: true
            });
          } else {
            console.log('Notification permissions not granted, cannot send push notification');
          }
        } catch (notificationError) {
          console.error('Error sending clear data completion notification:', notificationError);
          
          // Fallback: try to send notification even if initial check failed
          try {
            console.log('Attempting fallback clear data completion notification...');
            const title = language === 'Chinese' ? '清除完成！' : 'Clear Data Completed!';
            const body = language === 'Chinese' 
              ? '您的本地存储数据已成功清除' 
              : 'Your local storage data has been successfully cleared';
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'clear_data_completed' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Fallback clear data completion notification sent successfully with ID:', notificationId);
          } catch (fallbackError) {
            console.error('Fallback notification also failed:', fallbackError);
          }
        }
      } else {
        console.log('App is active, skipping notification - user will see in-app success modal');
      }
    } else {
      await saveClearDataProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        errorMessage: result.message,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('Error in clear data background task:', error);
    await saveClearDataProgress({
      status: 'error',
      inProgress: false,
      completed: false,
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
};

// Function to start the clear data background task
export const startClearDataBackgroundTask = async (language: string) => {
  try {
    // Check if background service is already running to prevent duplicates
    if (BackgroundService.isRunning()) {
      console.log('Background service is already running, skipping clear data start');
      return false;
    }
    
    // Ensure clean state by completely clearing any previous clear data progress
    console.log('Clearing any previous clear data progress before starting fresh clear data');
    await clearClearDataProgress();
    
    // Additional cleanup: remove all clear data-related keys
    try {
      await AsyncStorage.multiRemove([
        'clearDataBgTaskProgress',
        'clearDataProgress', 
        'clearDataState'
      ]);
      console.log('Additional cleanup completed before starting clear data');
    } catch (cleanupError) {
      console.warn('Additional cleanup failed:', cleanupError);
    }
    
    // Add a small delay to ensure AsyncStorage operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await BackgroundService.start(clearDataBackgroundTask, {
      taskName: 'ClearData',
      taskTitle: language === 'Chinese' ? '清除数据' : 'Clearing Data',
      taskDesc: language === 'Chinese' ? '正在后台清除您的本地数据' : 'Your local data is being cleared in the background.',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#D7191C',
      parameters: {
        language
      },
    });

    // Save initial progress immediately with explicit 0% and fresh state
    await saveClearDataProgress({
      status: 'clearDataStarted',
      inProgress: true,
      completed: false,
      cancelled: false,
      error: false,
      timestamp: Date.now(),
      percentage: 0,
      rowsProcessed: 0,
      totalRows: 0,
      message: 'Starting clear data...'
    });

    console.log('Fresh clear data task started successfully');
    return true;
  } catch (error) {
    console.error('Failed to start clear data background task:', error);
    return false;
  }
};

// Function to stop the clear data background task
export const stopClearDataBackgroundTask = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
    await clearClearDataProgress();
  } catch (error) {
    console.error('Error stopping clear data background task:', error);
  }
};

// Export the progress management functions
export { saveClearDataProgress, loadClearDataProgress, clearClearDataProgress };
