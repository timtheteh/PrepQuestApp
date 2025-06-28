import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, SafeAreaView, Platform, Dimensions, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';

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
                onValueChange={setCameraAccessEnabled}
            />
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
}); 