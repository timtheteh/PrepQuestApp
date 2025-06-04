import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, TouchableWithoutFeedback } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { FormHeaderIcons } from '@/components/GenAIFormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { useState } from 'react';

export default function GenAIFormPage() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');

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

  const handleClearDeckName = () => {
    setDeckName('');
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

      <View style={styles.mainContainer}>
        <View style={styles.scrollContent}>
          <View style={styles.toggleContainer}>
            <RoundedContainer 
              leftLabel="Mandatory"
              rightLabel="Optional"
              onToggle={handleToggle}
            />
          </View>

          {isMandatory && (
            <View style={styles.formContent}>
              <View style={styles.inputRow}>
                <Text style={styles.label}>
                  <Text style={styles.highlightedText}>{mode === 'study' ? 'Study' : 'Interview'}</Text> Deck Name
                </Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type here!"
                    value={deckName}
                    onChangeText={setDeckName}
                  />
                  {deckName.length > 0 && (
                    <TouchableWithoutFeedback onPress={handleClearDeckName}>
                      <View style={styles.closeButtonContainer}>
                        <Ionicons
                          name={Platform.OS === 'ios' ? 'close-circle' : 'close-circle'}
                          size={24}
                          color="#D5D4DD"
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Submit"
            backgroundColor="#44B88A"
            onPress={handleSubmit}
          />
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
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
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
  toggleContainer: {
    marginTop: 4,
  },
  formContent: {
    marginTop: 16,
  },
  inputRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 32,
    fontFamily: 'Neuton-Regular',
    color: '#000000',
    marginBottom: 16,
    height: 40
  },
  highlightedText: {
    color: '#44B88A',
  },
  textInputContainer: {
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    paddingVertical: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 