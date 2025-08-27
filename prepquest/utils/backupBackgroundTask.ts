import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { backupDataToCloud, BackupProgress } from '../db/backup';
import NotificationService from './notifications';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

// Progress key for backup background task
const BACKUP_BG_TASK_PROGRESS_KEY = 'backupDataBgTaskProgress';

// Helper to save progress
async function saveBackupProgress(progress: any) {
  try {
    await AsyncStorage.setItem(BACKUP_BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) { 
    console.error('Failed to save backup progress', e); 
  }
}

// Helper to load progress
async function loadBackupProgress(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(BACKUP_BG_TASK_PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    console.error('Failed to load backup progress', e);
    return null; 
  }
}

// Helper to clear progress
async function clearBackupProgress() {
  try { 
    await AsyncStorage.removeItem(BACKUP_BG_TASK_PROGRESS_KEY); 
  } catch (e) {
    console.error('Failed to clear backup progress', e);
  }
}

// Helper to update progress periodically during long operations
async function updateBackupProgressPeriodically(progressData: any, intervalMs: number = 5000) {
  const interval = setInterval(async () => {
    try {
      // Load current progress to preserve the most recent status
      const currentProgress = await loadBackupProgress();
      if (currentProgress) {
        // Update only the timestamp while preserving the current status
        await saveBackupProgress({
          ...currentProgress,
          timestamp: Date.now()
        });
      } else {
        // Fallback to the provided progress data if no current progress exists
        await saveBackupProgress({
          ...progressData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating backup progress periodically:', error);
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}

// The background task function for backup data
const backupDataBackgroundTask = async (taskDataArguments: any) => {
  const { getToken, language } = taskDataArguments;
  
  console.log('Backup background task started');
  
  try {
    // Check if background service is still running
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped, cancelling backup task');
      return; 
    }
    
    // Save initial progress - backup started
    await saveBackupProgress({
      status: 'backupStarted',
      inProgress: true,
      completed: false,
      timestamp: Date.now(),
      percentage: 0,
      message: 'Starting backup...'
    });
    
    const stopKeepAlive = await updateBackupProgressPeriodically({ inProgress: true });
    
    // Create a token getter function that refreshes tokens as needed
    const tokenGetter = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Unable to get authentication token');
        }
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    };
    
    // Create a cancellation checker function
    const isCancelled = () => {
      const isServiceRunning = BackgroundService.isRunning();
      if (!isServiceRunning) {
        console.log('Backup cancelled: BackgroundService is no longer running');
      }
      return !isServiceRunning;
    };

    // Start the backup process with progress tracking and cancellation support
    const result = await backupDataToCloud(tokenGetter, (progress: BackupProgress) => {
      // Save progress updates
      saveBackupProgress({
        status: progress.stage,
        inProgress: true,
        completed: false,
        timestamp: Date.now(),
        percentage: progress.percentage || 0,
        message: progress.message,
        rowsUploaded: progress.rowsUploaded,
        totalRows: progress.totalRows
      });
    }, isCancelled);
    
    stopKeepAlive();
    
    // Check if the backup was cancelled or if background service was stopped
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped during backup, cancelling task');
      await saveBackupProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now()
      });
      return; 
    }
    
    // Check if the backup result indicates cancellation
    if (!result.success && result.message === 'Backup cancelled by user') {
      console.log('Backup cancelled by user request');
      await saveBackupProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now(),
        message: result.message
      });
      return;
    }
    
    // Save final progress
    if (result.success) {
      await saveBackupProgress({
        status: 'completed',
        inProgress: false,
        completed: true,
        timestamp: Date.now(),
        percentage: 100,
        message: result.message,
        success: true
      });
      
      // Only send notification if app is in background (not active)
      // We can detect this by checking if the background service is still running
      // and if the app state is not active
      const currentAppState = AppState.currentState;
      const isAppInBackground = currentAppState !== 'active';
      
      if (isAppInBackground) {
        try {
          console.log('Sending backup completion notification (app in background)');
          const title = language === 'Chinese' ? '备份完成！' : 'Backup Completed!';
          const body = language === 'Chinese' ? '您的数据已成功备份到云端' : 'Your data has been successfully backed up to the cloud';
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { type: 'backup_completed' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Send immediately
          });
          
          console.log('Backup completion notification sent successfully');
        } catch (notificationError) {
          console.error('Error sending backup completion notification:', notificationError);
        }
      } else {
        console.log('App is active, skipping notification - user will see in-app success modal');
      }
    } else {
      await saveBackupProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        errorMessage: result.message,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('Error in backup background task:', error);
    await saveBackupProgress({
      status: 'error',
      inProgress: false,
      completed: false,
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
};

// Function to start the backup background task
export const startBackupBackgroundTask = async (getToken: () => Promise<string | null>, language: string) => {
  try {
    // Check if background service is already running to prevent duplicates
    if (BackgroundService.isRunning()) {
      console.log('Background service is already running, skipping backup start');
      return false;
    }
    
    // Ensure clean state by completely clearing any previous backup progress
    console.log('Clearing any previous backup progress before starting fresh backup');
    await clearBackupProgress();
    
    // Additional cleanup: remove all backup-related keys
    try {
      await AsyncStorage.multiRemove([
        'backupDataBgTaskProgress',
        'backupProgress', 
        'backupState'
      ]);
      console.log('Additional cleanup completed before starting backup');
    } catch (cleanupError) {
      console.warn('Additional cleanup failed:', cleanupError);
    }
    
    // Add a small delay to ensure AsyncStorage operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await BackgroundService.start(backupDataBackgroundTask, {
      taskName: 'BackupData',
      taskTitle: language === 'Chinese' ? '备份数据' : 'Backing Up Data',
      taskDesc: language === 'Chinese' ? '正在后台备份您的数据' : 'Your data is being backed up in the background.',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#44B88A',
      parameters: {
        getToken,
        language
      },
    });

    // Save initial progress immediately with explicit 0% and fresh state
    await saveBackupProgress({
      status: 'backupStarted',
      inProgress: true,
      completed: false,
      cancelled: false,
      error: false,
      timestamp: Date.now(),
      percentage: 0,
      rowsUploaded: 0,
      totalRows: 0,
      message: 'Starting backup...'
    });

    console.log('Fresh backup task started successfully');
    return true;
  } catch (error) {
    console.error('Failed to start backup background task:', error);
    return false;
  }
};

// Function to stop the backup background task
export const stopBackupBackgroundTask = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
    await clearBackupProgress();
  } catch (error) {
    console.error('Error stopping backup background task:', error);
  }
};

// Export the progress management functions
export { saveBackupProgress, loadBackupProgress, clearBackupProgress };
