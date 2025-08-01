import { Dimensions, View, ScrollView, Animated } from 'react-native';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { useState, useRef, useEffect, useCallback } from 'react';
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

  // Function to fetch average grade
  const fetchAverageGrade = async () => {
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
  };

  // Function to fetch difficulty breakdown
  const fetchDifficultyBreakdown = async () => {
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
  };

  // Function to fetch average time
  const fetchAverageTime = async () => {
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
  };

  useEffect(() => {
    if (isFocused) {
      // Show loading screen for 100ms
      setIsLoadingScreen(true);
      loadingScreenAnim.setValue(1);
      
      setDisableToggleAnimation(true);
      setIsPerformance(false);
      
      // Fetch data when screen comes into focus
      fetchAverageGrade();
      fetchDifficultyBreakdown();
      fetchAverageTime();
      
      // Hide loading screen after 100ms and show content
      setTimeout(() => {
        setIsLoadingScreen(false);
        Animated.timing(loadingScreenAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        
        setDisableToggleAnimation(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 100);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  // Fade animation for Decks/Performance toggle
  const handleToggle = useCallback((val: boolean) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 150,
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
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [contentFadeAnim]);

  // Callback for ReviewLineGraph to trigger fade-in after content is ready
  const handleDecksContentReady = useCallback(() => {
    if (pendingDecksFadeIn) {
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setPendingDecksFadeIn(false);
    }
  }, [pendingDecksFadeIn, contentFadeAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {/* Loading screen overlay */}
      {isLoadingScreen && (
        <Animated.View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: Colors[theme].background, 
            zIndex: 1000,
            opacity: loadingScreenAnim
          }} 
        />
      )}
      
      <Animated.View style={{ flex: 1, backgroundColor: Colors[theme].background, opacity: fadeAnim}}>
        <View style={{ marginTop: getTopBarStatisticsHeight(), paddingHorizontal: 16 }}>
          <RoundedContainer
            leftLabel={strings[language].statistics.decksFlashcards}
            leftLabelStyle={{ fontSize: 16, fontFamily: Fonts.bodyMedium }}
            rightLabel={strings[language].statistics.performance}
            onToggle={handleToggle}
            position={isPerformance ? 'right' : 'left'}
            disableAnimation={disableToggleAnimation}
          />
      </View>
        <View style={{ height: 10, backgroundColor: Colors[theme].background}} />
        <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
          {!isPerformance && (
            <ScrollView 
            contentContainerStyle={{ flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            >
              {/* ReviewSection */}
              <ReviewLineGraph onContentReady={handleDecksContentReady} />
              {/* breakdown section */}
              <BreakdownOfDecksFlashcards
                key={breakdownKey}
              />
              <MoreDetailsStats selectedIndex={moreDetailsState} onSelectedIndexChange={setMoreDetailsState} />
              {/* More details section */}
            </ScrollView>
          )}
          {/* You can add your Performance content here, wrapped in the same Animated.View */}
          {isPerformance && (
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            >
            <GradeChart />
            <AverageGradeThermometer score={averageGrade} />
            <BreakdownByDifficultyPie breakdown={difficultyBreakdown} />
            <SpeedChart />
            <AverageSpeedTotal averageTime={averageTime} />
          </ScrollView>
          )}
        </Animated.View>
        <View style={{ height: 40, backgroundColor: Colors[theme].background}} />
      </Animated.View>
    </View>
  );
} 