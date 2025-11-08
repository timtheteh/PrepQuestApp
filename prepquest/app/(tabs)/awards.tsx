import { Animated, Dimensions, View, StyleSheet, Text, ScrollView, TouchableOpacity, Platform, Image as RNImage, ImageSourcePropType , PanResponder, RefreshControl } from 'react-native';
import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Path, Defs, ClipPath, Polygon , Image as SvgImage } from 'react-native-svg';
import { MenuContext } from '@/contexts/MenuContext';
import FireIcon from '@/assets/icons/statsIcons/FireIcon.svg';
import DecksStudiedIcon from '@/assets/icons/statsIcons/DecksStudiedIcon.svg';
import DecksStudiedIconDarkMode from '@/assets/icons/statsIcons/DecksStudiedIconDarkMode.svg';
import FlashcardsStudiedIcon from '@/assets/icons/statsIcons/FlashcardsStudiedIcon.svg';
import FlashcardsStudiedIconDarkMode from '@/assets/icons/statsIcons/FlashcardsStudiedIconDarkMode.svg';
import HexagonBadge from '@/components/awards/hexagonBadge.svg';
import HexagonBadgeUnachieved from '@/components/awards/hexagonBadgeUnachieved.svg';

// Streak badge SVG imports
import FirstFlame from '@/components/awards/streak/firstFlame.svg';
import FirstFlameUnachieved from '@/components/awards/streak/firstFlameUnachieved.svg';
import Ember from '@/components/awards/streak/ember.svg';
import EmberUnachieved from '@/components/awards/streak/emberUnachieved.svg';
import LetHimCook from '@/components/awards/streak/letHimCook.svg';
import LetHimCookUnachieved from '@/components/awards/streak/letHimCookUnachieved.svg';
import Firefly from '@/components/awards/streak/firefly.svg';
import FireflyUnachieved from '@/components/awards/streak/fireflyUnachieved.svg';
import Campfire from '@/components/awards/streak/campfire.svg';
import CampfireUnachieved from '@/components/awards/streak/campfireUnachieved.svg';
import DoublePower from '@/components/awards/streak/doublePower.svg';
import DoublePowerUnachieved from '@/components/awards/streak/doublePowerUnachieved.svg';
import StarStudent from '@/components/awards/streak/starStudent.svg';
import StarStudentUnachieved from '@/components/awards/streak/starStudentUnachieved.svg';
import Professor from '@/components/awards/streak/professor.svg';
import ProfessorUnachieved from '@/components/awards/streak/professorUnachieved.svg';
import Unstoppable from '@/components/awards/streak/unstoppable.svg';
import UnstoppableUnachieved from '@/components/awards/streak/unstoppableUnachieved.svg';
import HotSpicy from '@/components/awards/streak/hot&Spicy.svg';
import HotSpicyUnachieved from '@/components/awards/streak/hot&SpicyUnachieved.svg';
import Volcano from '@/components/awards/streak/volcano.svg';
import VolcanoUnachieved from '@/components/awards/streak/volcanoUnachieved.svg';
import Meteor from '@/components/awards/streak/metero.svg';
import MeteorUnachieved from '@/components/awards/streak/meteorUnachieved.svg';
import Dragon from '@/components/awards/streak/dragon.svg';
import DragonUnachieved from '@/components/awards/streak/dragonUnachieved.svg';
import Supernova from '@/components/awards/streak/supernova.svg';
import SupernovaUnachieved from '@/components/awards/streak/supernovaUnachieved.svg';
import Royalty from '@/components/awards/streak/royalty.svg';
import RoyaltyUnachieved from '@/components/awards/streak/royaltyUnachieved.svg';
import Phoenix from '@/components/awards/streak/phoenix.svg';
import PhoenixUnachieved from '@/components/awards/streak/phoenixUnachieved.svg';

// Welcome badge SVG imports
import Beginnings from '@/components/awards/welcome/beginnings.svg';
import BeginningsUnachieved from '@/components/awards/welcome/beginningsUnachieved.svg';
import FirstSteps from '@/components/awards/welcome/firstSteps.svg';
import FirstStepsUnachieved from '@/components/awards/welcome/firstStepsUnachieved.svg';
import AiConnection from '@/components/awards/welcome/aiConnection.svg';
import AiConnectionUnachieved from '@/components/awards/welcome/aiConnectionUnachieved.svg';
import FileFrenzy from '@/components/awards/welcome/fileFrenzy.svg';
import FileFrenzyUnachieved from '@/components/awards/welcome/fileFrenzyUnachieved.svg';
import YoutubeForm from '@/components/awards/welcome/youtubeForm.svg';
import YoutubeFormUnachieved from '@/components/awards/welcome/youtubeFormUnachieved.svg';
import PersonalTouch from '@/components/awards/welcome/personalTouch.svg';
import PersonalTouchUnachieved from '@/components/awards/welcome/personalTouchUnachieved.svg';
import MidnightOil from '@/components/awards/welcome/midnightOil.svg';
import MidnightOilUnachieved from '@/components/awards/welcome/midnightOilUnachieved.svg';
import AForEffort from '@/components/awards/welcome/aForEffort.svg';
import AForEffortUnachieved from '@/components/awards/welcome/aForEffortUnachieved.svg';
import NiceChatting from '@/components/awards/welcome/niceChatting.svg';
import NiceChattingUnachieved from '@/components/awards/welcome/niceChattingUnachieved.svg';
import Ruby from '@/components/awards/welcome/ruby.svg';
import RubyUnachieved from '@/components/awards/welcome/rubyUnachieved.svg';
import Diamond from '@/components/awards/welcome/diamond.svg';
import DiamondUnachieved from '@/components/awards/welcome/diamondUnachieved.svg';
import BestPals from '@/components/awards/welcome/bestPals.svg';
import BestPalsUnachieved from '@/components/awards/welcome/bestPalsUnachieved.svg';

// Lifetime badge SVG imports
import FirstSprout from '@/components/awards/lifetime/firstSprout.svg';
import FirstSproutUnachieved from '@/components/awards/lifetime/firstSproutUnachieved.svg';
import Blooming from '@/components/awards/lifetime/blooming.svg';
import BloomingUnachieved from '@/components/awards/lifetime/bloomingUnachieved.svg';
import FruitsOfLabour from '@/components/awards/lifetime/fruitsOfLabour.svg';
import FruitsOfLabourUnachieved from '@/components/awards/lifetime/fruitsOfLabourUnachieved.svg';
import StrongAndSteady from '@/components/awards/lifetime/strong&Steady.svg';
import StrongAndSteadyUnachieved from '@/components/awards/lifetime/strong&SteadyUnachieved.svg';
import NewHeights from '@/components/awards/lifetime/newHeights.svg';
import NewHeightsUnachieved from '@/components/awards/lifetime/newHeightsUnachieved.svg';
import AboveAndBeyond from '@/components/awards/lifetime/above&Beyond.svg';
import AboveAndBeyondUnachieved from '@/components/awards/lifetime/above&BeyondUnachieved.svg';
import Bronze from '@/components/awards/lifetime/bronze.svg';
import Silver from '@/components/awards/lifetime/silver.svg';
import Gold from '@/components/awards/lifetime/gold.svg';
import MedalUnachieved from '@/components/awards/lifetime/medalUnachieved.svg';
import ToTheMoon from '@/components/awards/lifetime/toTheMoon.svg';
import ToTheMoonUnachieved from '@/components/awards/lifetime/toTheMoonUnachieved.svg';
import SlowAndSteady from '@/components/awards/lifetime/slow&Steady.svg';
import SlowAndSteadyUnachieved from '@/components/awards/lifetime/slow&SteadyUnachieved.svg';
import FastAndFurious from '@/components/awards/lifetime/fast&Furious.svg';
import FastAndFuriousUnachieved from '@/components/awards/lifetime/fast&FuriousUnachieved.svg';
import Formula1 from '@/components/awards/lifetime/formula1.svg';
import Formula1Unachieved from '@/components/awards/lifetime/formula1Unachieved.svg';
import Supersonic from '@/components/awards/lifetime/supersonic.svg';
import SupersonicUnachieved from '@/components/awards/lifetime/supersonicUnachieved.svg';

// Custom badge SVG imports
import DontWishJustWorkForIt from '@/components/awards/custom/dontWishJustWorkForIt.svg';
import DontWishJustWorkForItUnachieved from '@/components/awards/custom/dontWishJustWorkForItUnachieved.svg';
import DoYourBest from '@/components/awards/custom/doYourBest.svg';
import DoYourBestUnachieved from '@/components/awards/custom/doYourBestUnachieved.svg';
import GoForIt from '@/components/awards/custom/goForIt.svg';
import GoForItUnachieved from '@/components/awards/custom/goForItUnachieved.svg';
import HungryForSuccess from '@/components/awards/custom/hungryForSuccess.svg';
import HungryForSuccessUnachieved from '@/components/awards/custom/hungryForSuccessUnachieved.svg';
import KeepFighting from '@/components/awards/custom/keepFighting.svg';
import KeepFightingUnachieved from '@/components/awards/custom/keepFightingUnachieved.svg';
import KeepUpGoodWork from '@/components/awards/custom/keepUpGoodWork.svg';
import KeepUpGoodWorkUnachieved from '@/components/awards/custom/keepUpGoodWorkUnachieved.svg';
import MakeAComeback from '@/components/awards/custom/makeAComeback.svg';
import MakeAComebackUnachieved from '@/components/awards/custom/makeAComeBackUnachieved.svg';
import NeverGiveUp from '@/components/awards/custom/neverGiveUp.svg';
import NeverGiveUpUnachieved from '@/components/awards/custom/neverGiveUpUnachieved.svg';
import SkysTheLimit from '@/components/awards/custom/skysTheLimit.svg';
import SkysTheLimitUnachieved from '@/components/awards/custom/skysTheLimitUnachieved.svg';
import StayStrong from '@/components/awards/custom/stayStrong.svg';
import StayStrongUnachieved from '@/components/awards/custom/stayStrongUnachieved.svg';
import ThereYouGo from '@/components/awards/custom/thereYouGo.svg';
import ThereYouGoUnachieved from '@/components/awards/custom/thereYouGoUnachieved.svg';
import YouveGotThis from '@/components/awards/custom/youveGotThis.svg';
import YouveGotThisUnachieved from '@/components/awards/custom/youveGotThisUnachieved.svg';
import { Calendar } from 'react-native-calendars';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { getLongestStreakData, LongestStreakData, getAllStudiedDates } from '@/db/grades';
import { statisticsCache, CACHE_KEYS, refreshAllStatistics } from '@/utils/statisticsCache';
import { formatDate, getLocalDateKey } from '@/utils/dateFormat';
import { db } from '@/db/index';
import { getCurrentUserID, createCustomBadge, fetchCustomBadges, CustomBadgeData } from '@/db/decks';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTopBarStatisticsHeight } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedScreenTransition } from '@/utils/performanceOptimizations';
const LargeMeshBackground1 = require('@/assets/awardsBackgrounds/LargeMeshBackground1.png');
const LargeMeshBackground2 = require('@/assets/awardsBackgrounds/LargeMeshBackground2.png');
const LargeMeshBackground4 = require('@/assets/awardsBackgrounds/LargeMeshBackground4.png');

const CELL_HEIGHT = 90; // or any value you prefer
const ICON_SIZE = 70;   // make icons larger to match cell size

const NumberPickerItem = React.memo(({ num, idx, scrollX, themeColors, ITEM_WIDTH }: {
  num: number;
  idx: number;
  scrollX: Animated.Value;
  themeColors: any;
  ITEM_WIDTH: number;
}) => {
  // Pre-calculate input range to avoid recalculation
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
});

const NumberPicker = React.memo(({ value, setValue, min, max, themeColors }: { value: number, setValue: (v: number) => void, min: number, max: number, themeColors: any }) => {
  const numbers = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [min, max]);
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
  const handleMomentumScrollEnd = useCallback((e: any) => {
    setScrolling(false);
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / ITEM_WIDTH);
    setValue(numbers[idx]);
  }, [numbers, setValue, ITEM_WIDTH]);

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
        {numbers.map((num, idx) => (
          <NumberPickerItem
            key={num}
            num={num}
            idx={idx}
            scrollX={scrollX}
            themeColors={themeColors}
            ITEM_WIDTH={ITEM_WIDTH}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
});

const CustomGoalForm = React.memo(({ setScrollEnabled, themeColors }: { setScrollEnabled?: (enabled: boolean) => void, themeColors: any }) => {
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
  const handleSubmit = useCallback(async () => {
    if (!signature) return;
    
    // Create custom badge in database
    try {
      const result = await createCustomBadge({
        numberOfDecksPledged: decks,
        numberOfConsecutiveDays: days
      });
      
      if (!result.success) {
        console.error('Failed to create custom badge');
        // Still show the modal even if badge creation fails
      }
    } catch (error) {
      console.error('Error creating custom badge:', error);
      // Still show the modal even if badge creation fails
    }
    
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
  }, [signature, decks, days, setIsMenuOpen, setIsSubmitCustomFormModalOpen, menuOverlayOpacity, submitCustomFormModalOpacity]);

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
                  <Path d={signature} stroke={themeColors.text} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {currentPoints.length > 1 && (
                  <Path d={pointsToSvgPath(currentPoints)} stroke={themeColors.text} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
});

const StreakCalendarStats = React.memo(({ themeColors }: { themeColors: any }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
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

  // Streak data fetching with caching
  const fetchStreakData = useCallback(async () => {
    try {
      setIsLoading(true);
      const streakData = await statisticsCache.getCachedOrFetch(
        CACHE_KEYS.LONGEST_STREAK_DATA,
        getLongestStreakData
      );
      setStreakData(streakData);
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

  // Optimized data loading on screen focus
  useEffect(() => {
    if (isFocused) {
      fetchStreakData();
    }
  }, [isFocused, fetchStreakData]);

  return (
    <View style={{ marginHorizontal: 16, marginTop: 20,}}>
      {/* First row - Title */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={[styles.title, { color: themeColors.text }]}>{strings[language].longestStreak}</Text>
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
            {theme === 'dark' ? (
              <DecksStudiedIconDarkMode width={ICON_SIZE} height={ICON_SIZE} style={{marginRight: 110}}/>
            ) : (
              <DecksStudiedIcon width={ICON_SIZE} height={ICON_SIZE} style={{marginRight: 110}}/>
            )}
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
            {theme === 'dark' ? (
              <FlashcardsStudiedIconDarkMode width={60} height={60} style={{marginRight: 110}}/>
            ) : (
              <FlashcardsStudiedIcon width={60} height={60} style={{marginRight: 110}}/>
            )}
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
});

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

// Memoized day component for better performance
const CalendarDay = React.memo(({ date, state, streakInfo, today }: {
  date: any;
  state: string;
  streakInfo: { [date: string]: 'start' | 'middle' | 'end' | 'single' | 'studied' };
  today: string;
}) => {
  if (!date) return null;
  
  const { theme } = useTheme();
  const colors = Colors[theme as keyof typeof Colors];
  
  const dateStr = date.dateString;
  const info = streakInfo[dateStr];
  
  // Pre-calculate all conditions to avoid repeated checks
  const isStreak = info === 'start' || info === 'middle' || info === 'end';
  const isStudiedOnly = info === 'studied';
  const isToday = dateStr === today;
  const isDisabled = state === 'disabled';
  
  // Pre-calculate styles
  const circleStyle = useMemo(() => ({
    position: 'absolute' as const,
    width: 28,
    height: 28,
    backgroundColor: isStreak ? (theme === 'dark' ? 'transparent' : '#5bcfff') : '#FFCE51',
    borderWidth: isStreak && theme === 'dark' ? 2 : 0,
    borderColor: isStreak && theme === 'dark' ? '#5bcfff' : 'transparent',
    borderRadius: 99,
    top: 4,
    left: 4,
    zIndex: 1,
  }), [isStreak, theme]);

  const textStyle = useMemo(() => ({
    color: isToday ? colors.brandColor2 : (isDisabled ? colors.unselectedText : colors.text),
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    zIndex: 3,
    fontWeight: isToday ? 'bold' as const : 'normal' as const,
    ...(isToday && {
      borderWidth: 2,
      borderColor: colors.brandColor2,
      borderRadius: 28,
      width: 28,
      height: 28,
      textAlign: 'center' as const,
      textAlignVertical: 'center' as const,
      lineHeight: 20,
    }),
  }), [isToday, isDisabled, colors]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36, position: 'relative' }}>
      {/* Circle for studied or streak */}
      {(isStreak || isStudiedOnly) && <View style={circleStyle} />}
      
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
      <Text style={textStyle}>
        {date.day}
      </Text>
    </View>
  );
});

const StreakCalendar = React.memo(() => {
  const [studiedDates, setStudiedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Studied dates fetching with caching
  const fetchStudiedDates = useCallback(async () => {
    try {
      setIsLoading(true);
      const studiedDates = await statisticsCache.getCachedOrFetch(
        CACHE_KEYS.ALL_STUDIED_DATES,
        getAllStudiedDates
      );
      setStudiedDates(studiedDates);
    } catch (error) {
      setStudiedDates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized data loading on screen focus
  useEffect(() => {
    if (isFocused) {
      fetchStudiedDates();
    }
  }, [isFocused, fetchStudiedDates]);

  // Use memoized streak info calculation
  const streakInfo = memoizedGetStreakInfo(studiedDates);
  
  // Memoize today's date (localized) to prevent recalculation for every calendar day
  const today = useMemo(() => getLocalDateKey(new Date()), []);

  // Memoized calendar theme to prevent recreating object
  const calendarTheme = useMemo(() => {
    const colors = Colors[theme as keyof typeof Colors];
    return {
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.unselectedText,
      selectedDayBackgroundColor: colors.brandColor2,
      selectedDayTextColor: colors.contrastText,
      todayTextColor: colors.brandColor2,
      dayTextColor: colors.text,
      textDisabledColor: colors.unselectedText,
      dotColor: '#FFCE51',
      monthTextColor: colors.text,
      textMonthFontFamily: Fonts.bodyMedium,
      textDayHeaderFontFamily: Fonts.bodyMedium,
      textDayFontFamily: Fonts.bodyMedium,
      textDayHeaderFontSize: 14,
      textMonthFontSize: 20,
      arrowColor: colors.text,
    };
  }, [theme]);

  const dayComponent = useCallback(({ date, state }: any) => (
    <CalendarDay
      date={date}
      state={state}
      streakInfo={streakInfo}
      today={today}
    />
  ), [streakInfo, today]);

  return (
    <View style={{ marginTop: 30, width: '100%', paddingHorizontal: 16 }}>
      <Calendar
        markingType={'custom'}
        disableAllTouchEventsForDisabledDays={true}
        dayComponent={dayComponent}
        theme={calendarTheme}
      />
    </View>
  );
});

interface BadgeData {
  badgeTitle: string;
  achieved: boolean;
  badgeImage?: any;
  badgeCreatedDate: string; // ISO string
  badgeExpiryDate?: string;
  streakBadgeSVG?: any;
  welcomeBadgeSVG?: any;
  lifetimeBadgeSVG?: any;
  customBadgeSVG?: any;
  dayStreakRequirement?: number; // For streak badges ordering
  badgeSubtext?: string; // For badge subtext
  badgeOrder?: number; // For welcome badges ordering
  expired?: boolean; // For custom badges
}

interface StreakBadgeData {
  badgeName: string;
  badgeSubtext: string;
  dayStreakRequirement: number;
  badgeImageName: string;
  userIDs: string;
  achieved: boolean;
}

interface WelcomeBadgeData {
  badgeName: string;
  badgeSubtext: string;
  badgeImageName: string;
  userIDs: string;
  achieved: boolean;
  badgeOrder: number;
}

interface LifetimeBadgeData {
  badgeName: string;
  badgeSubtext: string;
  badgeImageName: string;
  userIDs: string;
  achieved: boolean;
  badgeOrder: number;
}

// Function to get streak badge SVG component
const getStreakBadgeSVG = (badgeImageName: string, achieved: boolean) => {
  const svgMap: { [key: string]: { achieved: any, unachieved: any } } = {
    'firstFlame': { achieved: FirstFlame, unachieved: FirstFlameUnachieved },
    'ember': { achieved: Ember, unachieved: EmberUnachieved },
    'letHimCook': { achieved: LetHimCook, unachieved: LetHimCookUnachieved },
    'firefly': { achieved: Firefly, unachieved: FireflyUnachieved },
    'campfire': { achieved: Campfire, unachieved: CampfireUnachieved },
    'doublePower': { achieved: DoublePower, unachieved: DoublePowerUnachieved },
    'starStudent': { achieved: StarStudent, unachieved: StarStudentUnachieved },
    'professor': { achieved: Professor, unachieved: ProfessorUnachieved },
    'unstoppable': { achieved: Unstoppable, unachieved: UnstoppableUnachieved },
    'hot&Spicy': { achieved: HotSpicy, unachieved: HotSpicyUnachieved },
    'volcano': { achieved: Volcano, unachieved: VolcanoUnachieved },
    'meteor': { achieved: Meteor, unachieved: MeteorUnachieved },
    'dragon': { achieved: Dragon, unachieved: DragonUnachieved },
    'supernova': { achieved: Supernova, unachieved: SupernovaUnachieved },
    'royalty': { achieved: Royalty, unachieved: RoyaltyUnachieved },
    'phoenix': { achieved: Phoenix, unachieved: PhoenixUnachieved },
  };
  
  const svgComponents = svgMap[badgeImageName];
  if (!svgComponents) {
    console.warn(`Unknown badge image name: ${badgeImageName}`);
    return null;
  }
  
  return achieved ? svgComponents.achieved : svgComponents.unachieved;
};

// Function to get welcome badge SVG component
const getWelcomeBadgeSVG = (badgeImageName: string, achieved: boolean) => {
  const svgMap: { [key: string]: { achieved: any, unachieved: any } } = {
    'beginnings': { achieved: Beginnings, unachieved: BeginningsUnachieved },
    'firstSteps': { achieved: FirstSteps, unachieved: FirstStepsUnachieved },
    'aiConnection': { achieved: AiConnection, unachieved: AiConnectionUnachieved },
    'fileFrenzy': { achieved: FileFrenzy, unachieved: FileFrenzyUnachieved },
    'youtubeForm': { achieved: YoutubeForm, unachieved: YoutubeFormUnachieved },
    'personalTouch': { achieved: PersonalTouch, unachieved: PersonalTouchUnachieved },
    'midnightOil': { achieved: MidnightOil, unachieved: MidnightOilUnachieved },
    'aForEffort': { achieved: AForEffort, unachieved: AForEffortUnachieved },
    'niceChatting': { achieved: NiceChatting, unachieved: NiceChattingUnachieved },
    'ruby': { achieved: Ruby, unachieved: RubyUnachieved },
    'diamond': { achieved: Diamond, unachieved: DiamondUnachieved },
    'bestPals': { achieved: BestPals, unachieved: BestPalsUnachieved },
  };
  
  const svgComponents = svgMap[badgeImageName];
  if (!svgComponents) {
    console.warn(`Unknown welcome badge image name: ${badgeImageName}`);
    return null;
  }
  
  return achieved ? svgComponents.achieved : svgComponents.unachieved;
};

// Function to get lifetime badge SVG component (uses lifetime badge SVGs)
const getLifetimeBadgeSVG = (badgeImageName: string, achieved: boolean) => {
  const svgMap: { [key: string]: { achieved: any, unachieved: any } } = {
    'firstSprout': { achieved: FirstSprout, unachieved: FirstSproutUnachieved },
    'blooming': { achieved: Blooming, unachieved: BloomingUnachieved },
    'fruitsOfLabour': { achieved: FruitsOfLabour, unachieved: FruitsOfLabourUnachieved },
    'strong&Steady': { achieved: StrongAndSteady, unachieved: StrongAndSteadyUnachieved },
    'newHeights': { achieved: NewHeights, unachieved: NewHeightsUnachieved },
    'above&Beyond': { achieved: AboveAndBeyond, unachieved: AboveAndBeyondUnachieved },
    'bronze': { achieved: Bronze, unachieved: MedalUnachieved },
    'silver': { achieved: Silver, unachieved: MedalUnachieved },
    'gold': { achieved: Gold, unachieved: MedalUnachieved },
    'toTheMoon': { achieved: ToTheMoon, unachieved: ToTheMoonUnachieved },
    'slow&Steady': { achieved: SlowAndSteady, unachieved: SlowAndSteadyUnachieved },
    'fast&Furious': { achieved: FastAndFurious, unachieved: FastAndFuriousUnachieved },
    'formula1': { achieved: Formula1, unachieved: Formula1Unachieved },
    'supersonic': { achieved: Supersonic, unachieved: SupersonicUnachieved },
  };
  
  const svgComponents = svgMap[badgeImageName];
  if (!svgComponents) {
    console.warn(`Unknown lifetime badge image name: ${badgeImageName}`);
    return null;
  }
  
  return achieved ? svgComponents.achieved : svgComponents.unachieved;
};

// Function to get custom badge SVG component
const getCustomBadgeSVG = (badgeImageName: string, achieved: boolean) => {
  const svgMap: { [key: string]: { achieved: any, unachieved: any } } = {
    'dontWishJustWorkForIt': { achieved: DontWishJustWorkForIt, unachieved: DontWishJustWorkForItUnachieved },
    'doYourBest': { achieved: DoYourBest, unachieved: DoYourBestUnachieved },
    'goForIt': { achieved: GoForIt, unachieved: GoForItUnachieved },
    'hungryForSuccess': { achieved: HungryForSuccess, unachieved: HungryForSuccessUnachieved },
    'keepFighting': { achieved: KeepFighting, unachieved: KeepFightingUnachieved },
    'keepUpGoodWork': { achieved: KeepUpGoodWork, unachieved: KeepUpGoodWorkUnachieved },
    'makeAComeback': { achieved: MakeAComeback, unachieved: MakeAComebackUnachieved },
    'neverGiveUp': { achieved: NeverGiveUp, unachieved: NeverGiveUpUnachieved },
    'skysTheLimit': { achieved: SkysTheLimit, unachieved: SkysTheLimitUnachieved },
    'stayStrong': { achieved: StayStrong, unachieved: StayStrongUnachieved },
    'thereYouGo': { achieved: ThereYouGo, unachieved: ThereYouGoUnachieved },
    'youveGotThis': { achieved: YouveGotThis, unachieved: YouveGotThisUnachieved },
  };
  
  const svgComponents = svgMap[badgeImageName];
  if (!svgComponents) {
    console.warn(`Unknown custom badge image name: ${badgeImageName}`);
    return null;
  }
  
  return achieved ? svgComponents.achieved : svgComponents.unachieved;
};

// Function to fetch streak badges from database
const fetchStreakBadges = async (): Promise<StreakBadgeData[]> => {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, dayStreakRequirement, badgeImageName, userIDs
      FROM streakBadgesTable
      ORDER BY dayStreakRequirement ASC
    `);
    
    return result.map((badge: any) => {
      const userIDs = JSON.parse(badge.userIDs || '[]');
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        dayStreakRequirement: badge.dayStreakRequirement,
        badgeImageName: badge.badgeImageName,
        userIDs: badge.userIDs,
        achieved: userIDs.includes(userID)
      };
    });
  } catch (error) {
    console.error('Error fetching streak badges:', error);
    return [];
  }
};

// Function to fetch welcome badges from database
const fetchWelcomeBadges = async (): Promise<WelcomeBadgeData[]> => {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, badgeImageName, userIDs, badgeOrder
      FROM welcomeBadgesTable
      ORDER BY badgeOrder ASC
    `);
    
    return result.map((badge: any) => {
      const userIDs = JSON.parse(badge.userIDs || '[]');
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        badgeImageName: badge.badgeImageName,
        userIDs: badge.userIDs,
        achieved: userIDs.includes(userID),
        badgeOrder: badge.badgeOrder
      };
    });
  } catch (error) {
    console.error('Error fetching welcome badges:', error);
    return [];
  }
};

// Function to fetch lifetime badges from database
const fetchLifetimeBadges = async (): Promise<LifetimeBadgeData[]> => {
  try {
    const userID = await getCurrentUserID();
    const result = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, badgeImageName, userIDs, badgeOrder
      FROM lifetimeBadgesTable
      ORDER BY badgeOrder ASC
    `);
    
    return result.map((badge: any) => {
      const userIDs = JSON.parse(badge.userIDs || '[]');
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        badgeImageName: badge.badgeImageName,
        userIDs: badge.userIDs,
        achieved: userIDs.includes(userID),
        badgeOrder: badge.badgeOrder
      };
    });
  } catch (error) {
    console.error('Error fetching lifetime badges:', error);
    return [];
  }
};

// Pre-calculate hexagon points to avoid recalculation
const getHexagonPoints = (size: number, borderWidth: number, svgSize: number) => {
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
};

// Cache hexagon calculations
const hexagonCache = new Map<string, { outerPointsStr: string, innerPointsStr: string }>();

const Badge = React.memo(({ title, image, achieved, themeColors, streakBadgeSVG, welcomeBadgeSVG, lifetimeBadgeSVG, subtext }: { title: string, image?: ImageSourcePropType, achieved: boolean, themeColors: any, streakBadgeSVG?: any, welcomeBadgeSVG?: any, lifetimeBadgeSVG?: any, subtext?: string }) => {
  const badgeWidth = 146;
  const badgeHeight = 179;
  const borderWidth = 8;
  const cornerRadius = 20;
  
  // Use lifetimeBadgeSVG if provided, then welcomeBadgeSVG, then streakBadgeSVG
  const badgeSVG = lifetimeBadgeSVG || welcomeBadgeSVG || streakBadgeSVG;

  return (
    <View style={{ alignItems: 'center', width: badgeWidth, height: badgeHeight, position: 'relative' }}>
      {/* Main badge container */}
      <View
        style={{
          width: badgeWidth,
          height: badgeHeight,
          borderRadius: cornerRadius,
          borderWidth: borderWidth,
          borderColor: achieved ? '#FFFFFF' : '#D5D4DD',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Column layout inside container */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Hexagon container with relative positioning */}
          <View style={{ position: 'relative', width: 97, height: 97 }}>
            {/* Hexagon badge SVG */}
            {achieved ? (
              <HexagonBadge width={97} height={97} />
            ) : (
              <HexagonBadgeUnachieved width={97} height={97} />
            )}
            
            {/* Badge SVG in center of hexagon */}
            {badgeSVG && (
              <View style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0,
                bottom: 0,
                justifyContent: 'center', 
                alignItems: 'center',
                zIndex: 2
              }}>
                <View style={{
                  transform: [
                    { translateX: title === 'Double Power' ? 2 : 0 },
                    { rotate: title === 'Supersonic' ? '45deg' : '0deg' }
                  ]
                }}>
                  {React.createElement(badgeSVG, { width: 43, height: 43 })}
                </View>
              </View>
            )}
          </View>
          
          {/* First row of text */}
          <Text
            style={{
              fontFamily: Fonts.bodyBold,
              fontSize: 16,
              color: achieved ? themeColors.text : themeColors.text,
              opacity: achieved ? 1 : 0.3,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
          
          {/* Second row of text */}
          <Text
            style={{
              fontFamily: Fonts.bodyMedium,
              fontSize: 12,
              color: achieved ? themeColors.text : themeColors.text,
              opacity: achieved ? 1 : 0.3,
              marginTop: 2,
              textAlign: 'center',
            }}
          >
            {subtext || 'Subtext'}
          </Text>
        </View>
      </View>
      
      {/* Black overlay for unachieved badges */}
      {!achieved && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: badgeWidth,
            height: badgeHeight,
            borderRadius: cornerRadius,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
    </View>
  );
});

// Helper function to format date range for custom badges
const parseLocalDateKey = (key: string): Date => {
  const [yearStr, monthStr, dayStr] = key.split('-');
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
};

const formatDateRange = (dateCreated: string, expiryDate: string, language: string): string => {
  try {
    const startKey = getLocalDateKey(dateCreated);
    const endKey = getLocalDateKey(expiryDate);
    if (!startKey || !endKey) {
      return '';
    }
    const startDate = parseLocalDateKey(startKey);
    const endDate = parseLocalDateKey(endKey);
    const startLabel = formatDate(startDate.toISOString(), language);
    const endLabel = formatDate(endDate.toISOString(), language);
    return `${startLabel} - ${endLabel}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '';
  }
};

const CustomBadge = React.memo(({ image, achieved, expired, themeColors, customBadgeSVG, subtext, dateRange }: { image?: ImageSourcePropType, achieved: boolean, expired?: boolean, themeColors: any, customBadgeSVG?: any, subtext?: string, dateRange?: string }) => {
  const badgeWidth = 146;
  const badgeHeight = 179;
  const borderWidth = 8;
  const cornerRadius = 20;
  const imageMargin = 12; // Margin for image horizontally and vertically
  
  // Use expired state styling if expired, otherwise use achieved/unachieved
  const isUnachieved = expired || !achieved;
  
  // Calculate image area dimensions (full width minus border and margins)
  const imageAreaWidth = badgeWidth - (borderWidth * 2) - (imageMargin * 2);
  
  return (
    <View style={{ alignItems: 'center', width: badgeWidth, height: badgeHeight, position: 'relative' }}>
      {/* Main badge container */}
      <View
        style={{
          width: badgeWidth,
          height: badgeHeight,
          borderRadius: cornerRadius,
          borderWidth: borderWidth,
          borderColor: achieved && !expired ? '#FFFFFF' : '#D5D4DD',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          paddingBottom: 12,
          overflow: 'hidden',
        }}
      >
        {/* Image container - fills available space with margins */}
        {(customBadgeSVG || image) && (
          <View style={{
            flex: 1,
            width: '100%',
            marginHorizontal: imageMargin,
            marginTop: imageMargin,
            marginBottom: imageMargin,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {customBadgeSVG && (
              <View style={{ width: imageAreaWidth, height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                {React.createElement(customBadgeSVG, { width: imageAreaWidth, height: imageAreaWidth })}
              </View>
            )}
            {image && (
              <RNImage source={image} style={{ width: imageAreaWidth, height: imageAreaWidth, resizeMode: 'contain' }} />
            )}
          </View>
        )}
        
        {/* Text container at bottom */}
        <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
          {/* Subtext (first line) */}
          <Text
            style={{
              fontFamily: Fonts.bodyMedium,
              fontSize: 12,
              color: achieved && !expired ? themeColors.text : themeColors.text,
              opacity: achieved && !expired ? 1 : 0.3,
              textAlign: 'center',
            }}
          >
            {subtext || 'Subtext'}
          </Text>
          
          {/* Date range (second line) */}
          {dateRange && (
            <Text
              style={{
                fontFamily: Fonts.bodyMedium,
                fontSize: 12,
                color: achieved && !expired ? themeColors.text : themeColors.text,
                opacity: achieved && !expired ? 1 : 0.3,
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              {dateRange}
            </Text>
          )}
        </View>
      </View>
      
      {/* Black overlay for unachieved/expired badges */}
      {isUnachieved && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: badgeWidth,
            height: badgeHeight,
            borderRadius: cornerRadius,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
      
      {/* Expired text overlay */}
      {expired && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 4,
            marginTop: -24,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bodyBold,
              fontSize: 36,
              color: themeColors.contrastText,
              transform: [{ rotate: '-45deg' }],
            }}
          >
            Expired
          </Text>
        </View>
      )}
    </View>
  );
});

// Update BadgeWall props
type BadgeWallProps = {
  badges: BadgeData[],
  backgroundImage: any,
  title: string,
};

// Memoized BadgeRow component for better performance
const BadgeRow = React.memo(({ row, themeColors, isCustomBadge, language }: { row: (BadgeData | null)[], themeColors: any, isCustomBadge?: boolean, language: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
    <View style={{ width: "50%", justifyContent: 'center', alignItems: 'center', paddingRight: 10 }}>
      {row[0] && (
        isCustomBadge ? (
          <CustomBadge
            achieved={row[0].achieved}
            expired={row[0].expired}
            themeColors={themeColors}
            customBadgeSVG={row[0].customBadgeSVG}
            subtext={row[0].badgeSubtext}
            dateRange={row[0].badgeCreatedDate && row[0].badgeExpiryDate ? formatDateRange(row[0].badgeCreatedDate, row[0].badgeExpiryDate, language) : undefined}
          />
        ) : (
          <Badge
            title={row[0].badgeTitle}
            achieved={row[0].achieved}
            image={row[0].badgeImage}
            themeColors={themeColors}
            streakBadgeSVG={row[0].streakBadgeSVG}
            welcomeBadgeSVG={row[0].welcomeBadgeSVG}
            lifetimeBadgeSVG={row[0].lifetimeBadgeSVG}
            subtext={row[0].badgeSubtext}
          />
        )
      )}
    </View>
    <View style={{ width: "50%", justifyContent: 'center', alignItems: 'center', paddingLeft: 10 }}>
      {row[1] && (
        isCustomBadge ? (
          <CustomBadge
            achieved={row[1].achieved}
            expired={row[1].expired}
            themeColors={themeColors}
            customBadgeSVG={row[1].customBadgeSVG}
            subtext={row[1].badgeSubtext}
            dateRange={row[1].badgeCreatedDate && row[1].badgeExpiryDate ? formatDateRange(row[1].badgeCreatedDate, row[1].badgeExpiryDate, language) : undefined}
          />
        ) : (
          <Badge
            title={row[1].badgeTitle}
            achieved={row[1].achieved}
            image={row[1].badgeImage}
            themeColors={themeColors}
            streakBadgeSVG={row[1].streakBadgeSVG}
            welcomeBadgeSVG={row[1].welcomeBadgeSVG}
            lifetimeBadgeSVG={row[1].lifetimeBadgeSVG}
            subtext={row[1].badgeSubtext}
          />
        )
      )}
    </View>
  </View>
));

const BadgeWall = React.memo(({ badges, backgroundImage, title, themeColors }: BadgeWallProps & { themeColors: any }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [viewAll, setViewAll] = useState(false);
  const animationConfig = useMemo(() => getAnimationConfig(), []);
  
  // Memoize expensive calculations
  const { sortedBadges, badgeRows, collapsedHeight, expandedHeight, isCustomBadgeWall } = useMemo(() => {
    // Check if this is a streak badge wall (has dayStreakRequirement)
    const isStreakBadgeWall = badges.some(b => b.dayStreakRequirement !== undefined);
    // Check if this is a welcome badge wall (has badgeOrder and welcomeBadgeSVG)
    const isWelcomeBadgeWall = badges.some(b => b.badgeOrder !== undefined && b.welcomeBadgeSVG);
    // Check if this is a lifetime badge wall (has badgeOrder and lifetimeBadgeSVG)
    const isLifetimeBadgeWall = badges.some(b => b.badgeOrder !== undefined && b.lifetimeBadgeSVG);
    // Check if this is a custom badge wall (has customBadgeSVG)
    const isCustomBadgeWall = badges.some(b => b.customBadgeSVG !== undefined);
    
    let sorted;
    if (isStreakBadgeWall) {
      // For streak badges, sort by dayStreakRequirement ascending regardless of achievement
      sorted = [...badges].sort((a, b) => (a.dayStreakRequirement || 0) - (b.dayStreakRequirement || 0));
    } else if (isWelcomeBadgeWall) {
      // For welcome badges, sort by achievement status first, then by badgeOrder
      sorted = [...badges].sort((a, b) => {
        if (a.achieved && !b.achieved) return -1; // a (achieved) comes first
        if (!a.achieved && b.achieved) return 1;  // b (achieved) comes first
        return (a.badgeOrder || 0) - (b.badgeOrder || 0); // Maintain ascending order within group
      });
    } else if (isLifetimeBadgeWall) {
      // For lifetime badges, sort by achievement status first, then by badgeOrder
      sorted = [...badges].sort((a, b) => {
        if (a.achieved && !b.achieved) return -1; // a (achieved) comes first
        if (!a.achieved && b.achieved) return 1;  // b (achieved) comes first
        return (a.badgeOrder || 0) - (b.badgeOrder || 0); // Maintain ascending order within group
      });
    } else if (isCustomBadgeWall) {
      // For custom badges, sort by: achieved first, then unachieved, then expired (all by date created descending)
      sorted = [
        // Achieved badges first (date created descending)
        ...badges.filter(b => b.achieved && !b.expired).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
        // Unachieved badges second (date created descending)
        ...badges.filter(b => !b.achieved && !b.expired).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
        // Expired badges third (date created descending)
        ...badges.filter(b => b.expired).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
      ];
    } else {
      // For other badges, sort by achievement status and creation date
      sorted = [
        ...badges.filter(b => !b.achieved).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
        ...badges.filter(b => b.achieved).sort((a, b) => b.badgeCreatedDate.localeCompare(a.badgeCreatedDate)),
      ];
    }
    
    // Group into rows of 2
    const rows = [];
    for (let i = 0; i < sorted.length; i += 2) {
      rows.push([
        sorted[i],
        sorted[i + 1] || null,
      ]);
    }
    
    const rowHeight = 179 + 16; // badge height + marginBottom
    const collapsed = rowHeight * Math.min(2, rows.length); // Show up to 2 rows, or 1 row if that's all there is
    const expanded = rowHeight * rows.length; // Just the rows, no extra padding
    
    return { sortedBadges: sorted, badgeRows: rows, collapsedHeight: collapsed, expandedHeight: expanded, isCustomBadgeWall };
  }, [badges]);

  const anim = useRef(new Animated.Value(collapsedHeight)).current;
  
  useEffect(() => {
    if (animationConfig.isLowEndDevice) {
      // Instant expansion for low-end devices
      anim.setValue(viewAll ? expandedHeight : collapsedHeight);
    } else {
      // Animated expansion for high-end devices
      Animated.timing(anim, {
        toValue: viewAll ? expandedHeight : collapsedHeight,
        duration: animationConfig.duration * 2,
        useNativeDriver: false,
      }).start();
    }
  }, [viewAll, expandedHeight, collapsedHeight, animationConfig]);

  // Only render the rows that are visible (lazy loading for collapsed state)
  const visibleRows = useMemo(() => {
    return viewAll ? badgeRows : badgeRows.slice(0, 2);
  }, [badgeRows, viewAll]);

  const toggleViewAll = useCallback(() => setViewAll(v => !v), []);

  // Memoize styles
  const containerStyle = useMemo(() => ({
    width: '100%' as const,
    borderRadius: 30,
    overflow: 'hidden' as const,
    backgroundColor: theme === 'dark' ? themeColors.secondaryShade : '#fff',
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
  }), [theme, themeColors.secondaryShade]);

  const backgroundImageStyle = useMemo(() => ({
    position: 'absolute' as const,
    width: '100%' as const,
    height: '100%' as const,
    resizeMode: 'cover' as const,
  }), []);

  const titleStyle = useMemo(() => ({
    fontFamily: Fonts.title,
    fontSize: 36,
    color: themeColors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  }), [themeColors.text]);

  const buttonStyle = useMemo(() => ({
    width: 100,
    height: 48,
    backgroundColor: themeColors.brandColor2,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }), [themeColors.brandColor2]);

  const buttonTextStyle = useMemo(() => ({
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    textAlign: 'center' as const,
  }), []);

  return (
    <View style={containerStyle}>
      {/* Background image or colored rectangle */}
      {theme === 'dark' ? (
        <View style={[backgroundImageStyle, { backgroundColor: themeColors.secondaryShade, borderRadius: 30 }]} />
      ) : (
        <RNImage source={backgroundImage} style={backgroundImageStyle} />
      )}
      
      {/* Content column */}
      <View style={{ margin: 16, flex: 1 }}>
        <Text style={titleStyle}>{title}</Text>
        
        {/* Animated badge grid */}
        <Animated.View style={{ width: '100%', height: anim, overflow: 'hidden', marginTop: 16 }}>
          {visibleRows.map((row, idx) => (
          <BadgeRow key={idx} row={row} themeColors={themeColors} isCustomBadge={isCustomBadgeWall} language={language} />
          ))}
        </Animated.View>
      </View>
      
      {/* Toggle Button at the bottom */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={toggleViewAll} style={buttonStyle}>
          <Text style={buttonTextStyle}>
            {viewAll ? strings[language].collapse : strings[language].viewAll}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Streak Badges Component
const StreakBadges = React.memo(({ themeColors }: { themeColors: any }) => {
  const [streakBadges, setStreakBadges] = useState<BadgeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreakBadges = async () => {
      try {
        setIsLoading(true);
        const badges = await fetchStreakBadges();
        
        const badgeData: BadgeData[] = badges.map((badge) => {
          const streakBadgeSVG = getStreakBadgeSVG(badge.badgeImageName, badge.achieved);
          return {
            badgeTitle: badge.badgeName,
            achieved: badge.achieved,
            badgeImage: undefined,
            badgeCreatedDate: new Date().toISOString(), // Use current date as placeholder
            badgeExpiryDate: undefined,
            streakBadgeSVG: streakBadgeSVG,
            dayStreakRequirement: badge.dayStreakRequirement,
            badgeSubtext: badge.badgeSubtext
          };
        });
        
        setStreakBadges(badgeData);
      } catch (error) {
        console.error('Error loading streak badges:', error);
        setStreakBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreakBadges();
  }, []);

  if (isLoading) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: themeColors.text }}>Loading streak badges...</Text>
      </View>
    );
  }

  return (
    <BadgeWall 
      badges={streakBadges} 
      backgroundImage={LargeMeshBackground2} 
      title="Streak Badges" 
      themeColors={themeColors} 
    />
  );
});

// Welcome Badges Component
const WelcomeBadges = React.memo(({ themeColors }: { themeColors: any }) => {
  const { language } = useLanguage();
  const [welcomeBadges, setWelcomeBadges] = useState<BadgeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWelcomeBadges = async () => {
      try {
        setIsLoading(true);
        const badges = await fetchWelcomeBadges();
        
        const badgeData: BadgeData[] = badges.map((badge) => {
          const welcomeBadgeSVG = getWelcomeBadgeSVG(badge.badgeImageName, badge.achieved);
          return {
            badgeTitle: badge.badgeName,
            achieved: badge.achieved,
            badgeImage: undefined,
            badgeCreatedDate: new Date().toISOString(), // Use current date as placeholder
            badgeExpiryDate: undefined,
            welcomeBadgeSVG: welcomeBadgeSVG,
            badgeSubtext: badge.badgeSubtext,
            badgeOrder: badge.badgeOrder
          };
        });
        
        setWelcomeBadges(badgeData);
      } catch (error) {
        console.error('Error loading welcome badges:', error);
        setWelcomeBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWelcomeBadges();
  }, []);

  if (isLoading) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: themeColors.text }}>Loading welcome badges...</Text>
      </View>
    );
  }

  return (
    <BadgeWall 
      badges={welcomeBadges} 
      backgroundImage={LargeMeshBackground4} 
      title={strings[language].welcomeBadges} 
      themeColors={themeColors} 
    />
  );
});

// Lifetime Badges Component
const LifetimeBadges = React.memo(({ themeColors }: { themeColors: any }) => {
  const { language } = useLanguage();
  const [lifetimeBadges, setLifetimeBadges] = useState<BadgeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLifetimeBadges = async () => {
      try {
        setIsLoading(true);
        const badges = await fetchLifetimeBadges();
        
        const badgeData: BadgeData[] = badges.map((badge) => {
          const lifetimeBadgeSVG = getLifetimeBadgeSVG(badge.badgeImageName, badge.achieved);
          return {
            badgeTitle: badge.badgeName,
            achieved: badge.achieved,
            badgeImage: undefined,
            badgeCreatedDate: new Date().toISOString(), // Use current date as placeholder
            badgeExpiryDate: undefined,
            lifetimeBadgeSVG: lifetimeBadgeSVG,
            badgeSubtext: badge.badgeSubtext,
            badgeOrder: badge.badgeOrder
          };
        });
        
        setLifetimeBadges(badgeData);
      } catch (error) {
        console.error('Error loading lifetime badges:', error);
        setLifetimeBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLifetimeBadges();
  }, []);

  if (isLoading) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: themeColors.text }}>Loading lifetime badges...</Text>
      </View>
    );
  }

  return (
    <BadgeWall 
      badges={lifetimeBadges} 
      backgroundImage={LargeMeshBackground1} 
      title={strings[language].lifetimeBadges} 
      themeColors={themeColors} 
    />
  );
});

// Custom Badges Component
const CustomBadges = React.memo(({ themeColors }: { themeColors: any }) => {
  const { language } = useLanguage();
  const [customBadges, setCustomBadges] = useState<BadgeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomBadges = async () => {
      try {
        setIsLoading(true);
        const badges = await fetchCustomBadges();
        
        const badgeData: BadgeData[] = badges.map((badge) => {
          const isAchieved = badge.achieved === 1;
          const customBadgeSVG = getCustomBadgeSVG(badge.badgeImageName, isAchieved);
          return {
            badgeTitle: '', // Custom badges don't have a title
            achieved: isAchieved,
            badgeImage: undefined,
            badgeCreatedDate: badge.dateCreated,
            badgeExpiryDate: badge.expiryDate,
            customBadgeSVG: customBadgeSVG,
            badgeSubtext: badge.badgeSubtext,
            expired: badge.expired
          };
        });
        
        setCustomBadges(badgeData);
      } catch (error) {
        console.error('Error loading custom badges:', error);
        setCustomBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomBadges();
  }, []);

  if (isLoading) {
    return null;
  }

  // Don't render anything if there are no custom badges
  if (customBadges.length === 0) {
    return null;
  }

  return (
    <BadgeWall 
      badges={customBadges} 
      backgroundImage={LargeMeshBackground1} 
      title={strings[language].customBadges} 
      themeColors={themeColors} 
    />
  );
});

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

export default function AwardsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const achievementsContentAnim = useRef(new Animated.Value(0)).current;
  const [isAchievements, setIsAchievements] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
  const isFocused = useIsFocused();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const getTopBarStatisticsHeight = useTopBarStatisticsHeight();
  const animationConfig = useMemo(() => getAnimationConfig(), []);
  
  const themeColors = Colors[theme];

  useEffect(() => {
    if (isFocused) {
      setDisableToggleAnimation(true);
      setIsAchievements(false);
      achievementsContentAnim.setValue(0);
      
      // Use optimized screen transition
      optimizedScreenTransition.transitionWithDataPreload(
        () => {
          setTimeout(() => {
            setDisableToggleAnimation(false);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: animationConfig.screenTransitionDuration,
              useNativeDriver: true,
            }).start();
          }, animationConfig.isLowEndDevice ? 100 : 50);
        },
        // No heavy data loading needed for awards page, return resolved promise
        () => Promise.resolve()
      );
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationConfig.duration,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, animationConfig]);

  const handleToggle = useCallback((val: boolean) => {
    if (animationConfig.isLowEndDevice) {
      // Instant toggle for low-end devices
      setIsAchievements(val);
      fadeAnim.setValue(1);
      if (val) {
        achievementsContentAnim.setValue(1);
      }
    } else {
      // Animated toggle for high-end devices
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
            duration: animationConfig.duration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAchievements(true);
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: animationConfig.duration * 1.5,
              useNativeDriver: true,
            }),
            Animated.timing(achievementsContentAnim, {
              toValue: 1,
              duration: animationConfig.duration * 1.5,
              useNativeDriver: true,
            }),
          ]).start();
        });
      } else {
        // Switching back to Goals
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: animationConfig.duration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAchievements(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: animationConfig.duration * 1.5,
            useNativeDriver: true,
          }).start();
        });
      }
    }
  }, [fadeAnim, achievementsContentAnim, animationConfig]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Clear all cached statistics data (including awards data)
      await refreshAllStatistics();
      
      // Force refresh awards data by incrementing refresh key
      setRefreshKey(prev => prev + 1);
      
      console.log('✅ Awards cache refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh awards:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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
            removeClippedSubviews={animationConfig.isLowEndDevice}
            scrollEventThrottle={animationConfig.isLowEndDevice ? 100 : 16}
            decelerationRate={animationConfig.isLowEndDevice ? "fast" : "normal"}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={themeColors.brandColor2}
                colors={[themeColors.brandColor2]}
              />
            }
          >
        <View style={styles.wrapper}>
                      <Text style={[styles.title, language === 'Chinese' && {marginTop: 20}, { color: themeColors.text }]}>{strings[language].fillInCustomGoal}</Text>
                            <CustomGoalForm setScrollEnabled={setScrollEnabled} themeColors={themeColors} />
                <StreakCalendarStats key={`streak-stats-${refreshKey}`} themeColors={themeColors} />
              <StreakCalendar key={`streak-calendar-${refreshKey}`} />
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
            removeClippedSubviews={animationConfig.isLowEndDevice}
            scrollEventThrottle={animationConfig.isLowEndDevice ? 100 : 16}
            decelerationRate={animationConfig.isLowEndDevice ? "fast" : "normal"}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={themeColors.brandColor2}
                colors={[themeColors.brandColor2]}
              />
            }
          >
            <View style={{ flexDirection: 'column', gap: 30 }}>
              <CustomBadges themeColors={themeColors} />
              <StreakBadges themeColors={themeColors} />
              <WelcomeBadges themeColors={themeColors} />
              <LifetimeBadges themeColors={themeColors} />
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