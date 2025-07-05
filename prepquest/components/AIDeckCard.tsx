import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Platform, ImageSourcePropType, Pressable, Text, Image, Dimensions } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Add language mappings for all user-facing strings
const STRINGS = {
  cardTypes: {
    behavioral: { English: 'Behavioral', Chinese: '行为面试' },
    technical: { English: 'Technical', Chinese: '技术面试' },
    brainteasers: { English: 'Brainteasers', Chinese: '脑筋急转弯' },
    'case study': { English: 'Case Study', Chinese: '案例分析' },
    others: { English: 'Others', Chinese: '其他' },
    study: { English: 'Study', Chinese: '学习' },
  },
  cards: { English: 'cards', Chinese: '张卡片' },
};

export function AIDeckCard({ 
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
}: AIDeckCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const { language } = useLanguage();
  const lang: 'English' | 'Chinese' = language === 'Chinese' ? 'Chinese' : 'English';

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handleCardPress = () => {
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
  };

  // Card type color and label logic
  const cardTypeMap: Record<string, { color: string; label: { English: string; Chinese: string } }> = {
    behavioral: { color: '#FDAE61', label: STRINGS.cardTypes.behavioral },
    technical: { color: '#D7191C', label: STRINGS.cardTypes.technical },
    brainteasers: { color: '#357AF6', label: STRINGS.cardTypes.brainteasers },
    'case study': { color: '#C3EB79', label: STRINGS.cardTypes['case study'] },
    others: { color: '#FDAE61', label: STRINGS.cardTypes.others },
    study: { color: '#5CC8BE', label: STRINGS.cardTypes.study },
  };
  const typeInfo = cardType && cardTypeMap[cardType];

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
                  <Image source={require('@/assets/companyIcons/StudyCardIcon.png')} style={styles.cardIconImage} />
                )}
                {!image && !isStudy && (
                  <Image source={require('@/assets/companyIcons/companyDefaultIcon.png')} style={styles.cardIconImage} />
                )}
                {/* Title */}
                {title && (
                  <Text 
                    style={styles.cardTitle}
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
                        <Text style={[styles.cardTypeText, { color: '#000' }]}>{typeInfo.label[lang]}</Text>
                      </View>
                    )}
                    {flashcardCount !== undefined && (
                      <Text style={styles.flashcardCountText}>
                        {lang === 'Chinese'
                          ? `${flashcardCount}${STRINGS.cards[lang]}`
                          : `${flashcardCount} ${STRINGS.cards[lang]}`}
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
}

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
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    color: '#000',
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
    fontFamily: 'Satoshi-Italic',
    fontSize: Dimensions.get('window').height < 670 ? 12 : 14,
    color: '#222',
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
}); 