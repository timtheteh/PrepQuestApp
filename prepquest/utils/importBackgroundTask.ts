import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { importDataFromCloud, ImportProgress } from '../db/importData';
import { strings } from '@/constants/strings';
import NotificationService from './notifications';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

// Progress key for import background task
const IMPORT_BG_TASK_PROGRESS_KEY = 'importDataBgTaskProgress';

// Helper to save progress
async function saveImportProgress(progress: any) {
  try {
    console.log('saveImportProgress: Saving progress:', progress);
    await AsyncStorage.setItem(IMPORT_BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
    console.log('saveImportProgress: Progress saved successfully');
  } catch (e) { 
    console.error('Failed to save import progress', e); 
  }
}

// Helper to load progress
async function loadImportProgress(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(IMPORT_BG_TASK_PROGRESS_KEY);
    console.log('loadImportProgress: Raw data from AsyncStorage:', data);
    const result = data ? JSON.parse(data) : null;
    console.log('loadImportProgress: Parsed result:', result);
    return result;
  } catch (e) { 
    console.error('Failed to load import progress', e);
    return null; 
  }
}

// Helper to clear progress
async function clearImportProgress() {
  try { 
    await AsyncStorage.removeItem(IMPORT_BG_TASK_PROGRESS_KEY); 
  } catch (e) {
    console.error('Failed to clear import progress', e);
  }
}

// Helper to determine if push notification should be sent
function shouldSendPushNotification(): boolean {
  const currentAppState = AppState.currentState;
  const isAppInBackground = currentAppState === 'background' || currentAppState === 'inactive';
  
  // Only send push notification if app is in background/inactive state
  // Don't send if app is active (user is inside the app)
  const shouldSend = isAppInBackground || currentAppState === 'unknown';
  
  console.log('Import push notification check:', {
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
async function updateImportProgressPeriodically(progressData: any, intervalMs: number = 5000) {
  const interval = setInterval(async () => {
    try {
      // Load current progress to preserve the most recent status
      const currentProgress = await loadImportProgress();
      if (currentProgress) {
        // Update only the timestamp while preserving the current status
        await saveImportProgress({
          ...currentProgress,
          timestamp: Date.now()
        });
      } else {
        // Fallback to the provided progress data if no current progress exists
        await saveImportProgress({
          ...progressData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating import progress periodically:', error);
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}

// Network error detection helper
function isNetworkError(error: any): boolean {
  if (!error) return false;
  if (error.isServerError) {
    return false;
  }
  
  // Check for common network error patterns
  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  // Common network error indicators
  const networkErrorPatterns = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'unreachable',
    'offline',
    'no internet',
    'dns',
    'enotfound',
    'econnrefused',
    'econnreset',
    'etimedout'
  ];
  
  // Check error message and name for network patterns
  const hasNetworkPattern = networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorName.includes(pattern)
  );
  
  // Check for specific error types
  const isNetworkErrorType = error instanceof TypeError && errorMessage.includes('failed to fetch');
  const isAbortError = error.name === 'AbortError';
  
  // Check for common HTTP status codes that indicate network issues
  const networkStatusCodes = [0, 502, 503, 504];
  const hasNetworkStatusCode = error.status && networkStatusCodes.includes(error.status);
  
  return hasNetworkPattern || isNetworkErrorType || hasNetworkStatusCode || isAbortError;
}

// The background task function for import data
const importDataBackgroundTask = async (taskDataArguments: any) => {
  console.log('=== IMPORT BACKGROUND TASK FUNCTION CALLED ===');
  console.log('Import background task: Function started with arguments:', taskDataArguments);
  const { getToken, language } = taskDataArguments;
  const localeStrings = strings[language] ?? strings.English;
  const englishImportNotifications = strings.English.notifications.import;
  const importNotifications = localeStrings.notifications?.import ?? englishImportNotifications;
  const {
    cancelledTitle = englishImportNotifications.cancelledTitle,
    networkErrorBody = englishImportNotifications.networkErrorBody,
    serverErrorTitle = englishImportNotifications.serverErrorTitle,
    serverErrorBody = englishImportNotifications.serverErrorBody,
    completedTitle = englishImportNotifications.completedTitle,
    completedBody = englishImportNotifications.completedBody,
  } = importNotifications;
  
  console.log('Import background task: Extracted getToken and language:', { hasGetToken: !!getToken, language });
  console.log('Import background task started');
  
  try {
    // Check if background service is still running
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped, cancelling import task');
      return; 
    }
    
    console.log('Import background task: Background service is running, proceeding with import');
    
    // Save initial progress - import started
    console.log('Import background task: Saving initial progress with counting stage');
    try {
      const initialProgress = {
        status: 'importStarted',
        inProgress: true,
        completed: false,
        timestamp: Date.now(),
        percentage: 0,
        message: 'Starting import...',
        stage: 'counting' // Set initial stage to counting
      };
      console.log('Import background task: About to save initial progress:', initialProgress);
      await saveImportProgress(initialProgress);
      console.log('Import background task: Initial progress saved successfully');
      
      // Verify the progress was saved
      const savedProgress = await loadImportProgress();
      console.log('Import background task: Verified saved progress:', savedProgress);
    } catch (error) {
      console.error('Import background task: Failed to save initial progress:', error);
      // Continue anyway - this is not critical
    }
    
    const stopKeepAlive = await updateImportProgressPeriodically({ inProgress: true });
    
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
        // Re-throw the error so it can be detected as a network error
        throw error;
      }
    };
    
    // Create a cancellation checker function
    const isCancelled = () => {
      const isServiceRunning = BackgroundService.isRunning();
      if (!isServiceRunning) {
        console.log('Import cancelled: BackgroundService is no longer running');
      }
      return !isServiceRunning;
    };
    
    console.log('Import background task: Cancellation checker created, BackgroundService running:', BackgroundService.isRunning());

    // Track current import stage
    let currentImportStage = 'counting';
    
    // Start the import process with progress tracking and cancellation support
    console.log('Import background task: Starting importDataFromCloud with progress tracking');
    console.log('Import background task: BackgroundService status before import:', BackgroundService.isRunning());
    
    const result = await importDataFromCloud(tokenGetter, (progress: ImportProgress) => {
      // Update current stage
      currentImportStage = progress.stage;
      console.log('Import background task: Progress callback triggered for stage:', progress.stage);
      
      // Save progress updates with stage information
      try {
        saveImportProgress({
          status: progress.stage,
          stage: progress.stage, // Ensure stage is saved
          inProgress: true,
          completed: false,
          timestamp: Date.now(),
          percentage: progress.percentage || 0,
          message: progress.message,
          rowsImported: progress.rowsImported,
          totalRows: progress.totalRows
        });
        console.log('Import background task: Progress saved for stage:', progress.stage);
      } catch (error) {
        console.error('Import background task: Failed to save progress for stage:', progress.stage, error);
        // Continue anyway - this is not critical
      }
    }, isCancelled);
    
    console.log('Import background task: importDataFromCloud completed, BackgroundService status:', BackgroundService.isRunning());
    
    stopKeepAlive();
    
    // Check if the import was cancelled or if background service was stopped
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped during import, cancelling task');
      await saveImportProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now()
      });
      return; 
    }
    
    // Check if the import result indicates cancellation
    if (!result.success && result.message === 'Import cancelled by user') {
      console.log('Import cancelled by user request');
      await saveImportProgress({
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
        timestamp: Date.now(),
        message: result.message
      });
      return;
    }
    
    // Check if there's no data to import
    if (!result.success && result.message === 'NO_DATA_TO_IMPORT') {
      console.log('No data to import from cloud');
      await saveImportProgress({
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
    
    // Check if the import result indicates network error
    if (!result.success && (result as any).isServerError) {
      console.log('Import cancelled due to server error', {
        serverStatusCode: (result as any).serverStatusCode,
        serverErrorCode: (result as any).serverErrorCode
      });

      const isCloudImportPhase = currentImportStage !== 'inserting';

      await saveImportProgress({
        status: 'serverError',
        inProgress: false,
        completed: false,
        serverError: true,
        serverStatusCode: (result as any).serverStatusCode,
        serverErrorCode: (result as any).serverErrorCode,
        isCloudImportPhase,
        timestamp: Date.now(),
        message: result.message,
        errorMessage: result.message
      });

      if (isCloudImportPhase && shouldSendPushNotification()) {
        try {
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          if (permissionStatus === 'granted') {
            console.log('Sending import server error notification (app in background)');
            const title = serverErrorTitle;
            const body = serverErrorBody;

            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: {
                  type: 'import_server_error',
                  serverStatusCode: (result as any).serverStatusCode ?? null,
                },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null,
            });

            console.log('Import server error notification sent successfully with ID:', notificationId);

            await saveImportProgress({
              status: 'serverError',
              inProgress: false,
              completed: false,
              serverError: true,
              serverStatusCode: (result as any).serverStatusCode,
              serverErrorCode: (result as any).serverErrorCode,
              isCloudImportPhase,
              notificationSent: true,
              timestamp: Date.now(),
              message: result.message,
              errorMessage: result.message
            });
          } else {
            console.log('Notification permissions not granted, cannot send import server error notification');
          }
        } catch (notificationError) {
          console.error('Error sending import server error notification:', notificationError);
        }
      } else {
        console.log('Import server error occurred while app is active or during local phase - using in-app notification');
      }

      return;
    }
    
    // Check if the import result indicates network error
    if (!result.success && (result as any).isNetworkError) {
      console.log('Import cancelled due to network error');
      console.log('Current import stage:', currentImportStage);
      
      // Only show network error modal if the error occurred during cloud import phase
      // (not during local database update phase)
      const isCloudImportPhase = currentImportStage !== 'inserting';
      console.log('Is cloud import phase:', isCloudImportPhase);
      
      await saveImportProgress({
        status: 'networkError',
        inProgress: false,
        completed: false,
        networkError: true,
        isCloudImportPhase: isCloudImportPhase, // Track if error occurred during cloud import
        timestamp: Date.now(),
        message: result.message,
        errorMessage: result.message
      });
      
      console.log('Saved import progress with network error, isCloudImportPhase:', isCloudImportPhase);
      
      // Only show network error modal/notification if the error occurred during cloud import phase
      if (isCloudImportPhase) {
        // Check if we should send a push notification
        if (shouldSendPushNotification()) {
          try {
            // Check notification permissions first
            const { status: permissionStatus } = await Notifications.getPermissionsAsync();
            
          if (permissionStatus === 'granted') {
            console.log('Sending import network error notification (app in background)');
            const title = cancelledTitle;
            const body = networkErrorBody;
              
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body,
                  data: { type: 'import_network_error' },
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  autoDismiss: false,
                },
                trigger: null, // Send immediately
              });
              
              console.log('Import network error notification sent successfully with ID:', notificationId);
              
              // Mark that notification was sent to prevent duplicate in-app notifications
              await saveImportProgress({
                status: 'networkError',
                inProgress: false,
                completed: false,
                networkError: true,
                isCloudImportPhase: isCloudImportPhase,
                notificationSent: true,
                timestamp: Date.now(),
                message: result.message,
                errorMessage: result.message
              });
            } else {
              console.log('Notification permissions not granted, cannot send push notification');
            }
          } catch (notificationError) {
            console.error('Error sending import network error notification:', notificationError);
            
            // Fallback: try to send notification even if initial check failed
            try {
            console.log('Attempting fallback import network error notification...');
            const title = cancelledTitle;
            const body = networkErrorBody;
              
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body,
                  data: { type: 'import_network_error' },
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  autoDismiss: false,
                },
                trigger: null, // Send immediately
              });
              
              console.log('Fallback import network error notification sent successfully with ID:', notificationId);
            } catch (fallbackError) {
              console.error('Fallback notification also failed:', fallbackError);
            }
          }
        } else {
          console.log('App is active, in-app notification will be shown instead');
        }
      } else {
        console.log('Network error occurred during local database update phase - not showing modal/notification');
      }
      return;
    }
    
    // Save final progress
    if (result.success) {
      await saveImportProgress({
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
            console.log('Sending import completion notification (app in background)');
            const title = completedTitle;
            const body = completedBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'import_completed' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Import completion notification sent successfully with ID:', notificationId);
            
            // Mark that notification was sent to prevent duplicate in-app notifications
            await saveImportProgress({
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
          console.error('Error sending import completion notification:', notificationError);
          
          // Fallback: try to send notification even if initial check failed
          try {
            console.log('Attempting fallback import completion notification...');
            const title = completedTitle;
            const body = completedBody;
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'import_completed' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null, // Send immediately
            });
            
            console.log('Fallback import completion notification sent successfully with ID:', notificationId);
          } catch (fallbackError) {
            console.error('Fallback notification also failed:', fallbackError);
          }
        }
      } else {
        console.log('App is active, skipping notification - user will see in-app success modal');
      }
    } else {
      await saveImportProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        errorMessage: result.message,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('Error in import background task:', error);
    
    // Check if this is a network error
    if (isNetworkError(error)) {
      console.log('Network error detected during import');
      await saveImportProgress({
        status: 'networkError',
        inProgress: false,
        completed: false,
        networkError: true,
        timestamp: Date.now(),
        message: 'Import cancelled due to network error! Check your network.',
        errorMessage: 'Import cancelled due to network error! Check your network.'
      });
      
      // Send push notification for network error if app is in background
      if (shouldSendPushNotification()) {
        try {
          const { status: permissionStatus } = await Notifications.getPermissionsAsync();
          if (permissionStatus === 'granted') {
            const title = cancelledTitle;
            const body = networkErrorBody;
            
            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'import_network_error' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null,
            });
          }
        } catch (notificationError) {
          console.error('Error sending network error notification:', notificationError);
        }
      }
    } else {
      await saveImportProgress({
        status: 'error',
        inProgress: false,
        completed: false,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }
};

// Function to start the import background task
export const startImportBackgroundTask = async (getToken: () => Promise<string | null>, language: string) => {
  try {
    // Check if background service is already running to prevent duplicates
    if (BackgroundService.isRunning()) {
      console.log('Background service is already running, skipping import start');
      return false;
    }
    
    // Ensure clean state by completely clearing any previous import progress
    console.log('Clearing any previous import progress before starting fresh import');
    await clearImportProgress();
    
    // Additional cleanup: remove all import-related keys
    try {
      await AsyncStorage.multiRemove([
        'importDataBgTaskProgress',
        'importProgress', 
        'importState'
      ]);
      console.log('Additional cleanup completed before starting import');
    } catch (cleanupError) {
      console.warn('Additional cleanup failed:', cleanupError);
    }
    
    // Add a small delay to ensure AsyncStorage operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('startImportBackgroundTask: Starting BackgroundService...');
    await BackgroundService.start(importDataBackgroundTask, {
      taskName: 'ImportData',
      taskTitle: language === 'Chinese' ? '导入数据' : 'Importing Data',
      taskDesc: language === 'Chinese' ? '正在后台导入您的数据' : 'Your data is being imported in the background.',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#44B88A',
      parameters: {
        getToken,
        language
      },
    });
    console.log('startImportBackgroundTask: BackgroundService started successfully');
    console.log('startImportBackgroundTask: BackgroundService.isRunning():', BackgroundService.isRunning());

    // Save initial progress immediately with explicit 0% and fresh state
    console.log('startImportBackgroundTask: Saving initial progress from main function...');
    await saveImportProgress({
      status: 'importStarted',
      stage: 'counting', // Set initial stage to counting
      inProgress: true,
      completed: false,
      cancelled: false,
      error: false,
      timestamp: Date.now(),
      percentage: 0,
      rowsImported: 0,
      totalRows: 0,
      message: 'Starting import...'
    });
    console.log('startImportBackgroundTask: Initial progress saved from main function');
    
    // Add a small delay to ensure the background task has started and saved its progress
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify the progress was saved
    const verifyProgress = await loadImportProgress();
    console.log('startImportBackgroundTask: Verified progress after delay:', verifyProgress);

    console.log('Fresh import task started successfully');
    return true;
  } catch (error) {
    console.error('Failed to start import background task:', error);
    return false;
  }
};

// Function to stop the import background task
export const stopImportBackgroundTask = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
    await clearImportProgress();
  } catch (error) {
    console.error('Error stopping import background task:', error);
  }
};

// Export the progress management functions
export { saveImportProgress, loadImportProgress, clearImportProgress };
