import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsRowProps {
  style?: ViewStyle;
  iconNames: Array<keyof typeof Ionicons.glyphMap>;
  onCancel: () => void;
  onIconPress?: (index: number) => void;
  iconColors?: string[];
}

export function ActionButtonsRow({ 
  style,
  iconNames,
  onCancel,
  onIconPress,
  iconColors = []
}: ActionButtonsRowProps) {
  return (
    <View style={[styles.container, style]}>
      {iconNames.map((iconName, index) => (
        <CircleIconButton
          key={index}
          iconName={iconName}
          onPress={() => onIconPress?.(index)}
          color={iconColors[index] || 'black'}
        />
      ))}
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.cancelButton}>Cancel</Text>
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