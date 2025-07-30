import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { SmallGreenToggleMultiple } from '../general/SmallGreenToggleMultiple';
import { useIsFocused } from '@react-navigation/native';
import { fetchStatsData, StatsData } from '@/db/users';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';


interface MoreDetailsStatsProps {
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}

const meshBackground1 = require('../../assets/images/meshBackground1.png');
const meshBackground2 = require('../../assets/images/meshBackground2.png');
const meshBackground3 = require('../../assets/images/meshBackground3.png');
const meshBackground4 = require('../../assets/images/meshBackground4.png');



export function MoreDetailsStats({ selectedIndex: controlledIndex, onSelectedIndexChange }: MoreDetailsStatsProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const isControlled = controlledIndex !== undefined && onSelectedIndexChange !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const selectedIndex = isControlled ? controlledIndex : uncontrolledIndex;
  const setSelectedIndex = isControlled ? onSelectedIndexChange! : setUncontrolledIndex;
  const [renderedIndex, setRenderedIndex] = useState(selectedIndex);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [statsData, setStatsData] = useState<StatsData>({
    accumulatedDecks: 0,
    localStorageDecks: 0,
    totalQuizzedDecks: 0,
    accumulatedFlashcards: 0,
    localStorageFlashcards: 0,
    totalQuizzedFlashcards: 0,
    studyDecks: 0,
    studyLocalStorage: 0,
    studyQuizzed: 0,
    interviewDecks: 0,
    interviewLocalStorage: 0,
    interviewQuizzed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();

  const localizedOptions = [
    strings[language].moreDetailsDecks,
    strings[language].moreDetailsFlashcards,
    strings[language].moreDetailsStudy,
    strings[language].moreDetailsInterview,
  ];

  // Function to load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStatsData();
      setStatsData(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when screen comes into focus
  useEffect(() => {
    loadData();
  }, [isFocused]); // Refresh data when screen comes into focus

  // Fade out, then switch content, then fade in
  useEffect(() => {
    if (selectedIndex === renderedIndex) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setRenderedIndex(selectedIndex);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedIndex, renderedIndex, fadeAnim]);

  return (
    <>
      {/* Preload all mesh backgrounds off-screen */}
      <Image source={meshBackground1} style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }} />
      <Image source={meshBackground2} style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }} />
      <Image source={meshBackground3} style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }} />
      <Image source={meshBackground4} style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }} />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{strings[language].moreDetails}</Text>
        <View style={{ marginTop: 15, marginBottom: 18 }}>
          <SmallGreenToggleMultiple
            options={localizedOptions}
            onToggle={setSelectedIndex}
            initialIndex={selectedIndex}
          />
        </View>
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>
          {/* Loading State */}
          {isLoading && (
            <View style={[styles.placeholder, { backgroundColor: colors.secondaryShade }]}>
              <Text style={[styles.placeholderText, { color: colors.unselectedText }]}>{strings[language].loadingStatistics}</Text>
            </View>
          )}
          
          {/* Decks State */}
          {!isLoading && renderedIndex === 0 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground1} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.accumulatedDecks}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].accumulatedDecks}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* Second row: two mesh backgrounds spaced between */}
              <View style={styles.imageRowTwoUp}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground1} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.localStorageDecks}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].decksInLocalStorage}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground1} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.totalQuizzedDecks}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].totalDecksQuizzed}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Flashcards State */}
          {!isLoading && renderedIndex === 1 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground2} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.accumulatedFlashcards}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].accumulatedFlashcards}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* Second row: two mesh backgrounds spaced between */}
              <View style={styles.imageRowTwoUp}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground2} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.localStorageFlashcards}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].flashcardsInLocalStorage}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground2} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.totalQuizzedFlashcards}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].totalFlashcardsQuizzed}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Study State */}
          {!isLoading && renderedIndex === 2 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground3} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.studyDecks}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].accumulatedStudyDecks}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* Second row: two mesh backgrounds spaced between */}
              <View style={styles.imageRowTwoUp}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground3} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.studyLocalStorage}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].studyDecksInLocalStorage}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground3} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.studyQuizzed}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].totalStudyDecksQuizzed}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Interview State */}
          {!isLoading && renderedIndex === 3 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground4} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.interviewDecks}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].accumulatedInterviewDecks}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* Second row: two mesh backgrounds spaced between */}
              <View style={styles.imageRowTwoUp}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground4} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.interviewLocalStorage}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].interviewDecksInLocalStorage}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground4} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={[styles.deckNumber, { color: colors.text }]}>{statsData.interviewQuizzed}</Text>
                      <Text style={[styles.deckLabel, { color: colors.text }]}>{strings[language].totalInterviewDecksQuizzed}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.title,
    textAlign: 'center',
  },
  decksColumn: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  imageRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStack: {
    width: 152,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meshImage: {
    width: 152,
    height: 170,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayContainer: {
    width: 152,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckNumber: {
    fontFamily: Fonts.title,
    fontSize: 64,
    textAlign: 'center',
    marginTop: -15,
  },
  deckLabel: {
    fontFamily: Fonts.title,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 5,
  },
  placeholder: {
    marginTop: 32,
    width: '100%',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  imageRowTwoUp: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 5,
  },
}); 