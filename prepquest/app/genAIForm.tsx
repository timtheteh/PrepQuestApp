import { View, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '@/components/GenAIFormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { TitleTextBar } from '@/components/TitleTextBar';
import { QuestionTextBar } from '@/components/QuestionTextBar';
import { useState } from 'react';

export default function GenAIFormPage() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [question1, setQuestion1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [question3, setQuestion3] = useState('');

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

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel="Mandatory"
            rightLabel="Optional"
            onToggle={handleToggle}
          />
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          {isMandatory && (
            <View style={styles.formContent}>
              <TitleTextBar
                title=" Deck Name"
                highlightedWord={mode === 'study' ? 'Study' : 'Interview'}
                placeholder="Type here!"
                value={deckName}
                onChangeText={setDeckName}
              />
              <QuestionTextBar
                label="Question 1"
                placeholder="Enter your first question"
                value={question1}
                onChangeText={setQuestion1}
                helperText="This will be the first question in your deck"
              />
              <QuestionTextBar
                label="Question 2"
                placeholder="Enter your second question"
                value={question2}
                onChangeText={setQuestion2}
                helperText="This will be the second question in your deck"
              />
              <QuestionTextBar
                label="Question 3"
                placeholder="Enter your third question"
                value={question3}
                onChangeText={setQuestion3}
                helperText="This will be the third question in your deck"
              />
              <QuestionTextBar
                label="Question 3"
                placeholder="Enter your third question"
                value={question3}
                onChangeText={setQuestion3}
                helperText="This will be the third question in your deck"
              />
              <View style={styles.bottomSpacing} />
            </View>
          )}
        </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 92, // button height (72) + padding top (20)
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
    paddingHorizontal: 16,
  },
  formContent: {
  },
  buttonContainer: {
    position: 'absolute',
    paddingTop: 20,
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
}); 