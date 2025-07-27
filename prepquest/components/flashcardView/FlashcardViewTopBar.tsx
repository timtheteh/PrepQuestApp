import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from '../general/CircleIconButton';
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

export const FlashcardViewTopBar = React.memo(({
  onAudioPress,
  onCopyPress,
  onTrashPress,
  isCopyButtonEnabled = true,
  isAudioButtonEnabled = true,
  isSpeechPlaying = false,
  isSpeechPaused = false,
}: FlashcardViewTopBarProps) => {
  // Memoize the render functions to prevent recreation on every render
  const renderAudioIcon = useCallback((color: string) => {
    return isSpeechPlaying && !isSpeechPaused ? (
      <FontAwesome6 name="volume-xmark" size={20} color="#FF3B30" />
    ) : (
      <MaterialIcons name="volume-up" size={20} color={color} />
    );
  }, [isSpeechPlaying, isSpeechPaused]);

  const renderCopyIcon = useCallback((color: string) => {
    return <MaterialIcons name="content-copy" size={20} color={color} />;
  }, []);

  const renderTrashIcon = useCallback((color: string) => {
    return <Ionicons name="trash" size={20} color={color} />;
  }, []);

  // Memoize styles to prevent recreation
  const containerStyle = useMemo(() => styles.container, []);

  return (
    <View style={containerStyle}>
      <CircleIconButton
        onPress={onAudioPress}
        disabled={!isAudioButtonEnabled}
        renderCustomIcon={renderAudioIcon}
      />
      <CircleIconButton
        onPress={isCopyButtonEnabled ? onCopyPress : undefined}
        disabled={!isCopyButtonEnabled}
        renderCustomIcon={renderCopyIcon}
      />
      <CircleIconButton
        color="#FF3B30"
        onPress={onTrashPress}
        renderCustomIcon={renderTrashIcon}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
  },
}); 