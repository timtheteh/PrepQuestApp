import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform, Switch, Alert, Linking, ScrollView , Animated, Modal, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons, Entypo } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import LottieView from 'lottie-react-native';
import { GenericModal } from '@/components/modals/GenericModal';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import ModalExclamationMarkIcon from '@/assets/icons/generalIcons/modalExclamationMarkIcon.svg';
import { db } from '@/db/index';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { useAuth } from '@clerk/clerk-expo';
import { StripedProgressBar } from '@/components/general/StripedProgressBar';
import { useBackupBackgroundTask } from '@/contexts/BackupBackgroundTaskContext';
import { startBackupBackgroundTask, stopBackupBackgroundTask } from '@/utils/backupBackgroundTask';
import { useImportBackgroundTask } from '@/contexts/ImportBackgroundTaskContext';
import { startImportBackgroundTask, stopImportBackgroundTask } from '@/utils/importBackgroundTask';
import { useClearDataBackgroundTask } from '@/contexts/ClearDataBackgroundTaskContext';
import { startClearDataBackgroundTask, stopClearDataBackgroundTask } from '@/utils/clearDataBackgroundTask';

import { importDataFromCloud, ImportProgress } from '@/db/importData';
import { extractFoldersFromSQLite, extractDecksFromSQLite, extractFlashcardsFromSQLite, extractRecentUserFormEntriesFromSQLite } from '@/db/backup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarAccountHeight } from '@/hooks/heights';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';


const TitleToggleRow = React.memo(({ text, value, onValueChange, language }: { text: string; value: boolean; onValueChange: (value: boolean) => void; language: string }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    
    return (
      <View style={styles.titleToggleRow}>
        <Text style={[
          styles.titleToggleText,
          { color: colors.text, fontFamily: Fonts.bodyBold }
        ]}>
          {text}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.unselectedText, true: colors.brandColor1 }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={colors.unselectedText}
        />
      </View>
    );
  });

export default function AppSettingsScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { getToken } = useAuth();
  const [cameraAccessEnabled, setCameraAccessEnabled] = React.useState(false);
  const [galleryAccessEnabled, setGalleryAccessEnabled] = React.useState(false);
  const [micAccessEnabled, setMicAccessEnabled] = React.useState(false);
  const [notificationsAccessEnabled, setNotificationsAccessEnabled] = React.useState(false);
  const insets = useSafeAreaInsets();
  const getTopBarAccountHeight = useTopBarAccountHeight();

  // Backup modal state
  const [isBackupModalOpen, setIsBackupModalOpen] = React.useState(false);
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;

  // load data modal state
  const [isLoadDataModalOpen, setIsLoadDataModalOpen] = React.useState(false);
  const loadDataOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const loadDataModalOpacity = React.useRef(new Animated.Value(0)).current;

  // delete local storage modal state
  const [isDeleteLocalStorageModalOpen, setIsDeleteLocalStorageModalOpen] = React.useState(false);
  const deleteLocalStorageOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const deleteLocalStorageModalOpacity = React.useRef(new Animated.Value(0)).current;

  // language modal state
  const [isLanguageModalOpen, setIsLanguageModalOpen] = React.useState(false);

  // backup progress state - now handled by background task context
  const { 
    isBackupBackgroundTaskRunning, 
    isBackupCleanupInProgress,
    isBackupStopping,
    backupBackgroundTaskProgress, 
    wasAutomaticallyCancelled,
    startBackupBackgroundTaskMonitoring,
    forceStopBackupBackgroundTask,
    clearBackupBackgroundTaskProgress,
    resetBackupForceStoppedFlag,
    resetAutomaticallyCancelledFlag
  } = useBackupBackgroundTask();
  
  // import progress state - now handled by background task context
  const { 
    isImportBackgroundTaskRunning, 
    isImportCleanupInProgress,
    isImportStopping,
    importBackgroundTaskProgress, 
    wasAutomaticallyCancelled: wasImportAutomaticallyCancelled,
    startImportBackgroundTaskMonitoring,
    forceStopImportBackgroundTask,
    clearImportBackgroundTaskProgress,
    resetImportForceStoppedFlag,
    resetAutomaticallyCancelledFlag: resetImportAutomaticallyCancelledFlag
  } = useImportBackgroundTask();
  
  // clear data progress state - now handled by background task context
  const { 
    isClearDataBackgroundTaskRunning, 
    clearDataBackgroundTaskProgress,
    setClearDataBackgroundTaskProgress,
    wasAutomaticallyCancelled: wasClearDataAutomaticallyCancelled,
    startClearDataBackgroundTaskMonitoring,
    forceStopClearDataBackgroundTask,
    clearClearDataBackgroundTaskProgress,
    resetClearDataForceStoppedFlag,
    resetAutomaticallyCancelledFlag: resetClearDataAutomaticallyCancelledFlag
  } = useClearDataBackgroundTask();
  
  // backup loading state
  const [isBackupLoading, setIsBackupLoading] = React.useState(false);
  const backupLoadingOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  
  // success modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const successOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const successModalOpacity = React.useRef(new Animated.Value(0)).current;
  
  // persistent backup completion state
  const [hasBackupCompleted, setHasBackupCompleted] = React.useState(false);

  // persistent import completion state
  const [hasImportCompleted, setHasImportCompleted] = React.useState(false);

  // cancel backup modal state
  const [isCancelBackupModalOpen, setIsCancelBackupModalOpen] = React.useState(false);
  const cancelBackupOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const cancelBackupModalOpacity = React.useRef(new Animated.Value(0)).current;

  // local stopping state to ensure immediate UI feedback
  const [isLocallyStoppingBackup, setIsLocallyStoppingBackup] = React.useState(false);

  // State to control when other buttons should be disabled (only when progress bar is actually visible)
  const [shouldDisableOtherButtons, setShouldDisableOtherButtons] = React.useState(false);

  // cooldown state after cancellation (5 second delay)
  const [isCancelCooldownActive, setIsCancelCooldownActive] = React.useState(false);
  const cooldownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Import cooldown state after cancellation (5 second delay)
  const [isImportCancelCooldownActive, setIsImportCancelCooldownActive] = React.useState(false);
  const importCooldownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Import process state - now handled by background task context
  const [isCancelImportModalOpen, setIsCancelImportModalOpen] = React.useState(false);
  const cancelImportOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const cancelImportModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Clear data cancel modal state
  const [isCancelClearDataModalOpen, setIsCancelClearDataModalOpen] = React.useState(false);
  const cancelClearDataOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const cancelClearDataModalOpacity = React.useRef(new Animated.Value(0)).current;
  
  // Import loading state
  const [isImportLoading, setIsImportLoading] = React.useState(false);
  const importLoadingOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  
  // Import cancellation flag
  const importCancelledRef = React.useRef(false);

  // Clear data loading state
  const [isClearDataLoading, setIsClearDataLoading] = React.useState(false);
  const clearDataLoadingOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  
  // Local state to immediately show progress bar when starting clear data
  const [isLocallyStartingClearData, setIsLocallyStartingClearData] = React.useState(false);
  
  // State to track when data restoration/rollback is happening
  const [isDataRestorationInProgress, setIsDataRestorationInProgress] = React.useState(false);
  
  // State to track which process is blocking navigation
  const [navigationBlockingProcess, setNavigationBlockingProcess] = React.useState<'backup' | 'import' | 'deletion' | null>(null);
  
  // Reset local starting state when background task actually starts running
  React.useEffect(() => {
    if (isClearDataBackgroundTaskRunning && isLocallyStartingClearData) {
      setIsLocallyStartingClearData(false);
    }
  }, [isClearDataBackgroundTaskRunning, isLocallyStartingClearData]);
  
  // Clear data cancellation flag
  const clearDataCancelledRef = React.useRef(false);

  // No data modal state
  const [isNoDataModalOpen, setIsNoDataModalOpen] = React.useState(false);
  const noDataOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const noDataModalOpacity = React.useRef(new Animated.Value(0)).current;

  // No clear data modal state
  const [isNoClearDataModalOpen, setIsNoClearDataModalOpen] = React.useState(false);
  const noClearDataOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const noClearDataModalOpacity = React.useRef(new Animated.Value(0)).current;

  // No backup data modal state
  const [isNoBackupDataModalOpen, setIsNoBackupDataModalOpen] = React.useState(false);
  const noBackupDataOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const noBackupDataModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Network error modal state
  const [isNetworkErrorModalOpen, setIsNetworkErrorModalOpen] = React.useState(false);
  const networkErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const networkErrorModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Backup service busy modal state
  const [isBackupServiceBusyModalOpen, setIsBackupServiceBusyModalOpen] = React.useState(false);
  const backupServiceBusyOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const backupServiceBusyModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Automatic cancellation modal state
  const [isAutomaticCancellationModalOpen, setIsAutomaticCancellationModalOpen] = React.useState(false);
  const automaticCancellationOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const automaticCancellationModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Import automatic cancellation modal state
  const [isImportAutomaticCancellationModalOpen, setIsImportAutomaticCancellationModalOpen] = React.useState(false);
  const importAutomaticCancellationOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const importAutomaticCancellationModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Clear data automatic cancellation modal state
  const [isClearDataAutomaticCancellationModalOpen, setIsClearDataAutomaticCancellationModalOpen] = React.useState(false);
  const clearDataAutomaticCancellationOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const clearDataAutomaticCancellationModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Track if network error modal has been shown to prevent dismissal by in-app notification
  const [hasNetworkErrorModalBeenShown, setHasNetworkErrorModalBeenShown] = React.useState(false);
  
  // Track which operation had a network error for modal text
  const [networkErrorOperation, setNetworkErrorOperation] = React.useState<'backup' | 'import' | 'clearData'>('backup');

  // Backup loading network error modal state
  const [isBackupLoadingNetworkErrorModalOpen, setIsBackupLoadingNetworkErrorModalOpen] = React.useState(false);
  const backupLoadingNetworkErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const backupLoadingNetworkErrorModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Import loading network error modal state
  const [isImportLoadingNetworkErrorModalOpen, setIsImportLoadingNetworkErrorModalOpen] = React.useState(false);
  const importLoadingNetworkErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const importLoadingNetworkErrorModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Clear data loading network error modal state
  const [isClearDataLoadingNetworkErrorModalOpen, setIsClearDataLoadingNetworkErrorModalOpen] = React.useState(false);
  const clearDataLoadingNetworkErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const clearDataLoadingNetworkErrorModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Clear data completion state
  const [hasClearDataCompleted, setHasClearDataCompleted] = React.useState(false);

  // Clear data cooldown state
  const [isClearDataCancelCooldownActive, setIsClearDataCancelCooldownActive] = React.useState(false);
  const clearDataCooldownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear data local stopping state
  const [isLocallyStoppingClearData, setIsLocallyStoppingClearData] = React.useState(false);

  // Handler functions
  const handleShowNetworkErrorModal = React.useCallback((operation: 'backup' | 'import' | 'clearData' = 'backup') => {
    setNetworkErrorOperation(operation);
    setIsNetworkErrorModalOpen(true);
    setHasNetworkErrorModalBeenShown(true);
    Animated.parallel([
      Animated.timing(networkErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(networkErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [networkErrorOverlayOpacity, networkErrorModalOpacity]);

  const handleDismissNetworkErrorModal = React.useCallback(async () => {
    Animated.parallel([
      Animated.timing(networkErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(networkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNetworkErrorModalOpen(false);
      setHasNetworkErrorModalBeenShown(false);
    });
    
    // Handle different operations differently
    if (networkErrorOperation === 'backup') {
      // For backup network errors: clear backup progress and start cooldown
      try {
        await clearBackupBackgroundTaskProgress();
        console.log('Cleared backup progress data after user dismissed network error modal');
      } catch (error) {
        console.error('Error clearing backup progress data:', error);
      }
      
      // Start 5-second cooldown period to prevent immediate restart after backup network error
      setIsCancelCooldownActive(true);
      setShouldDisableOtherButtons(true);
      console.log('Starting 5-second cooldown after backup network error modal dismissal');
      
      // Clear any existing cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      cooldownTimerRef.current = setTimeout(() => {
        setIsCancelCooldownActive(false);
        setShouldDisableOtherButtons(false);
        console.log('Cooldown period ended after backup network error modal dismissal - all buttons re-enabled');
      }, 5000);
    } else if (networkErrorOperation === 'import') {
      // For import network errors: clear import progress but maintain cooldown mode
      try {
        await clearImportBackgroundTaskProgress();
        console.log('Cleared import progress data after user dismissed network error modal');
      } catch (error) {
        console.error('Error clearing import progress data:', error);
      }
      
      // Don't reset cooldown states - let the cooldown timer handle button re-enabling
      // This prevents button flickering and maintains consistent button states
      console.log('Import network error modal dismissed - maintaining cooldown mode to prevent button flickering');
    } else {
      // For clear data network errors: clear clear data progress and immediately enable all buttons
      try {
        await clearClearDataBackgroundTaskProgress();
        console.log('Cleared clear data progress data after user dismissed network error modal');
      } catch (error) {
        console.error('Error clearing clear data progress data:', error);
      }
      
      // Immediately enable all buttons for clear data network errors
      setShouldDisableOtherButtons(false);
      console.log('Clear data network error modal dismissed - all buttons immediately re-enabled');
    }
  }, [networkErrorOverlayOpacity, networkErrorModalOpacity, clearBackupBackgroundTaskProgress, clearImportBackgroundTaskProgress, clearClearDataBackgroundTaskProgress, networkErrorOperation]);

  const handleShowBackupLoadingNetworkErrorModal = React.useCallback(() => {
    setIsBackupLoadingNetworkErrorModalOpen(true);
    Animated.parallel([
      Animated.timing(backupLoadingNetworkErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backupLoadingNetworkErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [backupLoadingNetworkErrorOverlayOpacity, backupLoadingNetworkErrorModalOpacity]);

  const handleDismissBackupLoadingNetworkErrorModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(backupLoadingNetworkErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backupLoadingNetworkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackupLoadingNetworkErrorModalOpen(false);
    });
  }, [backupLoadingNetworkErrorOverlayOpacity, backupLoadingNetworkErrorModalOpacity]);

  const handleShowImportLoadingNetworkErrorModal = React.useCallback(() => {
    setIsImportLoadingNetworkErrorModalOpen(true);
    Animated.parallel([
      Animated.timing(importLoadingNetworkErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(importLoadingNetworkErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [importLoadingNetworkErrorOverlayOpacity, importLoadingNetworkErrorModalOpacity]);

  const handleDismissImportLoadingNetworkErrorModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(importLoadingNetworkErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(importLoadingNetworkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsImportLoadingNetworkErrorModalOpen(false);
    });
  }, [importLoadingNetworkErrorOverlayOpacity, importLoadingNetworkErrorModalOpacity]);

  const handleShowClearDataLoadingNetworkErrorModal = React.useCallback(() => {
    setIsClearDataLoadingNetworkErrorModalOpen(true);
    Animated.parallel([
      Animated.timing(clearDataLoadingNetworkErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clearDataLoadingNetworkErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [clearDataLoadingNetworkErrorOverlayOpacity, clearDataLoadingNetworkErrorModalOpacity]);

  const handleShowBackupServiceBusyModal = React.useCallback(() => {
    setIsBackupServiceBusyModalOpen(true);
    Animated.parallel([
      Animated.timing(backupServiceBusyOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backupServiceBusyModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [backupServiceBusyOverlayOpacity, backupServiceBusyModalOpacity]);

  const handleDismissBackupServiceBusyModal = React.useCallback(async () => {
    Animated.parallel([
      Animated.timing(backupServiceBusyOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backupServiceBusyModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsBackupServiceBusyModalOpen(false);
      
      // Clear backup progress and start cooldown after user dismisses backup service busy modal
      try {
        await clearBackupBackgroundTaskProgress();
        console.log('Cleared backup progress data after user dismissed backup service busy modal');
      } catch (error) {
        console.error('Error clearing backup progress data:', error);
      }
      
      // Start 5-second cooldown period to prevent immediate restart after backup service busy error
      setIsCancelCooldownActive(true);
      setShouldDisableOtherButtons(true);
      console.log('Starting 5-second cooldown after backup service busy modal dismissal');
      
      // Clear any existing cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      cooldownTimerRef.current = setTimeout(() => {
        setIsCancelCooldownActive(false);
        setShouldDisableOtherButtons(false);
        console.log('Cooldown period ended after backup service busy modal dismissal - all buttons re-enabled');
      }, 5000);
    });
  }, [backupServiceBusyOverlayOpacity, backupServiceBusyModalOpacity, clearBackupBackgroundTaskProgress]);

  const handleDismissClearDataLoadingNetworkErrorModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(clearDataLoadingNetworkErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clearDataLoadingNetworkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsClearDataLoadingNetworkErrorModalOpen(false);
    });
  }, [clearDataLoadingNetworkErrorOverlayOpacity, clearDataLoadingNetworkErrorModalOpacity]);

  const handleShowAutomaticCancellationModal = React.useCallback(() => {
    setIsAutomaticCancellationModalOpen(true);
    Animated.parallel([
      Animated.timing(automaticCancellationOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(automaticCancellationModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [automaticCancellationOverlayOpacity, automaticCancellationModalOpacity]);

  const handleDismissAutomaticCancellationModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(automaticCancellationOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(automaticCancellationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAutomaticCancellationModalOpen(false);
    });
  }, [automaticCancellationOverlayOpacity, automaticCancellationModalOpacity]);

  const handleShowImportAutomaticCancellationModal = React.useCallback(() => {
    setIsImportAutomaticCancellationModalOpen(true);
    Animated.parallel([
      Animated.timing(importAutomaticCancellationOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(importAutomaticCancellationModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [importAutomaticCancellationOverlayOpacity, importAutomaticCancellationModalOpacity]);

  const handleDismissImportAutomaticCancellationModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(importAutomaticCancellationOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(importAutomaticCancellationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsImportAutomaticCancellationModalOpen(false);
    });
  }, [importAutomaticCancellationOverlayOpacity, importAutomaticCancellationModalOpacity]);

  const handleShowClearDataAutomaticCancellationModal = React.useCallback(() => {
    setIsClearDataAutomaticCancellationModalOpen(true);
    Animated.parallel([
      Animated.timing(clearDataAutomaticCancellationOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clearDataAutomaticCancellationModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [clearDataAutomaticCancellationOverlayOpacity, clearDataAutomaticCancellationModalOpacity]);

  const handleDismissClearDataAutomaticCancellationModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(clearDataAutomaticCancellationOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clearDataAutomaticCancellationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsClearDataAutomaticCancellationModalOpen(false);
    });
  }, [clearDataAutomaticCancellationOverlayOpacity, clearDataAutomaticCancellationModalOpacity]);

  // Network connectivity check function
  const checkNetworkConnectivity = React.useCallback(async (): Promise<boolean> => {
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Try to fetch a small resource to test network connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isConnected = response.ok;
      console.log('Network connectivity check:', { isConnected, status: response.status });
      return isConnected;
    } catch (error) {
      console.error('Error checking network connectivity:', error);
      return false;
    }
  }, []);

  // Check camera permission status on component mount
  React.useEffect(() => {
    checkCameraPermission();
    checkGalleryPermission();
    checkMicPermission();
    checkNotificationPermission();
    loadNotificationsPreference();
  }, []);



  // Watch for import completion to show success modal
  React.useEffect(() => {
    console.log('Import completion effect triggered:', {
      progress: importBackgroundTaskProgress,
      hasProgress: !!importBackgroundTaskProgress,
      completed: importBackgroundTaskProgress?.completed,
      success: importBackgroundTaskProgress?.success,
      error: importBackgroundTaskProgress?.error,
      networkError: importBackgroundTaskProgress?.networkError,
      isCloudImportPhase: importBackgroundTaskProgress?.isCloudImportPhase,
      noData: importBackgroundTaskProgress?.noData
    });
    
    if (importBackgroundTaskProgress?.completed && importBackgroundTaskProgress?.success && !importBackgroundTaskProgress?.error && !importBackgroundTaskProgress?.networkError) {
      // Set persistent import completion state
      setHasImportCompleted(true);
      
      // If cancel import modal is open when import completes, dismiss it first
      if (isCancelImportModalOpen) {
        console.log('Import completed while cancel modal is open - dismissing cancel modal first');
        setIsCancelImportModalOpen(false);
        cancelImportOverlayOpacity.setValue(0);
        cancelImportModalOpacity.setValue(0);
      }
      
      // Show success modal when import completes (will stay open until manually dismissed)
      handleShowSuccessModal('Import completed!');
    } else if (importBackgroundTaskProgress?.noData) {
      // Show no data modal when there's no data to import
      console.log('Showing no data modal for import');
      handleShowNoDataModal();
    } else if (importBackgroundTaskProgress?.networkError) {
      // Show network error modal for any network error during import
      console.log('Showing network error modal for import');
      handleShowNetworkErrorModal('import');
      
      // For network errors during cloud import phases, trigger cooldown mode
      // This prevents button flickering and ensures proper button states
      if (importBackgroundTaskProgress?.isCloudImportPhase !== false) {
        console.log('Network error during cloud import phase - triggering cooldown mode');
        
        // Set import cancellation states to trigger cooldown mode
        setIsImportCancelCooldownActive(true);
        setShouldDisableOtherButtons(true);
        
        // Clear any existing cooldown timer
        if (importCooldownTimerRef.current) {
          clearTimeout(importCooldownTimerRef.current);
        }
        
        // Set timer to clear cooldown after 5 seconds
        importCooldownTimerRef.current = setTimeout(() => {
          setIsImportCancelCooldownActive(false);
          setShouldDisableOtherButtons(false);
          console.log('Cooldown period ended after network error - import button re-enabled');
        }, 5000);
      }
    }
  }, [importBackgroundTaskProgress, isCancelImportModalOpen, cancelImportOverlayOpacity, cancelImportModalOpacity]);

  // Show success modal on page load if backup was completed
  React.useEffect(() => {
    if (hasBackupCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal('Backup completed successfully!');
    }
  }, [hasBackupCompleted, isSuccessModalOpen]);

  // Show success modal on page load if import was completed
  React.useEffect(() => {
    if (hasImportCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal('Import completed!');
    }
  }, [hasImportCompleted, isSuccessModalOpen]);

  // Hide loading screen when backup background task starts running
  React.useEffect(() => {
    if (isBackupLoading && isBackupBackgroundTaskRunning) {
      // Set isBackupLoading to false to hide loading screen
      setIsBackupLoading(false);
      
      // Then animate out the loading overlay
      Animated.timing(backupLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isBackupBackgroundTaskRunning, isBackupLoading, backupLoadingOverlayOpacity]);

  // Hide import loading screen when import starts running
  React.useEffect(() => {
    if (isImportLoading && isImportBackgroundTaskRunning) {
      // Set isImportLoading to false to hide loading screen
      setIsImportLoading(false);
      
      // Then animate out the loading overlay
      Animated.timing(importLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isImportBackgroundTaskRunning, isImportLoading, importLoadingOverlayOpacity]);

  // Control button disable state based on backup, import, and clear data status
  React.useEffect(() => {
    // Don't disable buttons during loading states - only disable when actual operations are running
    const shouldDisable = isBackupBackgroundTaskRunning || isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive || isImportBackgroundTaskRunning || isImportCancelCooldownActive || isImportStopping || isImportCleanupInProgress || isClearDataBackgroundTaskRunning || isClearDataCancelCooldownActive || isLocallyStoppingClearData || isLocallyStartingClearData || isDataRestorationInProgress;
    
    // Additional safety: never disable buttons during loading states
    const isAnyLoading = isBackupLoading || isImportLoading || isClearDataLoading;
    const finalShouldDisable = shouldDisable && !isAnyLoading;
    
    setShouldDisableOtherButtons(finalShouldDisable);
  }, [isBackupBackgroundTaskRunning, isBackupCleanupInProgress, isBackupStopping, isLocallyStoppingBackup, isCancelCooldownActive, isImportBackgroundTaskRunning, isImportCancelCooldownActive, isImportStopping, isImportCleanupInProgress, isClearDataBackgroundTaskRunning, isClearDataCancelCooldownActive, isLocallyStoppingClearData, isLocallyStartingClearData, isDataRestorationInProgress, isBackupLoading, isImportLoading, isClearDataLoading]);

  // Handle notification responses for backup completion
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'backup_completed') {
        // Set persistent backup completion state
        setHasBackupCompleted(true);
        // Show success modal when user taps on backup notification (will stay open until manually dismissed)
        handleShowSuccessModal('Backup completed successfully!');
      } else if (data?.type === 'backup_network_error') {
        // Show persistent network error modal when user taps on network error notification
        handleShowNetworkErrorModal('backup');
      } else if (data?.type === 'backup_service_busy') {
        // Show persistent backup service busy modal when user taps on backup service busy notification
        handleShowBackupServiceBusyModal();
      } else if (data?.type === 'import_network_error') {
        // Show persistent network error modal when user taps on import network error notification
        handleShowNetworkErrorModal('import');
      } else if (data?.type === 'clear_data_completed') {
        // Set persistent clear data completion state
        setHasClearDataCompleted(true);
        // Show success modal when user taps on clear data notification (will stay open until manually dismissed)
        handleShowSuccessModal('Clear data completed successfully!');
      } else if (data?.type === 'clear_data_network_error') {
        // Show persistent network error modal when user taps on clear data network error notification
        handleShowNetworkErrorModal('clearData');
      }
    });

    return () => subscription.remove();
  }, [handleShowNetworkErrorModal, handleShowBackupServiceBusyModal]);

  // Sync local stopping state with context stopping state
  React.useEffect(() => {
    if (!isBackupStopping && isLocallyStoppingBackup) {
      // Context stopping state cleared, clear local state too
      console.log('Context stopping cleared - clearing local stopping state');
      setIsLocallyStoppingBackup(false);
    }
  }, [isBackupStopping, isLocallyStoppingBackup]);

  // Cleanup cooldown timer on unmount
  React.useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      if (importCooldownTimerRef.current) {
        clearTimeout(importCooldownTimerRef.current);
      }
      if (clearDataCooldownTimerRef.current) {
        clearTimeout(clearDataCooldownTimerRef.current);
      }
    };
  }, []);

  // Handle automatic cancellation and trigger cooldown
  React.useEffect(() => {
    if (wasAutomaticallyCancelled) {
      console.log('Detected automatic backup cancellation - starting cooldown');
      
      // Set local stopping state to provide UI feedback
      setIsLocallyStoppingBackup(true);
      
      // Keep other buttons disabled during cooldown
      setShouldDisableOtherButtons(true);
      
      // Start 5-second cooldown period to prevent immediate restart
      setIsCancelCooldownActive(true);
      console.log('Starting 5-second cooldown after automatic backup cancellation');
      
      // Clear any existing cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      cooldownTimerRef.current = setTimeout(() => {
        setIsCancelCooldownActive(false);
        setIsLocallyStoppingBackup(false);
        console.log('Cooldown period ended after automatic cancellation - backup button re-enabled');
      }, 5000);
      
      // Show persistent automatic cancellation modal
      handleShowAutomaticCancellationModal();
      
      // Reset the automatic cancellation flag
      resetAutomaticallyCancelledFlag();
    }
  }, [wasAutomaticallyCancelled, resetAutomaticallyCancelledFlag, handleShowAutomaticCancellationModal]);

  // Handle import automatic cancellation and trigger cooldown
  React.useEffect(() => {
    if (wasImportAutomaticallyCancelled) {
      console.log('Detected automatic import cancellation - starting cooldown');
      
      // Keep other buttons disabled during cooldown
      setShouldDisableOtherButtons(true);
      
      // Start 5-second cooldown period to prevent immediate restart
      setIsImportCancelCooldownActive(true);
      console.log('Starting 5-second cooldown after automatic import cancellation');
      
      // Clear any existing cooldown timer
      if (importCooldownTimerRef.current) {
        clearTimeout(importCooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      importCooldownTimerRef.current = setTimeout(() => {
        setIsImportCancelCooldownActive(false);
        console.log('Cooldown period ended after automatic import cancellation - import button re-enabled');
      }, 5000);
      
      // Show persistent automatic cancellation modal
      handleShowImportAutomaticCancellationModal();
      
      // Reset the automatic cancellation flag
      resetImportAutomaticallyCancelledFlag();
    }
  }, [wasImportAutomaticallyCancelled, resetImportAutomaticallyCancelledFlag, handleShowImportAutomaticCancellationModal]);



  // Show success modal on page load if clear data was completed
  React.useEffect(() => {
    if (hasClearDataCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal('Clear data completed successfully!');
    }
  }, [hasClearDataCompleted, isSuccessModalOpen]);

  // Hide clear data loading screen when clear data background task starts running
  React.useEffect(() => {
    if (isClearDataLoading && isClearDataBackgroundTaskRunning) {
      // Set isClearDataLoading to false to hide loading screen
      setIsClearDataLoading(false);
      
      // Then animate out the loading overlay
      Animated.timing(clearDataLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isClearDataBackgroundTaskRunning, isClearDataLoading, clearDataLoadingOverlayOpacity]);

  // Handle clear data automatic cancellation and trigger cooldown
  React.useEffect(() => {
    if (wasClearDataAutomaticallyCancelled) {
      console.log('Detected automatic clear data cancellation - starting cooldown');
      
      // Set local stopping state to provide UI feedback
      setIsLocallyStoppingClearData(true);
      
      // Keep other buttons disabled during cooldown
      setShouldDisableOtherButtons(true);
      
      // Start 5-second cooldown period to prevent immediate restart
      setIsClearDataCancelCooldownActive(true);
      console.log('Starting 5-second cooldown after automatic clear data cancellation');
      
      // Clear any existing cooldown timer
      if (clearDataCooldownTimerRef.current) {
        clearTimeout(clearDataCooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      clearDataCooldownTimerRef.current = setTimeout(() => {
        setIsClearDataCancelCooldownActive(false);
        setIsLocallyStoppingClearData(false);
        console.log('Cooldown period ended after automatic clear data cancellation - clear data button re-enabled');
      }, 5000);
      
      // Show persistent automatic cancellation modal
      handleShowClearDataAutomaticCancellationModal();
      
      // Reset the automatic cancellation flag
      resetClearDataAutomaticallyCancelledFlag();
    }
  }, [wasClearDataAutomaticallyCancelled, resetClearDataAutomaticallyCancelledFlag, handleShowClearDataAutomaticCancellationModal]);

  // Sync clear data local stopping state with context stopping state
  React.useEffect(() => {
    if (!isClearDataBackgroundTaskRunning && isLocallyStoppingClearData) {
      // Context stopping state cleared, clear local state too
      console.log('Clear data context stopping cleared - clearing local stopping state');
      setIsLocallyStoppingClearData(false);
    }
  }, [isClearDataBackgroundTaskRunning, isLocallyStoppingClearData]);

  const loadNotificationsPreference = async () => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        const result = await db.getFirstAsync(`
          SELECT notificationsEnabled FROM users WHERE userID = ?
        `, [userID]);
        
        if (result) {
          const userData = result as { notificationsEnabled: number };
          setNotificationsAccessEnabled(userData.notificationsEnabled === 1);
        }
      }
    } catch (error) {
      console.error('Error loading notifications preference:', error);
    }
  };

  const saveNotificationsPreference = async (value: boolean) => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        await db.runAsync(`
          UPDATE users 
          SET notificationsEnabled = ?
          WHERE userID = ?
        `, [value ? 1 : 0, userID]);
      }
    } catch (error) {
      console.error('Error saving notifications preference:', error);
    }
  };

  const handleNotificationsToggle = React.useCallback(async (value: boolean) => {
    if (value) {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsAccessEnabled(true);
        saveNotificationsPreference(true);
      } else {
        // If permission denied, show alert and open settings
        Alert.alert(
          language === 'Chinese' ? '需要通知权限' : 'Notification Permission Required',
          language === 'Chinese' 
            ? '请在设置中启用通知权限以接收卡组创建完成的通知。' 
            : 'Please enable notification permissions in settings to receive deck creation notifications.',
          [
            { text: language === 'Chinese' ? '取消' : 'Cancel', style: 'cancel' },
            { 
              text: language === 'Chinese' ? '打开设置' : 'Open Settings', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
      }
    } else {
      setNotificationsAccessEnabled(false);
      saveNotificationsPreference(false);
    }
  }, [language]);

  const checkCameraPermission = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    setCameraAccessEnabled(status === 'granted');
  };

  const checkGalleryPermission = async () => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    setGalleryAccessEnabled(status === 'granted');
  };

  const checkMicPermission = async () => {
    const { status } = await Audio.getPermissionsAsync();
    setMicAccessEnabled(status === 'granted');
  };

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsAccessEnabled(status === 'granted');
  };





  const handleLanguageRowPress = React.useCallback(() => {
    setIsLanguageModalOpen(true);
  }, []);

  const handleLanguageSelect = React.useCallback((value: string) => {
    setLanguage(value as Language);
    setIsLanguageModalOpen(false);
  }, [setLanguage]);

  const handleCameraToggle = React.useCallback(async (value: boolean) => {
    if (value) {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setCameraAccessEnabled(true);
      } else {
        Alert.alert(
          strings[language].appSettingsPage.cameraPermissionRequired,
          strings[language].appSettingsPage.cameraPermissionMessage,
          [
            { text: strings[language].cancel, style: 'cancel' },
            { text: strings[language].appSettingsPage.settings, onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // Note: We cannot programmatically revoke permissions on iOS/Android
      // The user would need to manually disable it in device settings
      Alert.alert(
        strings[language].appSettingsPage.cameraPermission,
        strings[language].appSettingsPage.cameraPermissionDisableMessage,
        [
          { text: strings[language].cancel, style: 'cancel' },
          { text: strings[language].appSettingsPage.settings, onPress: () => Linking.openSettings() }
        ]
      );
    }
  }, [language]);

  const handleGalleryToggle = React.useCallback(async (value: boolean) => {
    if (value) {
      // Request camera permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        setGalleryAccessEnabled(true);
      } else {
        Alert.alert(
          strings[language].appSettingsPage.galleryPermissionRequired,
          strings[language].appSettingsPage.galleryPermissionMessage,
          [
            { text: strings[language].cancel, style: 'cancel' },
            { text: strings[language].appSettingsPage.settings, onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // Note: We cannot programmatically revoke permissions on iOS/Android
      // The user would need to manually disable it in device settings
      Alert.alert(
        strings[language].appSettingsPage.galleryPermission,
        strings[language].appSettingsPage.galleryPermissionDisableMessage,
        [
          { text: strings[language].cancel, style: 'cancel' },
          { text: strings[language].appSettingsPage.settings, onPress: () => Linking.openSettings() }
        ]
      );
    }
  }, [language]);

  const handleMicToggle = React.useCallback(async (value: boolean) => {
    if (value) {
      // Request microphone permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setMicAccessEnabled(true);
      } else {
        Alert.alert(
          strings[language].appSettingsPage.microphonePermissionRequired,
          strings[language].appSettingsPage.microphonePermissionMessage,
          [
            { text: strings[language].cancel, style: 'cancel' },
            { text: strings[language].appSettingsPage.settings, onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // Cannot programmatically revoke mic permissions
      Alert.alert(
        strings[language].appSettingsPage.microphonePermission,
        strings[language].appSettingsPage.microphonePermissionDisableMessage,
        [
          { text: strings[language].cancel, style: 'cancel' },
          { text: strings[language].appSettingsPage.settings, onPress: () => Linking.openSettings() }
        ]
      );
    }
  }, [language]);


  // Navigation guard modal state
  const [isNavigationGuardModalOpen, setIsNavigationGuardModalOpen] = React.useState(false);
  const navigationGuardOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const navigationGuardModalOpacity = React.useRef(new Animated.Value(0)).current;

  const handleShowNavigationGuardModal = React.useCallback((processType: 'backup' | 'import' | 'deletion') => {
    setNavigationBlockingProcess(processType);
    setIsNavigationGuardModalOpen(true);
    Animated.parallel([
      Animated.timing(navigationGuardOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(navigationGuardModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [navigationGuardOverlayOpacity, navigationGuardModalOpacity]);

  const handleDismissNavigationGuardModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(navigationGuardOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(navigationGuardModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNavigationGuardModalOpen(false);
      setNavigationBlockingProcess(null);
    });
  }, [navigationGuardOverlayOpacity, navigationGuardModalOpacity]);

  // Watch for clear data completion to show success modal
  React.useEffect(() => {
    if (clearDataBackgroundTaskProgress?.completed && clearDataBackgroundTaskProgress?.success && !clearDataBackgroundTaskProgress?.error && !clearDataBackgroundTaskProgress?.networkError) {
      // Set persistent clear data completion state
      setHasClearDataCompleted(true);
      
      // Reset restoration state to allow navigation
      setIsDataRestorationInProgress(false);
      
      // If navigation guard modal is open when clear data completes, dismiss it first
      if (isNavigationGuardModalOpen) {
        console.log('Clear data completed while navigation guard modal is open - dismissing navigation guard modal first');
        // Immediately dismiss navigation guard modal without animation to make it seamless
        setIsNavigationGuardModalOpen(false);
        navigationGuardOverlayOpacity.setValue(0);
        navigationGuardModalOpacity.setValue(0);
        setNavigationBlockingProcess(null);
      }
      
      // If cancel clear data modal is open when clear data completes, dismiss it first
      if (isCancelClearDataModalOpen) {
        console.log('Clear data completed while cancel modal is open - dismissing cancel modal first');
        // Immediately dismiss cancel modal without animation to make it seamless
        setIsCancelClearDataModalOpen(false);
        cancelClearDataOverlayOpacity.setValue(0);
        cancelClearDataModalOpacity.setValue(0);
      }
      
      // Show success modal when clear data completes (will stay open until manually dismissed)
      handleShowSuccessModal(clearDataBackgroundTaskProgress.message || 'Clear data completed successfully!');
    } else if (clearDataBackgroundTaskProgress?.networkError && !hasNetworkErrorModalBeenShown) {
      // Show persistent network error modal only if it hasn't been shown yet
      handleShowNetworkErrorModal('clearData');
      // Reset restoration state to allow navigation
      setIsDataRestorationInProgress(false);
    } else if (clearDataBackgroundTaskProgress?.noData) {
      // Show no clear data modal when there's no data to clear
      console.log('Showing no clear data modal');
      handleShowNoClearDataModal();
      // Reset restoration state to allow navigation
      setIsDataRestorationInProgress(false);
    } else if (clearDataBackgroundTaskProgress?.error || clearDataBackgroundTaskProgress?.cancelled) {
      // Reset restoration state to allow navigation for any other completion state
      setIsDataRestorationInProgress(false);
    }
  }, [clearDataBackgroundTaskProgress, isCancelClearDataModalOpen, cancelClearDataOverlayOpacity, cancelClearDataModalOpacity, isNavigationGuardModalOpen, navigationGuardOverlayOpacity, navigationGuardModalOpacity, hasNetworkErrorModalBeenShown]);

  // Watch for backup completion to show success modal
  React.useEffect(() => {
    if (backupBackgroundTaskProgress?.completed && backupBackgroundTaskProgress?.success && !backupBackgroundTaskProgress?.error && !backupBackgroundTaskProgress?.networkError) {
      // Set persistent backup completion state
      setHasBackupCompleted(true);
      
      // If cancel backup modal is open when backup completes, dismiss it first
      if (isCancelBackupModalOpen) {
        console.log('Backup completed while cancel modal is open - dismissing cancel modal first');
        // Immediately dismiss cancel modal without animation to make it seamless
        setIsCancelBackupModalOpen(false);
        cancelBackupOverlayOpacity.setValue(0);
        cancelBackupModalOpacity.setValue(0);
      }
      
      // If navigation guard modal is open when backup completes, dismiss it first
      if (isNavigationGuardModalOpen && navigationBlockingProcess === 'backup') {
        console.log('Backup completed while navigation guard modal is open - dismissing navigation guard modal first');
        // Immediately dismiss navigation guard modal without animation to make it seamless
        setIsNavigationGuardModalOpen(false);
        navigationGuardOverlayOpacity.setValue(0);
        navigationGuardModalOpacity.setValue(0);
        setNavigationBlockingProcess(null);
      }
      
      // Show success modal when backup completes (will stay open until manually dismissed)
      handleShowSuccessModal(backupBackgroundTaskProgress.message || 'Backup completed successfully!');
    } else if (backupBackgroundTaskProgress?.networkError && !hasNetworkErrorModalBeenShown) {
      // Show persistent network error modal only if it hasn't been shown yet
      handleShowNetworkErrorModal('backup');
    } else if (backupBackgroundTaskProgress?.error && !hasNetworkErrorModalBeenShown) {
      // Check if this is a backup service busy error (PGRST002 schema cache error)
      const errorMessage = backupBackgroundTaskProgress?.errorMessage || '';
      const isBackupServiceBusy = backupBackgroundTaskProgress?.isBackupServiceBusy || 
        errorMessage.includes('PGRST002') || 
        errorMessage.includes('schema cache') || 
        errorMessage.includes('Could not query the database for the schema cache');
      
      if (isBackupServiceBusy) {
        // Show backup service busy modal for schema cache errors
        handleShowBackupServiceBusyModal();
        setHasNetworkErrorModalBeenShown(true); // Prevent showing other error modals
      } else {
        // Show generic network error modal for other errors
        handleShowNetworkErrorModal('backup');
      }
    }
  }, [backupBackgroundTaskProgress, isCancelBackupModalOpen, cancelBackupOverlayOpacity, cancelBackupModalOpacity, isNavigationGuardModalOpen, navigationGuardOverlayOpacity, navigationGuardModalOpacity, navigationBlockingProcess, hasNetworkErrorModalBeenShown, handleShowBackupServiceBusyModal, handleShowNetworkErrorModal]);

  // Background progress monitoring for clear data (ensures progress updates even when app is backgrounded)
  React.useEffect(() => {
    if (clearDataBackgroundTaskProgress?.inProgress && !clearDataBackgroundTaskProgress?.completed) {
      // Set up interval to check for progress updates even when app is backgrounded
      const progressInterval = setInterval(async () => {
        try {
          // Force a progress update to ensure the UI reflects the latest progress
          // This helps when the app comes back to foreground
          if (clearDataBackgroundTaskProgress) {
            // Trigger a re-render by updating the progress state
            // The actual progress data comes from the background task
            console.log('Background progress check - current percentage:', clearDataBackgroundTaskProgress.percentage);
          }
        } catch (error) {
          console.error('Error in background progress monitoring:', error);
        }
      }, 1000); // Check every 1 second for more responsive updates
      
      return () => clearInterval(progressInterval);
    }
  }, [clearDataBackgroundTaskProgress]);

  // Enhanced background progress monitoring using AppState to detect when app comes to foreground
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && clearDataBackgroundTaskProgress?.inProgress && !clearDataBackgroundTaskProgress?.completed) {
        // App came to foreground - force a progress update to ensure UI is current
        console.log('App returned to foreground - refreshing clear data progress');
        
        // Trigger a re-render by updating the progress state
        // This ensures the progress bar shows the current progress immediately
        setClearDataBackgroundTaskProgress((prev: any) => prev ? { ...prev, timestamp: Date.now() } : prev);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [clearDataBackgroundTaskProgress]);

  const handleBackPress = React.useCallback(() => {
    // Check if backup, import, or clear data is running and prevent navigation
    if (isBackupBackgroundTaskRunning || isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive) {
      handleShowNavigationGuardModal('backup');
      return;
    } else if (isImportBackgroundTaskRunning || isImportStopping || isImportCancelCooldownActive || isImportCleanupInProgress) {
      handleShowNavigationGuardModal('import');
      return;
    } else if (isClearDataBackgroundTaskRunning || isLocallyStartingClearData || isDataRestorationInProgress) {
      handleShowNavigationGuardModal('deletion');
      return;
    }
    
    router.back();
  }, [router, isBackupBackgroundTaskRunning, isBackupCleanupInProgress, isBackupStopping, isLocallyStoppingBackup, isCancelCooldownActive, isImportBackgroundTaskRunning, isImportStopping, isImportCancelCooldownActive, isImportCleanupInProgress, isClearDataBackgroundTaskRunning, isLocallyStartingClearData, isDataRestorationInProgress, handleShowNavigationGuardModal]);

  const handleBackupPress = React.useCallback(() => {
    setIsBackupModalOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [overlayOpacity, modalOpacity]);

  const handleDismissBackup = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackupModalOpen(false);
    });
  }, [overlayOpacity, modalOpacity]);

  const handleConfirmBackup = React.useCallback(async () => {
    try {
      // Dismiss the confirmation modal first
      handleDismissBackup();
      
      // Check if there's any data to backup
      const hasDataToBackup = await checkForBackupData();
      if (!hasDataToBackup) {
        console.log('No data to backup - showing modal');
        handleShowNoBackupDataModal();
        return;
      }
      
      // Show loading screen IMMEDIATELY to prevent any button UI changes
      setIsBackupLoading(true);
      Animated.timing(backupLoadingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Small delay to ensure loading screen renders before any state changes
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Cancel any existing backup task to ensure clean state
      if (isBackupBackgroundTaskRunning) {
        console.log('Cancelling existing backup task before starting new one...');
        
        // Set local stopping state to prevent new backup attempts
        setIsLocallyStoppingBackup(true);
        
        // Force stop the backup background task
        forceStopBackupBackgroundTask();
        
        // Stop the actual background service
        await stopBackupBackgroundTask();
        
        // Clear the backup progress data thoroughly
        await clearBackupBackgroundTaskProgress();
        
        // Additional cleanup: manually remove all backup-related AsyncStorage keys
        try {
          await AsyncStorage.multiRemove([
            'backupDataBgTaskProgress',
            'backupProgress',
            'backupState'
          ]);
          console.log('Additional AsyncStorage cleanup completed for existing backup task');
        } catch (cleanupError) {
          console.warn('Additional cleanup failed for existing backup task:', cleanupError);
        }
        
        // Wait for the cancellation to complete
        console.log('Waiting for existing backup task cancellation to complete...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear local stopping state since we're about to start a new backup
        setIsLocallyStoppingBackup(false);
      }
      
      // Check if cleanup, stopping, or cooldown is in progress and wait for it to complete
      if (isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive) {
        console.log('Backup cleanup in progress, waiting for completion...');
        
        // Wait for cleanup/cooldown to complete (max 10 seconds to account for 5-second cooldown)
        let waitCount = 0;
        const maxWait = 100; // 10 seconds (100 * 100ms)
        
        while ((isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive) && waitCount < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        
        if (isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive) {
          console.warn('Cleanup/stopping/cooldown took too long, proceeding anyway');
        } else {
          console.log('Cleanup/stopping/cooldown completed, proceeding with backup');
        }
      }
      
      // Reset any force stopped flags from previous cancellations
      resetBackupForceStoppedFlag();
      
      // Reset automatic cancellation flag for clean state
      resetAutomaticallyCancelledFlag();
      
      // Reset network error modal state for clean state
      setHasNetworkErrorModalBeenShown(false);
      
      // Ensure clean state by clearing any residual progress data
      await clearBackupBackgroundTaskProgress();
      
      // Wait for cleanup/stopping/cooldown to fully complete
      if (isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive) {
        console.log('Waiting for final cleanup/stopping/cooldown completion...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Verify clean state
      try {
        const progressCheck = await AsyncStorage.getItem('backupDataBgTaskProgress');
        if (progressCheck) {
          console.warn('Warning: Found residual backup progress before starting new backup:', progressCheck);
          // Force clear it
          await AsyncStorage.removeItem('backupDataBgTaskProgress');
        } else {
          console.log('Confirmed: Clean state before starting new backup');
        }
      } catch (checkError) {
        console.warn('Error checking backup state:', checkError);
      }
      
      // Clear local stopping state and cooldown since we're starting a new backup
      setIsLocallyStoppingBackup(false);
      setIsCancelCooldownActive(false);
      
      // Clear any existing cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      
      // Check network connectivity before starting backup
      const isNetworkConnected = await checkNetworkConnectivity();
      if (!isNetworkConnected) {
        // Hide loading screen
        Animated.timing(backupLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsBackupLoading(false);
        });
        
        // Show network error modal
        handleShowBackupLoadingNetworkErrorModal();
        return;
      }
      
      // Start the backup background task
      const success = await startBackupBackgroundTask(getToken, language);
      
      if (!success) {
        // Hide loading screen
        Animated.timing(backupLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsBackupLoading(false);
        });
        
        Alert.alert(
          strings[language].error,
          'Failed to start backup process',
          [{ text: strings[language].ok }]
        );
        return;
      }
      
      // Start background task monitoring AFTER the task starts successfully
      // This prevents the monitoring from detecting the running state before the loading screen hides
      startBackupBackgroundTaskMonitoring();
      
      // Add a small delay to ensure the loading screen has time to hide
      // before the monitoring detects the backup is running
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If success, the loading screen will be hidden when isBackupBackgroundTaskRunning becomes true
    } catch (error) {
      // Hide loading screen
      Animated.timing(backupLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsBackupLoading(false);
      });
      
      Alert.alert(
        strings[language].error,
        `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissBackup, language, getToken, startBackupBackgroundTaskMonitoring, backupLoadingOverlayOpacity, resetBackupForceStoppedFlag, clearBackupBackgroundTaskProgress, isBackupCleanupInProgress, isBackupStopping, isLocallyStoppingBackup, isCancelCooldownActive, checkNetworkConnectivity, handleShowBackupLoadingNetworkErrorModal, isBackupBackgroundTaskRunning, forceStopBackupBackgroundTask, stopBackupBackgroundTask]);

  const handleLoadDataPress = React.useCallback(() => {
    setIsLoadDataModalOpen(true);
    Animated.parallel([
      Animated.timing(loadDataOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(loadDataModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })    
    ]).start();
  }, [loadDataOverlayOpacity, loadDataModalOpacity]);
  
  const handleDismissLoadData = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(loadDataOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(loadDataModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsLoadDataModalOpen(false);
    });
  }, [loadDataOverlayOpacity, loadDataModalOpacity]);

  const handleConfirmLoadData = React.useCallback(async () => {
    try {
      // Dismiss the confirmation modal first
      handleDismissLoadData();
      
      // Show loading screen IMMEDIATELY to prevent any button UI changes
      setIsImportLoading(true);
      Animated.timing(importLoadingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Small delay to ensure loading screen renders before any state changes
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Cancel any existing import task to ensure clean state
      if (isImportBackgroundTaskRunning) {
        console.log('Cancelling existing import task before starting new one...');
        
        // Force stop the import background task
        forceStopImportBackgroundTask();
        
        // Stop the actual background service
        await stopImportBackgroundTask();
        
        // Clear the import progress data thoroughly
        await clearImportBackgroundTaskProgress();
        
        // Additional cleanup: manually remove all import-related AsyncStorage keys
        try {
          await AsyncStorage.multiRemove([
            'importDataBgTaskProgress',
            'importProgress',
            'importState'
          ]);
          console.log('Additional AsyncStorage cleanup completed for existing import task');
        } catch (cleanupError) {
          console.warn('Additional cleanup failed for existing import task:', cleanupError);
        }
        
        // Wait for the cancellation to complete
        console.log('Waiting for existing import task cancellation to complete...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Reset any force stopped flags from previous cancellations
      resetImportForceStoppedFlag();
      
      // Reset automatic cancellation flag for clean state
      resetImportAutomaticallyCancelledFlag();
      
      // Reset import completion state for clean state
      setHasImportCompleted(false);
      
      // Ensure clean state by clearing any residual progress data
      await clearImportBackgroundTaskProgress();
      

      
      // Verify clean state
      try {
        const progressCheck = await AsyncStorage.getItem('importDataBgTaskProgress');
        if (progressCheck) {
          console.warn('Warning: Found residual import progress before starting new import:', progressCheck);
          // Force clear it
          await AsyncStorage.removeItem('importDataBgTaskProgress');
        } else {
          console.log('Confirmed: Clean state before starting new import');
        }
      } catch (checkError) {
        console.warn('Error checking import state:', checkError);
      }
      
      // Start background task monitoring
      startImportBackgroundTaskMonitoring();
      
      // Check network connectivity before starting import
      const isNetworkConnected = await checkNetworkConnectivity();
      if (!isNetworkConnected) {
        // Hide loading screen
        Animated.timing(importLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsImportLoading(false);
        });
        
        // Show network error modal
        handleShowImportLoadingNetworkErrorModal();
        return;
      }
      
      // Start the import background task
      const success = await startImportBackgroundTask(getToken, language);
      
      if (!success) {
        // Hide loading screen
        Animated.timing(importLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsImportLoading(false);
        });
        
        Alert.alert(
          strings[language].error,
          'Failed to start import process',
          [{ text: strings[language].ok }]
        );
      }
      // If success, the loading screen will be hidden when isImportBackgroundTaskRunning becomes true
    } catch (error) {
      // Hide loading screen
      Animated.timing(importLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsImportLoading(false);
      });
      
      Alert.alert(
        strings[language].error,
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissLoadData, language, getToken, startImportBackgroundTaskMonitoring, importLoadingOverlayOpacity, resetImportForceStoppedFlag, clearImportBackgroundTaskProgress, isImportBackgroundTaskRunning, forceStopImportBackgroundTask, stopImportBackgroundTask, checkNetworkConnectivity, handleShowImportLoadingNetworkErrorModal]);

  const handleClearDataPress = React.useCallback(() => {
    setIsDeleteLocalStorageModalOpen(true);
    Animated.parallel([
      Animated.timing(deleteLocalStorageOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteLocalStorageModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [deleteLocalStorageOverlayOpacity, deleteLocalStorageModalOpacity]);

  const handleDismissClearData = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(deleteLocalStorageOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteLocalStorageModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsDeleteLocalStorageModalOpen(false);
    });
  }, [deleteLocalStorageOverlayOpacity, deleteLocalStorageModalOpacity]);

  const handleConfirmClearData = React.useCallback(async () => {
    try {
      // Dismiss the confirmation modal first
      handleDismissClearData();
      
      // Cancel any existing clear data task to ensure clean state
      if (isClearDataBackgroundTaskRunning) {
        console.log('Cancelling existing clear data task before starting new one...');
        
        // Force stop the clear data background task
        forceStopClearDataBackgroundTask();
        
        // Stop the actual background service
        await stopClearDataBackgroundTask();
        
        // Clear the clear data progress data thoroughly
        await clearClearDataBackgroundTaskProgress();
        
        // Additional cleanup: manually remove all clear data-related AsyncStorage keys
        try {
          await AsyncStorage.multiRemove([
            'clearDataBgTaskProgress',
            'clearDataProgress',
            'clearDataState'
          ]);
          console.log('Additional AsyncStorage cleanup completed for existing clear data task');
        } catch (cleanupError) {
          console.warn('Additional cleanup failed for existing clear data task:', cleanupError);
        }
        
        // Wait for the cancellation to complete
        console.log('Waiting for existing clear data task cancellation to complete...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Reset any force stopped flags from previous cancellations
      resetClearDataForceStoppedFlag();
      
      // Reset automatic cancellation flag for clean state
      resetClearDataAutomaticallyCancelledFlag();
      
      // Ensure clean state by clearing any residual progress data
      await clearClearDataBackgroundTaskProgress();
      
      // Verify clean state
      try {
        const progressCheck = await AsyncStorage.getItem('clearDataBgTaskProgress');
        if (progressCheck) {
          console.warn('Warning: Found residual clear data progress before starting new clear data:', progressCheck);
          // Force clear it
          await AsyncStorage.removeItem('clearDataBgTaskProgress');
        } else {
          console.log('Confirmed: Clean state before starting new clear data');
        }
      } catch (checkError) {
        console.warn('Error checking clear data state:', checkError);
      }
      
      // Check network connectivity before starting clear data
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        // Show network error modal
        handleShowClearDataLoadingNetworkErrorModal();
        return;
      }
      
      // Show loading screen first
      setIsClearDataLoading(true);
      Animated.timing(clearDataLoadingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Wait for loading animation to complete (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dismiss loading screen
      Animated.timing(clearDataLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsClearDataLoading(false);
      });
      
      // Small delay to ensure loading screen is dismissed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Start background task monitoring
      startClearDataBackgroundTaskMonitoring();
      
      // Set local state immediately to show progress bar
      setIsLocallyStartingClearData(true);
      
      // Start the clear data background task
      const success = await startClearDataBackgroundTask(language);
      
      if (!success) {
        // Hide loading screen
        Animated.timing(clearDataLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsClearDataLoading(false);
        });
        
        Alert.alert(
          strings[language].error,
          'Failed to start clear data process',
          [{ text: strings[language].ok }]
        );
      }
      // If success, the loading screen will be hidden when isClearDataBackgroundTaskRunning becomes true
    } catch (error) {
      // Hide loading screen
      Animated.timing(clearDataLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsClearDataLoading(false);
      });
      
      Alert.alert(
        strings[language].error,
        `Clear data failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissClearData, language, startClearDataBackgroundTaskMonitoring, clearDataLoadingOverlayOpacity, resetClearDataForceStoppedFlag, clearClearDataBackgroundTaskProgress, isClearDataBackgroundTaskRunning, forceStopClearDataBackgroundTask, stopClearDataBackgroundTask, checkNetworkConnectivity, handleShowClearDataLoadingNetworkErrorModal]);

  const handleDeleteLocalStoragePress = React.useCallback(() => {
    setIsDeleteLocalStorageModalOpen(true);
    Animated.parallel([
      Animated.timing(deleteLocalStorageOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,    
      }),
      Animated.timing(deleteLocalStorageModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })  
    ]).start();
  }, [deleteLocalStorageOverlayOpacity, deleteLocalStorageModalOpacity]);
  
  const handleDismissDeleteLocalStorage = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(deleteLocalStorageOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteLocalStorageModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsDeleteLocalStorageModalOpen(false);
    });
  }, [deleteLocalStorageOverlayOpacity, deleteLocalStorageModalOpacity]);    

  const handleConfirmDeleteLocalStorage = React.useCallback(() => {
    // Call the actual clear data logic
    handleConfirmClearData();
  }, [handleConfirmClearData]);

  const handleShowSuccessModal = React.useCallback((message: string) => {
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
    Animated.parallel([
      Animated.timing(successOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [successOverlayOpacity, successModalOpacity]);

  const handleDismissSuccessModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(successOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsSuccessModalOpen(false);
      // Clear the persistent backup completion state when user manually dismisses
      setHasBackupCompleted(false);
      
      // Clear the persistent import completion state when user manually dismisses
      setHasImportCompleted(false);
      
      // Clear the persistent clear data completion state when user manually dismisses
      setHasClearDataCompleted(false);
      
      // Also clear the backup progress data from AsyncStorage to prevent it from showing again
      try {
        await AsyncStorage.removeItem('backupDataBgTaskProgress');
        console.log('Cleared backup progress data after user dismissed success modal');
      } catch (error) {
        console.error('Error clearing backup progress data:', error);
      }
      
      // Also clear the import progress data from AsyncStorage to prevent it from showing again
      try {
        await AsyncStorage.removeItem('importDataBgTaskProgress');
        console.log('Cleared import progress data after user dismissed success modal');
      } catch (error) {
        console.error('Error clearing import progress data:', error);
      }
      
      // Also clear the clear data progress data from AsyncStorage to prevent it from showing again
      try {
        await AsyncStorage.removeItem('clearDataBgTaskProgress');
        console.log('Cleared clear data progress data after user dismissed success modal');
      } catch (error) {
        console.error('Error clearing clear data progress data:', error);
      }
    });
  }, [successOverlayOpacity, successModalOpacity]);

  const handleCancelBackupPress = React.useCallback(() => {
    setIsCancelBackupModalOpen(true);
    Animated.parallel([
      Animated.timing(cancelBackupOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cancelBackupModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [cancelBackupOverlayOpacity, cancelBackupModalOpacity]);

  const handleDismissCancelBackup = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(cancelBackupOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cancelBackupModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsCancelBackupModalOpen(false);
    });
  }, [cancelBackupOverlayOpacity, cancelBackupModalOpacity]);

  const handleConfirmCancelBackup = React.useCallback(async () => {
    try {
      // Dismiss the confirmation modal first
      handleDismissCancelBackup();
      
      // Wait for the modal dismissal animation to complete before setting state
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Set local stopping state to prevent new backup attempts
      // This provides instant UI feedback before context state updates
      setIsLocallyStoppingBackup(true);
      
      // Keep other buttons disabled during cancellation and cooldown
      setShouldDisableOtherButtons(true);
      
      console.log('User confirmed cancellation - setting stopping state');
      
      // Force stop the backup background task permanently
      forceStopBackupBackgroundTask();
      
      // Stop the actual background service
      await stopBackupBackgroundTask();
      
      // Clear the backup progress data thoroughly
      await clearBackupBackgroundTaskProgress();
      
      // Additional cleanup: manually remove all backup-related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'backupDataBgTaskProgress',
          'backupProgress',
          'backupState'
        ]);
        console.log('Additional AsyncStorage cleanup completed');
        
        // Verify cleanup worked
        const remainingProgress = await AsyncStorage.getItem('backupDataBgTaskProgress');
        if (remainingProgress) {
          console.warn('Warning: backup progress still exists after cleanup:', remainingProgress);
        } else {
          console.log('Confirmed: backup progress completely cleared');
        }
      } catch (cleanupError) {
        console.warn('Additional cleanup failed:', cleanupError);
      }
      
      // Reset backup completion state
      setHasBackupCompleted(false);
      
      // Reset import completion state
      setHasImportCompleted(false);
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Backup task cancelled successfully');
      
      // Start 5-second cooldown period to prevent immediate restart
      setIsCancelCooldownActive(true);
      console.log('Starting 5-second cooldown after backup cancellation');
      
      // Clear any existing cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      cooldownTimerRef.current = setTimeout(() => {
        setIsCancelCooldownActive(false);
        console.log('Cooldown period ended - backup button re-enabled');
      }, 5000);
    } catch (error) {
      console.error('Error cancelling backup task:', error);
      Alert.alert(
        strings[language].error,
        'Failed to cancel backup task',
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissCancelBackup, forceStopBackupBackgroundTask, clearBackupBackgroundTaskProgress, language]);

  const handleCancelImportPress = React.useCallback(() => {
    setIsCancelImportModalOpen(true);
    Animated.parallel([
      Animated.timing(cancelImportOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cancelImportModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [cancelImportOverlayOpacity, cancelImportModalOpacity]);

  const handleDismissCancelImport = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(cancelImportOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cancelImportModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsCancelImportModalOpen(false);
    });
  }, [cancelImportOverlayOpacity, cancelImportModalOpacity]);

  const handleConfirmCancelImport = React.useCallback(async () => {
    try {
      // Dismiss the confirmation modal first
      handleDismissCancelImport();
      
      // Wait for the modal dismissal animation to complete before setting state
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Keep other buttons disabled during cancellation
      setShouldDisableOtherButtons(true);
      
      console.log('User confirmed import cancellation - setting stopping state');
      
      // Force stop the import background task permanently
      forceStopImportBackgroundTask();
      
      // Stop the actual background service
      await stopImportBackgroundTask();
      
      // Clear the import progress data thoroughly
      await clearImportBackgroundTaskProgress();
      
      // Additional cleanup: manually remove all import-related AsyncStorage keys
      try {
        await AsyncStorage.multiRemove([
          'importDataBgTaskProgress',
          'importProgress',
          'importState'
        ]);
        console.log('Additional AsyncStorage cleanup completed');
        
        // Verify cleanup worked
        const remainingProgress = await AsyncStorage.getItem('importDataBgTaskProgress');
        if (remainingProgress) {
          console.warn('Warning: import progress still exists after cleanup:', remainingProgress);
        } else {
          console.log('Confirmed: import progress completely cleared');
        }
      } catch (cleanupError) {
        console.warn('Additional cleanup failed:', cleanupError);
      }
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Import task cancelled successfully');
      
      // Start 5-second cooldown period to prevent immediate restart
      setIsImportCancelCooldownActive(true);
      console.log('Starting 5-second cooldown after import cancellation');
      
      // Clear any existing cooldown timer
      if (importCooldownTimerRef.current) {
        clearTimeout(importCooldownTimerRef.current);
      }
      
      // Set timer to clear cooldown after 5 seconds
      importCooldownTimerRef.current = setTimeout(() => {
        setIsImportCancelCooldownActive(false);
        setShouldDisableOtherButtons(false);
        console.log('Cooldown period ended - import button re-enabled');
      }, 5000);
      
    } catch (error) {
      console.error('Error cancelling import task:', error);
      Alert.alert(
        strings[language].error,
        'Failed to cancel import task',
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissCancelImport, forceStopImportBackgroundTask, clearImportBackgroundTaskProgress, language]);



  const handleDismissCancelClearData = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(cancelClearDataOverlayOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cancelClearDataModalOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsCancelClearDataModalOpen(false);
    });
  }, [cancelClearDataOverlayOpacity, cancelClearDataModalOpacity]);

  const handleConfirmCancelClearData = React.useCallback(async () => {
    try {
      // Start cancellation immediately without waiting for modal dismissal
      console.log('User confirmed clear data cancellation - starting immediate cancellation');
      
      // Set restoration state to prevent navigation during rollback
      setIsDataRestorationInProgress(true);
      
      // Force stop the clear data background task immediately
      forceStopClearDataBackgroundTask();
      
      // Dismiss the confirmation modal
      handleDismissCancelClearData();
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Keep other buttons disabled during cancellation
      setShouldDisableOtherButtons(true);
      
      console.log('User confirmed clear data cancellation - setting stopping state');
      
      // Force stop the clear data background task permanently
      forceStopClearDataBackgroundTask();
      
      // Stop the actual background service
      await stopClearDataBackgroundTask();
      
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
          }, () => false); // No cancellation during manual restore
          
          if (restoreSuccess) {
            console.log('Data successfully restored from backup after manual cancellation');
          } else {
            console.error('Failed to restore data from backup after manual cancellation');
          }
        } else {
          console.log('No backup data found for restoration');
        }
      } catch (restoreError) {
        console.error('Error during data restoration after manual cancellation:', restoreError);
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
        console.log('Additional AsyncStorage cleanup completed');
        
        // Verify cleanup worked
        const remainingProgress = await AsyncStorage.getItem('clearDataBgTaskProgress');
        if (remainingProgress) {
          console.warn('Warning: clear data progress still exists after cleanup:', remainingProgress);
        } else {
          console.log('Confirmed: clear data progress completely cleared');
        }
      } catch (cleanupError) {
        console.warn('Additional cleanup failed:', cleanupError);
      }
      
      // Add a small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset restoration state to allow navigation
      setIsDataRestorationInProgress(false);
      
      console.log('Clear data task cancelled successfully');
      
    } catch (error) {
      console.error('Error cancelling clear data task:', error);
      Alert.alert(
        strings[language].error,
        'Failed to cancel clear data task',
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissCancelClearData, forceStopClearDataBackgroundTask, clearClearDataBackgroundTaskProgress, language]);

  const handleShowNoDataModal = React.useCallback(() => {
    setIsNoDataModalOpen(true);
    Animated.parallel([
      Animated.timing(noDataOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noDataModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [noDataOverlayOpacity, noDataModalOpacity]);

  const handleDismissNoDataModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(noDataOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noDataModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNoDataModalOpen(false);
    });
  }, [noDataOverlayOpacity, noDataModalOpacity]);

  const handleShowNoClearDataModal = React.useCallback(() => {
    setIsNoClearDataModalOpen(true);
    Animated.parallel([
      Animated.timing(noClearDataOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noClearDataModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [noClearDataOverlayOpacity, noClearDataModalOpacity]);

  const handleDismissNoClearDataModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(noClearDataOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noClearDataModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNoClearDataModalOpen(false);
    });
  }, [noClearDataOverlayOpacity, noClearDataModalOpacity]);

  const handleShowNoBackupDataModal = React.useCallback(() => {
    setIsNoBackupDataModalOpen(true);
    Animated.parallel([
      Animated.timing(noBackupDataOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noBackupDataModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [noBackupDataOverlayOpacity, noBackupDataModalOpacity]);

  const handleDismissNoBackupDataModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(noBackupDataOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(noBackupDataModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNoBackupDataModalOpen(false);
    });
  }, [noBackupDataOverlayOpacity, noBackupDataModalOpacity]);

  // Function to check if there's any data to backup
  const checkForBackupData = React.useCallback(async (): Promise<boolean> => {
    try {
      const folders = await extractFoldersFromSQLite();
      const decks = await extractDecksFromSQLite();
      const flashcards = await extractFlashcardsFromSQLite();
      const userFormEntries = await extractRecentUserFormEntriesFromSQLite();
      
      const hasData = folders.length > 0 || decks.length > 0 || flashcards.length > 0 || userFormEntries.length > 0;
      console.log(`Backup data check: folders=${folders.length}, decks=${decks.length}, flashcards=${flashcards.length}, userFormEntries=${userFormEntries.length}, hasData=${hasData}`);
      
      return hasData;
    } catch (error) {
      console.error('Error checking for backup data:', error);
      return false;
    }
  }, []);

  // Function to check if there's any data to clear
  const checkForClearData = React.useCallback(async (): Promise<boolean> => {
    try {
      const folders = await extractFoldersFromSQLite();
      const decks = await extractDecksFromSQLite();
      const flashcards = await extractFlashcardsFromSQLite();
      const userFormEntries = await extractRecentUserFormEntriesFromSQLite();
      
      const hasData = folders.length > 0 || decks.length > 0 || flashcards.length > 0 || userFormEntries.length > 0;
      console.log(`Clear data check: folders=${folders.length}, decks=${decks.length}, flashcards=${flashcards.length}, userFormEntries=${userFormEntries.length}, hasData=${hasData}`);
      
      return hasData;
    } catch (error) {
      console.error('Error checking for clear data:', error);
      return false;
    }
  }, []);

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: colors.background }}>
        <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight()}]}>
            <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            >
            <AntDesign name="arrowleft" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { 
              fontFamily: Fonts.title,
              color: colors.text,
              marginLeft: 16,
              marginBottom: Platform.OS === 'ios' ? 5 : 10,
              }]}>{strings[language].appSettingsPage.title}</Text>
        </View>
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View style={styles.titleToggleRow}>
                  <Text style={[styles.titleToggleText, { 
                    color: colors.text,
                    fontFamily: Fonts.bodyBold,
                  }]}>{strings[language].appSettingsPage.language}</Text>
                  <TouchableOpacity
                    style={{
                      width: 170,
                      height: 35,
                      borderRadius: 10,
                      backgroundColor: colors.secondaryShade,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 16,
                    }}
                    activeOpacity={0.7}
                    onPress={handleLanguageRowPress}
                  >
                    <Text style={{ color: colors.unselectedText, fontSize: 18, fontFamily: Fonts.bodyBold }}>
                      {strings[language].appSettingsPage.languages[language.toLowerCase()]}
                    </Text>
                    <AntDesign name="right" size={20} color={colors.unselectedText} />
                  </TouchableOpacity>
                </View>
                <Modal
                  visible={isLanguageModalOpen}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setIsLanguageModalOpen(false)}
                >
                  <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} activeOpacity={1} onPressOut={() => setIsLanguageModalOpen(false)}>
                    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                      {React.useMemo(() => 
                        Object.entries(strings[language].appSettingsPage.languages).map(([langKey, langName]) => (
                          <TouchableOpacity 
                            key={langKey}
                            style={{ paddingVertical: 18 }} 
                            onPress={() => handleLanguageSelect(langKey.charAt(0).toUpperCase() + langKey.slice(1))}
                          >
                            <Text style={{ 
                              fontFamily: Fonts.bodyBold, 
                              fontSize: 24, 
                              color: language.toLowerCase() === langKey ? colors.brandColor1 : colors.text, 
                              textAlign: 'center' 
                            }}>
                              {langName as string}
                            </Text>
                          </TouchableOpacity>
                        )), [language, colors.brandColor1, colors.text, handleLanguageSelect]
                      )}
                      <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setIsLanguageModalOpen(false)}>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ marginBottom: 16, alignSelf: 'center' }} onPress={() => setIsLanguageModalOpen(false)}>
                        <Text style={{ color: colors.brandColor2, fontSize: 20, 
                          fontFamily: Fonts.bodyMedium 
                          }}>
                          {strings[language].cancel}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
                <TitleToggleRow 
                    text={strings[language].appSettingsPage.cameraAccess}
                    value={cameraAccessEnabled}
                    onValueChange={handleCameraToggle}
                    language={language}
                />
                <TitleToggleRow 
                    text={strings[language].appSettingsPage.galleryAccess}
                    value={galleryAccessEnabled}
                    onValueChange={handleGalleryToggle}
                    language={language}
                />
                <TitleToggleRow 
                    text={strings[language].appSettingsPage.microphoneAccess}
                    value={micAccessEnabled}
                    onValueChange={handleMicToggle}
                    language={language}
                />
                <TitleToggleRow 
                    text={strings[language].appSettingsPage.notifications}
                    value={notificationsAccessEnabled}
                    onValueChange={handleNotificationsToggle}
                    language={language}
                />

                {isBackupBackgroundTaskRunning ? (
                  <View style={{ 
                    alignItems: 'center',
                  }}>
                    <View style={{ 
                      width: '100%',
                      height: 60,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      <View style={{ flex: 1 }}>
                        <StripedProgressBar 
                          progress={backupBackgroundTaskProgress?.percentage || 0}
                          currentItems={backupBackgroundTaskProgress?.rowsUploaded || 0}
                          totalItems={backupBackgroundTaskProgress?.totalRows || 0}
                          height={60}
                          borderRadius={30}
                          immediateProgress={false}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelBackupPress}
                        activeOpacity={0.7}
                      >
                        <Entypo name="cross" size={40} color="#D7191C" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[{ 
                      color: colors.text, 
                      fontFamily: Fonts.bodyMedium,
                      fontSize: 14,
                      opacity: 0.8,
                      marginTop: 6,
                      textAlign: 'center',
                      paddingHorizontal: 20
                    }]}>
                      {language === 'Chinese' ? '请保持应用开启，否则备份将提前结束' : "Please don't close this app otherwise backup will end prematurely"}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.cloudButton, 
                      { 
                        backgroundColor: shouldDisableOtherButtons ? colors.unselectedText : colors.brandColor2,
                        opacity: shouldDisableOtherButtons ? 0.6 : 1.0
                      }
                    ]}
                    onPress={shouldDisableOtherButtons ? undefined : handleBackupPress}
                    disabled={shouldDisableOtherButtons}
                  >
                    <View style={styles.buttonContent}>
                      <MaterialIcons name="cloud-upload" size={30} color="#fff" />
                      <Text style={[styles.cloudButtonText, { fontFamily: Fonts.bodyMedium }]}>
                        {isBackupLoading
                          ? strings[language].appSettingsPage.backupDataToCloud
                          : (isBackupStopping || isLocallyStoppingBackup || isBackupCleanupInProgress || isCancelCooldownActive)
                            ? (language === 'Chinese' ? '正在取消任务，请稍等...' : 'Please wait...')
                            : strings[language].appSettingsPage.backupDataToCloud
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <Text style={[styles.descriptionText, { 
                  color: colors.text,
                  fontFamily: Fonts.bodyItalicLight,
                }]}>
                  {strings[language].appSettingsPage.backupDescription}
                  <Text style={[styles.descriptionText, { color: colors.brandColor1, fontFamily: Fonts.bodyItalicLight }]}>{strings[language].appSettingsPage.website}</Text>
                  <Text style={[styles.descriptionText, { color: colors.text, fontFamily: Fonts.bodyItalicLight }]}>.</Text>
                </Text>
                {isImportBackgroundTaskRunning ? (
                  <View style={{ 
                    alignItems: 'center',
                    marginTop: 20,
                  }}>
                    <View style={{ 
                      width: '100%',
                      height: 60,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      <View style={{ flex: 1 }}>
                        <StripedProgressBar 
                          progress={importBackgroundTaskProgress?.percentage || 0}
                          currentItems={importBackgroundTaskProgress?.rowsImported || 0}
                          totalItems={importBackgroundTaskProgress?.totalRows || 0}
                          height={60}
                          borderRadius={30}
                          immediateProgress={false}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelImportPress}
                        activeOpacity={0.7}
                      >
                        <Entypo name="cross" size={40} color="#D7191C" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[{ 
                      color: colors.text, 
                      fontFamily: Fonts.bodyMedium,
                      fontSize: 14,
                      opacity: 0.8,
                      marginTop: 6,
                      textAlign: 'center',
                      paddingHorizontal: 20
                    }]}>
                      {importBackgroundTaskProgress?.status === 'importStarted' || importBackgroundTaskProgress?.status === 'counting'
                        ? (language === 'Chinese' ? '正在检查云端数据...' : "Checking data in cloud...\nPlease don't close this app otherwise import will end prematurely")
                        : importBackgroundTaskProgress?.status === 'importing'
                        ? (language === 'Chinese' ? '正在从云端导入数据...' : "Importing data from cloud...\nPlease don't close this app otherwise import will end prematurely")
                        : (language === 'Chinese' ? '正在更新本地数据库...' : "Updating local database...\nPlease don't close this app otherwise import will end prematurely")
                      }
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.cloudButton, 
                      { 
                        backgroundColor: shouldDisableOtherButtons ? colors.unselectedText : colors.brandColor3, 
                        marginTop: 20,
                        opacity: shouldDisableOtherButtons ? 0.6 : 1.0
                      }
                    ]}
                    onPress={shouldDisableOtherButtons ? undefined : handleLoadDataPress}
                    disabled={shouldDisableOtherButtons}>
                    <View style={styles.buttonContent}>
                      <MaterialIcons name="cloud-download" size={30} color="#fff" />
                      <Text style={[styles.cloudButtonText, { 
                        fontFamily: Fonts.bodyMedium,
                      }]}>
                        {(isImportStopping || isImportCancelCooldownActive || isImportCleanupInProgress) && !isImportLoading
                          ? (language === 'Chinese' ? '正在取消任务，请稍等...' : 'Please wait...')
                          : strings[language].appSettingsPage.loadDataFromCloud
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <Text style={[styles.descriptionText, { 
                  color: colors.text,
                  fontFamily: Fonts.bodyItalicLight,
                }]}>
                  {strings[language].appSettingsPage.loadDataDescription}
                  <Text style={[styles.descriptionText, { color: colors.brandColor1, fontFamily: Fonts.bodyItalicLight }]}>{strings[language].appSettingsPage.website}</Text>
                  <Text style={[styles.descriptionText, { color: colors.text, fontFamily: Fonts.bodyItalicLight }]}>.</Text>
                </Text>
                {(isClearDataBackgroundTaskRunning || isLocallyStartingClearData) ? (
                  <View style={{ 
                    alignItems: 'center',
                    marginTop: 20,
                  }}>
                    <View style={{ 
                      width: '100%',
                      height: 60,
                      alignItems: 'center',
                    }}>
                      <StripedProgressBar 
                        progress={clearDataBackgroundTaskProgress?.percentage || 0}
                        currentItems={clearDataBackgroundTaskProgress?.rowsProcessed || 0}
                        totalItems={clearDataBackgroundTaskProgress?.totalRows || 0}
                        height={60}
                        borderRadius={30}
                        immediateProgress={false}
                      />
                    </View>
                    <Text style={[{ 
                      color: colors.text, 
                      fontFamily: Fonts.bodyMedium,
                      fontSize: 14,
                      opacity: 0.8,
                      marginTop: 6,
                      textAlign: 'center',
                      paddingHorizontal: 20
                    }]}>
                      {clearDataBackgroundTaskProgress?.status === 'backing_up'
                        ? (language === 'Chinese' ? '正在备份当前数据...' : "Backing up current data...\nPlease don't close this app otherwise clear data will end prematurely")
                        : clearDataBackgroundTaskProgress?.status === 'clearing'
                        ? (language === 'Chinese' ? '正在清除本地数据...' : "Clearing local data...\nPlease don't close this app otherwise clear data will end prematurely")
                        : (language === 'Chinese' ? '正在处理数据...' : "Processing data...\nPlease don't close this app otherwise clear data will end prematurely")
                      }
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.cloudButton, 
                      { 
                        backgroundColor: shouldDisableOtherButtons ? colors.unselectedText : colors.alertColor, 
                        marginTop: 20,
                        opacity: shouldDisableOtherButtons ? 0.6 : 1.0
                      }
                    ]}
                    onPress={shouldDisableOtherButtons ? undefined : handleClearDataPress}
                    disabled={shouldDisableOtherButtons}>
                    <View style={styles.buttonContent}>
                      <Ionicons name="trash" size={30} color="#fff" />
                      <Text style={[styles.cloudButtonText, { 
                        fontFamily: Fonts.bodyMedium,
                      }]}>
                        {isClearDataLoading
                          ? strings[language].appSettingsPage.clearLocalStorageData
                          : (isLocallyStoppingClearData || isClearDataCancelCooldownActive)
                            ? (language === 'Chinese' ? '正在取消任务，请稍等...' : 'Please wait...')
                            : strings[language].appSettingsPage.clearLocalStorageData
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <Text style={[styles.descriptionText, { 
                   color: colors.text,
                   fontFamily: Fonts.bodyItalicLight,
                 }]}>
                  {strings[language].appSettingsPage.clearLocalStorageDescription}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.cloudButton, 
                    { 
                      backgroundColor: shouldDisableOtherButtons ? colors.unselectedText : '#CC0000', 
                      marginTop: 20,
                      opacity: shouldDisableOtherButtons ? 0.6 : 1.0
                    }
                  ]}
                  onPress={shouldDisableOtherButtons ? undefined : () => {
                    // TODO: Implement delete account functionality
                    console.log('Delete account pressed');
                  }}
                  disabled={shouldDisableOtherButtons}>
                  <View style={styles.buttonContent}>
                    <Text style={[styles.cloudButtonText, { 
                      fontFamily: Fonts.bodyMedium,
                    }]}>{strings[language].appSettingsPage.deleteAccount}</Text>
                  </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
        <GreyOverlayBackground 
          visible={isBackupModalOpen}
          opacity={overlayOpacity}
          onPress={handleDismissBackup}
        />
        <GenericModal
          visible={isBackupModalOpen}
          opacity={modalOpacity}
          text={strings[language].appSettingsPage.proceedWithCloudBackup}
          buttons="double"
          onCancel={handleDismissBackup}
          onConfirm={handleConfirmBackup}
        />
        <GreyOverlayBackground 
          visible={isLoadDataModalOpen}
          opacity={loadDataOverlayOpacity}
          onPress={handleDismissLoadData}
        />
        <GenericModal
          visible={isLoadDataModalOpen}
          opacity={loadDataModalOpacity}
          text={strings[language].appSettingsPage.proceedWithCloudImport}
          buttons="double"
          onCancel={handleDismissLoadData}
          onConfirm={handleConfirmLoadData}
        />    
        <GreyOverlayBackground 
          visible={isDeleteLocalStorageModalOpen}
          opacity={deleteLocalStorageOverlayOpacity}
          onPress={handleDismissDeleteLocalStorage}
        />
        <GenericModal 
          visible={isDeleteLocalStorageModalOpen}
          opacity={deleteLocalStorageModalOpacity}
          text={strings[language].appSettingsPage.proceedWithClearingLocalStorage}
          buttons="double"
          onCancel={handleDismissDeleteLocalStorage}
          onConfirm={handleConfirmDeleteLocalStorage}
        />
        
        <GreyOverlayBackground 
          visible={isSuccessModalOpen}
          opacity={successOverlayOpacity}
          onPress={handleDismissSuccessModal}
        />
        <GenericModal
          visible={isSuccessModalOpen}
          opacity={successModalOpacity}
          text={successMessage}
          hasAnimation={true}
          animationSource={require('@/assets/animations/SuccessAnimation1_Tick.json')}
          animationLoop={true}
          contentMarginTop={20}
          lottieMarginTop={40}
        />

        {/* Backup Loading Screen */}
        <GreyOverlayBackground 
          visible={isBackupLoading}
          opacity={backupLoadingOverlayOpacity}
        />
        {isBackupLoading && (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/addDeckLoadingAnimation.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
          </View>
        )}

        {/* Import Loading Screen */}
        <GreyOverlayBackground 
          visible={isImportLoading}
          opacity={importLoadingOverlayOpacity}
        />
        {isImportLoading && (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/addDeckLoadingAnimation.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
          </View>
        )}

        {/* Clear Data Loading Screen */}
        <GreyOverlayBackground 
          visible={isClearDataLoading}
          opacity={clearDataLoadingOverlayOpacity}
        />
        {isClearDataLoading && (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/addDeckLoadingAnimation.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
          </View>
        )}

        {/* Cancel Backup Modal */}
        <GreyOverlayBackground 
          visible={isCancelBackupModalOpen}
          opacity={cancelBackupOverlayOpacity}
          onPress={handleDismissCancelBackup}
        />
        <GenericModal
          visible={isCancelBackupModalOpen}
          opacity={cancelBackupModalOpacity}
          text={strings[language].cancelBackup}
          Icon={DeleteModalIcon}
          buttons="double"
          onCancel={handleDismissCancelBackup}
          onConfirm={handleConfirmCancelBackup}
        />

        {/* Cancel Import Modal */}
        <GreyOverlayBackground 
          visible={isCancelImportModalOpen}
          opacity={cancelImportOverlayOpacity}
          onPress={handleDismissCancelImport}
        />
        <GenericModal
          visible={isCancelImportModalOpen}
          opacity={cancelImportModalOpacity}
          text={language === 'Chinese' ? '取消导入?' : 'Cancel Import?'}
          Icon={DeleteModalIcon}
          buttons="double"
          onCancel={handleDismissCancelImport}
          onConfirm={handleConfirmCancelImport}
        />

        {/* No Data Modal */}
        <GreyOverlayBackground 
          visible={isNoDataModalOpen}
          opacity={noDataOverlayOpacity}
          onPress={handleDismissNoDataModal}
        />
        <GenericModal
          visible={isNoDataModalOpen}
          opacity={noDataModalOpacity}
          text={language === 'Chinese' ? '没有数据可导入！\n\n请先尝试备份数据。' : 'No data to import!\n\nTry backing up first.'}
          Icon={ModalExclamationMarkIcon}
          buttons="single"
          onConfirm={handleDismissNoDataModal}
        />

        {/* No Backup Data Modal */}
        <GreyOverlayBackground 
          visible={isNoBackupDataModalOpen}
          opacity={noBackupDataOverlayOpacity}
          onPress={handleDismissNoBackupDataModal}
        />
        <GenericModal
          visible={isNoBackupDataModalOpen}
          opacity={noBackupDataModalOpacity}
          text={language === 'Chinese' ? '没有数据可备份！' : 'No data to backup!'}
          Icon={ModalExclamationMarkIcon}
          buttons="single"
          onConfirm={handleDismissNoBackupDataModal}
        />

        {/* Network Error Modal */}
        <GreyOverlayBackground 
          visible={isNetworkErrorModalOpen}
          opacity={networkErrorOverlayOpacity}
          onPress={handleDismissNetworkErrorModal}
        />
        <GenericModal
          visible={isNetworkErrorModalOpen}
          opacity={networkErrorModalOpacity}
          text={language === 'Chinese' 
            ? (networkErrorOperation === 'backup' ? '备份因网络错误而取消！检查您的网络。' : networkErrorOperation === 'import' ? '导入因网络错误而取消！检查您的网络。' : '清除数据因网络错误而取消！检查您的网络。')
            : (networkErrorOperation === 'backup' ? 'Backup cancelled\ndue to network error!' : networkErrorOperation === 'import' ? 'Import cancelled\ndue to network error!' : 'Clear data cancelled\ndue to network error!')
          }
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissNetworkErrorModal}
        />

        {/* Backup Loading Network Error Modal */}
        <GreyOverlayBackground 
          visible={isBackupLoadingNetworkErrorModalOpen}
          opacity={backupLoadingNetworkErrorOverlayOpacity}
          onPress={handleDismissBackupLoadingNetworkErrorModal}
        />
        <GenericModal
          visible={isBackupLoadingNetworkErrorModalOpen}
          opacity={backupLoadingNetworkErrorModalOpacity}
          text={language === 'Chinese' ? '备份因网络错误而无法启动！' : 'Backup failed to start\ndue to network error!'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissBackupLoadingNetworkErrorModal}
        />

        {/* Import Loading Network Error Modal */}
        <GreyOverlayBackground 
          visible={isImportLoadingNetworkErrorModalOpen}
          opacity={importLoadingNetworkErrorOverlayOpacity}
          onPress={handleDismissImportLoadingNetworkErrorModal}
        />
        <GenericModal
          visible={isImportLoadingNetworkErrorModalOpen}
          opacity={importLoadingNetworkErrorModalOpacity}
          text={language === 'Chinese' ? '导入因网络错误而无法启动！' : 'Import failed to start\ndue to network error!'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissImportLoadingNetworkErrorModal}
        />

        {/* Navigation Guard Modal */}
        <GreyOverlayBackground 
          visible={isNavigationGuardModalOpen}
          opacity={navigationGuardOverlayOpacity}
          onPress={handleDismissNavigationGuardModal}
        />
        <GenericModal
          visible={isNavigationGuardModalOpen}
          opacity={navigationGuardModalOpacity}
          text={
            navigationBlockingProcess === 'backup'
              ? (language === 'Chinese' ? '请在备份过程中停留在此页面' : 'Please stay on this page\nduring the backup process')
              : navigationBlockingProcess === 'import'
              ? (language === 'Chinese' ? '请在导入过程中停留在此页面' : 'Please stay on this page\nduring the import process')
              : (language === 'Chinese' ? '请在删除过程中停留在此页面' : 'Please stay on this page\nduring the deletion process')
          }
          Icon={ModalExclamationMarkIcon}
          buttons="single"
          onConfirm={handleDismissNavigationGuardModal}
        />

        {/* Automatic Cancellation Modal */}
        <GreyOverlayBackground 
          visible={isAutomaticCancellationModalOpen}
          opacity={automaticCancellationOverlayOpacity}
          onPress={handleDismissAutomaticCancellationModal}
        />
        <GenericModal
          visible={isAutomaticCancellationModalOpen}
          opacity={automaticCancellationModalOpacity}
          text={language === 'Chinese' ? '糟糕，备份任务已被取消！' : 'Oops backup task has been cancelled!'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissAutomaticCancellationModal}
        />

        {/* Import Automatic Cancellation Modal */}
        <GreyOverlayBackground 
          visible={isImportAutomaticCancellationModalOpen}
          opacity={importAutomaticCancellationOverlayOpacity}
          onPress={handleDismissImportAutomaticCancellationModal}
        />
        <GenericModal
          visible={isImportAutomaticCancellationModalOpen}
          opacity={importAutomaticCancellationModalOpacity}
          text={language === 'Chinese' ? '糟糕，导入任务已被取消！' : 'Oops import task has been cancelled!'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissImportAutomaticCancellationModal}
        />

        {/* Cancel Clear Data Modal */}
        <GreyOverlayBackground 
          visible={isCancelClearDataModalOpen}
          opacity={cancelClearDataOverlayOpacity}
          onPress={handleDismissCancelClearData}
        />
        <GenericModal
          visible={isCancelClearDataModalOpen}
          opacity={cancelClearDataModalOpacity}
          text={language === 'Chinese' ? '取消清除数据?' : 'Cancel Clear Data?'}
          Icon={DeleteModalIcon}
          buttons="double"
          onCancel={handleDismissCancelClearData}
          onConfirm={handleConfirmCancelClearData}
        />

        {/* No Clear Data Modal */}
        <GreyOverlayBackground 
          visible={isNoClearDataModalOpen}
          opacity={noClearDataOverlayOpacity}
          onPress={handleDismissNoClearDataModal}
        />
        <GenericModal
          visible={isNoClearDataModalOpen}
          opacity={noClearDataModalOpacity}
          text={language === 'Chinese' ? '没有数据可清除！' : 'No data to clear!'}
          Icon={ModalExclamationMarkIcon}
          buttons="single"
          onConfirm={handleDismissNoClearDataModal}
        />

        {/* Clear Data Loading Network Error Modal */}
        <GreyOverlayBackground 
          visible={isClearDataLoadingNetworkErrorModalOpen}
          opacity={clearDataLoadingNetworkErrorOverlayOpacity}
          onPress={handleDismissClearDataLoadingNetworkErrorModal}
        />
        <GenericModal
          visible={isClearDataLoadingNetworkErrorModalOpen}
          opacity={clearDataLoadingNetworkErrorModalOpacity}
          text={language === 'Chinese' ? '清除数据因网络错误而无法启动！' : 'Clear data failed to start\ndue to network error!'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissClearDataLoadingNetworkErrorModal}
        />

        {/* Clear Data Automatic Cancellation Modal */}
        <GreyOverlayBackground 
          visible={isClearDataAutomaticCancellationModalOpen}
          opacity={clearDataAutomaticCancellationOverlayOpacity}
          onPress={handleDismissClearDataAutomaticCancellationModal}
        />
        <GenericModal
          visible={isClearDataAutomaticCancellationModalOpen}
          opacity={clearDataAutomaticCancellationModalOpacity}
          text={language === 'Chinese' ? '糟糕，清除数据任务已被取消！' : 'Oops clear data task has been cancelled!'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissClearDataAutomaticCancellationModal}
        />

        {/* Backup Service Busy Modal */}
        <GreyOverlayBackground 
          visible={isBackupServiceBusyModalOpen}
          opacity={backupServiceBusyOverlayOpacity}
          onPress={handleDismissBackupServiceBusyModal}
        />
        <GenericModal
          visible={isBackupServiceBusyModalOpen}
          opacity={backupServiceBusyModalOpacity}
          text={language === 'Chinese' ? '备份服务暂时繁忙。请几分钟后再试。' : 'Backup service is temporarily busy. Please try again in a few minutes.'}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissBackupServiceBusyModal}
        />

        {/* Clear Data Task Notification */}
        

    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    },
    topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    },
    backButton: {
    padding: 8,
    },
  title: {
    fontFamily: Fonts.title,
    fontSize: 32,
    marginLeft: 16,
    marginBottom: Platform.OS === 'ios' ? 5 : 10,
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 36,
  },
  titleToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    // borderWidth: 1,
    // borderColor: 'blue',
  },
  titleToggleText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  mainContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
  cloudButton: {
    flex: 1,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
  },
  cloudButtonText: {
    color: '#fff',
    fontFamily: Fonts.bodyMedium,
    fontSize: 24,
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  descriptionText: {
    fontFamily: Fonts.bodyItalicLight,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  loadingAnimation: {
    width: 96,
    height: 96,
  },
  cancelButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 