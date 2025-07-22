import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Switch, Animated, FlatList, NativeSyntheticEvent, NativeScrollEvent, TextStyle, ScrollView as RNScrollView , StyleSheet as RNStyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import HelpIconFilled from '@/assets/icons/helpIconFilled.svg';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { GenericModal } from '@/components/GenericModal';
import { DifficultyToggleRow } from '@/components/DifficultyToggleRow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopBarAccountHeight } from '@/constants/heights';
import { useAuth } from '@/contexts/AuthContext';

// Local component for title and toggle row
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

// Local component for list paragraph with help icon
const ListParagraph = ({ listItems, onHelpPress }: { listItems: string[]; onHelpPress: () => void }) => {
  return (
    <View style={styles.listParagraphContainer}>
      <View style={styles.listColumn}>
        {listItems.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.iconColumn}>
        <TouchableOpacity onPress={onHelpPress}>
          <HelpIconFilled width={30} height={30} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Local TimePicker component
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2);

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

const TimePicker = ({
  initialMinutes = 0,
  initialSeconds = 0,
  onChange,
  minutesRange = Array.from({ length: 3 }, (_, i) => i),
  secondsRange = Array.from({ length: 60 }, (_, i) => i ),
  language = 'English',
}: {
  initialMinutes?: number;
  initialSeconds?: number;
  onChange?: (min: number, sec: number) => void;
  minutesRange?: number[];
  secondsRange?: number[];
  language?: string;
}) => {
  const [selectedMin, setSelectedMin] = React.useState<number>(initialMinutes);
  const [selectedSec, setSelectedSec] = React.useState<number>(initialSeconds);
  const minRef = React.useRef(null);
  const secRef = React.useRef(null);
  const minScrollY = React.useRef(new Animated.Value((minutesRange.indexOf(initialMinutes)) * ITEM_HEIGHT)).current;
  const secScrollY = React.useRef(new Animated.Value((secondsRange.indexOf(initialSeconds)) * ITEM_HEIGHT)).current;

  React.useEffect(() => {
    setTimeout(() => {
      const minY = (minutesRange.indexOf(initialMinutes)) * ITEM_HEIGHT;
      const secY = (secondsRange.indexOf(initialSeconds)) * ITEM_HEIGHT;
      (minRef.current as any)?.scrollTo({ y: minY, animated: false });
      (secRef.current as any)?.scrollTo({ y: secY, animated: false });
      minScrollY.setValue(minY);
      secScrollY.setValue(secY);
    }, 10);
  }, []);

  React.useEffect(() => {
    onChange && onChange(selectedMin, selectedSec);
  }, [selectedMin, selectedSec]);

  // Animated getItemStyle
  const getAnimatedStyle = (index: number, scrollY: Animated.Value, range: number[]) => {
    const inputRange = [
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
    ];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.3, 0.6, 1, 0.6, 0.3],
      extrapolate: 'clamp',
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.25, 0.5, 1, 0.5, 0.25],
      extrapolate: 'clamp',
    });
    return {
      transform: [{ scale }],
      opacity,
      color: '#222',
      fontWeight: 'bold',
      fontSize: 32,
      textAlign: 'center',
      height: ITEM_HEIGHT,
      lineHeight: ITEM_HEIGHT,
      fontFamily: 'Satoshi-Medium',
    } as TextStyle;
  };

  const pickerProps = Platform.OS === 'android' ? { nestedScrollEnabled: true } : {};

  return (
    <View style={timePickerStyles.container}>
      {/* Overlay highlight */}
      <View pointerEvents="none" style={timePickerStyles.centerHighlight} />
      {/* Minutes */}
      <View style={[timePickerStyles.pickerColumn, timePickerStyles.minColumn]}>
        <Animated.ScrollView
          ref={minRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * CENTER_INDEX }}
          onMomentumScrollEnd={e => {
            const offsetY = e.nativeEvent.contentOffset.y;
            const idx = Math.round(offsetY / ITEM_HEIGHT);
            setSelectedMin(minutesRange[idx]);
            (minRef.current as any)?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: minScrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          {...pickerProps}
        >
          {minutesRange.map((item, index) => (
            <Animated.Text key={item} style={getAnimatedStyle(index, minScrollY, minutesRange)}>{item}</Animated.Text>
          ))}
        </Animated.ScrollView>
      </View>
      {/* Label */}
      <Text style={timePickerStyles.label}>{language === 'Chinese' ? '分' : 'min'}</Text>
      {/* Seconds */}
      <View style={[timePickerStyles.pickerColumn, timePickerStyles.secColumn]}>
        <Animated.ScrollView
          ref={secRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * CENTER_INDEX }}
          onMomentumScrollEnd={e => {
            const offsetY = e.nativeEvent.contentOffset.y;
            const idx = Math.round(offsetY / ITEM_HEIGHT);
            setSelectedSec(secondsRange[idx]);
            (secRef.current as any)?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: secScrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          {...pickerProps}
        >
          {secondsRange.map((item, index) => (
            <Animated.Text key={item} style={getAnimatedStyle(index, secScrollY, secondsRange)}>{pad(item)}</Animated.Text>
          ))}
        </Animated.ScrollView>
      </View>
      {/* Label */}
      <Text style={timePickerStyles.label}>{language === 'Chinese' ? '秒' : 'sec'}</Text>
    </View>
  );
};

const timePickerStyles = RNStyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    backgroundColor: 'transparent',
    marginTop: 10
  },
  pickerColumn: {
    width: 60,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  minColumn: {
    marginLeft: 5,
    // borderWidth: 1,
    // borderColor: 'green',
  },
  secColumn: {
    // borderWidth: 1,
    // borderColor: 'blue',
  },
  label: {
    fontSize: 22,
    color: '#222',
    fontWeight: '400',
    marginHorizontal: 0,
    width: 40,
    textAlign: 'center',
    // borderWidth: 1,
    // borderColor: 'red',
    fontFamily: 'Satoshi-Medium',
  },
  centerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * CENTER_INDEX,
    height: ITEM_HEIGHT,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    zIndex: 0,
  },
});

export default function DeckSettingsPage() {
  const router = useRouter();
  const { language, reloadLanguage } = useLanguage();
  
  useFocusEffect(
    React.useCallback(() => {
      reloadLanguage();
    }, [])
  );

  // Load settings from database
  const loadSettings = async () => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        const result = await db.getFirstAsync(`
          SELECT 
            autoDecksEnabled,
            clozeQuestionsEnabled,
            mcqQuestionsEnabled,
            voiceRecordedQuestionsEnabled,
            voiceRecordedTimer,
            halfwayCheckpoint,
            defaultTimer,
            againTimer,
            hardTimer,
            goodTimer,
            easyTimer
          FROM users WHERE userID = ?
        `, [userID]);
        
        if (result) {
          const userData = result as {
            autoDecksEnabled: number;
            clozeQuestionsEnabled: number;
            mcqQuestionsEnabled: number;
            voiceRecordedQuestionsEnabled: number;
            voiceRecordedTimer: number;
            halfwayCheckpoint: number;
            defaultTimer: number;
            againTimer: number;
            hardTimer: number;
            goodTimer: number;
            easyTimer: number;
          };

          // Set boolean values (convert from integer to boolean)
          setAutoDecksEnabled(userData.autoDecksEnabled === 1);
          setClozeQuestionsEnabled(userData.clozeQuestionsEnabled === 1);
          setMcqQuestionsEnabled(userData.mcqQuestionsEnabled === 1);
          setVoiceRecordedAnswersEnabled(userData.voiceRecordedQuestionsEnabled === 1);
          setVoiceRecordedTimerEnabled(userData.voiceRecordedQuestionsEnabled === 1);
          setHalfwayCheckpointEnabled(userData.halfwayCheckpoint === 1);

          // Convert timer values from seconds to {min, sec} format
          const convertSecondsToTime = (seconds: number) => {
            const min = Math.floor(seconds / 60);
            const sec = seconds % 60;
            return { min, sec };
          };

          const loadedDefaultTimer = convertSecondsToTime(userData.defaultTimer);
          const loadedAgainTimer = convertSecondsToTime(userData.againTimer);
          const loadedHardTimer = convertSecondsToTime(userData.hardTimer);
          const loadedGoodTimer = convertSecondsToTime(userData.goodTimer);
          const loadedEasyTimer = convertSecondsToTime(userData.easyTimer);
          const loadedVoiceRecordedTimer = convertSecondsToTime(userData.voiceRecordedTimer);

          setDifficultyTimes([
            loadedDefaultTimer,
            loadedAgainTimer,
            loadedHardTimer,
            loadedGoodTimer,
            loadedEasyTimer,
          ]);
          setVoiceRecordedTimer(loadedVoiceRecordedTimer);
        }
      }
    } catch (error) {
      console.error('Error loading deck settings:', error);
      // Use defaults if loading fails
      setAutoDecksEnabled(true);
      setClozeQuestionsEnabled(true);
      setMcqQuestionsEnabled(true);
      setVoiceRecordedAnswersEnabled(true);
      setVoiceRecordedTimerEnabled(true);
      setHalfwayCheckpointEnabled(true);
      setDifficultyTimes(defaultDifficultyTimes);
    }
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        // Convert timer values from {min, sec} format to seconds
        const convertTimeToSeconds = (time: { min: number; sec: number }) => {
          return time.min * 60 + time.sec;
        };

        await db.runAsync(`
          UPDATE users 
          SET 
            autoDecksEnabled = ?,
            clozeQuestionsEnabled = ?,
            mcqQuestionsEnabled = ?,
            voiceRecordedQuestionsEnabled = ?,
            voiceRecordedTimer = ?,
            halfwayCheckpoint = ?,
            defaultTimer = ?,
            againTimer = ?,
            hardTimer = ?,
            goodTimer = ?,
            easyTimer = ?
          WHERE userID = ?
        `, [
          autoDecksEnabled ? 1 : 0,
          clozeQuestionsEnabled ? 1 : 0,
          mcqQuestionsEnabled ? 1 : 0,
          voiceRecordedAnswersEnabled ? 1 : 0,
          convertTimeToSeconds(voiceRecordedTimer),
          halfwayCheckpointEnabled ? 1 : 0,
          convertTimeToSeconds(difficultyTimes[0]),
          convertTimeToSeconds(difficultyTimes[1]),
          convertTimeToSeconds(difficultyTimes[2]),
          convertTimeToSeconds(difficultyTimes[3]),
          convertTimeToSeconds(difficultyTimes[4]),
          userID
        ]);
        console.log('Deck settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving deck settings:', error);
    }
  };

  // Reset settings to defaults
  const resetToDefaults = async () => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        // Convert default timer values to seconds
        const convertTimeToSeconds = (time: { min: number; sec: number }) => {
          return time.min * 60 + time.sec;
        };

        await db.runAsync(`
          UPDATE users 
          SET 
            autoDecksEnabled = 1,
            clozeQuestionsEnabled = 1,
            mcqQuestionsEnabled = 1,
            voiceRecordedQuestionsEnabled = 1,
            voiceRecordedTimer = ?,
            halfwayCheckpoint = 1,
            defaultTimer = ?,
            againTimer = ?,
            hardTimer = ?,
            goodTimer = ?,
            easyTimer = ?
          WHERE userID = ?
        `, [
          convertTimeToSeconds({ min: 2, sec: 0 }),
          convertTimeToSeconds(defaultDifficultyTimes[0]),
          convertTimeToSeconds(defaultDifficultyTimes[1]),
          convertTimeToSeconds(defaultDifficultyTimes[2]),
          convertTimeToSeconds(defaultDifficultyTimes[3]),
          convertTimeToSeconds(defaultDifficultyTimes[4]),
          userID
        ]);

        // Update local state
        setAutoDecksEnabled(true);
        setClozeQuestionsEnabled(true);
        setMcqQuestionsEnabled(true);
        setVoiceRecordedAnswersEnabled(true);
        setVoiceRecordedTimerEnabled(true);
        setVoiceRecordedTimer({ min: 2, sec: 0 });
        setHalfwayCheckpointEnabled(true);
        setDifficultyTimes(defaultDifficultyTimes);
        setResetCounter(c => c + 1);
        
        console.log('Deck settings reset to defaults');
      }
    } catch (error) {
      console.error('Error resetting deck settings:', error);
    }
  };

  const [autoDecksEnabled, setAutoDecksEnabled] = React.useState(true);
  const [clozeQuestionsEnabled, setClozeQuestionsEnabled] = React.useState(true);
  const [mcqQuestionsEnabled, setMcqQuestionsEnabled] = React.useState(true);
  const [voiceRecordedAnswersEnabled, setVoiceRecordedAnswersEnabled] = React.useState(true);
  const [voiceRecordedTimerEnabled, setVoiceRecordedTimerEnabled] = React.useState(true);
  const [voiceRecordedTimer, setVoiceRecordedTimer] = React.useState({ min: 2, sec: 0 });
  const [halfwayCheckpointEnabled, setHalfwayCheckpointEnabled] = React.useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [selectedDifficultyIndex, setSelectedDifficultyIndex] = React.useState(0);
  const defaultDifficultyTimes = [
    { min: 0, sec: 20 },
    { min: 1, sec: 0 },
    { min: 0, sec: 45 },
    { min: 0, sec: 30 },
    { min: 0, sec: 15 },
  ];
  const [difficultyTimes, setDifficultyTimes] = React.useState(defaultDifficultyTimes);
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const [pickerOpacity] = React.useState(new Animated.Value(1));
  const [resetCounter, setResetCounter] = React.useState(0);
  const insets = useSafeAreaInsets();


  // Load settings when component mounts
  React.useEffect(() => {
    loadSettings();
  }, []);

  // Save settings whenever any setting changes
  React.useEffect(() => {
    saveSettings();
  }, [
    autoDecksEnabled,
    clozeQuestionsEnabled,
    mcqQuestionsEnabled,
    voiceRecordedAnswersEnabled,
    voiceRecordedTimerEnabled,
    voiceRecordedTimer,
    halfwayCheckpointEnabled,
    difficultyTimes,
  ]);

  // When difficulty changes, update picker values
  const pickerMinutes = difficultyTimes[selectedDifficultyIndex].min;
  const pickerSeconds = difficultyTimes[selectedDifficultyIndex].sec;

  const handleTimeChange = (min: number, sec: number) => {
    setDifficultyTimes(prev => {
      const updated = [...prev];
      updated[selectedDifficultyIndex] = { min, sec };
      return updated;
    });
  };

  const handleVoiceRecordedTimerChange = (min: number, sec: number) => {
    setVoiceRecordedTimer({ min, sec });
  };

  const handleDifficultyChange = (idx: number) => {
    Animated.timing(pickerOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedDifficultyIndex(idx);
      Animated.timing(pickerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleHelpPress = () => {
    setIsHelpModalOpen(true);
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

  React.useEffect(() => {
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
          marginLeft: language === 'Chinese' ? 0 : 16,
          marginBottom: language === 'Chinese' ? Platform.OS === 'ios' ? 0 : 5 : Platform.OS === 'ios' ? 5 : 10, 
          }]}>{language === 'Chinese' ? '卡片组设置' : 'Deck Settings'}</Text>
      </View>
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <TitleToggleRow 
            text={language === 'Chinese' ? '自动创建卡片组' : 'Auto-decks'}
            value={autoDecksEnabled}
            onValueChange={setAutoDecksEnabled}
          />
          <Text style={styles.descriptionText}>
            {language === 'Chinese' ? '开启此功能后，系统将根据您最近创建和复习的卡片组自动生成新卡片组。' : 'Turning this on will allow decks to be auto-generated based on your most recent decks created and reviewed.'}
          </Text>
          <Text style={styles.sectionTitle}>{language === 'Chinese' ? '闪卡设置' : 'Flashcard settings'}</Text>
          <TitleToggleRow 
            text={language === 'Chinese' ? '填空题' : 'Cloze Questions'}
            value={clozeQuestionsEnabled}
            onValueChange={setClozeQuestionsEnabled}
          />
          <Text style={styles.descriptionText}>
            {language === 'Chinese' ? '启用后，系统将以填空题形式生成并显示问题，主要适用于回忆类问题。' : 'Enabling this will allow questions to be generated and displayed in cloze format to you. This applies mainly to recall-based questions.'}
          </Text>
          <TitleToggleRow 
            text={language === 'Chinese' ? '选择题' : 'MCQ Questions'}
            value={mcqQuestionsEnabled}
            onValueChange={setMcqQuestionsEnabled}
          />
          <Text style={styles.descriptionText}>
            {language === 'Chinese' ? '启用后，系统将以选择题格式生成并显示答案，主要适用于以下题型：' : 'Enabling this will allow answers to be generated and displayed in a MCQ format to you. This applies mainly to the following question types:'}
          </Text>
          <ListParagraph 
            listItems={language === 'Chinese' ? [
              '回忆类问题 (Recall questions)',
              '理解类问题 (Comprehension questions)',
              '分析类问题 (Analysis questions)',
            ] : [
              'Recall-based questions',
              'Comprehension-based questions', 
              'Analysis-based questions',
            ]}
            onHelpPress={handleHelpPress}
          />
          <TitleToggleRow 
            text={language === 'Chinese' ? '语音回答' : 'Voice-Recorded Answers'}
            value={voiceRecordedAnswersEnabled}
            onValueChange={setVoiceRecordedAnswersEnabled}
          />
          <Text style={styles.descriptionText}>
            {language === 'Chinese' ? '启用此功能后，您可以通过录音回答问题并获得AI反馈。此功能适用于行为面试（Behavioral Interviews）和案例面试（Case Interviews）的准备，或以下题型的练习：' : 'With this enabled, you can record your answers and get feedback by AI. This applies if you are preparing for Behavioral Interviews and Case Interviews or if you are preparing for these question types:'}
          </Text>
          <ListParagraph 
            listItems={language === 'Chinese' ? [
              '应用类问题 (Application questions)',
              '综合类问题 (Synthesis questions)',
              '评估类问题 (Evaluation questions)',
              '解决问题类问题 (Problem-Solving)',
            ] : [
              'Application-based questions',
              'Synthesis-based questions', 
              'Evaluation-based questions',
              'Problem-Solving questions',
            ]}
            onHelpPress={handleHelpPress}
          />
          <View style={styles.titleToggleRow}>
            <Text style={styles.titleToggleText}>{language === 'Chinese' ? '语音录制计时器' : 'Voice Recording Timer'}</Text>
          </View>
          <Text style={[styles.descriptionText, {marginBottom: 0}]}> 
            {language === 'Chinese' ? '设置答题时语音录制的时间限制。' : 'Set the time limit for voice recording answers in quiz mode.'}
          </Text>
          <TimePicker
            key={`voice-recorded-timer-${resetCounter}`}
            initialMinutes={voiceRecordedTimer.min}
            initialSeconds={voiceRecordedTimer.sec}
            onChange={handleVoiceRecordedTimerChange}
            minutesRange={Array.from({ length: 10 }, (_, i) => i)}
            secondsRange={Array.from({ length: 60 }, (_, i) => i)}
            language={language}
          />
          <Text style={styles.sectionTitle}>{language === 'Chinese' ? '测验偏好' : 'Quiz Preferences'}</Text>
          <TitleToggleRow 
            text={language === 'Chinese' ? '中途检查点' : 'Halfway Checkpoint'}
            value={halfwayCheckpointEnabled}
            onValueChange={setHalfwayCheckpointEnabled}
          />
          <Text style={styles.descriptionText}>
            {language === 'Chinese' ? '开启此功能后，您将在答题中途看到当前测验表现的统计数据。' : 'Turning this on will let you see current statistics of your quiz performance halfway through the quiz.'}
          </Text>
          <View style={styles.titleToggleRow}>
            <Text style={styles.titleToggleText}>{language === 'Chinese' ? '各难度级别的计时设置' : 'Timer Settings for Respective Difficulty'}</Text>
          </View>
          <View style={{marginTop: 10}}>
            <DifficultyToggleRow
              onToggle={handleDifficultyChange}
              initialIndex={selectedDifficultyIndex}
              language={language}
            />
          </View>
          <Animated.View style={{ opacity: pickerOpacity }}>
            <TimePicker
              key={`${selectedDifficultyIndex}-${resetCounter}`}
              initialMinutes={pickerMinutes}
              initialSeconds={pickerSeconds}
              onChange={handleTimeChange}
              language={language}
            />
          </Animated.View>
        </ScrollView>
      </View>
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          height: 72,
          backgroundColor: '#FF3B30',
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        activeOpacity={0.85}
        onPress={resetToDefaults}
      >
        <Text
          style={{
            color: '#fff',
            // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium',
            fontSize: 24,
          }}
        >
          {language === 'Chinese' ? '恢复默认设置？' : 'Back to default settings?'}
        </Text>
      </TouchableOpacity>
      <GreyOverlayBackground 
        visible={isHelpModalOpen}
        opacity={overlayOpacity}
        onPress={handleDismissHelp}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={language === 'Chinese' ? '我们的团队基于布鲁姆分类法，确定了7种主要认知题型，助力高效学习。了解更多内容，请访问我们的官网。' : "Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more."}
        buttons='none'
        textStyle={{
          highlightWord: language === 'Chinese' ? '官网' : 'our website',
          highlightColor: "#44B88A"
        }}
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    marginBottom: 110,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
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
  descriptionText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#000',
    textAlign: 'left',
    marginTop: 10,
    // borderWidth: 1,
    // borderColor: 'red',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Neuton-Regular',
    fontSize: 32,
    color: '#4F41D8',
    marginVertical: 20,
    lineHeight: 36,
  },
  subsectionText: {
    fontFamily: 'Satoshi-Variable',
    fontSize: 16,
    color: '#000',
    textAlign: 'left',
    marginTop: 10,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  listParagraphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    // borderWidth: 1,
    // borderColor: 'blue',
    marginBottom: 10,
  },
  listColumn: {
    flex: 10,
    paddingLeft: 20,
    // borderWidth: 1,
    // borderColor: 'green',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bulletPoint: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  listText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  iconColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,    
    // borderColor: 'red',
    alignSelf: 'stretch',
  },
}); 