import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Platform, ImageSourcePropType, Pressable, Text, Image, Dimensions } from 'react-native';

interface AIDeckCardProps {
  backgroundImage: ImageSourcePropType;
  pressedBackgroundImage: ImageSourcePropType;
  onPress?: () => void;
  image?: ImageSourcePropType;
  cardType?: string;
  title?: string;
  flashcardCount?: number;
}

export function AIDeckCard({ 
  backgroundImage,
  pressedBackgroundImage,
  onPress,
  image,
  cardType,
  title,
  flashcardCount,
}: AIDeckCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  // Card type color and label logic
  const cardTypeMap: Record<string, { color: string; label: string }> = {
    behavioral: { color: '#FDAE61', label: 'Behavioral' },
    technical: { color: '#D7191C', label: 'Technical' },
    brainteasers: { color: '#357AF6', label: 'Brainteasers' },
    'case study': { color: '#C3EB79', label: 'Case Study' },
    others: { color: '#FDAE61', label: 'Others' },
    study: { color: '#5CC8BE', label: 'Study' },
  };
  const typeInfo = cardType && cardTypeMap[cardType];

  return (
    <View style={styles.outerContainer}>
      <View style={styles.shadowContainer}>
        <Pressable 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
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
                        <Text style={[styles.cardTypeText, { color: '#000' }]}>{typeInfo.label}</Text>
                      </View>
                    )}
                    {flashcardCount !== undefined && (
                      <Text style={styles.flashcardCountText}>{flashcardCount} cards</Text>
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