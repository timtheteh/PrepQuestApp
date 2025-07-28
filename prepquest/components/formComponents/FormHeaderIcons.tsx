import React, { useCallback, useMemo } from 'react';
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

  // Memoize the icon renderer to prevent recreation on every render
  const renderBackInTimeIcon = useCallback((color: string) => (
    <Entypo name="back-in-time" size={20} color={color} />
  ), []);

  // Memoize dynamic styles to prevent recreation on every render
  const dynamicStyles = useMemo(() => ({
    clearAllText: {
      color: Colors[theme].text,
    },
  }), [theme]);

  // Memoize the CircleIconButton props to prevent unnecessary re-renders
  const circleButtonProps = useMemo(() => ({
    color: Colors[theme].normalIconColor,
    renderCustomIcon: renderBackInTimeIcon,
    onPress: onUseMostRecentFormPress,
  }), [theme, renderBackInTimeIcon, onUseMostRecentFormPress]);

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