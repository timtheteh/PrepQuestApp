import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export default function DeckSettingsPage() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Deck Settings</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Configure your deck preferences here</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 