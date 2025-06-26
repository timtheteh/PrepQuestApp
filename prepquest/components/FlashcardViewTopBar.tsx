import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

interface FlashcardViewTopBarProps {
  onAudioPress?: () => void;
  onCopyPress?: () => void;
  onTrashPress?: () => void;
  isCopyButtonEnabled?: boolean;
  isAudioButtonEnabled?: boolean;
  isSpeechPlaying?: boolean;
  isSpeechPaused?: boolean;
}

export function FlashcardViewTopBar({
  onAudioPress,
  onCopyPress,
  onTrashPress,
  isCopyButtonEnabled = true,
  isAudioButtonEnabled = true,
  isSpeechPlaying = false,
  isSpeechPaused = false,
}: FlashcardViewTopBarProps) {
  return (
    <View style={styles.container}>
      <CircleIconButton
        onPress={onAudioPress}
        disabled={!isAudioButtonEnabled}
        renderCustomIcon={(color) =>
          isSpeechPlaying && !isSpeechPaused ? (
            <FontAwesome6 name="volume-xmark" size={20} color="#FF3B30" />
          ) : (
            <MaterialIcons name="volume-up" size={20} color={color} />
          )
        }
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