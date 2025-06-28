import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated } from 'react-native';
import { HeaderIconButtons, HeaderIconButtonsRef } from '@/components/HeaderIconButtons';
import { Title } from '@/components/Title';
import { useState, useRef, useContext, useEffect } from 'react';
import { MenuContext } from './_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavBarRef } from '@/components/NavBar';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';

const SCREEN_TRANSITION_DURATION = 200;

// Mock data for decks in a folder
const deckData = [
  { title: 'JavaScript Fundamentals', dateCreated: 'Dec 18, 2024', cardCount: 45, percent: 85 },
  { title: 'React Hooks', dateCreated: 'Dec 16, 2024', cardCount: 32, percent: 92 },
  { title: 'TypeScript Basics', dateCreated: 'Dec 14, 2024', cardCount: 28, percent: 78 },
  { title: 'Node.js Backend', dateCreated: 'Dec 12, 2024', cardCount: 38, percent: 65 },
  { title: 'Database Design', dateCreated: 'Dec 10, 2024', cardCount: 25, percent: 88 },
  { title: 'API Development', dateCreated: 'Dec 8, 2024', cardCount: 42, percent: 73 },
];

export default function ViewDecksInFolderScreen() {
  const router = useRouter();
  const { folderTitle, folderId } = useLocalSearchParams();
  const headerIconsRef = useRef<HeaderIconButtonsRef>(null);
  const isFocused = useIsFocused();
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setShowSlidingMenu,
    navbarRef
  } = useContext(MenuContext);

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;

  // Initialize opacity to 0 when component mounts
  useEffect(() => {
    screenOpacity.setValue(0);
  }, []);

  // Reset header icons state when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset header icons
      headerIconsRef.current?.reset();
      // Add a small delay for smoother fade-in animation
      setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: SCREEN_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      // Reset opacity to 0 when screen loses focus
      screenOpacity.setValue(0);
    }
  }, [isFocused, screenOpacity]);

  const handleBackPress = () => {
    // Reset header icons state
    headerIconsRef.current?.reset();
    
    // Navigate back to folders page
    if (Platform.OS === 'ios') {
      navbarRef?.current?.resetAnimation();
      setTimeout(() => {
        router.push('/(tabs)/folders');
      }, 50);
    } else {
      router.push('/(tabs)/folders');
      setTimeout(() => {
        navbarRef?.current?.resetAnimation();
      }, 50);
    }
  };

  return (
    <Animated.View style={[styles.animatedContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <AntDesign name="arrowleft" size={32} color="black" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerIconsContainer}>
            {/* <HeaderIconButtons 
              ref={headerIconsRef}
              onAIPress={handleSparklesPress}
              onCalendarPress={handleCalendarPress}
              pageType="viewDecksInFolder"
            /> */}
          </View>
          
          <View style={styles.mainContentWrapper}>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                  {/* <Title>
                    {folderTitle || 'Folder'}
                  </Title> */}
                </View>
              </View>
              
              <View style={styles.decksContainer}>
                <Text style={styles.decksCount}>
                  {deckData.length} deck{deckData.length !== 1 ? 's' : ''}
                </Text>
                
                {/* Placeholder for deck cards */}
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    Deck cards will be displayed here
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
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
  headerIconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 16,
    right: 16,
    zIndex: 1,
  },
  backButton: {
    paddingTop: 10,
    paddingRight: 8,
  },
  mainContentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 108 : 56,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  titleContainer: {
    position: 'relative',
    height: Platform.OS === 'android' ? 32 : 24,
  },
  decksContainer: {
    flex: 1,
    marginTop: 16,
  },
  decksCount: {
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: '#666666',
    marginBottom: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: '#999999',
    textAlign: 'center',
  },
}); 