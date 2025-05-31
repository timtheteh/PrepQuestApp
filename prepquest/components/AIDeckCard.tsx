import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Platform, ImageSourcePropType, Pressable } from 'react-native';

interface AIDeckCardProps {
  backgroundImage: ImageSourcePropType;
  pressedBackgroundImage: ImageSourcePropType;
  onPress?: () => void;
}

export function AIDeckCard({ 
  backgroundImage,
  pressedBackgroundImage,
  onPress,
}: AIDeckCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

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
            />
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
}); 