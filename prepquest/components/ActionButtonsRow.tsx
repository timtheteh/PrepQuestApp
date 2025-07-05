import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { UnfavoriteButton } from './UnfavoriteButton';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';

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

export function ActionButtonsRow({ 
  style,
  iconNames,
  iconLibraries = [],
  onCancel,
  onIconPress,
  iconColors = [],
  showUnfavoriteButton = false,
  onUnfavoritePress
}: ActionButtonsRowProps) {
  const { language } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      {iconNames.map((iconName, index) => (
        <CircleIconButton
          key={index}
          iconName={iconName}
          iconLibrary={iconLibraries[index] || 'ionicons'}
          onPress={() => onIconPress?.(index)}
          color={iconColors[index] || 'black'}
        />
      ))}
      {showUnfavoriteButton && (
        <UnfavoriteButton onPress={onUnfavoritePress} />
      )}
      <TouchableOpacity onPress={onCancel}>
        <Text style={{ fontSize: 14.5, 
          // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium', 
          color: '#000000' }}>{language === 'Chinese' ? '取消' : 'Cancel'}</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
  },
}); 