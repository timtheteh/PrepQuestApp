import React from 'react';
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

export const DeckDetailsTopBar = ({
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
  return (
    <View style={styles.container}>
      <CircleIconButton 
        onPress={onStudyPress}
        renderCustomIcon={(color) => <Entypo name="open-book" size={20} color={color} />}
      />
      <CircleIconButton 
        onPress={onQuizPress}
        renderCustomIcon={(color) => <MaterialIcons name="quiz" size={20} color={color} />}
      />
      <CircleIconButton 
        onPress={onFolderPress}
        disabled={isFolderDisabled}
        renderCustomIcon={(color) => <Ionicons name="folder" size={20} color={color} />}
      />
      <CircleIconButton 
        color="#FF3B30"
        onPress={onDeletePress}
        disabled={isDeleteDisabled}
        renderCustomIcon={(color) => <Ionicons name="trash" size={20} color={color} />}
      />
      <CircleIconButton 
        onPress={onEditNamePress}
        selected={editNameSelected}
        disabled={isEditNameDisabled}
        renderCustomIcon={(color) => <FontAwesome5 name="pen" size={16} color={color} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
  },
}); 