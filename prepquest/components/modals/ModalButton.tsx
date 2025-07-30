import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface ModalButtonProps {
  text: string;
  onPress?: () => void;
  style?: ViewStyle;
  selected?: boolean;
  language?: string;
}

export function ModalButton({ 
  text,
  onPress,
  style,
  selected = false,
}: ModalButtonProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  // const fontFamily = language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium';
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: colors.secondaryShade },
        selected && { backgroundColor: colors.brandColor2 },
        style
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.text, 
        { fontFamily: Fonts.bodyMedium, color: colors.text },
        selected && { color: colors.background }
      ]}>
        {text}
      </Text>
      {selected && (
        <View style={styles.checkContainer}>
          <Feather name="check" size={20} color={colors.background} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 141,
    height: 46,
    borderRadius: 30,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  text: {
    fontSize: 16,
  },
  checkContainer: {
    position: 'absolute',
    right: 15,
  },
}); 