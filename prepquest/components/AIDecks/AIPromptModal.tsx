import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Animated, Dimensions, Text, View } from 'react-native';
import { AIDeckCard } from './AIDeckCard';
import { MenuContext } from '@/contexts/MenuContext';
import { AICardDesigns } from '@/constants/cardDesigns';
import { getAIDecks, getCompanyIconImageSource, AIDeck } from '@/db/decks';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIPromptModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  sourcePage?: string;
}

const EMPTY_STATE_ANIMATION = require('@/assets/animations/EmptyState1.json');

const ANIMATION_CONFIG = {
  toValue: 0,
  duration: 300,
  useNativeDriver: true,
};

export const AIPromptModal = function AIPromptModal({ 
  visible,
  opacity = new Animated.Value(0),
  sourcePage
}: AIPromptModalProps) {
  const {
    menuOverlayOpacity,
    setIsMenuOpen,
    setIsAIPromptOpen,
    aiPromptOpacity
  } = useContext(MenuContext);

  const [aiDecks, setAiDecks] = useState<AIDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageSources, setImageSources] = useState<Map<number, { uri: string } | undefined>>(new Map());
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Memoize theme-dependent styles
  const themeStyles = useMemo(() => ({
    container: {
      backgroundColor: Colors[theme].secondaryShade,
    },
    title: {
      color: Colors[theme].text,
    },
    loadingText: {
      color: Colors[theme].text,
    },
    emptyStateTitle: {
      color: Colors[theme].text,
    },
    emptyStateFooterText: {
      color: Colors[theme].text,
    },
  }), [theme]);

  // Memoize language-dependent strings
  const currentStrings = useMemo(() => strings[language], [language]);

  // Memoize dismissModal function
  const dismissModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, ANIMATION_CONFIG),
      Animated.timing(aiPromptOpacity, ANIMATION_CONFIG)
    ]).start(() => {
      setIsMenuOpen(false);
      setIsAIPromptOpen(false);
    });
  }, [menuOverlayOpacity, aiPromptOpacity, setIsMenuOpen, setIsAIPromptOpen]);

  // Load AI decks from database
  useEffect(() => {
    const loadAIDecks = async () => {
      try {
        setLoading(true);
        const decks = await getAIDecks();
        setAiDecks(decks);
        
        // Load image sources for each deck
        const sources = new Map<number, { uri: string } | undefined>();
        for (const deck of decks) {
          const imageSource = await getCompanyIconImageSource(deck.interviewCompanyIcon);
          sources.set(deck.deckID, imageSource);
        }
        setImageSources(sources);
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

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        themeStyles.container,
        {
          opacity: opacity,
        }
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <>
            <Text style={[styles.title, themeStyles.title]}>
              {currentStrings.aiPromptTitle}
            </Text>
            <View style={styles.imageContainer}>
              <Text style={[styles.loadingText, themeStyles.loadingText]}>
                {currentStrings.loadingAiDecks}
              </Text>
            </View>
          </>
        ) : aiDecks.length > 0 ? (
          <>
            <Text style={[styles.title, themeStyles.title]}>
              {currentStrings.aiPromptTitle}
            </Text>
            <View style={styles.imageContainer}>
              {aiDecks.map((deck) => {
                const cardDesign = AICardDesigns[deck.cardDesignIndex] || AICardDesigns[0];
                const imageSource = imageSources.get(deck.deckID);
                
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
              <Text style={[styles.emptyStateTitle, themeStyles.emptyStateTitle]}>
                {currentStrings.noDeckSuggestions}
              </Text>
              <Text style={[styles.emptyStateTitle, themeStyles.emptyStateTitle]}>
                {currentStrings.noDeckSuggestionsSubtitle}
              </Text>
            </View>
            
            <View style={styles.emptyStateAnimationContainer}>
              <LottieView
                source={EMPTY_STATE_ANIMATION}
                autoPlay
                loop
                style={styles.emptyStateAnimation}
              />
            </View>
            
            <View style={styles.emptyStateFooter}>
              <Text style={[styles.emptyStateFooterText, themeStyles.emptyStateFooterText]}>
                {currentStrings.emptyStateFooter}
              </Text>
              <Text style={[styles.emptyStateFooterText, themeStyles.emptyStateFooterText]}>
                {currentStrings.emptyStateFooterSubtitle}
              </Text>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '85%',
    height: 488,
    marginLeft: '-42.5%', // Half of width
    marginTop: -252, // Half of height
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
    fontFamily: Fonts.bodyBold,
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 32,
  },
  imageContainer: {
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
    marginTop: 20,
  },
  noDecksText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Fonts.bodyBold,
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
    fontFamily: Fonts.bodyBold,
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
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 