import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform, Switch, Alert, Linking, ScrollView , Animated, Modal, AppState, AppStateStatus, Dimensions } from 'react-native';
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
import { useDeleteAccountBackgroundTask } from '@/contexts/DeleteAccountBackgroundTaskContext';
import { startDeleteAccountBackgroundTask, stopDeleteAccountBackgroundTask } from '@/utils/deleteAccountBackgroundTask';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';

import { importDataFromCloud, ImportProgress } from '@/db/importData';
import { extractFoldersFromSQLite, extractDecksFromSQLite, extractFlashcardsFromSQLite, extractRecentUserFormEntriesFromSQLite } from '@/db/backup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarAccountHeight } from '@/hooks/heights';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { BackgroundTaskNotification } from '@/components/inAppNotifications/BackgroundTaskNotification';


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
          trackColor={{ false: theme === 'dark' ? colors.disabledIconBackgroundColor : colors.unselectedText, true: colors.brandColor1 }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={theme === 'dark' ? colors.disabledIconBackgroundColor : colors.unselectedText}
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
  const { deleteAccount } = useHybridAuth();
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
    startClearDataBackgroundTaskMonitoring,
    forceStopClearDataBackgroundTask,
    clearClearDataBackgroundTaskProgress,
    resetClearDataForceStoppedFlag
  } = useClearDataBackgroundTask();
  
  // delete account progress state - now handled by background task context
  const { 
    isDeleteAccountBackgroundTaskRunning, 
    isDeleteAccountCleanupInProgress,
    isDeleteAccountStopping,
    deleteAccountBackgroundTaskProgress,
    setDeleteAccountBackgroundTaskProgress,
    wasAutomaticallyCancelled: wasDeleteAccountAutomaticallyCancelled,
    startDeleteAccountBackgroundTaskMonitoring,
    forceStopDeleteAccountBackgroundTask,
    clearDeleteAccountBackgroundTaskProgress,
    resetDeleteAccountForceStoppedFlag,
    resetAutomaticallyCancelledFlag: resetDeleteAccountAutomaticallyCancelledFlag
  } = useDeleteAccountBackgroundTask();
  
  // deck creation background task state
  const { isBackgroundTaskRunning } = useBackgroundTask();
  
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

  // Backup only user form entries toggle
  const [backupOnlyFormEntries, setBackupOnlyFormEntries] = React.useState(false);

  const BACKUP_ONLY_FORM_ENTRIES_PREF_KEY = React.useRef<string>('backupOnlyFormEntriesPreference').current;

  const getBackupOnlyFormEntriesPreferenceKey = React.useCallback(async () => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      return userID ? `${BACKUP_ONLY_FORM_ENTRIES_PREF_KEY}_${userID}` : BACKUP_ONLY_FORM_ENTRIES_PREF_KEY;
    } catch (error) {
      console.error('Error retrieving backup preference key:', error);
      return BACKUP_ONLY_FORM_ENTRIES_PREF_KEY;
    }
  }, [BACKUP_ONLY_FORM_ENTRIES_PREF_KEY]);

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
  
  // Delete account loading state
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = React.useState(false);
  const deleteAccountLoadingOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  
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
  const [isBackupServerErrorModalOpen, setIsBackupServerErrorModalOpen] = React.useState(false);
  const backupServerErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const backupServerErrorModalOpacity = React.useRef(new Animated.Value(0)).current;
  const [isImportServerErrorModalOpen, setIsImportServerErrorModalOpen] = React.useState(false);
  const importServerErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const importServerErrorModalOpacity = React.useRef(new Animated.Value(0)).current;

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


  // Track if network error modal has been shown to prevent dismissal by in-app notification
  const [hasNetworkErrorModalBeenShown, setHasNetworkErrorModalBeenShown] = React.useState(false);
  const [hasServerErrorModalBeenShown, setHasServerErrorModalBeenShown] = React.useState(false);
  const [hasImportServerErrorModalBeenShown, setHasImportServerErrorModalBeenShown] = React.useState(false);
  
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

  // Delete account loading network error modal state
  const [isDeleteAccountLoadingNetworkErrorModalOpen, setIsDeleteAccountLoadingNetworkErrorModalOpen] = React.useState(false);
  const deleteAccountLoadingNetworkErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const deleteAccountLoadingNetworkErrorModalOpacity = React.useRef(new Animated.Value(0)).current;
  const [isDeleteAccountServerErrorModalOpen, setIsDeleteAccountServerErrorModalOpen] = React.useState(false);
  const deleteAccountServerErrorOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const deleteAccountServerErrorModalOpacity = React.useRef(new Animated.Value(0)).current;
  const [deleteAccountServerErrorMessage, setDeleteAccountServerErrorMessage] = React.useState<string | null>(null);

  // Delete account modal state
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = React.useState(false);
  const deleteAccountOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const deleteAccountModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Deck creation blocking modal state
  const [isDeckCreationBlockingModalOpen, setIsDeckCreationBlockingModalOpen] = React.useState(false);
  const deckCreationBlockingOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const deckCreationBlockingModalOpacity = React.useRef(new Animated.Value(0)).current;

  // Clear data completion state
  const [hasClearDataCompleted, setHasClearDataCompleted] = React.useState(false);

  // Delete account completion state
  const [hasDeleteAccountCompleted, setHasDeleteAccountCompleted] = React.useState(false);
  const [hasDeleteAccountServerErrorModalBeenShown, setHasDeleteAccountServerErrorModalBeenShown] = React.useState(false);

  // Clear data cooldown state
  const [isClearDataCancelCooldownActive, setIsClearDataCancelCooldownActive] = React.useState(false);
  const clearDataCooldownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear data local stopping state
  const [isLocallyStoppingClearData, setIsLocallyStoppingClearData] = React.useState(false);

  const loadBackupOnlyFormEntriesPreference = React.useCallback(async () => {
    try {
      const prefKey = await getBackupOnlyFormEntriesPreferenceKey();
      const storedValue = await AsyncStorage.getItem(prefKey);
      if (storedValue !== null) {
        setBackupOnlyFormEntries(storedValue === 'true');
      }
    } catch (error) {
      console.error('Error loading backup-only form entries preference:', error);
    }
  }, [getBackupOnlyFormEntriesPreferenceKey]);

  const saveBackupOnlyFormEntriesPreference = React.useCallback(async (value: boolean) => {
    try {
      const prefKey = await getBackupOnlyFormEntriesPreferenceKey();
      await AsyncStorage.setItem(prefKey, value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving backup-only form entries preference:', error);
    }
  }, [getBackupOnlyFormEntriesPreferenceKey]);

  // Handler functions
  const handleShowDeckCreationBlockingModal = React.useCallback(() => {
    setIsDeckCreationBlockingModalOpen(true);
    Animated.parallel([
      Animated.timing(deckCreationBlockingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deckCreationBlockingModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [deckCreationBlockingOverlayOpacity, deckCreationBlockingModalOpacity]);

  const handleDismissDeckCreationBlockingModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(deckCreationBlockingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deckCreationBlockingModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsDeckCreationBlockingModalOpen(false);
    });
  }, [deckCreationBlockingOverlayOpacity, deckCreationBlockingModalOpacity]);

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
      setHasServerErrorModalBeenShown(false);
      setHasImportServerErrorModalBeenShown(false);
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

  const handleShowBackupServerErrorModal = React.useCallback(() => {
    setIsBackupServerErrorModalOpen(true);
    setHasServerErrorModalBeenShown(true);
    Animated.parallel([
      Animated.timing(backupServerErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backupServerErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [backupServerErrorOverlayOpacity, backupServerErrorModalOpacity]);

  const handleDismissBackupServerErrorModal = React.useCallback(async () => {
    Animated.parallel([
      Animated.timing(backupServerErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backupServerErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsBackupServerErrorModalOpen(false);
      setHasServerErrorModalBeenShown(false);
      try {
        await clearBackupBackgroundTaskProgress();
        console.log('Cleared backup progress data after user dismissed server error modal');
      } catch (error) {
        console.error('Error clearing backup progress data after server error modal dismissal:', error);
      }
      setShouldDisableOtherButtons(false);
    });
  }, [backupServerErrorOverlayOpacity, backupServerErrorModalOpacity, clearBackupBackgroundTaskProgress]);

  const handleShowImportServerErrorModal = React.useCallback(() => {
    setIsImportServerErrorModalOpen(true);
    setHasImportServerErrorModalBeenShown(true);
    Animated.parallel([
      Animated.timing(importServerErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(importServerErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [importServerErrorOverlayOpacity, importServerErrorModalOpacity]);

  const handleDismissImportServerErrorModal = React.useCallback(async () => {
    Animated.parallel([
      Animated.timing(importServerErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(importServerErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsImportServerErrorModalOpen(false);
      setHasImportServerErrorModalBeenShown(false);
      try {
        await clearImportBackgroundTaskProgress();
        console.log('Cleared import progress data after user dismissed server error modal');
      } catch (error) {
        console.error('Error clearing import progress data after server error modal dismissal:', error);
      }
      setShouldDisableOtherButtons(false);
    });
  }, [importServerErrorOverlayOpacity, importServerErrorModalOpacity, clearImportBackgroundTaskProgress]);

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

  const handleShowDeleteAccountLoadingNetworkErrorModal = React.useCallback(() => {
    setIsDeleteAccountLoadingNetworkErrorModalOpen(true);
    Animated.parallel([
      Animated.timing(deleteAccountLoadingNetworkErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteAccountLoadingNetworkErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [deleteAccountLoadingNetworkErrorOverlayOpacity, deleteAccountLoadingNetworkErrorModalOpacity]);

  const handleDismissDeleteAccountLoadingNetworkErrorModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(deleteAccountLoadingNetworkErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteAccountLoadingNetworkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsDeleteAccountLoadingNetworkErrorModalOpen(false);
      // Re-enable buttons after dismissing network error modal
      setShouldDisableOtherButtons(false);
    });
  }, [deleteAccountLoadingNetworkErrorOverlayOpacity, deleteAccountLoadingNetworkErrorModalOpacity]);

  const handleShowDeleteAccountServerErrorModal = React.useCallback((message?: string) => {
    setDeleteAccountServerErrorMessage(message || null);
    setHasDeleteAccountServerErrorModalBeenShown(true);
    setIsDeleteAccountServerErrorModalOpen(true);
    Animated.parallel([
      Animated.timing(deleteAccountServerErrorOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteAccountServerErrorModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [deleteAccountServerErrorOverlayOpacity, deleteAccountServerErrorModalOpacity]);

  const handleDismissDeleteAccountServerErrorModal = React.useCallback(async () => {
    Animated.parallel([
      Animated.timing(deleteAccountServerErrorOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteAccountServerErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsDeleteAccountServerErrorModalOpen(false);
      setDeleteAccountServerErrorMessage(null);
      setHasDeleteAccountServerErrorModalBeenShown(false);
      setShouldDisableOtherButtons(false);
      setIsDeleteAccountLoading(false);
      try {
        await clearDeleteAccountBackgroundTaskProgress();
      } catch (error) {
        console.error('Error clearing delete account progress after server error dismissal:', error);
      }
    });
  }, [deleteAccountServerErrorOverlayOpacity, deleteAccountServerErrorModalOpacity, clearDeleteAccountBackgroundTaskProgress]);

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

  const handleDeleteAccountPress = React.useCallback(() => {
    // Check if deck creation is running
    if (isBackgroundTaskRunning) {
      handleShowDeckCreationBlockingModal();
      return;
    }
    
    setIsDeleteAccountModalOpen(true);
    Animated.parallel([
      Animated.timing(deleteAccountOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteAccountModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [deleteAccountOverlayOpacity, deleteAccountModalOpacity, isBackgroundTaskRunning, handleShowDeckCreationBlockingModal]);

  const handleDismissDeleteAccount = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(deleteAccountOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteAccountModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsDeleteAccountModalOpen(false);
    });
  }, [deleteAccountOverlayOpacity, deleteAccountModalOpacity]);

  const handleConfirmDeleteAccount = React.useCallback(async () => {
    try {
      // Dismiss the modal first
      handleDismissDeleteAccount();
      
      // Disable all buttons IMMEDIATELY when user confirms deletion
      setShouldDisableOtherButtons(true);
      
      // Show loading screen IMMEDIATELY to prevent any button UI changes
      setIsDeleteAccountLoading(true);
      Animated.timing(deleteAccountLoadingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Small delay to ensure loading screen renders before any state changes
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check network connectivity before starting delete account
      const isNetworkConnected = await checkNetworkConnectivity();
      if (!isNetworkConnected) {
        // Hide loading screen
        Animated.timing(deleteAccountLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsDeleteAccountLoading(false);
        });
        
        // Show network error modal
        handleShowDeleteAccountLoadingNetworkErrorModal();
        return;
      }
      
      // Get user ID for background task
      const userID = await AsyncStorage.getItem('userID');
      console.log('Retrieved userID for delete account:', userID);
      
      if (!userID) {
        console.error('No userID found in AsyncStorage for delete account');
        // Hide loading screen
        Animated.timing(deleteAccountLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsDeleteAccountLoading(false);
        });
        
        console.error(strings[language].appSettingsPage.noUserIdFound);
        return;
      }
      
      // Start background task monitoring
      startDeleteAccountBackgroundTaskMonitoring();
      
      // Start the delete account background task
      const success = await startDeleteAccountBackgroundTask(language, userID);
      
      if (!success) {
        // Hide loading screen
        Animated.timing(deleteAccountLoadingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsDeleteAccountLoading(false);
        });
        
        console.error('Failed to start account deletion process');
        return;
      }
      
      // Add a small delay to ensure the background task has time to start
      // before the monitoring detects the delete account is running
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // The loading screen will be hidden when isDeleteAccountBackgroundTaskRunning becomes true
      // After the background task completes, we'll call the actual Clerk deletion
      
    } catch (error) {
      // Hide loading screen
      Animated.timing(deleteAccountLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsDeleteAccountLoading(false);
      });
      
      console.error('Account deletion failed:', error instanceof Error ? error.message : strings[language].unknownError);
    }
  }, [handleDismissDeleteAccount, language, startDeleteAccountBackgroundTaskMonitoring, deleteAccountLoadingOverlayOpacity, checkNetworkConnectivity, handleShowDeleteAccountLoadingNetworkErrorModal]);

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

  // Check camera permission status on component mount
  React.useEffect(() => {
    checkCameraPermission();
    checkGalleryPermission();
    checkMicPermission();
    checkNotificationPermission();
    loadNotificationsPreference();
    loadBackupOnlyFormEntriesPreference();
  }, [loadBackupOnlyFormEntriesPreference]);





  // Show success modal on page load if backup was completed
  React.useEffect(() => {
    if (hasBackupCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal(strings[language].appSettingsPage.backupCompletedSuccessfully);
    }
  }, [hasBackupCompleted, isSuccessModalOpen]);

  // Show success modal on page load if import was completed
  React.useEffect(() => {
    if (hasImportCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal(strings[language].appSettingsPage.importCompleted);
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

  // Hide import loading screen when import starts running or completes
  React.useEffect(() => {
    if (isImportLoading && (isImportBackgroundTaskRunning || importBackgroundTaskProgress?.completed)) {
      // Set isImportLoading to false to hide loading screen
      setIsImportLoading(false);
      
      // Then animate out the loading overlay
      Animated.timing(importLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isImportBackgroundTaskRunning, importBackgroundTaskProgress?.completed, isImportLoading, importLoadingOverlayOpacity]);

  // Control button disable state based on backup, import, clear data, and delete account status
  React.useEffect(() => {
    // Don't disable buttons during loading states - only disable when actual operations are running
    const shouldDisable = isBackupBackgroundTaskRunning || isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive || isImportBackgroundTaskRunning || isImportCancelCooldownActive || isImportStopping || isImportCleanupInProgress || isClearDataBackgroundTaskRunning || isClearDataCancelCooldownActive || isLocallyStoppingClearData || isLocallyStartingClearData || isDataRestorationInProgress || isDeleteAccountBackgroundTaskRunning || isDeleteAccountCleanupInProgress || isDeleteAccountStopping;
    
    // Additional safety: never disable buttons during backup/import loading states
    const isNonClearDataLoading = isBackupLoading || isImportLoading;
    const finalShouldDisable = shouldDisable && !isNonClearDataLoading;
    
    // Only update if we're not in delete account loading state (to preserve immediate disable)
    if (!isDeleteAccountLoading) {
      setShouldDisableOtherButtons(finalShouldDisable);
    }
  }, [isBackupBackgroundTaskRunning, isBackupCleanupInProgress, isBackupStopping, isLocallyStoppingBackup, isCancelCooldownActive, isImportBackgroundTaskRunning, isImportCancelCooldownActive, isImportStopping, isImportCleanupInProgress, isClearDataBackgroundTaskRunning, isClearDataCancelCooldownActive, isLocallyStoppingClearData, isLocallyStartingClearData, isDataRestorationInProgress, isDeleteAccountBackgroundTaskRunning, isDeleteAccountCleanupInProgress, isDeleteAccountStopping, isBackupLoading, isImportLoading, isDeleteAccountLoading]);

  // Handle notification responses for backup completion
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'backup_completed') {
        // Set persistent backup completion state
        setHasBackupCompleted(true);
        // Show success modal when user taps on backup notification (will stay open until manually dismissed)
        handleShowSuccessModal(strings[language].appSettingsPage.backupCompletedSuccessfully);
      } else if (data?.type === 'backup_network_error') {
        // Show persistent network error modal when user taps on network error notification
        handleShowNetworkErrorModal('backup');
      } else if (data?.type === 'backup_service_busy') {
        // Show persistent backup service busy modal when user taps on backup service busy notification
        handleShowBackupServiceBusyModal();
      } else if (data?.type === 'import_network_error') {
        // Show persistent network error modal when user taps on import network error notification
        handleShowNetworkErrorModal('import');
      } else if (data?.type === 'backup_server_error') {
        handleShowBackupServerErrorModal();
      } else if (data?.type === 'import_server_error') {
        handleShowImportServerErrorModal();
      } else if (data?.type === 'clear_data_completed') {
        // Set persistent clear data completion state
        setHasClearDataCompleted(true);
        // Show success modal when user taps on clear data notification (will stay open until manually dismissed)
        handleShowSuccessModal(strings[language].appSettingsPage.clearDataCompletedSuccessfully);
      } else if (data?.type === 'clear_data_network_error') {
        // Show persistent network error modal when user taps on clear data network error notification
        handleShowNetworkErrorModal('clearData');
      } else if (data?.type === 'delete_account_completed') {
        // Set persistent delete account completion state
        setHasDeleteAccountCompleted(true);
        // Show success modal when user taps on delete account notification (will stay open until manually dismissed)
        handleShowSuccessModal(strings[language].appSettingsPage.accountDeletionCompletedSuccessfully);
      }
    });

    return () => subscription.remove();
  }, [handleShowNetworkErrorModal, handleShowBackupServiceBusyModal, handleShowBackupServerErrorModal, handleShowImportServerErrorModal]);

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
      handleShowSuccessModal(strings[language].appSettingsPage.clearDataCompletedSuccessfully);
    }
  }, [hasClearDataCompleted, isSuccessModalOpen]);

  // Show success modal on page load if delete account was completed
  React.useEffect(() => {
    if (hasDeleteAccountCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal(strings[language].appSettingsPage.accountDeletionCompletedSuccessfully);
    }
  }, [hasDeleteAccountCompleted, isSuccessModalOpen]);

  // Hide clear data loading screen when task completes or when no data is found
  React.useEffect(() => {
    if (isClearDataLoading && (clearDataBackgroundTaskProgress?.completed || clearDataBackgroundTaskProgress?.noData)) {
      // Set isClearDataLoading to false to hide loading screen
      setIsClearDataLoading(false);
      
      // Reset locally starting clear data state to re-enable buttons
      setIsLocallyStartingClearData(false);
      
      // Then animate out the loading overlay
      Animated.timing(clearDataLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [clearDataBackgroundTaskProgress?.completed, clearDataBackgroundTaskProgress?.noData, isClearDataLoading, clearDataLoadingOverlayOpacity]);

  // Hide delete account loading screen when task completes
  React.useEffect(() => {
    if (isDeleteAccountLoading && deleteAccountBackgroundTaskProgress?.completed) {
      // Set isDeleteAccountLoading to false to hide loading screen
      setIsDeleteAccountLoading(false);
      
      // Then animate out the loading overlay
      Animated.timing(deleteAccountLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [deleteAccountBackgroundTaskProgress?.completed, isDeleteAccountLoading, deleteAccountLoadingOverlayOpacity]);


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
          strings[language].appSettingsPage.notificationPermissionRequired,
          strings[language].appSettingsPage.notificationPermissionMessage,
          [
            { text: strings[language].cancel, style: 'cancel' },
            { 
              text: strings[language].appSettingsPage.openSettings, 
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





  // Available languages - same as LanguageSelector
  const availableLanguages = React.useMemo(() => [
    { key: 'Afrikaans', label: 'Afrikaans' },
    { key: 'Arabic', label: 'العربية' },
    { key: 'Bengali', label: 'বাংলা' },
    { key: 'Chinese', label: '中文' },
    { key: 'Czech', label: 'Čeština' },
    { key: 'Dutch', label: 'Nederlands' },
    { key: 'English', label: 'English' },
    { key: 'Farsi', label: 'فارسی' },
    { key: 'Finnish', label: 'Suomi' },
    { key: 'French', label: 'Français' },
    { key: 'German', label: 'Deutsch' },
    { key: 'Greek', label: 'Ελληνικά' },
    { key: 'Hebrew', label: 'עברית' },
    { key: 'Hindi', label: 'हिन्दी' },
    { key: 'Hungarian', label: 'Magyar' },
    { key: 'Indonesian', label: 'Bahasa Indonesia' },
    { key: 'Italian', label: 'Italiano' },
    { key: 'Japanese', label: '日本語' },
    { key: 'Korean', label: '한국어' },
    { key: 'Malay', label: 'Bahasa Melayu' },
    { key: 'Norwegian', label: 'Norsk' },
    { key: 'Polish', label: 'Polski' },
    { key: 'Portuguese', label: 'Português' },
    { key: 'Romanian', label: 'Română' },
    { key: 'Russian', label: 'Русский' },
    { key: 'Spanish', label: 'Español' },
    { key: 'Swahili', label: 'Kiswahili' },
    { key: 'Swedish', label: 'Svenska' },
    { key: 'Tagalog', label: 'Tagalog' },
    { key: 'Tamil', label: 'தமிழ்' },
    { key: 'Thai', label: 'ภาษาไทย' },
    { key: 'Turkish', label: 'Türkçe' },
    { key: 'Ukrainian', label: 'Українська' },
    { key: 'Vietnamese', label: 'Tiếng Việt' },
  ].sort((a, b) => a.label.localeCompare(b.label)), []);

  const handleLanguageRowPress = React.useCallback(() => {
    setIsLanguageModalOpen(true);
  }, []);

  const handleLanguageSelect = React.useCallback((value: string) => {
    // English, Chinese, Afrikaans, Indonesian, Malay, Czech, Dutch, German, Spanish, French, Italian, Swahili, Hungarian, Norwegian, Polish, Portuguese, Romanian, Finnish, and Swedish are fully supported, default to English for other languages
    const selectedLanguage = (value === 'English' || value === 'Chinese' || value === 'Afrikaans' || value === 'Indonesian' || value === 'Malay' || value === 'Czech' || value === 'Dutch' || value === 'German' || value === 'Spanish' || value === 'French' || value === 'Italian' || value === 'Swahili' || value === 'Hungarian' || value === 'Norwegian' || value === 'Polish' || value === 'Portuguese' || value === 'Romanian' || value === 'Finnish' || value === 'Swedish') ? value : 'English';
    setLanguage(selectedLanguage as Language);
    setIsLanguageModalOpen(false);
  }, [setLanguage]);

  const handleBackupOnlyFormEntriesToggle = React.useCallback(async () => {
    if (shouldDisableOtherButtons) {
      return;
    }
    try {
      const newValue = !backupOnlyFormEntries;
      setBackupOnlyFormEntries(newValue);
      await saveBackupOnlyFormEntriesPreference(newValue);
    } catch (error) {
      console.error('Error toggling backup-only form entries preference:', error);
    }
  }, [backupOnlyFormEntries, shouldDisableOtherButtons, saveBackupOnlyFormEntriesPreference]);

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
      handleShowSuccessModal(clearDataBackgroundTaskProgress.message || strings[language].appSettingsPage.clearDataCompletedSuccessfully);
    } else if (clearDataBackgroundTaskProgress?.networkError && !hasNetworkErrorModalBeenShown) {
      // Show persistent network error modal only if it hasn't been shown yet
      handleShowNetworkErrorModal('clearData');
      // Reset restoration state to allow navigation
      setIsDataRestorationInProgress(false);
    } else if (clearDataBackgroundTaskProgress?.noData) {
      // Check if this is recent no data progress (not stale)
      const now = Date.now();
      const progressTime = clearDataBackgroundTaskProgress.timestamp || 0;
      const timeDiff = now - progressTime;
      
      // Only show modal if progress is recent (within 30 seconds)
      if (timeDiff < 30 * 1000) {
        console.log('Showing no clear data modal for recent progress');
        handleShowNoClearDataModal();
        // Clear the progress data after showing modal to prevent re-triggering
        setTimeout(async () => {
          try {
            await clearClearDataBackgroundTaskProgress();
            console.log('Cleared no data progress after showing modal');
          } catch (error) {
            console.error('Error clearing no data progress:', error);
          }
        }, 100);
      } else {
        console.log('Ignoring stale no data progress (older than 30 seconds)');
        // Clear stale progress data
        setTimeout(async () => {
          try {
            await clearClearDataBackgroundTaskProgress();
            console.log('Cleared stale no data progress');
          } catch (error) {
            console.error('Error clearing stale no data progress:', error);
          }
        }, 100);
      }
      
      // Reset restoration state to allow navigation
      setIsDataRestorationInProgress(false);
    } else if (clearDataBackgroundTaskProgress?.error || clearDataBackgroundTaskProgress?.cancelled) {
      // Reset restoration state to allow navigation for any other completion state
      setIsDataRestorationInProgress(false);
    }
  }, [clearDataBackgroundTaskProgress, isCancelClearDataModalOpen, cancelClearDataOverlayOpacity, cancelClearDataModalOpacity, isNavigationGuardModalOpen, navigationGuardOverlayOpacity, navigationGuardModalOpacity, hasNetworkErrorModalBeenShown, clearClearDataBackgroundTaskProgress]);

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
      handleShowSuccessModal(backupBackgroundTaskProgress.message || strings[language].appSettingsPage.backupCompletedSuccessfully);
    } else if (backupBackgroundTaskProgress?.serverError && !hasServerErrorModalBeenShown) {
      handleShowBackupServerErrorModal();
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
  }, [backupBackgroundTaskProgress, isCancelBackupModalOpen, cancelBackupOverlayOpacity, cancelBackupModalOpacity, isNavigationGuardModalOpen, navigationGuardOverlayOpacity, navigationGuardModalOpacity, navigationBlockingProcess, hasNetworkErrorModalBeenShown, hasServerErrorModalBeenShown, handleShowBackupServiceBusyModal, handleShowNetworkErrorModal, handleShowBackupServerErrorModal]);

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
      
      // If navigation guard modal is open when import completes, dismiss it first
      if (isNavigationGuardModalOpen && navigationBlockingProcess === 'import') {
        console.log('Import completed while navigation guard modal is open - dismissing navigation guard modal first');
        // Immediately dismiss navigation guard modal without animation to make it seamless
        setIsNavigationGuardModalOpen(false);
        navigationGuardOverlayOpacity.setValue(0);
        navigationGuardModalOpacity.setValue(0);
        setNavigationBlockingProcess(null);
      }
      
      // Show success modal when import completes (will stay open until manually dismissed)
      handleShowSuccessModal(strings[language].appSettingsPage.importCompleted);
    } else if (importBackgroundTaskProgress?.serverError && !hasImportServerErrorModalBeenShown) {
      console.log('Showing server error modal for import');
      handleShowImportServerErrorModal();
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
  }, [importBackgroundTaskProgress, isCancelImportModalOpen, cancelImportOverlayOpacity, cancelImportModalOpacity, isNavigationGuardModalOpen, navigationGuardOverlayOpacity, navigationGuardModalOpacity, navigationBlockingProcess, hasImportServerErrorModalBeenShown, handleShowImportServerErrorModal]);

  // Watch for delete account completion to handle Clerk deletion
  React.useEffect(() => {
    if (deleteAccountBackgroundTaskProgress?.completed && deleteAccountBackgroundTaskProgress?.success && !deleteAccountBackgroundTaskProgress?.error && !deleteAccountBackgroundTaskProgress?.cancelled) {
      if (!hasDeleteAccountServerErrorModalBeenShown) {
        // Local data deletion completed successfully, now delete from Clerk
        console.log('Local data deletion completed, proceeding with Clerk account deletion...');
        
        deleteAccount().then((result) => {
          if (result.success) {
            console.log('Account deletion successful');
            setHasDeleteAccountCompleted(true);
            // User will be automatically redirected to login screen due to auth state change
          } else {
            console.error('Clerk account deletion failed:', result.error);
            handleShowDeleteAccountServerErrorModal(result.error || strings[language].appSettingsPage.deleteAccountServerError);
          }
        }).catch((error) => {
          console.error('Error during Clerk account deletion:', error);
          if (!hasDeleteAccountServerErrorModalBeenShown) {
            const message = error instanceof Error ? error.message : strings[language].appSettingsPage.deleteAccountServerError;
            handleShowDeleteAccountServerErrorModal(message);
          }
        });
      }
    } else if (deleteAccountBackgroundTaskProgress?.error && !hasDeleteAccountServerErrorModalBeenShown) {
      console.error('Delete account background task error:', deleteAccountBackgroundTaskProgress.errorMessage);
      handleShowDeleteAccountServerErrorModal(deleteAccountBackgroundTaskProgress?.errorMessage || strings[language].appSettingsPage.deleteAccountServerError);
    }
  }, [
    deleteAccountBackgroundTaskProgress,
    deleteAccount,
    language,
    hasDeleteAccountServerErrorModalBeenShown,
    handleShowDeleteAccountServerErrorModal
  ]);


  const handleBackPress = React.useCallback(() => {
    // Check if backup, import, clear data, or delete account is running and prevent navigation
    if (isBackupBackgroundTaskRunning || isBackupCleanupInProgress || isBackupStopping || isLocallyStoppingBackup || isCancelCooldownActive) {
      handleShowNavigationGuardModal('backup');
      return;
    } else if (isImportBackgroundTaskRunning || isImportStopping || isImportCancelCooldownActive || isImportCleanupInProgress) {
      handleShowNavigationGuardModal('import');
      return;
    } else if (isClearDataBackgroundTaskRunning || isLocallyStartingClearData || isDataRestorationInProgress) {
      handleShowNavigationGuardModal('deletion');
      return;
    } else if (isDeleteAccountBackgroundTaskRunning || isDeleteAccountCleanupInProgress || isDeleteAccountStopping) {
      handleShowNavigationGuardModal('deletion');
      return;
    }
    
    router.back();
  }, [router, isBackupBackgroundTaskRunning, isBackupCleanupInProgress, isBackupStopping, isLocallyStoppingBackup, isCancelCooldownActive, isImportBackgroundTaskRunning, isImportStopping, isImportCancelCooldownActive, isImportCleanupInProgress, isClearDataBackgroundTaskRunning, isLocallyStartingClearData, isDataRestorationInProgress, isDeleteAccountBackgroundTaskRunning, isDeleteAccountCleanupInProgress, isDeleteAccountStopping, handleShowNavigationGuardModal]);

  const handleBackupPress = React.useCallback(() => {
    // Check if deck creation is running
    if (isBackgroundTaskRunning) {
      handleShowDeckCreationBlockingModal();
      return;
    }
    
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
  }, [overlayOpacity, modalOpacity, isBackgroundTaskRunning, handleShowDeckCreationBlockingModal]);

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
      const hasDataToBackup = await checkForBackupData({ onlyUserFormEntries: backupOnlyFormEntries });
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
      const success = await startBackupBackgroundTask(getToken, language, {
        backupOnlyFormEntries,
      });
      
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
          strings[language].appSettingsPage.failedToStartBackupProcess,
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
        `${strings[language].appSettingsPage.backupFailed}: ${error instanceof Error ? error.message : strings[language].unknownError}`,
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissBackup, language, getToken, startBackupBackgroundTaskMonitoring, backupLoadingOverlayOpacity, resetBackupForceStoppedFlag, clearBackupBackgroundTaskProgress, isBackupCleanupInProgress, isBackupStopping, isLocallyStoppingBackup, isCancelCooldownActive, checkNetworkConnectivity, handleShowBackupLoadingNetworkErrorModal, isBackupBackgroundTaskRunning, forceStopBackupBackgroundTask, stopBackupBackgroundTask, backupOnlyFormEntries]);

  const handleLoadDataPress = React.useCallback(() => {
    // Check if deck creation is running
    if (isBackgroundTaskRunning) {
      handleShowDeckCreationBlockingModal();
      return;
    }
    
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
  }, [loadDataOverlayOpacity, loadDataModalOpacity, isBackgroundTaskRunning, handleShowDeckCreationBlockingModal]);
  
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
          strings[language].appSettingsPage.failedToStartImportProcess,
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
        `${strings[language].appSettingsPage.importFailed}: ${error instanceof Error ? error.message : strings[language].unknownError}`,
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissLoadData, language, getToken, startImportBackgroundTaskMonitoring, importLoadingOverlayOpacity, resetImportForceStoppedFlag, clearImportBackgroundTaskProgress, isImportBackgroundTaskRunning, forceStopImportBackgroundTask, stopImportBackgroundTask, checkNetworkConnectivity, handleShowImportLoadingNetworkErrorModal]);

  const handleClearDataPress = React.useCallback(() => {
    // Check if deck creation is running
    if (isBackgroundTaskRunning) {
      handleShowDeckCreationBlockingModal();
      return;
    }
    
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
  }, [deleteLocalStorageOverlayOpacity, deleteLocalStorageModalOpacity, isBackgroundTaskRunning, handleShowDeckCreationBlockingModal]);

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
      
      // Check if there's any data to clear BEFORE starting background task
      const hasDataToClear = await checkForClearData();
      if (!hasDataToClear) {
        console.log('No data to clear - showing modal immediately');
        handleShowNoClearDataModal();
        return;
      }
      
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
      
      // Show loading screen first
      setIsClearDataLoading(true);
      Animated.timing(clearDataLoadingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Small delay to ensure loading screen renders before starting background task
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Start background task monitoring
      startClearDataBackgroundTaskMonitoring();
      
      // Set local state immediately to show that clear data is starting
      setIsLocallyStartingClearData(true);
      
      // Start the clear data background task immediately
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
          strings[language].appSettingsPage.failedToStartClearDataProcess,
          [{ text: strings[language].ok }]
        );
        return;
      }
      
      // Add a small delay to ensure the background task has time to start
      // before the monitoring detects the clear data is running
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // The loading screen will be hidden when isClearDataBackgroundTaskRunning becomes true
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
        `${strings[language].appSettingsPage.clearDataFailed}: ${error instanceof Error ? error.message : strings[language].unknownError}`,
        [{ text: strings[language].ok }]
      );
    }
  }, [handleDismissClearData, language, startClearDataBackgroundTaskMonitoring, clearDataLoadingOverlayOpacity, resetClearDataForceStoppedFlag, clearClearDataBackgroundTaskProgress, isClearDataBackgroundTaskRunning, forceStopClearDataBackgroundTask, stopClearDataBackgroundTask]);

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
      
      // Clear the persistent delete account completion state when user manually dismisses
      setHasDeleteAccountCompleted(false);
      
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
      
      // Also clear the delete account progress data from AsyncStorage to prevent it from showing again
      try {
        await AsyncStorage.removeItem('deleteAccountBgTaskProgress');
        console.log('Cleared delete account progress data after user dismissed success modal');
      } catch (error) {
        console.error('Error clearing delete account progress data:', error);
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
        strings[language].appSettingsPage.failedToCancelBackupTask,
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
        strings[language].appSettingsPage.failedToCancelImportTask,
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
        strings[language].appSettingsPage.failedToCancelClearDataTask,
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
  const checkForBackupData = React.useCallback(async (options?: { onlyUserFormEntries?: boolean }): Promise<boolean> => {
    try {
      if (options?.onlyUserFormEntries) {
        const userFormEntries = await extractRecentUserFormEntriesFromSQLite();
        const hasData = userFormEntries.length > 0;
        console.log(`Backup data check (form entries only): userFormEntries=${userFormEntries.length}, hasData=${hasData}`);
        return hasData;
      }

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
  
  // Calculate bottom spacing for Android devices with system navigation bar
  const bottomSpacing = React.useMemo(() => {
    if (Platform.OS === 'android') {
      // Add extra spacing for Android devices with system navigation bar
      return insets.bottom > 0 ? insets.bottom + 16 : 16;
    }
    return 24;
  }, [insets.bottom]);

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
              contentContainerStyle={{ paddingBottom: 20 }}
              style={[{ marginBottom: bottomSpacing + 90 }]}
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
                      {availableLanguages.find(l => l.key === language)?.label || language}
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
                    <View style={{ 
                      position: 'absolute', 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      backgroundColor: colors.background, 
                      borderTopLeftRadius: 24, 
                      borderTopRightRadius: 24, 
                      paddingTop: 12,
                      paddingBottom: 24,
                      maxHeight: Dimensions.get('window').height * 0.6,
                      minHeight: 440, // Height to show 5 languages comfortably (5 * 60px + title + cancel button + padding)
                    }}>
                      <Text style={{ 
                        fontSize: 32, 
                        fontFamily: Fonts.title, 
                        color: colors.text, 
                        textAlign: 'left', 
                        marginBottom: 16,
                        paddingHorizontal: 24,
                      }}>
                        {strings[language]?.appSettingsPage?.selectLanguage || strings.English.appSettingsPage.selectLanguage}
                      </Text>
                      <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 24 }}
                        showsVerticalScrollIndicator={true}
                      >
                        {availableLanguages.map((lang) => (
                          <TouchableOpacity 
                            key={lang.key}
                            style={{ 
                              paddingVertical: 18,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.unselectedText + '20',
                            }} 
                            onPress={() => handleLanguageSelect(lang.key)}
                          >
                            <Text style={{ 
                              fontFamily: Fonts.bodyBold, 
                              fontSize: 20, 
                              color: language === lang.key ? colors.brandColor1 : colors.text, 
                              textAlign: 'center' 
                            }}>
                              {lang.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity 
                        style={{ 
                          marginTop: 16, 
                          alignSelf: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 32,
                        }} 
                        onPress={() => setIsLanguageModalOpen(false)}
                      >
                        <Text style={{ 
                          color: colors.brandColor2, 
                          fontSize: 20, 
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
                      {strings[language].appSettingsPage.pleaseDontCloseAppBackup}
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
                            ? strings[language].appSettingsPage.pleaseWait
                            : strings[language].appSettingsPage.backupDataToCloud
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                {!isBackupBackgroundTaskRunning && (
                  <TouchableOpacity
                    style={[
                      styles.backupOptionRow,
                      { opacity: shouldDisableOtherButtons ? 0.6 : 1 },
                    ]}
                    onPress={handleBackupOnlyFormEntriesToggle}
                    activeOpacity={0.7}
                    disabled={shouldDisableOtherButtons}
                  >
                    <Text
                      style={[
                        styles.checkboxLabel,
                        {
                          color: shouldDisableOtherButtons ? colors.disabledIconBackgroundColor : colors.text,
                        },
                      ]}
                    >
                      {strings[language].appSettingsPage.backupOnlyFormEntries}
                    </Text>
                    <MaterialIcons
                      name={backupOnlyFormEntries ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={
                        shouldDisableOtherButtons
                          ? colors.unselectedText
                          : backupOnlyFormEntries
                            ? colors.brandColor2
                            : colors.unselectedText
                      }
                    />
                  </TouchableOpacity>
                )}
                <Text style={[styles.descriptionText, { 
                  color: colors.text,
                  fontFamily: Fonts.bodyItalicLight,
                  marginTop: 12,
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
                        ? strings[language].appSettingsPage.checkingDataInCloud
                        : importBackgroundTaskProgress?.status === 'importing'
                        ? strings[language].appSettingsPage.importingDataFromCloud
                        : strings[language].appSettingsPage.updatingLocalDatabase
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
                          ? strings[language].appSettingsPage.pleaseWait
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
                      {isClearDataLoading || isClearDataBackgroundTaskRunning
                        ? strings[language].appSettingsPage.pleaseWait
                        : (isLocallyStoppingClearData || isClearDataCancelCooldownActive)
                          ? strings[language].appSettingsPage.pleaseWait
                          : strings[language].appSettingsPage.clearLocalStorageData
                      }
                    </Text>
                  </View>
                </TouchableOpacity>
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
                  onPress={shouldDisableOtherButtons ? undefined : handleDeleteAccountPress}
                  disabled={shouldDisableOtherButtons}>
                  <View style={styles.buttonContent}>
                    <Text style={[styles.cloudButtonText, { 
                      fontFamily: Fonts.bodyMedium,
                    }]}>
                      {isDeleteAccountLoading || isDeleteAccountBackgroundTaskRunning
                        ? strings[language].appSettingsPage.pleaseWait
                        : (isDeleteAccountStopping || isDeleteAccountCleanupInProgress)
                          ? strings[language].appSettingsPage.pleaseWait
                          : strings[language].appSettingsPage.deleteAccount
                      }
                    </Text>
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
          Icon={DeleteModalIcon}
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

        {/* Delete Account Loading Screen */}
        <GreyOverlayBackground 
          visible={isDeleteAccountLoading}
          opacity={deleteAccountLoadingOverlayOpacity}
        />
        {isDeleteAccountLoading && (
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
          text={strings[language].appSettingsPage.cancelImport}
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
          text={strings[language].appSettingsPage.noDataToImport}
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
          text={strings[language].appSettingsPage.noDataToBackup}
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
          text={networkErrorOperation === 'backup' 
            ? strings[language].appSettingsPage.backupCancelledNetworkError
            : networkErrorOperation === 'import' 
            ? strings[language].appSettingsPage.importCancelledNetworkError
            : strings[language].appSettingsPage.clearDataCancelledNetworkError
          }
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissNetworkErrorModal}
        />

        {/* Backup Server Error Modal */}
        <GreyOverlayBackground 
          visible={isBackupServerErrorModalOpen}
          opacity={backupServerErrorOverlayOpacity}
          onPress={handleDismissBackupServerErrorModal}
        />
        <GenericModal
          visible={isBackupServerErrorModalOpen}
          opacity={backupServerErrorModalOpacity}
          text={strings[language].appSettingsPage.backupCancelledServerError}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissBackupServerErrorModal}
        />

        {/* Import Server Error Modal */}
        <GreyOverlayBackground 
          visible={isImportServerErrorModalOpen}
          opacity={importServerErrorOverlayOpacity}
          onPress={handleDismissImportServerErrorModal}
        />
        <GenericModal
          visible={isImportServerErrorModalOpen}
          opacity={importServerErrorModalOpacity}
          text={strings[language].appSettingsPage.importCancelledServerError}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissImportServerErrorModal}
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
          text={strings[language].appSettingsPage.backupFailedToStartNetworkError}
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
          text={strings[language].appSettingsPage.importFailedToStartNetworkError}
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
              ? strings[language].appSettingsPage.pleaseStayOnPageBackup
              : navigationBlockingProcess === 'import'
              ? strings[language].appSettingsPage.pleaseStayOnPageImport
              : strings[language].appSettingsPage.pleaseStayOnPageDeletion
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
          text={strings[language].appSettingsPage.oopsBackupTaskCancelled}
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
          text={strings[language].appSettingsPage.oopsImportTaskCancelled}
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
          text={strings[language].appSettingsPage.cancelClearData}
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
          text={strings[language].appSettingsPage.noDataToClear}
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
          text={strings[language].appSettingsPage.clearDataFailedToStartNetworkError}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissClearDataLoadingNetworkErrorModal}
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
          text={strings[language].appSettingsPage.backupServiceTemporarilyBusy}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissBackupServiceBusyModal}
        />

        {/* Delete Account Loading Network Error Modal */}
        <GreyOverlayBackground 
          visible={isDeleteAccountLoadingNetworkErrorModalOpen}
          opacity={deleteAccountLoadingNetworkErrorOverlayOpacity}
          onPress={handleDismissDeleteAccountLoadingNetworkErrorModal}
        />
        <GenericModal
          visible={isDeleteAccountLoadingNetworkErrorModalOpen}
          opacity={deleteAccountLoadingNetworkErrorModalOpacity}
          text={strings[language].appSettingsPage.deleteAccountFailedToStartNetworkError}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissDeleteAccountLoadingNetworkErrorModal}
        />

        {/* Delete Account Server Error Modal */}
        <GreyOverlayBackground 
          visible={isDeleteAccountServerErrorModalOpen}
          opacity={deleteAccountServerErrorOverlayOpacity}
          onPress={handleDismissDeleteAccountServerErrorModal}
        />
        <GenericModal
          visible={isDeleteAccountServerErrorModalOpen}
          opacity={deleteAccountServerErrorModalOpacity}
          text={deleteAccountServerErrorMessage || strings[language].appSettingsPage.deleteAccountServerError}
          Icon={DeleteModalIcon}
          buttons="single"
          onConfirm={handleDismissDeleteAccountServerErrorModal}
        />

        {/* Delete Account Modal */}
        <GreyOverlayBackground 
          visible={isDeleteAccountModalOpen}
          opacity={deleteAccountOverlayOpacity}
          onPress={handleDismissDeleteAccount}
        />
        <GenericModal
          visible={isDeleteAccountModalOpen}
          opacity={deleteAccountModalOpacity}
          text={strings[language].appSettingsPage.confirmDeleteAccount}
          Icon={DeleteModalIcon}
          buttons="double"
          onCancel={handleDismissDeleteAccount}
          onConfirm={handleConfirmDeleteAccount}
        />

        {/* Deck Creation Blocking Modal */}
        <GreyOverlayBackground 
          visible={isDeckCreationBlockingModalOpen}
          opacity={deckCreationBlockingOverlayOpacity}
          onPress={handleDismissDeckCreationBlockingModal}
        />
        <GenericModal
          visible={isDeckCreationBlockingModalOpen}
          opacity={deckCreationBlockingModalOpacity}
          text={strings[language].appSettingsPage.deckCreationInProgress}
          Icon={ModalExclamationMarkIcon}
          buttons="single"
          onConfirm={handleDismissDeckCreationBlockingModal}
        />

        {/* In-app notifications */}
        <BackgroundTaskNotification />
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
  backupOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    justifyContent: 'flex-start',
  },
  checkboxLabel: {
    marginRight: 8,
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
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