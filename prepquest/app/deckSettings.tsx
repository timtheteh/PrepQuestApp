import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Switch, Animated, FlatList, NativeSyntheticEvent, NativeScrollEvent, TextStyle, ScrollView as RNScrollView , StyleSheet as RNStyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import HelpIconFilled from '@/assets/icons/generalIcons/helpIconFilled.svg';
import HelpIconFilledDarkMode from '@/assets/icons/generalIcons/helpIconFilledDarkMode.svg';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { GenericModal } from '@/components/modals/GenericModal';
import { DifficultyToggleRow } from '@/components/general/DifficultyToggleRow';
import { loadDeckSettings, saveDeckSettings, resetDeckSettingsToDefaults, DeckSettings } from '@/db/decks';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarAccountHeight } from '@/hooks/heights';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { BackgroundTaskNotification } from '@/components/inAppNotifications/BackgroundTaskNotification';
import ModalExclamationMarkIcon from '@/assets/icons/generalIcons/modalExclamationMarkIcon.svg';

// Local component for title and toggle row
const TitleToggleRow = React.memo(({ text, value, onValueChange, styles }: { text: string; value: boolean; onValueChange: (value: boolean) => void; styles: any }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const unselectedText = Colors[theme].unselectedText;
  const brandColor1 = Colors[theme].brandColor1;
  
  return (
    <View style={styles.titleToggleRow}>
      <Text style={styles.titleToggleText}>{text}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme === 'dark' ? colors.disabledIconBackgroundColor : colors.unselectedText, true: colors.brandColor1 }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor={theme === 'dark' ? colors.disabledIconBackgroundColor : colors.unselectedText}
    />
    </View>
  );
});

// Local component for list paragraph with help icon
const ListParagraph = React.memo(({ listItems, onHelpPress, styles }: { listItems: string[]; onHelpPress: () => void; styles: any }) => {
  const { theme } = useTheme();
  
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
          {theme === 'dark' ? (
            <HelpIconFilledDarkMode width={30} height={30} />
          ) : (
            <HelpIconFilled width={30} height={30} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Local TimePicker component
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2);

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

// Default ranges as constants to prevent recreation
const DEFAULT_MINUTES_RANGE = Array.from({ length: 3 }, (_, i) => i);
const DEFAULT_SECONDS_RANGE = Array.from({ length: 60 }, (_, i) => i);

const TimePicker = ({
  initialMinutes = 0,
  initialSeconds = 0,
  onChange,
  minutesRange = DEFAULT_MINUTES_RANGE,
  secondsRange = DEFAULT_SECONDS_RANGE,
  language = 'English',
  theme = 'light',
}: {
  initialMinutes?: number;
  initialSeconds?: number;
  onChange?: (min: number, sec: number) => void;
  minutesRange?: number[];
  secondsRange?: number[];
  language?: string;
  theme?: 'light' | 'dark';
}) => {
  const [selectedMin, setSelectedMin] = React.useState<number>(initialMinutes);
  const [selectedSec, setSelectedSec] = React.useState<number>(initialSeconds);
  const minRef = React.useRef(null);
  const secRef = React.useRef(null);
  const minScrollY = React.useRef(new Animated.Value((minutesRange.indexOf(initialMinutes)) * ITEM_HEIGHT)).current;
  const secScrollY = React.useRef(new Animated.Value((secondsRange.indexOf(initialSeconds)) * ITEM_HEIGHT)).current;

  // Initialize on mount
  React.useEffect(() => {
    const minY = (minutesRange.indexOf(initialMinutes)) * ITEM_HEIGHT;
    const secY = (secondsRange.indexOf(initialSeconds)) * ITEM_HEIGHT;
    // Use requestAnimationFrame for smoother initialization
    requestAnimationFrame(() => {
      (minRef.current as any)?.scrollTo({ y: minY, animated: false });
      (secRef.current as any)?.scrollTo({ y: secY, animated: false });
      minScrollY.setValue(minY);
      secScrollY.setValue(secY);
      setSelectedMin(initialMinutes);
      setSelectedSec(initialSeconds);
    });
  }, []);

  // Track previous values to detect changes
  const prevInitialMinutes = React.useRef(initialMinutes);
  const prevInitialSeconds = React.useRef(initialSeconds);

  // Update when initialMinutes or initialSeconds change (for difficulty switching)
  React.useEffect(() => {
    // Only update if values actually changed
    if (prevInitialMinutes.current !== initialMinutes || prevInitialSeconds.current !== initialSeconds) {
      const minIndex = minutesRange.indexOf(initialMinutes);
      const secIndex = secondsRange.indexOf(initialSeconds);
      
      if (minIndex !== -1 && secIndex !== -1) {
        const minY = minIndex * ITEM_HEIGHT;
        const secY = secIndex * ITEM_HEIGHT;
        
        // Smooth scroll to new values when props change
        (minRef.current as any)?.scrollTo({ y: minY, animated: true });
        (secRef.current as any)?.scrollTo({ y: secY, animated: true });
        
        // Update selected values immediately for responsive feel
        setSelectedMin(initialMinutes);
        setSelectedSec(initialSeconds);
        
        // Update refs
        prevInitialMinutes.current = initialMinutes;
        prevInitialSeconds.current = initialSeconds;
      }
    }
  }, [initialMinutes, initialSeconds, minutesRange, secondsRange]);

  React.useEffect(() => {
    onChange && onChange(selectedMin, selectedSec);
  }, [selectedMin, selectedSec]);

  // Animated getItemStyle - memoized to prevent recreation
  const getAnimatedStyle = React.useCallback((index: number, scrollY: Animated.Value, range: number[]) => {
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
      color: Colors[theme].text,
      fontWeight: 'bold',
      fontSize: 32,
      textAlign: 'center',
      height: ITEM_HEIGHT,
      lineHeight: ITEM_HEIGHT,
      fontFamily: Fonts.bodyMedium,
    } as TextStyle;
  }, []);

  const pickerProps = Platform.OS === 'android' ? { nestedScrollEnabled: true } : {};
  const timePickerStyles = createTimePickerStyles(theme);

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
      <Text style={timePickerStyles.label}>{strings[language].deckSettingsPage.timePicker.min}</Text>
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
      <Text style={timePickerStyles.label}>{strings[language].deckSettingsPage.timePicker.sec}</Text>
    </View>
  );
};

const createTimePickerStyles = (theme: 'light' | 'dark') => RNStyleSheet.create({
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
    color: Colors[theme].text,
    fontWeight: '400',
    marginHorizontal: 0,
    width: 40,
    textAlign: 'center',
    // borderWidth: 1,
    // borderColor: 'red',
    fontFamily: Fonts.bodyMedium,
  },
  centerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * CENTER_INDEX,
    height: ITEM_HEIGHT,
    backgroundColor: Colors[theme].secondaryShade,
    borderRadius: 8,
    zIndex: 0,
  },
});

export default function DeckSettingsPage() {
  const router = useRouter();
  const { language, reloadLanguage } = useLanguage();
  const getTopBarAccountHeight = useTopBarAccountHeight();
  const { theme } = useTheme();
  const text = Colors[theme].text;
  const background = Colors[theme].background;
  const brandColor2 = Colors[theme].brandColor2;
  const alertColor = Colors[theme].alertColor;
  const savedSettingsKeyRef = React.useRef<string>('');
  
  useFocusEffect(
    React.useCallback(() => {
      reloadLanguage();
    }, [])
  );

  // Load settings from database
  const loadSettings = React.useCallback(async () => {
    try {
      const settings = await loadDeckSettings();
      
      // Set boolean values
      setAutoDecksEnabled(settings.autoDecksEnabled);
      setClozeQuestionsEnabled(settings.clozeQuestionsEnabled);
      setMcqQuestionsEnabled(settings.mcqQuestionsEnabled);
      setVoiceRecordedAnswersEnabled(settings.voiceRecordedAnswersEnabled);
      setVoiceRecordedTimerEnabled(settings.voiceRecordedTimerEnabled);
      setHalfwayCheckpointEnabled(settings.halfwayCheckpointEnabled);
      setDifficultyTimes(settings.difficultyTimes);
      setVoiceRecordedTimer(settings.voiceRecordedTimer);
      setVoiceRecordedTimerNoLimit(settings.voiceRecordedTimerNoLimit);
      savedSettingsKeyRef.current = JSON.stringify(settings);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading deck settings:', error);
      // Use defaults if loading fails
      const fallbackSettings: DeckSettings = {
        autoDecksEnabled: true,
        clozeQuestionsEnabled: true,
        mcqQuestionsEnabled: true,
        voiceRecordedAnswersEnabled: true,
        voiceRecordedTimerEnabled: true,
        voiceRecordedTimer: { min: 2, sec: 0 },
        voiceRecordedTimerNoLimit: false,
        halfwayCheckpointEnabled: true,
        difficultyTimes: defaultDifficultyTimes,
      };
      setAutoDecksEnabled(fallbackSettings.autoDecksEnabled);
      setClozeQuestionsEnabled(fallbackSettings.clozeQuestionsEnabled);
      setMcqQuestionsEnabled(fallbackSettings.mcqQuestionsEnabled);
      setVoiceRecordedAnswersEnabled(fallbackSettings.voiceRecordedAnswersEnabled);
      setVoiceRecordedTimerEnabled(fallbackSettings.voiceRecordedTimerEnabled);
      setHalfwayCheckpointEnabled(fallbackSettings.halfwayCheckpointEnabled);
      setDifficultyTimes(fallbackSettings.difficultyTimes);
      setVoiceRecordedTimer(fallbackSettings.voiceRecordedTimer);
      setVoiceRecordedTimerNoLimit(fallbackSettings.voiceRecordedTimerNoLimit);
      savedSettingsKeyRef.current = JSON.stringify(fallbackSettings);
      setHasUnsavedChanges(false);
    }
  }, []);


  // Reset settings to defaults
  const resetToDefaults = async () => {
    try {
      const success = await resetDeckSettingsToDefaults();
      
      if (success) {
        // Update local state
        setAutoDecksEnabled(true);
        setClozeQuestionsEnabled(true);
        setMcqQuestionsEnabled(true);
        setVoiceRecordedAnswersEnabled(true);
        setVoiceRecordedTimerEnabled(true);
        setVoiceRecordedTimer({ min: 2, sec: 0 });
        setVoiceRecordedTimerNoLimit(false);
        setHalfwayCheckpointEnabled(true);
        setDifficultyTimes(defaultDifficultyTimes);
        setResetCounter(c => c + 1);
        const defaultSettings: DeckSettings = {
          autoDecksEnabled: true,
          clozeQuestionsEnabled: true,
          mcqQuestionsEnabled: true,
          voiceRecordedAnswersEnabled: true,
          voiceRecordedTimerEnabled: true,
          voiceRecordedTimer: { min: 2, sec: 0 },
          voiceRecordedTimerNoLimit: false,
          halfwayCheckpointEnabled: true,
          difficultyTimes: defaultDifficultyTimes,
        };
        savedSettingsKeyRef.current = JSON.stringify(defaultSettings);
        setHasUnsavedChanges(false);
        hasSavedRef.current = true;
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
const [voiceRecordedTimerNoLimit, setVoiceRecordedTimerNoLimit] = React.useState(false);
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
  const successOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const successModalOpacity = React.useRef(new Animated.Value(0)).current;
  const backOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const backModalOpacity = React.useRef(new Animated.Value(0)).current;
  const [pickerOpacity] = React.useState(new Animated.Value(1));
  const [resetCounter, setResetCounter] = React.useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
  const [isBackModalOpen, setIsBackModalOpen] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const hasSavedRef = React.useRef(false);
  const insets = useSafeAreaInsets();


  // Load settings when component mounts
  React.useEffect(() => {
    loadSettings();
    hasSavedRef.current = false;
  }, []);

  // Reload settings when page comes into focus if user didn't save
  useFocusEffect(
    React.useCallback(() => {
      if (!hasSavedRef.current) {
        loadSettings();
      }
      hasSavedRef.current = false;
    }, [loadSettings])
  );

  // Save settings to database
  const saveSettings = React.useCallback(async (): Promise<boolean> => {
    try {
      const settings: DeckSettings = {
        autoDecksEnabled,
        clozeQuestionsEnabled,
        mcqQuestionsEnabled,
        voiceRecordedAnswersEnabled,
        voiceRecordedTimerEnabled,
        voiceRecordedTimer,
        voiceRecordedTimerNoLimit,
        halfwayCheckpointEnabled,
        difficultyTimes,
      };
      
      await saveDeckSettings(settings);
      savedSettingsKeyRef.current = JSON.stringify(settings);
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving deck settings:', error);
      return false;
    }
  }, [
    autoDecksEnabled,
    clozeQuestionsEnabled,
    mcqQuestionsEnabled,
    voiceRecordedAnswersEnabled,
    voiceRecordedTimerEnabled,
    voiceRecordedTimer,
    voiceRecordedTimerNoLimit,
    halfwayCheckpointEnabled,
    difficultyTimes,
  ]);

  // Handle save button press
  const handleSave = React.useCallback(async () => {
    const success = await saveSettings();
    if (success) {
      hasSavedRef.current = true;
      // Show success modal
      setIsSuccessModalOpen(true);
      Animated.parallel([
        Animated.timing(successOverlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [saveSettings, successOverlayOpacity, successModalOpacity]);

  // Handle dismiss success modal
  const handleDismissSuccessModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(successOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSuccessModalOpen(false);
    });
  }, [successOverlayOpacity, successModalOpacity]);

  // When difficulty changes, update picker values - memoized to prevent recalculation
  const pickerMinutes = React.useMemo(() => difficultyTimes[selectedDifficultyIndex].min, [difficultyTimes, selectedDifficultyIndex]);
  const pickerSeconds = React.useMemo(() => difficultyTimes[selectedDifficultyIndex].sec, [difficultyTimes, selectedDifficultyIndex]);

  const handleTimeChange = React.useCallback((min: number, sec: number) => {
    setDifficultyTimes(prev => {
      const updated = [...prev];
      updated[selectedDifficultyIndex] = { min, sec };
      return updated;
    });
  }, [selectedDifficultyIndex]);

  const handleVoiceRecordedTimerChange = React.useCallback((min: number, sec: number) => {
    setVoiceRecordedTimer({ min, sec });
  }, []);

  const handleVoiceRecordedTimerNoLimitToggle = React.useCallback(() => {
    setVoiceRecordedTimerNoLimit((prev) => !prev);
  }, []);

  const handleDifficultyChange = React.useCallback((idx: number) => {
    // Update immediately without animation for responsive feel
    setSelectedDifficultyIndex(idx);
  }, []);

  const handleBackPress = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setIsBackModalOpen(true);
    } else {
      if (!hasSavedRef.current) {
        loadSettings();
      }
      router.back();
    }
  }, [hasUnsavedChanges, loadSettings, router]);

  const handleDismissBackModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(backOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackModalOpen(false);
    });
  }, [backOverlayOpacity, backModalOpacity]);

  const handleConfirmBackWithoutSaving = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(backOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackModalOpen(false);
      loadSettings();
      router.back();
    });
  }, [backOverlayOpacity, backModalOpacity, loadSettings, router]);

  const handleHelpPress = React.useCallback(() => {
    setIsHelpModalOpen(true);
  }, []);

  const handleDismissHelp = React.useCallback(() => {
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
  }, [overlayOpacity, modalOpacity]);

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

  React.useEffect(() => {
    if (isBackModalOpen) {
      Animated.parallel([
        Animated.timing(backOverlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isBackModalOpen, backOverlayOpacity, backModalOpacity]);

  const currentSettings = React.useMemo<DeckSettings>(() => ({
    autoDecksEnabled,
    clozeQuestionsEnabled,
    mcqQuestionsEnabled,
    voiceRecordedAnswersEnabled,
    voiceRecordedTimerEnabled,
    voiceRecordedTimer,
    voiceRecordedTimerNoLimit,
    halfwayCheckpointEnabled,
    difficultyTimes,
  }), [
    autoDecksEnabled,
    clozeQuestionsEnabled,
    mcqQuestionsEnabled,
    voiceRecordedAnswersEnabled,
    voiceRecordedTimerEnabled,
    voiceRecordedTimer,
    voiceRecordedTimerNoLimit,
    halfwayCheckpointEnabled,
    difficultyTimes,
  ]);

  const currentSettingsKey = React.useMemo(() => JSON.stringify(currentSettings), [currentSettings]);

  React.useEffect(() => {
    if (savedSettingsKeyRef.current) {
      setHasUnsavedChanges(currentSettingsKey !== savedSettingsKeyRef.current);
    }
  }, [currentSettingsKey]);

  // Create dynamic styles based on theme
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // Memoize style objects to prevent recreation
  const containerStyle = React.useMemo(() => ({ flex: 1, position: 'relative' as const, backgroundColor: background }), [background]);
  const topBarStyle = React.useMemo(() => [styles.topBar, { paddingTop: getTopBarAccountHeight() }], [getTopBarAccountHeight, styles.topBar]);
  const titleStyle = React.useMemo(() => [
    styles.title, 
    { 
      color: text,
      marginLeft: language === 'Chinese' ? 0 : 16,
      marginBottom: language === 'Chinese' ? Platform.OS === 'ios' ? 0 : 5 : Platform.OS === 'ios' ? 5 : 10, 
    }
  ], [text, language, styles.title]);
  const mainContainerStyle = React.useMemo(() => [styles.mainContainer, { backgroundColor: background }], [background, styles.mainContainer]);
  
  // Calculate bottom spacing for Android devices with system navigation bar
  const bottomSpacing = React.useMemo(() => {
    if (Platform.OS === 'android') {
      // Add extra spacing for Android devices with system navigation bar
      return insets.bottom > 0 ? insets.bottom + 16 : 16;
    }
    return 24;
  }, [insets.bottom]);

  return (
      <View style={containerStyle}>
        <View style={topBarStyle}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color={text} />
        </TouchableOpacity>
        <Text style={titleStyle}>{strings[language].deckSettingsPage.title}</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: brandColor2 }]}>
            {strings[language].deckSettingsPage.save}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={mainContainerStyle}>
        <ScrollView 
          style={[styles.scrollView, { marginBottom: bottomSpacing + 78 }]}
          contentContainerStyle={[styles.scrollContent]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <TitleToggleRow 
            text={strings[language].deckSettingsPage.autoDecks}
            value={autoDecksEnabled}
            onValueChange={setAutoDecksEnabled}
            styles={styles}
          />
          <Text style={[styles.descriptionText, { color: text }]}>
            {strings[language].deckSettingsPage.autoDecksDescription}
          </Text>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? text : brandColor2 }]}>{strings[language].deckSettingsPage.flashcardSettings}</Text>
          <TitleToggleRow 
            text={strings[language].deckSettingsPage.clozeQuestions}
            value={clozeQuestionsEnabled}
            onValueChange={setClozeQuestionsEnabled}
            styles={styles}
          />
          <Text style={[styles.descriptionText, { color: text }]}>
            {strings[language].deckSettingsPage.clozeQuestionsDescription}
          </Text>
          <TitleToggleRow 
            text={strings[language].deckSettingsPage.mcqQuestions}
            value={mcqQuestionsEnabled}
            onValueChange={setMcqQuestionsEnabled}
            styles={styles}
          />
          <Text style={[styles.descriptionText, { color: text }]}>
            {strings[language].deckSettingsPage.mcqQuestionsDescription}
          </Text>
          <ListParagraph 
            listItems={strings[language].deckSettingsPage.mcqQuestionTypes}
            onHelpPress={handleHelpPress}
            styles={styles}
          />
          <TitleToggleRow 
            text={strings[language].deckSettingsPage.voiceRecordedAnswers}
            value={voiceRecordedAnswersEnabled}
            onValueChange={setVoiceRecordedAnswersEnabled}
            styles={styles}
          />
          <Text style={[styles.descriptionText, { color: text }]}>
            {strings[language].deckSettingsPage.voiceRecordedAnswersDescription}
          </Text>
          <ListParagraph 
            listItems={strings[language].deckSettingsPage.voiceRecordedQuestionTypes}
            onHelpPress={handleHelpPress}
            styles={styles}
          />
          <View style={styles.titleToggleRow}>
            <Text style={[styles.titleToggleText, { color: text }]}>{strings[language].deckSettingsPage.voiceRecordingTimer}</Text>
          </View>
          <Text style={[styles.descriptionText, { color: text, marginBottom: 0 }]}> 
            {strings[language].deckSettingsPage.voiceRecordingTimerDescription}
          </Text>
          <TouchableOpacity
            style={styles.voiceNoLimitRow}
            activeOpacity={0.7}
            onPress={handleVoiceRecordedTimerNoLimitToggle}
          >
            <Text
              style={[
                styles.voiceNoLimitText,
                { color: text },
              ]}
            >
              {strings[language].deckSettingsPage.noTimeLimit}
            </Text>
            <MaterialIcons
              name={voiceRecordedTimerNoLimit ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={
                voiceRecordedTimerNoLimit
                  ? Colors[theme].brandColor2
                  : Colors[theme].unselectedText
              }
            />
          </TouchableOpacity>
          {!voiceRecordedTimerNoLimit && (
            <TimePicker
              key={`voice-recorded-timer-${resetCounter}`}
              initialMinutes={voiceRecordedTimer.min}
              initialSeconds={voiceRecordedTimer.sec}
              onChange={handleVoiceRecordedTimerChange}
              minutesRange={Array.from({ length: 10 }, (_, i) => i)}
              secondsRange={Array.from({ length: 60 }, (_, i) => i)}
              language={language}
              theme={theme}
            />
          )}
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? text : brandColor2 }]}>{strings[language].deckSettingsPage.quizPreferences}</Text>
          <TitleToggleRow 
            text={strings[language].deckSettingsPage.halfwayCheckpoint}
            value={halfwayCheckpointEnabled}
            onValueChange={setHalfwayCheckpointEnabled}
            styles={styles}
          />
          <Text style={[styles.descriptionText, { color: text }]}>
            {strings[language].deckSettingsPage.halfwayCheckpointDescription}
          </Text>
          <View style={styles.titleToggleRow}>
            <Text style={[styles.titleToggleText, { color: text }]}>{strings[language].deckSettingsPage.timerSettingsForDifficulty}</Text>
          </View>
          <View style={{marginTop: 10}}>
            <DifficultyToggleRow
              onToggle={handleDifficultyChange}
              initialIndex={selectedDifficultyIndex}
              language={language}
            />
          </View>
          <TimePicker
            key={resetCounter}
            initialMinutes={pickerMinutes}
            initialSeconds={pickerSeconds}
            onChange={handleTimeChange}
            language={language}
            theme={theme}
          />
        </ScrollView>
      </View>
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: bottomSpacing,
          height: 60,
          backgroundColor: alertColor,
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
            color: Colors[theme].background,
            fontFamily: Fonts.bodyMedium,
            fontSize: 24,
          }}
        >
          {strings[language].deckSettingsPage.backToDefaultSettings}
        </Text>
      </TouchableOpacity>
      <GreyOverlayBackground 
        visible={isBackModalOpen}
        opacity={backOverlayOpacity}
        onPress={handleDismissBackModal}
      />
      <GenericModal
        visible={isBackModalOpen}
        opacity={backModalOpacity}
        text={strings[language].deckSettingsPage.goBackWithoutSaving}
        buttons="double"
        Icon={ModalExclamationMarkIcon}
        onCancel={handleDismissBackModal}
        onConfirm={handleConfirmBackWithoutSaving}
      />
      <GreyOverlayBackground 
        visible={isHelpModalOpen}
        opacity={overlayOpacity}
        onPress={handleDismissHelp}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={strings[language].deckSettingsPage.helpModalText}
        buttons='none'
        textStyle={{
          highlightWord: strings[language].deckSettingsPage.helpModalWebsite,
          highlightColor: Colors[theme].brandColor2
        }}
        Icon={theme === 'dark' ? HelpIconFilledDarkMode : HelpIconFilled}
      />
      <GreyOverlayBackground 
        visible={isSuccessModalOpen}
        opacity={successOverlayOpacity}
        onPress={handleDismissSuccessModal}
      />
      <GenericModal
        visible={isSuccessModalOpen}
        opacity={successModalOpacity}
        text={strings[language].deckSettingsPage.deckSettingsSaved}
        hasAnimation={true}
        animationSource={require('@/assets/animations/SuccessAnimation1_Tick.json')}
        animationLoop={true}
        contentMarginTop={20}
        lottieMarginTop={40}
      />

      {/* In-app notifications */}
      <BackgroundTaskNotification />
    </View>
  );
}

const createStyles = (theme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[theme].background,
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
  saveButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  saveButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 18,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 32,
    color: Colors[theme].text,
    marginLeft: 16,
    marginBottom: Platform.OS === 'ios' ? 5 : 10,
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 36,
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors[theme].background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  titleToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleToggleText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors[theme].text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors[theme].text,
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors[theme].text,
    textAlign: 'left',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.title,
    fontSize: 32,
    color: Colors[theme].brandColor2,
    marginVertical: 20,
    lineHeight: 36,
  },
  subsectionText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors[theme].text,
    textAlign: 'left',
    marginTop: 10,
  },
  listParagraphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  listColumn: {
    flex: 10,
    paddingLeft: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bulletPoint: {
    fontFamily: Fonts.bodyItalicLight,
    fontSize: 16,
    color: Colors[theme].text,
    marginRight: 8,
  },
  listText: {
    fontFamily: Fonts.bodyItalicLight,
    fontSize: 16,
    color: Colors[theme].text,
    flex: 1,
  },
  iconColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  voiceNoLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  voiceNoLimitText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
  },
}); 