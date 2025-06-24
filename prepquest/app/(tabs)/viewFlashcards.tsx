import React, { useRef, useEffect, useContext } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Animated } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useIsFocused } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MenuContext } from './_layout';

const SCREEN_TRANSITION_DURATION = 300;

export default function ViewFlashcardsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const { deckId, deckTitle, deckType, deckDetailsBackgroundIndex, date, flashcardCount, percent, company, isAIDeck, mode } = useLocalSearchParams();
  const { 
    navbarRef,
    currentMode
  } = useContext(MenuContext);

  // Handle screen transitions
  useEffect(() => {
    if (isFocused) {
      // Reset navbar animation when screen comes into focus
      navbarRef?.current?.resetAnimation();
      
      // Ensure opacity starts at 0 for a clean fade-in
      screenOpacity.setValue(0);
      
      // Add a small delay for smoother fade-in animation
      setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      screenOpacity.setValue(0);
    }
  }, [isFocused]);

  // Clean up animation when component unmounts
  useEffect(() => {
    return () => {
      screenOpacity.setValue(0);
    };
  }, []);

  const handleBackPress = () => {
    // Navigate back to deck details page with all preserved parameters
    router.push({
      pathname: '/(tabs)/deckDetails',
      params: {
        deckId: deckId as string,
        deckTitle: deckTitle as string,
        deckType: deckType as string,
        deckDetailsBackgroundIndex: deckDetailsBackgroundIndex as string,
        date: date as string,
        flashcardCount: flashcardCount as string,
        percent: percent as string,
        company: company as string,
        isAIDeck: isAIDeck as string,
        mode: mode as string
      }
    });
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mainContainer}>
            {/* Content will go here */}
          </View>
        </ThemedView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    left: 16,
    zIndex: 1,
  },
  backButton: {
    paddingTop: 8,
  },
  mainContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 132 : 78,
    marginBottom: 20, // Space for navbar
  },
}); 