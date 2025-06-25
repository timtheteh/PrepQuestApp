import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, SafeAreaView, Dimensions, Text, TouchableWithoutFeedback, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { FlashcardViewTopBar } from '@/components/FlashcardViewTopBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DIFFICULTY_TYPES = [
  { type: 'Again', color: '#F8696B' },
  { type: 'Hard', color: '#FA9473' },
  { type: 'Good', color: '#FFEB84' },
  { type: 'Easy', color: '#98CE7F' },
];

const DifficultyPillRow = () => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <View style={styles.difficultyPillRow}>
      {DIFFICULTY_TYPES.map(({ type, color }) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.difficultyPillButton,
            { backgroundColor: color },
            selected === type && { borderColor: '#4F41D8', borderWidth: 3 },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            if (selected !== type) setSelected(type);
          }}
        >
          <Text style={styles.difficultyPillButtonText}>{type}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const LoadingBar = ({ percent }: { percent: number }) => (
  <View style={styles.loadingBarContainer}>
    <View style={styles.loadingBarBg}>
      <View style={[styles.loadingBarFg, { width: `${percent * 100}%` }]} />
    </View>
  </View>
);

const FlippableFlashcard = () => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handlePress = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.flippableCard,
            {
              backgroundColor: '#F8F8F8',
              transform: [{ rotateY: frontInterpolate }],
              zIndex: isFlipped ? 0 : 1,
              position: 'absolute',
              width: '100%',
              height: '100%',
            },
          ]}
        >
          {/* Front content here */}
        </Animated.View>
        <Animated.View
          style={[
            styles.flippableCard,
            {
              backgroundColor: 'red',
              transform: [{ rotateY: backInterpolate }],
              zIndex: isFlipped ? 1 : 0,
              position: 'absolute',
              width: '100%',
              height: '100%',
            },
          ]}
        >
          {/* Back content here */}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function FlashcardViewPage() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={32} color="black" />
        </TouchableOpacity>
        <View style={styles.headerIconsContainer}>
          <FlashcardViewTopBar />
        </View>
        <View style={styles.middleContentContainer}>
          <FlippableFlashcard />
        </View>
        <View style={styles.difficultyPillRowContainer}>
          <DifficultyPillRow />
        </View>
        <View style={styles.loadingBarBottomContainer}>
          <LoadingBar percent={0.5} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    left: 16,
    zIndex: 1,
    paddingTop: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    right: 16,
    zIndex: 1,
  },
  middleContentContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 132 : 78, // headerIconsContainer top + height
    left: 16,
    right: 16,
    bottom: 108, // height of difficultyPillRowContainer + loading bar
    zIndex: 0,
  },
  loadingBarBottomContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBarContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBarBg: {
    width: '100%',
    height: 21,
    backgroundColor: '#F8F8F8',
    borderRadius: 21,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  loadingBarFg: {
    height: 21,
    backgroundColor: '#4F41D8',
    borderRadius: 21,
  },
  difficultyPillRowContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  difficultyPillButton: {
    flex: 1,
    height: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  difficultyPillButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  flippableCard: {
    flex: 1,
    borderRadius: 30,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
}); 