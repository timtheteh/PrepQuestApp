import { Dimensions, View, ScrollView, Animated } from 'react-native';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { getAverageGradeAllTime, getDifficultyBreakdown, getAverageTimeAllTime } from '@/db/grades';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopBarStatisticsHeight } from '@/hooks/heights';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedScreenTransition } from '@/utils/performanceOptimizations';

// Lazy load heavy components for better performance
const ReviewLineGraph = lazy(() => import('@/components/statsComponents/ReviewLineGraph').then(module => ({ default: module.ReviewLineGraph })));
const BreakdownOfDecksFlashcards = lazy(() => import('@/components/statsComponents/BreakdownOfDecksFlashcards').then(module => ({ default: module.BreakdownOfDecksFlashcards })));
const MoreDetailsStats = lazy(() => import('@/components/statsComponents/MoreDetailsStats').then(module => ({ default: module.MoreDetailsStats })));
const GradeChart = lazy(() => import('@/components/statsComponents/GradeChart').then(module => ({ default: module.GradeChart })));
const AverageGradeThermometer = lazy(() => import('@/components/statsComponents/AverageGradeThermometer').then(module => ({ default: module.AverageGradeThermometer })));
const BreakdownByDifficultyPie = lazy(() => import('@/components/statsComponents/BreakdownByDifficulty'));
const SpeedChart = lazy(() => import('@/components/statsComponents/SpeedChart').then(module => ({ default: module.SpeedChart })));
const AverageSpeedTotal = lazy(() => import('@/components/statsComponents/AverageSpeedTotal'));

// Loading fallback component optimized for low-end devices
const ComponentLoader = React.memo(({ height = 200 }: { height?: number }) => {
  const { theme } = useTheme();
  const animationConfig = useMemo(() => getAnimationConfig(), []);
  
  return (
    <View style={{ 
      height: animationConfig.isLowEndDevice ? height * 0.7 : height, // Smaller placeholder for low-end
      backgroundColor: Colors[theme].background, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }} />
  );
});

const StatisticsScreen = React.memo(() => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [isPerformance, setIsPerformance] = useState(false);
  const [pendingDecksFadeIn, setPendingDecksFadeIn] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
  const [breakdownKey, setBreakdownKey] = useState(0);
  const [moreDetailsState, setMoreDetailsState] = useState(0);
  const [averageGrade, setAverageGrade] = useState(0);
  const [isLoadingAverageGrade, setIsLoadingAverageGrade] = useState(true);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState({
    Again: 0,
    Hard: 0,
    Good: 0,
    Easy: 0
  });
  const [isLoadingDifficultyBreakdown, setIsLoadingDifficultyBreakdown] = useState(true);
  const [averageTime, setAverageTime] = useState(0);
  const [isLoadingAverageTime, setIsLoadingAverageTime] = useState(true);
  const [shouldLoadDecksComponents, setShouldLoadDecksComponents] = useState(false);
  const [shouldLoadPerformanceComponents, setShouldLoadPerformanceComponents] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();
  const getTopBarStatisticsHeight = useTopBarStatisticsHeight();

  // Get performance-based animation config
  const animationConfig = useMemo(() => getAnimationConfig(), []);

  // Data fetching for performance tab
  const fetchDataForPerformanceTab = useCallback(async () => {
    try {
      setIsLoadingAverageGrade(true);
      setIsLoadingDifficultyBreakdown(true);
      setIsLoadingAverageTime(true);

      // Load statistics data directly from database
      const [averageGradeData, difficultyBreakdownData, averageTimeData] = await Promise.all([
        getAverageGradeAllTime(),
        getDifficultyBreakdown(),
        getAverageTimeAllTime(),
      ]);

      setAverageGrade(averageGradeData);
      setDifficultyBreakdown(difficultyBreakdownData);
      setAverageTime(averageTimeData);
    } catch (error) {
      console.error('Error fetching statistics data:', error);
      setAverageGrade(0);
      setDifficultyBreakdown({ Again: 0, Hard: 0, Good: 0, Easy: 0 });
      setAverageTime(0);
    } finally {
      setIsLoadingAverageGrade(false);
      setIsLoadingDifficultyBreakdown(false);
      setIsLoadingAverageTime(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      // Reset component loading states
      setShouldLoadDecksComponents(false);
      setShouldLoadPerformanceComponents(false);
      
      // Optimize loading experience - show screen immediately
      setDisableToggleAnimation(false);
      setIsPerformance(false);
      
      // Use optimized screen transition
      optimizedScreenTransition.transitionWithDataPreload(
        () => {
          // Immediate screen display
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: animationConfig.screenTransitionDuration,
            useNativeDriver: true,
          }).start();
        },
        // Pre-load statistics data in background
        () => fetchDataForPerformanceTab()
      );
      
      // Load initial components with device-optimized delay
      setTimeout(() => {
        setShouldLoadDecksComponents(true);
      }, animationConfig.isLowEndDevice ? 100 : 50);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationConfig.duration,
        useNativeDriver: true,
      }).start();
      
      // Reset component loading states when screen loses focus
      setShouldLoadDecksComponents(false);
      setShouldLoadPerformanceComponents(false);
    }
  }, [isFocused, animationConfig, fetchDataForPerformanceTab]);

  // Optimized fade animation for Decks/Performance toggle
  const handleToggle = useCallback((val: boolean) => {
    if (animationConfig.isLowEndDevice) {
      // Instant toggle for low-end devices
      setIsPerformance(val);
      if (!val) {
        setBreakdownKey(prev => prev + 1);
        setMoreDetailsState(0);
        setShouldLoadDecksComponents(true);
      } else {
        setShouldLoadPerformanceComponents(true);
      }
    } else {
      // Animated toggle for high-end devices
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: animationConfig.duration,
        useNativeDriver: true,
      }).start(() => {
        setIsPerformance(val);
        if (!val) {
          setPendingDecksFadeIn(true);
          setBreakdownKey(prev => prev + 1);
          setMoreDetailsState(0);
          setShouldLoadDecksComponents(true);
        } else {
          setShouldLoadPerformanceComponents(true);
          
          // Data is already cached from initial load, so fade in immediately
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: animationConfig.duration,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  }, [contentFadeAnim, animationConfig]);

  // Optimized callback for ReviewLineGraph to trigger fade-in after content is ready
  const handleDecksContentReady = useCallback(() => {
    if (pendingDecksFadeIn) {
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: animationConfig.duration, // Use performance-based duration
        useNativeDriver: true,
      }).start();
      setPendingDecksFadeIn(false);
    }
  }, [pendingDecksFadeIn, contentFadeAnim, animationConfig]);

  // Memoize styles to prevent recreation on every render
  const containerStyle = useMemo(() => ({ 
    flex: 1, 
    backgroundColor: Colors[theme].background 
  }), [theme]);


  const animatedContainerStyle = useMemo(() => ({ 
    flex: 1, 
    backgroundColor: Colors[theme].background, 
    opacity: fadeAnim
  }), [theme, fadeAnim]);

  const headerContainerStyle = useMemo(() => ({ 
    marginTop: getTopBarStatisticsHeight(), 
    paddingHorizontal: 16 
  }), [getTopBarStatisticsHeight]);

  const spacerStyle = useMemo(() => ({ 
    height: 10, 
    backgroundColor: Colors[theme].background 
  }), [theme]);

  const bottomSpacerStyle = useMemo(() => ({ 
    height: 40, 
    backgroundColor: Colors[theme].background 
  }), [theme]);

  const scrollViewStyle = useMemo(() => ({ 
    flexGrow: 1 
  }), []);

  // Memoize the left label style
  const leftLabelStyle = useMemo(() => ({ 
    fontSize: 16, 
    fontFamily: Fonts.bodyMedium 
  }), []);

  return (
    <View style={containerStyle}>
      <Animated.View style={animatedContainerStyle}>
        <View style={headerContainerStyle}>
          <RoundedContainer
            leftLabel={strings[language].statistics.decksFlashcards}
            leftLabelStyle={leftLabelStyle}
            rightLabel={strings[language].statistics.performance}
            onToggle={handleToggle}
            position={isPerformance ? 'right' : 'left'}
            disableAnimation={disableToggleAnimation}
          />
        </View>
        <View style={spacerStyle} />
        <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
          {!isPerformance && (
            <ScrollView 
              contentContainerStyle={scrollViewStyle}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={animationConfig.isLowEndDevice}
              scrollEventThrottle={animationConfig.isLowEndDevice ? 100 : 16}
              decelerationRate={animationConfig.isLowEndDevice ? "fast" : "normal"}
            >
              {shouldLoadDecksComponents ? (
                <Suspense fallback={<ComponentLoader height={300} />}>
                  {/* ReviewSection */}
                  <ReviewLineGraph onContentReady={handleDecksContentReady} />
                  {/* breakdown section */}
                  <BreakdownOfDecksFlashcards key={breakdownKey} />
                  <MoreDetailsStats selectedIndex={moreDetailsState} onSelectedIndexChange={setMoreDetailsState} />
                </Suspense>
              ) : (
                <ComponentLoader height={600} />
              )}
            </ScrollView>
          )}
          {isPerformance && (
            <ScrollView 
              contentContainerStyle={scrollViewStyle}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={animationConfig.isLowEndDevice}
              scrollEventThrottle={animationConfig.isLowEndDevice ? 100 : 16}
              decelerationRate={animationConfig.isLowEndDevice ? "fast" : "normal"}
            >
              {shouldLoadPerformanceComponents ? (
                <Suspense fallback={<ComponentLoader height={300} />}>
                  <GradeChart />
                  <AverageGradeThermometer score={averageGrade} />
                  <BreakdownByDifficultyPie breakdown={difficultyBreakdown} />
                  <SpeedChart />
                  <AverageSpeedTotal averageTime={averageTime} />
                </Suspense>
              ) : (
                <ComponentLoader height={600} />
              )}
            </ScrollView>
          )}
        </Animated.View>
        <View style={bottomSpacerStyle} />
      </Animated.View>
    </View>
  );
});

export default StatisticsScreen;