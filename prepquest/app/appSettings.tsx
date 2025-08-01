import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform, Switch, Alert, Linking, ScrollView , Animated, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { GenericModal } from '@/components/modals/GenericModal';
import { db } from '@/db/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarAccountHeight } from '@/hooks/heights';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';

const TitleToggleRow = ({ text, value, onValueChange, language }: { text: string; value: boolean; onValueChange: (value: boolean) => void; language: string }) => {
    return (
      <View style={styles.titleToggleRow}>
        <Text style={[
          styles.titleToggleText,
        ]}>
          {text}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D5D4DD', true: '#44B88A' }}
          thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
          ios_backgroundColor="#D5D4DD"
        />
      </View>
    );
  };

export default function AppSettingsScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
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

  // Check camera permission status on component mount
  React.useEffect(() => {
    checkCameraPermission();
    checkGalleryPermission();
    checkMicPermission();
    loadNotificationsPreference();
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

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsAccessEnabled(value);
    saveNotificationsPreference(value);
  };

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



  const handleLanguageRowPress = () => {
    setIsLanguageModalOpen(true);
  };

  const handleLanguageSelect = (value: string) => {
    setLanguage(value as Language);
    setIsLanguageModalOpen(false);
  };

  const handleCameraToggle = async (value: boolean) => {
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
  };

  const handleGalleryToggle = async (value: boolean) => {
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
  };

  const handleMicToggle = async (value: boolean) => {
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
  };


  const handleBackPress = () => {
    router.back();
  };

  const handleBackupPress = () => {
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
  };

  const handleDismissBackup = () => {
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
  };

  const handleConfirmBackup = () => {
    // TODO: Implement actual backup logic here
    console.log('Backing up data to cloud...');
    handleDismissBackup();
  };

  const handleLoadDataPress = () => {
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
  };
  
  const handleDismissLoadData = () => {
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
  };

  const handleConfirmLoadData = () => {
    // TODO: Implement actual load data logic here
    console.log('Loading data from cloud...');
    handleDismissLoadData();
  };

  const handleDeleteLocalStoragePress = () => {
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
  };
  
  const handleDismissDeleteLocalStorage = () => {
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
  };    

  const handleConfirmDeleteLocalStorage = () => {
    // TODO: Implement actual delete local storage logic here
    console.log('Deleting local storage data...');
    handleDismissDeleteLocalStorage();
  };    

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: '#fff' }}>
        <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight()}]}>
            <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            >
            <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
            <Text style={[styles.title, { 
              // fontFamily: language === 'Chinese' ? 'NotoSansSC-Regular' : 'Neuton-Regular',
              marginLeft: 16,
              marginBottom: Platform.OS === 'ios' ? 5 : 10,
              }]}>{strings[language].appSettingsPage.title}</Text>
        </View>
        <View style={styles.mainContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View style={styles.titleToggleRow}>
                  <Text style={[styles.titleToggleText, { 
                    }]}>{strings[language].appSettingsPage.language}</Text>
                  <TouchableOpacity
                    style={{
                      width: 170,
                      height: 35,
                      borderRadius: 10,
                      backgroundColor: '#F8F8F8',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 16,
                    }}
                    activeOpacity={0.7}
                    onPress={handleLanguageRowPress}
                  >
                    <Text style={{ color: '#757575', fontSize: 18, fontFamily: 'Satoshi-Variable' }}>
                      {strings[language].appSettingsPage.languages[language.toLowerCase()]}
                    </Text>
                    <AntDesign name="right" size={20} color="#757575" />
                  </TouchableOpacity>
                </View>
                <Modal
                  visible={isLanguageModalOpen}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setIsLanguageModalOpen(false)}
                >
                  <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} activeOpacity={1} onPressOut={() => setIsLanguageModalOpen(false)}>
                    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                      {Object.entries(strings[language].appSettingsPage.languages).map(([langKey, langName]) => (
                        <TouchableOpacity 
                          key={langKey}
                          style={{ paddingVertical: 18 }} 
                          onPress={() => handleLanguageSelect(langKey.charAt(0).toUpperCase() + langKey.slice(1))}
                        >
                          <Text style={{ 
                            fontFamily: 'Satoshi-Variable', 
                            fontSize: 24, 
                            color: language.toLowerCase() === langKey ? '#44B88A' : '#222', 
                            textAlign: 'center' 
                          }}>
                            {langName as string}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setIsLanguageModalOpen(false)}>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ marginBottom: 16, alignSelf: 'center' }} onPress={() => setIsLanguageModalOpen(false)}>
                        <Text style={{ color: '#8684FF', fontSize: 20, 
                          // fontFamily: 'Satoshi-Medium' 
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

                <TouchableOpacity style={[styles.cloudButton,]}
                  onPress={handleBackupPress}>
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="cloud-upload" size={30} color="#fff" />
                    <Text style={styles.cloudButtonText}>{strings[language].appSettingsPage.backupDataToCloud}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.descriptionText, { 
                  }]}>
                  {strings[language].appSettingsPage.backupDescription}
                  <Text style={[styles.descriptionText, { color: '#44B88A' }]}>{strings[language].appSettingsPage.website}</Text>
                  <Text style={styles.descriptionText}>.</Text>
                </Text>
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: '#8684FF', marginTop: 20 }]}
                  onPress={handleLoadDataPress}>
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="cloud-download" size={30} color="#fff" />
                    <Text style={[styles.cloudButtonText, { 
                      }]}>{strings[language].appSettingsPage.loadDataFromCloud}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.descriptionText, { 
                  }]}>
                  {strings[language].appSettingsPage.loadDataDescription}
                  <Text style={[styles.descriptionText, { color: '#44B88A'}]}>{strings[language].appSettingsPage.website}</Text>
                  <Text style={styles.descriptionText}>.</Text>
                </Text>
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: '#FF3B30', marginTop: 20 }]}
                  onPress={handleDeleteLocalStoragePress}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="trash" size={30} color="#fff" />
                    <Text style={[styles.cloudButtonText, { 
                      }]}>{strings[language].appSettingsPage.clearLocalStorageData}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.descriptionText, { 
                   }]}>
                  {strings[language].appSettingsPage.clearLocalStorageDescription}
                </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontFamily: 'Neuton-Regular',
    fontSize: 32,
    color: '#000',
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
    fontFamily: 'Satoshi-Variable',
    fontSize: 16,
    color: '#000',
  },
  mainContainer: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#4F41D8',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
  },
  cloudButtonText: {
    color: '#fff',
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  descriptionText: {
    color: '#000',
    fontFamily: 'Satoshi-Italic',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
  },
}); 