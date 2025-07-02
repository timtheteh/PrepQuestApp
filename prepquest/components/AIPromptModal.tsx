import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Animated, Dimensions, Text, View } from 'react-native';
import { AIDeckCard } from './AIDeckCard';
import { MenuContext } from '@/contexts/MenuContext';
import { AICardDesigns } from '@/constants/cardDesigns';
import { getAIDecks, convertHexToImageSource, AIDeck } from '@/db/decks';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIPromptModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  sourcePage?: string;
}

export function AIPromptModal({ 
  visible,
  opacity = new Animated.Value(0),
  sourcePage
}: AIPromptModalProps) {
  const { 
    setIsMenuOpen, 
    menuOverlayOpacity,
    setIsAIPromptOpen,
    aiPromptOpacity
  } = useContext(MenuContext);

  const [aiDecks, setAiDecks] = useState<AIDeck[]>([]);
  const [loading, setLoading] = useState(true);

  // Load AI decks from database
  useEffect(() => {
    const loadAIDecks = async () => {
      try {
        setLoading(true);
        const decks = await getAIDecks();
        setAiDecks(decks);
      } catch (error) {
        console.error('Error loading AI decks:', error);
        setAiDecks([]);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadAIDecks();
    }
  }, [visible]);

  const dismissModal = () => {
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(aiPromptOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsMenuOpen(false);
      setIsAIPromptOpen(false);
    });
  };

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
        {loading ? (
          <>
            <Text style={styles.title}>
              Try these AI Decks created just for you!
            </Text>
            <View style={styles.imageContainer}>
              <Text style={styles.loadingText}>Loading AI decks...</Text>
            </View>
          </>
        ) : aiDecks.length > 0 ? (
          <>
            <Text style={styles.title}>
              Try these AI Decks created just for you!
            </Text>
            <View style={styles.imageContainer}>
              {aiDecks.map((deck, index) => {
                const cardDesign = AICardDesigns[deck.cardDesignIndex] || AICardDesigns[0];
                const imageSource = convertHexToImageSource(deck.interviewCompanyIcon);
                
                return (
                  <AIDeckCard
                    key={deck.deckID}
                    backgroundImage={cardDesign.background}
                    pressedBackgroundImage={cardDesign.pressed}
                    image={imageSource}
                    cardType={deck.interviewType || 'study'}
                    title={deck.deckName}
                    flashcardCount={deck.flashcardCount || 0}
                    deckDetailsBackgroundIndex={deck.cardDesignIndex}
                    dismissModal={dismissModal}
                    sourcePage={sourcePage}
                    isStudy={deck.deckType === 'study'}
                    deckID={deck.deckID}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.emptyStateHeader}>
              <Text style={styles.emptyStateTitle}>Oops! No deck</Text>
              <Text style={styles.emptyStateTitle}>suggestions for now</Text>
            </View>
            
            <View style={styles.emptyStateAnimationContainer}>
              <LottieView
                source={require('@/assets/animations/EmptyState2.json')}
                autoPlay
                loop
                style={styles.emptyStateAnimation}
              />
            </View>
            
            <View style={styles.emptyStateFooter}>
              <Text style={styles.emptyStateFooterText}>{"We'll generate more"}</Text>
              <Text style={styles.emptyStateFooterText}>as you practice more!</Text>
            </View>
          </>
        )}
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
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Satoshi-Variable',
    textAlign: 'center',
    marginTop: 20,
  },
  noDecksText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Satoshi-Variable',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyStateHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: 'Satoshi-Variable',
    color: '#000',
    lineHeight: 32,
  },
  emptyStateAnimationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateAnimation: {
    width: 280,
    height: 280,
    marginTop: -50
  },
  emptyStateFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateFooterText: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Satoshi-Variable',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
}); 