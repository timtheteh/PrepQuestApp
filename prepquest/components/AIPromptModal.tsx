import React from 'react';
import { StyleSheet, Animated, Dimensions, Text, View } from 'react-native';
import { AIDeckCard } from './AIDeckCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIPromptModalProps {
  visible: boolean;
  opacity?: Animated.Value;
}

const AI_DECKS = [
  {
    normal: require('@/assets/images/AIDeckCover1.png'),
    pressed: require('@/assets/images/AIDeckCover1Pressed.png'),
  },
  {
    normal: require('@/assets/images/AIDeckCover2.png'),
    pressed: require('@/assets/images/AIDeckCover2Pressed.png'),
  },
  {
    normal: require('@/assets/images/AIDeckCover3.png'),
    pressed: require('@/assets/images/AIDeckCover3Pressed.png'),
  },
];

export function AIPromptModal({ 
  visible,
  opacity = new Animated.Value(0)
}: AIPromptModalProps) {
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacity
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          Try these AI Decks created just for you!
        </Text>
        <View style={styles.imageContainer}>
          {AI_DECKS.map((deck, index) => (
            <AIDeckCard
              key={index}
              backgroundImage={deck.normal}
              pressedBackgroundImage={deck.pressed}
              onPress={() => console.log(`AI Deck ${index + 1} pressed`)}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 350,
    height: 504,
    marginLeft: -175, // Half of width
    marginTop: -252, // Half of height
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: 'Satoshi-Variable',
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 32,
  },
  imageContainer: {
    flex: 1,
    gap: 8,
  },
}); 