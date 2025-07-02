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
import { getAverageGradeAllTime } from '@/db/grades';

export default function StatisticsScreen() {
  const [isPerformance, setIsPerformance] = useState(false);
  const [pendingDecksFadeIn, setPendingDecksFadeIn] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
  const [breakdownKey, setBreakdownKey] = useState(0);
  const [moreDetailsState, setMoreDetailsState] = useState(0);
  const [averageGrade, setAverageGrade] = useState(0);
  const [isLoadingAverageGrade, setIsLoadingAverageGrade] = useState(true);
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 65;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();

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

  useEffect(() => {
    if (isFocused) {
      setDisableToggleAnimation(true);
      setIsPerformance(false);
      // Fetch average grade when screen comes into focus
      fetchAverageGrade();
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
    <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: fadeAnim}}>
      <View style={{ marginTop: topPadding, paddingHorizontal: 16 }}>
        <RoundedContainer
          leftLabel="Decks / Flashcards"
          leftLabelStyle={{ fontSize: 16, fontFamily: 'Satoshi-Medium' }}
          rightLabel="Performance"
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
          <BreakdownByDifficultyPie />
          <SpeedChart />
          <AverageSpeedTotal />
        </ScrollView>
        )}
      </Animated.View>
      <View style={{ height: 40, backgroundColor: '#FFFFFF'}} />
    </Animated.View>
  );
} 