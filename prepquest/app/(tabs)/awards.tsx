import { Animated, Dimensions, View, StyleSheet, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useEffect, useRef, useState, useContext } from 'react';
import { RoundedContainer } from '@/components/RoundedContainer';
import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PanResponder } from 'react-native';
import { MenuContext } from './_layout';
import FireIcon from '@/assets/icons/FireIcon.svg';
import DecksStudiedIcon from '@/assets/icons/DecksStudiedIcon.svg';
import FlashcardsStudiedIcon from '@/assets/icons/FlashcardsStudiedIcon.svg';
import { Calendar } from 'react-native-calendars';
import { addDays, format, isSameDay, parseISO, subDays } from 'date-fns';

const SatoshiMedium = 'Satoshi-Medium';

const CELL_HEIGHT = 90; // or any value you prefer
const ICON_SIZE = 70;   // make icons larger to match cell size

const NumberPicker = ({ value, setValue, min, max }: { value: number, setValue: (v: number) => void, min: number, max: number }) => {
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
          const inputRange = [
            (idx - 2) * ITEM_WIDTH,
            (idx - 1) * ITEM_WIDTH,
            idx * ITEM_WIDTH,
            (idx + 1) * ITEM_WIDTH,
            (idx + 2) * ITEM_WIDTH,
          ];
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
            outputRange: ['#bbb', '#888', '#222', '#888', '#bbb'],
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
                  fontFamily: SatoshiMedium,
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

const CustomGoalForm = ({ setScrollEnabled }: { setScrollEnabled?: (enabled: boolean) => void }) => {
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
  const resetForm = () => {
    setDecks(3);
    setDays(5);
    setSignature(null);
    setCurrentPoints([]);
  };

  // Register reset callback when modal opens
  useEffect(() => {
    if (isSubmitCustomFormModalOpen) {
      setOnSubmitCustomFormModalClose(() => resetForm);
    }
  }, [isSubmitCustomFormModalOpen]);

  // Handle submit
  const handleSubmit = () => {
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
  };

  // PanResponder for drawing
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Start new stroke, clear previous signature
        setSignature(null);
        setCurrentPoints([]);
        setIsSigning(true);
        if (setScrollEnabled) setScrollEnabled(false);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPoints(points => [...points, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setCurrentPoints(points => {
          if (points.length > 1) {
            setSignature(pointsToSvgPath(points));
          }
          return [];
        });
        setIsSigning(false);
        if (setScrollEnabled) setScrollEnabled(true);
      },
      onPanResponderTerminate: () => {
        setCurrentPoints([]);
        setIsSigning(false);
        if (setScrollEnabled) setScrollEnabled(true);
      },
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
        backgroundColor: '#F8F8F8',
        marginTop: 15,
        borderRadius: 30,
        borderColor: '#4F41D8',
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1, width: '100%', flexDirection: 'column', paddingHorizontal: 10, paddingVertical: 20, justifyContent: 'center' }}>
        <View style={{ paddingLeft: 20}}>
        {/*iphone 16 plus, iphone 16 pro max, pixel 7 pro, pixel 7, pixel 8, pixel 9 pro, pixel 9 pro xl */}
        {/* First line: intro text */}
          <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#222', textAlign: 'justify', lineHeight: 30, }}>
            To achieve my goals, I pledge to 
          </Text>
          <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#222', textAlign: 'justify', lineHeight: 30}}>
            study diligently by studying
          </Text>
          {/* Second line: decks number picker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <NumberPicker value={decks} setValue={setDecks} min={1} max={30} />
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#222', lineHeight: 30}}>decks continuously</Text>
          </View>
          {/* Fourth line: days number picker and 'days.' */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#222',}}>for </Text>
            <NumberPicker value={days} setValue={setDays} min={1} max={100} />
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#222',}}>days.</Text>
          </View>
        </View>

        {/* Second row: Done button and signature area */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between',  width: '100%',  }}>
        {/* Submit button */}
        <TouchableOpacity disabled={!signature || isSubmitCustomFormModalOpen} onPress={handleSubmit}>
          <Text style={{
            fontSize: 20,
            fontFamily: 'Satoshi-Medium',
            color: signature && !isSubmitCustomFormModalOpen ? '#44B88A' : '#D5D4DD',
            marginTop: 50
          }}>Submit</Text>
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
              <Text style={{ fontFamily: 'CedarvilleCursive-Regular', fontSize: 28, color: '#111', marginBottom: -8, position: "absolute",bottom: 0, textAlign: 'center', width: signatureWidth, zIndex: 1 }}>
                sign here
              </Text>
            )}
            <View style={{ height: 2, backgroundColor: '#111', width: '100%', marginTop: signatureHeight - 2, zIndex: 0 }} />
          </View>
          <Text style={{ fontFamily: 'Satoshi-Italic', fontSize: 12, color: '#222', textAlign: 'center', position: 'absolute', left: 0, right: 0, bottom:-13}}>(single finger stroke)</Text>
        </View>
      </View>

      </View>
      
    </View>
  );
}

const StreakCalendarStats = () => {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 20,}}>
      {/* First row - Title */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.title}>Current Streak</Text>
      </View>

      {/* 3x3 Grid */}
      <View>
        {/* Row 1 */}
        <View style={{ flexDirection: 'row', height: CELL_HEIGHT, marginBottom: 20 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <FireIcon width={ICON_SIZE} height={ICON_SIZE} style={{marginRight: 110}} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 48, color: '#000', width:150, textAlign: "center", }}>5</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#000', marginLeft: 150, width: 100, textAlign: "left"}}>days</Text>
          </View>
        </View>
        {/* Row 2 */}
        <View style={{ flexDirection: 'row', height: CELL_HEIGHT, marginBottom: 20,}}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <DecksStudiedIcon width={ICON_SIZE} height={ICON_SIZE} style={{marginRight: 110}}/>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 48, color: '#000',width:150, textAlign: "center"}}>50</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#000', marginLeft: 150, width: 100, textAlign: "left"}}>decks{'\n'}studied</Text>
          </View>
        </View>
        {/* Row 3 */}
        <View style={{ flexDirection: 'row', height: CELL_HEIGHT }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <FlashcardsStudiedIcon width={60} height={60} style={{marginRight: 110}}/>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 48, color: '#000', width:150, textAlign: "center"}}>50</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SatoshiMedium, fontSize: 20, color: '#000', marginLeft: 150, width: 100, textAlign: "left"}}>flashcards{'\n'}studied</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Example studied dates (should be sorted)
const studiedDatesArr = [
  '2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05', '2025-06-06', '2025-06-07',
  '2025-06-10', '2025-06-11',
  '2025-06-13', '2025-06-15',
];

// Utility to get streak info for each studied date
function getStreakInfo(studiedArr: string[]): { [date: string]: 'start' | 'middle' | 'end' | 'single' | 'studied' } {
  const studiedSet = new Set(studiedArr);
  const streakInfo: { [date: string]: 'start' | 'middle' | 'end' | 'single' | 'studied' } = {};
  for (let i = 0; i < studiedArr.length; i++) {
    const date = studiedArr[i];
    const prev = format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
    const next = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
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
  // Only mark as streak if part of 2+ consecutive days
  for (let i = 0; i < studiedArr.length; i++) {
    const date = studiedArr[i];
    if (streakInfo[date] === 'single') {
      const prev = format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
      const next = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
      if (!(studiedSet.has(prev) || studiedSet.has(next))) {
        streakInfo[date] = 'studied';
      }
    }
  }
  return streakInfo;
}

const streakInfo = getStreakInfo(studiedDatesArr);

const StreakCalendar = () => (
  <View style={{ marginTop: 30, width: '100%', paddingHorizontal: 16 }}>
    <Calendar
      markingType={'custom'}
      disableAllTouchEventsForDisabledDays={true}
      dayComponent={({ date, state }) => {
        if (!date) return null;
        const dateStr = date.dateString;
        const info = streakInfo[dateStr];
        const isStreak = info === 'start' || info === 'middle' || info === 'end';
        const isStreakStart = info === 'start';
        const isStreakEnd = info === 'end';
        const isStreakMiddle = info === 'middle';
        const isStudiedOnly = info === 'studied';
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36, position: 'relative' }}>
            {/* {isStreak && (
              <View
                style={{
                  position: 'absolute',
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(255, 206, 81, 0.2)',
                  borderTopLeftRadius: isStreakStart ? 90 : 0,
                  borderBottomLeftRadius: isStreakStart ? 90 : 0,
                  borderTopRightRadius: isStreakEnd ? 90 : 0,
                  borderBottomRightRadius: isStreakEnd ? 90 : 0,
                  borderRadius: isStreakMiddle ? 0 : 90,
                  zIndex: 0,
                }}
              />
            )} */}
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
                color: state === 'disabled' ? '#d9e1e8' : '#2d4150',
                fontFamily: 'Satoshi-Medium',
                fontSize: 16,
                zIndex: 3,
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
        textMonthFontFamily: 'Satoshi-Medium',
        textDayHeaderFontFamily: 'Satoshi-Regular',
        textDayFontFamily: 'Satoshi-Regular',
        textDayHeaderFontSize: 14,
        textMonthFontSize: 20,
        arrowColor: '#000000',
      }}
    />
  </View>
);

export default function AwardsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 65;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const [isAchievements, setIsAchievements] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
  const isFocused = useIsFocused();
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (isFocused) {
      setDisableToggleAnimation(true);
      setIsAchievements(false);
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

  const handleToggle = (val: boolean) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsAchievements(val);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: fadeAnim}}>
      <View style={{ marginTop: topPadding, paddingHorizontal: 16 }}>
        <RoundedContainer
          leftLabel="Goals"
          rightLabel="Achievements"
          onToggle={handleToggle}
          position={isAchievements ? 'right' : 'left'}
          disableAnimation={disableToggleAnimation}
        />
      </View>
      {!isAchievements && (
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          style={{ marginBottom: 40, marginTop: 20}}
        >
        <View style={styles.wrapper}>
          <Text style={styles.title}>Fill in your custom goal here!</Text>
          <CustomGoalForm setScrollEnabled={setScrollEnabled} />
          <StreakCalendarStats />
          <StreakCalendar />
        </View>
        <View style={{ height: 20,}}></View>
        </ScrollView>
      )}
    </Animated.View>
  );
} 

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  title: {
    fontFamily: 'Neuton-Regular',
    fontSize: 32,
    textAlign: 'center',
    color: '#000',
    includeFontPadding: false,
  },
});