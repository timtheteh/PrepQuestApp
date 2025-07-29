import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { UnfavoriteButton } from './UnfavoriteButton';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { strings } from '@/constants/strings';

interface ActionButtonsRowProps {
  style?: ViewStyle;
  iconNames: (keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap)[];
  iconLibraries?: ('ionicons' | 'materialicons')[];
  onCancel: () => void;
  onIconPress?: (index: number) => void;
  iconColors?: string[];
  showUnfavoriteButton?: boolean;
  onUnfavoritePress?: () => void;
}

export const ActionButtonsRow = React.memo(({ 
  style,
  iconNames,
  iconLibraries = [],
  onCancel,
  onIconPress,
  iconColors = [],
  showUnfavoriteButton = false,
  onUnfavoritePress
}: ActionButtonsRowProps) => {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const handleIconPress = (index: number) => {
    onIconPress?.(index);
  };

  const dynamicStyles = {
    cancelButton: {
      color: Colors[theme].text,
    },
  };

  const renderIcon = (iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap, index: number) => {
    return (
      <CircleIconButton
        key={index}
        iconName={iconName}
        iconLibrary={iconLibraries[index] || 'ionicons'}
        onPress={() => handleIconPress(index)}
        color={iconColors[index] || Colors[theme].normalIconColor}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      {iconNames.map(renderIcon)}
      {showUnfavoriteButton && (
        <UnfavoriteButton onPress={onUnfavoritePress} />
      )}
      <TouchableOpacity onPress={onCancel}>
        <Text style={[styles.cancelButton, dynamicStyles.cancelButton]}>{strings[language].cancel}</Text>
      </TouchableOpacity>
    </View>
  );
});

ActionButtonsRow.displayName = 'ActionButtonsRow';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    gap: 9,
    height: 44,
  },
  cancelButton: {
    fontSize: 14.5,
    fontFamily: Fonts.bodyMedium,
  },
}); 