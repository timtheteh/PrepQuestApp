import { Dimensions, Platform, View, ScrollView, Text, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { RoundedContainer } from '@/components/RoundedContainer';
import { useState, useRef, useEffect, useMemo } from 'react';
import { SmallGreenBinaryToggle } from '@/components/SmallGreenBinaryToggle';
import { ReviewLineGraph } from '@/components/ReviewLineGraph';
import { BreakdownOfDecksFlashcards } from '@/components/BreakdownOfDecksFlashcards';
import { useIsFocused } from '@react-navigation/native';
import { MoreDetailsStats } from '@/components/MoreDetailsStats';
import { GradeChart } from '@/components/GradeChart'; 
import { AverageGradeThermometer } from '@/components/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/BreakdownByDifficulty';
import { SpeedChart } from '@/components/SpeedChart';
import AverageSpeedTotal from '@/components/AverageSpeedTotal';
import { getAverageGradeAllTime, getDifficultyBreakdown, getAverageTimeAllTime } from '@/db/grades';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopBarAccountHeight, getTopBarStatisticsHeight } from '@/constants/heights';

export default function StatisticsScreen() {
  const { language } = useLanguage();
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
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 65;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const loadingScreenAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

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
  const handleToggle = (val: boolean) => {
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
  };

  // Callback for ReviewLineGraph to trigger fade-in after content is ready
  const handleDecksContentReady = () => {
    if (pendingDecksFadeIn) {
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setPendingDecksFadeIn(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Loading screen overlay */}
      {isLoadingScreen && (
        <Animated.View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: '#FFFFFF', 
            zIndex: 1000,
            opacity: loadingScreenAnim
          }} 
        />
      )}
      
      <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: fadeAnim}}>
        <View style={{ marginTop: getTopBarStatisticsHeight(), paddingHorizontal: 16 }}>
          <RoundedContainer
            leftLabel={language === 'Chinese' ? '卡组 / 卡片' : 'Decks / Flashcards'}
            leftLabelStyle={{ fontSize: 16, fontFamily: 'Satoshi-Medium' }}
            rightLabel={language === 'Chinese' ? '表现' : 'Performance'}
            onToggle={handleToggle}
            position={isPerformance ? 'right' : 'left'}
            disableAnimation={disableToggleAnimation}
          />
      </View>
        <View style={{ height: 10, backgroundColor: '#FFFFFF'}} />
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
        <View style={{ height: 40, backgroundColor: '#FFFFFF'}} />
      </Animated.View>
    </View>
  );
} 