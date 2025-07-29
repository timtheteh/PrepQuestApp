import React, { useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';

interface AddDeckModalButtonProps {
  onPress?: () => void;
  title: string;
  Icon: React.FC<SvgProps>;
  marginBottom?: number;
  isInViewFlashcardsPage?: boolean;
}

export const AddDeckModalButton = ({ 
  onPress,
  title,
  Icon,
  marginBottom = 8,
  isInViewFlashcardsPage = false
}: AddDeckModalButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const { theme } = useTheme();
  const themeColors = Colors[theme];

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    if (onPress) onPress();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[
        styles.button,
        { backgroundColor: themeColors.secondaryShade },
        isPressed ? [
          styles.buttonPressed,
          { borderColor: themeColors.brandColor2 }
        ] : [
          styles.buttonUnpressed,
          { borderColor: themeColors.brandColor2 }
        ],
        isInViewFlashcardsPage && { borderColor: themeColors.brandColor1 }
      ]}>
        <View style={styles.column}>
          <View style={{ marginBottom }}>
            <Text style={[
              styles.title,
              { color: themeColors.text }
            ]}>{title}</Text>
          </View>
          <View style={styles.iconRow}>
            <Icon />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 118,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonUnpressed: {
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // for Android shadow
  },
  buttonPressed: {
    borderWidth: 3,
    transform: [{ scale: 1.02 }], // slight scale effect when pressed
  },
  column: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    textAlign: 'center',
  },
  iconRow: {
    alignItems: 'center',
  },
}); 