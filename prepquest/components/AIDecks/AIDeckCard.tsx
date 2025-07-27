import { router } from 'expo-router';
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ImageBackground, Platform, ImageSourcePropType, Pressable, Text, Image, Dimensions } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';

interface AIDeckCardProps {
  backgroundImage: ImageSourcePropType;
  pressedBackgroundImage: ImageSourcePropType;
  onPress?: () => void;
  image?: ImageSourcePropType;
  cardType?: string;
  title?: string;
  flashcardCount?: number;
  isAIDeck?: boolean;
  isSelectMode?: boolean;
  deckDetailsBackgroundIndex?: number;
  company?: string;
  dismissModal?: () => void;
  sourcePage?: string;
  isStudy?: boolean;
  deckID?: number;
}

// Move static assets outside component to prevent recreation
const STUDY_CARD_ICON = require('@/assets/companyIcons/StudyCardIcon.png');
const COMPANY_DEFAULT_ICON = require('@/assets/companyIcons/companyDefaultIcon.png');

export const AIDeckCard = React.memo(({ 
  backgroundImage,
  pressedBackgroundImage,
  onPress,
  image,
  cardType,
  title,
  flashcardCount,
  isAIDeck = true,
  isSelectMode = false,
  deckDetailsBackgroundIndex,
  company,
  dismissModal,
  sourcePage,
  isStudy = false,
  deckID
}: AIDeckCardProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const lang: 'English' | 'Chinese' = language === 'Chinese' ? 'Chinese' : 'English';

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleCardPress = useCallback(() => {
    if (!isSelectMode) {
      // Dismiss the AI prompt modal first
      if (dismissModal) {
        dismissModal();
      }
      
      // Then navigate to deck details
      router.push({
        pathname: '/(tabs)/deckDetails',
        params: {
          deckId: deckID?.toString() || 'unknown',          
          isAIDeck: isAIDeck ? 'true' : 'false',
          sourcePage: sourcePage || 'unknown',
        }
      })
    }
  }, [isSelectMode, dismissModal, deckID, isAIDeck, sourcePage]);

  // Memoize card type map since it only depends on lang
  const cardTypeMap = useMemo(() => ({
    behavioral: { color: '#FDAE61', label: strings[lang].cardTypes.behavioral },
    technical: { color: '#D7191C', label: strings[lang].cardTypes.technical },
    brainteasers: { color: '#357AF6', label: strings[lang].cardTypes.brainteasers },
    'case study': { color: '#C3EB79', label: strings[lang].cardTypes['case study'] },
    others: { color: '#FDAE61', label: strings[lang].cardTypes.others },
    study: { color: '#5CC8BE', label: strings[lang].cardTypes.study },
  } as Record<string, { color: string; label: string }>), [lang]);

  const typeInfo = useMemo(() => cardType && cardTypeMap[cardType], [cardType, cardTypeMap]);

  // Memoize theme-dependent styles
  const themeTextColor = useMemo(() => ({ color: Colors[theme].text }), [theme]);
  const cardTitleStyle = useMemo(() => [styles.cardTitle, themeTextColor], [themeTextColor]);
  const cardTypeTextStyle = useMemo(() => [styles.cardTypeText, themeTextColor], [themeTextColor]);
  const flashcardCountTextStyle = useMemo(() => [styles.flashcardCountText, themeTextColor], [themeTextColor]);

  // Memoize flashcard count text
  const flashcardCountText = useMemo(() => 
    flashcardCount !== undefined ? `${flashcardCount} ${strings[lang].cards}` : null, 
    [flashcardCount, lang]
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.shadowContainer}>
        <Pressable 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleCardPress}
        >
          <View style={styles.container}>
            <ImageBackground 
              source={isPressed ? pressedBackgroundImage : backgroundImage}
              style={styles.imageBackground}
              imageStyle={styles.backgroundImage}
              resizeMode="contain"
            >
              <View style={styles.cardContentContainer}>
                {/* Icon image at top left */}
                {image && (
                  <Image source={image} style={styles.cardIconImage} />
                )}
                {!image && isStudy && (
                  <Image source={STUDY_CARD_ICON} style={styles.cardIconImage} />
                )}
                {!image && !isStudy && (
                  <Image source={COMPANY_DEFAULT_ICON} style={styles.cardIconImage} />
                )}
                {/* Title */}
                {title && (
                  <Text 
                    style={cardTitleStyle}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                )}
                {/* Flashcard Count and Card Type Row */}
                {(flashcardCount !== undefined || typeInfo) && (
                  <View style={styles.bottomRow}>
                    {typeInfo && (
                      <View
                        style={[
                          styles.cardTypePill,
                          { borderColor: typeInfo.color }
                        ]}
                      >
                        <Text style={cardTypeTextStyle}>{typeInfo.label}</Text>
                      </View>
                    )}
                    {flashcardCountText && (
                      <Text style={flashcardCountTextStyle}>
                        {flashcardCountText}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </ImageBackground>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  shadowContainer: {
    width: '97%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
    }),
  },
  container: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageBackground: {
    height: '100%',
    width: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  cardContentContainer: {
    flex: 1,
    margin: 10,
    justifyContent: 'flex-end',
  },
  cardIconImage: {
    position: 'absolute',
    left: 10,
    width: 54,
    height: 54,
    resizeMode: 'contain',
    zIndex: 2,
    top: '50%',
    transform: [{ translateY: -27 }], // Half of the icon height (35/2) to center it
  },
  cardTitle: {
    position: 'absolute',
    top: 20,
    right: 5,
    left: 80,
    fontFamily: Fonts.title,
    fontSize: 24,
    zIndex: 2,
    lineHeight: Platform.OS === 'ios' ? 24 : 28,
    textAlign: 'right',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 5,
    left: '40%',
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingRight: 10,
    paddingBottom: 10,
  },
  flashcardCountText: {
    fontFamily: Fonts.bodyItalic,
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
  },
  cardTypePill: {
    width: 84,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTypeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
  },
}); 