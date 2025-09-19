import { Dimensions, View, ScrollView, Animated } from 'react-native';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ReviewLineGraph } from '@/components/statsComponents/ReviewLineGraph';
import { BreakdownOfDecksFlashcards } from '@/components/statsComponents/BreakdownOfDecksFlashcards';
import { useIsFocused } from '@react-navigation/native';
import { MoreDetailsStats } from '@/components/statsComponents/MoreDetailsStats';
import { GradeChart } from '@/components/statsComponents/GradeChart'; 
import { AverageGradeThermometer } from '@/components/statsComponents/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/statsComponents/BreakdownByDifficulty';
import { SpeedChart } from '@/components/statsComponents/SpeedChart';
import AverageSpeedTotal from '@/components/statsComponents/AverageSpeedTotal';
import { getAverageGradeAllTime, getDifficultyBreakdown, getAverageTimeAllTime } from '@/db/grades';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopBarStatisticsHeight } from '@/hooks/heights';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { getAnimationConfig } from '@/utils/animationConfig';

export default function StatisticsScreen() {
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
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const loadingScreenAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();
  const getTopBarStatisticsHeight = useTopBarStatisticsHeight();

  // Get performance-based animation config
  const animationConfig = useMemo(() => getAnimationConfig(), []);

  // Memoized data fetching functions to prevent recreation on every render
  const fetchAverageGrade = useCallback(async () => {
    try {
      setIsLoadingAverageGrade(true);
      const grade = await getAverageGradeAllTime();
      setAverageGrade(grade);
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
      const breakdown = await getDifficultyBreakdown();
      setDifficultyBreakdown(breakdown);
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
      const time = await getAverageTimeAllTime();
      setAverageTime(time);
    } catch (error) {
      console.error('Error fetching average time:', error);
      setAverageTime(0);
    } finally {
      setIsLoadingAverageTime(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      // Optimize loading experience - reduce loading screen time for better performance
      setIsLoadingScreen(true);
      loadingScreenAnim.setValue(1);
      
      setDisableToggleAnimation(true);
      setIsPerformance(false);
      
      // Fetch data in parallel for better performance
      Promise.all([
        fetchAverageGrade(),
        fetchDifficultyBreakdown(),
        fetchAverageTime()
      ]).finally(() => {
        // Reduced loading screen time for better UX
        setTimeout(() => {
          setIsLoadingScreen(false);
          Animated.timing(loadingScreenAnim, {
            toValue: 0,
            duration: animationConfig.duration, // Use performance-based duration
            useNativeDriver: true,
          }).start();
          
          setDisableToggleAnimation(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: animationConfig.duration, // Use performance-based duration
            useNativeDriver: true,
          }).start();
        }, 50); // Reduced from 100ms to 50ms
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationConfig.duration, // Use performance-based duration
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, fetchAverageGrade, fetchDifficultyBreakdown, fetchAverageTime, animationConfig]);

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
      } else {
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: animationConfig.duration, // Use performance-based duration
          useNativeDriver: true,
        }).start();
      }
    });
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

  const loadingOverlayStyle = useMemo(() => ({ 
    position: 'absolute' as const, 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: Colors[theme].background, 
    zIndex: 1000,
    opacity: loadingScreenAnim
  }), [theme, loadingScreenAnim]);

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
      {/* Loading screen overlay */}
      {isLoadingScreen && (
        <Animated.View style={loadingOverlayStyle} />
      )}
      
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
              {/* ReviewSection */}
              <ReviewLineGraph onContentReady={handleDecksContentReady} />
              {/* breakdown section */}
              <BreakdownOfDecksFlashcards key={breakdownKey} />
              <MoreDetailsStats selectedIndex={moreDetailsState} onSelectedIndexChange={setMoreDetailsState} />
            </ScrollView>
          )}
          {isPerformance && (
            <ScrollView 
              contentContainerStyle={scrollViewStyle}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true} // Optimize for performance
            >
              <GradeChart />
              <AverageGradeThermometer score={averageGrade} />
              <BreakdownByDifficultyPie breakdown={difficultyBreakdown} />
              <SpeedChart />
              <AverageSpeedTotal averageTime={averageTime} />
            </ScrollView>
          )}
        </Animated.View>
        <View style={bottomSpacerStyle} />
      </Animated.View>
    </View>
  );
} 