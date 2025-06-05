import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '@/components/GenAIFormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { TitleTextBar } from '@/components/TitleTextBar';
import { QuestionTextBar } from '@/components/QuestionTextBar';
import { NumberOfQuestions } from '@/components/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/TypeOfInterviewQn';
import { KindsOfQuestions } from '@/components/KindsOfQuestions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import React from 'react';

export default function GenAIFormPage() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [studyOptionalQuestion1, setStudyOptionalQuestion1] = useState('');
  const [studyOptionalQuestion2, setStudyOptionalQuestion2] = useState('');
  const [studyOptionalQuestion3, setStudyOptionalQuestion3] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [interviewOptionalQuestion1, setInterviewOptionalQuestion1] = useState('');
  const [interviewOptionalQuestion2, setInterviewOptionalQuestion2] = useState('');
  const [interviewOptionalQuestion3, setInterviewOptionalQuestion3] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure the layout is ready after the first render
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

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

  const bottomOffset = Platform.OS === 'ios' ? 
    (isReady ? insets.bottom : 34) : // Use 34 as default bottom inset for iOS
    20;

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
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
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
              {mode === 'study' && (
                <>
                  <QuestionTextBar
                    label="1. Education Level?"
                    placeholder="e.g. Freshman, Sophomore, etc"
                    value={studyMandatoryQuestion1}
                    onChangeText={setStudyMandatoryQuestion1}
                    helperText="What education level is your preparation for?"
                  />
                  <QuestionTextBar
                    label="2. Subject(s)?"
                    placeholder="e.g. Computer Science, Math, Physics, etc."
                    value={studyMandatoryQuestion2}
                    onChangeText={setStudyMandatoryQuestion2}
                    helperText="What subject(s) would this deck be for?"
                  />
                </>
              )}
              {mode !== 'study' && (
                <>
                <QuestionTextBar
                  label="1. Job/Role?"
                  placeholder="e.g. Frontend Developer, Private Equity Analyst, etc"
                  value={interviewMandatoryQuestion1}
                  onChangeText={setInterviewMandatoryQuestion1}
                  helperText="What job or role are you preparing for?"
                  />
                <TypeOfInterviewQn
                  value={interviewType}
                  onValueChange={setInterviewType}
                />
                </>
                
              )}
              <NumberOfQuestions
                title="3. Number of questions:"
                value={numberOfQuestions}
                onValueChange={setNumberOfQuestions}
              />
              <View style={styles.bottomSpacing} />
            </View>
          )}
          {!isMandatory && mode === 'study' && (
            <View style={styles.formContent}>
              <QuestionTextBar
                label="1. Topic(s)?"
                placeholder="e.g. Microeconomics, Electromagnetism, etc"
                value={studyOptionalQuestion1}
                onChangeText={setStudyOptionalQuestion1}
                helperText="Which topics would you like to study?"
              />
              <QuestionTextBar
                label="2. Subtopic(s)?"
                placeholder="e.g. Demand and Supply, etc"
                value={studyOptionalQuestion2}
                onChangeText={setStudyOptionalQuestion2}
                helperText="Which subtopics would you like to focus on?"
              />
              <QuestionTextBar
                label="3. Exam/Quiz?"
                placeholder="e.g. SAT, ACT, GRE, etc"
                value={studyOptionalQuestion3}
                onChangeText={setStudyOptionalQuestion3}
                helperText="Are you studying for an exam or quiz?"
              />
              <KindsOfQuestions
                  value={questionType}
                  onValueChange={setQuestionType}
              />
              <View style={styles.bottomSpacing} />
            </View>
          )}
          {!isMandatory && mode === 'interview' && (
            <View style={styles.formContent}>
              <QuestionTextBar
                label="1. Company?"
                placeholder="e.g. Google, Meta, Microsoft, etc"
                value={interviewOptionalQuestion1}
                onChangeText={setInterviewOptionalQuestion1}
                helperText="Which company are you preparing to interview with?"
              />
              <QuestionTextBar
                label="2. Experience Level?"
                placeholder="e.g. Junior Developer, Senior Developer, etc"
                value={interviewOptionalQuestion2}
                onChangeText={setInterviewOptionalQuestion2}
                helperText="Which experience level is your interview for?"
              />
              <QuestionTextBar
                label="3. Topic(s)?"
                placeholder="e.g. React, Java, Operating Systems, etc"
                value={interviewOptionalQuestion3}
                onChangeText={setInterviewOptionalQuestion3}
                helperText="Which topics would you like to focus on?"
              />
              <KindsOfQuestions
                  value={questionType}
                  onValueChange={setQuestionType}
              />
              <View style={styles.bottomSpacing} />
            </View>
          )}
        </ScrollView>

        <View style={[
          styles.buttonContainer,
          { bottom: Platform.OS === 'ios' ? bottomOffset : 40 }
        ]}>
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
    paddingBottom: Platform.OS === 'ios' ? 0 : 20, // button height (72) + padding top (20)
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
    gap: Platform.OS === 'ios' ? 0 : 16,
  },
  buttonContainer: {
    position: 'absolute',
    paddingTop: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
}); 