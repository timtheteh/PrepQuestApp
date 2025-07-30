import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { SmallGreenToggleMultiple } from '../general/SmallGreenToggleMultiple';
import { useIsFocused } from '@react-navigation/native';
import { fetchStatsData, StatsData } from '@/db/users';
import { useLanguage } from '@/contexts/LanguageContext';


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
    language === 'Chinese' ? '卡组' : 'Decks',
    language === 'Chinese' ? '卡片' : 'Flashcards',
    language === 'Chinese' ? '学习' : 'Study',
    language === 'Chinese' ? '面试' : 'Interview',
  ];

  // Function to load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStatsData();
      setStatsData(data);
    } catch (error) {
      console.error('Error loading stats data:', error);
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
        <Text style={styles.title}>{language === 'Chinese' ? '更多统计数据' : 'More Details'}</Text>
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
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{language === 'Chinese' ? '正在加载统计数据...' : 'Loading statistics...'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.accumulatedDecks}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '累计卡组' : 'Accumulated\nDecks'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.localStorageDecks}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '本地存储\n的卡片组' : 'Decks in local\nstorage'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground1} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>{statsData.totalQuizzedDecks}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '已测验卡组' : 'Total decks\nquizzed'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.accumulatedFlashcards}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '累计卡片' : 'Accumulated\nFlashcards'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.localStorageFlashcards}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '本地存储\n的卡片' : 'Flashcards in\nlocal storage'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground2} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>{statsData.totalQuizzedFlashcards}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '已测验卡片' : 'Total Flashcards\nquizzed'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.studyDecks}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '累计学习卡组' : 'Accumulated\nStudy Decks'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.studyLocalStorage}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '本地存储\n的学习卡组' : 'Study decks in\nlocal storage'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground3} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>{statsData.studyQuizzed}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '已测验\n学习卡组' : 'Total Study\ndecks quizzed'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.interviewDecks}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '累计面试卡组' : 'Accumulated\nInterview Decks'}</Text>
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
                      <Text style={styles.deckNumber}>{statsData.interviewLocalStorage}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '本地存储\n的面试卡组' : 'Interview decks\nin local storage'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground4} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>{statsData.interviewQuizzed}</Text>
                      <Text style={styles.deckLabel}>{language === 'Chinese' ? '已测验\n面试卡组' : 'Total Interview\ndecks quizzed'}</Text>
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
    fontFamily: 'Neuton-Regular',
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
    fontFamily: 'Neuton-Regular',
    fontSize: 64,
    color: '#222',
    textAlign: 'center',
    marginTop: -15,
  },
  deckLabel: {
    fontFamily: 'Neuton-Regular',
    fontSize: 20,
    color: '#222',
    textAlign: 'center',
    marginTop: 5,
  },
  placeholder: {
    marginTop: 32,
    width: '100%',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  placeholderText: {
    color: '#D5D4DD',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
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