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

// Lazy load heavy components for better performance
const ReviewLineGraph = lazy(() => import('@/components/statsComponents/ReviewLineGraph').then(module => ({ default: module.ReviewLineGraph })));
const BreakdownOfDecksFlashcards = lazy(() => import('@/components/statsComponents/BreakdownOfDecksFlashcards').then(module => ({ default: module.BreakdownOfDecksFlashcards })));
const MoreDetailsStats = lazy(() => import('@/components/statsComponents/MoreDetailsStats').then(module => ({ default: module.MoreDetailsStats })));
const GradeChart = lazy(() => import('@/components/statsComponents/GradeChart').then(module => ({ default: module.GradeChart })));
const AverageGradeThermometer = lazy(() => import('@/components/statsComponents/AverageGradeThermometer').then(module => ({ default: module.AverageGradeThermometer })));
const BreakdownByDifficultyPie = lazy(() => import('@/components/statsComponents/BreakdownByDifficulty'));
const SpeedChart = lazy(() => import('@/components/statsComponents/SpeedChart').then(module => ({ default: module.SpeedChart })));
const AverageSpeedTotal = lazy(() => import('@/components/statsComponents/AverageSpeedTotal'));

// Loading fallback component
const ComponentLoader = React.memo(({ height = 200 }: { height?: number }) => {
  const { theme } = useTheme();
  return (
    <View style={{ 
      height, 
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

  // Data cache with timestamps
  const dataCache = useRef<{
    averageGrade?: { data: number; timestamp: number };
    difficultyBreakdown?: { data: any; timestamp: number };
    averageTime?: { data: number; timestamp: number };
  }>({});
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // Check if cached data is still valid
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Memoized data fetching functions with caching
  const fetchAverageGrade = useCallback(async () => {
    try {
      setIsLoadingAverageGrade(true);
      
      // Check cache first
      if (dataCache.current.averageGrade && isCacheValid(dataCache.current.averageGrade.timestamp)) {
        setAverageGrade(dataCache.current.averageGrade.data);
        setIsLoadingAverageGrade(false);
        return;
      }
      
      const grade = await getAverageGradeAllTime();
      setAverageGrade(grade);
      
      // Cache the result
      dataCache.current.averageGrade = {
        data: grade,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching average grade:', error);
      setAverageGrade(0);
    } finally {
      setIsLoadingAverageGrade(false);
    }
  }, []);

  const fetchDifficultyBreakdown = useCallback(async () => {
    try {
      setIsLoadingDifficultyBreakdown(true);
      
      // Check cache first
      if (dataCache.current.difficultyBreakdown && isCacheValid(dataCache.current.difficultyBreakdown.timestamp)) {
        setDifficultyBreakdown(dataCache.current.difficultyBreakdown.data);
        setIsLoadingDifficultyBreakdown(false);
        return;
      }
      
      const breakdown = await getDifficultyBreakdown();
      setDifficultyBreakdown(breakdown);
      
      // Cache the result
      dataCache.current.difficultyBreakdown = {
        data: breakdown,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching difficulty breakdown:', error);
      setDifficultyBreakdown({
        Again: 0,
        Hard: 0,
        Good: 0,
        Easy: 0
      });
    } finally {
      setIsLoadingDifficultyBreakdown(false);
    }
  }, []);

  const fetchAverageTime = useCallback(async () => {
    try {
      setIsLoadingAverageTime(true);
      
      // Check cache first
      if (dataCache.current.averageTime && isCacheValid(dataCache.current.averageTime.timestamp)) {
        setAverageTime(dataCache.current.averageTime.data);
        setIsLoadingAverageTime(false);
        return;
      }
      
      const time = await getAverageTimeAllTime();
      setAverageTime(time);
      
      // Cache the result
      dataCache.current.averageTime = {
        data: time,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching average time:', error);
      setAverageTime(0);
    } finally {
      setIsLoadingAverageTime(false);
    }
  }, []);

  // Optimized data fetching - only fetch when needed
  const fetchDataForPerformanceTab = useCallback(async () => {
    // Only fetch performance-specific data when switching to performance tab
    await Promise.all([
      fetchAverageGrade(),
      fetchDifficultyBreakdown(),
      fetchAverageTime()
    ]);
  }, [fetchAverageGrade, fetchDifficultyBreakdown, fetchAverageTime]);

  useEffect(() => {
    if (isFocused) {
      // Reset component loading states
      setShouldLoadDecksComponents(false);
      setShouldLoadPerformanceComponents(false);
      
      // Optimize loading experience - show screen immediately without data loading
      setDisableToggleAnimation(false);
      setIsPerformance(false);
      
      // Immediate screen display
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationConfig.duration, // Use performance-based duration
        useNativeDriver: true,
      }).start();
      
      // Load initial components after a short delay for better perceived performance
      setTimeout(() => {
        setShouldLoadDecksComponents(true);
      }, 50); // Reduced delay for faster initial load
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationConfig.duration, // Use performance-based duration
        useNativeDriver: true,
      }).start();
      
      // Reset component loading states when screen loses focus
      setShouldLoadDecksComponents(false);
      setShouldLoadPerformanceComponents(false);
    }
  }, [isFocused, animationConfig]);

  // Optimized fade animation for Decks/Performance toggle
  const handleToggle = useCallback((val: boolean) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: animationConfig.duration, // Use performance-based duration
      useNativeDriver: true,
    }).start(() => {
      setIsPerformance(val);
      if (!val) {
        setPendingDecksFadeIn(true);
        // Reset both sections to Decks state
        setBreakdownKey(prev => prev + 1);
        setMoreDetailsState(0);
        // Ensure decks components are loaded
        setShouldLoadDecksComponents(true);
      } else {
        // Load performance components and fetch data when switching to performance tab
        setShouldLoadPerformanceComponents(true);
        
        // Fetch performance data in background
        fetchDataForPerformanceTab().finally(() => {
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: animationConfig.duration, // Use performance-based duration
            useNativeDriver: true,
          }).start();
        });
      }
    });
  }, [contentFadeAnim, animationConfig, fetchDataForPerformanceTab]);

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
              removeClippedSubviews={true} // Optimize for performance
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
              removeClippedSubviews={true} // Optimize for performance
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