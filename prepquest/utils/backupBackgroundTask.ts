import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { backupDataToCloud, BackupProgress } from '../db/backup';
import { strings } from '@/constants/strings';
import NotificationService from './notifications';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { arePushNotificationsEnabled } from '@/db/users';

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

// Helper to determine if push notification should be sent
async function shouldSendPushNotification(): Promise<boolean> {
  const currentAppState = AppState.currentState;
  const isAppInBackground = currentAppState === 'background' || currentAppState === 'inactive';

  const shouldSend = isAppInBackground || currentAppState === 'unknown';

  if (!shouldSend) {
    console.log('Push notification skipped because app is active', { currentAppState });
    return false;
  }

  try {
    const enabled = await arePushNotificationsEnabled();
    if (!enabled) {
      console.log('Push notifications disabled by user preference; skipping backup notification');
    }
    return enabled;
  } catch (error) {
    console.error('Error checking push notification preference for backup task:', error);
    return false;
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
  const { getToken, language, backupOnlyFormEntries } = taskDataArguments;
  const localeStrings = strings[language] ?? strings.English;
  const englishBackupNotifications = strings.English.notifications.backup;
  const backupNotifications = localeStrings.notifications?.backup ?? englishBackupNotifications;
  const {
    startingBackup = englishBackupNotifications.startingBackup,
    unableToGetToken = englishBackupNotifications.unableToGetToken,
    cancelledTitle = englishBackupNotifications.cancelledTitle,
    networkErrorBody = englishBackupNotifications.networkErrorBody,
    serverErrorTitle = englishBackupNotifications.serverErrorTitle,
    serverErrorBody = englishBackupNotifications.serverErrorBody,
    serviceBusyBody = englishBackupNotifications.serviceBusyBody,
    completedTitle = englishBackupNotifications.completedTitle,
    completedBody = englishBackupNotifications.completedBody,
  } = backupNotifications;
  
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
      message: startingBackup
    });
    
    const stopKeepAlive = await updateBackupProgressPeriodically({ inProgress: true });
    
    // Create a token getter function that refreshes tokens as needed
    const tokenGetter = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error(unableToGetToken);
        }
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        // Re-throw the error so it can be detected as a network error
        throw error;
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
    }, isCancelled, {
      backupOnlyFormEntries: !!backupOnlyFormEntries,
    });
    
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
    
    // Check if the backup result indicates backup service busy error
    if (!result.success && (result as any).isBackupServiceBusy) {
      console.log('Backup cancelled due to backup service busy error');
      await saveBackupProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        isBackupServiceBusy: true,
        timestamp: Date.now(),
        message: result.message,
        errorMessage: result.message
      });
      
      // Check if we should send a push notification
    if (await shouldSendPushNotification()) {
        try {
          // Check notification permissions first
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          
          if (permissionStatus === 'granted') {
            console.log('Sending backup service busy notification (app in background)');
            const title = cancelledTitle;
            const body = serviceBusyBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'backup_service_busy' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Backup service busy notification sent successfully with ID:', notificationId);
            
            // Mark that notification was sent to prevent duplicate in-app notifications
            await saveBackupProgress({
              status: 'error',
              inProgress: false,
              completed: false,
              error: true,
              isBackupServiceBusy: true,
              notificationSent: true,
              timestamp: Date.now(),
              message: result.message,
              errorMessage: result.message
            });
          } else {
            console.log('Notification permissions not granted, cannot send push notification');
          }
        } catch (notificationError) {
          console.error('Error sending backup service busy notification:', notificationError);
          
          // Fallback: try to send notification even if initial check failed
          try {
            console.log('Attempting fallback backup service busy notification...');
            const title = cancelledTitle;
            const body = serviceBusyBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'backup_service_busy' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Fallback backup service busy notification sent successfully with ID:', notificationId);
          } catch (fallbackError) {
            console.error('Fallback notification also failed:', fallbackError);
          }
        }
      } else {
        console.log('App is active, in-app notification will be shown instead');
      }
      return;
    }
    
    // Check if the backup result indicates server error
    if (!result.success && (result as any).isServerError) {
      console.log('Backup cancelled due to server error', {
        serverStatusCode: (result as any).serverStatusCode,
        serverErrorCode: (result as any).serverErrorCode
      });
      await saveBackupProgress({
        status: 'serverError',
        inProgress: false,
        completed: false,
        serverError: true,
        serverStatusCode: (result as any).serverStatusCode,
        serverErrorCode: (result as any).serverErrorCode,
        timestamp: Date.now(),
        message: result.message,
        errorMessage: result.message
      });

      if (await shouldSendPushNotification()) {
        try {
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          if (permissionStatus === 'granted') {
            console.log('Sending server error notification (app in background)');
            const title = serverErrorTitle;
            const body = serverErrorBody;

            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: {
                  type: 'backup_server_error',
                  serverStatusCode: (result as any).serverStatusCode ?? null,
                },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null,
            });

            console.log('Server error notification sent successfully with ID:', notificationId);

            await saveBackupProgress({
              status: 'serverError',
              inProgress: false,
              completed: false,
              serverError: true,
              serverStatusCode: (result as any).serverStatusCode,
              serverErrorCode: (result as any).serverErrorCode,
              notificationSent: true,
              timestamp: Date.now(),
              message: result.message,
              errorMessage: result.message
            });
          } else {
            console.log('Notification permissions not granted, cannot send server error notification');
          }
        } catch (notificationError) {
          console.error('Error sending server error notification:', notificationError);
        }
      } else {
        console.log('App is active, in-app notification will be shown instead for server error');
      }

      return;
    }
    
    // Check if the backup result indicates network error
    if (!result.success && (result as any).isNetworkError) {
      console.log('Backup cancelled due to network error');
      await saveBackupProgress({
        status: 'networkError',
        inProgress: false,
        completed: false,
        networkError: true,
        timestamp: Date.now(),
        message: result.message,
        errorMessage: result.message
      });
      
      // Check if we should send a push notification
      if (await shouldSendPushNotification()) {
        try {
          // Check notification permissions first
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          
          if (permissionStatus === 'granted') {
            console.log('Sending network error notification (app in background)');
            const title = cancelledTitle;
            const body = networkErrorBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'backup_network_error' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Network error notification sent successfully with ID:', notificationId);
            
            // Mark that notification was sent to prevent duplicate in-app notifications
            await saveBackupProgress({
              status: 'networkError',
              inProgress: false,
              completed: false,
              networkError: true,
              notificationSent: true,
              timestamp: Date.now(),
              message: result.message,
              errorMessage: result.message
            });
          } else {
            console.log('Notification permissions not granted, cannot send push notification');
          }
        } catch (notificationError) {
          console.error('Error sending network error notification:', notificationError);
          
          // Fallback: try to send notification even if initial check failed
          try {
            console.log('Attempting fallback network error notification...');
            const title = cancelledTitle;
            const body = networkErrorBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'backup_network_error' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Fallback network error notification sent successfully with ID:', notificationId);
          } catch (fallbackError) {
            console.error('Fallback notification also failed:', fallbackError);
          }
        }
      } else {
        console.log('App is active, in-app notification will be shown instead');
      }
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
      
      // Check if we should send a push notification
      if (await shouldSendPushNotification()) {
        try {
          // Check notification permissions first
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          
          if (permissionStatus === 'granted') {
            console.log('Sending backup completion notification (app in background)');
            const title = completedTitle;
            const body = completedBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'backup_completed' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Backup completion notification sent successfully with ID:', notificationId);
            
            // Mark that notification was sent to prevent duplicate in-app notifications
            await saveBackupProgress({
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
          console.error('Error sending backup completion notification:', notificationError);
          
          // Fallback: try to send notification even if initial check failed
          try {
            console.log('Attempting fallback backup completion notification...');
            const title = completedTitle;
            const body = completedBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'backup_completed' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Fallback backup completion notification sent successfully with ID:', notificationId);
          } catch (fallbackError) {
            console.error('Fallback notification also failed:', fallbackError);
          }
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
      
      // Check if this is a backup service busy error (PGRST002 schema cache error)
      if (result.message && (result.message.includes('PGRST002') || result.message.includes('schema cache') || result.message.includes('Could not query the database for the schema cache'))) {
        // Save additional flag for backup service busy error
        await saveBackupProgress({
          status: 'error',
          inProgress: false,
          completed: false,
          error: true,
          errorMessage: result.message,
          isBackupServiceBusy: true,
          timestamp: Date.now()
        });
      }
    }
    
  } catch (error) {
    console.error('Error in backup background task:', error);
    const errorMessage = error instanceof Error ? error.message : (localeStrings.unknownError ?? strings.English.unknownError);
    
    await saveBackupProgress({
      status: 'error',
      inProgress: false,
      completed: false,
      error: true,
      errorMessage: errorMessage,
      timestamp: Date.now()
    });
    
    // Check if this is a backup service busy error (PGRST002 schema cache error)
    if (errorMessage.includes('PGRST002') || errorMessage.includes('schema cache') || errorMessage.includes('Could not query the database for the schema cache')) {
      // Save additional flag for backup service busy error
      await saveBackupProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        errorMessage: errorMessage,
        isBackupServiceBusy: true,
        timestamp: Date.now()
      });
    }
  }
};

// Function to start the backup background task
export const startBackupBackgroundTask = async (
  getToken: () => Promise<string | null>,
  language: string,
  options?: { backupOnlyFormEntries?: boolean }
) => {
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
    
    const localeStrings = strings[language] ?? strings.English;
    const englishBackupNotifications = strings.English.notifications.backup;
    const backupNotifications = localeStrings.notifications?.backup ?? englishBackupNotifications;
    
    await BackgroundService.start(backupDataBackgroundTask, {
      taskName: 'BackupData',
      taskTitle: backupNotifications.taskTitle ?? englishBackupNotifications.taskTitle,
      taskDesc: backupNotifications.taskDesc ?? englishBackupNotifications.taskDesc,
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#44B88A',
      parameters: {
        getToken,
        language,
        backupOnlyFormEntries: !!options?.backupOnlyFormEntries,
      },
    });

    // Don't save progress immediately to prevent button flickering
    // Progress will be saved when the background task actually starts running
    console.log('Background service started, progress will be saved when task begins');

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
