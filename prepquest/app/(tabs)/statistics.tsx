import { Dimensions, Platform, View, ScrollView, Text, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { RoundedContainer } from '@/components/RoundedContainer';
import { useState, useRef, useEffect } from 'react';
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

export default function StatisticsScreen() {
  const [isPerformance, setIsPerformance] = useState(false);
  const [pendingDecksFadeIn, setPendingDecksFadeIn] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
  const [breakdownKey, setBreakdownKey] = useState(0);
  const [moreDetailsState, setMoreDetailsState] = useState(0);
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 65;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setDisableToggleAnimation(true);
      setIsPerformance(false);
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
              decksData={[
                { label: 'Study', value: 25, percent: 25, color: '#5CC8BE' },
                { label: 'Technical', value: 10, percent: 10, color: '#D7191C' },
                { label: 'Case Study', value: 18, percent: 18, color: '#C3EB79' },
                { label: 'Behavioral', value: 7, percent: 7, color: '#FDAE61' },
                { label: 'Brainteasers', value: 20, percent: 20, color: '#357AF6' },
                { label: 'Others', value: 20, percent: 20, color: '#AF52DE' },
              ]}
              flashcardsData={[
                { label: 'Study', value: 24, percent: 20, color: '#5CC8BE' },
                { label: 'Technical', value: 20, percent: 20, color: '#D7191C' },
                { label: 'Case Study', value: 12, percent: 12, color: '#C3EB79' },
                { label: 'Behavioral', value: 16, percent: 16, color: '#FDAE61' },
                { label: 'Brainteasers', value: 8, percent: 8, color: '#357AF6' },
                { label: 'Others', value: 4, percent: 4, color: '#AF52DE' },
              ]}
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
          <AverageGradeThermometer />
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