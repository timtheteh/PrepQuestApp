import { Dimensions, Platform, View, ScrollView, Text, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { RoundedContainer } from '@/components/RoundedContainer';
import { useState, useRef, useEffect } from 'react';
import { SmallGreenBinaryToggle } from '@/components/SmallGreenBinaryToggle';
import { ReviewLineGraph } from '@/components/ReviewLineGraph';
import { useIsFocused } from '@react-navigation/native';

export default function StatisticsScreen() {
  const [isPerformance, setIsPerformance] = useState(false);
  const [pendingDecksFadeIn, setPendingDecksFadeIn] = useState(false);
  const [disableToggleAnimation, setDisableToggleAnimation] = useState(false);
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
    <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: fadeAnim }}>
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
      <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
        {!isPerformance && (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {/* ReviewSection */}
            <ReviewLineGraph onContentReady={handleDecksContentReady} />
          </ScrollView>
        )}
        {/* You can add your Performance content here, wrapped in the same Animated.View */}
      </Animated.View>
    </Animated.View>
  );
} 