import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, SafeAreaView, Platform, Dimensions, Switch, Alert, Linking, ScrollView , Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { GenericModal } from '@/components/GenericModal';
import { db } from '@/db/index';

const TitleToggleRow = ({ text, value, onValueChange }: { text: string; value: boolean; onValueChange: (value: boolean) => void }) => {
    return (
      <View style={styles.titleToggleRow}>
        <Text style={styles.titleToggleText}>{text}</Text>
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
  const [cameraAccessEnabled, setCameraAccessEnabled] = React.useState(false);
  const [galleryAccessEnabled, setGalleryAccessEnabled] = React.useState(false);
  const [micAccessEnabled, setMicAccessEnabled] = React.useState(false);
  const [notificationsAccessEnabled, setNotificationsAccessEnabled] = React.useState(false);

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


  const handleCameraToggle = async (value: boolean) => {
    if (value) {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setCameraAccessEnabled(true);
      } else {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to take photos. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // Note: We cannot programmatically revoke permissions on iOS/Android
      // The user would need to manually disable it in device settings
      Alert.alert(
        'Camera Permission',
        'To disable camera access, please go to your device settings and disable camera permissions for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
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
          'Gallery Permission Required',
          'Gallery access is required to upload images. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // Note: We cannot programmatically revoke permissions on iOS/Android
      // The user would need to manually disable it in device settings
      Alert.alert(
        'Gallery Permission',
        'To disable gallery access, please go to your device settings and disable gallery permissions for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
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
          'Microphone Permission Required',
          'Microphone access is required to record audio. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // Cannot programmatically revoke mic permissions
      Alert.alert(
        'Microphone Permission',
        'To disable microphone access, please go to your device settings and disable microphone permissions for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
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
        <View style={styles.topBar}>
            <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            >
            <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>App Settings</Text>
        </View>
        <View style={styles.mainContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 140 }}
            >
                <TitleToggleRow 
                    text="Camera Access"
                    value={cameraAccessEnabled}
                    onValueChange={handleCameraToggle}
                />
                <TitleToggleRow 
                    text="Gallery Access"
                    value={galleryAccessEnabled}
                    onValueChange={handleGalleryToggle}
                />
                <TitleToggleRow 
                    text="Microphone Access"
                    value={micAccessEnabled}
                    onValueChange={handleMicToggle}
                />
                <TitleToggleRow 
                    text="Notifications"
                    value={notificationsAccessEnabled}
                    onValueChange={handleNotificationsToggle}
                />

                <TouchableOpacity style={[styles.cloudButton,]}
                  onPress={handleBackupPress}>
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="cloud-upload" size={30} color="#fff" />
                    <Text style={styles.cloudButtonText}>Backup data to cloud</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.descriptionText}>
                  {"Backup your local storage to cloud regularly so that you can access your data on other devices.\n\nEach backup will replace the previous one. For more clarification, please refer to the FAQ in our "}
                  <Text style={[styles.descriptionText, { color: '#44B88A' }]}>website</Text>
                  <Text style={styles.descriptionText}>.</Text>
                </Text>
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: '#8684FF', marginTop: 20 }]}
                  onPress={handleLoadDataPress}>
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="cloud-download" size={30} color="#fff" />
                    <Text style={styles.cloudButtonText}>Load data from cloud</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.descriptionText}>
                  {"Import your existing data and progress from cloud if you logging in from another phone.\n\nEach import will replace your existing local storage. For more clarification, please refer to the FAQ in our "}
                  <Text style={[styles.descriptionText, { color: '#44B88A' }]}>website</Text>
                  <Text style={styles.descriptionText}>.</Text>
                </Text>
                <TouchableOpacity style={[styles.cloudButton, { backgroundColor: '#FF3B30', marginTop: 20 }]}
                  onPress={handleDeleteLocalStoragePress}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="trash" size={30} color="#fff" />
                    <Text style={styles.cloudButtonText}>Clear local storage data</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.descriptionText}>
                  {"This will delete all your local storage data and you will not be able to recover it. Please backup your data to cloud before clearing."}
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
          text="Proceed with cloud backup?"
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
          text="Proceed with cloud import?"
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
          text="Proceed with clearing local storage?"
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
    paddingTop: Dimensions.get('window').height < 670 ? 30 : 60,
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
    paddingTop: 20,
    paddingBottom: 20,
    // borderWidth: 1,
    // borderColor: 'red',
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