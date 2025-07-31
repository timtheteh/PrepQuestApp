import { Animated, Dimensions, View, StyleSheet, Text, ScrollView, TouchableOpacity, Platform, Image as RNImage, ImageSourcePropType , PanResponder } from 'react-native';
import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Path, Defs, ClipPath, Polygon , Image as SvgImage } from 'react-native-svg';
import { MenuContext } from '@/contexts/MenuContext';
import FireIcon from '@/assets/icons/statsIcons/FireIcon.svg';
import DecksStudiedIcon from '@/assets/icons/statsIcons/DecksStudiedIcon.svg';
import FlashcardsStudiedIcon from '@/assets/icons/statsIcons/FlashcardsStudiedIcon.svg';
import { Calendar } from 'react-native-calendars';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { getLongestStreakData, LongestStreakData, getAllStudiedDates } from '@/db/grades';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTopBarStatisticsHeight } from '@/hooks/heights';
const LargeMeshBackground1 = require('@/assets/awardsBackgrounds/LargeMeshBackground1.png');
const LargeMeshBackground2 = require('@/assets/awardsBackgrounds/LargeMeshBackground2.png');
const LargeMeshBackground3 = require('@/assets/awardsBackgrounds/LargeMeshBackground3.png');
const LargeMeshBackground4 = require('@/assets/awardsBackgrounds/LargeMeshBackground4.png');

const CELL_HEIGHT = 90; // or any value you prefer
const ICON_SIZE = 70;   // make icons larger to match cell size

const NumberPicker = ({ value, setValue, min, max, themeColors }: { value: number, setValue: (v: number) => void, min: number, max: number, themeColors: any }) => {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const ITEM_WIDTH = 40;
  const scrollRef = React.useRef<ScrollView>(null);
  const [scrolling, setScrolling] = React.useState(false);
  const scrollX = React.useRef(new Animated.Value((value - min) * ITEM_WIDTH)).current;

  // Scroll to selected value on mount or value change
  React.useEffect(() => {
    if (scrollRef.current && !scrolling) {
      scrollRef.current.scrollTo({ x: (value - min) * ITEM_WIDTH, animated: false });
      scrollX.setValue((value - min) * ITEM_WIDTH);
    }
  }, [value, min, scrolling]);

  // Live update selected value as user scrolls
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: any) => {
        setScrolling(true);
        const x = e.nativeEvent.contentOffset.x;
        const idx = Math.round(x / ITEM_WIDTH);
        if (numbers[idx] !== value) setValue(numbers[idx]);
      },
    }
  );

  // When scroll ends, ensure value is snapped
  const handleMomentumScrollEnd = (e: any) => {
    setScrolling(false);
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / ITEM_WIDTH);
    setValue(numbers[idx]);
  };

  return (
    <View style={{ width: ITEM_WIDTH * 3, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: ITEM_WIDTH }}
        style={{ height: 30 }}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
      >
        {numbers.map((num, idx) => {
          // Calculate animated distance from center
          const inputRange = useMemo(() => [
            (idx - 2) * ITEM_WIDTH,
            (idx - 1) * ITEM_WIDTH,
            idx * ITEM_WIDTH,
            (idx + 1) * ITEM_WIDTH,
            (idx + 2) * ITEM_WIDTH,
          ], [idx, ITEM_WIDTH]);
          
          const fontSize = scrollX.interpolate({
            inputRange,
            outputRange: [16, 18, 24, 18, 16],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.1, 0.3, 1, 0.3, 0.1],
            extrapolate: 'clamp',
          });
          const color = scrollX.interpolate({
            inputRange,
            outputRange: [themeColors.unselectedText, '#888', themeColors.text, '#888', themeColors.unselectedText],
            extrapolate: 'clamp',
          });
          const fontWeight = scrollX.interpolate({
            inputRange,
            outputRange: Platform.OS === "ios" ? ["400", "400", "700", "400", "400"] : ["400", "400", "400", "400", "400"],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={num}
              style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}
            >
              <Animated.Text
                style={{
                  fontFamily: Fonts.bodyMedium,
                  fontSize,
                  color,
                  opacity,
                  fontWeight,
                }}
              >
                {num}
              </Animated.Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const CustomGoalForm = ({ setScrollEnabled, themeColors }: { setScrollEnabled?: (enabled: boolean) => void, themeColors: any }) => {
  const { language } = useLanguage();
  const [decks, setDecks] = useState(3);
  const [days, setDays] = useState(5);
  const [signature, setSignature] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState<{x: number, y: number}[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const signatureWidth = 180;
  const signatureHeight = 75;

  // Modal context
  const {
    isSubmitCustomFormModalOpen,
    setIsSubmitCustomFormModalOpen,
    submitCustomFormModalOpacity,
    setIsMenuOpen,
    menuOverlayOpacity,
    setOnSubmitCustomFormModalClose,
  } = useContext(MenuContext);

  // Reset form callback
  const resetForm = useCallback(() => {
    setDecks(3);
    setDays(5);
    setSignature(null);
    setCurrentPoints([]);
  }, []);

  // Register reset callback when modal opens
  useEffect(() => {
    if (isSubmitCustomFormModalOpen) {
      setOnSubmitCustomFormModalClose(() => resetForm);
    }
  }, [isSubmitCustomFormModalOpen]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!signature) return;
    setIsMenuOpen(true);
    setIsSubmitCustomFormModalOpen(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(submitCustomFormModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [signature, setIsMenuOpen, setIsSubmitCustomFormModalOpen, menuOverlayOpacity, submitCustomFormModalOpacity]);

  // PanResponder for drawing
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: useCallback((evt: any, gestureState: any) => {
        // Start new stroke, clear previous signature
        setSignature(null);
        setCurrentPoints([]);
        setIsSigning(true);
        if (setScrollEnabled) setScrollEnabled(false);
      }, [setScrollEnabled]),
      onPanResponderMove: useCallback((evt: any, gestureState: any) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPoints(points => [...points, { x: locationX, y: locationY }]);
      }, []),
      onPanResponderRelease: useCallback(() => {
        setCurrentPoints(points => {
          if (points.length > 1) {
            setSignature(pointsToSvgPath(points));
          }
          return [];
        });
        setIsSigning(false);
        if (setScrollEnabled) setScrollEnabled(true);
      }, [setScrollEnabled]),
      onPanResponderTerminate: useCallback(() => {
        setCurrentPoints([]);
        setIsSigning(false);
        if (setScrollEnabled) setScrollEnabled(true);
      }, [setScrollEnabled]),
    })
  ).current;

  function pointsToSvgPath(points: {x: number, y: number}[]) {
    if (points.length < 2) return '';
    const d = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
    return d;
  }

  return (
    <View
      style={{
        width: '90%',
        height: 250,
        backgroundColor: themeColors.secondaryShade,
        marginTop: 15,
        borderRadius: 30,
        borderColor: themeColors.brandColor2,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1, width: '100%', flexDirection: 'column', paddingHorizontal: 10, paddingVertical: 20, justifyContent: 'center' }}>
        <View style={{ paddingLeft: 20}}>
          {/* First line: intro text */}
          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text, textAlign: 'justify', lineHeight: 30, }}>
            {strings[language].toAchieveGoals}
          </Text>
          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text, textAlign: 'justify', lineHeight: 30}}>
            {strings[language].studyDiligently}
          </Text>
          {/* Second line: decks number picker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <NumberPicker value={decks} setValue={setDecks} min={1} max={30} themeColors={themeColors} />
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text, lineHeight: 30}}>
              {strings[language].decksContinuously}
            </Text>
          </View>
          {/* Fourth line: days number picker and 'days.' */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text,}}>
              {strings[language].forDays}
            </Text>
            <NumberPicker value={days} setValue={setDays} min={1} max={100} themeColors={themeColors} />
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text,}}>
              {strings[language].daysPeriod}
            </Text>
          </View>
        </View>

        {/* Second row: Done button and signature area */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between',  width: '100%',  }}>
        {/* Submit button */}
        <TouchableOpacity disabled={!signature || isSubmitCustomFormModalOpen} onPress={handleSubmit}>
          <Text style={{
            fontSize: 20,
            fontFamily: Fonts.bodyMedium,
            color: signature && !isSubmitCustomFormModalOpen ? themeColors.brandColor1 : themeColors.unselectedText,
            marginTop: 50
          }}>{strings[language].submit}</Text>
        </TouchableOpacity>
        {/* Signature area */}
        <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end', marginLeft: 30, height: 75}}>
          <View style={{ alignItems: 'center', justifyContent: 'flex-end', width: '100%', height: signatureHeight, position: 'relative' }}>
            {/* Signature drawing area */}
            <View
              style={{ position: 'absolute', left: 0, top: 0, width: signatureWidth, height: signatureHeight, zIndex: 2 }}
              {...panResponder.panHandlers}
              pointerEvents="box-only"
            >
              <Svg width={signatureWidth} height={signatureHeight} style={{ position: 'absolute', left: 0, top: 0 }}>
                {signature && (
                  <Path d={signature} stroke="#111" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {currentPoints.length > 1 && (
                  <Path d={pointsToSvgPath(currentPoints)} stroke="#111" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </Svg>
            </View>
            {/* Placeholder text */}
            {!signature && !isSigning && (
              <Text style={{ fontFamily: Fonts.cursive, fontSize: 28, color: themeColors.text, marginBottom: -8, position: "absolute",bottom: 0, textAlign: 'center', width: signatureWidth, zIndex: 1 }}>
                {strings[language].signHere}
              </Text>
            )}
            <View style={{ height: 2, backgroundColor: themeColors.text, width: '100%', marginTop: signatureHeight - 2, zIndex: 0 }} />
          </View>
          <Text style={{ fontFamily: Fonts.bodyItalic, fontSize: 12, color: themeColors.text, textAlign: 'center', position: 'absolute', left: 0, right: 0, bottom:-13}}>
            {strings[language].singleFingerStroke}
          </Text>
        </View>
      </View>

      </View>
      
    </View>
  );
}

const StreakCalendarStats = ({ themeColors }: { themeColors: any }) => {
  const { language } = useLanguage();
  const [streakData, setStreakData] = useState<LongestStreakData>({
    streakLength: 0,
    uniqueFlashcards: 0,
    uniqueDecks: 0,
    streakStartDate: null,
    streakEndDate: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFocused = useIsFocused();
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Fetch streak data
  const fetchStreakData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getLongestStreakData();
      setStreakData(data);
    } catch (error) {
      setStreakData({
        streakLength: 0,
        uniqueFlashcards: 0,
        uniqueDecks: 0,
        streakStartDate: null,
        streakEndDate: null
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      const now = Date.now();
      // Only fetch if cache is expired or no data exists
      if (now - lastFetchTime > CACHE_DURATION || streakData.streakLength === 0) {
        fetchStreakData();
        setLastFetchTime(now);
      }
    }
  }, [isFocused, fetchStreakData, lastFetchTime, CACHE_DURATION, streakData.streakLength]);

  return (
    <View style={{ marginHorizontal: 16, marginTop: 20,}}>
      {/* First row - Title */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.title}>{strings[language].longestStreak}</Text>
      </View>

      {/* 3x3 Grid */}
      <View>
        {/* Row 1 */}
        <View style={{ flexDirection: 'row', height: CELL_HEIGHT, marginBottom: 20 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <FireIcon width={ICON_SIZE} height={ICON_SIZE} style={{marginRight: 110}} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 48, color: themeColors.text, width:150, textAlign: "center", }}>
              {isLoading ? '...' : streakData.streakLength}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: language === 'Chinese' ? 30 : 20, color: themeColors.text, marginLeft: 150, width: 100, textAlign: "left"}}>{strings[language].days}</Text>
          </View>
        </View>
        {/* Row 2 */}
        <View style={{ flexDirection: 'row', height: CELL_HEIGHT, marginBottom: 20,}}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <DecksStudiedIcon width={ICON_SIZE} height={ICON_SIZE} style={{marginRight: 110}}/>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 48, color: themeColors.text,width:150, textAlign: "center"}}>
              {isLoading ? '...' : streakData.uniqueDecks}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text, marginLeft: 150, width: 100, textAlign: "left"}}>{strings[language].decksStudied}</Text>
          </View>
        </View>
        {/* Row 3 */}
        <View style={{ flexDirection: 'row', height: CELL_HEIGHT }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <FlashcardsStudiedIcon width={60} height={60} style={{marginRight: 110}}/>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 48, color: themeColors.text, width:150, textAlign: "center"}}>
              {isLoading ? '...' : streakData.uniqueFlashcards}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 20, color: themeColors.text, marginLeft: 150, width: 100, textAlign: "left"}}>{strings[language].flashcardsStudied}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Utility to get streak info for each studied date
const getStreakInfo = (studiedArr: string[]): { [date: string]: 'start' | 'middle' | 'end' | 'single' | 'studied' } => {
  const studiedSet = new Set(studiedArr);
  const streakInfo: { [date: string]: 'start' | 'middle' | 'end' | 'single' | 'studied' } = {};
  
  // Pre-calculate date mappings to avoid repeated parsing and formatting
  const dateMappings = new Map<string, { prev: string; next: string }>();
  
  for (let i = 0; i < studiedArr.length; i++) {
    const date = studiedArr[i];
    if (!dateMappings.has(date)) {
      const parsedDate = parseISO(date);
      dateMappings.set(date, {
        prev: format(subDays(parsedDate, 1), 'yyyy-MM-dd'),
        next: format(addDays(parsedDate, 1), 'yyyy-MM-dd')
      });
    }
  }
  
  // First pass: determine streak positions
  for (let i = 0; i < studiedArr.length; i++) {
    const date = studiedArr[i];
    const { prev, next } = dateMappings.get(date)!;
    const isPrev = studiedSet.has(prev);
    const isNext = studiedSet.has(next);
    
    if (isPrev && isNext) {
      streakInfo[date] = 'middle';
    } else if (!isPrev && isNext) {
      streakInfo[date] = 'start';
    } else if (isPrev && !isNext) {
      streakInfo[date] = 'end';
    } else {
      streakInfo[date] = 'single';
    }
  }
  
  // Second pass: mark single days as 'studied' if not part of streaks
  for (let i = 0; i < studiedArr.length; i++) {
    const date = studiedArr[i];
    if (streakInfo[date] === 'single') {
      const { prev, next } = dateMappings.get(date)!;
      if (!(studiedSet.has(prev) || studiedSet.has(next))) {
        streakInfo[date] = 'studied';
      }
    }
  }
  
  return streakInfo;
};

// Memoized version of getStreakInfo to prevent recalculation when input hasn't changed
const memoizedGetStreakInfo = (studiedArr: string[]) => {
  return useMemo(() => getStreakInfo(studiedArr), [studiedArr]);
};

const StreakCalendar = () => {
  const [studiedDates, setStudiedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFocused = useIsFocused();
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Fetch studied dates
  const fetchStudiedDates = useCallback(async () => {
    try {
      setIsLoading(true);
      const dates = await getAllStudiedDates();
      setStudiedDates(dates);
    } catch (error) {
      setStudiedDates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      const now = Date.now();
      // Only fetch if cache is expired or no data exists
      if (now - lastFetchTime > CACHE_DURATION || studiedDates.length === 0) {
        fetchStudiedDates();
        setLastFetchTime(now);
      }
    }
  }, [isFocused, fetchStudiedDates, lastFetchTime, CACHE_DURATION, studiedDates.length]);

  // Use memoized streak info calculation
  const streakInfo = memoizedGetStreakInfo(studiedDates);
  
  // Memoize today's date to prevent recalculation for every calendar day
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <View style={{ marginTop: 30, width: '100%', paddingHorizontal: 16 }}>
      <Calendar
        markingType={'custom'}
        disableAllTouchEventsForDisabledDays={true}
        dayComponent={({ date, state }) => {
          if (!date) return null;
          const dateStr = date.dateString;
          const info = streakInfo[dateStr];
          
          // Memoize expensive calculations for each day
          const dayCalculations = useMemo(() => {
            const isStreak = info === 'start' || info === 'middle' || info === 'end';
            const isStreakStart = info === 'start';
            const isStreakEnd = info === 'end';
            const isStreakMiddle = info === 'middle';
            const isStudiedOnly = info === 'studied';
            const isToday = dateStr === today;
            
            return {
              isStreak,
              isStreakStart,
              isStreakEnd,
              isStreakMiddle,
              isStudiedOnly,
              isToday
            };
          }, [info, dateStr, today]);
          
          const { isStreak, isStreakStart, isStreakEnd, isStreakMiddle, isStudiedOnly, isToday } = dayCalculations;
          
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36, position: 'relative' }}>
              {/* Yellow circle for studied or streak */}
              {(isStreak || isStudiedOnly) && (
                <View
                  style={{
                    position: 'absolute',
                    width: 28,
                    height: 28,
                    backgroundColor: isStreak? '#5bcfff' : '#FFCE51',
                    borderRadius: 99,
                    top: 4,
                    left: 4,
                    zIndex: 1,
                  }}
                />
              )}
              {/* Fire icon for streak */}
              {isStreak && (
                <FireIcon
                  width={16}
                  height={16}
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: 10,
                    zIndex: 2,
                  }}
                />
              )}
              {/* Date number */}
              <Text
                style={{
                  color: isToday ? '#4F41D8' : (state === 'disabled' ? '#d9e1e8' : '#2d4150'),
                  fontFamily: Fonts.bodyMedium,
                  fontSize: 16,
                  zIndex: 3,
                  fontWeight: isToday ? 'bold' : 'normal',
                  ...(isToday && {
                    borderWidth: 2,
                    borderColor: '#4F41D8',
                    borderRadius: 28,
                    width: 28,
                    height: 28,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    lineHeight: 20,
                  }),
                }}
              >
                {date.day}
              </Text>
            </View>
          );
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#4F41D8',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4F41D8',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#FFCE51',
          monthTextColor: '#000000',
          textMonthFontFamily: Fonts.bodyMedium,
          textDayHeaderFontFamily: Fonts.bodyMedium,
          textDayFontFamily: Fonts.bodyMedium,
          textDayHeaderFontSize: 14,
          textMonthFontSize: 20,
          arrowColor: '#000000',
        }}
      />
    </View>
  );
};

interface BadgeData {
  badgeTitle: string;
  achieved: boolean;
  badgeImage?: any;
  badgeCreatedDate: string; // ISO string
  badgeExpiryDate?: string;
}

const Badge = ({ title, image, achieved, themeColors }: { title: string, image?: ImageSourcePropType, achieved: boolean, themeColors: any }) => {
  const size = 120;
  const borderWidth = 3; // visually thick border
  const padding = borderWidth; // padding to prevent clipping
  const svgSize = size + 2 * padding;
  
  // Memoize hexagon calculations
  const { outerPointsStr, innerPointsStr } = useMemo(() => {
    // Hexagon math
    const getHexPoints = (radius: number, cx: number, cy: number) =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = Math.PI / 3 * i - Math.PI / 2;
        return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
      });
    
    // Outer (border) hexagon
    const outerRadius = size / 2;
    const outerPoints = getHexPoints(outerRadius, svgSize / 2, svgSize / 2);
    
    // Inner (fill) hexagon
    const innerRadius = outerRadius - borderWidth;
    const innerPoints = getHexPoints(innerRadius, svgSize / 2, svgSize / 2);
    
    const outerStr = outerPoints.map(p => p.join(",")).join(" ");
    const innerStr = innerPoints.map(p => p.join(",")).join(" ");
    
    return { outerPointsStr: outerStr, innerPointsStr: innerStr };
  }, [size, borderWidth, svgSize]);
  return (
    <View style={{ alignItems: 'center', width: svgSize }}>
      <Svg width={svgSize} height={svgSize} style={{ transform: [{ rotate: '90deg' }] }}>
        {/* Border hexagon (no stroke, just fill) */}
        <Polygon
          points={outerPointsStr}
          fill={achieved ? themeColors.text : themeColors.unselectedText}
        />
        {/* Fill hexagon (image or white) */}
        {image ? (
          <>
            <Defs>
              <ClipPath id="hexClipSmall">
                <Polygon points={innerPointsStr} />
              </ClipPath>
            </Defs>
            <SvgImage
              href={image}
              width={svgSize}
              height={svgSize}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#hexClipSmall)"
            />
          </>
        ) : (
          <Polygon points={innerPointsStr} fill={themeColors.background} />
        )}
        {/* Grey overlay for pending state */}
        {!achieved && (
          <Polygon
            points={innerPointsStr}
            fill={`${themeColors.unselectedText}33`}
            pointerEvents="none"
          />
        )}
      </Svg>
      <Text
        style={{
          fontFamily: Fonts.bodyMedium,
          fontSize: 16,
          color: achieved ? themeColors.text : `${themeColors.text}80`,
          marginTop: 0,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </View>
  );
};

// Update BadgeWall props
type BadgeWallProps = {
  badges: BadgeData[],
  backgroundImage: any,
  title: string,
};

const BadgeWall = ({ badges, backgroundImage, title, themeColors }: BadgeWallProps & { themeColors: any }) => {
  const { language } = useLanguage();
  const [viewAll, setViewAll] = useState(false);
  
  // Memoize expensive calculations
  const { sortedBadges, badgeRows, collapsedHeight, expandedHeight } = useMemo(() => {
    // Sort badges: non-achieved first (desc by createdDate), then achieved (desc by createdDate)
    const sorted = [
      ...badges.filter(b => !b.achieved).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
      ...badges.filter(b => b.achieved).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
    ];
    
    // Group into rows of 2
    const rows = [];
    for (let i = 0; i < sorted.length; i += 2) {
      rows.push([
        sorted[i],
        sorted[i + 1] || null,
      ]);
    }
    
    const rowHeight = 120 + 20; // badge size + marginBottom
    const collapsed = rowHeight * 2 + 40; // 2 rows + extra margin
    const expanded = rowHeight * rows.length + rows.length * 25;
    
    return { sortedBadges: sorted, badgeRows: rows, collapsedHeight: collapsed, expandedHeight: expanded };
  }, [badges]);
  const anim = useRef(new Animated.Value(collapsedHeight)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: viewAll ? expandedHeight : collapsedHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [viewAll, expandedHeight, collapsedHeight]);
  return (
    <View
      style={{
        width: '100%',
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#fff',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Background image */}
      <RNImage
        source={backgroundImage}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        }}
      />
      {/* Content column */}
      <View style={{ margin: 10, flex: 1 }}>
        <Text style={{ fontFamily: Fonts.title, fontSize: 36, color: themeColors.text, marginBottom: 10, textAlign: 'center' }}>
          {title}
        </Text>
        {/* Animated badge grid */}
        <Animated.View style={{ width: '100%', height: anim, overflow: 'hidden' }}>
          {(viewAll ? badgeRows : badgeRows.slice(0, 2)).map((row, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ width: "50%", justifyContent: 'center', alignItems: 'center', paddingRight: 20 }}>
                {row[0] && (
                  <Badge
                    title={row[0].badgeTitle}
                    achieved={row[0].achieved}
                    image={row[0].badgeImage}
                    themeColors={themeColors}
                  />
                )}
              </View>
              <View style={{ width: "50%", justifyContent: 'center', alignItems: 'center', paddingLeft: 20 }}>
                {row[1] && (
                  <Badge
                    title={row[1].badgeTitle}
                    achieved={row[1].achieved}
                    image={row[1].badgeImage}
                    themeColors={themeColors}
                  />
                )}
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
      {/* Toggle Button at the bottom */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={useCallback(() => setViewAll(v => !v), [])}
          style={{
            width: 100,
            height: 48,
            backgroundColor: themeColors.brandColor2,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontFamily: Fonts.bodyMedium,
            textAlign: 'center',
          }}>{viewAll ? strings[language].collapse : strings[language].viewAll}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Dummy data for the first BadgeWall
const dummyBadges1 = [
  // 4 unachieved badges (most recent first)
  {
    badgeTitle: 'Unachieved 1',
    achieved: false,
    badgeCreatedDate: '2025-06-13T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 2',
    achieved: false,
    badgeCreatedDate: '2025-06-12T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 3',
    achieved: false,
    badgeCreatedDate: '2025-06-11T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 4',
    achieved: false,
    badgeCreatedDate: '2025-06-10T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  // 9 achieved badges (most recent first)
  {
    badgeTitle: 'Achieved 1',
    achieved: true,
    badgeCreatedDate: '2025-06-09T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 2',
    achieved: true,
    badgeCreatedDate: '2025-06-08T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 3',
    achieved: true,
    badgeCreatedDate: '2025-06-07T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 4',
    achieved: true,
    badgeCreatedDate: '2025-06-06T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 5',
    achieved: true,
    badgeCreatedDate: '2025-06-05T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 6',
    achieved: true,
    badgeCreatedDate: '2025-06-04T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 7',
    achieved: true,
    badgeCreatedDate: '2025-06-03T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 8',
    achieved: true,
    badgeCreatedDate: '2025-06-02T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  
];

const dummyBadges2 = [
  // 4 unachieved badges (most recent first)
  {
    badgeTitle: 'Unachieved 1',
    achieved: false,
    badgeCreatedDate: '2025-06-13T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 2',
    achieved: false,
    badgeCreatedDate: '2025-06-12T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 3',
    achieved: false,
    badgeCreatedDate: '2025-06-11T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 4',
    achieved: false,
    badgeCreatedDate: '2025-06-10T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  // 9 achieved badges (most recent first)
  {
    badgeTitle: 'Achieved 1',
    achieved: true,
    badgeCreatedDate: '2025-06-09T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 2',
    achieved: true,
    badgeCreatedDate: '2025-06-08T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 3',
    achieved: true,
    badgeCreatedDate: '2025-06-07T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 4',
    achieved: true,
    badgeCreatedDate: '2025-06-06T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 5',
    achieved: true,
    badgeCreatedDate: '2025-06-05T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 6',
    achieved: true,
    badgeCreatedDate: '2025-06-04T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 7',
    achieved: true,
    badgeCreatedDate: '2025-06-03T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 8',
    achieved: true,
    badgeCreatedDate: '2025-06-02T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  
];

const dummyBadges3 = [
  // 4 unachieved badges (most recent first)
  {
    badgeTitle: 'Unachieved 1',
    achieved: false,
    badgeCreatedDate: '2025-06-13T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 2',
    achieved: false,
    badgeCreatedDate: '2025-06-12T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 3',
    achieved: false,
    badgeCreatedDate: '2025-06-11T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 4',
    achieved: false,
    badgeCreatedDate: '2025-06-10T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  // 9 achieved badges (most recent first)
  {
    badgeTitle: 'Achieved 1',
    achieved: true,
    badgeCreatedDate: '2025-06-09T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 2',
    achieved: true,
    badgeCreatedDate: '2025-06-08T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 3',
    achieved: true,
    badgeCreatedDate: '2025-06-07T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 4',
    achieved: true,
    badgeCreatedDate: '2025-06-06T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 5',
    achieved: true,
    badgeCreatedDate: '2025-06-05T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 6',
    achieved: true,
    badgeCreatedDate: '2025-06-04T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 7',
    achieved: true,
    badgeCreatedDate: '2025-06-03T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 8',
    achieved: true,
    badgeCreatedDate: '2025-06-02T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  
];

const dummyBadges4 = [
  // 4 unachieved badges (most recent first)
  {
    badgeTitle: 'Unachieved 1',
    achieved: false,
    badgeCreatedDate: '2025-06-13T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 2',
    achieved: false,
    badgeCreatedDate: '2025-06-12T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 3',
    achieved: false,
    badgeCreatedDate: '2025-06-11T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 4',
    achieved: false,
    badgeCreatedDate: '2025-06-10T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  // 9 achieved badges (most recent first)
  {
    badgeTitle: 'Achieved 1',
    achieved: true,
    badgeCreatedDate: '2025-06-09T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 2',
    achieved: true,
    badgeCreatedDate: '2025-06-08T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 3',
    achieved: true,
    badgeCreatedDate: '2025-06-07T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 4',
    achieved: true,
    badgeCreatedDate: '2025-06-06T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 5',
    achieved: true,
    badgeCreatedDate: '2025-06-05T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 6',
    achieved: true,
    badgeCreatedDate: '2025-06-04T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 7',
    achieved: true,
    badgeCreatedDate: '2025-06-03T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 8',
    achieved: true,
    badgeCreatedDate: '2025-06-02T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  
];

const dummyBadges5 = [
  // 4 unachieved badges (most recent first)
  {
    badgeTitle: 'Unachieved 1',
    achieved: false,
    badgeCreatedDate: '2025-06-13T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 2',
    achieved: false,
    badgeCreatedDate: '2025-06-12T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 3',
    achieved: false,
    badgeCreatedDate: '2025-06-11T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Unachieved 4',
    achieved: false,
    badgeCreatedDate: '2025-06-10T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  // 9 achieved badges (most recent first)
  {
    badgeTitle: 'Achieved 1',
    achieved: true,
    badgeCreatedDate: '2025-06-09T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 2',
    achieved: true,
    badgeCreatedDate: '2025-06-08T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 3',
    achieved: true,
    badgeCreatedDate: '2025-06-07T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 4',
    achieved: true,
    badgeCreatedDate: '2025-06-06T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 5',
    achieved: true,
    badgeCreatedDate: '2025-06-05T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 6',
    achieved: true,
    badgeCreatedDate: '2025-06-04T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 7',
    achieved: true,
    badgeCreatedDate: '2025-06-03T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 8',
    achieved: true,
    badgeCreatedDate: '2025-06-02T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
    {
    badgeTitle: 'Achieved 9',
    achieved: true,
    badgeCreatedDate: '2025-06-01T10:00:00Z',
    badgeImage: undefined,
    badgeExpiryDate: undefined,
  },
  
];

export default function AwardsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const achievementsContentAnim = useRef(new Animated.Value(0)).current;
  const [isAchievements, setIsAchievements] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
  const isFocused = useIsFocused();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const getTopBarStatisticsHeight = useTopBarStatisticsHeight();
  
  const themeColors = Colors[theme];

  useEffect(() => {
    if (isFocused) {
      setDisableToggleAnimation(true);
      setIsAchievements(false);
      achievementsContentAnim.setValue(0);
      setTimeout(() => {
        setDisableToggleAnimation(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  const handleToggle = useCallback((val: boolean) => {
    if (val) {
      // Switching to Achievements
      Animated.sequence([
        Animated.timing(achievementsContentAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAchievements(true);
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(achievementsContentAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } 
    else {
      // Switching back to Goals
      Animated.sequence([
        Animated.timing(fadeAnim, {
      toValue: 0,
          duration: 200,
      useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAchievements(false);
        Animated.timing(fadeAnim, {
        toValue: 1,
          duration: 300,
        useNativeDriver: true,
      }).start();
      });
    }
  }, [fadeAnim, achievementsContentAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
              <View style={{ marginTop: getTopBarStatisticsHeight(), paddingHorizontal: 16 }}>
        <RoundedContainer
          leftLabel={strings[language].goals}
          rightLabel={strings[language].achievements}
          onToggle={handleToggle}
          position={isAchievements ? 'right' : 'left'}
          disableAnimation={disableToggleAnimation}
        />
      </View>
      {!isAchievements && (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            style={{ marginBottom: 40, marginTop: 20 }}
          >
        <View style={styles.wrapper}>
                      <Text style={[styles.title, language === 'Chinese' && {marginTop: 20}, { color: themeColors.text }]}>{strings[language].fillInCustomGoal}</Text>
                            <CustomGoalForm setScrollEnabled={setScrollEnabled} themeColors={themeColors} />
                <StreakCalendarStats themeColors={themeColors} />
              <StreakCalendar />
        </View>
            <View style={{ height: 20 }}></View>
          </ScrollView>
        </Animated.View>
      )}
      {isAchievements && (
        <Animated.View style={{ 
          flex: 1,
          opacity: achievementsContentAnim,
          transform: [{ 
            translateY: achievementsContentAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            style={{ marginBottom: 40, marginTop: 20, marginHorizontal: 16 }}
          >
            <View style={{ flexDirection: 'column', gap: 30 }}>
              <BadgeWall badges={dummyBadges1} backgroundImage={LargeMeshBackground1} title={strings[language].customBadges} themeColors={themeColors} />
              <BadgeWall badges={dummyBadges2} backgroundImage={LargeMeshBackground2} title={strings[language].dailyStreakBadges} themeColors={themeColors} />
              <BadgeWall badges={dummyBadges3} backgroundImage={LargeMeshBackground3} title={strings[language].weeklyStreakBadges} themeColors={themeColors} />
              <BadgeWall badges={dummyBadges4} backgroundImage={LargeMeshBackground4} title={strings[language].welcomeBadges} themeColors={themeColors} />
              <BadgeWall badges={dummyBadges1} backgroundImage={LargeMeshBackground1} title={strings[language].lifetimeBadges} themeColors={themeColors} />
            </View>
          </ScrollView>
    </Animated.View>
      )}
    </View>
  );
} 

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: -10
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 32,
    textAlign: 'center',
    includeFontPadding: false,
  },
});