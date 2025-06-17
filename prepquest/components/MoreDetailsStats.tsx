import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { SmallGreenToggleMultiple } from './SmallGreenToggleMultiple';

interface MoreDetailsStatsProps {
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}

const OPTIONS = ['Decks', 'Flashcards', 'Study', 'Interview'];
const meshBackground1 = require('../assets/images/meshBackground1.png');
const meshBackground2 = require('../assets/images/meshBackground2.png');
const meshBackground3 = require('../assets/images/meshBackground3.png');
const meshBackground4 = require('../assets/images/meshBackground4.png');

export function MoreDetailsStats({ selectedIndex: controlledIndex, onSelectedIndexChange }: MoreDetailsStatsProps) {
  const isControlled = controlledIndex !== undefined && onSelectedIndexChange !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const selectedIndex = isControlled ? controlledIndex : uncontrolledIndex;
  const setSelectedIndex = isControlled ? onSelectedIndexChange! : setUncontrolledIndex;
  const [renderedIndex, setRenderedIndex] = useState(selectedIndex);
  const [fadeAnim] = useState(new Animated.Value(1));

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
        <Text style={styles.title}>More Details</Text>
        <View style={{ marginTop: 15, marginBottom: 18 }}>
          <SmallGreenToggleMultiple
            options={OPTIONS}
            onToggle={setSelectedIndex}
            initialIndex={selectedIndex}
          />
        </View>
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>
          {/* Decks State */}
          {renderedIndex === 0 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground1} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>123</Text>
                      <Text style={styles.deckLabel}>Accumulated{"\n"}Decks</Text>
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
                      <Text style={styles.deckNumber}>45</Text>
                      <Text style={styles.deckLabel}>Decks in local{"\n"}storage</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground1} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>12</Text>
                      <Text style={styles.deckLabel}>Total decks{"\n"}quizzed</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Flashcards State */}
          {renderedIndex === 1 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground2} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>123</Text>
                      <Text style={styles.deckLabel}>Accumulated{"\n"}Flashcards</Text>
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
                      <Text style={styles.deckNumber}>45</Text>
                      <Text style={styles.deckLabel}>Flashcards in {"\n"}local storage</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground2} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>12</Text>
                      <Text style={styles.deckLabel}>Total Flashcards{"\n"}quizzed</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Study State */}
          {renderedIndex === 2 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground3} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>123</Text>
                      <Text style={styles.deckLabel}>Accumulated{"\n"}Decks</Text>
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
                      <Text style={styles.deckNumber}>45</Text>
                      <Text style={styles.deckLabel}>Decks in {"\n"}local storage</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground3} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>12</Text>
                      <Text style={styles.deckLabel}>Total Decks{"\n"}quizzed</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Interview State */}
          {renderedIndex === 3 && (
            <View style={styles.decksColumn}>
              <View style={styles.imageRow}>
                <View style={styles.imageStack}>
                  <Image source={meshBackground4} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>123</Text>
                      <Text style={styles.deckLabel}>Accumulated{"\n"}Decks</Text>
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
                      <Text style={styles.deckNumber}>45</Text>
                      <Text style={styles.deckLabel}>Decks in {"\n"}local storage</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.imageStack}>
                  <Image source={meshBackground4} style={styles.meshImage} resizeMode="contain" />
                  <View style={styles.overlayContainer}>
                    <View style={styles.overlayColumn}>
                      <Text style={styles.deckNumber}>12</Text>
                      <Text style={styles.deckLabel}>Total Decks{"\n"}quizzed</Text>
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