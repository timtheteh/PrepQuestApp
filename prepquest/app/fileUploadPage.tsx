import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Text, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/FormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { TitleTextBar } from '@/components/TitleTextBar';
import { QuestionTextBar } from '@/components/QuestionTextBar';
import { NumberOfQuestions } from '@/components/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/TypeOfInterviewQn';
import { KindsOfQuestions } from '@/components/KindsOfQuestions';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { GenericModal } from '@/components/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import { SmallCircleSelectButton } from '@/components/SmallCircleSelectButton';
import HelpIconOutline from '@/assets/icons/helpIconOutline.svg';
import { PrimaryButton } from '@/components/PrimaryButton';
import CloudUploadIcon from '@/assets/icons/cloudUploadIcon.svg';
import ImageIconFilled from '@/assets/icons/imageIconFilled.svg';
import CameraIconFilled from '@/assets/icons/cameraIconFilled.svg';

const HelpIconFilled: React.FC<SvgProps> = (props) => (
  <Svg 
    width={props.width || 31} 
    height={props.height || 31} 
    viewBox="0 0 31 31" 
    fill="none" 
    {...props}
  >
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM13.9019 18.4478C13.9019 18.5539 13.9879 18.6399 14.094 18.6399H16.1124C16.2185 18.6399 16.3045 18.5539 16.3045 18.4478C16.3093 17.9257 16.3694 17.4874 16.4848 17.1327C16.6051 16.7732 16.7879 16.4604 17.0332 16.1945C17.2833 15.9285 17.6031 15.6724 17.9927 15.4261C18.4353 15.1552 18.8176 14.8474 19.1399 14.5026C19.4622 14.1578 19.7099 13.7638 19.883 13.3205C20.061 12.8773 20.15 12.3749 20.15 11.8134C20.15 10.981 19.9528 10.2619 19.5584 9.6561C19.1688 9.04536 18.6228 8.57499 17.9206 8.245C17.2232 7.915 16.4151 7.75 15.4964 7.75C14.6547 7.75 13.8851 7.90761 13.1876 8.22283C12.495 8.53805 11.937 9.01088 11.5138 9.64132C11.3094 9.94918 11.1521 10.2934 11.0418 10.6741C10.8383 11.3764 11.4529 11.9907 12.1841 11.9907H12.2122C12.8883 11.9907 13.3794 11.4108 13.7504 10.8456C13.9524 10.5402 14.2049 10.3136 14.508 10.1659C14.8158 10.0132 15.1405 9.93684 15.482 9.93684C15.8523 9.93684 16.1866 10.0156 16.4848 10.1733C16.7879 10.3309 17.0284 10.5525 17.2063 10.8382C17.3843 11.1238 17.4733 11.4612 17.4733 11.8503C17.4733 12.1951 17.4059 12.5079 17.2713 12.7886C17.1366 13.0644 16.9514 13.3156 16.7157 13.5422C16.4848 13.7638 16.2227 13.9682 15.9293 14.1554C15.5012 14.4263 15.1381 14.7243 14.8398 15.0493C14.5416 15.3695 14.3107 15.7931 14.1472 16.3201C13.9885 16.8471 13.9067 17.5563 13.9019 18.4478ZM14.039 22.7772C14.3516 23.0924 14.7244 23.25 15.1573 23.25C15.4459 23.25 15.708 23.1786 15.9437 23.0357C16.1842 22.888 16.3766 22.691 16.5209 22.4447C16.67 22.1984 16.7446 21.9251 16.7446 21.6246C16.7446 21.1814 16.5858 20.8021 16.2684 20.4869C15.9557 20.1717 15.5854 20.0141 15.1573 20.0141C14.7244 20.0141 14.3516 20.1717 14.039 20.4869C13.7263 20.8021 13.57 21.1814 13.57 21.6246C13.57 22.0778 13.7263 22.4619 14.039 22.7772Z" 
      fill="#363538"
    />
  </Svg>
);

const FileUploadMainSection = () => {
  return (
    <View style={styles.fileUploadMainSection}>
      <View style={styles.uploadContent}>
        <CloudUploadIcon width={110} height={110} />
        <Text style={styles.supportedFilesText}>
          Word documents, Text documents, Powerpoint files, Excel sheets, Pdf files, Anki Decks
        </Text>
        <PrimaryButton 
          text="Browse"
          onPress={() => {}}
        />
      </View>
      <View style={styles.cornerIconsContainer}>
        <ImageIconFilled width={30} height={30} />
        <CameraIconFilled width={40} height={40} />
      </View>
    </View>
  );
};

export default function FileUploadPage() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAIGenerate, setIsAIGenerate] = useState(false);
  const [isAIHelpModalOpen, setIsAIHelpModalOpen] = useState(false);
  const aiHelpOverlayOpacity = useRef(new Animated.Value(0)).current;
  const aiHelpModalOpacity = useRef(new Animated.Value(0)).current;

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    20;

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

  useEffect(() => {
    if (isHelpModalOpen) {
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
    }
  }, [isHelpModalOpen]);

  useEffect(() => {
    if (isAIHelpModalOpen) {
      Animated.parallel([
        Animated.timing(aiHelpOverlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(aiHelpModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isAIHelpModalOpen]);

  useEffect(() => {
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const handleClearAllPress = () => {
    // Reset mandatory fields only
    setDeckName('');
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    setNumberOfQuestions(1);
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsMandatory(!isRightSide);
    
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const isStudyMandatoryFieldsFilled = () => {
    return deckName.trim() !== '' && 
           studyMandatoryQuestion1.trim() !== '' && 
           studyMandatoryQuestion2.trim() !== '';
  };

  const isInterviewMandatoryFieldsFilled = () => {
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '';
  };

  const isSubmitDisabled = () => {
    if (!isMandatory) return false;
    return mode === 'study' ? !isStudyMandatoryFieldsFilled() : !isInterviewMandatoryFieldsFilled();
  };

  const handleSubmit = () => {
    router.back();
  };

  const handleDismissHelp = () => {
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
      setIsHelpModalOpen(false);
    });
  };

  const handleDismissAIHelp = () => {
    Animated.parallel([
      Animated.timing(aiHelpOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(aiHelpModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAIHelpModalOpen(false);
    });
  };

  const mandatoryOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const fileUploadOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const getScrollContentPaddingTop = () => {
    if (isMandatory) return 16; // default padding for Mandatory state

    const height = Dimensions.get('window').height;
    if (Platform.OS === 'ios') {
      if (height > 900) return 55;
      if (height >= 800) return 23;
      return 16;
    } else {
      if (height > 930) return 35;
      if (height > 900) return 20;
      return 10;
    }
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
      
      {isMandatory && (
        <View style={styles.headerIconsContainer}>
          <FormHeaderIcons 
            onClearAllPress={handleClearAllPress}
          />
        </View>
      )}

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel="Mandatory"
            rightLabel="File Upload"
            onToggle={handleToggle}
          />
        </View>
        <ScrollView 
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: getScrollContentPaddingTop() }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            styles.formContent,
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex' }
          ]}>
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
          </Animated.View>

          <Animated.View style={[
            styles.formContent,
            { opacity: fileUploadOpacity, display: !isMandatory ? 'flex' : 'none' }
          ]}>
            <Text style={styles.fileUploadTitle}>
              Upload any file document to generate a new deck!
            </Text>
            <FileUploadMainSection />
            <View style={styles.aiGenerateRow}>
              <SmallCircleSelectButton
                selected={isAIGenerate}
                onPress={() => setIsAIGenerate(!isAIGenerate)}
              />
              <Text style={styles.aiGenerateText}>AI Generate new card content?</Text>
              <TouchableOpacity onPress={() => setIsAIHelpModalOpen(true)}>
                <HelpIconOutline width={24} height={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomSpacingFilUpload} />
          </Animated.View>
        </ScrollView>

        <View style={[
          styles.buttonContainer,
          { bottom: Platform.OS === 'ios' ? bottomOffset : 40 }
        ]}>
          <ActionButton
            text="Submit"
            backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
            onPress={handleSubmit}
            disabled={isSubmitDisabled()}
          />
        </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isAIHelpModalOpen}
        opacity={isHelpModalOpen ? overlayOpacity : aiHelpOverlayOpacity}
        onPress={isHelpModalOpen ? handleDismissHelp : handleDismissAIHelp}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text="Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more."
        buttons='none'
        textStyle={{
          highlightWord: "our website",
          highlightColor: "#44B88A"
        }}
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isAIHelpModalOpen}
        opacity={aiHelpModalOpacity}
        text="Ticking this option will let AI generate new, suggested cards outside the content of your upload."
        buttons='none'
        Icon={HelpIconFilled}
      />
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
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    justifyContent: 'center',
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
    paddingTop: Dimensions.get('window').height < 670 ? 10 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomSpacingFilUpload: {
    height: 50,
  },
  fileUploadTitle: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'left',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 10 : 40,
  },
  fileUploadMainSection: {
    height: 370,
    width: '95%',
    alignSelf: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#4F41D8',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContent: {
    height: '90%',
    alignItems: 'center',
    gap: 30,
    paddingTop: 10,
  },
  supportedFilesText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    maxWidth: '80%',
    paddingBottom: 10,
  },
  aiGenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 20 : 5,
    gap: 5,
  },
  aiGenerateText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#000000',
  },
  cornerIconsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}); 