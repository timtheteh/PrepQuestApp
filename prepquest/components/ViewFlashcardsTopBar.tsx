import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { Entypo , MaterialIcons , Ionicons } from '@expo/vector-icons';

interface ViewFlashcardsTopBarProps {
  onStudyPress?: () => void;
  onQuizPress?: () => void;
  onGridPress?: () => void;
  onListPress?: () => void;
  viewMode: 'grid' | 'list';
}

export function ViewFlashcardsTopBar({
  onStudyPress,
  onQuizPress,
  onGridPress,
  onListPress,
  viewMode,
}: ViewFlashcardsTopBarProps) {
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
      <TouchableOpacity 
        style={[styles.iconButton, viewMode !== 'grid' && styles.enabledButton]}
        onPress={onGridPress}
        activeOpacity={1}
        disabled={viewMode === 'grid'}
      >
        <Ionicons 
          name="grid-outline" 
          size={24} 
          color={viewMode === 'grid' ? '#D5D4DD' : '#000'} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.iconButton, viewMode !== 'list' && styles.enabledButton]}
        onPress={onListPress}
        activeOpacity={1}
        disabled={viewMode === 'list'}
      >
        <Ionicons 
          name="list" 
          size={28} 
          color={viewMode === 'list' ? '#D5D4DD' : '#000'} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
  },
  enabledButton: {
    opacity: 1,
  },
}); 