import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

interface FlashcardViewTopBarProps {
  onAudioPress?: () => void;
  onCopyPress?: () => void;
  onTrashPress?: () => void;
  isCopyButtonEnabled?: boolean;
  isAudioButtonEnabled?: boolean;
}

export function FlashcardViewTopBar({
  onAudioPress,
  onCopyPress,
  onTrashPress,
  isCopyButtonEnabled = true,
  isAudioButtonEnabled = true,
}: FlashcardViewTopBarProps) {
  return (
    <View style={styles.container}>
      <CircleIconButton
        onPress={isAudioButtonEnabled ? onAudioPress : undefined}
        disabled={!isAudioButtonEnabled}
        renderCustomIcon={(color) => <MaterialIcons name="volume-up" size={20} color={color} />}
      />
      <CircleIconButton
        onPress={isCopyButtonEnabled ? onCopyPress : undefined}
        disabled={!isCopyButtonEnabled}
        renderCustomIcon={(color) => <MaterialIcons name="content-copy" size={20} color={color} />}
      />
      <CircleIconButton
        color="#FF3B30"
        onPress={onTrashPress}
        renderCustomIcon={(color) => <Ionicons name="trash" size={20} color={color} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
  },
}); 