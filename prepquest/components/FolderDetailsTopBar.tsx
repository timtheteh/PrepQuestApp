import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { Entypo , MaterialIcons , Ionicons , FontAwesome5 } from '@expo/vector-icons';
import FolderCardIcon from '@/assets/icons/FolderCardIcon.svg';

interface FolderDetailsTopBarProps {
  onDeletePress?: () => void;
  onEditNamePress?: () => void;
  editNameSelected?: boolean;
}

export function FolderDetailsTopBar({
  onDeletePress,
  onEditNamePress,
  editNameSelected,
}: FolderDetailsTopBarProps) {
  return (
    <View style={styles.container}>
      <CircleIconButton 
        color="#FF3B30"
        onPress={onDeletePress}
        renderCustomIcon={(color) => <Ionicons name="trash" size={24} color={color} />}
      />
      <CircleIconButton 
        onPress={onEditNamePress}
        selected={editNameSelected}
        renderCustomIcon={(color) => <FontAwesome5 name="pen" size={18} color={color} />}
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