import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { CircleIconButton } from '../general/CircleIconButton';
import { Entypo } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface FormHeaderIconsProps {
  onUseMostRecentFormPress?: () => void;
  onClearAllPress?: () => void;
}

export const FormHeaderIcons = React.memo(({ 
  onUseMostRecentFormPress,
  onClearAllPress
}: FormHeaderIconsProps) => {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const renderBackInTimeIcon = (color: string) => (
    <Entypo name="back-in-time" size={20} color={color} />
  );

  const dynamicStyles = {
    clearAllText: {
      color: Colors[theme].text,
    },
  };

  const circleButtonProps = {
    color: Colors[theme].normalIconColor,
    renderCustomIcon: renderBackInTimeIcon,
    onPress: onUseMostRecentFormPress,
  };

  return (
    <View style={styles.container}>
      <CircleIconButton {...circleButtonProps} />
      <TouchableOpacity onPress={onClearAllPress}>
        <Text style={[styles.clearAllText, dynamicStyles.clearAllText]}>{strings[language].clearAll}</Text>
      </TouchableOpacity>
    </View>
  );
});

FormHeaderIcons.displayName = 'FormHeaderIcons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
}); 