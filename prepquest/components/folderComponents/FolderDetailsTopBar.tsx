import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from '../general/CircleIconButton';
import { Ionicons , FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

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
  const { theme } = useTheme();
  
  const renderDeleteIcon = (color: string) => (
    <Ionicons name="trash" size={24} color={color} />
  );

  const renderEditIcon = (color: string) => (
    <FontAwesome5 name="pen" size={18} color={color} />
  );

  const deleteButtonProps = {
    color: "#FF3B30",
    onPress: onDeletePress,
    renderCustomIcon: renderDeleteIcon,
  };

  const editButtonProps = {
    color: Colors[theme].normalIconColor,
    onPress: onEditNamePress,
    selected: editNameSelected,
    renderCustomIcon: renderEditIcon,
  };

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