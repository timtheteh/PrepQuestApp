import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from '../general/CircleIconButton';
import { Entypo , MaterialIcons , Ionicons , FontAwesome5 } from '@expo/vector-icons';

interface DeckDetailsTopBarProps {
  onStudyPress?: () => void;
  onQuizPress?: () => void;
  onFolderPress?: () => void;
  onDeletePress?: () => void;
  onEditNamePress?: () => void;
  editNameSelected?: boolean;
  isFolderDisabled?: boolean;
  isDeleteDisabled?: boolean;
  isEditNameDisabled?: boolean;
}

export const DeckDetailsTopBar = React.memo(({
  onStudyPress,
  onQuizPress,
  onFolderPress,
  onDeletePress,
  onEditNamePress,
  editNameSelected,
  isFolderDisabled,
  isDeleteDisabled,
  isEditNameDisabled,
}: DeckDetailsTopBarProps) => {
  // Memoize icon render functions to prevent unnecessary re-renders
  const renderStudyIcon = useCallback((color: string) => (
    <Entypo name="open-book" size={20} color={color} />
  ), []);

  const renderQuizIcon = useCallback((color: string) => (
    <MaterialIcons name="quiz" size={20} color={color} />
  ), []);

  const renderFolderIcon = useCallback((color: string) => (
    <Ionicons name="folder" size={20} color={color} />
  ), []);

  const renderDeleteIcon = useCallback((color: string) => (
    <Ionicons name="trash" size={20} color={color} />
  ), []);

  const renderEditIcon = useCallback((color: string) => (
    <FontAwesome5 name="pen" size={16} color={color} />
  ), []);

  return (
    <View style={styles.container}>
      <CircleIconButton 
        onPress={onStudyPress}
        renderCustomIcon={renderStudyIcon}
      />
      <CircleIconButton 
        onPress={onQuizPress}
        renderCustomIcon={renderQuizIcon}
      />
      <CircleIconButton 
        onPress={onFolderPress}
        disabled={isFolderDisabled}
        renderCustomIcon={renderFolderIcon}
      />
      <CircleIconButton 
        color="#FF3B30"
        onPress={onDeletePress}
        disabled={isDeleteDisabled}
        renderCustomIcon={renderDeleteIcon}
      />
      <CircleIconButton 
        onPress={onEditNamePress}
        selected={editNameSelected}
        disabled={isEditNameDisabled}
        renderCustomIcon={renderEditIcon}
      />
    </View>
  );
});

DeckDetailsTopBar.displayName = 'DeckDetailsTopBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
  },
}); 