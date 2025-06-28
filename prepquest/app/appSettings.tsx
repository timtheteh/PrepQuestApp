import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, SafeAreaView, Platform, Dimensions, Switch, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Check camera permission status on component mount
  React.useEffect(() => {
    checkCameraPermission();
    checkGalleryPermission();
    checkMicPermission();
    loadNotificationsPreference();
  }, []);

  const loadNotificationsPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('notificationsEnabled');
      if (savedPreference !== null) {
        setNotificationsAccessEnabled(JSON.parse(savedPreference));
      }
    } catch (error) {
      console.error('Error loading notifications preference:', error);
    }
  };

  const saveNotificationsPreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
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

            {/* Row of two buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.cloudButton, { marginRight: 8 }]}
                onPress={() => { /* TODO: Backup logic */ }}>
                <Text style={styles.cloudButtonText}>{"Backup data\nto cloud"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cloudButton, { backgroundColor: '#8684FF' }]}
                onPress={() => { /* TODO: Load logic */ }}>
                <Text style={styles.cloudButtonText}>{"Load data\nfrom cloud"}</Text>
              </TouchableOpacity>
            </View>
        </View>
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
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
  cloudButton: {
    flex: 1,
    backgroundColor: '#4F41D8',
    borderRadius: 10,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cloudButtonText: {
    color: '#fff',
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    textAlign: 'center',
  },
}); 