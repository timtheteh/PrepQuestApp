import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface DeckCreationLoadingPageProps {
  progress: number; // 0 to 1
  current: number;
  total: number;
  isInViewFlashcardsPage: boolean;
}

export default function DeckCreationLoadingPage({
  progress = 0,
  current = 0,
  total = 1,
  isInViewFlashcardsPage = false,
}: DeckCreationLoadingPageProps) {
  const percent = Math.round(progress * 100);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress, progressAnim]);

  const animatedWidth = useCallback(() => {
    return progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
  }, [progressAnim]);

  return (
    <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      {/* Stacked image + Lottie animation */}
      <View style={{ width: '100%', aspectRatio: 1.1, marginTop: '15%', marginBottom: 0, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('@/assets/images/loadingBackground.png')}
          style={{ width: '100%', height: '100%', borderRadius: 24 }}
          resizeMode="contain"
          fadeDuration={0}
        />
        <LottieView
          source={require('@/assets/animations/LoadingAnimation1.json')}
          autoPlay
          loop
          style={{ position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%' }}
          cacheComposition={true}
        />
      </View>
      {/* Text and progress below */}
      <View style={{ width: '100%', paddingHorizontal: 32, alignItems: 'center' }}>
        <Text style={styles.title}>
            {isInViewFlashcardsPage ? 'Your flashcards are\non their way!' : 'Your fantastic deck is\non its way!'}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { 
                  width: animatedWidth(),
                  backgroundColor: percent === 100 ? '#44B88A' : '#4F41D8',
                }
              ]} 
            />
          </View>
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
        <Text style={styles.countText}>{`${current} out of ${total} Flashcards generated`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 24,
    color: '#000',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 16,
    backgroundColor: '#D5D4DD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F41D8',
    borderRadius: 8,
  },
  percentText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 24,
    color: '#4F41D8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  countText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginTop: 2,
  },
}); 