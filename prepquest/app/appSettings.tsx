import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform, Switch, Alert, Linking, ScrollView , Animated, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import LottieView from 'lottie-react-native';
import { GenericModal } from '@/components/modals/GenericModal';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { db } from '@/db/index';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { useAuth } from '@clerk/clerk-expo';
import { StripedProgressBar } from '@/components/general/StripedProgressBar';
import { useBackupBackgroundTask } from '@/contexts/BackupBackgroundTaskContext';
import { startBackupBackgroundTask } from '@/utils/backupBackgroundTask';
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
    backupBackgroundTaskProgress, 
    startBackupBackgroundTaskMonitoring 
  } = useBackupBackgroundTask();
  
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

  // Check camera permission status on component mount
  React.useEffect(() => {
    checkCameraPermission();
    checkGalleryPermission();
    checkMicPermission();
    checkNotificationPermission();
    loadNotificationsPreference();
  }, []);

  // Watch for backup completion to show success modal
  React.useEffect(() => {
    if (backupBackgroundTaskProgress?.completed && backupBackgroundTaskProgress?.success && !backupBackgroundTaskProgress?.error) {
      // Set persistent backup completion state
      setHasBackupCompleted(true);
      
      // Show success modal when backup completes (will stay open until manually dismissed)
      handleShowSuccessModal(backupBackgroundTaskProgress.message || 'Backup completed successfully!');
    }
  }, [backupBackgroundTaskProgress]);

  // Show success modal on page load if backup was completed
  React.useEffect(() => {
    if (hasBackupCompleted && !isSuccessModalOpen) {
      handleShowSuccessModal('Backup completed successfully!');
    }
  }, [hasBackupCompleted, isSuccessModalOpen]);

  // Hide loading screen when backup background task starts running
  React.useEffect(() => {
    if (isBackupLoading && isBackupBackgroundTaskRunning) {
      Animated.timing(backupLoadingOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsBackupLoading(false);
      });
    }
  }, [isBackupBackgroundTaskRunning, isBackupLoading, backupLoadingOverlayOpacity]);

  // Handle notification responses for backup completion
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'backup_completed') {
        // Set persistent backup completion state
        setHasBackupCompleted(true);
        // Show success modal when user taps on backup notification (will stay open until manually dismissed)
        handleShowSuccessModal('Backup completed successfully!');
      }
    });

    return () => subscription.remove();
  }, []);

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


  const handleBackPress = React.useCallback(() => {
    router.back();
  }, [router]);

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
      
      // Show loading screen
      setIsBackupLoading(true);
      Animated.timing(backupLoadingOverlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Start background task monitoring
      startBackupBackgroundTaskMonitoring();
      
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
      }
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
  }, [handleDismissBackup, language, getToken, startBackupBackgroundTaskMonitoring, backupLoadingOverlayOpacity]);

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

  const handleConfirmLoadData = React.useCallback(() => {
    // TODO: Implement actual load data logic here
    handleDismissLoadData();
  }, [handleDismissLoadData]);

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
    // TODO: Implement actual delete local storage logic here
    handleDismissDeleteLocalStorage();
  }, [handleDismissDeleteLocalStorage]);

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
    ]).start(() => {
      setIsSuccessModalOpen(false);
      // Clear the persistent backup completion state when user manually dismisses
      setHasBackupCompleted(false);
    });
  }, [successOverlayOpacity, successModalOpacity]);

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
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderRadius: 30
                    }}>
                      <StripedProgressBar 
                        progress={backupBackgroundTaskProgress?.percentage || 0}
                        currentItems={backupBackgroundTaskProgress?.rowsUploaded || 0}
                        totalItems={backupBackgroundTaskProgress?.totalRows || 0}
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
                      {language === 'Chinese' ? '请保持应用开启，否则备份将提前结束' : "Please don't close this app otherwise backup will end prematurely"}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.cloudButton, { backgroundColor: colors.brandColor2 }]}
                    onPress={handleBackupPress}>
                    <View style={styles.buttonContent}>
                      <MaterialIcons name="cloud-upload" size={30} color="#fff" />
                      <Text style={[styles.cloudButtonText, { fontFamily: Fonts.bodyMedium }]}>{strings[language].appSettingsPage.backupDataToCloud}</Text>
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
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: colors.brandColor3, marginTop: 20 }]}
                  onPress={handleLoadDataPress}>
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="cloud-download" size={30} color="#fff" />
                    <Text style={[styles.cloudButtonText, { 
                      fontFamily: Fonts.bodyMedium,
                    }]}>{strings[language].appSettingsPage.loadDataFromCloud}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.descriptionText, { 
                  color: colors.text,
                  fontFamily: Fonts.bodyItalicLight,
                }]}>
                  {strings[language].appSettingsPage.loadDataDescription}
                  <Text style={[styles.descriptionText, { color: colors.brandColor1, fontFamily: Fonts.bodyItalicLight }]}>{strings[language].appSettingsPage.website}</Text>
                  <Text style={[styles.descriptionText, { color: colors.text, fontFamily: Fonts.bodyItalicLight }]}>.</Text>
                </Text>
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: colors.alertColor, marginTop: 20 }]}
                  onPress={handleDeleteLocalStoragePress}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="trash" size={30} color="#fff" />
                    <Text style={[styles.cloudButtonText, { 
                      fontFamily: Fonts.bodyMedium,
                    }]}>{strings[language].appSettingsPage.clearLocalStorageData}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.descriptionText, { 
                   color: colors.text,
                   fontFamily: Fonts.bodyItalicLight,
                 }]}>
                  {strings[language].appSettingsPage.clearLocalStorageDescription}
                </Text>
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: '#CC0000', marginTop: 20 }]}
                  onPress={() => {
                    // TODO: Implement delete account functionality
                    console.log('Delete account pressed');
                  }}>
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
}); 