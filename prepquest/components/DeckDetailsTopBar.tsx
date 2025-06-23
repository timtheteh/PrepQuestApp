import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { Entypo } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import FolderCardIcon from '@/assets/icons/FolderCardIcon.svg';

interface DeckDetailsTopBarProps {
  onStudyPress?: () => void;
  onQuizPress?: () => void;
  onFolderPress?: () => void;
  onDeletePress?: () => void;
  onEditNamePress?: () => void;
}

export function DeckDetailsTopBar({
  onStudyPress,
  onQuizPress,
  onFolderPress,
  onDeletePress,
  onEditNamePress,
}: DeckDetailsTopBarProps) {
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
        renderCustomIcon={(color) => <FolderCardIcon width={20} height={20} />}
      />
      <CircleIconButton 
        color="#FF3B30"
        onPress={onDeletePress}
        renderCustomIcon={(color) => <Ionicons name="trash" size={20} color={color} />}
      />
      <CircleIconButton 
        onPress={onEditNamePress}
        renderCustomIcon={(color) => <FontAwesome5 name="pen" size={16} color={color} />}
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