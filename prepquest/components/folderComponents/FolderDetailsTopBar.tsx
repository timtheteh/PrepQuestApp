import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from '../general/CircleIconButton';
import { Ionicons , FontAwesome5 } from '@expo/vector-icons';

interface FolderDetailsTopBarProps {
  onDeletePress?: () => void;
  onEditNamePress?: () => void;
  editNameSelected?: boolean;
}

export const FolderDetailsTopBar = React.memo(({
  onDeletePress,
  onEditNamePress,
  editNameSelected,
}: FolderDetailsTopBarProps) => {
  // Memoize the delete icon renderer to prevent recreation on every render
  const renderDeleteIcon = useCallback((color: string) => (
    <Ionicons name="trash" size={24} color={color} />
  ), []);

  // Memoize the edit icon renderer to prevent recreation on every render
  const renderEditIcon = useCallback((color: string) => (
    <FontAwesome5 name="pen" size={18} color={color} />
  ), []);

  // Memoize the delete button props to prevent unnecessary re-renders
  const deleteButtonProps = useMemo(() => ({
    color: "#FF3B30",
    onPress: onDeletePress,
    renderCustomIcon: renderDeleteIcon,
  }), [onDeletePress, renderDeleteIcon]);

  // Memoize the edit button props to prevent unnecessary re-renders
  const editButtonProps = useMemo(() => ({
    onPress: onEditNamePress,
    selected: editNameSelected,
    renderCustomIcon: renderEditIcon,
  }), [onEditNamePress, editNameSelected, renderEditIcon]);

  return (
    <View style={styles.container}>
      <CircleIconButton {...deleteButtonProps} />
      <CircleIconButton {...editButtonProps} />
    </View>
  );
});

FolderDetailsTopBar.displayName = 'FolderDetailsTopBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
  },
}); 