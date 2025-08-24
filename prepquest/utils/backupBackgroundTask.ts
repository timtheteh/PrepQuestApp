import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { backupDataToCloud, BackupProgress } from '../db/backup';
import NotificationService from './notifications';

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
    
    // Start the backup process with progress tracking
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
    });
    
    stopKeepAlive();
    
    // Check if background service is still running before finalizing
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

    // Save initial progress immediately
    await saveBackupProgress({
      status: 'backupStarted',
      inProgress: true,
      completed: false,
      timestamp: Date.now(),
      percentage: 0,
      message: 'Starting backup...'
    });

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
