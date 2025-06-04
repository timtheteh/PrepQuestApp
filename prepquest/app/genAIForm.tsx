import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '@/components/GenAIFormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { useState } from 'react';

export default function GenAIFormPage() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const [isMandatory, setIsMandatory] = useState(true);

  const handleBackPress = () => {
    router.back();
  };

  const handleUseMostRecentFormPress = () => {
    console.log('Use most recent form');
    // To be implemented
  };

  const handleClearAllPress = () => {
    console.log('Clear all');
    // To be implemented
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsMandatory(!isRightSide);
  };

  const handleSubmit = () => {
    console.log('Submit form');
    // To be implemented
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
      </View>
      
      <View style={styles.headerIconsContainer}>
        <FormHeaderIcons 
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
          onClearAllPress={handleClearAllPress}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel="Mandatory"
            rightLabel="Optional"
            onToggle={handleToggle}
          />
        </View>
        <Text style={styles.text}>{mode} Mode</Text>
      </View>

      <View style={styles.buttonContainer}>
        <ActionButton
          text="Submit"
          backgroundColor="#44B88A"
          onPress={handleSubmit}
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
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 60 : 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  toggleContainer: {
    marginTop: 4,
  },
  text: {
    fontSize: 24,
    fontFamily: 'Satoshi-Medium',
    textAlign: 'center',
    marginTop: 24,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 40
  },
}); 